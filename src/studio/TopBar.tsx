import { useState } from 'react';
import {
  Code2,
  Crosshair,
  ExternalLink,
  FolderKanban,
  Globe,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Redo2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Undo2,
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
  syncStatus: 'idle' | 'saving' | 'saved' | 'offline';
  storageMode: StorageMode;
  activeFocusTrail: string | null;
  onJumpToFocus: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onToggleAiPanel: () => void;
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
  onToggleLeftPanel,
  onToggleRightPanel,
  onToggleAiPanel,
  onOpenProjects,
  onOpenOrders,
  onOpenSpecModal,
  onOpenSecurity,
  onOpenLivePreview,
  onOpenPublishModal,
}: TopBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const totalInbox = ordersCount + leadsCount;
  const statusMeta = PROJECT_STATUS_META[activeProject.status];

  const syncDotColor =
    syncStatus === 'saving'
      ? '#f59e0b'
      : syncStatus === 'saved'
      ? '#16a34a'
      : '#94a3b8';

  const syncTitle =
    syncStatus === 'saving'
      ? 'Đang đồng bộ lên server...'
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
              maxWidth: 140,
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

      {/* Right: Clean Primary Actions + Overflow Menu */}
      <div className="st-actions-group">
        <button
          type="button"
          className={`st-btn ${aiPanelOpen ? 'st-btn-primary' : ''}`}
          onClick={onToggleAiPanel}
          title="AI tự động điền thông tin & kiểm tra sửa lỗi"
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
            title="Công cụ khác (Đơn hàng, Spec Kit, Bảo mật, Bảng sửa)"
          >
            <MoreHorizontal size={16} />
            {totalInbox > 0 && <span className="st-badge-count">{totalInbox}</span>}
          </button>

          {moreOpen && (
            <div className="st-popover" style={{ width: 250 }}>
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
                    Xem đơn đặt mua & form liên hệ
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
                <FolderKanban size={15} style={{ marginTop: 2, color: '#7c3aed' }} />
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
