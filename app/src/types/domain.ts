import type { Database } from './database';

export type Video = Database['public']['Tables']['videos']['Row'];
export type EditVersion = Database['public']['Tables']['edit_versions']['Row'];
export type EditComment = Database['public']['Tables']['edit_comments']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type VideoStage = Video['current_stage'];
export type VideoNextAction = Video['next_action'];
export type WorkflowAction = Exclude<VideoNextAction, 'no_action_required'>;
export type EditVersionStatus = EditVersion['status'];

export interface EditingDetails {
  activeVersion: EditVersion | null;
  versions: EditVersion[];
  comments: EditComment[];
  profilesById: Record<string, Pick<Profile, 'id' | 'display_name'>>;
}
