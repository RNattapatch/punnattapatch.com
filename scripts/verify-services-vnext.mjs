import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CATALOG } from '../src/data/pricing.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const offersPath = `${root}/src/data/service-offers.ts`;

function loadOffers() {
  assert.ok(existsSync(offersPath), 'src/data/service-offers.ts does not exist');

  const source = readFileSync(offersPath, 'utf8')
    .replace(/export type [\s\S]*?;\n/g, '')
    .replace(/export interface ServiceOffer \{[\s\S]*?\}\n/g, '')
    .replace(/export const /g, 'const ')
    .replace(/const SERVICE_OFFERS: readonly ServiceOffer\[\]/, 'const SERVICE_OFFERS')
    .replace(/const OFFER_BY_CODE: Readonly<Record<OfferCode, ServiceOffer>>/, 'const OFFER_BY_CODE')
    .replace(/ as const/g, '')
    .replace(/ as Record<OfferCode, ServiceOffer>/g, '')
    .concat('\n;globalThis.__offers = { SERVICE_OFFERS, OFFER_BY_CODE };');
  const context = {};
  vm.runInNewContext(source, context, { filename: offersPath });
  return context.__offers;
}

const expected = {
  T1: {
    publicName: 'คอร์สอบรมทักษะการขาย + Follow-up + AI สำหรับทีมขาย',
    kind: 'training', pricingKey: 'inhouse-a', thumbnailFile: 't1-sales-skill-ai.png',
    imageAlt: 'คอร์สอบรมทักษะการขายและ Follow-up ด้วย AI สำหรับทีมขาย',
  },
  T2: {
    publicName: 'คอร์สเพิ่มยอดขาย Online-to-Offline ด้วย Content + Ads + AI',
    kind: 'training', pricingKey: 'tiktok-workshop', thumbnailFile: 't2-online-to-offline-ai.png',
    imageAlt: 'คอร์สเพิ่มยอดขายจากออนไลน์ไปสู่การนัดหมายและยอดขาย',
  },
  T3: {
    publicName: 'คอร์สอบรมวางระบบหลังบ้านฝ่ายขาย: Report + Dashboard + AI',
    kind: 'training', pricingKey: 'ai-workshop-advance', thumbnailFile: 't3-sales-back-office-ai.png',
    imageAlt: 'คอร์สอบรมวางระบบ Report และ Dashboard สำหรับฝ่ายขาย',
  },
  C1: {
    publicName: 'บริการวางระบบฝ่ายขายแบบรายวัน',
    kind: 'consulting', pricingKey: 'daily-sales-consulting', thumbnailFile: 'c1-daily-sales-consulting.png',
    imageAlt: 'บริการวางระบบฝ่ายขายแบบรายวัน',
  },
  I1: {
    publicName: 'บริการทำ Sales Dashboard + Report อัตโนมัติ',
    kind: 'implementation', pricingKey: 'daruma-starter', thumbnailFile: 'i1-automated-sales-dashboard.png',
    imageAlt: 'บริการสร้าง Sales Dashboard และ Report อัตโนมัติ',
  },
  A1: {
    publicName: 'Advance Program: Sales Mastery with AI',
    kind: 'upgrade', pricingKey: null, thumbnailFile: 'a1-sales-mastery-with-ai.png',
    imageAlt: 'Advance Program เรียนและจับมือวางระบบทีมขายจนใช้จริง',
  },
};

const { SERVICE_OFFERS, OFFER_BY_CODE } = loadOffers();
assert.equal(SERVICE_OFFERS.length, 6, 'there must be exactly six public offers');
assert.deepEqual([...new Set(SERVICE_OFFERS.map((offer) => offer.code))].sort(), Object.keys(expected).sort(), 'six offer codes must be unique');

for (const [code, contract] of Object.entries(expected)) {
  const offer = OFFER_BY_CODE[code];
  assert.ok(offer, `${code} missing from OFFER_BY_CODE`);
  assert.equal(offer, SERVICE_OFFERS.find((item) => item.code === code), `${code} lookup must reference its offer`);
  for (const [field, value] of Object.entries(contract)) {
    assert.equal(offer[field], value, `${code}.${field} does not match the product contract`);
  }
  assert.equal(offer.bullets.length, 3, `${code} must have exactly three bullets`);
}

assert.equal(OFFER_BY_CODE.A1.pricingKey, null, 'A1 must not have a price key');
assert.equal(SERVICE_OFFERS.some((offer) => /(?:34,?900|54,?900|69,?900)/.test(JSON.stringify(offer))), false, 'offer contract must not contain a price number');

if (!process.argv.includes('--data-only')) {
  assert.equal(CATALOG['daily-sales-consulting']?.amount, 34900, 'C1 must use the approved one-day price in the SSOT');
  assert.equal(CATALOG['daily-sales-consulting']?.status, 'live', 'C1 canonical key must be public');
  assert.equal(CATALOG['daily-sales-consulting']?.botQuote, true, 'the approved C1 price may be quoted by the bot');
  for (const key of ['sales-team-structure', 'ai-agent-ceo']) {
    assert.ok(CATALOG[key], `${key} compatibility key must remain resolvable`);
    assert.equal(CATALOG[key].status, 'internal', `${key} must not be publicly promoted`);
    assert.equal(CATALOG[key].botQuote, false, `${key} must not be quoted by the bot`);
  }
}

console.log('services vnext data contract passed');
