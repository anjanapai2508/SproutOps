import { getSupabase } from '../lib/supabase.js';
import { getChecklistUpdate } from '../constants/video-workflow.js';

const UPDATE_FIELDS = [
  'title', 'description', 'current_stage', 'next_action', 'next_action_note',
  'next_action_assignee_id', 'next_action_version_id', 'published_at', 'completed_actions'
];

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export function createVideosService(client) {
  return {
    async getVideos() {
      const result = await client
        .from('videos')
        .select('*, edit_versions!edit_versions_video_id_fkey(*, edit_comments(*))')
        .is('archived_at', null)
        .order('sequence_number', { ascending: true });
      return unwrap(result) || [];
    },

    async createVideo(input) {
      const payload = {
        title: input.title.trim(),
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
        current_stage: 'pre_production',
        next_action: 'write_script'
      };
      const result = await client.from('videos').insert(payload).select('*').single();
      return unwrap(result);
    },

    async updateVideo(id, changes) {
      const payload = Object.fromEntries(
        UPDATE_FIELDS
          .filter((field) => changes[field] !== undefined)
          .map((field) => [field, changes[field]])
      );
      const result = await client.from('videos').update(payload).eq('id', id).select('*').single();
      return unwrap(result);
    },

    async toggleVideoChecklist(id, video, actionKey, isCompleted) {
      const payload=getChecklistUpdate(video,actionKey,isCompleted);
      const result=await client.from('videos')
        .update(payload)
        .eq('id',id)
        .eq('updated_at',video.updated_at)
        .select('*')
        .maybeSingle();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Video workflow changed; refresh and try again');
      return result.data;
    },

    async archiveVideo(id) {
      const result = await client
        .from('videos')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      return unwrap(result);
    }
  };
}

function service() {
  return createVideosService(getSupabase());
}

export const getVideos = () => service().getVideos();
export const createVideo = (input) => service().createVideo(input);
export const updateVideo = (id, changes) => service().updateVideo(id, changes);
export const toggleVideoChecklist = (id, video, actionKey, isCompleted) => service().toggleVideoChecklist(id,video,actionKey,isCompleted);
export const archiveVideo = (id) => service().archiveVideo(id);
