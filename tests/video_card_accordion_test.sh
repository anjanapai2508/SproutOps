#!/usr/bin/env bash
set -euo pipefail

rg -q 'setExpanded' app/src/components/VideoCard.tsx
rg -Fq 'aria-expanded={expanded}' app/src/components/VideoCard.tsx
rg -q 'WorkflowSection' app/src/components/VideoCard.tsx
rg -q 'setExpanded' app/src/components/WorkflowSection.tsx
rg -q 'EditingSection' app/src/components/VideoCard.tsx
rg -Fq 'aria-expanded={expanded}' app/src/components/WorkflowSection.tsx
