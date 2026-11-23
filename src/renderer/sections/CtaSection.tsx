import type { CtaSection as CtaSectionData } from '../../types/spec';
import { sanitizeHref } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: CtaSectionData;
  isStudio?: boolean;
}

export function CtaSection({ section, isStudio }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge CTA', 'lp-badge');
  const titleField = useStudioFieldProps(
    section.id,
    'title',
    'Tiêu đề CTA',
    section.variant === 'minimal-band' ? 'lp-heading' : 'lp-heading lp-cta-title'
  );
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả CTA', 'lp-subtitle');
  const primaryField = useStudioFieldProps(
    section.id,
    'primaryLabel',
    'Nút chính CTA',
    section.variant === 'minimal-band'
      ? 'lp-btn lp-btn-primary lp-btn-lg'
      : 'lp-btn lp-btn-lg lp-cta-btn-primary'
  );
  const secondaryField = useStudioFieldProps(
    section.id,
    'secondaryLabel',
    'Nút phụ CTA',
    section.variant === 'minimal-band'
      ? 'lp-btn lp-btn-secondary lp-btn-lg'
      : 'lp-btn lp-btn-lg lp-cta-btn-secondary'
  );

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'minimal-band' ? (
          <div className="lp-cta-minimal">
            {section.badge && <div {...badgeField}>{section.badge}</div>}
            <h2 {...titleField}>{section.title}</h2>
            {section.subtitle && (
              <p {...subField} style={{ maxWidth: 620, marginInline: 'auto' }}>
                {section.subtitle}
              </p>
            )}
            <div className="lp-cta-actions">
              {section.primaryLabel && (
                <a
                  href={sanitizeHref(section.primaryHref)}
                  {...primaryField}
                  onClick={(e) => {
                    if (isStudio) e.preventDefault();
                    primaryField.onClick?.(e);
                  }}
                >
                  <span>{section.primaryLabel}</span>
                  <IconRenderer name="arrow-right" size={18} />
                </a>
              )}
              {section.secondaryLabel && (
                <a
                  href={sanitizeHref(section.secondaryHref)}
                  {...secondaryField}
                  onClick={(e) => {
                    if (isStudio) e.preventDefault();
                    secondaryField.onClick?.(e);
                  }}
                >
                  {section.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="lp-cta-card">
            {section.badge && <div {...badgeField}>{section.badge}</div>}
            <h2 {...titleField}>{section.title}</h2>
            {section.subtitle && <p {...subField}>{section.subtitle}</p>}
            <div className="lp-cta-actions">
              {section.primaryLabel && (
                <a
                  href={sanitizeHref(section.primaryHref)}
                  {...primaryField}
                  onClick={(e) => {
                    if (isStudio) e.preventDefault();
                    primaryField.onClick?.(e);
                  }}
                >
                  <span>{section.primaryLabel}</span>
                  <IconRenderer name="arrow-right" size={18} />
                </a>
              )}
              {section.secondaryLabel && (
                <a
                  href={sanitizeHref(section.secondaryHref)}
                  {...secondaryField}
                  onClick={(e) => {
                    if (isStudio) e.preventDefault();
                    secondaryField.onClick?.(e);
                  }}
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
