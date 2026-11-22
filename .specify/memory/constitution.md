# Project Constitution — SpecPage Studio

Inspired by GitHub Spec Kit (`speckit.org`), every feature and rendering artifact in **SpecPage** adheres to the following non-negotiable engineering and product principles.

## 1. Spec-First Single Source of Truth
- Every landing page is fully described by a single declarative, versionable `LandingPageSpec` object (`spec.json`) and its human-readable Markdown counterpart (`spec.md`).
- No hardcoded layout or content lives inside renderer components; the renderer is a pure function of `LandingPageSpec`.

## 2. Vietnamese-First Craft
- Studio UI, starter templates, empty states, validation messages, and customer interactions use natural, polished Vietnamese typography (`Be Vietnam Pro`, `Plus Jakarta Sans`, `Playfair Display`, `Space Grotesk`, `Inter`, `JetBrains Mono`).
- All headings and body fonts must render Vietnamese diacritics cleanly without fallback glyphs.

## 3. Zero-Drift Studio-to-Customer Parity
- Studio live preview and customer-facing landing pages (`/?mode=live` and standalone exported HTML) share the exact same `.lp-*` CSS design system and React section components.
- Responsive breakpoints inside Studio Desktop/Tablet/Mobile viewports MUST use CSS Container Queries (`container-type: inline-size; container-name: lp;`) so customer layout behavior matches 1:1 regardless of surrounding chrome.

## 4. Self-Contained Customer Product Output
- The customer-facing product (`public/site.html` and downloadable `index.html`) must run completely standalone with zero Studio dependencies, zero external JS runtime requirements, interactive Product Quick-Order modal, FAQ accordion, mobile navigation drawer, and Contact form feedback.

## 5. Client-Side Safety & URL Sanitization
- All user-supplied URLs (`href`, `src`, links, social URLs, order channels) must be sanitized against unsafe schemes (`javascript:`, `data:text/html`, `vbscript:`), permitting only safe relative anchors/paths, `http://`, `https://`, `mailto:`, `tel:`, and image data URIs where appropriate.
- Exported HTML must properly escape `<title>`, `<meta>`, attribute text, and embedded scripts (`</script>`).

## 6. Accessibility & Responsive Design
- Semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), keyboard-operable modals/accordions, high color contrast across light and dark presets, and touch-friendly targets on mobile viewports.
