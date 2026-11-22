import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Eye,
  KeyRound,
  SearchCheck,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import type {
  AiProviderSettings,
  AiSuggestion,
  AutoFillBlockKey,
  AutoFillResult,
  SuggestionCategory,
} from '../ai/aiTypes';
import { loadAiSettings, runAudit, runAutoFill, saveAiSettings } from '../ai/llmClient';
import { applyAutoFillSelection, SAMPLE_BRIEFS } from '../ai/localAutoFill';
import type { LandingPageSpec } from '../types/spec';

interface AiAssistantPanelProps {
  spec: LandingPageSpec;
  isPreviewing: boolean;
  previewLabel?: string;
  onStartPreview: (previewSpec: LandingPageSpec, label: string, highlightSectionId?: string) => void;
  onStopPreview: () => void;
  onApplySpec: (nextSpec: LandingPageSpec, toastMsg: string) => void;
  onClose: () => void;
  suggestions: AiSuggestion[];
  onSetSuggestions: (next: AiSuggestion[]) => void;
}

type AiTab = 'autofill' | 'audit' | 'settings';

const BLOCK_LABELS: { key: AutoFillBlockKey; label: string }[] = [
  { key: 'meta', label: 'Thương hiệu & Tiêu đề SEO' },
  { key: 'theme', label: 'Bảng màu đề xuất theo ngành' },
  { key: 'hero', label: 'Khối Hero mở đầu' },
  { key: 'stats', label: 'Chỉ số nổi bật' },
  { key: 'about', label: 'Giới thiệu bản thân' },
  { key: 'products', label: 'Danh sách Sản phẩm & Giá' },
  { key: 'faq', label: 'Câu hỏi thường gặp (FAQ)' },
  { key: 'contact', label: 'Thông tin Liên hệ' },
];

const CATEGORY_LABELS: { key: 'all' | SuggestionCategory; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'spelling', label: 'Chính tả' },
  { key: 'contrast', label: 'Màu sắc' },
  { key: 'layout', label: 'Bố cục' },
  { key: 'seo', label: 'Nội dung & SEO' },
];

export function AiAssistantPanel({
  spec,
  isPreviewing,
  previewLabel,
  onStartPreview,
  onStopPreview,
  onApplySpec,
  onClose,
  suggestions,
  onSetSuggestions,
}: AiAssistantPanelProps) {
  const [tab, setTab] = useState<AiTab>('autofill');
  const [settings, setSettings] = useState<AiProviderSettings>(() => loadAiSettings());

  // Auto-fill state
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<AutoFillResult | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<Record<AutoFillBlockKey, boolean>>({
    meta: true,
    theme: true,
    hero: true,
    stats: true,
    about: true,
    products: true,
    faq: true,
    contact: true,
  });

  // Audit state
  const [auditing, setAuditing] = useState(false);
  const [auditWarning, setAuditWarning] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<'all' | SuggestionCategory>('all');
  const [activePreviewSugId, setActivePreviewSugId] = useState<string | null>(null);

  const handleAnalyzeRawText = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      const result = await runAutoFill(rawText, spec, settings);
      setAutoFillResult(result);
    } finally {
      setExtracting(false);
    }
  };

  const handlePreviewAutoFill = () => {
    if (!autoFillResult) return;
    const next = applyAutoFillSelection(spec, autoFillResult, selectedBlocks);
    onStartPreview(next, 'Xem thử nội dung AI Tự động điền');
  };

  const handleApplyAutoFill = () => {
    if (!autoFillResult) return;
    const next = applyAutoFillSelection(spec, autoFillResult, selectedBlocks);
    onStopPreview();
    onApplySpec(next, 'AI đã tự động điền thông tin vào trang web.');
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    setAuditWarning(null);
    setActivePreviewSugId(null);
    try {
      const res = await runAudit(spec, settings);
      onSetSuggestions(res.suggestions);
      if (res.warning) setAuditWarning(res.warning);
    } finally {
      setAuditing(false);
    }
  };

  const handlePreviewSuggestion = (sug: AiSuggestion) => {
    if (isPreviewing && activePreviewSugId === sug.id) {
      setActivePreviewSugId(null);
      onStopPreview();
      return;
    }
    const patched = sug.applyPatch(spec);
    setActivePreviewSugId(sug.id);
    onStartPreview(patched, `Xem thử: ${sug.title}`, sug.sectionId);
  };

  const handleAcceptSuggestion = (sug: AiSuggestion) => {
    const patched = sug.applyPatch(spec);
    setActivePreviewSugId(null);
    onStopPreview();
    onApplySpec(patched, `Đã áp dụng: ${sug.title}`);
    onSetSuggestions(
      suggestions.map((item) => (item.id === sug.id ? { ...item, status: 'accepted' } : item))
    );
  };

  const handleRejectSuggestion = (sug: AiSuggestion) => {
    if (activePreviewSugId === sug.id) {
      setActivePreviewSugId(null);
      onStopPreview();
    }
    onSetSuggestions(
      suggestions.map((item) => (item.id === sug.id ? { ...item, status: 'rejected' } : item))
    );
  };

  const handleAcceptAllPending = () => {
    const pending = suggestions.filter((s) => s.status === 'pending');
    if (pending.length === 0) return;
    let next = spec;
    for (const sug of pending) {
      next = sug.applyPatch(next);
    }
    setActivePreviewSugId(null);
    onStopPreview();
    onApplySpec(next, `Đã chấp nhận ${pending.length} chỉnh sửa gợi ý từ AI.`);
    onSetSuggestions(
      suggestions.map((s) => (s.status === 'pending' ? { ...s, status: 'accepted' } : s))
    );
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const filteredSuggestions = suggestions.filter((s) => {
    if (s.status === 'rejected') return false;
    if (catFilter === 'all') return true;
    if (catFilter === 'seo') return s.category === 'seo' || s.category === 'content';
    return s.category === catFilter;
  });

  return (
    <aside className="st-inspector st-ai-panel">
      <div className="st-inspector-head" style={{ background: '#eff6ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#007aff" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Trợ lý AI SpecPage</div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              {settings.mode === 'local'
                ? 'AI Cục bộ (Nhanh, không cần API key)'
                : `Đang kết nối ${settings.mode.toUpperCase()}`}
            </div>
          </div>
        </div>
        <button type="button" className="st-btn st-btn-icon" onClick={onClose} title="Đóng Trợ lý AI">
          <X size={15} />
        </button>
      </div>

      <div className="st-panel-tabs">
        <button
          type="button"
          className={`st-tab-btn ${tab === 'autofill' ? 'is-active' : ''}`}
          onClick={() => setTab('autofill')}
        >
          <Wand2 size={13} />
          <span>Điền tự động</span>
        </button>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'audit' ? 'is-active' : ''}`}
          onClick={() => setTab('audit')}
        >
          <SearchCheck size={13} />
          <span>Kiểm lỗi ({pendingSuggestions.length})</span>
        </button>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'settings' ? 'is-active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <KeyRound size={13} />
          <span>Cài đặt</span>
        </button>
      </div>

      <div className="st-scroll-body">
        {tab === 'autofill' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Dán thông tin khách hàng / sản phẩm</div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                Dán bài viết Facebook, tin nhắn Zalo, CV giới thiệu bản thân hoặc bảng giá. AI sẽ tách và điền vào đúng từng khối.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {SAMPLE_BRIEFS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="st-pill-opt"
                    style={{ fontSize: 11 }}
                    onClick={() => setRawText(sample.rawText)}
                  >
                    Mẫu: {sample.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={7}
                className="st-textarea"
                placeholder="Ví dụ:&#10;Minh Anh Skincare — Chuyên gia chăm sóc da&#10;Serum B5 390.000đ (Giá gốc 520.000đ) - Cấp ẩm sâu...&#10;SĐT: 0909 123 456&#10;Email: cskh@minhanh.vn"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={!rawText.trim() || extracting}
                onClick={handleAnalyzeRawText}
              >
                <Sparkles size={14} />
                <span>{extracting ? 'Đang phân tích...' : 'Phân tích & Chuẩn bị điền'}</span>
              </button>
            </div>

            {autoFillResult && (
              <div className="st-group">
                <div className="st-group-title">Kết quả AI bóc tách được</div>
                {autoFillResult.warning && (
                  <div className="st-ai-warn">{autoFillResult.warning}</div>
                )}
                <ul
                  style={{
                    margin: '0 0 12px',
                    paddingLeft: 18,
                    fontSize: 12,
                    color: '#334155',
                    lineHeight: 1.55,
                  }}
                >
                  {autoFillResult.summary.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>

                <div className="st-label">Chọn phần muốn tự động điền:</div>
                <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                  {BLOCK_LABELS.map(({ key, label }) => {
                    const hasData =
                      key === 'theme'
                        ? Boolean(autoFillResult.recommendedPresetId)
                        : Boolean(autoFillResult[key]);
                    if (!hasData) return null;
                    return (
                      <label key={key} className="st-check-row">
                        <input
                          type="checkbox"
                          checked={selectedBlocks[key]}
                          onChange={(e) =>
                            setSelectedBlocks((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="st-btn"
                    style={{ flex: 1 }}
                    onClick={handlePreviewAutoFill}
                  >
                    <Eye size={14} />
                    <span>Xem thử</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleApplyAutoFill}
                  >
                    <Check size={14} />
                    <span>Áp dụng ngay</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ flex: 1 }}
                disabled={auditing}
                onClick={handleRunAudit}
              >
                <SearchCheck size={14} />
                <span>{auditing ? 'Đang quét...' : 'Quét lỗi & Gợi ý sửa'}</span>
              </button>
              {pendingSuggestions.length > 0 && (
                <button
                  type="button"
                  className="st-btn"
                  title="Chấp nhận tất cả gợi ý đang chờ"
                  onClick={handleAcceptAllPending}
                >
                  <CheckCheck size={14} />
                  <span>Sửa hết</span>
                </button>
              )}
            </div>

            {auditWarning && <div className="st-ai-warn">{auditWarning}</div>}

            <div className="st-pill-selector" style={{ marginBottom: 12 }}>
              {CATEGORY_LABELS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`st-pill-opt ${catFilter === cat.key ? 'is-active' : ''}`}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  onClick={() => setCatFilter(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="st-subcard" style={{ textAlign: 'center', padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {suggestions.length === 0
                    ? 'Trang web trông rất ổn!'
                    : 'Đã xử lý xong các mục lọc hiện tại'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Không phát hiện lỗi chính tả, tương phản màu hay bố cục nào. Bấm "Quét lỗi" bất cứ lúc nào sau khi chỉnh sửa thêm.
                </div>
              </div>
            ) : (
              filteredSuggestions.map((sug) => {
                const isPreviewActive = isPreviewing && activePreviewSugId === sug.id;
                const isAccepted = sug.status === 'accepted';
                return (
                  <div
                    key={sug.id}
                    className={`st-sug-card ${isPreviewActive ? 'is-previewing' : ''} ${
                      isAccepted ? 'is-accepted' : ''
                    }`}
                  >
                    <div className="st-sug-head">
                      <span className={`st-sev-badge is-${sug.severity}`}>
                        {sug.severity === 'error' && <AlertTriangle size={11} />}
                        <span>{sug.sectionLabel}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                        {isAccepted ? 'Đã áp dụng' : sug.category.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      {sug.title}
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', lineHeight: 1.45 }}>
                      {sug.description}
                    </p>

                    {(sug.beforePreview || sug.afterPreview) && (
                      <div className="st-diff-box">
                        {sug.beforePreview && (
                          <div className="st-diff-before">− {sug.beforePreview}</div>
                        )}
                        {sug.afterPreview && (
                          <div className="st-diff-after">+ {sug.afterPreview}</div>
                        )}
                      </div>
                    )}

                    {!isAccepted && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button
                          type="button"
                          className={`st-btn st-btn-sm ${isPreviewActive ? 'st-btn-primary' : ''}`}
                          onClick={() => handlePreviewSuggestion(sug)}
                        >
                          <Eye size={12} />
                          <span>{isPreviewActive ? 'Đang xem' : 'Xem thử'}</span>
                        </button>
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => handleAcceptSuggestion(sug)}
                        >
                          <Check size={12} />
                          <span>Chấp nhận</span>
                        </button>
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-danger"
                          onClick={() => handleRejectSuggestion(sug)}
                          title="Từ chối gợi ý này"
                        >
                          <X size={12} />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isPreviewing && previewLabel && (
              <div style={{ marginTop: 10, fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>
                Đang bật chế độ xem thử: {previewLabel}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Nguồn xử lý AI</div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                {(
                  [
                    ['local', 'AI Cục bộ tích hợp (Mặc định)', 'Miễn phí, xử lý tức thì trên trình duyệt, không cần mạng hay API Key.'],
                    ['gemini', 'Google Gemini API', 'Tùy chọn dùng khóa Gemini cá nhân để viết lại câu chữ sâu hơn.'],
                    ['openai', 'OpenAI / Compatible API', 'Kết nối API chuẩn OpenAI để biên tập nội dung nâng cao.'],
                  ] as const
                ).map(([mode, title, desc]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`st-preset-card ${settings.mode === mode ? 'is-active' : ''}`}
                    onClick={() => {
                      const next = {
                        ...settings,
                        mode,
                        model:
                          mode === 'gemini'
                            ? 'gemini-2.5-flash'
                            : mode === 'openai'
                            ? 'gpt-4o-mini'
                            : settings.model,
                      };
                      setSettings(next);
                      saveAiSettings(next);
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{desc}</div>
                  </button>
                ))}
              </div>

              {settings.mode !== 'local' && (
                <div className="st-subcard">
                  <div className="st-field">
                    <label className="st-label">API Key (lưu riêng trên trình duyệt, không xuất ra web khách)</label>
                    <input
                      type="password"
                      className="st-input"
                      placeholder="Nhập API key..."
                      value={settings.apiKey}
                      onChange={(e) => {
                        const next = { ...settings, apiKey: e.target.value };
                        setSettings(next);
                        saveAiSettings(next);
                      }}
                    />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Model</label>
                    <input
                      type="text"
                      className="st-input"
                      value={settings.model}
                      onChange={(e) => {
                        const next = { ...settings, model: e.target.value };
                        setSettings(next);
                        saveAiSettings(next);
                      }}
                    />
                  </div>
                  {settings.mode === 'openai' && (
                    <div className="st-field" style={{ marginBottom: 0 }}>
                      <label className="st-label">Base URL</label>
                      <input
                        type="text"
                        className="st-input"
                        value={settings.baseUrl}
                        onChange={(e) => {
                          const next = { ...settings, baseUrl: e.target.value };
                          setSettings(next);
                          saveAiSettings(next);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
