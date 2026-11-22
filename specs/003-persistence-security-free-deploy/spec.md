# Feature Specification: Persistent Cloud Storage, Admin Security & Free Production Deployment

**Feature ID**: `003-persistence-security-free-deploy`  
**Methodology**: Spec-Driven Development (`speckit.org`)

---

## User Stories

### US-1: Always-Remember Persistence (Even on Free Hosting with Ephemeral Disks)
- **As a** site builder running on free hosting (like Render Free), **I want** all my client projects, published HTML pages, customer orders, and client feedback to be saved permanently in a persistent backend (Upstash Redis Free, Supabase Free, or server JSON store) and auto-synced from Studio, **so that** my data is never lost when restarting containers or switching browsers.

### US-2: Admin Password Protection & Session Security
- **As the** workspace owner, **I want** Studio (`/`) and admin APIs (`/api/projects`, `/api/publish`, `/api/clients`, `/api/orders` read/delete, `/api/feedback` read) protected behind an Admin password and signed `HttpOnly` cookie session, **so that** strangers cannot edit or overwrite my clients' landing pages while customers and clients can still freely view published pages (`/?mode=live`, `/?mode=review`, `/clients/<slug>/index.html`) and submit orders/feedback.

### US-3: Rate Limiting & Hardened HTTP Headers
- **As an** operator exposing the app to the public internet, **I want** login brute-force rate limiting, public form spam rate limiting, strict path-traversal guards, and standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS` on HTTPS), **so that** the deployment is safe for real customers.

### US-4: 100% Free Cloud Deployment Blueprint
- **As a** user without a paid VPS, **I want** a ready-to-use `render.yaml` blueprint, `supabase-schema.sql`, updated `Dockerfile`, and step-by-step Vietnamese deployment instructions for Render Free + Upstash Redis Free.
