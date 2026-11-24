# PROJECT AUDIT — SpecPage Studio

**Date:** 2026-11-24
**Repository:** `https://github.com/phuonggcoder/NS` (`d:\VibeCoding\NS`)
**Production Target:** `https://specpage-studio.onrender.com/`
**Methodology:** Spec-Driven Development (`speckit.org`) aligned with `.specify/memory/constitution.md`

---

## 1. Current Architecture

### 1.1 Frontend (`src/`)
- **Stack:** React 19.1, TypeScript 5.8, Vite 6.2, `lucide-react` icons.
- **State & Spec Model:** `LandingPageSpec` (`src/types/spec.ts`) drives all rendering as a pure declarative spec. `StudioApp.tsx` maintains a 40-step undo/redo history (`past`, `present`, `future`) and syncs active project state to `localStorage` and `/api/projects` (debounced 900ms).
- **Renderer (`src/renderer/`):** `LandingPage.tsx` renders 13 section types (`navbar`, `hero`, `stats`, `about`, `products`, `gallery`, `features`, `pricing`, `testimonials`, `faq`, `cta`, `contact`, `footer`) using CSS Container Queries (`container-type: inline-size; container-name: lp;`) in `landing.css` for 1:1 parity across Studio, Live mode, Review mode, and exported HTML.
- **Static Exporter (`src/exporter/exportHtml.ts`):** Uses `react-dom/server` (`renderToStaticMarkup`) + inlined `landing.css` + vanilla JS runtime (`buildStandaloneScript`) for mobile drawer, FAQ accordion, contact form, and quick-order modal.

### 1.2 Backend (`server*.mjs`)
- **Runtime:** Zero-dependency Node 22 ESM HTTP server (`server.mjs`), also mounted as Vite dev/preview middleware in `vite.config.ts`.
- **API Router (`server-api.mjs`):** Handles `/api/health`, `/api/public/site`, `/api/auth/*`, `/api/projects`, `/api/clients`, `/api/publish`, `/api/feedback`, and `/api/orders`, plus serving `/site.html`, `/published-spec.json`, `/clients/:slug/index.html`, and `/clients/:slug/spec.json` from persistent storage.
- **Authentication (`server-auth.mjs`):** Single admin password (`ADMIN_PASSWORD` env var or scrypt-hashed `admin_auth` in KV), HMAC-SHA256 signed `HttpOnly`, `SameSite=Lax` cookie (`specpage_session`), in-memory IP-based rate limiting, security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS on HTTPS).
- **Storage (`server-store.mjs`):** 3-tier KV abstraction (`upstash` REST API, `supabase` REST `specpage_kv` table, `local` disk `data/kv/`).

---

## 2. Current Features (Verified Working in Codebase)
1. **Landing Page Studio:** Visual canvas with Desktop/Tablet/Mobile viewport switching, zoom/pan stage (`CanvasStage.tsx`), section add/delete/duplicate/reorder/visibility toggle (`StructurePanel.tsx`), inline element focus highlighting (`StudioFocusContext.tsx`), and full section property inspector (`SectionInspector.tsx`).
2. **Theme Presets & Contrast Guard:** Built-in `THEME_PRESETS` (`src/data/themes.ts`), Light/Dark mode derivation (`derivePaletteForMode`), WCAG contrast audit & auto-fix (`src/utils/contrast.ts`).
3. **Starter Templates & Spec Import/Export:** Starter templates (`src/data/templates.ts`), `spec.md` & `spec.json` export/import.
4. **Local AI Auto-Fill & Auditor:** Deterministic Vietnamese brief parser (`localAutoFill.ts`) and rule-based CRO/WCAG/spelling/anchor auditor (`localAuditor.ts`) with Preview / Accept / Reject workflow.
5. **Multi-Project & Orders:** `ProjectsDrawer.tsx` manages multiple `ClientProject` records; `OrdersDrawer.tsx` displays captured orders and contact leads.
6. **Cloud Persistence & Auth:** Admin login gate (`AuthGate.tsx`), password setup/change (`SecurityModal.tsx`), publish to `/clients/<slug>/index.html`.

---

## 3. Missing Features (Phase 1 Scope)
1. **Digital Menu & QR Menu Module:** No dedicated restaurant/café/milk-tea/retail digital menu system (categories, items, sale price, sold-out/featured/best-seller badges, allergens, option groups with required/optional rules & surcharges, mobile-first menu renderer, QR code generation with branch/table params and PNG/SVG download).
2. **Custom Saved Themes & Preview-Before-Apply:** `DesignPanel.tsx` lacks custom named theme saving/deletion, `secondary` color / `fontSize` tokens, and temporary preview-before-apply.
3. **7 Distinct Industry Templates:** Current templates do not cover the full 7-industry lineup (`business`, `restaurant`, `coffee-shop`, `milk-tea`, `bakery`, `personal-portfolio`, `service-business`) with distinct structural layouts and integrated Digital Menu starters, nor preview-before-apply.
4. **Server-Side AI Proxy & Copywriting Suite:** Currently, `llmClient.ts` stores `apiKey` in browser `localStorage` and calls Gemini/OpenAI directly from the browser. Missing server-side AI proxy, rate limiting, and full copywriting tools (website copy, product/dish descriptions, headlines, ad copy, normalize, multi-language translation, spellcheck, SEO suggestions) with mandatory user review/edit before applying.
5. **Version History:** Only in-memory 40-step Undo/Redo exists; no persistent version snapshots (with timestamp, actor, scope) or restore mechanism for Website and Digital Menu.
6. **Hardened Client Review Workflow:** `/?mode=review&slug=...` has no `reviewToken` protection, no `Rejected` status flow, no feedback history view for the client, and `getPublicSiteSpec` returns draft `projects` data publicly without distinguishing draft vs published.
7. **SEO Management:** Only basic `title` and `description` exist; missing Open Graph, Twitter Card, Canonical URL, `robots.txt`, dynamic `sitemap.xml`, Digital Menu SEO, and automated SEO checker (heading hierarchy, missing `alt`, broken links).
8. **Privacy-Friendly Analytics:** Zero page view, unique visitor, menu view, QR visit, popular item, or traffic source tracking/dashboard.
9. **Automated Testing:** No `test` script and zero automated tests exist in the repository.

---

## 4. Technical Debt
1. **Monolithic UI Files:** `src/studio/inspector/SectionInspector.tsx` (~84KB) and `src/studio/StudioApp.tsx` (~36KB) contain large amounts of inline editing and orchestration logic. New modules (Digital Menu, Version History, SEO, Analytics) must be built as clean independent modules to avoid bloating them further.
2. **Silent Storage Read Failures:** `storeGet` in `server-store.mjs` catches all errors and returns `fallback` (e.g., `null` or `[]`). If Upstash/Supabase experiences a transient network or 5xx error during initial hydration or feedback/order append, the caller cannot distinguish "key does not exist" from "storage error" and risks overwriting existing cloud data.
3. **Silent Sync Failure in Studio:** `StudioApp.tsx` sets `syncStatus = 'offline'` on save failure without warning the user before tab reload/close (`beforeunload`).
4. **Unchecked `node_modules` Absence on Fresh Checkout:** `npm run check` fails until `npm install` is run; no CI/test script in `package.json`.

---

## 5. Security Risks
1. **Frontend API Key Exposure (`HIGH`):** `src/ai/llmClient.ts` stores `apiKey` in `localStorage` (`specpage_ai_settings_v1`) and sends requests directly from the browser to Gemini/OpenAI. Keys are exposed in browser storage/network devtools. **Remediation:** Move all external LLM calls to server-side `server-ai.mjs` using server environment variables (`GEMINI_API_KEY`, `OPENAI_API_KEY`).
2. **Unprotected Draft Spec & Unauthenticated Review (`MEDIUM-HIGH`):** `getPublicSiteSpec` reads directly from draft `projects` store for any caller who knows or guesses a `slug`, and `/api/feedback` accepts status-like submissions without verifying a `reviewToken`. **Remediation:** Protect draft review mode with per-project `reviewToken`, serve only published sites on public `mode=live` (with backward-compatible fallback only when no published snapshot exists yet or explicitly published), and validate `reviewToken` on review fetch & feedback.
3. **Missing CSRF Origin Validation (`MEDIUM`):** Cookie-authenticated admin endpoints (`PUT /api/projects`, `POST /api/publish`, `DELETE /api/orders`, etc.) rely solely on `SameSite=Lax` without verifying `Origin`/`Referer` headers on mutations. **Remediation:** Enforce same-origin check on state-changing requests.
4. **Custom CSS Injection Surface (`LOW-MEDIUM`):** `meta.customCss` only strips `</style>`. While admin-only, server/client validation should keep rejecting unsafe HTML breakouts.

---

## 6. Performance Issues
1. **Full Projects Array Sync on Every Edit:** `PUT /api/projects` sends the entire `projects` array (containing all project specs) on every debounced edit. Acceptable for small project counts in Phase 1, but `digitalMenu` images should be size-checked/compressed (`imageUpload.ts`) to avoid bloating the JSON payload beyond KV limits.
2. **Large Initial Studio Bundle:** `SectionInspector.tsx` and heavy drawers load eagerly; new heavy modals (Digital Menu Editor, Analytics, Version History, SEO) should be cleanly modularized and lazy-loaded or conditionally rendered.
3. **Unoptimized Google Fonts / Static HTML:** `exportHtml.ts` already inlines CSS for zero-roundtrip rendering; Digital Menu mobile page should follow the same fast-load, minimal-JS pattern.

---

## 7. Recommended Changes (Prioritized for Phase 1)
1. **Data Integrity & Security Hardening:** `storeGetStrict`, `backupStoreSnapshot`, CSRF origin verification, `reviewToken` generation & verification, Studio `beforeunload` + error toast + manual Save.
2. **Digital Menu & QR Menu:** Full commercial-grade menu categories, items, option groups/surcharges, mobile-first customer page (`/menu/:slug`), and PNG/SVG QR generator.
3. **Theme & Template Upgrade:** Custom saved themes + preview-before-apply, 7 distinct industry templates, responsive audit across Studio & customer views.
4. **Server-Side AI Proxy:** Secure multi-provider AI endpoint with rate limiting, fallback, and full Vietnamese copywriting/translation/SEO suite.
5. **Version History & Client Review:** Persistent version snapshots & safe restore + token-protected Pending/Approved/Rejected review workflow.
6. **SEO & Analytics:** Full Meta/OG/Canonical/JSON-LD, `/sitemap.xml`, `/robots.txt`, SEO checker, and privacy-first analytics (no IP/PII stored).
7. **Automated Testing:** Comprehensive `node --test` suite covering auth, CSRF, persistence, Digital Menu pricing/validation, QR, publish, review tokens, SEO, analytics, and AI fallback.
