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

// Canonical lineup 2026-06-07 (package-pricing-canonical-2026-06-07.md · Pun confirmed).
// TYPE 1/2/3 retired · sales-team packages removed from web · ladder = AI Transformation.
export const SERVICES = [
  {
    id: 'ai-workshop',
    title: 'Basic Foundation AI for Business',
    subtitle: 'ปูพื้น · 1 วัน',
    hook: 'เริ่มจากศูนย์ ให้ทั้งองค์กรใช้ AI เป็นในวันเดียว',
    priceThb: 29900,
    priceLabel: '฿29,900 / 1 วัน · On-site เท่านั้น',
    duration: '1 วัน (6-7 ชม.)',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'องค์กรที่ยังไม่เคยแตะ AI · อยากปูพื้นให้ทีมเห็นภาพและลงมือใช้กับงานจริง',
    outcome: [
      'พื้นฐาน AI ที่ใช้กับงานจริง ไม่ใช่แค่รู้จักศัพท์',
      'ลองทำจริงในวัน เห็น use case ของธุรกิจตัวเอง',
      'ทีมใช้ต่อเองได้ — team lead ดูแลเป็น',
    ],
    slug: 'ai-workshop',
  },
  {
    id: 'ai-workshop-advance',
    title: 'Advance AI & Business Automation',
    subtitle: 'เจาะลึก Agentic + Automation · 1 วัน',
    hook: 'ให้ AI ทำงานแทนทีม — ไม่ใช่แค่ถาม-ตอบ แต่ run เองได้',
    priceThb: 39900,
    priceLabel: '฿39,900 / 1 วัน · On-site เท่านั้น',
    duration: '1 วัน (6-7 ชม.)',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'ผ่าน Basic แล้ว หรือมีพื้นฐาน AI · อยากให้ระบบทำงานเบื้องหลังเองจริง',
    outcome: [
      'สร้าง AI agent + workflow จริง',
      'เชื่อม Google Sheet / n8n เป็นระบบเดียว',
      'ตัดงานซ้ำออกจากทีม',
    ],
    slug: 'ai-workshop-advance',
  },
  {
    id: 'package-a',
    title: 'Package A',
    subtitle: 'Advance + Consult 2 วัน · คุ้มสุด',
    hook: 'ไม่ใช่แค่เรียน — ผมลงไปวางระบบกับทีมคุณจนใช้เป็น',
    priceThb: PRICES['package-a'].amount,
    priceLabel: `${fmtPrice('package-a')} (Advance + Consult 2 วัน)`,
    duration: '1 + 2 วัน',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'อยากได้ทั้งความรู้และให้ผมลงไปวางระบบกับทีมจริงถึงหน้างาน',
    outcome: [
      'ทุกอย่างใน Advance',
      'ผมลง consult 2 วันวางระบบกับทีมจริง',
      'จับมือทำถึงหน้างาน คุ้มสุดในพอร์ต',
    ],
    slug: 'package-a',
  },
  {
    id: 'consult',
    title: 'Consult องค์กร',
    subtitle: 'ที่ปรึกษาราย session',
    hook: 'มีคู่คิดที่เข้าใจธุรกิจคุณ จนระบบเดินได้เอง',
    priceThb: 35000,
    priceLabel: '฿35,000 / วัน',
    duration: '1 วัน / session',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'อยากได้ที่ปรึกษา AI ลงมาช่วยเป็นราย session',
    outcome: [
      'ปรึกษาเชิงลึกกับทีมจริง',
      'วางทิศ + แก้ติดหน้างาน',
      'ต่อยอดเป็น Consult Package ได้',
    ],
    slug: 'consult',
  },
  {
    id: 'consult-package',
    title: 'Consult Package',
    subtitle: '2 ครั้ง + ดูแล 1 เดือน',
    hook: 'ดูแลต่อเนื่องจนทีมใช้เป็น ไม่ใช่จบแล้วทิ้ง',
    priceThb: 45000,
    priceLabel: '฿45,000 (2 ครั้ง + ดูแล 1 เดือน)',
    duration: '2 session + 30 วัน',
    format: 'On-site + ดูแลต่อ 30 วัน',
    audience: 'อยากให้ดูแลต่อเนื่องจนระบบเดินเองได้',
    outcome: [
      'ปรึกษา 2 ครั้ง',
      'ดูแลต่อ 1 เดือน',
      'ระบบเดินเองได้หลังจบ',
    ],
    slug: 'consult-package',
  },
  {
    id: 'ceo-advisory',
    title: 'AI Consultant for CEO',
    subtitle: '1-on-1 · คู่คิด AI ส่วนตัว',
    hook: 'คุณไม่มีเวลาเรียน AI เอง — ให้ผมเป็นคนที่เข้าใจมันแทนคุณ แล้วแปลงเป็นผลลัพธ์ให้ธุรกิจ',
    priceThb: 49000,
    priceLabel: '฿49,000 / วัน · retainer ฿65,000/เดือน (2 วัน/เดือน)',
    duration: '1-on-1 / วัน',
    format: 'ตัวต่อตัว',
    audience: 'CEO / เจ้าของ ที่อยากใช้ AI ให้ถูกทาง แต่ไม่มีเวลานั่งเรียนเอง',
    outcome: [
      'คู่คิด AI ส่วนตัวของผู้บริหาร',
      'แปลงโจทย์ธุรกิจเป็นแนวทาง AI ที่ทำได้',
      'ช่วยตัดสินใจ build / ซื้อ / รอ',
    ],
    slug: 'ceo-advisory',
  },
  {
    id: 'trust-content-tiktok-workshop',
    title: 'AI Trust Content Cycle System',
    subtitle: '2 วัน + 30-day LINE support',
    hook: 'ให้ลูกค้าเชื่อใจจนทักมาเอง — ด้วยวงจรคอนเทนต์ที่ AI หมุนให้ แต่ยังเป็นคุณ',
    priceThb: 49900,
    priceLabel: '฿49,900 (ปกติ ฿59,900)',
    duration: '2 วัน + 30-day LINE',
    format: 'On-site + ดูแลต่อ 30 วัน',
    audience: 'อยากให้ลูกค้าเชื่อใจและทักมาผ่าน content (TikTok) ด้วยระบบที่ AI ช่วยหมุน',
    outcome: [
      'ระบบวงจรคอนเทนต์ 5 ขั้น + ถ่ายจริง 1 วัน',
      'auto repurpose + DM automation',
      '2 วัน + 30-day LINE support',
    ],
    slug: 'trust-content-tiktok-workshop',
  },
  // Legacy sales packages — NOT showcased on /services or booking (refocus 2026-06).
  // Kept ONLY so existing /insights article backlinks (/services/sales-system-sprint,
  // /services/sale-training-bundle) keep resolving. Sold 1-on-1, off-web.
  {
    id: 'sales-system-sprint',
    title: 'Sales System Sprint',
    subtitle: '1-Month Sales System',
    hook: 'มีทีมขาย 5-20 คน แต่ยอดขาย 80% มาจากคุณคนเดียว?',
    priceThb: 65000,
    priceLabel: '฿65,000 / project',
    duration: '1 เดือน (4 sessions)',
    format: 'Discovery → Design → Build → Training',
    audience: 'SME ที่มีทีมขาย 5-20 คน ยังไม่มีระบบ KPI/Commission กำลัง scale หรือเปิดสาขาใหม่',
    outcome: [
      'ยอดขายเพิ่มโดยไม่ต้อง push ด้วยมือ',
      'KPI + Commission ชัดเจน — ทีมรู้เป้า รู้รางวัล',
      'AI workflow อัตโนมัติ + tools พร้อมใช้ทันที',
    ],
    slug: 'sales-system-sprint',
  },
  {
    id: 'sale-training-bundle',
    title: 'Sale Training Bundle',
    subtitle: 'Value Selling + Sales Psychology (2 วัน)',
    hook: 'ทีมขายยังปิดการขายด้วยการลดราคาอยู่เหรอ?',
    priceThb: 50000,
    priceLabel: '฿50,000 · Early Bird ฿44,900',
    duration: '2 วัน',
    format: 'In-house training ≤20 คน',
    audience: 'ทีมขายที่ปิดด้วยลดราคาเป็นหลัก Telesales / Chat Commerce / Field Sales ที่ต้องเปลี่ยนวิธี',
    outcome: [
      'ปิดการขายโดยไม่ลดราคา — ด้วยคุณค่า',
      'เข้าใจจิตวิทยาการตัดสินใจซื้อของลูกค้า',
      'ทีมขายเป็นที่ปรึกษา — ลูกค้าซื้อซ้ำ บอกต่อ',
    ],
    slug: 'sale-training-bundle',
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
  system: 'Sales System Sprint (฿65k/เดือน)',
  training: 'Sale Training Bundle (฿42.5k/2 วัน)',
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
