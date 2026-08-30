import { expect, test, type Browser, type Page } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const routes = [
  ['สอบถามหรือจองคิว', 'https://lin.ee/ioSnSUG'],
  ['ดูบริการที่ปรึกษาหรือจัดอบรม ทั้งหมด', 'https://punnattapatch.com/services'],
  ['ชวนไปร่วมงาน', 'https://punnattapatch.com/sponsor'],
] as const;
const supportCopy = [
  'ทัก LINE เล่าโจทย์คร่าวๆ ได้เลย',
  'เลือกจากโจทย์จริงของทีมและองค์กร',
  'Sponsor · Partnership · Speaker',
] as const;
const socialLinks = [
  ['TikTok', 'https://www.tiktok.com/@pun_nattapatch'],
  ['Instagram', 'https://www.instagram.com/pun_nattapatch'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61584893736763'],
] as const;
const logoOrder = [
  'FutureSkill', 'Nissan', 'Ving', 'GPX', 'Zontes', 'Lambretta', 'Royal Enfield', 'Scenery Farm',
  'Home Plus', 'UD Clinic', 'NSS Scrap', 'Fareve Farm', 'FarmSuk', 'Business Boy', 'AES', 'HFC Healthfoods',
] as const;

let server: Server | undefined;
let localBaseURL = '';

async function resolveDistFile(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = cleanPath === ''
    ? ['index.html']
    : [cleanPath, `${cleanPath}.html`, join(cleanPath, 'index.html')];
  for (const candidate of candidates) {
    const resolved = normalize(join(dist, candidate));
    if (!resolved.startsWith(`${dist}/`)) continue;
    try {
      if ((await stat(resolved)).isFile()) return resolved;
    } catch {}
  }
  return null;
}

function targetBaseURL() {
  return (process.env.BASE_URL ?? localBaseURL).replace(/\/$/, '');
}

async function preparePage(page: Page, path = '/link/') {
  const origin = new URL(targetBaseURL()).origin;
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const allowed = url.origin === origin
      || url.hostname === 'fonts.googleapis.com'
      || url.hostname === 'fonts.gstatic.com'
      || url.hostname === 'cdn.jsdelivr.net';
    const analyticsScript = route.request().resourceType() === 'script'
      && (url.hostname === 'pl.punnattapatch.com' || url.hostname === 'connect.facebook.net');
    if (analyticsScript) await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    else if (allowed) await route.continue();
    else await route.abort('blockedbyclient');
  });
  const response = await page.goto(`${targetBaseURL()}${path}`);
  assert.equal(response?.status(), 200);
  await page.locator('[data-primary-route]').first().waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  return { consoleErrors, pageErrors };
}

async function transformX(page: Page) {
  return page.locator('[data-logo-track]').evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    if (transform === 'none') return 0;
    return new DOMMatrixReadOnly(transform).m41;
  });
}

test.beforeAll(async () => {
  if (process.env.BASE_URL) return;
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const file = await resolveDistFile(pathname);
    if (!file) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  localBaseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

test('content and destination contract exposes only the three approved routes', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = await preparePage(page);

  await expect(page.getByText('ปัน ณัฐพัชร์', { exact: true })).toBeVisible();
  await expect(page.getByText('@pun_nattapatch', { exact: true })).toBeVisible();
  await expect(page.getByText('ที่ปรึกษาการปั้นทีมขาย × AI Agent', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'วันนี้คุณมาหาผมเรื่องไหนครับ?' })).toBeVisible();
  await expect(page.locator('[data-primary-route]')).toHaveCount(3);
  for (const [label, href] of routes) {
    await expect(page.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', href);
  }
  for (const copy of supportCopy) await expect(page.getByText(copy, { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="/booking"], a[href*="/intake-form"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'ติดตามผลงานต่างๆได้ทาง' })).toBeVisible();
  for (const [label, href] of socialLinks) {
    await expect(page.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', href);
  }
  assert.deepEqual(errors.consoleErrors, []);
  assert.deepEqual(errors.pageErrors, []);
  await page.close();
});

test('Trust uses real loaded media and 16 unclipped full-color logos in the approved order', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await preparePage(page);
  await expect(page.getByRole('heading', { name: 'เคยทำงานร่วมกับทีมเหล่านี้' })).toBeVisible();

  const photos = page.locator('[data-trust-photo]');
  await expect(photos).toHaveCount(3);
  for (let index = 0; index < await photos.count(); index += 1) {
    assert.ok(await photos.nth(index).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0));
  }

  const originalLogos = page.locator('.logo-run:not(.marquee-copy) .logo-tile img');
  await expect(originalLogos).toHaveCount(16);
  assert.deepEqual(await originalLogos.evaluateAll((images) => images.map((image) => image.getAttribute('alt'))), [...logoOrder]);
  for (let index = 0; index < 16; index += 1) {
    const logo = originalLogos.nth(index);
    const before = await logo.evaluate((image: HTMLImageElement) => ({
      loaded: image.complete && image.naturalWidth > 0,
      filter: getComputedStyle(image).filter,
      opacity: getComputedStyle(image).opacity,
    }));
    assert.deepEqual(before, { loaded: true, filter: 'none', opacity: '1' });
    await logo.hover();
    assert.deepEqual(await logo.evaluate((image) => ({ filter: getComputedStyle(image).filter, opacity: getComputedStyle(image).opacity })), { filter: 'none', opacity: '1' });
  }
  assert.doesNotMatch((await page.content()).toLowerCase(), /singha/);
  await page.close();
});

test('responsive glance, tap targets, and keyboard order remain usable from 320 to 1440', async ({ browser }) => {
  for (const viewport of [
    { width: 320, height: 900 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1200 },
  ]) {
    const page = await browser.newPage({ viewport });
    await preparePage(page);
    assert.deepEqual(await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })), { clientWidth: viewport.width, scrollWidth: viewport.width });

    const targets = page.locator('[data-primary-route], [data-social-link]');
    for (let index = 0; index < await targets.count(); index += 1) {
      const box = await targets.nth(index).boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44, `target ${index} at ${viewport.width}px must be at least 44px`);
    }

    if (viewport.width === 390) {
      for (const locator of [
        page.getByText('ปัน ณัฐพัชร์', { exact: true }),
        page.getByRole('heading', { name: 'วันนี้คุณมาหาผมเรื่องไหนครับ?' }),
        ...routes.map(([label]) => page.getByRole('link', { name: new RegExp(label) })),
        page.getByRole('heading', { name: 'เคยทำงานร่วมกับทีมเหล่านี้' }),
      ]) {
        const box = await locator.boundingBox();
        assert.ok(box && box.y < viewport.height && box.y + box.height > 0, `${await locator.textContent()} must intersect the first viewport`);
      }
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.keyboard.press('Tab');
      if (await page.locator('[data-primary-route]').first().evaluate((route) => route === document.activeElement)) break;
    }
    for (let index = 0; index < 3; index += 1) {
      if (index > 0) await page.keyboard.press('Tab');
      const route = page.locator('[data-primary-route]').nth(index);
      await expect(route).toBeFocused();
      const outline = await route.evaluate((element) => getComputedStyle(element).outlineStyle);
      assert.notEqual(outline, 'none');
    }
    assert.equal(await page.locator('[data-trust-section]').evaluate((trust) => {
      const social = document.querySelector('[data-social-section]');
      return Boolean(social && (trust.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING));
    }), true);
    await page.close();
  }
});

test('logo walk advances exactly one complete card only while visible', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 500 } });
  await preparePage(page);
  const stillStart = await transformX(page);
  await page.waitForTimeout(3100);
  assert.equal(await transformX(page), stillStart, 'offscreen carousel must not advance');

  await page.locator('[data-logo-viewport]').scrollIntoViewIfNeeded();
  const firstTwo = await page.locator('.logo-run:not(.marquee-copy) .logo-tile').evaluateAll((tiles) => tiles.slice(0, 2).map((tile) => tile.querySelector('img')?.getAttribute('alt')));
  assert.deepEqual(firstTwo, ['FutureSkill', 'Nissan']);
  const card = await page.locator('.logo-run:not(.marquee-copy) .logo-tile').first().boundingBox();
  assert.ok(card);
  const before = await transformX(page);
  await page.waitForTimeout(3250);
  const after = await transformX(page);
  assert.ok(Math.abs((after - before) + card.width + 12) <= 1, `expected one-card move, got ${after - before}px`);

  const clipping = await page.locator('[data-logo-viewport]').evaluate((viewport) => {
    const bounds = viewport.getBoundingClientRect();
    return [...viewport.querySelectorAll('.logo-tile')]
      .map((tile) => tile.getBoundingClientRect())
      .filter((rect) => rect.right > bounds.left + 1 && rect.left < bounds.right - 1)
      .filter((rect) => rect.left < bounds.left - 1 || rect.right > bounds.right + 1)
      .length;
  });
  assert.equal(clipping, 0, 'visible carousel cards must not clip at either edge');
  await page.close();

  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await preparePage(tablet);
  assert.deepEqual(await tablet.locator('.logo-run:not(.marquee-copy) .logo-tile').evaluateAll((tiles) => tiles.slice(0, 3).map((tile) => tile.querySelector('img')?.getAttribute('alt'))), ['FutureSkill', 'Nissan', 'Ving']);
  await tablet.close();
});

test('reduced motion disables automatic movement and enables manual logo scrolling', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await preparePage(page);
  await page.locator('[data-logo-viewport]').scrollIntoViewIfNeeded();
  const before = await transformX(page);
  await page.waitForTimeout(3250);
  assert.equal(await transformX(page), before);
  await expect(page.locator('.marquee-copy')).toBeHidden();
  assert.match(await page.locator('[data-logo-viewport]').evaluate((element) => getComputedStyle(element).overflowX), /auto|scroll/);
  await context.close();
});

async function collectClick(browser: Browser, path: string, event: string) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await preparePage(page, path);
  await page.evaluate(() => {
    window.__linkEvents = [];
    window.plausible = (...args) => window.__linkEvents.push(args);
    document.addEventListener('click', (click) => click.preventDefault(), true);
  });
  await page.locator(`[data-link-event="${event}"]`).click();
  const calls = await page.evaluate(() => window.__linkEvents);
  await page.close();
  return calls;
}

test('route analytics preserve real attribution and never invent TikTok', async ({ browser }) => {
  const instagram = await collectClick(browser, '/link/?utm_source=instagram&utm_medium=bio&utm_campaign=profile', 'line');
  assert.deepEqual(instagram, [
    ['link_line_click', { props: { target: 'line', platform: 'line', source: 'instagram', path: '/link/' } }],
    ['Link Click', { props: { target: 'line', platform: 'line', source: 'instagram', path: '/link/' } }],
  ]);

  for (const [event, expectedName, target, platform] of [
    ['services', 'link_services_click', 'services', 'services'],
    ['sponsor', 'link_sponsor_click', 'sponsor', 'sponsor'],
    ['tiktok', 'link_social_click', 'social', 'tiktok'],
    ['instagram', 'link_social_click', 'social', 'instagram'],
    ['facebook', 'link_social_click', 'social', 'facebook'],
  ] as const) {
    const calls = await collectClick(browser, '/link/', event);
    assert.deepEqual(calls, [
      [expectedName, { props: { target, platform, source: 'direct', path: '/link/' } }],
      ['Link Click', { props: { target, platform, source: 'direct', path: '/link/' } }],
    ]);
  }
});

declare global {
  interface Window {
    __linkEvents: unknown[][];
    plausible: (...args: unknown[]) => void;
  }
}
