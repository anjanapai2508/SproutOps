#!/bin/sh
set -eu

file="app/src/components/AppHeader.tsx"

if grep -Fq 'class="header-progress"' "$file"; then
  echo "FAIL: header still renders the overall task counter"
  exit 1
fi

if grep -Fq '.header-progress' "$file"; then
  echo "FAIL: unused overall-counter styles remain"
  exit 1
fi

if grep -Fq 'getOverallProgress' "$file"; then
  echo "FAIL: unused overall-progress calculation remains"
  exit 1
fi

if ! grep -Fq 'ml-auto flex items-center' "$file"; then
  echo "FAIL: desktop New Video action should remain right-aligned"
  exit 1
fi

echo "PASS: header omits the overall task counter"
