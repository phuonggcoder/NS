import type { GalleryItem, GallerySection as GallerySectionData } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: GallerySectionData;
}

function GalleryCardItem({
  sectionId,
  item,
  idx,
}: {
  sectionId: string;
  item: GalleryItem;
  idx: number;
}) {
  const safeImg = sanitizeImageSrc(item.imageUrl);
  const cardField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Ảnh #${idx + 1}: ${item.title}`,
    'lp-card lp-card-hover lp-gallery-card'
  );

  return (
    <figure {...cardField}>
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

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Thư viện', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Thư viện', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả Thư viện', 'lp-subtitle');

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

        <div className={gridClass}>
          {section.items.map((item, idx) => (
            <GalleryCardItem key={item.id} sectionId={section.id} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
