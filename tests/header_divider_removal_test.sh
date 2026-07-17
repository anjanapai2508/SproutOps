#!/bin/sh
set -eu

file="app/index.html"

if grep -F '.header {' "$file" | grep -Fq 'border-bottom:'; then
  echo "FAIL: header still renders a horizontal bottom divider"
  exit 1
fi

echo "PASS: header omits the horizontal bottom divider"
