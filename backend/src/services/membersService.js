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
