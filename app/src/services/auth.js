import { getSupabase } from '../lib/supabase.js';

export function createAuthService(client) {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data?.session ?? null;
    },

    async sendLoginLink(email) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    onAuthStateChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => callback(session));
      return () => data.subscription.unsubscribe();
    }
  };
}

export const getSession = () => createAuthService(getSupabase()).getSession();
export const sendLoginLink = (email) => createAuthService(getSupabase()).sendLoginLink(email);
export const signOut = () => createAuthService(getSupabase()).signOut();
export const onAuthStateChange = (callback) => createAuthService(getSupabase()).onAuthStateChange(callback);
