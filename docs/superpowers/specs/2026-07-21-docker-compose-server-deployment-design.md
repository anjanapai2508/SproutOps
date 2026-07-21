# Docker Compose Server Deployment Design

## Goal

Run the existing SproutOps React, TypeScript, Tailwind, and Supabase frontend as a production container through the repository's Docker Compose file. Preserve application behavior and database integration while keeping server configuration out of version control and the Docker build context.

## Architecture

Use a two-stage Docker build. The Node stage installs the locked dependencies, copies the Vite and TypeScript build inputs, and produces the static `dist` bundle. The Nginx stage serves that bundle on container port 80.

Docker Compose publishes the existing server port `8333` and supplies the two browser-safe Supabase values to the build from a root `.env` file. Compose must fail immediately when either required value is missing.

## Environment and Security

- Create a root `.env` from the existing local `app/.env` values without logging or displaying those values.
- Keep `.env`, `app/.env`, and environment variants excluded from Git and the Docker build context.
- Keep `.env.example` committed with empty placeholders only.
- Pass only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into the Vite build.
- Never accept or pass a Supabase `service_role` key or another server secret.
- Treat the anonymous/publishable key as browser-visible because Vite embeds `VITE_` values into the static JavaScript bundle. Supabase Row Level Security remains the authorization boundary.
- Avoid copying any environment file into an image layer.

## Container Configuration

Update the Dockerfile to copy `vite.config.ts` and the required TypeScript configuration files instead of the deleted JavaScript Vite configuration. Set the production build arguments only in the build stage and serve only the generated static output from the final Nginx image.

Add a repository-owned Nginx server configuration with:

- SPA fallback to `index.html`;
- static asset caching;
- no caching for `index.html`;
- MIME sniffing, framing, and referrer protections;
- no unnecessary Nginx version disclosure.

The Content Security Policy will allow the app's own resources, the configured Supabase HTTPS/WSS connection, and the existing Google Fonts resources. It will not use broad wildcard sources.

## Compose Behavior

Keep one `sproutops` service, the existing container name, port mapping `8333:80`, and `unless-stopped` restart policy. Validate required build variables using Compose's required-variable syntax. Add a local HTTP health check so container state reflects whether Nginx is serving the application.

## Error Handling

- Missing root environment values stop Compose before a build begins.
- TypeScript or Vite failures stop the image build.
- Nginx startup or HTTP failures mark the service unhealthy.
- Supabase request authorization continues to be enforced by the existing database policies; Docker introduces no elevated database credentials.

## Verification

Add lightweight tests that assert the Dockerfile copies the current TypeScript/Vite inputs, Compose validates both required environment values, secrets are excluded, and Nginx includes SPA fallback and security headers.

Then verify:

1. Existing application tests and TypeScript checks pass.
2. The production Vite build succeeds.
3. `docker compose config` resolves using the root `.env` without printing its contents in the report.
4. `docker compose up --build -d` creates a healthy container.
5. `http://127.0.0.1:8333/` returns the application HTML.

## Scope

No application UI, workflow logic, authentication flow, database schema, migrations, routing, or Supabase policies will change. The implementation is limited to environment handling, container build inputs, Nginx serving configuration, Compose validation/health checks, and related tests.
