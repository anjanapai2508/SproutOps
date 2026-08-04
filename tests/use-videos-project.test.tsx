import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useVideos } from '../app/src/hooks/useVideos';
import { createVideo, getProfiles, getVideo, getVideos } from '../app/src/services/videos';
import type { Video } from '../app/src/types/domain';

vi.mock('../app/src/services/videos',()=>({
  archiveVideo:vi.fn(),createVideo:vi.fn(),getProfiles:vi.fn(),getVideo:vi.fn(),getVideos:vi.fn(),
  toggleVideoChecklist:vi.fn(),updateVideo:vi.fn()
}));

const video=(id:string,projectId:string):Video=>({
  id,project_id:projectId,sequence_number:1,title:id,description:null,current_stage:'pre_production',next_action:'write_script',
  completed_actions:[],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,
  next_action_updated_at:'2026-07-22T00:00:00Z',created_by:null,published_at:null,
  created_at:'2026-07-22T00:00:00Z',updated_at:'2026-07-22T00:00:00Z',archived_at:null
});

describe('useVideos project scoping',()=>{
  beforeEach(()=>{
    vi.mocked(getProfiles).mockResolvedValue([]);
    vi.mocked(getVideos).mockResolvedValue([]);
    vi.mocked(getVideo).mockResolvedValue(null);
    vi.mocked(createVideo).mockImplementation(async(input)=>video(input.title,input.projectId));
  });

  it('loads and reloads videos using the active project ID',async()=>{
    const {rerender}=renderHook(({projectId})=>useVideos(true,projectId,['project-1','project-2']),{initialProps:{projectId:'project-1'}});
    await waitFor(()=>expect(getVideos).toHaveBeenCalledWith('project-1'));

    rerender({projectId:'project-2'});

    await waitFor(()=>expect(getVideos).toHaveBeenCalledWith('project-2'));
  });

  it('rejects creation for a project outside the signed-in memberships',async()=>{
    const {result}=renderHook(()=>useVideos(true,'project-1',['project-1']));
    await waitFor(()=>expect(result.current.loading).toBe(false));

    await expect(result.current.create({title:'Blocked',description:'',projectId:'project-2'})).rejects.toThrow('project');
    expect(createVideo).not.toHaveBeenCalled();
  });

  it('does not add a video from another allowed project to the active list',async()=>{
    const {result}=renderHook(()=>useVideos(true,'project-1',['project-1','project-2']));
    await waitFor(()=>expect(result.current.loading).toBe(false));

    await act(()=>result.current.create({title:'Other project',description:'',projectId:'project-2'}));

    expect(createVideo).toHaveBeenCalledWith({title:'Other project',description:'',projectId:'project-2'});
    expect(result.current.videos).toEqual([]);
  });

  it('opens a video using both its ID and the active project ID',async()=>{
    vi.mocked(getVideo).mockResolvedValue(video('video-1','project-1'));
    const {result}=renderHook(()=>useVideos(true,'project-1',['project-1']));
    await waitFor(()=>expect(result.current.loading).toBe(false));

    await act(()=>result.current.open('video-1'));

    expect(getVideo).toHaveBeenCalledWith('video-1','project-1');
    expect(result.current.videos.map(({id})=>id)).toEqual(['video-1']);
  });
});
