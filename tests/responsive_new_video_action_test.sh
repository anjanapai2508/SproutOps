#!/usr/bin/env bash
set -euo pipefail

rg -q '\.header \{ position:sticky' app/index.html
rg -q 'backdrop-filter:blur' app/index.html
rg -q 'header-new-video-btn' app/src/main.js
rg -q 'new-video-fab' app/src/main.js
rg -q '\.header-new-video-btn \{ display:none; \}' app/index.html
rg -q '\.new-video-fab \{ display:inline-grid;' app/index.html
