import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/src/App';
import { getProjects } from '../app/src/services/projects';
import { getProfiles, getVideo, getVideos } from '../app/src/services/videos';
import type { Project, Video } from '../app/src/types/domain';

vi.mock('../app/src/hooks/useAuth',()=>({
  useAuth:()=>({session:{user:{id:'user-1',email:'user@example.com'}},loading:false,authenticated:true,skipLogin:false})
}));
vi.mock('../app/src/services/auth',()=>({signOut:vi.fn()}));
vi.mock('../app/src/services/projects',()=>({getProjects:vi.fn()}));
vi.mock('../app/src/services/videos',()=>({
  archiveVideo:vi.fn(),createVideo:vi.fn(),getProfiles:vi.fn(),getVideo:vi.fn(),getVideos:vi.fn(),
  toggleVideoChecklist:vi.fn(),updateVideo:vi.fn()
}));

const projects=[
  {id:'project-1',name:'Peppy Bubs',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'},
  {id:'project-2',name:'Giggle Sprouts',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'}
] satisfies Project[];
const video=(id:string,projectId:string):Video=>({
  id,project_id:projectId,sequence_number:1,title:id,description:null,current_stage:'pre_production',next_action:'write_script',
  completed_actions:[],next_action_assignee_id:null,next_action_version_id:null,next_action_note:null,
  next_action_updated_at:'2026-07-22T00:00:00Z',created_by:null,published_at:null,
  created_at:'2026-07-22T00:00:00Z',updated_at:'2026-07-22T00:00:00Z',archived_at:null
});

describe('multi-project app',()=>{
  beforeEach(()=>{
    const values=new Map<string,string>();
    vi.stubGlobal('localStorage',{
      getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),
      removeItem:(key:string)=>values.delete(key),clear:()=>values.clear()
    });
    vi.mocked(getProfiles).mockResolvedValue([]);
    vi.mocked(getVideo).mockResolvedValue(null);
    vi.mocked(getVideos).mockResolvedValue([]);
  });

  it('shows a blocking empty state and disables creation when the user has no active projects',async()=>{
    vi.mocked(getProjects).mockResolvedValue([]);
    render(<App/>);

    expect(await screen.findByText('No active projects available')).not.toBeNull();
    expect(screen.getByText('Ask an administrator to add you to an active project.')).not.toBeNull();
    expect(screen.getAllByRole('button',{name:/New Video/}).every((button)=>button.hasAttribute('disabled'))).toBe(true);
    expect(getVideos).not.toHaveBeenCalled();
  });

  it('switches the board to the selected project and clears stale expanded content',async()=>{
    vi.mocked(getProjects).mockResolvedValue(projects);
    vi.mocked(getVideos).mockImplementation(async(projectId)=>[video(projectId==='project-1'?'Peppy video':'Giggle video',projectId)]);
    vi.mocked(getVideo).mockImplementation(async(id,projectId)=>video(id,projectId));
    render(<App/>);

    await userEvent.click(await screen.findByRole('button',{name:'Peppy video'}));
    await waitFor(()=>expect(getVideo).toHaveBeenCalledWith('Peppy video','project-1'));
    expect(screen.getByText('Video title')).not.toBeNull();

    await userEvent.click(screen.getByRole('button',{name:'Profile menu'}));
    await userEvent.selectOptions(screen.getByRole('combobox',{name:'Project'}),'project-2');

    expect(await screen.findByRole('button',{name:'Giggle video'})).not.toBeNull();
    expect(screen.queryByRole('button',{name:'Peppy video'})).toBeNull();
    expect(screen.queryByText('Video title')).toBeNull();
    expect(getVideos).toHaveBeenCalledWith('project-2');
  });
});
