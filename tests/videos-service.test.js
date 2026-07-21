import { describe, expect, it, vi } from 'vitest';
import { createVideosService } from '../app/src/services/videos.ts';

const row = {
  id: 'video-1', sequence_number: 1, title: 'Shapes', description: null,
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
  it('fetches only active videos ordered by creation date', async () => {
    const query = queryResult({ data: [row], error: null });
    const client = { from: vi.fn(() => query) };

    await expect(createVideosService(client).getVideos()).resolves.toEqual([row]);
    expect(client.from).toHaveBeenCalledWith('videos');
    expect(query.select).toHaveBeenCalledWith('*, edit_versions!edit_versions_video_id_fkey(*, edit_comments(*))');
    expect(query.is).toHaveBeenCalledWith('archived_at', null);
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('creates a video with only supported initial fields', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).createVideo({ title: ' Shapes ', description: 'Lesson' });
    expect(query.insert).toHaveBeenCalledWith({
      title: 'Shapes', description: 'Lesson', current_stage: 'pre_production', next_action: 'write_script'
    });
  });

  it('filters undefined and unsupported update fields', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).updateVideo('video-1', {
      title: 'New title', description: undefined, current_stage: 'editing', archived_at: 'unsafe'
    });
    expect(query.update).toHaveBeenCalledWith({ title: 'New title', current_stage: 'editing' });
    expect(query.eq).toHaveBeenCalledWith('id', 'video-1');
  });

  it('soft archives instead of deleting', async () => {
    const query = queryResult({ data: row, error: null });
    const client = { from: vi.fn(() => query) };

    await createVideosService(client).archiveVideo('video-1');
    expect(query.update).toHaveBeenCalledWith({ archived_at: expect.any(String) });
    expect(query.eq).toHaveBeenCalledWith('id', 'video-1');
    expect(query.delete).toBeUndefined();
  });

  it('toggles checklist state with stale-write protection', async () => {
    const saved={...row,completed_actions:['review_script'],current_stage:'pre_production',next_action:'write_script'};
    const query=queryResult({data:saved,error:null});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1',{...row,completed_actions:['write_script','review_script']},'write_script',false)).resolves.toEqual(saved);
    expect(query.update).toHaveBeenCalledWith({completed_actions:['review_script'],current_stage:'pre_production',next_action:'write_script',published_at:null});
    expect(query.eq).toHaveBeenCalledWith('id','video-1');
    expect(query.eq).toHaveBeenCalledWith('updated_at',row.updated_at);
  });

  it('rejects a stale workflow update', async () => {
    const query=queryResult({data:null,error:null});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1',row,'write_script',true)).rejects.toThrow('changed');
  });

  it('propagates checklist update errors', async () => {
    const error=new Error('RLS denied');
    const query=queryResult({data:null,error});
    const client={from:vi.fn(()=>query)};
    await expect(createVideosService(client).toggleVideoChecklist('video-1',row,'write_script',true)).rejects.toBe(error);
  });

  it('throws Supabase errors', async () => {
    const error = new Error('RLS denied');
    const query = queryResult({ data: null, error });
    const client = { from: vi.fn(() => query) };

    await expect(createVideosService(client).getVideos()).rejects.toBe(error);
  });
});
