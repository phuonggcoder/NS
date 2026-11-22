import type { ProductItem, ProductsSection as ProductsSectionData } from '../../types/spec';
import { sanitizeHref, sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

export interface OrderDraft {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  currency: string;
  channel: 'modal' | 'zalo' | 'email' | 'link';
  channelHref?: string;
}

interface Props {
  section: ProductsSectionData;
  isStudio?: boolean;
  onOrderProduct?: (draft: OrderDraft) => void;
}

export function ProductsSection({ section, isStudio, onOrderProduct }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;
  const alignClass = section.style.align === 'left' ? '' : 'lp-align-center';

  const handleProductClick = (product: ProductItem) => {
    if (isStudio) return;

    if (section.orderChannel === 'link' && product.href) {
      return;
    }

    onOrderProduct?.({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: sanitizeImageSrc(product.imageUrl),
      currency: section.currency || 'đ',
      channel: section.orderChannel,
      channelHref: product.href || section.orderChannelHref,
    });
  };

  const renderCard = (product: ProductItem, isSpotlight = false) => {
    const safeImg = sanitizeImageSrc(product.imageUrl);
    const useDirectLink = section.orderChannel === 'link' && Boolean(product.href);

    return (
      <article
        key={product.id}
        className={`lp-card lp-card-hover ${
          isSpotlight ? 'lp-product-spotlight' : 'lp-product-card'
        }`}
      >
        <div className="lp-product-media">
          {safeImg && <img src={safeImg} alt={product.name} />}
          {product.badge && <span className="lp-product-badge">{product.badge}</span>}
        </div>

        <div className="lp-product-body">
          <h3 className="lp-product-title">{product.name}</h3>
          <div className="lp-price-row">
            <span className="lp-price-current">{product.price}</span>
            {product.originalPrice && (
              <span className="lp-price-original">{product.originalPrice}</span>
            )}
          </div>
          <p className="lp-product-desc">{product.description}</p>

          {product.features.length > 0 && (
            <ul className="lp-check-list">
              {product.features.map((feat, idx) => (
                <li key={idx} className="lp-check-item">
                  <IconRenderer name="check" size={16} className="lp-check-icon" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="lp-product-footer">
            {useDirectLink ? (
              <a
                href={sanitizeHref(product.href)}
                className="lp-btn lp-btn-primary lp-btn-full"
                onClick={(e) => isStudio && e.preventDefault()}
              >
                <span>{product.ctaLabel || 'Mua ngay'}</span>
                <IconRenderer name="arrow-right" size={16} />
              </a>
            ) : (
              <button
                type="button"
                className="lp-btn lp-btn-primary lp-btn-full"
                data-lp-order-btn="true"
                data-lp-order-id={product.id}
                data-lp-order-name={product.name}
                data-lp-order-price={product.price}
                data-lp-order-image={safeImg}
                data-lp-order-currency={section.currency || 'đ'}
                data-lp-order-channel={section.orderChannel}
                data-lp-order-href={sanitizeHref(product.href || section.orderChannelHref)}
                onClick={() => handleProductClick(product)}
              >
                <IconRenderer name="shopping-bag" size={16} />
                <span>{product.ctaLabel || 'Mua ngay'}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

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

        {section.variant === 'spotlight' ? (
          <div style={{ display: 'grid', gap: 24 }}>
            {section.items.map((item) => renderCard(item, true))}
          </div>
        ) : (
          <div className={section.variant === 'grid-2' ? 'lp-grid-2' : 'lp-grid-3'}>
            {section.items.map((item) => renderCard(item, false))}
          </div>
        )}
      </div>
    </section>
  );
}
