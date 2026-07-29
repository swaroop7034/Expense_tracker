import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export const getCategoryAnalytics = async () => {
  try {
    const { data, error } = await supabase.rpc('get_category_analytics');

    if (error) {
      console.error('Error fetching category analytics from Supabase RPC:', error);
      throw new AppError(500, 'Failed to fetch analytics data');
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Error in getCategoryAnalytics service:', error);
    throw new AppError(500, 'Internal server error while fetching analytics');
  }
};
