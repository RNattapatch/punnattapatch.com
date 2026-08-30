import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

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
