#!/bin/sh
set -eu

rg -q -- '--background:#FAFAF8' app/index.html
rg -q -- '--surface:#FFFFFF' app/index.html
rg -q 'background:var\(--background\)' app/index.html
