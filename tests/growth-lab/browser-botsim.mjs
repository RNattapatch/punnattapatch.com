// Real-browser walk-through of the "ทดสอบบอท" tab against a built dist-app, fed with the synthetic fixture in botsim-fixture.mjs.
// Supabase REST calls are answered from the fixture, so nothing is sent anywhere and nothing is written.
//   pnpm build && node scripts/prune-for-app.mjs
//   python3 -m http.server 4373 --bind 127.0.0.1 --directory dist-app &
//   BASE=http://127.0.0.1:4373 OUT=/tmp/botsim-shots node tests/growth-lab/browser-botsim.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { DATA_VERSION } from '../../src/scripts/growth-lab/sync.mjs';
import { overviewTable, splitRuns } from '../../src/scripts/growth-lab/botsim.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';
import { FULL_LABELS, makeFixture } from './botsim-fixture.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4373';
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

const HEAVY = ['turns', 'thoughts', 'lead', 'judge'];
const unquote = (value) => (value ?? '').replace(/^eq\./u, '');

/** Answers the REST calls the page makes from the fixture. Returns the list of writes that were attempted. */
async function route(page, fixture) {
  const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const writes = [];
  const workspace = { state: seedState(), rev: 1, app_version: DATA_VERSION, device: 'local-test', updated_at: new Date().toISOString() };
  await page.route('**/rest/v1/**', (request) => {
    const url = new URL(request.request().url());
    const method = request.request().method();
    const table = url.pathname.split('/').pop();
    if (method !== 'GET' && method !== 'HEAD') {
      writes.push(`${method} ${table}`);
      return request.fulfill(json(method === 'POST' ? workspace : null, method === 'POST' ? 201 : 200));
    }
    if (table === 'growth_lab_workspaces') return request.fulfill(json(workspace));
    if (table === 'funnel_lab_bot_runs') return request.fulfill(json(fixture.runs));
    if (table === 'funnel_lab_bot_pick_runs') return request.fulfill(json(fixture.pickRuns));
    if (table === 'funnel_lab_bot_picks') {
      const id = unquote(url.searchParams.get('pick_run_id'));
      return request.fulfill(json(fixture.picks.filter((row) => row.pick_run_id === id)));
    }
    if (table === 'funnel_lab_bot_convos') {
      const run = unquote(url.searchParams.get('run_label'));
      const persona = unquote(url.searchParams.get('persona_id'));
      const full = (url.searchParams.get('select') ?? '*').trim() === '*';
      const rows = fixture.convos.filter((row) => row.run_label === run && (!persona || row.persona_id === persona));
      if (persona) return request.fulfill(json(rows[0] ?? null));
      return request.fulfill(json(rows.map((row) => (full ? row : Object.fromEntries(Object.entries(row).filter(([key]) => !HEAVY.includes(key)))))));
    }
    return request.fulfill(json([]));
  });
  return writes;
}

async function openTab(page) {
  await page.waitForSelector('.gl-tab[data-view="botsim"]', { state: 'attached', timeout: 15_000 });
  await page.click('.gl-tab[data-view="botsim"]');
  await page.waitForFunction(() => /รอบเต็ม/u.test(document.getElementById('botsim-meta')?.textContent ?? ''), null, { timeout: 15_000 });
}

const browser = await chromium.launch();
const fixture = makeFixture();
try {
  for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    await context.addInitScript(fakeSession);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error' && !/401|Failed to load resource/u.test(message.text())) errors.push(`console: ${message.text()}`); });
    const writes = await route(page, fixture);
    await page.goto(`${BASE}/funnel-lab.html`, { waitUntil: 'networkidle' });
    await openTab(page);
    const meta = await page.locator('#botsim-meta').textContent();
    check(meta.includes(`รอบเต็ม ${FULL_LABELS.length} รอบ`) && meta.includes(`รอบละ ${fixture.personas.length} persona`), `${label}: header counts the full runs and personas (${meta.trim()})`);

    const headers = await page.locator('#botsim-overview thead th').count();
    check(headers === FULL_LABELS.length + 1, `${label}: one column per full run in ran_at order (${headers - 1})`);
    check((await page.locator('#botsim-overview tbody tr').count()) === 11, `${label}: all 11 metric rows`);
    const bestCells = overviewTable(splitRuns(fixture.runs).full).rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.best).length, 0);
    check((await page.locator('#botsim-overview .badge:has-text("ดีสุด")').count()) === bestCells, `${label}: best value marked exactly where a row has a winner (${bestCells})`);
    check((await page.locator('#botsim-partial li').count()) === 3, `${label}: three trial runs in their own list`);
    check((await page.locator('#botsim-sheet').textContent()).includes(fixture.pickRuns[0].summary.codex.headline), `${label}: Codex headline on the summary sheet`);
    check((await page.locator('#botsim-bars [role="img"]').count()) === FULL_LABELS.length * 2, `${label}: wins and scores bars for every run`);
    check((await page.locator('#botsim-pick-meta').textContent()).includes('Codex เห็นด้วยกับ jev'), `${label}: picker, reasoner, cost and agreement shown`);

    check((await page.locator('#botsim-picks [data-botsim-persona]').count()) === 37, `${label}: all 37 personas listed`);
    await page.selectOption('#botsim-segment', 'buy');
    const buyers = fixture.personas.filter((persona) => persona.segment === 'buy').length;
    check((await page.locator('#botsim-picks [data-botsim-persona]').count()) === buyers, `${label}: segment filter narrows the list to ${buyers} buyers`);
    await page.selectOption('#botsim-segment', '');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${label}: no horizontal page scroll on the new tab (${overflow}px)`);
    await page.locator('#view-botsim').screenshot({ path: join(OUT, `botsim-${label}.png`) });

    // Dialog by mouse, then close with Escape and check focus goes back to the row
    const firstRow = page.locator('#botsim-picks [data-botsim-persona]').first();
    const personaId = await firstRow.getAttribute('data-botsim-persona');
    await firstRow.click();
    await page.waitForSelector('#botsim-dialog[open] [data-botsim-side]', { timeout: 10_000 });
    await page.waitForFunction(() => document.querySelectorAll('#botsim-dialog [data-botsim-side-body] .gl-primary').length >= 2, null, { timeout: 10_000 });
    check((await page.locator('#botsim-dialog [data-botsim-side]').count()) === 2, `${label}: dialog shows the chosen chat next to the worst chat`);
    check((await page.locator('#botsim-dialog').textContent()).includes('ความคิดในใจ (บอทไม่เห็น)'), `${label}: hidden thoughts are marked in the dialog`);
    await page.screenshot({ path: join(OUT, `botsim-${label}-dialog.png`) });
    await page.keyboard.press('Escape');
    await page.waitForSelector('#botsim-dialog:not([open])', { state: 'attached' });
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-botsim-persona'));
    check(focused === personaId, `${label}: closing the dialog returns focus to the row`);

    // Keyboard: Enter on a focused row opens the same dialog
    await page.locator(`#botsim-picks [data-botsim-persona="${personaId}"]`).focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('#botsim-dialog[open]', { timeout: 10_000 });
    check(true, `${label}: a row opens with Enter`);
    await page.keyboard.press('Escape');
    await page.waitForSelector('#botsim-dialog:not([open])', { state: 'attached' });

    // Transcript viewer: defaults to the newest full run, and switching runs reloads the people
    const defaultRun = await page.locator('#botsim-view-run').inputValue();
    check(defaultRun === FULL_LABELS.at(-1), `${label}: viewer opens on the newest full run (${defaultRun})`);
    await page.waitForFunction(() => document.getElementById('botsim-transcript')?.textContent.includes('ความคิดในใจ'), null, { timeout: 10_000 });
    await page.selectOption('#botsim-view-run', 'codex-test');
    await page.waitForFunction(() => document.querySelectorAll('#botsim-view-persona option').length === 1, null, { timeout: 10_000 });
    check((await page.locator('#botsim-transcript').textContent()).includes('ผู้ทดสอบ 01'), `${label}: trial run shows its one persona`);
    await page.locator('#botsim-transcript').scrollIntoViewIfNeeded();

    check(writes.every((write) => /growth_lab_workspaces/u.test(write)), `${label}: no write touched the bot tables (${writes.join(', ') || 'none'})`);
    check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`);
    await context.close();
  }

  // Empty state: the runs are in, but jev has not picked yet
  const empty = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await empty.addInitScript(fakeSession);
  const emptyPage = await empty.newPage();
  await route(emptyPage, makeFixture({ picks: false }));
  await emptyPage.goto(`${BASE}/funnel-lab.html`, { waitUntil: 'networkidle' });
  await openTab(emptyPage);
  check((await emptyPage.locator('#botsim-picks').textContent()).includes('ยังไม่มีผลการเลือก'), 'empty: the per-persona list says no picks yet');
  check((await emptyPage.locator('#botsim-sheet').textContent()).includes('ยังไม่มีผลการเลือก'), 'empty: the summary sheet says no picks yet');
  check((await emptyPage.locator('#botsim-overview tbody tr').count()) === 11, 'empty: the overview still renders from the runs');
  await empty.close();
} finally {
  await browser.close();
}
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall botsim checks passed');
