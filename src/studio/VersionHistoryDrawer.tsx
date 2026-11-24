import { useCallback, useEffect, useState } from 'react';
import { Eye, History, RotateCcw, Save, X } from 'lucide-react';
import type { LandingPageSpec, VersionRecord } from '../types/spec';

interface VersionHistoryDrawerProps {
  open: boolean;
  slug: string;
  currentSpec: LandingPageSpec;
  onClose: () => void;
  onPreviewVersion: (spec: LandingPageSpec, label: string) => void;
  onRestoredSpec: (spec: LandingPageSpec, label: string) => void;
}

export function VersionHistoryDrawer({
  open,
  slug,
  currentSpec,
  onClose,
  onPreviewVersion,
  onRestoredSpec,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState<'both' | 'landing' | 'menu'>('both');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/versions?slug=${encodeURIComponent(slug)}`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Không thể tải lịch sử phiên bản.');
      const data = (await res.json()) as { versions?: VersionRecord[] };
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (open) void loadVersions();
  }, [open, loadVersions]);

  if (!open) return null;

  const handleSaveCheckpoint = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          label: label.trim() || 'Điểm lưu thủ công',
          scope,
          actor: 'Admin Studio',
          spec: currentSpec,
        }),
      });
      if (!res.ok) throw new Error('Không thể lưu phiên bản.');
      setLabel('');
      await loadVersions();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi lưu phiên bản.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (ver: VersionRecord) => {
    if (
      !window.confirm(
        `Khôi phục phiên bản "${ver.label}" (${new Date(ver.createdAt).toLocaleString(
          'vi-VN'
        )})? Hệ thống sẽ tự động sao lưu bản hiện tại trước khi khôi phục.`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    try {
      const res = await fetch('/api/versions/restore', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, versionId: ver.id }),
      });
      const data = (await res.json()) as { ok?: boolean; restored?: VersionRecord; error?: string };
      if (!res.ok || !data.ok || !data.restored) {
        throw new Error(data.error || 'Khôi phục thất bại.');
      }
      onRestoredSpec(data.restored.spec, ver.label);
      await loadVersions();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khôi phục.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#007aff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                Lịch sử Phiên bản (Version History)
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Lưu điểm khôi phục cho Landing Page & Digital Menu ({slug})
              </div>
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body">
          <div
            className="st-subcard"
            style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 14 }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Tạo điểm lưu phiên bản mới
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="st-input"
                style={{ flex: 2, minWidth: 180 }}
                placeholder="Ghi chú phiên bản (VD: Trước khi đổi menu Tết)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <select
                className="st-select"
                style={{ flex: 1, minWidth: 130 }}
                value={scope}
                onChange={(e) => setScope(e.target.value as 'both' | 'landing' | 'menu')}
              >
                <option value="both">Web + Digital Menu</option>
                <option value="landing">Chỉ Landing Page</option>
                <option value="menu">Chỉ Digital Menu</option>
              </select>
              <button
                type="button"
                className="st-btn st-btn-primary"
                disabled={saving}
                onClick={() => void handleSaveCheckpoint()}
              >
                <Save size={14} />
                <span>{saving ? 'Đang lưu...' : 'Lưu phiên bản'}</span>
              </button>
            </div>
          </div>

          {errorMsg && <div className="st-ai-warn">{errorMsg}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
              Đang tải lịch sử phiên bản...
            </div>
          ) : versions.length === 0 ? (
            <div className="st-subcard" style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
              Chưa có phiên bản nào được lưu. Bấm "Lưu phiên bản" hoặc Xuất bản để tự động tạo mốc khôi phục.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {versions.map((ver) => (
                <div key={ver.id} className="st-subcard">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ver.label}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        {new Date(ver.createdAt).toLocaleString('vi-VN')} · Bởi: {ver.actor} · Phạm vi:{' '}
                        <strong>
                          {ver.scope === 'menu'
                            ? 'Digital Menu'
                            : ver.scope === 'landing'
                              ? 'Landing Page'
                              : 'Web + Menu'}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="st-btn st-btn-sm"
                        onClick={() => {
                          onPreviewVersion(ver.spec, `Xem lại phiên bản: ${ver.label}`);
                          onClose();
                        }}
                      >
                        <Eye size={13} />
                        <span>Xem lại</span>
                      </button>
                      <button
                        type="button"
                        className="st-btn st-btn-sm st-btn-primary"
                        onClick={() => void handleRestore(ver)}
                      >
                        <RotateCcw size={13} />
                        <span>Khôi phục</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
