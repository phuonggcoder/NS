import type { LandingPageSpec } from '../types/spec';
import { cloneSpec, generateId } from '../utils/storage';
import type { AiProviderSettings, AiSuggestion, AutoFillResult } from './aiTypes';
import { runLocalAudit } from './localAuditor';
import { extractAutoFillLocal } from './localAutoFill';

const AI_SETTINGS_KEY = 'specpage_ai_settings_v1';

export const DEFAULT_AI_SETTINGS: AiProviderSettings = {
  mode: 'local',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gemini-2.5-flash',
};

export function loadAiSettings(): AiProviderSettings {
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    return { ...DEFAULT_AI_SETTINGS, ...(JSON.parse(raw) as Partial<AiProviderSettings>) };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings: AiProviderSettings): void {
  try {
    window.localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage error
  }
}

async function callRemoteJsonPrompt(
  settings: AiProviderSettings,
  systemPrompt: string,
  userPrompt: string
): Promise<unknown> {
  if (settings.mode === 'gemini') {
    const model = settings.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(text);
  }

  const base = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

export async function runAutoFill(
  rawText: string,
  currentSpec: LandingPageSpec,
  settings: AiProviderSettings
): Promise<AutoFillResult> {
  const localResult = extractAutoFillLocal(rawText, currentSpec);
  if (settings.mode === 'local' || !settings.apiKey.trim()) {
    return localResult;
  }

  try {
    const systemPrompt =
      'Bạn là chuyên gia copywriting & cấu trúc Landing Page tiếng Việt. Trả về JSON hợp lệ với các trường: brandName, metaTitle, metaDescription, heroHeadline, heroHighlight, heroSubheadline, aboutTitle, aboutRole, aboutBio, phone, email, address, products (mảng {name, price, originalPrice, description, features}), faqs (mảng {question, answer}). Chỉ trích xuất và viết lại chuyên nghiệp dựa trên thông tin người dùng dán.';
    const remote = (await callRemoteJsonPrompt(settings, systemPrompt, rawText)) as Record<
      string,
      unknown
    >;

    return {
      ...localResult,
      sourceMode: settings.mode,
      brandName: typeof remote.brandName === 'string' ? remote.brandName : localResult.brandName,
      meta: {
        title: typeof remote.metaTitle === 'string' ? remote.metaTitle : localResult.meta?.title,
        description:
          typeof remote.metaDescription === 'string'
            ? remote.metaDescription
            : localResult.meta?.description,
      },
      hero: {
        ...localResult.hero,
        headline:
          typeof remote.heroHeadline === 'string'
            ? remote.heroHeadline
            : localResult.hero?.headline,
        highlightText:
          typeof remote.heroHighlight === 'string'
            ? remote.heroHighlight
            : localResult.hero?.highlightText,
        subheadline:
          typeof remote.heroSubheadline === 'string'
            ? remote.heroSubheadline
            : localResult.hero?.subheadline,
      },
      about: {
        ...localResult.about,
        title:
          typeof remote.aboutTitle === 'string' ? remote.aboutTitle : localResult.about?.title,
        role: typeof remote.aboutRole === 'string' ? remote.aboutRole : localResult.about?.role,
        bio: typeof remote.aboutBio === 'string' ? remote.aboutBio : localResult.about?.bio,
      },
      contact: {
        ...localResult.contact,
        phone: typeof remote.phone === 'string' ? remote.phone : localResult.contact?.phone,
        email: typeof remote.email === 'string' ? remote.email : localResult.contact?.email,
        address: typeof remote.address === 'string' ? remote.address : localResult.contact?.address,
      },
      summary: [`Đã phân tích bằng ${settings.mode.toUpperCase()} AI`, ...localResult.summary],
    };
  } catch (err) {
    return {
      ...localResult,
      sourceMode: 'local',
      warning: `Không gọi được API ngoài (${err instanceof Error ? err.message : 'Lỗi kết nối'}), đã tự động dùng AI Cục bộ.`,
    };
  }
}

export async function runAudit(
  spec: LandingPageSpec,
  settings: AiProviderSettings
): Promise<{ suggestions: AiSuggestion[]; warning?: string }> {
  const localSuggestions = runLocalAudit(spec);
  if (settings.mode === 'local' || !settings.apiKey.trim()) {
    return { suggestions: localSuggestions };
  }

  try {
    const hero = spec.sections.find((s) => s.type === 'hero');
    const summaryPayload = {
      title: spec.meta.title,
      hero:
        hero && hero.type === 'hero'
          ? { id: hero.id, headline: hero.headline, subheadline: hero.subheadline }
          : null,
    };

    const systemPrompt =
      'Bạn là biên tập viên CRO tiếng Việt. Trả về JSON {"improvedHeroHeadline": "...", "improvedHeroSubheadline": "...", "reason": "..."} giúp tiêu đề & mô tả hấp dẫn, chuẩn chính tả hơn.';
    const remote = (await callRemoteJsonPrompt(
      settings,
      systemPrompt,
      JSON.stringify(summaryPayload)
    )) as {
      improvedHeroHeadline?: string;
      improvedHeroSubheadline?: string;
      reason?: string;
    };

    const extra: AiSuggestion[] = [];
    if (
      hero &&
      hero.type === 'hero' &&
      remote.improvedHeroHeadline &&
      remote.improvedHeroHeadline !== hero.headline
    ) {
      const nextHeadline = remote.improvedHeroHeadline;
      const nextSub = remote.improvedHeroSubheadline || hero.subheadline;
      extra.push({
        id: generateId('sug-llm-hero'),
        category: 'content',
        severity: 'tip',
        sectionId: hero.id,
        sectionLabel: 'Hero Mở đầu (AI)',
        title: 'AI gợi ý tối ưu câu chữ Hero tăng chuyển đổi',
        description: remote.reason || 'Làm câu chữ thu hút và rõ giá trị hơn với khách hàng.',
        beforePreview: hero.headline,
        afterPreview: nextHeadline,
        status: 'pending',
        applyPatch: (current) => {
          const next = cloneSpec(current);
          const target = next.sections.find((s) => s.id === hero.id);
          if (target && target.type === 'hero') {
            target.headline = nextHeadline;
            target.subheadline = nextSub;
          }
          return next;
        },
      });
    }

    return { suggestions: [...extra, ...localSuggestions] };
  } catch (err) {
    return {
      suggestions: localSuggestions,
      warning: `API ngoài lỗi (${err instanceof Error ? err.message : 'Network'}), đang hiển thị kết quả kiểm tra cục bộ.`,
    };
  }
}
