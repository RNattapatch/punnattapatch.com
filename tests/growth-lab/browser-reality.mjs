// Real-browser walk-through of the "ของจริง" screen against a built dist-app, fed with a fixture exported from the
// real database (mac-mini side: ~/funnel-lab-data/work/export_fixture.py — service role, read-only, never committed).
// Supabase calls are answered from the fixture, so no real sign-in is needed and nothing is written anywhere.
//   pnpm build && node scripts/prune-for-app.mjs
//   python3 -m http.server 4373 --bind 127.0.0.1 --directory dist-app &
//   FIXTURE=~/funnel-lab-data/work/reality-fixture.json BASE=http://127.0.0.1:4373 OUT=/tmp/fl-shots node tests/growth-lab/browser-reality.mjs
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4373';
const OUT = process.env.OUT ?? 'test-results/growth-lab';
const fixture = JSON.parse(readFileSync(process.env.FIXTURE, 'utf8'));
mkdirSync(OUT, { recursive: true });
const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) failures.push(label); };
const pixel = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64');

const fakeSession = () => {
  const b64 = (value) => btoa(JSON.stringify(value)).replace(/=+$/u, '').replace(/\+/gu, '-').replace(/\//gu, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', role: 'authenticated', exp })}.local-test`;
  localStorage.setItem('sb-yykocvhorgcgzaluuldn-auth-token', JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'local-test', user: { id: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', aud: 'authenticated', role: 'authenticated' } }));
};

async function route(page) {
  const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const writes = [];
  await page.route('**/rest/v1/**', (request) => {
    const url = new URL(request.request().url());
    const method = request.request().method();
    const table = url.pathname.split('/').pop();
    if (method !== 'GET' && method !== 'HEAD') { writes.push(`${method} ${table}`); return request.fulfill(json(table === 'funnel_lab_signals' ? [] : null, method === 'POST' ? 201 : 200)); }
    if (table === 'growth_lab_workspaces') return request.fulfill(json(fixture.workspace));
    if (table === 'funnel_lab_channel_funnel') return request.fulfill(json(fixture.channel));
    if (table === 'funnel_lab_persona_funnel') return request.fulfill(json(fixture.persona));
    if (table === 'funnel_lab_signals') {
      if ((url.searchParams.get('select') ?? '').includes('evaluation')) {
        const id = (url.searchParams.get('id') ?? '').replace(/^eq\./u, '');
        return request.fulfill(json(fixture.details[id] ?? null));
      }
      const offset = Number((request.request().headers().range ?? '0-499').split('-')[0]) || 0;
      return request.fulfill(json(fixture.signals.slice(offset, offset + 500)));
    }
    return request.fulfill(json([]));
  });
  await page.route('**/storage/v1/object/sign/**', (request) => {
    const paths = JSON.parse(request.request().postData() ?? '{}').paths ?? [];
    return request.fulfill(json(paths.map((path) => ({ path, signedURL: `/thumb/${path}`, signedUrl: `${BASE}/thumb/${path}`, error: null }))));
  });
  await page.route('**/thumb/**', (request) => request.fulfill({ status: 200, contentType: 'image/jpeg', body: pixel }));
  return writes;
}

const browser = await chromium.launch();
try {
  for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    await context.addInitScript(fakeSession);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error' && !/401|Failed to load resource/u.test(message.text())) errors.push(`console: ${message.text()}`); });
    const writes = await route(page);
    await page.goto(`${BASE}/funnel-lab.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#creative-list [data-creative-id]', { state: 'attached', timeout: 15_000 });
    await page.click('.gl-tab[data-view="reality"]');
    await page.waitForFunction(() => /Codex ประเมินแล้ว/u.test(document.getElementById('reality-meta').textContent), null, { timeout: 15_000 });
    const meta = await page.locator('#reality-meta').textContent();
    check(meta.includes(`แอด ${fixture.signals.filter((s) => s.source === 'own_ad').length}`), `${label}: header counts the real ads (${meta.trim()})`);
    check((await page.locator('#reality-measure table').count()) === 4, `${label}: four datasets in "วัดได้ไหม"`);
    check((await page.locator('#reality-funnel tbody tr').count()) >= 5, `${label}: channel funnel rows from the CRM view`);
    check((await page.locator('#reality-personas tbody tr').count()) === 37, `${label}: all 37 CRM personas listed with their CRM numbers`);
    check((await page.locator('#reality-list li[data-signal]').count()) > 0, `${label}: touchpoint list rendered`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${label}: no horizontal page scroll (${overflow}px)`);
    await page.screenshot({ path: join(OUT, `reality-${label}.png`), fullPage: true });

    // open an evaluated touchpoint → full panel → copy it to the workbench
    const evaluatedId = Object.keys(fixture.details)[0];
    await page.selectOption('#reality-sort', 'icp');
    await page.locator(`#reality-list li[data-signal="${evaluatedId}"]`).click();
    await page.waitForSelector('#signal-dialog[open] .gl-seat', { timeout: 10_000 });
    check((await page.locator('#signal-detail .gl-seat').count()) === 37, `${label}: detail shows every persona seat with reaction/friction/fix`);
    await page.screenshot({ path: join(OUT, `reality-${label}-detail.png`) });
    await page.click('[data-action="reality-to-workbench"]');
    await page.waitForSelector('#signal-dialog:not([open])', { state: 'attached' });
    await page.waitForTimeout(400);
    check(await page.locator('.gl-tab[data-view="workbench"][aria-current="page"]').count() === 1, `${label}: copy jumps to the workbench`);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pun.growthLab.workspace.v2') ?? 'null')?.state);
    const copied = saved?.creatives.find((creative) => creative.id === saved.selectedCreativeId);
    check(Boolean(copied?.name.startsWith('จากของจริง') && copied.personaPackId === 'pun-crm-2026-10'), `${label}: the copied touchpoint is selected and scored against the CRM pack`);
    check((await page.locator('#message-preview').textContent()).includes(copied.hook.slice(0, 20)), `${label}: the desk previews the real hook`);
    check((await page.locator('#persona-panel button').count()) === 37, `${label}: the desk shows the 37 CRM seats`);
    check(writes.every((write) => /growth_lab_workspaces|growth_lab_results|growth_lab_keep_copy/u.test(write)), `${label}: no write touched the signal/CRM tables (${writes.join(', ') || 'none'})`);
    check(errors.length === 0, `${label}: no page errors ${errors.join(' | ')}`);
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall reality checks passed');
