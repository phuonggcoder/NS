import { queryAnalytics } from './server-analytics.mjs';
import { sanitizeSlug, storeGet, storeSet } from './server-store.mjs';

const MAX_LEARNED_RULES = 20;
const MAX_OPT_LOG = 50;

export function getAiMemoryKey(projectId) {
  const cleaned = String(projectId || 'default')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 80);
  return `ai:memory:${cleaned || 'default'}`;
}

export function createDefaultAiMemory() {
  return {
    brandProfile: {
      industry: '',
      tone: '',
      audience: '',
      usp: '',
      forbiddenWords: [],
    },
    learnedRules: [],
    optimizationLog: [],
    updatedAt: new Date().toISOString(),
  };
}

export function clampRuleWords(rawRule, maxWords = 20) {
  const cleaned = String(rawRule || '')
    .replace(/\s+/g, ' ')
    .replace(/^[-*•\d.)\s]+/, '')
    .trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ');
  const limited = words.length > maxWords ? words.slice(0, maxWords).join(' ') : cleaned;
  return limited.slice(0, 160);
}

export function normalizeAiMemory(raw) {
  const base = createDefaultAiMemory();
  if (!raw || typeof raw !== 'object') return base;

  const bp = raw.brandProfile && typeof raw.brandProfile === 'object' ? raw.brandProfile : {};
  const forbidden = Array.isArray(bp.forbiddenWords)
    ? bp.forbiddenWords
        .map((w) => String(w || '').trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 30)
    : [];

  const seenRules = new Set();
  const learnedRules = [];
  if (Array.isArray(raw.learnedRules)) {
    for (const r of raw.learnedRules) {
      const rule = clampRuleWords(r, 20);
      if (!rule) continue;
      const key = rule.toLowerCase();
      if (seenRules.has(key)) continue;
      seenRules.add(key);
      learnedRules.push(rule);
      if (learnedRules.length >= MAX_LEARNED_RULES) break;
    }
  }

  const optimizationLog = Array.isArray(raw.optimizationLog)
    ? raw.optimizationLog
        .filter((e) => e && typeof e === 'object')
        .slice(0, MAX_OPT_LOG)
        .map((e) => ({
          date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
          topic: String(e.topic || 'Tối ưu nội dung').slice(0, 120),
          status:
            e.status === 'accepted' || e.status === 'edited' || e.status === 'rejected'
              ? e.status
              : 'accepted',
          note: String(e.note || '').slice(0, 240),
        }))
    : [];

  return {
    brandProfile: {
      industry: String(bp.industry || '').slice(0, 100),
      tone: String(bp.tone || '').slice(0, 120),
      audience: String(bp.audience || '').slice(0, 160),
      usp: String(bp.usp || '').slice(0, 240),
      forbiddenWords: forbidden,
    },
    learnedRules,
    optimizationLog,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export async function getProjectAiMemory(projectId, rootDir = process.cwd()) {
  const key = getAiMemoryKey(projectId);
  const stored = await storeGet(key, null, rootDir);
  return normalizeAiMemory(stored);
}

export async function saveProjectAiMemory(projectId, payload, rootDir = process.cwd()) {
  const key = getAiMemoryKey(projectId);
  const normalized = normalizeAiMemory({
    ...payload,
    updatedAt: new Date().toISOString(),
  });
  await storeSet(key, normalized, rootDir);
  return normalized;
}

export async function appendLearnedRule(projectId, rawRule, rootDir = process.cwd()) {
  const rule = clampRuleWords(rawRule, 20);
  const current = await getProjectAiMemory(projectId, rootDir);
  if (!rule) return { added: false, rule: '', memory: current };

  const lower = rule.toLowerCase();
  const filtered = current.learnedRules.filter((r) => r.toLowerCase() !== lower);
  const nextRules = [rule, ...filtered].slice(0, MAX_LEARNED_RULES);
  const saved = await saveProjectAiMemory(
    projectId,
    {
      ...current,
      learnedRules: nextRules,
    },
    rootDir
  );
  return { added: true, rule, memory: saved };
}

export async function appendOptimizationLog(projectId, entry, rootDir = process.cwd()) {
  const current = await getProjectAiMemory(projectId, rootDir);
  const nextEntry = {
    date: new Date().toISOString(),
    topic: String(entry?.topic || 'AI Optimization').slice(0, 120),
    status:
      entry?.status === 'accepted' || entry?.status === 'edited' || entry?.status === 'rejected'
        ? entry.status
        : 'accepted',
    note: String(entry?.note || '').slice(0, 240),
  };
  const nextLog = [nextEntry, ...current.optimizationLog].slice(0, MAX_OPT_LOG);
  return saveProjectAiMemory(
    projectId,
    {
      ...current,
      optimizationLog: nextLog,
    },
    rootDir
  );
}

function summarizeSpecAndAudit(spec) {
  if (!spec || typeof spec !== 'object') {
    return { summaryText: 'Chưa có dữ liệu LandingPageSpec.', issues: [], menuSummaryText: '' };
  }

  const meta = spec.meta || {};
  const sections = Array.isArray(spec.sections) ? spec.sections.filter((s) => s && s.visible) : [];
  const issues = [];

  const titleLen = String(meta.title || '').trim().length;
  const descLen = String(meta.description || '').trim().length;
  if (titleLen < 15 || titleLen > 65) {
    issues.push(`Meta Title hiện dài ${titleLen} ký tự (chuẩn 15–65).`);
  }
  if (descLen < 50 || descLen > 160) {
    issues.push(`Meta Description hiện dài ${descLen} ký tự (chuẩn 50–160).`);
  }

  const sectionLines = [];
  for (const s of sections) {
    if (s.type === 'hero') {
      sectionLines.push(
        `- Hero: headline="${s.headline || ''}", highlight="${s.highlightText || ''}", subheadline="${String(
          s.subheadline || ''
        ).slice(0, 140)}", cta="${s.primaryCtaLabel || ''}"`
      );
      if (!s.imageCaption) issues.push('Hero thiếu chú thích / Alt text cho ảnh.');
    } else if (s.type === 'products') {
      const names = (s.items || []).slice(0, 6).map((p) => `${p.name} (${p.price})`);
      sectionLines.push(`- Products (${(s.items || []).length} sp): title="${s.title || ''}", items=[${names.join('; ')}]`);
    } else if (s.type === 'pricing') {
      const tiers = (s.tiers || []).map((t) => `${t.name} (${t.price})`);
      sectionLines.push(`- Pricing: title="${s.title || ''}", tiers=[${tiers.join('; ')}]`);
    } else if (s.type === 'cta') {
      sectionLines.push(`- CTA: title="${s.title || ''}", primary="${s.primaryLabel || ''}"`);
    } else if (s.type === 'about') {
      sectionLines.push(`- About: title="${s.title || ''}", role="${s.role || ''}"`);
    } else if (s.type === 'faq') {
      sectionLines.push(`- FAQ: ${(s.items || []).length} câu hỏi`);
    } else if (s.type === 'contact') {
      sectionLines.push(`- Contact: phone="${s.phone || ''}", email="${s.email || ''}"`);
    } else {
      sectionLines.push(`- Section(${s.type})`);
    }
  }

  if (!sections.some((s) => s.type === 'testimonials')) {
    issues.push('Trang chưa có khối Đánh giá khách hàng (Testimonials) để tăng độ tin cậy.');
  }
  if (!sections.some((s) => s.type === 'faq')) {
    issues.push('Trang chưa có khối Câu hỏi thường gặp (FAQ) để giải đáp rào cản mua hàng.');
  }

  let menuSummaryText = 'Digital Menu: chưa bật.';
  const dm = spec.digitalMenu;
  if (dm && dm.enabled) {
    const items = Array.isArray(dm.items) ? dm.items : [];
    const cats = Array.isArray(dm.categories) ? dm.categories.filter((c) => c.visible) : [];
    const soldOutCount = items.filter((i) => i.status === 'sold_out').length;
    const missingDescCount = items.filter((i) => !i.description || i.description.trim().length < 15).length;
    if (missingDescCount > 0) {
      issues.push(`Digital Menu có ${missingDescCount} món mô tả quá ngắn hoặc trống.`);
    }
    const sampleItems = items.slice(0, 8).map((i) => `${i.name} (${i.salePrice || i.price}${dm.currency || 'đ'})`);
    menuSummaryText = `Digital Menu (${dm.brandName}): ${cats.length} danh mục, ${items.length} món (${soldOutCount} tạm hết). Món tiêu biểu: ${sampleItems.join('; ')}`;
  }

  const summaryText = [
    `Template: ${spec.templateId || 'unknown'} | Theme mode: ${spec.theme?.mode || 'light'}`,
    `Meta Title: "${meta.title || ''}"`,
    `Meta Description: "${meta.description || ''}"`,
    `Visible Sections (${sections.length}):`,
    ...sectionLines,
  ].join('\n');

  return { summaryText, issues, menuSummaryText };
}

export async function buildServerProjectContext({
  projectId,
  slug,
  spec,
  rootDir = process.cwd(),
}) {
  let resolvedSpec = spec && typeof spec === 'object' ? spec : null;
  let resolvedSlug = sanitizeSlug(slug || '') || '';
  let resolvedProjectId = String(projectId || '').trim();

  if (!resolvedSpec || !resolvedSlug || !resolvedProjectId) {
    const projectsData = await storeGet('projects', null, rootDir);
    if (projectsData && Array.isArray(projectsData.projects)) {
      const match =
        (resolvedProjectId && projectsData.projects.find((p) => p && p.id === resolvedProjectId)) ||
        (resolvedSlug && projectsData.projects.find((p) => p && p.slug === resolvedSlug)) ||
        projectsData.projects.find((p) => p && p.id === projectsData.activeProjectId) ||
        projectsData.projects[0];
      if (match) {
        if (!resolvedProjectId) resolvedProjectId = match.id;
        if (!resolvedSlug) resolvedSlug = match.slug;
        if (!resolvedSpec) resolvedSpec = match.spec;
      }
    }
  }

  const finalProjectId = resolvedProjectId || resolvedSlug || 'default';
  const finalSlug = resolvedSlug || 'du-an-mau';

  const [memory, analytics] = await Promise.all([
    getProjectAiMemory(finalProjectId, rootDir),
    queryAnalytics({ slug: finalSlug, daysCount: 30 }, rootDir).catch(() => null),
  ]);

  const { summaryText, issues, menuSummaryText } = summarizeSpecAndAudit(resolvedSpec);

  const analyticsText = analytics
    ? `30d Analytics (${finalSlug}): PageViews=${analytics.totals.pageViews}, UniqueVisitors=${analytics.totals.uniqueVisitors}, MenuViews=${analytics.totals.menuViews}, QRVisits=${analytics.totals.qrVisits}, TopItems=[${(
        analytics.popularMenuItems || []
      )
        .slice(0, 5)
        .map((x) => `${x.name}:${x.count}`)
        .join(', ')}]`
    : 'Analytics: chưa có dữ liệu.';

  const memoryText = [
    `Industry: ${memory.brandProfile.industry || 'Chưa xác định'}`,
    `Tone: ${memory.brandProfile.tone || 'Chuyên nghiệp, tự nhiên'}`,
    `Audience: ${memory.brandProfile.audience || 'Khách hàng phổ thông'}`,
    `USP: ${memory.brandProfile.usp || 'Chưa khai báo'}`,
    `ForbiddenWords: ${memory.brandProfile.forbiddenWords.join(', ') || 'Không có'}`,
    `LearnedRules (${memory.learnedRules.length}): ${
      memory.learnedRules.length > 0
        ? memory.learnedRules.map((r, i) => `${i + 1}. ${r}`).join(' | ')
        : 'Chưa có quy tắc học thêm.'
    }`,
  ].join('\n');

  const systemContextBlock = [
    '[PROJECT CONTEXT]',
    summaryText,
    menuSummaryText,
    analyticsText,
    `AuditIssues (${issues.length}): ${issues.join(' | ') || 'Không có lỗi nghiêm trọng.'}`,
    '',
    '[LONG-TERM BRAND MEMORY]',
    memoryText,
  ].join('\n');

  return {
    projectId: finalProjectId,
    slug: finalSlug,
    spec: resolvedSpec,
    memory,
    analytics,
    issues,
    systemContextBlock,
  };
}
