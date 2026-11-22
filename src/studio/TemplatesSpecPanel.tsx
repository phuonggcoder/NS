import { useRef, type ChangeEvent } from 'react';
import { RotateCcw, Upload } from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/templates';
import type { LandingPageSpec, SiteMeta } from '../types/spec';

interface TemplatesSpecPanelProps {
  currentTemplateId: string;
  meta: SiteMeta;
  onSelectTemplate: (templateId: string) => void;
  onUpdateMeta: (next: SiteMeta) => void;
  onImportSpec: (spec: LandingPageSpec) => void;
  onResetDefault: () => void;
}

export function TemplatesSpecPanel({
  currentTemplateId,
  meta,
  onSelectTemplate,
  onUpdateMeta,
  onImportSpec,
  onResetDefault,
}: TemplatesSpecPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as LandingPageSpec;
      if (!parsed || !Array.isArray(parsed.sections) || !parsed.theme || !parsed.meta) {
        window.alert('File JSON không đúng định dạng LandingPageSpec.');
        return;
      }
      onImportSpec(parsed);
    } catch {
      window.alert('Không thể đọc file JSON. Vui lòng kiểm tra cú pháp.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="st-group">
        <div className="st-group-title">Mẫu Landing Page Khởi tạo</div>
        <div className="st-preset-grid">
          {STARTER_TEMPLATES.map((tpl) => {
            const isActive = currentTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                className={`st-preset-card ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectTemplate(tpl.id)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{tpl.name}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: isActive ? '#007aff' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#475569',
                    }}
                  >
                    {tpl.tag}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                  {tpl.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="st-group">
        <div className="st-group-title">Thông tin SEO & Trang Khách hàng</div>
        <div className="st-field">
          <label className="st-label">Tiêu đề tab trình duyệt</label>
          <input
            type="text"
            className="st-input"
            value={meta.title}
            onChange={(e) => onUpdateMeta({ ...meta, title: e.target.value })}
          />
        </div>
        <div className="st-field">
          <label className="st-label">Mô tả SEO (Meta Description)</label>
          <textarea
            rows={3}
            className="st-textarea"
            value={meta.description}
            onChange={(e) => onUpdateMeta({ ...meta, description: e.target.value })}
          />
        </div>
        <div className="st-field">
          <label className="st-label">Icon Favicon (Emoji)</label>
          <input
            type="text"
            className="st-input"
            value={meta.favicon}
            onChange={(e) => onUpdateMeta({ ...meta, favicon: e.target.value })}
          />
        </div>

        <div className="st-subcard">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: meta.floatingContact.enabled ? 10 : 0,
            }}
          >
            <span>Nút liên hệ nổi góc phải</span>
            <input
              type="checkbox"
              checked={meta.floatingContact.enabled}
              onChange={(e) =>
                onUpdateMeta({
                  ...meta,
                  floatingContact: { ...meta.floatingContact, enabled: e.target.checked },
                })
              }
            />
          </label>
          {meta.floatingContact.enabled && (
            <>
              <div className="st-field">
                <label className="st-label">Chữ hiển thị</label>
                <input
                  type="text"
                  className="st-input"
                  value={meta.floatingContact.label}
                  onChange={(e) =>
                    onUpdateMeta({
                      ...meta,
                      floatingContact: { ...meta.floatingContact, label: e.target.value },
                    })
                  }
                />
              </div>
              <div className="st-field" style={{ marginBottom: 0 }}>
                <label className="st-label">Đường dẫn (Zalo / #contact)</label>
                <input
                  type="text"
                  className="st-input"
                  value={meta.floatingContact.href}
                  onChange={(e) =>
                    onUpdateMeta({
                      ...meta,
                      floatingContact: { ...meta.floatingContact, href: e.target.value },
                    })
                  }
                />
              </div>
            </>
          )}
        </div>
        <div className="st-subcard" style={{ marginTop: 10 }}>
          <div className="st-label">CSS tùy biến nâng cao (Tùy chọn)</div>
          <textarea
            rows={4}
            className="st-textarea"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}
            placeholder="/* VD: .lp-hero-title { letter-spacing: -0.04em; } */"
            value={meta.customCss || ''}
            onChange={(e) => onUpdateMeta({ ...meta, customCss: e.target.value })}
          />
        </div>
      </div>

      <div className="st-group">
        <div className="st-group-title">Nhập Spec & Khôi phục</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImportJson}
        />
        <div style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            className="st-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            <span>Nhập file landing-spec.json</span>
          </button>
          <button
            type="button"
            className="st-btn st-btn-danger"
            onClick={onResetDefault}
          >
            <RotateCcw size={14} />
            <span>Khôi phục về mặc định</span>
          </button>
        </div>
      </div>
    </div>
  );
}
