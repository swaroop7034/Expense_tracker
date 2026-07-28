import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { mapSupabaseError } from '../utils/helpers.js';

export async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);
  return data;
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found');
    throw new AppError('DB_QUERY_FAILED', 500, error.message);
  }
  return data;
}

export async function createMember(memberData) {
  const { data, error } = await supabase
    .from('members')
    .insert(memberData)
    .select()
    .single();

  if (error) mapSupabaseError(error);
  return data;
}

export async function updateMember(id, memberData) {
  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new AppError('MEMBER_NOT_FOUND', 404, 'Member not found');
    mapSupabaseError(error);
  }
  return data;
}

export async function deleteMember(id) {
  const { error } = await supabase
    .from('members')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new AppError('DB_UPDATE_FAILED', 500, error.message);
  return true;
}

import { calculateBalances } from './balanceService.js';
import { calculateSettlements } from './settlementAlgorithm.js';

export async function getMemberDetails(id) {
  // 1. Get member basic info
  const member = await getMemberById(id);

  // 2. Get their current debts (who they owe, who owes them)
  const balances = await calculateBalances();
  const allSuggested = calculateSettlements(balances);
  
  const owes = [];
  const owedBy = [];

  const memberMap = {};
  balances.forEach(b => { memberMap[b.member_id] = b; });

  allSuggested.forEach(settlement => {
    if (settlement.from === id) {
      owes.push({
        to: memberMap[settlement.to],
        amount: settlement.amount
      });
    } else if (settlement.to === id) {
      owedBy.push({
        from: memberMap[settlement.from],
        amount: settlement.amount
      });
    }
  });

  // 3. Get recent settlements involving this member
  const { data: recentSettlements, error: setErr } = await supabase
    .from('settlements')
    .select(`
      id, amount, status, settled_date, created_at,
      from_member:members!from_member(id, name, avatar_url, color),
      to_member:members!to_member(id, name, avatar_url, color)
    `)
    .or(`from_member.eq.${id},to_member.eq.${id}`)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (setErr) throw new AppError('DB_QUERY_FAILED', 500, setErr.message);

  return {
    member,
    netBalance: balances.find(b => b.member_id === id)?.net_balance || 0,
    owes,
    owedBy,
    recentSettlements
  };
}
