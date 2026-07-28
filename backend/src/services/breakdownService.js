import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { calculateBalances } from './balanceService.js';
import { calculateSettlements } from './settlementAlgorithm.js';

export async function getSimplificationBreakdown() {
  // 1. Fetch all members for lookup
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('id, name, avatar_url, color');
    
  if (memErr) throw new AppError('DB_QUERY_FAILED', 500, memErr.message);
  
  const memberMap = {};
  for (const m of members) {
    memberMap[m.id] = m;
  }

  // 2. Fetch all expenses with participants
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select(`
      id, title, amount, paid_by,
      expense_participants(member_id, share_amount)
    `)
    .is('deleted_at', null);

  if (expErr) throw new AppError('DB_QUERY_FAILED', 500, expErr.message);

  // 3. Fetch completed settlements
  const { data: settlements, error: setErr } = await supabase
    .from('settlements')
    .select('from_member, to_member, amount')
    .eq('status', 'completed')
    .is('deleted_at', null);

  if (setErr) throw new AppError('DB_QUERY_FAILED', 500, setErr.message);

  // 4. Calculate raw pairwise debts
  // A map of fromMemberId -> { toMemberId: amount_in_paise }
  const rawPairs = {};

  const addDebt = (fromId, toId, amount) => {
    if (fromId === toId) return; // You don't owe yourself
    if (!rawPairs[fromId]) rawPairs[fromId] = {};
    if (!rawPairs[fromId][toId]) rawPairs[fromId][toId] = 0;
    rawPairs[fromId][toId] += Math.round(amount * 100);
  };

  // Process expenses: participant owes payer
  for (const exp of expenses) {
    const payerId = exp.paid_by;
    for (const p of exp.expense_participants) {
      if (p.member_id !== payerId) {
        addDebt(p.member_id, payerId, parseFloat(p.share_amount));
      }
    }
  }

  // Process settlements: from_member reduces debt to to_member
  for (const s of settlements) {
    const fromId = s.from_member;
    const toId = s.to_member;
    const amount = parseFloat(s.amount);
    
    // Instead of reducing, a settlement is basically "fromId paid toId".
    // So toId owes fromId technically, or we reduce fromId owes toId.
    // Let's subtract from the debt fromId owes toId.
    if (!rawPairs[fromId]) rawPairs[fromId] = {};
    if (!rawPairs[fromId][toId]) rawPairs[fromId][toId] = 0;
    
    rawPairs[fromId][toId] -= Math.round(amount * 100);
  }

  // Flatten raw debts and format them
  const rawDebts = [];
  for (const fromId in rawPairs) {
    for (const toId in rawPairs[fromId]) {
      const netAmountPaise = rawPairs[fromId][toId] - (rawPairs[toId]?.[fromId] || 0);
      // Only record positive net debt from A to B to avoid duplicates
      if (netAmountPaise > 0) {
        rawDebts.push({
          from: memberMap[fromId],
          to: memberMap[toId],
          amount: parseFloat((netAmountPaise / 100).toFixed(2))
        });
      }
    }
  }

  // 5. Get Net Balances (using existing service)
  const netBalances = await calculateBalances();

  // 6. Get Simplified Debts
  const simplifiedDebts = calculateSettlements(netBalances).map(d => ({
    from: memberMap[d.from],
    to: memberMap[d.to],
    amount: d.amount
  }));

  return {
    rawDebts,
    netBalances: netBalances.filter(b => b.net_balance !== 0), // Only show people with non-zero net
    simplifiedDebts
  };
}
