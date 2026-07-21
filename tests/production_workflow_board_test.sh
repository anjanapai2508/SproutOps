#!/usr/bin/env bash
set -euo pipefail

rg -q "from\('videos'\)" app/src/services/videos.js
rg -q "is\('archived_at', null\)" app/src/services/videos.js
rg -q "order\('sequence_number', \{ ascending: true \}\)" app/src/services/videos.js
rg -q 'edit_versions!edit_versions_video_id_fkey' app/src/services/videos.js
if rg -n 'video_tasks|create_default_video_tasks|handle_new_video|mockTasks|defaultTasks' app supabase; then
  echo 'Deleted video_tasks workflow is still referenced' >&2
  exit 1
fi
