import { useState } from 'react';
import { Check, Code2, Copy, Download, ExternalLink, Globe, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { ClientProject } from '../types/spec';

interface PublishModalProps {
  open: boolean;
  project: ClientProject;
  isPublishing: boolean;
  lastPublishedUrl?: string;
  onClose: () => void;
  onPublishToServer: () => void;
  onRegenerateReviewToken: () => void;
  onDownloadHtml: () => void;
  onDownloadSpecJson: () => void;
}

export function PublishModal({
  open,
  project,
  isPublishing,
  lastPublishedUrl,
  onClose,
  onPublishToServer,
  onRegenerateReviewToken,
  onDownloadHtml,
  onDownloadSpecJson,
}: PublishModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tokenQuery = project.reviewToken ? `&token=${encodeURIComponent(project.reviewToken)}` : '';
  const reviewUrl = `${origin}/?mode=review&slug=${encodeURIComponent(project.slug)}${tokenQuery}`;
  const liveUrl = `${origin}/?mode=live&slug=${encodeURIComponent(project.slug)}`;
  const staticClientUrl = `${origin}/clients/${encodeURIComponent(project.slug)}/index.html`;
  const menuUrl = `${origin}/menu/${encodeURIComponent(project.slug)}`;

  const copyLink = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard failure
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
      <div className="st-modal" style={{ maxWidth: 680 }}>
        <div className="st-modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Gửi mẫu cho khách & Xuất bản Production
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Dự án: <strong>{project.projectName}</strong> ({project.clientName})
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body">
          <div className="st-subcard" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
              Bước 1: Xuất bản bản chính thức (Published)
            </div>
            <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 10px' }}>
              Bản Nháp (Draft) chỉ xem qua link có Token bảo mật. Khi xuất bản, hệ thống sẽ cập nhật trang công khai <code>/clients/{project.slug}/index.html</code> và lưu mốc Version History.
            </p>
            <button
              type="button"
              className="st-btn st-btn-primary"
              disabled={isPublishing}
              onClick={onPublishToServer}
            >
              <Globe size={15} />
              <span>{isPublishing ? 'Đang xuất bản...' : 'Xuất bản bản chính thức'}</span>
            </button>
            {lastPublishedUrl && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: '#15803d', fontWeight: 600 }}>
                ✅ Đã xuất bản thành công! Link công khai đã cập nhật phiên bản mới nhất.
              </div>
            )}
          </div>

          <div className="st-group">
            <div className="st-group-title">Bước 2: Phân tách Link Nháp (Review) & Link Chính thức (Live)</div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={14} color="#b45309" />
                  <span>1. Link Xem trước bản Nháp (Có Token bảo mật cho khách duyệt)</span>
                </span>
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={onRegenerateReviewToken}
                  title="Tạo mã bảo mật mới & gửi lại bản Preview"
                >
                  <RefreshCw size={12} />
                  <span>Tạo lại Token</span>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" readOnly className="st-input" value={reviewUrl} />
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() => copyLink('review', reviewUrl)}
                >
                  {copiedKey === 'review' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'review' ? 'Đã chép' : 'Chép'}</span>
                </button>
                <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span>2. Link Trang Chính thức đã Xuất bản (HTML tĩnh)</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" readOnly className="st-input" value={staticClientUrl} />
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() => copyLink('static', staticClientUrl)}
                >
                  {copiedKey === 'static' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'static' ? 'Đã chép' : 'Chép'}</span>
                </button>
                <a href={staticClientUrl} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span>3. Link Xem Live (/?mode=live) & Digital Menu QR</span>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" readOnly className="st-input" value={liveUrl} />
                  <button type="button" className="st-btn st-btn-sm" onClick={() => copyLink('live', liveUrl)}>
                    {copiedKey === 'live' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'live' ? 'Đã chép' : 'Chép'}</span>
                  </button>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                    <ExternalLink size={13} />
                  </a>
                </div>
                {project.spec.digitalMenu?.enabled && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text" readOnly className="st-input" value={menuUrl} />
                    <button type="button" className="st-btn st-btn-sm" onClick={() => copyLink('menu', menuUrl)}>
                      {copiedKey === 'menu' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'menu' ? 'Đã chép' : 'Chép'}</span>
                    </button>
                    <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-sm">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="st-group">
            <div className="st-group-title">Bước 3: Tải file bàn giao / Deploy riêng</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="st-btn" onClick={onDownloadHtml}>
                <Download size={14} />
                <span>Tải file HTML trọn gói ({project.slug}.html)</span>
              </button>
              <button type="button" className="st-btn" onClick={onDownloadSpecJson}>
                <Code2 size={14} />
                <span>Tải Spec JSON ({project.slug}.spec.json)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
