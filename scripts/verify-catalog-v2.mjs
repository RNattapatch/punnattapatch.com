import { PRICES, fmtPrice } from '../src/data/pricing.mjs';
import { readFile } from 'node:fs/promises';

const expected = {
  'inhouse-a': 34900,
  'inhouse-b-list': 69900,
  'inhouse-b': 59900,
  'daruma-transformation': 198000,
  'tiktok-workshop': 49900,
};

for (const [key, amount] of Object.entries(expected)) {
  if (PRICES[key]?.amount !== amount) throw new Error(`${key} price mismatch`);
  if (fmtPrice(key) !== `฿${amount.toLocaleString('en-US')}`) throw new Error(`${key} format mismatch`);
}

const services = await readFile(new URL('../src/pages/services.astro', import.meta.url), 'utf8');
for (const token of ['inhouse-a', 'inhouse-b-list', 'inhouse-b', 'daruma-transformation', 'tiktok-workshop']) {
  if (!services.includes(`fmtPrice('${token}')`)) throw new Error(`missing ${token} token`);
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

for (const file of ['src/pages/advance-ai.astro', 'src/pages/ai-workshop-advance.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (!source.includes("Astro.redirect('/services#inhouse-a', 301)")) throw new Error(`${file} redirect missing`);
}

const serviceRedirects = await readFile(new URL('../src/pages/services/[slug].astro', import.meta.url), 'utf8');
if (!serviceRedirects.includes("'package-a': '/services#inhouse-b'")) {
  throw new Error('Package A redirect missing');
}

console.log('catalog v2 pricing checks passed');
