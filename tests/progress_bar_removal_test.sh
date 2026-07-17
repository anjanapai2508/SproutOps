#!/bin/sh
set -eu

! rg -q '\.progress\{' app/index.html
! rg -q '\.progress-fill\{' app/index.html
! rg -q '<div class="progress">' app/index.html
