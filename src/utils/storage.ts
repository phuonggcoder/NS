import type { ContactLead, CustomerOrder, LandingPageSpec } from '../types/spec';

const SPEC_STORAGE_KEY = 'specpage_spec_v1';
const ORDERS_STORAGE_KEY = 'specpage_orders_v1';
const LEADS_STORAGE_KEY = 'specpage_leads_v1';

export function generateId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function cloneSpec<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export function sanitizeHref(rawHref?: string): string {
  if (!rawHref) return '#';
  const trimmed = rawHref.trim();
  if (!trimmed) return '#';

  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed;
  }

  return '#';
}

export function sanitizeImageSrc(rawSrc?: string): string {
  if (!rawSrc) return '';
  const trimmed = rawSrc.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();

  if (
    trimmed.startsWith('/') ||
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return '';
}

export function parsePriceNumber(priceText: string): number {
  const digits = priceText.replace(/[^\d]/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyAmount(amount: number, currency = 'đ'): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return `0${currency}`;
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return currency === '$' || currency === 'USD' ? `${currency}${formatted}` : `${formatted}${currency}`;
}

export function computeOrderTotal(unitPrice: string, quantity: number, currency = 'đ'): string {
  const unit = parsePriceNumber(unitPrice);
  if (unit <= 0) return unitPrice || 'Liên hệ';
  return formatCurrencyAmount(unit * Math.max(1, quantity), currency);
}

export function loadStoredSpec(): LandingPageSpec | null {
  try {
    const raw = window.localStorage.getItem(SPEC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LandingPageSpec;
    if (!parsed || !Array.isArray(parsed.sections) || !parsed.theme || !parsed.meta) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSpec(spec: LandingPageSpec): void {
  try {
    window.localStorage.setItem(SPEC_STORAGE_KEY, JSON.stringify(spec));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadOrders(): CustomerOrder[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: CustomerOrder): CustomerOrder[] {
  const current = loadOrders();
  const next = [order, ...current].slice(0, 100);
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota error
  }
  return next;
}

export function clearOrders(): void {
  try {
    window.localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadLeads(): ContactLead[] {
  try {
    const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContactLead[]) : [];
  } catch {
    return [];
  }
}

export function saveLead(lead: ContactLead): ContactLead[] {
  const current = loadLeads();
  const next = [lead, ...current].slice(0, 100);
  try {
    window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota error
  }
  return next;
}

export function clearLeads(): void {
  try {
    window.localStorage.removeItem(LEADS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
