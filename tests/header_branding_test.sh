#!/bin/sh
set -eu

rg -q '<div class="brand-row">' app/index.html
rg -q '<img class="brand-logo" src="assets/logo_new.png" alt="Giggle Sprouts logo">' app/index.html
rg -q '<p>Operations center for Giggle Sprouts</p>' app/index.html
rg -q '\.header p\{' app/index.html
rg -A1 '\.header p\{' app/index.html | grep -q 'text-align:center;'
