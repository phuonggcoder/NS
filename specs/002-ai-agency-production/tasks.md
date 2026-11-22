# Task Breakdown: Feature 002 (`002-ai-agency-production`)

- [x] **T201**: Scaffold Feature 002 Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`)
- [x] **T202**: Build WCAG contrast utility (`src/utils/contrast.ts`) & upgrade `src/types/spec.ts`
- [x] **T203**: Upgrade `src/data/themes.ts` (8 presets, 9 fonts, contrast tokens), `src/data/templates.ts` (`gallery` catalog), and `index.html`
- [x] **T204**: Fix all contrast traps in `src/renderer/landing.css`, `CtaSection.tsx`, `LandingPage.tsx`, add `GallerySection.tsx`, and update `exportHtml.ts`
- [x] **T205**: Build Hybrid AI engine (`src/ai/aiTypes.ts`, `localAutoFill.ts`, `localAuditor.ts`, `llmClient.ts`)
- [x] **T206**: Build `src/utils/projects.ts` and `src/studio/AiAssistantPanel.tsx` (Auto-Fill + Audit Preview/Accept/Reject)
- [x] **T207**: Upgrade `DesignPanel.tsx`, `SectionInspector.tsx` (`gallery` + per-section colors/width/align), and `TemplatesSpecPanel.tsx` (`customCss`)
- [x] **T208**: Build `ProjectsDrawer.tsx`, `PublishModal.tsx`, `ClientReviewBar.tsx`, and wire into `TopBar.tsx`, `StudioApp.tsx`, `studio.css`, and `App.tsx`
- [x] **T209**: Upgrade `vite.config.ts`, `package.json`, and create `server-api.mjs`, `server.mjs` + deployment configs (`vercel.json`, `netlify.toml`, `Dockerfile`, `.dockerignore`, `.gitignore`, `.env.example`, `README.md`)
- [x] **T210**: Run `npm.cmd run build` and verify zero TypeScript/Vite errors (`tsc --noEmit && vite build`)
- [x] **T211**: Restart Vite dev server and verify AI Auto-Fill, AI Audit/Patch, WCAG Contrast (8 presets + mode flips + bright primary), Gallery Export, Multi-Client Publish/Feedback/Orders APIs, and `server.mjs` smoke test
