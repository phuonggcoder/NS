import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  History,
  MessageSquarePlus,
  Monitor,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react';
import { getSectionLabel } from '../data/templates';
import type { ClientFeedbackItem, LandingSection, ProjectStatus } from '../types/spec';
import { PROJECT_STATUS_META, submitFeedbackToServer } from '../utils/projects';
import { generateId } from '../utils/storage';

interface ClientReviewBarProps {
  clientSlug: string;
  reviewToken?: string;
  projectTitle: string;
  projectStatus?: ProjectStatus;
  feedbackHistory?: ClientFeedbackItem[];
  sections: LandingSection[];
  viewport: 'desktop' | 'mobile';
  onChangeViewport: (mode: 'desktop' | 'mobile') => void;
}

export function ClientReviewBar({
  clientSlug,
  reviewToken,
  projectTitle,
  projectStatus = 'review',
  feedbackHistory = [],
  sections,
  viewport,
  onChangeViewport,
}: ClientReviewBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [sectionLabel, setSectionLabel] = useState('Tổng thể trang');
  const [comment, setComment] = useState('');
  const [modeType, setModeType] = useState<'feedback' | 'rejected'>('feedback');
  const [status, setStatus] = useState<ProjectStatus>(projectStatus);
  const [items, setItems] = useState<ClientFeedbackItem[]>(feedbackHistory);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleSections = sections.filter((s) => s.visible);
  const statusBadge = PROJECT_STATUS_META[status] || PROJECT_STATUS_META.review;

  const handleApprove = async () => {
    const entry: ClientFeedbackItem = {
      id: generateId('fb'),
      createdAt: new Date().toISOString(),
      clientSlug,
      author: author.trim() || 'Khách hàng',
      sectionLabel: 'Tổng thể trang',
      comment: 'Khách hàng đã xác nhận duyệt mẫu Landing Page này.',
      type: 'approved',
      resolved: false,
    };
    const res = await submitFeedbackToServer(entry, reviewToken);
    if (!res.ok) {
      setNotice(res.error || 'Không thể duyệt mẫu.');
      return;
    }
    setItems((prev) => [entry, ...prev]);
    setStatus(res.status || 'approved');
    setNotice('Đã ghi nhận DUYỆT MẪU! Cảm ơn bạn đã xác nhận.');
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const entry: ClientFeedbackItem = {
      id: generateId('fb'),
      createdAt: new Date().toISOString(),
      clientSlug,
      author: author.trim() || 'Khách hàng',
      sectionLabel,
      comment: comment.trim(),
      type: modeType,
      resolved: false,
    };
    const res = await submitFeedbackToServer(entry, reviewToken);
    if (!res.ok) {
      setNotice(res.error || 'Không thể gửi góp ý.');
      return;
    }
    setItems((prev) => [entry, ...prev]);
    if (res.status) setStatus(res.status);
    setComment('');
    setDrawerOpen(false);
    setNotice(
      modeType === 'rejected'
        ? 'Đã gửi yêu cầu chỉnh sửa (Chưa duyệt) tới đơn vị thiết kế.'
        : 'Đã gửi góp ý chỉnh sửa tới đơn vị thiết kế.'
    );
  };

  return (
    <>
      {historyOpen && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 84,
            zIndex: 95,
            width: 'min(400px, calc(100vw - 32px))',
            maxHeight: '60vh',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 54px rgba(15,23,42,0.24)',
            padding: 16,
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Lịch sử phản hồi ({items.length})</strong>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#64748b' }}>Chưa có phản hồi nào cho bản xem trước này.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((fb) => (
                <div
                  key={fb.id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {fb.type === 'approved'
                      ? '✅ Đã duyệt'
                      : fb.type === 'rejected'
                        ? '❌ Yêu cầu sửa'
                        : '💬 Góp ý'}{' '}
                    · {fb.sectionLabel} ({fb.author})
                  </div>
                  <div style={{ color: '#334155' }}>{fb.comment}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {new Date(fb.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 84,
            zIndex: 95,
            width: 'min(380px, calc(100vw - 32px))',
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 54px rgba(15,23,42,0.24)',
            padding: 18,
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>
              {modeType === 'rejected' ? 'Từ chối & Yêu cầu chỉnh sửa' : 'Gửi góp ý chỉnh sửa mẫu'}
            </strong>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmitComment} style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Tên của bạn
              </label>
              <input
                type="text"
                placeholder="VD: Chị Lan"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Vị trí cần sửa
              </label>
              <select
                value={sectionLabel}
                onChange={(e) => setSectionLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                }}
              >
                <option value="Tổng thể trang">Tổng thể trang</option>
                {visibleSections.map((sec) => (
                  <option key={sec.id} value={getSectionLabel(sec.type)}>
                    {getSectionLabel(sec.type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Nội dung góp ý / lý do *
              </label>
              <textarea
                rows={3}
                required
                placeholder="VD: Đổi tiêu đề ngắn hơn, tăng giá sản phẩm 2..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: modeType === 'rejected' ? '#dc2626' : '#007aff',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {modeType === 'rejected' ? 'Gửi yêu cầu sửa (Chưa duyệt)' : 'Gửi góp ý ngay'}
            </button>
          </form>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 18,
          transform: 'translateX(-50%)',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f8fafc',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 12.5,
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
        <span style={{ fontWeight: 700, paddingInline: 4 }}>
          Xem trước: {projectTitle}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: statusBadge.bg,
            color: statusBadge.color,
          }}
        >
          {statusBadge.label}
        </span>

        <button
          type="button"
          onClick={() => onChangeViewport(viewport === 'desktop' ? 'mobile' : 'desktop')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 11px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          {viewport === 'desktop' ? <Smartphone size={13} /> : <Monitor size={13} />}
          <span>{viewport === 'desktop' ? 'Mobile' : 'Desktop'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setDrawerOpen(false);
            setHistoryOpen((p) => !p);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          <History size={13} />
          <span>Lịch sử ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setHistoryOpen(false);
            setModeType('feedback');
            setDrawerOpen((prev) => !prev || modeType !== 'feedback');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.24)',
            background: 'rgba(255,255,255,0.12)',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <MessageSquarePlus size={13} />
          <span>Góp ý</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setHistoryOpen(false);
            setModeType('rejected');
            setDrawerOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 999,
            border: 'none',
            background: '#dc2626',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <XCircle size={13} />
          <span>Từ chối</span>
        </button>

        <button
          type="button"
          onClick={() => void handleApprove()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 13px',
            borderRadius: 999,
            border: 'none',
            background: '#16a34a',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={13} />
          <span>Duyệt mẫu</span>
        </button>
      </div>

      {notice && (
        <div
          style={{
            position: 'fixed',
            top: 18,
            right: 18,
            zIndex: 99,
            padding: '10px 16px',
            borderRadius: 12,
            background: '#0f172a',
            color: '#ffffff',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 14px 32px rgba(0,0,0,0.25)',
          }}
        >
          {notice}
        </div>
      )}
    </>
  );
}
