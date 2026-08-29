import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CATALOG } from '../src/data/pricing.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const offersPath = `${root}/src/data/service-offers.ts`;
const offerAssetsPath = `${root}/src/data/service-offer-assets.ts`;
const sitePath = `${root}/src/data/site.ts`;
const verifierPath = fileURLToPath(import.meta.url);
const componentPreviewPath = `${root}/dist/services-components-preview.html`;

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

function assertOfferAssetContract(offers) {
  assert.ok(existsSync(offerAssetsPath), 'src/data/service-offer-assets.ts does not exist');

  const source = readFileSync(offerAssetsPath, 'utf8');
  assert.match(source, /import type \{ ImageMetadata \} from 'astro';/, 'asset module must use Astro ImageMetadata');
  assert.match(source, /export const OFFER_ASSET_BY_CODE: Readonly<Record<OfferCode, ImageMetadata>>/, 'asset module must export a typed offer image map');
  assert.match(source, /export const LINE_QR_IMAGE: ImageMetadata/, 'asset module must export the typed LINE QR image');

  for (const offer of offers) {
    const filename = offer.thumbnailFile;
    const importMatch = source.match(new RegExp(`import\\s+(\\w+)\\s+from\\s+'\\.\\./assets/services/product-thumbnails/${filename}';`));
    assert.ok(importMatch, `${offer.code} must import ${filename} through Astro`);
    assert.match(source, new RegExp(`${offer.code}:\\s*${importMatch[1]}`), `${offer.code} must map to ${filename}`);
    assert.ok(existsSync(`${root}/src/assets/services/product-thumbnails/${filename}`), `${filename} is missing from Astro assets`);
  }

  assert.match(source, /import\s+lineQr\s+from\s+'\.\.\/assets\/services\/line-qr\.png';/, 'LINE QR must import through Astro');
  assert.ok(existsSync(`${root}/src/assets/services/line-qr.png`), 'LINE QR is missing from Astro assets');
}

function loadSiteLineUrl() {
  const siteSource = readFileSync(sitePath, 'utf8');
  const match = siteSource.match(/line:\s*'(https:\/\/[^']+)'/);
  assert.ok(match, 'SITE.social.line must be configured');
  return match[1];
}

function decodeLineQrPayload() {
  const swiftSource = `
import Foundation
import Vision
let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNDetectBarcodesRequest { request, error in
  if let error { fputs("\\(error)\\n", stderr); exit(1) }
  let payloads = (request.results as? [VNBarcodeObservation])?.compactMap(\\.payloadStringValue) ?? []
  guard let payload = payloads.first else { fputs("LINE QR did not decode\\n", stderr); exit(1) }
  print(payload)
}
let handler = VNImageRequestHandler(url: imageURL)
do { try handler.perform([request]) } catch { fputs("\\(error)\\n", stderr); exit(1) }
`;
  return execFileSync('swift', ['-', `${root}/src/assets/services/line-qr.png`], {
    encoding: 'utf8', input: swiftSource,
  }).trim();
}

function resolveUrl(url) {
  return execFileSync('curl', ['-sSL', '-o', '/dev/null', '-w', '%{url_effective}', url], { encoding: 'utf8' }).trim();
}

function canonicalDestination(url) {
  const resolved = new URL(resolveUrl(url));
  return `${resolved.origin}${resolved.pathname}`;
}

function assertComponentBuildOutput() {
  assert.ok(existsSync(componentPreviewPath), 'component preview build output does not exist; run pnpm build after adding the services component preview');

  const html = readFileSync(componentPreviewPath, 'utf8');
  const expectedOffers = [
    ['T1', 'training'],
    ['T2', 'training'],
    ['T3', 'training'],
    ['C1', 'consulting'],
    ['I1', 'implementation'],
    ['A1', 'upgrade'],
  ];

  for (const [code, kind] of expectedOffers) {
    assert.match(html, new RegExp(`id="offer-${code.toLowerCase()}"`), `${code} must have a unique offer anchor`);
    assert.match(html, new RegExp(`data-offer-code="${code}"`), `${code} must expose its offer code`);
    assert.match(html, new RegExp(`data-offer-kind="${kind}"`), `${code} must expose its offer kind`);
  }

  assert.equal((html.match(/id="offer-(?:t1|t2|t3|c1|i1|a1)"/g) ?? []).length, 6, 'the component preview must contain exactly six unique offer anchors');
  assert.match(html, /data-contact-cta/, 'the component preview must expose a LINE contact CTA');
  const expectedContactCtas = [
    ['training_card_t1', 'T1'],
    ['training_card_t2', 'T2'],
    ['training_card_t3', 'T3'],
    ['consulting_card_c1', 'C1'],
    ['implementation_card_i1', 'I1'],
    ['upgrade_strip_a1', 'A1'],
    ['services_final_cta', 'none'],
  ];
  for (const [location, code] of expectedContactCtas) {
    assert.match(html, new RegExp(`data-cta-location="${location}"`), `${location} must retain CTA location metadata`);
    assert.match(html, new RegExp(`data-product-code="${code}"`), `${location} must retain product metadata`);
  }
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
assertOfferAssetContract(SERVICE_OFFERS);
assert.doesNotMatch(
  readFileSync(verifierPath, 'utf8'),
  /\b\d{4,6}\b/,
  'price amounts belong only in src/data/pricing.mjs, never in this verifier',
);
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
  assert.match(offer.primaryCtaLabel, /\S/, `${code} must provide a CTA label`);
  assert.ok(['detail', 'line'].includes(offer.primaryCtaKind), `${code} CTA kind must use the public interface`);
  if (offer.primaryCtaKind === 'detail') {
    assert.match(offer.detailHref ?? '', /^\//, `${code} detail CTA needs an internal href`);
  } else {
    assert.equal(offer.detailHref, null, `${code} LINE CTA must not claim a detail href`);
  }
}

const c1 = OFFER_BY_CODE.C1;
assert.equal(c1.formatLabel, 'Consulting · 1 primary outcome/day', 'C1 must promise exactly one primary outcome per day');
assert.match(c1.description, /เลือกได้ 1 หัวข้อ/, 'C1 must select exactly one consulting topic');
for (const topic of [
  'Online-to-Sales Full Journey',
  'team/KPI/commission',
  'Sales Control/Report/Dashboard Design',
  'AI workflow or AI agent prototype',
]) {
  assert.ok(c1.description.includes(topic), `C1 must list selectable topic: ${topic}`);
}
assert.equal(c1.primaryCtaKind, 'line', 'C1 must use the LINE CTA');
assert.equal(c1.detailHref, null, 'C1 must not expose a detail href');

assert.equal(OFFER_BY_CODE.A1.pricingKey, null, 'A1 must not have a price key');
assert.equal(SERVICE_OFFERS.some((offer) => /\b\d{4,6}\b/.test(JSON.stringify(offer))), false, 'offer contract must not contain a price amount');

if (!process.argv.includes('--data-only')) {
  assert.equal(CATALOG['daily-sales-consulting']?.status, 'live', 'C1 canonical key must be public');
  assert.equal(CATALOG['daily-sales-consulting']?.botQuote, true, 'the approved C1 price may be quoted by the bot');
  for (const key of ['sales-team-structure', 'ai-agent-ceo']) {
    assert.ok(CATALOG[key], `${key} compatibility key must remain resolvable`);
    assert.equal(CATALOG[key].status, 'internal', `${key} must not be publicly promoted`);
    assert.equal(CATALOG[key].botQuote, false, `${key} must not be quoted by the bot`);
  }

  const sharp = (await import('sharp')).default;
  for (const offer of SERVICE_OFFERS) {
    const metadata = await sharp(`${root}/src/assets/services/product-thumbnails/${offer.thumbnailFile}`).metadata();
    assert.equal(metadata.width, 16 * 100, `${offer.thumbnailFile} must be 1600px wide`);
    assert.equal(metadata.height, 900, `${offer.thumbnailFile} must be 900px tall`);
  }
  const qrMetadata = await sharp(`${root}/src/assets/services/line-qr.png`).metadata();
  assert.ok(qrMetadata.width && qrMetadata.width > 0, 'LINE QR width must be nonzero');
  assert.ok(qrMetadata.height && qrMetadata.height > 0, 'LINE QR height must be nonzero');
  assert.equal(
    canonicalDestination(decodeLineQrPayload()),
    canonicalDestination(loadSiteLineUrl()),
    'LINE QR and SITE.social.line must resolve to the same canonical destination',
  );
}

if (process.argv.includes('--build-output')) {
  assertComponentBuildOutput();
}

console.log('services vnext data contract passed');
