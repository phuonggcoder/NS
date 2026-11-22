import type {
  AboutSection,
  ContactSection,
  FaqSection,
  HeroSection,
  LandingPageSpec,
  ProductsSection,
  SiteMeta,
  StatsSection,
} from '../types/spec';

export type AiProviderMode = 'local' | 'gemini' | 'openai';

export interface AiProviderSettings {
  mode: AiProviderMode;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type AutoFillBlockKey =
  | 'meta'
  | 'theme'
  | 'hero'
  | 'stats'
  | 'about'
  | 'products'
  | 'faq'
  | 'contact';

export interface AutoFillResult {
  sourceMode: AiProviderMode;
  summary: string[];
  recommendedPresetId?: string;
  meta?: Partial<SiteMeta>;
  brandName?: string;
  hero?: Partial<HeroSection>;
  stats?: StatsSection['items'];
  about?: Partial<AboutSection>;
  products?: ProductsSection['items'];
  faq?: FaqSection['items'];
  contact?: Partial<ContactSection>;
  warning?: string;
}

export type SuggestionCategory = 'spelling' | 'contrast' | 'layout' | 'content' | 'seo';
export type SuggestionSeverity = 'error' | 'warning' | 'tip';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface AiSuggestion {
  id: string;
  category: SuggestionCategory;
  severity: SuggestionSeverity;
  sectionId?: string;
  sectionLabel: string;
  title: string;
  description: string;
  beforePreview?: string;
  afterPreview?: string;
  status: SuggestionStatus;
  applyPatch: (spec: LandingPageSpec) => LandingPageSpec;
}
