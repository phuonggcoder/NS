import type { CSSProperties } from 'react';
import type { ThemeConfig } from '../types/spec';
import {
  hexToRgbTuple,
  isLightColor,
  pickReadableText,
  relativeLuminance,
} from '../utils/contrast';

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Lexend:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Merriweather:wght@400;700&family=Montserrat:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap';

export interface FontOption {
  id: string;
  label: string;
  cssValue: string;
  category: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'be-vietnam-pro',
    label: 'Be Vietnam Pro (Hiện đại)',
    cssValue: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'Sans-serif',
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta Sans (Công nghệ)',
    cssValue: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
    category: 'Sans-serif',
  },
  {
    id: 'lexend',
    label: 'Lexend (Dễ đọc, Sạch sẽ)',
    cssValue: "'Lexend', 'Be Vietnam Pro', sans-serif",
    category: 'Sans-serif',
  },
  {
    id: 'montserrat',
    label: 'Montserrat (Mạnh mẽ, Quảng cáo)',
    cssValue: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    category: 'Display',
  },
  {
    id: 'playfair',
    label: 'Playfair Display (Tạp chí / Sang trọng)',
    cssValue: "'Playfair Display', Georgia, serif",
    category: 'Serif',
  },
  {
    id: 'lora',
    label: 'Lora (Thủ công / Văn chương)',
    cssValue: "'Lora', Georgia, serif",
    category: 'Serif',
  },
  {
    id: 'merriweather',
    label: 'Merriweather (Báo chí / Uy tín)',
    cssValue: "'Merriweather', Georgia, serif",
    category: 'Serif',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk (Tech & Startup)',
    cssValue: "'Space Grotesk', 'Be Vietnam Pro', sans-serif",
    category: 'Display',
  },
  {
    id: 'inter',
    label: 'Inter / Apple Clean',
    cssValue: "'Inter', 'Be Vietnam Pro', -apple-system, sans-serif",
    category: 'Sans-serif',
  },
];

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'speckit-crisp',
    name: 'SpecKit Crisp',
    description: 'Tối giản kiểu Apple & SpecKit.org — sạch sẽ, sắc nét',
    theme: {
      presetId: 'speckit-crisp',
      mode: 'light',
      colors: {
        primary: '#007AFF',
        accent: '#5856D6',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F5F5F7',
        text: '#1D1D1F',
        muted: '#6E6E73',
        border: '#E5E5EA',
      },
      typography: {
        headingFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'standard',
      },
      shape: {
        radius: 'rounded',
        buttonStyle: 'gradient',
        cardStyle: 'bordered',
      },
      spacing: 'standard',
      containerWidth: 'standard',
      motion: 'subtle',
    },
  },
  {
    id: 'obsidian-studio',
    name: 'Obsidian Studio',
    description: 'Nền tối cao cấp dành cho Designer, Tech & Portfolio',
    theme: {
      presetId: 'obsidian-studio',
      mode: 'dark',
      colors: {
        primary: '#38BDF8',
        accent: '#818CF8',
        background: '#0B0D12',
        surface: '#131722',
        surfaceAlt: '#191E2D',
        text: '#F8FAFC',
        muted: '#A3B3C9',
        border: '#262D40',
      },
      typography: {
        headingFont: "'Space Grotesk', 'Be Vietnam Pro', sans-serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'standard',
      },
      shape: {
        radius: 'rounded',
        buttonStyle: 'gradient',
        cardStyle: 'glass',
      },
      spacing: 'standard',
      containerWidth: 'standard',
      motion: 'smooth',
    },
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    description: 'Kem ấm thủ công, tiêu đề Serif tinh tế cho thương hiệu bán lẻ',
    theme: {
      presetId: 'warm-editorial',
      mode: 'light',
      colors: {
        primary: '#C2410C',
        accent: '#D97706',
        background: '#FAF7F2',
        surface: '#FFFFFF',
        surfaceAlt: '#F1EAE0',
        text: '#29201B',
        muted: '#6D5D53',
        border: '#E4D8CA',
      },
      typography: {
        headingFont: "'Playfair Display', Georgia, serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'editorial',
      },
      shape: {
        radius: 'balanced',
        buttonStyle: 'solid',
        cardStyle: 'elevated',
      },
      spacing: 'spacious',
      containerWidth: 'standard',
      motion: 'subtle',
    },
  },
  {
    id: 'matcha-minimal',
    name: 'Matcha Botanical',
    description: 'Xanh thảo mộc thư thái cho sản phẩm tự nhiên & sức khỏe',
    theme: {
      presetId: 'matcha-minimal',
      mode: 'light',
      colors: {
        primary: '#15803D',
        accent: '#0D9488',
        background: '#F7FAF8',
        surface: '#FFFFFF',
        surfaceAlt: '#ECF3EE',
        text: '#132A1C',
        muted: '#4D6657',
        border: '#D7E5DC',
      },
      typography: {
        headingFont: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'standard',
      },
      shape: {
        radius: 'rounded',
        buttonStyle: 'solid',
        cardStyle: 'bordered',
      },
      spacing: 'standard',
      containerWidth: 'standard',
      motion: 'subtle',
    },
  },
  {
    id: 'cobalt-saas',
    name: 'Cobalt SaaS',
    description: 'Xanh Cobalt rực rỡ cho sản phẩm số, khóa học & công nghệ',
    theme: {
      presetId: 'cobalt-saas',
      mode: 'light',
      colors: {
        primary: '#2563EB',
        accent: '#06B6D4',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F5F9',
        text: '#0F172A',
        muted: '#475569',
        border: '#E2E8F0',
      },
      typography: {
        headingFont: "'Space Grotesk', 'Be Vietnam Pro', sans-serif",
        bodyFont: "'Inter', 'Be Vietnam Pro', -apple-system, sans-serif",
        scale: 'standard',
      },
      shape: {
        radius: 'balanced',
        buttonStyle: 'gradient',
        cardStyle: 'elevated',
      },
      spacing: 'standard',
      containerWidth: 'standard',
      motion: 'smooth',
    },
  },
  {
    id: 'rose-velvet',
    name: 'Rose Velvet',
    description: 'Hồng rượu thanh lịch cho mỹ phẩm, thời trang & creator nữ',
    theme: {
      presetId: 'rose-velvet',
      mode: 'light',
      colors: {
        primary: '#BE123C',
        accent: '#DB2777',
        background: '#FFFBFB',
        surface: '#FFFFFF',
        surfaceAlt: '#FDF2F4',
        text: '#2B141B',
        muted: '#6F505B',
        border: '#F3D7DE',
      },
      typography: {
        headingFont: "'Playfair Display', Georgia, serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'editorial',
      },
      shape: {
        radius: 'pill',
        buttonStyle: 'gradient',
        cardStyle: 'elevated',
      },
      spacing: 'spacious',
      containerWidth: 'standard',
      motion: 'smooth',
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Vàng champagne trên nền đen tuyền cho BĐS, tư vấn VIP & trang sức',
    theme: {
      presetId: 'midnight-gold',
      mode: 'dark',
      colors: {
        primary: '#EAB308',
        accent: '#F59E0B',
        background: '#09090B',
        surface: '#141418',
        surfaceAlt: '#1C1C22',
        text: '#FAFAFA',
        muted: '#B4B4BE',
        border: '#2C2C35',
      },
      typography: {
        headingFont: "'Lora', Georgia, serif",
        bodyFont: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif",
        scale: 'editorial',
      },
      shape: {
        radius: 'balanced',
        buttonStyle: 'gradient',
        cardStyle: 'bordered',
      },
      spacing: 'spacious',
      containerWidth: 'standard',
      motion: 'subtle',
    },
  },
  {
    id: 'minimal-mono',
    name: 'Swiss Monochrome',
    description: 'Đen trắng tối giản chuẩn thiết kế Thụy Sĩ — cực kỳ chuyên nghiệp',
    theme: {
      presetId: 'minimal-mono',
      mode: 'light',
      colors: {
        primary: '#111827',
        accent: '#374151',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F3F4F6',
        text: '#111827',
        muted: '#4B5563',
        border: '#D1D5DB',
      },
      typography: {
        headingFont: "'Montserrat', 'Be Vietnam Pro', sans-serif",
        bodyFont: "'Inter', 'Be Vietnam Pro', sans-serif",
        scale: 'standard',
      },
      shape: {
        radius: 'sharp',
        buttonStyle: 'solid',
        cardStyle: 'bordered',
      },
      spacing: 'standard',
      containerWidth: 'standard',
      motion: 'none',
    },
  },
];

export function buildThemeStyle(theme: ThemeConfig): CSSProperties {
  const radiusMap = {
    sharp: { card: '4px', btn: '4px', badge: '4px' },
    balanced: { card: '12px', btn: '10px', badge: '8px' },
    rounded: { card: '18px', btn: '12px', badge: '999px' },
    pill: { card: '24px', btn: '999px', badge: '999px' },
  };

  const spacingMap = {
    compact: '56px',
    standard: '84px',
    spacious: '112px',
  };

  const widthMap = {
    compact: '1040px',
    standard: '1180px',
    wide: '1320px',
  };

  const scaleMap = {
    compact: {
      hero: 'clamp(2rem, 4.2vw, 3.1rem)',
      section: 'clamp(1.6rem, 3vw, 2.25rem)',
      body: '0.96rem',
    },
    standard: {
      hero: 'clamp(2.25rem, 4.8vw, 3.75rem)',
      section: 'clamp(1.75rem, 3.4vw, 2.6rem)',
      body: '1rem',
    },
    editorial: {
      hero: 'clamp(2.4rem, 5.2vw, 4.1rem)',
      section: 'clamp(1.85rem, 3.6vw, 2.85rem)',
      body: '1.03rem',
    },
  };

  const radii = radiusMap[theme.shape.radius] ?? radiusMap.rounded;
  const scales = scaleMap[theme.typography.scale] ?? scaleMap.standard;
  const sectionPy = spacingMap[theme.spacing] ?? spacingMap.standard;
  const containerMax = widthMap[theme.containerWidth ?? 'standard'] ?? '1180px';

  // Determine actual visual brightness from background hex so Light/Dark never desyncs
  const actualDark = !isLightColor(theme.colors.background);
  const primaryRgb = hexToRgbTuple(theme.colors.primary);
  const accentRgb = hexToRgbTuple(theme.colors.accent);
  const bgRgb = hexToRgbTuple(theme.colors.background);
  const surfaceRgb = hexToRgbTuple(theme.colors.surface);

  const onPrimary = pickReadableText(theme.colors.primary);
  const onAccent = pickReadableText(theme.colors.accent);
  const avgCtaLum =
    (relativeLuminance(theme.colors.primary) + relativeLuminance(theme.colors.accent)) / 2;
  const onCta = avgCtaLum > 0.25 ? '#0F172A' : '#FFFFFF';
  const ctaDarkText = onCta === '#0F172A';

  const vars: Record<string, string> = {
    '--lp-primary': theme.colors.primary,
    '--lp-accent': theme.colors.accent,
    '--lp-primary-rgb': primaryRgb,
    '--lp-accent-rgb': accentRgb,
    '--lp-bg': theme.colors.background,
    '--lp-bg-rgb': bgRgb,
    '--lp-surface': theme.colors.surface,
    '--lp-surface-rgb': surfaceRgb,
    '--lp-surface-alt': theme.colors.surfaceAlt,
    '--lp-text': theme.colors.text,
    '--lp-muted': theme.colors.muted,
    '--lp-border': theme.colors.border,
    '--lp-on-primary': onPrimary,
    '--lp-on-accent': onAccent,
    '--lp-on-cta': onCta,
    '--lp-on-cta-muted': ctaDarkText ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    '--lp-on-cta-badge-bg': ctaDarkText ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.2)',
    '--lp-on-cta-btn-bg': ctaDarkText ? '#0F172A' : '#FFFFFF',
    '--lp-on-cta-btn-text': ctaDarkText ? '#FFFFFF' : '#0F172A',
    '--lp-on-cta-sec-border': ctaDarkText
      ? 'rgba(15, 23, 42, 0.32)'
      : 'rgba(255, 255, 255, 0.45)',
    '--lp-on-cta-sec-bg': ctaDarkText ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.12)',
    '--lp-contrast-bg': actualDark ? '#F8FAFC' : '#0F172A',
    '--lp-contrast-surface': actualDark ? '#FFFFFF' : '#1E293B',
    '--lp-contrast-text': actualDark ? '#0F172A' : '#F8FAFC',
    '--lp-contrast-muted': actualDark ? '#475569' : '#CBD5E1',
    '--lp-contrast-border': actualDark ? '#CBD5E1' : 'rgba(148, 163, 184, 0.24)',
    '--lp-contrast-badge-bg': actualDark ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.14)',
    '--lp-contrast-badge-text': actualDark ? '#0F172A' : '#FFFFFF',
    '--lp-nav-bg': `rgba(${bgRgb}, 0.86)`,
    '--lp-glass-bg': `rgba(${surfaceRgb}, 0.72)`,
    '--lp-success-bg': actualDark ? 'rgba(34, 197, 94, 0.16)' : 'rgba(22, 163, 74, 0.11)',
    '--lp-success-text': actualDark ? '#86EFAC' : '#166534',
    '--lp-success-border': actualDark ? 'rgba(74, 222, 128, 0.38)' : 'rgba(22, 163, 74, 0.32)',
    '--lp-shadow-sm': actualDark
      ? '0 2px 10px rgba(0, 0, 0, 0.45)'
      : '0 2px 10px rgba(15, 23, 42, 0.05)',
    '--lp-shadow-md': actualDark
      ? '0 12px 32px rgba(0, 0, 0, 0.55)'
      : '0 12px 32px rgba(15, 23, 42, 0.08)',
    '--lp-shadow-lg': actualDark
      ? '0 22px 48px rgba(0, 0, 0, 0.65)'
      : '0 20px 44px rgba(15, 23, 42, 0.12)',
    '--lp-radius': radii.card,
    '--lp-btn-radius': radii.btn,
    '--lp-badge-radius': radii.badge,
    '--lp-font-heading': theme.typography.headingFont,
    '--lp-font-body': theme.typography.bodyFont,
    '--lp-hero-size': scales.hero,
    '--lp-section-title-size': scales.section,
    '--lp-body-size': scales.body,
    '--lp-section-py': sectionPy,
    '--lp-container-max': containerMax,
  };

  return vars as CSSProperties;
}

export function getPresetById(presetId: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === presetId) ?? THEME_PRESETS[0];
}
