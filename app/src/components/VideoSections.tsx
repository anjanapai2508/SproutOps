import { useEffect, useState, type ReactNode } from 'react';
import { VIDEO_WORKFLOW } from '../constants/video-workflow';
import type { Profile, Video } from '../types/domain';

type RenderVideo=(video:Video,expanded:boolean,onToggle:()=>void)=>ReactNode;
type AssigneeFilter='all'|'unassigned'|string;

const filterKey=(userId:string)=>`sproutops:assignee-filter:${userId}`;
const initialFilter=(profiles:Profile[],userId:string):AssigneeFilter=>{
  if(!userId||typeof localStorage==='undefined'||typeof localStorage.getItem!=='function')return'all';
  try{
    const saved=localStorage.getItem(filterKey(userId));
    return saved==='unassigned'||profiles.some(({id})=>id===saved)?saved||'all':'all';
  }catch{return'all';}
};

function VideoSection({title,videos,limit,emptyMessage,headerActions,expandedVideoId,onToggleVideo,renderVideo}:{title:string;videos:Video[];limit:number;emptyMessage:string;headerActions?:ReactNode;expandedVideoId:string|null;onToggleVideo:(videoId:string)=>void;renderVideo:RenderVideo}) {
  const [showAll,setShowAll]=useState(false);
  const visibleVideos=showAll?videos:videos.slice(0,limit);
  const toggleVisible=()=>{if(showAll&&videos.slice(limit).some(({id})=>id===expandedVideoId))onToggleVideo(expandedVideoId!);setShowAll((value)=>!value);};
  return <section className="grid gap-4" aria-label={title}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{videos.length} {videos.length===1?'video':'videos'}</p></div>{(headerActions||videos.length>limit)&&<div className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-start">{headerActions}{videos.length>limit&&<button className="btn-text" type="button" onClick={toggleVisible}>{showAll?'Show Less':'Show More'}</button>}</div>}</div>{visibleVideos.length?<div className="grid gap-4">{visibleVideos.map((video)=>renderVideo(video,expandedVideoId===video.id,()=>onToggleVideo(video.id)))}</div>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center text-sm text-slate-500">{emptyMessage}</div>}</section>;
}

export function VideoSections({videos,profiles=[],userId='',renderVideo}:{videos:Video[];profiles?:Profile[];userId?:string;renderVideo:RenderVideo}) {
  const [expandedVideoId,setExpandedVideoId]=useState<string|null>(null);
  const [assigneeFilter,setAssigneeFilter]=useState<AssigneeFilter>(()=>initialFilter(profiles,userId));
  useEffect(()=>{
    if(assigneeFilter!=='all'&&assigneeFilter!=='unassigned'&&!profiles.some(({id})=>id===assigneeFilter))setAssigneeFilter('all');
  },[assigneeFilter,profiles]);
  useEffect(()=>{
    if(!userId||typeof localStorage==='undefined'||typeof localStorage.setItem!=='function')return;
    try{localStorage.setItem(filterKey(userId),assigneeFilter);}catch{}
  },[assigneeFilter,userId]);
  const taskCount=VIDEO_WORKFLOW.length;
  const filtered=assigneeFilter==='all'?videos:assigneeFilter==='unassigned'?videos.filter(({next_action_assignee_id})=>!next_action_assignee_id):videos.filter(({next_action_assignee_id})=>next_action_assignee_id===assigneeFilter);
  const active=filtered.filter(({completed_actions})=>completed_actions.length<taskCount);
  const completed=videos.filter(({completed_actions})=>completed_actions.length===taskCount);
  const toggleVideo=(videoId:string)=>setExpandedVideoId((current)=>current===videoId?null:videoId);
  const filteredEmpty=assigneeFilter!=='all';
  const changeAssigneeFilter=(value:AssigneeFilter)=>{
    setAssigneeFilter(value);
    if(videos.some(({id,completed_actions})=>id===expandedVideoId&&completed_actions.length<taskCount))setExpandedVideoId(null);
  };
  const filterControl=<label className="flex items-center gap-2 text-xs font-medium text-slate-500"><span>Assignee</span><select className="input min-h-9 w-48 py-1" value={assigneeFilter} onChange={(event)=>changeAssigneeFilter(event.target.value)}><option value="all">All assignees</option><option value="unassigned">Unassigned</option>{profiles.map((profile)=><option key={profile.id} value={profile.id}>{profile.display_name||'Unnamed user'}</option>)}</select></label>;
  return <div className="grid gap-10"><VideoSection key={`active-${assigneeFilter}`} title="Active Videos" videos={active} limit={4} emptyMessage={filteredEmpty?'No active videos match this filter.':'No active videos right now.'} headerActions={filterControl} expandedVideoId={expandedVideoId} onToggleVideo={toggleVideo} renderVideo={renderVideo}/><VideoSection title="Completed Videos" videos={completed} limit={2} emptyMessage="Completed videos will appear here." expandedVideoId={expandedVideoId} onToggleVideo={toggleVideo} renderVideo={renderVideo}/></div>;
}
