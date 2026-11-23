import { useState, type FormEvent } from 'react';
import type { ContactLead, ContactSection as ContactSectionData } from '../../types/spec';
import { generateId, sanitizeHref } from '../../utils/storage';
import { IconRenderer } from '../IconRenderer';
import { useStudioFieldProps } from '../StudioFocusContext';

interface Props {
  section: ContactSectionData;
  isStudio?: boolean;
  onSubmitLead?: (lead: ContactLead) => void;
}

export function ContactSection({ section, isStudio, onSubmitLead }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const surfaceClass = `lp-surface-${section.style.surface}`;
  const padClass = `lp-pad-${section.style.padding}`;

  const badgeField = useStudioFieldProps(section.id, 'badge', 'Badge Liên hệ', 'lp-badge');
  const titleField = useStudioFieldProps(section.id, 'title', 'Tiêu đề Liên hệ', 'lp-heading');
  const subField = useStudioFieldProps(section.id, 'subtitle', 'Mô tả Liên hệ', 'lp-subtitle');
  const infoField = useStudioFieldProps(
    section.id,
    'contactInfo',
    'SĐT, Email & Địa chỉ',
    'lp-contact-info-list'
  );
  const formField = useStudioFieldProps(
    section.id,
    'formSubmitLabel',
    'Form liên hệ',
    'lp-card lp-form-card'
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isStudio) return;
    if (!name.trim() || (!phone.trim() && !email.trim())) return;

    onSubmitLead?.({
      id: generateId('lead'),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    setSubmitted(true);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  const renderForm = () => (
    <div {...formField}>
      {submitted ? (
        <div className="lp-form-success" data-lp-contact-success="true">
          <div style={{ marginBottom: 10 }}>{section.successMessage}</div>
          <button
            type="button"
            className="lp-btn lp-btn-secondary lp-btn-sm"
            onClick={() => setSubmitted(false)}
          >
            Gửi tin nhắn khác
          </button>
        </div>
      ) : (
        <form className="lp-form-grid" data-lp-contact-form="true" onSubmit={handleSubmit}>
          <div>
            <label className="lp-field-label">Họ và tên *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              className="lp-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="lp-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="lp-field-label">Số điện thoại / Zalo *</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="0909 xxx xxx"
                className="lp-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="lp-field-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="ban@domain.com"
                className="lp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="lp-field-label">Nội dung cần tư vấn</label>
            <textarea
              name="message"
              rows={3}
              placeholder="Chia sẻ nhu cầu hoặc sản phẩm bạn đang quan tâm..."
              className="lp-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" className="lp-btn lp-btn-primary lp-btn-full">
            <span>{section.formSubmitLabel || 'Gửi liên hệ'}</span>
            <IconRenderer name="arrow-right" size={16} />
          </button>
          <div className="lp-form-success" data-lp-contact-success="true" hidden>
            {section.successMessage}
          </div>
        </form>
      )}
    </div>
  );

  const renderInfo = () => (
    <div>
      {section.badge && <div {...badgeField}>{section.badge}</div>}
      <h2 {...titleField}>{section.title}</h2>
      {section.subtitle && <p {...subField}>{section.subtitle}</p>}

      <div {...infoField}>
        {section.phone && (
          <div className="lp-contact-info-item">
            <span className="lp-contact-icon">
              <IconRenderer name="phone" size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--lp-muted)' }}>Điện thoại</div>
              <div style={{ fontWeight: 600 }}>{section.phone}</div>
            </div>
          </div>
        )}
        {section.email && (
          <div className="lp-contact-info-item">
            <span className="lp-contact-icon">
              <IconRenderer name="mail" size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--lp-muted)' }}>Email</div>
              <div style={{ fontWeight: 600 }}>{section.email}</div>
            </div>
          </div>
        )}
        {section.address && (
          <div className="lp-contact-info-item">
            <span className="lp-contact-icon">
              <IconRenderer name="map-pin" size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--lp-muted)' }}>Địa chỉ</div>
              <div style={{ fontWeight: 600 }}>{section.address}</div>
            </div>
          </div>
        )}
      </div>

      {section.zaloLabel && (
        <a
          href={sanitizeHref(section.zaloHref)}
          target={section.zaloHref.startsWith('http') ? '_blank' : undefined}
          rel={section.zaloHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="lp-btn lp-btn-secondary"
          onClick={(e) => isStudio && e.preventDefault()}
        >
          <IconRenderer name="message-circle" size={18} />
          <span>{section.zaloLabel}</span>
        </a>
      )}
    </div>
  );

  return (
    <section
      id={section.anchorId || undefined}
      className={`lp-section ${surfaceClass} ${padClass}`}
    >
      <div className="lp-container">
        {section.variant === 'centered' ? (
          <div className="lp-contact-centered">
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {section.badge && <div {...badgeField}>{section.badge}</div>}
              <h2 {...titleField}>{section.title}</h2>
              {section.subtitle && <p {...subField}>{section.subtitle}</p>}
            </div>
            {renderForm()}
          </div>
        ) : (
          <div className="lp-contact-grid">
            {renderInfo()}
            {renderForm()}
          </div>
        )}
      </div>
    </section>
  );
}
