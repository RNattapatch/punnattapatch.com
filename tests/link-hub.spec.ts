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

// 2026-10-10: /link แบ่งตาม 2 บริการ (คุณปันเคาะ) — ประตูหลัก 2 บาน + ทางของคนที่ยังไม่แน่ใจ 2 ทาง
const routes = [
  ['คลาสอบรม', 'https://punnattapatch.com/services#core-training'],
  ['Consult วางระบบ', 'https://punnattapatch.com/services/daily-consulting'],
  ['เช็คทีมขาย 2 นาที', 'https://punnattapatch.com/team-check'],
  ['ทักมาเล่าโจทย์ใน LINE', 'https://lin.ee/ioSnSUG'],
] as const;
const moreRoutes = [
  ['คลาสออนไลน์บน FutureSkill', 'https://futureskill.co/course/detail/6030'],
  ['ชวนไปร่วมงาน', 'https://punnattapatch.com/sponsor'],
] as const;
const topics = ['คัดคน', 'เป้าและค่าคอม', 'หัวหน้าคุมทีม', 'ฝ่ายขาย', 'ฝ่ายเอกสาร', 'ฝ่ายคอนเทนต์'] as const;
const supportCopy = [
  'ผมช่วยทีมขายได้ 2 แบบ',
  'เหมาะเมื่อ ทีมมีคนแล้ว แต่ยังทำไม่เป็น',
  'ผมเข้าไปวางระบบให้ทีมใช้กับงานจริง 1–2 วัน',
  'เหมาะเมื่อ รู้ว่าต้องแก้อะไร แต่ไม่มีใครว่างลงมือ',
  'รู้ว่าทีมติดเรื่องคน หรือเรื่องระบบ',
  'เล่าคร่าวๆ ได้เลย',
  'ตั้ง Worker บน Cloud ด้วย AI Agent',
  'Sponsor · Partnership · Speaker',
] as const;
const socialLinks = [
  ['TikTok', 'https://www.tiktok.com/@pun_nattapatch'],
  ['Instagram', 'https://www.instagram.com/pun_nattapatch'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61584893736763'],
] as const;
const logoOrder = [
  'FutureSkill', 'Nissan', 'มหาวิทยาลัยรามคำแหง', 'สถาบันเทคโนโลยีไทย-ญี่ปุ่น (TNI)', 'Ving', 'GPX', 'Zontes', 'Lambretta', 'Royal Enfield', 'Scenery Farm',
  'Home Plus', 'UD Clinic', 'Kanchanok Clinic', 'MEET MÉ', 'NSS Scrap', 'Fareve Farm', 'FarmSuk', 'Business Boy', 'AES', 'HFC Healthfoods',
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

test('content and destination contract puts the two services first, then the unsure paths', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = await preparePage(page);

  await expect(page.getByText('ปัน ณัฐพัชร์', { exact: true })).toBeVisible();
  await expect(page.locator('header').getByText('@pun_nattapatch', { exact: true })).toBeVisible();
  await expect(page.getByText('ที่ปรึกษาการปั้นทีมขาย × AI Agent', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /ให้ทีมเรียนจนทำเป็น/ })).toBeVisible();
  await expect(page.locator('[data-primary-route]')).toHaveCount(4);
  for (const [index, [label, href]] of routes.entries()) {
    const route = page.locator('[data-primary-route]').nth(index);
    await expect(route).toContainText(label);
    await expect(route).toHaveAttribute('href', href);
  }
  await expect(page.locator('[data-door]')).toHaveCount(2);
  await expect(page.getByRole('list', { name: 'เรื่องที่เลือกได้' }).getByRole('listitem')).toHaveText([...topics]);
  for (const [label, href] of moreRoutes) {
    await expect(page.locator('[data-more-route]', { hasText: label })).toHaveAttribute('href', href);
  }
  const futureSkillRoute = page.getByRole('link', { name: /คลาสออนไลน์บน FutureSkill/ });
  await expect(futureSkillRoute).toHaveAttribute('target', '_blank');
  await expect(futureSkillRoute).toHaveAttribute('rel', 'noopener');
  await expect(futureSkillRoute).toHaveAttribute('data-link-platform', 'futureskill');
  for (const copy of supportCopy) await expect(page.getByText(copy, { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="/booking"], a[href*="/intake-form"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'ติดตามผลงานต่างๆได้ทาง' })).toBeVisible();
  const socialSection = page.locator('[data-social-section]');
  for (const [label, href] of socialLinks) {
    await expect(socialSection.getByRole('link', { name: new RegExp(label) })).toHaveAttribute('href', href);
  }
  assert.deepEqual(errors.consoleErrors, []);
  assert.deepEqual(errors.pageErrors, []);
  await page.close();
});

test('Trust uses real loaded media and 20 unclipped full-color logos in the approved order', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await preparePage(page);
  await expect(page.getByRole('heading', { name: 'เคยทำงานร่วมกับทีมเหล่านี้' })).toBeVisible();

  const photos = page.locator('[data-trust-photo]');
  await expect(photos).toHaveCount(3);
  for (let index = 0; index < await photos.count(); index += 1) {
    assert.ok(await photos.nth(index).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0));
  }

  const originalLogos = page.locator('.logo-run:not(.marquee-copy) .logo-tile img');
  await expect(originalLogos).toHaveCount(20);
  assert.deepEqual(await originalLogos.evaluateAll((images) => images.map((image) => image.getAttribute('alt'))), [...logoOrder]);
  for (let index = 0; index < 20; index += 1) {
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

test('intro video facade stays lightweight and opens the exact TikTok player on demand', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const tiktokRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('tiktok.com')) tiktokRequests.push(request.url());
  });
  await preparePage(page);

  const videoSection = page.locator('[data-video-section]');
  await expect(videoSection).toBeVisible();
  assert.equal(await videoSection.evaluate((video) => {
    const trust = document.querySelector('[data-trust-section]');
    const social = document.querySelector('[data-social-section]');
    return Boolean(
      trust
      && social
      && (trust.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING)
      && (video.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  }), true, 'video note must sit between Trust and Social');

  await expect(page.locator('iframe[src*="tiktok.com/player/v1/"]')).toHaveCount(0);
  assert.deepEqual(tiktokRequests, [], 'TikTok must receive no request before the visitor presses play');
  const poster = videoSection.locator('img[data-video-poster]');
  assert.equal(await poster.evaluate((image: HTMLImageElement) => (
    image.complete && image.naturalWidth > 0 && new URL(image.src).origin === window.location.origin
  )), true, 'poster must load locally before the third-party player');

  const play = videoSection.locator('[data-video-play]');
  const playBox = await play.boundingBox();
  assert.ok(playBox && playBox.width >= 44 && playBox.height >= 44, 'video play target must be at least 44px');
  const videoLayout = await play.evaluate((button) => {
    const section = button.closest('[data-video-section]');
    if (!section) return null;
    const buttonBox = button.getBoundingClientRect();
    const sectionBox = section.getBoundingClientRect();
    return {
      aspectRatio: buttonBox.width / buttonBox.height,
      centerDelta: Math.abs(
        (buttonBox.left + buttonBox.width / 2) - (sectionBox.left + sectionBox.width / 2),
      ),
    };
  });
  assert.ok(videoLayout, 'video layout must be measurable');
  assert.ok(Math.abs(videoLayout.aspectRatio - (9 / 16)) <= 0.02, `video facade must be portrait 9:16, got ${videoLayout.aspectRatio}`);
  assert.ok(videoLayout.centerDelta <= 1, `video facade must be horizontally centered, delta ${videoLayout.centerDelta}px`);
  await expect(videoSection.getByRole('link', { name: /เปิดใน TikTok/ })).toHaveAttribute(
    'href',
    'https://www.tiktok.com/@pun_nattapatch/video/7680069615455636756',
  );

  await page.evaluate(() => {
    window.__linkEvents = [];
    window.plausible = (...args) => window.__linkEvents.push(args);
  });
  await play.click();

  const dialog = page.locator('[data-video-dialog]');
  await expect(dialog).toBeVisible();
  const player = dialog.locator('iframe');
  await expect(player).toHaveAttribute(
    'src',
    /^https:\/\/www\.tiktok\.com\/player\/v1\/7680069615455636756\?autoplay=1/,
  );
  await expect(player).toHaveAttribute('title', 'วิดีโอแนะนำตัวและบริการของปัน ณัฐพัชร์');
  assert.ok(tiktokRequests.some((url) => url.startsWith('https://www.tiktok.com/player/v1/7680069615455636756')));
  assert.deepEqual(await page.evaluate(() => window.__linkEvents), [
    ['link_intro_video_play', { props: { target: 'intro-video', platform: 'tiktok', source: 'direct', path: '/link/' } }],
    ['Link Click', { props: { target: 'intro-video', platform: 'tiktok', source: 'direct', path: '/link/' } }],
  ]);

  await dialog.locator('[data-video-close]').click();
  await expect(dialog).not.toBeVisible();
  await expect(dialog.locator('iframe')).toHaveCount(0);
  await page.close();
});

test('TikTok-style facade uses honest familiar cues and enables official playback controls', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await preparePage(page);

  const videoSection = page.locator('[data-video-section]');
  const facade = videoSection.locator('[data-video-play]');
  await expect(facade.getByText('@pun_nattapatch', { exact: true })).toBeVisible();
  await expect(facade.getByText('ให้บริการอะไรบ้าง สรุปจบในคลิปเดียว', { exact: true })).toBeVisible();
  await expect(facade.getByText('แตะเพื่อเล่น', { exact: true })).toBeVisible();
  assert.equal(await facade.evaluate((button) => getComputedStyle(button).backgroundColor), 'rgb(0, 0, 0)');
  await expect(videoSection.locator('button')).toHaveCount(1);

  await facade.click();
  const source = await page.locator('[data-video-dialog] iframe').getAttribute('src');
  assert.ok(source);
  const playerURL = new URL(source);
  assert.deepEqual(Object.fromEntries([
    'autoplay', 'controls', 'progress_bar', 'play_button', 'volume_control',
    'fullscreen_button', 'description', 'music_info', 'rel',
  ].map((key) => [key, playerURL.searchParams.get(key)])), {
    autoplay: '1',
    controls: '1',
    progress_bar: '1',
    play_button: '1',
    volume_control: '1',
    fullscreen_button: '1',
    description: '1',
    music_info: '0',
    rel: '0',
  });
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
        page.getByRole('heading', { level: 1, name: /ให้ทีมเรียนจนทำเป็น/ }),
        // จอแรกต้องเห็นทั้ง 2 บริการ (คลาสอบรม · Consult วางระบบ)
        page.locator('[data-door="class"]'),
        page.locator('[data-door="consult"]'),
      ]) {
        const box = await locator.boundingBox();
        assert.ok(box && box.y < viewport.height && box.y + box.height > 0, `${await locator.textContent()} must intersect the first viewport`);
      }
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.keyboard.press('Tab');
      if (await page.locator('[data-primary-route]').first().evaluate((route) => route === document.activeElement)) break;
    }
    for (let index = 0; index < routes.length; index += 1) {
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
  await page.waitForTimeout(3500);
  const after = await transformX(page);
  assert.ok(Math.abs((after - before) + card.width + 12) <= 1, `expected one-card move, got ${after - before}px`);

  const toggle = page.locator('[data-logo-toggle]');
  await expect(toggle).toHaveAttribute('aria-label', 'หยุดการเลื่อนโลโก้อัตโนมัติ');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('aria-label', 'หยุดการเลื่อนโลโก้อัตโนมัติ');
  await expect(toggle).toHaveText('เล่นต่อ');
  await page.waitForTimeout(500);
  const pausedAt = await transformX(page);
  await page.waitForTimeout(3250);
  assert.equal(await transformX(page), pausedAt, 'pause control must stop automatic movement');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveText('หยุด');
  await page.waitForTimeout(3250);
  assert.notEqual(await transformX(page), pausedAt, 'play control must resume automatic movement');

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

  const boundary = await browser.newPage({ viewport: { width: 430, height: 900 } });
  await preparePage(boundary);
  await boundary.locator('[data-logo-viewport]').scrollIntoViewIfNeeded();
  const boundaryLayout = await boundary.locator('[data-logo-viewport]').evaluate((viewport) => {
    const bounds = viewport.getBoundingClientRect();
    const cards = [...viewport.querySelectorAll('.logo-run:not(.marquee-copy) .logo-tile')].slice(0, 4).map((tile) => tile.getBoundingClientRect());
    return {
      fullyVisible: cards.filter((card) => card.left >= bounds.left - 1 && card.right <= bounds.right + 1).length,
      fourthStartsAfterViewport: cards[3].left >= bounds.right - 1,
    };
  });
  assert.deepEqual(boundaryLayout, { fullyVisible: 3, fourthStartsAfterViewport: true });
  await boundary.close();

  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await preparePage(tablet);
  assert.deepEqual(await tablet.locator('.logo-run:not(.marquee-copy) .logo-tile').evaluateAll((tiles) => tiles.slice(0, 3).map((tile) => tile.querySelector('img')?.getAttribute('alt'))), ['FutureSkill', 'Nissan', 'มหาวิทยาลัยรามคำแหง']);
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
    ['class', 'link_class_click', 'class', 'services'],
    ['consult', 'link_consult_click', 'consult', 'services'],
    ['team-check', 'link_team_check_click', 'team-check', 'quiz'],
    ['futureskill-course', 'link_futureskill_click', 'course-6030', 'futureskill'],
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

test('only the LINE route reports a Meta Contact; service doors and the quiz do not', async ({ browser }) => {
  for (const [event, expected] of [
    ['line', [['track', 'Contact', { content_name: 'link_hub_line' }]]],
    ['class', []],
    ['consult', []],
    ['team-check', []],
  ] as const) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await preparePage(page);
    await page.evaluate(() => {
      window.__fbqEvents = [];
      window.fbq = (...args) => window.__fbqEvents.push(args);
      document.addEventListener('click', (click) => click.preventDefault(), true);
    });
    await page.locator(`[data-link-event="${event}"]`).click();
    assert.deepEqual(await page.evaluate(() => window.__fbqEvents), expected, event);
    await page.close();
  }
});

declare global {
  interface Window {
    __linkEvents: unknown[][];
    __fbqEvents: unknown[][];
    fbq: (...args: unknown[]) => void;
    plausible: (...args: unknown[]) => void;
  }
}

test('FutureSkill Instructor banner follows the service choices as proof, paired with daily-use proof, logo on white', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await preparePage(page);
  const banner = page.locator('[data-fs-banner]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('FutureSkill Instructor 2026');
  // moat: credential never stands alone — วง 1 proof must sit in the same block
  await expect(banner).toContainText('สอนจากระบบที่ผมใช้ทำงานจริงทุกวัน');
  await expect(banner).toContainText('AI');
  await expect(banner).toContainText('Digital Business');
  await expect(banner).toContainText('Sales & Customer');
  for (const banned of ['รับรอง', 'แต่งตั้ง', 'สอบสอน', 'บนแพลตฟอร์ม', 'คอร์ส']) await expect(banner).not.toContainText(banned);
  // หลักฐานมาหลังทางเลือก (Why/ทางเลือกก่อน credential) — ทุกประตูหลักต้องมาก่อนแบนเนอร์
  assert.equal(await banner.evaluate((element) => [...document.querySelectorAll('[data-primary-route]')]
    .every((route) => route.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  const logo = banner.getByRole('img', { name: 'FutureSkill' });
  assert.equal(await logo.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0), true);
  assert.equal(await logo.evaluate((img) => getComputedStyle(img.parentElement!).backgroundColor), 'rgb(255, 255, 255)');
  await page.close();
});
