// Real-browser walk-through of /growth-lab against a built dist-app (no live Supabase needed).
//   pnpm build && node scripts/prune-for-app.mjs
//   python3 -m http.server 4371 --bind 127.0.0.1 --directory dist-app &
//   BASE=http://127.0.0.1:4371 OUT=/tmp/gl-shots node tests/growth-lab/browser.mjs
// A local-only fake session opens the gate; Supabase rejects it (401), which exercises the offline path:
// the lab must stay fully usable and say it is not synced yet. Exits 1 on any failed check.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4371';
const OUT = process.env.OUT ?? 'test-results/growth-lab';
mkdirSync(OUT, { recursive: true });
const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) failures.push(label); };

const fakeSession = () => {
  const b64 = (value) => btoa(JSON.stringify(value)).replace(/=+$/u, '').replace(/\+/gu, '-').replace(/\//gu, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', role: 'authenticated', exp })}.local-test`;
  localStorage.setItem('sb-yykocvhorgcgzaluuldn-auth-token', JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'local-test', user: { id: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', aud: 'authenticated', role: 'authenticated' } }));
};

async function open(browser, viewport, theme) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await context.addInitScript(fakeSession);
  if (theme) await context.addInitScript((value) => localStorage.setItem('pun_dash_theme', value), theme);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error' && !/401|Failed to load resource/u.test(message.text())) errors.push(`console: ${message.text()}`); });
  page.on('dialog', (dialog) => dialog.dismiss());
  await page.goto(`${BASE}/growth-lab.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#creative-list [data-creative-id]', { state: 'attached', timeout: 15_000 });
  return { context, page, errors };
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const browser = await chromium.launch();
try {
  // ---------- desktop walk-through ----------
  const { context, page, errors } = await open(browser, { width: 1440, height: 900 });
  check(await page.locator('#growth-lab-app').isVisible(), 'gate reveals the lab');
  check(await page.locator('.app-tab-active').textContent().then((text) => text.includes('Growth Lab')), 'nav marks Growth Lab active');
  const tabBox = await page.locator('.app-tab-active').boundingBox();
  check(Boolean(tabBox) && tabBox.x + tabBox.width <= 1440, 'active nav tab is on screen');
  await page.waitForFunction(() => /ออฟไลน์|ยังไม่ขึ้นคลาวด์/u.test(document.getElementById('sync-status').textContent), null, { timeout: 15_000 });
  check(true, 'offline sync status is shown when Supabase rejects the session');
  check((await page.locator('#persona-panel button').count()) === 30, 'B2B panel shows 30 seats');
  await page.click('.gl-tab[data-view="journey"]'); await page.click('.gl-tab[data-view="workbench"]');
  const envelope = await page.evaluate(() => JSON.parse(localStorage.getItem('pun.growthLab.workspace.v2') ?? 'null'));
  check(envelope && envelope.dirty === false && envelope.state.activeView === 'workbench', 'tab switches are saved per device without marking the workspace dirty');
  await page.screenshot({ path: join(OUT, 'desktop-workbench-b2b.png'), fullPage: true });

  // B2C promotion over SMS → channel-aware labels and a fresh evaluation
  await page.selectOption('#persona-pack-select', 'thai-b2c-growth-panel');
  await page.selectOption('select[name="touchpointType"]', 'promotion');
  await page.selectOption('select[name="channel"]', 'sms');
  for (const [name, value] of Object.entries({
    name: 'SMS — โปร 1 แถม 1', hook: 'ผิวแห้ง? เซรั่ม 1 แถม 1', primaryText: 'รีวิวจริง 2,000 คน', headline: '590.- ถึง 31 ต.ค.',
    offer: 'ส่งฟรี รับประกันคืนเงิน 30 วัน', cta: 'กด bit.ly/serum', visualDirection: 'ส่งศุกร์ 19:00 น. ใส่ชื่อลูกค้า',
  })) await page.fill(`#creative-form [name="${name}"]`, value);
  await page.click('[data-action="evaluate"]');
  await page.waitForSelector('#component-bars > div');
  check((await page.locator('#persona-panel button').count()) === 8, 'B2C panel shows 8 seats');
  check((await page.locator('#component-bars').textContent()).includes('Delivery'), 'SMS shows Delivery instead of Visual');
  check((await page.locator('#decision-legend').textContent()).includes('ลบทิ้ง'), 'SMS legend uses SMS wording');
  check((await page.locator('#hook-budget').textContent()).includes('/70'), 'hook budget follows the SMS limit');
  check(!(await page.locator('#decision-summary').textContent()).includes('1970'), 'evaluation time is real');
  await page.screenshot({ path: join(OUT, 'desktop-workbench-b2c-sms.png'), fullPage: true });

  await page.click('#persona-panel button >> nth=0');
  await page.waitForSelector('#persona-dialog[open]');
  check((await page.locator('#persona-dialog-content').textContent()).includes('Reaction'), 'persona dialog explains the decision');
  await page.screenshot({ path: join(OUT, 'desktop-persona-dialog.png') });
  await page.keyboard.press('Escape');

  await page.click('[data-action="duplicate"] >> nth=0');
  check((await page.locator('#creative-list [data-creative-id]').count()) === 3, 'duplicate adds a variant');
  await page.fill('#creative-form [name="hook"]', 'ผิวแห้งลอก? 1 แถม 1 วันนี้');
  await page.click('[data-action="evaluate"]');

  await page.click('.gl-tab[data-view="compare"]'); await page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
  check((await page.locator('#compare-content tbody tr').count()) === 2, 'compare ranks the two SMS variants only');
  await page.screenshot({ path: join(OUT, 'desktop-compare.png'), fullPage: true });

  await page.click('.gl-tab[data-view="journey"]'); await page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
  check((await page.locator('#journey-rail article').count()) === 6, 'journey shows 6 B2C stages');
  await page.screenshot({ path: join(OUT, 'desktop-journey.png'), fullPage: true });

  await page.click('.gl-tab[data-view="results"]'); await page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
  await page.fill('#actual-results-form [name="impressions"]', '5000');
  await page.fill('#actual-results-form [name="clicks"]', '400');
  await page.fill('#actual-results-form [name="landingViews"]', '120');
  await page.fill('#actual-results-form [name="leads"]', '60');
  await page.click('#actual-results-form button[type="submit"]');
  check((await page.locator('#calibration-content').textContent()).includes('raw funnel'), 'non-Meta results show raw funnel only');
  await page.screenshot({ path: join(OUT, 'desktop-results.png'), fullPage: true });

  await page.click('.gl-tab[data-view="personas"]'); await page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
  await page.click('[data-action="clone-pack"]');
  check((await page.locator('#pack-library [data-pack-id]').count()) === 4, 'clone adds a pack');
  await page.fill('#persona-editor [name="weightHook"]', '0.5');
  check((await page.locator('#weight-total').getAttribute('class')).includes('text-error'), 'weight total flags a sum ≠ 1');
  await page.screenshot({ path: join(OUT, 'desktop-personas.png'), fullPage: true });

  await page.click('.gl-tab[data-view="settings"]'); await page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
  await page.fill('#settings-form [name="clientName"]', 'ลูกค้าทดสอบ BU สกินแคร์');
  await page.click('#settings-form button[type="submit"]');
  check((await page.title()).includes('ลูกค้าทดสอบ'), 'white-label updates the title');
  await page.screenshot({ path: join(OUT, 'desktop-settings.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#creative-list [data-creative-id]', { state: 'attached' });  // last view (Settings) is remembered
  check((await page.locator('#creative-list [data-creative-id]').count()) === 3, 'work survives a reload (local copy)');
  check(errors.length === 0, `no page errors (${errors.join(' | ') || 'none'})`);
  check(await overflow(page) <= 0, 'desktop: no horizontal page scroll');
  await context.close();

  // ---------- mobile + dark ----------
  for (const [label, viewport, theme] of [['mobile', { width: 390, height: 844 }, null], ['mobile-dark', { width: 390, height: 844 }, 'pundark'], ['tablet', { width: 768, height: 1024 }, null]]) {
    const run = await open(browser, viewport, theme);
    check(await overflow(run.page) <= 0, `${label}: no horizontal page scroll`);
    await run.page.screenshot({ path: join(OUT, `${label}-top.png`) });
    await run.page.click('[data-action="evaluate"]');
    await run.page.waitForTimeout(700);
    if (viewport.width < 1024) check(await run.page.evaluate(() => { const box = document.getElementById('decision-title').getBoundingClientRect(); return box.top >= 0 && box.top < innerHeight; }), `${label}: result is scrolled into view after evaluate`);
    await run.page.screenshot({ path: join(OUT, `${label}-after-evaluate.png`) });
    await run.page.screenshot({ path: join(OUT, `${label}-workbench.png`), fullPage: true });
    await run.page.click('.gl-tab[data-view="journey"]'); await run.page.waitForTimeout(400);  // let the tab colour transition settle before screenshots
    check(await overflow(run.page) <= 0, `${label}: journey has no horizontal page scroll`);
    await run.page.screenshot({ path: join(OUT, `${label}-journey.png`), fullPage: true });
    check(run.errors.length === 0, `${label}: no page errors (${run.errors.join(' | ') || 'none'})`);
    await run.context.close();
  }
} finally {
  await browser.close();
}
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall browser checks passed');
process.exit(failures.length ? 1 : 0);
