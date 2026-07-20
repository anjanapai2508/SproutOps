# Database-Driven Video Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace deleted `video_tasks` dependencies with a `videos`-driven checklist and add database-backed editing versions, statuses, profiles, and comments.

**Architecture:** A central workflow module derives checklist state and transitions. Focused Supabase services persist videos, edit versions, comments, and profile reads; `main.js` coordinates localized optimistic UI and reconciles every mutation with returned database rows. No schema additions, React migration, or raw Supabase queries in rendering code.

**Tech Stack:** Vite 5, browser JavaScript ES modules, Supabase JS 2, Vitest 2, shell regression tests.

---

## File Structure

- Create `app/src/constants/video-workflow.js`: ordered workflow, labels, derivation, and pure transition helpers.
- Modify `app/src/constants/video-labels.js`: re-export centralized labels for compatibility.
- Modify `app/src/services/videos.js`: persist calculated video workflow transitions.
- Create `app/src/services/editing.js`: edit-version, comment, and profile operations.
- Modify `app/src/main.js`: replace task-row state and rendering with derived workflow and editing-panel state.
- Modify `app/src/types/video.d.ts`: remove `VideoTask`; document edit-version, comment, and profile shapes.
- Delete `app/src/services/videoTasks.js`: deleted-table service.
- Modify `supabase/migrations/20260718193151_allow_public_read_video_workflow.sql`: remove the obsolete `video_tasks` policy block while preserving edit-version/comment policies.
- Create `tests/video-workflow.test.js`: pure workflow and terminal-publish coverage.
- Modify `tests/videos-service.test.js`: persistence payload coverage.
- Replace `tests/video-tasks-service.test.js` with `tests/editing-service.test.js`: editing data operations.
- Modify UI and shell tests that still assert `video_tasks` behavior.

### Task 1: Central workflow definition and derivation

**Files:**
- Create: `app/src/constants/video-workflow.js`
- Create: `tests/video-workflow.test.js`
- Modify: `app/src/constants/video-labels.js`

- [ ] **Step 1: Write failing workflow tests**

Test the exact ordered keys, `deriveWorkflowItems(video)`, `getNextWorkflowUpdate(video)`, completed state, on-hold blocking, and unknown-action errors. Use representative assertions:

```js
expect(deriveWorkflowItems({ current_stage:'production', next_action:'record_voice' }))
  .toEqual(expect.arrayContaining([
    expect.objectContaining({ key:'shoot_video', completed:true, enabled:false }),
    expect.objectContaining({ key:'record_voice', completed:false, enabled:true }),
    expect.objectContaining({ key:'start_editing', completed:false, enabled:false })
  ]));
expect(getNextWorkflowUpdate({ current_stage:'publishing', next_action:'publish_video', published_at:null }))
  .toMatchObject({ current_stage:'completed', next_action:'no_action_required' });
expect(() => deriveWorkflowItems({ current_stage:'editing', next_action:'unknown' })).toThrow('Unknown workflow action');
```

- [ ] **Step 2: Verify RED**

Run `npx vitest run tests/video-workflow.test.js` and expect failure because `video-workflow.js` does not exist.

- [ ] **Step 3: Implement the workflow module**

Export `VIDEO_WORKFLOW`, `VIDEO_STAGE_LABELS`, `NEXT_ACTION_LABELS`, `EDIT_STATUS_LABELS`, `deriveWorkflowItems`, and `getNextWorkflowUpdate`. The last workflow action returns:

```js
return {
  current_stage: 'completed',
  next_action: 'no_action_required',
  ...(video.published_at ? {} : { published_at: new Date().toISOString() })
};
```

Reject `on_hold`, `no_action_required` on a non-completed video, and unknown actions with useful errors. Re-export labels from `video-labels.js` so existing imports remain stable.

- [ ] **Step 4: Verify GREEN**

Run `npx vitest run tests/video-workflow.test.js` and expect all workflow tests to pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/constants/video-workflow.js app/src/constants/video-labels.js tests/video-workflow.test.js
git commit -m "feat: define database video workflow"
```

### Task 2: Persist workflow transitions through the video service

**Files:**
- Modify: `app/src/services/videos.js`
- Modify: `tests/videos-service.test.js`

- [ ] **Step 1: Write failing service tests**

Add tests for `advanceVideoWorkflow(id, video)` that assert the service calculates the next action, updates only permitted workflow fields, filters by ID and current `next_action` for stale-write protection, selects the updated row, and throws a clear stale-state error when no row is returned.

```js
expect(query.update).toHaveBeenCalledWith({
  current_stage: 'production',
  next_action: 'record_voice'
});
expect(query.eq).toHaveBeenCalledWith('next_action', 'shoot_video');
```

- [ ] **Step 2: Verify RED**

Run `npx vitest run tests/videos-service.test.js` and expect failure because `advanceVideoWorkflow` is not exported.

- [ ] **Step 3: Implement the service method**

Import `getNextWorkflowUpdate`, calculate the payload, and use:

```js
const result = await client.from('videos')
  .update(payload)
  .eq('id', id)
  .eq('next_action', video.next_action)
  .select('*')
  .maybeSingle();
if (result.error) throw result.error;
if (!result.data) throw new Error('Video workflow changed; refresh and try again');
return result.data;
```

Export the lazy-client wrapper alongside the existing video functions.

- [ ] **Step 4: Verify GREEN**

Run `npx vitest run tests/videos-service.test.js` and expect all video-service tests to pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/services/videos.js tests/videos-service.test.js
git commit -m "feat: persist video workflow transitions"
```

### Task 3: Replace deleted task-table code

**Files:**
- Delete: `app/src/services/videoTasks.js`
- Delete: `tests/video-tasks-service.test.js`
- Modify: `app/src/types/video.d.ts`
- Modify: `supabase/migrations/20260718193151_allow_public_read_video_workflow.sql`
- Modify: `tests/production_workflow_board_test.sh`
- Modify: `tests/supabase-video-integration.test.js`

- [ ] **Step 1: Change repository assertions first**

Replace task-table assertions with a test that fails while any active application or migration file contains `video_tasks`:

```sh
if rg -n 'video_tasks|create_default_video_tasks|handle_new_video|mockTasks|defaultTasks' app supabase; then
  echo 'Deleted video_tasks workflow is still referenced' >&2
  exit 1
fi
```

- [ ] **Step 2: Verify RED**

Run `sh tests/production_workflow_board_test.sh` and expect it to identify the service, type, or migration policy reference.

- [ ] **Step 3: Remove obsolete code**

Delete the service and its test, remove `VideoTask` from the declaration file, and remove only the `Public can view tasks for active videos` policy statement from the migration. Do not alter edit-version or comment policies.

- [ ] **Step 4: Verify GREEN**

Run `sh tests/production_workflow_board_test.sh` and `rg -n 'video_tasks|task_stage|create_default_video_tasks|handle_new_video|mockTasks|defaultTasks' app supabase`; expect the test to pass and the scan to return no matches.

- [ ] **Step 5: Commit**

```bash
git add app/src/types/video.d.ts supabase/migrations/20260718193151_allow_public_read_video_workflow.sql tests/production_workflow_board_test.sh tests/supabase-video-integration.test.js
git add -u app/src/services/videoTasks.js tests/video-tasks-service.test.js
git commit -m "refactor: remove deleted video tasks workflow"
```

### Task 4: Add focused editing data services

**Files:**
- Create: `app/src/services/editing.js`
- Create: `tests/editing-service.test.js`
- Modify: `app/src/types/video.d.ts`

- [ ] **Step 1: Write failing service tests**

Cover these public methods with Supabase query-chain fakes:

```js
getEditingDetails(video)
createEditingVersion(video, userId)
submitEditingVersion(versionId)
requestEditingChanges(video, versionId)
approveEditingVersion(video, versionId, userId)
createRevisionVersion(video, previousVersion, userId)
updateEditingStatus(video, version, status, userId)
getEditComments(versionId)
addEditComment(versionId, user, profile, message)
```

Assert exact enum spelling (`Editing`, `In-Review`, `Complete`, `approved`, `superseded`), chronological comment ordering, trimmed non-empty messages, profile fallback data, and highest-version-plus-one numbering.

- [ ] **Step 2: Verify RED**

Run `npx vitest run tests/editing-service.test.js` and expect module-not-found failure.

- [ ] **Step 3: Implement read methods**

Use separate focused queries: active version by `next_action_version_id`, all versions by `video_id` ordered descending, comments by `version_id` ordered `created_at` ascending, and profiles with `.in('id', ids)`. Return a normalized object:

```js
{ activeVersion, versions, profilesById, comments }
```

Do not expose raw queries outside the service.

- [ ] **Step 4: Implement mutation methods**

Create/update edit-version rows and synchronize the video row sequentially. Each method returns `{ video, activeVersion }`; on a later-step failure, throw an error carrying enough context for the caller to reload. Validate status against the exact allowed list before sending it.

- [ ] **Step 5: Implement comments**

Insert `{ version_id, author_id, author_name_snapshot, author_role_snapshot:'Team Member', message:message.trim() }`, select the inserted row, and reject empty input before calling Supabase.

- [ ] **Step 6: Verify GREEN**

Run `npx vitest run tests/editing-service.test.js` and expect all editing-service tests to pass.

- [ ] **Step 7: Commit**

```bash
git add app/src/services/editing.js app/src/types/video.d.ts tests/editing-service.test.js
git commit -m "feat: add editing workflow data service"
```

### Task 5: Replace task checkboxes with the derived workflow checklist

**Files:**
- Modify: `app/src/main.js`
- Modify: `tests/ui-features.test.js`
- Modify: `tests/workflow-enhancements.test.js`

- [ ] **Step 1: Write failing UI source tests**

Assert `main.js` imports `deriveWorkflowItems` and `advanceVideoWorkflow`, contains no task service/state, renders `data-workflow-action`, disables non-current items, and reconciles the returned video:

```js
expect(main).toContain('state.videos=sortVideos(state.videos.map((item)=>item.id===videoId?saved:item))');
expect(main).not.toContain('tasksByVideoId');
expect(main).not.toContain('updateVideoTaskCompletion');
```

- [ ] **Step 2: Verify RED**

Run `npx vitest run tests/ui-features.test.js tests/workflow-enhancements.test.js` and expect the new assertions to fail.

- [ ] **Step 3: Replace task state and rendering**

Remove task loading/mutation state and functions. Render stage-filtered workflow steps from `deriveWorkflowItems(video)`, using checked/disabled/current classes and a localized invalid-workflow message. Keep the existing accordion sections and compact checkbox styling.

- [ ] **Step 4: Add optimistic advancement**

Snapshot the video, apply `getNextWorkflowUpdate` locally, disable duplicate clicks by video ID, call `advanceVideoWorkflow`, reconcile the returned row, and restore the snapshot plus inline error on failure. Route `start_editing`, `submit_for_review`, `review_edit`, and `make_edit_changes` to the editing service rather than the generic transition when their side effects are required.

- [ ] **Step 5: Verify GREEN**

Run the two focused Vitest files and all shell UI tests; expect success.

- [ ] **Step 6: Commit**

```bash
git add app/src/main.js tests/ui-features.test.js tests/workflow-enhancements.test.js tests/*.sh
git commit -m "feat: derive workflow checklist from videos"
```

### Task 6: Populate the editing panel and comments

**Files:**
- Modify: `app/src/main.js`
- Modify: `app/index.html`
- Modify: `tests/ui-features.test.js`
- Modify: `tests/workflow-enhancements.test.js`

- [ ] **Step 1: Write failing panel tests**

Assert the source renders the no-version explanation, status selector with all exact database values, version/profile metadata, Request Changes and Approve Edit controls, chronological comments, comment form, localized loading/error/retry states, and no UUID output fallback.

- [ ] **Step 2: Verify RED**

Run `npx vitest run tests/ui-features.test.js tests/workflow-enhancements.test.js` and expect editing-panel assertions to fail.

- [ ] **Step 3: Add localized editing state and loading**

Add `editingByVideoId`, `editingLoading`, `editingErrors`, `editingPending`, and comment-draft state. Load details only when Editing expands, retain the rest of the page, and provide retry per video.

- [ ] **Step 4: Render the compact panel**

Show version, formatted status, assigned/creator/reviewer names, readable dates, note, status select, review controls when applicable, and the required no-version message. Add only scoped CSS needed for compact metadata, status control, discussion spacing, and mobile layout.

- [ ] **Step 5: Wire status, review, and comment mutations**

Disable affected controls during mutation, update local video/version optimistically, reconcile returned rows, reload affected editing data after partial failures, display inline errors, and clear only a successfully submitted comment draft.

- [ ] **Step 6: Verify GREEN**

Run focused tests and manually confirm all editing panel states render without blank sections.

- [ ] **Step 7: Commit**

```bash
git add app/src/main.js app/index.html tests/ui-features.test.js tests/workflow-enhancements.test.js
git commit -m "feat: add database-backed editing panel"
```

### Task 7: Full verification and live Supabase audit

**Files:**
- Modify only if verification identifies a scoped defect.

- [ ] **Step 1: Run repository scans**

Run:

```bash
rg -n 'video_tasks|task_stage|create_default_video_tasks|handle_new_video|mockTasks|defaultTasks' app supabase
```

Expected: no matches.

- [ ] **Step 2: Run all automated checks**

Run every `tests/*.sh`, `npm test`, `npm run build`, and `git diff --check`. Expect zero failures. The project has no ESLint script, so report that explicitly rather than inventing one.

- [ ] **Step 3: Verify read paths against configured Supabase**

Using the publishable client, read active videos, active edit versions, comments, and profiles. Confirm query field names and enum values match the live schema. Do not print keys or session tokens.

- [ ] **Step 4: Verify authenticated mutations when a session is available**

Through the UI, advance one current action, refresh, and confirm Stage and Up Next persist. Exercise status and comment mutations on a safe test video. If no authenticated session or RLS blocks a write, record the exact operation and Supabase error without weakening policies.

- [ ] **Step 5: Review working tree and final diff**

Confirm unrelated pre-existing changes remain intact, no secret was added, and only scoped files changed.

- [ ] **Step 6: Re-run verification after any scoped correction**

If verification required a correction, repeat Steps 1–5 and include the corrected scoped file in the commit for the task that introduced it. Do not create an empty verification commit.
