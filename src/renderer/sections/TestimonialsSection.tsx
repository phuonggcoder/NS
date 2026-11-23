import type { TestimonialItem, TestimonialsSection as TestimonialsSectionData } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: TestimonialsSectionData;
}

function TestimonialCardItem({
  sectionId,
  item,
  idx,
}: {
  sectionId: string;
  item: TestimonialItem;
  idx: number;
}) {
  const safeAvatar = sanitizeImageSrc(item.avatarUrl);
  const starCount = Math.max(1, Math.min(5, item.rating || 5));
  const cardField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Đánh giá #${idx + 1}: ${item.name}`,
    'lp-card lp-testimonial-card'
  );

  return (
    <blockquote {...cardField} style={{ margin: 0 }}>
      <div>
        <div className="lp-stars" aria-label={`${starCount} sao`}>
          {Array.from({ length: starCount }).map((_, sIdx) => (
            <IconRenderer key={sIdx} name="star" size={16} />
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
          <div style={{ fontSize: '0.84rem', color: 'var(--lp-muted)' }}>{item.role}</div>
        </div>
      </div>
    </blockquote>
  );
}

export function TestimonialsSection({ section }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Đánh giá', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Đánh giá', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả Đánh giá', 'lp-subtitle');

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass} ${alignClass}`}
    >
      <div className="lp-container">
        {(section.badge || section.title || section.subtitle) && (
          <div className="lp-section-header">
            {section.badge && <div {...badgeField}>{section.badge}</div>}
            {section.title && <h2 {...titleField}>{section.title}</h2>}
            {section.subtitle && <p {...subField}>{section.subtitle}</p>}
          </div>
        )}

        <div className={section.variant === 'spotlight' ? 'lp-grid-2' : 'lp-grid-3'}>
          {section.items.map((item, idx) => (
            <TestimonialCardItem key={item.id} sectionId={section.id} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
