# Feature Specification: Phase 1 — Product Improvement, Stabilization & Digital Menu

**Feature Branch**: `005-phase1-stabilization-digital-menu`
**Created**: 2026-11-24
**Status**: In Progress

## User Scenarios & Testing

### User Story 1 — Reliable Editing, Data Integrity & Security (Priority: P0)
As a Studio administrator, I want my edits to auto-save safely with clear saving/error feedback and unsaved-change protection on page reload, and I want admin APIs and draft reviews to be protected against CSRF, silent cloud storage wipes, and secret leakage.
- **Acceptance Scenarios**:
  1. When saving to `/api/projects` fails, Studio shows an error indicator/toast with manual retry and warns before leaving/reloading the page.
  2. State-changing admin requests from a mismatched `Origin` are rejected with HTTP 403.
  3. Transient storage read failures throw rather than returning empty arrays that could overwrite cloud data.

### User Story 2 — Digital Menu & QR Code Menu (Priority: P1)
As a restaurant, café, milk-tea shop, or retail owner, I want to manage categories, menu items, customization options (Size, Topping, Sugar, Ice, Add-ons with required/optional rules and surcharges), customize the menu appearance, and generate stable PNG/SVG QR codes (including branch/table params) so customers can open a fast mobile-first menu on their phones.
- **Acceptance Scenarios**:
  1. Admin can create/edit/delete/reorder/toggle visibility of categories and items with regular price, sale price, available/sold-out status, featured/best-seller badges, ingredients, allergens, and option groups.
  2. Customer opening `/menu/<slug>` on mobile sees a responsive, overflow-free menu, can filter/search, open item details, select required/optional options with live surcharge calculation, and cannot submit without required options.
  3. Admin can download QR codes as PNG and SVG for `/menu/<slug>` and branch/table targets.

### User Story 3 — Theme System, 7 Industry Templates & Responsive UI (Priority: P1)
As a designer, I want to configure full theme tokens (primary, secondary, accent, background, text, typography, font size, radius, spacing, button style), save custom themes per workspace, preview themes/templates before applying, and choose from 7 distinct industry templates (`business`, `restaurant`, `coffee-shop`, `milk-tea`, `bakery`, `personal-portfolio`, `service-business`).
- **Acceptance Scenarios**:
  1. Previewing a theme or template renders on canvas without mutating saved project state until confirmed.
  2. All 7 industry templates have distinct section structures and food/beverage templates include pre-populated Digital Menu starters.

### User Story 4 — Server-Side AI Copywriting & Audit Assistant (Priority: P1)
As a user, I want to generate/improve website copy, dish/product descriptions, headlines, ad copy, normalize text, translate, spellcheck, and get SEO tips without exposing API keys in the browser, and edit AI output before confirming any changes.
- **Acceptance Scenarios**:
  1. All AI requests go through `/api/ai/generate` (admin-authenticated, rate-limited) using server env keys with multi-provider support and graceful local fallback.
  2. AI results appear in an editable preview and never overwrite content until explicitly confirmed.

### User Story 5 — Version History & Token-Protected Client Review (Priority: P1)
As an agency/owner, I want to save and restore persistent versions of my website and Digital Menu, and share a token-protected review link where clients see Draft vs Published state, comment, and Approve or Reject with feedback history.
- **Acceptance Scenarios**:
  1. Restoring a previous version first creates a safety backup snapshot of the current state.
  2. Invalid or missing `reviewToken` returns HTTP 403 on `/api/public/review`; valid token loads draft and allows Pending/Approved/Rejected updates.

### User Story 6 — SEO Management & Privacy-Friendly Analytics (Priority: P2)
As a site owner, I want to manage Meta Title, Description, OG tags, Social Image, Canonical URL, automated SEO checks (headings, alt text, broken links), `sitemap.xml`, `robots.txt`, and view privacy-friendly analytics (Page Views, Unique Visitors, Menu Views, QR Visits, Popular Pages, Popular Menu Items, Traffic Sources) filtered by date and website.
- **Acceptance Scenarios**:
  1. `/robots.txt` and `/sitemap.xml` dynamically list published sites and enabled Digital Menus.
  2. Analytics tracking stores daily hashed visitor counters with zero raw IP addresses or PII.
