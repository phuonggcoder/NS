import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import {
  calculateConfiguredItemPrice,
  formatMenuPrice,
  getDefaultOptionSelections,
  validateRequiredOptionGroups,
} from '../../data/digitalMenuDefaults';
import type { MenuItem } from '../../types/spec';
import { sanitizeImageSrc } from '../../utils/storage';

interface MenuItemModalProps {
  item: MenuItem | null;
  currency: string;
  clientSlug?: string;
  branch?: string;
  table?: string;
  previewOnly?: boolean;
  onClose: () => void;
}

export function MenuItemModal({
  item,
  currency,
  clientSlug,
  branch,
  table,
  previewOnly = false,
  onClose,
}: MenuItemModalProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setSelections(getDefaultOptionSelections(item));
    setQuantity(1);
    setNote('');
    setShowOrderForm(false);
    setSubmitted(false);
    setErrorMsg(null);
  }, [item]);

  if (!item) return null;

  const isSoldOut = item.status === 'sold_out';
  const pricing = calculateConfiguredItemPrice(item, selections, quantity);
  const validation = validateRequiredOptionGroups(item, selections);
  const safeImg = sanitizeImageSrc(item.imageUrl);

  const toggleChoice = (groupId: string, choiceId: string, type: 'single' | 'multiple', maxSelect?: number) => {
    setErrorMsg(null);
    setSelections((prev) => {
      const current = prev[groupId] || [];
      if (type === 'single') {
        return { ...prev, [groupId]: [choiceId] };
      }
      if (current.includes(choiceId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== choiceId) };
      }
      if (maxSelect && current.length >= maxSelect) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, choiceId] };
    });
  };

  const buildOptionSummary = () => {
    const parts: string[] = [];
    for (const g of item.optionGroups || []) {
      const chosenIds = new Set(selections[g.id] || []);
      const labels = g.choices.filter((c) => chosenIds.has(c.id)).map((c) => c.label);
      if (labels.length > 0) parts.push(`${g.name}: ${labels.join(', ')}`);
    }
    if (branch) parts.push(`Chi nhánh: ${branch}`);
    if (table) parts.push(`Bàn: ${table}`);
    if (note.trim()) parts.push(`Ghi chú: ${note.trim()}`);
    return parts.join(' | ');
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      setErrorMsg(validation.errors[0]);
      return;
    }
    if (previewOnly) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'order',
          clientSlug: clientSlug || 'du-an-mau',
          branch: branch || undefined,
          table: table || undefined,
          productId: item.id,
          productName: `[Menu QR] ${item.name}`,
          unitPrice: formatMenuPrice(pricing.unitTotal, currency),
          quantity,
          totalDisplay: formatMenuPrice(pricing.lineTotal, currency),
          customerName: customerName.trim() || (table ? `Khách ${table}` : 'Khách tại quán'),
          phone: phone.trim() || 'Tại bàn',
          email: '',
          note: buildOptionSummary(),
        }),
      });
      if (!res.ok) {
        throw new Error('Không thể gửi yêu cầu gọi món.');
      }
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dm-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dm-modal">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--dm-border)',
          }}
        >
          <strong style={{ fontSize: 15 }}>Chi tiết món</strong>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: '1px solid var(--dm-border)',
              background: 'var(--dm-surface-alt)',
              color: 'var(--dm-text)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="dm-modal-scroll">
          {safeImg && (
            <img
              src={safeImg}
              alt={item.name}
              style={{
                width: '100%',
                aspectRatio: '16 / 10',
                objectFit: 'cover',
                borderRadius: 14,
                marginBottom: 12,
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {item.bestSeller && <span className="dm-badge dm-badge-best">Best Seller</span>}
            {item.featured && <span className="dm-badge dm-badge-featured">Nổi bật</span>}
            {isSoldOut && <span className="dm-badge dm-badge-soldout">Tạm hết</span>}
          </div>

          <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800 }}>{item.name}</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span className="dm-price-now" style={{ fontSize: '1.1rem' }}>
              {formatMenuPrice(pricing.unitBase, currency)}
            </span>
            {item.salePrice && item.salePrice < item.price && (
              <span className="dm-price-old">{formatMenuPrice(item.price, currency)}</span>
            )}
          </div>

          {item.description && (
            <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--dm-muted)', lineHeight: 1.5 }}>
              {item.description}
            </p>
          )}

          {item.ingredients && (
            <div style={{ fontSize: 12.5, marginBottom: 6 }}>
              <strong>Thành phần:</strong>{' '}
              <span style={{ color: 'var(--dm-muted)' }}>{item.ingredients}</span>
            </div>
          )}

          {item.allergens && item.allergens.length > 0 && (
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <strong>Lưu ý dị ứng:</strong>{' '}
              {item.allergens.map((alg) => (
                <span key={alg} className="dm-allergen-tag">
                  {alg}
                </span>
              ))}
            </div>
          )}

          {(item.optionGroups || []).map((group) => {
            const selectedIds = selections[group.id] || [];
            const isMissing = !validation.valid && validation.missingGroupIds.includes(group.id);
            return (
              <div key={group.id} className="dm-opt-group">
                <div className="dm-opt-head">
                  <div>
                    <strong style={{ fontSize: 13.5 }}>{group.name}</strong>
                    <div style={{ fontSize: 11.5, color: 'var(--dm-muted)' }}>
                      {group.type === 'single' ? 'Chọn 1 mục' : `Chọn nhiều${group.maxSelect ? ` (tối đa ${group.maxSelect})` : ''}`}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: group.required
                        ? isMissing
                          ? '#fee2e2'
                          : 'rgba(220,38,38,0.12)'
                        : 'var(--dm-surface-alt)',
                      color: group.required ? '#dc2626' : 'var(--dm-muted)',
                    }}
                  >
                    {group.required ? 'Bắt buộc' : 'Tùy chọn'}
                  </span>
                </div>

                {group.choices.map((choice) => {
                  const active = selectedIds.includes(choice.id);
                  return (
                    <div
                      key={choice.id}
                      role="button"
                      tabIndex={0}
                      className={`dm-opt-choice ${active ? 'is-selected' : ''}`}
                      onClick={() => toggleChoice(group.id, choice.id, group.type, group.maxSelect)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleChoice(group.id, choice.id, group.type, group.maxSelect);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type={group.type === 'single' ? 'radio' : 'checkbox'}
                          checked={active}
                          readOnly
                        />
                        <span>{choice.label}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--dm-primary)' }}>
                        {choice.priceDelta > 0 ? `+${formatMenuPrice(choice.priceDelta, currency)}` : 'Miễn phí'}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="dm-opt-group">
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              Ghi chú riêng cho món này
            </label>
            <input
              type="text"
              className="dm-search-input"
              style={{ paddingLeft: 12 }}
              placeholder="VD: Ít đá, không hành, để sốt riêng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {showOrderForm && !submitted && (
            <form id="dm-quick-order-form" onSubmit={handleSubmitOrder} className="dm-opt-group">
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>
                Thông tin gửi yêu cầu món
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  type="text"
                  className="dm-search-input"
                  style={{ paddingLeft: 12 }}
                  placeholder="Tên của bạn (hoặc số bàn)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required={!table}
                />
                <input
                  type="tel"
                  className="dm-search-input"
                  style={{ paddingLeft: 12 }}
                  placeholder="Số điện thoại liên hệ"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={!table}
                />
              </div>
            </form>
          )}

          {errorMsg && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: '#dcfce7',
                color: '#15803d',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              <span>Đã gửi yêu cầu món "{item.name}" ({formatMenuPrice(pricing.lineTotal, currency)}) tới quầy!</span>
            </div>
          )}
        </div>

        <div className="dm-modal-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="dm-icon-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Giảm số lượng"
            >
              <Minus size={15} />
            </button>
            <strong style={{ minWidth: 22, textAlign: 'center' }}>{quantity}</strong>
            <button
              type="button"
              className="dm-icon-btn"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              aria-label="Tăng số lượng"
            >
              <Plus size={15} />
            </button>
          </div>

          {submitted ? (
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: 'var(--dm-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Đóng & Xem tiếp Menu
            </button>
          ) : showOrderForm ? (
            <button
              type="submit"
              form="dm-quick-order-form"
              disabled={isSoldOut || submitting}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: isSoldOut ? '#94a3b8' : 'var(--dm-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting
                ? 'Đang gửi...'
                : `Xác nhận · ${formatMenuPrice(pricing.lineTotal, currency)}`}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSoldOut}
              onClick={() => {
                if (!validation.valid) {
                  setErrorMsg(validation.errors[0]);
                  return;
                }
                setShowOrderForm(true);
              }}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: 'none',
                background: isSoldOut ? '#94a3b8' : 'var(--dm-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
              }}
            >
              {isSoldOut
                ? 'Món đang tạm hết'
                : `Chọn món · ${formatMenuPrice(pricing.lineTotal, currency)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
