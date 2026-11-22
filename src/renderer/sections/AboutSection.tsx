import type { AboutSection as AboutSectionData } from '../../types/spec';
import { sanitizeHref, sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: AboutSectionData;
  isStudio?: boolean;
}

export function AboutSection({ section, isStudio }: Props) {
  const safeAvatar = sanitizeImageSrc(section.avatarUrl);
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const renderDetails = () => (
    <div>
      {section.badge && <div className="lp-badge">{section.badge}</div>}
      <h2 className="lp-heading">{section.title}</h2>
      {section.role && <div className="lp-about-role">{section.role}</div>}
      <p className="lp-about-bio">{section.bio}</p>

      {section.highlights.length > 0 && (
        <div className="lp-pill-list">
          {section.highlights.map((item, idx) => (
            <span key={idx} className="lp-pill">
              {item}
            </span>
          ))}
        </div>
      )}

      {section.milestones.length > 0 && (
        <div className="lp-milestones">
          {section.milestones.map((m) => (
            <div key={m.id} className="lp-milestone-item">
              <div className="lp-milestone-year">{m.year}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{m.title}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--lp-muted)' }}>{m.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section.socials.length > 0 && (
        <div className="lp-social-row">
          {section.socials.map((soc) => {
            const href = sanitizeHref(soc.href);
            const isExternal = href.startsWith('http');
            return (
              <a
                key={soc.id}
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="lp-btn lp-btn-secondary lp-btn-sm"
                onClick={(e) => isStudio && e.preventDefault()}
              >
                <span>{soc.label}</span>
                {isExternal && <IconRenderer name="external-link" size={14} />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'centered-card' ? (
          <div className="lp-card lp-about-centered">
            {safeAvatar && (
              <img src={safeAvatar} alt={section.title} className="lp-about-centered-avatar" />
            )}
            {section.badge && <div className="lp-badge">{section.badge}</div>}
            <h2 className="lp-heading">{section.title}</h2>
            {section.role && <div className="lp-about-role">{section.role}</div>}
            <p className="lp-about-bio">{section.bio}</p>
            {section.highlights.length > 0 && (
              <div className="lp-pill-list" style={{ justifyContent: 'center' }}>
                {section.highlights.map((item, idx) => (
                  <span key={idx} className="lp-pill">
                    {item}
                  </span>
                ))}
              </div>
            )}
            {section.socials.length > 0 && (
              <div className="lp-social-row" style={{ justifyContent: 'center' }}>
                {section.socials.map((soc) => (
                  <a
                    key={soc.id}
                    href={sanitizeHref(soc.href)}
                    className="lp-btn lp-btn-secondary lp-btn-sm"
                    onClick={(e) => isStudio && e.preventDefault()}
                  >
                    {soc.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`lp-about-grid ${
              section.variant === 'split-right' ? 'lp-about-split-right' : ''
            }`}
          >
            <div className="lp-about-photo-col">
              {safeAvatar && (
                <div className="lp-about-photo-card">
                  <img src={safeAvatar} alt={section.title} />
                </div>
              )}
            </div>
            <div>{renderDetails()}</div>
          </div>
        )}
      </div>
    </section>
  );
}
