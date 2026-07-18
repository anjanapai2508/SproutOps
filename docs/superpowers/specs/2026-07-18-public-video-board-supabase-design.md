# Public Video Board Supabase Design

## Goal

Connect the SproutOps front page to the configured Supabase project so unauthenticated visitors can see active videos. When no active videos exist, show a clear, actionable empty state instead of blank content.

## Scope

This change covers public video reads, front-end environment loading, loading/error/empty rendering, and safe handling of write controls for anonymous visitors. It does not add authentication, task/profile data, realtime subscriptions, pagination, or anonymous database writes.

## Access Model

The `public.videos` table remains protected by row-level security. Add a narrowly scoped `SELECT` policy for the `anon` role that exposes only rows where `archived_at is null`. The existing authenticated-user management policy remains unchanged.

The browser continues to use the Supabase publishable key. No secret or service-role key is added to the front end.

## Front-End Data Flow

Vite must load the credentials stored in `app/.env`. The Supabase client is created lazily from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and the video service queries `public.videos`, filters out archived rows, and orders results by `sequence_number` ascending.

On page startup:

1. Render a loading skeleton.
2. Fetch active videos from Supabase.
3. Render ordered video cards when rows are returned.
4. Render the empty state when the query succeeds with zero rows.
5. Render a retryable error state when the query fails.

## Page States

- Loading: two skeleton cards with an accessible loading label.
- Loaded: active video cards populated with database values.
- Empty: a centered state card with the heading `No videos available`, explanatory copy that videos will appear once added, and the existing New Video action.
- Error: a concise connection error with a Retry button.

These states are mutually exclusive, so a successful empty response cannot produce a blank page.

## Write Controls

New Video, Edit, and Archive controls remain visible. Because unauthenticated visitors do not have write permission, the front end must prevent anonymous mutation requests and show a clear `Sign in is required to manage videos` message. This preserves discoverability without granting unsafe anonymous write access.

The behavior should be isolated behind an authentication/session check so a later sign-in feature can enable the same controls without redesigning the UI.

## Database Change

Add one migration containing the public read policy. The policy applies only to `SELECT`, targets only `anon`, and includes `archived_at is null` as its predicate. Do not broaden the existing authenticated management policy and do not grant anonymous insert, update, or delete privileges.

Before applying the migration, inspect existing migrations and follow the repository's current schema workflow. After applying it, query as the anonymous client to confirm that active rows are visible and archived rows are not.

## Error Handling and Security

- Missing front-end environment variables produce the existing explicit configuration error.
- Supabase query errors are caught and displayed through the retryable error state.
- Anonymous mutation attempts are stopped before a write query is sent.
- User-provided video text remains HTML-escaped before rendering.
- Only a publishable browser key is used; privileged keys never enter Vite environment variables or bundles.

## Testing

Follow test-driven development:

1. Add or update a test that proves Vite loads `app/.env`; verify it fails before changing configuration.
2. Add a rendering test for the successful zero-row state and its `No videos available` message; verify it fails before changing rendering code.
3. Add tests that anonymous mutation controls show the sign-in-required message without calling the video mutation service; verify failure before implementation.
4. Add a migration/policy test or database verification demonstrating anonymous users can select active videos but not archived videos or perform writes.
5. Run the complete Vitest and shell-test suites, then run a production Vite build.
6. Perform a live read through the configured publishable client and confirm the existing test video appears on the front page.

## Success Criteria

- The configured Supabase project supplies the front-page video list.
- The existing active test video renders for a visitor who is not signed in.
- A successful zero-row response shows `No videos available` and explanatory copy.
- Load failures show Retry instead of blank content.
- Write controls remain visible but anonymous visitors receive a sign-in-required message.
- Anonymous users cannot create, update, archive, or otherwise mutate video records.
- Automated tests and the production build pass.
