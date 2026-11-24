import { useState } from 'react';
import { ExternalLink, FolderTree, Palette, QrCode, UtensilsCrossed, X } from 'lucide-react';
import { createDefaultDigitalMenu, type MenuIndustry } from '../../data/digitalMenuDefaults';
import { DigitalMenuPage } from '../../renderer/menu/DigitalMenuPage';
import type { DigitalMenuConfig } from '../../types/spec';
import { buildMenuUrl } from '../../utils/qrCode';
import { CategoryManager } from './CategoryManager';
import { MenuAppearancePanel } from './MenuAppearancePanel';
import { MenuItemEditor } from './MenuItemEditor';
import { QrMenuPanel } from './QrMenuPanel';

interface DigitalMenuEditorProps {
  open: boolean;
  slug: string;
  brandTitle: string;
  templateId: string;
  menu?: DigitalMenuConfig;
  onChange: (next: DigitalMenuConfig) => void;
  onClose: () => void;
}

type MenuTab = 'items' | 'categories' | 'appearance' | 'qr';

function inferIndustry(templateId: string): MenuIndustry {
  if (templateId === 'coffee-shop') return 'coffee-shop';
  if (templateId === 'milk-tea') return 'milk-tea';
  if (templateId === 'bakery') return 'bakery';
  if (templateId === 'restaurant') return 'restaurant';
  return 'general';
}

export function DigitalMenuEditor({
  open,
  slug,
  brandTitle,
  templateId,
  menu,
  onChange,
  onClose,
}: DigitalMenuEditorProps) {
  const [tab, setTab] = useState<MenuTab>('items');

  if (!open) return null;

  const activeMenu: DigitalMenuConfig =
    menu ?? createDefaultDigitalMenu(inferIndustry(templateId), brandTitle);

  const ensureInitialized = (next: DigitalMenuConfig) => {
    onChange({ ...next, enabled: next.enabled });
  };

  const publicMenuUrl = buildMenuUrl(
    typeof window !== 'undefined' ? window.location.origin : '',
    slug,
    { qr: false }
  );

  return (
    <div
      className="st-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="st-modal" style={{ maxWidth: 1140, width: '96vw', height: '90vh' }}>
        <div className="st-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UtensilsCrossed size={18} color="#007aff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                Digital Menu & QR Menu — {activeMenu.brandName}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Thực đơn điện tử cho nhà hàng, quán cà phê, trà sữa, tiệm bánh & cửa hàng
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                background: activeMenu.enabled ? '#dcfce7' : '#f1f5f9',
                color: activeMenu.enabled ? '#15803d' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={activeMenu.enabled}
                onChange={(e) => ensureInitialized({ ...activeMenu, enabled: e.target.checked })}
              />
              <span>{activeMenu.enabled ? 'Đang bật Menu QR' : 'Đang tắt Menu QR'}</span>
            </label>

            {activeMenu.enabled && (
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="st-btn st-btn-sm"
              >
                <ExternalLink size={13} />
                <span>Mở trang Menu</span>
              </a>
            )}

            <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          className="st-modal-body"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(300px, 390px)',
            gap: 16,
            padding: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="st-panel-tabs" style={{ marginBottom: 12 }}>
              <button
                type="button"
                className={`st-tab-btn ${tab === 'items' ? 'is-active' : ''}`}
                onClick={() => setTab('items')}
              >
                <UtensilsCrossed size={13} />
                <span>Món ăn ({activeMenu.items.length})</span>
              </button>
              <button
                type="button"
                className={`st-tab-btn ${tab === 'categories' ? 'is-active' : ''}`}
                onClick={() => setTab('categories')}
              >
                <FolderTree size={13} />
                <span>Danh mục ({activeMenu.categories.length})</span>
              </button>
              <button
                type="button"
                className={`st-tab-btn ${tab === 'appearance' ? 'is-active' : ''}`}
                onClick={() => setTab('appearance')}
              >
                <Palette size={13} />
                <span>Giao diện</span>
              </button>
              <button
                type="button"
                className={`st-tab-btn ${tab === 'qr' ? 'is-active' : ''}`}
                onClick={() => setTab('qr')}
              >
                <QrCode size={13} />
                <span>Mã QR</span>
              </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>
              {tab === 'categories' && (
                <CategoryManager
                  categories={activeMenu.categories}
                  onChange={(categories) => ensureInitialized({ ...activeMenu, categories })}
                />
              )}
              {tab === 'items' && (
                <MenuItemEditor
                  categories={activeMenu.categories}
                  items={activeMenu.items}
                  currency={activeMenu.currency}
                  onChange={(items) => ensureInitialized({ ...activeMenu, items })}
                />
              )}
              {tab === 'appearance' && (
                <MenuAppearancePanel
                  menu={activeMenu}
                  onChange={(next) => ensureInitialized(next)}
                />
              )}
              {tab === 'qr' && (
                <QrMenuPanel
                  slug={slug}
                  brandName={activeMenu.brandName}
                  targets={activeMenu.qrTargets || []}
                  onChangeTargets={(qrTargets) => ensureInitialized({ ...activeMenu, qrTargets })}
                />
              )}
            </div>
          </div>

          {/* Mobile-First Live Preview Frame */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#e2e8f0',
              borderRadius: 18,
              padding: 12,
              minHeight: 0,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: '#334155',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Xem trước trực tiếp trên Điện thoại (Mobile First)
            </div>
            <div
              style={{
                flex: 1,
                width: '100%',
                maxWidth: 375,
                margin: '0 auto',
                overflowY: 'auto',
                overflowX: 'hidden',
                borderRadius: 22,
                border: '5px solid #0f172a',
                background: '#ffffff',
                boxShadow: '0 16px 36px rgba(15,23,42,0.18)',
              }}
            >
              <DigitalMenuPage menu={activeMenu} clientSlug={slug} previewOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
