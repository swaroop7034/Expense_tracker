import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import * as balanceService from './balanceService.js';

export async function getDashboardData() {
  // 1. Fetch member balances (this already optimizes fetching members, expenses, settlements concurrently internally)
  // But wait, the balances calculate the `net_balance` and `paid` amounts per member.
  const balances = await balanceService.calculateBalances();

  // 2. Fetch the highly optimized analytics directly from PostgreSQL
  const { data: analyticsData, error } = await supabase.rpc('get_dashboard_analytics');

  if (error) {
    // If the RPC fails (e.g. they haven't run the SQL script yet), fallback gracefully
    console.error('Failed to execute get_dashboard_analytics RPC:', error);
  }

  const analytics = analyticsData || {
    total_expenses: 0,
    this_month_expenses: 0,
    average_expense: 0,
    largest_expense: 0,
    most_frequent_category_id: null,
    most_active_member_id: null
  };

  // 3. Find highest spender from the balances array we already have in memory
  let highestSpender = null;
  if (balances && balances.length > 0) {
    const membersWithPaid = balances.filter(b => b.paid > 0);
    if (membersWithPaid.length > 0) {
      highestSpender = membersWithPaid.reduce((prev, current) => {
        return (prev.paid > current.paid) ? prev : current;
      });
    }
  }

  // Inject enriched data into analytics
  analytics.highest_spender = highestSpender ? highestSpender.name : null;
  
  // Find active member name
  const activeMember = balances.find(b => b.member_id === analytics.most_active_member_id);
  analytics.most_active_member = activeMember ? activeMember.name : null;

  // Fetch category name
  analytics.most_frequent_category = null;
  if (analytics.most_frequent_category_id) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('name')
      .eq('id', analytics.most_frequent_category_id)
      .single();
    if (categoryData) {
      analytics.most_frequent_category = categoryData.name;
    }
  }

  return {
    analytics,
    balances
  };
}
