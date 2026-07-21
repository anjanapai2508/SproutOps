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
});
