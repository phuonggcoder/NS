import { useState } from 'react';
import type { FaqSection as FaqSectionData } from '../../types/spec';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: FaqSectionData;
}

export function FaqSection({ section }: Props) {
  const [openIndex, setOpenIndex] = useState<number>(0);
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

        {section.variant === 'two-column' ? (
          <div className="lp-grid-2">
            {section.items.map((item) => (
              <div key={item.id} className="lp-card lp-feature-card">
                <h3 className="lp-feature-title">{item.question}</h3>
                <p className="lp-feature-desc">{item.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="lp-faq-list">
            {section.items.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.id}
                  className={`lp-faq-item ${isOpen ? 'is-open' : ''}`}
                  data-lp-faq-item="true"
                >
                  <button
                    type="button"
                    className="lp-faq-trigger"
                    aria-expanded={isOpen}
                    data-lp-faq-trigger="true"
                    onClick={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
                  >
                    <span>{item.question}</span>
                    <IconRenderer name="chevron-down" size={18} className="lp-faq-chevron" />
                  </button>
                  <div className="lp-faq-answer">{item.answer}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
