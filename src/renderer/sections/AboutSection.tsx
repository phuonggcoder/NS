import type { AboutSection as AboutSectionData } from '../../types/spec';
import { sanitizeHref, sanitizeImageSrc } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: AboutSectionData;
  isStudio?: boolean;
}

export function AboutSection({ section, isStudio }: Props) {
  const safeAvatar = sanitizeImageSrc(section.avatarUrl);
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Giới thiệu', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Giới thiệu', 'lp-heading');
  const roleField = useStudioFieldProps(section.id, 'role', 'Chức danh / Vai trò', 'lp-about-role');
  const bioField = useStudioFieldProps(section.id, 'bio', 'Câu chuyện / Tiểu sử', 'lp-about-bio');
  const avatarField = useStudioFieldProps(
    section.id,
    'avatarUrl',
    'Ảnh chân dung',
    section.variant === 'centered-card' ? '' : 'lp-about-photo-card'
  );
  const highlightsField = useStudioFieldProps(
    section.id,
    'highlights',
    'Kỹ năng / Thế mạnh',
    'lp-pill-list'
  );
  const milestonesField = useStudioFieldProps(
    section.id,
    'milestones',
    'Cột mốc kinh nghiệm',
    'lp-milestones'
  );
  const socialsField = useStudioFieldProps(
    section.id,
    'socials',
    'Mạng xã hội',
    'lp-social-row'
  );

  const renderDetails = () => (
    <div>
      {section.badge && <div {...badgeField}>{section.badge}</div>}
      <h2 {...titleField}>{section.title}</h2>
      {section.role && <div {...roleField}>{section.role}</div>}
      <p {...bioField}>{section.bio}</p>

      {section.highlights.length > 0 && (
        <div {...highlightsField}>
          {section.highlights.map((item, idx) => (
            <span key={idx} className="lp-pill">
              {item}
            </span>
          ))}
        </div>
      )}

      {section.milestones.length > 0 && (
        <div {...milestonesField}>
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
        <div {...socialsField}>
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
              <img
                src={safeAvatar}
                alt={section.title}
                {...avatarField}
                className={['lp-about-centered-avatar', avatarField.className]
                  .filter(Boolean)
                  .join(' ')}
              />
            )}
            {section.badge && <div {...badgeField}>{section.badge}</div>}
            <h2 {...titleField}>{section.title}</h2>
            {section.role && <div {...roleField}>{section.role}</div>}
            <p {...bioField}>{section.bio}</p>
            {section.highlights.length > 0 && (
              <div {...highlightsField} style={{ justifyContent: 'center' }}>
                {section.highlights.map((item, idx) => (
                  <span key={idx} className="lp-pill">
                    {item}
                  </span>
                ))}
              </div>
            )}
            {section.socials.length > 0 && (
              <div {...socialsField} style={{ justifyContent: 'center' }}>
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
                <div {...avatarField}>
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
