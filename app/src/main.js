import { archiveVideo, createVideo, getVideos, updateVideo } from './services/videos.js';
import { getSession } from './services/auth.js';
import { NEXT_ACTION_LABELS, VIDEO_STAGE_LABELS } from './constants/video-labels.js';

const state = { videos:[], isLoading:true, loadError:null, authNotice:null, modalOpen:false, isSaving:false, createError:null, createDraft:{title:'',description:''}, expandedVideoId:null, expandedSections:{}, mutationErrors:{} };
const stageIcons = { pre_production:'📝', production:'🎥', editing:'✂️', publishing:'🚀', completed:'✓', on_hold:'⏸' };
const pipeline = ['pre_production','production','editing','publishing','completed'];

const escapeHtml = (value='') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const formatDate = (value) => value ? new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)) : '—';
const sortVideos = (videos) => [...videos].sort((a,b)=>a.sequence_number-b.sequence_number);
const header = () => `<header class="header"><div class="brand-row"><img class="brand-logo" src="assets/logo_new.png" alt="Giggle Sprouts logo"><div><div class="app-title">SproutOps</div><div class="header-copy">Production operating system</div></div></div><button class="new-video-btn header-new-video-btn" type="button" data-action="open-modal">+ New Video</button></header>`;

function renderStages(video) {
  return `<div class="stage-summary" aria-label="Production pipeline">${pipeline.map((stage)=>`<div class="stage-summary-item ${video.current_stage===stage?'current':''}"><span class="stage-symbol">${stageIcons[stage]}</span><span class="stage-state">${escapeHtml(VIDEO_STAGE_LABELS[stage])}</span></div>`).join('')}</div>`;
}

const sectionKey = (videoId, section) => `${videoId}:${section}`;

function renderTaskSection(video, title, icon, stage) {
  const expanded=Boolean(state.expandedSections[sectionKey(video.id,stage)]);
  const tasks=[...(video.video_tasks || [])].filter((task)=>task.stage===stage).sort((a,b)=>a.sort_order-b.sort_order);
  return `<section class="detail-section"><button class="section-heading stage-${stage.replace('_','-')}" type="button" data-action="toggle-section" data-video-id="${video.id}" data-section-id="${stage}" aria-expanded="${expanded}"><span>${icon} ${title}</span><span class="section-chevron" aria-hidden="true">›</span></button>${expanded?`<div class="section-content">${tasks.length?tasks.map((task)=>`<div class="task-row ${task.is_completed?'completed':''}"><span class="task-check" aria-hidden="true">${task.is_completed?'✓':'○'}</span><span class="task-label">${escapeHtml(task.title)}</span></div>`).join(''):`<div class="section-empty">No ${title.toLowerCase()} tasks yet.</div>`}</div>`:''}</section>`;
}

function renderEditingSection(video) {
  const expanded=Boolean(state.expandedSections[sectionKey(video.id,'editing')]);
  const versions=[...(video.edit_versions || [])].sort((a,b)=>b.version_number-a.version_number);
  return `<section class="detail-section"><button class="section-heading stage-editing" type="button" data-action="toggle-section" data-video-id="${video.id}" data-section-id="editing" aria-expanded="${expanded}"><span>✂️ EDITING</span><span class="section-chevron" aria-hidden="true">›</span></button>${expanded?`<div class="section-content editing-content">${versions.length?versions.map((version)=>`<div class="version-card"><div><div class="eyebrow">Version ${version.version_number}</div><div class="version-name">${escapeHtml(version.status.replaceAll('_',' '))}</div></div><div class="editing-meta">${(version.edit_comments || []).length} comment${(version.edit_comments || []).length===1?'':'s'}</div></div>`).join(''):`<div class="section-empty">No editing versions yet.</div>`}</div>`:''}</section>`;
}

function renderDetails(video) {
  return `<div class="accordion-details"><div class="detail-workflow">${renderTaskSection(video,'PRE-PRODUCTION','📝','pre_production')}${renderTaskSection(video,'PRODUCTION','🎥','production')}${renderEditingSection(video)}${renderTaskSection(video,'PUBLISHING','🚀','publishing')}</div><div class="detail-panel"><div class="detail-grid"><div class="detail-item"><div class="detail-label">Description</div><div class="detail-value">${escapeHtml(video.description || 'No description')}</div></div><div class="detail-item"><div class="detail-label">Current stage</div><div class="detail-value">${escapeHtml(VIDEO_STAGE_LABELS[video.current_stage] || 'Unknown')}</div></div><div class="detail-item"><div class="detail-label">Next action</div><div class="detail-value">${escapeHtml(NEXT_ACTION_LABELS[video.next_action] || 'No action required')}</div></div><div class="detail-item"><div class="detail-label">Created</div><div class="detail-value">${formatDate(video.created_at)}</div></div></div><form class="edit-form" data-action="edit-video" data-video-id="${video.id}"><label class="form-field"><span>Video title</span><input class="form-input" name="title" value="${escapeHtml(video.title)}" required></label><label class="form-field"><span>Description</span><textarea class="form-input" name="description" rows="3">${escapeHtml(video.description || '')}</textarea></label>${state.mutationErrors[video.id]?`<div class="inline-error">${escapeHtml(state.mutationErrors[video.id])}</div>`:''}<div class="form-actions"><button class="danger-btn" type="button" data-action="archive-video" data-video-id="${video.id}">Archive</button><button class="primary-btn" type="submit">Save changes</button></div></form></div></div>`;
}

function renderCard(video) {
  const expanded=state.expandedVideoId===video.id;
  const nextAction=NEXT_ACTION_LABELS[video.next_action] || 'No action required';
  // Assignee names will be displayed when the profiles table is connected.
  return `<section class="video-card-wrap"><button class="video-card" type="button" data-action="toggle-video" data-video-id="${video.id}" aria-expanded="${expanded}"><div class="video-card-top"><div class="video-title">#${video.sequence_number} ${escapeHtml(video.title)}</div><span class="chevron" aria-hidden="true">›</span></div><div class="video-facts"><span class="fact-pill">${escapeHtml(VIDEO_STAGE_LABELS[video.current_stage] || 'Unknown')}</span><span class="fact-pill">${escapeHtml(nextAction)}</span></div>${video.next_action_note?`<div class="next-note">${escapeHtml(video.next_action_note)}</div>`:''}<div class="updated-at">Updated ${formatDate(video.updated_at)}</div>${renderStages(video)}</button>${expanded?renderDetails(video):''}</section>`;
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

function render() {
  const authNotice=state.authNotice?`<div class="auth-notice" role="status">${escapeHtml(state.authNotice)}</div>`:'';
  document.getElementById('app').innerHTML=`<div class="page-shell">${header()}${authNotice}${renderContent()}</div><button class="new-video-btn new-video-fab" type="button" data-action="open-modal" aria-label="New Video">+</button>${renderModal()}`;
  bindEvents();
}

async function loadVideos() {
  state.isLoading=true; state.loadError=null; render();
  try { state.videos=sortVideos(await getVideos()); }
  catch(error) { console.error('Could not load videos:',error); state.loadError=error; }
  finally { state.isLoading=false; render(); }
}

async function requireAuthenticated() { try { if(await getSession()) { state.authNotice=null; return true; } } catch(error) { console.error('Could not verify sign-in:',error); } state.authNotice='Sign in is required to manage videos.'; render(); return false; }
async function openModal() { if(!await requireAuthenticated())return; state.modalOpen=true; state.createError=null; state.createDraft={title:'',description:''}; render(); document.getElementById('video-title-input')?.focus(); }
function closeModal() { if(state.isSaving)return; state.modalOpen=false; state.createError=null; state.createDraft={title:'',description:''}; render(); }

function bindEvents() {
  document.querySelectorAll('[data-action="open-modal"]').forEach((button)=>button.addEventListener('click',openModal));
  document.querySelectorAll('[data-action="close-modal"]').forEach((element)=>element.addEventListener('click',(event)=>{if(event.target===event.currentTarget||event.target.closest('button'))closeModal();}));
  document.querySelectorAll('[data-action="retry-videos"]').forEach((button)=>button.addEventListener('click',loadVideos));
  document.querySelectorAll('[data-action="toggle-video"]').forEach((button)=>button.addEventListener('click',()=>{state.expandedVideoId=state.expandedVideoId===button.dataset.videoId?null:button.dataset.videoId;render();}));
  document.querySelectorAll('[data-action="toggle-section"]').forEach((button)=>button.addEventListener('click',()=>{const key=sectionKey(button.dataset.videoId,button.dataset.sectionId);state.expandedSections[key]=!state.expandedSections[key];render();}));
  document.querySelectorAll('form[data-action="edit-video"]').forEach((form)=>form.addEventListener('submit',async(event)=>{event.preventDefault();if(!await requireAuthenticated())return;const id=form.dataset.videoId;const data=new FormData(form);const title=data.get('title')?.toString().trim();if(!title)return;try{const updated=await updateVideo(id,{title,description:data.get('description')?.toString().trim()||null});state.videos=sortVideos(state.videos.map((video)=>video.id===id?updated:video));delete state.mutationErrors[id];}catch(error){console.error('Could not update video:',error);state.mutationErrors[id]='Could not save the changes.';}render();}));
  document.querySelectorAll('[data-action="archive-video"]').forEach((button)=>button.addEventListener('click',async()=>{if(!await requireAuthenticated())return;const id=button.dataset.videoId;if(!window.confirm('Archive this video? It will be removed from the active board but retained in the database.'))return;try{await archiveVideo(id);state.videos=state.videos.filter((video)=>video.id!==id);state.expandedVideoId=null;}catch(error){console.error('Could not archive video:',error);state.mutationErrors[id]='Could not archive the video.';}render();}));
  const form=document.getElementById('new-video-form');if(form)form.addEventListener('submit',async(event)=>{event.preventDefault();if(!await requireAuthenticated())return;const data=new FormData(form);const title=data.get('title')?.toString().trim();const description=data.get('description')?.toString()||'';if(!title)return;state.createDraft={title,description};state.isSaving=true;state.createError=null;render();try{const created=await createVideo({title,description});state.videos=sortVideos([...state.videos,created]);state.modalOpen=false;state.createDraft={title:'',description:''};}catch(error){console.error('Could not create video:',error);state.createError='Could not create the video.';}finally{state.isSaving=false;render();}});
}

document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&state.modalOpen)closeModal();});
render();
loadVideos();
