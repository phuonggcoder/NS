import { Trash2, X } from 'lucide-react';
import type { ContactLead, CustomerOrder } from '../types/spec';

interface OrdersDrawerProps {
  open: boolean;
  orders: CustomerOrder[];
  leads: ContactLead[];
  onClose: () => void;
  onClearAll: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}

export function OrdersDrawer({
  open,
  orders,
  leads,
  onClose,
  onClearAll,
}: OrdersDrawerProps) {
  if (!open) return null;

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
              Đơn hàng & Khách hàng để lại thông tin
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Ghi nhận từ trang khách hàng (Chế độ xem trực tiếp /?mode=live)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(orders.length > 0 || leads.length > 0) && (
              <button
                type="button"
                className="st-btn st-btn-sm st-btn-danger"
                onClick={onClearAll}
              >
                <Trash2 size={13} />
                <span>Xóa tất cả</span>
              </button>
            )}
            <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="st-modal-body">
          <div className="st-group">
            <div className="st-group-title">Đơn đặt mua sản phẩm ({orders.length})</div>
            {orders.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748b', padding: '10px 0' }}>
                Chưa có đơn hàng nào. Hãy mở "Xem trang khách" và bấm Mua ngay để thử nghiệm luồng đặt hàng.
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>
                      {ord.productName} × {ord.quantity} —{' '}
                      <strong style={{ color: '#007aff' }}>{ord.totalDisplay}</strong>
                    </span>
                    <span style={{ fontWeight: 500, color: '#64748b', fontSize: 11 }}>
                      {formatDate(ord.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                    <strong>Khách:</strong> {ord.customerName} · <strong>SĐT:</strong> {ord.phone}
                    {ord.email ? ` · ${ord.email}` : ''}
                    {ord.note ? (
                      <div style={{ color: '#475569', marginTop: 4 }}>Ghi chú: {ord.note}</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="st-group">
            <div className="st-group-title">Tin nhắn tư vấn ({leads.length})</div>
            {leads.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748b', padding: '10px 0' }}>
                Chưa có yêu cầu tư vấn nào từ form Liên hệ.
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="st-subcard">
                  <div className="st-subcard-head">
                    <span>{lead.name}</span>
                    <span style={{ fontWeight: 500, color: '#64748b', fontSize: 11 }}>
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
                    <strong>SĐT:</strong> {lead.phone || '—'} · <strong>Email:</strong>{' '}
                    {lead.email || '—'}
                    {lead.message ? (
                      <div style={{ color: '#475569', marginTop: 4 }}>{lead.message}</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
