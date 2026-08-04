import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { signOut } from './services/auth';
import { useAuth } from './hooks/useAuth';
import { useVideos } from './hooks/useVideos';
import { AppHeader } from './components/AppHeader';
import { LoginPage } from './components/LoginPage';
import { LegalLinks } from './components/LegalLinks';
import { NewVideoModal } from './components/NewVideoModal';
import { VideoCard } from './components/VideoCard';
import { VideoSections } from './components/VideoSections';
import { ProjectProvider, useProject } from './contexts/ProjectProvider';
import logoUrl from '../assets/logo_new.png';

function ProjectWorkspace({session}:{session:Session|null}) {
  const {projects,activeProjectId,loading:projectsLoading,error:projectsError,setActiveProjectId}=useProject();
  const allowedProjectIds=projects.map(({id})=>id);
  const videos=useVideos(Boolean(activeProjectId),activeProjectId,allowedProjectIds);
  const [modalOpen,setModalOpen]=useState(false);
  const closeModal=useCallback(()=>setModalOpen(false),[]);
  useEffect(()=>setModalOpen(false),[activeProjectId]);
  const canCreate=Boolean(activeProjectId&&allowedProjectIds.includes(activeProjectId));
  const visibleVideos=videos.videos.filter(({project_id})=>project_id===activeProjectId);
  return <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-24"><AppHeader session={session} projects={projects} activeProjectId={activeProjectId} canCreate={canCreate} onProjectChange={setActiveProjectId} onNewVideo={()=>canCreate&&setModalOpen(true)} onSignOut={()=>void signOut()}/><main className="flex-1">{projectsLoading?<div className="grid gap-4"><div className="skeleton h-28"/><div className="skeleton h-44"/></div>:projectsError?<div className="state-card" role="alert"><h2>Could not load your projects</h2><p>Please refresh or try signing in again.</p></div>:!activeProjectId?<div className="state-card text-center"><h2>No active projects available</h2><p>Ask an administrator to add you to an active project.</p></div>:videos.loading?<div className="grid gap-4"><div className="skeleton h-44"/><div className="skeleton h-44"/></div>:videos.error?<div className="state-card" role="alert"><h2>Could not load videos. Please try again.</h2><p>Check your connection or sign-in, then retry.</p><button className="btn-primary mt-4" onClick={()=>void videos.load()}>Retry</button></div>:<VideoSections key={activeProjectId} videos={visibleVideos} profiles={videos.profiles} userId={session?.user.id||''} renderVideo={(video,expanded,onToggleExpanded)=><VideoCard key={video.id} video={video} profiles={videos.profiles} pending={Boolean(videos.pending[video.id])} error={videos.mutationErrors[video.id]} expanded={expanded} onToggleExpanded={()=>{if(!expanded)void videos.open(video.id);onToggleExpanded();}} userId={session?.user.id||''} user={session?.user||null} onToggleChecklist={(action,checked)=>void videos.toggle(video,action,checked)} onUpdate={(title)=>videos.update(video,title)} onAssign={(profileId)=>void videos.assign(video,profileId)} onArchive={()=>void videos.archive(video)} onVideoChange={videos.sync}/>}/>}</main><LegalLinks/><button className="new-video-fab btn-soft fixed bottom-6 right-6 hidden h-14 w-14 place-items-center rounded-full text-3xl shadow-lg max-sm:grid" disabled={!canCreate} onClick={()=>canCreate&&setModalOpen(true)} aria-label="New Video">+</button><NewVideoModal open={modalOpen} projects={projects} activeProjectId={activeProjectId} onClose={closeModal} onCreate={videos.create}/></div>;
}

export function App() {
  const {session,loading:authLoading,authenticated}=useAuth();
  if(authLoading)return <main className="grid min-h-screen place-items-center text-center text-slate-500"><div><img className="mx-auto mb-3 h-16 w-16" src={logoUrl} alt=""/><div className="text-2xl font-bold text-slate-900">SproutOps</div><p className="mt-2">Restoring your session…</p></div></main>;
  if(!authenticated)return <LoginPage/>;
  return <ProjectProvider userId={session?.user.id||''}><ProjectWorkspace session={session}/></ProjectProvider>;
}
