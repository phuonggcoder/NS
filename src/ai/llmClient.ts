import type { LandingPageSpec } from '../types/spec';
import { cloneSpec, generateId } from '../utils/storage';
import type {
  AiCopyResult,
  AiCopyTask,
  AiServerStatus,
  AiSuggestion,
  AutoFillResult,
} from './aiTypes';
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

export async function generateAiCopy(params: {
  task: AiCopyTask;
  input: string;
  brandName?: string;
  targetLanguage?: string;
}): Promise<AiCopyResult> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: params.task,
        input: params.input,
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
  currentSpec: LandingPageSpec
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
  spec: LandingPageSpec
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
        sectionLabel: 'Hero Mở đầu (Server AI)',
        title: 'AI gợi ý tiêu đề Hero tăng tỷ lệ chuyển đổi',
        description: 'Gợi ý từ AI phía server — xem thử trước khi áp dụng.',
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
