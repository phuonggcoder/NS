import type { StatsSection as StatsSectionData } from '../../types/spec';

interface Props {
  section: StatsSectionData;
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
          {section.items.map((item) => (
            <div
              key={item.id}
              className={section.variant === 'cards' ? 'lp-card lp-stat-card' : 'lp-stat-item'}
            >
              <div className="lp-stat-value">{item.value}</div>
              <div className="lp-stat-label">{item.label}</div>
              {item.note && <div className="lp-stat-note">{item.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
