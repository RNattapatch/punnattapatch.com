// ─────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH สำหรับราคาแพ็กเกจทุกตัว (THB)
//
// แก้ราคาที่นี่ "ที่เดียว" → git push → Cloudflare Pages rebuild
//   → หน้า /services (ผ่าน serviceDetails.ts) + ทุกบทความ (ผ่าน {{price:key}} token)
//     เปลี่ยนพร้อมกันอัตโนมัติ
//
// ใช้ .mjs (ไม่ใช่ .ts) เพราะต้อง import ได้ทั้งจาก:
//   - serviceDetails.ts (TS)              → หน้า service
//   - plugins/remark-price.mjs (Node ESM) → inject token ในบทความตอน build
// .mjs import ได้ทุก context โดยไม่ต้องมี TS loader ใน Node
// ─────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} PriceEntry
 * @property {number} amount  ราคาเป็นบาท (ตัวเลขล้วน ไม่มี comma/฿)
 * @property {string} url     route ของแพ็กเกจบนเว็บ
 * @property {string} [note]  หมายเหตุภายใน (ไม่ render)
 */

/** @type {Record<string, PriceEntry>} */
export const PRICES = {
  'ai-workshop-basic':       { amount: 29900, url: '/services/ai-workshop',                   note: 'Basic Foundation AI · 1 วัน' },
  'ai-workshop-advance':     { amount: 39900, url: '/services/ai-workshop',                   note: 'Advance AI & Business Automation' },
  'package-a-list':          { amount: 69900, url: '/services#package-a',                     note: 'Package A list price (strikethrough)' },
  'package-a':               { amount: 59900, url: '/services#package-a',                     note: 'Advance + Consult 2 วัน (locked 2026-07-20)' },
  'daruma-score':            { amount: 25000, url: '/ads/daruma-score',                       note: 'Daruma Score — sales-system diagnostic day' },
  'daruma-transformation':   { amount: 198000, url: '/services#daruma-transformation',        note: 'Daruma Sales Transformation — 45 days' },
  'sales-system-sprint':     { amount: 65000, url: '/services/sales-system-sprint',           note: '1 เดือนจบ' },
  'sale-training-bundle':    { amount: 44900, url: '/services/sale-training-bundle',          note: 'Early Bird' },
  'sale-training-regular':   { amount: 52800, url: '/services/sale-training-bundle',          note: 'ราคาปกติ' },
  'tiktok-workshop':         { amount: 49900, url: '/services/trust-content-tiktok-workshop', note: 'ราคาเปิดตัว' },
  'tiktok-workshop-regular': { amount: 59900, url: '/services/trust-content-tiktok-workshop', note: 'ราคาปกติ' },
};

/**
 * คืนค่าราคาแบบ format พร้อมแสดง เช่น "฿39,900"
 * @param {keyof typeof PRICES | string} key
 * @returns {string}
 */
export function fmtPrice(key) {
  const entry = PRICES[key];
  if (!entry) {
    throw new Error(
      `[pricing] unknown price key "${key}". Valid keys: ${Object.keys(PRICES).join(', ')}`
    );
  }
  return '฿' + entry.amount.toLocaleString('en-US');
}

/** ตัวเลขราคาแพ็กเกจทั้งหมด (ใช้ใน lint guard เพื่อจับ hardcode ที่ค้าง) */
export const PRICE_AMOUNTS = Object.values(PRICES).map((p) => p.amount);
