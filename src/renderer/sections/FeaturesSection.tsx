import type { FeatureItem, FeaturesSection as FeaturesSectionData } from '../../types/spec';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: FeaturesSectionData;
}

function FeatureCardItem({
  sectionId,
  item,
  idx,
}: {
  sectionId: string;
  item: FeatureItem;
  idx: number;
}) {
  const cardField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Lợi ích #${idx + 1}`,
    'lp-card lp-card-hover lp-feature-card'
  );

  return (
    <div {...cardField}>
      <div className="lp-feature-icon">
        <IconRenderer name={item.icon} size={22} />
      </div>
      <h3 className="lp-feature-title">{item.title}</h3>
      <p className="lp-feature-desc">{item.description}</p>
    </div>
  );
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

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Lợi ích', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Lợi ích', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả Lợi ích', 'lp-subtitle');

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
            <FeatureCardItem key={item.id} sectionId={section.id} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
