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

const ROUTE = '/qc/t2-leak-25';

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

const ZONES = ['message', 'inbox', 'qualification', 'handoff', 'follow-up'];

test('QC page ships 25 items across the five leak zones with the approved framing', async ({ page }) => {
  const response = await page.goto(`${baseURL}${ROUTE}`);
  assert.equal(response?.status(), 200);

  assert.equal(await page.locator('[data-qc-checkbox]').count(), 25, 'must expose exactly 25 checkboxes');
  assert.deepEqual(
    await page.locator('[data-qc-zone-block]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-qc-zone-block'))),
    ZONES,
    'zones must follow the T2 leak order',
  );
  for (const zone of ZONES) {
    assert.equal(await page.locator(`[data-qc-item-zone="${zone}"]`).count(), 5, `${zone} must hold five items`);
  }

  await page.locator('h1', { hasText: 'เช็ก 25 จุดรั่ว ก่อนเพิ่มงบแอด' }).waitFor();
  assert.ok((await page.locator('[data-qc-disclaimer]').innerText()).includes('ไม่ใช่ระบบให้คะแนน'), 'disclaimer must stay under the hero');
  assert.equal(await page.getByText('ตรวจตามแนวทาง ปัน ณัฐพัชร์').count(), 1);

  // Every item carries description + owner + example, not just a title.
  assert.equal(await page.locator('[data-qc-example]').count(), 25);
  const emptyExamples = await page.locator('[data-qc-example]').evaluateAll((nodes) => nodes.filter((node) => (node.textContent ?? '').trim().length < 20).length);
  assert.equal(emptyExamples, 0, 'every item needs a written example');

  const body = await page.locator('body').innerText();
  for (const banned of ['สูตรลับ', 'ใช้ได้กับทุกธุรกิจ', 'สร้างยอดทันที', 'Lifetime Support']) {
    assert.ok(!body.includes(banned), `page must not contain "${banned}"`);
  }
  assert.ok(!/฿\s*[\d,]/.test(body), 'page must not print baht amounts');

  // Metadata: bonus page stays out of the index.
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://punnattapatch.com${ROUTE}`);
  assert.ok((await page.locator('meta[property="og:title"]').getAttribute('content'))?.includes('เช็ก 25 จุดรั่ว'));

  // Accessible names on the interactive controls.
  const unlabelled = await page.locator('[data-qc-checkbox]').evaluateAll((nodes) => nodes.filter((node) => !node.getAttribute('aria-label')).length);
  assert.equal(unlabelled, 0, 'every checkbox needs an aria-label');
});

test('ticking survives a reload and the counters follow', async ({ page }) => {
  await page.goto(`${baseURL}${ROUTE}`);

  await page.locator('[data-qc-checkbox="msg-01"]').check();
  await page.locator('[data-qc-checkbox="hand-03"]').check();
  assert.equal(await page.locator('[data-qc-count-checked]').innerText(), '2');
  assert.equal(await page.locator('[data-qc-count-remaining]').innerText(), '23');

  await page.reload();
  assert.equal(await page.locator('[data-qc-checkbox="msg-01"]').isChecked(), true, 'ticked state must persist across reload');
  assert.equal(await page.locator('[data-qc-checkbox="hand-03"]').isChecked(), true);
  assert.equal(await page.locator('[data-qc-checkbox="msg-02"]').isChecked(), false);
  assert.equal(await page.locator('[data-qc-count-checked]').innerText(), '2');

  // Status filter narrows the list to what is still open.
  await page.locator('[data-qc-status="checked"]').click();
  assert.equal(await page.locator('[data-qc-item]:visible').count(), 2);
  await page.locator('[data-qc-status="unchecked"]').click();
  assert.equal(await page.locator('[data-qc-item]:visible').count(), 23);
  await page.locator('[data-qc-status="all"]').click();

  // Zone filter + search.
  await page.locator('[data-qc-zone="follow-up"]').click();
  assert.equal(await page.locator('[data-qc-item]:visible').count(), 5);
  await page.locator('[data-qc-zone="all"]').click();
  await page.locator('[data-qc-search]').fill('ไม่มีคำนี้ในหน้า');
  assert.equal(await page.locator('[data-qc-item]:visible').count(), 0);
  assert.equal(await page.locator('[data-qc-empty]').isVisible(), true);

  // Clearing local data resets every tick.
  await page.locator('[data-qc-search]').fill('');
  await page.locator('[data-qc-clear]').click();
  await page.locator('[data-qc-clear-confirm]').click();
  assert.equal(await page.locator('[data-qc-count-checked]').innerText(), '0');
  assert.equal(await page.locator('[data-qc-checkbox="msg-01"]').isChecked(), false);
});

test('switching industry rewrites every example', async ({ page }) => {
  await page.goto(`${baseURL}${ROUTE}`);
  const example = page.locator('[data-qc-example="msg-01"]');

  const dealer = await example.innerText();
  assert.ok(dealer.length > 0);

  await page.locator('[data-qc-industry="contractor"]').click();
  const contractor = await example.innerText();
  assert.notEqual(contractor, dealer, 'the example must change with the industry');
  assert.equal(await page.locator('[data-qc-industry="contractor"]').getAttribute('aria-pressed'), 'true');
  assert.ok((await page.locator('[data-qc-example-label]').first().innerText()).includes('รับเหมา'));

  await page.locator('[data-qc-industry="subscription"]').click();
  const subscription = await example.innerText();
  assert.notEqual(subscription, contractor);
  assert.notEqual(subscription, dealer);

  // The choice is part of the saved state.
  await page.reload();
  assert.equal(await example.innerText(), subscription, 'industry choice must persist');
});

test('the send button builds a summary that names the open items and the LINE keyword', async ({ page, context }) => {
  await context.route('**://lin.ee/**', (route) => route.abort());
  await page.goto(`${baseURL}${ROUTE}`);

  await page.locator('[data-qc-checkbox="msg-01"]').check();
  await page.locator('[data-qc-checkbox="msg-02"]').check();
  await page.locator('[data-qc-checkbox="inbox-01"]').check();

  const popup = context.waitForEvent('page').catch(() => null);
  await page.locator('[data-qc-send]').click();

  const summary = await page.locator('[data-qc-summary]').innerText();
  assert.ok(summary.includes('3/25'), `summary must report progress as x/25, got: ${summary.slice(0, 120)}`);
  assert.ok(summary.includes('เช็ก 25 จุดรั่ว ก่อนเพิ่มงบแอด'));
  assert.ok(summary.includes('ONLINE SALES'), 'summary must tell the reader which keyword to type');
  assert.ok(summary.includes('ยังไม่ติ๊ก 4.'), 'summary must list the items still open');
  assert.ok(summary.includes('Message · ข้อความและโฆษณา — 2/5'), 'summary must break progress down by zone');

  assert.equal(
    await page.locator('[data-qc-line-link]').getAttribute('href'),
    'https://lin.ee/ioSnSUG',
    'must reuse the LINE OA link from the product pages',
  );

  const opened = await popup;
  await opened?.close().catch(() => {});
});

test('the page fits small screens without horizontal overflow', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${baseURL}${ROUTE}`);
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 800 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      viewport.width,
      `must not overflow at ${viewport.width}px`,
    );
  }
  await page.close();
});
