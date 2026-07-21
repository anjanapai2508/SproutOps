import { useCallback, useEffect, useState } from 'react';
import { archiveVideo, createVideo, getVideos, toggleVideoChecklist, updateVideo } from '../services/videos';
import { getChecklistUpdate } from '../constants/video-workflow';
import type { Video, WorkflowAction } from '../types/domain';

const sort=(items:Video[])=>[...items].sort((a,b)=>a.sequence_number-b.sequence_number);

export function useVideos(enabled:boolean) {
  const [videos,setVideos]=useState<Video[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [pending,setPending]=useState<Record<string,boolean>>({});
  const [mutationErrors,setMutationErrors]=useState<Record<string,string>>({});
  const load=useCallback(async()=>{if(!enabled)return;setLoading(true);setError(null);try{setVideos(sort(await getVideos()));}catch{setError('Could not load videos. Please try again.');}finally{setLoading(false);}},[enabled]);
  useEffect(()=>{if(enabled)void load();else setVideos([]);},[enabled,load]);
  const replace=(saved:Video)=>setVideos((items)=>sort(items.map((item)=>item.id===saved.id?{...item,...saved}:item)));
  const toggle=async(video:Video,action:WorkflowAction,checked:boolean)=>{
    if(pending[video.id])return;const previous=video;
    setPending((value)=>({...value,[video.id]:true}));setMutationErrors((value)=>({...value,[video.id]:''}));replace({...video,...getChecklistUpdate(video,action,checked)});
    try{replace(await toggleVideoChecklist(video.id,video,action,checked));}
    catch(error){replace(previous);setMutationErrors((value)=>({...value,[video.id]:error instanceof Error?error.message:'Could not save checklist.'}));}
    finally{setPending((value)=>({...value,[video.id]:false}));}
  };
  return {
    videos,loading,error,pending,mutationErrors,load,toggle,
    create:async(input:{title:string;description:string})=>{const saved=await createVideo(input);setVideos((items)=>sort([...items,saved]));},
    update:async(video:Video,title:string)=>replace(await updateVideo(video.id,{title})),
    archive:async(video:Video)=>{await archiveVideo(video.id);setVideos((items)=>items.filter(({id})=>id!==video.id));}
  };
}
