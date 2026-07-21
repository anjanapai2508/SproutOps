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

export interface Video {
  id: string;
  sequence_number: number;
  title: string;
  description: string | null;
  current_stage: VideoStage;
  next_action: VideoNextAction;
  completed_actions: VideoNextAction[];
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

export type EditVersionStatus = 'draft' | 'Editing' | 'In-Review' | 'Complete' | 'approved' | 'superseded';
export interface EditVersion { id:string; video_id:string; version_number:number; status:EditVersionStatus; assigned_editor:string|null; created_by:string|null; reviewed_by:string|null; created_at:string; submitted_for_review_at:string|null; reviewed_at:string|null; }
export interface EditComment { id:string; version_id:string; author_id:string|null; author_name_snapshot:string; author_role_snapshot:string; message:string; created_at:string; }
export interface Profile { id:string; display_name:string|null; }
