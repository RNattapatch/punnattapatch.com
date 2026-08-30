import type { ImageMetadata } from 'astro';

export type ProductDetailCode = 'T1' | 'T2' | 'T3' | 'C1' | 'I1';

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
  kind: 'line' | 'download';
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

export interface ProductDetailPageData {
  code: ProductDetailCode;
  pricingKey: string;
  route: string;
  kind: 'course' | 'service';
  serviceType?: 'Sales Consulting' | 'Sales System Implementation';
  hero: {
    eyebrow: string;
    customerJob: string;
    supportingCopy: string[];
    microcopy?: string;
    steps?: HeroStep[];
    badges: string[];
    visual?: { image: ImageMetadata | PublicProofImage; alt: string; label: string; caption: string };
  };
  authority: string[];
  proof: ProofItem[];
  clientLogos?: ClientLogo[];
  testimonials?: ProductTestimonial[];
  decisionCtas?: ProductDecisionCta[];
  pains: string[];
  boundary: { heading: string; body: string[] };
  reasons: Array<{ title: string; body: string }>;
  analogy: string;
  scope: ScopeItem[];
  symptomChooser?: SymptomChooser;
  takeHome: string[];
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
    proof?: { heading: string; intro?: string; secondaryHeading?: string };
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
