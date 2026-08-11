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
  // Public contact address — used on /privacy for PDPA + Meta data-deletion requests.
  email: 'r.nattapatch@gmail.com',
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

// Public Catalog v2.1 lineup (course names locked 2026-08-06).
// Naming formula: คอร์สสด AI สำหรับ[แผนก] [ปี] · (English Brand Tag) + subtitle 3 outcomes.
// Thai leads, English follows — SME owners search the department, not "AI Agent".
// Mapping old → new: output/docs/course-name-mapping-2026-08.md (in the agent repo).
// Public Course stays off-web — design still undecided as of 2026-08-06.
export const SERVICES = [
  {
    id: 'inhouse-a',
    title: 'AI สำหรับทีมขาย 2026',
    subtitle: 'เพิ่มยอด · ตามลูกค้าไม่หลุด · ลดงานเอกสารทีมขาย',
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
    id: 'back-office',
    title: 'AI สำหรับงานหลังบ้าน 2026',
    subtitle: 'บัญชี · แอดมิน · จัดซื้อ · สต๊อก · ผลิต — ลดขั้นตอน ลดเอกสาร ลดงานซ้ำ',
    hook: 'หลังบ้านช้า ทีมขายก็วิ่งไม่ออก',
    priceThb: PRICES['ai-workshop-advance'].amount,
    priceLabel: `${fmtPrice('ai-workshop-advance')} / 1 วัน`,
    duration: '1 วัน',
    format: 'In-house · ไม่เกิน 20 คน · เจ้าของ+ผู้จัดการ+พนักงานเรียนรวมห้องเดียวกัน',
    audience: 'บริษัทที่งานหลังบ้านกินเวลาคนไปทั้งวัน — บัญชี แอดมิน จัดซื้อ สต๊อก ผลิต',
    outcome: [
      'ไล่หางานซ้ำที่กินเวลาจริงในบริษัท',
      'สร้าง AI ผู้ช่วยของกระบวนการนั้นในห้อง',
      'มีแผนใช้ต่อวันจันทร์',
    ],
    slug: 'back-office',
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
    title: 'AI สำหรับการตลาดและคอนเทนต์ 2026',
    subtitle: 'วาง Funnel · ทำคอนเทนต์ · ยิงแอด — ให้ลูกค้าทักเข้ามาหาทีมขายเอง',
    hook: 'ให้ลูกค้าเชื่อใจจนทักเข้าทีมขายเอง',
    priceThb: PRICES['tiktok-workshop'].amount,
    priceLabel: `${fmtPrice('tiktok-workshop')} / 2 วัน + ดูแลต่อ 30 วัน`,
    duration: '2 วัน + ดูแลต่อ 30 วัน',
    format: 'On-site + LINE support',
    audience: 'บริษัทที่อยากให้งานการตลาดทั้งเส้น — funnel คอนเทนต์ และแอด — เดินด้วยทีมตัวเอง',
    outcome: [
      'วาง funnel ที่ลูกค้าเดินเข้ามาหาทีมขายเอง',
      'ระบบวงจรคอนเทนต์ 5 ขั้น + ถ่ายจริง 1 วัน',
      'ยิงแอดเป็น + auto repurpose · ประคอง 30 วันใน LINE',
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

// Refreshed 2026-08-06 — was still quoting the retired Basic/Advance/Package A ladder.
export const SERVICE_TIERS_SUMMARY = {
  entry: 'AI สำหรับทีมขาย (฿34,900 · 1 วัน)',
  growth: 'AI สำหรับงานหลังบ้าน (฿39,900 · 1 วัน)',
  system: 'AI สำหรับการตลาดและคอนเทนต์ (฿59,900 · 2 วัน + ดูแล 30 วัน)',
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
