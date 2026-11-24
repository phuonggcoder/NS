# Tasks: Phase 1 Stabilization & Digital Menu

- [x] T001 Audit repository, install dependencies (`qrcode`), add `test` script
- [x] T002 Harden `server-store.mjs` (`storeGetStrict`, `backupStoreSnapshot`, `getPublicSiteSpec` published vs draft separation)
- [x] T003 Harden `server-auth.mjs` & `server-api.mjs` (CSRF Origin check, `generateReviewToken`, rate limits)
- [x] T004 Harden `StudioApp.tsx` save lifecycle (`syncStatus` error handling, `beforeunload`, manual save)
- [x] T005 Extend `src/types/spec.ts` with Digital Menu, Theme tokens, SEO meta, Review token, Rejected status
- [x] T006 Implement `src/data/digitalMenuDefaults.ts` (defaults, price calculator, required option validator)
- [x] T007 Implement QR code utility & `QrMenuPanel.tsx` (PNG/SVG export, branch/table targets, stable `/menu/<slug>`)
- [x] T008 Build Studio Digital Menu Editor (`DigitalMenuEditor.tsx`, `CategoryManager.tsx`, `MenuItemEditor.tsx`, `OptionGroupEditor.tsx`, `MenuAppearancePanel.tsx`)
- [x] T009 Build Mobile-First Customer Digital Menu (`DigitalMenuPage.tsx`, `MenuItemModal.tsx`, `digital-menu.css`) & `/api/public/menu` + `/menu/:slug` routing
- [x] T010 Upgrade Theme System (custom themes persistence via `/api/themes`, preview-before-apply, `secondary` & `fontSize` CSS vars)
- [x] T011 Upgrade Template System (7 distinct industry templates + preview-before-apply) & responsive Studio/Customer CSS polish
- [x] T012 Implement Server-Side AI Proxy (`server-ai.mjs`) & upgrade `llmClient.ts` + `AiAssistantPanel.tsx` copywriting suite
- [x] T013 Implement Version History (`/api/versions`, `/api/versions/restore`, `VersionHistoryDrawer.tsx`)
- [x] T014 Upgrade Client Review (`/api/public/review`, token validation, `approved`/`rejected` status updates, `ClientReviewBar.tsx`, `PublishModal.tsx`, `ProjectsDrawer.tsx`)
- [x] T015 Implement SEO Management (`SeoPanel.tsx`, `exportHtml.ts` OG/Canonical/JSON-LD, `/robots.txt`, `/sitemap.xml`)
- [x] T016 Implement Privacy-Friendly Analytics (`/api/analytics/track`, `/api/analytics`, `AnalyticsDrawer.tsx`)
- [x] T017 Write & run automated `node:test` suite, `npm run check`, `npm run build`, and smoke-check server
- [x] T018 Author `FINAL_REVIEW.md`
