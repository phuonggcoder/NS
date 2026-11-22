import type { LandingPageSpec, LandingSection } from '../types/spec';

function describeSection(section: LandingSection, index: number): string {
  const status = section.visible ? 'Hiển thị' : 'Đang ẩn';
  const common = `### ${index + 1}. \`${section.type.toUpperCase()}\` (#${section.anchorId || section.id})\n- **Trạng thái**: ${status}\n- **Surface / Padding**: \`${section.style.surface}\` / \`${section.style.padding}\``;

  switch (section.type) {
    case 'navbar':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Thương hiệu**: ${section.logoEmoji} ${section.logoText}\n- **Liên kết (${section.links.length})**: ${section.links.map((l) => `[${l.label}](${l.href})`).join(', ')}\n- **CTA**: ${section.ctaLabel} → ${section.ctaHref}`;
    case 'hero':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Badge**: ${section.badge}\n- **Tiêu đề chính**: ${section.headline} **${section.highlightText}**\n- **Mô tả**: ${section.subheadline}\n- **CTA Chính / Phụ**: ${section.primaryCtaLabel} | ${section.secondaryCtaLabel}`;
    case 'stats':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Chỉ số**: ${section.items.map((i) => `**${i.value}** (${i.label})`).join(' · ')}`;
    case 'about':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title} (${section.role})\n- **Giới thiệu**: ${section.bio}\n- **Kỹ năng / Điểm nổi bật**: ${section.highlights.join(', ')}\n- **Cột mốc (${section.milestones.length})**: ${section.milestones.map((m) => `${m.year}: ${m.title}`).join('; ')}`;
    case 'products':
      return `${common}\n- **Kiểu**: \`${section.variant}\` | **Kênh đặt hàng**: \`${section.orderChannel}\`\n- **Tiêu đề**: ${section.title}\n- **Danh sách sản phẩm (${section.items.length})**:\n${section.items.map((p) => `  - **${p.name}** — ${p.price}${p.originalPrice ? ` (giá gốc ${p.originalPrice})` : ''}`).join('\n')}`;
    case 'gallery':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Hình ảnh / Dự án (${section.items.length})**: ${section.items.map((g) => `${g.title} (${g.category})`).join(', ')}`;
    case 'features':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Tính năng (${section.items.length})**: ${section.items.map((f) => f.title).join(', ')}`;
    case 'pricing':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Các gói (${section.tiers.length})**: ${section.tiers.map((t) => `${t.name} (${t.price}${t.period})`).join(', ')}`;
    case 'testimonials':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Đánh giá (${section.items.length})**: ${section.items.map((t) => `${t.name} (${t.rating}★)`).join(', ')}`;
    case 'faq':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Câu hỏi (${section.items.length})**:\n${section.items.map((q) => `  - ${q.question}`).join('\n')}`;
    case 'cta':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Nút hành động**: ${section.primaryLabel}`;
    case 'contact':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Tiêu đề**: ${section.title}\n- **Thông tin**: ${section.email} | ${section.phone} | ${section.address}`;
    case 'footer':
      return `${common}\n- **Kiểu**: \`${section.variant}\`\n- **Thương hiệu**: ${section.brandName}\n- **Bản quyền**: ${section.copyright}`;
  }
}

export function generateSpecMarkdown(spec: LandingPageSpec): string {
  const header = `# Landing Page Specification (\`spec.md\`)

> **Spec-Driven Architecture** (theo chuẩn GitHub Spec Kit / \`speckit.org\`)  
> File này mô tả toàn bộ cấu trúc, giao diện thiết kế và nội dung trang web khách hàng của bạn dưới dạng đặc tả thực thi được.

## 1. Site Metadata
- **Spec Version**: \`${spec.specVersion}\`
- **Template**: \`${spec.templateId}\`
- **Cập nhật lần cuối**: \`${spec.updatedAt}\`
- **Tiêu đề trang**: ${spec.meta.title}
- **Mô tả SEO**: ${spec.meta.description}
- **Nút liên hệ nổi**: ${spec.meta.floatingContact.enabled ? `Bật (${spec.meta.floatingContact.label} → ${spec.meta.floatingContact.href})` : 'Tắt'}

## 2. Design System & Theme Tokens
- **Preset**: \`${spec.theme.presetId}\` (${spec.theme.mode})
- **Primary / Accent**: \`${spec.theme.colors.primary}\` / \`${spec.theme.colors.accent}\`
- **Background / Surface**: \`${spec.theme.colors.background}\` / \`${spec.theme.colors.surfaceAlt}\`
- **Text / Muted**: \`${spec.theme.colors.text}\` / \`${spec.theme.colors.muted}\`
- **Typography**: Heading \`${spec.theme.typography.headingFont}\` | Body \`${spec.theme.typography.bodyFont}\`
- **Shape & Style**: Bo góc \`${spec.theme.shape.radius}\`, Nút \`${spec.theme.shape.buttonStyle}\`, Thẻ \`${spec.theme.shape.cardStyle}\`, Khoảng cách \`${spec.theme.spacing}\`

## 3. Page Structure & Content (${spec.sections.length} Sections)
`;

  const body = spec.sections.map((section, idx) => describeSection(section, idx)).join('\n\n');
  return `${header}\n${body}\n`;
}
