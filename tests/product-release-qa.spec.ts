import { test } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const evidence = join(root, '.superpowers', 'sdd', '2026-08-30-product-detail-pages-implementation', 'checkpoint-8', 'screenshots');
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};
const routes = [
  { code: 'T1', path: '/services/t1-sales-skills', schema: 'Course' },
  { code: 'T2', path: '/services/online-to-sales', schema: 'Course' },
  { code: 'T3', path: '/services/t3-sales-back-office', schema: 'Course' },
  { code: 'C1', path: '/services/daily-consulting', schema: 'Service' },
  { code: 'I1', path: '/services/dashboard-build', schema: 'Service' },
] as const;
const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
] as const;

let server: ReturnType<typeof createServer>;
let baseURL: string;

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

function contrastRatio(foreground: string, background: string) {
  const channels = (color: string) => (color.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const luminance = (color: string) => channels(color)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test.beforeAll(async () => {
  await mkdir(evidence, { recursive: true });
  server = createServer(async (request, response) => {
    const file = await resolveDistFile(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    if (!file) return void response.writeHead(404).end('Not found');
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
test.describe.configure({ mode: 'serial' });

for (const route of routes) {
  for (const viewport of viewports) {
    test(`${route.code} release QA at ${viewport.name}`, async ({ browser }) => {
      const page = await browser.newPage({ viewport });
      const imageFailures: string[] = [];
      await page.addInitScript(() => {
        (window as Window & { __releaseCls?: number }).__releaseCls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
            if (!entry.hadRecentInput) (window as Window & { __releaseCls?: number }).__releaseCls! += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      page.on('response', (response) => {
        const url = new URL(response.url());
        if (url.origin === baseURL && /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname) && !response.ok()) {
          imageFailures.push(`${response.status()} ${url.pathname}`);
        }
      });
      await page.route('**/*', async (requestRoute) => {
        const url = new URL(requestRoute.request().url());
        if (url.origin === baseURL) return requestRoute.continue();
        return requestRoute.fulfill({ status: 204, body: '' });
      });

      const response = await page.goto(`${baseURL}${route.path}`, { waitUntil: 'domcontentloaded' });
      assert.equal(response?.status(), 200, `${route.code} must return 200`);
      await page.evaluate(async () => { await document.fonts.ready; });

      assert.equal(await page.locator('main h1').count(), 1, `${route.code} must expose one H1`);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://punnattapatch.com${route.path}`, `${route.code} canonical must match its public route`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `${route.code} must not overflow horizontally at ${viewport.width}px`);

      const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => {
        const parsed = JSON.parse(script.textContent || '{}');
        return (parsed['@graph'] ?? [parsed]).map((item: { '@type'?: string }) => item['@type']);
      }));
      assert.ok(schemaTypes.includes(route.schema), `${route.code} must expose ${route.schema} schema`);
      assert.ok(schemaTypes.includes('FAQPage'), `${route.code} must expose FAQPage schema`);
      assert.ok(schemaTypes.includes('BreadcrumbList'), `${route.code} must expose BreadcrumbList schema`);

      const faq = page.locator('[data-product-faq-button]').first();
      await faq.focus();
      await faq.press('Enter');
      assert.equal(await faq.getAttribute('aria-expanded'), 'true', `${route.code} FAQ must open from the keyboard`);
      assert.equal(await page.locator(`#${await faq.getAttribute('aria-controls')}`).isVisible(), true, `${route.code} FAQ answer must become visible`);

      const booking = page.locator('[data-booking-cta]').first();
      await booking.focus();
      const bookingStyle = await booking.evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color, outline: style.outlineStyle };
      });
      assert.ok(contrastRatio(bookingStyle.color, bookingStyle.background) >= 4.5, `${route.code} booking CTA must pass WCAG AA contrast`);
      assert.notEqual(bookingStyle.outline, 'none', `${route.code} booking CTA must retain a visible focus outline`);

      const line = page.locator('[data-line-cta]').first();
      const lineStyle = await line.evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, color: style.color };
      });
      assert.ok(contrastRatio(lineStyle.color, lineStyle.background) >= 4.5, `${route.code} LINE CTA must pass WCAG AA contrast`);

      const heroImages = page.locator('[data-detail-block="hero"] img[fetchpriority="high"][loading="eager"]');
      assert.equal(await heroImages.count(), 1, `${route.code} must prioritize exactly one Hero image`);
      assert.equal(await page.locator('[data-detail-block="proof"] img:not([loading="lazy"])').count(), 0, `${route.code} proof images must stay lazy below the fold`);

      await page.evaluate(async () => {
        const step = Math.max(window.innerHeight * 0.8, 500);
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      for (const image of await page.locator('main img:visible').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(async (element) => { try { await (element as HTMLImageElement).decode(); } catch {} });
      }
      await page.waitForTimeout(100);
      const imageState = await page.locator('main img').evaluateAll((images) => images.map((image) => ({
        alt: image.getAttribute('alt'),
        complete: (image as HTMLImageElement).complete,
        height: Number(image.getAttribute('height')),
        naturalWidth: (image as HTMLImageElement).naturalWidth,
        src: image.getAttribute('src') || '',
        visible: image.getClientRects().length > 0,
        width: Number(image.getAttribute('width')),
      })));
      const imageResponses = await page.evaluate(async () => Promise.all(
        [...document.querySelectorAll<HTMLImageElement>('main img[src]')].map(async (image) => {
          const response = await fetch(image.src);
          return { src: image.getAttribute('src'), status: response.status };
        }),
      ));
      for (const image of imageState) {
        assert.notEqual(image.alt, null, `${route.code} image must have an alt attribute: ${image.src}`);
        assert.ok(image.width > 0 && image.height > 0, `${route.code} image must reserve dimensions: ${image.src}`);
        if (image.visible) assert.ok(image.complete && image.naturalWidth > 0, `${route.code} visible image must load successfully: ${image.src}`);
      }
      assert.ok(imageResponses.every((image) => image.status === 200), `${route.code} every rendered image URL must return 200`);
      assert.deepEqual(imageFailures, [], `${route.code} must not request broken images`);

      const visibleText = await page.locator('main').innerText();
      assert.doesNotMatch(visibleText, /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?66|0)\d[\d\s-]{7,})/, `${route.code} visible proof must not expose email or phone PII`);
      assert.doesNotMatch(visibleText, /(?:authoring label|placeholder|lorem ipsum|TODO)/i, `${route.code} must not leak authoring labels or placeholders`);

      if (viewport.width === 1440) {
        await page.evaluate(() => {
          const releaseWindow = window as Window & { __releaseEvents?: unknown[]; plausible?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void; ttq?: { track: (...args: unknown[]) => void } };
          releaseWindow.__releaseEvents = [];
          releaseWindow.plausible = (...args) => releaseWindow.__releaseEvents!.push(['plausible', ...args]);
          releaseWindow.fbq = (...args) => releaseWindow.__releaseEvents!.push(['meta', ...args]);
          releaseWindow.ttq = { track: (...args) => releaseWindow.__releaseEvents!.push(['tiktok', ...args]) };
          document.addEventListener('click', (event) => {
            if ((event.target as Element | null)?.closest('[data-booking-cta]')) event.preventDefault();
          }, { capture: true });
        });
        await booking.click();
        const events = await page.evaluate(() => (window as Window & { __releaseEvents?: unknown[] }).__releaseEvents ?? []);
        assert.deepEqual((events as unknown[][]).map((event) => event[0]), ['plausible', 'meta', 'tiktok'], `${route.code} booking click must reach all three analytics adapters exactly once`);
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const floatingMotion = await page.locator('[data-floating-line]')
        .evaluate((element) => getComputedStyle(element).transitionDuration);
      assert.ok(Number.parseFloat(floatingMotion) <= 0.00001, `${route.code} floating LINE CTA must stop motion when reduced motion is requested`);

      const cls = await page.evaluate(() => (window as Window & { __releaseCls?: number }).__releaseCls ?? 0);
      assert.ok(cls <= 0.1, `${route.code} CLS must stay at or below 0.1; got ${cls}`);
      await page.screenshot({ fullPage: true, path: join(evidence, `${route.code.toLowerCase()}-${viewport.name}.png`) });
      await page.close();
    });
  }
}
