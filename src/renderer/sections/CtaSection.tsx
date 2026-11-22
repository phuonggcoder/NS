import type { CtaSection as CtaSectionData } from '../../types/spec';
import { sanitizeHref } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: CtaSectionData;
  isStudio?: boolean;
}

export function CtaSection({ section, isStudio }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'minimal-band' ? (
          <div className="lp-cta-minimal">
            {section.badge && <div className="lp-badge">{section.badge}</div>}
            <h2 className="lp-heading">{section.title}</h2>
            {section.subtitle && (
              <p className="lp-subtitle" style={{ maxWidth: 620, marginInline: 'auto' }}>
                {section.subtitle}
              </p>
            )}
            <div className="lp-cta-actions">
              {section.primaryLabel && (
                <a
                  href={sanitizeHref(section.primaryHref)}
                  className="lp-btn lp-btn-primary lp-btn-lg"
                  onClick={(e) => isStudio && e.preventDefault()}
                >
                  <span>{section.primaryLabel}</span>
                  <IconRenderer name="arrow-right" size={18} />
                </a>
              )}
              {section.secondaryLabel && (
                <a
                  href={sanitizeHref(section.secondaryHref)}
                  className="lp-btn lp-btn-secondary lp-btn-lg"
                  onClick={(e) => isStudio && e.preventDefault()}
                >
                  {section.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="lp-cta-card">
            {section.badge && <div className="lp-badge">{section.badge}</div>}
            <h2 className="lp-heading lp-cta-title">{section.title}</h2>
            {section.subtitle && <p className="lp-subtitle">{section.subtitle}</p>}
            <div className="lp-cta-actions">
              {section.primaryLabel && (
                <a
                  href={sanitizeHref(section.primaryHref)}
                  className="lp-btn lp-btn-lg lp-cta-btn-primary"
                  onClick={(e) => isStudio && e.preventDefault()}
                >
                  <span>{section.primaryLabel}</span>
                  <IconRenderer name="arrow-right" size={18} />
                </a>
              )}
              {section.secondaryLabel && (
                <a
                  href={sanitizeHref(section.secondaryHref)}
                  className="lp-btn lp-btn-lg lp-cta-btn-secondary"
                  onClick={(e) => isStudio && e.preventDefault()}
                >
                  {section.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
