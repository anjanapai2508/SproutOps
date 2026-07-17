#!/bin/sh
set -eu

rg -A3 '^        body\{' app/index.html | grep -q 'background:white;'
rg -A8 '^        \.progress-card,' app/index.html | grep -q 'background:#F5FCF6;'
