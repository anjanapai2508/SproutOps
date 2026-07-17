#!/bin/sh
set -eu

file="app/index.html"

if grep -Fq '<span class="video-meta">Updated ${formatTime(video.updatedAt)}</span>' "$file"; then
  echo "FAIL: video cards still render updated-date metadata"
  exit 1
fi

if ! grep -Fq '<div class="video-card-actions"><div class="progress-pill">${progress.percentage}%</div><span class="chevron">›</span></div></div>' "$file"; then
  echo "FAIL: video card top row should place the chevron beside progress"
  exit 1
fi

if grep -Fq 'class="video-card-footer"' "$file"; then
  echo "FAIL: video card footer should be removed"
  exit 1
fi

if grep -Fq '.video-meta {' "$file"; then
  echo "FAIL: unused video-meta styling remains"
  exit 1
fi

echo "PASS: video cards omit updated-date metadata and show the chevron at top right"
