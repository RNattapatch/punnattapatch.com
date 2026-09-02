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
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let server;
let baseURL;
let redirects;

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

test.beforeAll(async () => {
  redirects = new Map(
    (await readFile(join(dist, '_redirects'), 'utf8'))
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [from, to, status] = line.split(/\s+/);
        return [from, { to, status: Number(status) }];
      }),
  );
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const redirect = redirects.get(pathname);
    if (redirect) {
      response.writeHead(redirect.status, { location: redirect.to }).end();
      return;
    }
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
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

test('visibility matrix renders one global control only on public marketing pages', async ({ browser }) => {
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

test('floating control is safe-area aware, keyboard accessible, and exposes its local QR', async ({ browser }) => {
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

test('one click derives Contact props once per provider and provider failures do not block later providers or navigation', async ({ browser }) => {
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

test('services catalog has healthy card images and no horizontal overflow at release viewports', async ({ browser }) => {
  const page = await browser.newPage();
  page.setDefaultTimeout(5_000);
  const consoleErrors = [];
  const failedImages = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.request().resourceType() === 'image' && response.status() >= 400) {
      failedImages.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    const response = await page.goto(`${baseURL}/services`);
    assert.equal(response?.status(), 200);
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(overflow.scrollWidth <= overflow.clientWidth, `${viewport.width}px viewport must not overflow horizontally`);

    const cards = page.locator('[data-offer-code]');
    assert.equal(await cards.count(), 7, 'all seven catalog offers must render once');
    assert.equal(await cards.first().getAttribute('data-offer-code'), 'T2', 'T2 must remain the first catalog card');
    const images = cards.locator('figure > img');
    assert.equal(await images.count(), 7, 'every catalog offer must render one thumbnail');
    for (let index = 0; index < await images.count(); index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction((element) => element.complete && element.naturalWidth > 0, await image.elementHandle());
    }
    const imageMetrics = await images.evaluateAll((elements) => elements.map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        objectFit: getComputedStyle(image).objectFit,
      };
    }));
    for (const image of imageMetrics) {
      assert.equal(image.complete, true, `${viewport.width}px catalog image must finish loading`);
      assert.equal(image.naturalWidth, 1600, 'catalog source must retain its approved width');
      assert.equal(image.naturalHeight, 900, 'catalog source must retain its approved height');
      assert.ok(image.renderedWidth > 0 && image.renderedHeight > 0, `${viewport.width}px catalog image must be visible at card size`);
      assert.ok(
        image.objectFit === 'contain' || Math.abs(image.renderedWidth / image.renderedHeight - 16 / 9) < 0.02,
        `${viewport.width}px catalog image must preserve 16:9 or use object-contain without crop`,
      );
    }
  }

  assert.deepEqual(failedImages, [], 'catalog image requests must not fail');
  assert.deepEqual(consoleErrors, [], 'services page must not log console errors');
  await page.close();
});

test('six catalog cards open their canonical detail pages and preserve LINE decision help', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(5_000);
  const details = [
    ['T2', '/services/online-to-sales'],
    ['T1', '/services/t1-sales-skills'],
    ['T3', '/services/t3-sales-back-office'],
    ['T4', '/services/advance-ai-automation'],
    ['C1', '/services/daily-consulting'],
    ['I1', '/services/dashboard-build'],
  ];

  await page.goto(`${baseURL}/services`);
  assert.deepEqual(
    await page.locator('[data-offer-detail-link]').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    details.map(([, route]) => route),
    'the five public Product cards must expose one unique canonical detail link in visible order',
  );

  for (const [code, route] of details) {
    const card = page.locator(`[data-offer-code="${code}"]`);
    assert.equal(await card.locator('[data-offer-detail-link]').getAttribute('href'), route, `${code} card must link directly to its canonical detail page`);
    const lineLink = card.locator('[data-offer-line-link]');
    assert.equal(await lineLink.getAttribute('href'), 'https://lin.ee/ioSnSUG', `${code} card must retain LINE fit help beside the detail link`);
    assert.equal(
      await lineLink.evaluate((element) => getComputedStyle(element).backgroundColor),
      'rgb(6, 199, 85)',
      `${code} card LINE action must use the LINE green affordance`,
    );

    const response = await page.goto(`${baseURL}${route}`);
    assert.equal(response?.status(), 200, `${code} canonical detail route must return 200`);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://punnattapatch.com${route}`, `${code} canonical tag must match the card destination`);
    assert.equal(await page.locator('[data-detail-chooser-link]').getAttribute('href'), '/services#offer-chooser', `${code} detail page must return undecided visitors to the services chooser`);
    assert.ok(await page.locator(`[data-product-code="${code}"][data-contact-cta]`).count() > 0, `${code} detail page must retain a direct LINE path`);
    await page.goto(`${baseURL}/services`);
  }

  const a1 = page.locator('[data-offer-code="A1"]');
  assert.equal(await a1.locator('[data-offer-detail-link]').count(), 0, 'A1 must not expose a public detail route');
  assert.equal(await a1.locator('[data-offer-line-link]').getAttribute('href'), 'https://lin.ee/ioSnSUG', 'A1 must remain a LINE-only proposal path');
  await page.close();
});

test('T4 catalog artwork is rendered from the approved real workshop photograph', async () => {
  const template = await readFile(join(root, 'scripts/t4-service-thumbnail.html'), 'utf8');
  assert.match(template, /data-source-kind="real-workshop-photo"/, 'T4 HTML artboard must declare real-photo provenance');
  assert.match(template, /\.\.\/public\/lp\/inhouse\/office-session\.jpg/, 'T4 artboard must use the real Advance AI workshop session');
  assert.match(template, /ก่อนซื้อระบบ[\s\S]*ลองกับงานจริงก่อน/, 'T4 thumbnail must keep the approved two-second message in editable HTML');
});

test('legacy product URLs redirect one hop to a healthy canonical detail page', async () => {
  const routeMatrix = [
    ['/services/ai-workshop', '/services/t1-sales-skills', 'T1'],
    ['/services/ai-workshop-followup', '/services/t1-sales-skills', 'T1'],
    ['/services/sale-training-bundle', '/services/t1-sales-skills', 'T1'],
    ['/inhouse', '/services/t1-sales-skills', 'T1'],
    ['/services/trust-content-tiktok-workshop', '/services/online-to-sales', 'T2'],
    ['/services/ai-workshop-advance', '/services/t3-sales-back-office', 'T3'],
    ['/advance-ai', '/services/t3-sales-back-office', 'T3'],
    ['/ai-workshop-advance', '/services/t3-sales-back-office', 'T3'],
    ['/services/paid-audit', '/services/daily-consulting', 'C1'],
    ['/services/package-a', '/services/daily-consulting', 'C1'],
    ['/services/sales-system-sprint', '/services/daily-consulting', 'C1'],
  ];

  for (const [source, canonical, code] of routeMatrix) {
    const redirectResponse = await fetch(`${baseURL}${source}`, { redirect: 'manual' });
    assert.equal(redirectResponse.status, 301, `${source} must return a permanent redirect for ${code}`);
    assert.equal(redirectResponse.headers.get('location'), canonical, `${source} must redirect directly to the ${code} canonical route`);
    const finalResponse = await fetch(`${baseURL}${canonical}`, { redirect: 'manual' });
    assert.equal(finalResponse.status, 200, `${code} canonical route must be healthy`);
    assert.equal(finalResponse.headers.get('location'), null, `${code} canonical route must not redirect again`);
  }
});

test('keyboard order follows page hierarchy and reduced motion has no perpetual animation', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(5_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseURL}/services`);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);

  const perpetualAnimations = await page.evaluate(() => document.getAnimations()
    .filter((animation) => animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity)
    .map((animation) => animation.animationName));
  assert.deepEqual(perpetualAnimations, [], 'reduced-motion users must not receive perpetual animation');

  const focusOrder = await page.evaluate(() => {
    const selectors = 'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = [...document.querySelectorAll(selectors)].filter((element) => {
      const style = getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    const classify = (element) => {
      if (element.matches('[data-floating-line]')) return 'floating';
      if (element.closest('#services-final-cta')) return 'final';
      if (element.closest('#faq')) return 'faq';
      if (element.closest('#offer-chooser')) return 'chooser';
      if (element.closest('[data-offer-code]')) return 'cards';
      if (element.closest('#services-hero')) return 'hero';
      if (element.closest('nav')) return 'nav';
      return null;
    };
    return elements.map(classify).filter(Boolean);
  });
  const firstIndex = (section) => focusOrder.indexOf(section);
  const expectedOrder = ['nav', 'hero', 'cards', 'chooser', 'faq', 'final', 'floating'];
  for (const section of expectedOrder) assert.notEqual(firstIndex(section), -1, `${section} must contain a keyboard stop`);
  for (let index = 1; index < expectedOrder.length; index += 1) {
    assert.ok(firstIndex(expectedOrder[index - 1]) < firstIndex(expectedOrder[index]), `${expectedOrder[index - 1]} must precede ${expectedOrder[index]} in keyboard order`);
  }

  await page.close();
});

test('chooser and legacy hashes resolve to every canonical offer target', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(5_000);
  await page.goto(`${baseURL}/services`);

  const chooserTargets = await page.locator('#offer-chooser a[href^="#offer-"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  assert.deepEqual(chooserTargets, ['#offer-t1', '#offer-t2', '#offer-t3', '#offer-t4', '#offer-c1', '#offer-i1', '#offer-a1']);

  for (const target of [
    'sales-team-structure',
    'ai-agent-ceo',
    'offer-t1',
    'offer-t2',
    'offer-t3',
    'offer-t4',
    'offer-c1',
    'offer-i1',
    'offer-a1',
  ]) {
    await page.evaluate((hash) => { window.location.hash = hash; }, target);
    await page.waitForFunction((hash) => window.location.hash === `#${hash}`, target);
    assert.equal(await page.locator(`#${target}`).count(), 1, `#${target} must resolve uniquely`);
  }

  await page.close();
});
