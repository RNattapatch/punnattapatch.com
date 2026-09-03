import type { ImageMetadata } from 'astro';

export type ProductDetailCode = 'T1' | 'T2' | 'T3' | 'T4' | 'C1' | 'I1';

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProofItem {
  id?: string;
  kind: 'quote' | 'photo' | 'system' | 'demand';
  quote?: string;
  caption: string;
  image: ImageMetadata | PublicProofImage;
  alt: string;
}

export interface PublicProofImage {
  publicSrc: string;
  width: number;
  height: number;
}

export interface ClientLogo {
  src: string;
  alt: string;
}

export interface ProductTestimonial {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface HeroStep {
  label: string;
  title: string;
  body: string;
}

export interface DecisionCtaAction {
  kind: 'booking' | 'line' | 'download';
  label: string;
  intent: string;
  href?: string;
  available?: boolean;
}

export interface ProductDecisionCta {
  location: 'after_proof' | 'after_scope' | 'after_fit';
  eyebrow: string;
  heading: string;
  body: string;
  variant: 'light' | 'sand' | 'navy';
  actions: DecisionCtaAction[];
}

export interface ProductLineCta {
  primary: string;
  primaryIntent: string;
  secondary: string;
  secondaryIntent: string;
}

export interface ScopeItem {
  id?: string;
  label: string;
  title: string;
  learn?: string;
  action: string;
  output: string;
  learnLabel?: string;
  actionLabel?: string;
  outputLabel?: string;
}

export interface SymptomChooserAction {
  label: string;
  targetId: string;
}

export interface SymptomChooser {
  heading: string;
  intro?: string;
  actions: SymptomChooserAction[];
}

export interface ProductDetailChapter {
  id: string;
  number: string;
  navLabel: string;
  heading: string;
  copy: string;
  tone: 'ivory' | 'sand';
}

export interface ProductBonusCard {
  number: string;
  title: string;
  user: string;
  timing: string;
  outcome: string;
  format: string;
}

export interface ProductSpotlightModule {
  number: string;
  tag: string;
  title: string;
  question: string;
  points: string[];
}

export interface ProductSpotlight {
  eyebrow: string;
  heading: string;
  intro: string;
  modules: ProductSpotlightModule[];
  note?: string;
}

export interface ProductWhatsNewColumn {
  badge: string;
  heading: string;
  sub: string;
  items: Array<{ title: string; body: string }>;
  footer: string;
}

export interface ProductWhatsNew {
  eyebrow: string;
  heading: string;
  intro: string;
  fresh: ProductWhatsNewColumn;
  core: ProductWhatsNewColumn;
}

export interface ProductBonusValueItem {
  number: string;
  icon: string;
  title: string;
  points: string[];
  value: number;
  basis: string;
  /** Shown instead of a baht figure (e.g. 'รวมในคอร์ส', '∞'); item is excluded from the total. */
  valueLabel?: string;
}

export interface ProductBonusValues {
  eyebrow: string;
  heading: string;
  intro: string;
  items: ProductBonusValueItem[];
  footnote: string;
}

export interface ProductWhyMe {
  eyebrow: string;
  heading: string;
  items: Array<{ icon: string; title: string; body: string }>;
}

export interface ProductInstructorProfile {
  eyebrow: string;
  heading: string;
  intro: string;
  chips: string[];
  name: string;
  handle: string;
  image: PublicProofImage;
  imageAlt: string;
  credentials: string[];
  angles: Array<{ icon: string; title: string; body: string }>;
  quote: string;
}

export interface ProductJourneyPresentation {
  heroMeta: string;
  capacityNote: string;
  offerMeta: string;
  offerBody: string;
  whyNow: {
    eyebrow: string;
    heading: string;
    labels: string[];
  };
  curriculum: {
    eyebrow: string;
    media?: {
      afterStep: number;
      image: PublicProofImage;
      alt: string;
      eyebrow: string;
      heading: string;
      copy: string;
    };
  };
  finalEyebrow: string;
}

export interface ProductDetailPageData {
  code: ProductDetailCode;
  pricingKey: string;
  route: string;
  kind: 'course' | 'service';
  showPriceInHero?: boolean;
  serviceType?: 'Sales Consulting' | 'Sales System Implementation';
  hero: {
    eyebrow: string;
    customerJob: string;
    supportingCopy: string[];
    microcopy?: string;
    steps?: HeroStep[];
    badges: string[];
    visual?: { image: ImageMetadata | PublicProofImage; alt: string; label: string; caption: string; fit?: 'cover' | 'contain' };
  };
  authority: string[];
  proof: ProofItem[];
  clientLogos?: ClientLogo[];
  testimonials?: ProductTestimonial[];
  chapters?: ProductDetailChapter[];
  decisionCtas?: ProductDecisionCta[];
  pains: string[];
  boundary: { heading: string; body: string[] };
  reasons: Array<{ title: string; body: string }>;
  analogy: string;
  scope: ScopeItem[];
  symptomChooser?: SymptomChooser;
  takeHome: string[];
  bonusCards?: {
    enabled: boolean;
    heading: string;
    intro: string;
    items: ProductBonusCard[];
  };
  /** T4 journey extras (approved 2026-09-02) — optional, other products ignore them */
  spotlight?: ProductSpotlight;
  whatsNew?: ProductWhatsNew;
  bonusValues?: ProductBonusValues;
  whyMe?: ProductWhyMe;
  instructorProfile?: ProductInstructorProfile;
  /** Opts a training product into the proof-led operating journey presentation. */
  journey?: ProductJourneyPresentation;
  fit: string[];
  notFit: string;
  relatedOffer?: { href: string; label: string };
  bio: string[];
  investment: { included: string[]; terms: string; scarcity: string; perHeadFor?: number };
  faq: ProductFaqItem[];
  cta: {
    primary: string;
    secondary: string;
    keyword: string;
    secondaryIntent?: string;
    heroSecondary?: string;
    heroSecondaryIntent?: string;
    finalSecondary?: string;
    finalSecondaryIntent?: string;
    finalCaption?: string;
    finalMicrocopy?: string;
    finalMobileInstruction?: string;
    locations?: {
      afterScope?: ProductLineCta;
      afterInvestment?: ProductLineCta;
      final?: ProductLineCta;
    };
  };
  seo: { title: string; description: string };
  sections?: {
    authority?: { heading: string; copy?: string };
    proof?: { heading: string; intro?: string; secondaryHeading?: string; imageLoading?: 'lazy' };
    pain?: { heading: string; close?: string };
    reasons?: { heading: string };
    scope?: { heading: string; intro?: string; ctaHeading?: string; supportDurationLead?: string };
    takeHome?: { heading: string; close?: string };
    fit?: { heading: string };
    bio?: { heading: string; eyebrow?: string };
    investment?: { eyebrow: string };
    final?: { heading: string; copy: string };
  };
}
