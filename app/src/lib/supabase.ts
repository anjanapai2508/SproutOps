import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let client:SupabaseClient<Database>|undefined;

export function getSupabase():SupabaseClient<Database> {
  if(client)return client;
  const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey=import.meta.env.VITE_SUPABASE_ANON_KEY;
  if(!supabaseUrl||!supabaseAnonKey)throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  client=createClient<Database>(supabaseUrl,supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
