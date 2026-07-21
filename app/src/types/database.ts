export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type VideoStage = 'pre_production' | 'production' | 'editing' | 'publishing' | 'completed' | 'on_hold';
type WorkflowAction = 'write_script' | 'review_script' | 'shoot_video' | 'record_voice' | 'start_editing' | 'continue_editing' | 'submit_for_review' | 'review_edit' | 'make_edit_changes' | 'approve_edit' | 'create_thumbnail' | 'prepare_metadata' | 'review_publishing_details' | 'publish_video';
type EditStatus = 'draft' | 'Editing' | 'In-Review' | 'Complete' | 'approved' | 'superseded';

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: { id:string; sequence_number:number; title:string; description:string|null; current_stage:VideoStage; next_action:WorkflowAction|'no_action_required'; completed_actions:WorkflowAction[]; next_action_assignee_id:string|null; next_action_version_id:string|null; next_action_note:string|null; next_action_updated_at:string; created_by:string|null; published_at:string|null; created_at:string; updated_at:string; archived_at:string|null };
        Insert: { title:string; description?:string|null; current_stage?:VideoStage; next_action?:WorkflowAction|'no_action_required'; completed_actions?:WorkflowAction[] };
        Update: Partial<Database['public']['Tables']['videos']['Row']>;
        Relationships: [];
      };
      edit_versions: {
        Row: { id:string; video_id:string; version_number:number; status:EditStatus; assigned_editor:string|null; created_by:string|null; reviewed_by:string|null; created_at:string; submitted_for_review_at:string|null; reviewed_at:string|null };
        Insert: Partial<Database['public']['Tables']['edit_versions']['Row']> & { video_id:string };
        Update: Partial<Database['public']['Tables']['edit_versions']['Row']>;
        Relationships: [];
      };
      edit_comments: {
        Row: { id:string; version_id:string; author_id:string|null; author_name_snapshot:string; author_role_snapshot:string; message:string; created_at:string };
        Insert: Omit<Database['public']['Tables']['edit_comments']['Row'], 'id'|'created_at'>;
        Update: Partial<Database['public']['Tables']['edit_comments']['Row']>;
        Relationships: [];
      };
      profiles: {
        Row: { id:string; display_name:string|null };
        Insert: { id:string; display_name?:string|null };
        Update: { display_name?:string|null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
