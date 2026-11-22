# Feature Specification: AI Assistant, Contrast Safety, Client Review & Production Readiness

**Feature ID**: `002-ai-agency-production`  
**Methodology**: Spec-Driven Development (`speckit.org`)

---

## User Stories

### US-1: AI Auto-Fill from Raw Client Information
- **As an** agency/builder or page owner, **I want to** paste unformatted raw text (Zalo/Facebook post, CV, product list, contact info, FAQs) and have AI extract and populate relevant sections (`meta`, `hero`, `stats`, `about`, `products`, `faq`, `contact`) with selective checkboxes and live canvas preview, **so that** building a real client page takes minutes instead of manual copy-pasting.

### US-2: AI Audit & Revision Suggestions (Preview / Accept / Reject)
- **As a** creator, **I want** an AI reviewer to scan my landing page for Vietnamese spelling/formatting mistakes, WCAG color contrast errors, layout/structural flaws, broken anchor links, missing CRO details, and SEO gaps, **so that** I can **Preview** each change live on the canvas, **Accept** it into my undo stack, or **Reject** it cleanly.

### US-3: Bulletproof Color Contrast & Deeper Customization
- **As a** designer, **I want** Light/Dark mode switching and custom color combinations to never hide text, badges, buttons, inputs, or footer links, plus live WCAG contrast diagnostics with 1-click Auto-Fix, a new **Gallery / Portfolio** section (`gallery`), per-section width & custom colors, global container width & motion, and optional custom CSS.

### US-4: Real Client Project Workflow, Sample Review & Production Deployment
- **As a** service provider building landing pages for real clients, **I want to** manage multiple client projects (`Nháp → Chờ khách duyệt → Đã duyệt → Đã xuất bản`), send clients a clean Sample Review link (`/?mode=review&slug=<slug>`) where they can approve or submit section-specific feedback, publish client pages cleanly (`/clients/<slug>/index.html`), and run the entire application in production via Node (`server.mjs`), Docker, Vercel, or Netlify.
