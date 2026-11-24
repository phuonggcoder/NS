import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { FONT_OPTIONS } from '../../data/themes';
import type { DigitalMenuConfig } from '../../types/spec';
import { compressImageFile } from '../../utils/imageUpload';

interface MenuAppearancePanelProps {
  menu: DigitalMenuConfig;
  onChange: (next: DigitalMenuConfig) => void;
}

export function MenuAppearancePanel({ menu, onChange }: MenuAppearancePanelProps) {
  const updateTheme = (patch: Partial<DigitalMenuConfig['theme']>) => {
    onChange({
      ...menu,
      theme: { ...menu.theme, ...patch },
    });
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.82);
      updateTheme({ bannerUrl: dataUrl });
    } catch {
      // Ignore
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="st-subcard">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Thông tin thương hiệu Menu</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <div>
            <label className="st-label">Tên quán / Thương hiệu</label>
            <input
              type="text"
              className="st-input"
              value={menu.brandName}
              onChange={(e) => onChange({ ...menu, brandName: e.target.value })}
            />
          </div>
          <div>
            <label className="st-label">Đơn vị tiền tệ</label>
            <input
              type="text"
              className="st-input"
              value={menu.currency}
              onChange={(e) => onChange({ ...menu, currency: e.target.value })}
            />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="st-label">Mô tả thực đơn</label>
          <input
            type="text"
            className="st-input"
            value={menu.description || ''}
            onChange={(e) => onChange({ ...menu, description: e.target.value })}
          />
        </div>
      </div>

      <div className="st-subcard">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Bố cục & Chế độ hiển thị</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="st-label">Kiểu hiển thị món</label>
            <div className="st-pill-selector">
              <button
                type="button"
                className={`st-pill-opt ${menu.theme.layout === 'grid' ? 'is-active' : ''}`}
                onClick={() => updateTheme({ layout: 'grid' })}
              >
                Lưới (Grid)
              </button>
              <button
                type="button"
                className={`st-pill-opt ${menu.theme.layout === 'list' ? 'is-active' : ''}`}
                onClick={() => updateTheme({ layout: 'list' })}
              >
                Danh sách (List)
              </button>
            </div>
          </div>

          <div>
            <label className="st-label">Giao diện Sáng / Tối</label>
            <div className="st-pill-selector">
              <button
                type="button"
                className={`st-pill-opt ${menu.theme.mode === 'light' ? 'is-active' : ''}`}
                onClick={() => updateTheme({ mode: 'light' })}
              >
                Sáng (Light)
              </button>
              <button
                type="button"
                className={`st-pill-opt ${menu.theme.mode === 'dark' ? 'is-active' : ''}`}
                onClick={() => updateTheme({ mode: 'dark' })}
              >
                Tối (Dark)
              </button>
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5 }}>
          <input
            type="checkbox"
            checked={menu.theme.showCategoryNav !== false}
            onChange={(e) => updateTheme({ showCategoryNav: e.target.checked })}
          />
          <span>Hiển thị thanh điều hướng danh mục (Category Navigation)</span>
        </label>
      </div>

      <div className="st-subcard">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Màu sắc & Typography</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="st-label">Màu chính (Primary)</label>
            <input
              type="color"
              className="st-input"
              style={{ height: 38, padding: 4 }}
              value={menu.theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
            />
          </div>
          <div>
            <label className="st-label">Màu nhấn (Accent)</label>
            <input
              type="color"
              className="st-input"
              style={{ height: 38, padding: 4 }}
              value={menu.theme.accentColor}
              onChange={(e) => updateTheme({ accentColor: e.target.value })}
            />
          </div>
          <div>
            <label className="st-label">Màu nền (Light Mode)</label>
            <input
              type="color"
              className="st-input"
              style={{ height: 38, padding: 4 }}
              value={menu.theme.backgroundColor}
              onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
            />
          </div>
          <div>
            <label className="st-label">Màu chữ (Light Mode)</label>
            <input
              type="color"
              className="st-input"
              style={{ height: 38, padding: 4 }}
              value={menu.theme.textColor}
              onChange={(e) => updateTheme({ textColor: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <label className="st-label">Font chữ thực đơn</label>
          <select
            className="st-select"
            value={menu.theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.cssValue}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="st-subcard">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Banner đầu trang Menu</div>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="text"
            className="st-input"
            placeholder="Tiêu đề trên Banner"
            value={menu.theme.bannerTitle || ''}
            onChange={(e) => updateTheme({ bannerTitle: e.target.value })}
          />
          <input
            type="text"
            className="st-input"
            placeholder="Phụ đề trên Banner"
            value={menu.theme.bannerSubtitle || ''}
            onChange={(e) => updateTheme({ bannerSubtitle: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              className="st-input"
              placeholder="URL ảnh Banner"
              value={menu.theme.bannerUrl || ''}
              onChange={(e) => updateTheme({ bannerUrl: e.target.value })}
            />
            <label className="st-btn st-btn-sm" style={{ cursor: 'pointer', flexShrink: 0 }}>
              <Upload size={13} />
              <span>Tải ảnh</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => void handleBannerUpload(e)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
