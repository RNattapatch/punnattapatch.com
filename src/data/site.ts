import { PRICES, fmtPrice } from './pricing.mjs';

// Site-wide configuration + brand identity
// Update here once, referenced everywhere.

export const SITE = {
  url: 'https://punnattapatch.com',
  name: 'Pun Nattapatch',
  nameTh: 'ปัน ณัฐพัชร์',
  titleDefault: 'Pun Nattapatch | AI Transformation Consultant สำหรับธุรกิจ B2B',
  description:
    'ผมไม่ได้สอนวิธีใช้ AI — แต่เข้าไปติดตั้ง AI Agent ในบริษัทคุณโดยตรง จนทีมคุณใช้งานได้จริงตั้งแต่วันแรก',
  locale: 'th_TH',
  twitter: '@punnattapatch',
  author: {
    name: 'Pun Nattapatch',
    nameTh: 'ปัน ณัฐพัชร์',
    handle: '@pun_nattapatch',
    jobTitle: 'AI Agent Transformation Consultant for B2B Business',
    city: 'Bangkok',
    country: 'TH',
  },
  social: {
    tiktok: 'https://www.tiktok.com/@pun_nattapatch',
    instagram: 'https://www.instagram.com/pun_nattapatch',
    // LINE OA canonical URL — verified share link matches real LINE OA (NOT a vanity ID).
    // ❌ DO NOT change to 'lin.ee/punnattapatch' — that handle is NOT registered to Pun.
    // Reference: index.astro line 265 + faq/no-public-course-why.md line 35 (same URL).
    line: 'https://lin.ee/ioSnSUG',
  },
  nav: [
    { label: 'หน้าหลัก', href: '/' },
    { label: 'บริการ', href: '/services' },
    { label: 'Free Kit', href: '/agent-builder-kit' },
    { label: 'BOSI Quiz', href: '/bosi-dna-quiz' },
    { label: 'Case Study', href: '/case-studies' },
    { label: 'บทเรียน 100 ล้าน', href: '/insights' },
    { label: 'FAQ', href: '/faq' },
    { label: 'เกี่ยวกับปัน', href: '/about' },
    { label: 'ติดต่องาน', href: '/sponsor' },
    { label: 'จองคิวรับบริการ', href: '/booking', cta: true },
  ],
} as const;

export const BRAND_COLORS = {
  navy: '#072b4e',
  coral: '#dd4155',
  coralDark: '#c43245',
  cream: '#fdfaf4',
} as const;

// Public Catalog v2 lineup (approved 2026-07-22).
// Public Course stays off-web until venue is confirmed.
export const SERVICES = [
  {
    id: 'inhouse-a',
    title: 'Sales × AI Agent',
    subtitle: 'In-house A · 1 วัน',
    hook: 'ให้ทั้งทีมเริ่มใช้ AI กับงานขายจริงของตัวเอง',
    priceThb: PRICES['inhouse-a'].amount,
    priceLabel: `${fmtPrice('inhouse-a')} / 1 วัน`,
    duration: '1 วัน',
    format: 'In-house · ไม่เกิน 20 คน',
    audience: 'เจ้าของ หัวหน้า และเซลล์ที่อยากเริ่มใช้ AI กับงานขายจริงพร้อมกัน',
    outcome: [
      'เช็กระบบขาย 6 ด้านจากข้อมูลจริง',
      'สร้าง AI ผู้ช่วยงานขาย 1 use case',
      'มีแผนใช้ต่อวันจันทร์',
    ],
    slug: 'inhouse-a',
  },
  {
    id: 'inhouse-b',
    title: 'Daruma Sales Office Bootcamp',
    subtitle: 'In-house B · 2 วัน',
    hook: 'วางระบบขายก่อน แล้วให้ทุกคนมี AI ผู้ช่วยของตัวเอง',
    priceThb: PRICES['inhouse-b'].amount,
    priceLabel: `${fmtPrice('inhouse-b')} (ปกติ ${fmtPrice('inhouse-b-list')})`,
    duration: '2 วันติด',
    format: 'In-house · สูงสุด 20 คน',
    audience: 'บริษัทที่อยากยกทีมขายทั้งทีมให้เริ่มใช้ระบบและ AI พร้อมกัน',
    outcome: [
      'Day 1 วางระบบขายที่ทำซ้ำได้',
      'Day 2 สร้าง AI Sales Office จากเคสจริง',
      'ทุกคนมี AI ผู้ช่วยและข้อตกลงใช้จริง 14 วัน',
    ],
    slug: 'inhouse-b',
  },
  {
    id: 'daruma-transformation',
    title: 'Daruma Sales Transformation',
    subtitle: 'Flagship · 45 วัน',
    hook: 'พลิกทีมขาย × AI Agent ใน 45 วัน',
    priceThb: PRICES['daruma-transformation'].amount,
    priceLabel: `${fmtPrice('daruma-transformation')} / 45 วัน`,
    duration: '45 วัน',
    format: 'On-site + online',
    audience: 'เจ้าของ SME ที่อยากแก้ระบบขายทั้งทีม ไม่ใช่แค่จัดวันอบรม',
    outcome: [
      'ดูข้อมูล จัดแนวหัวหน้า และฝึกทีม',
      'ติดตั้งระบบจริง 1 ระบบ',
      'ประคองใช้จริง 30 วันและวัดผลก่อน-หลัง',
    ],
    slug: 'daruma-transformation',
  },
  {
    id: 'trust-content-tiktok-workshop',
    title: 'AI Trust Content Cycle',
    subtitle: '2 วัน + ดูแลต่อ 30 วัน',
    hook: 'ให้ลูกค้าเชื่อใจจนทักเข้าทีมขายเอง',
    priceThb: PRICES['tiktok-workshop'].amount,
    priceLabel: fmtPrice('tiktok-workshop'),
    duration: '2 วัน + ดูแลต่อ 30 วัน',
    format: 'On-site + LINE support',
    audience: 'อยากให้ลูกค้าเชื่อใจและทักมาผ่าน content (TikTok) ด้วยระบบที่ AI ช่วยหมุน',
    outcome: [
      'ระบบวงจรคอนเทนต์ 5 ขั้น + ถ่ายจริง 1 วัน',
      'auto repurpose + DM automation',
      '2 วัน + 30-day LINE support',
    ],
    slug: 'trust-content-tiktok-workshop',
  },
] as const;

export const PROOF_STATS = [
  { value: '10+', label: 'ธุรกิจที่ผมดูแล', note: '฿30-200M รายได้ · B2B ความสัมพันธ์ระยะยาว' },
  { value: '฿100M+', label: 'มูลค่าธุรกิจที่เพิ่มขึ้น', note: 'Cumulative since 2025 · verified quarterly reports · anonymized per NDA' },
  { value: '+40%', label: 'ผลลัพธ์ยอดขายที่เพิ่มขึ้นเฉลี่ย', note: 'Range 25-55% by industry · n=10 · directional signal' },
] as const;

/**
 * PUN_CORE_BIO — reused across all service-page "Why Me" sections.
 * 3 identity-level credentials that make Pun distinct from any AI/sales trainer.
 * Rendered as horizontal stat cards at top of <WhyMeSection>.
 * Update ONLY when the underlying numbers change (annual review).
 */
export const PUN_CORE_BIO = [
  { stat: '5 ปี', body: 'ฟิลด์ sales B2B · ปิดดีลด้วยมือตัวเอง · ไม่ใช่ academic trainer' },
  { stat: '฿100M+', body: 'มูลค่าธุรกิจลูกค้า SME 10+ ราย (฿30-200M) ที่ผมดูแลตั้งแต่ 2025' },
  { stat: '2.29M', body: 'TikTok views organic · proof ว่าเจ้าของ SME ฟังผม · ไม่ใช่ทฤษฎีในตำรา' },
] as const;

/**
 * MILESTONES — Status Bar data for <MilestoneBar /> component.
 * Renders trajectory through Outcomes (clients won / workshops run / agents deployed),
 * NOT income — per CLAUDE.md no-revenue-disclosure rule.
 * Update quarterly. Pattern lifted from @ar.ngoon p.19 + Doctor Rule 16 Outcome Bucket.
 */
export const MILESTONES = {
  done: {
    status: 'DONE',
    quarter: 'Q1 2026',
    icon: '✓',
    items: [
      '3 client wins (B2B SME ฿30-200M)',
      '1 in-house workshop run',
      '12 agents deployed in client teams',
    ],
  },
  now: {
    status: 'NOW',
    quarter: 'Q2 2026',
    icon: '→',
    items: [
      'Public Training Phase 1 launch',
      '8 AEO articles indexed',
      'Kit + Waitlist live',
    ],
  },
  next: {
    status: 'NEXT',
    quarter: 'Q3 2026',
    icon: '⚡',
    items: [
      'Inner Circle gated rollout',
      '฿1M MRR target',
      'Build ฿100M sales-team SOP handed to first 3 clients',
    ],
  },
} as const;

export const SERVICE_TIERS_SUMMARY = {
  entry: 'AI Workshop (฿30k/วัน)',
  growth: 'Workshop + Follow-up (฿50k)',
  system: 'Package A (฿59,900 · Advance + Consult 2 วัน)',
  training: 'Daruma Sales Office Bootcamp (฿59,900 · 2 วัน)',
} as const;

/**
 * Strip Astro's `.html` / `index.html` tail from a URL so canonical links,
 * og:url, and JSON-LD @id all resolve to the same clean URL a user types.
 *
 * `build.format: 'file'` emits flat files (about.html) which GitHub Pages
 * happily serves at both `/about` and `/about.html`. We want the canonical
 * form to be the extensionless one — otherwise crawlers see two URLs for
 * one page and split signal.
 */
export function cleanUrl(input: URL | string): string {
  const str = typeof input === 'string' ? input : input.toString();
  return str
    .replace(/\/index\.html(?=$|[#?])/, '/')
    .replace(/\.html(?=$|[#?])/, '');
}
