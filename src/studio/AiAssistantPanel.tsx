import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Copy,
  Eye,
  PenLine,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import type {
  AiCopyResult,
  AiCopyTask,
  AiServerStatus,
  AiSuggestion,
  AutoFillBlockKey,
  AutoFillResult,
  SuggestionCategory,
} from '../ai/aiTypes';
import {
  fetchAiServerStatus,
  generateAiCopy,
  runAudit,
  runAutoFill,
} from '../ai/llmClient';
import { applyAutoFillSelection, SAMPLE_BRIEFS } from '../ai/localAutoFill';
import type { LandingPageSpec } from '../types/spec';
import { cloneSpec } from '../utils/storage';

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

type AiTab = 'copywriter' | 'autofill' | 'audit' | 'status';

const COPY_TASKS: { key: AiCopyTask; label: string }[] = [
  { key: 'website_copy', label: 'Nội dung Website' },
  { key: 'product_desc', label: 'Mô tả Sản phẩm' },
  { key: 'menu_item_desc', label: 'Mô tả Món ăn / Đồ uống' },
  { key: 'headlines', label: 'Gợi ý Tiêu đề' },
  { key: 'ad_copy', label: 'Nội dung Quảng cáo' },
  { key: 'normalize', label: 'Chuẩn hóa văn phong' },
  { key: 'translate', label: 'Dịch đa ngôn ngữ' },
  { key: 'spellcheck', label: 'Kiểm tra chính tả' },
  { key: 'seo_suggestions', label: 'Gợi ý cải thiện SEO' },
];

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
  const [tab, setTab] = useState<AiTab>('copywriter');
  const [serverStatus, setServerStatus] = useState<AiServerStatus>({
    configured: false,
    provider: 'local',
    model: 'specpage-local-vi-v2',
  });

  // Copywriter Workbench state
  const [copyTask, setCopyTask] = useState<AiCopyTask>('menu_item_desc');
  const [copyInput, setCopyInput] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copyResult, setCopyResult] = useState<AiCopyResult | null>(null);
  const [editableDraft, setEditableDraft] = useState('');
  const [copiedFlag, setCopiedFlag] = useState(false);

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

  useEffect(() => {
    void fetchAiServerStatus().then(setServerStatus);
  }, []);

  const handleGenerateCopy = async () => {
    if (!copyInput.trim()) return;
    setGeneratingCopy(true);
    try {
      const res = await generateAiCopy({
        task: copyTask,
        input: copyInput,
        brandName: spec.meta.title.split('—')[0]?.trim(),
        targetLanguage: targetLang,
      });
      setCopyResult(res);
      // Put result into editable draft so user always reviews/edits before applying
      setEditableDraft(res.text);
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!editableDraft.trim()) return;
    try {
      await navigator.clipboard.writeText(editableDraft);
      setCopiedFlag(true);
      window.setTimeout(() => setCopiedFlag(false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleApplyDraftToHeroSubheadline = () => {
    if (!editableDraft.trim()) return;
    const next = cloneSpec(spec);
    const hero = next.sections.find((s) => s.type === 'hero');
    if (hero && hero.type === 'hero') {
      hero.subheadline = editableDraft.trim();
      onApplySpec(next, 'Đã áp dụng nội dung AI (sau khi bạn chỉnh sửa) vào phần Hero.');
    }
  };

  const handleAnalyzeRawText = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      const result = await runAutoFill(rawText, spec);
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
      const res = await runAudit(spec);
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
              {serverStatus.configured
                ? `Server AI: ${serverStatus.provider.toUpperCase()} (${serverStatus.model})`
                : 'AI Cục bộ & Server Proxy an toàn'}
            </div>
          </div>
        </div>
        <button type="button" className="st-btn st-btn-icon" onClick={onClose} title="Đóng Trợ lý AI">
          <X size={15} />
        </button>
      </div>

      <div className="st-panel-tabs" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'copywriter' ? 'is-active' : ''}`}
          onClick={() => setTab('copywriter')}
        >
          <PenLine size={12} />
          <span>Viết bài</span>
        </button>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'autofill' ? 'is-active' : ''}`}
          onClick={() => setTab('autofill')}
        >
          <Wand2 size={12} />
          <span>Điền mẫu</span>
        </button>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'audit' ? 'is-active' : ''}`}
          onClick={() => setTab('audit')}
        >
          <SearchCheck size={12} />
          <span>Lỗi ({pendingSuggestions.length})</span>
        </button>
        <button
          type="button"
          className={`st-tab-btn ${tab === 'status' ? 'is-active' : ''}`}
          onClick={() => setTab('status')}
        >
          <ShieldCheck size={12} />
          <span>Server</span>
        </button>
      </div>

      <div className="st-scroll-body">
        {tab === 'copywriter' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Trợ lý viết nội dung & SEO</div>
              <div className="st-field">
                <label className="st-label">Tác vụ AI</label>
                <select
                  className="st-select"
                  value={copyTask}
                  onChange={(e) => setCopyTask(e.target.value as AiCopyTask)}
                >
                  {COPY_TASKS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {copyTask === 'translate' && (
                <div className="st-field">
                  <label className="st-label">Ngôn ngữ đích</label>
                  <select
                    className="st-select"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                  >
                    <option value="English">Tiếng Anh (English)</option>
                    <option value="Vietnamese">Tiếng Việt</option>
                    <option value="Japanese">Tiếng Nhật (日本語)</option>
                    <option value="Korean">Tiếng Hàn (한국어)</option>
                    <option value="Chinese">Tiếng Trung (中文)</option>
                  </select>
                </div>
              )}

              <div className="st-field">
                <label className="st-label">Nội dung gốc / Mô tả ngắn</label>
                <textarea
                  rows={4}
                  className="st-textarea"
                  placeholder="Nhập tên món, tên sản phẩm hoặc đoạn văn cần viết lại / kiểm tra chính tả / dịch..."
                  value={copyInput}
                  onChange={(e) => setCopyInput(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ width: '100%' }}
                disabled={!copyInput.trim() || generatingCopy}
                onClick={() => void handleGenerateCopy()}
              >
                <Sparkles size={14} />
                <span>{generatingCopy ? 'Đang xử lý...' : 'Tạo gợi ý nội dung'}</span>
              </button>
            </div>

            {copyResult && (
              <div className="st-group">
                <div className="st-group-title">
                  Chỉnh sửa kết quả trước khi dùng ({copyResult.providerUsed})
                </div>
                {copyResult.warning && <div className="st-ai-warn">{copyResult.warning}</div>}

                <textarea
                  rows={6}
                  className="st-textarea"
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                />

                {copyResult.notes && copyResult.notes.length > 0 && (
                  <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: 11.5, color: '#475569' }}>
                    {copyResult.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <button type="button" className="st-btn st-btn-sm" onClick={() => void handleCopyDraft()}>
                    {copiedFlag ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedFlag ? 'Đã chép' : 'Chép để dán vào Menu/Section'}</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-primary"
                    onClick={handleApplyDraftToHeroSubheadline}
                  >
                    <Check size={12} />
                    <span>Áp dụng vào mô tả Hero</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'autofill' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Dán thông tin khách hàng / sản phẩm</div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                Dán bài viết Facebook, tin nhắn Zalo, CV hoặc bảng giá. AI sẽ tách để bạn xem thử trước khi áp dụng.
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
                placeholder="Dán mô tả thương hiệu, sản phẩm, giá bán, SĐT, email..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />

              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={!rawText.trim() || extracting}
                onClick={() => void handleAnalyzeRawText()}
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
                <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
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
                  <button type="button" className="st-btn" style={{ flex: 1 }} onClick={handlePreviewAutoFill}>
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
                    <span>Áp dụng</span>
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
                onClick={() => void handleRunAudit()}
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
                  Không phát hiện lỗi chính tả, tương phản màu hay bố cục nào.
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

                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{sug.title}</div>
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px', lineHeight: 1.45 }}>
                      {sug.description}
                    </p>

                    {(sug.beforePreview || sug.afterPreview) && (
                      <div className="st-diff-box">
                        {sug.beforePreview && <div className="st-diff-before">− {sug.beforePreview}</div>}
                        {sug.afterPreview && <div className="st-diff-after">+ {sug.afterPreview}</div>}
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

        {tab === 'status' && (
          <div className="st-subcard" style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Quản lý Bảo mật AI phía Server</div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              API key của AI (<code>GEMINI_API_KEY</code> hoặc <code>OPENAI_API_KEY</code>) được quản lý an toàn trong biến môi trường phía server và không bao giờ lưu ở trình duyệt.
            </p>
            <div style={{ fontSize: 12.5 }}>
              <strong>Trạng thái hiện tại:</strong>{' '}
              {serverStatus.configured
                ? `Đã cấu hình ${serverStatus.provider.toUpperCase()} (${serverStatus.model})`
                : 'Chế độ AI Cục bộ (Server Fallback an toàn)'}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>
              Giới hạn bảo vệ: tối đa 30 yêu cầu AI / 10 phút cho mỗi phiên quản trị.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
