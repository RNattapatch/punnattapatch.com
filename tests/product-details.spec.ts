import { test, type Page } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG, fmtPrice } from '../src/data/pricing.mjs';

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

// การ์ด Course Outline ต้องชี้ไปที่ PDF ที่มีอยู่จริงในบิลด์ — ลิงก์ตายคือ lead ที่หลุดมือ
async function expectOutlineDownload(page: Page, code: string, href: string) {
  const download = page.locator(`a[data-download-cta][data-product-code="${code}"]`);
  assert.equal(await download.count(), 1, `${code} must expose exactly one Course Outline download`);
  assert.equal(await download.getAttribute('href'), href, `${code} Course Outline must point at its published PDF`);
  assert.equal(await download.getAttribute('download'), '', `${code} Course Outline must download instead of navigating away`);
  assert.equal((await page.request.get(`${baseURL}${href}`)).status(), 200, `${code} Course Outline PDF must exist in the build`);
}

function lineContrastRatio(foreground: string, background: string) {
  const channels = (color: string) => (color.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const luminance = (color: string) => channels(color)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('detail fixtures render all blocks with Catalog values, accessible FAQs, tracking CTAs, and typed schemas', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const courseResponse = await page.goto(`${baseURL}/services/detail-fixture`);
  assert.equal(courseResponse?.status(), 200, 'course fixture must render');
  assert.equal(await page.locator('h1').count(), 1, 'fixture must contain exactly one H1');
  assert.equal(await page.locator('[data-detail-block]').count(), 13, 'fixture must render the shared 13-block detail sequence');
  assert.equal(await page.locator('h1').innerText(), 'คลาสเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', 'H1 must resolve from the Catalog');
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
  assert.equal(await page.locator('h1').innerText(), 'คลาสเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', 'T2 H1 must resolve from the Catalog');
  // ปันเคาะ 2026-09-05 ค่ำ: T2 = Content + Ads + Warroom (ไม่ใช่ Online-to-Sales Flow เรื่องแชต/คัด Lead)
  assert.equal(
    await page.getByText('ให้เซลล์และทีมการตลาดหาลูกค้าใหม่จากออนไลน์ได้เอง ด้วย Content, Ads และระบบ AI ที่ติดตั้งบนเครื่องบริษัท', { exact: true }).count(),
    1,
    'T2 Hero must state the Content + Ads + Warroom customer job exactly',
  );
  assert.deepEqual(
    await page.locator('[data-why-now-item] > p:last-child').allTextContents(),
    [
      'เซลล์ขายเก่ง แต่รอลูกค้าเดินเข้ามาเอง เพราะไม่มีใครในทีมถนัดทำ Content',
      'โพสต์ไปแล้วเงียบ ไม่รู้ว่าชิ้นไหนควรสร้างตัวตน ชิ้นไหนควรขาย เลยขายทุกโพสต์จนคนเลื่อนผ่าน',
      'ยิงแอดได้แต่คนดู ไม่มีคนทัก เพราะรูปเดียว หลายรูป และคลิปสั้น ใช้โครงเดียวกันหมด',
      'คู่แข่งออกคอนเทนต์เรื่องใหม่ก่อนทุกครั้ง ทีมรู้ทีหลังจากลูกค้าถาม',
      'ทำ Content ได้เป็นพักๆ พอคนที่ทำลาออกหรือยุ่ง ช่องก็หยุด เพราะไม่มีระบบรองรับ',
    ],
    'T2 must mirror the five approved content/ads pain points in order',
  );
  assert.deepEqual(await page.locator('[data-curriculum-step]').evaluateAll((items) => items.map((item) => item.getAttribute('data-step'))), ['mindset', 'funnel', 'produce', 'ads', 'lead-channel', 'warroom'], 'T2 must show the Content → Ads → Warroom journey');
  // ขอบเขตต้องพูดชัดว่าไม่ใช่คลาส Prompt สร้างรูป และไม่มีเรื่องแชต/คัด Lead/CRM ในแกนคลาส
  const t2Body = await page.locator('body').innerText();
  assert.match(t2Body, /ไม่(ได้มา)?สอน Prompt สร้างรูป/, 'T2 must say plainly that it is not an image-prompt course');
  for (const stale of ['First-response Script', 'Qualified Lead Definition', 'Handoff Rule', 'Lead Inbox Tool', 'ตอบแชท 20 สถานการณ์', 'Leak Scorecard']) {
    assert.ok(!t2Body.includes(stale), `T2 must not carry the retired lead-flow artifact "${stale}"`);
  }
  const t2Boundary = await page.locator('[data-journey-section="offer"]').innerText();
  assert.match(t2Boundary, /Content \+ Ads \+ Warroom/, 'T2 offer block must carry the Content + Ads + Warroom framing');
  assert.match(await page.locator('[data-journey-section="fit"]').innerText(), /ไม่เหมาะ.*รับยิง Ads/s, 'T2 must clearly reject an agency engagement');
  assert.match(await page.locator('[data-detail-block="fit"]').innerText(), /ราคาเห็นก่อนทัก/, 'T2 decision section must state that pricing is visible before contact');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “ONLINE SALES” พร้อมจำนวนทีม', { exact: true }).count(), 1, 'T2 must state the live LINE keyword and team-size instruction');
  // WEB-T2-SYSTEM-01: Bonus 08 ขึ้นพร้อม system chapter เท่านั้น — สองก้อนต้องเปิด/ปิดพร้อมกันเสมอ
  const hasSystemChapter = (await page.locator('[data-detail-block="system"]').count()) === 1;
  assert.equal(await page.locator('[data-bonus-value-card]').count(), hasSystemChapter ? 8 : 7, 'T2 must publish Bonus 6 + Certificate (+ Bonus 08 only with the system chapter)');
  assert.equal(await page.locator('form').count(), 0, 'T2 detail page must not include a form');
  assert.equal(await page.locator('[data-hero-activity]').count(), 1, 'T2 Hero must lead with one real workshop activity photo');
  assert.equal(await page.locator('[data-hero-activity] img').getAttribute('loading'), 'eager', 'T2 Hero activity photo must be ready at first glance');
  assert.equal(await page.locator('[data-hero-step]').count(), 3, 'T2 Hero must break the learning journey into three scannable decision cards');
  assert.equal(await page.locator('[data-client-logo]').count(), 20, 'T2 must show every approved public client logo except Singha Park');
  assert.deepEqual(await page.locator('[data-client-logo] img').evaluateAll((images) => images.slice(0, 7).map((image) => image.alt)), ['Nissan', 'FutureSkill', 'มหาวิทยาลัยรามคำแหง', 'สถาบันเทคโนโลยีไทย-ญี่ปุ่น (TNI)', 'V!NG', 'GPX', 'Royal Enfield'], 'T2 must lead its proof wall with Nissan, FutureSkill, the two universities, V!NG, and motorcycle brands');
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
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_proof"] [data-line-cta]').count(), 1, 'course-selection CTA must remain the only LINE action after proof');
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_scope"] [data-line-cta]').count(), 1, 'outline CTA must have one adjacent LINE action');
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_fit"] [data-booking-cta]').count(), 1, 'large-team section must lead to the booking form');
  assert.equal(await page.locator('[data-decision-cta][data-cta-location="after_fit"] [data-line-cta]').count(), 1, 'large-team booking must retain one adjacent LINE action');
  assert.equal(await page.locator('[data-download-cta][data-cta-availability="pending"]').count(), 0, 'T2 must not keep a pending Course Outline placeholder now that the PDF ships');
  await expectOutlineDownload(page, 'T2', '/services/outlines/t2-online-to-sales.pdf');
  assert.equal(await page.locator('[data-cta-location="hero"][data-booking-cta]').count(), 1, 'Hero must expose one Coral booking action');
  assert.equal(await page.locator('[data-cta-location="hero"][data-line-cta]').count(), 1, 'Hero must retain one LINE alternative');
  assert.equal(await page.locator('[data-cta-location="final"][data-booking-cta]').count(), 1, 'final CTA must expose one Coral booking action');
  assert.equal(await page.locator('[data-cta-location="final"][data-line-cta]').count(), 1, 'final CTA must retain one LINE alternative');
  assert.equal(await page.locator('[data-cta-location="hero"][data-cta-intent="suitability"]').count(), 1, 'Hero suitability action must have a distinct analytics intent');
  for (const action of await page.locator('[data-line-cta]').all()) {
    assert.equal(await action.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(6, 199, 85)', 'every CTA that opens LINE must use LINE green');
  }
  for (const action of await page.locator('[data-booking-cta]').all()) {
    assert.equal(await action.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(196, 50, 69)', 'every CTA that opens booking must use the AA-safe Coral action shade');
  }
  for (const location of ['hero', 'final']) {
    const secondaryAction = page.locator(`[data-cta-location="${location}"][data-line-cta]`);
    const style = await secondaryAction.evaluate((element) => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    assert.equal(style.color, 'rgb(7, 43, 78)', `${location} secondary LINE CTA must use the AA-safe navy foreground`);
    assert.ok(lineContrastRatio(style.color, style.background) >= 4.5, `${location} secondary LINE CTA must maintain AA text contrast`);
  }
  const lineActions = page.locator('[data-line-cta]');
  for (const action of await lineActions.all()) assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'all detail actions must use SITE.social.line');
  // WEB-T2-SYSTEM-02: FAQ 4 ข้อเรื่องระบบขึ้นพร้อม system chapter เท่านั้น (ข้อ 4 = ระบบโพสต์ให้ไหม)
  assert.equal(await page.locator('[data-product-faq-button]').count(), (await page.locator('[data-detail-block="system"]').count()) === 1 ? 12 : 8, 'T2 must publish the approved eight FAQs (+4 system FAQs only with the system chapter)');
  assert.equal(await page.locator('[data-proof-activity]').count(), 3, 'T2 proof must lead with three real workshop activity photos');
  const firstActivity = page.locator('[data-proof-activity]').first();
  const firstChatProof = page.locator('[data-proof-quote]').first();
  assert.ok((await firstActivity.boundingBox())!.y < (await firstChatProof.boundingBox())!.y, 'real activity proof must appear before chat evidence');
  for (const activityImage of await page.locator('[data-proof-activity] img').all()) {
    assert.equal(await activityImage.getAttribute('loading'), 'lazy', 'below-the-fold activity proof must not compete with the Hero image');
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

// WEB-T2-SYSTEM-01 — chapter "ระบบที่ทีมได้กลับไป"
// เปิด: ทุกภาพต้องมีป้ายกำกับ + ตาราง delta (Release gate §15) และไม่มี token ค้าง
// ปิด: ห้ามมีคำที่สัญญาระบบหลุดไปที่ส่วนอื่นของหน้า (Release gate ยังไม่ผ่าน = ห้ามสัญญา)
test('T2 system chapter keeps every screenshot labelled with a delta table, and stays fully dark while the flag is off', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/services/online-to-sales`);
  const chapter = page.locator('[data-detail-block="system"]');
  const chapterOn = (await chapter.count()) === 1;
  const body = await page.locator('body').innerText();

  if (chapterOn) {
    const shots = page.locator('figure[data-system-shot], [data-system-room] figure');
    const shotCount = await shots.count();
    assert.ok(shotCount >= 4, 'system chapter must show every room and the walkthrough screenshots');
    for (let index = 0; index < shotCount; index += 1) {
      const shot = shots.nth(index);
      assert.equal(await shot.locator('[data-shot-label]').count(), 1, `screenshot ${index + 1} must carry a visible edition label`);
      assert.ok(await shot.locator('img').getAttribute('alt'), `screenshot ${index + 1} must have alt text`);
    }
    assert.equal(await page.locator('[data-system-metric]').count(), 3, 'system chapter must publish the three owner-facing numbers');
    assert.doesNotMatch(body, /\{\{VALUE_REF\}\}/, 'the value reference must resolve from the Catalog, never leak as a token');
    assert.match(await page.locator('[data-system-value-ref]').innerText(), /^฿[\d,]+$/, 'the system value must render a Catalog price');
    assert.equal(await page.locator('[data-cta-location="system_chapter"] a').count(), 2, 'the chapter must close with exactly two live LINE actions');

    // v2 (packet WEB-T2-SYSTEM-02): the chapter sells the three real rooms, never the v1 desks
    const rooms = page.locator('[data-system-room]');
    assert.equal(await rooms.count(), 3, 'system chapter must present exactly the three rooms of the real app');
    const roomNames = await rooms.locator('h4').allInnerTexts();
    for (const expected of ['Intel Warroom', 'News Desk', 'Content Center']) {
      assert.ok(roomNames.some((name) => name.includes(expected)), `room "${expected}" must appear with the name used in the real app`);
    }
    for (let index = 0; index < 3; index += 1) {
      const flow = await rooms.nth(index).locator('[data-room-flow] li').count();
      assert.equal(flow, 3, `room ${index + 1} must show its three-step flow`);
      assert.equal(await rooms.nth(index).locator('[data-room-pun]').count(), 1, `room ${index + 1} must state what Pun uses it for`);
    }
    const chapterText = await chapter.innerText();
    for (const banned of ['โต๊ะ Lead', 'Campaign Desk', 'โต๊ะ Campaign', 'โต๊ะทบทวนงาน', 'Mac mini', 'Supabase']) {
      assert.ok(!chapterText.includes(banned), `system chapter must not mention "${banned}" — it is not part of the delivered system`);
    }
    // คุณปันสั่ง 2026-09-05: ตัดตาราง "ในภาพ vs รุ่นที่คุณได้รับ" ออกทุกจุด (ลูกค้ารู้สึกโดน downgrade)
    assert.ok(!body.includes('รุ่นที่คุณได้รับ'), 'delta tables must stay off the page');
    // teaser ใต้ Offer: หน้าตาระบบ + ชีวิตหลังใช้ ต้องมาก่อนเนื้อหาขาย
    const teaser = page.locator('[data-system-block="teaser"]');
    assert.equal(await teaser.count(), 1, 'system teaser must render under the offer');
    assert.equal(await teaser.locator('[data-system-teaser-outcomes] li').count(), 3, 'teaser must show the three life-after numbers');
    assert.ok((await teaser.locator('figure[data-system-shot]').count()) >= 3, 'teaser must show the system face with at least three screenshots');
    const offerIdx = body.indexOf('สิ่งที่ทีมสร้างเสร็จในห้อง');
    const teaserIdx = body.indexOf(await teaser.locator('h2').innerText());
    assert.ok(offerIdx > -1 && teaserIdx > offerIdx, 'teaser must sit after the offer stack');
    // Warroom ต้องเด่นในกอง Core (สีส้มโทน Claude)
    assert.equal(await page.locator('[data-offer-core-highlight]').count(), 1, 'the system core item must be highlighted');
    assert.ok((await page.locator('[data-offer-core-highlight]').innerText()).includes('Marketing Warroom OS'), 'the highlighted core item must be the system');
  } else {
    assert.doesNotMatch(body, /\[Placeholder\]/, 'no system placeholder name may leak while the chapter is off');
    assert.doesNotMatch(body, /ระบบพร้อมใช้ก่อนวันเรียน/, 'no system promise may leak while the Release gate is unmet');
    assert.equal(await page.locator('[data-offer-core]').count(), 4, 'the offer must stay at Core 4 while the chapter is off');
  }
  // Launch tripwire: เปิด flag โดยยังไม่เติมตัวเลขจริงของคุณปัน = gate แดง (packet STOP RULE 8 ห้ามเดาตัวเลข)
  assert.doesNotMatch(body, /PUN_METRIC_/, 'fill the real numbers before enabling the system chapter — placeholder metric tokens must never render');
  // Amendment 2026-09-05 (strategy-t2-30-day-conversion-review-loop): Certificate ออกเมื่อจบคลาส ไม่ผูกกับการบ้าน
  for (const stale of ['ผู้เรียนที่ส่งการบ้านครบ', 'ออกให้เมื่อส่งการบ้านครบ', 'ตรวจการบ้าน']) {
    assert.ok(!body.includes(stale), `T2 must not gate the certificate on homework any more: "${stale}"`);
  }
  assert.ok(body.includes('30-Day Conversion Review'), 'Bonus 05 must carry its approved name');
  // Release gate §10 ของ loop: ห้ามสัญญา AI ตรวจงาน / วันตรวจ บน LP จนกว่า pilot ผ่าน
  assert.ok(!/วันพุธและวันอาทิตย์/.test(body), 'review-day promise must stay off the LP until the pilot gate passes');
  await page.close();
});

test('T4 Hero explains the product, price, next action, and real activity at first glance', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${baseURL}/services/advance-ai-automation`);
  const catalog = CATALOG['t4-ai-workflow-pilot-day'];
  assert.equal(response?.status(), 200, 'T4 route must render');
  assert.equal(await page.locator('h1').count(), 1, 'T4 must contain exactly one H1');
  assert.equal(await page.locator('h1').innerText(), catalog.name, 'T4 H1 must resolve from the approved Catalog key');
  assert.equal(
    await page.getByText('สอนทีมคุณให้ใช้ AI Agent ทำงานเอกสารจุกจิกแทนคนเก่ง', { exact: true }).count(),
    1,
    'T4 Hero must state the approved adoption outcome exactly',
  );
  assert.match(await page.locator('[data-hero-price]').innerText(), new RegExp(fmtPrice('t4-ai-workflow-pilot-day')), 'T4 Hero must render its Catalog price at build time');
  assert.match(await page.locator('[data-hero-price]').innerText(), /1 วัน · 1 Workflow/, 'T4 Hero must expose the one-day, one-workflow boundary beside price');
  assert.equal(await page.locator('[data-cta-location="hero"][data-booking-cta]').innerText(), 'จองคิวรับบริการ', 'T4 Hero must lead with the approved booking label');
  assert.equal(await page.locator('[data-cta-location="hero"][data-line-cta]').count(), 1, 'T4 Hero must retain a direct LINE action');
  assert.equal(
    await page.getByText('1 เดือนผมรับอบรมจำกัดแค่ 10 องค์กร สงวนสิทธิให้องค์กรที่ชำระค่าบริการและคิวก่อน', { exact: true }).count(),
    2,
    'the approved capacity note must appear at the Hero and Investment decision points',
  );
  assert.match(await page.locator('[data-hero-activity] img').getAttribute('src') ?? '', /\/lp\/inhouse\/office-session\.jpg$/, 'T4 Hero must show the approved real office session');
  assert.equal(await page.locator('[data-hero-activity] img').getAttribute('loading'), 'eager', 'T4 Hero activity must load eagerly');
  assert.doesNotMatch(await page.content(), /fetch\([^)]*catalog\.json|src=["'][^"']*(?:generated|ai-gen)/i, 'T4 must not fetch price at runtime or use generated people imagery');

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const selector of ['h1', '[data-hero-price]', '[data-cta-location="hero"][data-line-cta]', '[data-hero-activity]']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.y >= 0 && box.y + Math.min(box.height, 72) <= viewport.height, `${selector} must be discoverable in the first ${viewport.width}px viewport`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `T4 must not overflow at ${viewport.width}px`);
  }
  await page.close();
});

test('T4 renders the approved 16-section sales journey with real proof, visible bonuses, and no repeated imagery', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/services/advance-ai-automation`);
  assert.deepEqual(
    await page.locator('[data-t4-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-t4-section'))),
    ['hero', 'offer', 'logos', 'proof', 'why-now', 'spotlight', 'curriculum', 'whats-new', 'take-home', 'bonus', 'why-me', 'fit', 'instructor', 'investment', 'faq', 'final'],
    'T4 must preserve the approved decision journey in order',
  );
  assert.equal(await page.locator('[data-offer-core]').count(), 4, 'T4 Offer must expose four core deliverables');
  assert.equal(await page.locator('[data-offer-bonus]').count(), 7, 'T4 Offer must expose Bonus 6 + Certificate');
  assert.equal(await page.locator('[data-offer-bonus] a').count(), 0, 'pending bonus materials must not expose broken download links');
  assert.equal(await page.locator('[data-client-logo]').count(), 20, 'T4 must show every approved client logo except Singha Park');
  assert.equal(await page.locator('[data-client-logo] img').first().evaluate((image) => getComputedStyle(image).filter), 'none', 'T4 client logos must retain full colour');
  assert.equal(await page.locator('[data-proof-activity]').count(), 8, 'T4 must lead proof with eight real activity photographs');
  assert.equal(await page.locator('[data-proof-quote]').count(), 3, 'T4 must pull three customer quotes into readable proof cards');
  assert.equal(await page.locator('[data-product-testimonial]').count(), 5, 'T4 must retain five original testimonial screenshots');
  const proofSources = await page.locator('[data-proof-activity] img, [data-proof-quote] img, [data-product-testimonial] img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  assert.equal(new Set(proofSources).size, proofSources.length, 'T4 proof must not repeat the same photograph or screenshot');
  assert.ok(await page.locator('main img:not([data-logo-image])').count() >= 12, 'T4 must use at least twelve non-logo proof and activity images');
  for (const image of await page.locator('[data-proof-activity] img').all()) {
    assert.equal(await image.getAttribute('loading'), 'lazy', 'below-the-fold proof must remain lazy-loaded');
    assert.equal(await image.evaluate((element) => getComputedStyle(element).objectFit), 'cover', 'activity proof must use photographic cover treatment');
  }
  for (const caption of await page.locator('[data-proof-caption]').all()) {
    const [captionBox, cardBox] = await Promise.all([caption.boundingBox(), caption.locator('xpath=..').boundingBox()]);
    assert.ok(captionBox && cardBox && captionBox.height / cardBox.height <= 0.25, 'proof captions must occupy no more than 25% of their card');
  }
  await page.close();
});

test('T4 makes the adoption boundary, curriculum, decision CTAs, FAQ, and LINE path explicit', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/services/advance-ai-automation`);
  assert.equal(await page.locator('[data-why-now-item]').count(), 4, 'T4 must answer the four approved adoption pressures');
  assert.equal(await page.locator('[data-curriculum-step]').count(), 5, 'T4 curriculum must walk through five adoption steps');
  assert.deepEqual(
    await page.locator('[data-curriculum-step]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-step'))),
    ['choose', 'map', 'build', 'guardrail', 'adopt'],
    'T4 curriculum must follow Choose → Map → Build → Guardrail → Adopt',
  );
  const text = await page.locator('main').innerText();
  for (const boundary of ['1 Workflow', 'AI Agent Working Prototype', 'Data Safety', 'Human Review', '30-Day Adoption Plan']) {
    assert.match(text, new RegExp(boundary), `T4 must publish ${boundary}`);
  }
  assert.match(await page.locator('[data-t4-section="fit"]').innerText(), /ไม่ได้รับประกันว่าจะลดจำนวนคนได้ทันที/, 'T4 must reject an immediate headcount-reduction guarantee');
  assert.match(text, /ให้ผมเข้าไปวางระบบให้ใน C1/, 'T4 must route done-for-you follow-up work to C1');
  assert.doesNotMatch(text, /\bI1\b/, 'T4 must not mention the closed I1 service');
  assert.deepEqual(
    await page.locator('[data-decision-cta]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cta-location'))),
    ['after_proof', 'after_scope', 'after_fit'],
    'T4 must restore the three contextual decision CTA zones',
  );
  assert.ok(await page.locator('[data-line-cta]').count() >= 7, 'T4 must keep a LINE action available at seven or more decision points');
  for (const action of await page.locator('[data-line-cta]').all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every T4 LINE action must use SITE.social.line');
    assert.equal(await action.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(6, 199, 85)', 'every T4 LINE action must use LINE green');
    assert.ok(await action.getAttribute('aria-label'), 'every T4 LINE action must have an accessible label');
  }
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'T4 must restore eight decision FAQs');
  assert.equal(await page.locator('[data-spotlight-module]').count(), 2, 'T4 must present the two approved Spotlight modules');
  assert.deepEqual(await page.locator('[data-spotlight-module] h3').allTextContents(), ['AI Agent Mindset for Business Use', 'AI Data Engineering for Business Use'], 'Spotlight modules must use the approved titles');
  assert.equal(await page.locator('[data-whats-new-column]').count(), 2, 'T4 must contrast what is new against the evergreen core');
  assert.equal(await page.locator('[data-bonus-value-card]').count(), 7, 'T4 must show Bonus 6 + Certificate');
  assert.equal(await page.locator('[data-bonus-total]').innerText(), '฿19,700', 'T4 bonus total must equal the approved sum');
  assert.equal(await page.locator('[data-why-me-item]').count(), 6, 'T4 must answer why-learn-with-Pun with six points');
  assert.equal(await page.locator('[data-instructor-angle]').count(), 4, 'T4 instructor profile must show four perspectives');
  assert.ok((await page.locator('[data-instructor-credentials] li').count()) >= 6, 'T4 instructor profile must list credentials');
  assert.equal(await page.locator('[data-cta-location="final"] img[alt*="QR"]').count(), 1, 'T4 final CTA must include the LINE QR code');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “AI WORKFLOW” พร้อมจำนวนทีม', { exact: true }).count(), 1, 'T4 must state the live LINE keyword');
  await page.close();
});

test('T1 detail page presents the approved sales psychology customer job and five-stage AI Coach journey', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${baseURL}/services/t1-sales-skills`);
  const catalog = CATALOG['inhouse-a'];
  assert.equal(response?.status(), 200, 'T1 route must render');
  assert.equal(await page.locator('h1').count(), 1, 'T1 must contain exactly one H1');
  assert.equal(await page.locator('h1').innerText(), catalog.name, 'T1 H1 must resolve from Catalog inhouse-a');
  assert.match(await page.locator('[data-hero-price]').innerText(), /1 วัน · ดีลจริงของทีม/, 'T1 Hero must expose the one-day delivery boundary');
  assert.match(await page.locator('[data-hero-price]').innerText(), new RegExp(fmtPrice('inhouse-a')), 'T1 price must resolve from Catalog');
  assert.equal(
    await page.getByText('เข้าใจเหตุผลซื้อ ถามและต่อรองได้ดีขึ้น ซ้อมดีลกับ AI Agent และ Follow-up โดยไม่รีบลดราคา', { exact: true }).count(),
    1,
    'T1 Hero must state the approved customer job exactly',
  );
  assert.deepEqual(
    await page.locator('[data-curriculum-step]').evaluateAll((items) => items.map((item) => item.getAttribute('data-step'))),
    ['decision', 'ask', 'defend', 'rehearse', 'follow-up'],
    'T1 must render the approved Decision-to-Follow-up journey in order',
  );
  assert.deepEqual(
    await page.locator('[data-curriculum-output]').allTextContents(),
    ['Customer Decision Map', 'Question Playbook', 'Objection & Price-defense Library', 'AI Sales Coach Setup + Manager Coaching Rubric', 'Follow-up Cadence + 14-Day Sales Practice Plan'],
    'each T1 curriculum stage must publish its approved customer-facing output',
  );
  const heroText = await page.locator('h1').locator('xpath=ancestor::section').innerText();
  assert.doesNotMatch(heroText, /\b(?:Content|Ads)\b/i, 'T1 Hero must not promise Content or Ads');
  assert.match(heroText, /อ่านสินค้า ข้อโต้แย้ง และเคสที่ทีมอยากซ้อม/, 'T1 Hero must explain the preparation boundary');
  const ebookCta = page.locator('[data-cta-location="hero"][data-cta-intent="lead_magnet"]');
  assert.equal(await ebookCta.count(), 1, 'T1 Hero must expose one lead-magnet CTA');
  assert.equal(await ebookCta.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'T1 E-Book CTA must use SITE.social.line');
  assert.equal(await ebookCta.getAttribute('data-cta-keyword'), 'SALES PSYCHOLOGY', 'T1 E-Book CTA must carry the SALES PSYCHOLOGY keyword');
  assert.match(await ebookCta.innerText(), /E-Book.*หยุดหาเซลล์ผิดคน/, 'T1 lead magnet must name the real E-Book');
  const t2Link = page.locator('a[href="/services/online-to-sales"]');
  assert.equal(await t2Link.count(), 1, 'T1 must offer one contextual canonical link to T2');
  assert.match(await t2Link.innerText(), /T2|ออนไลน์|Content/, 'T1 related link must explain the distinct T2 journey');
  assert.equal(await page.getByText('เลือกหนึ่งดีลที่ทีมอยากซ้อมก่อนวันอบรม', { exact: true }).count(), 1, 'T1 scope CTA must keep its workshop-case prompt');
  assert.equal(await page.getByText('เฉลี่ย ฿1,745 ต่อคน เมื่อเข้าอบรม 20 คน', { exact: true }).count(), 1, 'T1 per-head price must derive from the Catalog investment');
  assert.equal(await page.getByText('สแกน QR แล้วพิมพ์คำว่า “SALES PSYCHOLOGY” พร้อมจำนวนทีม', { exact: true }).count(), 1, 'T1 final CTA must keep the approved LINE keyword instruction');
  const psychologyFaq = page.getByRole('button', { name: 'จิตวิทยาการขายในคลาสหมายถึงการอ่านใจหรือควบคุมลูกค้าหรือเปล่า?' });
  assert.equal(await psychologyFaq.count(), 1, 'T1 must publish an ethical psychology FAQ');
  await psychologyFaq.click();
  assert.match(await page.locator('#t1-faq-2').innerText(), /เคารพสิทธิ์ตัดสินใจของลูกค้า/, 'ethical psychology FAQ must reject manipulation');
  const boundaryText = await page.locator('main').innerText();
  assert.match(boundaryText, /Human Review/, 'AI Sales Coach must require human review');
  assert.match(boundaryText, /การคุยกับลูกค้า.*อยู่กับเซลล์/, 'AI Sales Coach must not imply autonomous customer contact');
  assert.match(boundaryText, /ถ้าอยากให้ผมเข้าไปวางระบบให้ทีม.*ให้เริ่ม C1/s, 'T1 must route done-for-you system work to C1 instead of promising it inside the coach');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'T1 must publish the approved eight FAQs');
  assert.equal(await page.locator('form').count(), 0, 'T1 detail page must not include a form');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'T1 must retain exactly one global Floating LINE CTA');
  const html = await page.content();
  assert.doesNotMatch(html, /Agentic AI Transformation/, 'T1 must keep its public category Sales-first rather than using retired generic AI Transformation positioning');
  const courseSchema = schemas(html).find((item) => item['@type'] === 'Course');
  assert.equal(courseSchema?.name, catalog.name, 'T1 Course schema name must resolve from Catalog inhouse-a');
  assert.equal(courseSchema?.courseCode, 'T1', 'T1 Course schema must identify the T1 product code');
  assert.equal(courseSchema?.url, 'https://punnattapatch.com/services/t1-sales-skills', 'T1 Course schema must use the canonical route');
  assert.equal(courseSchema?.timeRequired, catalog.duration, 'T1 Course schema duration must resolve from Catalog inhouse-a');
  assert.ok(schemas(html).some((item) => item['@type'] === 'FAQPage'), 'T1 must expose FAQPage schema');
  assert.ok(schemas(html).some((item) => item['@type'] === 'BreadcrumbList'), 'T1 must expose BreadcrumbList schema');
  assert.doesNotMatch(html, /Journey\s*\/\s*FFAB|Pre-call\s*\/\s*Questions|Context\s*\/\s*Follow-up|Objection\s*\/\s*Practice/, 'T1 must not retain superseded Journey/FFAB curriculum labels');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `T1 must not overflow at ${viewport.width}px`);
  }
  await page.close();
});

test('T1 and T3 align their 5A offer copy, metadata, and visible practical bonuses', async ({ browser }) => {
  const cases = [
    {
      route: '/services/t1-sales-skills',
      coreOffer: 'เอาดีลจริงของทีมมาสร้าง Playbook การคุย ต่อรอง และ Follow-up',
      offerBlock: 'ให้ทีมขายเอาดีลจริงมาฝึกตั้งคำถาม รับมือข้อโต้แย้ง ต่อรองโดยไม่รีบลดราคา',
      description: 'เข้าใจเหตุผลซื้อ ถามและต่อรองได้ดีขึ้น ซ้อมดีลกับ AI Agent และ Follow-up โดยไม่รีบลดราคา',
    },
    {
      route: '/services/t3-sales-back-office',
      coreOffer: 'เอารายงานที่ทีมใช้อยู่มาจัดเป็นภาษากลางและกติกาเดียวกัน',
      offerBlock: 'ให้ทีมจัดคำเรียกสถานะดีลและรูปแบบ Report เป็นภาษากลาง',
      description: 'ทีมรายงานภาษาเดียวกัน ผู้จัดการเห็นดีลค้าง งานที่ต้องตาม และจุดที่ต้องเข้าไปช่วย',
    },
  ] as const;

  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const response = await page.goto(`${baseURL}${item.route}`);
    assert.equal(response?.status(), 200, `${item.route} must render`);
    assert.match(await page.locator('[data-journey-section="offer"]').innerText(), new RegExp(item.coreOffer), `${item.route} must show the approved Core Offer`);
    assert.match(await page.locator('[data-detail-block="take-home"]').innerText(), new RegExp(item.offerBlock), `${item.route} must show the approved Offer block`);
    assert.equal(await page.locator('[data-bonus-value-card]').count(), 7, `${item.route} must show Bonus 6 + Certificate`);
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), item.description, `${item.route} metadata must match its approved customer job`);
    assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), item.description, `${item.route} OG description must match its metadata`);
    await page.close();
  }
});

test('T1 remediation keeps evidence, location-specific LINE actions, and mobile CTA clearance faithful', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseURL}/services/t1-sales-skills`);

  const hfcProof = page.locator('[data-proof-id="hfc-journey"]');
  assert.equal(await hfcProof.count(), 1, 'T1 must retain one approved HFC training-to-consult proof');
  assert.equal(await hfcProof.locator('figcaption').innerText(), 'เริ่มจากงาน Training แล้วต่อยอดเป็น Consult 3 วัน เพื่อจัด Company Knowledge, Dashboard และ Roadmap ของงานขายให้เข้ากับบริบทธุรกิจจริง', 'HFC journey proof caption must remain verbatim');
  assert.doesNotMatch(await page.locator('[data-detail-block="proof"]').innerText(), /กลุ่มเล็ก/, 'T1 proof must not misrepresent a large workshop as a small group');

  const expectedBookingActions = [
    ['after_scope', 'inhouse_enquiry'],
    ['after_investment', 'quote'],
    ['final', 'course_planning'],
  ] as const;
  for (const [location, intent] of expectedBookingActions) {
    const action = page.locator(`[data-product-code="T1"][data-cta-location="${location}"][data-booking-cta]`);
    assert.equal(await action.count(), 1, `${location} must render one booking action`);
    assert.equal(await action.innerText(), 'จองคิวรับบริการ', `${location} must use the approved booking label`);
    assert.equal(await action.getAttribute('href'), `/booking?package=T1&intent=${intent}`, `${location} booking action must carry T1 attribution`);
    assert.equal(await action.getAttribute('data-cta-intent'), intent, `${location} action must retain its analytics intent`);
  }
  const expectedLineActions = [
    ['after_scope', 'รับ E-Book ก่อนตัดสินใจ', 'lead_magnet'],
    ['after_investment', 'ทัก LINE เล่าสถานการณ์ที่ทีมติด', 'course_selection'],
    ['final', 'รับ E-Book หยุดหาเซลล์ผิดคน', 'lead_magnet'],
  ] as const;
  for (const [location, label, intent] of expectedLineActions) {
    const action = page.locator(`[data-product-code="T1"][data-cta-location="${location}"][data-line-cta]`);
    assert.equal(await action.innerText(), label, `${location} must retain its approved LINE alternative`);
    assert.equal(await action.getAttribute('data-cta-intent'), intent, `${location} LINE action must retain its analytics intent`);
  }
  const allT1LineActions = page.locator('[data-product-code="T1"][data-line-cta]');
  assert.deepEqual(await allT1LineActions.evaluateAll((actions) => actions.map((action) => action.getAttribute('data-cta-location'))), ['hero', 'offer', 'after_proof', 'after_scope', 'why_me', 'after_fit', 'after_investment', 'final'], 'T1 must keep a LINE action across the full journey');
  await expectOutlineDownload(page, 'T1', '/services/outlines/t1-sales-psychology-ai-agent.pdf');
  for (const action of await allT1LineActions.all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every T1 CTA must open the real SITE.social.line destination');
    assert.equal(await action.getAttribute('data-cta-keyword'), 'SALES PSYCHOLOGY', 'every T1 CTA must carry the approved lead-magnet keyword');
  }
  assert.equal(await page.locator('[data-product-code="T1"][data-booking-cta]').count(), 6, 'T1 must provide six Coral booking actions across the journey');

  const finalQr = page.locator('[data-final-line-qr]');
  assert.equal(await finalQr.count(), 1, 'desktop final CTA must contain a real LINE QR');
  assert.equal(await finalQr.isVisible(), true, 'desktop final QR must be visible when scan copy is visible');

  const mainText = await page.locator('#main').innerText();
  assert.doesNotMatch(mainText, /(?:ยอดขายร้อยล้าน|40\s*(?:→|to)\s*100M)/i, 'T1 must not publish unsupported hundred-million authority claims');
  assert.doesNotMatch(mainText, /Catalog/, 'T1 must not expose Catalog authoring placeholders to customers');
  assert.doesNotMatch(mainText, /(?:ตามที่ระบุใน Catalog|ตามเงื่อนไขใน Catalog)/, 'T1 must not expose internal Catalog placeholders to customers');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await finalQr.isVisible(), false, 'mobile must not show a scan instruction without an inline QR');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “SALES PSYCHOLOGY” พร้อมจำนวนทีม', { exact: true }).isVisible(), true, 'mobile final CTA must give a tappable LINE instruction');
  for (const action of await page.locator('[data-product-code="T1"][data-contact-cta]').all()) {
    await action.scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);
    const actionBox = await action.boundingBox();
    const floatingBox = await page.locator('[data-floating-line]').boundingBox();
    if (actionBox && floatingBox) {
      const intersects = actionBox.x < floatingBox.x + floatingBox.width
        && actionBox.x + actionBox.width > floatingBox.x
        && actionBox.y < floatingBox.y + floatingBox.height
        && actionBox.y + actionBox.height > floatingBox.y;
      assert.equal(intersects, false, `floating LINE control must not obstruct ${await action.getAttribute('data-cta-location')} at 390px`);
    }
  }
  await page.close();
});

test('C1 daily consulting is one day-rate service with six selectable topics, two per day', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const catalog = CATALOG['daily-sales-consulting'];
  const response = await page.goto(`${baseURL}/services/daily-consulting`);

  assert.equal(response?.status(), 200, 'C1 canonical route must render');
  assert.equal(await page.locator('h1').count(), 1, 'C1 must contain exactly one H1');
  // 2026-09-30 ปันสั่ง: H1 พาดตัวเลข (ตัวอย่างที่คำนวณจากสมมติฐานบนหน้า) · ชื่อสินค้าจาก Catalog ย้ายไปหัว Offer ใต้ hero
  assert.match(await page.locator('h1').innerText(), /^งานซ้ำของทีมขาย 8 คน กินเงินเดือนปีละ 450,000 บาท$/, 'C1 H1 must lead with the computed example number');
  assert.equal(await page.locator('#c1-offer-heading').innerText(), catalog.name, 'C1 offer heading must resolve from the Catalog');
  assert.deepEqual(await page.locator('[data-detail-block]').evaluateAll((blocks) => blocks.slice(0, 2).map((block) => block.getAttribute('data-detail-block'))), ['hero', 'investment'], 'C1 offer must sit directly under the hero');
  const leak = page.locator('[data-leak-hero]');
  assert.equal(await leak.locator('[data-leak-row]').count(), 3, 'C1 hero must compare 1 month, 6 months and 1 year');
  assert.match(await leak.locator('[data-leak-gap]').innerText(), /1,452 ชั่วโมง/, 'C1 default gap must match the stated assumptions');
  assert.match(await leak.innerText(), /ไม่ใช่ผลที่รับประกัน/, 'C1 must label the AI share as an assumption, not a promise');
  await leak.locator('[data-leak-calc] summary').click();
  await leak.locator('[data-leak-input="team"]').fill('16');
  assert.match(await leak.locator('[data-leak-gap]').innerText(), /2,904 ชั่วโมง/, 'C1 calculator must recompute from the buyer\'s own numbers');
  assert.equal(await page.getByText(catalog.duration, { exact: true }).count(), 1, 'C1 duration must resolve from the Catalog');
  assert.equal(await page.getByText(fmtPrice('daily-sales-consulting'), { exact: true }).count(), 1, 'C1 price must resolve from the Catalog');

  const chooser = page.locator('[data-symptom-chooser]');
  const chooserActions = chooser.locator('a[data-track-chooser]');
  assert.equal(await chooserActions.count(), 6, 'C1 must offer one symptom-first chooser action per topic');
  const trackCards = page.locator('[data-scope-item][data-primary-outcome-track]');
  assert.equal(await trackCards.count(), 6, 'C1 must render exactly six topic cards');
  const targets = await chooserActions.evaluateAll((actions) => actions.map((action) => action.getAttribute('href')));
  assert.deepEqual(targets, ['#c1-topic-hiring', '#c1-topic-comp', '#c1-topic-lead', '#c1-topic-sales', '#c1-topic-docs', '#c1-topic-content'], 'C1 chooser targets must map to stable topic ids');
  await chooserActions.nth(3).click();
  assert.equal(new URL(page.url()).hash, '#c1-topic-sales', 'choosing a symptom must update the URL hash');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'c1-topic-sales', 'choosing a symptom must move focus to the chosen track');
  await page.waitForFunction(() => {
    const target = document.getElementById('c1-topic-sales');
    if (!target) return false;
    const box = target.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 0;
  });
  const selectedTrackBox = await page.locator('#c1-topic-sales').boundingBox();
  assert.ok(selectedTrackBox && selectedTrackBox.y < 900 && selectedTrackBox.y + selectedTrackBox.height > 0, 'chosen track must scroll into the viewport');

  assert.equal(await page.locator('[data-detail-block="investment"]').count(), 1, 'C1 must have one investment block');
  assert.equal(await trackCards.locator('[data-contact-cta], [data-track-price], [data-track-checkout]').count(), 0, 'individual C1 tracks must not sell separately');
  const scopeText = await page.locator('[data-detail-block="scope"]').innerText();
  assert.match(scopeText, /เลือกเรื่องนี้เมื่อ/, 'C1 topics must use symptom language, not course labels');
  assert.match(scopeText, /วันแรกทำอะไร/, 'C1 topics must say what happens on day one');
  assert.match(scopeText, /ใช้ได้เมื่อ/, 'C1 topics must state a usable-when check');
  const boundaryText = await page.locator('[data-detail-block="boundary"]').innerText();
  assert.match(boundaryText, /ไม่เกิน 2 เรื่อง/, 'C1 must cap one day at two topics');
  assert.match(boundaryText, /LINE ให้ 7 วัน/, 'C1 one-day format must state the 7-day LINE fix window');
  assert.match(boundaryText, new RegExp(`ครบรอบ 2 วัน ฿${(catalog.amount * 2).toLocaleString('en-US')}`), 'C1 full round must be priced at two Catalog day rates');
  assert.match(boundaryText, /ภายใน 14 วัน.*30 วัน/s, 'C1 full round must state day two within 14 days and 30-day care');
  const chatTopic = page.locator('#c1-topic-sales');
  assert.match(await chatTopic.innerText(), /บอกลูกค้าตั้งแต่ประโยคแรกว่าเป็น AI/, 'chat topic must disclose the AI to customers');
  assert.equal(await page.locator('a[href="/services/dashboard-build"]').count(), 0, 'C1 must not link the closed I1 route');

  assert.equal(await page.locator('[data-proof-id="c1-scenery-room"]').count(), 1, 'C1 must show inspectable Scenery work proof');
  assert.equal(await page.locator('[data-proof-id="c1-hfc-journey"]').count(), 1, 'C1 must show the approved HFC training-to-consult proof');
  assert.equal(await page.locator('[data-proof-id="c1-system-receipt"]').count(), 0, 'C1 must not repeat the Command Center as a small proof card');
  const consultSystems = page.locator('[data-consult-proof-systems]');
  assert.equal(await consultSystems.count(), 1, 'C1 must reuse the five-system proof experience in a consult-specific context');
  assert.equal(await consultSystems.locator('[data-proof-system-card]').count(), 5, 'C1 must show all five systems that Pun uses in the business');
  assert.equal(await consultSystems.locator('[data-consult-outcome]').count(), 5, 'C1 must make five owner-life outcomes glanceable before the full evidence');
  assert.deepEqual(await consultSystems.locator('[data-consult-outcome]').evaluateAll((items) => items.map((item) => item.getAttribute('href'))), [
    '#proof-system-command-center',
    '#proof-system-doc-bot',
    '#proof-system-night-scout',
    '#proof-system-line-agent',
    '#proof-system-news-desk',
  ], 'each outcome preview must map directly to its full system receipt');
  assert.match(await consultSystems.innerText(), /วันแรกไม่ได้สร้างทั้งห้าระบบ/, 'C1 must not imply that one consulting day includes five production builds');
  assert.match(await consultSystems.innerText(), /เลือก 2 เรื่องเป็นจุดเริ่ม.*ระบบพื้นฐาน/s, 'C1 must connect the aspirational proof back to the two-topic day');
  assert.equal(await consultSystems.locator('img').count(), 10, 'C1 must render every approved redacted receipt from the five-system SSOT');
  assert.equal(await consultSystems.locator('img').evaluateAll((images) => images.every((image) => image.getAttribute('loading') === 'lazy')), true, 'the below-fold five-system proof must stay lazy-loaded');
  assert.equal(await page.getByText('“ปันคุยง่าย เข้าใจสิ่งที่ CEO ต้องการ และหาทางออกให้ได้”', { exact: true }).count(), 1, 'C1 must use the approved bounded client quote');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'C1 must publish the approved eight FAQs');
  assert.equal(await page.locator('form').count(), 0, 'C1 detail page must not include a form');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'C1 must retain exactly one global Floating LINE CTA');
  const bookingCtas = page.locator('[data-product-code="C1"][data-booking-cta]');
  assert.equal(await bookingCtas.count(), 4, 'C1 must provide one booking action at each main decision point');
  assert.equal(await bookingCtas.evaluateAll((actions) => actions.every((action) => action.textContent?.trim() === 'จองคิวรับบริการ')), true, 'every C1 booking action must use the approved label');
  for (const action of await bookingCtas.all()) {
    assert.match(await action.getAttribute('href') ?? '', /^\/booking\?package=C1&intent=/, 'every C1 booking action must preserve product attribution');
    assert.equal(await action.evaluate((element) => getComputedStyle(element).backgroundColor), 'rgb(196, 50, 69)', 'every C1 booking action must use the AA-safe Coral action shade');
  }
  const lineCtas = page.locator('[data-product-code="C1"][data-line-cta]');
  assert.equal(await lineCtas.count(), 5, 'C1 must retain four LINE alternatives plus one system-proof fit CTA');
  assert.deepEqual(await lineCtas.evaluateAll((actions) => actions.map((action) => [action.getAttribute('data-cta-location'), action.getAttribute('data-cta-label')])), [
    ['hero', 'ทัก LINE ให้ผมช่วยดูตัวเลข'],
    ['after_investment', 'ทัก LINE ให้ผมช่วยเลือกเรื่อง'],
    ['after_systems', 'ทัก LINE ให้ผมช่วยเลือกจุดเริ่ม'],
    ['after_scope', 'ทัก LINE ส่งรูป Report'],
    ['final', 'ทัก LINE เล่าอาการสั้น ๆ'],
  ], 'C1 CTA journey must preserve every approved LINE alternative');
  for (const action of await lineCtas.all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every C1 CTA must open SITE.social.line');
    assert.equal(await action.getAttribute('data-cta-keyword'), 'CONSULT', 'every C1 CTA must carry the CONSULT keyword');
  }
  const html = await page.content();
  assert.doesNotMatch(html, /ยอดขายร้อยล้าน|ตามระยะเวลาจาก Catalog|Agentic AI Transformation|ไม่เติมตัวเลขผลลัพธ์|ไม่อ้างผลลัพธ์ทางการเงิน|Asset notes|Rendering note/, 'C1 must not expose stale, generic, or internal authoring-guard copy');
  const serviceSchema = schemas(html).find((item) => item['@type'] === 'Service');
  assert.equal(serviceSchema?.name, catalog.name, 'C1 Service schema name must resolve from Catalog');
  assert.equal(serviceSchema?.url, 'https://punnattapatch.com/services/daily-consulting', 'C1 Service schema must use canonical route');
  assert.equal(serviceSchema?.serviceType, 'Sales Consulting', 'C1 Service schema must not claim implementation work');
  const faqSchema = schemas(html).find((item) => item['@type'] === 'FAQPage');
  assert.deepEqual(
    faqSchema?.mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => [item.name, item.acceptedAnswer.text]),
    await page.locator('[data-product-faq-button]').evaluateAll((buttons) => buttons.map((button) => [button.querySelector('span')?.textContent?.trim(), document.getElementById(button.getAttribute('aria-controls') || '')?.textContent?.trim()])),
    'C1 FAQPage schema must exactly match the eight visible FAQ questions and answers',
  );
  const breadcrumbSchema = schemas(html).find((item) => item['@type'] === 'BreadcrumbList');
  assert.deepEqual(
    breadcrumbSchema?.itemListElement.map((item: { name: string; item: string }) => [item.name, item.item]),
    [['บริการ', 'https://punnattapatch.com/services'], [catalog.name, 'https://punnattapatch.com/services/daily-consulting']],
    'C1 BreadcrumbList must contain the exact service and canonical-page items',
  );
  const finalQr = page.locator('[data-final-line-qr]');
  await finalQr.scrollIntoViewIfNeeded();
  assert.equal(await finalQr.isVisible(), true, 'desktop C1 final CTA must show the real LINE QR');
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('[data-final-line-qr] img');
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  assert.ok(await finalQr.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth > 0), 'desktop C1 final QR must finish loading');
  for (const image of await page.locator('[data-detail-block="proof"] img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element: HTMLImageElement) => {
      if (element.complete) return element.naturalWidth;
      await new Promise<void>((resolve) => element.addEventListener('load', () => resolve(), { once: true }));
      return element.naturalWidth;
    });
    assert.ok(await image.getAttribute('alt'), 'every C1 proof image must have descriptive alt text');
    assert.ok(await image.getAttribute('width'), 'every C1 proof image must declare width');
    assert.ok(await image.getAttribute('height'), 'every C1 proof image must declare height');
    assert.ok(await image.evaluate((element: HTMLImageElement) => element.naturalWidth > 0), 'every C1 proof image must load before acceptance');
  }
  for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width, `C1 must not overflow at ${viewport.width}px`);
    for (const action of await page.locator('[data-product-code="C1"][data-contact-cta]').all()) {
      await action.scrollIntoViewIfNeeded();
      const actionBox = await action.boundingBox();
      const floatingBox = await page.locator('[data-floating-line]').boundingBox();
      if (actionBox && floatingBox) {
        const intersects = actionBox.x < floatingBox.x + floatingBox.width
          && actionBox.x + actionBox.width > floatingBox.x
          && actionBox.y < floatingBox.y + floatingBox.height
          && actionBox.y + actionBox.height > floatingBox.y;
        assert.equal(intersects, false, `floating LINE control must not obstruct C1 ${await action.getAttribute('data-cta-location')} CTA at ${viewport.width}px`);
      }
    }
  }
  assert.equal(await finalQr.isVisible(), false, 'mobile C1 must hide the desktop-only scan QR');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “CONSULT” พร้อมอาการที่ทีมกำลังติด', { exact: true }).isVisible(), true, 'mobile C1 must show the tap instruction');
  await page.close();
});

test('T3 teaches the team to design a sales back office prototype and points done-for-you work to C1', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const catalog = CATALOG['ai-workshop-advance'];
  const response = await page.goto(`${baseURL}/services/t3-sales-back-office`);

  assert.equal(response?.status(), 200, 'T3 canonical route must render');
  assert.equal(await page.locator('h1').count(), 1, 'T3 must contain exactly one H1');
  assert.equal(await page.locator('h1').innerText(), catalog.name, 'T3 H1 must resolve from the Catalog');
  assert.match(await page.locator('[data-hero-price]').innerText(), /1 วัน · Report-to-Prototype/, 'T3 Hero must state the workshop-to-prototype boundary');
  assert.match(await page.locator('[data-hero-price]').innerText(), new RegExp(fmtPrice('ai-workshop-advance')), 'T3 price must resolve from the Catalog');

  const scope = page.locator('[data-detail-block="scope"]');
  const stages = scope.locator('[data-curriculum-step]');
  assert.equal(await stages.count(), 5, 'T3 must render the five approved workshop stages');
  assert.deepEqual(await stages.evaluateAll((items) => items.map((item) => item.getAttribute('data-step'))), ['stage', 'report', 'warn', 'review', 'prototype'], 'T3 curriculum must preserve Stage → Report → Warn → Review → Prototype order');
  assert.match(await scope.innerText(), /T3 = ทีมคุณเรียนวิธีวางและทำ Prototype.*C1 = ผมเข้าไปวางระบบให้/s, 'T3/C1 distinction must sit next to the curriculum');
  const investmentText = await page.locator('[data-detail-block="investment"]').innerText();
  assert.match(investmentText, /T3 = ทีมคุณเรียนวิธีวางและทำ Prototype.*C1 = ผมเข้าไปวางระบบให้/s, 'T3/C1 distinction must repeat next to the price');
  assert.equal(await page.locator('a[href="/services/dashboard-build"]').count(), 0, 'T3 must not link the closed I1 route');
  assert.ok(await page.locator('a[href="/services/daily-consulting"]').count() >= 1, 'T3 must point done-for-you work to C1');
  assert.match(await page.locator('main').innerText(), /T3 คือทีมคุณเรียนวิธีวางและทำ Prototype เอง/, 'T3 must promise learning and prototype work only');
  assert.deepEqual(await stages.locator('[data-curriculum-output]').allInnerTexts(), ['Stage/Data Dictionary', 'Single-input Reporting Standard', 'Warning Rules + Manager View', 'Weekly Ritual + Manager Coaching Flow', 'Dashboard Prototype + AI Summary Helper'], 'T3 curriculum outputs must stop at workshop artifacts and a prototype');
  assert.doesNotMatch(await page.locator('[data-detail-block="take-home"]').innerText(), /(?:UAT sign-off|Production handover|Working system)/, 'T3 take-home stack must not include production delivery artifacts');

  assert.ok(await page.locator('[data-detail-block="proof"] img').count() >= 10, 'T3 must show report, dashboard, client, workshop, and testimonial receipts');
  assert.equal(await page.getByText('อาจารย์ปันสอนถูกใจทีมงานมากครับ', { exact: true }).count(), 1, 'T3 must retain the exact approved workshop receipt');
  assert.equal(await page.locator('[data-product-faq-button]').count(), 8, 'T3 must publish the approved eight FAQs');
  assert.equal(await page.locator('form').count(), 0, 'T3 detail page must not include a form');
  assert.equal(await page.locator('[data-floating-line]').count(), 1, 'T3 must retain exactly one global Floating LINE CTA');
  const bookingCtas = page.locator('[data-product-code="T3"][data-booking-cta]');
  assert.equal(await bookingCtas.count(), 6, 'T3 must provide six Coral booking actions');
  assert.equal(await bookingCtas.evaluateAll((actions) => actions.every((action) => action.textContent?.trim() === 'จองคิวรับบริการ')), true, 'every T3 booking action must use the approved label');
  for (const action of await bookingCtas.all()) {
    assert.match(await action.getAttribute('href') ?? '', /^\/booking\?package=T3&intent=/, 'every T3 booking action must preserve product attribution');
  }
  const lineCtas = page.locator('[data-product-code="T3"][data-line-cta]');
  assert.deepEqual(await lineCtas.evaluateAll((actions) => actions.map((action) => action.getAttribute('data-cta-location'))), ['hero', 'offer', 'after_proof', 'after_scope', 'why_me', 'after_fit', 'after_investment', 'final'], 'T3 must keep a LINE action across the full journey');
  await expectOutlineDownload(page, 'T3', '/services/outlines/t3-sales-back-office.pdf');
  assert.ok(await page.locator('[data-line-cta][data-cta-label="รับ Agent Builder Kit ทาง LINE"]').count() >= 1, 'T3 Agent Builder Kit CTA must use the real LINE flow');
  for (const action of await lineCtas.all()) {
    assert.equal(await action.getAttribute('href'), 'https://lin.ee/ioSnSUG', 'every T3 CTA must open SITE.social.line');
    assert.equal(await action.getAttribute('data-cta-keyword'), 'SALES REPORT', 'every T3 CTA must carry the SALES REPORT keyword');
  }

  const html = await page.content();
  assert.doesNotMatch(html, /Rendering note|Asset notes|ตามระยะเวลาจาก Catalog|ตามเงื่อนไขใน Catalog/, 'T3 must not expose authoring labels or internal Catalog placeholders');
  const courseSchema = schemas(html).find((item) => item['@type'] === 'Course');
  assert.equal(courseSchema?.name, catalog.name, 'T3 Course schema name must resolve from Catalog');
  assert.equal(courseSchema?.url, 'https://punnattapatch.com/services/t3-sales-back-office', 'T3 Course schema must use canonical route');
  const faqSchema = schemas(html).find((item) => item['@type'] === 'FAQPage');
  assert.deepEqual(
    faqSchema?.mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => [item.name, item.acceptedAnswer.text]),
    await page.locator('[data-product-faq-button]').evaluateAll((buttons) => buttons.map((button) => [button.querySelector('span')?.textContent?.trim(), document.getElementById(button.getAttribute('aria-controls') || '')?.textContent?.trim()])),
    'T3 FAQPage schema must exactly match the eight visible FAQ questions and answers',
  );

  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element: HTMLImageElement) => {
      if (element.complete) return element.naturalWidth;
      return await new Promise<number>((resolve) => element.addEventListener('load', () => resolve(element.naturalWidth), { once: true }));
    });
    assert.ok(await image.evaluate((element: HTMLImageElement) => element.naturalWidth > 0), `T3 image must load: ${await image.getAttribute('src')}`);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true, 'desktop T3 must not overflow horizontally');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), true, 'mobile T3 must not overflow horizontally');
  assert.equal(await page.locator('[data-curriculum-step]').count(), 5, 'mobile T3 must retain the full operating journey');
  assert.equal(await page.locator('[data-final-line-qr]').isVisible(), false, 'mobile T3 must not show a scan instruction without an inline QR');
  assert.equal(await page.getByText('ทัก LINE แล้วพิมพ์คำว่า “SALES REPORT” พร้อมจำนวนทีม', { exact: true }).isVisible(), true, 'mobile T3 final CTA must give a tappable LINE instruction');
  await page.close();
});

test('every service page carries the content-update ribbon with the supported models', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const route of ['/services/t1-sales-skills', '/services/online-to-sales', '/services/t3-sales-back-office', '/services/advance-ai-automation', '/services/daily-consulting']) {
    await page.goto(`${baseURL}${route}`);
    const ribbon = page.locator('[data-content-update-ribbon]');
    assert.equal(await ribbon.count(), 1, `${route} must show exactly one content-update ribbon`);
    const text = await ribbon.innerText();
    assert.ok(text.includes('กันยายน 2026'), `${route} ribbon must name the update month`);
    assert.ok(text.includes('GPT-6 Astra') && text.includes('Claude Fable 5.1'), `${route} ribbon must name both supported models`);
  }
  await page.close();
});
