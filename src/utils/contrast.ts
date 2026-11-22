import type { ThemeColors, ThemeConfig } from '../types/spec';

export interface ContrastCheckItem {
  id: string;
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  minRatio: number;
  passed: boolean;
}

export interface ThemeContrastAudit {
  checks: ContrastCheckItem[];
  allPassed: boolean;
  modeMismatch: boolean;
}

export function normalizeHex(hex: string, fallback = '#007AFF'): string {
  const raw = (hex || '').trim();
  const clean = raw.startsWith('#') ? raw.slice(1) : raw;
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

function hexToRgbParts(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex, '#007AFF');
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return [r, g, b];
}

export function hexToRgbTuple(hex: string): string {
  const [r, g, b] = hexToRgbParts(hex);
  return `${r}, ${g}, ${b}`;
}

function linearizeChannel(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbParts(hex);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.25;
}

export function pickReadableText(
  bgHex: string,
  light = '#FFFFFF',
  dark = '#0F172A'
): string {
  return isLightColor(bgHex) ? dark : light;
}

function mixColors(hexA: string, hexB: string, weightA: number): string {
  const [r1, g1, b1] = hexToRgbParts(hexA);
  const [r2, g2, b2] = hexToRgbParts(hexB);
  const w = Math.max(0, Math.min(1, weightA));
  const r = Math.round(r1 * w + r2 * (1 - w));
  const g = Math.round(g1 * w + g2 * (1 - w));
  const b = Math.round(b1 * w + b2 * (1 - w));
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ensureContrast(
  fgHex: string,
  bgHex: string,
  minRatio = 4.5
): string {
  const currentFg = normalizeHex(fgHex, '#111827');
  const currentBg = normalizeHex(bgHex, '#FFFFFF');
  if (contrastRatio(currentFg, currentBg) >= minRatio) {
    return currentFg;
  }

  const targetAnchor = isLightColor(currentBg) ? '#0F172A' : '#F8FAFC';
  for (let step = 1; step <= 10; step++) {
    const candidate = mixColors(targetAnchor, currentFg, step / 10);
    if (contrastRatio(candidate, currentBg) >= minRatio) {
      return candidate;
    }
  }
  return targetAnchor;
}

export function derivePaletteForMode(
  colors: ThemeColors,
  targetMode: 'light' | 'dark'
): ThemeColors {
  if (targetMode === 'dark') {
    const bg = '#0B0F19';
    const surface = '#131926';
    const surfaceAlt = '#1A2233';
    const text = '#F8FAFC';
    const muted = '#A3B3C9';
    const border = '#2A354D';
    const primary = ensureContrast(colors.primary, bg, 3.2);
    const accent = ensureContrast(colors.accent, bg, 3.2);
    return {
      primary,
      accent,
      background: bg,
      surface,
      surfaceAlt,
      text,
      muted,
      border,
    };
  }

  const bg = '#FFFFFF';
  const surface = '#FFFFFF';
  const surfaceAlt = '#F4F6FA';
  const text = '#111827';
  const muted = '#5B6577';
  const border = '#E2E8F0';
  const primary = ensureContrast(colors.primary, bg, 3.2);
  const accent = ensureContrast(colors.accent, bg, 3.2);
  return {
    primary,
    accent,
    background: bg,
    surface,
    surfaceAlt,
    text,
    muted,
    border,
  };
}

export function auditThemeContrast(theme: ThemeConfig): ThemeContrastAudit {
  const { colors } = theme;
  const bgIsLight = isLightColor(colors.background);
  const modeMismatch =
    (theme.mode === 'light' && !bgIsLight) || (theme.mode === 'dark' && bgIsLight);

  const onPrimary = pickReadableText(colors.primary);
  const checks: ContrastCheckItem[] = [
    {
      id: 'text-bg',
      label: 'Chữ chính trên nền trang',
      foreground: colors.text,
      background: colors.background,
      ratio: contrastRatio(colors.text, colors.background),
      minRatio: 4.5,
      passed: contrastRatio(colors.text, colors.background) >= 4.5,
    },
    {
      id: 'text-surface',
      label: 'Chữ chính trên nền thẻ (Card)',
      foreground: colors.text,
      background: colors.surface,
      ratio: contrastRatio(colors.text, colors.surface),
      minRatio: 4.5,
      passed: contrastRatio(colors.text, colors.surface) >= 4.5,
    },
    {
      id: 'text-alt',
      label: 'Chữ chính trên nền xen kẽ',
      foreground: colors.text,
      background: colors.surfaceAlt,
      ratio: contrastRatio(colors.text, colors.surfaceAlt),
      minRatio: 4.5,
      passed: contrastRatio(colors.text, colors.surfaceAlt) >= 4.5,
    },
    {
      id: 'muted-bg',
      label: 'Chữ phụ (mô tả) trên nền trang',
      foreground: colors.muted,
      background: colors.background,
      ratio: contrastRatio(colors.muted, colors.background),
      minRatio: 3.5,
      passed: contrastRatio(colors.muted, colors.background) >= 3.5,
    },
    {
      id: 'on-primary',
      label: 'Chữ nút bấm trên màu chủ đạo',
      foreground: onPrimary,
      background: colors.primary,
      ratio: contrastRatio(onPrimary, colors.primary),
      minRatio: 3.5,
      passed: contrastRatio(onPrimary, colors.primary) >= 3.5,
    },
  ];

  return {
    checks,
    allPassed: checks.every((c) => c.passed) && !modeMismatch,
    modeMismatch,
  };
}

export function autoFixThemeContrast(theme: ThemeConfig): ThemeConfig {
  const bgIsLight = isLightColor(theme.colors.background);
  const actualMode: 'light' | 'dark' = bgIsLight ? 'light' : 'dark';

  const fixedSurface =
    isLightColor(theme.colors.surface) === bgIsLight
      ? theme.colors.surface
      : actualMode === 'light'
      ? '#FFFFFF'
      : '#131926';

  const fixedSurfaceAlt =
    isLightColor(theme.colors.surfaceAlt) === bgIsLight
      ? theme.colors.surfaceAlt
      : actualMode === 'light'
      ? '#F4F6FA'
      : '#1A2233';

  const fixedTextOnBg = ensureContrast(theme.colors.text, theme.colors.background, 7);
  const fixedText = ensureContrast(fixedTextOnBg, fixedSurface, 5);
  const fixedTextAlt = ensureContrast(fixedText, fixedSurfaceAlt, 5);

  const fixedMutedOnBg = ensureContrast(theme.colors.muted, theme.colors.background, 4.2);
  const fixedMutedSurf = ensureContrast(fixedMutedOnBg, fixedSurface, 4.0);
  const fixedMuted = ensureContrast(fixedMutedSurf, fixedSurfaceAlt, 4.0);

  const fixedBorder =
    isLightColor(theme.colors.border) === bgIsLight &&
    contrastRatio(theme.colors.border, theme.colors.background) >= 1.15
      ? theme.colors.border
      : actualMode === 'light'
      ? '#DCE2EC'
      : '#2A354D';

  return {
    ...theme,
    mode: actualMode,
    colors: {
      ...theme.colors,
      surface: fixedSurface,
      surfaceAlt: fixedSurfaceAlt,
      text: fixedTextAlt,
      muted: fixedMuted,
      border: fixedBorder,
    },
  };
}
