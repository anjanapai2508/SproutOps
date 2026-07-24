import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoSections } from '../app/src/components/VideoSections';
import { VIDEO_WORKFLOW } from '../app/src/constants/video-workflow';
import type { Profile, Video } from '../app/src/types/domain';

const completeActions=VIDEO_WORKFLOW.map(({key})=>key);
const video=(id:string,completed_actions:Video['completed_actions'],next_action_assignee_id:string|null=null):Video=>({
  id,sequence_number:1,title:id,description:null,current_stage:'pre_production',next_action:'write_script',
  completed_actions,next_action_assignee_id,next_action_version_id:null,next_action_note:null,
  next_action_updated_at:'2026-07-22T00:00:00Z',created_by:null,published_at:null,
  created_at:'2026-07-22T00:00:00Z',updated_at:'2026-07-22T00:00:00Z',archived_at:null
});
const renderVideo=(item:Video)=><div key={item.id}>{item.title}</div>;
const profiles=[{id:'user-1',display_name:'Anjana Pai'},{id:'user-2',display_name:'Roshan Rathod'}] as Profile[];

describe('video sections',()=>{
  beforeEach(()=>{
    const values=new Map<string,string>();
    vi.stubGlobal('localStorage',{
      getItem:(key:string)=>values.get(key)??null,
      setItem:(key:string,value:string)=>values.set(key,value),
      removeItem:(key:string)=>values.delete(key),
      clear:()=>values.clear()
    });
  });

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

  it('filters only active videos by assignee',async()=>{
    const videos=[
      video('Anjana active',[],'user-1'),
      video('Roshan active',[],'user-2'),
      video('Anjana complete',completeActions,'user-1'),
      video('Roshan complete',completeActions,'user-2')
    ];
    render(<VideoSections videos={videos} profiles={profiles} userId="signed-in-user" renderVideo={renderVideo}/>);

    await userEvent.selectOptions(screen.getByRole('combobox',{name:'Assignee'}),'user-1');

    expect(screen.getByText('Anjana active')).not.toBeNull();
    expect(screen.getByText('Anjana complete')).not.toBeNull();
    expect(screen.getByText('Roshan complete')).not.toBeNull();
    expect(screen.queryByText('Roshan active')).toBeNull();
  });

  it('places the assignee filter in the Active Videos header',()=>{
    render(<VideoSections videos={[video('Active',[])]} profiles={profiles} userId="signed-in-user" renderVideo={renderVideo}/>);

    const active=screen.getByRole('region',{name:'Active Videos'});
    const completed=screen.getByRole('region',{name:'Completed Videos'});
    expect(within(active).getByRole('combobox',{name:'Assignee'})).not.toBeNull();
    expect(within(completed).queryByRole('combobox',{name:'Assignee'})).toBeNull();
  });

  it('filters unassigned videos',async()=>{
    const videos=[video('Assigned',[],'user-1'),video('No owner',[])];
    render(<VideoSections videos={videos} profiles={profiles} userId="signed-in-user" renderVideo={renderVideo}/>);

    await userEvent.selectOptions(screen.getByRole('combobox',{name:'Assignee'}),'unassigned');

    expect(within(screen.getByRole('region',{name:'Active Videos'})).getByText('No owner')).not.toBeNull();
    expect(screen.queryByText('Assigned')).toBeNull();
  });

  it('persists the filter separately for each signed-in user',async()=>{
    const videos=[video('Anjana active',[],'user-1'),video('Roshan active',[],'user-2')];
    const first=render(<VideoSections videos={videos} profiles={profiles} userId="viewer-1" renderVideo={renderVideo}/>);
    await userEvent.selectOptions(screen.getByRole('combobox',{name:'Assignee'}),'user-2');
    expect(localStorage.getItem('sproutops:assignee-filter:viewer-1')).toBe('user-2');
    first.unmount();

    render(<VideoSections videos={videos} profiles={profiles} userId="viewer-1" renderVideo={renderVideo}/>);
    expect((screen.getByRole('combobox',{name:'Assignee'}) as HTMLSelectElement).value).toBe('user-2');
    expect(screen.getByText('Roshan active')).not.toBeNull();
    expect(screen.queryByText('Anjana active')).toBeNull();
    expect(localStorage.getItem('sproutops:assignee-filter:viewer-2')).toBeNull();
  });

  it('falls back to all assignees when a saved profile no longer exists',()=>{
    localStorage.setItem('sproutops:assignee-filter:viewer-missing','missing-user');
    render(<VideoSections videos={[video('Visible',[],'user-1')]} profiles={profiles} userId="viewer-missing" renderVideo={renderVideo}/>);

    expect((screen.getByRole('combobox',{name:'Assignee'}) as HTMLSelectElement).value).toBe('all');
    expect(screen.getByText('Visible')).not.toBeNull();
  });
});
