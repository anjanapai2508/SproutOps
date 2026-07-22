import { describe,expect,it } from 'vitest';
import { render,screen } from '@testing-library/react';
import { StageSummary } from '../app/src/components/StageSummary';
import type { Video } from '../app/src/types/domain';

const video={id:'v1',sequence_number:1,title:'Test',description:null,current_stage:'production',next_action:'shoot_video',completed_actions:['write_script','review_script'],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,next_action_updated_at:'2026-01-01',created_by:null,published_at:null,created_at:'2026-01-01',updated_at:'2026-01-01',archived_at:null} satisfies Video;

describe('StageSummary',()=>{
  it('exposes completed, current, and upcoming stages without relying on color alone',()=>{
    render(<StageSummary video={video}/>);
    expect(screen.getByLabelText('Pre-production: completed')).not.toBeNull();
    expect(screen.getByLabelText('Production: current')).not.toBeNull();
    expect(screen.getByText('Current')).not.toBeNull();
    expect(screen.getByLabelText('Editing: upcoming')).not.toBeNull();
  });

  it('marks editing complete only when the active editing version is Complete',()=>{
    const completedActions=['write_script','review_script','shoot_video','record_voice','start_editing','continue_editing','submit_for_review','review_edit','make_edit_changes','approve_edit'];
    const editingVideo={...video,current_stage:'publishing',next_action:'create_thumbnail',next_action_version_id:'edit-1',completed_actions:completedActions,edit_versions:[{id:'edit-1',status:'Editing'}]} as unknown as Video;
    const {rerender}=render(<StageSummary video={editingVideo}/>);
    expect(screen.getByLabelText('Editing: current')).not.toBeNull();
    expect(screen.getByLabelText('Publishing: upcoming')).not.toBeNull();

    rerender(<StageSummary video={{...editingVideo,edit_versions:[{id:'edit-1',status:'Complete'}]} as unknown as Video}/>);
    expect(screen.getByLabelText('Editing: completed')).not.toBeNull();
    expect(screen.getByLabelText('Publishing: current')).not.toBeNull();
  });
});
