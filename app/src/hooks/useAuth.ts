import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '../services/auth';

export function useAuth() {
  const skipLogin=import.meta.env.DEV&&import.meta.env.VITE_APP_MODE==='development';
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(!skipLogin);
  useEffect(()=>{
    let active=true;
    const unsubscribe=onAuthStateChange((next)=>{if(active){setSession(next);setLoading(false);}});
    if(skipLogin)setLoading(false);
    else getSession().then((next)=>{if(active)setSession(next);}).catch(()=>{if(active)setSession(null);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;unsubscribe();};
  },[skipLogin]);
  return {session,loading,authenticated:skipLogin||Boolean(session),skipLogin};
}
