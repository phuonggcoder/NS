import type { LandingPageSpec } from '../types/spec';

export interface CompactSpecContext {
  templateId: string;
  meta: LandingPageSpec['meta'];
  theme: Pick<LandingPageSpec['theme'], 'presetId' | 'mode'>;
  sections: Array<Record<string, unknown>>;
  digitalMenu?: {
    enabled: boolean;
    brandName: string;
    currency: string;
    categories: Array<{ id: string; name: string; visible: boolean }>;
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      salePrice?: number;
      status: string;
    }>;
  };
}

export function buildClientSpecContext(spec: LandingPageSpec): CompactSpecContext {
  const sections = spec.sections.map((s) => {
    const base = { id: s.id, type: s.type, visible: s.visible };
    switch (s.type) {
      case 'hero':
        return {
          ...base,
          headline: s.headline,
          highlightText: s.highlightText,
          subheadline: s.subheadline,
          primaryCtaLabel: s.primaryCtaLabel,
          imageCaption: s.imageCaption,
        };
      case 'products':
        return {
          ...base,
          title: s.title,
          subtitle: s.subtitle,
          items: s.items.slice(0, 6).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
          })),
        };
      case 'pricing':
        return {
          ...base,
          title: s.title,
          tiers: s.tiers.map((t) => ({ id: t.id, name: t.name, price: t.price })),
        };
      case 'cta':
        return {
          ...base,
          title: s.title,
          subtitle: s.subtitle,
          primaryLabel: s.primaryLabel,
        };
      case 'about':
        return { ...base, title: s.title, role: s.role };
      case 'faq':
        return { ...base, title: s.title, itemsCount: s.items.length };
      case 'contact':
        return { ...base, title: s.title, phone: s.phone, email: s.email };
      default:
        return base;
    }
  });

  return {
    templateId: spec.templateId,
    meta: {
      ...spec.meta,
      ogImage: spec.meta.ogImage?.startsWith('data:') ? '[embedded-image]' : spec.meta.ogImage,
    },
    theme: {
      presetId: spec.theme.presetId,
      mode: spec.theme.mode,
    },
    sections,
    digitalMenu: spec.digitalMenu
      ? {
          enabled: spec.digitalMenu.enabled,
          brandName: spec.digitalMenu.brandName,
          currency: spec.digitalMenu.currency,
          categories: spec.digitalMenu.categories.map((c) => ({
            id: c.id,
            name: c.name,
            visible: c.visible,
          })),
          items: spec.digitalMenu.items.slice(0, 20).map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            price: i.price,
            salePrice: i.salePrice,
            status: i.status,
          })),
        }
      : undefined,
  };
}
