import { describe, expect, it, vi } from 'vitest';
import { VIDEO_WORKFLOW, deriveWorkflowItems, getNextWorkflowUpdate } from '../app/src/constants/video-workflow.js';

describe('video workflow', () => {
  it('defines the workflow once in database enum order', () => {
    expect(VIDEO_WORKFLOW.map(({ key }) => key)).toEqual([
      'write_script','review_script','shoot_video','record_voice','start_editing','continue_editing',
      'submit_for_review','review_edit','make_edit_changes','approve_edit','create_thumbnail',
      'prepare_metadata','review_publishing_details','publish_video'
    ]);
  });

  it('checks earlier items and enables only the current item', () => {
    const items=deriveWorkflowItems({ current_stage:'production', next_action:'record_voice' });
    expect(items.find(({key})=>key==='shoot_video')).toMatchObject({ completed:true, enabled:false });
    expect(items.find(({key})=>key==='record_voice')).toMatchObject({ completed:false, enabled:true, current:true });
    expect(items.find(({key})=>key==='start_editing')).toMatchObject({ completed:false, enabled:false });
  });

  it('checks every item for a completed video', () => {
    expect(deriveWorkflowItems({ current_stage:'completed', next_action:'no_action_required' }).every((item)=>item.completed)).toBe(true);
  });

  it('preserves position and disables progression on hold', () => {
    const items=deriveWorkflowItems({ current_stage:'on_hold', next_action:'shoot_video' });
    expect(items.find(({key})=>key==='shoot_video')).toMatchObject({ current:true, enabled:false });
  });

  it('rejects unknown or contradictory positions', () => {
    expect(()=>deriveWorkflowItems({ current_stage:'editing', next_action:'unknown' })).toThrow('Unknown workflow action');
    expect(()=>deriveWorkflowItems({ current_stage:'editing', next_action:'no_action_required' })).toThrow('Unknown workflow action');
  });

  it('advances to the next action and its stage', () => {
    expect(getNextWorkflowUpdate({ current_stage:'production', next_action:'shoot_video' }))
      .toEqual({ current_stage:'production', next_action:'record_voice' });
  });

  it('completes publishing and stamps an unpublished video', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-07-20T18:00:00.000Z'));
    expect(getNextWorkflowUpdate({ current_stage:'publishing', next_action:'publish_video', published_at:null })).toEqual({
      current_stage:'completed', next_action:'no_action_required', published_at:'2026-07-20T18:00:00.000Z'
    });
    vi.useRealTimers();
  });

  it('does not advance an on-hold video', () => {
    expect(()=>getNextWorkflowUpdate({ current_stage:'on_hold', next_action:'shoot_video' })).toThrow('on hold');
  });
});
