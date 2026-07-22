import { useState, type ReactNode } from 'react';
import { VIDEO_WORKFLOW } from '../constants/video-workflow';
import type { Video } from '../types/domain';

type RenderVideo=(video:Video,expanded:boolean,onToggle:()=>void)=>ReactNode;

function VideoSection({title,videos,limit,emptyMessage,expandedVideoId,onToggleVideo,renderVideo}:{title:string;videos:Video[];limit:number;emptyMessage:string;expandedVideoId:string|null;onToggleVideo:(videoId:string)=>void;renderVideo:RenderVideo}) {
  const [showAll,setShowAll]=useState(false);
  const visibleVideos=showAll?videos:videos.slice(0,limit);
  const toggleVisible=()=>{if(showAll&&videos.slice(limit).some(({id})=>id===expandedVideoId))onToggleVideo(expandedVideoId!);setShowAll((value)=>!value);};
  return <section className="grid gap-4" aria-label={title}><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{videos.length} {videos.length===1?'video':'videos'}</p></div>{videos.length>limit&&<button className="btn-text" type="button" onClick={toggleVisible}>{showAll?'Show Less':'Show More'}</button>}</div>{visibleVideos.length?<div className="grid gap-4">{visibleVideos.map((video)=>renderVideo(video,expandedVideoId===video.id,()=>onToggleVideo(video.id)))}</div>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center text-sm text-slate-500">{emptyMessage}</div>}</section>;
}

export function VideoSections({videos,renderVideo}:{videos:Video[];renderVideo:RenderVideo}) {
  const [expandedVideoId,setExpandedVideoId]=useState<string|null>(null);
  const taskCount=VIDEO_WORKFLOW.length;
  const active=videos.filter(({completed_actions})=>completed_actions.length<taskCount);
  const completed=videos.filter(({completed_actions})=>completed_actions.length===taskCount);
  const toggleVideo=(videoId:string)=>setExpandedVideoId((current)=>current===videoId?null:videoId);
  return <div className="grid gap-10"><VideoSection title="Active Videos" videos={active} limit={4} emptyMessage="No active videos right now." expandedVideoId={expandedVideoId} onToggleVideo={toggleVideo} renderVideo={renderVideo}/><VideoSection title="Completed Videos" videos={completed} limit={2} emptyMessage="Completed videos will appear here." expandedVideoId={expandedVideoId} onToggleVideo={toggleVideo} renderVideo={renderVideo}/></div>;
}
