import { useState } from 'react';
import type { NavbarSection as NavbarSectionData } from '../../types/spec';
import { sanitizeHref } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';

interface Props {
  section: NavbarSectionData;
  isStudio?: boolean;
}

export function NavbarSection({ section, isStudio }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClass = [
    'lp-navbar',
    section.variant === 'solid' ? 'lp-nav-solid' : '',
    section.variant === 'floating' ? 'lp-nav-floating' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header id={section.anchorId || undefined} className={navClass}>
      <div className="lp-container lp-nav-inner">
        <a
          href="#top"
          className="lp-brand"
          onClick={(e) => isStudio && e.preventDefault()}
        >
          {section.logoEmoji && <span className="lp-brand-mark">{section.logoEmoji}</span>}
          <span>{section.logoText}</span>
        </a>

        <nav aria-label="Điều hướng chính">
          <ul className="lp-nav-links">
            {section.links.map((link) => (
              <li key={link.id}>
                <a
                  href={sanitizeHref(link.href)}
                  className="lp-nav-link"
                  onClick={(e) => isStudio && e.preventDefault()}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lp-nav-actions">
          {section.ctaLabel && (
            <a
              href={sanitizeHref(section.ctaHref)}
              className="lp-btn lp-btn-primary lp-btn-sm lp-nav-cta-desktop"
              onClick={(e) => isStudio && e.preventDefault()}
            >
              {section.ctaLabel}
            </a>
          )}
          <button
            type="button"
            className="lp-nav-toggle"
            aria-label="Mở menu điều hướng"
            aria-expanded={mobileOpen}
            data-lp-menu-toggle="true"
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen((prev) => !prev);
            }}
          >
            <IconRenderer name={mobileOpen ? 'x' : 'menu'} size={20} />
          </button>
        </div>
      </div>

      <div
        className={`lp-mobile-drawer ${mobileOpen ? 'is-open' : ''}`}
        data-lp-mobile-menu="true"
      >
        {section.links.map((link) => (
          <a
            key={link.id}
            href={sanitizeHref(link.href)}
            className="lp-nav-link"
            onClick={(e) => {
              if (isStudio) e.preventDefault();
              setMobileOpen(false);
            }}
          >
            {link.label}
          </a>
        ))}
        {section.ctaLabel && (
          <a
            href={sanitizeHref(section.ctaHref)}
            className="lp-btn lp-btn-primary lp-btn-sm"
            onClick={(e) => {
              if (isStudio) e.preventDefault();
              setMobileOpen(false);
            }}
          >
            {section.ctaLabel}
          </a>
        )}
      </div>
    </header>
  );
}
