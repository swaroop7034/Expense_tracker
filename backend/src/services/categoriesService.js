import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new AppError('DB_QUERY_FAILED', 500, error.message);
  return data;
}
