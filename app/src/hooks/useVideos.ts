import { useCallback, useEffect, useRef, useState } from 'react';
import { archiveVideo, createVideo, getProfiles, getVideo, getVideos, toggleVideoChecklist, updateVideo } from '../services/videos';
import { getChecklistUpdate } from '../constants/video-workflow';
import type { Profile, Video, WorkflowAction } from '../types/domain';

export const sortVideos=(items:Video[])=>[...items].sort((a,b)=>
  b.completed_actions.length-a.completed_actions.length||new Date(a.created_at).getTime()-new Date(b.created_at).getTime()
);

export function useVideos(enabled:boolean,activeProjectId:string|null,allowedProjectIds:string[]) {
  const [videos,setVideos]=useState<Video[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [pending,setPending]=useState<Record<string,boolean>>({});
  const [mutationErrors,setMutationErrors]=useState<Record<string,string>>({});
  const requestId=useRef(0);
  const load=useCallback(async()=>{
    const request=++requestId.current;
    if(!enabled||!activeProjectId){setVideos([]);setProfiles([]);setLoading(false);setError(null);return;}
    setVideos([]);setLoading(true);setError(null);
    try{
      const [savedVideos,savedProfiles]=await Promise.all([getVideos(activeProjectId),getProfiles()]);
      if(request!==requestId.current)return;
      setVideos(sortVideos(savedVideos.filter(({project_id})=>project_id===activeProjectId)));
      setProfiles(savedProfiles);
    }catch{
      if(request===requestId.current)setError('Could not load videos. Please try again.');
    }finally{
      if(request===requestId.current)setLoading(false);
    }
  },[enabled,activeProjectId]);
  useEffect(()=>{void load();return()=>{requestId.current++;};},[load]);
  const replace=(saved:Video)=>{
    if(saved.project_id!==activeProjectId)return;
    setVideos((items)=>sortVideos(items.some(({id})=>id===saved.id)?items.map((item)=>item.id===saved.id?{...item,...saved}:item):[...items,saved]));
  };
  const toggle=async(video:Video,action:WorkflowAction,checked:boolean)=>{
    if(pending[video.id]||!activeProjectId||video.project_id!==activeProjectId)return;const previous=video;
    setPending((value)=>({...value,[video.id]:true}));setMutationErrors((value)=>({...value,[video.id]:''}));replace({...video,...getChecklistUpdate(video,action,checked)});
    try{replace(await toggleVideoChecklist(video.id,activeProjectId,video,action,checked));}
    catch(error){replace(previous);setMutationErrors((value)=>({...value,[video.id]:error instanceof Error?error.message:'Could not save checklist.'}));}
    finally{setPending((value)=>({...value,[video.id]:false}));}
  };
  return {
    videos,profiles,loading,error,pending,mutationErrors,load,toggle,sync:replace,
    open:async(videoId:string)=>{
      if(!activeProjectId)return;
      const saved=await getVideo(videoId,activeProjectId);
      if(saved)replace(saved);
      else setVideos((items)=>items.filter(({id})=>id!==videoId));
    },
    create:async(input:{title:string;description:string;projectId:string})=>{
      if(!allowedProjectIds.includes(input.projectId))throw new Error('Select a project you belong to.');
      const saved=await createVideo(input);
      if(saved.project_id===activeProjectId)setVideos((items)=>sortVideos([...items,saved]));
    },
    update:async(video:Video,title:string)=>{
      if(!activeProjectId||video.project_id!==activeProjectId)throw new Error('Video is not in the active project.');
      replace(await updateVideo(video.id,activeProjectId,{title}));
    },
    assign:async(video:Video,profileId:string)=>{
      if(pending[video.id]||!activeProjectId||video.project_id!==activeProjectId)return;
      setPending((value)=>({...value,[video.id]:true}));setMutationErrors((value)=>({...value,[video.id]:''}));
      try{replace(await updateVideo(video.id,activeProjectId,{next_action_assignee_id:profileId}));}
      catch(error){setMutationErrors((value)=>({...value,[video.id]:error instanceof Error?error.message:'Could not update assignee.'}));}
      finally{setPending((value)=>({...value,[video.id]:false}));}
    },
    archive:async(video:Video)=>{
      if(!activeProjectId||video.project_id!==activeProjectId)return;
      await archiveVideo(video.id,activeProjectId);
      setVideos((items)=>items.filter(({id})=>id!==video.id));
    }
  };
}
