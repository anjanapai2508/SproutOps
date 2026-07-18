/** @type {Record<import('../types/video').VideoNextAction, string>} */
export const NEXT_ACTION_LABELS = {
  write_script: 'Write the script',
  review_script: 'Review the script',
  shoot_video: 'Shoot the video',
  record_voice: 'Record the voice-over',
  start_editing: 'Start editing',
  continue_editing: 'Continue editing',
  submit_for_review: 'Submit the edit for review',
  review_edit: 'Review the latest edit',
  make_edit_changes: 'Apply reviewer changes',
  approve_edit: 'Approve the edit',
  create_thumbnail: 'Create the thumbnail',
  prepare_metadata: 'Prepare description and tags',
  review_publishing_details: 'Review publishing details',
  publish_video: 'Publish the video',
  no_action_required: 'No action required'
};

export const VIDEO_STAGE_LABELS = {
  pre_production: 'Pre-production',
  production: 'Production',
  editing: 'Editing',
  publishing: 'Publishing',
  completed: 'Completed',
  on_hold: 'On hold'
};
