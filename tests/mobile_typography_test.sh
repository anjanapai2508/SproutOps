#!/usr/bin/env bash
set -euo pipefail

rg -q '\.video-title \{ font-size:17px;' app/index.html
rg -q '\.detail-title \{ font-size:22px;' app/index.html
rg -q '\.task-label \{ font-size:14px;' app/index.html
rg -q '\.version-name \{ font-size:18px;' app/index.html
