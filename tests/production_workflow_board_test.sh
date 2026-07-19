#!/usr/bin/env bash
set -euo pipefail

rg -q "from\('videos'\)" app/src/services/videos.js
rg -q "is\('archived_at', null\)" app/src/services/videos.js
rg -q "order\('sequence_number', \{ ascending: true \}\)" app/src/services/videos.js
rg -q "from\('video_tasks'\)" app/src/services/videoTasks.js
rg -q 'edit_versions!edit_versions_video_id_fkey' app/src/services/videos.js
! rg -q "from\('(profiles|roles|profile_roles|edit_versions|edit_comments)'\)" app/src
