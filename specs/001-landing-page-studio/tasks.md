# Task Breakdown: SpecPage Studio (`001-landing-page-studio`)

- [x] **T001**: Scaffold Spec Kit foundation (`.specify/memory/constitution.md`, `spec.md`, `plan.md`, `tasks.md`)
- [x] **T002**: Initialize `package.json`, `tsconfig.json`, `vite.config.ts` (with `POST /api/publish`), `index.html`, and install dependencies (`npm.cmd install`)
- [x] **T003**: Define strict TypeScript schema in `src/types/spec.ts` covering all 12 section types, themes, metadata, orders, and leads
- [x] **T004**: Implement 6 cohesive theme presets, Vietnamese font options, and `--lp-*` CSS variable builder in `src/data/themes.ts`
- [x] **T005**: Create bespoke SVG placeholder artwork (`src/data/placeholders.ts`) and 4 full Vietnamese starter templates + section catalog (`src/data/templates.ts`)
- [x] **T006**: Implement storage/sanitization/price helpers (`src/utils/storage.ts`), client image compression (`src/utils/imageUpload.ts`), and Spec Markdown generator (`src/utils/specMarkdown.ts`)
- [x] **T007**: Craft `.lp-*` container-query design system (`src/renderer/landing.css`) and icon helper (`src/renderer/IconRenderer.tsx`)
- [x] **T008**: Implement all 12 modular section renderers (`src/renderer/sections/*`) with layout variants and export hooks
- [x] **T009**: Implement Customer `OrderModal.tsx` and shared `LandingPage.tsx` (Studio editor overlay vs pure Customer mode)
- [x] **T010**: Build standalone zero-dependency customer HTML exporter (`src/exporter/exportHtml.ts`) and server publish integration
- [x] **T011**: Style Studio workspace (`src/studio/studio.css`) and build `TopBar.tsx`, `StructurePanel.tsx`, `DesignPanel.tsx`, `TemplatesSpecPanel.tsx`
- [x] **T012**: Build `FieldPrimitives.tsx` and `SectionInspector.tsx` covering full CRUD editing for all 12 section types
- [x] **T013**: Build `SpecModal.tsx` (Markdown + JSON Spec viewer/importer), `OrdersDrawer.tsx`, `StudioApp.tsx`, `App.tsx`, and `main.tsx`
- [x] **T014**: Run `npm.cmd run build` and verify zero TypeScript or bundler errors
- [x] **T015**: Run automated SSR rendering, standalone HTML export & inline JS validation, XSS/URL sanitization, and `POST /api/publish` (`public/site.html`, `public/published-spec.json`) verification *(live Chrome DevTools click-testing was skipped because Chrome remote debugging `DevToolsActivePort` was not active in this environment)*
