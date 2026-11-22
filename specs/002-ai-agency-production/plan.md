# Technical Plan: Feature 002 — AI Workbench, Contrast Engine & Production Delivery

## 1. WCAG Contrast Engine (`src/utils/contrast.ts`)
- Relative luminance & contrast ratio calculation following WCAG 2.1.
- Automatic foreground selection (`--lp-on-primary`, `--lp-on-accent`, `--lp-on-cta*`, `--lp-contrast-*`, `--lp-success-*`) and Light ↔ Dark palette conversion (`derivePaletteForMode`).
- Real-time theme contrast audit (`auditThemeContrast`) and 1-click fixer (`autoFixThemeContrast`).

## 2. Hybrid AI Engine (`src/ai/`)
- Zero-config local Vietnamese+English NLP extractor (`localAutoFill.ts`) and deterministic auditor (`localAuditor.ts`) covering 60+ Vietnamese spelling typos, punctuation, placeholder text, WCAG contrast, anchor integrity, grid balance, CRO, and SEO.
- Optional Gemini / OpenAI-compatible client (`llmClient.ts`) storing credentials solely in `specpage_ai_settings_v1` (never inside `LandingPageSpec` or published files).
- Non-destructive live preview overlay (`previewSpec` in `StudioApp.tsx`) with instant Accept / Reject / Exit Preview controls.

## 3. Multi-Client Workflow & Production Server
- `src/utils/projects.ts` + `ProjectsDrawer.tsx` + `PublishModal.tsx` + `ClientReviewBar.tsx`.
- Shared API contract implemented identically in both `vite.config.ts` (dev/preview) and `server.mjs` (production):
  - `POST /api/publish` (writes `public/site.html`, `public/published-spec.json`, and `public/clients/<slug>/{index.html,spec.json}`)
  - `GET /api/clients`
  - `GET/POST /api/feedback` (`data/feedback.json`)
  - `GET/POST /api/orders` (`data/orders.json`)
  - `GET /api/health`
