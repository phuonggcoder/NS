import { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Plus, QrCode, Trash2 } from 'lucide-react';
import type { QrTarget } from '../../types/spec';
import {
  buildMenuUrl,
  generateQrPngDataUrl,
  generateQrSvgString,
  triggerDownloadDataUrl,
} from '../../utils/qrCode';
import { generateId } from '../../utils/storage';

interface QrMenuPanelProps {
  slug: string;
  brandName: string;
  targets: QrTarget[];
  onChangeTargets: (next: QrTarget[]) => void;
}

export function QrMenuPanel({ slug, brandName, targets, onChangeTargets }: QrMenuPanelProps) {
  const [branch, setBranch] = useState(targets[0]?.branch || '');
  const [table, setTable] = useState(targets[0]?.table || '');
  const [label, setLabel] = useState('');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://specpage-studio.onrender.com';
  const menuUrl = buildMenuUrl(origin, slug, { branch, table, qr: true });

  useEffect(() => {
    let cancelled = false;
    void generateQrPngDataUrl(menuUrl, 400).then((dataUrl) => {
      if (!cancelled) setQrPngUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [menuUrl]);

  const handleDownloadPng = async () => {
    const dataUrl = await generateQrPngDataUrl(menuUrl, 1024);
    const suffix = [branch, table].filter(Boolean).join('-') || 'menu';
    triggerDownloadDataUrl(`qr-${slug}-${suffix}.png`, dataUrl);
  };

  const handleDownloadSvg = async () => {
    const svg = await generateQrSvgString(menuUrl, 512);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const suffix = [branch, table].filter(Boolean).join('-') || 'menu';
    triggerDownloadDataUrl(`qr-${slug}-${suffix}.svg`, url);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSaveTarget = () => {
    const cleanLabel =
      label.trim() ||
      [branch ? `CN: ${branch}` : '', table ? `Bàn ${table}` : ''].filter(Boolean).join(' · ') ||
      'QR Menu chung';
    onChangeTargets([
      ...targets,
      { id: generateId('qr'), label: cleanLabel, branch: branch.trim(), table: table.trim() },
    ]);
    setLabel('');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="st-subcard" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5 }}>
          <QrCode size={16} color="#007aff" />
          <span>Tạo mã QR Menu cho "{brandName}"</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="st-label">Chi nhánh (Tùy chọn)</label>
            <input
              type="text"
              className="st-input"
              placeholder="VD: quan-1, ha-noi"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
          <div>
            <label className="st-label">Số bàn / Khu vực (Tùy chọn)</label>
            <input
              type="text"
              className="st-input"
              placeholder="VD: ban-05, quay-mang-ve"
              value={table}
              onChange={(e) => setTable(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 14,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {qrPngUrl ? (
              <img src={qrPngUrl} alt="QR Menu" style={{ width: 156, height: 156 }} />
            ) : (
              <span style={{ fontSize: 12, color: '#64748b' }}>Đang tạo QR...</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Đường dẫn ổn định lâu dài:
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" readOnly className="st-input" value={menuUrl} />
              <button type="button" className="st-btn st-btn-sm" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="st-btn st-btn-sm st-btn-primary" onClick={handleDownloadPng}>
                <Download size={13} />
                <span>Tải QR PNG</span>
              </button>
              <button type="button" className="st-btn st-btn-sm" onClick={handleDownloadSvg}>
                <Download size={13} />
                <span>Tải QR SVG</span>
              </button>
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="st-btn st-btn-sm"
              >
                <ExternalLink size={13} />
                <span>Mở thử trên web</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="st-subcard">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
          Danh sách mã QR theo bàn / chi nhánh đã lưu ({targets.length})
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <input
            type="text"
            className="st-input"
            placeholder="Nhãn gợi nhớ (VD: Bàn 05 - Tầng 2)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button type="button" className="st-btn st-btn-sm" onClick={handleSaveTarget}>
            <Plus size={13} />
            <span>Lưu cấu hình QR</span>
          </button>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          {targets.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: 12.5,
              }}
            >
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
                onClick={() => {
                  setBranch(t.branch || '');
                  setTable(t.table || '');
                }}
              >
                {t.label}{' '}
                <span style={{ color: '#64748b', fontWeight: 400 }}>
                  {[t.branch ? `CN: ${t.branch}` : '', t.table ? `Bàn: ${t.table}` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
              <button
                type="button"
                className="st-btn st-btn-icon"
                onClick={() => onChangeTargets(targets.filter((x) => x.id !== t.id))}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
