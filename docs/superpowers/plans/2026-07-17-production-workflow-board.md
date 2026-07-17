# Production Workflow Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn SproutOps into a compact video-production board with detailed stage, version, and conversation data on demand.

**Architecture:** Replace `workflowStages` with a video object composed of `preProduction`, `production`, `editing`, and `publishing`. Render either the scan-friendly board or one selected video detail screen, while retaining the existing new-video modal and in-memory state.

**Tech Stack:** HTML, CSS, vanilla JavaScript, local mock data, shell regression tests.

---

### Task 1: Define the production model and board contract

**Files:**
- Create: `tests/production_workflow_board_test.sh`
- Modify: `app/index.html`

- [ ] **Step 1: Write the failing test**

```sh
rg -q 'preProduction:' app/index.html
rg -q 'production:' app/index.html
rg -q 'editing:' app/index.html
rg -q 'versions:' app/index.html
rg -q 'comments:' app/index.html
rg -q 'publishing:' app/index.html
rg -q 'renderBoard' app/index.html
rg -q 'stage-summary' app/index.html
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/production_workflow_board_test.sh`

Expected: failure because the flat `workflowStages` data model and expanded cards are still present.

- [ ] **Step 3: Implement the model and compact board**

```js
const video = {
  preProduction: { tasks: [{ id: 'script', title: 'Script Complete', completed: false }] },
  production: { tasks: [{ id: 'shoot', title: 'Shoot', completed: false }, { id: 'voice-recording', title: 'Voice Recording', completed: false }] },
  editing: { versions: [{ id: 'edit-v2', versionNumber: 2, status: 'needs-review', comments: [] }], activeVersionId: 'edit-v2' },
  publishing: { tasks: [{ id: 'thumbnail', title: 'Thumbnail', completed: false }, { id: 'metadata', title: 'Metadata', completed: false }, { id: 'publish', title: 'Publish', completed: false }] }
};
```

Render cards as a title, total progress, five-stage status row, last update, and chevron. A card click sets `selectedVideoId` and renders the detail view.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/production_workflow_board_test.sh`

Expected: exit 0.

### Task 2: Render production details and preserve creation/task interactions

**Files:**
- Modify: `app/index.html`
- Test: `tests/production_workflow_board_test.sh`

- [ ] **Step 1: Extend the failing test**

```sh
rg -q 'Version History' app/index.html
rg -q 'Create New Version' app/index.html
rg -q 'Latest discussion' app/index.html
rg -q 'Metadata' app/index.html
rg -q 'data-action="back-to-board"' app/index.html
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/production_workflow_board_test.sh`

Expected: failure because the detail workspace does not yet exist.

- [ ] **Step 3: Implement the detail workspace**

```js
function renderDetails(video) {
  // Render pre-production, production, editing versions/comments, and publishing.
}
```

Show only the latest two active-version comments, newest-first version history, and a non-destructive placeholder interaction for creating a new version. Keep checkbox updates and the existing modal working against the new model.

- [ ] **Step 4: Run focused verification**

Run: `bash tests/production_workflow_board_test.sh && bash tests/responsive_new_video_action_test.sh`

Expected: both scripts exit 0.
