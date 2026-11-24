# Plan: Context-Aware Gemini AI & Long-Term Brand Memory

## Architecture
- **KV Memory (`server-ai-memory.mjs`)**: Persists `ai:memory:<projectId>` via `server-store.mjs` (`storeGet`/`storeSet`), supporting Upstash Redis, Supabase, and Local disk seamlessly.
- **Context Builder**: Summarizes `LandingPageSpec`, `DigitalMenuConfig`, SEO/layout findings, `queryAnalytics`, and `ai:memory:<projectId>` into `systemInstruction` for Gemini (`generativelanguage.googleapis.com`).
- **Self-Learning Loop (`POST /api/ai/feedback`)**: Distills `< 20 words` preference rules via Gemini (with deterministic Vietnamese fallback) when `action` is `'edited'` or `'rejected'`, deduplicating and capping `learnedRules` at 20 items.
- **Security**: `GEMINI_API_KEY` stays strictly in server `process.env`; all AI endpoints require admin session + same-origin CSRF check + rate limiting.
