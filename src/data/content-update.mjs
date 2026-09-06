// ป้าย "อัปเดตเนื้อหา" ที่แปะบนกล่อง Offer ของทุก service (คุณปันสั่ง 2026-09-05)
// แก้ที่นี่ที่เดียว → T1/T2/T3/T4 (OfferStack), C1/I1 (InvestmentBlock) และ
// **การ์ด Flex ของบอท LINE** เปลี่ยนตาม — บอทอ่านผ่าน catalog.json (scripts/gen-catalog.mjs)
//
// ทำไมเป็น .mjs: gen-catalog.mjs รันด้วย node ตรงๆ ไม่ผ่าน Vite จึง import .ts ไม่ได้
// ฝั่ง .astro/.ts ยัง import ได้ตามปกติ (แบบเดียวกับ pricing.mjs) ผ่าน content-update.ts
export const CONTENT_UPDATE = {
  month: 'กันยายน 2026',
  models: ['GPT-6 Astra', 'Claude Fable 5.1'],
};

export const CONTENT_UPDATE_LINE_1 = `อัปเดตเนื้อหา ${CONTENT_UPDATE.month}`;
export const CONTENT_UPDATE_LINE_2 = `รองรับ ${CONTENT_UPDATE.models.join(' · ')}`;
