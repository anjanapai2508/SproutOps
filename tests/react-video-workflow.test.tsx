import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCard } from '../app/src/components/VideoCard';
import type { Video } from '../app/src/types/domain';

const video={id:'v1',sequence_number:1,title:'Test video',description:null,current_stage:'pre_production',next_action:'write_script',completed_actions:[],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,next_action_updated_at:'2026-01-01',created_by:null,published_at:null,created_at:'2026-01-01',updated_at:'2026-01-01',archived_at:null} satisfies Video;
const profiles=[{id:'u1',display_name:'Anjana Pai'},{id:'u2',display_name:'Roshan Rathod'}];

describe('React video workflow',()=>{
  it('displays the user-entered title without a sequence prefix',()=>{
    render(<VideoCard video={video} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.getByRole('button',{name:'Test video'})).not.toBeNull();
    expect(screen.queryByText('#1 Test video')).toBeNull();
  });

  it('shows the video updated date below its stage',()=>{
    render(<VideoCard video={{...video,updated_at:'2026-07-21T12:00:00Z'}} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.getByText('Updated Jul 21, 2026')).not.toBeNull();
  });

  it('shows progress only while an incomplete card is collapsed',async()=>{
    render(<VideoCard video={{...video,completed_actions:['write_script','review_script']}} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.getByRole('progressbar',{name:'2 of 14 tasks complete'})).not.toBeNull();
    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('does not show progress when every task is complete',()=>{
    const completed_actions=['write_script','review_script','shoot_video','record_voice','start_editing','continue_editing','submit_for_review','review_edit','make_edit_changes','approve_edit','create_thumbnail','prepare_metadata','review_publishing_details','publish_video'] as Video['completed_actions'];
    render(<VideoCard video={{...video,current_stage:'completed',next_action:'no_action_required',completed_actions}} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('shows Review as up next when the active edit is in review',()=>{
    const inReview={
      ...video,
      current_stage:'editing',
      next_action:'start_editing',
      next_action_version_id:'edit-1',
      edit_versions:[{id:'edit-1',status:'In-Review'}]
    } as unknown as Video;
    render(<VideoCard video={inReview} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);

    expect(screen.getByText('Review')).not.toBeNull();
    expect(screen.queryByText('Start Editing')).toBeNull();
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

  it('shows the assignee on the collapsed card and allows reassignment in details',async()=>{
    const onAssign=vi.fn();
    render(<VideoCard video={{...video,next_action_assignee_id:'u1'}} profiles={profiles} onAssign={onAssign} onToggleChecklist={vi.fn()} onUpdate={vi.fn()} onArchive={vi.fn()} userId="u1" />);
    expect(screen.getByText('Assigned to Anjana Pai')).not.toBeNull();

    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    const select=screen.getByRole('combobox',{name:'Assigned To'});
    expect(screen.getByRole('option',{name:'Roshan Rathod'})).not.toBeNull();
    await userEvent.selectOptions(select,'u2');
    expect(onAssign).toHaveBeenCalledWith('u2');
  });

  it('shows Save Title only after an exact title change and saves the entered value',async()=>{
    const onUpdate=vi.fn().mockResolvedValue(undefined);
    const view=render(<VideoCard video={video} onToggleChecklist={vi.fn()} onUpdate={onUpdate} onArchive={vi.fn()} userId="u1" />);
    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    expect(screen.queryByRole('button',{name:'Save Title'})).toBeNull();

    const title=screen.getByRole('textbox',{name:'Video title'});
    await userEvent.type(title,' ');
    await userEvent.click(screen.getByRole('button',{name:'Save Title'}));

    expect(onUpdate).toHaveBeenCalledWith('Test video ');
    expect((await screen.findByRole('status')).textContent).toContain('Title saved successfully.');
    view.rerender(<VideoCard video={{...video,title:'Test video '}} onToggleChecklist={vi.fn()} onUpdate={onUpdate} onArchive={vi.fn()} userId="u1" />);
    expect(screen.queryByRole('button',{name:'Save Title'})).toBeNull();
  });

  it('does not show a success toast when saving the title fails',async()=>{
    const onUpdate=vi.fn().mockRejectedValue(new Error('Save failed'));
    render(<VideoCard video={video} onToggleChecklist={vi.fn()} onUpdate={onUpdate} onArchive={vi.fn()} userId="u1" />);
    await userEvent.click(screen.getByRole('button',{name:/test video/i}));
    await userEvent.type(screen.getByRole('textbox',{name:'Video title'}),' changed');
    await userEvent.click(screen.getByRole('button',{name:'Save Title'}));

    await waitFor(()=>expect(onUpdate).toHaveBeenCalled());
    expect(screen.queryByText('Title saved successfully.')).toBeNull();
  });
});
