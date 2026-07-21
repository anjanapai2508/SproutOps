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
];

export const VIDEO_STAGE_LABELS = {
  pre_production:'Pre-production', production:'Production', editing:'Editing',
  publishing:'Publishing', completed:'Completed', on_hold:'On Hold'
};

export const NEXT_ACTION_LABELS = Object.fromEntries([
  ...VIDEO_WORKFLOW.map(({key,label})=>[key,label]),
  ['no_action_required','No Action Required']
]);

export const EDIT_STATUS_LABELS = {
  draft:'Draft', Editing:'Editing', 'In-Review':'In Review', Complete:'Complete',
  approved:'Approved', superseded:'Superseded'
};

export function deriveWorkflowItems(video) {
  if(video.current_stage==='completed'&&video.next_action==='no_action_required') {
    return VIDEO_WORKFLOW.map((step)=>({...step,completed:true,current:false,enabled:false}));
  }
  const index=VIDEO_WORKFLOW.findIndex(({key})=>key===video.next_action);
  if(index<0)throw new Error(`Unknown workflow action: ${video.next_action || 'missing'}`);
  return VIDEO_WORKFLOW.map((step,itemIndex)=>({
    ...step,
    completed:itemIndex<index,
    current:itemIndex===index,
    enabled:itemIndex===index&&video.current_stage!=='on_hold'
  }));
}

export function getNextWorkflowUpdate(video) {
  if(video.current_stage==='on_hold')throw new Error('Video is on hold and cannot advance');
  const index=VIDEO_WORKFLOW.findIndex(({key})=>key===video.next_action);
  if(index<0)throw new Error(`Unknown workflow action: ${video.next_action || 'missing'}`);
  const next=VIDEO_WORKFLOW[index+1];
  if(next)return {current_stage:next.stage,next_action:next.key};
  return {
    current_stage:'completed',next_action:'no_action_required',
    ...(video.published_at?{}:{published_at:new Date().toISOString()})
  };
}
