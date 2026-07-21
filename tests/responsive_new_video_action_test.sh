#!/usr/bin/env bash
set -euo pipefail

rg -q 'sticky top-0' app/src/components/AppHeader.tsx
rg -q 'backdrop-blur-xl' app/src/components/AppHeader.tsx
rg -q 'header-new-video-btn' app/src/components/AppHeader.tsx
rg -q 'new-video-fab' app/src/App.tsx
rg -q 'max-sm:hidden' app/src/components/AppHeader.tsx
rg -q 'max-sm:grid' app/src/App.tsx
