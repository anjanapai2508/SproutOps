import { useCallback, useState } from 'react';
import { signOut } from './services/auth';
import { useAuth } from './hooks/useAuth';
import { useVideos } from './hooks/useVideos';
import { AppHeader } from './components/AppHeader';
import { LoginPage } from './components/LoginPage';
import { LegalLinks } from './components/LegalLinks';
import { NewVideoModal } from './components/NewVideoModal';
import { VideoCard } from './components/VideoCard';
import logoUrl from '../assets/logo_new.png';

export function App() {
  const {session,loading:authLoading,authenticated}=useAuth();const videos=useVideos(authenticated);const [modalOpen,setModalOpen]=useState(false);const closeModal=useCallback(()=>setModalOpen(false),[]);
  if(authLoading)return <main className="grid min-h-screen place-items-center text-center text-slate-500"><div><img className="mx-auto mb-3 h-16 w-16" src={logoUrl} alt=""/><div className="text-2xl font-bold text-slate-900">SproutOps</div><p className="mt-2">Restoring your session…</p></div></main>;
  if(!authenticated)return <LoginPage/>;
  return <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-24"><AppHeader session={session} onNewVideo={()=>setModalOpen(true)} onSignOut={()=>void signOut()}/><main className="flex-1">{videos.loading?<div className="grid gap-4"><div className="skeleton h-44"/><div className="skeleton h-44"/></div>:videos.error?<div className="state-card" role="alert"><h2>Could not load videos. Please try again.</h2><p>Check your connection or sign-in, then retry.</p><button className="btn-primary mt-4" onClick={()=>void videos.load()}>Retry</button></div>:!videos.videos.length?<div className="state-card"><h2>No videos available</h2><p>Videos will appear here once they are added.</p><button className="btn-primary mt-4" onClick={()=>setModalOpen(true)}>Create Video</button></div>:<div className="grid gap-4">{videos.videos.map((video)=><VideoCard key={video.id} video={video} pending={Boolean(videos.pending[video.id])} error={videos.mutationErrors[video.id]} userId={session?.user.id||''} user={session?.user||null} onToggleChecklist={(action,checked)=>void videos.toggle(video,action,checked)} onUpdate={(title)=>void videos.update(video,title)} onArchive={()=>void videos.archive(video)} onVideoChange={videos.sync}/>)}</div>}</main><LegalLinks/><button className="new-video-fab btn-soft fixed bottom-6 right-6 hidden h-14 w-14 place-items-center rounded-full text-3xl shadow-lg max-sm:grid" onClick={()=>setModalOpen(true)} aria-label="New Video">+</button><NewVideoModal open={modalOpen} onClose={closeModal} onCreate={videos.create}/></div>;
}
