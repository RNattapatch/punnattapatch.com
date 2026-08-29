import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let server;
let browser;
let baseURL;

async function resolveDistFile(pathname) {
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

before(async () => {
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
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseURL = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

test('visibility matrix renders one global control only on public marketing pages', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(5_000);
  const matrix = [
    ['Home', '/', 1],
    ['Services', '/services', 1],
    ['Training (no detail is published)', '/training', 1],
    ['Case Study', '/case-studies/forklift-distributor-5-person-team', 1],
    ['Insight', '/insights/ai-transformation-sales', 1],
    ['FAQ', '/faq', 1],
    ['Booking', '/booking', 0],
    ['Intake form', '/intake-form', 0],
    ['Thank-you', '/thank-you', 0],
    ['Quiz transaction', '/bosi-dna-quiz', 0],
    ['Lead magnet transaction', '/ebook-sales-interview', 0],
    ['Private playbook', '/playbook/line-ai-sales-agent', 0],
    ['Dashboard/Admin', '/app/dashboard', 0],
  ];

  for (const [pageType, route, count] of matrix) {
    const response = await page.goto(`${baseURL}${route}`);
    assert.equal(response?.status(), 200, `${pageType} fixture must load`);
    assert.equal(await page.locator('[data-floating-line]').count(), count, `${pageType} floating LINE visibility`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/ads/dealer-online-sales`);
  assert.equal(await page.locator('[data-floating-line]').count(), 0, 'Ads LP retains its own sticky CTA instead of floating LINE');
  assert.equal(await page.locator('#dealer-ai-sticky').count(), 1, 'Ads LP must have one sticky bottom CTA');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForFunction(() => document.querySelector('#dealer-ai-sticky')?.hidden === false);
  assert.equal(await page.locator('#dealer-ai-sticky').isVisible(), true, 'Ads LP sticky CTA becomes visible after the hero');

  await page.close();
});

test('floating control is safe-area aware, keyboard accessible, and exposes its local QR', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(5_000);
  await page.goto(`${baseURL}/services`);
  const control = page.locator('[data-floating-line]');

  await assert.doesNotReject(async () => control.focus());
  assert.equal(await control.evaluate((element) => element === document.activeElement), true, 'control must receive keyboard focus');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-floating-line-qr]')).opacity === '1');
  assert.equal(await control.getAttribute('href'), 'https://lin.ee/ioSnSUG');
  assert.equal(await control.getAttribute('target'), '_blank');
  assert.equal(await control.getAttribute('rel'), 'noopener');
  assert.equal(await control.getAttribute('aria-label'), 'ทัก LINE · ให้ผมช่วยเลือก');
  assert.equal(await control.getAttribute('data-cta-location'), 'floating_line');
  assert.equal(await control.getAttribute('data-product-code'), 'none');
  assert.equal(await control.getAttribute('data-cta-label'), 'ทัก LINE · ให้ผมช่วยเลือก');

  const desktopMetrics = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    const root = element.closest('[data-floating-line-root]');
    const rootStyle = root ? getComputedStyle(root) : null;
    const rect = element.getBoundingClientRect();
    const label = element.querySelector('[data-floating-line-label]');
    const qr = element.parentElement?.querySelector('[data-floating-line-qr]');
    return {
      width: rect.width,
      height: rect.height,
      right: rootStyle?.right ?? null,
      bottom: rootStyle?.bottom ?? null,
      labelDisplay: label ? getComputedStyle(label).display : null,
      outlineStyle: style.outlineStyle,
      qrOpacity: qr ? getComputedStyle(qr).opacity : null,
      qrVisibility: qr ? getComputedStyle(qr).visibility : null,
      qrSrc: qr?.querySelector('img')?.getAttribute('src') ?? null,
      text: element.textContent ?? '',
    };
  });
  assert.ok(desktopMetrics.width >= 48 && desktopMetrics.height >= 48, 'desktop target must be at least 48px in both dimensions');
  assert.equal(desktopMetrics.right, '24px');
  assert.equal(desktopMetrics.bottom, '24px');
  assert.notEqual(desktopMetrics.labelDisplay, 'none', 'desktop decision-help label must be visible');
  assert.notEqual(desktopMetrics.outlineStyle, 'none', 'focused control must expose a visible focus outline');
  assert.equal(desktopMetrics.qrOpacity, '1', 'focus-within must reveal the QR popover');
  assert.equal(desktopMetrics.qrVisibility, 'visible', 'focus-within must make the QR popover available');
  assert.match(desktopMetrics.qrSrc ?? '', /^\/_astro\/.*\.(?:png|webp)$/i, 'QR popover must use a local built asset');
  assert.doesNotMatch(desktopMetrics.text, /ตอบ(?:กลับ)?ใน\s*5\s*นาที/, 'floating CTA must not claim a five-minute response');

  await control.blur();
  await control.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-floating-line-qr]')).opacity === '1');
  assert.equal(await page.locator('[data-floating-line-qr]').evaluate((element) => getComputedStyle(element).visibility), 'visible', 'desktop hover must reveal the QR popover');

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileMetrics = await control.evaluate((element) => {
    const root = element.closest('[data-floating-line-root]');
    const rootStyle = root ? getComputedStyle(root) : null;
    const rect = element.getBoundingClientRect();
    const label = element.querySelector('[data-floating-line-label]');
    return {
      width: rect.width,
      height: rect.height,
      right: rootStyle?.right ?? null,
      bottom: rootStyle?.bottom ?? null,
      labelDisplay: label ? getComputedStyle(label).display : null,
    };
  });
  assert.ok(mobileMetrics.width >= 48 && mobileMetrics.height >= 48, 'mobile target must be at least 48px in both dimensions');
  assert.equal(mobileMetrics.right, '16px');
  assert.equal(mobileMetrics.bottom, '16px');
  assert.equal(mobileMetrics.labelDisplay, 'none', 'mobile control must use the icon while retaining its aria-label');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footerPrivacy = page.locator('footer a[href="/privacy"]');
  await footerPrivacy.click();
  assert.match(page.url(), /\/privacy$/, 'floating control must not block footer navigation');

  await page.close();
});

test('one click derives Contact props once per provider and provider failures do not block later providers or navigation', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(5_000);
  await page.goto(`${baseURL}/services`);
  const control = page.locator('[data-floating-line]');

  await page.evaluate(() => {
    window.__contactCalls = { plausible: [], fbq: [], ttq: [] };
    window.plausible = (...args) => window.__contactCalls.plausible.push(args);
    window.fbq = (...args) => window.__contactCalls.fbq.push(args);
    window.ttq = { track: (...args) => window.__contactCalls.ttq.push(args) };
    document.querySelector('[data-floating-line]')?.addEventListener('click', (event) => event.preventDefault(), { once: true });
  });
  await control.click();
  const calls = await page.evaluate(() => window.__contactCalls);
  const props = {
    cta_location: 'floating_line',
    page_path: '/services',
    product_code: 'none',
    cta_label: 'ทัก LINE · ให้ผมช่วยเลือก',
  };
  assert.deepEqual(calls.plausible, [['Contact', { props }]]);
  assert.deepEqual(calls.fbq, [['track', 'Contact', { content_name: 'floating_line', content_ids: ['none'] }]]);
  assert.deepEqual(calls.ttq, [['Contact', props]]);

  await page.reload();
  await page.evaluate((nextUrl) => {
    window.__contactCalls = { plausible: 0, fbq: 0, ttq: 0 };
    window.plausible = () => { window.__contactCalls.plausible += 1; throw new Error('plausible failed'); };
    window.fbq = () => { window.__contactCalls.fbq += 1; throw new Error('fbq failed'); };
    window.ttq = { track: () => { window.__contactCalls.ttq += 1; } };
    document.querySelector('[data-floating-line]')?.setAttribute('href', nextUrl);
  }, `${baseURL}/services?line-nav=1`);
  const [popup] = await Promise.all([page.waitForEvent('popup'), control.click()]);
  await popup.waitForLoadState('domcontentloaded');
  assert.match(popup.url(), /\/services\?line-nav=1$/, 'anchor navigation must survive analytics exceptions');
  assert.deepEqual(await page.evaluate(() => window.__contactCalls), { plausible: 1, fbq: 1, ttq: 1 });

  await popup.close();
  await page.close();
});
