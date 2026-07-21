import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Video } from '../types/domain';
import { EditingDetails } from './EditingDetails';

export function EditingSection({video,user,onVideoChange}:{video:Video;user:User|null;onVideoChange?:(video:Video)=>void}) {
  const [expanded,setExpanded]=useState(false);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <button className="flex w-full items-center gap-2 bg-violet-50 px-4 py-3 text-left text-xs font-semibold tracking-[.12em]" type="button" onClick={()=>setExpanded((value)=>!value)} aria-expanded={expanded}>
      <span>✂️ EDITING</span><span className={`ml-auto text-lg text-slate-400 transition ${expanded?'rotate-90':''}`}>›</span>
    </button>
    {expanded&&<div className="p-4"><EditingDetails video={video} user={user} onVideoChange={onVideoChange}/></div>}
  </section>;
}
