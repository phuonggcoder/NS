# Technical Plan: Feature 004 — Sync Fix, Canva Focus & Pan/Zoom Stage

## 1. Server-First Cross-Browser Resolution
- `server-store.mjs`: Add `getPublicDir(rootDir)` (`process.env.PUBLIC_DIR` override) and `getPublicSiteSpec(slug, rootDir)` reading the latest matching project `spec` from `projects` store first, falling back to `getPublishedSite`.
- `server-api.mjs`: Expose public read-only `GET /api/public/site?slug=...` with `Cache-Control: no-store`.
- `src/utils/projects.ts`: Add pure read-only `readLocalSpecReadOnly(slug)` (zero side-effect writes!).
- `src/App.tsx`: Load `/api/public/site` first on `mode=live` / `mode=review`, rendering a subtle loading state until resolved so wrong starter templates never flash.

## 2. Canva-Style Element Focus (`src/renderer/StudioFocusContext.tsx`)
- React context providing `useStudioFieldProps(sectionId, fieldKey, fieldLabel)` returning `{}` outside Studio or during Clean Preview.
- Inside Studio, highlights the focused element with `.lp-canva-active` + floating `::after` badge and links bidirectional focus between Canvas elements and Inspector fields.

## 3. Free Pan/Zoom Artboard & Minimalist UI
- `src/studio/CanvasStage.tsx`: True 1280px/768px/390px artboard with `ResizeObserver` fit-zoom, pointer drag panning (`Hand`, `Space+Drag`, middle click), `Ctrl+Wheel` zoom, imperative `focusTarget(sectionId, fieldKey)` centering, and floating bottom Canvas Dock.
- `src/studio/TopBar.tsx`: Streamlined 3-zone minimalist bar with active focus breadcrumb + overflow popover.
