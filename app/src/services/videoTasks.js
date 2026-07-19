import { getSupabase } from '../lib/supabase.js';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export function createVideoTasksService(client) {
  return {
    async getVideoTasks(videoIds) {
      const ids = Array.isArray(videoIds) ? videoIds : [videoIds];
      if (!ids.length) return [];

      let query = client
        .from('video_tasks')
        .select('*')
        .order('sort_order', { ascending: true });
      query = ids.length === 1
        ? query.eq('video_id', ids[0])
        : query.in('video_id', ids);
      return unwrap(await query) || [];
    },

    async updateVideoTaskCompletion(taskId, completed) {
      const result = await client
        .from('video_tasks')
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId)
        .select('*')
        .single();
      return unwrap(result);
    }
  };
}

function service() {
  return createVideoTasksService(getSupabase());
}

export const getVideoTasks = (videoIds) => service().getVideoTasks(videoIds);
export const updateVideoTaskCompletion = (taskId, completed) => service().updateVideoTaskCompletion(taskId, completed);
