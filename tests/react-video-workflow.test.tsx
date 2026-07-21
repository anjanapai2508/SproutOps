import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCard } from '../app/src/components/VideoCard';
import type { Video } from '../app/src/types/domain';

const video={id:'v1',sequence_number:1,title:'Test video',description:null,current_stage:'pre_production',next_action:'write_script',completed_actions:[],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,next_action_updated_at:'2026-01-01',created_by:null,published_at:null,created_at:'2026-01-01',updated_at:'2026-01-01',archived_at:null} satisfies Video;

describe('React video workflow',()=>{
  it('lets the user toggle any checklist item',async()=>{
    const onToggle=vi.fn();
    render(<VideoCard video={video} onToggleChecklist={onToggle} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    await userEvent.click(screen.getByRole('button',{name:/pre-production/i}));
    const review=screen.getByRole('checkbox',{name:/review script/i});
    await userEvent.click(review);
    expect(onToggle).toHaveBeenCalledWith('review_script',true);
  });
});
