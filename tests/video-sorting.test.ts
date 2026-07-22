import { describe, expect, it } from 'vitest';
import { sortVideos } from '../app/src/hooks/useVideos';
import type { Video } from '../app/src/types/domain';

const video=(id:string,created_at:string,completed_actions:Video['completed_actions']):Video=>({
  id,sequence_number:1,title:id,description:null,current_stage:'pre_production',next_action:'write_script',
  completed_actions,next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,
  next_action_updated_at:created_at,created_by:null,published_at:null,created_at,updated_at:created_at,
  archived_at:null
});

describe('video sorting',()=>{
  it('orders videos from most completed tasks to least',()=>{
    const least=video('least','2026-07-20T00:00:00Z',[]);
    const most=video('most','2026-07-22T00:00:00Z',['write_script','review_script']);
    const middle=video('middle','2026-07-21T00:00:00Z',['write_script']);

    expect(sortVideos([least,most,middle]).map(({id})=>id)).toEqual(['most','middle','least']);
  });

  it('orders equally complete videos from oldest to newest',()=>{
    const newest=video('newest','2026-07-22T00:00:00Z',['write_script']);
    const oldest=video('oldest','2026-07-20T00:00:00Z',['review_script']);
    const middle=video('middle','2026-07-21T00:00:00Z',['shoot_video']);

    expect(sortVideos([newest,oldest,middle]).map(({id})=>id)).toEqual(['oldest','middle','newest']);
  });
});
