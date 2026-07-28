import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Initialize the Supabase client with the service_role key to bypass RLS for server-side logic
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
