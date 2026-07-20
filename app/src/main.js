import { archiveVideo, createVideo, getVideos, updateVideo } from './services/videos.js';
import { getVideoTasks, updateVideoTaskCompletion } from './services/videoTasks.js';
import { getSession, onAuthStateChange, sendLoginLink, signOut } from './services/auth.js';
import { NEXT_ACTION_LABELS, VIDEO_STAGE_LABELS } from './constants/video-labels.js';
import logoUrl from '../assets/logo_new.png';

const state = { session:null, isAuthLoading:true, authStep:'email', authEmail:'', authBusy:false, authError:null, authStatus:null, resendSeconds:0, videos:[], isLoading:false, loadError:null, tasksByVideoId:{}, taskLoading:{}, taskLoadErrors:{}, pendingTaskIds:{}, taskMutationErrors:{}, modalOpen:false, isSaving:false, createError:null, createDraft:{title:'',description:''}, expandedVideoId:null, expandedSections:{}, mutationErrors:{} };
const stageIcons = { pre_production:'📝', production:'🎥', editing:'✂️', publishing:'🚀', completed:'✓', on_hold:'⏸' };
const pipeline = ['pre_production','production','editing','publishing','completed'];
const skipLogin = import.meta.env.DEV && import.meta.env.VITE_APP_MODE === 'development';

const escapeHtml = (value='') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const formatDate = (value) => value ? new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)) : '—';
const sortVideos = (videos) => [...videos].sort((a,b)=>a.sequence_number-b.sequence_number);
const header = () => `<header class="header"><div class="brand-row"><img class="brand-logo" src="${logoUrl}" alt="Giggle Sprouts logo"><div><div class="app-title">SproutOps</div><div class="header-copy">Production operating system</div></div></div><div class="header-actions"><button class="new-video-btn header-new-video-btn" type="button" data-action="open-modal">+ New Video</button><div class="account-control"><span class="account-email">${escapeHtml(state.session?.user?.email || '')}</span><button class="secondary-btn sign-out-btn" type="button" data-action="sign-out">Sign out</button></div></div></header>`;

function renderStages(video) {
  return `<div class="stage-summary" aria-label="Production pipeline">${pipeline.map((stage)=>`<div class="stage-summary-item ${video.current_stage===stage?'current':''}"><span class="stage-symbol">${stageIcons[stage]}</span><span class="stage-state">${escapeHtml(VIDEO_STAGE_LABELS[stage])}</span></div>`).join('')}</div>`;
}

const sectionKey = (videoId, section) => `${videoId}:${section}`;

function renderTaskContent(video, title, stage) {
  const allTasks=state.tasksByVideoId[video.id] || [];
  const tasks=allTasks.filter((task)=>task.stage===stage).sort((a,b)=>a.sort_order-b.sort_order);
  return state.taskLoading[video.id]
    ? '<div class="task-loading" role="status">Loading tasks…</div>'
    : state.taskLoadErrors[video.id]
      ? `<div class="task-load-error" role="alert">Could not load tasks. <button class="text-btn task-retry" type="button" data-action="retry-tasks" data-video-id="${video.id}">Retry</button></div>`
      : tasks.length
        ? tasks.map((task)=>`<label class="task-row ${task.is_completed?'completed':''}" title="${escapeHtml(task.title)}"><input class="task-check" type="checkbox" data-action="toggle-task" data-video-id="${video.id}" data-task-id="${task.id}" ${task.is_completed?'checked':''} ${state.pendingTaskIds[task.id]?'disabled':''}><span class="task-label">${escapeHtml(task.title)}</span></label>${state.taskMutationErrors[task.id]?`<div class="task-update-error" role="status">${escapeHtml(state.taskMutationErrors[task.id])}</div>`:''}`).join('')
        : `<div class="section-empty">${allTasks.length?`No ${title.toLowerCase()} tasks yet.`:'No tasks available'}</div>`;
}

function renderTaskSection(video, title, icon, stage) {
  const expanded=Boolean(state.expandedSections[sectionKey(video.id,stage)]);
  const taskContent=renderTaskContent(video,title,stage);
  return `<section class="detail-section"><button class="section-heading stage-${stage.replace('_','-')}" type="button" data-action="toggle-section" data-video-id="${video.id}" data-section-id="${stage}" aria-expanded="${expanded}"><span>${icon} ${title}</span><span class="section-chevron" aria-hidden="true">›</span></button>${expanded?`<div class="section-content">${taskContent}</div>`:''}</section>`;
}

function renderEditingSection(video) {
  const expanded=Boolean(state.expandedSections[sectionKey(video.id,'editing')]);
  const versions=[...(video.edit_versions || [])].sort((a,b)=>b.version_number-a.version_number);
  return `<section class="detail-section"><button class="section-heading stage-editing" type="button" data-action="toggle-section" data-video-id="${video.id}" data-section-id="editing" aria-expanded="${expanded}"><span>✂️ EDITING</span><span class="section-chevron" aria-hidden="true">›</span></button>${expanded?`<div class="section-content">${renderTaskContent(video,'EDITING','editing')}<div class="editing-content">${versions.length?versions.map((version)=>`<div class="version-card"><div><div class="eyebrow">Version ${version.version_number}</div><div class="version-name">${escapeHtml(version.status.replaceAll('_',' '))}</div></div><div class="editing-meta">${(version.edit_comments || []).length} comment${(version.edit_comments || []).length===1?'':'s'}</div></div>`).join(''):`<div class="section-empty">No editing versions yet.</div>`}</div></div>`:''}</section>`;
}

function renderDetails(video) {
  return `<div class="accordion-details"><div class="detail-workflow">${renderTaskSection(video,'PRE-PRODUCTION','📝','pre_production')}${renderTaskSection(video,'PRODUCTION','🎥','production')}${renderEditingSection(video)}${renderTaskSection(video,'PUBLISHING','🚀','publishing')}</div><div class="detail-panel"><div class="detail-grid"><div class="detail-item"><div class="detail-label">Updated</div><div class="detail-value">${formatDate(video.updated_at)}</div></div><div class="detail-item"><div class="detail-label">Current stage</div><div class="detail-value">${escapeHtml(VIDEO_STAGE_LABELS[video.current_stage] || 'Unknown')}</div></div><div class="detail-item"><div class="detail-label">Up Next</div><div class="detail-value">${escapeHtml(NEXT_ACTION_LABELS[video.next_action] || 'No action required')}</div></div><div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${formatDate(video.created_at)}</div></div></div><form class="edit-form" data-action="edit-video" data-video-id="${video.id}"><label class="form-field"><span>Video title</span><input class="form-input" name="title" value="${escapeHtml(video.title)}" required></label>${state.mutationErrors[video.id]?`<div class="inline-error">${escapeHtml(state.mutationErrors[video.id])}</div>`:''}<div class="form-actions"><button class="danger-btn" type="button" data-action="archive-video" data-video-id="${video.id}">Archive</button><button class="primary-btn" type="submit">Save changes</button></div></form></div></div>`;
}

function renderCard(video) {
  const expanded=state.expandedVideoId===video.id;
  const nextAction=NEXT_ACTION_LABELS[video.next_action] || 'No action required';
  // Assignee names will be displayed when the profiles table is connected.
  return `<section class="video-card-wrap"><button class="video-card" type="button" data-action="toggle-video" data-video-id="${video.id}" aria-expanded="${expanded}"><div class="video-card-top"><div class="video-title">#${video.sequence_number} ${escapeHtml(video.title)}</div><span class="chevron" aria-hidden="true">›</span></div><div class="video-facts"><span class="fact-card stage-fact"><span class="fact-icon" aria-hidden="true">🎬</span><span class="fact-copy"><span class="fact-label">Stage</span><span class="fact-value">${escapeHtml(VIDEO_STAGE_LABELS[video.current_stage] || 'Unknown')}</span></span></span><span class="fact-card up-next-fact"><span class="fact-icon" aria-hidden="true">✅</span><span class="fact-copy"><span class="fact-label">Up Next</span><span class="fact-value">${escapeHtml(nextAction)}</span></span></span></div>${renderStages(video)}</button>${expanded?renderDetails(video):''}</section>`;
}

function renderContent() {
  if(state.isLoading) return `<main class="video-list" aria-label="Loading videos"><div class="skeleton"></div><div class="skeleton"></div></main>`;
  if(state.loadError) return `<main><div class="state-card" role="alert"><h2>Could not load videos. Please try again.</h2><p>Check your connection or sign-in, then retry.</p><button class="primary-btn" type="button" data-action="retry-videos">Retry</button></div></main>`;
  if(!state.videos.length) return `<main><div class="state-card"><h2>No videos available</h2><p>Videos will appear here once they are added.</p><button class="primary-btn" type="button" data-action="open-modal">Create Video</button></div></main>`;
  return `<main class="video-list">${sortVideos(state.videos).map(renderCard).join('')}</main>`;
}

function renderModal() {
  if(!state.modalOpen)return'';
  return `<div class="modal-backdrop" data-action="close-modal"><div class="modal-card" role="dialog" aria-modal="true" aria-label="Create new video"><div class="modal-header"><div><h2 class="modal-title">New Video</h2><p class="modal-copy">Create a fresh production workflow.</p></div><button class="modal-close" type="button" data-action="close-modal" aria-label="Close">×</button></div><form id="new-video-form" class="modal-form"><label class="form-field"><span>Video title</span><input id="video-title-input" class="form-input" name="title" value="${escapeHtml(state.createDraft.title)}" required></label><label class="form-field"><span>Description (optional)</span><textarea class="form-input" name="description" rows="3">${escapeHtml(state.createDraft.description)}</textarea></label>${state.createError?`<div class="inline-error">${escapeHtml(state.createError)}</div>`:''}<div class="modal-actions"><button class="secondary-btn" type="button" data-action="close-modal">Cancel</button><button class="primary-btn" type="submit" ${state.isSaving?'disabled':''}>${state.isSaving?'Creating…':'Create Video'}</button></div></form></div></div>`;
}

function renderAuthLoading() {
  return `<main class="auth-shell" aria-busy="true"><div class="auth-card auth-loading"><img class="auth-logo" src="${logoUrl}" alt=""><div class="app-title">SproutOps</div><p>Restoring your session…</p></div></main>`;
}

function renderLogin() {
  const message=state.authError
    ? `<div id="auth-message" class="auth-message auth-error" role="alert" tabindex="-1">${escapeHtml(state.authError)}</div>`
    : state.authStatus
      ? `<div id="auth-message" class="auth-message" role="status">${escapeHtml(state.authStatus)}</div>`
      : '';
  if(state.authStep==='link-sent') {
    return `<main class="auth-shell"><section class="auth-card" aria-labelledby="auth-title"><img class="auth-logo" src="${logoUrl}" alt="Giggle Sprouts logo"><h1 id="auth-title">Check your email</h1><p>We sent a secure login link to:<br><strong>${escapeHtml(state.authEmail)}</strong></p><p>Open the email and click the link to continue to SproutOps.</p>${message}<div class="auth-secondary-actions"><button class="secondary-btn" type="button" data-action="resend-link" ${state.authBusy||state.resendSeconds>0?'disabled':''}>${state.resendSeconds>0?`Resend link in ${state.resendSeconds}s`:'Resend login link'}</button><button class="text-btn" type="button" data-action="change-email">Use a different email</button></div></section></main>`;
  }
  return `<main class="auth-shell"><section class="auth-card" aria-labelledby="auth-title"><img class="auth-logo" src="${logoUrl}" alt="Giggle Sprouts logo"><h1 id="auth-title">Welcome to SproutOps</h1><p>Sign in with your email to continue.</p><form id="email-form" class="auth-form" aria-busy="${state.authBusy}"><label for="email-input">Email address</label><input id="email-input" class="form-input" name="email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" aria-describedby="auth-message" required><button class="primary-btn" type="submit" ${state.authBusy?'disabled':''}>${state.authBusy?'Sending…':'Send login link'}</button></form>${message}</section></main>`;
}

function render() {
  if(!skipLogin&&state.isAuthLoading) document.getElementById('app').innerHTML=renderAuthLoading();
  else if(!skipLogin&&!state.session) document.getElementById('app').innerHTML=renderLogin();
  else document.getElementById('app').innerHTML=`<div class="page-shell">${header()}${renderContent()}</div><button class="new-video-btn new-video-fab" type="button" data-action="open-modal" aria-label="New Video">+</button>${renderModal()}`;
  bindEvents();
}

async function loadVideos() {
  if(!skipLogin&&!state.session)return;
  state.isLoading=true; state.loadError=null; render();
  try {
    state.videos=sortVideos(await getVideos());
    state.isLoading=false; render();
    await loadTasks(state.videos.map((video)=>video.id));
  }
  catch(error) { console.error('Could not load videos:',error); state.loadError=error; }
  finally { state.isLoading=false; render(); }
}

async function loadTasks(videoIds) {
  const ids=Array.isArray(videoIds)?videoIds:[videoIds];
  if(!ids.length)return;
  ids.forEach((id)=>{state.taskLoading[id]=true;delete state.taskLoadErrors[id];});render();
  try {
    const tasks=await getVideoTasks(ids);
    ids.forEach((id)=>{state.tasksByVideoId[id]=tasks.filter((task)=>task.video_id===id);});
  } catch(error) {
    console.error('Could not load video tasks:',error);
    ids.forEach((id)=>{state.taskLoadErrors[id]=true;});
  } finally {
    ids.forEach((id)=>{delete state.taskLoading[id];});render();
  }
}

async function toggleTask(videoId, taskId, completed) {
  if(state.pendingTaskIds[taskId])return;
  const tasks=state.tasksByVideoId[videoId] || [];
  const task=tasks.find((item)=>item.id===taskId);
  if(!task)return;
  const previous={...task};
  Object.assign(task,{is_completed:completed,completed_at:completed?new Date().toISOString():null});
  state.pendingTaskIds[taskId]=true;delete state.taskMutationErrors[taskId];render();
  try {
    const saved=await updateVideoTaskCompletion(taskId,completed);
    state.tasksByVideoId[videoId]=tasks.map((item)=>item.id===taskId?saved:item);
  } catch(error) {
    console.error('Could not update video task:',error);
    state.tasksByVideoId[videoId]=tasks.map((item)=>item.id===taskId?previous:item);
    state.taskMutationErrors[taskId]='Could not save task. Try again.';
  } finally {
    delete state.pendingTaskIds[taskId];render();
  }
}

async function requireAuthenticated() { return skipLogin||Boolean(state.session); }
async function openModal() { if(!await requireAuthenticated())return; state.modalOpen=true; state.createError=null; state.createDraft={title:'',description:''}; render(); document.getElementById('video-title-input')?.focus(); }
function closeModal() { if(state.isSaving)return; state.modalOpen=false; state.createError=null; state.createDraft={title:'',description:''}; render(); }

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
function authErrorMessage(error, fallback) {
  const message=String(error?.message || '').toLowerCase();
  if(message.includes('rate')||message.includes('seconds'))return 'Please wait before requesting another login link.';
  if(message.includes('fetch')||message.includes('network'))return "We couldn't reach the server. Check your connection and try again.";
  return fallback;
}

let resendTimer;
function startResendCooldown() {
  clearInterval(resendTimer); state.resendSeconds=60;
  resendTimer=setInterval(()=>{state.resendSeconds=Math.max(0,state.resendSeconds-1);if(!state.resendSeconds)clearInterval(resendTimer);render();},1000);
}

async function requestLoginLink(email, isResend=false) {
  if(state.authBusy||state.resendSeconds>0&&isResend)return;
  state.authBusy=true; state.authError=null; state.authStatus=null; render();
  try {
    await sendLoginLink(email);
    state.authEmail=email; state.authStep='link-sent';
    state.authStatus=isResend?'A new login link was sent.':'A login link was sent. It may take a moment to arrive.';
    startResendCooldown();
  } catch(error) {
    console.error('Could not send login link:',error?.message || 'Unknown authentication error');
    state.authError=authErrorMessage(error,"We couldn't send the login link. Please try again.");
  } finally {
    state.authBusy=false; render();
    document.getElementById('auth-message')?.focus();
  }
}

function bindEvents() {
  const emailForm=document.getElementById('email-form');
  if(emailForm)emailForm.addEventListener('submit',async(event)=>{event.preventDefault();const email=new FormData(emailForm).get('email')?.toString().trim().toLowerCase()||'';state.authEmail=email;if(!validEmail(email)){state.authError='Enter a valid email address.';state.authStatus=null;render();document.getElementById('auth-message')?.focus();return;}await requestLoginLink(email);});
  document.querySelector('[data-action="resend-link"]')?.addEventListener('click',()=>requestLoginLink(state.authEmail,true));
  document.querySelector('[data-action="change-email"]')?.addEventListener('click',()=>{clearInterval(resendTimer);state.authStep='email';state.authError=null;state.authStatus=null;state.resendSeconds=0;render();document.getElementById('email-input')?.focus();});
  document.querySelector('[data-action="sign-out"]')?.addEventListener('click',async()=>{try{await signOut();state.session=null;state.videos=[];state.expandedVideoId=null;state.modalOpen=false;state.authStep='email';state.authError=null;state.authStatus=null;render();}catch(error){console.error('Could not sign out:',error?.message || 'Unknown authentication error');}});
  document.querySelectorAll('[data-action="open-modal"]').forEach((button)=>button.addEventListener('click',openModal));
  document.querySelectorAll('[data-action="close-modal"]').forEach((element)=>element.addEventListener('click',(event)=>{if(event.target===event.currentTarget||event.target.closest('button'))closeModal();}));
  document.querySelectorAll('[data-action="retry-videos"]').forEach((button)=>button.addEventListener('click',loadVideos));
  document.querySelectorAll('[data-action="retry-tasks"]').forEach((button)=>button.addEventListener('click',()=>loadTasks(button.dataset.videoId)));
  document.querySelectorAll('[data-action="toggle-task"]').forEach((checkbox)=>checkbox.addEventListener('change',()=>toggleTask(checkbox.dataset.videoId,checkbox.dataset.taskId,checkbox.checked)));
  document.querySelectorAll('[data-action="toggle-video"]').forEach((button)=>button.addEventListener('click',()=>{state.expandedVideoId=state.expandedVideoId===button.dataset.videoId?null:button.dataset.videoId;render();}));
  document.querySelectorAll('[data-action="toggle-section"]').forEach((button)=>button.addEventListener('click',()=>{const key=sectionKey(button.dataset.videoId,button.dataset.sectionId);state.expandedSections[key]=!state.expandedSections[key];render();}));
  document.querySelectorAll('form[data-action="edit-video"]').forEach((form)=>form.addEventListener('submit',async(event)=>{event.preventDefault();if(!await requireAuthenticated())return;const id=form.dataset.videoId;const data=new FormData(form);const title=data.get('title')?.toString().trim();if(!title)return;try{const updated=await updateVideo(id,{title});state.videos=sortVideos(state.videos.map((video)=>video.id===id?updated:video));delete state.mutationErrors[id];}catch(error){console.error('Could not update video:',error);state.mutationErrors[id]='Could not save the changes.';}render();}));
  document.querySelectorAll('[data-action="archive-video"]').forEach((button)=>button.addEventListener('click',async()=>{if(!await requireAuthenticated())return;const id=button.dataset.videoId;if(!window.confirm('Archive this video? It will be removed from the active board but retained in the database.'))return;try{await archiveVideo(id);state.videos=state.videos.filter((video)=>video.id!==id);state.expandedVideoId=null;}catch(error){console.error('Could not archive video:',error);state.mutationErrors[id]='Could not archive the video.';}render();}));
  const form=document.getElementById('new-video-form');if(form)form.addEventListener('submit',async(event)=>{event.preventDefault();if(!await requireAuthenticated())return;const data=new FormData(form);const title=data.get('title')?.toString().trim();const description=data.get('description')?.toString()||'';if(!title)return;state.createDraft={title,description};state.isSaving=true;state.createError=null;render();try{const created=await createVideo({title,description});state.videos=sortVideos([...state.videos,created]);state.modalOpen=false;state.createDraft={title:'',description:''};await loadTasks(created.id);}catch(error){console.error('Could not create video:',error);state.createError='Could not create the video.';}finally{state.isSaving=false;render();}});
}

document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&state.modalOpen)closeModal();});
render();

// Supabase persists the refresh token and refreshes short-lived access
// tokens automatically. Session lifetime is controlled by the Supabase
// Auth project settings, not by a frontend 45-day timer.
const unsubscribeAuth=onAuthStateChange((session)=>{
  const hadSession=Boolean(state.session);
  state.session=session; state.authBusy=false;
  if(!session){state.videos=[];state.tasksByVideoId={};state.modalOpen=false;state.expandedVideoId=null;}
  if(!state.isAuthLoading){render();if(session&&!hadSession)loadVideos();}
});
window.addEventListener('beforeunload',unsubscribeAuth,{once:true});

async function initializeAuth() {
  try { state.session=await getSession(); }
  catch(error) { console.error('Could not restore session:',error?.message || 'Unknown authentication error'); state.session=null; }
  finally { state.isAuthLoading=false; render(); }
  if(skipLogin||state.session)await loadVideos();
}

initializeAuth();
