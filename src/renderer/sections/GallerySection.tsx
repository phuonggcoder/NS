import type { GallerySection as GallerySectionData } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';

interface Props {
  section: GallerySectionData;
}

export function GallerySection({ section }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';
  const gridClass =
    section.variant === 'grid-2'
      ? 'lp-grid-2'
      : section.variant === 'showcase'
      ? 'lp-gallery-showcase'
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
          {section.items.map((item) => {
            const safeImg = sanitizeImageSrc(item.imageUrl);
            return (
              <figure key={item.id} className="lp-card lp-card-hover lp-gallery-card">
                <div className="lp-gallery-media">
                  {safeImg && <img src={safeImg} alt={item.title} />}
                  {item.category && <span className="lp-gallery-cat">{item.category}</span>}
                </div>
                <figcaption className="lp-gallery-body">
                  <h3 className="lp-gallery-title">{item.title}</h3>
                  {item.caption && <p className="lp-gallery-caption">{item.caption}</p>}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
