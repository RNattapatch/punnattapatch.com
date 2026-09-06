// SSOT ย้ายไปอยู่ที่ content-update.mjs แล้ว (2026-09-06) เพื่อให้ scripts/gen-catalog.mjs
// อ่านได้ด้วย และเดือนบนป้ายจะได้มีที่เดียวทั้งเว็บและบอท LINE
// ไฟล์นี้เหลือหน้าที่ re-export ให้โค้ดฝั่ง .astro/.ts ที่ import อยู่เดิมไม่ต้องแก้
export { CONTENT_UPDATE, CONTENT_UPDATE_LINE_1, CONTENT_UPDATE_LINE_2 } from './content-update.mjs';
