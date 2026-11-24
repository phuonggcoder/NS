import { useState } from 'react';
import {
  BarChart3,
  Code2,
  Crosshair,
  ExternalLink,
  FolderKanban,
  Globe,
  History,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Undo2,
  UtensilsCrossed,
} from 'lucide-react';
import type { ClientProject } from '../types/spec';
import type { StorageMode } from '../utils/auth';
import { PROJECT_STATUS_META } from '../utils/projects';

interface TopBarProps {
  activeProject: ClientProject;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  ordersCount: number;
  leadsCount: number;
  aiIssuesCount: number;
  aiPanelOpen: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  storageMode: StorageMode;
  activeFocusTrail: string | null;
  onJumpToFocus: () => void;
  onSaveNow: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onToggleAiPanel: () => void;
  onOpenDigitalMenu: () => void;
  onOpenVersions: () => void;
  onOpenSeo: () => void;
  onOpenAnalytics: () => void;
  onOpenProjects: () => void;
  onOpenOrders: () => void;
  onOpenSpecModal: () => void;
  onOpenSecurity: () => void;
  onOpenLivePreview: () => void;
  onOpenPublishModal: () => void;
}

export function TopBar({
  activeProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  ordersCount,
  leadsCount,
  aiIssuesCount,
  aiPanelOpen,
  leftPanelOpen,
  rightPanelOpen,
  syncStatus,
  storageMode,
  activeFocusTrail,
  onJumpToFocus,
  onSaveNow,
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleAiPanel,
  onOpenDigitalMenu,
  onOpenVersions,
  onOpenSeo,
  onOpenAnalytics,
  onOpenProjects,
  onOpenOrders,
  onOpenSpecModal,
  onOpenSecurity,
  onOpenLivePreview,
  onOpenPublishModal,
}: TopBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const totalInbox = ordersCount + leadsCount;
  const statusMeta = PROJECT_STATUS_META[activeProject.status] || PROJECT_STATUS_META.draft;

  const syncDotColor =
    syncStatus === 'saving'
      ? '#f59e0b'
      : syncStatus === 'saved'
        ? '#16a34a'
        : syncStatus === 'error'
          ? '#dc2626'
          : '#94a3b8';

  const syncTitle =
    syncStatus === 'saving'
      ? 'Đang lưu lên server...'
      : syncStatus === 'error'
        ? 'Lỗi lưu dữ liệu! Bấm nút Lưu ngay để thử lại'
        : syncStatus === 'saved'
          ? storageMode === 'upstash' || storageMode === 'supabase'
            ? 'Đã lưu vĩnh viễn lên Cloud'
            : 'Đã lưu lên Server'
          : 'Lưu cục bộ trên trình duyệt';

  return (
    <header className="st-topbar st-topbar-min">
      {/* Left: Brand, Sidebar Toggle, Active Project & Sync Indicator */}
      <div className="st-brand-group">
        <button
          type="button"
          className={`st-btn st-btn-icon ${leftPanelOpen ? 'is-tinted' : ''}`}
          onClick={onToggleLeftPanel}
          title={leftPanelOpen ? 'Ẩn thanh Cấu trúc/Thiết kế' : 'Hiện thanh Cấu trúc/Thiết kế'}
        >
          <PanelLeft size={16} />
        </button>

        <div className="st-logo-badge">S</div>

        <button
          type="button"
          className="st-btn st-btn-sm"
          onClick={onOpenProjects}
          title="Quản lý & chuyển đổi dự án khách hàng"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: syncDotColor,
              flexShrink: 0,
            }}
            title={syncTitle}
          />
          <span
            style={{
              maxWidth: 130,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeProject.projectName}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 999,
              background: statusMeta.bg,
              color: statusMeta.color,
            }}
          >
            {statusMeta.label}
          </span>
        </button>

        <button
          type="button"
          className={`st-btn st-btn-sm ${syncStatus === 'error' || syncStatus === 'offline' ? 'st-btn-danger' : ''}`}
          onClick={onSaveNow}
          title={syncTitle}
        >
          <Save size={13} />
          <span>
            {syncStatus === 'saving'
              ? 'Đang lưu...'
              : syncStatus === 'error' || syncStatus === 'offline'
                ? 'Thử lại (Retry)'
                : 'Lưu ngay'}
          </span>
        </button>
      </div>

      {/* Center: Undo/Redo & Active Canva Focus Breadcrumb */}
      <div className="st-center-tools">
        <button
          type="button"
          className="st-btn st-btn-icon"
          disabled={!canUndo}
          onClick={onUndo}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          className="st-btn st-btn-icon"
          disabled={!canRedo}
          onClick={onRedo}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>

        {activeFocusTrail && (
          <button
            type="button"
            className="st-focus-crumb"
            onClick={onJumpToFocus}
            title="Bấm để quay lại mục đang sửa trên trang"
          >
            <Crosshair size={13} />
            <span>{activeFocusTrail}</span>
          </button>
        )}
      </div>

      {/* Right: Primary Actions + Digital Menu + Overflow Menu */}
      <div className="st-actions-group">
        <button
          type="button"
          className="st-btn"
          onClick={onOpenDigitalMenu}
          title="Quản lý Thực đơn điện tử (Digital Menu) & Mã QR cho Nhà hàng / Quán Café"
        >
          <UtensilsCrossed size={15} />
          <span>Menu QR</span>
        </button>

        <button
          type="button"
          className={`st-btn ${aiPanelOpen ? 'st-btn-primary' : ''}`}
          onClick={onToggleAiPanel}
          title="AI trợ lý viết bài, tự động điền & kiểm lỗi"
        >
          <Sparkles size={15} />
          <span>AI</span>
          {aiIssuesCount > 0 && (
            <span
              className="st-badge-count"
              style={{ background: aiPanelOpen ? '#0f172a' : '#f59e0b' }}
            >
              {aiIssuesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="st-btn"
          onClick={onOpenLivePreview}
          title="Lưu đồng bộ ngay và mở trang web khách hàng (Live)"
        >
          <ExternalLink size={15} />
          <span>Xem live</span>
        </button>

        <button
          type="button"
          className="st-btn st-btn-primary"
          onClick={onOpenPublishModal}
        >
          <Globe size={15} />
          <span>Xuất bản</span>
        </button>

        <div className="st-popover-wrap">
          <button
            type="button"
            className="st-btn st-btn-icon"
            onClick={() => setMoreOpen((prev) => !prev)}
            title="Công cụ khác (SEO, Thống kê, Phiên bản, Đơn hàng, Spec Kit)"
          >
            <MoreHorizontal size={16} />
            {totalInbox > 0 && <span className="st-badge-count">{totalInbox}</span>}
          </button>

          {moreOpen && (
            <div className="st-popover" style={{ width: 264 }}>
              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenSeo();
                }}
              >
                <Search size={15} style={{ marginTop: 2, color: '#0284c7' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Quản lý SEO & Audit</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Meta, Open Graph, Sitemap & kiểm tra thẻ
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenAnalytics();
                }}
              >
                <BarChart3 size={15} style={{ marginTop: 2, color: '#7c3aed' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Thống kê & Lượt quét QR</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Page Views, Unique Visitors & món xem nhiều
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenVersions();
                }}
              >
                <History size={15} style={{ marginTop: 2, color: '#d97706' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Lịch sử Phiên bản</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Lưu mốc & khôi phục bản cũ an toàn
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenOrders();
                }}
              >
                <ShoppingBag size={15} style={{ marginTop: 2, color: '#007aff' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                    Đơn hàng & Khách ({totalInbox})
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Xem đơn đặt mua, Menu QR & form liên hệ
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenProjects();
                }}
              >
                <FolderKanban size={15} style={{ marginTop: 2, color: '#4f46e5' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Dự án khách hàng</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Tạo mới, đổi khách & xem góp ý
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenSpecModal();
                }}
              >
                <Code2 size={15} style={{ marginTop: 2, color: '#0f172a' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Spec Kit (JSON & spec.md)</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Xem & chỉnh sửa bản đặc tả gốc
                  </div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onOpenSecurity();
                }}
              >
                <ShieldCheck size={15} style={{ marginTop: 2, color: '#16a34a' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>Bảo mật & Lưu trữ Cloud</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{syncTitle}</div>
                </div>
              </button>

              <button
                type="button"
                className="st-menu-item"
                onClick={() => {
                  setMoreOpen(false);
                  onToggleRightPanel();
                }}
              >
                <PanelRight size={15} style={{ marginTop: 2, color: '#475569' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                    {rightPanelOpen ? 'Ẩn bảng chỉnh sửa phải' : 'Hiện bảng chỉnh sửa phải'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Mở rộng không gian xem thiết kế
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
