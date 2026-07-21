import { getSupabase } from '../lib/supabase.js';

export const EDIT_STATUSES=['draft','Editing','In-Review','Complete','approved','superseded'];

function unwrap(result) {
  if(result.error)throw result.error;
  return result.data;
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }

export function createEditingService(client) {
  async function updateVersion(id,payload) {
    return unwrap(await client.from('edit_versions').update(payload).eq('id',id).select('*').single());
  }
  async function updateVideo(id,payload) {
    return unwrap(await client.from('videos').update(payload).eq('id',id).select('*').single());
  }
  async function nextVersionNumber(videoId) {
    const row=unwrap(await client.from('edit_versions').select('version_number').eq('video_id',videoId)
      .order('version_number',{ascending:false}).limit(1).maybeSingle());
    return (row?.version_number||0)+1;
  }

  return {
    async getEditingDetails(video) {
      const versions=unwrap(await client.from('edit_versions').select('*').eq('video_id',video.id)
        .order('version_number',{ascending:false}))||[];
      const activeVersion=versions.find(({id})=>id===video.next_action_version_id)||null;
      const comments=activeVersion
        ? unwrap(await client.from('edit_comments').select('*').eq('version_id',activeVersion.id).order('created_at',{ascending:true}))||[]
        : [];
      const profileIds=unique(versions.flatMap((version)=>[version.assigned_editor,version.created_by,version.reviewed_by]));
      const profiles=profileIds.length
        ? unwrap(await client.from('profiles').select('id, display_name').in('id',profileIds))||[]
        : [];
      return {activeVersion,versions,comments,profilesById:Object.fromEntries(profiles.map((profile)=>[profile.id,profile]))};
    },

    async startEditing(video,userId) {
      if(video.next_action_version_id) {
        const saved=await updateVideo(video.id,{current_stage:'editing',next_action:'continue_editing'});
        return {video:saved,activeVersion:null};
      }
      const payload={video_id:video.id,version_number:await nextVersionNumber(video.id),status:'Editing',created_by:userId,assigned_editor:video.next_action_assignee_id||userId};
      const activeVersion=unwrap(await client.from('edit_versions').insert(payload).select('*').single());
      const saved=await updateVideo(video.id,{current_stage:'editing',next_action:'continue_editing',next_action_version_id:activeVersion.id});
      return {video:saved,activeVersion};
    },

    async submitForReview(video) {
      if(!video.next_action_version_id)throw new Error('No active edit version');
      const activeVersion=await updateVersion(video.next_action_version_id,{status:'In-Review',submitted_for_review_at:new Date().toISOString()});
      const saved=await updateVideo(video.id,{current_stage:'editing',next_action:'review_edit'});
      return {video:saved,activeVersion};
    },

    async requestChanges(video) {
      if(!video.next_action_version_id)throw new Error('No active edit version');
      const activeVersion=await updateVersion(video.next_action_version_id,{status:'Editing'});
      const saved=await updateVideo(video.id,{current_stage:'editing',next_action:'make_edit_changes'});
      return {video:saved,activeVersion};
    },

    async approveEdit(video,userId) {
      if(!video.next_action_version_id)throw new Error('No active edit version');
      const activeVersion=await updateVersion(video.next_action_version_id,{status:'Complete',reviewed_by:userId,reviewed_at:new Date().toISOString()});
      const saved=await updateVideo(video.id,{current_stage:'publishing',next_action:'create_thumbnail'});
      return {video:saved,activeVersion};
    },

    async createRevision(video,userId) {
      if(!video.next_action_version_id)throw new Error('No active edit version');
      const previous=await updateVersion(video.next_action_version_id,{status:'superseded'});
      const payload={video_id:video.id,version_number:await nextVersionNumber(video.id),status:'Editing',created_by:userId,assigned_editor:previous.assigned_editor||video.next_action_assignee_id||userId};
      const activeVersion=unwrap(await client.from('edit_versions').insert(payload).select('*').single());
      const saved=await updateVideo(video.id,{current_stage:'editing',next_action:'continue_editing',next_action_version_id:activeVersion.id});
      return {video:saved,activeVersion};
    },

    async updateEditingStatus(video,version,status,userId) {
      if(!EDIT_STATUSES.includes(status))throw new Error(`Unsupported edit status: ${status}`);
      const versionPayload={status};
      let videoPayload;
      if(status==='In-Review') {
        versionPayload.submitted_for_review_at=version.submitted_for_review_at||new Date().toISOString();
        videoPayload={current_stage:'editing',next_action:'review_edit'};
      } else if(status==='Complete'||status==='approved') {
        versionPayload.reviewed_by=userId;
        versionPayload.reviewed_at=version.reviewed_at||new Date().toISOString();
        videoPayload={current_stage:'publishing',next_action:'create_thumbnail'};
      } else if(status==='Editing') {
        videoPayload={current_stage:'editing',next_action:video.next_action==='make_edit_changes'?'make_edit_changes':'continue_editing'};
      }
      const activeVersion=await updateVersion(version.id,versionPayload);
      const saved=videoPayload?await updateVideo(video.id,videoPayload):video;
      return {video:saved,activeVersion};
    },

    async addEditComment(versionId,user,profile,message) {
      const trimmed=message.trim();
      if(!trimmed)throw new Error('Comment cannot be empty');
      const payload={version_id:versionId,author_id:user.id,author_name_snapshot:profile?.display_name||user.email||'Unknown user',author_role_snapshot:'Team Member',message:trimmed};
      return unwrap(await client.from('edit_comments').insert(payload).select('*').single());
    }
  };
}

function service() { return createEditingService(getSupabase()); }
export const getEditingDetails=(video)=>service().getEditingDetails(video);
export const startEditing=(video,userId)=>service().startEditing(video,userId);
export const submitForReview=(video)=>service().submitForReview(video);
export const requestChanges=(video)=>service().requestChanges(video);
export const approveEdit=(video,userId)=>service().approveEdit(video,userId);
export const createRevision=(video,userId)=>service().createRevision(video,userId);
export const updateEditingStatus=(video,version,status,userId)=>service().updateEditingStatus(video,version,status,userId);
export const addEditComment=(versionId,user,profile,message)=>service().addEditComment(versionId,user,profile,message);
