import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { mapSupabaseError } from '../utils/helpers.js';

async function assertMembersActive(memberIds) {
  const { data, error } = await supabase
    .from('members')
    .select('id, deleted_at, is_active')
    .in('id', memberIds);

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);

  for (const m of data) {
    if (m.deleted_at || !m.is_active)
      throw new AppError('MEMBER_DELETED', 409,
        `Member ${m.id} has been removed from the group.`);
  }
  // Also catches ghost UUIDs: if data.length !== memberIds.length, a UUID didn't exist at all
  if (data.length !== memberIds.length)
    throw new AppError('MEMBER_NOT_FOUND', 404, 'One or more member IDs do not exist.');
}

async function getEnrichedParticipants(memberIds) {
  const { data, error } = await supabase
    .from('members')
    .select('id, created_at')
    .in('id', memberIds);

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);
  return data.map(m => ({ member_id: m.id, created_at: m.created_at }));
}

function calculateEqualShares(amount, participants) {
  // Work in paise (integer) to avoid floating-point drift
  const totalPaise   = Math.round(amount * 100);
  const n            = participants.length;
  const floorPaise   = Math.floor(totalPaise / n);   // base share
  const remainder    = totalPaise % n;                // leftover paise to distribute

  // Sort by member created_at (oldest member first) so the extra paisa
  // lands predictably on whoever joined the group first — not a random UUID
  const sorted = [...participants].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const sortedIds = sorted.map(p => p.member_id);

  return sortedIds.map((memberId, i) => ({
    member_id:    memberId,
    share_amount: ((floorPaise + (i < remainder ? 1 : 0)) / 100).toFixed(2),
  }));
}

export async function createExpense(data) {
  let participantIds = data.participants || [];
  
  // Implicitly add paid_by to participants if not present
  if (!participantIds.includes(data.paid_by)) {
    participantIds.push(data.paid_by);
  }

  // Ensure all referenced members (participants + paid_by) exist and are active
  await assertMembersActive(participantIds);

  // For MVP, split_type is only 'equal'
  if (data.split_type !== 'equal') {
    throw new AppError('NOT_IMPLEMENTED', 501, 'Only equal split is supported in MVP');
  }

  const enrichedParticipants = await getEnrichedParticipants(participantIds);
  const calculatedShares = calculateEqualShares(data.amount, enrichedParticipants);

  // Prepare expense payload
  const expenseData = {
    title: data.title,
    amount: data.amount,
    category_id: data.category_id,
    split_type: data.split_type,
    paid_by: data.paid_by,
    expense_date: data.expense_date,
    notes: data.notes,
    is_favourite: data.is_favourite,
  };

  // 1. Insert expense
  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .insert(expenseData)
    .select()
    .single();

  if (expErr) mapSupabaseError(expErr);

  // 2. Insert participants
  const rows = calculatedShares.map(p => ({ expense_id: expense.id, ...p }));
  const { error: partErr } = await supabase
    .from('expense_participants')
    .insert(rows);

  if (partErr) {
    // Compensating rollback
    await supabase.from('expenses').delete().eq('id', expense.id);
    mapSupabaseError(partErr);
  }

  // Return complete expense with participants
  return await getExpenseById(expense.id);
}

export async function getExpenses(query) {
  let selectQuery = `
    *,
    category:categories(name, icon_name, color),
    payer:members!paid_by(name, avatar_url, color),
    expense_participants${query.member_id ? '!inner' : ''}(
      member_id,
      share_amount,
      member:members(name, avatar_url, color)
    )
  `;

  let dbQuery = supabase
    .from('expenses')
    .select(selectQuery, { count: 'exact' })
    .is('deleted_at', null);

  // Apply filters
  if (query.category_id) dbQuery = dbQuery.eq('category_id', query.category_id);
  if (query.paid_by) dbQuery = dbQuery.eq('paid_by', query.paid_by);
  if (query.is_favourite !== undefined) dbQuery = dbQuery.eq('is_favourite', query.is_favourite);
  if (query.date_from) dbQuery = dbQuery.gte('expense_date', query.date_from);
  if (query.date_to) dbQuery = dbQuery.lte('expense_date', query.date_to);
  if (query.search) dbQuery = dbQuery.ilike('title', `%${query.search}%`);
  
  if (query.member_id) {
     dbQuery = dbQuery.eq('expense_participants.member_id', query.member_id);
  }

  // Sorting
  const ascending = query.sort_order === 'asc';
  dbQuery = dbQuery.order(query.sort_by, { ascending });

  // Pagination
  const from = (query.page - 1) * query.per_page;
  const to = from + query.per_page - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;
  
  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);

  return { data, count, page: query.page, per_page: query.per_page };
}

export async function getExpenseById(id) {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:categories(name, icon_name, color),
      payer:members!paid_by(name, avatar_url, color),
      expense_participants(
        member_id,
        share_amount,
        member:members(name, avatar_url, color)
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new AppError('EXPENSE_NOT_FOUND', 404, 'Expense not found');
    throw new AppError('DB_QUERY_FAILED', 500, error.message);
  }
  return data;
}

export async function updateExpense(id, data) {
  // Validate expense exists
  const existing = await getExpenseById(id);

  // If participants are being updated, handle atomic deletion/re-insertion
  let participantIds = data.participants || existing.expense_participants.map(p => p.member_id);
  const paid_by = data.paid_by || existing.paid_by;
  const amount = data.amount || existing.amount;
  
  if (data.participants || data.paid_by) {
    if (!participantIds.includes(paid_by)) {
      participantIds.push(paid_by);
    }
  }

  await assertMembersActive(participantIds);

  const expenseData = { ...data };
  delete expenseData.participants;

  if (Object.keys(expenseData).length > 0) {
    const { error: expErr } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id);
    if (expErr) mapSupabaseError(expErr);
  }

  if (data.participants || data.amount) {
    // Recalculate and re-insert
    const enrichedParticipants = await getEnrichedParticipants(participantIds);
    const calculatedShares = calculateEqualShares(amount, enrichedParticipants);

    // Delete existing
    const { error: delErr } = await supabase
      .from('expense_participants')
      .delete()
      .eq('expense_id', id);
    if (delErr) mapSupabaseError(delErr);

    // Insert new
    const rows = calculatedShares.map(p => ({ expense_id: id, ...p }));
    const { error: partErr } = await supabase
      .from('expense_participants')
      .insert(rows);
    if (partErr) mapSupabaseError(partErr);
  }

  return await getExpenseById(id);
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new AppError('DB_UPDATE_FAILED', 500, error.message);
  return true;
}
