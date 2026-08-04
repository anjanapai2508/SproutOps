import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { getEditingCompletionUpdate } from '../constants/video-workflow';
import type { EditComment, EditingDetails, EditVersion, EditVersionStatus, Profile, Video } from '../types/domain';

export const EDIT_STATUSES:EditVersionStatus[]=['draft','Editing','In-Review','Complete','approved','superseded'];
type Client=ReturnType<typeof getSupabase>;
type Result<T>={data:T|null;error:unknown};
function asError(value:unknown):Error {
  if(value instanceof Error)return value;
  if(value&&typeof value==='object'&&'message' in value&&typeof value.message==='string'){
    const code='code' in value&&typeof value.code==='string'?` (${value.code})`:'';
    return new Error(`${value.message}${code}`);
  }
  return new Error('Could not save editing changes.');
}
function unwrap<T>(result:Result<T>):T|null { if(result.error)throw asError(result.error); return result.data; }
function unique(values:(string|null)[]):string[] { return [...new Set(values.filter((value):value is string=>Boolean(value)))]; }

export function createEditingService(client:Client) {
  async function updateVersion(id:string,payload:Partial<EditVersion>):Promise<EditVersion> {
    return unwrap(await client.from('edit_versions').update(payload).eq('id',id).select('*').single() as unknown as Result<EditVersion>)!;
  }
  return {
    async startEditing(video:Video,userId:string) {
      const latest=unwrap(await client.from('edit_versions').select('version_number').eq('video_id',video.id).order('version_number',{ascending:false}).limit(1).maybeSingle() as unknown as Result<{version_number:number}>)||null;
      const payload={video_id:video.id,version_number:(latest?.version_number||0)+1,status:'Editing' as const,created_by:userId,assigned_editor:userId};
      const activeVersion=unwrap(await client.from('edit_versions').insert(payload).select('*').single() as unknown as Result<EditVersion>)!;
      const savedVideo=unwrap(await client.from('videos').update({next_action_version_id:activeVersion.id}).eq('id',video.id).eq('project_id',video.project_id).select('*').single() as unknown as Result<Video>)!;
      return {video:savedVideo,activeVersion};
    },
    async getEditingDetails(video:Video):Promise<EditingDetails> {
      const versions=unwrap(await client.from('edit_versions').select('*').eq('video_id',video.id).order('version_number',{ascending:false}) as unknown as Result<EditVersion[]>)||[];
      const activeVersion=versions.find(({id})=>id===video.next_action_version_id)||null;
      const comments=activeVersion?unwrap(await client.from('edit_comments').select('*').eq('version_id',activeVersion.id).order('created_at',{ascending:true}) as unknown as Result<EditComment[]>)||[]:[];
      const profileIds=unique(versions.flatMap((version)=>[version.assigned_editor,version.created_by,version.reviewed_by]));
      const profiles=profileIds.length?unwrap(await client.from('profiles').select('id, display_name').in('id',profileIds) as unknown as Result<Profile[]>)||[]:[];
      return {activeVersion,versions,comments,profilesById:Object.fromEntries(profiles.map((profile)=>[profile.id,profile]))};
    },
    async requestChanges(video:Video) { if(!video.next_action_version_id)throw new Error('No active edit version'); return {video,activeVersion:await updateVersion(video.next_action_version_id,{status:'Editing'})}; },
    async approveEdit(video:Video,userId:string) { if(!video.next_action_version_id)throw new Error('No active edit version'); return {video,activeVersion:await updateVersion(video.next_action_version_id,{status:'Complete',reviewed_by:userId,reviewed_at:new Date().toISOString()})}; },
    async updateEditingStatus(video:Video,version:EditVersion,status:EditVersionStatus,userId:string) {
      if(!EDIT_STATUSES.includes(status))throw new Error(`Unsupported edit status: ${status}`);
      const versionPayload:Partial<EditVersion>={status};
      if(status==='In-Review')versionPayload.submitted_for_review_at=version.submitted_for_review_at||new Date().toISOString();
      else if(status==='Complete'){
        versionPayload.reviewed_by=userId;
        versionPayload.reviewed_at=version.reviewed_at||new Date().toISOString();
      }
      const activeVersion=await updateVersion(version.id,versionPayload);
      if(status!=='Complete')return {video,activeVersion};
      const videoPayload=getEditingCompletionUpdate(video);
      const savedVideo=unwrap(await client.from('videos').update(videoPayload).eq('id',video.id).eq('project_id',video.project_id).select('*').single() as unknown as Result<Video>)!;
      return {video:savedVideo,activeVersion};
    },
    async addEditComment(versionId:string,user:User,profile:Pick<Profile,'display_name'>|null,message:string):Promise<EditComment> {
      const trimmed=message.trim(); if(!trimmed)throw new Error('Comment cannot be empty');
      const payload={version_id:versionId,author_id:user.id,author_name_snapshot:profile?.display_name||user.email||'Unknown user',author_role_snapshot:'Team Member',message:trimmed};
      return unwrap(await client.from('edit_comments').insert(payload).select('*').single() as unknown as Result<EditComment>)!;
    }
  };
}

const service=()=>createEditingService(getSupabase());
export const getEditingDetails=(video:Video)=>service().getEditingDetails(video);
export const startEditing=(video:Video,userId:string)=>service().startEditing(video,userId);
export const requestChanges=(video:Video)=>service().requestChanges(video);
export const approveEdit=(video:Video,userId:string)=>service().approveEdit(video,userId);
export const updateEditingStatus=(video:Video,version:EditVersion,status:EditVersionStatus,userId:string)=>service().updateEditingStatus(video,version,status,userId);
export const addEditComment=(versionId:string,user:User,profile:Pick<Profile,'display_name'>|null,message:string)=>service().addEditComment(versionId,user,profile,message);
