import type { FeaturesSection as FeaturesSectionData } from '../../types/spec';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: FeaturesSectionData;
}

export function FeaturesSection({ section }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

  const gridClass =
    section.variant === 'bento'
      ? 'lp-bento-grid'
      : section.variant === 'grid-2'
      ? 'lp-grid-2'
      : 'lp-grid-3';

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass} ${alignClass}`}
    >
      <div className="lp-container">
        {(section.badge || section.title || section.subtitle) && (
          <div className="lp-section-header">
            {section.badge && <div className="lp-badge">{section.badge}</div>}
            {section.title && <h2 className="lp-heading">{section.title}</h2>}
            {section.subtitle && <p className="lp-subtitle">{section.subtitle}</p>}
          </div>
        )}

        <div className={gridClass}>
          {section.items.map((item) => (
            <div key={item.id} className="lp-card lp-card-hover lp-feature-card">
              <div className="lp-feature-icon">
                <IconRenderer name={item.icon} size={22} />
              </div>
              <h3 className="lp-feature-title">{item.title}</h3>
              <p className="lp-feature-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
