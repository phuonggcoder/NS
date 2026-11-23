import { useState } from 'react';
import type { FaqItem, FaqSection as FaqSectionData } from '../../types/spec';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: FaqSectionData;
}

function FaqAccordionItem({
  sectionId,
  item,
  idx,
  isOpen,
  onToggle,
}: {
  sectionId: string;
  item: FaqItem;
  idx: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const itemField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Câu hỏi #${idx + 1}`,
    `lp-faq-item ${isOpen ? 'is-open' : ''}`
  );

  return (
    <div {...itemField} data-lp-faq-item="true">
      <button
        type="button"
        className="lp-faq-trigger"
        aria-expanded={isOpen}
        data-lp-faq-trigger="true"
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <IconRenderer name="chevron-down" size={18} className="lp-faq-chevron" />
      </button>
      <div className="lp-faq-answer">{item.answer}</div>
    </div>
  );
}

function FaqTwoColItem({
  sectionId,
  item,
  idx,
}: {
  sectionId: string;
  item: FaqItem;
  idx: number;
}) {
  const itemField = useStudioFieldProps(
    sectionId,
    `item-${idx}`,
    `Câu hỏi #${idx + 1}`,
    'lp-card lp-feature-card'
  );

  return (
    <div {...itemField}>
      <h3 className="lp-feature-title">{item.question}</h3>
      <p className="lp-feature-desc">{item.answer}</p>
    </div>
  );
}

export function FaqSection({ section }: Props) {
  const [openIndex, setOpenIndex] = useState<number>(0);
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge FAQ', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề FAQ', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả FAQ', 'lp-subtitle');

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

        {section.variant === 'two-column' ? (
          <div className="lp-grid-2">
            {section.items.map((item, idx) => (
              <FaqTwoColItem key={item.id} sectionId={section.id} item={item} idx={idx} />
            ))}
          </div>
        ) : (
          <div className="lp-faq-list">
            {section.items.map((item, idx) => (
              <FaqAccordionItem
                key={item.id}
                sectionId={section.id}
                item={item}
                idx={idx}
                isOpen={openIndex === idx}
                onToggle={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
