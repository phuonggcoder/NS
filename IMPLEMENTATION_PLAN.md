# IMPLEMENTATION PLAN — SpecPage Studio Phase 1

## 1. Data Integrity & Security Hardening
- **Description:** Prevent silent cloud data loss on transient KV errors, enforce CSRF origin checks on admin mutations, protect draft reviews with tokens, and warn users before losing unsaved Studio edits.
- **Files:** `server-store.mjs`, `server-auth.mjs`, `server-api.mjs`, `src/studio/StudioApp.tsx`, `src/utils/auth.ts`
- **Changes:** Add `storeGetStrict`, `backupStoreSnapshot`, strict `getPublicSiteSpec` published/draft split, `verifySameOrigin`, `generateReviewToken`, and `beforeunload` + manual save/retry in Studio.
- **Dependencies:** None (foundation).
- **Risks:** Blocking valid reverse-proxy requests if `Host`/`Origin` headers differ; mitigate by checking `x-forwarded-host` alongside `host` and allowing requests with no `Origin` header only for same-site non-CORS or CLI calls? No—browsers always send `Origin` on cross-site `POST/PUT/DELETE`; validate `Origin` (or `Referer` if `Origin` absent) against `host` / `x-forwarded-host` when present.
- **Acceptance Criteria:** Cross-origin admin `POST/PUT/DELETE` rejected with `403`; transient KV errors throw instead of returning fallback `null`; Studio displays saving/error states and warns on unload when dirty.
- **Test Cases:** Cross-origin `PUT /api/projects` returns `403`; `storeGetStrict` distinguishes missing key vs read failure; `backupStoreSnapshot` persists snapshot.

## 2. Digital Menu & QR Menu (Commercial Module)
- **Description:** Full electronic menu builder for restaurants, cafés, milk-tea shops, and retail stores with categories, items, customization option groups/surcharges, mobile-first public menu, and PNG/SVG QR code generator.
- **Files:** `src/types/spec.ts`, `src/data/digitalMenuDefaults.ts`, `src/utils/qrCode.ts`, `src/studio/menu/*`, `src/renderer/menu/*`, `server-api.mjs`, `server.mjs`, `src/App.tsx`
- **Changes:** Add `DigitalMenuConfig` schema, pure pricing/validation helpers, Studio menu workspace + mobile preview, QR generator with branch/table params + PNG/SVG download, `/api/public/menu`, and `/menu/:slug` route.
- **Dependencies:** Module 1 (`server-store.mjs`, `server-api.mjs`).
- **Risks:** Large inline base64 images bloating project JSON; mitigate using existing `imageUpload.ts` client-side compression.
- **Acceptance Criteria:** Categories & items CRUD persists across reload; required option validation blocks incomplete add/order; surcharge calculation matches unit + options; QR PNG & SVG download works; mobile view has zero horizontal scroll at 375px.
- **Test Cases:** `calculateConfiguredItemPrice` & `validateRequiredOptionGroups` unit tests; `GET /api/public/menu` returns menu for enabled slug and 404 for disabled/missing.

## 3. Theme System, 7 Industry Templates & Responsive UI
- **Description:** Expand theme tokens (`secondary`, `fontSize`), allow saving custom themes & previewing before apply, provide 7 structurally distinct industry templates, and polish mobile/tablet responsiveness.
- **Files:** `src/types/spec.ts`, `src/data/themes.ts`, `src/data/templates.ts`, `src/utils/customThemes.ts`, `src/studio/DesignPanel.tsx`, `src/studio/TemplatesSpecPanel.tsx`, `src/renderer/landing.css`, `src/studio/studio.css`, `server-api.mjs`
- **Changes:** Add `/api/themes` endpoint, custom theme save/delete/preview UI, 7 industry templates (`business`, `restaurant`, `coffee-shop`, `milk-tea`, `bakery`, `personal-portfolio`, `service-business`) with preview modal and responsive drawer improvements.
- **Dependencies:** Module 2 (for food/beverage template Digital Menu starters).
- **Risks:** Breaking legacy `templateId` projects; mitigate by keeping legacy IDs working and defaulting missing theme fields.
- **Acceptance Criteria:** Previewing a theme or template does not mutate project until applied; themes remain isolated per website; all 7 templates have distinct structures.
- **Test Cases:** Legacy spec rendering without `secondary`/`fontSize` succeeds; `/api/themes` GET/PUT requires admin auth and persists.

## 4. AI Assistant (Server-Side Proxy & Copywriting Suite)
- **Description:** Move AI provider keys to server environment, add multi-provider `/api/ai/generate` endpoint with rate limit and local fallback, and expand AI Workbench to cover copywriting, dish descriptions, headlines, ads, normalize, translate, spellcheck, and SEO tips.
- **Files:** `server-ai.mjs`, `server-api.mjs`, `src/ai/aiTypes.ts`, `src/ai/llmClient.ts`, `src/studio/AiAssistantPanel.tsx`
- **Changes:** Remove frontend API key storage, implement server-side Gemini/OpenAI-compatible proxy + enhanced Vietnamese local fallback, add editable AI output workbench requiring user confirmation before applying.
- **Dependencies:** Module 1 (auth & rate limiting).
- **Risks:** External LLM timeout or malformed JSON; mitigate with 15s AbortController timeout, JSON fence stripping, and automatic local fallback.
- **Acceptance Criteria:** Zero API keys stored in browser; unauthenticated `/api/ai/generate` returns 401; rate limit enforced; user can edit AI result before applying.
- **Test Cases:** `/api/ai/generate` returns 401 when unauthenticated, returns valid structured fallback when no provider key is set.

## 5. Version History & Token-Protected Client Review
- **Description:** Persistent version snapshots & restore for Website and Digital Menu, plus token-protected Client Review with Pending/Approved/Rejected statuses and feedback history.
- **Files:** `server-api.mjs`, `src/studio/VersionHistoryDrawer.tsx`, `src/studio/ClientReviewBar.tsx`, `src/studio/ProjectsDrawer.tsx`, `src/studio/PublishModal.tsx`, `src/App.tsx`
- **Changes:** Add `/api/versions` & `/api/versions/restore` (with auto pre-restore backup), `reviewToken` generation/verification on `/api/public/review`, `rejected` status support on `/api/feedback`.
- **Dependencies:** Module 1 & 2.
- **Risks:** Restoring an old version accidentally losing current edits; mitigate by always auto-saving a pre-restore safety snapshot.
- **Acceptance Criteria:** Restoring version reverts spec/menu accurately while keeping a backup of the pre-restore state; invalid review token returns 403; client approve/reject updates project status.
- **Test Cases:** Version save & restore round-trip test; `/api/public/review` rejects bad token with 403 and accepts valid token; `/api/feedback` `rejected` updates project status.

## 6. SEO Management & Privacy-Friendly Analytics
- **Description:** Comprehensive SEO metadata + checker + dynamic `/sitemap.xml` & `/robots.txt`, plus privacy-first analytics (no raw IPs/PII) with date/website filters.
- **Files:** `src/types/spec.ts`, `src/exporter/exportHtml.ts`, `server-api.mjs`, `server.mjs`, `src/studio/SeoPanel.tsx`, `src/studio/AnalyticsDrawer.tsx`, `src/utils/analytics.ts`, `src/App.tsx`
- **Changes:** Add OG/Canonical/Robots/JSON-LD export, dynamic sitemap & robots routes, SEO heading/alt/link audit tool, `/api/analytics/track` & `/api/analytics`, and dashboard UI.
- **Dependencies:** Module 2 (for Digital Menu SEO & QR/Menu analytics).
- **Risks:** Analytics payload bloat; mitigate by aggregating daily buckets on the server (max 90 days) and hashing visitor daily IDs without storing IPs.
- **Acceptance Criteria:** Exported HTML includes OG/Canonical tags; `/sitemap.xml` & `/robots.txt` return valid XML/text; analytics aggregates page/menu/QR views and popular items with zero PII stored.
- **Test Cases:** `/robots.txt` and `/sitemap.xml` HTTP 200 content tests; `/api/analytics/track` increments counters and stores no IP fields; `/api/analytics` returns filtered totals.
