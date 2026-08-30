import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG, fmtPrice } from '../src/data/pricing.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' };
let server: ReturnType<typeof createServer>;
let baseURL: string;

async function resolveDistFile(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  for (const candidate of cleanPath === '' ? ['index.html'] : [cleanPath, `${cleanPath}.html`, join(cleanPath, 'index.html')]) {
    const resolved = normalize(join(dist, candidate));
    if (!resolved.startsWith(`${dist}/`)) continue;
    try { if ((await stat(resolved)).isFile()) return resolved; } catch {}
  }
  return null;
}

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const file = await resolveDistFile(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    if (!file) return void response.writeHead(404).end('Not found');
    response.writeHead(200, { 'content-type': contentTypes[extname(file) as keyof typeof contentTypes] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

function schemas(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((match) => JSON.parse(match[1])['@graph'] ?? []);
}

test('detail fixtures render all blocks with Catalog values, accessible FAQs, tracking CTAs, and typed schemas', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const courseResponse = await page.goto(`${baseURL}/services/detail-fixture`);
  assert.equal(courseResponse?.status(), 200, 'course fixture must render');
  assert.equal(await page.locator('h1').count(), 1, 'fixture must contain exactly one H1');
  assert.equal(await page.locator('[data-detail-block]').count(), 13, 'fixture must render the shared 13-block detail sequence');
  assert.equal(await page.locator('h1').innerText(), 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', 'H1 must resolve from the Catalog');
  assert.equal(await page.getByText('2 วัน + ดูแลต่อ 30 วัน', { exact: true }).count(), 1, 'duration must resolve from the Catalog');
  assert.equal(await page.getByText('฿54,900', { exact: true }).count(), 1, 'price must resolve from the Catalog');
  assert.equal(await page.locator('[data-contact-cta][data-product-code="T2"][data-cta-intent="quote"]').count(), 3, 'each detail CTA location must carry quote tracking');
  assert.equal(await page.locator('[data-contact-cta][data-product-code="T2"][data-cta-intent="lead_magnet"]').count(), 3, 'each detail CTA location must carry lead magnet tracking');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'fixture must retain exactly one global Floating LINE CTA');
  const firstFaq = page.locator('[data-product-faq-button]').first();
  await firstFaq.focus();
  await firstFaq.press('Space');
  assert.equal(await firstFaq.getAttribute('aria-expanded'), 'true', 'FAQ must toggle from the keyboard');
  const courseSchema = schemas(await page.content()).find((item) => item['@type'] === 'Course');
  assert.equal(courseSchema?.url, 'https://punnattapatch.com/services/detail-fixture', 'Course schema must use the canonical fixture URL');
  assert.ok(schemas(await page.content()).some((item) => item['@type'] === 'FAQPage'), 'fixture must expose FAQPage schema');
  assert.ok(schemas(await page.content()).some((item) => item['@type'] === 'BreadcrumbList'), 'fixture must expose BreadcrumbList schema');

  const serviceResponse = await page.goto(`${baseURL}/services/detail-service-fixture`);
  assert.equal(serviceResponse?.status(), 200, 'service fixture must render');
  const serviceSchema = schemas(await page.content()).find((item) => item['@type'] === 'Service');
  assert.equal(serviceSchema?.url, 'https://punnattapatch.com/services/detail-service-fixture', 'Service schema must use the canonical fixture URL');
  await page.close();
});

test('T2 detail page uses Catalog identity, real LINE conversion, and proof that does not claim Toyota as an outcome', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${baseURL}/services/online-to-sales`);
  assert.equal(response?.status(), 200, 'T2 route must render');
  assert.equal(await page.locator('h1').innerText(), 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', 'T2 H1 must resolve from the Catalog');
  assert.equal(await page.locator('form').count(), 0, 'T2 detail page must not include a form');
  assert.equal(await page.locator('[data-hero-activity]').count(), 1, 'T2 Hero must lead with one real workshop activity photo');
  assert.equal(await page.locator('[data-hero-activity] img').getAttribute('loading'), 'eager', 'T2 Hero activity photo must be ready at first glance');
  assert.equal(await page.locator('[data-hero-step]').count(), 3, 'T2 Hero must break the learning journey into three scannable decision cards');
  assert.equal(await page.locator('[data-client-logo]').count(), 16, 'T2 must show every approved public client logo except Singha Park');
  assert.deepEqual(await page.locator('[data-client-logo] img').evaluateAll((images) => images.slice(0, 7).map((image) => image.alt)), ['Nissan', 'FutureSkill', 'V!NG', 'GPX', 'Royal Enfield', 'Zontes', 'Lambretta'], 'T2 must lead its proof wall with Nissan, FutureSkill, V!NG, and motorcycle brands');
  assert.equal(await page.locator('[data-client-logo] img').first().evaluate((image) => getComputedStyle(image).filter), 'none', 'T2 client logos must retain their original full colour');
  assert.equal(await page.locator('[data-client-logo] img').first().evaluate((image) => getComputedStyle(image).opacity), '1', 'T2 client logos must not be faded');
  assert.equal(await page.locator('[data-product-testimonial]').count(), 12, 'T2 must show the full public testimonial gallery, including more chat evidence');
  assert.equal(await page.locator('[data-product-testimonial] img').first().getAttribute('loading'), 'lazy', 'T2 testimonial gallery must defer below-the-fold proof so Hero remains fast');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'T2 must use the single global Floating LINE CTA');
  assert.deepEqual(
    await page.locator('[data-decision-cta]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cta-location'))),
    ['after_proof', 'after_scope', 'after_fit'],
    'T2 must place contextual decision CTAs after proof, scope, and fit',
  );
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_proof"] [data-contact-cta]').count(), 1, 'course-selection CTA must be the only LINE action in location 2');
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_scope"] [data-contact-cta]').count(), 1, 'outline CTA must have one adjacent LINE action');
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_fit"] [data-contact-cta]').count(), 2, 'large-team CTA must have one adjacent LINE action');
  const pendingOutline = page.locator('[data-download-cta][data-cta-availability="pending"]');
  assert.equal(await pendingOutline.count(), 1, 'T2 must reserve one Course Outline control while the PDF is being prepared');
  assert.equal(await pendingOutline.isDisabled(), true, 'pending Course Outline control must not lead to a broken download');
  assert.equal(await page.locator('a[data-download-cta]').count(), 0, 'T2 must not expose a download link before the PDF exists');
  assert.equal(await page.locator('[data-cta-location="hero"][data-contact-cta]').count(), 2, 'Hero must pair quote and suitability LINE actions');
  assert.equal(await page.locator('[data-cta-location="final"][data-contact-cta]').count(), 2, 'final CTA must pair quote and LINE actions');
  assert.equal(await page.locator('[data-cta-location="hero"][data-cta-intent="suitability"]').count(), 1, 'Hero suitability action must have a distinct analytics intent');
  for (const action of await page.locator('[data-contact-cta]').all()) {
    assert.equal(await action.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(6, 199, 85)', 'every CTA that opens LINE must use LINE green');
  }
  for (const location of ['hero', 'final']) {
    const secondaryAction = page.locator(`[data-cta-location="${location}"][data-contact-cta]`).nth(1);
    assert.equal(await secondaryAction.evaluate((element) => getComputedStyle(element).color), 'rgb(255, 255, 255)', `${location} secondary LINE CTA must remain legible on navy`);
  }
  const lineActions = page.locator('[data-contact-cta]');
  for (const action of await lineActions.all()) assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'all detail actions must use SITE.social.line');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'T2 must publish the approved eight FAQs');
  assert.equal(await page.locator('[data-proof-activity]').count(), 3, 'T2 proof must lead with three real workshop activity photos');
  const firstActivity = page.locator('[data-proof-activity]').first();
  const firstChatProof = page.locator('[data-proof-quote]').first();
  assert.ok((await firstActivity.boundingBox())!.y < (await firstChatProof.boundingBox())!.y, 'real activity proof must appear before chat evidence');
  for (const activityImage of await page.locator('[data-proof-activity] img').all()) {
    assert.equal(await activityImage.getAttribute('loading'), 'eager', 'real activity proof must load when the proof section enters view');
  }
  for (const chatImage of await page.locator('[data-proof-quote] img').all()) {
    assert.equal(await chatImage.evaluate((element) => getComputedStyle(element).objectFit), 'contain', 'chat evidence must preserve its full screenshot without cropping');
  }
  const html = await page.content();
  assert.doesNotMatch(html, /Toyota[\s\S]{0,140}(?:ยอดขายเพิ่ม|ผลลัพธ์|Case Result)/i, 'Toyota demand evidence must never be presented as an outcome');
  const courseSchema = schemas(html).find((item) => item['@type'] === 'Course');
  assert.equal(courseSchema?.url, 'https://punnattapatch.com/services/online-to-sales', 'T2 Course schema must use the canonical route');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `T2 must not overflow at ${viewport.width}px`);
  }
  const mobileNav = await page.locator('.site-nav').boundingBox();
  const mobileMain = await page.locator('#main').boundingBox();
  assert.ok(mobileNav && mobileMain, 'mobile navigation and main content must render');
  assert.equal(mobileMain.y, mobileNav.y + mobileNav.height, 'mobile navigation must not create a detached menu strip above the Hero');
  assert.equal(await page.locator('[data-mobile-nav]').count(), 1, 'mobile navigation must expose one compact menu inside the header');
  await page.setViewportSize({ width: 320, height: 844 });
  await page.locator('[data-mobile-nav] summary').click();
  const mobileMenu = await page.locator('[data-mobile-nav] ul').boundingBox();
  assert.ok(mobileMenu && mobileMenu.x >= 0 && mobileMenu.x + mobileMenu.width <= 320, 'open mobile menu must remain fully inside a 320px viewport');
  await page.close();
});

test('T1 detail page presents the approved sales psychology customer job and four-stage AI Coach curriculum', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${baseURL}/services/t1-sales-skills`);
  const catalog = CATALOG['inhouse-a'];
  assert.equal(response?.status(), 200, 'T1 route must render');
  assert.equal(await page.locator('h1').count(), 1, 'T1 must contain exactly one H1');
  assert.equal(await page.locator('h1').innerText(), catalog.name, 'T1 H1 must resolve from Catalog inhouse-a');
  assert.equal(await page.getByText(catalog.duration, { exact: true }).count(), 1, 'T1 duration must resolve from Catalog');
  assert.equal(await page.getByText(fmtPrice('inhouse-a'), { exact: true }).count(), 1, 'T1 price must resolve from Catalog');
  assert.equal(
    await page.getByText('เข้าใจเหตุผลซื้อ ถามและต่อรองได้ดีขึ้น ซ้อมดีลกับ AI Agent และ Follow-up โดยไม่รีบลดราคา', { exact: true }).count(),
    1,
    'T1 Hero must state the approved customer job exactly',
  );
  assert.deepEqual(
    await page.locator('[data-scope-item] > p:first-child').allTextContents(),
    [
      'ช่วงที่ 1 · อ่านเหตุผลซื้อ 3 ชั้นให้ลึกกว่าสิ่งที่ลูกค้าพูด',
      'ช่วงที่ 2 · ถาม ฟัง และสร้างความไว้วางใจ',
      'ช่วงที่ 3 · ต่อรองโดยไม่รีบลดราคา',
      'ช่วงที่ 4 · ฝึก AI Sales Coach จากเคสจริงของทีม',
    ],
    'T1 must render exactly the four approved curriculum stages in order',
  );
  assert.deepEqual(
    await page.locator('[data-scope-item] > p:last-child').allTextContents(),
    [
      'Output: Customer Decision Map ของลูกค้าหลัก',
      'Output: Question & Trust Playbook ของทีม',
      'Output: Negotiation & Objection Playbook',
      'Output: Company Context + AI Sales Coach Agent + Role-play Scorecard + Follow-up Playbook + Monday Plan',
    ],
    'each T1 curriculum stage must publish its approved customer-facing output',
  );
  const heroText = await page.locator('h1').locator('xpath=ancestor::section').innerText();
  assert.doesNotMatch(heroText, /\b(?:Content|Ads)\b/i, 'T1 Hero must not promise Content or Ads');
  assert.match(heroText, /ส่งประเภทธุรกิจ จำนวนเซลล์ และสถานการณ์ที่ทีมติดบ่อย/, 'T1 Hero must keep its approved CTA microcopy');
  const ebookCta = page.locator('[data-cta-location="hero"][data-cta-intent="lead_magnet"]');
  assert.equal(await ebookCta.count(), 1, 'T1 Hero must expose one lead-magnet CTA');
  assert.equal(await ebookCta.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'T1 E-Book CTA must use SITE.social.line');
  assert.equal(await ebookCta.getAttribute('data-cta-keyword'), 'SALES PSYCHOLOGY', 'T1 E-Book CTA must carry the SALES PSYCHOLOGY keyword');
  assert.match(await ebookCta.innerText(), /E-Book.*หยุดหาเซลล์ผิดคน/, 'T1 lead magnet must name the real E-Book');
  const t2Link = page.locator('a[href="/services/online-to-sales"]');
  assert.equal(await t2Link.count(), 1, 'T1 must offer one contextual canonical link to T2');
  assert.match(await t2Link.innerText(), /T2|ออนไลน์|Content/, 'T1 related link must explain the distinct T2 journey');
  assert.equal(await page.getByText('ถ้ามีดีลที่ทีมอยากซ้อม บอกผมก่อนออกแบบคลาสได้ครับ', { exact: true }).count(), 1, 'T1 scope CTA must keep its approved workshop-case prompt');
  assert.equal(await page.getByText('เฉลี่ย ฿1,745 ต่อคน เมื่อเข้าอบรม 20 คน', { exact: true }).count(), 1, 'T1 per-head price must derive from the Catalog investment');
  assert.equal(await page.getByText('สแกน QR แล้วพิมพ์คำว่า “SALES PSYCHOLOGY” พร้อมจำนวนทีม', { exact: true }).count(), 1, 'T1 final CTA must keep the approved LINE keyword instruction');
  const psychologyFaq = page.getByRole('button', { name: 'จิตวิทยาการขายในคอร์สหมายถึงการอ่านใจหรือควบคุมลูกค้าหรือเปล่า?' });
  assert.equal(await psychologyFaq.count(), 1, 'T1 must publish an ethical psychology FAQ');
  await psychologyFaq.click();
  assert.match(await page.locator('#t1-faq-2').innerText(), /เคารพสิทธิ์ตัดสินใจของลูกค้า/, 'ethical psychology FAQ must reject manipulation');
  const boundaryText = await page.locator('[data-detail-block="boundary"]').innerText();
  assert.match(boundaryText, /Human Review/, 'AI Sales Coach must require human review');
  assert.match(boundaryText, /การคุยกับลูกค้า.*อยู่กับเซลล์/, 'AI Sales Coach must not imply autonomous customer contact');
  assert.match(boundaryText, /CRM หรือ Dashboard production แยกเป็นบริการ Implementation/, 'AI Sales Coach must not be represented as a production CRM or dashboard');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'T1 must publish the approved eight FAQs');
  assert.equal(await page.locator('form').count(), 0, 'T1 detail page must not include a form');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'T1 must retain exactly one global Floating LINE CTA');
  const html = await page.content();
  assert.doesNotMatch(html, /Agentic AI Transformation/, 'T1 must keep its public category Sales-first rather than using retired generic AI Transformation positioning');
  const courseSchema = schemas(html).find((item) => item['@type'] === 'Course');
  assert.equal(courseSchema?.name, catalog.name, 'T1 Course schema name must resolve from Catalog inhouse-a');
  assert.equal(courseSchema?.courseCode, 'T1', 'T1 Course schema must identify the T1 product code');
  assert.equal(courseSchema?.url, 'https://punnattapatch.com/services/t1-sales-skills', 'T1 Course schema must use the canonical route');
  assert.equal(courseSchema?.timeRequired, catalog.duration, 'T1 Course schema duration must resolve from Catalog inhouse-a');
  assert.ok(schemas(html).some((item) => item['@type'] === 'FAQPage'), 'T1 must expose FAQPage schema');
  assert.ok(schemas(html).some((item) => item['@type'] === 'BreadcrumbList'), 'T1 must expose BreadcrumbList schema');
  assert.doesNotMatch(html, /Journey\s*\/\s*FFAB|Pre-call\s*\/\s*Questions|Context\s*\/\s*Follow-up|Objection\s*\/\s*Practice/, 'T1 must not retain superseded Journey/FFAB curriculum labels');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `T1 must not overflow at ${viewport.width}px`);
  }
  await page.close();
});

test('T1 remediation keeps evidence, location-specific LINE actions, and mobile CTA clearance faithful', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/services/t1-sales-skills`);

  const hfcProof = page.locator('[data-proof-id="hfc-journey"]');
  assert.equal(await hfcProof.count(), 1, 'T1 must retain one approved HFC training-to-consult proof');
  assert.equal(await hfcProof.locator('figcaption').innerText(), 'เริ่มจากงาน Training แล้วต่อยอดเป็น Consult 3 วัน เพื่อจัด Company Knowledge, Dashboard และ Roadmap ของงานขายให้เข้ากับบริบทธุรกิจจริง', 'HFC journey proof caption must remain verbatim');
  assert.doesNotMatch(await page.locator('[data-detail-block="proof"]').innerText(), /กลุ่มเล็ก/, 'T1 proof must not misrepresent a large workshop as a small group');

  const expectedActions = [
    ['after_scope', 'ทัก LINE คุยเรื่องจัด In-house', 'inhouse_enquiry'],
    ['after_scope', 'รับ E-Book ก่อนตัดสินใจ', 'lead_magnet'],
    ['after_investment', 'ทัก LINE ขอใบเสนอราคา', 'quote'],
    ['after_investment', 'ส่งสถานการณ์ที่ทีมติดมาให้ช่วยดู', 'course_selection'],
    ['final', 'ทัก LINE วางคอร์สให้ทีม', 'course_planning'],
    ['final', 'รับ E-Book หยุดหาเซลล์ผิดคน', 'lead_magnet'],
  ] as const;
  for (const [location, label, intent] of expectedActions) {
    const action = page.locator(`[data-product-code="T1"][data-cta-location="${location}"][data-cta-label="${label}"]`);
    assert.equal(await action.count(), 1, `${location} must render the approved ${label} action`);
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', `${location} action must use SITE.social.line`);
    assert.equal(await action.getAttribute('data-cta-intent'), intent, `${location} action must retain its analytics intent`);
    assert.equal(await action.getAttribute('data-cta-keyword'), 'SALES PSYCHOLOGY', `${location} action must retain the T1 keyword`);
  }
  const allT1LineActions = page.locator('[data-product-code="T1"][data-contact-cta]');
  assert.equal(await allT1LineActions.count(), 8, 'T1 must expose the complete four-pair LINE CTA journey');
  for (const action of await allT1LineActions.all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every T1 CTA must open the real SITE.social.line destination');
    assert.equal(await action.getAttribute('data-cta-keyword'), 'SALES PSYCHOLOGY', 'every T1 CTA must carry the approved lead-magnet keyword');
  }

  const finalQr = page.locator('[data-final-line-qr]');
  assert.equal(await finalQr.count(), 1, 'desktop final CTA must contain a real LINE QR');
  assert.equal(await finalQr.isVisible(), true, 'desktop final QR must be visible when scan copy is visible');

  const mainText = await page.locator('#main').innerText();
  assert.doesNotMatch(mainText, /(?:ยอดขายร้อยล้าน|40\s*(?:→|to)\s*100M)/i, 'T1 must not publish unsupported hundred-million authority claims');
  assert.doesNotMatch(mainText, /Catalog/, 'T1 must not expose Catalog authoring placeholders to customers');
  assert.doesNotMatch(mainText, /(?:ตามที่ระบุใน Catalog|ตามเงื่อนไขใน Catalog)/, 'T1 must not expose internal Catalog placeholders to customers');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await finalQr.isVisible(), false, 'mobile must not show a scan instruction without an inline QR');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “SALES PSYCHOLOGY” พร้อมจำนวนทีม', { exact: true }).isVisible(), true, 'mobile final CTA must give a tappable LINE instruction');
  for (const action of await page.locator('[data-product-code="T1"][data-contact-cta]').all()) {
    await action.scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);
    const actionBox = await action.boundingBox();
    const floatingBox = await page.locator('[data-floating-line]').boundingBox();
    if (actionBox && floatingBox) {
      const intersects = actionBox.x < floatingBox.x + floatingBox.width
        && actionBox.x + actionBox.width > floatingBox.x
        && actionBox.y < floatingBox.y + floatingBox.height
        && actionBox.y + actionBox.height > floatingBox.y;
      assert.equal(intersects, false, `floating LINE control must not obstruct ${await action.getAttribute('data-cta-location')} at 390px`);
    }
  }
  await page.close();
});

test('C1 daily consulting is one service with four selectable primary-outcome tracks', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const catalog = CATALOG['daily-sales-consulting'];
  const response = await page.goto(`${baseURL}/services/daily-consulting`);

  assert.equal(response?.status(), 200, 'C1 canonical route must render');
  assert.equal(await page.locator('h1').count(), 1, 'C1 must contain exactly one H1');
  assert.equal(await page.locator('h1').innerText(), catalog.name, 'C1 H1 must resolve from the Catalog');
  assert.equal(await page.getByText(catalog.duration, { exact: true }).count(), 1, 'C1 duration must resolve from the Catalog');
  assert.equal(await page.getByText(fmtPrice('daily-sales-consulting'), { exact: true }).count(), 1, 'C1 price must resolve from the Catalog');

  const chooser = page.locator('[data-symptom-chooser]');
  const chooserActions = chooser.locator('a[data-track-chooser]');
  assert.equal(await chooserActions.count(), 4, 'C1 must offer one symptom-first chooser action per track');
  const trackCards = page.locator('[data-scope-item][data-primary-outcome-track]');
  assert.equal(await trackCards.count(), 4, 'C1 must render exactly four primary-outcome track cards');
  const targets = await chooserActions.evaluateAll((actions) => actions.map((action) => action.getAttribute('href')));
  assert.deepEqual(targets, ['#c1-track-funnel', '#c1-track-team', '#c1-track-dashboard', '#c1-track-ai'], 'C1 chooser targets must map to stable track ids');
  await chooserActions.nth(3).click();
  assert.equal(new URL(page.url()).hash, '#c1-track-ai', 'choosing a symptom must update the URL hash');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'c1-track-ai', 'choosing a symptom must move focus to the chosen track');
  await page.waitForFunction(() => {
    const target = document.getElementById('c1-track-ai');
    if (!target) return false;
    const box = target.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 0;
  });
  const selectedTrackBox = await page.locator('#c1-track-ai').boundingBox();
  assert.ok(selectedTrackBox && selectedTrackBox.y < 900 && selectedTrackBox.y + selectedTrackBox.height > 0, 'chosen track must scroll into the viewport');

  assert.equal(await page.locator('[data-detail-block="investment"]').count(), 1, 'C1 must have one investment block');
  assert.equal(await trackCards.locator('[data-contact-cta], [data-track-price], [data-track-checkout]').count(), 0, 'individual C1 tracks must not sell separately');
  const scopeText = await page.locator('[data-detail-block="scope"]').innerText();
  assert.match(scopeText, /เลือก Track นี้เมื่อ/, 'service tracks must use symptom language, not course labels');
  assert.match(scopeText, /ทำร่วมกัน/, 'service tracks must use consult action language');
  assert.match(scopeText, /Output ของวัน/, 'service tracks must use day-output language');
  const boundaryText = await page.locator('[data-detail-block="boundary"]').innerText();
  assert.match(boundaryText, /หนึ่งวัน.*Primary Outcome/, 'C1 must state one consulting day has one primary outcome');
  assert.match(boundaryText, /Proposal เดียว/, 'C1 must state connected problems become one proposal');
  assert.match(boundaryText, /ไม่.*Audit|Audit.*ไม่/, 'C1 must make clear a paid Audit is not required');
  const aiTrack = page.locator('#c1-track-ai');
  assert.match(await aiTrack.innerText(), /Prototype/, 'AI track must stop at a prototype');
  assert.match(await aiTrack.innerText(), /Human review/, 'AI track must retain a human-review boundary');
  assert.equal(await page.locator('a[href="/services/dashboard-build"]').count(), 1, 'C1 must distinguish a planned production build service');

  assert.equal(await page.locator('[data-proof-id="c1-scenery-room"]').count(), 1, 'C1 must show inspectable Scenery work proof');
  assert.equal(await page.locator('[data-proof-id="c1-hfc-journey"]').count(), 1, 'C1 must show the approved HFC training-to-consult proof');
  const systemReceipt = page.locator('[data-proof-id="c1-system-receipt"]');
  assert.equal(await systemReceipt.count(), 1, 'C1 must show one approved redacted system receipt');
  assert.equal(await systemReceipt.locator('figcaption').innerText(), 'ผมสร้างระบบใช้เองและทำงานกับของจริง จึงรู้ว่าข้อเสนอไหนทำได้ในวัน Consult และข้อเสนอไหนต้องมีขั้น Build, UAT และ Adoption แยก', 'C1 system receipt caption must state the bounded Build boundary');
  assert.equal(await page.getByText('“ปันคุยง่าย เข้าใจสิ่งที่ CEO ต้องการ และหาทางออกให้ได้”', { exact: true }).count(), 1, 'C1 must use the approved bounded client quote');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'C1 must publish the approved eight FAQs');
  assert.equal(await page.locator('form').count(), 0, 'C1 detail page must not include a form');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'C1 must retain exactly one global Floating LINE CTA');
  const ctas = page.locator('[data-product-code="C1"][data-contact-cta]');
  assert.equal(await ctas.count(), 8, 'C1 must provide exactly four paired LINE CTA locations');
  assert.deepEqual(await ctas.evaluateAll((actions) => actions.map((action) => [action.getAttribute('data-cta-location'), action.getAttribute('data-cta-label')])), [
    ['hero', 'ทัก LINE จองวัน Consult'],
    ['hero', 'เล่าอาการให้ผมช่วยเลือก Track'],
    ['after_scope', 'ทัก LINE ให้ผมช่วยเลือก'],
    ['after_scope', 'ส่งรูป Report หรือเล่าอาการสั้นๆ'],
    ['after_investment', 'ทัก LINE จองวัน Consult'],
    ['after_investment', 'ให้ผมช่วยเลือก Track ฟรี'],
    ['final', 'ทัก LINE คุยกับผม'],
    ['final', 'ส่งอาการมาให้ช่วยเลือก Track'],
  ], 'C1 CTA journey must preserve every approved paired action');
  for (const action of await ctas.all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every C1 CTA must open SITE.social.line');
    assert.equal(await action.getAttribute('data-cta-keyword'), 'CONSULT', 'every C1 CTA must carry the CONSULT keyword');
  }
  const html = await page.content();
  assert.doesNotMatch(html, /ยอดขายร้อยล้าน|ตามระยะเวลาจาก Catalog|Agentic AI Transformation|ไม่เติมตัวเลขผลลัพธ์|ไม่อ้างผลลัพธ์ทางการเงิน|Asset notes|Rendering note/, 'C1 must not expose stale, generic, or internal authoring-guard copy');
  const serviceSchema = schemas(html).find((item) => item['@type'] === 'Service');
  assert.equal(serviceSchema?.name, catalog.name, 'C1 Service schema name must resolve from Catalog');
  assert.equal(serviceSchema?.url, 'https://punnattapatch.com/services/daily-consulting', 'C1 Service schema must use canonical route');
  assert.equal(serviceSchema?.serviceType, 'Sales Consulting', 'C1 Service schema must not claim implementation work');
  const faqSchema = schemas(html).find((item) => item['@type'] === 'FAQPage');
  assert.deepEqual(
    faqSchema?.mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => [item.name, item.acceptedAnswer.text]),
    await page.locator('[data-product-faq-button]').evaluateAll((buttons) => buttons.map((button) => [button.querySelector('span')?.textContent?.trim(), document.getElementById(button.getAttribute('aria-controls') || '')?.textContent?.trim()])),
    'C1 FAQPage schema must exactly match the eight visible FAQ questions and answers',
  );
  const breadcrumbSchema = schemas(html).find((item) => item['@type'] === 'BreadcrumbList');
  assert.deepEqual(
    breadcrumbSchema?.itemListElement.map((item: { name: string; item: string }) => [item.name, item.item]),
    [['บริการ', 'https://punnattapatch.com/services'], [catalog.name, 'https://punnattapatch.com/services/daily-consulting']],
    'C1 BreadcrumbList must contain the exact service and canonical-page items',
  );
  const finalQr = page.locator('[data-final-line-qr]');
  await finalQr.scrollIntoViewIfNeeded();
  assert.equal(await finalQr.isVisible(), true, 'desktop C1 final CTA must show the real LINE QR');
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('[data-final-line-qr] img');
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  assert.ok(await finalQr.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth > 0), 'desktop C1 final QR must finish loading');
  for (const image of await page.locator('[data-detail-block="proof"] img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element: HTMLImageElement) => {
      if (element.complete) return element.naturalWidth;
      await new Promise<void>((resolve) => element.addEventListener('load', () => resolve(), { once: true }));
      return element.naturalWidth;
    });
    assert.ok(await image.getAttribute('alt'), 'every C1 proof image must have descriptive alt text');
    assert.ok(await image.getAttribute('width'), 'every C1 proof image must declare width');
    assert.ok(await image.getAttribute('height'), 'every C1 proof image must declare height');
    assert.ok(await image.evaluate((element: HTMLImageElement) => element.naturalWidth > 0), 'every C1 proof image must load before acceptance');
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `C1 must not overflow at ${viewport.width}px`);
    for (const action of await ctas.all()) {
      await action.scrollIntoViewIfNeeded();
      const actionBox = await action.boundingBox();
      const floatingBox = await page.locator('[data-floating-line]').boundingBox();
      if (actionBox && floatingBox) {
        const intersects = actionBox.x < floatingBox.x + floatingBox.width
          && actionBox.x + actionBox.width > floatingBox.x
          && actionBox.y < floatingBox.y + floatingBox.height
          && actionBox.y + actionBox.height > floatingBox.y;
        assert.equal(intersects, false, `floating LINE control must not obstruct C1 ${await action.getAttribute('data-cta-location')} CTA at ${viewport.width}px`);
      }
    }
  }
  assert.equal(await finalQr.isVisible(), false, 'mobile C1 must hide the desktop-only scan QR');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “CONSULT” พร้อมอาการที่ทีมกำลังติด', { exact: true }).isVisible(), true, 'mobile C1 must show the tap instruction');
  await page.close();
});
