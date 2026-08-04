import { describe, expect, it, vi } from 'vitest';
import { createVideosService } from '../app/src/services/videos.ts';

const row = {
  id: 'video-1', sequence_number: 1, title: 'Shapes', description: null,
  project_id: 'project-1',
  current_stage: 'pre_production', next_action: 'write_script',
  next_action_assignee_id: null, next_action_version_id: null,
  next_action_note: null, next_action_updated_at: '2026-07-18T10:00:00Z',
  created_by: null, published_at: null, created_at: '2026-07-18T10:00:00Z',
  updated_at: '2026-07-18T10:00:00Z', archived_at: null,
  edit_versions: []
};

function queryResult(result) {
  const query = {
    select: vi.fn(() => query),
    is: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(result)),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result))
  };
  return query;
}

describe('videos service', () => {
  it('fetches only active videos for the selected project ordered by creation date', async () => {
    const query = queryResult({ data: [row], error: null });
    const client = { from: vi.fn(() => query) };

    await expect(createVideosService(client).getVideos('project-1')).resolves.toEqual([row]);
    expect(client.from).toHaveBeenCalledWith('videos');
    expect(query.select).toHaveBeenCalledWith('*, edit_versions!edit_versions_video_id_fkey(*, edit_comments(*))');
    expect(query.eq).toHaveBeenCalledWith('project_id', 'project-1');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('fetches a single video by both video ID and project ID',async()=>{
    const query=queryResult({data:row,error:null});
    const client={from:vi.fn(()=>query)};

    await expect(createVideosService(client).getVideo('video-1','project-1')).resolves.toEqual(row);

    expect(query.eq).toHaveBeenCalledWith('id','video-1');
    expect(query.eq).toHaveBeenCalledWith('project_id','project-1');
    expect(query.maybeSingle).toHaveBeenCalled();
  });

  it('fetches assignable profiles by display name',async()=>{
    const profiles=[{id:'u1',display_name:'Anjana Pai'}];
    const query=queryResult({data:profiles,error:null});
    const client={from:vi.fn(()=>query)};

    await expect(createVideosService(client).getProfiles()).resolves.toEqual(profiles);
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(query.select).toHaveBeenCalledWith('id, display_name');
    expect(query.order).toHaveBeenCalledWith('display_name',{ascending:true});
  });

  it('creates a video with only supported initial fields', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).createVideo({ title: ' Shapes ', description: 'Lesson', projectId: 'project-1' });
    expect(query.insert).toHaveBeenCalledWith({
      title: 'Shapes', description: 'Lesson', project_id: 'project-1', current_stage: 'pre_production', next_action: 'write_script'
    });
  });

  it('filters undefined and unsupported update fields and scopes the update to the selected project', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).updateVideo('video-1', 'project-1', {
      title: 'New title', description: undefined, current_stage: 'editing', archived_at: 'unsafe'
    });
    expect(query.update).toHaveBeenCalledWith({ title: 'New title', current_stage: 'editing' });
    expect(query.eq).toHaveBeenCalledWith('id', 'video-1');
    expect(query.eq).toHaveBeenCalledWith('project_id', 'project-1');
  });

  it('updates the next-action assignee',async()=>{
    const saved={...row,next_action_assignee_id:'u1'};
    const query=queryResult({data:saved,error:null});
    const client={from:vi.fn(()=>query)};

    await expect(createVideosService(client).updateVideo('video-1','project-1',{next_action_assignee_id:'u1'})).resolves.toEqual(saved);
    expect(query.update).toHaveBeenCalledWith({next_action_assignee_id:'u1'});
  });

  it('soft archives instead of deleting', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).archiveVideo('video-1','project-1');
    expect(query.update).toHaveBeenCalledWith({ archived_at: expect.any(String) });
    expect(query.eq).toHaveBeenCalledWith('id', 'video-1');
    expect(query.eq).toHaveBeenCalledWith('project_id', 'project-1');
    expect(query.delete).toBeUndefined();
  });

  it('toggles checklist state with stale-write protection', async () => {
    const saved={...row,completed_actions:['review_script'],current_stage:'pre_production',next_action:'write_script'};
    const query=queryResult({data:saved,error:null});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1','project-1',{...row,completed_actions:['write_script','review_script']},'write_script',false)).resolves.toEqual(saved);
    expect(query.update).toHaveBeenCalledWith({completed_actions:['review_script'],current_stage:'pre_production',next_action:'write_script',published_at:null});
    expect(query.eq).toHaveBeenCalledWith('id','video-1');
    expect(query.eq).toHaveBeenCalledWith('project_id','project-1');
    expect(query.eq).toHaveBeenCalledWith('updated_at',row.updated_at);
  });

  it('rejects a stale workflow update', async () => {
    const query=queryResult({data:null,error:null});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1','project-1',row,'write_script',true)).rejects.toThrow('changed');
  });

  it('propagates checklist update errors', async () => {
    const error=new Error('RLS denied');
    const query=queryResult({data:null,error});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1','project-1',row,'write_script',true)).rejects.toBe(error);
  });

  it('throws Supabase errors', async () => {
    const error = new Error('RLS denied');
    const query = queryResult({ data: null, error });
    const client = { from: vi.fn(() => query) };

    await expect(createVideosService(client).getVideos('project-1')).rejects.toBe(error);
  });
});
