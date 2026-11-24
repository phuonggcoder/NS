import {
  buildServerProjectContext,
  clampRuleWords,
} from './server-ai-memory.mjs';

const AI_TIMEOUT_MS = 15000;
const GEMINI_MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const workingGeminiModelCache = new Map();

function normalizeGeminiModelName(raw) {
  return String(raw || '')
    .trim()
    .replace(/^models\//i, '');
}

export function getAiConfigFromEnv() {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const openaiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
  const geminiBase = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com').trim();
  const preferredModel = normalizeGeminiModelName(
    process.env.GEMINI_MODEL || process.env.AI_MODEL || ''
  );

  if (geminiKey) {
    return {
      configured: true,
      provider: 'gemini',
      model: preferredModel || 'gemini-2.5-flash',
      apiKey: geminiKey,
      baseUrl: openaiBase,
      geminiBaseUrl: geminiBase,
    };
  }
  if (openaiKey) {
    return {
      configured: true,
      provider: 'openai',
      model: preferredModel || 'gpt-4o-mini',
      apiKey: openaiKey,
      baseUrl: openaiBase,
      geminiBaseUrl: geminiBase,
    };
  }
  return {
    configured: false,
    provider: 'local',
    model: 'specpage-local-vi-v2',
    apiKey: '',
    baseUrl: openaiBase,
    geminiBaseUrl: geminiBase,
  };
}

function stripJsonFences(raw) {
  const trimmed = String(raw || '').trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : trimmed;
}

async function invokeGeminiGenerate(base, apiKey, model, systemPrompt, userPrompt) {
  const cleanModel = normalizeGeminiModelName(model);
  const url = `${base}/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const errJson = await res.json();
        detail = errJson?.error?.message ? `: ${String(errJson.error.message).slice(0, 140)}` : '';
      } catch {
        // Ignore non-JSON error body
      }
      const err = new Error(`Gemini HTTP ${res.status} (${cleanModel})${detail}`);
      err.status = res.status;
      throw err;
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return { parsed: JSON.parse(stripJsonFences(text)), modelUsed: cleanModel };
  } finally {
    clearTimeout(timer);
  }
}

async function discoverGeminiGenerateModel(base, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${base}/v1beta/models`, {
      signal: controller.signal,
      headers: {
        'x-goog-api-key': apiKey,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    const supported = models.filter(
      (m) =>
        Array.isArray(m?.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        typeof m?.name === 'string' &&
        m.name.includes('gemini') &&
        !/embedding|vision-only|aqa/i.test(m.name)
    );
    const preferred =
      supported.find((m) => /flash/i.test(m.name)) ||
      supported.find((m) => /pro/i.test(m.name)) ||
      supported[0];
    return preferred ? normalizeGeminiModelName(preferred.name) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(config, systemPrompt, userPrompt) {
  const base = (config.geminiBaseUrl || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const cacheKey = `${base}|${config.apiKey.slice(-6)}|${config.model || ''}`;
  const cached = workingGeminiModelCache.get(cacheKey);

  const candidates = Array.from(
    new Set(
      [cached, normalizeGeminiModelName(config.model), ...GEMINI_MODEL_FALLBACKS].filter(Boolean)
    )
  );

  let lastErr = null;
  for (const model of candidates) {
    try {
      const result = await invokeGeminiGenerate(base, config.apiKey, model, systemPrompt, userPrompt);
      workingGeminiModelCache.set(cacheKey, result.modelUsed);
      return result.parsed;
    } catch (err) {
      lastErr = err;
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        continue;
      }
      throw err;
    }
  }

  // All static model names returned 404: discover an available model via ListModels
  const discovered = await discoverGeminiGenerateModel(base, config.apiKey);
  if (discovered && !candidates.includes(discovered)) {
    const result = await invokeGeminiGenerate(base, config.apiKey, discovered, systemPrompt, userPrompt);
    workingGeminiModelCache.set(cacheKey, result.modelUsed);
    return result.parsed;
  }

  throw lastErr || new Error('Gemini HTTP 404: Không tìm thấy model khả dụng.');
}

async function callOpenAiCompatible(config, systemPrompt, userPrompt) {
  const base = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI API HTTP ${res.status}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    return JSON.parse(stripJsonFences(content));
  } finally {
    clearTimeout(timer);
  }
}

async function callConfiguredProvider(config, systemPrompt, userPrompt) {
  if (config.provider === 'gemini') {
    return callGemini(config, systemPrompt, userPrompt);
  }
  return callOpenAiCompatible(config, systemPrompt, userPrompt);
}

const VIETNAMESE_SPELL_FIXES = [
  [/\bsan pham\b/gi, 'sản phẩm'],
  [/\bchat luong\b/gi, 'chất lượng'],
  [/\bkhuyen mai\b/gi, 'khuyến mãi'],
  [/\bkhach hang\b/gi, 'khách hàng'],
  [/\blien he\b/gi, 'liên hệ'],
  [/\bgia tot\b/gi, 'giá tốt'],
  [/\bmien phi\b/gi, 'miễn phí'],
  [/\bdich vu\b/gi, 'dịch vụ'],
  [/\buu dai\b/gi, 'ưu đãi'],
  [/\btra sua\b/gi, 'trà sữa'],
  [/\bca phe\b/gi, 'cà phê'],
  [/\s{2,}/g, ' '],
];

function normalizeSpacesAndPunctuation(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])([^\s\n\d"”’)\]])/g, '$1 $2')
    .trim();
}

function buildHolisticAuditFallback(projectCtx) {
  const spec = projectCtx?.spec || {};
  const meta = spec.meta || {};
  const sections = Array.isArray(spec.sections) ? spec.sections : [];
  const hero = sections.find((s) => s && s.type === 'hero' && s.visible);
  const cta = sections.find((s) => s && s.type === 'cta' && s.visible);
  const dm = spec.digitalMenu;
  const analytics = projectCtx?.analytics;
  const memory = projectCtx?.memory;

  const brandName =
    dm?.brandName ||
    String(meta.title || 'Thương hiệu').split('—')[0]?.trim() ||
    'Thương hiệu của bạn';
  const toneNote = memory?.brandProfile?.tone ? ` (${memory.brandProfile.tone})` : '';

  const recs = [];

  if (hero) {
    const currentHl = String(hero.headline || '').trim();
    if (currentHl.length < 18 || currentHl.length > 75) {
      recs.push({
        id: 'rec-hero-headline',
        priority: 'high',
        category: 'conversion',
        title: 'Tối ưu tiêu đề chính Hero rõ giá trị ngay 5 giây đầu',
        reason: 'Tiêu đề Hero hiện tại chưa nêu bật lợi ích cụ thể hoặc độ dài chưa tối ưu.',
        targetSectionType: 'hero',
        targetField: 'headline',
        currentValue: currentHl,
        suggestedValue: `${brandName} — Chất lượng khác biệt, trải nghiệm xứng tầm`,
      });
    }
    if (!hero.imageCaption || String(hero.imageCaption).trim().length < 8) {
      recs.push({
        id: 'rec-hero-alt',
        priority: 'medium',
        category: 'seo',
        title: 'Bổ sung mô tả ảnh (Alt Text) cho khối Hero',
        reason: 'Giúp Google hiểu nội dung hình ảnh và tăng khả năng tiếp cận (Accessibility).',
        targetSectionType: 'hero',
        targetField: 'imageCaption',
        currentValue: String(hero.imageCaption || ''),
        suggestedValue: `Hình ảnh giới thiệu sản phẩm và dịch vụ nổi bật của ${brandName}`,
      });
    }
  }

  const descLen = String(meta.description || '').trim().length;
  if (descLen < 50 || descLen > 160) {
    recs.push({
      id: 'rec-meta-desc',
      priority: 'high',
      category: 'seo',
      title: 'Chuẩn hóa Meta Description (50–160 ký tự) tăng CTR Google',
      reason: `Meta Description hiện dài ${descLen} ký tự. Độ dài chuẩn giúp hiển thị trọn vẹn trên kết quả tìm kiếm.`,
      targetSectionType: 'meta',
      targetField: 'description',
      currentValue: String(meta.description || ''),
      suggestedValue: `Khám phá ${brandName}${toneNote}: thông tin minh bạch, bảng giá & thực đơn mới nhất, đặt lịch hoặc đặt món nhanh chóng chỉ với 1 chạm.`,
    });
  }

  if (cta && (!cta.primaryLabel || String(cta.primaryLabel).length < 6)) {
    recs.push({
      id: 'rec-cta-label',
      priority: 'medium',
      category: 'conversion',
      title: 'Làm rõ nút hành động CTA cuối trang',
      reason: 'Nút CTA mang tính hành động cụ thể giúp tăng tỷ lệ bấm chốt đơn hoặc đặt lịch.',
      targetSectionType: 'cta',
      targetField: 'primaryLabel',
      currentValue: String(cta.primaryLabel || ''),
      suggestedValue: 'Đặt lịch / Nhận tư vấn ngay',
    });
  }

  if (dm && dm.enabled && Array.isArray(dm.items)) {
    const shortItem = dm.items.find((it) => !it.description || it.description.trim().length < 20);
    if (shortItem) {
      recs.push({
        id: `rec-menu-${shortItem.id}`,
        priority: 'medium',
        category: 'menu',
        title: `Làm hấp dẫn mô tả món "${shortItem.name}"`,
        reason: 'Mô tả món ăn chi tiết nguyên liệu và hương vị giúp khách gọi món QR nhanh hơn.',
        targetSectionType: 'menu_item',
        targetField: shortItem.id,
        currentValue: String(shortItem.description || ''),
        suggestedValue: `${shortItem.name} chế biến tươi mới mỗi ngày từ nguyên liệu chọn lọc, hương vị cân bằng dễ thưởng thức.`,
      });
    }
  }

  if (recs.length < 3 && hero) {
    recs.push({
      id: 'rec-hero-sub',
      priority: 'medium',
      category: 'copy',
      title: 'Củng cố đoạn mô tả phụ (Subheadline) theo USP thương hiệu',
      reason:
        analytics && analytics.totals.pageViews > 0
          ? `Trang đang có ${analytics.totals.pageViews} lượt xem (${analytics.totals.qrVisits} lượt QR); làm rõ USP ngay đầu trang sẽ cải thiện chuyển đổi.`
          : 'Nêu rõ điểm khác biệt (USP) và lời hứa dịch vụ ngay dưới tiêu đề chính.',
      targetSectionType: 'hero',
      targetField: 'subheadline',
      currentValue: String(hero.subheadline || ''),
      suggestedValue:
        memory?.brandProfile?.usp ||
        `${brandName} cam kết chất lượng chuẩn xác, minh bạch chi phí và phục vụ tận tâm ngay từ lần trải nghiệm đầu tiên.`,
    });
  }

  const top5 = recs.slice(0, 5);
  return {
    summary: `Đã phân tích tổng thể trang${dm?.enabled ? ' + Digital Menu' : ''} và ${
      memory?.learnedRules?.length || 0
    } quy tắc ghi nhớ thương hiệu. Đề xuất ${top5.length} cải tiến ưu tiên nhất:`,
    recommendations: top5,
  };
}

function buildLocalFallback(task, input, context = {}, projectCtx = null) {
  if (task === 'holistic_audit') {
    return buildHolisticAuditFallback(projectCtx);
  }

  const clean = normalizeSpacesAndPunctuation(input);
  const brand = String(
    context.brandName ||
      context.projectName ||
      projectCtx?.spec?.meta?.title?.split('—')[0] ||
      'Thương hiệu của bạn'
  ).trim();
  const targetLang = String(context.targetLanguage || 'English').trim();

  switch (task) {
    case 'website_copy':
      return {
        text: `${brand} mang đến giải pháp chuyên nghiệp, minh bạch và tối ưu trải nghiệm khách hàng.\n\n• Quy trình rõ ràng, bàn giao đúng hẹn.\n• Chất lượng kiểm chứng với hàng trăm khách hàng tin chọn.\n• Hỗ trợ tư vấn nhanh chóng 1-1 qua Hotline & Zalo.\n\n${clean ? `Điểm nhấn chính: ${clean}` : 'Liên hệ ngay hôm nay để nhận tư vấn và ưu đãi dành riêng cho bạn.'}`,
        alternatives: [
          `${brand} — Nâng tầm trải nghiệm và hiệu quả cho bạn ngay hôm nay.`,
          `Chọn ${brand} để an tâm về chất lượng, tiến độ và chi phí minh bạch.`,
        ],
      };

    case 'product_desc':
      return {
        text: `${clean || 'Sản phẩm cao cấp'} được tuyển chọn kỹ lưỡng nhằm mang lại hiệu quả thực tế và độ bền vượt trội. Thiết kế tinh gọn, dễ sử dụng ngay từ lần đầu, đi kèm chính sách bảo hành & hỗ trợ tận tâm từ ${brand}.`,
        alternatives: [
          `Giải pháp tối ưu từ ${brand}: ${clean || 'Sản phẩm chủ lực'} — Giá trị thật, bảo hành rõ ràng.`,
        ],
      };

    case 'menu_item_desc':
      return {
        text: `${clean || 'Món đặc trưng'} được chế biến tươi mới mỗi ngày từ nguyên liệu chọn lọc, cân bằng hương vị đậm đà và thanh nhẹ. Phù hợp thưởng thức tại quán hoặc mang đi, có thể tùy chỉnh Size, đường, đá và topping theo sở thích.`,
        alternatives: [
          `Hương vị signature tại ${brand}: tươi ngon mỗi ngày, đậm vị tự nhiên.`,
        ],
      };

    case 'headlines': {
      const topic = clean || brand;
      return {
        text: `1. ${topic} — Chuẩn chất lượng, trọn niềm tin\n2. Trải nghiệm ${topic} khác biệt ngay hôm nay\n3. Giải pháp ${topic} tối ưu chi phí & thời gian\n4. Hàng ngàn khách hàng đã tin chọn ${topic}\n5. ${topic}: Tinh tế trong từng chi tiết`,
        alternatives: [
          `${topic} — Chuẩn mực mới cho trải nghiệm của bạn`,
          `Đặt lịch / Gọi món tại ${topic} chỉ trong 30 giây`,
        ],
      };
    }

    case 'ad_copy':
      return {
        text: `🔥 ƯU ĐÃI ĐẶC BIỆT TỪ ${brand.toUpperCase()}\n\nBạn đang tìm ${clean || 'sản phẩm/dịch vụ chất lượng với chi phí hợp lý'}?\n✅ Cam kết chất lượng chuẩn xác\n✅ Tư vấn & phục vụ nhanh chóng\n✅ Quà tặng / ưu đãi hấp dẫn khi đặt hôm nay\n\n👉 Nhấn đặt ngay hoặc nhắn tin để giữ suất ưu đãi!`,
        alternatives: [
          `✨ Trải nghiệm ${clean || brand} ngay hôm nay — Nhanh gọn, chuẩn gu, giá hợp lý!`,
        ],
      };

    case 'normalize': {
      const normalized = clean
        .split('\n')
        .map((line) => {
          const t = line.trim();
          if (!t) return '';
          return t.charAt(0).toUpperCase() + t.slice(1);
        })
        .join('\n');
      return { text: normalized };
    }

    case 'spellcheck': {
      let fixed = clean;
      const notes = [];
      for (const [pattern, replacement] of VIETNAMESE_SPELL_FIXES) {
        if (pattern.test(fixed)) {
          fixed = fixed.replace(pattern, replacement);
          notes.push(`Đã chuẩn hóa cụm "${replacement}"`);
        }
      }
      fixed = normalizeSpacesAndPunctuation(fixed);
      return {
        text: fixed,
        notes:
          notes.length > 0
            ? notes
            : ['Không phát hiện lỗi khoảng trắng hoặc từ không dấu phổ biến. Đã chuẩn hóa dấu câu.'],
      };
    }

    case 'translate': {
      return {
        text: clean,
        warning: `Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY trên server để dịch tự động sang ${targetLang}. Đã giữ nguyên nội dung gốc để bạn chỉnh sửa thủ công.`,
      };
    }

    case 'seo_suggestions': {
      const titleBase = clean || brand;
      return {
        text: `Tiêu đề SEO đề xuất (${Math.min(60, titleBase.length + 28)} ký tự):\n${titleBase} | Chính hãng & Đặt nhanh trực tuyến\n\nMô tả Meta SEO đề xuất:\nKhám phá ${titleBase} với thông tin minh bạch, hình ảnh thực tế, bảng giá & thực đơn mới nhất. Đặt lịch hoặc gọi món nhanh chỉ với 1 chạm.`,
        alternatives: [
          `${titleBase} — Chất lượng hàng đầu, hỗ trợ tận tâm`,
        ],
      };
    }

    default:
      return { text: clean };
  }
}

export async function generateAiContent(payload, options = {}) {
  const task = String(payload?.task || 'website_copy');
  const input = String(payload?.input || '').slice(0, 6000);
  const context = payload?.context && typeof payload.context === 'object' ? payload.context : {};
  const rootDir = options.rootDir || process.cwd();
  const config = getAiConfigFromEnv();

  const projectCtx = await buildServerProjectContext({
    projectId: payload?.projectId || context.projectId,
    slug: payload?.slug || context.slug,
    spec: payload?.spec,
    rootDir,
  }).catch(() => null);

  if (!config.configured) {
    const local = buildLocalFallback(task, input, context, projectCtx);
    return {
      ok: true,
      providerUsed: 'local',
      modelUsed: config.model,
      ...local,
    };
  }

  const targetLang = String(context.targetLanguage || 'English');
  const brandName = String(
    context.brandName ||
      context.projectName ||
      projectCtx?.spec?.meta?.title?.split('—')[0] ||
      ''
  );

  const systemInstruction = [
    'Bạn là Giám đốc Sáng tạo, Kiến trúc sư CRO & Chuyên gia SEO tiếng Việt của SpecPage Studio.',
    'Luôn tuân thủ tuyệt đối [LONG-TERM BRAND MEMORY] (tông giọng, đối tượng, USP, từ cấm và các learnedRules) cùng [PROJECT CONTEXT] dưới đây.',
    projectCtx?.systemContextBlock || '',
    task === 'holistic_audit'
      ? 'Trả về JSON hợp lệ: {"summary": "...", "recommendations": [{"id": "...", "priority": "high|medium|low", "category": "seo|conversion|copy|menu|design", "title": "...", "reason": "...", "targetSectionType": "hero|meta|cta|products|menu_item", "targetField": "headline|subheadline|description|title|primaryLabel|<menuItemId>", "currentValue": "...", "suggestedValue": "..."}]} gồm tối đa 5 đề xuất giá trị cao nhất.'
      : 'Luôn trả về JSON hợp lệ với cấu trúc: {"text": "...", "alternatives": ["..."], "notes": ["..."]}. Không bịa thông số kỹ thuật hay giá cả không có trong ngữ cảnh.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const taskInstructions = {
    holistic_audit:
      'Đọc toàn bộ LandingPageSpec, DigitalMenu, lỗi SEO và chỉ số Analytics trong systemInstruction. Đề xuất top 5 cải thiện cụ thể có thể Apply 1 chạm.',
    autofill: 'Tóm tắt & trích xuất nội dung chuyên nghiệp cho landing page.',
    website_copy: 'Viết nội dung giới thiệu website mạch lạc, đúng tông giọng thương hiệu.',
    product_desc: 'Viết mô tả sản phẩm súc tích, nêu rõ lợi ích và kêu gọi hành động.',
    menu_item_desc: 'Viết mô tả món ăn / đồ uống hấp dẫn, gợi hương vị và nguyên liệu.',
    headlines: 'Gợi ý 5 tiêu đề ngắn gọn, thu hút chuyển đổi.',
    ad_copy: 'Viết mẫu nội dung quảng cáo ngắn (Facebook/Zalo) có điểm nhấn và CTA.',
    normalize: 'Chuẩn hóa văn phong, ngắt đoạn rõ ràng, giữ nguyên ý nghĩa gốc.',
    translate: `Dịch chính xác và tự nhiên nội dung sang ngôn ngữ: ${targetLang}.`,
    spellcheck: 'Kiểm tra và sửa lỗi chính tả, dấu câu tiếng Việt, liệt kê các lỗi đã sửa trong notes.',
    seo_suggestions: 'Đề xuất Meta Title (<= 60 ký tự), Meta Description (<= 155 ký tự) và từ khóa SEO.',
  };

  const userPrompt = JSON.stringify({
    task,
    instruction: taskInstructions[task] || taskInstructions.website_copy,
    brandName,
    targetLanguage: targetLang,
    input,
  });

  try {
    const remote = await callConfiguredProvider(config, systemInstruction, userPrompt);

    if (task === 'holistic_audit') {
      const recs = Array.isArray(remote?.recommendations) ? remote.recommendations.slice(0, 5) : [];
      if (recs.length === 0) {
        throw new Error('AI không trả về danh sách đề xuất hợp lệ');
      }
      return {
        ok: true,
        providerUsed: config.provider,
        modelUsed: config.model,
        summary:
          typeof remote.summary === 'string' && remote.summary.trim()
            ? remote.summary.trim()
            : `AI (${config.provider}) đã phân tích toàn trang và đề xuất ${recs.length} cải tiến.`,
        recommendations: recs.map((r, idx) => ({
          id: String(r?.id || `ai-rec-${idx + 1}`),
          priority: r?.priority === 'high' || r?.priority === 'low' ? r.priority : 'medium',
          category: String(r?.category || 'conversion'),
          title: String(r?.title || 'Gợi ý tối ưu'),
          reason: String(r?.reason || ''),
          targetSectionType: String(r?.targetSectionType || 'hero'),
          targetField: String(r?.targetField || 'subheadline'),
          currentValue: String(r?.currentValue || ''),
          suggestedValue: String(r?.suggestedValue || ''),
        })),
      };
    }

    const text = typeof remote?.text === 'string' && remote.text.trim() ? remote.text.trim() : null;
    if (!text) {
      throw new Error('AI trả về nội dung rỗng');
    }
    return {
      ok: true,
      providerUsed: config.provider,
      modelUsed: config.model,
      text,
      alternatives: Array.isArray(remote.alternatives) ? remote.alternatives.slice(0, 5) : [],
      notes: Array.isArray(remote.notes) ? remote.notes.slice(0, 8) : [],
    };
  } catch (err) {
    const local = buildLocalFallback(task, input, context, projectCtx);
    return {
      ok: true,
      providerUsed: 'local',
      modelUsed: 'specpage-local-vi-v2',
      ...local,
      warning: `AI provider (${config.provider}) không phản hồi (${
        err instanceof Error ? err.message : 'Lỗi kết nối'
      }), đã chuyển sang chế độ cục bộ an toàn.`,
    };
  }
}

function buildLocalRuleHeuristic({ taskType, aiOutput, userFinalOutput, action, note }) {
  if (note && String(note).trim()) {
    return clampRuleWords(String(note).trim(), 20);
  }
  const aiText = String(aiOutput || '').trim();
  const userText = String(userFinalOutput || '').trim();

  if (action === 'rejected') {
    if (taskType === 'headlines') return 'Tránh viết tiêu đề quá dài hoặc chung chung không nêu lợi ích.';
    if (taskType === 'menu_item_desc') return 'Mô tả món cần ngắn gọn, thực tế, tránh từ ngữ sáo rỗng.';
    return `Người dùng từ chối gợi ý kiểu "${taskType}", cần sát thực tế thương hiệu hơn.`;
  }

  if (action === 'edited' && userText) {
    if (userText.length < aiText.length * 0.75) {
      return 'Ưu tiên câu chữ ngắn gọn, súc tích hơn so với bản AI gốc.';
    }
    if (/[!]/.test(userText) && !/[!]/.test(aiText)) {
      return 'Giữ giọng văn năng lượng, thân thiện và có điểm nhấn kêu gọi hành động.';
    }
    if (/\d/.test(userText) && !/\d/.test(aiText)) {
      return 'Luôn kèm con số, giá hoặc định lượng cụ thể trong nội dung.';
    }
    return 'Điều chỉnh câu chữ tự nhiên, sát văn phong riêng của chủ thương hiệu.';
  }

  return '';
}

export async function extractLearnedRuleFromFeedback({
  taskType,
  aiOutput,
  userFinalOutput,
  action,
  note,
  memory,
}) {
  if (action !== 'edited' && action !== 'rejected') {
    return '';
  }

  const config = getAiConfigFromEnv();
  if (!config.configured) {
    return buildLocalRuleHeuristic({ taskType, aiOutput, userFinalOutput, action, note });
  }

  const systemPrompt = [
    'Bạn là hệ thống học sở thích biên tập nội dung tiếng Việt.',
    'Hãy rút ra ĐÚNG 1 quy tắc ngắn gọn dưới 20 từ về gu nội dung của người dùng từ sự khác biệt giữa aiOutput và userFinalOutput (hoặc lý do từ chối).',
    'Trả về JSON: {"rule": "..."}. Quy tắc phải chung áp dụng cho các lần sau, không lặp lại các quy tắc đã có.',
  ].join(' ');

  const userPrompt = JSON.stringify({
    taskType,
    action,
    aiOutput: String(aiOutput || '').slice(0, 800),
    userFinalOutput: String(userFinalOutput || '').slice(0, 800),
    note: String(note || '').slice(0, 240),
    existingRules: memory?.learnedRules || [],
  });

  try {
    const res = await callConfiguredProvider(config, systemPrompt, userPrompt);
    const distilled = clampRuleWords(res?.rule || '', 20);
    if (distilled) return distilled;
  } catch {
    // Fall back to deterministic rule extraction
  }

  return buildLocalRuleHeuristic({ taskType, aiOutput, userFinalOutput, action, note });
}
