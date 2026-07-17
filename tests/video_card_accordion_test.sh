#!/usr/bin/env bash
set -euo pipefail

rg -q 'expandedVideoId' app/index.html
rg -q 'data-action="toggle-video"' app/index.html
rg -q 'renderAccordionDetails' app/index.html
! rg -q 'data-action="open-details"' app/index.html
! rg -q 'renderDetails(selected)' app/index.html
