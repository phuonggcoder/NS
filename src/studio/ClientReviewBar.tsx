import { useState, type FormEvent } from 'react';
import { CheckCircle2, MessageSquarePlus, Monitor, Smartphone, X } from 'lucide-react';
import { getSectionLabel } from '../data/templates';
import type { LandingSection } from '../types/spec';
import { submitFeedbackToServer } from '../utils/projects';
import { generateId } from '../utils/storage';

interface ClientReviewBarProps {
  clientSlug: string;
  projectTitle: string;
  sections: LandingSection[];
  viewport: 'desktop' | 'mobile';
  onChangeViewport: (mode: 'desktop' | 'mobile') => void;
}

export function ClientReviewBar({
  clientSlug,
  projectTitle,
  sections,
  viewport,
  onChangeViewport,
}: ClientReviewBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [sectionLabel, setSectionLabel] = useState('Tổng thể trang');
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const visibleSections = sections.filter((s) => s.visible);

  const handleApprove = async () => {
    await submitFeedbackToServer({
      id: generateId('fb'),
      createdAt: new Date().toISOString(),
      clientSlug,
      author: author.trim() || 'Khách hàng',
      sectionLabel: 'Tổng thể trang',
      comment: 'Khách hàng đã xác nhận duyệt mẫu Landing Page này.',
      type: 'approved',
      resolved: false,
    });
    setNotice('Đã ghi nhận duyệt mẫu! Cảm ơn bạn đã xác nhận.');
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await submitFeedbackToServer({
      id: generateId('fb'),
      createdAt: new Date().toISOString(),
      clientSlug,
      author: author.trim() || 'Khách hàng',
      sectionLabel,
      comment: comment.trim(),
      type: 'feedback',
      resolved: false,
    });
    setComment('');
    setDrawerOpen(false);
    setNotice('Đã gửi góp ý chỉnh sửa tới đơn vị thiết kế.');
  };

  return (
    <>
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
            <strong style={{ fontSize: 14 }}>Gửi góp ý chỉnh sửa mẫu</strong>
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
                Nội dung góp ý *
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
                background: '#007aff',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Gửi góp ý ngay
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
        <span style={{ fontWeight: 700, paddingInline: 6 }}>
          Xem mẫu: {projectTitle}
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
          <span>{viewport === 'desktop' ? 'Xem bản Mobile' : 'Xem bản Desktop'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
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
          <span>Gửi góp ý</span>
        </button>

        <button
          type="button"
          onClick={handleApprove}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 14px',
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
          <CheckCircle2 size={14} />
          <span>Duyệt mẫu này</span>
        </button>

        {notice && (
          <span style={{ color: '#86efac', fontWeight: 600, paddingInline: 6 }}>
            {notice}
          </span>
        )}
      </div>
    </>
  );
}
