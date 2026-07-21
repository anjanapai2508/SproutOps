import type { Session } from '@supabase/supabase-js';
import logoUrl from '../../assets/logo_new.png';

export function AppHeader({session,onNewVideo,onSignOut}:{session:Session|null;onNewVideo:()=>void;onSignOut:()=>void}) {
  return <header className="sticky top-0 z-20 mb-6 flex items-center gap-4 border-b border-slate-200/70 bg-[#fafaf8]/90 py-3 backdrop-blur-xl">
    <div className="flex min-w-0 items-center gap-3"><img className="h-11 w-11 object-contain max-sm:h-10 max-sm:w-10" src={logoUrl} alt="Giggle Sprouts logo"/><div><div className="text-2xl font-bold tracking-tight max-sm:text-xl">SproutOps</div><div className="text-sm text-slate-500 max-sm:hidden">Production operating system</div></div></div>
    <div className="ml-auto flex items-center gap-2"><button className="header-new-video-btn btn-soft max-sm:hidden" onClick={onNewVideo}>+ New Video</button><span className="max-w-52 truncate text-xs text-slate-500 max-sm:hidden">{session?.user.email||''}</span><button className="btn-secondary px-3 py-2 text-xs" onClick={onSignOut}>Sign out</button></div>
  </header>;
}
