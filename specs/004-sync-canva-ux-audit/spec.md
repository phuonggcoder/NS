# Feature Specification: Multi-Browser Sync Fix, Full Flow Audit, Pan/Zoom Canvas & Canva Focus UX

**Feature ID**: `004-sync-canva-ux-audit`  
**Methodology**: Spec-Driven Development (`speckit.org`)

---

## Audit Findings & Root Causes

1. **Multi-Browser Live Mismatch**:
   - Calling `loadProjectsState()` during `/?mode=live` / `/?mode=review` mutated an empty browser's `localStorage` by inserting a brand-new default `du-an-mau` project. `App.tsx` then treated `hasLocalMatch = true` and skipped fetching the real published spec from the server.
   - Edits saved via `PUT /api/projects` had no public read endpoint for `/?mode=live` / `/?mode=review`, causing different browsers to diverge from the author's latest Studio edits.
   - Missing `PUBLIC_DIR` isolation in `server-store.mjs` allowed an earlier automated test to overwrite `public/site.html` and `public/published-spec.json`.
   - Missing `credentials: 'same-origin'` in `publishSiteToServer` and `fetchFeedbackForSlug`.
   - `StudioApp.tsx` read `latestProjects` mutated inside a React state updater, creating a potential race during rapid edits.
2. **UI/UX Instability & Editing Ergonomics**:
   - Studio desktop preview (`max-width: 100%` in ~796px middle column) accidentally triggered `@container lp (max-width: 960px)` mobile stacking in Desktop view.
   - Top bar was cluttered with 12+ controls; users lacked free Pan/Zoom artboard movement and Canva-style bounding boxes around the exact text/image/card element being edited.

---

## User Stories

### US-1: True Cross-Browser Parity
- **As a** page creator, **I want** any browser or client device opening `/?mode=live` or `/?mode=review` (with or without `?slug=`) to fetch the exact latest project spec from `/api/public/site` (or `/clients/<slug>/spec.json` fallback) without `localStorage` collisions, **so that** customers always see the exact template and edits from my Studio.

### US-2: Canva-Style Element Focus & Instant Return-to-Preview
- **As an** editor, **I want** clicking an element on the canvas OR focusing a field in the right Inspector to draw a crisp Canva-style selection box + floating label on that exact element, AND a 1-click **"Về mục đang sửa"** / breadcrumb jump button, **so that** I never lose track of what I am editing.

### US-3: Free Pan / Zoom Artboard & Minimalist Toolbar
- **As a** designer, **I want** a true-width 1280px Desktop artboard (plus 768px Tablet / 390px Mobile) inside a smooth Figma/Canva-like infinite stage supporting free **Zoom** (`Ctrl+Wheel`, `+`/`-`, `Fit`, `100%`) and **Pan/Drag** (`Hand` tool, `Space+Drag`, middle-mouse drag), paired with a clean, uncluttered minimalist TopBar and floating bottom Canvas Dock.
