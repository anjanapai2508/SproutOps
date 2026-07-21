#!/bin/sh
set -eu

rg -Fq 'COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./' Dockerfile
! rg -Fq 'vite.config.js' Dockerfile
rg -Fq '${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL in the root .env file}' docker-compose.yaml
rg -Fq '${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY in the root .env file}' docker-compose.yaml
rg -Fq 'healthcheck:' docker-compose.yaml
rg -Fq 'COPY nginx.conf /etc/nginx/conf.d/default.conf' Dockerfile
rg -Fq 'FROM nginx:1.30.4-alpine' Dockerfile
rg -Fq 'try_files $uri $uri/ /index.html;' nginx.conf
rg -Fq 'X-Content-Type-Options "nosniff"' nginx.conf
rg -Fq 'Content-Security-Policy' nginx.conf
rg -Fq '.env' .gitignore
rg -Fq '.env' .dockerignore
! git ls-files --error-unmatch .env >/dev/null 2>&1
