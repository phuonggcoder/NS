import {
  Cloud,
  Code2,
  ExternalLink,
  FolderKanban,
  Globe,
  Monitor,
  Redo2,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
} from 'lucide-react';
import type { ClientProject, ViewportMode } from '../types/spec';
import type { StorageMode } from '../utils/auth';
import { PROJECT_STATUS_META } from '../utils/projects';

interface TopBarProps {
  activeProject: ClientProject;
  viewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  ordersCount: number;
  leadsCount: number;
  aiIssuesCount: number;
  aiPanelOpen: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'offline';
  storageMode: StorageMode;
  onToggleAiPanel: () => void;
  onOpenProjects: () => void;
  onOpenOrders: () => void;
  onOpenSpecModal: () => void;
  onOpenSecurity: () => void;
  onOpenPublishModal: () => void;
}

export function TopBar({
  activeProject,
  viewport,
  onViewportChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  ordersCount,
  leadsCount,
  aiIssuesCount,
  aiPanelOpen,
  syncStatus,
  storageMode,
  onToggleAiPanel,
  onOpenProjects,
  onOpenOrders,
  onOpenSpecModal,
  onOpenSecurity,
  onOpenPublishModal,
}: TopBarProps) {
  const totalInbox = ordersCount + leadsCount;
  const statusMeta = PROJECT_STATUS_META[activeProject.status];

  const syncLabel =
    syncStatus === 'saving'
      ? 'Đang lưu...'
      : syncStatus === 'saved'
      ? storageMode === 'upstash' || storageMode === 'supabase'
        ? 'Đã lưu Cloud'
        : 'Đã lưu Server'
      : 'Lưu cục bộ';

  return (
    <header className="st-topbar">
      <div className="st-brand-group">
        <div className="st-logo-badge">S</div>
        <div>
          <div className="st-brand-title">SpecPage Studio</div>
          <div className="st-brand-sub">Spec-Driven · speckit.org</div>
        </div>

        <button
          type="button"
          className="st-btn st-btn-sm"
          onClick={onOpenProjects}
          title="Quản lý & chuyển đổi dự án khách hàng"
          style={{ marginLeft: 4 }}
        >
          <FolderKanban size={14} />
          <span
            style={{
              maxWidth: 118,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeProject.projectName}
          </span>
          <span
            style={{
              fontSize: 10.5,
              padding: '1px 6px',
              borderRadius: 999,
              background: statusMeta.bg,
              color: statusMeta.color,
            }}
          >
            {statusMeta.label}
          </span>
        </button>

        <span
          className="st-sync-pill"
          title="Trạng thái đồng bộ & ghi nhớ dữ liệu"
        >
          <Cloud size={12} />
          <span>{syncLabel}</span>
        </span>
      </div>

      <div className="st-center-tools">
        <div className="st-segmented" role="group" aria-label="Chọn kích thước màn hình">
          <button
            type="button"
            className={`st-seg-btn ${viewport === 'desktop' ? 'is-active' : ''}`}
            onClick={() => onViewportChange('desktop')}
            title="Xem màn hình máy tính"
          >
            <Monitor size={14} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            className={`st-seg-btn ${viewport === 'tablet' ? 'is-active' : ''}`}
            onClick={() => onViewportChange('tablet')}
            title="Xem màn hình Tablet (768px)"
          >
            <Tablet size={14} />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            className={`st-seg-btn ${viewport === 'mobile' ? 'is-active' : ''}`}
            onClick={() => onViewportChange('mobile')}
            title="Xem điện thoại (390px)"
          >
            <Smartphone size={14} />
            <span>Mobile</span>
          </button>
        </div>

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
      </div>

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
          onClick={onOpenOrders}
          title="Xem đơn hàng và liên hệ từ khách hàng"
        >
          <ShoppingBag size={15} />
          <span>Đơn</span>
          {totalInbox > 0 && <span className="st-badge-count">{totalInbox}</span>}
        </button>

        <button
          type="button"
          className="st-btn st-btn-icon"
          onClick={onOpenSpecModal}
          title="Xem và chỉnh sửa Spec Kit (JSON & spec.md)"
        >
          <Code2 size={15} />
        </button>

        <button
          type="button"
          className="st-btn st-btn-icon"
          onClick={onOpenSecurity}
          title="Bảo mật, mật khẩu & lưu trữ Cloud"
        >
          <ShieldCheck size={15} />
        </button>

        <a
          href={`/?mode=live&from=studio&slug=${encodeURIComponent(activeProject.slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="st-btn"
          title="Mở trang web sản phẩm mà khách hàng nhìn thấy"
        >
          <ExternalLink size={15} />
          <span>Xem live</span>
        </a>

        <button
          type="button"
          className="st-btn st-btn-primary"
          onClick={onOpenPublishModal}
        >
          <Globe size={15} />
          <span>Gửi khách & Xuất bản</span>
        </button>
      </div>
    </header>
  );
}
