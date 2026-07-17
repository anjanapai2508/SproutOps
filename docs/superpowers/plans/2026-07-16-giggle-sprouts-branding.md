# Giggle Sprouts Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the supplied Giggle Sprouts logo to the SproutOps dashboard header and center the approved operational subheading.

**Architecture:** Keep the static single-page architecture. Store the raster logo under `app/assets/` so Nginx serves it alongside `index.html`; update only the header markup and its scoped CSS rules. Validate via the running static server and a mobile viewport inspection.

**Tech Stack:** HTML, embedded CSS, Nginx static hosting via Docker Compose or Python HTTP server.

---

## File structure

- Create: `app/assets/logo_new.png` — project-owned copy of the supplied Giggle Sprouts branding image.
- Modify: `app/index.html` — dashboard header markup and responsive CSS.

### Task 1: Add the logo as a served application asset

**Files:**
- Create: `app/assets/logo_new.png`
- Test: `app/assets/logo_new.png` served from `/assets/logo_new.png`

- [ ] **Step 1: Copy the supplied asset into the static application directory**

Run:

```bash
mkdir -p app/assets
cp /Users/roshanrathod/Documents/Giggle_Sprout/logo_new.png app/assets/logo_new.png
```

- [ ] **Step 2: Verify that the copied asset is a PNG**

Run:

```bash
file app/assets/logo_new.png
```

Expected: output identifies `app/assets/logo_new.png` as a PNG image.

- [ ] **Step 3: Verify that the static server serves the asset**

Run:

```bash
curl -fsSI http://127.0.0.1:8333/assets/logo_new.png
```

Expected: HTTP `200 OK` with `Content-type: image/png`.

- [ ] **Step 4: Commit the asset**

```bash
git add app/assets/logo_new.png
git commit -m "assets: add Giggle Sprouts logo"
```

### Task 2: Build the branded, responsive dashboard header

**Files:**
- Modify: `app/index.html`
- Test: `app/index.html` served from `/`

- [ ] **Step 1: Add the header-specific CSS rules**

In the existing `<style>` block, replace the current `.header` rule and add these rules before the `h1` rule:

```css
.header{
    margin-bottom:30px;
}

.brand-row{
    display:flex;
    align-items:center;
    gap:12px;
}

.brand-logo{
    width:72px;
    height:72px;
    object-fit:contain;
    flex:0 0 auto;
}

.header p{
    text-align:center;
}
```

- [ ] **Step 2: Add the mobile CSS adjustments**

Inside the existing `@media(max-width:600px)` block, add:

```css
.brand-row{
    gap:10px;
}

.brand-logo{
    width:56px;
    height:56px;
}
```

The existing mobile `h1` font size remains in place.

- [ ] **Step 3: Replace the text-only header markup**

Replace the current header contents with:

```html
<div class="brand-row">
    <img class="brand-logo" src="assets/logo_new.png" alt="Giggle Sprouts logo">
    <h1>SproutOps</h1>
</div>
<p>Operations center for Giggle Sprouts</p>
```

- [ ] **Step 4: Verify the document contains the required branding markup**

Run:

```bash
rg -n 'brand-row|brand-logo|Giggle Sprouts logo|Operations center for Giggle Sprouts' app/index.html
```

Expected: each required class or exact text appears in `app/index.html`.

- [ ] **Step 5: Verify the page and logo render from the local server**

Run:

```bash
curl -fsS http://127.0.0.1:8333/ | rg 'Operations center for Giggle Sprouts'
curl -fsSI http://127.0.0.1:8333/assets/logo_new.png
```

Expected: the first command prints the exact subheading and the second reports HTTP `200 OK` with `Content-type: image/png`.

- [ ] **Step 6: Inspect responsive layout**

Open `http://localhost:8333/` in a browser at desktop width and at 375px wide. Confirm the logo remains undistorted, the title stays beside it, and the subheading is centered below the brand row.

- [ ] **Step 7: Commit the header update**

```bash
git add app/index.html
git commit -m "feat: brand SproutOps header"
```
