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
    note: 'in-house private · ราคาอยู่ใน outline PDF ที่ส่งลูกค้า · ลด 35,000 → 34,900 (ปันเคาะ 2026-08-09 ให้ราคาเริ่มต้นของ consult เท่ากับ training คนจะได้ไม่เลือกจากราคา) ⚠️ outline PDF ยังพิมพ์ 35,000 ต้องอัปไฟล์ตาม',
  },
  'consult-daily': {
    amount: 34900,
    url: '/services#ai-agent-ceo',
    name: 'ที่ปรึกษา — เรตรายวัน',
    nameEn: 'Consulting — Day Rate',
    kind: 'consult',
    duration: '1 วัน',
    headline: 'นั่งวางระบบกับคุณปันโดยตรง 1 วันเต็ม — ได้ทางออกที่ลงมือทำต่อได้ทันที',
    audience: 'เจ้าของที่มีโจทย์ชัดแล้ว อยากได้ทางออกเร็วโดยไม่ต้องจ้างเป็นโปรเจกต์',
    status: 'live',
    botQuote: true,
    note: 'ราคาเริ่มต้นฝั่ง consult · ปันล็อก 2026-08-09 ให้เท่ากับอบรม 1 วัน (inhouse-a) เพื่อตัดราคาออกจากการตัดสินใจ ลด paradox of choice · ต่างจาก ai-agent-ceo ตรงที่อันนั้นคือ "สินค้า" เฉพาะตัว ส่วน key นี้คือ "เรต" ที่หน้า /start กับ /thank-you อ้างถึง',
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
