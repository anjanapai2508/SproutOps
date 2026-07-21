#!/usr/bin/env bash
set -euo pipefail

rg -q 'max-sm:text-xl' app/src/components/AppHeader.tsx
rg -q 'text-lg font-semibold' app/src/components/VideoCard.tsx
rg -q 'max-sm:grid-cols-1' app/src/components/VideoCard.tsx
