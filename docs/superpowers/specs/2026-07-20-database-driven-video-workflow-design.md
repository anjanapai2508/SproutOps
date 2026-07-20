# Database-Driven Video Workflow Design

## Goal

Make the existing Vite and JavaScript frontend reflect and advance the Supabase workflow with the smallest practical change set. Preserve authentication, layout, and the existing database schema. Do not migrate the application to React or TypeScript and do not recreate `public.video_tasks`.

## Source of Truth

`public.videos.current_stage` and `public.videos.next_action` are the source of truth for card status and workflow position. `public.edit_versions` stores editing state and history, `public.edit_comments` stores editing discussion, and `public.profiles` supplies readable user names when available.

The frontend must not query, type, render, or otherwise reference `video_tasks`. Existing obsolete frontend code and repository policy references for that deleted table will be removed.

## Workflow Definition

Add one reusable JavaScript workflow definition containing the ordered actions, display labels, and owning stages:

1. `write_script` and `review_script` — pre-production
2. `shoot_video` and `record_voice` — production
3. `start_editing`, `continue_editing`, `submit_for_review`, `review_edit`, `make_edit_changes`, and `approve_edit` — editing
4. `create_thumbnail`, `prepare_metadata`, `review_publishing_details`, and `publish_video` — publishing

The same module will contain user-facing stage, action, and edit-status labels. Raw enum values will not be rendered.

## Checklist Behaviour

Each video checklist is derived from its current database record rather than stored task rows:

- Actions before `next_action` are checked and disabled.
- The current action is unchecked and is the only action that can advance.
- Future actions are unchecked and disabled.
- A completed video with `no_action_required` shows every action checked.
- An on-hold video preserves its existing action but disables progression.
- A missing or unknown action produces a localized workflow error instead of assuming progress.

On interaction, the UI optimistically advances the affected video, disables duplicate submission, and calls a reusable workflow service. It then replaces optimistic data with the row returned by Supabase. Failure restores the prior video and displays a non-blocking inline error.

Normal steps advance to the next workflow definition entry and set `current_stage` from that next entry. Completing `publish_video` instead sets `current_stage` to `completed`, `next_action` to `no_action_required`, and sets `published_at` only when it is currently null.

Stage and Up Next always render the current `videos` row, so the returned mutation result immediately updates both card fields.

## Editing Transitions

Editing uses `videos.next_action_version_id` as the active-version pointer.

- Completing `start_editing` creates the next numbered `edit_versions` row when no active version exists. The new version uses status `Editing`, the authenticated user for `created_by`, and `next_action_assignee_id` or the authenticated user for `assigned_editor`. The video advances to `continue_editing`.
- Completing `continue_editing` advances the video to `submit_for_review` while the active version remains `Editing`.
- Completing `submit_for_review` sets the active version to `In-Review`, records `submitted_for_review_at`, and advances the video to `review_edit`.
- `review_edit` is resolved by explicit Request Changes and Approve Edit controls, not by a generic checkbox.
- Request Changes sets the active version back to `Editing` and advances the video to `make_edit_changes`.
- Completing `make_edit_changes` preserves the prior version, marks it `superseded` when appropriate, creates the next numbered version with status `Editing`, updates the active-version pointer, and returns the video to `continue_editing`.
- Approve Edit sets the active version to `Complete`, records reviewer fields, and advances the video to `publishing` / `create_thumbnail`.
- `approve_edit` remains in the centralized workflow definition for compatibility with existing enum order, but the explicit approval control performs the actual approval transition.

Multi-table changes will use small sequential service operations because adding an RPC or database trigger is outside this minimal design. If a later operation fails, the frontend will reload the affected video and editing data from Supabase and show an inline error rather than retaining unconfirmed optimistic state.

## Editing Panel

Replace the current sparse version list with a localized database-backed panel for the active edit version. It displays the version number, formatted status, assigned editor, creator, created date, submission date, reviewer, review date, and useful next-action note. Missing profiles display `Unknown user`; a missing active version explains that Start Editing will create Version 1.

A compact status select submits only the existing values `draft`, `Editing`, `In-Review`, `Complete`, `approved`, and `superseded`. Status changes update the edit version and synchronize the video when needed:

- `Editing` maps to `continue_editing` or retains `make_edit_changes`.
- `In-Review` maps to `review_edit`.
- `Complete` and `approved` map to `publishing` / `create_thumbnail`.

The control rolls back and displays an inline error on failure.

Comments for the active version load oldest first. Each entry shows snapshot author name, role, time, and message. Authenticated users can add a trimmed, non-empty comment using their profile display name and an available role label or `Team Member`. Successful insertion refreshes only the active discussion and clears the input. Loading, empty, error, and retry states remain localized to the panel.

## Code Boundaries

- A constants module owns workflow order and display formatting.
- The video service owns video reads and workflow updates.
- A focused edit-version service owns version reads, creation, status changes, and history-preserving transitions.
- A focused comment/profile service owns active-version comments and profile lookup.
- `main.js` owns rendering and localized optimistic UI state but contains no raw Supabase queries.

This follows the current application structure without adding a framework or broad refactor.

## Security and Database Constraints

All browser calls continue using the publishable key and authenticated session. No service-role key is exposed. Existing RLS must allow authenticated users to select and update videos and edit versions, insert comments, and read relevant profiles. If live verification finds a missing policy, report the exact blocked operation; do not weaken RLS or add broad anonymous write access.

No new table, enum, trigger, RPC, or role-based authorization is added. Existing timestamp triggers remain authoritative where present.

## Testing and Verification

Follow test-driven development for each behavior:

- Workflow derivation for current, completed, on-hold, and invalid actions.
- Video workflow update payloads and publish completion.
- Editing version creation, submission, change request, new-version history, and approval.
- Status synchronization and rollback behaviour.
- Profile-name fallback and comments ordered oldest first.
- UI checks proving only the current action is enabled and card fields use returned video values.
- Repository scan proving frontend code no longer references `video_tasks`.

Run all Vitest and shell tests, the production Vite build, and read/write verification against the configured Supabase project using an authenticated session where available. Confirm every returned database row is reconciled into the UI.

## Success Criteria

- Checklist state is derived only from `videos.next_action` and the centralized workflow definition.
- Only the current permitted action advances, and database results update Stage and Up Next immediately.
- Publishing completion persists the completed state and timestamp.
- Editing versions, statuses, review decisions, history, profiles, and comments are visible and mutable through the existing UI.
- No frontend or active migration logic depends on `video_tasks`.
- Errors remain localized and never leave optimistic state presented as persisted truth.
- Tests and the production build pass without a React, TypeScript, or schema migration project.
