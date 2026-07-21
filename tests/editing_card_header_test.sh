#!/bin/sh
set -eu

rg -q 'renderEditingSection' app/src/main.js
rg -q 'getEditingDetails' app/src/main.js
rg -q 'EDIT_STATUS_LABELS' app/src/main.js
rg -q 'No editing version has been created yet\.' app/src/main.js
rg -q 'Request Changes' app/src/main.js
rg -q 'Approve Edit' app/src/main.js
