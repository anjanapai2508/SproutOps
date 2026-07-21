import { useState } from 'react';
import { deriveWorkflowItems } from '../constants/video-workflow';
import type { Video, VideoStage, WorkflowAction } from '../types/domain';

type WorkflowStage=Exclude<VideoStage,'completed'|'on_hold'>;
const styles:Record<WorkflowStage,string>={pre_production:'bg-sky-50',production:'bg-emerald-50',editing:'bg-violet-50',publishing:'bg-orange-50'};
export function WorkflowSection({video,stage,title,icon,pending,error,onToggle,children}:{video:Video;stage:WorkflowStage;title:string;icon:string;pending:boolean;error?:string;onToggle:(action:WorkflowAction,checked:boolean)=>void;children?:React.ReactNode}) {
  const [expanded,setExpanded]=useState(false);const items=deriveWorkflowItems(video).filter((item)=>item.stage===stage);
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><button className={`flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold tracking-[.12em] ${styles[stage]}`} type="button" onClick={()=>setExpanded((value)=>!value)} aria-expanded={expanded}><span>{icon} {title}</span><span className={`ml-auto text-lg text-slate-400 transition ${expanded?'rotate-90':''}`}>›</span></button>{expanded&&<div className="px-4 py-2">{items.map((item)=><label key={item.key} className={`flex min-h-12 cursor-pointer items-center gap-3 border-b border-slate-100 last:border-0 ${item.completed?'text-slate-500':''}`}><input className="h-5 w-5 cursor-pointer accent-cyan-600 disabled:cursor-wait disabled:opacity-50" type="checkbox" checked={item.completed} disabled={pending} onChange={(event)=>onToggle(item.key,event.target.checked)}/><span className={`text-sm font-medium ${item.completed?'line-through':''}`}>{item.label}</span>{item.current&&<span className="ml-auto text-[11px] font-medium text-cyan-700">Up next</span>}</label>)}{error&&<div className="pb-2 pl-8 text-xs text-red-700" role="status">{error}</div>}{children}</div>}</section>;
}
