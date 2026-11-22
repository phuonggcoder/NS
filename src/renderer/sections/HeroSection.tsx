import type { HeroSection as HeroSectionData } from '../../types/spec';
import { sanitizeHref, sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: HeroSectionData;
  isStudio?: boolean;
}

export function HeroSection({ section, isStudio }: Props) {
  const safeImg = sanitizeImageSrc(section.imageUrl);
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const renderContent = (centered: boolean) => (
    <div className={centered ? 'lp-hero-centered' : ''}>
      {section.badge && (
        <div className="lp-badge">
          <IconRenderer name="sparkles" size={14} />
          <span>{section.badge}</span>
        </div>
      )}

      <h1 className="lp-hero-title">
        {section.headline}{' '}
        {section.highlightText && <span className="lp-gradient-text">{section.highlightText}</span>}
      </h1>

      {section.subheadline && <p className="lp-hero-sub">{section.subheadline}</p>}

      {(section.primaryCtaLabel || section.secondaryCtaLabel) && (
        <div className="lp-hero-actions">
          {section.primaryCtaLabel && (
            <a
              href={sanitizeHref(section.primaryCtaHref)}
              className="lp-btn lp-btn-primary lp-btn-lg"
              onClick={(e) => isStudio && e.preventDefault()}
            >
              <span>{section.primaryCtaLabel}</span>
              <IconRenderer name="arrow-right" size={18} />
            </a>
          )}
          {section.secondaryCtaLabel && (
            <a
              href={sanitizeHref(section.secondaryCtaHref)}
              className="lp-btn lp-btn-secondary lp-btn-lg"
              onClick={(e) => isStudio && e.preventDefault()}
            >
              {section.secondaryCtaLabel}
            </a>
          )}
        </div>
      )}

      {section.trustChips.length > 0 && (
        <div className="lp-trust-chips">
          {section.trustChips.map((chip, idx) => (
            <span key={idx} className="lp-trust-chip">
              <IconRenderer name="check" size={15} />
              <span>{chip}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedia = () =>
    safeImg ? (
      <div className="lp-hero-media">
        <div className="lp-hero-media-frame">
          <img src={safeImg} alt={section.headline} />
          {section.imageCaption && <div className="lp-hero-caption">{section.imageCaption}</div>}
        </div>
      </div>
    ) : null;

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'centered' ? (
          <>
            {renderContent(true)}
            {safeImg && <div className="lp-hero-centered-media">{renderMedia()}</div>}
          </>
        ) : (
          <div
            className={`lp-hero-grid ${
              section.variant === 'split-left' ? 'lp-hero-split-left' : ''
            }`}
          >
            {renderContent(false)}
            {renderMedia()}
          </div>
        )}
      </div>
    </section>
  );
}
