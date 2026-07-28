import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { mapSupabaseError } from '../utils/helpers.js';
import { calculateBalances } from './balanceService.js';
import { calculateSettlements } from './settlementAlgorithm.js';

async function assertMembersActive(memberIds) {
  const { data, error } = await supabase
    .from('members')
    .select('id, deleted_at, is_active')
    .in('id', memberIds);

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);

  for (const m of data) {
    if (m.deleted_at || !m.is_active)
      throw new AppError('MEMBER_DELETED', 409, `Member ${m.id} has been removed from the group.`);
  }
  if (data.length !== memberIds.length)
    throw new AppError('MEMBER_NOT_FOUND', 404, 'One or more member IDs do not exist.');
}

export async function getSettlements() {
  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      from:members!from_member(name, avatar_url, color),
      to:members!to_member(name, avatar_url, color)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);
  return data;
}

export async function getSuggestedSettlements() {
  const balances = await calculateBalances();
  return calculateSettlements(balances);
}

export async function createSettlement(data) {
  await assertMembersActive([data.from_member, data.to_member]);

  const { data: settlement, error } = await supabase
    .from('settlements')
    .insert(data)
    .select()
    .single();

  if (error) mapSupabaseError(error);
  return settlement;
}

export async function updateSettlement(id, data) {
  const { data: settlement, error } = await supabase
    .from('settlements')
    .update(data)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new AppError('SETTLEMENT_NOT_FOUND', 404, 'Settlement not found');
    mapSupabaseError(error);
  }
  return settlement;
}

export async function deleteSettlement(id) {
  const { error } = await supabase
    .from('settlements')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new AppError('DB_UPDATE_FAILED', 500, error.message);
  return true;
}
