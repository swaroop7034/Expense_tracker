import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export async function getActivityFeed() {
  // Fetch expenses
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select(`
      id,
      title,
      amount,
      expense_date,
      created_at,
      category:categories(name, color, icon_name),
      payer:members!paid_by(name, avatar_url, color)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (expensesError) {
    throw new AppError('DB_QUERY_FAILED', 500, expensesError.message);
  }

  // Fetch settlements
  const { data: settlements, error: settlementsError } = await supabase
    .from('settlements')
    .select(`
      id,
      amount,
      status,
      settled_date,
      created_at,
      from_member:members!from_member(name, avatar_url, color),
      to_member:members!to_member(name, avatar_url, color)
    `)
    .eq('status', 'completed')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (settlementsError) {
    throw new AppError('DB_QUERY_FAILED', 500, settlementsError.message);
  }

  // Transform and merge
  const formattedExpenses = (expenses || []).map(exp => ({
    id: exp.id,
    type: 'expense',
    title: exp.title,
    amount: exp.amount,
    date: exp.expense_date,
    created_at: exp.created_at,
    category: exp.category,
    actor: exp.payer
  }));

  const formattedSettlements = (settlements || []).map(set => ({
    id: set.id,
    type: 'settlement',
    title: 'Settled Up',
    amount: set.amount,
    date: set.settled_date || set.created_at.split('T')[0],
    created_at: set.created_at,
    actor: set.from_member,
    target: set.to_member
  }));

  const combined = [...formattedExpenses, ...formattedSettlements];
  
  // Sort by created_at DESC
  combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Return top 50 (pagination can be added later if needed)
  return combined.slice(0, 50);
}
