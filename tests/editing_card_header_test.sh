#!/bin/sh
set -eu

rg -q 'EditingDetails' app/src/components/VideoCard.tsx
rg -q 'getEditingDetails' app/src/components/EditingDetails.tsx
rg -q 'EDIT_STATUS_LABELS' app/src/components/EditingDetails.tsx
rg -q 'No editing version has been created yet\.' app/src/components/EditingDetails.tsx
rg -q 'Request Changes' app/src/components/EditingDetails.tsx
rg -q 'Approve Edit' app/src/components/EditingDetails.tsx
