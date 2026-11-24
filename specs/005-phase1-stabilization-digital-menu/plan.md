# Implementation Plan (Spec Kit): Phase 1 Stabilization & Digital Menu

## Technical Context
- **Frontend**: React 19, TypeScript 5.8, Vite 6.2 (`src/`)
- **Backend**: Node 22 ESM HTTP server (`server.mjs`, `server-api.mjs`, `server-auth.mjs`, `server-store.mjs`, `server-ai.mjs`)
- **Storage**: 3-tier KV (`upstash`, `supabase`, `local` disk `data/kv/`)
- **Testing**: `node --test test/*.test.mjs` + `tsc --noEmit` + `vite build`

## Architecture Decisions
1. **Backward-Compatible Schema Evolution**: Extend `LandingPageSpec`, `SiteMeta`, `ThemeConfig`, and `ClientProject` in `src/types/spec.ts` using strictly optional fields (`digitalMenu?`, `reviewToken?`, `colors.secondary?`, `typography.fontSize?`, `meta.ogTitle?`, etc.). Existing JSON specs load with zero migration failures.
2. **Modular Studio Subsystems**: Isolate new features into dedicated modules (`src/studio/menu/`, `src/renderer/menu/`, `src/studio/VersionHistoryDrawer.tsx`, `src/studio/SeoPanel.tsx`, `src/studio/AnalyticsDrawer.tsx`, `server-ai.mjs`) rather than expanding `SectionInspector.tsx`.
3. **Server-Side Secrets & Public/Draft Separation**: Keep AI API keys in `process.env` only. Separate `/api/public/site` (published sites), `/api/public/menu` (enabled Digital Menus), and `/api/public/review` (token-gated draft review).
4. **Privacy-First Analytics**: Hash `(ip + userAgent + date + dailySalt)` on the server to count daily unique visitors without persisting IP addresses, cookies, or personal data.
