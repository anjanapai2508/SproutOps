#!/bin/sh
set -eu

rg -q 'import logoUrl' app/src/components/AppHeader.tsx
rg -Fq 'src={logoUrl} alt="Giggle Sprouts logo"' app/src/components/AppHeader.tsx
rg -q '>SproutOps</div>' app/src/components/AppHeader.tsx
