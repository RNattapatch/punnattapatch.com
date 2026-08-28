import { PRICES, fmtPrice } from '../src/data/pricing.mjs';
import { readFile } from 'node:fs/promises';

// เดิม hardcode ราคาไว้ที่นี่ → พอปันปรับราคาที่ SSOT แล้ว guard พังทันที (เจอ 2026-08-09:
// tiktok-workshop 49,900 → 59,900 ทำให้สคริปต์ throw ทั้งที่ของถูกต้อง) · guard ควรตรวจว่า
// "key ที่หน้าเว็บต้องใช้ยังอยู่ครบและ format ถูก" ไม่ใช่ล็อกตัวเลขซ้ำกับ SSOT อีกชุด
// 2026-08-28 catalog revision: Training grid = inhouse-a / ai-workshop-advance / tiktok-workshop
// Services grid = sales-team-structure / daruma-starter / ai-agent-ceo (render จาก SSOT)
const requiredKeys = ['inhouse-a', 'ai-workshop-advance', 'tiktok-workshop', 'tiktok-workshop-regular', 'sales-team-structure', 'daruma-starter', 'ai-agent-ceo'];

for (const key of requiredKeys) {
  const amount = PRICES[key]?.amount;
  if (typeof amount !== 'number' || amount <= 0) throw new Error(`${key} missing from SSOT`);
  if (fmtPrice(key) !== `฿${amount.toLocaleString('en-US')}`) throw new Error(`${key} format mismatch`);
}

const services = await readFile(new URL('../src/pages/services.astro', import.meta.url), 'utf8');
for (const token of ['inhouse-a', 'ai-workshop-advance', 'tiktok-workshop', 'tiktok-workshop-regular']) {
  if (!services.includes(`fmtPrice('${token}')`)) throw new Error(`missing ${token} token`);
}
// การ์ด Services grid render จาก SSOT ผ่าน serviceOffers — เช็คว่า key ครบ
for (const key of ['sales-team-structure', 'daruma-starter', 'ai-agent-ceo']) {
  if (!services.includes(`'${key}'`)) throw new Error(`services grid missing key ${key}`);
}
// ของที่ถอดจากหน้าร้านแล้ว (2026-08-28) ห้ามโผล่กลับ
for (const retired of ["fmtPrice('inhouse-b')", "fmtPrice('daruma-transformation')", 'Daruma Sales Office Bootcamp']) {
  if (services.includes(retired)) throw new Error(`retired offer "${retired}" is back on /services`);
}
if (services.includes('Public Course') || services.includes('Daruma Score &amp; Transformation Roadmap')) {
  throw new Error('retired public offer remains');
}

const proofImages = services.match(/\/testimonial\/2026-(?:05|07)\/review-\d+\.jpg/g) ?? [];
if (proofImages.length < 8) throw new Error('service proof gallery needs at least 8 real review images');
if (!services.includes('รีวิวและบรรยากาศจากงานที่เกิดขึ้นจริง')) {
  throw new Error('service proof gallery heading missing');
}

for (const file of ['src/pages/index.astro', 'src/pages/daruma.astro', 'src/pages/booking.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (source.includes('เช็ค Daruma Score') || source.includes('จองวันตรวจ')) {
    throw new Error(`retired public Score CTA in ${file}`);
  }
}

const booking = await readFile(new URL('../src/pages/booking.astro', import.meta.url), 'utf8');
if (booking.includes("recommended_path: /^(5-10|11-20|20\\+)$.test(teamSize) ? 'daruma-score'")) {
  throw new Error('booking still routes qualified leads to Daruma Score');
}

// หน้าเก่าต้อง 301 ไปที่ anchor ที่ "มีอยู่จริง" ใน services.astro — ล็อกชื่อ anchor ตายตัวไม่ได้
// เพราะแค็ตตาล็อกขยับได้ (2026-08-09: advance-ai ย้ายจาก #inhouse-a → #back-office ตอนแยกคอร์สหลังบ้าน)
for (const file of ['src/pages/advance-ai.astro', 'src/pages/ai-workshop-advance.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const target = source.match(/Astro\.redirect\('\/services#([a-z-]+)', 301\)/);
  if (!target) throw new Error(`${file} redirect missing`);
  if (!services.includes(`id="${target[1]}"`)) throw new Error(`${file} redirects to #${target[1]} which does not exist in services.astro`);
}

// ทุก url ใน SSOT ที่ชี้ไป anchor ของ /services ต้องมี anchor นั้นจริง (กันลิงก์ตาย)
// เช็คกับ HTML ที่ build ออกมาแล้ว ไม่ใช่ซอร์ส — เพราะการ์ดบางใบ render id จาก SSOT (id={offer.key})
// ซึ่ง grep หาในซอร์สไม่เจอ · ต้อง `pnpm build` ก่อนรัน guard ตัวนี้
let rendered = null;
try {
  rendered = await readFile(new URL('../dist/services/index.html', import.meta.url), 'utf8');
} catch {
  try { rendered = await readFile(new URL('../dist/services.html', import.meta.url), 'utf8'); } catch { /* ยังไม่ได้ build */ }
}
if (!rendered) {
  console.warn('[verify-catalog] ⚠️ ข้ามการเช็ค anchor — ยังไม่มี dist/ ให้ `pnpm build` ก่อนแล้วรันใหม่');
} else {
  for (const [key, entry] of Object.entries(PRICES)) {
    const anchor = entry.url.match(/^\/services#([a-z-]+)$/);
    if (anchor && !rendered.includes(`id="${anchor[1]}"`)) {
      throw new Error(`pricing key "${key}" ชี้ไป /services#${anchor[1]} แต่ไม่มี anchor นั้นในหน้าที่ build ออกมา`);
    }
  }
}

const serviceRedirects = await readFile(new URL('../src/pages/services/[slug].astro', import.meta.url), 'utf8');
if (!serviceRedirects.includes("'package-a': '/services'")) {
  throw new Error('Package A redirect missing');
}

console.log('catalog v2 pricing checks passed');
