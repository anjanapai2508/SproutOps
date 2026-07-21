import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCard } from '../app/src/components/VideoCard';
import type { Video } from '../app/src/types/domain';

const video={id:'v1',sequence_number:1,title:'Test video',description:null,current_stage:'pre_production',next_action:'write_script',completed_actions:[],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,next_action_updated_at:'2026-01-01',created_by:null,published_at:null,created_at:'2026-01-01',updated_at:'2026-01-01',archived_at:null} satisfies Video;

describe('React video workflow',()=>{
  it('shows the video updated date below its stage',()=>{
    render(<VideoCard video={{...video,updated_at:'2026-07-21T12:00:00Z'}} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.getByText('Updated Jul 21, 2026')).not.toBeNull();
  });

  it('shows the production pipeline only while the card is expanded',async()=>{
    render(<VideoCard video={video} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.queryByLabelText('Production pipeline')).toBeNull();
    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    expect(screen.getByLabelText('Production pipeline')).not.toBeNull();
  });

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
