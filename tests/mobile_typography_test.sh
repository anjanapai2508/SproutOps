#!/usr/bin/env bash
set -euo pipefail

rg -q '@media \(max-width:640px\)' app/index.html
rg -q '\.video-title \{ font-size:17px;' app/index.html
rg -q '\.app-title \{ font-size:23px;' app/index.html
