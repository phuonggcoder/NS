import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { FONT_OPTIONS, THEME_PRESETS } from '../data/themes';
import type { ThemeConfig } from '../types/spec';
import {
  auditThemeContrast,
  autoFixThemeContrast,
  derivePaletteForMode,
} from '../utils/contrast';
import { cloneSpec } from '../utils/storage';

interface DesignPanelProps {
  theme: ThemeConfig;
  onChangeTheme: (next: ThemeConfig) => void;
}

export function DesignPanel({ theme, onChangeTheme }: DesignPanelProps) {
  const contrastAudit = auditThemeContrast(theme);

  const updateColor = (key: keyof ThemeConfig['colors'], value: string) => {
    onChangeTheme({
      ...theme,
      colors: {
        ...theme.colors,
        [key]: value,
      },
    });
  };

  const handleModeSwitch = (targetMode: 'light' | 'dark') => {
    const adaptedColors = derivePaletteForMode(theme.colors, targetMode);
    onChangeTheme({
      ...theme,
      mode: targetMode,
      colors: adaptedColors,
    });
  };

  return (
    <div>
      <div className="st-group">
        <div className="st-group-title">Bảng màu & Phong cách có sẵn ({THEME_PRESETS.length})</div>
        <div className="st-preset-grid">
          {THEME_PRESETS.map((preset) => {
            const isActive = theme.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`st-preset-card ${isActive ? 'is-active' : ''}`}
                onClick={() => onChangeTheme(cloneSpec(preset.theme))}
              >
                <div className="st-swatches">
                  <span className="st-swatch" style={{ background: preset.theme.colors.background }} />
                  <span className="st-swatch" style={{ background: preset.theme.colors.primary }} />
                  <span className="st-swatch" style={{ background: preset.theme.colors.accent }} />
                  <span className="st-swatch" style={{ background: preset.theme.colors.text }} />
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: '#64748b',
                    }}
                  >
                    {preset.theme.mode === 'dark' ? 'DARK' : 'LIGHT'}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{preset.name}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="st-group">
        <div className="st-group-title">Chế độ Sáng / Tối & Kiểm tra Tương phản</div>
        <div className="st-field">
          <label className="st-label">Chế độ nền (tự động bảo toàn chữ rõ nét)</label>
          <div className="st-pill-selector">
            {(['light', 'dark'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`st-pill-opt ${theme.mode === m ? 'is-active' : ''}`}
                onClick={() => handleModeSwitch(m)}
              >
                {m === 'light' ? 'Nền Sáng (Light)' : 'Nền Tối (Dark)'}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`st-contrast-box ${contrastAudit.allPassed ? 'is-pass' : 'is-warn'}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
            {contrastAudit.allPassed ? (
              <>
                <CheckCircle2 size={14} color="#16a34a" />
                <span>Độ tương phản WCAG: Rõ nét, không bị chìm chữ</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} color="#b45309" />
                <span>Cảnh báo: Chữ có thể bị chìm khi đổi màu!</span>
              </>
            )}
          </div>
          {!contrastAudit.allPassed && (
            <>
              <div style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.4 }}>
                {contrastAudit.checks
                  .filter((c) => !c.passed)
                  .map((c) => `${c.label} (${c.ratio}:1)`)
                  .join(' · ')}
              </div>
              <button
                type="button"
                className="st-btn st-btn-sm st-btn-primary"
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => onChangeTheme(autoFixThemeContrast(theme))}
              >
                <Sparkles size={12} />
                <span>Tự động sửa tương phản dễ đọc</span>
              </button>
            </>
          )}
        </div>

        <div className="st-color-row">
          {(
            [
              ['primary', 'Màu chính'],
              ['accent', 'Màu nhấn'],
              ['background', 'Nền trang'],
              ['surface', 'Nền thẻ'],
              ['surfaceAlt', 'Nền xen kẽ'],
              ['text', 'Chữ chính'],
              ['muted', 'Chữ phụ'],
              ['border', 'Đường viền'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <span className="st-label">{label}</span>
              <div className="st-color-box">
                <input
                  type="color"
                  value={theme.colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                />
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>
                  {theme.colors[key]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="st-group">
        <div className="st-group-title">Font chữ (Typography)</div>
        <div className="st-field">
          <label className="st-label">Font Tiêu đề</label>
          <select
            className="st-select"
            value={theme.typography.headingFont}
            onChange={(e) =>
              onChangeTheme({
                ...theme,
                typography: { ...theme.typography, headingFont: e.target.value },
              })
            }
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.cssValue}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        <div className="st-field">
          <label className="st-label">Font Nội dung</label>
          <select
            className="st-select"
            value={theme.typography.bodyFont}
            onChange={(e) =>
              onChangeTheme({
                ...theme,
                typography: { ...theme.typography, bodyFont: e.target.value },
              })
            }
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.cssValue}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        <div className="st-field">
          <label className="st-label">Tỷ lệ cỡ chữ</label>
          <div className="st-pill-selector">
            {(
              [
                ['compact', 'Gọn'],
                ['standard', 'Chuẩn'],
                ['editorial', 'Tạp chí'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${theme.typography.scale === val ? 'is-active' : ''}`}
                onClick={() =>
                  onChangeTheme({
                    ...theme,
                    typography: { ...theme.typography, scale: val },
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="st-group">
        <div className="st-group-title">Hình khối, Bố cục & Hiệu ứng</div>
        <div className="st-field">
          <label className="st-label">Bo góc giao diện</label>
          <div className="st-pill-selector">
            {(
              [
                ['sharp', 'Vuông'],
                ['balanced', 'Vừa'],
                ['rounded', 'Bo tròn'],
                ['pill', 'Mềm mại'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${theme.shape.radius === val ? 'is-active' : ''}`}
                onClick={() =>
                  onChangeTheme({ ...theme, shape: { ...theme.shape, radius: val } })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field">
          <label className="st-label">Kiểu nút bấm (CTA)</label>
          <div className="st-pill-selector">
            {(
              [
                ['solid', 'Đơn sắc'],
                ['gradient', 'Chuyển sắc'],
                ['outline', 'Viền nổi'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${theme.shape.buttonStyle === val ? 'is-active' : ''}`}
                onClick={() =>
                  onChangeTheme({ ...theme, shape: { ...theme.shape, buttonStyle: val } })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field">
          <label className="st-label">Kiểu thẻ (Card)</label>
          <div className="st-pill-selector">
            {(
              [
                ['bordered', 'Viền tinh gọn'],
                ['elevated', 'Đổ bóng nổi'],
                ['glass', 'Kính mờ'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${theme.shape.cardStyle === val ? 'is-active' : ''}`}
                onClick={() =>
                  onChangeTheme({ ...theme, shape: { ...theme.shape, cardStyle: val } })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field">
          <label className="st-label">Độ thoáng giữa các khối</label>
          <div className="st-pill-selector">
            {(
              [
                ['compact', 'Gọn'],
                ['standard', 'Chuẩn'],
                ['spacious', 'Thoáng'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${theme.spacing === val ? 'is-active' : ''}`}
                onClick={() => onChangeTheme({ ...theme, spacing: val })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field">
          <label className="st-label">Độ rộng khung nội dung</label>
          <div className="st-pill-selector">
            {(
              [
                ['compact', 'Gọn (1040px)'],
                ['standard', 'Chuẩn (1180px)'],
                ['wide', 'Rộng (1320px)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${
                  (theme.containerWidth ?? 'standard') === val ? 'is-active' : ''
                }`}
                onClick={() => onChangeTheme({ ...theme, containerWidth: val })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="st-field" style={{ marginBottom: 0 }}>
          <label className="st-label">Hiệu ứng chuyển động thẻ</label>
          <div className="st-pill-selector">
            {(
              [
                ['none', 'Tĩnh'],
                ['subtle', 'Nhẹ nhàng'],
                ['smooth', 'Nổi bật'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`st-pill-opt ${(theme.motion ?? 'subtle') === val ? 'is-active' : ''}`}
                onClick={() => onChangeTheme({ ...theme, motion: val })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
