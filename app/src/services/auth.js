import { getSupabase } from '../lib/supabase.js';

export function createAuthService(client) {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data?.session ?? null;
    }
  };
}

export const getSession = () => createAuthService(getSupabase()).getSession();
