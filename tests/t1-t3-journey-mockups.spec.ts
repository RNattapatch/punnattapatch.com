import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
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

const JOURNEY_ORDER = ['hero', 'offer', 'logos', 'proof', 'why-now', 'spotlight', 'curriculum', 'whats-new', 'take-home', 'bonus', 'why-me', 'fit', 'instructor', 'investment', 'faq', 'final'];
const products = [
  {
    code: 'T1',
    route: '/services/t1-sales-skills',
    customerJob: 'เข้าใจเหตุผลซื้อ ถามและต่อรองได้ดีขึ้น ซ้อมดีลกับ AI Agent และ Follow-up โดยไม่รีบลดราคา',
    steps: ['decision', 'ask', 'defend', 'rehearse', 'follow-up'],
    keyword: 'SALES PSYCHOLOGY',
  },
  {
    code: 'T2',
    route: '/services/online-to-sales',
    customerJob: 'เปลี่ยนคนเห็น Content/Ads ให้เป็นแชต นัดหมาย และการส่งต่อถึงทีมขายที่ชัดเจน',
    steps: ['message', 'respond', 'qualify', 'handoff', 'follow-up', 'review'],
    keyword: 'ONLINE SALES',
  },
  {
    code: 'T3',
    route: '/services/t3-sales-back-office',
    customerJob: 'ทีมรายงานภาษาเดียวกัน ผู้จัดการเห็นดีลค้าง งานที่ต้องตาม และจุดที่ต้องเข้าไปช่วย',
    steps: ['stage', 'report', 'warn', 'review', 'prototype'],
    keyword: 'SALES REPORT',
  },
] as const;

for (const product of products) {
  test(`${product.code} uses the complete T4 storytelling journey with its own approved offer`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const response = await page.goto(`${baseURL}${product.route}`);
    assert.equal(response?.status(), 200);
    assert.deepEqual(
      await page.locator('[data-journey-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-journey-section'))),
      JOURNEY_ORDER,
      `${product.code} must follow the exact T4 storytelling order`,
    );
    assert.equal(await page.getByText(product.customerJob, { exact: true }).count(), 1, `${product.code} must keep its approved customer job`);
    assert.equal(await page.locator('[data-offer-core]').count(), 4, `${product.code} must expose Core 4`);
    assert.equal(await page.locator('[data-offer-bonus]').count(), 5, `${product.code} must expose Bonus 5`);
    assert.deepEqual(
      await page.locator('[data-curriculum-step]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-step'))),
      product.steps,
      `${product.code} must use its product-specific operating journey`,
    );
    assert.equal(await page.locator('[data-spotlight-module]').count(), 2, `${product.code} must expose two product-specific spotlight modules`);
    assert.equal(await page.locator('[data-whats-new-column]').count(), 2, `${product.code} must explain what changed and what remains core`);
    assert.equal(await page.locator('[data-bonus-card]').count(), 5, `${product.code} must explain all five bonuses without invented monetary value`);
    assert.equal(await page.locator('[data-bonus-value-card]').count(), 0, `${product.code} must not show unapproved monetary bonus values`);
    assert.equal(await page.locator('[data-why-me-item]').count(), 6, `${product.code} must answer why learn this with Pun`);
    assert.equal(await page.locator('[data-instructor-angle]').count(), 4, `${product.code} must show four relevant instructor perspectives`);
    assert.equal(await page.locator('[data-cta-location="final"] [data-cta-keyword]').first().getAttribute('data-cta-keyword'), product.keyword, `${product.code} must preserve its live LINE keyword`);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `${product.code} must not overflow at ${viewport.width}px`);
    }
    await page.close();
  });
}

test('T4 keeps its exact approved journey while non-training offers stay on the legacy renderer', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseURL}/services/advance-ai-automation`);
  assert.deepEqual(await page.locator('[data-journey-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-journey-section'))), JOURNEY_ORDER);
  await page.goto(`${baseURL}/services/sales-consulting`);
  assert.equal(await page.locator('[data-journey-section]').count(), 0, 'C1 must retain the legacy consulting renderer');
  await page.goto(`${baseURL}/services/dashboard-build`);
  assert.equal(await page.locator('[data-journey-section]').count(), 0, 'I1 must retain the legacy implementation renderer');
  await page.close();
});
