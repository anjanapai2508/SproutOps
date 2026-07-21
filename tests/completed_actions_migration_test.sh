#!/usr/bin/env bash
set -euo pipefail

migration="supabase/migrations/20260721173944_add_completed_actions_to_videos.sql"
test -f "$migration"
rg -q 'add column completed_actions text\[\] not null default' "$migration"
rg -q 'videos_completed_actions_valid' "$migration"
rg -q 'update public\.videos' "$migration"
rg -Fq 'array_position(workflow.actions, video.next_action::text)' "$migration"
rg -Fq "video.current_stage = 'completed' and video.next_action = 'no_action_required'" "$migration"
rg -q "'publish_video'" "$migration"
