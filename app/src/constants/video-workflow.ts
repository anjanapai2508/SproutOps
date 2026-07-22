import type { EditVersion, EditVersionStatus, Video, VideoNextAction, VideoStage, WorkflowAction } from '../types/domain';

export interface WorkflowStep { key:WorkflowAction; label:string; stage:Exclude<VideoStage, 'completed'|'on_hold'> }

export const VIDEO_WORKFLOW = [
  { key:'write_script', label:'Write Script', stage:'pre_production' },
  { key:'review_script', label:'Review Script', stage:'pre_production' },
  { key:'shoot_video', label:'Shoot Video', stage:'production' },
  { key:'record_voice', label:'Record Voice-over', stage:'production' },
  { key:'start_editing', label:'Start Editing', stage:'editing' },
  { key:'continue_editing', label:'Continue Editing', stage:'editing' },
  { key:'submit_for_review', label:'Submit for Review', stage:'editing' },
  { key:'review_edit', label:'Review Edit', stage:'editing' },
  { key:'make_edit_changes', label:'Make Edit Changes', stage:'editing' },
  { key:'approve_edit', label:'Approve Edit', stage:'editing' },
  { key:'create_thumbnail', label:'Create Thumbnail', stage:'publishing' },
  { key:'prepare_metadata', label:'Prepare Metadata', stage:'publishing' },
  { key:'review_publishing_details', label:'Review Publishing Details', stage:'publishing' },
  { key:'publish_video', label:'Publish Video', stage:'publishing' }
] as const satisfies readonly WorkflowStep[];

export const VIDEO_STAGE_LABELS:Record<VideoStage,string> = {
  pre_production:'Pre-production', production:'Production', editing:'Editing',
  publishing:'Publishing', completed:'Completed', on_hold:'On Hold'
};

export const NEXT_ACTION_LABELS:Record<VideoNextAction,string> = Object.fromEntries([
  ...VIDEO_WORKFLOW.map(({key,label})=>[key,label]),
  ['no_action_required','No Action Required']
]) as Record<VideoNextAction,string>;

export const EDIT_STATUS_LABELS:Record<EditVersionStatus,string> = {
  draft:'Draft', Editing:'Editing', 'In-Review':'In Review', Complete:'Complete',
  approved:'Approved', superseded:'Superseded'
};

function completedKeys(video:Video):Set<WorkflowAction> {
  if(Array.isArray(video.completed_actions))return new Set(video.completed_actions);
  if(video.current_stage==='completed'&&video.next_action==='no_action_required')return new Set(VIDEO_WORKFLOW.map(({key})=>key));
  const index=VIDEO_WORKFLOW.findIndex(({key})=>key===video.next_action);
  return new Set(index<0?[]:VIDEO_WORKFLOW.slice(0,index).map(({key})=>key));
}

export function deriveWorkflowItems(video:Video) {
  const completed=completedKeys(video);
  const current=VIDEO_WORKFLOW.find(({key})=>!completed.has(key))?.key||null;
  return VIDEO_WORKFLOW.map((step)=>({
    ...step, completed:completed.has(step.key), current:step.key===current, enabled:true
  }));
}

export function withEditingVersion(video:Video,version:EditVersion):Video {
  return {...video,edit_versions:[...(video.edit_versions||[]).filter(({id})=>id!==version.id),version]};
}

export type ChecklistUpdate = Pick<Video,'completed_actions'|'current_stage'|'next_action'|'published_at'>;

export function getChecklistUpdate(video:Video,actionKey:WorkflowAction,isCompleted:boolean):ChecklistUpdate {
  if(!VIDEO_WORKFLOW.some(({key})=>key===actionKey))throw new Error(`Unknown checklist action: ${actionKey}`);
  const completed=completedKeys(video);
  if(isCompleted)completed.add(actionKey);else completed.delete(actionKey);
  const completed_actions=VIDEO_WORKFLOW.filter(({key})=>completed.has(key)).map(({key})=>key);
  const next=VIDEO_WORKFLOW.find(({key})=>!completed.has(key));
  if(next)return {completed_actions,current_stage:next.stage,next_action:next.key,published_at:null};
  return {completed_actions,current_stage:'completed',next_action:'no_action_required',published_at:video.published_at||new Date().toISOString()};
}

export function getEditingCompletionUpdate(video:Video):ChecklistUpdate {
  const completed=completedKeys(video);
  VIDEO_WORKFLOW.filter(({stage})=>stage!=='publishing').forEach(({key})=>completed.add(key));
  const completed_actions=VIDEO_WORKFLOW.filter(({key})=>completed.has(key)).map(({key})=>key);
  const next=VIDEO_WORKFLOW.find(({key})=>!completed.has(key));
  if(next)return {completed_actions,current_stage:next.stage,next_action:next.key,published_at:null};
  return {completed_actions,current_stage:'completed',next_action:'no_action_required',published_at:video.published_at||new Date().toISOString()};
}
