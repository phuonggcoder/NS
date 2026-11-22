import { useEffect, useState, type FormEvent } from 'react';
import type { CustomerOrder } from '../types/spec';
import { computeOrderTotal, generateId, sanitizeHref, sanitizeImageSrc } from '../utils/storage';
import { IconRenderer } from './IconRenderer';
import type { OrderDraft } from './sections/ProductsSection';

interface Props {
  draft: OrderDraft | null;
  onClose: () => void;
  onSubmitOrder: (order: CustomerOrder) => void;
}

export function OrderModal({ draft, onClose, onSubmitOrder }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    if (draft) {
      setQuantity(1);
      setCompletedOrder(null);
    }
  }, [draft]);

  if (!draft) return null;

  const totalDisplay = computeOrderTotal(draft.price, quantity, draft.currency);
  const safeImg = sanitizeImageSrc(draft.imageUrl);
  const safeChannelHref = sanitizeHref(draft.channelHref);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) return;

    const order: CustomerOrder = {
      id: generateId('ord'),
      createdAt: new Date().toISOString(),
      productId: draft.id,
      productName: draft.name,
      unitPrice: draft.price,
      quantity,
      totalDisplay,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      note: note.trim(),
    };

    onSubmitOrder(order);
    setCompletedOrder(order);
    setCustomerName('');
    setPhone('');
    setEmail('');
    setNote('');
  };

  return (
    <div
      className="lp-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lp-order-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lp-modal">
        <div className="lp-modal-head">
          <h3 id="lp-order-title" style={{ margin: 0, fontFamily: 'var(--lp-font-heading)' }}>
            {completedOrder ? 'Đặt hàng thành công!' : 'Đặt mua sản phẩm'}
          </h3>
          <button
            type="button"
            className="lp-modal-close"
            aria-label="Đóng"
            onClick={onClose}
          >
            <IconRenderer name="x" size={18} />
          </button>
        </div>

        {completedOrder ? (
          <div>
            <div className="lp-form-success" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Cảm ơn {completedOrder.customerName}! Đơn hàng của bạn đã được ghi nhận.
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Sản phẩm: <strong>{completedOrder.productName}</strong> (x{completedOrder.quantity})
                <br />
                Tổng tạm tính: <strong>{completedOrder.totalDisplay}</strong>
                <br />
                Liên hệ xác nhận: <strong>{completedOrder.phone}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {draft.channelHref && safeChannelHref !== '#' && (
                <a
                  href={safeChannelHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-btn lp-btn-primary"
                >
                  <span>Nhắn xác nhận ngay</span>
                  <IconRenderer name="external-link" size={16} />
                </a>
              )}
              <button type="button" className="lp-btn lp-btn-secondary" onClick={onClose}>
                Quay lại trang web
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="lp-order-summary">
              {safeImg && <img src={safeImg} alt={draft.name} className="lp-order-thumb" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{draft.name}</div>
                <div style={{ color: 'var(--lp-primary)', fontWeight: 700 }}>{draft.price}</div>
              </div>
            </div>

            <div className="lp-qty-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Số lượng</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--lp-muted)' }}>
                  Tạm tính: <strong style={{ color: 'var(--lp-primary)' }}>{totalDisplay}</strong>
                </div>
              </div>
              <div className="lp-qty-controls">
                <button
                  type="button"
                  className="lp-qty-btn"
                  aria-label="Giảm số lượng"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className="lp-qty-btn"
                  aria-label="Tăng số lượng"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="lp-form-grid">
              <div>
                <label className="lp-field-label">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Minh Anh"
                  className="lp-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="lp-grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="lp-field-label">Số điện thoại / Zalo *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0909 xxx xxx"
                    className="lp-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="lp-field-label">Email nhận sản phẩm</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    className="lp-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="lp-field-label">Ghi chú đơn hàng</label>
                <textarea
                  rows={2}
                  placeholder="Địa chỉ giao hàng hoặc yêu cầu riêng..."
                  className="lp-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <button type="submit" className="lp-btn lp-btn-primary lp-btn-full">
                Xác nhận đặt mua ({totalDisplay})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
