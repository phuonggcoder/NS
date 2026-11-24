export type SectionType =
  | 'navbar'
  | 'hero'
  | 'stats'
  | 'about'
  | 'products'
  | 'gallery'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer';

export type SectionSurface = 'default' | 'alt' | 'contrast' | 'accent';
export type SectionPadding = 'compact' | 'normal' | 'spacious';
export type SectionMaxWidth = 'narrow' | 'standard' | 'wide';

export interface SectionStyle {
  surface: SectionSurface;
  padding: SectionPadding;
  align?: 'left' | 'center';
  maxWidth?: SectionMaxWidth;
  customBg?: string;
  customText?: string;
}

export interface BaseSection {
  id: string;
  type: SectionType;
  visible: boolean;
  anchorId: string;
  style: SectionStyle;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
}

export interface NavbarSection extends BaseSection {
  type: 'navbar';
  variant: 'glass' | 'solid' | 'floating';
  logoText: string;
  logoEmoji: string;
  links: NavLinkItem[];
  ctaLabel: string;
  ctaHref: string;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  variant: 'centered' | 'split-right' | 'split-left';
  badge: string;
  headline: string;
  highlightText: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  imageUrl: string;
  imageCaption: string;
  trustChips: string[];
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  note?: string;
}

export interface StatsSection extends BaseSection {
  type: 'stats';
  variant: 'strip' | 'cards';
  items: StatItem[];
}

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  detail: string;
}

export interface AboutSection extends BaseSection {
  type: 'about';
  variant: 'split-left' | 'split-right' | 'centered-card';
  badge: string;
  title: string;
  role: string;
  bio: string;
  avatarUrl: string;
  highlights: string[];
  milestones: MilestoneItem[];
  socials: NavLinkItem[];
}

export interface ProductItem {
  id: string;
  name: string;
  badge?: string;
  price: string;
  originalPrice?: string;
  description: string;
  imageUrl: string;
  features: string[];
  ctaLabel: string;
  href?: string;
}

export interface ProductsSection extends BaseSection {
  type: 'products';
  variant: 'grid-3' | 'grid-2' | 'spotlight';
  badge: string;
  title: string;
  subtitle: string;
  currency: string;
  orderChannel: 'modal' | 'zalo' | 'email' | 'link';
  orderChannelHref?: string;
  items: ProductItem[];
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
}

export interface GallerySection extends BaseSection {
  type: 'gallery';
  variant: 'grid-3' | 'grid-2' | 'showcase';
  badge: string;
  title: string;
  subtitle: string;
  items: GalleryItem[];
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesSection extends BaseSection {
  type: 'features';
  variant: 'grid-3' | 'grid-2' | 'bento';
  badge: string;
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
  ctaLabel: string;
  href?: string;
}

export interface PricingSection extends BaseSection {
  type: 'pricing';
  variant: 'columns' | 'compact';
  badge: string;
  title: string;
  subtitle: string;
  tiers: PricingTier[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
}

export interface TestimonialsSection extends BaseSection {
  type: 'testimonials';
  variant: 'grid' | 'spotlight';
  badge: string;
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSection extends BaseSection {
  type: 'faq';
  variant: 'accordion' | 'two-column';
  badge: string;
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export interface CtaSection extends BaseSection {
  type: 'cta';
  variant: 'gradient-card' | 'minimal-band';
  badge: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface ContactSection extends BaseSection {
  type: 'contact';
  variant: 'split' | 'centered';
  badge: string;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  zaloLabel: string;
  zaloHref: string;
  formSubmitLabel: string;
  successMessage: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: NavLinkItem[];
}

export interface FooterSection extends BaseSection {
  type: 'footer';
  variant: 'columns' | 'minimal';
  brandName: string;
  brandDescription: string;
  copyright: string;
  columns: FooterColumn[];
}

export type LandingSection =
  | NavbarSection
  | HeroSection
  | StatsSection
  | AboutSection
  | ProductsSection
  | GallerySection
  | FeaturesSection
  | PricingSection
  | TestimonialsSection
  | FaqSection
  | CtaSection
  | ContactSection
  | FooterSection;

export interface ThemeColors {
  primary: string;
  secondary?: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  scale: 'compact' | 'standard' | 'editorial';
  fontSize?: 'sm' | 'md' | 'lg';
}

export interface ThemeShape {
  radius: 'sharp' | 'balanced' | 'rounded' | 'pill';
  buttonStyle: 'solid' | 'gradient' | 'outline';
  cardStyle: 'bordered' | 'elevated' | 'glass';
}

export interface ThemeConfig {
  presetId: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  spacing: 'compact' | 'standard' | 'spacious';
  containerWidth?: 'compact' | 'standard' | 'wide';
  motion?: 'none' | 'subtle' | 'smooth';
}

export interface CustomSavedTheme {
  id: string;
  name: string;
  createdAt: string;
  theme: ThemeConfig;
}

export interface FloatingContactConfig {
  enabled: boolean;
  label: string;
  href: string;
}

export interface SiteMeta {
  title: string;
  description: string;
  favicon: string;
  floatingContact: FloatingContactConfig;
  customCss?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robotsNoIndex?: boolean;
}

export interface MenuOptionChoice {
  id: string;
  label: string;
  priceDelta: number;
  defaultSelected?: boolean;
}

export interface MenuOptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  choices: MenuOptionChoice[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
  status: 'available' | 'sold_out';
  featured?: boolean;
  bestSeller?: boolean;
  ingredients?: string;
  allergens?: string[];
  optionGroups: MenuOptionGroup[];
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  visible: boolean;
  sortOrder: number;
}

export interface MenuThemeConfig {
  layout: 'grid' | 'list';
  mode: 'light' | 'dark';
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  bannerUrl?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  showCategoryNav: boolean;
}

export interface QrTarget {
  id: string;
  label: string;
  branch?: string;
  table?: string;
}

export interface DigitalMenuSeo {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface DigitalMenuConfig {
  enabled: boolean;
  brandName: string;
  currency: string;
  description?: string;
  categories: MenuCategory[];
  items: MenuItem[];
  theme: MenuThemeConfig;
  qrTargets?: QrTarget[];
  seo?: DigitalMenuSeo;
}

export interface LandingPageSpec {
  specVersion: string;
  templateId: string;
  updatedAt: string;
  meta: SiteMeta;
  theme: ThemeConfig;
  sections: LandingSection[];
  digitalMenu?: DigitalMenuConfig;
}

export interface CustomerOrder {
  id: string;
  createdAt: string;
  clientSlug?: string;
  branch?: string;
  table?: string;
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  totalDisplay: string;
  customerName: string;
  phone: string;
  email: string;
  note: string;
}

export interface ContactLead {
  id: string;
  createdAt: string;
  clientSlug?: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}

export type ProjectStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'published';

export interface ClientFeedbackItem {
  id: string;
  createdAt: string;
  clientSlug: string;
  author: string;
  sectionLabel: string;
  comment: string;
  type: 'feedback' | 'approved' | 'rejected';
  resolved: boolean;
}

export interface ClientProject {
  id: string;
  slug: string;
  projectName: string;
  clientName: string;
  status: ProjectStatus;
  notes: string;
  updatedAt: string;
  publishedUrl?: string;
  reviewToken?: string;
  spec: LandingPageSpec;
}

export interface VersionRecord {
  id: string;
  slug: string;
  createdAt: string;
  actor: string;
  label: string;
  scope: 'landing' | 'menu' | 'both';
  spec: LandingPageSpec;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
