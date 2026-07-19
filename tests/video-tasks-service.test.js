import { describe, expect, it, vi } from 'vitest';
import { createVideoTasksService } from '../app/src/services/videoTasks.js';

function queryResult(result) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    update: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => Promise.resolve(result).then(resolve)
  };
  return query;
}

describe('video tasks service', () => {
  it('loads one video task list ordered by the database sort order', async () => {
    const rows=[{ id:'task-1', video_id:'video-1', title:'Write script', sort_order:1, is_completed:false }];
    const query=queryResult({ data:rows, error:null });
    const client={ from:vi.fn(()=>query) };

    await expect(createVideoTasksService(client).getVideoTasks('video-1')).resolves.toEqual(rows);
    expect(client.from).toHaveBeenCalledWith('video_tasks');
    expect(query.order).toHaveBeenCalledWith('sort_order',{ ascending:true });
    expect(query.eq).toHaveBeenCalledWith('video_id','video-1');
  });

  it('bulk loads visible videos without one request per video', async () => {
    const query=queryResult({ data:[], error:null });
    const client={ from:vi.fn(()=>query) };

    await createVideoTasksService(client).getVideoTasks(['video-1','video-2']);
    expect(query.in).toHaveBeenCalledWith('video_id',['video-1','video-2']);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('saves completion and a completion timestamp', async () => {
    const saved={ id:'task-1', is_completed:true, completed_at:'2026-07-19T00:00:00.000Z' };
    const query=queryResult({ data:saved, error:null });
    const client={ from:vi.fn(()=>query) };

    await expect(createVideoTasksService(client).updateVideoTaskCompletion('task-1',true)).resolves.toEqual(saved);
    expect(query.update).toHaveBeenCalledWith({ is_completed:true, completed_at:expect.any(String) });
    expect(query.eq).toHaveBeenCalledWith('id','task-1');
  });

  it('clears the completion timestamp when a task is unchecked', async () => {
    const query=queryResult({ data:{ id:'task-1', is_completed:false, completed_at:null }, error:null });
    const client={ from:vi.fn(()=>query) };

    await createVideoTasksService(client).updateVideoTaskCompletion('task-1',false);
    expect(query.update).toHaveBeenCalledWith({ is_completed:false, completed_at:null });
  });
});
