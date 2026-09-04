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

/**
 * T2 system chapter (WEB-T2-SYSTEM-01) — "ระบบที่ทีมได้กลับไป"
 * spec: docs/superpowers/specs/2026-09-05-t2-system-section-design.md
 * ⚠️ ห้ามตั้งชื่อฟิลด์ว่า price / duration / h1 (verify-product-details.mjs ห้ามไว้)
 * ⚠️ ห้าม literal สกุลเงินในไฟล์นี้ — มูลค่าอ้างผ่าน Catalog key เท่านั้น
 */
export interface SystemShot {
  image: ImageMetadata | PublicProofImage;
  alt: string;
  /** ป้ายที่พิมพ์ทับมุมภาพ — บอกว่าเป็นรุ่นไหน/ข้อมูลอะไร (Release gate §15) */
  label: string;
  caption: string;
  /** ตาราง "ในภาพ vs รุ่นที่คุณได้รับ" — ห้ามว่าง ไม่งั้น component ไม่ render ภาพ */
  delta: Array<{ inShot: string; youGet: string }>;
}

export interface SystemDesk {
  number: string;
  name: string;
  who: string;
  when: string;
  input: string;
  output: string;
  rule: string;
  shot?: SystemShot;
}

export interface SystemGoldenPathStep {
  number: string;
  title: string;
  actor: string;
  input: string;
  output: string;
}

export interface SystemGoldenPath {
  eyebrow: string;
  heading: string;
  intro: string;
  steps: SystemGoldenPathStep[];
  note: string;
  shot?: SystemShot;
}

export interface SystemHandoffStage {
  code: string;
  when: string;
  what: string;
  evidence: string;
}

export interface SystemHandoff {
  eyebrow: string;
  heading: string;
  intro: string;
  /** 45 นาทีแรกในห้อง แตกเป็นช่วง (ฟิลด์ชื่อ span เพราะ duration ถูกห้าม) */
  install: Array<{ span: string; step: string }>;
  installNote: string;
  stages: SystemHandoffStage[];
  prerequisites: { heading: string; items: string[] };
  shot?: SystemShot;
}

export interface ProductSystemSection {
  /** ปิดไว้จนกว่า Kit v1 ผ่าน Non-builder trial — คุณปันสั่งเปิดเท่านั้น */
  enabled: boolean;
  eyebrow: string;
  heading: string;
  intro: string;
  opener: { body: string[]; shot: SystemShot };
  failure: { heading: string; intro: string; items: string[]; close: string };
  desks: { heading: string; intro: string; items: SystemDesk[] };
  goldenPath: SystemGoldenPath;
  handoff: SystemHandoff;
  metrics: { heading: string; intro: string; items: Array<{ label: string; value: string; note: string }>; disclaimer: string };
  value: {
    heading: string;
    body: string[];
    /** Catalog key ที่ใช้อ้างมูลค่า — ห้าม hardcode ตัวเลข · ห้ามขีดฆ่า (ระบบเป็น Core ไม่ใช่ Bonus) */
    valueRefKey: string;
    valueRefNote: string;
    excluded: { heading: string; items: string[]; route: string };
  };
  cta: { heading: string; body: string; lineLabel: string; lineIntent: string; secondaryLabel: string; secondaryNote: string };
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
  /** T2 system chapter (WEB-T2-SYSTEM-01) — optional; สินค้าอื่นไม่มีก็ไม่ render */
  systemSection?: ProductSystemSection;
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
