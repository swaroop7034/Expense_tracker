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
  let participantIds = [];
  
  if (data.split_type === 'exact') {
    participantIds = data.participants.map(p => p.member_id);
  } else {
    participantIds = data.participants || [];
  }

  // Ensure all referenced members (participants + paid_by) exist and are active
  const membersToCheck = [...new Set([...participantIds, data.paid_by])];
  await assertMembersActive(membersToCheck);

  let calculatedShares = [];
  
  if (data.split_type === 'equal') {
    const enrichedParticipants = await getEnrichedParticipants(participantIds);
    calculatedShares = calculateEqualShares(data.amount, enrichedParticipants);
  } else if (data.split_type === 'exact') {
    calculatedShares = data.participants.map(p => ({
      member_id: p.member_id,
      share_amount: (p.amount || 0).toFixed(2)
    }));
  } else {
    throw new AppError('NOT_IMPLEMENTED', 501, 'Only equal and exact splits are supported in MVP');
  }

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
  if (query.amount_min !== undefined) dbQuery = dbQuery.gte('amount', query.amount_min);
  if (query.amount_max !== undefined) dbQuery = dbQuery.lte('amount', query.amount_max);
  if (query.search) dbQuery = dbQuery.ilike('title', `%${query.search}%`);
  
  if (query.member_id) {
     dbQuery = dbQuery.eq('expense_participants.member_id', query.member_id);
  }

  // Sorting
  const ascending = query.sort_order === 'asc';
  dbQuery = dbQuery.order(query.sort_by, { ascending });
  
  if (query.sort_by === 'expense_date') {
    dbQuery = dbQuery.order('created_at', { ascending: false });
  }

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

  // Determine the new or existing split_type
  const splitType = data.split_type || existing.split_type;

  // Determine participantIds for validation
  let participantIds = [];
  if (data.participants) {
    if (splitType === 'exact') {
      participantIds = data.participants.map(p => p.member_id);
    } else {
      participantIds = data.participants;
    }
  } else {
    // If participants not updated, extract from existing
    participantIds = existing.expense_participants.map(p => p.member_id);
  }

  const paid_by_to_check = data.paid_by || existing.paid_by;
  const membersToCheck = [...new Set([...participantIds, paid_by_to_check])];
  await assertMembersActive(membersToCheck);

  const expenseData = { ...data };
  delete expenseData.participants;

  if (Object.keys(expenseData).length > 0) {
    const { error: expErr } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id);
    if (expErr) mapSupabaseError(expErr);
  }

  if (data.participants || data.amount || data.split_type) {
    const amount = data.amount || existing.amount;
    let calculatedShares = [];

    if (splitType === 'equal') {
      const enrichedParticipants = await getEnrichedParticipants(participantIds);
      calculatedShares = calculateEqualShares(amount, enrichedParticipants);
    } else if (splitType === 'exact') {
      // Use the explicitly provided participants if updating them, else reuse existing with validation
      const participantsToUse = data.participants || existing.expense_participants.map(p => ({
        member_id: p.member_id,
        amount: parseFloat(p.share_amount)
      }));
      
      calculatedShares = participantsToUse.map(p => ({
        member_id: p.member_id,
        share_amount: (p.amount || 0).toFixed(2)
      }));
    }

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
