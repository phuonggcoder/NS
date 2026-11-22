import { PLACEHOLDER_ART } from '../data/placeholders';
import { getPresetById } from '../data/themes';
import type {
  FaqItem,
  LandingPageSpec,
  NavLinkItem,
  ProductItem,
  StatItem,
} from '../types/spec';
import { cloneSpec, generateId } from '../utils/storage';
import type { AutoFillBlockKey, AutoFillResult } from './aiTypes';

export interface SampleBrief {
  id: string;
  label: string;
  rawText: string;
}

export const SAMPLE_BRIEFS: SampleBrief[] = [
  {
    id: 'spa-beauty',
    label: 'Spa & Mỹ phẩm',
    rawText: `Linh Chi Botanical Spa — Chăm sóc da chuẩn y khoa & Mỹ phẩm thiên nhiên
Tôi là Linh Chi, chuyên gia chăm sóc da 6 năm kinh nghiệm tại TP.HCM. Chúng tôi giúp hơn 3.200 khách hàng phục hồi làn da khỏe mạnh, sáng mịn an toàn không corticoid.

Thống kê: 3.200+ khách hàng, 6 năm kinh nghiệm, 98% hài lòng, 4.9/5 đánh giá

Sản phẩm & Dịch vụ:
1. Serum Phục Hồi B5 Rau Má 30ml - Giá: 390.000đ (Giá gốc 520.000đ) - Dịu đỏ nhanh, cấp ẩm sâu cho da nhạy cảm.
2. Kem Chống Nắng Khoáng Chất SPF50 - Giá: 450.000đ - Nâng tông tự nhiên, không bí da, an toàn mẹ bầu.
3. Liệu trình Soi da & Phục hồi chuyên sâu 75 phút - Giá: 690.000đ (Giá gốc 950.000đ) - Tặng kèm bộ mini dưỡng ẩm 7 ngày.

Hỏi: Da nhạy cảm sau peel có dùng được Serum B5 không?
Đáp: Hoàn toàn phù hợp, công thức không cồn, không hương liệu giúp làm dịu đỏ rát ngay sau 24 giờ.
Hỏi: Đặt hàng bao lâu nhận được?
Đáp: Nội thành giao nhanh trong 2 giờ, tỉnh khác từ 1-3 ngày và được kiểm tra hàng trước khi thanh toán.

Liên hệ: 0908 668 899
Email: cskh@linhchispa.vn
Địa chỉ: 128 Nguyễn Đình Chiểu, Quận 3, TP.HCM
Zalo: https://zalo.me/0908668899`,
  },
  {
    id: 'freelancer-mentor',
    label: 'Cá nhân & Mentor',
    rawText: `Trần Minh Đức — Performance Marketing Strategist & Business Mentor
Xin chào, tôi là Trần Minh Đức. Với hơn 8 năm triển khai chiến dịch cho 60+ thương hiệu SMEs, tôi giúp chủ shop và startup tối ưu chi phí quảng cáo và xây dựng hệ thống bán hàng bền vững.
Kỹ năng: Facebook & TikTok Ads, Tối ưu Landing Page, Chiến lược Phễu bán hàng, Mentoring 1-1

Thành tựu: 60+ dự án thành công, 8 năm thực chiến, 3.2x ROAS trung bình, 1.500+ học viên

Sản phẩm & Khóa học:
- Ebook & Checklist Chạy Ads Thực Chiến 2026 - 299.000đ (Giá cũ 499.000đ) - Bộ mẫu content & cách đọc chỉ số tránh đốt tiền.
- Khóa học Xây Phễu Bán Hàng Tự Động - 1.490.000đ (Giá cũ 2.200.000đ) - 18 video cầm tay chỉ việc + sửa bài tập trực tiếp.
- Tư vấn Chiến lược 1-1 (90 phút) - 2.000.000đ - Khám bệnh tài khoản quảng cáo & lên kế hoạch 90 ngày.

Hỏi: Người mới bắt đầu chưa biết kỹ thuật có học được không?
Đáp: Nội dung đi từ nền tảng tư duy đến thao tác thực hành từng bước, có nhóm Zalo hỗ trợ hỏi đáp hàng ngày.

SĐT: 0912 345 678
Email: minhduc.mentor@gmail.com
Địa chỉ: Cầu Giấy, Hà Nội`,
  },
  {
    id: 'organic-shop',
    label: 'Trà & Đặc sản sạch',
    rawText: `Tiệm Trà Mộc Nhiên — Trà Shan Tuyết Cổ Thụ & Thảo Mộc Tự Nhiên
Nguồn trà sạch thu hái thủ công từ vùng núi cao Hà Giang trên 1.400m, sao tay truyền thống giữ nguyên hương cốm non thanh mát và vị ngọt hậu tự nhiên.

Chỉ số: 1.400m độ cao vùng trà, 100% hái tay tự nhiên, 5.400+ hộp trà đã giao, 4.9/5 đánh giá

Sản phẩm nổi bật:
1. Bạch Trà Shan Tuyết Cổ Thụ (100g) - 420.000đ (Giá gốc 490.000đ) - Hương hoa rừng tinh khiết, giúp thư giãn và ngủ ngon.
2. Hồng Trà Mật Ong Mộc Nhiên (150g) - 340.000đ - Vị ngọt thanh, không chát gắt, phù hợp uống sáng & chiều.
3. Hộp Quà Tặng An Nhiên (2 hũ trà + ấm sứ) - 890.000đ (Giá cũ 1.050.000đ) - Kèm túi giấy cao cấp và thiệp chúc mừng.

Liên hệ: 0977 889 900
Email: tiemtra@mocnhien.vn
Địa chỉ: 55 Xuân Thủy, Thảo Điền, TP. Thủ Đức`,
  },
];

function cleanLinePrefix(line: string): string {
  return line
    .replace(/^[\s\-•*✅👉🔥✨📌📍⭐📞✉️🔗]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

function normalizePriceMatch(rawPrice: string): string {
  const cleaned = rawPrice.trim();
  const lower = cleaned.toLowerCase();
  const numMatch = lower.match(/(\d+(?:[.,]\d+)?)/);
  if (!numMatch) return cleaned;

  if (lower.includes('$')) {
    return `$${numMatch[1]}`;
  }
  if (lower.includes('tr')) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    if (!Number.isNaN(val)) {
      return `${new Intl.NumberFormat('vi-VN').format(Math.round(val * 1_000_000))}đ`;
    }
  }
  if (lower.endsWith('k')) {
    const val = parseFloat(numMatch[1].replace(',', '.'));
    if (!Number.isNaN(val)) {
      return `${new Intl.NumberFormat('vi-VN').format(Math.round(val * 1_000))}đ`;
    }
  }
  if (!lower.endsWith('đ') && !lower.includes('vnđ') && !lower.includes('vnd')) {
    return `${cleaned}đ`;
  }
  return cleaned.replace(/vnđ|vnd/gi, 'đ').replace(/\s+/g, '');
}

function inferPresetFromText(text: string): string {
  const lower = text.toLowerCase();
  if (/spa|mỹ phẩm|skincare|thời trang|son|làm đẹp|nail|tóc|nước hoa/.test(lower)) {
    return 'rose-velvet';
  }
  if (/trà|hữu cơ|organic|sức khỏe|thảo mộc|yoga|matcha|rau|nông sản/.test(lower)) {
    return 'matcha-minimal';
  }
  if (/cà phê|coffee|gốm|bánh|handmade|thủ công|nội thất|ẩm thực/.test(lower)) {
    return 'warm-editorial';
  }
  if (/bất động sản|vip|trang sức|đồng hồ|luxury|kiến trúc|tư vấn cấp cao/.test(lower)) {
    return 'midnight-gold';
  }
  if (/saas|phần mềm|ai|lập trình|khóa học|marketing|ads|seo|web|app/.test(lower)) {
    return 'cobalt-saas';
  }
  if (/designer|portfolio|studio|nhiếp ảnh|agency|creative/.test(lower)) {
    return 'obsidian-studio';
  }
  return 'speckit-crisp';
}

export function extractAutoFillLocal(
  rawText: string,
  _currentSpec: LandingPageSpec
): AutoFillResult {
  const normalizedText = rawText.replace(/\r\n/g, '\n').trim();
  const lines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const summary: string[] = [];

  // 1. Contact: Phone, Email, URLs, Address
  const phoneMatches = normalizedText.match(/(?:\+84|0)[35789](?:[\s.-]?\d){7,9}/g) ?? [];
  const phone = phoneMatches[0]?.replace(/\s+/g, ' ').trim() || '';

  const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] || '';

  const urlMatches = normalizedText.match(/https?:\/\/[^\s,)]+/gi) ?? [];
  const zaloUrl = urlMatches.find((u) => u.toLowerCase().includes('zalo.me')) || '';

  let address = '';
  for (const line of lines) {
    const clean = cleanLinePrefix(line);
    if (/^(địa chỉ|chi nhánh|văn phòng|cửa hàng|address)\s*[:：]/i.test(clean)) {
      address = clean.replace(/^(địa chỉ|chi nhánh|văn phòng|cửa hàng|address)\s*[:：]\s*/i, '').trim();
      break;
    }
  }

  // 2. Brand / Person Name & Hero Headline
  let brandName = '';
  let role = '';
  let heroHeadline = '';
  let heroHighlight = '';
  let subheadline = '';

  const firstContentLine = cleanLinePrefix(lines[0] || '');
  if (firstContentLine) {
    const dashParts = firstContentLine.split(/\s*[—–-]\s*/);
    if (dashParts.length >= 2) {
      brandName = dashParts[0].trim();
      role = dashParts.slice(1).join(' — ').trim();
      heroHeadline = brandName;
      heroHighlight = role;
    } else {
      brandName = firstContentLine.slice(0, 42);
      heroHeadline = firstContentLine;
      heroHighlight = '';
    }
  }

  // Find bio / intro paragraph
  const bioLines: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const clean = cleanLinePrefix(lines[i]);
    if (
      /^(sản phẩm|dịch vụ|bảng giá|thống kê|chỉ số|kỹ năng|thành tựu|hỏi|đáp|liên hệ|sđt|điện thoại|email|địa chỉ|zalo)/i.test(
        clean
      )
    ) {
      continue;
    }
    if (/\d+(?:[.,]\d+)*(?:\s*(?:k|tr|triệu|đ|vnđ|vnd)|\s*\$)/i.test(clean)) {
      continue;
    }
    if (clean.length >= 45 && !clean.endsWith('?')) {
      bioLines.push(clean);
    }
  }

  const bioText = bioLines.slice(0, 2).join(' ');
  if (bioLines[0]) {
    subheadline = bioLines[0];
  }

  // Extract person name if "Tôi là ..." appears
  const iamMatch = normalizedText.match(/(?:tôi là|mình là|chào bạn,\s*tôi là)\s+([A-ZÀ-Ỹ][\wÀ-ỹ\s]{2,35}?)(?:[.,\n—–-]|$)/i);
  const personName = iamMatch ? iamMatch[1].trim() : brandName;

  // 3. Skills / Highlights
  const highlights: string[] = [];
  for (const line of lines) {
    const clean = cleanLinePrefix(line);
    if (/^(kỹ năng|thế mạnh|chuyên môn|cam kết|nổi bật)\s*[:：]/i.test(clean)) {
      const rest = clean.replace(/^[^:：]+[:：]\s*/, '');
      rest
        .split(/[,|•·]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 48)
        .forEach((s) => highlights.push(s));
    }
  }

  // 4. Stats
  const stats: StatItem[] = [];
  const statRegex = /(\d+(?:[.,]\d+)?(?:\+|%|x|\/5)?\s*(?:năm|khách hàng|học viên|dự án|hộp|gói|đơn|người|m)?)\s+([a-zA-ZÀ-ỹ\s]{3,28}?)(?=[,;\n|]|$)/gi;
  for (const line of lines) {
    const clean = cleanLinePrefix(line);
    if (/^(thống kê|chỉ số|thành tựu|con số)\s*[:：]/i.test(clean)) {
      const rest = clean.replace(/^[^:：]+[:：]\s*/, '');
      const segments = rest.split(/[,|•·;]/).map((s) => s.trim()).filter(Boolean);
      for (const seg of segments) {
        const m = seg.match(/^(\d+(?:[.,]\d+)?(?:\+|%|x|\/5|m)?)\s+(.+)$/i);
        if (m) {
          stats.push({
            id: generateId('st'),
            value: m[1].trim(),
            label: m[2].trim(),
          });
        }
      }
    }
  }
  if (stats.length === 0) {
    let m: RegExpExecArray | null;
    while ((m = statRegex.exec(normalizedText)) !== null && stats.length < 4) {
      const valMatch = m[1].match(/^(\d+(?:[.,]\d+)?(?:\+|%|x|\/5)?)/);
      if (valMatch) {
        stats.push({
          id: generateId('st'),
          value: valMatch[1],
          label: m[0].slice(valMatch[1].length).trim(),
        });
      }
    }
  }

  // 5. Products with Prices
  const products: ProductItem[] = [];
  const productArtwork = [
    PLACEHOLDER_ART.productUiKit,
    PLACEHOLDER_ART.productCourse,
    PLACEHOLDER_ART.productMentorship,
    PLACEHOLDER_ART.productCoffee1,
  ];

  const pricePattern =
    /(?:giá(?:\s*(?:bán|gốc|cũ))?\s*[:：]?\s*)?(\d{1,3}(?:[.,]\d{3})+\s*(?:đ|vnđ|vnd)(?![A-Za-zÀ-ỹ0-9])|\d+(?:[.,]\d+)?\s*(?:k|tr|triệu)(?![A-Za-zÀ-ỹ0-9])|\$\s*\d+(?:[.,]\d+)?|\d+\s*(?:đ|vnđ|vnd)(?![A-Za-zÀ-ỹ0-9]))|(?:giá(?:\s*(?:bán|gốc|cũ))?\s*[:：]\s*)(\d{1,3}(?:[.,]\d{3})+)/gi;

  for (const line of lines) {
    const clean = cleanLinePrefix(line);
    if (/^(liên hệ|sđt|điện thoại|hotline|địa chỉ|thống kê|chỉ số|hỏi|đáp)/i.test(clean)) {
      continue;
    }

    const matches = Array.from(clean.matchAll(pricePattern));
    if (matches.length === 0) continue;

    const firstPriceMatch = matches[0];
    const priceIdx = firstPriceMatch.index ?? 0;
    const rawNamePart = clean.slice(0, priceIdx).replace(/[-–—:|]+$/, '').trim();
    if (rawNamePart.length < 3 || rawNamePart.length > 90) continue;

    const currentPrice = normalizePriceMatch(firstPriceMatch[1] || firstPriceMatch[2] || '');
    let originalPrice: string | undefined;
    if (matches.length >= 2) {
      originalPrice = normalizePriceMatch(matches[1][1] || matches[1][2] || '');
    }

    const afterLastPrice = clean
      .slice((matches[matches.length - 1].index ?? 0) + matches[matches.length - 1][0].length)
      .replace(/^[)\s\-–—:|]+/, '')
      .trim();

    const descParts = afterLastPrice
      ? afterLastPrice.split(/[,;•]/).map((s) => s.trim()).filter(Boolean)
      : [];

    products.push({
      id: generateId('prd'),
      name: rawNamePart,
      badge: products.length === 0 ? 'Nổi bật' : undefined,
      price: currentPrice,
      originalPrice,
      description: afterLastPrice || `Thông tin chi tiết về ${rawNamePart}.`,
      imageUrl: productArtwork[products.length % productArtwork.length],
      features: descParts.length > 0 ? descParts.slice(0, 3) : ['Chất lượng đảm bảo', 'Hỗ trợ tư vấn 1-1'],
      ctaLabel: 'Đặt mua ngay',
    });
  }

  // 6. FAQs
  const faqs: FaqItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const clean = cleanLinePrefix(lines[i]);
    if (/^(hỏi|q|câu hỏi)\s*[:：]/i.test(clean) || (clean.endsWith('?') && clean.length >= 12)) {
      const question = clean.replace(/^(hỏi|q|câu hỏi)\s*[:：]\s*/i, '').trim();
      let answer = '';
      if (i + 1 < lines.length) {
        const nextClean = cleanLinePrefix(lines[i + 1]);
        if (/^(đáp|a|trả lời)\s*[:：]/i.test(nextClean) || !nextClean.endsWith('?')) {
          answer = nextClean.replace(/^(đáp|a|trả lời)\s*[:：]\s*/i, '').trim();
          i++;
        }
      }
      if (question && answer) {
        faqs.push({ id: generateId('fq'), question, answer });
      }
    }
  }

  // 7. Social links
  const socials: NavLinkItem[] = urlMatches
    .filter((u) => /facebook|fb\.com|zalo|instagram|linkedin|tiktok|youtube/i.test(u))
    .slice(0, 4)
    .map((u) => {
      const lower = u.toLowerCase();
      const label = lower.includes('zalo')
        ? 'Zalo'
        : lower.includes('facebook') || lower.includes('fb.com')
        ? 'Facebook'
        : lower.includes('instagram')
        ? 'Instagram'
        : lower.includes('linkedin')
        ? 'LinkedIn'
        : 'Website';
      return { id: generateId('soc'), label, href: u };
    });

  const recommendedPresetId = inferPresetFromText(normalizedText);

  if (brandName) summary.push(`Thương hiệu / Tiêu đề: ${brandName}`);
  if (products.length > 0) summary.push(`Phát hiện ${products.length} sản phẩm kèm giá`);
  if (stats.length > 0) summary.push(`Phát hiện ${stats.length} chỉ số nổi bật`);
  if (bioText) summary.push('Trích xuất đoạn giới thiệu bản thân / thương hiệu');
  if (faqs.length > 0) summary.push(`Phát hiện ${faqs.length} câu hỏi thường gặp (FAQ)`);
  if (phone || email || address) summary.push('Trích xuất đầy đủ thông tin liên hệ');

  return {
    sourceMode: 'local',
    summary: summary.length > 0 ? summary : ['Đã trích xuất thông tin cơ bản từ văn bản của bạn'],
    recommendedPresetId,
    brandName,
    meta: {
      title: role ? `${brandName} — ${role}` : brandName || undefined,
      description: subheadline || bioText.slice(0, 160) || undefined,
    },
    hero: {
      badge: role ? role.slice(0, 60) : undefined,
      headline: heroHeadline || undefined,
      highlightText: heroHighlight || undefined,
      subheadline: subheadline || undefined,
      trustChips: highlights.length > 0 ? highlights.slice(0, 3) : undefined,
    },
    stats: stats.length > 0 ? stats.slice(0, 4) : undefined,
    about:
      bioText || personName || highlights.length > 0
        ? {
            title: personName ? `Xin chào, tôi là ${personName}` : undefined,
            role: role || undefined,
            bio: bioText || undefined,
            highlights: highlights.length > 0 ? highlights.slice(0, 6) : undefined,
            socials: socials.length > 0 ? socials : undefined,
          }
        : undefined,
    products: products.length > 0 ? products : undefined,
    faq: faqs.length > 0 ? faqs : undefined,
    contact:
      phone || email || address || zaloUrl
        ? {
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            zaloHref: zaloUrl || undefined,
          }
        : undefined,
  };
}

export function applyAutoFillSelection(
  currentSpec: LandingPageSpec,
  result: AutoFillResult,
  selectedBlocks: Record<AutoFillBlockKey, boolean>
): LandingPageSpec {
  const next = cloneSpec(currentSpec);
  next.updatedAt = new Date().toISOString();

  if (selectedBlocks.meta && result.meta) {
    next.meta = {
      ...next.meta,
      title: result.meta.title || next.meta.title,
      description: result.meta.description || next.meta.description,
    };
  }

  if (selectedBlocks.theme && result.recommendedPresetId) {
    const preset = getPresetById(result.recommendedPresetId);
    next.theme = cloneSpec(preset.theme);
  }

  for (let i = 0; i < next.sections.length; i++) {
    const sec = next.sections[i];
    if (sec.type === 'navbar' && result.brandName && selectedBlocks.meta) {
      sec.logoText = result.brandName.slice(0, 36);
    }
    if (sec.type === 'footer' && result.brandName && selectedBlocks.meta) {
      sec.brandName = result.brandName;
      if (result.meta?.description) sec.brandDescription = result.meta.description;
      sec.copyright = `© ${new Date().getFullYear()} ${result.brandName}.`;
    }
    if (sec.type === 'hero' && selectedBlocks.hero && result.hero) {
      sec.badge = result.hero.badge ?? sec.badge;
      sec.headline = result.hero.headline ?? sec.headline;
      sec.highlightText = result.hero.highlightText ?? '';
      sec.subheadline = result.hero.subheadline ?? sec.subheadline;
      if (result.hero.trustChips && result.hero.trustChips.length > 0) {
        sec.trustChips = result.hero.trustChips;
      }
    }
    if (sec.type === 'stats' && selectedBlocks.stats && result.stats && result.stats.length > 0) {
      sec.items = cloneSpec(result.stats);
    }
    if (sec.type === 'about' && selectedBlocks.about && result.about) {
      sec.title = result.about.title ?? sec.title;
      sec.role = result.about.role ?? sec.role;
      sec.bio = result.about.bio ?? sec.bio;
      if (result.about.highlights && result.about.highlights.length > 0) {
        sec.highlights = cloneSpec(result.about.highlights);
      }
      if (result.about.socials && result.about.socials.length > 0) {
        sec.socials = cloneSpec(result.about.socials);
      }
    }
    if (
      sec.type === 'products' &&
      selectedBlocks.products &&
      result.products &&
      result.products.length > 0
    ) {
      sec.items = cloneSpec(result.products);
      sec.variant =
        result.products.length === 1
          ? 'spotlight'
          : result.products.length === 2
          ? 'grid-2'
          : 'grid-3';
    }
    if (sec.type === 'faq' && selectedBlocks.faq && result.faq && result.faq.length > 0) {
      sec.items = cloneSpec(result.faq);
    }
    if (sec.type === 'contact' && selectedBlocks.contact && result.contact) {
      sec.phone = result.contact.phone ?? sec.phone;
      sec.email = result.contact.email ?? sec.email;
      sec.address = result.contact.address ?? sec.address;
      sec.zaloHref = result.contact.zaloHref ?? sec.zaloHref;
    }
  }

  return next;
}
