import type { HeroSection as HeroSectionData } from '../../types/spec';
import { sanitizeHref, sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: HeroSectionData;
  isStudio?: boolean;
}

export function HeroSection({ section, isStudio }: Props) {
  const safeImg = sanitizeImageSrc(section.imageUrl);
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Nhãn Badge', 'lp-badge');
  const headlineField = useStudioFieldProps(section.id, 'headline', 'Tiêu đề chính');
  const highlightField = useStudioFieldProps(
    section.id,
    'highlightText',
    'Chữ nhấn Gradient',
    'lp-gradient-text'
  );
  const subField = useStudioFieldProps(section.id, 'subheadline', 'Mô tả ngắn Hero', 'lp-hero-sub');
  const primaryField = useStudioFieldProps(
    section.id,
    'primaryCtaLabel',
    'Nút chính CTA',
    'lp-btn lp-btn-primary lp-btn-lg'
  );
  const secondaryField = useStudioFieldProps(
    section.id,
    'secondaryCtaLabel',
    'Nút phụ CTA',
    'lp-btn lp-btn-secondary lp-btn-lg'
  );
  const chipsField = useStudioFieldProps(
    section.id,
    'trustChips',
    'Cam kết ngắn',
    'lp-trust-chips'
  );
  const imageField = useStudioFieldProps(
    section.id,
    'imageUrl',
    'Ảnh Hero minh họa',
    'lp-hero-media-frame'
  );

  const renderContent = (centered: boolean) => (
    <div className={centered ? 'lp-hero-centered' : ''}>
      {section.badge && (
        <div {...badgeField}>
          <IconRenderer name="sparkles" size={14} />
          <span>{section.badge}</span>
        </div>
      )}

      <h1 className="lp-hero-title">
        <span {...headlineField}>{section.headline}</span>{' '}
        {section.highlightText && <span {...highlightField}>{section.highlightText}</span>}
      </h1>

      {section.subheadline && <p {...subField}>{section.subheadline}</p>}

      {(section.primaryCtaLabel || section.secondaryCtaLabel) && (
        <div className="lp-hero-actions">
          {section.primaryCtaLabel && (
            <a
              href={sanitizeHref(section.primaryCtaHref)}
              {...primaryField}
              onClick={(e) => {
                if (isStudio) e.preventDefault();
                primaryField.onClick?.(e);
              }}
            >
              <span>{section.primaryCtaLabel}</span>
              <IconRenderer name="arrow-right" size={18} />
            </a>
          )}
          {section.secondaryCtaLabel && (
            <a
              href={sanitizeHref(section.secondaryCtaHref)}
              {...secondaryField}
              onClick={(e) => {
                if (isStudio) e.preventDefault();
                secondaryField.onClick?.(e);
              }}
            >
              {section.secondaryCtaLabel}
            </a>
          )}
        </div>
      )}

      {section.trustChips.length > 0 && (
        <div {...chipsField}>
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
        <div {...imageField}>
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
