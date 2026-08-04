import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider, useProject } from '../app/src/contexts/ProjectProvider';
import { getProjects } from '../app/src/services/projects';
import type { Project } from '../app/src/types/domain';

vi.mock('../app/src/services/projects',()=>({getProjects:vi.fn()}));

const projects=[
  {id:'project-1',name:'Peppy Bubs',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'},
  {id:'project-2',name:'Giggle Sprouts',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'}
] satisfies Project[];

function Probe() {
  const {projects:allowed,activeProjectId,setActiveProjectId,loading}=useProject();
  if(loading)return <div>Loading projects</div>;
  return <div>
    <span>{activeProjectId||'no-project'}</span>
    <span>{allowed.map(({name})=>name).join(',')}</span>
    <button onClick={()=>setActiveProjectId('project-2')}>Choose second</button>
    <button onClick={()=>setActiveProjectId('not-allowed')}>Choose invalid</button>
  </div>;
}

describe('ProjectProvider',()=>{
  beforeEach(()=>{
    const values=new Map<string,string>();
    vi.stubGlobal('localStorage',{
      getItem:(key:string)=>values.get(key)??null,
      setItem:(key:string,value:string)=>values.set(key,value),
      removeItem:(key:string)=>values.delete(key),
      clear:()=>values.clear()
    });
    vi.mocked(getProjects).mockResolvedValue(projects);
  });

  it('defaults to the first allowed project and persists it for the signed-in user',async()=>{
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);

    expect(await screen.findByText('project-1')).not.toBeNull();
    expect(localStorage.getItem('sproutops:active-project:user-1')).toBe('project-1');
  });

  it('restores a saved project only when it is still allowed',async()=>{
    localStorage.setItem('sproutops:active-project:user-1','project-2');
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);

    expect(await screen.findByText('project-2')).not.toBeNull();
  });

  it('falls back to the first project when the saved project is no longer allowed',async()=>{
    localStorage.setItem('sproutops:active-project:user-1','removed-project');
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);

    expect(await screen.findByText('project-1')).not.toBeNull();
  });

  it('never accepts a project outside the loaded memberships',async()=>{
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);
    await screen.findByText('project-1');

    await userEvent.click(screen.getByRole('button',{name:'Choose invalid'}));

    expect(screen.getByText('project-1')).not.toBeNull();
    expect(localStorage.getItem('sproutops:active-project:user-1')).toBe('project-1');
  });

  it('switches to an allowed project and persists the selection',async()=>{
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);
    await screen.findByText('project-1');

    await userEvent.click(screen.getByRole('button',{name:'Choose second'}));

    expect(screen.getByText('project-2')).not.toBeNull();
    expect(localStorage.getItem('sproutops:active-project:user-1')).toBe('project-2');
  });

  it('uses no active project when the user has no memberships',async()=>{
    vi.mocked(getProjects).mockResolvedValue([]);
    render(<ProjectProvider userId="user-1"><Probe/></ProjectProvider>);

    await waitFor(()=>expect(screen.getByText('no-project')).not.toBeNull());
  });
});
