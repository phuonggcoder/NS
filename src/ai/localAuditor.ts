import { getSectionLabel } from '../data/templates';
import type { LandingPageSpec, LandingSection, SectionSurface } from '../types/spec';
import {
  auditThemeContrast,
  autoFixThemeContrast,
  contrastRatio,
  derivePaletteForMode,
  pickReadableText,
} from '../utils/contrast';
import { cloneSpec, generateId } from '../utils/storage';
import type { AiSuggestion } from './aiTypes';

function vnRule(wrongPattern: string, replacement: string, label: string): [RegExp, string, string] {
  return [
    new RegExp(`(?<![A-Za-zÀ-ỹ0-9])${wrongPattern}(?![A-Za-zÀ-ỹ0-9])`, 'gi'),
    replacement,
    label,
  ];
}

const VIETNAMESE_TYPO_RULES: [RegExp, string, string][] = [
  vnRule('sản phầm', 'sản phẩm', 'sản phầm → sản phẩm'),
  vnRule('khách hang', 'khách hàng', 'khách hang → khách hàng'),
  vnRule('chuyên nghiêp', 'chuyên nghiệp', 'chuyên nghiêp → chuyên nghiệp'),
  vnRule('miển phí', 'miễn phí', 'miển phí → miễn phí'),
  vnRule('hổ trợ', 'hỗ trợ', 'hổ trợ → hỗ trợ'),
  vnRule('trãi nghiệm', 'trải nghiệm', 'trãi nghiệm → trải nghiệm'),
  vnRule('bảo hanh', 'bảo hành', 'bảo hanh → bảo hành'),
  vnRule('đặt hang', 'đặt hàng', 'đặt hang → đặt hàng'),
  vnRule('chất lương', 'chất lượng', 'chất lương → chất lượng'),
  vnRule('sữ dụng', 'sử dụng', 'sữ dụng → sử dụng'),
  vnRule('sử dung', 'sử dụng', 'sử dung → sử dụng'),
  vnRule('liên hê', 'liên hệ', 'liên hê → liên hệ'),
  vnRule('giới thiêu', 'giới thiệu', 'giới thiêu → giới thiệu'),
  vnRule('công nghê', 'công nghệ', 'công nghê → công nghệ'),
  vnRule('thiết kếs', 'thiết kế', 'thiết kếs → thiết kế'),
  vnRule('thương hiêu', 'thương hiệu', 'thương hiêu → thương hiệu'),
  vnRule('dich vụ', 'dịch vụ', 'dich vụ → dịch vụ'),
  vnRule('kinh nghiêm', 'kinh nghiệm', 'kinh nghiêm → kinh nghiệm'),
  vnRule('hiện đai', 'hiện đại', 'hiện đai → hiện đại'),
  vnRule('thông tin chi tiêt', 'thông tin chi tiết', 'chi tiêt → chi tiết'),
  vnRule('đăng ki', 'đăng ký', 'đăng ki → đăng ký'),
  vnRule('tư vân', 'tư vấn', 'tư vân → tư vấn'),
  vnRule('hoàn tiên', 'hoàn tiền', 'hoàn tiên → hoàn tiền'),
  vnRule('trọn đơi', 'trọn đời', 'trọn đơi → trọn đời'),
  vnRule('câu hoi', 'câu hỏi', 'câu hoi → câu hỏi'),
  vnRule('thường gập', 'thường gặp', 'thường gập → thường gặp'),
  vnRule('nhân viên\\s+tư\\s+vân', 'nhân viên tư vấn', 'tư vân → tư vấn'),
  vnRule('giá tri', 'giá trị', 'giá tri → giá trị'),
  vnRule('mục tiêu\\s+mục tiêu', 'mục tiêu', 'lặp từ "mục tiêu"'),
  vnRule('([A-Za-zÀ-ỹ0-9]+)\\s+\\1', '$1', 'lặp từ liên tiếp'),
];

function preserveFirstCase(original: string, replacement: string): string {
  if (!original) return replacement;
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function fixVietnameseText(text: string): { fixed: string; notes: string[] } {
  let result = text;
  const notes: string[] = [];

  for (const [pattern, replacement, label] of VIETNAMESE_TYPO_RULES) {
    const next = result.replace(pattern, (match, p1) => {
      if (replacement === '$1' && p1) return p1;
      return preserveFirstCase(match, replacement);
    });
    if (next !== result) {
      result = next;
      notes.push(label);
    }
  }

  if (/[ ]{2,}/.test(result)) {
    result = result.replace(/[ ]{2,}/g, ' ');
    notes.push('khoảng trắng thừa');
  }

  if (/\s+([,.?!:;])/.test(result)) {
    result = result.replace(/\s+([,.?!:;])/g, '$1');
    notes.push('khoảng trắng trước dấu câu');
  }

  return { fixed: result.trim(), notes };
}

function collectTextFields(
  section: LandingSection
): { label: string; get: () => string; set: (sec: LandingSection, val: string) => void }[] {
  const fields: {
    label: string;
    get: () => string;
    set: (sec: LandingSection, val: string) => void;
  }[] = [];

  switch (section.type) {
    case 'navbar':
      fields.push({
        label: 'Logo',
        get: () => section.logoText,
        set: (s, v) => { if (s.type === 'navbar') s.logoText = v; },
      });
      fields.push({
        label: 'Nút CTA',
        get: () => section.ctaLabel,
        set: (s, v) => { if (s.type === 'navbar') s.ctaLabel = v; },
      });
      break;
    case 'hero':
      fields.push(
        { label: 'Badge', get: () => section.badge, set: (s, v) => { if (s.type === 'hero') s.badge = v; } },
        { label: 'Tiêu đề chính', get: () => section.headline, set: (s, v) => { if (s.type === 'hero') s.headline = v; } },
        { label: 'Chữ nhấn màu', get: () => section.highlightText, set: (s, v) => { if (s.type === 'hero') s.highlightText = v; } },
        { label: 'Mô tả Hero', get: () => section.subheadline, set: (s, v) => { if (s.type === 'hero') s.subheadline = v; } }
      );
      break;
    case 'about':
      fields.push(
        { label: 'Tiêu đề Giới thiệu', get: () => section.title, set: (s, v) => { if (s.type === 'about') s.title = v; } },
        { label: 'Vai trò', get: () => section.role, set: (s, v) => { if (s.type === 'about') s.role = v; } },
        { label: 'Tiểu sử', get: () => section.bio, set: (s, v) => { if (s.type === 'about') s.bio = v; } }
      );
      break;
    case 'products':
      fields.push(
        { label: 'Tiêu đề Sản phẩm', get: () => section.title, set: (s, v) => { if (s.type === 'products') s.title = v; } },
        { label: 'Mô tả Sản phẩm', get: () => section.subtitle, set: (s, v) => { if (s.type === 'products') s.subtitle = v; } }
      );
      section.items.forEach((item, idx) => {
        fields.push(
          {
            label: `Tên SP #${idx + 1}`,
            get: () => item.name,
            set: (s, v) => { if (s.type === 'products' && s.items[idx]) s.items[idx].name = v; },
          },
          {
            label: `Mô tả SP #${idx + 1}`,
            get: () => item.description,
            set: (s, v) => { if (s.type === 'products' && s.items[idx]) s.items[idx].description = v; },
          }
        );
      });
      break;
    case 'gallery':
      fields.push(
        { label: 'Tiêu đề Thư viện', get: () => section.title, set: (s, v) => { if (s.type === 'gallery') s.title = v; } },
        { label: 'Mô tả Thư viện', get: () => section.subtitle, set: (s, v) => { if (s.type === 'gallery') s.subtitle = v; } }
      );
      break;
    case 'features':
      fields.push(
        { label: 'Tiêu đề Lợi ích', get: () => section.title, set: (s, v) => { if (s.type === 'features') s.title = v; } },
        { label: 'Mô tả Lợi ích', get: () => section.subtitle, set: (s, v) => { if (s.type === 'features') s.subtitle = v; } }
      );
      section.items.forEach((item, idx) => {
        fields.push(
          { label: `Lợi ích #${idx + 1}`, get: () => item.title, set: (s, v) => { if (s.type === 'features' && s.items[idx]) s.items[idx].title = v; } },
          { label: `Mô tả lợi ích #${idx + 1}`, get: () => item.description, set: (s, v) => { if (s.type === 'features' && s.items[idx]) s.items[idx].description = v; } }
        );
      });
      break;
    case 'pricing':
      fields.push(
        { label: 'Tiêu đề Bảng giá', get: () => section.title, set: (s, v) => { if (s.type === 'pricing') s.title = v; } },
        { label: 'Mô tả Bảng giá', get: () => section.subtitle, set: (s, v) => { if (s.type === 'pricing') s.subtitle = v; } }
      );
      break;
    case 'testimonials':
      fields.push({ label: 'Tiêu đề Đánh giá', get: () => section.title, set: (s, v) => { if (s.type === 'testimonials') s.title = v; } });
      section.items.forEach((item, idx) => {
        fields.push({
          label: `Đánh giá #${idx + 1}`,
          get: () => item.quote,
          set: (s, v) => { if (s.type === 'testimonials' && s.items[idx]) s.items[idx].quote = v; },
        });
      });
      break;
    case 'faq':
      fields.push({ label: 'Tiêu đề FAQ', get: () => section.title, set: (s, v) => { if (s.type === 'faq') s.title = v; } });
      section.items.forEach((item, idx) => {
        fields.push(
          { label: `Câu hỏi #${idx + 1}`, get: () => item.question, set: (s, v) => { if (s.type === 'faq' && s.items[idx]) s.items[idx].question = v; } },
          { label: `Trả lời #${idx + 1}`, get: () => item.answer, set: (s, v) => { if (s.type === 'faq' && s.items[idx]) s.items[idx].answer = v; } }
        );
      });
      break;
    case 'cta':
      fields.push(
        { label: 'Tiêu đề CTA', get: () => section.title, set: (s, v) => { if (s.type === 'cta') s.title = v; } },
        { label: 'Mô tả CTA', get: () => section.subtitle, set: (s, v) => { if (s.type === 'cta') s.subtitle = v; } }
      );
      break;
    case 'contact':
      fields.push(
        { label: 'Tiêu đề Liên hệ', get: () => section.title, set: (s, v) => { if (s.type === 'contact') s.title = v; } },
        { label: 'Thông báo gửi form', get: () => section.successMessage, set: (s, v) => { if (s.type === 'contact') s.successMessage = v; } }
      );
      break;
    case 'footer':
      fields.push(
        { label: 'Mô tả Footer', get: () => section.brandDescription, set: (s, v) => { if (s.type === 'footer') s.brandDescription = v; } }
      );
      break;
  }

  return fields;
}

export function runLocalAudit(spec: LandingPageSpec): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];

  // 1. Contrast & Color Mode Checks
  const contrastAudit = auditThemeContrast(spec.theme);
  if (!contrastAudit.allPassed) {
    const failedLabels = contrastAudit.checks
      .filter((c) => !c.passed)
      .map((c) => `${c.label} (${c.ratio}:1)`);
    if (contrastAudit.modeMismatch) {
      failedLabels.unshift('Chế độ Sáng/Tối không khớp với màu nền hiện tại');
    }

    suggestions.push({
      id: generateId('sug-contrast'),
      category: 'contrast',
      severity: 'error',
      sectionLabel: 'Hệ thống Màu sắc',
      title: 'Phát hiện chữ bị chìm hoặc thiếu độ tương phản (WCAG)',
      description: `Các cặp màu có nguy cơ bị che/khó đọc khi đổi màu: ${failedLabels.join('; ')}.`,
      beforePreview: `Nền ${spec.theme.colors.background} / Chữ ${spec.theme.colors.text}`,
      afterPreview: 'Tự động cân chỉnh bảng màu đạt chuẩn đọc rõ >= 4.5:1',
      status: 'pending',
      applyPatch: (current) => {
        const next = cloneSpec(current);
        next.theme = contrastAudit.modeMismatch
          ? {
              ...next.theme,
              colors: derivePaletteForMode(next.theme.colors, next.theme.mode),
            }
          : autoFixThemeContrast(next.theme);
        return next;
      },
    });
  }

  // Per-section custom color contrast check
  for (const section of spec.sections) {
    if (!section.visible || !section.style.customBg || !section.style.customText) continue;
    const ratio = contrastRatio(section.style.customText, section.style.customBg);
    if (ratio < 4.5) {
      const readable = pickReadableText(section.style.customBg);
      suggestions.push({
        id: generateId('sug-sec-contrast'),
        category: 'contrast',
        severity: 'error',
        sectionId: section.id,
        sectionLabel: getSectionLabel(section.type),
        title: `Chữ bị chìm màu trong khối "${getSectionLabel(section.type)}"`,
        description: `Độ tương phản giữa chữ riêng (${section.style.customText}) và nền riêng (${section.style.customBg}) chỉ đạt ${ratio}:1.`,
        beforePreview: `Chữ ${section.style.customText} trên nền ${section.style.customBg}`,
        afterPreview: `Đổi màu chữ sang ${readable} để đạt tương phản cao`,
        status: 'pending',
        applyPatch: (current) => {
          const next = cloneSpec(current);
          const target = next.sections.find((s) => s.id === section.id);
          if (target) target.style.customText = readable;
          return next;
        },
      });
    }
  }

  // 2. Spelling & Formatting Audit
  for (const section of spec.sections) {
    if (!section.visible) continue;
    const fields = collectTextFields(section);
    for (const field of fields) {
      const rawValue = field.get();
      if (!rawValue) continue;
      const { fixed, notes } = fixVietnameseText(rawValue);
      if (fixed !== rawValue) {
        suggestions.push({
          id: generateId('sug-spell'),
          category: 'spelling',
          severity: 'warning',
          sectionId: section.id,
          sectionLabel: getSectionLabel(section.type),
          title: `Sửa chính tả / khoảng trắng ở "${field.label}"`,
          description: `Phát hiện lỗi: ${notes.join(', ')}.`,
          beforePreview: rawValue,
          afterPreview: fixed,
          status: 'pending',
          applyPatch: (current) => {
            const next = cloneSpec(current);
            const target = next.sections.find((s) => s.id === section.id);
            if (target) {
              const targetField = collectTextFields(target).find((f) => f.label === field.label);
              targetField?.set(target, fixed);
            }
            return next;
          },
        });
      }

      if (/(lorem ipsum|example\.com|xxx)/i.test(rawValue)) {
        suggestions.push({
          id: generateId('sug-placeholder'),
          category: 'content',
          severity: 'warning',
          sectionId: section.id,
          sectionLabel: getSectionLabel(section.type),
          title: `Còn chữ mẫu chưa thay ở "${field.label}"`,
          description: `Nội dung "${rawValue.slice(0, 60)}" vẫn chứa dữ liệu giữ chỗ (xxx / example / lorem). Hãy dùng AI Tự động điền hoặc chỉnh tay.`,
          beforePreview: rawValue,
          status: 'pending',
          applyPatch: (current) => current,
        });
      }
    }
  }

  // 3. Layout & Anchor Audit
  const validAnchors = new Set<string>(['top']);
  spec.sections.forEach((s) => {
    if (s.visible && s.anchorId) validAnchors.add(s.anchorId);
  });

  for (const section of spec.sections) {
    if (!section.visible) continue;

    // Broken #anchor checks
    if (section.type === 'navbar') {
      const brokenLinks = section.links.filter(
        (l) => l.href.startsWith('#') && !validAnchors.has(l.href.slice(1))
      );
      if (brokenLinks.length > 0) {
        const fallbackAnchor =
          spec.sections.find((s) => s.visible && s.type === 'products')?.anchorId ||
          spec.sections.find((s) => s.visible && s.type !== 'navbar')?.anchorId ||
          'top';
        suggestions.push({
          id: generateId('sug-anchor'),
          category: 'layout',
          severity: 'error',
          sectionId: section.id,
          sectionLabel: 'Thanh điều hướng',
          title: `Có ${brokenLinks.length} liên kết menu trỏ tới khối không tồn tại`,
          description: `Liên kết (${brokenLinks.map((l) => l.href).join(', ')}) không khớp ID khối nào trên trang nên bấm vào sẽ không cuộn tới đâu.`,
          beforePreview: brokenLinks.map((l) => `${l.label} → ${l.href}`).join(' | '),
          afterPreview: `Chuyển các liên kết lỗi về #${fallbackAnchor}`,
          status: 'pending',
          applyPatch: (current) => {
            const next = cloneSpec(current);
            const nav = next.sections.find((s) => s.id === section.id);
            if (nav && nav.type === 'navbar') {
              nav.links = nav.links.map((l) =>
                l.href.startsWith('#') && !validAnchors.has(l.href.slice(1))
                  ? { ...l, href: `#${fallbackAnchor}` }
                  : l
              );
            }
            return next;
          },
        });
      }
    }

    // Hero length check
    if (section.type === 'hero' && `${section.headline} ${section.highlightText}`.length > 90) {
      const shortened = section.headline.split(/[,.—–-]/)[0].trim();
      if (shortened.length >= 12 && shortened.length < section.headline.length) {
        suggestions.push({
          id: generateId('sug-hero-len'),
          category: 'layout',
          severity: 'tip',
          sectionId: section.id,
          sectionLabel: 'Hero Mở đầu',
          title: 'Tiêu đề Hero hơi dài trên màn hình điện thoại',
          description: 'Giữ tiêu đề chính súc tích dưới 10 từ giúp khách hiểu thông điệp trong 3 giây đầu.',
          beforePreview: section.headline,
          afterPreview: shortened,
          status: 'pending',
          applyPatch: (current) => {
            const next = cloneSpec(current);
            const hero = next.sections.find((s) => s.id === section.id);
            if (hero && hero.type === 'hero') hero.headline = shortened;
            return next;
          },
        });
      }
    }

    // Product grid symmetry check
    if (section.type === 'products') {
      if (section.items.length === 2 && section.variant === 'grid-3') {
        suggestions.push({
          id: generateId('sug-grid'),
          category: 'layout',
          severity: 'warning',
          sectionId: section.id,
          sectionLabel: 'Sản phẩm & Đặt mua',
          title: 'Lưới 3 cột nhưng chỉ có 2 sản phẩm (bị trống 1 ô)',
          description: 'Chuyển sang bố cục "Lưới 2 cột" để thẻ sản phẩm cân đối và đầy đặn hơn.',
          beforePreview: 'Lưới 3 cột (2 sản phẩm)',
          afterPreview: 'Lưới 2 cột cân đối',
          status: 'pending',
          applyPatch: (current) => {
            const next = cloneSpec(current);
            const sec = next.sections.find((s) => s.id === section.id);
            if (sec && sec.type === 'products') sec.variant = 'grid-2';
            return next;
          },
        });
      } else if (section.items.length === 1 && section.variant !== 'spotlight') {
        suggestions.push({
          id: generateId('sug-spotlight'),
          category: 'layout',
          severity: 'tip',
          sectionId: section.id,
          sectionLabel: 'Sản phẩm & Đặt mua',
          title: 'Chỉ có 1 sản phẩm — nên dùng kiểu Ngang chi tiết (Spotlight)',
          description: 'Khi chỉ bán 1 sản phẩm chủ lực, bố cục Spotlight nằm ngang giúp tăng tỷ lệ bấm mua.',
          beforePreview: section.variant,
          afterPreview: 'Ngang chi tiết (Spotlight)',
          status: 'pending',
          applyPatch: (current) => {
            const next = cloneSpec(current);
            const sec = next.sections.find((s) => s.id === section.id);
            if (sec && sec.type === 'products') sec.variant = 'spotlight';
            return next;
          },
        });
      }
    }
  }

  // Consecutive identical surface rhythm check
  const bodySections = spec.sections.filter(
    (s) => s.visible && s.type !== 'navbar' && s.type !== 'footer' && !s.style.customBg
  );
  const hasFlatRhythm = bodySections.some(
    (s, idx) => idx > 0 && s.style.surface === bodySections[idx - 1].style.surface
  );
  if (hasFlatRhythm && bodySections.length >= 3) {
    suggestions.push({
      id: generateId('sug-rhythm'),
      category: 'layout',
      severity: 'tip',
      sectionLabel: 'Nhịp điệu Bố cục',
      title: 'Hai khối liền kề đang dùng cùng một màu nền',
      description: 'Xen kẽ nền chính và nền phụ giữa các khối giúp trang web có chiều sâu và dễ phân biệt nội dung hơn.',
      beforePreview: bodySections.map((s) => s.style.surface).join(' → '),
      afterPreview: 'Xen kẽ default → alt → default → alt',
      status: 'pending',
      applyPatch: (current) => {
        const next = cloneSpec(current);
        let toggle = 0;
        next.sections.forEach((s) => {
          if (!s.visible || s.type === 'navbar' || s.type === 'footer' || s.style.customBg) return;
          const surface: SectionSurface = toggle % 2 === 0 ? 'default' : 'alt';
          s.style.surface = surface;
          toggle++;
        });
        return next;
      },
    });
  }

  // 4. SEO Audit
  if (!spec.meta.description || spec.meta.description.trim().length < 50) {
    const hero = spec.sections.find((s) => s.type === 'hero');
    const suggestedDesc =
      hero && hero.type === 'hero'
        ? `${hero.headline} ${hero.highlightText}. ${hero.subheadline}`.slice(0, 155)
        : `${spec.meta.title} — Khám phá thông tin chi tiết, bảng giá và đặt hàng trực tuyến nhanh chóng.`;

    suggestions.push({
      id: generateId('sug-seo-desc'),
      category: 'seo',
      severity: 'warning',
      sectionLabel: 'SEO & Chia sẻ link',
      title: 'Mô tả SEO (Meta Description) đang quá ngắn',
      description: 'Google và Zalo/Facebook dùng mô tả từ 70–155 ký tự khi bạn gửi link cho khách hàng.',
      beforePreview: spec.meta.description || '(Trống)',
      afterPreview: suggestedDesc,
      status: 'pending',
      applyPatch: (current) => {
        const next = cloneSpec(current);
        next.meta.description = suggestedDesc;
        return next;
      },
    });
  }

  return suggestions;
}
