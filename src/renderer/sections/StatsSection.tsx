import type { StatItem, StatsSection as StatsSectionData } from '../../types/spec';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: StatsSectionData;
}

function StatCardItem({
  sectionId,
  item,
  idx,
  variant,
}: {
  sectionId: string;
  item: StatItem;
  idx: number;
  variant: 'strip' | 'cards';
}) {
  const itemField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Chỉ số #${idx + 1}`,
    variant === 'cards' ? 'lp-card lp-stat-card' : 'lp-stat-item'
  );

  return (
    <div {...itemField}>
      <div className="lp-stat-value">{item.value}</div>
      <div className="lp-stat-label">{item.label}</div>
      {item.note && <div className="lp-stat-note">{item.note}</div>}
    </div>
  );
}

export function StatsSection({ section }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        <div className="lp-stats-grid">
          {section.items.map((item, idx) => (
            <StatCardItem
              key={item.id}
              sectionId={section.id}
              item={item}
              idx={idx}
              variant={section.variant}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
