import { useCallback, useEffect, useState } from 'react';
import { archiveVideo, createVideo, getProfiles, getVideos, toggleVideoChecklist, updateVideo } from '../services/videos';
import { getChecklistUpdate } from '../constants/video-workflow';
import type { Profile, Video, WorkflowAction } from '../types/domain';

const sort=(items:Video[])=>[...items].sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());

export function useVideos(enabled:boolean) {
  const [videos,setVideos]=useState<Video[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [pending,setPending]=useState<Record<string,boolean>>({});
  const [mutationErrors,setMutationErrors]=useState<Record<string,string>>({});
  const load=useCallback(async()=>{if(!enabled)return;setLoading(true);setError(null);try{const [savedVideos,savedProfiles]=await Promise.all([getVideos(),getProfiles()]);setVideos(sort(savedVideos));setProfiles(savedProfiles);}catch{setError('Could not load videos. Please try again.');}finally{setLoading(false);}},[enabled]);
  useEffect(()=>{if(enabled)void load();else{setVideos([]);setProfiles([]);}},[enabled,load]);
  const replace=(saved:Video)=>setVideos((items)=>sort(items.map((item)=>item.id===saved.id?{...item,...saved}:item)));
  const toggle=async(video:Video,action:WorkflowAction,checked:boolean)=>{
    if(pending[video.id])return;const previous=video;
    setPending((value)=>({...value,[video.id]:true}));setMutationErrors((value)=>({...value,[video.id]:''}));replace({...video,...getChecklistUpdate(video,action,checked)});
    try{replace(await toggleVideoChecklist(video.id,video,action,checked));}
    catch(error){replace(previous);setMutationErrors((value)=>({...value,[video.id]:error instanceof Error?error.message:'Could not save checklist.'}));}
    finally{setPending((value)=>({...value,[video.id]:false}));}
  };
  return {
    videos,profiles,loading,error,pending,mutationErrors,load,toggle,sync:replace,
    create:async(input:{title:string;description:string})=>{const saved=await createVideo(input);setVideos((items)=>sort([...items,saved]));},
    update:async(video:Video,title:string)=>replace(await updateVideo(video.id,{title})),
    assign:async(video:Video,profileId:string)=>{
      if(pending[video.id])return;
      setPending((value)=>({...value,[video.id]:true}));setMutationErrors((value)=>({...value,[video.id]:''}));
      try{replace(await updateVideo(video.id,{next_action_assignee_id:profileId}));}
      catch(error){setMutationErrors((value)=>({...value,[video.id]:error instanceof Error?error.message:'Could not update assignee.'}));}
      finally{setPending((value)=>({...value,[video.id]:false}));}
    },
    archive:async(video:Video)=>{await archiveVideo(video.id);setVideos((items)=>items.filter(({id})=>id!==video.id));}
  };
}
