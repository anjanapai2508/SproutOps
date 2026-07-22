import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoSections } from '../app/src/components/VideoSections';
import { VIDEO_WORKFLOW } from '../app/src/constants/video-workflow';
import type { Video } from '../app/src/types/domain';

const completeActions=VIDEO_WORKFLOW.map(({key})=>key);
const video=(id:string,completed_actions:Video['completed_actions']):Video=>({
  id,sequence_number:1,title:id,description:null,current_stage:'pre_production',next_action:'write_script',
  completed_actions,next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,
  next_action_updated_at:'2026-07-22T00:00:00Z',created_by:null,published_at:null,
  created_at:'2026-07-22T00:00:00Z',updated_at:'2026-07-22T00:00:00Z',archived_at:null
});
const renderVideo=(item:Video)=><div key={item.id}>{item.title}</div>;

describe('video sections',()=>{
  it('shows four active and two completed videos initially, preserving their order',()=>{
    const videos=[
      ...['Active 1','Active 2','Active 3','Active 4','Active 5'].map((title)=>video(title,[])),
      ...['Complete 1','Complete 2','Complete 3'].map((title)=>video(title,completeActions))
    ];

    render(<VideoSections videos={videos} renderVideo={renderVideo}/>);

    const active=screen.getByRole('region',{name:'Active Videos'});
    expect(within(active).getByText('Active 1')).not.toBeNull();
    expect(within(active).getByText('Active 4')).not.toBeNull();
    expect(within(active).queryByText('Active 5')).toBeNull();
    const completed=screen.getByRole('region',{name:'Completed Videos'});
    expect(within(completed).getByText('Complete 2')).not.toBeNull();
    expect(within(completed).queryByText('Complete 3')).toBeNull();
  });

  it('expands and collapses each section independently',async()=>{
    const videos=[
      ...['Active 1','Active 2','Active 3','Active 4','Active 5'].map((title)=>video(title,[])),
      ...['Complete 1','Complete 2','Complete 3'].map((title)=>video(title,completeActions))
    ];
    render(<VideoSections videos={videos} renderVideo={renderVideo}/>);
    const active=screen.getByRole('region',{name:'Active Videos'});
    const completed=screen.getByRole('region',{name:'Completed Videos'});

    await userEvent.click(within(active).getByRole('button',{name:'Show More'}));
    expect(within(active).getByText('Active 5')).not.toBeNull();
    expect(within(active).getByRole('button',{name:'Show Less'})).not.toBeNull();
    expect(within(completed).queryByText('Complete 3')).toBeNull();

    await userEvent.click(within(completed).getByRole('button',{name:'Show More'}));
    expect(within(completed).getByText('Complete 3')).not.toBeNull();
    await userEvent.click(within(active).getByRole('button',{name:'Show Less'}));
    expect(within(active).queryByText('Active 5')).toBeNull();
  });

  it('keeps empty sections visible with friendly messages',()=>{
    render(<VideoSections videos={[]} renderVideo={renderVideo}/>);

    expect(screen.getByText('No active videos right now.')).not.toBeNull();
    expect(screen.getByText('Completed videos will appear here.')).not.toBeNull();
  });

  it('allows only one card to be expanded across both sections',async()=>{
    const videos=[video('Active',[]),video('Complete',completeActions)];
    render(<VideoSections videos={videos} renderVideo={(item,expanded,onToggle)=><button key={item.id} type="button" aria-expanded={expanded} onClick={onToggle}>{item.title}</button>}/>);

    const active=screen.getByRole('button',{name:'Active'});
    const completed=screen.getByRole('button',{name:'Complete'});
    await userEvent.click(active);
    expect(active.getAttribute('aria-expanded')).toBe('true');
    expect(completed.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(completed);
    expect(active.getAttribute('aria-expanded')).toBe('false');
    expect(completed.getAttribute('aria-expanded')).toBe('true');
    await userEvent.click(completed);
    expect(completed.getAttribute('aria-expanded')).toBe('false');
  });

  it('collapses an expanded card when Show Less hides it',async()=>{
    const videos=['Active 1','Active 2','Active 3','Active 4','Active 5'].map((title)=>video(title,[]));
    render(<VideoSections videos={videos} renderVideo={(item,expanded,onToggle)=><button key={item.id} type="button" aria-expanded={expanded} onClick={onToggle}>{item.title}</button>}/>);
    const activeSection=screen.getByRole('region',{name:'Active Videos'});
    await userEvent.click(within(activeSection).getByRole('button',{name:'Show More'}));
    await userEvent.click(within(activeSection).getByRole('button',{name:'Active 5'}));
    await userEvent.click(within(activeSection).getByRole('button',{name:'Show Less'}));
    await userEvent.click(within(activeSection).getByRole('button',{name:'Show More'}));

    expect(within(activeSection).getByRole('button',{name:'Active 5'}).getAttribute('aria-expanded')).toBe('false');
  });
});
