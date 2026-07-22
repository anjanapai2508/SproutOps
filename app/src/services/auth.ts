import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';

type AuthClient=ReturnType<typeof getSupabase>;

export function createAuthService(client:AuthClient) {
  return {
    async getSession():Promise<Session|null> { const {data,error}=await client.auth.getSession(); if(error)throw error; return data?.session??null; },
    async sendLoginLink(email:string):Promise<void> { const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}}); if(error)throw error; },
    async signInWithGoogle(redirectTo:string):Promise<void> { const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}}); if(error)throw error; },
    async signOut():Promise<void> { const {error}=await client.auth.signOut(); if(error)throw error; },
    onAuthStateChange(callback:(session:Session|null)=>void) { const {data}=client.auth.onAuthStateChange((_event,session)=>callback(session)); return ()=>data.subscription.unsubscribe(); }
  };
}

export const getSession=()=>createAuthService(getSupabase()).getSession();
export const sendLoginLink=(email:string)=>createAuthService(getSupabase()).sendLoginLink(email);
export const signInWithGoogle=(redirectTo:string)=>createAuthService(getSupabase()).signInWithGoogle(redirectTo);
export const signOut=()=>createAuthService(getSupabase()).signOut();
export const onAuthStateChange=(callback:(session:Session|null)=>void)=>createAuthService(getSupabase()).onAuthStateChange(callback);
