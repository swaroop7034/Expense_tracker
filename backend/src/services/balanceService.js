import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export async function calculateBalances() {
  // 1. Fetch all active members
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('id, name, avatar_url, color')
    .is('deleted_at', null);

  if (memErr) throw new AppError('DB_QUERY_FAILED', 500, memErr.message);

  // Initialize balances map
  const balances = {};
  for (const m of members) {
    balances[m.id] = {
      member_id: m.id,
      name: m.name,
      avatar_url: m.avatar_url,
      color: m.color,
      paid: 0,
      owes: 0,
      settled_paid: 0,
      settled_received: 0,
      net_balance: 0, // > 0 means owed money, < 0 means owes money
    };
  }

  // 2. Fetch all active expenses and their participants
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select(`
      id,
      amount,
      paid_by,
      expense_participants(member_id, share_amount)
    `)
    .is('deleted_at', null);

  if (expErr) throw new AppError('DB_QUERY_FAILED', 500, expErr.message);

  for (const exp of expenses) {
    // Process paid amount
    if (balances[exp.paid_by]) {
      balances[exp.paid_by].paid += parseFloat(exp.amount);
    }
    
    // Process owed amounts
    for (const p of exp.expense_participants) {
      if (balances[p.member_id]) {
         balances[p.member_id].owes += parseFloat(p.share_amount);
      }
    }
  }

  // 3. Fetch all completed settlements
  const { data: settlements, error: setErr } = await supabase
    .from('settlements')
    .select('from_member, to_member, amount')
    .is('deleted_at', null)
    .eq('status', 'completed');

  if (setErr) throw new AppError('DB_QUERY_FAILED', 500, setErr.message);

  for (const s of settlements) {
    const amount = parseFloat(s.amount);
    if (balances[s.from_member]) {
      balances[s.from_member].settled_paid += amount;
    }
    if (balances[s.to_member]) {
      balances[s.to_member].settled_received += amount;
    }
  }

  // 4. Calculate net balance for each member
  const result = Object.values(balances).map(b => {
    // net_balance = (paid - owes) + settled_paid - settled_received
    // Avoid floating point precision issues by calculating in paise
    const net = Math.round(b.paid * 100) - Math.round(b.owes * 100) 
              + Math.round(b.settled_paid * 100) - Math.round(b.settled_received * 100);
    
    return {
      ...b,
      net_balance: parseFloat((net / 100).toFixed(2))
    };
  });

  return result;
}
