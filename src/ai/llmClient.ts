import type { LandingPageSpec } from '../types/spec';
import { cloneSpec, generateId } from '../utils/storage';
import type {
  AiBrandMemory,
  AiCopyResult,
  AiCopyTask,
  AiFeedbackPayload,
  AiHolisticAuditResult,
  AiServerStatus,
  AiSuggestion,
  AutoFillResult,
} from './aiTypes';
import { buildClientSpecContext } from './contextBuilder';
import { runLocalAudit } from './localAuditor';
import { extractAutoFillLocal } from './localAutoFill';

export async function fetchAiServerStatus(): Promise<AiServerStatus> {
  try {
    const res = await fetch('/api/ai/status', { credentials: 'same-origin' });
    if (!res.ok) {
      return { configured: false, provider: 'local', model: 'specpage-local-vi-v2' };
    }
    const data = (await res.json()) as Partial<AiServerStatus>;
    return {
      configured: Boolean(data.configured),
      provider: data.provider || 'local',
      model: data.model || 'specpage-local-vi-v2',
    };
  } catch {
    return { configured: false, provider: 'local', model: 'specpage-local-vi-v2' };
  }
}

export async function fetchAiMemory(projectId: string): Promise<AiBrandMemory | null> {
  try {
    const res = await fetch(`/api/ai/memory?projectId=${encodeURIComponent(projectId)}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; memory?: AiBrandMemory };
    return data.ok && data.memory ? data.memory : null;
  } catch {
    return null;
  }
}

export async function saveAiMemory(
  projectId: string,
  memory: Partial<AiBrandMemory>
): Promise<{ ok: boolean; memory?: AiBrandMemory; error?: string }> {
  try {
    const res = await fetch('/api/ai/memory', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        brandProfile: memory.brandProfile,
        learnedRules: memory.learnedRules,
        optimizationLog: memory.optimizationLog,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; memory?: AiBrandMemory; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Không thể lưu Brand Memory.' };
    }
    return { ok: true, memory: data.memory };
  } catch {
    return { ok: false, error: 'Lỗi kết nối server.' };
  }
}

export async function submitAiFeedback(
  payload: AiFeedbackPayload
): Promise<{ ok: boolean; learnedRule?: string; memory?: AiBrandMemory }> {
  try {
    const res = await fetch('/api/ai/feedback', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
      ok?: boolean;
      learnedRule?: string;
      memory?: AiBrandMemory;
    };
    return {
      ok: Boolean(data.ok),
      learnedRule: data.learnedRule,
      memory: data.memory,
    };
  } catch {
    return { ok: false };
  }
}

export async function runHolisticAiAudit(params: {
  projectId: string;
  slug: string;
  spec: LandingPageSpec;
}): Promise<AiHolisticAuditResult> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'holistic_audit',
        projectId: params.projectId,
        slug: params.slug,
        spec: buildClientSpecContext(params.spec),
        input: 'Phân tích tổng thể website, Digital Menu và đề xuất top 5 cải thiện.',
      }),
    });
    const data = (await res.json()) as Partial<AiHolisticAuditResult> & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return {
      ok: true,
      providerUsed: data.providerUsed || 'local',
      modelUsed: data.modelUsed || 'specpage-local-vi-v2',
      summary: data.summary || 'Đã hoàn tất phân tích tổng thể trang.',
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      warning: data.warning,
    };
  } catch (err) {
    return {
      ok: false,
      providerUsed: 'local',
      modelUsed: 'fallback',
      summary: 'Không thể kết nối server AI Audit.',
      recommendations: [],
      warning: err instanceof Error ? err.message : 'Lỗi kết nối.',
    };
  }
}

export async function generateAiCopy(params: {
  task: AiCopyTask;
  input: string;
  brandName?: string;
  targetLanguage?: string;
  projectId?: string;
  slug?: string;
  spec?: LandingPageSpec;
}): Promise<AiCopyResult> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: params.task,
        input: params.input,
        projectId: params.projectId,
        slug: params.slug,
        spec: params.spec ? buildClientSpecContext(params.spec) : undefined,
        context: {
          brandName: params.brandName,
          targetLanguage: params.targetLanguage,
        },
      }),
    });
    const data = (await res.json()) as Partial<AiCopyResult> & { error?: string };
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return {
      ok: true,
      providerUsed: data.providerUsed || 'local',
      modelUsed: data.modelUsed || 'specpage-local-vi-v2',
      text: data.text || params.input,
      alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      warning: data.warning,
    };
  } catch (err) {
    return {
      ok: false,
      providerUsed: 'local',
      modelUsed: 'fallback',
      text: params.input,
      warning: `Không kết nối được server AI (${err instanceof Error ? err.message : 'Lỗi mạng'}).`,
    };
  }
}

export async function runAutoFill(
  rawText: string,
  currentSpec: LandingPageSpec,
  projectId?: string,
  slug?: string
): Promise<AutoFillResult> {
  const localResult = extractAutoFillLocal(rawText, currentSpec);
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'website_copy',
        input: rawText,
        projectId,
        slug,
        spec: buildClientSpecContext(currentSpec),
        context: { brandName: currentSpec.meta.title },
      }),
    });
    if (!res.ok) return localResult;
    const data = (await res.json()) as AiCopyResult;
    if (data.providerUsed !== 'local' && data.text) {
      return {
        ...localResult,
        sourceMode: data.providerUsed,
        summary: [`Đã phân tích qua Server AI (${data.providerUsed})`, ...localResult.summary],
        warning: data.warning,
      };
    }
    return { ...localResult, warning: data.warning };
  } catch {
    return localResult;
  }
}

export async function runAudit(
  spec: LandingPageSpec,
  projectId?: string,
  slug?: string
): Promise<{ suggestions: AiSuggestion[]; warning?: string }> {
  const localSuggestions = runLocalAudit(spec);
  const hero = spec.sections.find((s) => s.type === 'hero');
  if (!hero || hero.type !== 'hero') {
    return { suggestions: localSuggestions };
  }

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'headlines',
        input: `${hero.headline} — ${hero.subheadline}`,
        projectId,
        slug,
        spec: buildClientSpecContext(spec),
        context: { brandName: spec.meta.title },
      }),
    });
    if (!res.ok) return { suggestions: localSuggestions };
    const data = (await res.json()) as AiCopyResult;
    const altHeadline = data.alternatives?.[0];
    if (data.providerUsed !== 'local' && altHeadline && altHeadline !== hero.headline) {
      const extra: AiSuggestion = {
        id: generateId('sug-llm-hero'),
        category: 'content',
        severity: 'tip',
        sectionId: hero.id,
        sectionLabel: 'Hero Mở đầu (Gemini AI)',
        title: 'AI gợi ý tiêu đề Hero tăng tỷ lệ chuyển đổi',
        description: 'Gợi ý theo ngữ cảnh & trí nhớ thương hiệu — xem thử trước khi áp dụng.',
        beforePreview: hero.headline,
        afterPreview: altHeadline,
        status: 'pending',
        applyPatch: (current) => {
          const next = cloneSpec(current);
          const target = next.sections.find((s) => s.id === hero.id);
          if (target && target.type === 'hero') {
            target.headline = altHeadline;
          }
          return next;
        },
      };
      return { suggestions: [extra, ...localSuggestions], warning: data.warning };
    }
    return { suggestions: localSuggestions, warning: data.warning };
  } catch {
    return { suggestions: localSuggestions };
  }
}
