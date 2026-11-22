import type { FooterSection as FooterSectionData } from '../../types/spec';
import { sanitizeHref } from '../../utils/storage';

interface Props {
  section: FooterSectionData;
  isStudio?: boolean;
}

export function FooterSection({ section, isStudio }: Props) {
  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  return (
    <footer
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'minimal' ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--lp-font-heading)',
                fontWeight: 700,
                fontSize: '1.2rem',
                marginBottom: 8,
              }}
            >
              {section.brandName}
            </div>
            {section.brandDescription && (
              <p style={{ color: 'var(--lp-muted)', margin: '0 auto 16px', maxWidth: 520 }}>
                {section.brandDescription}
              </p>
            )}
            <div style={{ color: 'var(--lp-muted)', fontSize: '0.88rem' }}>
              {section.copyright}
            </div>
          </div>
        ) : (
          <>
            <div className="lp-footer-grid">
              <div>
                <div
                  style={{
                    fontFamily: 'var(--lp-font-heading)',
                    fontWeight: 700,
                    fontSize: '1.24rem',
                    marginBottom: 10,
                  }}
                >
                  {section.brandName}
                </div>
                <p style={{ color: 'var(--lp-muted)', margin: 0, maxWidth: 360 }}>
                  {section.brandDescription}
                </p>
              </div>

              {section.columns.map((col) => (
                <div key={col.id}>
                  <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.96rem' }}>
                    {col.title}
                  </div>
                  <ul className="lp-footer-links">
                    {col.links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={sanitizeHref(link.href)}
                          onClick={(e) => isStudio && e.preventDefault()}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="lp-footer-bottom">
              <span>{section.copyright}</span>
              <span>Spec-Driven Landing Page</span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
}
