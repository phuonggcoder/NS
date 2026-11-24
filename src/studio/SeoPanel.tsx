import { type ChangeEvent, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Search, Upload, X } from 'lucide-react';
import type { DigitalMenuConfig, LandingPageSpec, SiteMeta } from '../types/spec';
import { compressImageFile } from '../utils/imageUpload';

interface SeoPanelProps {
  open: boolean;
  slug: string;
  spec: LandingPageSpec;
  onUpdateMeta: (meta: SiteMeta) => void;
  onUpdateMenuSeo: (seo: NonNullable<DigitalMenuConfig['seo']>) => void;
  onClose: () => void;
}

interface SeoCheckItem {
  id: string;
  passed: boolean;
  label: string;
  detail: string;
}

export function SeoPanel({
  open,
  slug,
  spec,
  onUpdateMeta,
  onUpdateMenuSeo,
  onClose,
}: SeoPanelProps) {
  const checks = useMemo<SeoCheckItem[]>(() => {
    const visible = spec.sections.filter((s) => s.visible);
    const titleLen = (spec.meta.title || '').trim().length;
    const descLen = (spec.meta.description || '').trim().length;
    const heroCount = visible.filter((s) => s.type === 'hero').length;

    // Collect valid anchorIds
    const anchorIds = new Set(
      visible.map((s) => s.anchorId).filter((a) => typeof a === 'string' && a.trim().length > 0)
    );
    anchorIds.add('top');

    // Check internal #anchor links and empty links
    const brokenLinks: string[] = [];
    const checkHref = (label: string, href?: string) => {
      if (!href || !href.trim()) return;
      const t = href.trim();
      if (t === '#') {
        brokenLinks.push(`${label} (link "#" rỗng)`);
      } else if (t.startsWith('#')) {
        const id = t.slice(1);
        if (!anchorIds.has(id)) {
          brokenLinks.push(`${label} (#${id} không tồn tại)`);
        }
      }
    };

    const missingImages: string[] = [];
    for (const sec of visible) {
      if (sec.type === 'navbar') {
        sec.links.forEach((l) => checkHref(`Nav "${l.label}"`, l.href));
        checkHref('Navbar CTA', sec.ctaHref);
      } else if (sec.type === 'hero') {
        checkHref('Hero CTA chính', sec.primaryCtaHref);
        checkHref('Hero CTA phụ', sec.secondaryCtaHref);
        if (!sec.imageUrl?.trim()) missingImages.push('Hero thiếu ảnh');
        else if (!sec.imageCaption?.trim()) missingImages.push('Hero thiếu chú thích / Alt text');
      } else if (sec.type === 'about') {
        if (!sec.avatarUrl?.trim()) missingImages.push('Giới thiệu thiếu ảnh');
      } else if (sec.type === 'products') {
        sec.items.forEach((p) => {
          if (!p.imageUrl?.trim()) missingImages.push(`Sản phẩm "${p.name}" thiếu ảnh`);
        });
      } else if (sec.type === 'gallery') {
        sec.items.forEach((g) => {
          if (!g.imageUrl?.trim()) missingImages.push(`Thư viện "${g.title}" thiếu ảnh`);
        });
      } else if (sec.type === 'cta') {
        checkHref('CTA chính', sec.primaryHref);
        checkHref('CTA phụ', sec.secondaryHref);
      }
    }

    const menuMissingAlt =
      spec.digitalMenu?.enabled
        ? spec.digitalMenu.items.filter((i) => !i.imageUrl?.trim() || !i.name?.trim()).length
        : 0;

    return [
      {
        id: 'title',
        passed: titleLen >= 15 && titleLen <= 65,
        label: 'Meta Title chuẩn độ dài (15–65 ký tự)',
        detail: `Hiện tại: ${titleLen} ký tự.`,
      },
      {
        id: 'desc',
        passed: descLen >= 50 && descLen <= 160,
        label: 'Meta Description chuẩn độ dài (50–160 ký tự)',
        detail: `Hiện tại: ${descLen} ký tự.`,
      },
      {
        id: 'heading',
        passed: heroCount === 1,
        label: 'Cấu trúc Heading (1 thẻ H1 duy nhất ở Hero)',
        detail:
          heroCount === 1
            ? 'Trang có đúng 1 khối Hero (H1) và các section dùng H2.'
            : `Phát hiện ${heroCount} khối Hero đang hiển thị (nên có đúng 1).`,
      },
      {
        id: 'images',
        passed: missingImages.length === 0 && menuMissingAlt === 0,
        label: 'Hình ảnh & Alt Text đầy đủ',
        detail:
          missingImages.length === 0 && menuMissingAlt === 0
            ? 'Tất cả hình ảnh đều có mô tả / alt text hợp lệ.'
            : [...missingImages, menuMissingAlt ? `${menuMissingAlt} món Menu thiếu ảnh` : '']
                .filter(Boolean)
                .join(' · '),
      },
      {
        id: 'links',
        passed: brokenLinks.length === 0,
        label: 'Kiểm tra liên kết nội bộ (#anchor) & nút bấm',
        detail:
          brokenLinks.length === 0
            ? 'Không có liên kết gãy hoặc neo #anchor sai.'
            : brokenLinks.slice(0, 4).join(' · '),
      },
    ];
  }, [spec]);

  if (!open) return null;

  const passedCount = checks.filter((c) => c.passed).length;

  const handleUploadOgImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.82);
      onUpdateMeta({ ...spec.meta, ogImage: dataUrl });
    } catch {
      // Ignore
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="st-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="st-modal" style={{ maxWidth: 820 }}>
        <div className="st-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} color="#007aff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                Quản lý SEO & Kiểm tra Chuẩn Google
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Meta Tags, Open Graph, Canonical, Sitemap & Audit cho Website + Digital Menu
              </div>
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body" style={{ display: 'grid', gap: 14 }}>
          {/* Google Search Preview */}
          <div className="st-subcard" style={{ background: '#ffffff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
              XEM TRƯỚC HIỂN THỊ TRÊN GOOGLE
            </div>
            <div style={{ fontSize: 12, color: '#166534' }}>
              {spec.meta.canonicalUrl || `https://specpage-studio.onrender.com/clients/${slug}/index.html`}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8', marginTop: 2 }}>
              {spec.meta.title || 'Tiêu đề trang web'}
            </div>
            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3, lineHeight: 1.45 }}>
              {spec.meta.description || 'Mô tả ngắn gọn về sản phẩm, dịch vụ của bạn...'}
            </div>
          </div>

          {/* SEO Form */}
          <div className="st-subcard" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>1. Cấu hình SEO & Open Graph (Website)</div>
            <div>
              <label className="st-label">Meta Title ({(spec.meta.title || '').length}/65)</label>
              <input
                type="text"
                className="st-input"
                value={spec.meta.title}
                onChange={(e) => onUpdateMeta({ ...spec.meta, title: e.target.value })}
              />
            </div>
            <div>
              <label className="st-label">
                Meta Description ({(spec.meta.description || '').length}/160)
              </label>
              <textarea
                rows={2}
                className="st-textarea"
                value={spec.meta.description}
                onChange={(e) => onUpdateMeta({ ...spec.meta, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="st-label">Open Graph Title (Facebook / Zalo)</label>
                <input
                  type="text"
                  className="st-input"
                  placeholder="Mặc định dùng Meta Title"
                  value={spec.meta.ogTitle || ''}
                  onChange={(e) => onUpdateMeta({ ...spec.meta, ogTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="st-label">Canonical URL (Tùy chọn)</label>
                <input
                  type="url"
                  className="st-input"
                  placeholder="https://tenmiencuaban.vn/"
                  value={spec.meta.canonicalUrl || ''}
                  onChange={(e) => onUpdateMeta({ ...spec.meta, canonicalUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="st-label">Open Graph Description</label>
              <input
                type="text"
                className="st-input"
                placeholder="Mặc định dùng Meta Description"
                value={spec.meta.ogDescription || ''}
                onChange={(e) => onUpdateMeta({ ...spec.meta, ogDescription: e.target.value })}
              />
            </div>

            <div>
              <label className="st-label">Social Sharing Image (OG Image 1200×630)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="st-input"
                  placeholder="https://... hoặc tải ảnh lên"
                  value={spec.meta.ogImage || ''}
                  onChange={(e) => onUpdateMeta({ ...spec.meta, ogImage: e.target.value })}
                />
                <label className="st-btn st-btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} />
                  <span>Tải ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => void handleUploadOgImage(e)}
                  />
                </label>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={Boolean(spec.meta.robotsNoIndex)}
                onChange={(e) => onUpdateMeta({ ...spec.meta, robotsNoIndex: e.target.checked })}
              />
              <span>Ẩn khỏi công cụ tìm kiếm (noindex, nofollow)</span>
            </label>
          </div>

          {spec.digitalMenu && (
            <div className="st-subcard" style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>2. SEO cho Trang Digital Menu (/menu/{slug})</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="st-label">Tiêu đề SEO Menu</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder={`Thực đơn ${spec.digitalMenu.brandName}`}
                    value={spec.digitalMenu.seo?.title || ''}
                    onChange={(e) =>
                      onUpdateMenuSeo({ ...spec.digitalMenu?.seo, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="st-label">Mô tả SEO Menu</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder={spec.digitalMenu.description || 'Xem thực đơn & giá mới nhất'}
                    value={spec.digitalMenu.seo?.description || ''}
                    onChange={(e) =>
                      onUpdateMenuSeo({ ...spec.digitalMenu?.seo, description: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Automated SEO Audit */}
          <div className="st-subcard">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: 13.5 }}>
                3. Kiểm tra SEO Tự động ({passedCount}/{checks.length} đạt)
              </strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                  <ExternalLink size={12} />
                  <span>sitemap.xml</span>
                </a>
                <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                  <ExternalLink size={12} />
                  <span>robots.txt</span>
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              {checks.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: c.passed ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${c.passed ? '#bbf7d0' : '#fde68a'}`,
                    fontSize: 12.5,
                  }}
                >
                  {c.passed ? (
                    <CheckCircle2 size={15} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={15} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.label}</div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
