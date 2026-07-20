#!/bin/sh
set -eu

rg -q 'class="brand-row"' app/src/main.js
rg -q 'class="brand-logo" src="\$\{logoUrl\}" alt="Giggle Sprouts logo"' app/src/main.js
rg -q 'class="app-title">SproutOps' app/src/main.js
