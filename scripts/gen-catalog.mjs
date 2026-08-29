// gen-catalog.mjs — แปลง SSOT (src/data/pricing.mjs) เป็นไฟล์ที่ "ระบบอื่นอ่านได้"
//
// ทำไมต้องมี: ราคาเดิมถูกพิมพ์ซ้ำอยู่ 3 ที่ (เว็บ · oa-campaigns.md ของบอท LINE ·
// ความรู้ของ AI agent ทั้ง 2 เครื่อง) พอแก้ราคาที่นึงแล้วลืมอีกที่ = บอกลูกค้าคนละราคา
// ตอนนี้ทุกฝั่งอ่าน public/catalog.json ที่ generate จาก pricing.mjs ไฟล์เดียว
//
// รันอัตโนมัติตอน `pnbm build` (ดู package.json) — ไม่ต้องสั่งเอง
// ปลายทาง: https://punnattapatch.com/catalog.json
//
// ⚠️ ไม่ใส่ timestamp ในไฟล์ผลลัพธ์ตั้งใจ — จะได้ไม่มี diff ปลอมทุกครั้งที่ build

import { writeFile, readFile } from 'node:fs/promises';
import { CATALOG, TERMS, fmtPrice } from '../src/data/pricing.mjs';

const SITE = 'https://punnattapatch.com';

const packages = Object.entries(CATALOG)
  .filter(([, e]) => e.status === 'live')   // sunset/internal ไม่ต้องให้บอทหรือ agent เห็น
  .map(([key, e]) => ({
    key,
    name: e.name,
    name_en: e.nameEn ?? null,
    kind: e.kind,
    duration: e.duration ?? null,
    headline: e.headline ?? null,
    audience: e.audience ?? null,
    amount_thb: e.amount,
    price_label: fmtPrice(key),
    url: e.url.startsWith('http') ? e.url : SITE + e.url,
    // thumbnail 16:9 — บอท LINE ใช้เป็น hero ของการ์ด Flex · null = การ์ดไม่มีรูป
    image_url: e.image ? SITE + e.image : null,
    outline_url: e.outlineUrl ?? null,
    status: e.status,
    // บอทบอกตัวเลขนี้กับลูกค้าได้ไหม — ถ้า false ต้อง escalate ให้คุณปันประเมิน scope เอง
    bot_may_quote: Boolean(e.botQuote),
  }));

const catalog = {
  $schema_version: 1,
  source_of_truth: 'punnattapatch.com/src/data/pricing.mjs',
  currency: 'THB',
  // กฎที่ทุกฝั่งต้องเคารพเหมือนกัน (บอท LINE · agent บน MacBook + Mac mini)
  rules: {
    quote_policy:
      'บอกตัวเลขได้เฉพาะรายการที่ bot_may_quote = true เท่านั้น · นอกนั้นตอบว่า "ขึ้นกับ scope งาน เดี๋ยวคุณปันประเมินให้" แล้ว escalate',
    discount_policy: 'ห้ามลดราคา ห้ามต่อรองแทนคุณปันทุกกรณี',
    terms_disclosure:
      'ห้ามยกเงื่อนไขการเงิน/ค่าเดินทางมาบอกก่อนลูกค้าถาม — ตอบเมื่อลูกค้าถามเอง หรือเมื่อคุยถึงขั้นจองคิว/ออกใบเสนอราคาแล้ว',
  },
  terms: TERMS,
  packages,
};

const out = new URL('../public/catalog.json', import.meta.url);
const next = JSON.stringify(catalog, null, 2) + '\n';

let prev = '';
try { prev = await readFile(out, 'utf8'); } catch { /* ยังไม่เคยมีไฟล์ */ }

if (prev === next) {
  console.log(`[gen-catalog] ไม่มีอะไรเปลี่ยน (${packages.length} แพ็กเกจ)`);
} else {
  await writeFile(out, next);
  console.log(`[gen-catalog] เขียน public/catalog.json แล้ว — ${packages.length} แพ็กเกจ`);
}
