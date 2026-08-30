import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { CATALOG, fmtPrice } from '../src/data/pricing.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const offersPath = `${root}/src/data/service-offers.ts`;
const offerAssetsPath = `${root}/src/data/service-offer-assets.ts`;
const sitePath = `${root}/src/data/site.ts`;
const verifierPath = fileURLToPath(import.meta.url);
const distOptionIndex = process.argv.indexOf('--dist');
const distArgument = distOptionIndex === -1 ? null : process.argv[distOptionIndex + 1];
assert.ok(distOptionIndex === -1 || (distArgument && !distArgument.startsWith('--')), '--dist requires a directory argument');
const distPath = distArgument ? resolve(root, distArgument) : `${root}/dist`;
const servicesPagePath = `${distPath}/services.html`;
const redirectsOutputPath = `${distPath}/_redirects`;
const sitemapOutputPath = `${distPath}/sitemap-0.xml`;

const servicesCanonical = 'https://punnattapatch.com/services';
const servicesTitle = 'คอร์สสำหรับทีมขาย และบริการวางระบบฝ่ายขาย | ปัน ณัฐพัชร์';
const servicesDescription = 'Training, Consulting และ Implementation สำหรับทีมขายที่ต้องการเพิ่มยอด วาง Funnel, Follow-up, Report และ Dashboard โดยใช้ AI เป็นตัวช่วยในงานที่เหมาะสม';

function builtPagePath(route) {
  return route === '/' ? `${distPath}/index.html` : `${distPath}/${route.replace(/^\//, '')}.html`;
}

function builtHtmlPaths(directory = distPath) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? builtHtmlPaths(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}

function builtPublicHtmlPages() {
  return builtHtmlPaths()
    .filter((path) => path.endsWith('.html'))
    .map((path) => ({ path, html: readFileSync(path, 'utf8') }))
    .filter(({ html }) => !/http-equiv="refresh"/i.test(html) && !/<meta name="robots" content="[^"]*noindex/i.test(html));
}

function assertPublicBuildContentIntegrity() {
  const retiredPrice = fmtPrice('package-a');
  const violations = [];

  for (const { path, html } of builtPublicHtmlPages()) {
    const publicPath = path.replace(`${distPath}/`, '');
    if (/Package A/i.test(html)) violations.push(`${publicPath}: Package A`);
    if (/Paid[ -]Audit/i.test(html)) violations.push(`${publicPath}: Paid Audit`);
    if (html.includes(retiredPrice)) violations.push(`${publicPath}: retired package price`);

    if (/Agentic AI Transformation|AI Agent Transformation|AI Transformation สำหรับ(?:ธุรกิจ|SME|ทีมขาย)/i.test(html)) {
      violations.push(`${publicPath}: generic AI Transformation positioning`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `public build must not render retired package positioning:\n${violations.join('\n')}`,
  );
}

function assertFloatingLineBuildOutput() {
  const visibleRoutes = ['/', '/services', '/training', '/case-studies/forklift-distributor-5-person-team', '/insights/ai-transformation-sales', '/faq'];
  for (const route of visibleRoutes) {
    const pagePath = builtPagePath(route);
    assert.ok(existsSync(pagePath), `${route} build output does not exist`);
    const html = readFileSync(pagePath, 'utf8');
    assert.equal((html.match(/<a\b[^>]*\bdata-floating-line(?:\s|>)/g) ?? []).length, 1, `${route} must render exactly one floating LINE control`);
  }

  const hiddenRoutes = [
    '/booking',
    '/thank-you',
    '/intake-form',
    '/bosi-dna-quiz',
    '/ebook-sales-interview',
    '/agent-builder-kit/thank-you',
    '/playbook/line-ai-sales-agent',
    '/app/dashboard',
    '/ads/dealer-online-sales',
  ];
  for (const route of hiddenRoutes) {
    const html = readFileSync(builtPagePath(route), 'utf8');
    assert.doesNotMatch(html, /<a\b[^>]*\bdata-floating-line(?:\s|>)/, `${route} must not render the floating LINE control`);
  }

  const servicesHtml = readFileSync(servicesPagePath, 'utf8');
  assert.match(servicesHtml, /href="https:\/\/lin\.ee\/ioSnSUG"[^>]*data-contact-cta[^>]*data-cta-location="floating_line"[^>]*data-product-code="none"[^>]*data-cta-label="ทัก LINE · ให้ผมช่วยเลือก"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(servicesHtml, /data-floating-line-qr/, 'floating control must include the local QR popover');
  assert.doesNotMatch(servicesHtml.match(/<div[^>]*data-floating-line-root[\s\S]*?<\/div>/)?.[0] ?? '', /ตอบ(?:กลับ)?ใน\s*5\s*นาที/);

  const adsHtml = readFileSync(builtPagePath('/ads/dealer-online-sales'), 'utf8');
  assert.equal((adsHtml.match(/id="dealer-ai-sticky"/g) ?? []).length, 1, 'ads LP must retain exactly one bottom sticky CTA');
}

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

function assertServicesPageBuildOutput() {
  assert.ok(existsSync(servicesPagePath), 'services page build output does not exist; run pnpm build');

  const html = readFileSync(servicesPagePath, 'utf8');
  const sectionIds = [
    'services-hero',
    'services-proof-strip',
    'training-catalog',
    'consulting-implementation',
    'advance-program',
    'offer-chooser',
    'organisation-proof',
    'faq',
    'services-final-cta',
  ];

  let previousSectionIndex = -1;
  for (const id of sectionIds) {
    const sectionIndex = html.indexOf(`id="${id}"`);
    assert.ok(sectionIndex > previousSectionIndex, `#${id} must exist in the required section order`);
    previousSectionIndex = sectionIndex;
  }

  const expectedOfferOrder = ['T2', 'T1', 'T3', 'C1', 'I1', 'A1'];
  const renderedOfferOrder = [...html.matchAll(/data-offer-code="(T1|T2|T3|C1|I1|A1)"/g)].map((match) => match[1]);
  assert.deepEqual(renderedOfferOrder, expectedOfferOrder, 'services page must render each public offer once in the required order');

  for (const [index, code] of expectedOfferOrder.entries()) {
    const offer = OFFER_BY_CODE[code];
    const cardStart = html.indexOf(`data-offer-code="${code}"`);
    const nextCode = expectedOfferOrder[index + 1];
    const cardEnd = nextCode ? html.indexOf(`data-offer-code="${nextCode}"`) : html.indexOf('id="offer-chooser"');
    const cardHtml = html.slice(cardStart, cardEnd);
    if (offer.pricingKey) {
      assert.ok(CATALOG[offer.pricingKey], `${code} pricing key must exist in CATALOG`);
      assert.ok(cardHtml.includes(fmtPrice(offer.pricingKey)), `${code} must render the caller-resolved CATALOG price`);
    } else {
      assert.doesNotMatch(cardHtml, /฿[\d,]+/, `${code} must not render a public price`);
    }
  }

  assert.match(html, /SALES TRAINING · CONSULTING · IMPLEMENTATION/, 'services hero eyebrow must match the approved copy');
  assert.match(html, /คอร์สและบริการสำหรับทีมขาย ที่อยากเพิ่มยอดและทำงานเป็นระบบ/, 'services hero heading must match the approved copy');
  assert.match(html, /เลือกจากงานที่อยากให้ทีมทำได้จริง ไม่ต้องเริ่มจากชื่อเครื่องมือ ผมช่วยได้ตั้งแต่พัฒนาทักษะเซลล์ วาง Funnel ไปจนถึงสร้าง Report และ Dashboard ให้ใช้งานจริง/, 'services hero support copy must match the approved copy');
  assert.match(html, /ดูคอร์สและบริการ ↓/, 'services hero must link to the offer catalog');
  assert.match(html, /ให้ผมช่วยเลือกทาง LINE/, 'services hero must offer LINE decision help');

  for (const heading of [
    'คอร์สสำหรับทีมขายที่เปิดสอนตอนนี้',
    'ถ้าอบรมอย่างเดียวยังไม่พอ ผมเข้าไปวางระบบกับทีมให้',
    'องค์กรที่เคยเชิญไปสอนและวางระบบ',
    'คำถามที่ถามบ่อยก่อนเลือกคอร์สหรือบริการ',
    'ยังไม่แน่ใจว่าควรเริ่มจากคอร์สหรือวางระบบ?',
  ]) {
    assert.ok(html.includes(heading), `services page must use exact required heading: ${heading}`);
  }

  const compatibilityPlacements = [
    ['core-training', 'training-catalog', 'consulting-implementation'],
    ['system-services', 'consulting-implementation', 'advance-program'],
    ['course-selector', 'offer-chooser', 'organisation-proof'],
    ['trusted-by', 'organisation-proof', 'faq'],
  ];
  for (const [anchor, sectionStart, sectionEnd] of compatibilityPlacements) {
    const anchorIndex = html.indexOf(`id="${anchor}"`);
    assert.ok(
      anchorIndex > html.indexOf(`id="${sectionStart}"`) && anchorIndex < html.indexOf(`id="${sectionEnd}"`),
      `#${anchor} must remain available inside its replacement section`,
    );
  }

  const c1Index = html.indexOf('id="offer-c1"');
  const c1ArticleEnd = html.indexOf('</article>', c1Index);
  const i1Index = html.indexOf('id="offer-i1"');
  for (const legacyAnchor of ['sales-team-structure', 'ai-agent-ceo']) {
    const legacyIndex = html.indexOf(`id="${legacyAnchor}"`);
    assert.ok(legacyIndex > c1Index && legacyIndex < c1ArticleEnd, `#${legacyAnchor} must be a descendant of the C1 article`);
  }

  for (const code of ['C1', 'I1']) {
    const cardStart = html.indexOf(`data-offer-code="${code}"`);
    const cardEnd = html.indexOf('</article>', cardStart);
    const cardHtml = html.slice(cardStart, cardEnd);
    assert.match(cardHtml, /(เล่าโจทย์ให้ผมฟัง|ขอประเมิน Scope)/, `${code} must use an approved exact LINE label`);
    assert.doesNotMatch(cardHtml, /คุยกับปันใน LINE/, `${code} must not use the retired LINE label`);
  }

  const visibleFaqCount = (html.match(/<details\b[^>]*data-service-faq/g) ?? []).length;
  assert.equal(visibleFaqCount, 10, 'services page must render ten FAQ answers');
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const schemaNodes = jsonLdBlocks.flatMap((block) => block['@graph'] ?? [block]);
  const faqSchemas = schemaNodes.filter((node) => node['@type'] === 'FAQPage');
  assert.equal(faqSchemas.length, 1, 'services page must emit exactly one FAQPage schema');
  const [faqSchema] = faqSchemas;
  assert.ok(faqSchema, 'services page must expose FAQPage schema');
  assert.equal(faqSchema.mainEntity.length, visibleFaqCount, 'visible FAQ and FAQ schema question counts must agree');
  for (const item of faqSchema.mainEntity) {
    assert.ok(html.includes(item.name), `visible FAQ must include schema question: ${item.name}`);
    assert.ok(html.includes(item.acceptedAnswer.text), `visible FAQ must include schema answer for: ${item.name}`);
  }

  assert.match(html, /Clinic, Hotel, B2B/, 'T2 must explicitly support lead-based businesses beyond Dealer');
  assert.match(html, /data-service-testimonial[\s\S]*เซลล์เลิกใช้ส่วนลดปิดดีล เปลี่ยนมาคุยเรื่องคุณค่าที่ลูกค้าได้/, 'organisation proof must visibly retain the relevant published sales testimonial');
  assert.match(html, /href="\/case-studies\/forklift-distributor-5-person-team"/, 'the sales testimonial must link to its published case study');
  assert.doesNotMatch(html, /Paid Audit/i, 'Paid Audit must not return to the public services funnel');
}

function assertServicesSeoBuildOutput() {
  assert.ok(existsSync(servicesPagePath), 'services page build output does not exist; run pnpm build');

  const html = readFileSync(servicesPagePath, 'utf8');
  assert.match(html, new RegExp(`<title>${servicesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`), 'services title must match the approved title exactly once');
  assert.doesNotMatch(html, new RegExp(`${servicesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} · ปัน ณัฐพัชร์`), 'services title must not duplicate the site name');
  assert.match(html, new RegExp(`<meta name="description" content="${servicesDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), 'meta description must lead with the approved Training, Consulting and Implementation intent');
  assert.match(html, new RegExp(`<link rel="canonical" href="${servicesCanonical}"`), 'services canonical must use the clean production URL');
  assert.match(html, new RegExp(`<meta property="og:title" content="${servicesTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), 'Open Graph title must match the catalog title');
  assert.match(html, new RegExp(`<meta property="og:description" content="${servicesDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), 'Open Graph description must match the catalog description');
  assert.match(html, /<meta property="og:image" content="https:\/\/punnattapatch\.com\/_astro\/t2-online-to-offline-ai\.[^"]+\.png"/, 'Open Graph image must use the catalog hero product artwork');

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const schemaNodes = jsonLdBlocks.flatMap((block) => block['@graph'] ?? [block]);
  const nodesOfType = (type) => schemaNodes.filter((node) => node['@type'] === type);

  assert.equal(nodesOfType('WebPage').length, 1, 'services page must emit one WebPage schema');
  assert.equal(nodesOfType('ItemList').length, 1, 'services page must emit one ItemList schema');
  assert.equal(nodesOfType('Course').length, 3, 'only T1–T3 may emit Course schema');
  assert.equal(nodesOfType('Service').length, 2, 'only C1 and I1 may emit Service schema');
  assert.equal(nodesOfType('BreadcrumbList').length, 1, 'services page must emit one BreadcrumbList schema');
  assert.equal(nodesOfType('FAQPage').length, 1, 'services page must not duplicate FAQPage schema');
  assert.equal(nodesOfType('Product').length, 0, 'services schema must not expose stale Product pricing');

  const webPage = nodesOfType('WebPage')[0];
  assert.equal(webPage.url, servicesCanonical, 'WebPage schema URL must match canonical');
  assert.equal(webPage.name, servicesTitle, 'WebPage schema name must match page title');
  assert.equal(webPage.description, servicesDescription, 'WebPage schema description must match page metadata');

  const expectedSchemaOffers = [
    ['T1', 'Course'],
    ['T2', 'Course'],
    ['T3', 'Course'],
    ['C1', 'Service'],
    ['I1', 'Service'],
  ];
  for (const [code, type] of expectedSchemaOffers) {
    const offer = OFFER_BY_CODE[code];
    const node = schemaNodes.find((candidate) => candidate['@id'] === `${servicesCanonical}#offer-${code.toLowerCase()}`);
    assert.ok(node, `${code} schema node must use its visible offer anchor`);
    assert.equal(node['@type'], type, `${code} schema type must match the product role`);
    assert.equal(node.name, offer.publicName, `${code} schema name must match the visible catalog`);
    assert.equal(node.description, offer.description, `${code} schema description must match the visible catalog`);
    assert.deepEqual(node.provider, { '@id': 'https://punnattapatch.com/#person' }, `${code} schema must identify its provider`);
  }

  const itemList = nodesOfType('ItemList')[0];
  assert.equal(itemList.numberOfItems, 6, 'ItemList must represent all six visible catalog roles');
  assert.deepEqual(itemList.itemListElement.map((item) => item.position), [1, 2, 3, 4, 5, 6], 'ItemList positions must be complete and ordered');
  assert.deepEqual(itemList.itemListElement.map((item) => item.item.url), [
    `${servicesCanonical}#offer-t2`,
    `${servicesCanonical}#offer-t1`,
    `${servicesCanonical}#offer-t3`,
    `${servicesCanonical}#offer-c1`,
    `${servicesCanonical}#offer-i1`,
    `${servicesCanonical}#offer-a1`,
  ], 'ItemList order must match the visible services catalog');

  assert.doesNotMatch(html, /Package A|Paid[ -]Audit|AI Transformation/i, 'retired public positioning must not appear in services output');
  assert.ok(!html.includes(fmtPrice('package-a')), 'the retired Package A price must not appear in metadata, schema or hidden output');

  for (const anchor of ['inhouse-a', 'inhouse-b', 'back-office', 'package-a', 'daruma-transformation']) {
    assert.equal((html.match(new RegExp(`id="${anchor}"`, 'g')) ?? []).length, 1, `legacy #${anchor} entry point must remain compatible`);
  }

  assert.ok(existsSync(redirectsOutputPath), 'deploy redirect output must exist');
  const redirects = readFileSync(redirectsOutputPath, 'utf8');
  const legacyRedirects = [
    ['/services/ai-workshop', '/services#inhouse-a'],
    ['/services/ai-workshop-followup', '/services#inhouse-a'],
    ['/services/ai-workshop-advance', '/services#sales-report'],
    ['/services/paid-audit', '/services#offer-c1'],
    ['/services/package-a', '/services#offer-c1'],
    ['/services/sales-system-sprint', '/services#offer-c1'],
    ['/services/sale-training-bundle', '/services#offer-t1'],
    ['/services/trust-content-tiktok-workshop', '/services#trust-content'],
  ];
  for (const [from, to] of legacyRedirects) {
    assert.match(redirects, new RegExp(`^${from.replaceAll('/', '\\/')}\\s+${to.replaceAll('/', '\\/')}\\s+301$`, 'm'), `${from} must permanently redirect to ${to}`);
    const fallbackRedirectHtml = readFileSync(builtPagePath(from), 'utf8');
    assert.match(fallbackRedirectHtml, new RegExp(`http-equiv="refresh" content="0;url=${to.replaceAll('/', '\\/')}"`), `${from} static fallback must redirect to ${to}`);
  }

  assert.ok(existsSync(sitemapOutputPath), 'sitemap build output must exist');
  const sitemap = readFileSync(sitemapOutputPath, 'utf8');
  assert.equal((sitemap.match(new RegExp(`<loc>${servicesCanonical}</loc>`, 'g')) ?? []).length, 1, 'sitemap must include the canonical services URL exactly once');
  for (const [from] of legacyRedirects) {
    assert.ok(!sitemap.includes(`<loc>https://punnattapatch.com${from}</loc>`), `${from} redirect must not be indexed in the sitemap`);
  }
}

const expected = {
  T1: {
    publicName: 'คอร์สจิตวิทยาการขาย + AI Agent สำหรับทีมขาย B2B',
    kind: 'training', pricingKey: 'inhouse-a', thumbnailFile: 't1-sales-skill-ai.png',
    imageAlt: 'คอร์สจิตวิทยาการขายและ AI Agent สำหรับทีมขาย B2B',
  },
  T2: {
    publicName: 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI',
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

if (process.argv.includes('--build-output') || distArgument) {
  assertServicesPageBuildOutput();
  assertServicesSeoBuildOutput();
  assertPublicBuildContentIntegrity();
  assertFloatingLineBuildOutput();
}

console.log('services vnext data contract passed');
