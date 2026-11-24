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

export type AiCopyTask =
  | 'holistic_audit'
  | 'website_copy'
  | 'product_desc'
  | 'menu_item_desc'
  | 'headlines'
  | 'ad_copy'
  | 'normalize'
  | 'translate'
  | 'spellcheck'
  | 'seo_suggestions';

export interface AiServerStatus {
  configured: boolean;
  provider: AiProviderMode;
  model: string;
}

export interface BrandProfile {
  industry: string;
  tone: string;
  audience: string;
  usp: string;
  forbiddenWords: string[];
}

export interface OptimizationLogEntry {
  date: string;
  topic: string;
  status: 'accepted' | 'edited' | 'rejected';
  note: string;
}

export interface AiBrandMemory {
  brandProfile: BrandProfile;
  learnedRules: string[];
  optimizationLog: OptimizationLogEntry[];
  updatedAt: string;
}

export interface AiHolisticRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  reason: string;
  targetSectionType: string;
  targetField: string;
  currentValue: string;
  suggestedValue: string;
}

export interface AiHolisticAuditResult {
  ok: boolean;
  providerUsed: AiProviderMode;
  modelUsed: string;
  summary: string;
  recommendations: AiHolisticRecommendation[];
  warning?: string;
}

export interface AiFeedbackPayload {
  projectId: string;
  taskType: string;
  topic?: string;
  aiOutput: string;
  userFinalOutput?: string;
  action: 'accepted' | 'edited' | 'rejected';
  note?: string;
}

export interface AiCopyResult {
  ok: boolean;
  providerUsed: AiProviderMode;
  modelUsed: string;
  text: string;
  alternatives?: string[];
  notes?: string[];
  warning?: string;
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
