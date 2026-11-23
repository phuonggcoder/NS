import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { PLACEHOLDER_GALLERY } from '../../data/placeholders';
import { compressImageFile } from '../../utils/imageUpload';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  fieldKey,
  onFocusField,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  fieldKey?: string;
  onFocusField?: (fieldKey: string, label: string) => void;
}) {
  return (
    <div className="st-field" data-inspector-field={fieldKey}>
      <label className="st-label">{label}</label>
      <input
        type={type}
        className="st-input"
        value={value}
        placeholder={placeholder}
        onFocus={() => fieldKey && onFocusField?.(fieldKey, label)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  fieldKey,
  onFocusField,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  fieldKey?: string;
  onFocusField?: (fieldKey: string, label: string) => void;
}) {
  return (
    <div className="st-field" data-inspector-field={fieldKey}>
      <label className="st-label">{label}</label>
      <textarea
        rows={rows}
        className="st-textarea"
        value={value}
        placeholder={placeholder}
        onFocus={() => fieldKey && onFocusField?.(fieldKey, label)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function VariantSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}) {
  return (
    <div className="st-field">
      <label className="st-label">{label}</label>
      <div className="st-pill-selector">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`st-pill-opt ${value === opt.value ? 'is-active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder = 'Nhập dòng mới...',
  fieldKey,
  onFocusField,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  fieldKey?: string;
  onFocusField?: (fieldKey: string, label: string) => void;
}) {
  return (
    <div className="st-field" data-inspector-field={fieldKey}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <label className="st-label" style={{ marginBottom: 0 }}>
          {label}
        </label>
        <button
          type="button"
          className="st-btn st-btn-sm"
          onClick={() => onChange([...items, 'Mục mới'])}
        >
          <Plus size={12} />
          <span>Thêm</span>
        </button>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              className="st-input"
              value={item}
              placeholder={placeholder}
              onFocus={() => fieldKey && onFocusField?.(fieldKey, label)}
              onChange={(e) => {
                const copy = [...items];
                copy[idx] = e.target.value;
                onChange(copy);
              }}
            />
            <button
              type="button"
              className="st-btn st-btn-icon st-btn-danger"
              title="Xóa"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  fieldKey,
  onFocusField,
}: {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  fieldKey?: string;
  onFocusField?: (fieldKey: string, label: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
      if (fieldKey) onFocusField?.(fieldKey, label);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="st-field" data-inspector-field={fieldKey}>
      <label className="st-label">{label}</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          type="text"
          className="st-input"
          placeholder="Dán link ảnh https://... hoặc tải ảnh lên"
          value={value.startsWith('data:image/svg+xml') ? '[Ảnh minh họa có sẵn]' : value}
          onFocus={() => fieldKey && onFocusField?.(fieldKey, label)}
          onChange={(e) => {
            if (e.target.value !== '[Ảnh minh họa có sẵn]') {
              onChange(e.target.value);
            }
          }}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="st-btn st-btn-sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={13} />
          <span>{uploading ? 'Đang nén...' : 'Tải ảnh từ máy'}</span>
        </button>
        <button
          type="button"
          className="st-btn st-btn-sm"
          onClick={() => setShowGallery((prev) => !prev)}
        >
          <span>{showGallery ? 'Ẩn kho ảnh' : 'Chọn ảnh mẫu'}</span>
        </button>
        {value && (
          <button
            type="button"
            className="st-btn st-btn-sm st-btn-danger"
            onClick={() => onChange('')}
          >
            Xóa ảnh
          </button>
        )}
      </div>

      {showGallery && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 6,
            marginTop: 8,
            padding: 8,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          {PLACEHOLDER_GALLERY.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onChange(item.url);
                setShowGallery(false);
                if (fieldKey) onFocusField?.(fieldKey, label);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                padding: 4,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <img
                src={item.url}
                alt={item.label}
                style={{ width: '100%', height: 54, objectFit: 'cover', borderRadius: 5 }}
              />
              <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 3 }}>{item.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
