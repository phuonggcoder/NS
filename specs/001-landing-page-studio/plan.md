# Technical Implementation Plan: SpecPage Studio

**Spec Reference**: `specs/001-landing-page-studio/spec.md`  
**Stack**: React 19, TypeScript, Vite, Lucide Icons, Pure CSS Custom Properties & Container Queries

---

## Architecture Overview

```text
.specify/memory/constitution.md      # Spec Kit governance rules
specs/001-landing-page-studio/       # spec.md, plan.md, tasks.md
public/                              # Published customer artifacts (site.html, published-spec.json)
src/
  types/spec.ts                      # Strict LandingPageSpec, 12 Section types, Orders & Leads
  data/
    themes.ts                        # 6 Theme presets, Vietnamese Google fonts, CSS variable builder
    placeholders.ts                  # Bespoke inline SVG art data URIs (zero broken assets)
    templates.ts                     # 4 Vietnamese starter templates + Section Catalog & factory
  utils/
    storage.ts                       # localStorage persistence, URL sanitization, VND price parsing
    imageUpload.ts                   # Offscreen canvas image compression to Data URL
    specMarkdown.ts                  # Generates Spec-Kit style spec.md from LandingPageSpec
  renderer/
    landing.css                      # Scoped .lp-* CSS design system with @container lp queries
    IconRenderer.tsx                 # Lucide + emoji renderer
    OrderModal.tsx                   # Customer product quick-order modal
    LandingPage.tsx                  # Shared Studio canvas & Live Customer product renderer
    sections/                        # 12 modular section renderers
  exporter/
    exportHtml.ts                    # renderToStaticMarkup + embedded CSS & vanilla JS customer runtime
  studio/
    studio.css                       # Isolated .st-* workspace styling
    StudioApp.tsx                    # Undo/Redo state, keyboard shortcuts, localStorage sync
    TopBar.tsx                       # Viewport toggle, Undo/Redo, Spec modal, Live Preview, Publish
    StructurePanel.tsx               # Drag-and-drop section ordering + 12-section catalog
    DesignPanel.tsx                  # Presets, color pickers, typography, radii, button/card styles
    TemplatesSpecPanel.tsx           # Template switcher, SEO meta, floating contact, JSON import/export
    SpecModal.tsx                    # Markdown Spec & Executable JSON editor/importer
    OrdersDrawer.tsx                 # Customer Orders & Contact Leads inbox
    inspector/
      FieldPrimitives.tsx            # Reusable inputs, color pickers, image uploader, variant pills
      SectionInspector.tsx           # Dynamic editors for all 12 section types
  App.tsx                            # Routes between Studio (/) and Customer Mode (/?mode=live)
  main.tsx                           # Entry point
vite.config.ts                       # Includes specPublishPlugin (POST /api/publish -> public/site.html)
```
---

## Key Technical Decisions
1. **CSS Container Queries for Studio-Customer Parity**: `.lp-page-root` sets `container-type: inline-size; container-name: lp;` and responds at `@container lp (max-width: 960px)` and `@container lp (max-width: 640px)`. This guarantees Tablet (768px) and Mobile (390px) previews inside Studio match real customer screens identically.
2. **Self-Contained Standalone HTML Export**: `buildStandaloneHtml(spec)` uses `react-dom/server` (`renderToStaticMarkup`) + raw `landing.css` + a compact zero-dependency vanilla `<script>` implementing mobile nav drawer, FAQ accordion, Contact form feedback, and full interactive Product Order Modal with live quantity & VND total computation.
3. **Vite Dev Server Publish Hook**: `POST /api/publish` writes `public/site.html` and `public/published-spec.json` directly on disk so users get a real `/site.html` URL immediately alongside downloadable `index.html`.
