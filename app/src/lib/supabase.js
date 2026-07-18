import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  if (client) return client;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
