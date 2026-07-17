# Responsive New Video Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep creation and progress controls reachable in a compact sticky header, with a mobile-only floating New Video action.

**Architecture:** Reuse the existing `data-action="open-modal"` event binding for both controls. Update the single-page render template and CSS only; no state or modal behavior changes are required.

**Tech Stack:** HTML, CSS, vanilla JavaScript, shell regression checks.

---

### Task 1: Cover responsive New Video controls

**Files:**
- Create: `tests/responsive_new_video_action_test.sh`
- Modify: `app/index.html`

- [ ] **Step 1: Write the failing test**

```sh
#!/usr/bin/env bash
set -euo pipefail

rg -q '\.header \{[^}]*position: sticky' app/index.html
rg -q 'backdrop-filter: blur' app/index.html
rg -q 'class="new-video-btn header-new-video-btn"' app/index.html
rg -q 'class="new-video-btn new-video-fab"' app/index.html
rg -q '@media \(max-width: 640px\)' app/index.html
rg -q '\.header-new-video-btn \{ display: none; \}' app/index.html
rg -q '\.new-video-fab \{ display: inline-flex; \}' app/index.html
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/responsive_new_video_action_test.sh`

Expected: failure because the sticky header and distinct desktop/mobile controls are absent.

- [ ] **Step 3: Implement the minimal responsive control styles and markup**

```html
<button class="new-video-btn header-new-video-btn" type="button" data-action="open-modal">+ New Video</button>
<button class="new-video-btn new-video-fab" type="button" data-action="open-modal" aria-label="New Video">+</button>
```

Add compact sticky-header styles, hide the FAB by default, then swap visibility below 641px. Keep both buttons on the existing `data-action="open-modal"` path.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/responsive_new_video_action_test.sh`

Expected: exit 0.

- [ ] **Step 5: Verify existing interactions remain covered**

Run: `bash tests/header_branding_test.sh && bash tests/logo_asset_test.sh && bash tests/responsive_new_video_action_test.sh`

Expected: all checks exit 0.
