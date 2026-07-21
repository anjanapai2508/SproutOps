#!/bin/sh
set -eu

! rg -Fq 'video.sequence_number' app/src/components/VideoCard.tsx
rg -Fq '{video.title}' app/src/components/VideoCard.tsx
rg -Fq 'Updated</div><div>{format(video.updated_at)}</div>' app/src/components/VideoCard.tsx
! rg -Fq 'updated-at' app/src/components/VideoCard.tsx
rg -q '>›</span>' app/src/components/VideoCard.tsx
! rg -q 'progress\.percentage|progress-pill|progress-bar' app/src/components/VideoCard.tsx
