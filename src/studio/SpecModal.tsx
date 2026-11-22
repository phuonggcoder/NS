import { useEffect, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { downloadTextFile } from '../exporter/exportHtml';
import type { LandingPageSpec } from '../types/spec';
import { generateSpecMarkdown } from '../utils/specMarkdown';

interface SpecModalProps {
  open: boolean;
  spec: LandingPageSpec;
  onClose: () => void;
  onApplySpec: (next: LandingPageSpec) => void;
}

export function SpecModal({ open, spec, onClose, onApplySpec }: SpecModalProps) {
  const [tab, setTab] = useState<'markdown' | 'json'>('markdown');
  const [jsonDraft, setJsonDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setJsonDraft(JSON.stringify(spec, null, 2));
      setError(null);
    }
  }, [open, spec]);

  if (!open) return null;

  const markdown = generateSpecMarkdown(spec);

  const handleCopy = async () => {
    const content = tab === 'markdown' ? markdown : jsonDraft;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as LandingPageSpec;
      if (!parsed || !Array.isArray(parsed.sections) || !parsed.theme || !parsed.meta) {
        setError('Spec JSON thiếu trường bắt buộc (meta, theme, sections).');
        return;
      }
      onApplySpec(parsed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cú pháp JSON không hợp lệ.');
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
      <div className="st-modal">
        <div className="st-modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Spec Kit — Bản đặc tả Trang web (Spec-Driven)
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Theo phương pháp từ speckit.org: thay đổi bản Spec sẽ cập nhật trực tiếp sản phẩm web
            </div>
          </div>
          <button type="button" className="st-btn st-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="st-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div className="st-segmented">
              <button
                type="button"
                className={`st-seg-btn ${tab === 'markdown' ? 'is-active' : ''}`}
                onClick={() => setTab('markdown')}
              >
                spec.md (Markdown)
              </button>
              <button
                type="button"
                className={`st-seg-btn ${tab === 'json' ? 'is-active' : ''}`}
                onClick={() => setTab('json')}
              >
                landing-spec.json (Chỉnh sửa trực tiếp)
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="st-btn st-btn-sm" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
              <button
                type="button"
                className="st-btn st-btn-sm"
                onClick={() =>
                  downloadTextFile(
                    tab === 'markdown' ? 'spec.md' : 'landing-spec.json',
                    tab === 'markdown' ? markdown : jsonDraft,
                    tab === 'markdown' ? 'text/markdown' : 'application/json'
                  )
                }
              >
                <Download size={13} />
                <span>Tải về</span>
              </button>
            </div>
          </div>

          {tab === 'markdown' ? (
            <textarea
              readOnly
              className="st-code-editor"
              value={markdown}
            />
          ) : (
            <>
              <textarea
                className="st-code-editor"
                value={jsonDraft}
                onChange={(e) => {
                  setJsonDraft(e.target.value);
                  setError(null);
                }}
              />
              {error && (
                <div style={{ color: '#dc2626', fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>
                  Lỗi: {error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                <button type="button" className="st-btn" onClick={onClose}>
                  Đóng
                </button>
                <button type="button" className="st-btn st-btn-primary" onClick={handleApplyJson}>
                  Áp dụng Spec JSON lên trang
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
