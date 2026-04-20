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
    line: 'https://lin.ee/punnattapatch',
  },
  nav: [
    { label: 'หน้าหลัก', href: '/' },
    { label: 'บริการ', href: '/services' },
    { label: 'Public Training', href: '/training' },
    { label: 'BOSI Quiz', href: '/bosi-dna-quiz' },
    { label: 'Case Study', href: '/case-studies' },
    { label: 'บทเรียน 100 ล้าน', href: '/insights' },
    { label: 'FAQ', href: '/faq' },
    { label: 'เกี่ยวกับปัน', href: '/about' },
    { label: 'ประเมินปัญหา', href: '/intake-form', cta: true },
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
    title: 'Advanced AI & Business Automation',
    subtitle: 'AI Day Workshop',
    hook: 'ทีมขายเสียเวลา 5+ ชั่วโมง/สัปดาห์ กับงานที่ AI ทำได้ใน 10 นาที',
    priceThb: 30000,
    priceLabel: '฿30,000 / วัน',
    duration: '1 วัน (6-7 ชม.)',
    format: 'On-site หรือ Online',
    audience: 'ทีมขายที่เสียเวลากับงาน manual ซ้ำๆ อยากเห็น AI ทำงานจริงก่อนลงทุนเพิ่ม',
    outcome: [
      'กลับไปพร้อม AI tool ใช้ได้จริง — ไม่ใช่แค่ slide',
      'วัดผล Before / After ภายในวันเดียว',
      'ทีมใช้ต่อเองได้ — team lead maintain เป็น',
    ],
    slug: 'ai-workshop',
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
      'n8n workflow + AI tools พร้อมใช้ทันที',
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
    priceThb: 39900,
    priceLabel: '฿39,900 (5 ธุรกิจแรก)',
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
  { value: '10+', label: 'Active Clients', note: '฿30-200M revenue each · B2B relationship-based' },
  { value: '฿100M+', label: 'Sales Managed', note: 'Cumulative since 2025 · verified quarterly reports · anonymized per NDA' },
  { value: '+40%', label: 'Average Sales Uplift', note: 'Range 25-55% by industry · n=10 · directional signal (not peer-reviewed study)' },
] as const;

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
