import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCheck,
  Copy,
  Eye,
  PenLine,
  Plus,
  Save,
  SearchCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type {
  AiBrandMemory,
  AiCopyResult,
  AiCopyTask,
  AiHolisticRecommendation,
  AiServerStatus,
  AiSuggestion,
  AutoFillBlockKey,
  AutoFillResult,
  SuggestionCategory,
} from '../ai/aiTypes';
import {
  fetchAiMemory,
  fetchAiServerStatus,
  generateAiCopy,
  runAudit,
  runAutoFill,
  runHolisticAiAudit,
  saveAiMemory,
  submitAiFeedback,
} from '../ai/llmClient';
import { applyAutoFillSelection, SAMPLE_BRIEFS } from '../ai/localAutoFill';
import type { LandingPageSpec } from '../types/spec';
import { cloneSpec } from '../utils/storage';

interface AiAssistantPanelProps {
  spec: LandingPageSpec;
  projectId?: string;
  projectSlug?: string;
  isPreviewing: boolean;
  previewLabel?: string;
  onStartPreview: (previewSpec: LandingPageSpec, label: string, highlightSectionId?: string) => void;
  onStopPreview: () => void;
  onApplySpec: (nextSpec: LandingPageSpec, toastMsg: string) => void;
  onClose: () => void;
  suggestions: AiSuggestion[];
  onSetSuggestions: (next: AiSuggestion[]) => void;
}

type AiTab = 'optimize' | 'copywriter' | 'autofill' | 'memory';

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

function applyRecommendationToSpec(
  currentSpec: LandingPageSpec,
  rec: AiHolisticRecommendation,
  value: string
): LandingPageSpec {
  const next = cloneSpec(currentSpec);
  const cleanVal = value.trim();
  if (!cleanVal) return next;

  if (rec.targetSectionType === 'meta') {
    if (rec.targetField === 'title') next.meta.title = cleanVal;
    else next.meta.description = cleanVal;
    return next;
  }

  if (rec.targetSectionType === 'menu_item' && next.digitalMenu) {
    next.digitalMenu.items = next.digitalMenu.items.map((it) =>
      it.id === rec.targetField ? { ...it, description: cleanVal } : it
    );
    return next;
  }

  const targetSec = next.sections.find((s) => s.type === rec.targetSectionType);
  if (targetSec) {
    if (targetSec.type === 'hero') {
      if (rec.targetField === 'headline') targetSec.headline = cleanVal;
      else if (rec.targetField === 'imageCaption') targetSec.imageCaption = cleanVal;
      else targetSec.subheadline = cleanVal;
    } else if (targetSec.type === 'cta') {
      if (rec.targetField === 'primaryLabel') targetSec.primaryLabel = cleanVal;
      else if (rec.targetField === 'title') targetSec.title = cleanVal;
      else targetSec.subtitle = cleanVal;
    } else if (targetSec.type === 'products') {
      if (rec.targetField === 'title') targetSec.title = cleanVal;
      else targetSec.subtitle = cleanVal;
    }
  }
  return next;
}

export function AiAssistantPanel({
  spec,
  projectId = 'default',
  projectSlug = 'du-an-mau',
  isPreviewing,
  previewLabel,
  onStartPreview,
  onStopPreview,
  onApplySpec,
  onClose,
  suggestions,
  onSetSuggestions,
}: AiAssistantPanelProps) {
  const [tab, setTab] = useState<AiTab>('optimize');
  const [serverStatus, setServerStatus] = useState<AiServerStatus>({
    configured: false,
    provider: 'local',
    model: 'specpage-local-vi-v2',
  });

  // Holistic AI Audit & Optimize state
  const [holisticLoading, setHolisticLoading] = useState(false);
  const [holisticSummary, setHolisticSummary] = useState<string | null>(null);
  const [holisticWarning, setHolisticWarning] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AiHolisticRecommendation[]>([]);
  const [recEdits, setRecEdits] = useState<Record<string, string>>({});
  const [recDone, setRecDone] = useState<Record<string, 'applied' | 'rejected'>>({});
  const [learningToast, setLearningToast] = useState<string | null>(null);

  // Local Rule-Based Audit state
  const [auditing, setAuditing] = useState(false);
  const [auditWarning, setAuditWarning] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<'all' | SuggestionCategory>('all');
  const [activePreviewSugId, setActivePreviewSugId] = useState<string | null>(null);

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

  // Brand Memory state
  const [memory, setMemory] = useState<AiBrandMemory>({
    brandProfile: { industry: '', tone: '', audience: '', usp: '', forbiddenWords: [] },
    learnedRules: [],
    optimizationLog: [],
    updatedAt: '',
  });
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);

  const loadMemory = useCallback(async () => {
    const loaded = await fetchAiMemory(projectId);
    if (loaded) {
      setMemory(loaded);
      setForbiddenInput(loaded.brandProfile.forbiddenWords.join(', '));
    }
  }, [projectId]);

  useEffect(() => {
    void fetchAiServerStatus().then(setServerStatus);
    void loadMemory();
  }, [loadMemory]);

  const recordFeedback = async (payload: Parameters<typeof submitAiFeedback>[0]) => {
    const res = await submitAiFeedback(payload);
    if (res.memory) {
      setMemory(res.memory);
    }
    if (res.learnedRule) {
      setLearningToast(`AI đã ghi nhớ quy tắc mới: "${res.learnedRule}"`);
      window.setTimeout(() => setLearningToast(null), 4500);
    }
  };

  const handleRunHolisticAudit = async () => {
    setHolisticLoading(true);
    setHolisticWarning(null);
    setRecDone({});
    try {
      const res = await runHolisticAiAudit({
        projectId,
        slug: projectSlug,
        spec,
      });
      setHolisticSummary(res.summary);
      setRecommendations(res.recommendations);
      const draftMap: Record<string, string> = {};
      res.recommendations.forEach((r) => {
        draftMap[r.id] = r.suggestedValue;
      });
      setRecEdits(draftMap);
      if (res.warning) setHolisticWarning(res.warning);
    } finally {
      setHolisticLoading(false);
    }
  };

  const handleApplyRecommendation = async (rec: AiHolisticRecommendation) => {
    const finalVal = (recEdits[rec.id] ?? rec.suggestedValue).trim();
    const isEdited = finalVal !== rec.suggestedValue.trim();
    const patched = applyRecommendationToSpec(spec, rec, finalVal);
    onApplySpec(patched, `AI đã tối ưu: ${rec.title}`);
    setRecDone((prev) => ({ ...prev, [rec.id]: 'applied' }));
    await recordFeedback({
      projectId,
      taskType: 'holistic_audit',
      topic: rec.title,
      aiOutput: rec.suggestedValue,
      userFinalOutput: finalVal,
      action: isEdited ? 'edited' : 'accepted',
    });
  };

  const handleRejectRecommendation = async (rec: AiHolisticRecommendation) => {
    setRecDone((prev) => ({ ...prev, [rec.id]: 'rejected' }));
    await recordFeedback({
      projectId,
      taskType: 'holistic_audit',
      topic: rec.title,
      aiOutput: rec.suggestedValue,
      action: 'rejected',
      note: `Bỏ qua đề xuất "${rec.title}"`,
    });
  };

  const handleGenerateCopy = async () => {
    if (!copyInput.trim()) return;
    setGeneratingCopy(true);
    try {
      const res = await generateAiCopy({
        task: copyTask,
        input: copyInput,
        brandName: spec.meta.title.split('—')[0]?.trim(),
        targetLanguage: targetLang,
        projectId,
        slug: projectSlug,
        spec,
      });
      setCopyResult(res);
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
      if (copyResult) {
        const isEdited = editableDraft.trim() !== copyResult.text.trim();
        await recordFeedback({
          projectId,
          taskType: copyTask,
          topic: `Copy (${copyTask})`,
          aiOutput: copyResult.text,
          userFinalOutput: editableDraft,
          action: isEdited ? 'edited' : 'accepted',
        });
      }
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleApplyDraftToHeroSubheadline = async () => {
    if (!editableDraft.trim()) return;
    const next = cloneSpec(spec);
    const hero = next.sections.find((s) => s.type === 'hero');
    if (hero && hero.type === 'hero') {
      hero.subheadline = editableDraft.trim();
      onApplySpec(next, 'Đã áp dụng nội dung AI vào phần Hero.');
      if (copyResult) {
        const isEdited = editableDraft.trim() !== copyResult.text.trim();
        await recordFeedback({
          projectId,
          taskType: copyTask,
          topic: 'Hero Subheadline',
          aiOutput: copyResult.text,
          userFinalOutput: editableDraft.trim(),
          action: isEdited ? 'edited' : 'accepted',
        });
      }
    }
  };

  const handleRejectCopyDraft = async () => {
    if (!copyResult) return;
    await recordFeedback({
      projectId,
      taskType: copyTask,
      topic: `Từ chối (${copyTask})`,
      aiOutput: copyResult.text,
      action: 'rejected',
      note: 'Nội dung AI chưa phù hợp với phong cách trang.',
    });
    setCopyResult(null);
    setEditableDraft('');
  };

  const handleSaveMemory = async () => {
    setSavingMemory(true);
    setMemoryNotice(null);
    const forbiddenWords = forbiddenInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await saveAiMemory(projectId, {
      ...memory,
      brandProfile: { ...memory.brandProfile, forbiddenWords },
    });
    setSavingMemory(false);
    if (res.ok && res.memory) {
      setMemory(res.memory);
      setMemoryNotice('Đã lưu Trí nhớ AI (Brand Memory) lên server.');
    } else {
      setMemoryNotice(res.error || 'Lưu thất bại.');
    }
  };

  const handleAnalyzeRawText = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    try {
      const result = await runAutoFill(rawText, spec, projectId, projectSlug);
      setAutoFillResult(result);
    } finally {
      setExtracting(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    setAuditWarning(null);
    setActivePreviewSugId(null);
    try {
      const res = await runAudit(spec, projectId, projectSlug);
      onSetSuggestions(res.suggestions);
      if (res.warning) setAuditWarning(res.warning);
    } finally {
      setAuditing(false);
    }
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
                ? `Context-Aware ${serverStatus.provider.toUpperCase()} (${serverStatus.model})`
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
          className={`st-tab-btn ${tab === 'optimize' ? 'is-active' : ''}`}
          onClick={() => setTab('optimize')}
        >
          <SearchCheck size={12} />
          <span>Audit ({pendingSuggestions.length})</span>
        </button>
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
          className={`st-tab-btn ${tab === 'memory' ? 'is-active' : ''}`}
          onClick={() => setTab('memory')}
        >
          <Brain size={12} />
          <span>Trí nhớ</span>
        </button>
      </div>

      <div className="st-scroll-body">
        {learningToast && (
          <div
            style={{
              marginBottom: 10,
              padding: '8px 10px',
              borderRadius: 10,
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#3730a3',
              fontSize: 11.5,
              fontWeight: 600,
            }}
          >
            🧠 {learningToast}
          </div>
        )}

        {tab === 'optimize' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">AI Audit & Tối ưu Toàn trang (Context + Analytics)</div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.45 }}>
                AI đọc toàn bộ cấu trúc trang, Digital Menu, Analytics và Trí nhớ thương hiệu để đề xuất Top 5 việc cần cải thiện ngay.
              </p>
              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ width: '100%' }}
                disabled={holisticLoading}
                onClick={() => void handleRunHolisticAudit()}
              >
                <Sparkles size={14} />
                <span>
                  {holisticLoading ? 'Đang phân tích toàn trang...' : 'Phân tích tổng thể & Đề xuất Top 5'}
                </span>
              </button>

              {holisticWarning && (
                <div className="st-ai-warn" style={{ marginTop: 8 }}>
                  {holisticWarning}
                </div>
              )}

              {holisticSummary && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#334155',
                  }}
                >
                  {holisticSummary}
                </div>
              )}

              {recommendations.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {recommendations.map((rec) => {
                    const status = recDone[rec.id];
                    return (
                      <div key={rec.id} className="st-sug-card">
                        <div className="st-sug-head">
                          <span className={`st-sev-badge is-${rec.priority === 'high' ? 'error' : 'tip'}`}>
                            {rec.category.toUpperCase()} · {rec.priority.toUpperCase()}
                          </span>
                          {status && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: status === 'applied' ? '#15803d' : '#64748b' }}>
                              {status === 'applied' ? 'Đã áp dụng' : 'Đã bỏ qua'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{rec.title}</div>
                        <p style={{ fontSize: 11.5, color: '#475569', margin: '0 0 8px' }}>{rec.reason}</p>
                        {!status && (
                          <>
                            <textarea
                              rows={2}
                              className="st-textarea"
                              style={{ fontSize: 12 }}
                              value={recEdits[rec.id] ?? rec.suggestedValue}
                              onChange={(e) =>
                                setRecEdits((prev) => ({ ...prev, [rec.id]: e.target.value }))
                              }
                            />
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <button
                                type="button"
                                className="st-btn st-btn-sm st-btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => void handleApplyRecommendation(rec)}
                              >
                                <Check size={12} />
                                <span>Áp dụng</span>
                              </button>
                              <button
                                type="button"
                                className="st-btn st-btn-sm"
                                onClick={() => void handleRejectRecommendation(rec)}
                              >
                                <X size={12} />
                                <span>Bỏ qua</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="st-group">
              <div className="st-group-title">Kiểm lỗi nhanh (Chính tả, Màu sắc, Anchor)</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className="st-btn"
                  style={{ flex: 1 }}
                  disabled={auditing}
                  onClick={() => void handleRunAudit()}
                >
                  <SearchCheck size={14} />
                  <span>{auditing ? 'Đang quét...' : 'Quét lỗi chi tiết'}</span>
                </button>
                {pendingSuggestions.length > 0 && (
                  <button
                    type="button"
                    className="st-btn"
                    onClick={() => {
                      let next = spec;
                      for (const sug of pendingSuggestions) next = sug.applyPatch(next);
                      setActivePreviewSugId(null);
                      onStopPreview();
                      onApplySpec(next, `Đã chấp nhận ${pendingSuggestions.length} gợi ý sửa lỗi.`);
                      onSetSuggestions(
                        suggestions.map((s) => (s.status === 'pending' ? { ...s, status: 'accepted' } : s))
                      );
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Sửa hết</span>
                  </button>
                )}
              </div>

              {auditWarning && <div className="st-ai-warn">{auditWarning}</div>}

              <div className="st-pill-selector" style={{ marginBottom: 10 }}>
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

              {filteredSuggestions.map((sug) => {
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
                    <p style={{ fontSize: 12, color: '#475569', margin: '0 0 8px' }}>{sug.description}</p>
                    {(sug.beforePreview || sug.afterPreview) && (
                      <div className="st-diff-box">
                        {sug.beforePreview && <div className="st-diff-before">− {sug.beforePreview}</div>}
                        {sug.afterPreview && <div className="st-diff-after">+ {sug.afterPreview}</div>}
                      </div>
                    )}
                    {!isAccepted && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          className={`st-btn st-btn-sm ${isPreviewActive ? 'st-btn-primary' : ''}`}
                          onClick={() => {
                            if (isPreviewActive) {
                              setActivePreviewSugId(null);
                              onStopPreview();
                            } else {
                              setActivePreviewSugId(sug.id);
                              onStartPreview(sug.applyPatch(spec), `Xem thử: ${sug.title}`, sug.sectionId);
                            }
                          }}
                        >
                          <Eye size={12} />
                          <span>{isPreviewActive ? 'Đang xem' : 'Thử'}</span>
                        </button>
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            setActivePreviewSugId(null);
                            onStopPreview();
                            onApplySpec(sug.applyPatch(spec), `Đã áp dụng: ${sug.title}`);
                            onSetSuggestions(
                              suggestions.map((i) => (i.id === sug.id ? { ...i, status: 'accepted' } : i))
                            );
                          }}
                        >
                          <Check size={12} />
                          <span>Áp dụng</span>
                        </button>
                        <button
                          type="button"
                          className="st-btn st-btn-sm st-btn-danger"
                          onClick={() => {
                            if (activePreviewSugId === sug.id) {
                              setActivePreviewSugId(null);
                              onStopPreview();
                            }
                            onSetSuggestions(
                              suggestions.map((i) => (i.id === sug.id ? { ...i, status: 'rejected' } : i))
                            );
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {isPreviewing && previewLabel && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#b45309', fontWeight: 600 }}>
                  Đang xem thử: {previewLabel}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'copywriter' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Viết nội dung thông minh (Theo Ngữ cảnh + Trí nhớ)</div>
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
                  placeholder="Nhập tên món, sản phẩm hoặc đoạn văn cần viết lại / dịch / kiểm tra chính tả..."
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
                <span>{generatingCopy ? 'Đang tạo nội dung...' : 'Tạo gợi ý nội dung'}</span>
              </button>
            </div>

            {copyResult && (
              <div className="st-group">
                <div className="st-group-title">
                  Xem & Chỉnh sửa trước khi dùng ({copyResult.providerUsed})
                </div>
                {copyResult.warning && <div className="st-ai-warn">{copyResult.warning}</div>}

                <textarea
                  rows={6}
                  className="st-textarea"
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                />

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <button type="button" className="st-btn st-btn-sm" onClick={() => void handleCopyDraft()}>
                    {copiedFlag ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedFlag ? 'Đã chép' : 'Chép'}</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-primary"
                    onClick={() => void handleApplyDraftToHeroSubheadline()}
                  >
                    <Check size={12} />
                    <span>Áp dụng vào Hero</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-sm st-btn-danger"
                    onClick={() => void handleRejectCopyDraft()}
                  >
                    <X size={12} />
                    <span>Chưa ưng</span>
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
                rows={6}
                className="st-textarea"
                placeholder="Dán bài viết Facebook, tin nhắn Zalo hoặc bảng giá..."
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
                <div className="st-group-title">Chọn phần muốn điền</div>
                {autoFillResult.warning && <div className="st-ai-warn">{autoFillResult.warning}</div>}
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
                    onClick={() =>
                      onStartPreview(
                        applyAutoFillSelection(spec, autoFillResult, selectedBlocks),
                        'Xem thử nội dung AI Tự động điền'
                      )
                    }
                  >
                    <Eye size={14} />
                    <span>Xem thử</span>
                  </button>
                  <button
                    type="button"
                    className="st-btn st-btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const next = applyAutoFillSelection(spec, autoFillResult, selectedBlocks);
                      onStopPreview();
                      onApplySpec(next, 'AI đã tự động điền thông tin vào trang web.');
                    }}
                  >
                    <Check size={14} />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div>
            <div className="st-group">
              <div className="st-group-title">Hồ sơ Thương hiệu (Brand Profile)</div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <label className="st-label">Ngành nghề</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="VD: Quán cà phê rang mộc, Nha khoa..."
                    value={memory.brandProfile.industry}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        brandProfile: { ...memory.brandProfile, industry: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="st-label">Tông giọng (Tone of Voice)</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="VD: Thân thiện, ấm áp, chuyên nghiệp, không sáo rỗng"
                    value={memory.brandProfile.tone}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        brandProfile: { ...memory.brandProfile, tone: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="st-label">Khách hàng mục tiêu</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="VD: Dân văn phòng 22–35 tuổi, chủ SME"
                    value={memory.brandProfile.audience}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        brandProfile: { ...memory.brandProfile, audience: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="st-label">Điểm khác biệt cốt lõi (USP)</label>
                  <textarea
                    rows={2}
                    className="st-textarea"
                    placeholder="VD: 100% hạt hái chín Đà Lạt, rang mới trong 48h"
                    value={memory.brandProfile.usp}
                    onChange={(e) =>
                      setMemory({
                        ...memory,
                        brandProfile: { ...memory.brandProfile, usp: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="st-label">Từ ngữ cần tránh (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    className="st-input"
                    placeholder="VD: rẻ nhất, số 1 thế giới, cam kết 100%"
                    value={forbiddenInput}
                    onChange={(e) => setForbiddenInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="st-group">
              <div className="st-group-title">
                Quy tắc AI đã tự học ({memory.learnedRules.length}/20)
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  className="st-input"
                  placeholder="Thêm quy tắc thủ công..."
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                />
                <button
                  type="button"
                  className="st-btn st-btn-sm"
                  onClick={() => {
                    if (!newRuleInput.trim()) return;
                    setMemory({
                      ...memory,
                      learnedRules: [newRuleInput.trim(), ...memory.learnedRules].slice(0, 20),
                    });
                    setNewRuleInput('');
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {memory.learnedRules.length === 0 ? (
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Chưa có quy tắc nào. Khi bạn sửa hoặc từ chối gợi ý AI, hệ thống sẽ tự rút ra quy tắc tại đây.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {memory.learnedRules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="st-input"
                        style={{ fontSize: 12 }}
                        value={rule}
                        onChange={(e) => {
                          const next = [...memory.learnedRules];
                          next[idx] = e.target.value;
                          setMemory({ ...memory, learnedRules: next });
                        }}
                      />
                      <button
                        type="button"
                        className="st-btn st-btn-icon"
                        onClick={() =>
                          setMemory({
                            ...memory,
                            learnedRules: memory.learnedRules.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="st-btn st-btn-primary"
                style={{ width: '100%', marginTop: 10 }}
                disabled={savingMemory}
                onClick={() => void handleSaveMemory()}
              >
                <Save size={14} />
                <span>{savingMemory ? 'Đang lưu...' : 'Lưu Trí nhớ AI (Brand Memory)'}</span>
              </button>
              {memoryNotice && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                  {memoryNotice}
                </div>
              )}
            </div>

            <div className="st-group">
              <div className="st-group-title">
                Lịch sử tối ưu gần đây ({memory.optimizationLog.length})
              </div>
              {memory.optimizationLog.slice(0, 6).map((log, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11.5,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: 5,
                  }}
                >
                  <strong>
                    {log.status === 'accepted' ? '✅' : log.status === 'edited' ? '✏️' : '❌'}{' '}
                    {log.topic}
                  </strong>
                  <div style={{ color: '#64748b' }}>
                    {new Date(log.date).toLocaleString('vi-VN')}
                    {log.note ? ` · ${log.note}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
