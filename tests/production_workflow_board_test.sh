#!/usr/bin/env bash
set -euo pipefail

rg -q 'preProduction:' app/index.html
rg -q 'production:' app/index.html
rg -q 'editing:' app/index.html
rg -q 'versions:' app/index.html
rg -q 'comments:' app/index.html
rg -q 'publishing:' app/index.html
rg -q 'renderBoard' app/index.html
rg -q 'renderDetails' app/index.html
rg -q 'stage-summary' app/index.html
rg -q 'Version History' app/index.html
rg -q 'Latest discussion' app/index.html
rg -q 'Create New Version' app/index.html
rg -q 'Metadata' app/index.html
rg -q 'data-action="back-to-board"' app/index.html
