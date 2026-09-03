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

const ROUTE = '/services/ai-sales-agent-bootcamp';
const JOURNEY_ORDER = ['hero', 'offer', 'logos', 'proof', 'why-now', 'spotlight', 'curriculum', 'whats-new', 'take-home', 'bonus', 'why-me', 'fit', 'instructor', 'investment', 'faq', 'final'];
// SSOT §8 + message map §3 — none of these may ever reach the page.
const BANNED = ['Template ระดับเทพ', 'สูตรลับ', 'ใช้ได้กับทุกธุรกิจ', 'สร้างยอดทันที', 'ลดคนได้แน่นอน', 'Lifetime Support', 'ใบกำกับภาษี', 'เจ้าเดียว', 'คนแรก'];

test('P1 renders the T1–T4 journey with its own Public cohort layer', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${baseURL}${ROUTE}`);
  assert.equal(response?.status(), 200, 'P1 must build and serve');

  assert.deepEqual(
    await page.locator('[data-journey-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-journey-section'))),
    JOURNEY_ORDER,
    'P1 must follow the exact T4 storytelling order',
  );

  assert.equal(await page.locator('[data-offer-core]').count(), 4, 'P1 must expose Core 4');
  assert.equal(await page.locator('[data-offer-bonus]').count(), 7, 'P1 must expose all 7 bonus rows in the offer');
  assert.equal(await page.locator('[data-bonus-value-card]').count(), 7, 'P1 must show 7 bonus value cards');
  assert.equal(await page.locator('[data-bonus-total]').innerText(), '฿8,800', 'P1 bonus total must equal the approved sum');
  assert.equal(await page.locator('[data-spotlight-module]').count(), 2, 'P1 must expose its two spotlight modules');
  assert.equal(await page.locator('[data-whats-new-column]').count(), 2, 'P1 must explain what changed and what stays core');
  assert.equal(await page.locator('[data-why-me-item]').count(), 6, 'P1 must answer why learn this with Pun');
  assert.equal(await page.locator('[data-instructor-angle]').count(), 4, 'P1 must show four instructor perspectives');
  assert.equal(await page.locator('[data-curriculum-step]').count(), 5, 'P1 must show pre-work, Day 1, Day 2 and Day 14');

  await page.close();
});

test('P1 states the Blind Ticket terms at all three decision points', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}${ROUTE}`);

  const notices = page.locator('[data-public-notice]');
  assert.ok(await notices.count() >= 3, 'the cohort notice must appear at hero, offer and investment');

  const noticeText = (await notices.allInnerTexts()).join('\n');
  for (const fragment of ['10 ที่นั่ง', 'ไม่มี VAT', 'ตุลาคม']) {
    assert.ok(noticeText.includes(fragment), `cohort notice must state "${fragment}"`);
  }
  // Seats remaining is derived from data (seatsTotal − seatsTaken), never hardcoded.
  assert.ok(noticeText.includes('เหลือ 10 ที่นั่งราคานี้'), 'seats remaining must be computed from data');
  assert.ok(noticeText.includes('฿24,900'), 'the standard price after the blind seats sell out must be shown');

  const bodyText = await page.locator('body').innerText();
  assert.ok(bodyText.includes('ครบ 6 คน'), 'the run-if-6 rule must be visible');
  assert.ok(bodyText.includes('สิทธิ์ Founding รุ่น 1'), 'the founding perk block must be visible');

  await page.close();
});

test('P1 keeps the approved wording, keyword and noindex flag', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}${ROUTE}`);

  const bodyText = await page.locator('body').innerText();
  for (const banned of BANNED) {
    assert.ok(!bodyText.includes(banned), `P1 must never print the banned phrase "${banned}"`);
  }
  // "ไม่ใช่ X แต่คือ Y" is capped at one use across the whole page.
  assert.ok((bodyText.match(/ไม่ใช่[^]{0,40}?แต่คือ/g) ?? []).length <= 1, 'negative parallelism is capped at one use per page');

  assert.equal(
    await page.locator('[data-cta-location="final"] [data-cta-keyword]').first().getAttribute('data-cta-keyword'),
    'BOOTCAMP',
    'P1 must use the BOOTCAMP LINE keyword at the final CTA',
  );
  assert.match(
    (await page.locator('meta[name="robots"]').getAttribute('content')) ?? '',
    /noindex/,
    'P1 stays out of search until the pricing key goes live',
  );

  await page.close();
});

test('P1 does not overflow on the viewports Pun reviews it on', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}${ROUTE}`);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `P1 must not overflow at ${viewport.width}px`);
  }
  await page.close();
});
