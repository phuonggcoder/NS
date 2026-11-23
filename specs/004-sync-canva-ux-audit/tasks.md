# Task Breakdown: Feature 004 (`004-sync-canva-ux-audit`)

- [x] **T401**: Update `.specify/memory/constitution.md` and create `specs/004-sync-canva-ux-audit/{spec.md, plan.md, tasks.md}`
- [x] **T402**: Add `PUBLIC_DIR` isolation and `getPublicSiteSpec` to `server-store.mjs`, expose `GET /api/public/site` in `server-api.mjs`, and update `server.mjs`
- [x] **T403**: Fix `credentials: 'same-origin'` in `exportHtml.ts` & `projects.ts`, add `readLocalSpecReadOnly`, and make `App.tsx` Server-First for `live`/`review`
- [x] **T404**: Create `src/renderer/StudioFocusContext.tsx`, add Canva focus & clean-preview CSS to `landing.css`, and update `LandingPage.tsx`
- [x] **T405**: Wire `useStudioFieldProps` across all 13 section renderers (`src/renderer/sections/*.tsx`)
- [x] **T406**: Build `src/studio/CanvasStage.tsx` (true-width 1280px/768px/390px artboard, Pan/Zoom, Bottom Dock, `focusTarget`)
- [x] **T407**: Redesign `src/studio/TopBar.tsx` into a minimalist bar with active focus breadcrumb & overflow popover
- [x] **T408**: Wire bidirectional field focus & "Định vị mục này trên trang" into `FieldPrimitives.tsx`, `SectionInspector.tsx`, `StudioApp.tsx`, and `studio.css`
- [x] **T409**: Restore valid `public/site.html`, `public/published-spec.json`, and `public/clients/du-an-mau/*`, run `npm.cmd run build`, restart Vite dev server, and pass full cross-browser parity, Canva export isolation, and security test suite
