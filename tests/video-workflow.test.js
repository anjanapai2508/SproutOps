import { describe, expect, it, vi } from 'vitest';
import { VIDEO_WORKFLOW, deriveWorkflowItems, getChecklistUpdate } from '../app/src/constants/video-workflow.js';

describe('video workflow', () => {
  it('defines the workflow once in database enum order', () => {
    expect(VIDEO_WORKFLOW.map(({ key }) => key)).toEqual([
      'write_script','review_script','shoot_video','record_voice','start_editing','continue_editing',
      'submit_for_review','review_edit','make_edit_changes','approve_edit','create_thumbnail',
      'prepare_metadata','review_publishing_details','publish_video'
    ]);
  });

  it('uses independent stored checkbox values and enables every item', () => {
    const items=deriveWorkflowItems({ current_stage:'pre_production', next_action:'write_script', completed_actions:['review_script'] });
    expect(items.find(({key})=>key==='write_script')).toMatchObject({ completed:false, enabled:true, current:true });
    expect(items.find(({key})=>key==='review_script')).toMatchObject({ completed:true, enabled:true, current:false });
    expect(items.find(({key})=>key==='start_editing')).toMatchObject({ completed:false, enabled:true });
  });

  it('checking an item chooses the first unchecked action', () => {
    expect(getChecklistUpdate({ completed_actions:['write_script'] },'review_script',true)).toEqual({
      completed_actions:['write_script','review_script'],current_stage:'production',next_action:'shoot_video',published_at:null
    });
  });

  it('unchecking any item makes the first unchecked action current', () => {
    expect(getChecklistUpdate({ completed_actions:['write_script','review_script'] },'write_script',false)).toEqual({
      completed_actions:['review_script'],current_stage:'pre_production',next_action:'write_script',published_at:null
    });
  });

  it('completes when every item is checked', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-07-20T18:00:00.000Z'));
    const allButPublish=VIDEO_WORKFLOW.slice(0,-1).map(({key})=>key);
    expect(getChecklistUpdate({completed_actions:allButPublish,published_at:null},'publish_video',true)).toEqual({
      completed_actions:VIDEO_WORKFLOW.map(({key})=>key),current_stage:'completed',next_action:'no_action_required',published_at:'2026-07-20T18:00:00.000Z'
    });
    vi.useRealTimers();
  });

  it('rejects unknown checklist items', () => {
    expect(()=>getChecklistUpdate({completed_actions:[]},'unknown',true)).toThrow('Unknown checklist action');
  });
});
