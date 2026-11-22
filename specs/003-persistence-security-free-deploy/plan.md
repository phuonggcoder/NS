# Technical Plan: Feature 003 — Persistence, Security & Free Cloud Deployment

## Architecture
- `server-store.mjs`: Unified async KV persistence supporting `upstash` (REST), `supabase` (PostgREST), and `local` (`DATA_DIR` / `data/kv/`), plus `savePublishedSite` / `getPublishedSite` / `listPublishedSites` with transparent disk re-hydration.
- `server-auth.mjs`: Timing-safe `ADMIN_PASSWORD` or salted `scrypt` first-time password setup, HMAC-SHA256 signed `HttpOnly` session cookies (`specpage_session`), security headers, and sliding-window IP rate limiter.
- `server-api.mjs`, `server.mjs`, `vite.config.ts`: Enforces `isRequestAuthenticated` on admin routes while keeping customer landing pages, `/?mode=live`, `/?mode=review`, `POST /api/orders`, and `POST /api/feedback` public.
- `src/utils/auth.ts`, `src/studio/AuthGate.tsx`, `src/studio/SecurityModal.tsx`, `src/studio/StudioApp.tsx`, `src/studio/TopBar.tsx`, `src/App.tsx`: Client-side login/setup screen, 900ms debounced project cloud auto-sync, and security status dialog.
- `render.yaml`, `supabase-schema.sql`, `Dockerfile`, `.env.example`, `README.md`: Zero-cost production blueprint.
