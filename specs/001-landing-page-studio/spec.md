# Feature Specification: SpecPage — Spec-Driven Custom Landing Page Studio & Customer Product

**Feature ID**: `001-landing-page-studio`  
**Methodology**: Spec-Driven Development (GitHub Spec Kit / `speckit.org`)

---

## Overview
SpecPage empowers creators, freelancers, consultants, and solo merchants to design, customize, and publish high-converting personal introduction and product-selling landing pages through a visual Spec-Driven Studio (`/`), producing a clean, zero-chrome customer-facing web product (`/?mode=live` and standalone `public/site.html` / `index.html`).

---

## User Stories

### US-1: Customize Page Structure
- **As a** page owner, **I want to** add, remove, duplicate, hide/show, and reorder landing page sections (Hero, Giới thiệu bản thân, Sản phẩm, Tính năng, Bảng giá, Đánh giá, FAQ, Thống kê, CTA, Liên hệ, Navbar, Footer), **so that** my landing page matches my exact storytelling and sales flow.
- **Acceptance Criteria**:
  - Supports HTML5 drag-and-drop AND accessible Move Up / Move Down buttons.
  - Supports adding any of the 12 section types from a catalog drawer/panel.
  - Supports switching per-section layout variants (e.g., Hero centered vs split-left/right; Products 2-column, 3-column, or spotlight; About split vs centered card).

### US-2: Customize Visual Design & Theme
- **As a** creator, **I want to** pick curated theme presets or customize exact brand colors, typography pairings, corner radii, button styles, card elevation, and section spacing, **so that** my landing page reflects my personal brand aesthetic.
- **Acceptance Criteria**:
  - Provides 6 cohesive curated presets (including `SpecKit Crisp` Apple Light, `Obsidian Studio` Dark, `Warm Editorial`, `Matcha Minimal`, `Cobalt SaaS`, `Rose Velvet`).
  - Live updates CSS custom properties (`--lp-*`) across the entire landing page instantaneously.

### US-3: Edit Content, Personal Bio & Products
- **As a** seller/creator, **I want to** edit every headline, subheadline, badge, personal bio, skills, career milestones, social links, product catalog items (prices, sale strikethroughs, features, images via URL or compressed local file upload), pricing tiers, testimonials, FAQ items, and contact details, **so that** my landing page sells my products and introduces who I am.
- **Acceptance Criteria**:
  - Clicking any section in the live canvas selects it in the right Inspector panel.
  - Image upload compresses client-side images (`<canvas>`) cleanly into lightweight data URLs.
  - Supports Undo / Redo (`Ctrl+Z` / `Ctrl+Y`) up to 40 snapshots and persists automatically in `localStorage`.

### US-4: Customer-Facing Landing Page Product & Publishing
- **As a** customer visiting the published landing page, **I want to** browse a clean, fast, responsive web page with zero builder UI, toggle mobile menu and FAQ items, submit contact inquiries, and click "Mua ngay" to place a quick product order with quantity calculation, **so that** I can learn about the creator and purchase products effortlessly.
- **Acceptance Criteria**:
  - `/?mode=live` renders the pure customer experience and records orders/leads to `localStorage` viewable in Studio's Orders & Leads drawer.
  - Publishing (`POST /api/publish`) generates a standalone `public/site.html` + `public/published-spec.json`, and users can also download a self-contained `index.html`.
  - Standalone `site.html` / `index.html` reproduces 100% of styling and interactive behaviors (Order modal, FAQ accordion, Mobile nav, Contact form) without external JS frameworks.

### US-5: Spec Kit Inspection, Markdown Export & JSON Import
- **As a** Spec-Driven user inspired by `speckit.org`, **I want to** inspect the live `spec.md` (Markdown Specification) and `landing-spec.json` (Executable JSON Spec), download or copy them, and edit/apply JSON directly, **so that** my landing page specification remains portable and versionable.

---

## Edge Cases & Guardrails
- Unsafe URL schemes (`javascript:`, etc.) are neutralized to `#`.
- Invalid JSON in Spec Modal displays a clear Vietnamese validation error without corrupting state.
- Responsive switching (Desktop / Tablet 768px / Mobile 390px) inside Studio uses CSS Container Queries so sections adapt accurately without shrinking the browser window.
