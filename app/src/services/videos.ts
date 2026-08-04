import { getSupabase } from '../lib/supabase';
import { getChecklistUpdate } from '../constants/video-workflow';
import type { Profile, Video, WorkflowAction } from '../types/domain';

const UPDATE_FIELDS:(keyof Video)[]=['title','description','current_stage','next_action','next_action_note','next_action_assignee_id','next_action_version_id','published_at','completed_actions'];
type Client=ReturnType<typeof getSupabase>;
type Result<T>={data:T|null;error:unknown};

function unwrap<T>({data,error}:Result<T>):T|null { if(error)throw error; return data; }

export function createVideosService(client:Client) {
  return {
    async getProfiles():Promise<Profile[]> {
      const result=await client.from('profiles').select('id, display_name').order('display_name',{ascending:true});
      return unwrap(result as unknown as Result<Profile[]>)||[];
    },
    async getVideos(projectId:string):Promise<Video[]> {
      const result=await client.from('videos').select('*, edit_versions!edit_versions_video_id_fkey(*, edit_comments(*))').eq('project_id',projectId).is('archived_at',null).order('created_at',{ascending:true});
      return (unwrap(result as unknown as Result<Video[]>)||[]);
    },
    async getVideo(id:string,projectId:string):Promise<Video|null> {
      const result=await client.from('videos').select('*, edit_versions!edit_versions_video_id_fkey(*, edit_comments(*))').eq('id',id).eq('project_id',projectId).maybeSingle();
      return unwrap(result as unknown as Result<Video>);
    },
    async createVideo(input:{title:string;description?:string;projectId:string}):Promise<Video> {
      const payload={title:input.title.trim(),...(input.description?.trim()?{description:input.description.trim()}:{}),project_id:input.projectId,current_stage:'pre_production' as const,next_action:'write_script' as const};
      const result=await client.from('videos').insert(payload).select('*').single();
      return unwrap(result as unknown as Result<Video>)!;
    },
    async updateVideo(id:string,projectId:string,changes:Partial<Video>):Promise<Video> {
      const payload=Object.fromEntries(UPDATE_FIELDS.filter((field)=>changes[field]!==undefined).map((field)=>[field,changes[field]]));
      const result=await client.from('videos').update(payload).eq('id',id).eq('project_id',projectId).select('*').single();
      return unwrap(result as unknown as Result<Video>)!;
    },
    async toggleVideoChecklist(id:string,projectId:string,video:Video,actionKey:WorkflowAction,isCompleted:boolean):Promise<Video> {
      const payload=getChecklistUpdate(video,actionKey,isCompleted);
      const result=await client.from('videos').update(payload).eq('id',id).eq('project_id',projectId).eq('updated_at',video.updated_at).select('*').maybeSingle();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Video workflow changed; refresh and try again');
      return result.data;
    },
    async archiveVideo(id:string,projectId:string):Promise<Video> {
      const result=await client.from('videos').update({archived_at:new Date().toISOString()}).eq('id',id).eq('project_id',projectId).select('*').single();
      return unwrap(result as unknown as Result<Video>)!;
    }
  };
}

const service=()=>createVideosService(getSupabase());
export const getVideos=(projectId:string)=>service().getVideos(projectId);
export const getVideo=(id:string,projectId:string)=>service().getVideo(id,projectId);
export const getProfiles=()=>service().getProfiles();
export const createVideo=(input:{title:string;description?:string;projectId:string})=>service().createVideo(input);
export const updateVideo=(id:string,projectId:string,changes:Partial<Video>)=>service().updateVideo(id,projectId,changes);
export const toggleVideoChecklist=(id:string,projectId:string,video:Video,actionKey:WorkflowAction,isCompleted:boolean)=>service().toggleVideoChecklist(id,projectId,video,actionKey,isCompleted);
export const archiveVideo=(id:string,projectId:string)=>service().archiveVideo(id,projectId);
