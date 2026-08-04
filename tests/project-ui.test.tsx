import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../app/src/components/AppHeader';
import { NewVideoModal } from '../app/src/components/NewVideoModal';
import type { Project } from '../app/src/types/domain';

const projects=[
  {id:'project-1',name:'Peppy Bubs',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'},
  {id:'project-2',name:'Giggle Sprouts',description:null,is_active:true,created_by:null,created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'}
] satisfies Project[];
const session={user:{id:'user-1',email:'user@example.com'}} as never;

describe('project UI',()=>{
  it('shows the project selector in the profile dropdown only for multiple projects',async()=>{
    const setActiveProjectId=vi.fn();
    render(<AppHeader session={session} projects={projects} activeProjectId="project-1" canCreate onProjectChange={setActiveProjectId} onNewVideo={()=>{}} onSignOut={()=>{}}/>);

    expect(screen.queryByRole('combobox',{name:'Project'})).toBeNull();
    await userEvent.click(screen.getByRole('button',{name:'Profile menu'}));
    await userEvent.selectOptions(screen.getByRole('combobox',{name:'Project'}),'project-2');

    expect(setActiveProjectId).toHaveBeenCalledWith('project-2');
  });

  it('does not show a selector for one project',async()=>{
    render(<AppHeader session={session} projects={[projects[0]]} activeProjectId="project-1" canCreate onProjectChange={()=>{}} onNewVideo={()=>{}} onSignOut={()=>{}}/>);
    await userEvent.click(screen.getByRole('button',{name:'Profile menu'}));

    expect(screen.queryByRole('combobox',{name:'Project'})).toBeNull();
    expect(screen.getByText('Peppy Bubs')).not.toBeNull();
  });

  it('disables video creation when there is no valid project',()=>{
    render(<AppHeader session={session} projects={[]} activeProjectId={null} canCreate={false} onProjectChange={()=>{}} onNewVideo={()=>{}} onSignOut={()=>{}}/>);

    expect(screen.getByRole('button',{name:/New Video/}).hasAttribute('disabled')).toBe(true);
  });

  it('shows only allowed projects in the create form and defaults to the active project',async()=>{
    const onCreate=vi.fn().mockResolvedValue(undefined);
    render(<NewVideoModal open projects={projects} activeProjectId="project-2" onClose={()=>{}} onCreate={onCreate}/>);

    const select=screen.getByRole('combobox',{name:'Project'}) as HTMLSelectElement;
    expect(select.value).toBe('project-2');
    expect(Array.from(select.options).map(({value})=>value)).toEqual(['project-1','project-2']);
    await userEvent.type(screen.getByRole('textbox',{name:'Video title'}),'New lesson');
    await userEvent.click(screen.getByRole('button',{name:'Create Video'}));

    expect(onCreate).toHaveBeenCalledWith({title:'New lesson',description:'',projectId:'project-2'});
  });

  it('hides the project field for one project and assigns it automatically',async()=>{
    const onCreate=vi.fn().mockResolvedValue(undefined);
    render(<NewVideoModal open projects={[projects[0]]} activeProjectId="project-1" onClose={()=>{}} onCreate={onCreate}/>);

    expect(screen.queryByRole('combobox',{name:'Project'})).toBeNull();
    await userEvent.type(screen.getByRole('textbox',{name:'Video title'}),'New lesson');
    await userEvent.click(screen.getByRole('button',{name:'Create Video'}));

    expect(onCreate).toHaveBeenCalledWith({title:'New lesson',description:'',projectId:'project-1'});
  });

  it('prevents submission when there is no valid project',async()=>{
    const onCreate=vi.fn().mockResolvedValue(undefined);
    render(<NewVideoModal open projects={[]} activeProjectId={null} onClose={()=>{}} onCreate={onCreate}/>);

    expect(screen.getByRole('button',{name:'Create Video'}).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('You need access to an active project before creating a video.')).not.toBeNull();
  });
});
