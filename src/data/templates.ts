import type { LandingPageSpec, LandingSection, SectionType } from '../types/spec';
import { PLACEHOLDER_ART } from './placeholders';
import { getPresetById } from './themes';
import { cloneSpec, generateId } from '../utils/storage';

export interface SectionCatalogItem {
  type: SectionType;
  label: string;
  description: string;
  category: 'Cấu trúc' | 'Giới thiệu' | 'Bán hàng' | 'Chuyển đổi';
  icon: string;
}

export const SECTION_CATALOG: SectionCatalogItem[] = [
  {
    type: 'navbar',
    label: 'Thanh điều hướng',
    description: 'Logo thương hiệu, menu liên kết và nút hành động',
    category: 'Cấu trúc',
    icon: 'compass',
  },
  {
    type: 'hero',
    label: 'Hero Mở đầu',
    description: 'Tiêu đề lớn, thông điệp chính, hình ảnh & nút CTA',
    category: 'Giới thiệu',
    icon: 'sparkles',
  },
  {
    type: 'stats',
    label: 'Chỉ số Nổi bật',
    description: 'Dải số liệu uy tín (khách hàng, kinh nghiệm, đánh giá)',
    category: 'Giới thiệu',
    icon: 'award',
  },
  {
    type: 'about',
    label: 'Giới thiệu Bản thân',
    description: 'Ảnh chân dung, tiểu sử, kỹ năng, cột mốc & mạng xã hội',
    category: 'Giới thiệu',
    icon: 'users',
  },
  {
    type: 'products',
    label: 'Sản phẩm & Đặt mua',
    description: 'Thẻ sản phẩm kèm giá, ưu đãi và nút mua hàng trực tiếp',
    category: 'Bán hàng',
    icon: 'shopping-bag',
  },
  {
    type: 'gallery',
    label: 'Thư viện Ảnh / Dự án',
    description: 'Trưng bày hình ảnh sản phẩm thực tế hoặc dự án đã làm',
    category: 'Giới thiệu',
    icon: 'palette',
  },
  {
    type: 'features',
    label: 'Điểm nổi bật / Lợi ích',
    description: 'Trình bày giá trị cốt lõi hoặc quy trình làm việc',
    category: 'Giới thiệu',
    icon: 'zap',
  },
  {
    type: 'pricing',
    label: 'Bảng giá / Gói dịch vụ',
    description: 'So sánh các gói sản phẩm, khóa học hoặc dịch vụ tư vấn',
    category: 'Bán hàng',
    icon: 'layers',
  },
  {
    type: 'testimonials',
    label: 'Đánh giá Khách hàng',
    description: 'Phản hồi thực tế và xếp hạng sao tăng độ tin cậy',
    category: 'Chuyển đổi',
    icon: 'star',
  },
  {
    type: 'faq',
    label: 'Câu hỏi Thường gặp',
    description: 'Giải đáp thắc mắc phổ biến dạng Accordion đóng mở',
    category: 'Chuyển đổi',
    icon: 'book-open',
  },
  {
    type: 'cta',
    label: 'Kêu gọi Hành động (CTA)',
    description: 'Khối nhấn mạnh chốt đơn hoặc đặt lịch ngay',
    category: 'Chuyển đổi',
    icon: 'rocket',
  },
  {
    type: 'contact',
    label: 'Liên hệ & Form nhận tin',
    description: 'Email, Hotline, Zalo và form để khách gửi yêu cầu',
    category: 'Chuyển đổi',
    icon: 'message-circle',
  },
  {
    type: 'footer',
    label: 'Chân trang (Footer)',
    description: 'Thông tin thương hiệu, cột liên kết và bản quyền',
    category: 'Cấu trúc',
    icon: 'globe',
  },
];

export function getSectionLabel(type: SectionType): string {
  return SECTION_CATALOG.find((c) => c.type === type)?.label ?? type;
}

export function createDefaultSection(type: SectionType): LandingSection {
  const id = generateId(type);

  switch (type) {
    case 'navbar':
      return {
        id,
        type: 'navbar',
        visible: true,
        anchorId: 'top',
        style: { surface: 'default', padding: 'compact' },
        variant: 'glass',
        logoText: 'Thương hiệu của bạn',
        logoEmoji: '✨',
        links: [
          { id: generateId('nav'), label: 'Giới thiệu', href: '#about' },
          { id: generateId('nav'), label: 'Sản phẩm', href: '#products' },
          { id: generateId('nav'), label: 'Đánh giá', href: '#testimonials' },
          { id: generateId('nav'), label: 'Liên hệ', href: '#contact' },
        ],
        ctaLabel: 'Đặt mua ngay',
        ctaHref: '#products',
      };
    case 'hero':
      return {
        id,
        type: 'hero',
        visible: true,
        anchorId: 'home',
        style: { surface: 'default', padding: 'spacious' },
        variant: 'split-right',
        badge: 'Ra mắt phiên bản mới 2026',
        headline: 'Biến ý tưởng thành sản phẩm',
        highlightText: 'bán chạy và đầy cảm hứng',
        subheadline:
          'Giới thiệu câu chuyện cá nhân, chứng minh năng lực và bán sản phẩm số hay vật lý trực tiếp cho khách hàng trên một trang web sắc nét.',
        primaryCtaLabel: 'Khám phá sản phẩm',
        primaryCtaHref: '#products',
        secondaryCtaLabel: 'Tìm hiểu về tôi',
        secondaryCtaHref: '#about',
        imageUrl: PLACEHOLDER_ART.heroCreator,
        imageCaption: 'Giao diện tối ưu chuyển đổi trên mọi thiết bị',
        trustChips: ['Giao hàng / kích hoạt tức thì', 'Hỗ trợ 1-1 tận tâm', 'Hoàn tiền trong 7 ngày'],
      };
    case 'stats':
      return {
        id,
        type: 'stats',
        visible: true,
        anchorId: 'stats',
        style: { surface: 'alt', padding: 'compact' },
        variant: 'strip',
        items: [
          { id: generateId('st'), value: '1.800+', label: 'Khách hàng tin dùng', note: 'Tại Việt Nam & quốc tế' },
          { id: generateId('st'), value: '4.9/5', label: 'Điểm hài lòng', note: 'Từ hơn 420 đánh giá' },
          { id: generateId('st'), value: '7 năm', label: 'Kinh nghiệm thực chiến', note: 'Thiết kế & xây sản phẩm' },
          { id: generateId('st'), value: '24/7', label: 'Hỗ trợ nhanh chóng', note: 'Qua Zalo & Email' },
        ],
      };
    case 'about':
      return {
        id,
        type: 'about',
        visible: true,
        anchorId: 'about',
        style: { surface: 'default', padding: 'normal' },
        variant: 'split-left',
        badge: 'Về tôi',
        title: 'Xin chào, tôi là Minh Khôi',
        role: 'Product Designer & Digital Creator',
        bio: 'Tôi đã dành 7 năm qua đồng hành cùng các startup và nhà sáng lập tạo ra những sản phẩm số tinh gọn, dễ dùng và tăng trưởng bền vững. Tại đây, tôi chia sẻ bộ công cụ thực chiến và nhận cố vấn thiết kế trực tiếp.',
        avatarUrl: PLACEHOLDER_ART.avatarCreator,
        highlights: ['UI/UX Design Systems', 'Landing Page Chuyển Đổi', 'Figma & Spec-Driven Workflow', 'Tư vấn Sản phẩm'],
        milestones: [
          { id: generateId('ms'), year: '2024 – Nay', title: 'Founder tại Khôi Studio', detail: 'Ra mắt 3 bộ tài nguyên số với hơn 1.800 học viên & khách hàng.' },
          { id: generateId('ms'), year: '2021 – 2024', title: 'Lead Product Designer', detail: 'Dẫn dắt đội ngũ thiết kế ứng dụng SaaS phục vụ 300K người dùng.' },
        ],
        socials: [
          { id: generateId('soc'), label: 'Facebook', href: 'https://facebook.com' },
          { id: generateId('soc'), label: 'LinkedIn', href: 'https://linkedin.com' },
          { id: generateId('soc'), label: 'Zalo', href: '#contact' },
        ],
      };
    case 'products':
      return {
        id,
        type: 'products',
        visible: true,
        anchorId: 'products',
        style: { surface: 'alt', padding: 'normal' },
        variant: 'grid-3',
        badge: 'Sản phẩm nổi bật',
        title: 'Chọn sản phẩm phù hợp với bạn',
        subtitle: 'Mỗi sản phẩm được đóng gói chỉn chu, tài liệu hướng dẫn chi tiết và cập nhật trọn đời.',
        currency: 'đ',
        orderChannel: 'modal',
        items: [
          {
            id: generateId('prd'),
            name: 'SpecUI Design Kit Pro',
            badge: 'Bán chạy nhất',
            price: '490.000đ',
            originalPrice: '790.000đ',
            description: 'Hơn 250+ component Figma & Landing Page block sẵn sàng cho mọi dự án.',
            imageUrl: PLACEHOLDER_ART.productUiKit,
            features: ['250+ Figma Components chuẩn Auto-layout', '18 mẫu Landing Page tối ưu tiếng Việt', 'Cập nhật miễn phí trọn đời'],
            ctaLabel: 'Mua ngay',
          },
          {
            id: generateId('prd'),
            name: 'Khóa học Spec-Driven Web',
            badge: 'Mới 2026',
            price: '890.000đ',
            originalPrice: '1.290.000đ',
            description: 'Lộ trình từ ý tưởng, viết Spec đến hoàn thiện website bán hàng thực tế.',
            imageUrl: PLACEHOLDER_ART.productCourse,
            features: ['24 video bài giảng 4K thực chiến', 'Template Spec & Checklist đầy đủ', 'Cộng đồng hỏi đáp riêng tư'],
            ctaLabel: 'Đăng ký học',
          },
          {
            id: generateId('prd'),
            name: 'Gói Review & Tối ưu 1-1',
            badge: 'Giới hạn 5 suất/tháng',
            price: '1.500.000đ',
            description: 'Phân tích trực tiếp sản phẩm hoặc landing page của bạn trong 90 phút.',
            imageUrl: PLACEHOLDER_ART.productMentorship,
            features: ['90 phút gọi video 1-1 chuyên sâu', 'Báo cáo chỉnh sửa UX/UI chi tiết', 'Hỗ trợ theo dõi 14 ngày sau buổi hẹn'],
            ctaLabel: 'Đặt lịch ngay',
          },
        ],
      };
    case 'gallery':
      return {
        id,
        type: 'gallery',
        visible: true,
        anchorId: 'gallery',
        style: { surface: 'default', padding: 'normal' },
        variant: 'grid-3',
        badge: 'Dự án & Hình ảnh thực tế',
        title: 'Những sản phẩm & dự án tiêu biểu',
        subtitle: 'Hình ảnh thực tế và các mẫu thiết kế được khách hàng yêu thích nhất.',
        items: [
          {
            id: generateId('gal'),
            title: 'Bộ nhận diện Thương hiệu Cafe',
            category: 'Branding',
            imageUrl: PLACEHOLDER_ART.heroProduct,
            caption: 'Thiết kế bao bì và trang bán hàng trực tuyến tăng 180% đơn hàng.',
          },
          {
            id: generateId('gal'),
            title: 'Giao diện Ứng dụng SaaS',
            category: 'UI/UX Design',
            imageUrl: PLACEHOLDER_ART.heroTech,
            caption: 'Hệ thống Design System đồng bộ cho hơn 40 màn hình quản trị.',
          },
          {
            id: generateId('gal'),
            title: 'Landing Page Khóa học Số',
            category: 'Web Conversion',
            imageUrl: PLACEHOLDER_ART.productCourse,
            caption: 'Trang giới thiệu và bán khóa học tự động hóa quy trình chốt đơn.',
          },
        ],
      };
    case 'features':
      return {
        id,
        type: 'features',
        visible: true,
        anchorId: 'features',
        style: { surface: 'default', padding: 'normal' },
        variant: 'grid-3',
        badge: 'Vì sao nên chọn',
        title: 'Thiết kế tinh gọn, hiệu quả đo lường được',
        subtitle: 'Mọi chi tiết được xây dựng dựa trên trải nghiệm người mua thực tế.',
        items: [
          { id: generateId('ft'), icon: 'zap', title: 'Triển khai trong vài phút', description: 'Tải về hoặc áp dụng ngay vào quy trình làm việc của bạn mà không cần cài đặt phức tạp.' },
          { id: generateId('ft'), icon: 'shield', title: 'Cam kết chất lượng', description: 'Hoàn tiền 100% trong 7 ngày đầu nếu sản phẩm không mang lại giá trị như mô tả.' },
          { id: generateId('ft'), icon: 'heart', title: 'Hỗ trợ tận tâm', description: 'Đồng hành giải đáp qua Zalo và Email bất cứ khi nào bạn cần trợ giúp.' },
        ],
      };
    case 'pricing':
      return {
        id,
        type: 'pricing',
        visible: true,
        anchorId: 'pricing',
        style: { surface: 'alt', padding: 'normal' },
        variant: 'columns',
        badge: 'Bảng giá minh bạch',
        title: 'Đầu tư một lần, sử dụng dài lâu',
        subtitle: 'Chọn gói phù hợp nhất với mục tiêu hiện tại của bạn.',
        tiers: [
          {
            id: generateId('tier'),
            name: 'Gói Cá nhân',
            price: '490.000đ',
            period: '/ trọn đời',
            description: 'Dành cho freelancer và nhà sáng tạo cá nhân.',
            features: ['Toàn bộ bộ Design Kit', 'File hướng dẫn sử dụng tiếng Việt', 'Cập nhật phiên bản mới'],
            highlighted: false,
            ctaLabel: 'Chọn gói Cá nhân',
          },
          {
            id: generateId('tier'),
            name: 'Gói Toàn diện (Bundle)',
            price: '1.190.000đ',
            period: '/ trọn đời',
            description: 'Kết hợp Design Kit + Khóa học + Template thực chiến.',
            features: ['Tất cả tài nguyên của gói Cá nhân', 'Trọn bộ 24 bài giảng Spec-Driven Web', 'Ưu tiên hỗ trợ qua Zalo 1-1', 'Quyền sử dụng cho dự án khách hàng'],
            highlighted: true,
            badge: 'Tiết kiệm 35%',
            ctaLabel: 'Mua gói Toàn diện',
          },
          {
            id: generateId('tier'),
            name: 'Gói Doanh nghiệp',
            price: '2.900.000đ',
            period: '/ đội ngũ',
            description: 'Dành cho team từ 3-10 thành viên cần chuẩn hóa hệ thống.',
            features: ['License cho tối đa 10 thành viên', '1 buổi workshop đào tạo nội bộ 2 giờ', 'Hỗ trợ tùy biến theo bộ nhận diện'],
            highlighted: false,
            ctaLabel: 'Liên hệ tư vấn',
          },
        ],
      };
    case 'testimonials':
      return {
        id,
        type: 'testimonials',
        visible: true,
        anchorId: 'testimonials',
        style: { surface: 'default', padding: 'normal' },
        variant: 'grid',
        badge: 'Khách hàng nói gì',
        title: 'Được tin tưởng bởi cộng đồng sáng tạo',
        subtitle: 'Hơn 1.800 khách hàng đã áp dụng thành công vào dự án và công việc kinh doanh.',
        items: [
          {
            id: generateId('tm'),
            name: 'Nguyễn Thu Hà',
            role: 'Founder, Bloom Skincare',
            quote: 'Chỉ mất một buổi chiều chỉnh sửa, trang bán sản phẩm mới giúp tỷ lệ khách để lại đơn của shop tăng gần gấp đôi.',
            rating: 5,
          },
          {
            id: generateId('tm'),
            name: 'Trần Quang Huy',
            role: 'Freelance Web Developer',
            quote: 'Cấu trúc cực kỳ sạch sẽ, đặc biệt phần giới thiệu cá nhân kết hợp bán dịch vụ rất tự nhiên và chuyên nghiệp.',
            rating: 5,
          },
          {
            id: generateId('tm'),
            name: 'Lê Hoàng Nam',
            role: 'Product Manager',
            quote: 'Tài liệu chi tiết và hỗ trợ rất nhanh. Đáng giá từng đồng cho những ai muốn ra mắt sản phẩm gọn lẹ.',
            rating: 5,
          },
        ],
      };
    case 'faq':
      return {
        id,
        type: 'faq',
        visible: true,
        anchorId: 'faq',
        style: { surface: 'alt', padding: 'normal' },
        variant: 'accordion',
        badge: 'Giải đáp nhanh',
        title: 'Câu hỏi thường gặp',
        subtitle: 'Mọi thắc mắc trước khi bạn quyết định đặt mua hoặc hợp tác.',
        items: [
          {
            id: generateId('fq'),
            question: 'Sau khi đặt mua thì tôi nhận sản phẩm bằng cách nào?',
            answer: 'Ngay sau khi bạn hoàn tất thông tin đặt hàng, hệ thống ghi nhận đơn và gửi hướng dẫn kích hoạt qua Email/Zalo trong vòng 5–10 phút.',
          },
          {
            id: generateId('fq'),
            question: 'Tôi chưa có nhiều kinh nghiệm kỹ thuật có dùng được không?',
            answer: 'Hoàn toàn được. Mọi sản phẩm đều đi kèm video hướng dẫn từng bước bằng tiếng Việt, dễ áp dụng ngay.',
          },
          {
            id: generateId('fq'),
            question: 'Chính sách bảo hành và hoàn tiền như thế nào?',
            answer: 'Bạn được hỗ trợ kỹ thuật trọn đời và có quyền yêu cầu hoàn tiền 100% trong 7 ngày đầu nếu sản phẩm không đúng cam kết.',
          },
        ],
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        visible: true,
        anchorId: 'cta',
        style: { surface: 'default', padding: 'normal' },
        variant: 'gradient-card',
        badge: 'Sẵn sàng bắt đầu?',
        title: 'Nâng tầm thương hiệu cá nhân & doanh số ngay hôm nay',
        subtitle: 'Đừng để ý tưởng tuyệt vời mãi nằm trên giấy. Chọn sản phẩm hoặc đặt lịch trao đổi ngay.',
        primaryLabel: 'Đặt mua sản phẩm',
        primaryHref: '#products',
        secondaryLabel: 'Nhắn tin tư vấn',
        secondaryHref: '#contact',
      };
    case 'contact':
      return {
        id,
        type: 'contact',
        visible: true,
        anchorId: 'contact',
        style: { surface: 'alt', padding: 'normal' },
        variant: 'split',
        badge: 'Kết nối trực tiếp',
        title: 'Liên hệ hoặc đặt lịch tư vấn',
        subtitle: 'Để lại thông tin, tôi sẽ phản hồi bạn trong vòng 2 giờ làm việc.',
        email: 'minhkhoi.design@gmail.com',
        phone: '0909 123 456',
        address: 'Quận 1, TP. Hồ Chí Minh',
        zaloLabel: 'Nhắn qua Zalo ngay',
        zaloHref: 'https://zalo.me',
        formSubmitLabel: 'Gửi yêu cầu cho tôi',
        successMessage: 'Cảm ơn bạn! Thông tin đã được gửi thành công, tôi sẽ liên hệ lại sớm nhất.',
      };
    case 'footer':
      return {
        id,
        type: 'footer',
        visible: true,
        anchorId: 'footer',
        style: { surface: 'contrast', padding: 'compact' },
        variant: 'columns',
        brandName: 'Minh Khôi Studio',
        brandDescription: 'Xây dựng sản phẩm số tinh gọn và trang bán hàng hiệu quả theo phương pháp Spec-Driven.',
        copyright: '© 2026 Minh Khôi Studio. Thiết kế với SpecPage.',
        columns: [
          {
            id: generateId('fc'),
            title: 'Khám phá',
            links: [
              { id: generateId('fl'), label: 'Về tôi', href: '#about' },
              { id: generateId('fl'), label: 'Sản phẩm', href: '#products' },
              { id: generateId('fl'), label: 'Bảng giá', href: '#pricing' },
            ],
          },
          {
            id: generateId('fc'),
            title: 'Hỗ trợ',
            links: [
              { id: generateId('fl'), label: 'Câu hỏi thường gặp', href: '#faq' },
              { id: generateId('fl'), label: 'Liên hệ trực tiếp', href: '#contact' },
              { id: generateId('fl'), label: 'Chính sách hoàn tiền', href: '#faq' },
            ],
          },
        ],
      };
  }
}

export interface StarterTemplateMeta {
  id: string;
  name: string;
  tag: string;
  description: string;
  spec: LandingPageSpec;
}

const nowIso = () => new Date().toISOString();

const creatorStoreSpec: LandingPageSpec = {
  specVersion: '1.0.0',
  templateId: 'creator-store',
  updatedAt: nowIso(),
  meta: {
    title: 'Minh Khôi — Product Designer & Cửa hàng Tài nguyên Số',
    description: 'Giới thiệu bản thân, dự án thiết kế và bán sản phẩm số chất lượng cao từ Minh Khôi.',
    favicon: '✨',
    floatingContact: {
      enabled: true,
      label: 'Tư vấn nhanh',
      href: '#contact',
    },
  },
  theme: cloneSpec(getPresetById('speckit-crisp').theme),
  sections: [
    createDefaultSection('navbar'),
    createDefaultSection('hero'),
    createDefaultSection('stats'),
    createDefaultSection('about'),
    createDefaultSection('products'),
    createDefaultSection('features'),
    createDefaultSection('testimonials'),
    createDefaultSection('faq'),
    createDefaultSection('cta'),
    createDefaultSection('contact'),
    createDefaultSection('footer'),
  ],
};

// Fix navbar branding on creatorStoreSpec cleanly
if (creatorStoreSpec.sections[0].type === 'navbar') {
  creatorStoreSpec.sections[0].logoText = 'Minh Khôi';
  creatorStoreSpec.sections[0].logoEmoji = '✨';
}

const productFlagshipSpec: LandingPageSpec = {
  specVersion: '1.0.0',
  templateId: 'product-flagship',
  updatedAt: nowIso(),
  meta: {
    title: 'Lumina Craft — Cà phê Đặc sản Rang mộc Đà Lạt & Dụng cụ Pha chế',
    description: 'Thưởng thức hương vị cà phê đặc sản Việt Nam rang mới mỗi tuần cùng bộ dụng cụ pha thủ công.',
    favicon: '☕',
    floatingContact: {
      enabled: true,
      label: 'Đặt hàng Zalo',
      href: '#contact',
    },
  },
  theme: cloneSpec(getPresetById('warm-editorial').theme),
  sections: [
    {
      id: 'nav-craft',
      type: 'navbar',
      visible: true,
      anchorId: 'top',
      style: { surface: 'default', padding: 'compact' },
      variant: 'solid',
      logoText: 'Lumina Craft',
      logoEmoji: '☕',
      links: [
        { id: 'nl-1', label: 'Câu chuyện', href: '#about' },
        { id: 'nl-2', label: 'Sản phẩm', href: '#products' },
        { id: 'nl-3', label: 'Combo tiết kiệm', href: '#pricing' },
        { id: 'nl-4', label: 'Hỏi đáp', href: '#faq' },
      ],
      ctaLabel: 'Đặt cà phê ngay',
      ctaHref: '#products',
    },
    {
      id: 'hero-craft',
      type: 'hero',
      visible: true,
      anchorId: 'home',
      style: { surface: 'default', padding: 'spacious' },
      variant: 'split-right',
      badge: 'Mùa thu hoạch mới · Cầu Đất 1.650m',
      headline: 'Hương vị cà phê đặc sản',
      highlightText: 'rang mộc mỗi tuần',
      subheadline:
        'Tuyển chọn 100% hạt chín đỏ từ nông trại Cầu Đất & Bảo Lộc, rang thủ công theo mẻ nhỏ để giữ trọn vị ngọt hậu và hương hoa trái tự nhiên.',
      primaryCtaLabel: 'Chọn mua ngay',
      primaryCtaHref: '#products',
      secondaryCtaLabel: 'Xem câu chuyện nông trại',
      secondaryCtaHref: '#about',
      imageUrl: PLACEHOLDER_ART.heroProduct,
      imageCaption: 'Đóng gói van 1 chiều giữ hương thơm 60 ngày',
      trustChips: ['Miễn phí ship từ 2 gói', 'Xay theo dụng cụ pha', 'Rang mới trong 48h'],
    },
    {
      id: 'stats-craft',
      type: 'stats',
      visible: true,
      anchorId: 'stats',
      style: { surface: 'alt', padding: 'compact' },
      variant: 'strip',
      items: [
        { id: 'sc-1', value: '86.5đ', label: 'Điểm thử nếm SCA', note: 'Chuẩn Specialty quốc tế' },
        { id: 'sc-2', value: '12.000+', label: 'Gói cà phê đã giao', note: 'Khắp 63 tỉnh thành' },
        { id: 'sc-3', value: '48 giờ', label: 'Từ lúc rang đến tay bạn', note: 'Luôn tươi mới nhất' },
        { id: 'sc-4', value: '100%', label: 'Hạt hái chín thủ công', note: 'Không pha trộn hương liệu' },
      ],
    },
    {
      id: 'products-craft',
      type: 'products',
      visible: true,
      anchorId: 'products',
      style: { surface: 'default', padding: 'normal' },
      variant: 'grid-3',
      badge: 'Bộ sưu tập tuyển chọn',
      title: 'Sản phẩm nổi bật tại xưởng rang',
      subtitle: 'Chọn mức xay phù hợp (Hạt nguyên, Phin, Pour-over, Espresso) ngay khi đặt hàng.',
      currency: 'đ',
      orderChannel: 'modal',
      items: [
        {
          id: 'pc-1',
          name: 'Arabica Cầu Đất Honey (250g)',
          badge: 'Yêu thích nhất',
          price: '245.000đ',
          originalPrice: '290.000đ',
          description: 'Hương cam vàng, mật ong rừng và sô-cô-la sữa dịu êm, ít đắng.',
          imageUrl: PLACEHOLDER_ART.productCoffee1,
          features: ['Độ cao 1.650m · Rang vừa (Medium)', 'Phù hợp Pour-over V60 & Espresso', 'Tặng kèm công thức pha chuẩn'],
          ctaLabel: 'Đặt mua gói này',
        },
        {
          id: 'pc-2',
          name: 'Bộ Phin Gốm & Cà phê Phố (Set)',
          badge: 'Quà tặng tinh tế',
          price: '480.000đ',
          originalPrice: '560.000đ',
          description: 'Gồm 1 phin gốm Bát Tràng men hỏa biến + 250g Fine Robusta đậm đà.',
          imageUrl: PLACEHOLDER_ART.productCoffee2,
          features: ['Giữ nhiệt gấp 2 lần phin nhôm', 'Hộp quà kraft kèm thiệp viết tay', 'Bảo hành nứt vỡ khi vận chuyển'],
          ctaLabel: 'Mua bộ quà tặng',
        },
        {
          id: 'pc-3',
          name: 'Combo Khám Phá 2 Vùng Trồng',
          badge: 'Tiết kiệm 15%',
          price: '430.000đ',
          originalPrice: '510.000đ',
          description: 'Gồm 1 gói Arabica Cầu Đất 250g và 1 gói Fine Robusta Bảo Lộc 250g.',
          imageUrl: PLACEHOLDER_ART.productCoffee3,
          features: ['Trải nghiệm 2 gu uống sáng & chiều', 'Miễn phí giao hàng toàn quốc', 'Tặng 10 tờ giấy lọc cao cấp'],
          ctaLabel: 'Đặt Combo ngay',
        },
      ],
    },
    {
      id: 'about-craft',
      type: 'about',
      visible: true,
      anchorId: 'about',
      style: { surface: 'alt', padding: 'normal' },
      variant: 'split-left',
      badge: 'Người đứng sau mẻ rang',
      title: 'Chào bạn, tôi là Hoàng Anh — Head Roaster',
      role: 'Sáng lập Lumina Craft · Q-Grader',
      bio: 'Bắt đầu từ tình yêu hạt cà phê Việt Nam năm 2019, tôi trực tiếp làm việc với các hộ nông dân tại Lâm Đồng để chuẩn hóa quy trình hái chín và lên men tự nhiên, mang ly cà phê sạch đúng nghĩa đến bàn làm việc của bạn.',
      avatarUrl: PLACEHOLDER_ART.avatarCreator,
      highlights: ['Rang mẻ nhỏ bằng máy Giesen', 'Truy xuất nguồn gốc từng lô', 'Không chất bảo quản'],
      milestones: [
        { id: 'mc-1', year: '2025', title: 'Xưởng rang mới tại Đà Lạt', detail: 'Phục vụ hơn 3.000 khách hàng cá nhân & 25 quán đối tác.' },
        { id: 'mc-2', year: '2021', title: 'Chứng chỉ CQI Q-Arabica Grader', detail: 'Chuẩn hóa quy trình kiểm soát chất lượng từng mẻ rang.' },
      ],
      socials: [
        { id: 'sc-fb', label: 'Fanpage', href: 'https://facebook.com' },
        { id: 'sc-ig', label: 'Instagram', href: 'https://instagram.com' },
      ],
    },
    {
      id: 'testimonials-craft',
      type: 'testimonials',
      visible: true,
      anchorId: 'testimonials',
      style: { surface: 'default', padding: 'normal' },
      variant: 'grid',
      badge: 'Đánh giá thực tế',
      title: 'Hơn 4.500 tách cà phê ngon mỗi sáng',
      subtitle: 'Cảm nhận từ những khách hàng đã gắn bó cùng Lumina Craft.',
      items: [
        { id: 'tc-1', name: 'Anh Minh Đức', role: 'Kiến trúc sư, Hà Nội', quote: 'Mở gói ra là mùi thơm ngào ngạt dễ chịu, vị ngọt hậu rất rõ chứ không gắt cổ như cà phê công nghiệp.', rating: 5 },
        { id: 'tc-2', name: 'Chị Thảo Vy', role: 'Marketing Lead, TP.HCM', quote: 'Đặt bộ phin gốm làm quà sinh nhật cho sếp cực kỳ sang, đóng gói cẩn thận và giao siêu nhanh.', rating: 5 },
        { id: 'tc-3', name: 'Bạn Gia Bảo', role: 'Barista tại nhà', quote: 'Shop hỗ trợ tư vấn cỡ xay rất chuẩn cho máy Espresso gia đình, crema lên dày và thơm.', rating: 5 },
      ],
    },
    {
      id: 'faq-craft',
      type: 'faq',
      visible: true,
      anchorId: 'faq',
      style: { surface: 'alt', padding: 'normal' },
      variant: 'accordion',
      badge: 'Thắc mắc thường gặp',
      title: 'Thông tin đặt hàng & bảo quản',
      subtitle: 'Những câu hỏi phổ biến nhất từ khách hàng mới.',
      items: [
        { id: 'fc-1', question: 'Nên chọn cà phê nguyên hạt hay xay sẵn?', answer: 'Nếu bạn có máy xay tại nhà, hãy chọn nguyên hạt để giữ hương thơm lâu nhất. Nếu chưa có, hãy ghi chú dụng cụ pha (Phin, V60, Espresso) trong phần ghi chú đơn hàng để xưởng xay đúng cỡ cho bạn.' },
        { id: 'fc-2', question: 'Thời gian giao hàng mất bao lâu?', answer: 'Nội thành TP.HCM & Đà Lạt nhận trong 1–2 ngày. Hà Nội và các tỉnh khác từ 2–4 ngày làm việc.' },
      ],
    },
    {
      id: 'contact-craft',
      type: 'contact',
      visible: true,
      anchorId: 'contact',
      style: { surface: 'default', padding: 'normal' },
      variant: 'split',
      badge: 'Đặt hàng sỉ & lẻ',
      title: 'Cần tư vấn gu cà phê riêng?',
      subtitle: 'Nhắn ngay cho xưởng rang để được gợi ý dòng hạt hợp khẩu vị nhất.',
      email: 'hello@luminacraft.vn',
      phone: '0918 456 789',
      address: '42 Phan Đình Phùng, TP. Đà Lạt',
      zaloLabel: 'Chat Zalo xưởng rang',
      zaloHref: 'https://zalo.me',
      formSubmitLabel: 'Gửi yêu cầu tư vấn',
      successMessage: 'Đã nhận tin nhắn! Đội ngũ Lumina Craft sẽ gọi/nhắn Zalo cho bạn ngay.',
    },
    {
      id: 'footer-craft',
      type: 'footer',
      visible: true,
      anchorId: 'footer',
      style: { surface: 'contrast', padding: 'compact' },
      variant: 'columns',
      brandName: 'Lumina Craft Roastery',
      brandDescription: 'Cà phê đặc sản Việt Nam rang mộc mỗi tuần từ cao nguyên Lâm Đồng.',
      copyright: '© 2026 Lumina Craft. Tất cả bản quyền được bảo lưu.',
      columns: [
        {
          id: 'fcc-1',
          title: 'Sản phẩm',
          links: [
            { id: 'fcl-1', label: 'Arabica Cầu Đất', href: '#products' },
            { id: 'fcl-2', label: 'Bộ Phin Gốm', href: '#products' },
          ],
        },
        {
          id: 'fcc-2',
          title: 'Hỗ trợ',
          links: [
            { id: 'fcl-3', label: 'Hướng dẫn pha chế', href: '#faq' },
            { id: 'fcl-4', label: 'Liên hệ đặt sỉ', href: '#contact' },
          ],
        },
      ],
    },
  ],
};

const personalPortfolioSpec: LandingPageSpec = {
  specVersion: '1.0.0',
  templateId: 'personal-portfolio',
  updatedAt: nowIso(),
  meta: {
    title: 'Lan Phương — Brand Strategist & UI/UX Consultant',
    description: 'Trang cá nhân giới thiệu năng lực, kinh nghiệm và dịch vụ tư vấn thiết kế thương hiệu của Lan Phương.',
    favicon: '⚡',
    floatingContact: {
      enabled: true,
      label: 'Đặt lịch trao đổi',
      href: '#contact',
    },
  },
  theme: cloneSpec(getPresetById('obsidian-studio').theme),
  sections: [
    {
      id: 'nav-port',
      type: 'navbar',
      visible: true,
      anchorId: 'top',
      style: { surface: 'default', padding: 'compact' },
      variant: 'floating',
      logoText: 'Lan Phương',
      logoEmoji: '⚡',
      links: [
        { id: 'np-1', label: 'Hồ sơ', href: '#about' },
        { id: 'np-2', label: 'Chuyên môn', href: '#features' },
        { id: 'np-3', label: 'Gói tư vấn', href: '#pricing' },
        { id: 'np-4', label: 'Liên hệ', href: '#contact' },
      ],
      ctaLabel: 'Book lịch hẹn',
      ctaHref: '#contact',
    },
    {
      id: 'hero-port',
      type: 'hero',
      visible: true,
      anchorId: 'home',
      style: { surface: 'default', padding: 'spacious' },
      variant: 'centered',
      badge: 'Sẵn sàng nhận 2 dự án mới trong tháng này',
      headline: 'Thiết kế thương hiệu số',
      highlightText: 'sắc nét và khác biệt',
      subheadline:
        'Tôi là Lan Phương — Brand Strategist & UI/UX Consultant với 8 năm giúp các nhà sáng lập xây dựng hình ảnh đáng tin cậy và bứt phá doanh thu online.',
      primaryCtaLabel: 'Xem các gói hợp tác',
      primaryCtaHref: '#pricing',
      secondaryCtaLabel: 'Đọc câu chuyện của tôi',
      secondaryCtaHref: '#about',
      imageUrl: PLACEHOLDER_ART.heroTech,
      imageCaption: 'Từ chiến lược định vị đến giao diện sản phẩm hoàn chỉnh',
      trustChips: ['40+ dự án thành công', 'Hợp đồng & lộ trình rõ ràng', 'Bàn giao toàn bộ file gốc'],
    },
    {
      id: 'about-port',
      type: 'about',
      visible: true,
      anchorId: 'about',
      style: { surface: 'alt', padding: 'normal' },
      variant: 'split-right',
      badge: 'Giới thiệu bản thân',
      title: 'Kết hợp tư duy chiến lược và thẩm mỹ hiện đại',
      role: 'Brand Strategist & Lead Consultant',
      bio: 'Trước khi làm việc độc lập, tôi từng phụ trách trải nghiệm sản phẩm tại các công ty Fintech và Thương mại điện tử hàng đầu. Triết lý làm việc của tôi là đơn giản hóa thông điệp để khách hàng hiểu giá trị của bạn chỉ trong 5 giây đầu tiên.',
      avatarUrl: PLACEHOLDER_ART.avatarConsultant,
      highlights: ['Định vị Thương hiệu', 'Thiết kế Landing Page & Web App', 'Design System & Figma', 'Cố vấn Pitch Deck'],
      milestones: [
        { id: 'mp-1', year: '2023 – Nay', title: 'Cố vấn độc lập cho 25+ Startup', detail: 'Giúp khách hàng gọi vốn thành công và tăng gấp đôi tỷ lệ chuyển đổi web.' },
        { id: 'mp-2', year: '2019 – 2023', title: 'Senior Product Designer', detail: 'Giải thưởng Thiết kế Trải nghiệm Số xuất sắc năm 2022.' },
      ],
      socials: [
        { id: 'sp-1', label: 'Behance', href: 'https://behance.net' },
        { id: 'sp-2', label: 'LinkedIn', href: 'https://linkedin.com' },
        { id: 'sp-3', label: 'Email', href: 'mailto:lanphuong@studio.vn' },
      ],
    },
    {
      id: 'features-port',
      type: 'features',
      visible: true,
      anchorId: 'features',
      style: { surface: 'default', padding: 'normal' },
      variant: 'bento',
      badge: 'Quy trình làm việc',
      title: 'Rõ ràng theo từng bước Spec-Driven',
      subtitle: 'Không làm việc cảm tính — mọi giai đoạn đều có bản đặc tả (Spec) để bạn kiểm soát tiến độ.',
      items: [
        { id: 'fp-1', icon: 'compass', title: '01. Khám phá & Định vị', description: 'Phỏng vấn mục tiêu, chân dung khách hàng và điểm khác biệt cốt lõi.' },
        { id: 'fp-2', icon: 'palette', title: '02. Thiết kế Hệ thống & UI', description: 'Xây dựng moodboard, màu sắc, typography và bản mẫu tương tác trực quan.' },
        { id: 'fp-3', icon: 'rocket', title: '03. Hoàn thiện & Bàn giao', description: 'Tinh chỉnh từng pixel trên desktop & mobile và đồng hành ra mắt.' },
      ],
    },
    {
      id: 'pricing-port',
      type: 'pricing',
      visible: true,
      anchorId: 'pricing',
      style: { surface: 'alt', padding: 'normal' },
      variant: 'columns',
      badge: 'Dịch vụ & Hợp tác',
      title: 'Chọn hình thức đồng hành cùng tôi',
      subtitle: 'Chi phí minh bạch, cam kết đúng tiến độ đã thống nhất.',
      tiers: [
        {
          id: 'tp-1',
          name: 'Tư vấn 1-1 Chuyên sâu',
          price: '1.800.000đ',
          period: '/ buổi 90 phút',
          description: 'Gỡ rối chiến lược, review website hoặc sản phẩm hiện tại.',
          features: ['Chuẩn bị tài liệu trước buổi họp', '90 phút phân tích 1-1 qua Google Meet', 'Bản ghi hình + Checklist hành động'],
          highlighted: false,
          ctaLabel: 'Đặt lịch 1-1',
        },
        {
          id: 'tp-2',
          name: 'Thiết kế Landing Page Trọn gói',
          price: '12.500.000đ',
          period: '/ dự án 10 ngày',
          description: 'Dành cho sản phẩm mới cần trang bán hàng chuẩn quốc tế.',
          features: ['Viết cấu trúc nội dung bán hàng', 'Thiết kế UI/UX độc quyền desktop & mobile', 'Bàn giao code / HTML hoàn chỉnh', 'Bảo hành chỉnh sửa 30 ngày'],
          highlighted: true,
          badge: 'Phổ biến nhất',
          ctaLabel: 'Đặt dự án này',
        },
      ],
    },
    {
      id: 'contact-port',
      type: 'contact',
      visible: true,
      anchorId: 'contact',
      style: { surface: 'default', padding: 'normal' },
      variant: 'split',
      badge: 'Bắt đầu cuộc trò chuyện',
      title: 'Kể cho tôi nghe về dự án của bạn',
      subtitle: 'Tôi thường phản hồi trong ngày với đề xuất lộ trình sơ bộ miễn phí.',
      email: 'lanphuong.design@gmail.com',
      phone: '0938 777 999',
      address: 'Quận 3, TP. Hồ Chí Minh · Làm việc Remote toàn cầu',
      zaloLabel: 'Trao đổi nhanh qua Zalo',
      zaloHref: 'https://zalo.me',
      formSubmitLabel: 'Gửi mô tả dự án',
      successMessage: 'Cảm ơn bạn! Tôi đã nhận thông tin và sẽ liên hệ lại trong vòng 24 giờ.',
    },
    {
      id: 'footer-port',
      type: 'footer',
      visible: true,
      anchorId: 'footer',
      style: { surface: 'contrast', padding: 'compact' },
      variant: 'minimal',
      brandName: 'Lan Phương Consulting',
      brandDescription: 'Brand Strategy & High-Converting Digital Experiences.',
      copyright: '© 2026 Lan Phương. Built with SpecPage.',
      columns: [],
    },
  ],
};

const speckitTechSpec: LandingPageSpec = {
  specVersion: '1.0.0',
  templateId: 'speckit-tech',
  updatedAt: nowIso(),
  meta: {
    title: 'SpecKit — Phát triển phần mềm chuẩn Spec-Driven',
    description: 'Biến bản đặc tả (Specification) thành sản phẩm chạy thực tế nhanh gấp 5 lần với Spec-Driven Development.',
    favicon: '🌱',
    floatingContact: {
      enabled: true,
      label: 'Dùng thử ngay',
      href: '#products',
    },
  },
  theme: cloneSpec(getPresetById('speckit-crisp').theme),
  sections: [
    {
      id: 'nav-sk',
      type: 'navbar',
      visible: true,
      anchorId: 'top',
      style: { surface: 'default', padding: 'compact' },
      variant: 'glass',
      logoText: 'Spec Kit',
      logoEmoji: '🌱',
      links: [
        { id: 'nsk-1', label: 'Triết lý SDD', href: '#features' },
        { id: 'nsk-2', label: 'Bộ công cụ', href: '#products' },
        { id: 'nsk-3', label: 'Bảng giá', href: '#pricing' },
        { id: 'nsk-4', label: 'FAQ', href: '#faq' },
      ],
      ctaLabel: 'Bắt đầu miễn phí',
      ctaHref: '#products',
    },
    {
      id: 'hero-sk',
      type: 'hero',
      visible: true,
      anchorId: 'home',
      style: { surface: 'default', padding: 'spacious' },
      variant: 'centered',
      badge: 'Lấy cảm hứng từ SpecKit.org',
      headline: 'Xây dựng sản phẩm chất lượng cao',
      highlightText: 'nhanh hơn với Spec Kit',
      subheadline:
        'Thay vì sửa đi sửa lại vì hiểu sai yêu cầu, phương pháp Spec-Driven biến bản đặc tả thành nguồn chân lý duy nhất để tạo ra sản phẩm hoàn chỉnh.',
      primaryCtaLabel: 'Khám phá giải pháp',
      primaryCtaHref: '#products',
      secondaryCtaLabel: 'Xem quy trình 4 bước',
      secondaryCtaHref: '#features',
      imageUrl: PLACEHOLDER_ART.heroCreator,
      imageCaption: 'Từ Constitution → Specify → Plan → Tasks → Sản phẩm thực tế',
      trustChips: ['Rõ ràng từ ngày đầu', 'Kiểm soát cấu trúc dễ dàng', 'Xuất bản tức thì'],
    },
    {
      id: 'stats-sk',
      type: 'stats',
      visible: true,
      anchorId: 'stats',
      style: { surface: 'alt', padding: 'compact' },
      variant: 'cards',
      items: [
        { id: 'ssk-1', value: '5x', label: 'Tốc độ ra mắt sản phẩm', note: 'Nhờ spec chuẩn hóa' },
        { id: 'ssk-2', value: '12+', label: 'Khối giao diện linh hoạt', note: 'Tùy biến không giới hạn' },
        { id: 'ssk-3', value: '100%', label: 'Chủ động sở hữu mã nguồn', note: 'Xuất file HTML độc lập' },
        { id: 'ssk-4', value: '0đ', label: 'Phí duy trì nền tảng', note: 'Tự do host mọi nơi' },
      ],
    },
    {
      id: 'features-sk',
      type: 'features',
      visible: true,
      anchorId: 'features',
      style: { surface: 'default', padding: 'normal' },
      variant: 'grid-3',
      badge: 'Quy trình Spec-Driven',
      title: 'Từ ý tưởng đến trang bán hàng trong 4 bước',
      subtitle: 'Cấu trúc rõ ràng như tài liệu kỹ thuật nhưng trực quan cho mọi người kinh doanh.',
      items: [
        { id: 'fsk-1', icon: 'book-open', title: '1. Constitution & Spec', description: 'Định hình phong cách thương hiệu, màu sắc, font chữ và mục tiêu chuyển đổi.' },
        { id: 'fsk-2', icon: 'layers', title: '2. Plan Cấu trúc khối', description: 'Kéo thả sắp xếp thứ tự các section giới thiệu bản thân, sản phẩm và đánh giá.' },
        { id: 'fsk-3', icon: 'code', title: '3. Implement & Export', description: 'Xuất bản ngay trang web HTML sạch sẽ, tối ưu SEO để khách hàng truy cập.' },
      ],
    },
    createDefaultSection('products'),
    createDefaultSection('faq'),
    createDefaultSection('cta'),
    createDefaultSection('footer'),
  ],
};

export const STARTER_TEMPLATES: StarterTemplateMeta[] = [
  {
    id: 'creator-store',
    name: 'Cá nhân & Bán sản phẩm',
    tag: 'Phổ biến nhất',
    description: 'Kết hợp giới thiệu bản thân chuyên nghiệp + bán sản phẩm số / dịch vụ.',
    spec: creatorStoreSpec,
  },
  {
    id: 'product-flagship',
    name: 'Cửa hàng Bán sản phẩm',
    tag: 'Thương mại',
    description: 'Tập trung trưng bày sản phẩm, ưu đãi combo, đánh giá và chốt đơn nhanh.',
    spec: productFlagshipSpec,
  },
  {
    id: 'personal-portfolio',
    name: 'Portfolio & Tư vấn (Dark)',
    tag: 'Cá nhân',
    description: 'Phong cách Dark Luxury dành cho chuyên gia, freelancer và dịch vụ 1-1.',
    spec: personalPortfolioSpec,
  },
  {
    id: 'speckit-tech',
    name: 'SpecKit Tech Launch',
    tag: 'SpecKit.org',
    description: 'Phong cách Apple Crisp lấy cảm hứng trực tiếp từ speckit.org.',
    spec: speckitTechSpec,
  },
];

export function getTemplateSpec(templateId: string): LandingPageSpec {
  const found = STARTER_TEMPLATES.find((t) => t.id === templateId) ?? STARTER_TEMPLATES[0];
  return cloneSpec({
    ...found.spec,
    updatedAt: new Date().toISOString(),
  });
}
