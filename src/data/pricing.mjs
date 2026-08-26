// ─────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH — ราคา + แพ็กเกจ + เงื่อนไขบริการ (THB)
//
// แก้ที่นี่ "ที่เดียว" → git push → build → ทุกปลายทางเปลี่ยนตาม:
//   1. หน้า /services + service pages   (import PRICES / CATALOG ตรงๆ)
//   2. ทุกบทความ                        ({{price:key}} token · plugins/remark-price.mjs)
//   3. public/catalog.json              (scripts/gen-catalog.mjs รันตอน build)
//   4. บอท LINE OA                      (fetch catalog.json · mac-mini-ops/line-relay/catalog.mjs)
//   5. AI agent ทั้ง MacBook + Mac mini  (อ่าน catalog.json · docs/PRICING-SSOT.md ในรีโป agent)
//
// ⚠️ ห้ามพิมพ์ราคาเป็นตัวเลขไว้ที่อื่น — `node scripts/check-prices.mjs` จับได้
//
// ใช้ .mjs (ไม่ใช่ .ts) เพราะต้อง import ได้ทั้งจาก:
//   - serviceDetails.ts (TS)              → หน้า service
//   - plugins/remark-price.mjs (Node ESM) → inject token ในบทความตอน build
//   - scripts/*.mjs (Node ESM)            → generator + lint
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CatalogEntry
 * @property {number} amount        ราคาเป็นบาท (ตัวเลขล้วน ไม่มี comma/฿)
 * @property {string} url           route ของแพ็กเกจบนเว็บ
 * @property {string} name          ชื่อที่ใช้พูดกับลูกค้า (ไทย · ชื่อทางการ)
 * @property {string} [nameEn]      แท็กภาษาอังกฤษใต้ชื่อไทย
 * @property {'inhouse'|'consult'|'flagship'|'content'|'internal'} kind
 * @property {string} [duration]    เช่น "1 วัน" · "2 วัน + ดูแลต่อ 30 วัน"
 * @property {string} [headline]    ผลลัพธ์ 1 บรรทัด (ใช้บนการ์ด/บอท)
 * @property {string} [audience]    เหมาะกับใคร
 * @property {'live'|'sunset'|'internal'} status  live = ขายอยู่ · sunset = เลิกขาย · internal = key อ้างอิงเฉยๆ
 * @property {boolean} botQuote     บอท LINE บอกตัวเลขนี้กับลูกค้าได้ไหม (false = escalate ให้คุณปัน)
 * @property {string} [outlineUrl]  PDF outline ที่บอทส่งให้ลูกค้าได้
 * @property {string} [note]        หมายเหตุภายใน (ไม่ render ให้ลูกค้าเห็น)
 */

/** @type {Record<string, CatalogEntry>} */
export const CATALOG = {
  // ── คอร์สสด In-house 3 ตัว — เลือกตามแผนกที่ติด ไม่ใช่เลือกตามราคา ──────────
  // ราคา 1 วัน เท่ากันทั้ง 2 ตัวโดยตั้งใจ (ปันเคาะ 2026-08-09): ตัดตัวแปรราคาออก
  // จากการตัดสินใจ → ลูกค้าเลือกจาก "แผนกไหนติด" แทนการเทียบว่าอันไหนถูกกว่า
  'inhouse-a': {
    amount: 34900,
    url: '/services#inhouse-a',
    name: 'AI สำหรับทีมขาย 2026',
    nameEn: 'Sales × AI Agent',
    kind: 'inhouse',
    duration: '1 วัน',
    headline: 'เพิ่มยอด · ตามลูกค้าไม่หลุด · ลดงานเอกสารทีมขาย',
    audience: 'บริษัทที่มีทีมขาย 5-20 คน · งานตามลูกค้า/ใบเสนอราคา/รายงานกินเวลาเซลล์',
    status: 'live',
    botQuote: true,
    note: 'คอร์ส 1 · ราคาเดียวทั้งทีมไม่เกิน 20 คน',
  },
  'ai-workshop-advance': {
    amount: 34900,
    url: '/services#back-office',
    name: 'AI สำหรับงานหลังบ้าน 2026',
    nameEn: 'Back Office × AI Agent',
    kind: 'inhouse',
    duration: '1 วัน',
    headline: 'บัญชี · แอดมิน · จัดซื้อ · สต๊อก · ผลิต — ลดขั้นตอน ลดเอกสาร ลดงานซ้ำ',
    audience: 'บริษัทที่งานหลังบ้านกินเวลาคนไปทั้งวัน',
    status: 'live',
    botQuote: true,
    note: 'คอร์ส 2 · ชื่อเดิม Advance AI & Business Automation · ลด 39,900 → 34,900 (ปันเคาะ 2026-08-09 · ให้เท่าคอร์ส 1 ลด paradox of choice)',
  },
  'tiktok-workshop': {
    amount: 59900,
    url: '/services/trust-content-tiktok-workshop',
    name: 'AI สำหรับการตลาดและคอนเทนต์ 2026',
    nameEn: 'Marketing & Content × AI Agent',
    kind: 'content',
    duration: '2 วัน + ดูแลต่อ 30 วัน',
    headline: 'วาง Funnel · ทำคอนเทนต์ · ยิงแอด — ให้ลูกค้าทักเข้ามาหาทีมขายเอง',
    audience: 'บริษัทที่อยากให้งานการตลาดทั้งเส้นเดินด้วยทีมตัวเอง',
    status: 'live',
    botQuote: true,
    note: 'คอร์ส 3 · ชื่อเดิม AI Trust Content Cycle · ปันเคาะ 2026-08-06 เลิกราคาเปิดตัว 49,900 เข้ากริดแพ็กคู่ 59,900',
  },

  // ── ยกทีมทั้งทีม / แก้ทั้งระบบ ───────────────────────────────────────────
  'inhouse-b': {
    amount: 59900,
    url: '/services#inhouse-b',
    name: 'Daruma Sales Office Bootcamp',
    kind: 'inhouse',
    duration: '2 วัน',
    headline: 'ยกทีมขายทั้งทีมพร้อมกัน — จากคนเก่งคนเดียวเป็นระบบที่ทุกคนใช้ได้',
    audience: 'ทีมขายที่พึ่งคนเก่งคนเดียว อยากให้ทั้งทีมทำงานด้วยมาตรฐานเดียวกัน',
    status: 'live',
    botQuote: true,
  },
  'daruma-starter': {
    amount: 69900,
    url: '/services#daruma-starter',
    name: 'Daruma Starter',
    kind: 'consult',
    duration: '3 วัน (อบรม 1 + จับมือทำ 2) + ดูแลต่อ 30 วัน',
    headline: 'อบรมแล้วไม่ปล่อยให้ทำเอง — คุณปันอยู่ต่อจับมือทีมสร้างระบบจนใช้งานได้จริง',
    audience: 'บริษัทที่กลัวว่าอบรมจบแล้วทีมไม่มีเวลาไปทำต่อ',
    status: 'live',
    botQuote: true,
    outlineUrl: 'https://pub.srv1840715.hstgr.cloud/course/outline-daruma-starter.pdf',
    note: 'วันแรก = คอร์ส AI สำหรับทีมขาย ตัวเดียวกัน แล้วต่ออีก 2 วัน',
  },
  'ai-agent-ceo': {
    // 2026-08-09: ปันสั่งให้ราคาเริ่มต้น consult เท่ากับ training (ตัดราคาออกจากการตัดสินใจ)
    amount: 34900,
    url: '/services#ai-agent-ceo',
    name: 'AI-Agent for CEO & Executive',
    kind: 'consult',
    duration: '1 วันเต็ม (฿34,900/วัน)',
    headline: 'คู่คิด AI ส่วนตัวของเจ้าของ — รับโจทย์ธุรกิจแล้วแปลงเป็นทางออกที่ทำได้จริง',
    audience: 'CEO/เจ้าของ 1-10 ท่าน ที่อยากใช้ AI ให้ถูกทางแต่ไม่มีเวลาเรียนเอง',
    status: 'live',
    botQuote: true,
    outlineUrl: 'https://pub.srv1840715.hstgr.cloud/course/outline-ai-agent-ceo.pdf',
    note: 'in-house private · ราคาอยู่ใน outline PDF ที่ส่งลูกค้า',
  },
  'daruma-transformation': {
    amount: 198000,
    url: '/services#daruma-transformation',
    name: 'Daruma Sales Transformation',
    kind: 'flagship',
    duration: '45 วัน',
    headline: 'รื้อระบบขายทั้งเส้น — KPI · Commission · SOP · AI workflow พร้อมโค้ชทีม',
    audience: 'เจ้าของที่อยากถอดตัวออกจากงานขายประจำภายในไตรมาสนี้',
    status: 'live',
    botQuote: true,
  },
  'system-health-check': {
    // 2026-08-18: ดีลเปิดประตูใหม่ — stress test (จำลองข้อมูล 7 ปีข้างหน้าแล้ววัดจริง) + secure-app audit
    // สำหรับระบบที่ลูกค้า vibe-code เองหรือจ้างทำมา · harness: mac-mini-ops/services/stress-test (repo หลัก)
    // ⚠️ ราคา 19,900 คือ RECOMMENDATION ยังไม่ได้เคาะ — เปลี่ยน status เป็น 'live' เมื่อคุณปันยืนยันตัวเลข
    amount: 19900,
    url: '/services#system-health-check',
    name: 'System Health Check — ตรวจสุขภาพระบบก่อนใช้จริง',
    kind: 'consult',
    duration: '3-5 วันทำการ (ตรวจ + รายงาน 2 ชั้น + walkthrough ผล 1 ครั้ง)',
    headline: 'ระบบที่สั่ง AI สร้างใช้ได้วันนี้ — แต่จะรอดไหมเมื่อข้อมูลโตถึงปีที่ 7? ตรวจด้วยการยัดข้อมูลอนาคตเข้าไปวัดจริง พร้อมตรวจความปลอดภัย',
    audience: 'เจ้าของที่มีระบบ AI-built อยู่แล้ว แต่ไม่แน่ใจว่าปลอดภัยและรับข้อมูลโตไหว ก่อนให้ทีมใช้จริง',
    status: 'internal',
    botQuote: false,
    note: 'ค่าตรวจเครดิตเข้าดีลแก้ระบบต่อได้ · รายงานตัวอย่าง: clients/_internal/stress-test-dogfood (repo หลัก)',
  },

  // ── AI Business Systems — productized system offers (รอขึ้น LP) ─────────────────
  // 2026-08-25: ล็อกโครงราคาจาก PicoAlive founding deployment · status internal จนกว่า LP + scope จะผ่าน QC
  'ai-system-launch': {
    amount: 119000,
    url: '/services',
    name: 'AI System Launch',
    nameEn: 'One workflow, working with a real team',
    kind: 'consult',
    duration: 'ติดตั้ง + เปิดใช้ 30 วัน',
    headline: 'เริ่มจาก 1 workflow ที่กินเวลาหรือทำให้งานหลุด แล้วทำให้ทีมใช้กับงานจริง',
    audience: 'ธุรกิจ SME ที่รู้ว่างานไหนติด แต่ยังไม่มีคนแปลงให้เป็นระบบ',
    status: 'internal',
    botQuote: false,
    note: 'ราคาเต็มหลัง PicoAlive founding price · 1 module + 1 team + 1 workflow + 1 channel + 1 view + 30-day activation',
  },
  'ai-system-module': {
    amount: 89900,
    url: '/services',
    name: 'โมดูลเพิ่มสำหรับ AI Business Systems',
    nameEn: 'Standard expansion module',
    kind: 'consult',
    duration: 'ตาม Scope มาตรฐานของโมดูล',
    headline: 'เพิ่ม 1 workflow จาก Module Library บนระบบที่เปิดใช้แล้ว',
    audience: 'ลูกค้า AI Business Systems ที่ระบบแรกเดินแล้วและต้องการเพิ่ม workflow มาตรฐาน',
    status: 'internal',
    botQuote: false,
    note: 'Existing core only · same client environment · 1 workflow · connectors, new data structures, and custom rules excluded',
  },
  'ai-growth-system': {
    amount: 299000,
    url: '/services',
    name: 'AI Growth System',
    nameEn: 'Three connected business modules',
    kind: 'flagship',
    duration: 'เปิดใช้ 45–60 วัน',
    headline: 'เชื่อม 3 workflow ที่มีผลต่อยอดขาย เวลาผู้บริหาร หรืองานที่หลุด',
    audience: 'ธุรกิจที่พิสูจน์ workflow แรกแล้ว และต้องการเชื่อมงานหลัก 2 ทีม',
    status: 'internal',
    botQuote: false,
    note: '3 connected modules · up to 2 teams · cross-module view · connectors quoted separately',
  },
  'ai-business-transformation': {
    amount: 499000,
    url: '/services',
    name: 'AI Business Transformation',
    nameEn: 'Modular operating system for an SME',
    kind: 'flagship',
    duration: 'เปิดใช้และปรับการทำงาน 90 วัน',
    headline: 'วางระบบข้ามทีมจากงานจริง โดยเพิ่มทีละโมดูลบนฐานข้อมูลเดียวกัน',
    audience: 'ธุรกิจที่ปัญหาผูกกันหลายทีม และมีเจ้าของโครงการฝั่งลูกค้าที่ตัดสินใจได้',
    status: 'internal',
    botQuote: false,
    note: 'Up to 5 modules · 90-day adoption · third-party fees and non-standard connectors excluded',
  },
  'ai-system-care': {
    amount: 29900,
    url: '/services',
    name: 'ดูแลระบบ AI รายเดือน',
    nameEn: 'AI System Care',
    kind: 'consult',
    duration: 'รายเดือน',
    headline: 'ดูแลให้ระบบทำงานต่อเนื่อง พร้อม monitoring, backup, incident response และ core update',
    audience: 'ลูกค้าที่ติดตั้ง AI Business System แล้ว',
    status: 'internal',
    botQuote: false,
    note: 'Prepaid monthly · no feature requests, new modules, meetings, or on-site visits included',
  },
  'ai-system-advisory': {
    amount: 49900,
    url: '/services',
    name: 'ดูแลระบบและที่ปรึกษา',
    nameEn: 'AI System Care + Advisory',
    kind: 'consult',
    duration: 'รายเดือน',
    headline: 'ดูแลระบบ พร้อมทบทวนข้อมูลและตัดสินใจเรื่องระบบที่ควรปรับในเดือนถัดไป',
    audience: 'เจ้าของที่ต้องการให้คุณปันช่วยอ่านข้อมูล ลำดับปัญหา และวาง roadmap',
    status: 'internal',
    botQuote: false,
    note: 'Includes system care + monthly 90-minute review + decision memo + quarterly roadmap',
  },

  // ── key อ้างอิง/ราคาเปรียบเทียบ — ไม่ใช่สินค้าที่ขายตรง ───────────────────
  'inhouse-b-list': {
    amount: 69900, url: '/services#inhouse-b', name: 'Daruma Sales Office Bootcamp (ราคาเต็ม)',
    kind: 'internal', status: 'internal', botQuote: false, note: 'list price สำหรับขีดฆ่า',
  },
  'package-a-list': {
    amount: 69900, url: '/services#inhouse-b', name: 'Package A (ราคาเต็ม)',
    kind: 'internal', status: 'internal', botQuote: false, note: 'list price สำหรับขีดฆ่า · anchor #package-a ถูกยุบเข้า #inhouse-b',
  },
  'package-a': {
    amount: 59900, url: '/services#inhouse-b', name: 'Package A (Advance + Consult 2 วัน)',
    kind: 'internal', status: 'internal', botQuote: false, note: 'locked 2026-07-20 · anchor #package-a ถูกยุบเข้า #inhouse-b',
  },
  'tiktok-workshop-regular': {
    amount: 59900, url: '/services/trust-content-tiktok-workshop', name: 'AI สำหรับการตลาดและคอนเทนต์ (ราคาปกติ)',
    kind: 'internal', status: 'internal', botQuote: false, note: 'เท่ากับ tiktok-workshop แล้ว — เก็บ key ไว้เพราะบทความเก่ายังอ้างถึง',
  },
  'ai-workshop-basic': {
    amount: 29900, url: '/services#inhouse-a', name: 'Basic Foundation AI',
    kind: 'internal', duration: '1 วัน', status: 'sunset', botQuote: false,
    note: 'SUNSET 2026-07-20 ไม่ขึ้นเว็บแล้ว — เก็บ key ไว้เพราะบทความเก่ายังอ้างถึง',
  },
};

// ── เงื่อนไขบริการ — บอท/agent ใช้ตอบลูกค้า ─────────────────────────────────
// ⚠️ กฎการใช้: "ห้ามยกมาบอกก่อนลูกค้าถาม" — เงื่อนไขการเงินตอนเปิดบทสนทนา = แรงต้าน
// ตอบเมื่อลูกค้าถามเอง หรือเมื่อคุยถึงขั้นตอนจองคิว/ออกใบเสนอราคาแล้วเท่านั้น
export const TERMS = {
  payment: {
    label: 'การชำระเงิน',
    value: 'ชำระ 100% ก่อนเริ่มงานทุกกรณี',
    detail: 'สำหรับงานอบรม ชำระก่อนวันอบรมอย่างน้อย 7 วัน เพื่อยืนยันสิทธิ์และล็อกคิววันนั้นไว้ให้',
  },
  travel: {
    label: 'ค่าเดินทาง',
    value: 'เดินทางฟรีในระยะที่กำหนด',
    detail: 'เกินระยะฟรี คิดค่าเดินทางกิโลเมตรละ 7 บาท (แจ้งตัวเลขให้ทราบก่อนยืนยันงานเสมอ)',
  },
  format: {
    label: 'รูปแบบ',
    value: 'In-house on-site เท่านั้น — คุณปันเดินทางไปที่บริษัทคุณ',
    detail: 'ไม่มีคอร์สออนไลน์ · ราคาเดียวทั้งทีม (คอร์ส 1 วัน รับไม่เกิน 20 คน เกินกว่านี้คุยกันได้)',
  },
};

/**
 * PRICES — รูปแบบเดิม เพื่อไม่ให้ของที่ import อยู่แล้วพัง
 * derive จาก CATALOG ตรงๆ → แก้ราคาที่ CATALOG ที่เดียวพอ
 * @type {Record<string, {amount: number, url: string, note?: string}>}
 */
export const PRICES = Object.fromEntries(
  Object.entries(CATALOG).map(([key, e]) => [key, { amount: e.amount, url: e.url, note: e.note }])
);

/**
 * คืนค่าราคาแบบ format พร้อมแสดง เช่น "฿34,900"
 * @param {keyof typeof CATALOG | string} key
 * @returns {string}
 */
export function fmtPrice(key) {
  const entry = CATALOG[key];
  if (!entry) {
    throw new Error(
      `[pricing] unknown price key "${key}". Valid keys: ${Object.keys(CATALOG).join(', ')}`
    );
  }
  return '฿' + entry.amount.toLocaleString('en-US');
}

/** แพ็กเกจที่ขายอยู่จริง เรียงตามลำดับที่อยากให้ลูกค้าเห็น */
export const LIVE_PACKAGES = Object.entries(CATALOG)
  .filter(([, e]) => e.status === 'live')
  .map(([key, e]) => ({ key, ...e }));

/** ตัวเลขราคาแพ็กเกจทั้งหมด (ใช้ใน lint guard เพื่อจับ hardcode ที่ค้าง) */
export const PRICE_AMOUNTS = Object.values(CATALOG).map((p) => p.amount);
