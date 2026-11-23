import type { PricingSection as PricingSectionData, PricingTier } from '../../types/spec';
import { sanitizeHref } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';
import type { OrderDraft } from './ProductsSection';

interface Props {
  section: PricingSectionData;
  isStudio?: boolean;
  onOrderProduct?: (draft: OrderDraft) => void;
}

function PricingCardItem({
  sectionId,
  tier,
  idx,
  isStudio,
  onOrderProduct,
}: {
  sectionId: string;
  tier: PricingTier;
  idx: number;
  isStudio?: boolean;
  onOrderProduct?: (draft: OrderDraft) => void;
}) {
  const cardField = useStudioFieldProps(
    sectionId,
    `tier-${idx}`,
    `Gói #${idx + 1}: ${tier.name}`,
    `lp-card lp-pricing-card ${tier.highlighted ? 'is-highlighted' : ''}`
  );

  const handleTierClick = () => {
    if (isStudio || tier.href) return;
    onOrderProduct?.({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      currency: 'đ',
      channel: 'modal',
    });
  };

  return (
    <div {...cardField}>
      {tier.badge && <span className="lp-pricing-badge">{tier.badge}</span>}
      <h3 className="lp-product-title">{tier.name}</h3>
      <p className="lp-product-desc" style={{ marginBottom: 8 }}>
        {tier.description}
      </p>

      <div className="lp-pricing-amount">
        <span className="lp-pricing-price">{tier.price}</span>
        {tier.period && <span className="lp-pricing-period">{tier.period}</span>}
      </div>

      <ul className="lp-check-list" style={{ marginBottom: 26 }}>
        {tier.features.map((feat, fIdx) => (
          <li key={fIdx} className="lp-check-item">
            <IconRenderer name="check" size={16} className="lp-check-icon" />
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div className="lp-product-footer">
        {tier.href ? (
          <a
            href={sanitizeHref(tier.href)}
            className={`lp-btn lp-btn-full ${
              tier.highlighted ? 'lp-btn-primary' : 'lp-btn-secondary'
            }`}
            onClick={(e) => isStudio && e.preventDefault()}
          >
            {tier.ctaLabel}
          </a>
        ) : (
          <button
            type="button"
            className={`lp-btn lp-btn-full ${
              tier.highlighted ? 'lp-btn-primary' : 'lp-btn-secondary'
            }`}
            data-lp-order-btn="true"
            data-lp-order-id={tier.id}
            data-lp-order-name={tier.name}
            data-lp-order-price={tier.price}
            data-lp-order-image=""
            data-lp-order-currency="đ"
            data-lp-order-channel="modal"
            onClick={handleTierClick}
          >
            {tier.ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function PricingSection({ section, isStudio, onOrderProduct }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Bảng giá', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Bảng giá', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả Bảng giá', 'lp-subtitle');

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

        <div
          className={
            section.variant === 'compact' || section.tiers.length === 2 ? 'lp-grid-2' : 'lp-grid-3'
          }
        >
          {section.tiers.map((tier, idx) => (
            <PricingCardItem
              key={tier.id}
              sectionId={section.id}
              tier={tier}
              idx={idx}
              isStudio={isStudio}
              onOrderProduct={onOrderProduct}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
