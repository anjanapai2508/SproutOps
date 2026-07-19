export type VideoStage =
  | 'pre_production'
  | 'production'
  | 'editing'
  | 'publishing'
  | 'completed'
  | 'on_hold';

export type VideoNextAction =
  | 'write_script'
  | 'review_script'
  | 'shoot_video'
  | 'record_voice'
  | 'start_editing'
  | 'continue_editing'
  | 'submit_for_review'
  | 'review_edit'
  | 'make_edit_changes'
  | 'approve_edit'
  | 'create_thumbnail'
  | 'prepare_metadata'
  | 'review_publishing_details'
  | 'publish_video'
  | 'no_action_required';

export interface VideoTask {
  id: string;
  video_id: string;
  task_key: string;
  title: string;
  stage: VideoStage;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  sequence_number: number;
  title: string;
  description: string | null;
  current_stage: VideoStage;
  next_action: VideoNextAction;
  next_action_assignee_id: string | null;
  next_action_version_id: string | null;
  next_action_note: string | null;
  next_action_updated_at: string;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}
