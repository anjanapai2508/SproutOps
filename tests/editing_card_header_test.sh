#!/bin/sh
set -eu

rg -q 'renderEditingSection' app/src/main.js
rg -q 'video\.edit_versions' app/src/main.js
rg -q 'version\.edit_comments' app/src/main.js
rg -q 'No editing versions yet\.' app/src/main.js
