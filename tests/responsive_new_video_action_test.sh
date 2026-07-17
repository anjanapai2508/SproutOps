#!/usr/bin/env bash
set -euo pipefail

rg -q '\.header \{[^}]*position: sticky' app/index.html
rg -q 'backdrop-filter: blur' app/index.html
rg -q 'class="new-video-btn header-new-video-btn"' app/index.html
rg -q 'class="new-video-btn new-video-fab"' app/index.html
rg -q '@media \(max-width: 640px\)' app/index.html
rg -q '\.header-new-video-btn \{ display: none; \}' app/index.html
rg -q '\.new-video-fab \{ display: inline-flex; \}' app/index.html
