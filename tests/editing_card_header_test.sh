#!/bin/sh
set -eu

file="app/index.html"

if ! grep -Fq '<div class="version-name">Latest Version : ${escapeHtml(active?.fileName || '\''Shapes_1.mp4'\'')}</div>' "$file"; then
  echo "FAIL: editing card should show the latest version filename title"
  exit 1
fi

if grep -Fq '<div class="eyebrow">Latest version</div>' "$file"; then
  echo "FAIL: editing card still shows the redundant Latest version label"
  exit 1
fi

if grep -Fq '<div class="editing-meta">Status ${status[2]}' "$file"; then
  echo "FAIL: editing card still shows metadata below the title"
  exit 1
fi

if grep -Fq '<span class="status-badge status-${status[0]}">${status[1]} ${status[2]}</span></div><div class="latest-comment-card">' "$file"; then
  echo "FAIL: editing card still shows the version-ready status badge"
  exit 1
fi

if grep -Fq '>Version History</button>' "$file"; then
  echo "FAIL: editing card still shows the Version History button"
  exit 1
fi

if ! grep -Fq '.editing-actions { display:grid; grid-template-columns:1fr;' "$file"; then
  echo "FAIL: remaining Discussion action should span the row"
  exit 1
fi

echo "PASS: editing card uses the simplified latest-version filename header"
