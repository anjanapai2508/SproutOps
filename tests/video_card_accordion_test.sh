#!/usr/bin/env bash
set -euo pipefail

rg -q 'expandedVideoId' app/src/main.js
rg -q 'data-action="toggle-video"' app/src/main.js
rg -q 'renderDetails' app/src/main.js
rg -q 'renderTaskSection' app/src/main.js
rg -q 'renderEditingSection' app/src/main.js
rg -q 'data-action="toggle-section"' app/src/main.js
