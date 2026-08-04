import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import logoUrl from '../../assets/logo_new.png';
import type { Project } from '../types/domain';

export function AppHeader({session,projects,activeProjectId,canCreate,onProjectChange,onNewVideo,onSignOut}:{session:Session|null;projects:Project[];activeProjectId:string|null;canCreate:boolean;onProjectChange:(projectId:string)=>void;onNewVideo:()=>void;onSignOut:()=>void}) {
  const [profileOpen,setProfileOpen]=useState(false);
  const menuRef=useRef<HTMLDivElement>(null);
  const activeProject=projects.find(({id})=>id===activeProjectId)||null;
  useEffect(()=>{
    if(!profileOpen)return;
    const close=(event:MouseEvent)=>{if(!menuRef.current?.contains(event.target as Node))setProfileOpen(false);};
    document.addEventListener('mousedown',close);
    return()=>document.removeEventListener('mousedown',close);
  },[profileOpen]);
  return <header className="sticky top-0 z-20 mb-6 flex items-center gap-4 border-b border-slate-200/70 bg-[#fafaf8]/90 py-3 backdrop-blur-xl">
    <div className="flex min-w-0 items-center gap-3"><img className="h-11 w-11 object-contain max-sm:h-10 max-sm:w-10" src={logoUrl} alt="Giggle Sprouts logo"/><div><div className="text-2xl font-bold tracking-tight max-sm:text-xl">SproutOps</div><div className="text-sm text-slate-500 max-sm:hidden">Production operating system</div></div></div>
    <div className="ml-auto flex items-center gap-2"><button className="header-new-video-btn btn-soft max-sm:hidden" disabled={!canCreate} onClick={onNewVideo}>+ New Video</button><div className="relative" ref={menuRef}><button className="btn-secondary flex items-center gap-2 px-3 py-2 text-xs" type="button" aria-label="Profile menu" aria-expanded={profileOpen} onClick={()=>setProfileOpen((value)=>!value)}><span className="grid size-6 place-items-center rounded-full bg-cyan-100 font-semibold text-cyan-800" aria-hidden="true">{(session?.user.email||'?').slice(0,1).toUpperCase()}</span><span className="max-w-32 truncate max-sm:hidden">{session?.user.email||'Profile'}</span><span aria-hidden="true">⌄</span></button>{profileOpen&&<div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10"><div className="truncate px-2 pb-3 text-xs text-slate-500">{session?.user.email||''}</div>{projects.length>1?<label className="grid gap-1 border-t border-slate-100 px-2 py-3 text-xs font-medium text-slate-500">Project<select className="input min-h-10 py-1" value={activeProjectId||''} onChange={(event)=>{onProjectChange(event.target.value);setProfileOpen(false);}}>{projects.map((project)=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label>:activeProject&&<div className="border-t border-slate-100 px-2 py-3"><div className="eyebrow">Project</div><div className="mt-1 truncate text-sm font-semibold text-slate-800">{activeProject.name}</div></div>}<button className="btn-text w-full justify-start border-t border-slate-100 px-2 pt-3 text-left" type="button" onClick={onSignOut}>Sign out</button></div>}</div></div>
  </header>;
}
