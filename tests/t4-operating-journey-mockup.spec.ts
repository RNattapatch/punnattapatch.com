import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

let server;
let baseURL;

async function resolveDistFile(pathname) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = cleanPath === '' ? ['index.html'] : [cleanPath, `${cleanPath}.html`, join(cleanPath, 'index.html')];
  for (const candidate of candidates) {
    const resolved = normalize(join(dist, candidate));
    if (!resolved.startsWith(`${dist}/`)) continue;
    try {
      if ((await stat(resolved)).isFile()) return resolved;
    } catch {}
  }
  return null;
}

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const file = await resolveDistFile(pathname);
    if (!file) return response.writeHead(404).end('Not found');
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

test('T4 mockup tells the operating journey in the approved order', async ({ page }) => {
  await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
  assert.equal(await page.locator('[data-mockup="t4-operating-journey"]').count(), 1);
  assert.deepEqual(await page.locator('[data-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-section'))), [
    'hero', 'offer', 'proof', 'journey-map', 'diagnosis', 'curriculum', 'decision-pack', 'fit', 'investment', 'final-cta',
  ]);
  assert.equal(await page.locator('[data-core-artifact]').count(), 4);
  assert.equal(await page.locator('[data-bonus-card]').count(), 5);
  assert.deepEqual(await page.locator('[data-journey-stage]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-journey-stage'))), [
    'Pick', 'Map', 'Sandbox', 'Responsibility', 'Decide',
  ]);
});

test('T4 hero identifies the in-house course and one-day job at a glance', async ({ browser }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
    const hero = page.locator('[data-section="hero"]');
    const heading = hero.getByRole('heading', { level: 1 });
    const headingText = await heading.innerText();
    assert.match(headingText, /คอร์สอบรม/i);
    assert.match(headingText, /Advance AI\s*&\s*Business Automation/i);
    assert.match(headingText, /ทีมในองค์กร/i);

    const glanceText = await hero.locator('[data-hero-glance]').innerText();
    assert.match(glanceText, /In-house/i);
    assert.match(glanceText, /1 วัน/i);
    assert.match(glanceText, /1 Workflow/i);
    assert.match(glanceText, /Safe Sandbox/i);
    assert.match(glanceText, /หยุด|ปรับ|ทำระบบต่อ/i);

    const headingBox = await heading.boundingBox();
    const glanceBox = await hero.locator('[data-hero-glance]').boundingBox();
    assert.ok(headingBox && headingBox.y + headingBox.height <= viewport.height, `${viewport.width}px must show the course name in the first screen`);
    assert.ok(glanceBox && glanceBox.y + glanceBox.height <= viewport.height, `${viewport.width}px must show the course facts in the first screen`);
    await page.close();
  }
});

test('T4 proof restores real course activity and published AI workshop reviews', async ({ page }) => {
  await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
  const activityImages = page.locator('[data-proof-activity] img');
  const testimonials = page.locator('[data-testimonial-source="ai-workshop"] img');
  assert.ok(await activityImages.count() >= 6, 'proof must show at least six real course activity photographs');
  assert.ok(await testimonials.count() >= 5, 'proof must show at least five published AI workshop reviews');

  for (let index = 0; index < await activityImages.count(); index += 1) {
    assert.match(await activityImages.nth(index).getAttribute('src') ?? '', /^\/(lp\/inhouse|advance-ai-course)\//);
  }
  for (let index = 0; index < await testimonials.count(); index += 1) {
    assert.match(await testimonials.nth(index).getAttribute('src') ?? '', /^\/testimonial\/2026-/);
  }
});

test('T4 mockup keeps real-photo and honest-offer boundaries', async ({ page }) => {
  await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
  const images = page.locator('main img');
  assert.ok(await images.count() >= 4, 'mockup must use at least four real workshop photographs');
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    assert.match(await image.getAttribute('src') ?? '', /^\/(lp\/inhouse|advance-ai-course|testimonial\/2026-[^/]+)\//);
    assert.ok(Number(await image.getAttribute('width')) > 0);
    assert.ok(Number(await image.getAttribute('height')) > 0);
    assert.ok((await image.getAttribute('alt') ?? '').trim().length > 8);
    await image.scrollIntoViewIfNeeded();
    assert.ok(await image.evaluate((element) => element.complete && element.naturalWidth > 0));
  }
  assert.equal(await page.locator('[data-bonus-card] a').count(), 0, 'unfinished Bonus materials must not have download links');
  assert.equal(await page.locator('h1').count(), 1);
  assert.doesNotMatch(await page.locator('body').innerText(), /countdown|ตลอดชีพ|มูลค่า\s*฿|การันตี|รับประกันยอด/i);

  const catalog = JSON.parse(await readFile(join(dist, 'catalog.json'), 'utf8'));
  const expected = catalog.packages.find((item) => item.key === 't4-ai-workflow-pilot-day');
  assert.ok(expected, 'T4 Catalog package must exist');
  await page.waitForFunction(() => [...document.querySelectorAll('[data-catalog-price]')].every((node) => node.textContent?.includes('฿')));
  const renderedPrices = await page.locator('[data-catalog-price]').evaluateAll((nodes) => nodes.map((node) => ({
    source: node.getAttribute('data-price-source'),
    text: node.textContent?.replace(/\s+/g, ''),
  })));
  assert.equal(renderedPrices.length, 2);
  for (const price of renderedPrices) {
    assert.equal(price.source, 'catalog');
    assert.equal(price.text, expected.price_label.replace(/\s+/g, ''));
  }
});

test('T4 mockup stays readable without horizontal overflow', async ({ browser }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 740 },
    { width: 844, height: 390 },
  ]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    const overflow = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert.ok(overflow.scrollWidth <= overflow.clientWidth, `${viewport.width}x${viewport.height} must not overflow horizontally`);
    const controls = page.locator('a, button, summary');
    for (let index = 0; index < await controls.count(); index += 1) {
      const box = await controls.nth(index).boundingBox();
      if (box) assert.ok(box.height >= 44, `control ${index} must be at least 44px high`);
    }
    await page.close();
  }
});
