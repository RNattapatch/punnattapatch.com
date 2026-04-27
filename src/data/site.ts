// Site-wide configuration + brand identity
// Update here once, referenced everywhere.

export const SITE = {
  url: 'https://punnattapatch.com',
  name: 'Pun Nattapatch',
  nameTh: 'ปัน ณัฐพัชร์',
  titleDefault: 'ปัน ณัฐพัชร์ — B2B Sales Consultant & Agentic AI Transformation',
  description:
    'ที่ปรึกษาการขาย B2B สำหรับ SME ไทย เชี่ยวชาญ Agentic AI Transformation — ช่วยทีมขาย build AI workflow ที่รันได้จริง ไม่ใช่แค่ prototype',
  locale: 'th_TH',
  twitter: '@punnattapatch',
  author: {
    name: 'Pun Nattapatch',
    nameTh: 'ปัน ณัฐพัชร์',
    handle: '@pun_nattapatch',
    jobTitle: 'B2B Sales Consultant & Agentic AI Transformation Specialist',
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
    { label: 'Advance Workshop', href: '/ai-workshop-advance' },
    { label: 'Public Training', href: '/training' },
    { label: 'Free Kit', href: '/agent-builder-kit' },
    { label: 'BOSI Quiz', href: '/bosi-dna-quiz' },
    { label: 'Case Study', href: '/case-studies' },
    { label: 'บทเรียน 100 ล้าน', href: '/insights' },
    { label: 'FAQ', href: '/faq' },
    { label: 'เกี่ยวกับปัน', href: '/about' },
    { label: 'ติดต่องาน', href: '/sponsor' },
    { label: 'นัดคุยกับผม', href: '/intake-form', cta: true },
  ],
} as const;

export const BRAND_COLORS = {
  navy: '#072b4e',
  coral: '#dd4155',
  coralDark: '#c43245',
  cream: '#fdfaf4',
} as const;

export const SERVICES = [
  {
    id: 'ai-workshop',
    title: 'Basic AI Workshop',
    subtitle: 'Day 1 · Build AI Agent แรก',
    hook: 'ทีมขายเสียเวลา 5+ ชั่วโมง/สัปดาห์ กับงานที่ AI ทำได้ใน 10 นาที',
    priceThb: 24900,
    priceLabel: '฿24,900 · Early Bird ถึง 30 เม.ย. · 1 พ.ค. แยกเป็น Basic ฿29,900 + Advance ฿29,900',
    duration: '1 วัน (6-7 ชม.)',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'ทีมขายที่เสียเวลากับงาน manual ซ้ำๆ อยากเห็น AI ทำงานจริงก่อนลงทุนเพิ่ม',
    outcome: [
      'กลับไปพร้อม AI tool ใช้ได้จริง — ไม่ใช่แค่ slide',
      'วัดผล Before / After ภายในวันเดียว',
      'ทีมใช้ต่อเองได้ — team lead maintain เป็น',
    ],
    slug: 'ai-workshop',
  },
  {
    id: 'ai-workshop-advance',
    title: 'Advance AI Workshop',
    subtitle: 'Day 2 · Multi-agent System ทั้งองค์กร',
    hook: 'Day 1 สร้าง AI Agent แรกได้แล้ว — Day 2 คือระบบทั้งบริษัทวิ่งด้วย AI',
    priceThb: 29900,
    priceLabel: '฿29,900 / Day 2 (pre-req: Day 1) · Bundle Day1+2 = ฿50,000',
    duration: '1 วัน (6-7 ชม.)',
    format: 'On-site เท่านั้น (In-house)',
    audience: 'ผู้ที่ผ่าน Basic Workshop (Day 1) แล้ว · อยากให้ระบบ AI วิ่งเองทั้งองค์กร',
    outcome: [
      'ระบบ AI ทำงานทั้งองค์กรโดยไม่ต้องสั่งทุกครั้ง — trigger อัตโนมัติเต็มรูปแบบ',
      'LINE OA / CRM / Sheet เชื่อมกันเป็น pipeline เดียว',
      'Auto-report KPI ส่งทุกเช้า ไม่ต้องรอทีมสรุป',
      'หัวหน้าทีมดูแลและขยาย workflow เองได้โดยไม่พึ่งผม',
    ],
    slug: 'ai-workshop-advance',
  },
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
  {
    id: 'trust-content-tiktok-workshop',
    title: 'Trust Content Workshop for TikTok',
    subtitle: 'Special Workshop · 1 Day In-House',
    hook: 'เปลี่ยนมือถือเครื่องเดียวให้เป็นเครื่องจักรสร้างลูกค้า B2B ผ่าน TikTok',
    priceThb: 44900,
    priceLabel: '฿44,900 · Early Bird 5 ธุรกิจแรก (ปกติ ฿52,800)',
    duration: '1 วัน In-house',
    format: 'On-site workshop เจ้าของ + ทีม',
    audience: 'เจ้าของ SME ที่อยากสร้างลูกค้า B2B ผ่าน TikTok แต่ยังไม่รู้วิธี content ที่ปิดการขาย',
    outcome: [
      '3 คลิปถ่ายเสร็จจบในวันนั้น — โพสต์ได้ทันที',
      'Content Calendar 30 วันพร้อมใช้',
      'Trust Framework PDF + Script Template Kit',
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
