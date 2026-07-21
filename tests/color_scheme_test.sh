#!/bin/sh
set -eu

rg -qi 'background: #fafaf8' app/src/styles.css
rg -q 'bg-white' app/src/components/VideoCard.tsx
rg -q 'color: #1f2937' app/src/styles.css
