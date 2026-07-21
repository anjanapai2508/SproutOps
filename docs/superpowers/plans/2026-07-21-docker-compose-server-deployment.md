# Docker Compose Server Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and serve SproutOps securely through the repository's Docker Compose service using an ignored root environment file.

**Architecture:** A Node 22 build stage compiles the React/TypeScript/Vite app with the browser-safe Supabase URL and anonymous key supplied as required build arguments. A minimal Nginx runtime image serves the static bundle with SPA routing, cache rules, security headers, and a Compose health check.

**Tech Stack:** Docker, Docker Compose, Node 22, Vite, TypeScript, Nginx, Supabase JavaScript client, POSIX shell tests

---

### Task 1: Lock down deployment configuration expectations

**Files:**
- Create: `tests/docker_compose_deployment_test.sh`
- Test: `tests/docker_compose_deployment_test.sh`

- [ ] **Step 1: Write the failing deployment configuration test**

```sh
#!/bin/sh
set -eu

rg -Fq 'COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./' Dockerfile
! rg -Fq 'vite.config.js' Dockerfile
rg -Fq '${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL in the root .env file}' docker-compose.yaml
rg -Fq '${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY in the root .env file}' docker-compose.yaml
rg -Fq 'healthcheck:' docker-compose.yaml
rg -Fq 'COPY nginx.conf /etc/nginx/conf.d/default.conf' Dockerfile
rg -Fq 'try_files $uri $uri/ /index.html;' nginx.conf
rg -Fq 'X-Content-Type-Options "nosniff"' nginx.conf
rg -Fq 'Content-Security-Policy' nginx.conf
rg -Fq '.env' .gitignore
rg -Fq '.env' .dockerignore
! git ls-files --error-unmatch .env >/dev/null 2>&1
```

- [ ] **Step 2: Run the test and verify it fails against the outdated Dockerfile**

Run: `bash tests/docker_compose_deployment_test.sh`

Expected: FAIL because `Dockerfile` still references `vite.config.js`, required Compose validation is absent, and `nginx.conf` does not exist.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/docker_compose_deployment_test.sh
git commit -m "test: define Docker Compose deployment requirements"
```

### Task 2: Implement the production image and Nginx server

**Files:**
- Modify: `Dockerfile`
- Create: `nginx.conf`
- Test: `tests/docker_compose_deployment_test.sh`

- [ ] **Step 1: Update the Dockerfile build inputs and runtime configuration**

```dockerfile
FROM node:22-alpine AS build

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY app ./app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
```

- [ ] **Step 2: Add the Nginx SPA, cache, and security configuration**

```nginx
server {
    listen 80;
    server_name _;
    server_tokens off;
    root /usr/share/nginx/html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co" always;

    location = /index.html {
        add_header Cache-Control "no-store";
        try_files $uri =404;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 3: Run the configuration test**

Run: `bash tests/docker_compose_deployment_test.sh`

Expected: still FAIL only because Compose validation and health checking are not implemented yet.

### Task 3: Make Compose fail safely and report health

**Files:**
- Modify: `docker-compose.yaml`
- Test: `tests/docker_compose_deployment_test.sh`

- [ ] **Step 1: Require the browser-safe Supabase build variables and add a health check**

```yaml
services:
  sproutops:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL in the root .env file}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY in the root .env file}
    container_name: sproutops
    ports:
      - "8333:80"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1/ || exit 1"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 5s
    restart: unless-stopped
```

- [ ] **Step 2: Run the deployment test and confirm it passes**

Run: `bash tests/docker_compose_deployment_test.sh`

Expected: PASS.

- [ ] **Step 3: Run all repository tests and type checking**

Run: `npm test && npm run typecheck && git diff --check`

Expected: 0 failures and exit code 0.

- [ ] **Step 4: Commit the container implementation**

```bash
git add Dockerfile docker-compose.yaml nginx.conf tests/docker_compose_deployment_test.sh
git commit -m "feat: run production app with Docker Compose"
```

### Task 4: Create the private server environment and verify the container

**Files:**
- Create locally, never commit: `.env`
- Source values from: `app/.env`

- [ ] **Step 1: Create the ignored root environment file without displaying values**

Run from the main repository root: `install -m 600 app/.env .env`

Expected: `.env` exists with mode `600`; `git status --short` does not list it.

- [ ] **Step 2: Validate Compose without echoing resolved configuration**

Run: `docker compose config --quiet`

Expected: exit code 0.

- [ ] **Step 3: Build and start the service**

Run: `docker compose up --build -d`

Expected: image builds successfully and service starts.

- [ ] **Step 4: Verify health and HTTP serving**

Run: `docker compose ps && curl -fsS -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:8333/`

Expected: service is healthy and curl prints `200 text/html`.

- [ ] **Step 5: Verify the repository remains clean except for the committed plan if not yet committed**

Run: `git status --short --branch`

Expected: no secret or generated files are tracked.
