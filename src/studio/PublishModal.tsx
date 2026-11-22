import { useState } from 'react';
import { Check, Code2, Copy, Download, ExternalLink, Globe, X } from 'lucide-react';
import type { ClientProject } from '../types/spec';

interface PublishModalProps {
  open: boolean;
  project: ClientProject;
  isPublishing: boolean;
  lastPublishedUrl?: string;
  onClose: () => void;
  onPublishToServer: () => void;
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
  onDownloadHtml,
  onDownloadSpecJson,
}: PublishModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const reviewUrl = `${origin}/?mode=review&slug=${encodeURIComponent(project.slug)}`;
  const liveUrl = `${origin}/?mode=live&slug=${encodeURIComponent(project.slug)}`;
  const staticClientUrl = `${origin}/clients/${encodeURIComponent(project.slug)}/index.html`;

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
      <div className="st-modal" style={{ maxWidth: 660 }}>
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
              Bước 1: Xuất bản bản mới nhất lên Server
            </div>
            <p style={{ fontSize: 12.5, color: '#334155', margin: '0 0 10px' }}>
              Lưu trang HTML độc lập vào <code>/clients/{project.slug}/index.html</code> và cập nhật trang chính <code>/site.html</code> để gửi link cho khách hàng truy cập.
            </p>
            <button
              type="button"
              className="st-btn st-btn-primary"
              disabled={isPublishing}
              onClick={onPublishToServer}
            >
              <Globe size={15} />
              <span>{isPublishing ? 'Đang xuất bản...' : 'Xuất bản ngay lên Server'}</span>
            </button>
            {lastPublishedUrl && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: '#15803d', fontWeight: 600 }}>
                ✅ Đã xuất bản thành công! Khách hàng có thể mở ngay link bên dưới.
              </div>
            )}
          </div>

          <div className="st-group">
            <div className="st-group-title">Bước 2: Link gửi cho khách hàng</div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span>1. Link Gửi khách Xem & Duyệt mẫu (Có thanh góp ý)</span>
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
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="st-btn st-btn-sm"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span>2. Link Trang Khách Hàng Độc lập (File HTML tĩnh đã xuất bản)</span>
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
                <a
                  href={staticClientUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="st-btn st-btn-sm"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="st-subcard">
              <div className="st-subcard-head">
                <span>3. Link Xem Live theo Spec (/?mode=live)</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" readOnly className="st-input" value={liveUrl} />
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() => copyLink('live', liveUrl)}
                >
                  {copiedKey === 'live' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'live' ? 'Đã chép' : 'Chép'}</span>
                </button>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="st-btn st-btn-sm"
                >
                  <ExternalLink size={13} />
                </a>
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
