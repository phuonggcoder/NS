import type { CustomSavedTheme, ThemeConfig } from '../types/spec';
import { cloneSpec, generateId } from './storage';

const CUSTOM_THEMES_KEY = 'specpage_custom_themes_v1';

export function loadLocalCustomThemes(): CustomSavedTheme[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomSavedTheme[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomThemes(themes: CustomSavedTheme[]): void {
  try {
    window.localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch {
    // Ignore quota errors
  }
}

export async function fetchCustomThemes(): Promise<CustomSavedTheme[]> {
  const local = loadLocalCustomThemes();
  try {
    const res = await fetch('/api/themes', { credentials: 'same-origin' });
    if (!res.ok) return local;
    const data = (await res.json()) as { ok?: boolean; themes?: CustomSavedTheme[] };
    if (data.ok && Array.isArray(data.themes)) {
      saveLocalCustomThemes(data.themes);
      return data.themes;
    }
    return local;
  } catch {
    return local;
  }
}

export async function persistCustomThemes(themes: CustomSavedTheme[]): Promise<boolean> {
  saveLocalCustomThemes(themes);
  try {
    const res = await fetch('/api/themes', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themes }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function createCustomThemeRecord(name: string, theme: ThemeConfig): CustomSavedTheme {
  return {
    id: generateId('theme'),
    name: name.trim() || 'Theme tùy chỉnh',
    createdAt: new Date().toISOString(),
    theme: cloneSpec(theme),
  };
}
