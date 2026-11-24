import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Eye, QrCode, RefreshCw, ShieldCheck, Users, UtensilsCrossed, X } from 'lucide-react';
import type { ClientProject } from '../types/spec';

interface AnalyticsReport {
  slug: string;
  days: number;
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    menuViews: number;
    qrVisits: number;
  };
  popularPages: { name: string; count: number }[];
  popularMenuItems: { name: string; count: number }[];
  trafficSources: { name: string; count: number }[];
  series: {
    date: string;
    pageViews: number;
    menuViews: number;
    qrVisits: number;
    uniqueVisitors: number;
  }[];
}

interface AnalyticsDrawerProps {
  open: boolean;
  projects: ClientProject[];
  activeSlug: string;
  onClose: () => void;
}

export function AnalyticsDrawer({
  open,
  projects,
  activeSlug,
  onClose,
}: AnalyticsDrawerProps) {
  const [selectedSlug, setSelectedSlug] = useState(activeSlug);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalyticsReport | null>(null);

  useEffect(() => {
    if (open) setSelectedSlug(activeSlug);
  }, [open, activeSlug]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?slug=${encodeURIComponent(selectedSlug)}&days=${days}`,
        { credentials: 'same-origin' }
      );
      if (!res.ok) return;
      const data = (await res.json()) as AnalyticsReport & { ok?: boolean };
      if (data.ok) setReport(data);
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, days]);

  useEffect(() => {
    if (open) void loadReport();
  }, [open, loadReport]);

  if (!open) return null;

  const maxDayViews = Math.max(
    1,
    ...(report?.series || []).map((s) => s.pageViews + s.menuViews)
  );

  return (
    <div
      className="st-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="st-modal" style={{ maxWidth: 880 }}>
        <div className="st-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#007aff" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                Thống kê Truy cập & Hiệu quả Menu QR
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Theo dõi lượt xem trang, lượt quét QR và món được quan tâm nhất
              </div>
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body" style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="st-select"
              style={{ flex: 1, minWidth: 200 }}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.projectName} (/{p.slug})
                </option>
              ))}
            </select>

            <div className="st-pill-selector">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`st-pill-opt ${days === d ? 'is-active' : ''}`}
                  onClick={() => setDays(d)}
                >
                  {d} ngày
                </button>
              ))}
            </div>

            <button
              type="button"
              className="st-btn st-btn-sm"
              onClick={() => void loadReport()}
              disabled={loading}
            >
              <RefreshCw size={13} />
              <span>Làm mới</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            <div className="st-subcard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <Eye size={14} color="#007aff" />
                <span>Lượt xem trang (Page Views)</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {report?.totals.pageViews ?? 0}
              </div>
            </div>

            <div className="st-subcard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <Users size={14} color="#7c3aed" />
                <span>Khách truy cập (Unique)</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {report?.totals.uniqueVisitors ?? 0}
              </div>
            </div>

            <div className="st-subcard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <UtensilsCrossed size={14} color="#059669" />
                <span>Lượt mở Digital Menu</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {report?.totals.menuViews ?? 0}
              </div>
            </div>

            <div className="st-subcard">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
                <QrCode size={14} color="#d97706" />
                <span>Lượt quét QR Code</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {report?.totals.qrVisits ?? 0}
              </div>
            </div>
          </div>

          {/* Simple Daily Activity Chart */}
          <div className="st-subcard">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              Biểu đồ lượt xem theo ngày ({days} ngày qua)
            </div>
            {!report || report.series.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#64748b', padding: '12px 0' }}>
                Chưa có dữ liệu truy cập trong khoảng thời gian này. Khi khách mở trang Live, trang xuất bản hoặc quét QR Menu, số liệu sẽ cập nhật tự động.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, paddingTop: 10 }}>
                {report.series.map((day) => {
                  const total = day.pageViews + day.menuViews;
                  const pct = Math.max(8, Math.round((total / maxDayViews) * 100));
                  return (
                    <div
                      key={day.date}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                      title={`${day.date}: ${day.pageViews} Web · ${day.menuViews} Menu · ${day.qrVisits} QR`}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 26,
                          height: `${pct}%`,
                          borderRadius: '6px 6px 2px 2px',
                          background: 'linear-gradient(180deg, #007aff, #5856d6)',
                        }}
                      />
                      <span style={{ fontSize: 10, color: '#64748b' }}>{day.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            <div className="st-subcard">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Trang phổ biến</div>
              {report?.popularPages.length ? (
                report.popularPages.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      padding: '4px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    <strong>{p.count}</strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>Chưa có dữ liệu.</div>
              )}
            </div>

            <div className="st-subcard">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Món ăn được xem nhiều</div>
              {report?.popularMenuItems.length ? (
                report.popularMenuItems.map((m) => (
                  <div
                    key={m.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      padding: '4px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span>{m.name}</span>
                    <strong>{m.count}</strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>Chưa có lượt mở món.</div>
              )}
            </div>

            <div className="st-subcard">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Nguồn truy cập</div>
              {report?.trafficSources.length ? (
                report.trafficSources.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      padding: '4px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <span>{s.name}</span>
                    <strong>{s.count}</strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: '#64748b' }}>Chưa có dữ liệu nguồn.</div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: 12,
              color: '#166534',
            }}
          >
            <ShieldCheck size={15} />
            <span>
              Tuân thủ quyền riêng tư: Không lưu địa chỉ IP, không dùng cookie theo dõi và không thu thập dữ liệu cá nhân của khách truy cập.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
