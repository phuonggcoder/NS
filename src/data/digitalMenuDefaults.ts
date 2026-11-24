import type {
  DigitalMenuConfig,
  MenuCategory,
  MenuItem,
  MenuOptionGroup,
} from '../types/spec';
import { PLACEHOLDER_ART } from './placeholders';
import { generateId } from '../utils/storage';

export type MenuIndustry = 'restaurant' | 'coffee-shop' | 'milk-tea' | 'bakery' | 'general';

export const COMMON_ALLERGENS = [
  'Sữa',
  'Đậu phộng',
  'Hạt cây',
  'Gluten / Lúa mì',
  'Trứng',
  'Hải sản',
  'Đậu nành',
  'Caffeine',
];

export {
  calculateConfiguredItemPrice,
  formatMenuPrice,
  getDefaultOptionSelections,
  getEffectiveBasePrice,
  validateRequiredOptionGroups,
} from './menuPricing';

export function createPresetOptionGroup(kind: 'size' | 'sugar' | 'ice' | 'topping' | 'addons'): MenuOptionGroup {
  switch (kind) {
    case 'size':
      return {
        id: generateId('optg'),
        name: 'Kích cỡ (Size)',
        type: 'single',
        required: true,
        choices: [
          { id: generateId('optc'), label: 'Size M (Tiêu chuẩn)', priceDelta: 0, defaultSelected: true },
          { id: generateId('optc'), label: 'Size L (Lớn)', priceDelta: 10000 },
        ],
      };
    case 'sugar':
      return {
        id: generateId('optg'),
        name: 'Mức đường',
        type: 'single',
        required: true,
        choices: [
          { id: generateId('optc'), label: '100% Đường', priceDelta: 0 },
          { id: generateId('optc'), label: '70% Đường (Vừa)', priceDelta: 0, defaultSelected: true },
          { id: generateId('optc'), label: '50% Đường (Ít ngọt)', priceDelta: 0 },
          { id: generateId('optc'), label: '0% Đường', priceDelta: 0 },
        ],
      };
    case 'ice':
      return {
        id: generateId('optg'),
        name: 'Mức đá',
        type: 'single',
        required: true,
        choices: [
          { id: generateId('optc'), label: 'Đá bình thường', priceDelta: 0, defaultSelected: true },
          { id: generateId('optc'), label: 'Ít đá', priceDelta: 0 },
          { id: generateId('optc'), label: 'Đá riêng', priceDelta: 0 },
          { id: generateId('optc'), label: 'Nóng / Không đá', priceDelta: 0 },
        ],
      };
    case 'topping':
      return {
        id: generateId('optg'),
        name: 'Topping thêm',
        type: 'multiple',
        required: false,
        maxSelect: 4,
        choices: [
          { id: generateId('optc'), label: 'Trân châu đen đường nâu', priceDelta: 8000 },
          { id: generateId('optc'), label: 'Kem Cheese mặn', priceDelta: 12000 },
          { id: generateId('optc'), label: 'Thạch Oolong / Nha đam', priceDelta: 7000 },
          { id: generateId('optc'), label: 'Pudding trứng', priceDelta: 10000 },
        ],
      };
    case 'addons':
      return {
        id: generateId('optg'),
        name: 'Nguyên liệu thêm / bớt',
        type: 'multiple',
        required: false,
        choices: [
          { id: generateId('optc'), label: 'Thêm phô mai / trứng ốp la', priceDelta: 15000 },
          { id: generateId('optc'), label: 'Thêm thịt / phần ăn lớn', priceDelta: 25000 },
          { id: generateId('optc'), label: 'Không hành / không cay', priceDelta: 0 },
        ],
      };
  }
}

export function createDefaultDigitalMenu(
  industry: MenuIndustry = 'general',
  brandName?: string
): DigitalMenuConfig {
  const cat1Id = generateId('mcat');
  const cat2Id = generateId('mcat');
  const cat3Id = generateId('mcat');

  if (industry === 'coffee-shop') {
    const categories: MenuCategory[] = [
      {
        id: cat1Id,
        name: 'Cà Phê Đặc Sản',
        description: 'Rang mộc Arabica & Robusta tuyển chọn mỗi ngày',
        imageUrl: PLACEHOLDER_ART.heroProduct,
        visible: true,
        sortOrder: 0,
      },
      {
        id: cat2Id,
        name: 'Trà & Cold Brew',
        description: 'Ủ lạnh 18 giờ thanh mát, ít đường tự nhiên',
        imageUrl: PLACEHOLDER_ART.productCoffee2,
        visible: true,
        sortOrder: 1,
      },
      {
        id: cat3Id,
        name: 'Bánh Ngọt Kèm',
        description: 'Nướng mới mỗi sáng tại quầy',
        imageUrl: PLACEHOLDER_ART.productCoffee3,
        visible: true,
        sortOrder: 2,
      },
    ];
    const items: MenuItem[] = [
      {
        id: generateId('mitem'),
        categoryId: cat1Id,
        name: 'Cà Phê Sữa Đá Sài Gòn',
        description: 'Robusta Honey rang đậm vừa, hòa quyện sữa đặc béo thơm cân bằng.',
        imageUrl: PLACEHOLDER_ART.heroProduct,
        price: 39000,
        status: 'available',
        featured: true,
        bestSeller: true,
        ingredients: 'Robusta Đắk Lắk, sữa đặc, đá viên tinh khiết',
        allergens: ['Sữa', 'Caffeine'],
        optionGroups: [
          createPresetOptionGroup('size'),
          createPresetOptionGroup('sugar'),
          createPresetOptionGroup('ice'),
        ],
        sortOrder: 0,
      },
      {
        id: generateId('mitem'),
        categoryId: cat1Id,
        name: 'Bạc Xỉu Kem Muối',
        description: 'Lớp kem muối mịn mặn nhẹ trên nền cà phê sữa thơm dịu.',
        imageUrl: PLACEHOLDER_ART.productCoffee1,
        price: 49000,
        salePrice: 45000,
        status: 'available',
        bestSeller: true,
        ingredients: 'Espresso Arabica, sữa tươi, kem muối biển',
        allergens: ['Sữa', 'Caffeine'],
        optionGroups: [createPresetOptionGroup('size'), createPresetOptionGroup('ice')],
        sortOrder: 1,
      },
      {
        id: generateId('mitem'),
        categoryId: cat2Id,
        name: 'Cold Brew Cam Sả',
        description: 'Cà phê ủ lạnh 18 giờ kết hợp cam vàng tươi và hương sả dịu nhẹ.',
        imageUrl: PLACEHOLDER_ART.productCoffee2,
        price: 55000,
        status: 'available',
        featured: true,
        ingredients: 'Arabica Cầu Đất ủ lạnh, cam vàng, sả tươi',
        allergens: ['Caffeine'],
        optionGroups: [createPresetOptionGroup('size'), createPresetOptionGroup('sugar')],
        sortOrder: 2,
      },
      {
        id: generateId('mitem'),
        categoryId: cat3Id,
        name: 'Croissant Bơ Pháp',
        description: 'Vỏ ngàn lớp giòn tan, thơm ngậy bơ lạt Normandy.',
        imageUrl: PLACEHOLDER_ART.productCoffee3,
        price: 42000,
        status: 'available',
        ingredients: 'Bột mì Pháp, bơ lạt, trứng gà, men tươi',
        allergens: ['Gluten / Lúa mì', 'Sữa', 'Trứng'],
        optionGroups: [],
        sortOrder: 3,
      },
    ];
    return {
      enabled: true,
      brandName: brandName || 'Mộc Roastery & Café',
      currency: 'đ',
      description: 'Thực đơn đồ uống & bánh ngọt pha chế tươi mỗi ngày',
      categories,
      items,
      theme: {
        layout: 'grid',
        mode: 'light',
        primaryColor: '#8B4513',
        accentColor: '#D97706',
        backgroundColor: '#FFFBF5',
        textColor: '#292018',
        fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
        bannerUrl: PLACEHOLDER_ART.heroProduct,
        bannerTitle: brandName || 'Mộc Roastery & Café',
        bannerSubtitle: 'Quét QR gọi món nhanh · Rang mới mỗi ngày',
        showCategoryNav: true,
      },
      qrTargets: [{ id: generateId('qr'), label: 'Quầy chính / Chung', branch: 'chi-nhanh-1', table: '' }],
    };
  }

  if (industry === 'milk-tea') {
    const categories: MenuCategory[] = [
      { id: cat1Id, name: 'Trà Sữa Signature', description: 'Trà lá nguyên chất pha cùng sữa tươi thanh béo', visible: true, sortOrder: 0 },
      { id: cat2Id, name: 'Trà Trái Cây Tươi', description: 'Trái cây theo mùa giải nhiệt cực đã', visible: true, sortOrder: 1 },
      { id: cat3Id, name: 'Topping & Kem Cheese', description: 'Làm mới mỗi 4 giờ tại quầy', visible: true, sortOrder: 2 },
    ];
    const items: MenuItem[] = [
      {
        id: generateId('mitem'),
        categoryId: cat1Id,
        name: 'Trà Sữa Oolong Rang Kem Cheese',
        description: 'Hương trà Oolong Bảo Lộc nướng đậm, phủ lớp kem phô mai mặn béo.',
        imageUrl: PLACEHOLDER_ART.productCoffee2,
        price: 48000,
        salePrice: 42000,
        status: 'available',
        featured: true,
        bestSeller: true,
        ingredients: 'Trà Oolong Bảo Lộc, sữa tươi, kem phô mai',
        allergens: ['Sữa', 'Caffeine'],
        optionGroups: [
          createPresetOptionGroup('size'),
          createPresetOptionGroup('sugar'),
          createPresetOptionGroup('ice'),
          createPresetOptionGroup('topping'),
        ],
        sortOrder: 0,
      },
      {
        id: generateId('mitem'),
        categoryId: cat1Id,
        name: 'Sữa Tươi Trân Châu Đường Đen',
        description: 'Trân châu nấu đường mía Okinawa dẻo thơm cùng sữa tươi thanh trùng.',
        imageUrl: PLACEHOLDER_ART.productCoffee1,
        price: 45000,
        status: 'available',
        bestSeller: true,
        ingredients: 'Sữa tươi thanh trùng, trân châu đường đen',
        allergens: ['Sữa'],
        optionGroups: [
          createPresetOptionGroup('size'),
          createPresetOptionGroup('ice'),
          createPresetOptionGroup('topping'),
        ],
        sortOrder: 1,
      },
      {
        id: generateId('mitem'),
        categoryId: cat2Id,
        name: 'Trà Đào Cam Sả',
        description: 'Trà đen ủ lạnh thơm ngát cùng đào giòn và cam tươi.',
        imageUrl: PLACEHOLDER_ART.heroProduct,
        price: 45000,
        status: 'available',
        ingredients: 'Hồng trà, đào ngâm giòn, cam vàng, sả',
        allergens: ['Caffeine'],
        optionGroups: [
          createPresetOptionGroup('size'),
          createPresetOptionGroup('sugar'),
          createPresetOptionGroup('ice'),
        ],
        sortOrder: 2,
      },
    ];
    return {
      enabled: true,
      brandName: brandName || 'Tiệm Trà Sữa LÁ',
      currency: 'đ',
      description: 'Tùy chọn Size, Đường, Đá & Topping chuẩn gu của bạn',
      categories,
      items,
      theme: {
        layout: 'grid',
        mode: 'light',
        primaryColor: '#059669',
        accentColor: '#F59E0B',
        backgroundColor: '#F8FAFC',
        textColor: '#0F172A',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        bannerUrl: PLACEHOLDER_ART.productCoffee2,
        bannerTitle: brandName || 'Tiệm Trà Sữa LÁ',
        bannerSubtitle: 'Trà tươi ủ mới · Topping nấu mỗi ngày',
        showCategoryNav: true,
      },
      qrTargets: [{ id: generateId('qr'), label: 'Bàn 01', branch: 'trung-tam', table: 'ban-01' }],
    };
  }

  if (industry === 'bakery') {
    const categories: MenuCategory[] = [
      { id: cat1Id, name: 'Bánh Nướng Mỗi Sáng', description: 'Croissant, Brioche và bánh mì lên men tự nhiên', visible: true, sortOrder: 0 },
      { id: cat2Id, name: 'Bánh Kem & Mousse', description: 'Ít ngọt, trang trí tinh tế cho tiệc và quà tặng', visible: true, sortOrder: 1 },
    ];
    const items: MenuItem[] = [
      {
        id: generateId('mitem'),
        categoryId: cat1Id,
        name: 'Bánh Sừng Bò Hạnh Nhân',
        description: 'Nhân kem hạnh nhân béo bùi, phủ lát hạnh nhân nướng giòn.',
        imageUrl: PLACEHOLDER_ART.productCoffee3,
        price: 55000,
        status: 'available',
        bestSeller: true,
        featured: true,
        ingredients: 'Bột mì, bơ Pháp, hạnh nhân lát, trứng',
        allergens: ['Gluten / Lúa mì', 'Sữa', 'Hạt cây', 'Trứng'],
        optionGroups: [createPresetOptionGroup('addons')],
        sortOrder: 0,
      },
      {
        id: generateId('mitem'),
        categoryId: cat2Id,
        name: 'Tiramisu Cacao Ý',
        description: 'Mascarpone mềm mịn thấm đẫm Espresso và bột cacao nguyên chất.',
        imageUrl: PLACEHOLDER_ART.productCoffee1,
        price: 75000,
        salePrice: 68000,
        status: 'available',
        bestSeller: true,
        ingredients: 'Mascarpone, bánh Ladyfinger, Espresso, cacao',
        allergens: ['Sữa', 'Trứng', 'Gluten / Lúa mì', 'Caffeine'],
        optionGroups: [createPresetOptionGroup('size')],
        sortOrder: 1,
      },
    ];
    return {
      enabled: true,
      brandName: brandName || 'Bếp Bánh Maison',
      currency: 'đ',
      description: 'Bánh thủ công nướng tươi mỗi ngày không chất bảo quản',
      categories,
      items,
      theme: {
        layout: 'grid',
        mode: 'light',
        primaryColor: '#B45309',
        accentColor: '#E11D48',
        backgroundColor: '#FFFDF9',
        textColor: '#27272A',
        fontFamily: "'Lora', Georgia, serif",
        bannerUrl: PLACEHOLDER_ART.productCoffee3,
        bannerTitle: brandName || 'Bếp Bánh Maison',
        bannerSubtitle: 'Bánh tươi ra lò 07:00 mỗi ngày',
        showCategoryNav: true,
      },
      qrTargets: [{ id: generateId('qr'), label: 'Menu tại tiệm', branch: 'tiem-chinh', table: '' }],
    };
  }

  // Restaurant / General default
  const categories: MenuCategory[] = [
    { id: cat1Id, name: 'Món Đặc Trưng', description: 'Các món được thực khách yêu thích nhất', visible: true, sortOrder: 0 },
    { id: cat2Id, name: 'Món Chính & Lẩu', description: 'Chế biến từ nguyên liệu tươi theo ngày', visible: true, sortOrder: 1 },
    { id: cat3Id, name: 'Đồ Uống & Tráng Miệng', description: 'Trà thảo mộc và tráng miệng thanh mát', visible: true, sortOrder: 2 },
  ];
  const items: MenuItem[] = [
    {
      id: generateId('mitem'),
      categoryId: cat1Id,
      name: 'Gỏi Cuốn Tôm Thịt Đặc Biệt',
      description: 'Tôm sú tươi, thịt ba chỉ luộc mềm, rau thơm vườn cuộn bánh tráng dẻo cùng sốt tương đậu.',
      imageUrl: PLACEHOLDER_ART.productCoffee1,
      price: 85000,
      salePrice: 75000,
      status: 'available',
      featured: true,
      bestSeller: true,
      ingredients: 'Tôm sú, thịt ba chỉ, bún tươi, rau sống, sốt đậu phộng',
      allergens: ['Hải sản', 'Đậu phộng'],
      optionGroups: [createPresetOptionGroup('addons')],
      sortOrder: 0,
    },
    {
      id: generateId('mitem'),
      categoryId: cat2Id,
      name: 'Bò Lúc Lắc Khoai Tây Chiên',
      description: 'Thăn bò Úc áp chảo lửa lớn giữ độ mọng nước, sốt tiêu đen đậm đà.',
      imageUrl: PLACEHOLDER_ART.productCoffee2,
      price: 185000,
      status: 'available',
      bestSeller: true,
      ingredients: 'Thăn bò Úc, ớt chuông, hành tây, khoai tây chiên',
      allergens: ['Đậu nành'],
      optionGroups: [createPresetOptionGroup('size'), createPresetOptionGroup('addons')],
      sortOrder: 1,
    },
    {
      id: generateId('mitem'),
      categoryId: cat3Id,
      name: 'Trà Sen Vàng Hạt Chia',
      description: 'Thanh mát giải nhiệt sau bữa ăn.',
      imageUrl: PLACEHOLDER_ART.productCoffee3,
      price: 45000,
      status: 'available',
      ingredients: 'Trà sen Tây Hồ, hạt sen tươi, hạt chia',
      allergens: [],
      optionGroups: [createPresetOptionGroup('sugar'), createPresetOptionGroup('ice')],
      sortOrder: 2,
    },
  ];

  return {
    enabled: industry === 'restaurant',
    brandName: brandName || 'Nhà Hàng Vị Việt',
    currency: 'đ',
    description: 'Thực đơn điện tử tương tác — Chạm vào món để xem thành phần & tùy chọn',
    categories,
    items,
    theme: {
      layout: 'list',
      mode: 'light',
      primaryColor: '#DC2626',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      fontFamily: "'Be Vietnam Pro', sans-serif",
      bannerUrl: PLACEHOLDER_ART.heroProduct,
      bannerTitle: brandName || 'Nhà Hàng Vị Việt',
      bannerSubtitle: 'Ẩm thực tinh hoa · Phục vụ tận bàn',
      showCategoryNav: true,
    },
    qrTargets: [{ id: generateId('qr'), label: 'Bàn 01 - Tầng 1', branch: 'co-so-1', table: 'ban-01' }],
  };
}
