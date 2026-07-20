#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config="$repo_root/vite.config.js"

if ! grep -Eq "envDir:[[:space:]]*['\"]\.[/]*['\"]" "$config"; then
  echo "Expected Vite to load environment files from app/.env" >&2
  exit 1
fi
