import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import {
  fetchAuthStatus,
  loginAdmin,
  setupAdminPassword,
  type AuthStatusResponse,
} from '../utils/auth';

interface AuthGateProps {
  children: (ctx: {
    authStatus: AuthStatusResponse;
    onLoggedOut: () => void;
  }) => ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [status, setStatus] = useState<AuthStatusResponse | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const next = await fetchAuthStatus();
    setStatus(next);
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!status) return;
    setError(null);

    if (!status.configured) {
      if (password.trim().length < 8) {
        setError('Mật khẩu quản trị cần tối thiểu 8 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu nhập lại không khớp.');
        return;
      }
      setSubmitting(true);
      try {
        const res = await setupAdminPassword(password.trim(), rememberMe);
        if (!res.ok) {
          setError(res.error || 'Không thể thiết lập mật khẩu.');
          return;
        }
        setPassword('');
        setConfirmPassword('');
        await refreshStatus();
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginAdmin(password, rememberMe);
      if (!res.ok) {
        setError(res.error || 'Đăng nhập thất bại.');
        return;
      }
      setPassword('');
      await refreshStatus();
    } finally {
      setSubmitting(false);
    }
  };

  if (!status) {
    return (
      <div className="st-auth-page">
        <div className="st-auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Đang kiểm tra bảo mật Studio...</div>
        </div>
      </div>
    );
  }

  if (status.authenticated) {
    return (
      <>
        {children({
          authStatus: status,
          onLoggedOut: () => {
            setStatus((prev) => (prev ? { ...prev, authenticated: false } : prev));
          },
        })}
      </>
    );
  }

  const isSetupMode = !status.configured;

  return (
    <div className="st-auth-page">
      <div className="st-auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div className="st-logo-badge" style={{ width: 42, height: 42, fontSize: 18 }}>
            {isSetupMode ? <ShieldCheck size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>
              {isSetupMode ? 'Thiết lập bảo mật lần đầu' : 'Đăng nhập SpecPage Studio'}
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              {isSetupMode
                ? 'Tạo mật khẩu quản trị để bảo vệ trang chỉnh sửa và dữ liệu khách hàng'
                : 'Nhập mật khẩu quản trị để tiếp tục chỉnh sửa & xuất bản'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="st-label">
              {isSetupMode ? 'Mật khẩu quản trị mới (≥ 8 ký tự)' : 'Mật khẩu quản trị'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                className="st-input"
                style={{ paddingRight: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isSetupMode && (
            <div>
              <label className="st-label">Nhập lại mật khẩu</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="st-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Ghi nhớ đăng nhập trên thiết bị này (30 ngày)</span>
          </label>

          {error && (
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="st-btn st-btn-primary"
            style={{ padding: '11px 16px', fontSize: 14 }}
          >
            {submitting
              ? 'Đang xác thực...'
              : isSetupMode
              ? 'Lưu mật khẩu & Mở Studio'
              : 'Đăng nhập Studio'}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid #e2e8f0',
            fontSize: 12,
            color: '#64748b',
            lineHeight: 1.5,
          }}
        >
          Lưu trữ hiện tại:{' '}
          <strong>
            {status.storageMode === 'upstash'
              ? 'Upstash Redis Cloud (Vĩnh viễn)'
              : status.storageMode === 'supabase'
              ? 'Supabase Cloud (Vĩnh viễn)'
              : 'Server Disk (data/kv)'}
          </strong>
          <br />
          Các trang khách hàng (<code>/site.html</code>, <code>/clients/...</code>,{' '}
          <code>/?mode=live</code>) vẫn mở công khai bình thường.
        </div>
      </div>
    </div>
  );
}
