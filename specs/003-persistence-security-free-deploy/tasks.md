# Task Breakdown: Feature 003 (`003-persistence-security-free-deploy`)

- [x] **T301**: Create Feature 003 Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`)
- [x] **T302**: Implement multi-backend persistent store (`server-store.mjs`) with Upstash, Supabase & local disk fallback
- [x] **T303**: Implement server authentication, signed `HttpOnly` cookies, rate limiting & security headers (`server-auth.mjs`)
- [x] **T304**: Upgrade `server-api.mjs`, `server.mjs`, and `vite.config.ts` with protected endpoints and ephemeral-disk fallback
- [x] **T305**: Implement `src/utils/auth.ts`, `src/studio/AuthGate.tsx`, `src/studio/SecurityModal.tsx`, and wire sync/auth into `TopBar.tsx`, `StudioApp.tsx`, `studio.css`, and `App.tsx`
- [x] **T306**: Add `render.yaml`, `supabase-schema.sql`, update `Dockerfile`, `.env.example`, and `README.md`
- [x] **T307**: Build (`npm.cmd run build`), restart Vite dev server, and run Mode A + Mode B security & persistence verification suite
