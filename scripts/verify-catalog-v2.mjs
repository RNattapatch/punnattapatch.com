import { PRICES, fmtPrice } from '../src/data/pricing.mjs';
import { readFile } from 'node:fs/promises';

// เดิม hardcode ราคาไว้ที่นี่ → พอปันปรับราคาที่ SSOT แล้ว guard พังทันที (เจอ 2026-08-09:
// tiktok-workshop 49,900 → 59,900 ทำให้สคริปต์ throw ทั้งที่ของถูกต้อง) · guard ควรตรวจว่า
// "key ที่หน้าเว็บต้องใช้ยังอยู่ครบและ format ถูก" ไม่ใช่ล็อกตัวเลขซ้ำกับ SSOT อีกชุด
// 2026-08-30 catalog revision: public services resolve pricing keys through
// service-offers.ts; legacy keys remain in the SSOT for compatibility only.
const publicOfferKeys = ['inhouse-a', 'ai-workshop-advance', 'tiktok-workshop', 'daily-sales-consulting', 'daruma-starter'];
const compatibilityKeys = ['tiktok-workshop-regular', 'sales-team-structure', 'ai-agent-ceo'];
const requiredKeys = [...publicOfferKeys, ...compatibilityKeys];
const publicOfferUrls = {
  'inhouse-a': '/services/t1-sales-skills',
  'ai-workshop-advance': '/services/t3-sales-back-office',
  'tiktok-workshop': '/services/online-to-sales',
  'daily-sales-consulting': '/services/daily-consulting',
  'daruma-starter': '/services/dashboard-build',
};

for (const key of requiredKeys) {
  const amount = PRICES[key]?.amount;
  if (typeof amount !== 'number' || amount <= 0) throw new Error(`${key} missing from SSOT`);
  if (fmtPrice(key) !== `฿${amount.toLocaleString('en-US')}`) throw new Error(`${key} format mismatch`);
}
for (const [key, url] of Object.entries(publicOfferUrls)) {
  if (PRICES[key]?.url !== url) throw new Error(`${key} canonical URL mismatch`);
}

const services = await readFile(new URL('../src/pages/services.astro', import.meta.url), 'utf8');
const serviceOffers = await readFile(new URL('../src/data/service-offers.ts', import.meta.url), 'utf8');
if (!services.includes("from '../data/service-offers'")) throw new Error('/services must consume the service offer contract');
if (!services.includes('fmtPrice(pricingKey)')) throw new Error('/services must resolve offer prices from the SSOT at render time');
for (const key of publicOfferKeys) {
  if (!serviceOffers.includes(`pricingKey: '${key}'`)) throw new Error(`public offer pricing key missing: ${key}`);
}
for (const key of compatibilityKeys) {
  if (serviceOffers.includes(`pricingKey: '${key}'`)) throw new Error(`legacy pricing key must not be promoted as a public offer: ${key}`);
}
// ของที่ถอดจากหน้าร้านแล้ว (2026-08-28) ห้ามโผล่กลับ
for (const retired of ["fmtPrice('inhouse-b')", "fmtPrice('daruma-transformation')", 'Daruma Sales Office Bootcamp']) {
  if (services.includes(retired)) throw new Error(`retired offer "${retired}" is back on /services`);
}
if (services.includes('Public Course') || services.includes('Daruma Score &amp; Transformation Roadmap')) {
  throw new Error('retired public offer remains');
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

// หน้าเก่าต้อง 301 ตรงไป canonical detail route เพื่อไม่สร้าง redirect chain
for (const file of ['src/pages/advance-ai.astro', 'src/pages/ai-workshop-advance.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (!source.includes(`Astro.redirect('${publicOfferUrls['ai-workshop-advance']}', 301)`)) {
    throw new Error(`${file} must redirect directly to the T3 canonical route`);
  }
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
if (!serviceRedirects.includes(`'package-a': '${publicOfferUrls['daily-sales-consulting']}'`)) {
  throw new Error('Package A must redirect to the canonical C1 offer');
}

console.log('catalog v2 pricing checks passed');
