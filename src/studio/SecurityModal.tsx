import { useState, type FormEvent } from 'react';
import { Cloud, HardDrive, KeyRound, LogOut, ShieldCheck, X } from 'lucide-react';
import { changePasswordOnServer, logoutAdmin, type StorageMode } from '../utils/auth';

interface SecurityModalProps {
  open: boolean;
  storageMode: StorageMode;
  envManaged: boolean;
  onClose: () => void;
  onLoggedOut: () => void;
}

export function SecurityModal({
  open,
  storageMode,
  envManaged,
  onClose,
  onLoggedOut,
}: SecurityModalProps) {
  const [currentPass, setCurrentPass] = useState('');
  const [nextPass, setNextPass] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const isCloud = storageMode === 'upstash' || storageMode === 'supabase';

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await changePasswordOnServer(currentPass, nextPass);
      if (res.ok) {
        setMsg({ ok: true, text: 'Đã đổi mật khẩu quản trị thành công!' });
        setCurrentPass('');
        setNextPass('');
      } else {
        setMsg({ ok: false, text: res.error || 'Không thể đổi mật khẩu.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    onClose();
    onLoggedOut();
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
      <div className="st-modal" style={{ maxWidth: 520 }}>
        <div className="st-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Bảo mật & Lưu trữ Dữ liệu</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Ghi nhớ lâu dài & bảo vệ quyền truy cập Studio
              </div>
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body">
          <div className="st-subcard" style={{ background: isCloud ? '#f0fdf4' : '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5 }}>
              {isCloud ? <Cloud size={16} color="#16a34a" /> : <HardDrive size={16} color="#007aff" />}
              <span>
                Chế độ ghi nhớ:{' '}
                {storageMode === 'upstash'
                  ? 'Upstash Redis Cloud (Miễn phí & Vĩnh viễn)'
                  : storageMode === 'supabase'
                  ? 'Supabase Postgres Cloud (Miễn phí & Vĩnh viễn)'
                  : storageMode === 'local'
                  ? 'Server Disk (data/kv + public/)'
                  : 'Trình duyệt cục bộ (localStorage)'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
              {isCloud
                ? 'Mọi dự án, trang khách đã xuất bản, đơn hàng và góp ý được đồng bộ tự động lên Cloud — không bị mất khi server khởi động lại.'
                : 'Dữ liệu được lưu vào server cục bộ và trình duyệt. Khi đẩy lên Render Free, hãy gắn thêm biến môi trường Upstash Redis miễn phí để ghi nhớ vĩnh viễn.'}
            </div>
          </div>

          <div className="st-subcard">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>
              <KeyRound size={15} />
              <span>Đổi mật khẩu quản trị</span>
            </div>

            {envManaged ? (
              <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                Mật khẩu hiện được quản lý qua biến môi trường <code>ADMIN_PASSWORD</code> trên server (Render / .env). Để đổi mật khẩu, hãy cập nhật giá trị <code>ADMIN_PASSWORD</code> trên bảng điều khiển hosting.
              </div>
            ) : storageMode === 'browser' ? (
              <div style={{ fontSize: 12.5, color: '#64748b' }}>
                Đang chạy ở chế độ tĩnh không có backend server.
              </div>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label className="st-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    className="st-input"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                  />
                </div>
                <div>
                  <label className="st-label">Mật khẩu mới (tối thiểu 8 ký tự)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="st-input"
                    value={nextPass}
                    onChange={(e) => setNextPass(e.target.value)}
                  />
                </div>
                {msg && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: msg.ok ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {msg.text}
                  </div>
                )}
                <button type="submit" disabled={saving} className="st-btn st-btn-primary">
                  {saving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            )}
          </div>

          {storageMode !== 'browser' && (
            <button
              type="button"
              className="st-btn st-btn-danger"
              style={{ width: '100%', marginTop: 6 }}
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Đăng xuất khỏi Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
