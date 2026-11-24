const AI_TIMEOUT_MS = 15000;

export function getAiConfigFromEnv() {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const openaiBase = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
  const preferredModel = (process.env.AI_MODEL || '').trim();

  if (geminiKey) {
    return {
      configured: true,
      provider: 'gemini',
      model: preferredModel || 'gemini-2.5-flash',
      apiKey: geminiKey,
      baseUrl: openaiBase,
    };
  }
  if (openaiKey) {
    return {
      configured: true,
      provider: 'openai',
      model: preferredModel || 'gpt-4o-mini',
      apiKey: openaiKey,
      baseUrl: openaiBase,
    };
  }
  return {
    configured: false,
    provider: 'local',
    model: 'specpage-local-vi-v2',
    apiKey: '',
    baseUrl: openaiBase,
  };
}

function stripJsonFences(raw) {
  const trimmed = String(raw || '').trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return match ? match[1].trim() : trimmed;
}

async function callGemini(config, systemPrompt, userPrompt) {
  const model = config.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(stripJsonFences(text));
  } finally {
    clearTimeout(timer);
  }
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

function buildLocalFallback(task, input, context = {}) {
  const clean = normalizeSpacesAndPunctuation(input);
  const brand = String(context.brandName || context.projectName || 'Thương hiệu của bạn').trim();
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
        warning: `Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY trên server để dịch tự động sang ${targetLang}. Đã giữ nguyên nội dung gốc để bạn chỉnh sửa thủ công hoặc cấu hình AI key trong biến môi trường server.`,
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

export async function generateAiContent(payload) {
  const task = String(payload?.task || 'website_copy');
  const input = String(payload?.input || '').slice(0, 6000);
  const context = payload?.context && typeof payload.context === 'object' ? payload.context : {};
  const config = getAiConfigFromEnv();

  if (!config.configured) {
    const local = buildLocalFallback(task, input, context);
    return {
      ok: true,
      providerUsed: 'local',
      modelUsed: config.model,
      ...local,
    };
  }

  const targetLang = String(context.targetLanguage || 'English');
  const brandName = String(context.brandName || context.projectName || '');
  const systemPrompt = [
    'Bạn là trợ lý biên tập nội dung thương mại & SEO tiếng Việt chuyên nghiệp cho SpecPage Studio.',
    'Luôn trả về JSON hợp lệ với cấu trúc: {"text": "...", "alternatives": ["..."], "notes": ["..."]}.',
    'Không bịa đặt thông số kỹ thuật hay giá cả không có trong ngữ cảnh. Giữ giọng văn tự nhiên, chuẩn chính tả tiếng Việt.',
  ].join(' ');

  const taskInstructions = {
    autofill: 'Tóm tắt & trích xuất nội dung chuyên nghiệp cho landing page.',
    website_copy: 'Viết nội dung giới thiệu website mạch lạc, giàu sức thuyết phục.',
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
    const remote =
      config.provider === 'gemini'
        ? await callGemini(config, systemPrompt, userPrompt)
        : await callOpenAiCompatible(config, systemPrompt, userPrompt);

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
    const local = buildLocalFallback(task, input, context);
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
