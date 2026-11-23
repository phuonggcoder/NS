import { useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowUp, Copy, EyeOff, Trash2 } from 'lucide-react';
import { getSectionLabel } from '../data/templates';
import { buildThemeStyle } from '../data/themes';
import type { ContactLead, CustomerOrder, LandingPageSpec, LandingSection } from '../types/spec';
import { isLightColor, normalizeHex, pickReadableText } from '../utils/contrast';
import { sanitizeHref } from '../utils/storage';
import { IconRenderer } from './IconRenderer';
import { OrderModal } from './OrderModal';
import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { CtaSection } from './sections/CtaSection';
import { FaqSection } from './sections/FaqSection';
import { FeaturesSection } from './sections/FeaturesSection';
import { FooterSection } from './sections/FooterSection';
import { GallerySection } from './sections/GallerySection';
import { HeroSection } from './sections/HeroSection';
import { NavbarSection } from './sections/NavbarSection';
import { PricingSection } from './sections/PricingSection';
import { ProductsSection, type OrderDraft } from './sections/ProductsSection';
import { StatsSection } from './sections/StatsSection';
import { TestimonialsSection } from './sections/TestimonialsSection';

export interface StudioEditorProps {
  selectedSectionId: string | null;
  cleanPreview?: boolean;
  previewHighlightSectionId?: string | null;
  onSelectSection: (id: string) => void;
  onMoveSection: (id: string, delta: -1 | 1) => void;
  onDuplicateSection: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onDeleteSection: (id: string) => void;
}

interface LandingPageProps {
  spec: LandingPageSpec;
  clientSlug?: string;
  editorProps?: StudioEditorProps;
  isExport?: boolean;
  onOrderCaptured?: (order: CustomerOrder) => void;
  onLeadCaptured?: (lead: ContactLead) => void;
}

function buildSectionOverrideStyle(section: LandingSection): CSSProperties | undefined {
  const { customBg, customText } = section.style;
  if (!customBg && !customText) return undefined;

  const styleVars: Record<string, string> = {};
  if (customBg) {
    const bg = normalizeHex(customBg, '#FFFFFF');
    const resolvedText = customText
      ? normalizeHex(customText, pickReadableText(bg))
      : pickReadableText(bg);
    const bgIsLight = isLightColor(bg);
    styleVars['--lp-bg'] = bg;
    styleVars['--lp-surface-alt'] = bg;
    styleVars['--lp-contrast-bg'] = bg;
    styleVars['--lp-text'] = resolvedText;
    styleVars['--lp-contrast-text'] = resolvedText;
    styleVars['--lp-muted'] = bgIsLight ? '#475569' : '#CBD5E1';
    styleVars['--lp-contrast-muted'] = bgIsLight ? '#475569' : '#CBD5E1';
    styleVars['--lp-border'] = bgIsLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(248, 250, 252, 0.18)';
    styleVars['--lp-surface'] = bgIsLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)';
  } else if (customText) {
    const txt = normalizeHex(customText, '#111827');
    styleVars['--lp-text'] = txt;
    styleVars['--lp-contrast-text'] = txt;
  }

  return styleVars as CSSProperties;
}

export function LandingPage({
  spec,
  clientSlug,
  editorProps,
  isExport = false,
  onOrderCaptured,
  onLeadCaptured,
}: LandingPageProps) {
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const isStudio = Boolean(editorProps);
  const themeStyle = buildThemeStyle(spec.theme);
  const safeCustomCss = (spec.meta.customCss || '').replace(/<\/style>/gi, '');

  const rootClasses = [
    'lp-page-root',
    `lp-btn-style-${spec.theme.shape.buttonStyle}`,
    `lp-card-style-${spec.theme.shape.cardStyle}`,
    `lp-motion-${spec.theme.motion ?? 'subtle'}`,
    editorProps?.cleanPreview ? 'lp-clean-preview' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const visibleSections = spec.sections.filter((section) => section.visible);

  const renderSectionContent = (section: LandingSection) => {
    switch (section.type) {
      case 'navbar':
        return <NavbarSection section={section} isStudio={isStudio} />;
      case 'hero':
        return <HeroSection section={section} isStudio={isStudio} />;
      case 'stats':
        return <StatsSection section={section} />;
      case 'about':
        return <AboutSection section={section} isStudio={isStudio} />;
      case 'products':
        return (
          <ProductsSection
            section={section}
            isStudio={isStudio}
            onOrderProduct={(draft) => setOrderDraft(draft)}
          />
        );
      case 'gallery':
        return <GallerySection section={section} />;
      case 'features':
        return <FeaturesSection section={section} />;
      case 'pricing':
        return (
          <PricingSection
            section={section}
            isStudio={isStudio}
            onOrderProduct={(draft) => setOrderDraft(draft)}
          />
        );
      case 'testimonials':
        return <TestimonialsSection section={section} />;
      case 'faq':
        return <FaqSection section={section} />;
      case 'cta':
        return <CtaSection section={section} isStudio={isStudio} />;
      case 'contact':
        return (
          <ContactSection
            section={section}
            isStudio={isStudio}
            onSubmitLead={(lead) => onLeadCaptured?.({ ...lead, clientSlug })}
          />
        );
      case 'footer':
        return <FooterSection section={section} isStudio={isStudio} />;
    }
  };

  return (
    <div id="top" className={rootClasses} style={themeStyle}>
      {safeCustomCss && !isExport && <style>{safeCustomCss}</style>}

      {visibleSections.map((section, idx) => {
        const content = renderSectionContent(section);
        const widthClass =
          section.style.maxWidth && section.style.maxWidth !== 'standard'
            ? `lp-width-${section.style.maxWidth}`
            : '';
        const overrideStyle = buildSectionOverrideStyle(section);
        const isAiHighlighted = editorProps?.previewHighlightSectionId === section.id;

        if (!editorProps) {
          return (
            <div key={section.id} className={widthClass || undefined} style={overrideStyle}>
              {content}
            </div>
          );
        }

        const isSelected = editorProps.selectedSectionId === section.id;
        return (
          <div
            key={section.id}
            data-lp-section-id={section.id}
            style={overrideStyle}
            className={[
              'lp-editor-wrap',
              widthClass,
              isSelected ? 'is-selected' : '',
              isAiHighlighted ? 'lp-ai-preview-highlight' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={(e) => {
              e.stopPropagation();
              editorProps.onSelectSection(section.id);
            }}
          >
            <div className="lp-editor-toolbar" onClick={(e) => e.stopPropagation()}>
              <span className="lp-editor-tag">{getSectionLabel(section.type)}</span>
              <button
                type="button"
                className="lp-editor-btn"
                title="Di chuyển lên"
                disabled={idx === 0}
                onClick={() => editorProps.onMoveSection(section.id, -1)}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="lp-editor-btn"
                title="Di chuyển xuống"
                disabled={idx === visibleSections.length - 1}
                onClick={() => editorProps.onMoveSection(section.id, 1)}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="lp-editor-btn"
                title="Nhân bản section"
                onClick={() => editorProps.onDuplicateSection(section.id)}
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                className="lp-editor-btn"
                title="Ẩn section"
                onClick={() => editorProps.onToggleVisible(section.id)}
              >
                <EyeOff size={14} />
              </button>
              <button
                type="button"
                className="lp-editor-btn is-danger"
                title="Xóa section"
                onClick={() => editorProps.onDeleteSection(section.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {content}
          </div>
        );
      })}

      {!isStudio && spec.meta.floatingContact.enabled && (
        <a href={sanitizeHref(spec.meta.floatingContact.href)} className="lp-floating-contact">
          <IconRenderer name="message-circle" size={18} />
          <span>{spec.meta.floatingContact.label || 'Liên hệ'}</span>
        </a>
      )}

      {!isStudio && !isExport && (
        <OrderModal
          draft={orderDraft}
          onClose={() => setOrderDraft(null)}
          onSubmitOrder={(order) => onOrderCaptured?.({ ...order, clientSlug })}
        />
      )}

      {isExport && (
        <div
          id="lp-export-order-modal"
          className="lp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lp-export-order-title"
          hidden
        >
          <div className="lp-modal">
            <div className="lp-modal-head">
              <h3
                id="lp-export-order-title"
                style={{ margin: 0, fontFamily: 'var(--lp-font-heading)' }}
              >
                Đặt mua sản phẩm
              </h3>
              <button
                type="button"
                className="lp-modal-close"
                aria-label="Đóng"
                data-lp-modal-close="true"
              >
                ✕
              </button>
            </div>
            <div id="lp-export-order-body" />
          </div>
        </div>
      )}
    </div>
  );
}
