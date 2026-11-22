import type { TestimonialsSection as TestimonialsSectionData } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: TestimonialsSectionData;
}

export function TestimonialsSection({ section }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

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

        <div className={section.variant === 'spotlight' ? 'lp-grid-2' : 'lp-grid-3'}>
          {section.items.map((item) => {
            const safeAvatar = sanitizeImageSrc(item.avatarUrl);
            const starCount = Math.max(1, Math.min(5, item.rating || 5));

            return (
              <blockquote
                key={item.id}
                className="lp-card lp-testimonial-card"
                style={{ margin: 0 }}
              >
                <div>
                  <div className="lp-stars" aria-label={`${starCount} sao`}>
                    {Array.from({ length: starCount }).map((_, idx) => (
                      <IconRenderer key={idx} name="star" size={16} />
                    ))}
                  </div>
                  <p className="lp-quote">“{item.quote}”</p>
                </div>

                <div className="lp-author-row">
                  <div className="lp-author-avatar">
                    {safeAvatar ? (
                      <img src={safeAvatar} alt={item.name} />
                    ) : (
                      <span>{item.name.trim().charAt(0).toUpperCase() || 'K'}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--lp-muted)' }}>
                      {item.role}
                    </div>
                  </div>
                </div>
              </blockquote>
            );
          })}
        </div>
      </div>
    </section>
  );
}
