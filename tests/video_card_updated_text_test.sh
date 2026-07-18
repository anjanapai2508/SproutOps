#!/bin/sh
set -eu

rg -Fq '#${video.sequence_number}' app/src/main.js
rg -Fq 'Updated ${formatDate(video.updated_at)}' app/src/main.js
rg -q '<span class="chevron" aria-hidden="true">›</span>' app/src/main.js
! rg -q 'progress\.percentage|progress-pill|progress-bar' app/src/main.js
