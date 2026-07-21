#!/bin/sh
set -eu

rg -q 'EditingSection' app/src/components/VideoCard.tsx
rg -q 'getEditingDetails' app/src/components/EditingDetails.tsx
rg -q 'EDIT_STATUS_LABELS' app/src/components/EditingDetails.tsx
rg -q 'No editing version has been created yet\.' app/src/components/EditingDetails.tsx
rg -q 'Create new comment' app/src/components/EditingDetails.tsx
rg -q 'Show previous' app/src/components/EditingDetails.tsx
