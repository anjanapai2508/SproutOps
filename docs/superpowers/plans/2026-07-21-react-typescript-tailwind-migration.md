# React, TypeScript, and Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the imperative SproutOps browser UI with a strict React and TypeScript application styled with Tailwind while preserving its database, behavior, and user workflows.

**Architecture:** Keep workflow derivation and Supabase operations as typed pure/service modules. Use React hooks for auth, videos, editing data, optimistic mutations, and transient UI state; use focused components for each visible region. Preserve the existing Vite root and production output.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Supabase JS, Vitest, React Testing Library

---

### Task 1: Toolchain and typed domain foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Replace: `vite.config.js` with `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `app/src/vite-env.d.ts`
- Create: `app/src/types/database.ts`
- Create: `app/src/types/domain.ts`
- Test: `tests/types-and-toolchain.test.js`

- [ ] Write a failing test that asserts React, TypeScript, Tailwind, the React Vite plugin, strict type-checking scripts, and typed entry/config files exist.
- [ ] Run `npm test -- tests/types-and-toolchain.test.js` and confirm it fails because the React toolchain is absent.
- [ ] Install pinned compatible dependencies and commit the lockfile; configure React and Tailwind Vite plugins without changing `root`, `envDir`, or `outDir`.
- [ ] Define strict compiler options and database/domain types for the existing schema, including `completed_actions`.
- [ ] Run the focused test and `npm run typecheck`; resolve only foundation errors.

### Task 2: Type workflow, Supabase, auth, video, and editing modules

**Files:**
- Replace: `app/src/constants/video-workflow.js` with `app/src/constants/video-workflow.ts`
- Replace: `app/src/constants/video-labels.js` with `app/src/constants/video-labels.ts`
- Replace: `app/src/lib/supabase.js` with `app/src/lib/supabase.ts`
- Replace: `app/src/services/auth.js` with `app/src/services/auth.ts`
- Replace: `app/src/services/videos.js` with `app/src/services/videos.ts`
- Replace: `app/src/services/editing.js` with `app/src/services/editing.ts`
- Modify: `tests/video-workflow.test.js`
- Modify: `tests/auth-service.test.js`
- Modify: `tests/videos-service.test.js`
- Modify: `tests/editing-service.test.js`

- [ ] Update tests to import TypeScript modules and add assertions for typed-compatible checklist output and unchanged service payloads.
- [ ] Run the four focused suites and confirm failure because the `.ts` modules do not exist.
- [ ] Port modules without altering query filters, auth redirects, optimistic update payloads, stale-write guards, or error messages.
- [ ] Run the focused suites and `npm run typecheck`; keep all behavior tests green.

### Task 3: React authentication shell and application entry

**Files:**
- Replace: `app/src/main.js` with `app/src/main.tsx`
- Create: `app/src/App.tsx`
- Create: `app/src/hooks/useAuth.ts`
- Create: `app/src/components/LoginPage.tsx`
- Create: `app/src/components/AppHeader.tsx`
- Modify: `app/index.html`
- Create: `tests/react-auth-ui.test.tsx`

- [ ] Write interaction tests for restoring a session, email magic-link submission, link-sent/resend state, sign-out, and same-window auth behavior.
- [ ] Run the focused React test and confirm failure because the components are absent.
- [ ] Add the React root, auth hook, login page, and header using the existing auth service and messages.
- [ ] Run the focused test and typecheck until green.

### Task 4: React video list, checklist, and optimistic persistence

**Files:**
- Create: `app/src/hooks/useVideos.ts`
- Create: `app/src/components/VideoList.tsx`
- Create: `app/src/components/VideoCard.tsx`
- Create: `app/src/components/StageSummary.tsx`
- Create: `app/src/components/WorkflowSection.tsx`
- Create: `tests/react-video-workflow.test.tsx`

- [ ] Write interaction tests proving any checkbox can be checked or unchecked, Stage and Up Next follow the first unchecked action, completed videos reopen, pending actions disable only the affected video, and rejected writes roll back.
- [ ] Run the focused test and confirm failure because the React video UI is absent.
- [ ] Implement the hook and components using `deriveWorkflowItems` and `getChecklistUpdate` as the only checklist rules.
- [ ] Run the focused test, existing workflow/service suites, and typecheck until green.

### Task 5: Editing panel, comments, video forms, and modal

**Files:**
- Create: `app/src/hooks/useEditingDetails.ts`
- Create: `app/src/components/EditingDetails.tsx`
- Create: `app/src/components/EditComments.tsx`
- Create: `app/src/components/VideoDetails.tsx`
- Create: `app/src/components/NewVideoModal.tsx`
- Create: `tests/react-editing-and-forms.test.tsx`

- [ ] Write tests for lazy editing-data loading, status changes, approve/request-changes, comments, title edits, archive confirmation, video creation, modal focus, backdrop handling, and Escape.
- [ ] Run the focused test and confirm failure because these components are absent.
- [ ] Implement the minimal hooks/components against the unchanged services and preserve current messages and pending/error behavior.
- [ ] Run focused component and service tests plus typecheck until green.

### Task 6: Tailwind styling and regression-suite conversion

**Files:**
- Create: `app/src/styles.css`
- Modify: all React component files from Tasks 3–5
- Modify or replace: presentation shell tests under `tests/*.sh`
- Modify: `tests/ui-features.test.js`
- Modify: `tests/workflow-enhancements.test.js`
- Modify: `tests/passwordless-auth-ui.test.js`

- [ ] Add failing assertions for the Tailwind import, design tokens, readable responsive layouts, visible focus treatment, large checklist targets, desktop/mobile new-video controls, and absence of the legacy inline stylesheet.
- [ ] Run the focused presentation tests and confirm expected failures.
- [ ] Apply Tailwind utilities and a small theme stylesheet while keeping text, actions, responsive behavior, and branding intact.
- [ ] Replace obsolete HTML-string assertions with equivalent component/source assertions; do not weaken behavioral coverage.
- [ ] Run all presentation and component tests until green.

### Task 7: Remove legacy files and verify unchanged behavior

**Files:**
- Delete obsolete JavaScript entry/service/constant/type files replaced above
- Verify: `supabase/migrations/*` remains unchanged
- Verify: `app/.env` and secrets remain uncommitted

- [ ] Run `npm test` and every retained `tests/*.sh` script.
- [ ] Run `npm run typecheck`, `npm run build`, and `git diff --check`.
- [ ] Run the existing read-only Supabase integration test to confirm the unchanged database still serves typed application queries.
- [ ] Start the production preview and verify the root and logo return HTTP 200.
- [ ] Review `git diff -- supabase app/.env` to confirm no database migration or credential changes.
- [ ] Commit the completed migration with a concise message.
