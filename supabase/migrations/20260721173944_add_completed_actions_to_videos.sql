alter table public.videos
add column completed_actions text[] not null default '{}';

alter table public.videos
add constraint videos_completed_actions_valid
check (
  completed_actions <@ array[
    'write_script', 'review_script', 'shoot_video', 'record_voice',
    'start_editing', 'continue_editing', 'submit_for_review', 'review_edit',
    'make_edit_changes', 'approve_edit', 'create_thumbnail', 'prepare_metadata',
    'review_publishing_details', 'publish_video'
  ]::text[]
);

with workflow as (
  select array[
    'write_script', 'review_script', 'shoot_video', 'record_voice',
    'start_editing', 'continue_editing', 'submit_for_review', 'review_edit',
    'make_edit_changes', 'approve_edit', 'create_thumbnail', 'prepare_metadata',
    'review_publishing_details', 'publish_video'
  ]::text[] as actions
)
update public.videos as video
set completed_actions = case
  when video.current_stage = 'completed' and video.next_action = 'no_action_required'
    then workflow.actions
  when array_position(workflow.actions, video.next_action::text) > 1
    then workflow.actions[1:array_position(workflow.actions, video.next_action::text) - 1]
  else '{}'
end
from workflow;
