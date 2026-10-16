// Real-browser walk-through of the "ผลย้อนหลัง" tab against a built dist-app. Supabase REST + storage calls are answered
// from a fixture, so nothing is sent anywhere and nothing is written.
//   pnpm build && node scripts/prune-for-app.mjs
//   python3 -m http.server 4373 --bind 127.0.0.1 --directory dist-app &
//   BASE=http://127.0.0.1:4373 OUT=/tmp/history-shots [CHANNEL=chrome] node tests/growth-lab/browser-history.mjs
// FIXTURE=<rows.json> swaps the synthetic runs for an export of funnel_lab_review_runs (keep real exports out of the repo);
// COVERS=<dir> serves carousel covers from <dir>/<slug>/img/<item>/ (the mini's ~/funnel-lab-data/work).
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DATA_VERSION } from '../../src/scripts/growth-lab/sync.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';
import { allItems } from '../../src/scripts/growth-lab/history.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4373';
const OUT = process.env.OUT ?? 'test-results/growth-lab';
const WIDTHS = (process.env.WIDTHS ?? '1440,390').split(',').map(Number);
mkdirSync(OUT, { recursive: true });
const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) failures.push(label); };

const synthetic = () => {
  const item = (id, verdict, extra = {}) => ({ id, title: `ชิ้น ${id}`, verdict, winner: false, disagree: false, lead: `เหตุผลสั้นของ ${id}`, bullets: [`ปก: 3/5 · ปกของ ${id}`, 'แก้: ย้ายหลักฐานขึ้นก่อน'], glossary: '', ...extra });
  return [
    {
      slug: 'reel-plan-test', kind: 'reel_plan', title: 'แผน reel 3 คอนเซ็ปต์', ran_at: '2026-10-16T10:00:00Z', headline: 'ปัญหาตรงใจ แต่หลักฐานยังบาง',
      summary: [
        { label: 'ถ่ายก่อน', items: [{ ref: 'S1', text: 'พาคนไปทักได้ดีสุด' }, { ref: 'S2 (H1)', text: 'ปัญหาตรงกลุ่ม' }] },
        { label: 'ทิ้ง/พัก', items: [{ ref: 'S3', text: 'ขายกระบวนการมากกว่าผล' }] },
        { label: 'สิ่งที่ทำให้ไม่ทักซ้ำหลายตัว', items: [{ text: 'กลัวราคา: S1–S3' }] },
        { label: 'กติกาแก้ทุกคลิป', items: [{ text: 'เปิด 2 วินาทีแรกด้วยผลลัพธ์' }] },
      ],
      sections: [{ title: 'T4 คลาส', intro: 'S1 แรงสุด', glossary: '', items: [item('S1', 'fix_then_shoot'), item('S2', 'shoot_now'), item('S3', 'drop', { disagree: true })] }],
      scores: { title: 'คะแนน jev (1–5)', head: ['id', 'หยุดดู', 'ทัก'], rows: [['S1', '3.9', '3.1'], ['S2', '4.1', '3.4'], ['S3', '2.2', '1.9']] },
      meta: { item_count: 3, persona_count: 37, tally: { fix_then_shoot: 1, shoot_now: 1, drop: 1 }, lines: ['jev × 37 persona'], notes: ['ข้อจำกัด: จำลอง'] },
      covers: {}, report_md: '# Funnel Lab review — แผน reel 3 คอนเซ็ปต์\n\n## สรุป\n\nปัญหาตรงใจ', published_at: '2026-10-16T10:05:00Z',
    },
    {
      slug: 'loop-test', kind: 'compare', title: 'เทียบ A/B · หน้าเว็บ (lp)', ran_at: '2026-10-15T10:00:00Z', headline: 'รั่วที่ความเชื่อใจ',
      summary: [{ label: 'รูรั่วเรียงจากหนักสุด', items: [{ ref: 'lp', text: '19 จาก 34 คนอยากเห็นหลักฐาน' }] }, { label: 'แก้ก่อนเปิดแอดกลับ', items: [{ ref: 'lp', text: 'ใส่ผลงานจริงก่อนช่องให้เบอร์' }] }],
      sections: [{ title: 'หน้าเว็บ', intro: 'รั่วที่ความน่าเชื่อถือ', glossary: '', items: [{ ...item('lp', 'B'), winner: true, title: '' }] }],
      scores: null,
      meta: { item_count: 1, persona_count: 37, tally: { 'win:B': 1 }, inputs: [{ id: 'lp-A', pair: 'lp', variant: 'A', title: 'ของจริง', text: 'ข้อความ A' }, { id: 'lp-B', pair: 'lp', variant: 'B', title: 'ฉบับแก้', text: 'ข้อความ B' }] },
      covers: {}, report_md: '# Funnel Lab — loop', published_at: '2026-10-15T10:05:00Z',
    },
  ];
};

const RUNS = (process.env.FIXTURE ? JSON.parse(readFileSync(process.env.FIXTURE, 'utf8')) : synthetic())
  .sort((a, b) => b.ran_at.localeCompare(a.ran_at));
const COVERS = process.env.COVERS;

const fakeSession = () => {
  const b64 = (value) => btoa(JSON.stringify(value)).replace(/=+$/u, '').replace(/\+/gu, '-').replace(/\//gu, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', role: 'authenticated', exp })}.local-test`;
  localStorage.setItem('sb-yykocvhorgcgzaluuldn-auth-token', JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'local-test', user: { id: '00000000-0000-0000-0000-000000000000', email: 'local-test@example.test', role: 'authenticated', aud: 'authenticated' } }));
};

function coverFile(objectPath) {
  const m = objectPath.match(/reviews\/([^/]+)\/([^/]+)\.jpg/);
  if (!COVERS || !m) return null;
  const dir = join(COVERS, m[1], 'img', m[2]);
  if (!existsSync(dir)) return null;
  const first = readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()[0];
  return first ? join(dir, first) : null;
}

async function route(page) {
  const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const writes = [];
  const workspace = { state: seedState(), rev: 1, app_version: DATA_VERSION, device: 'local-test', updated_at: new Date().toISOString() };
  await page.route('**/rest/v1/**', (request) => {
    const url = new URL(request.request().url());
    const method = request.request().method();
    const table = url.pathname.split('/').pop();
    if (method !== 'GET' && method !== 'HEAD') { writes.push(`${method} ${table}`); return request.fulfill(json(method === 'POST' ? workspace : null, method === 'POST' ? 201 : 200)); }
    if (table === 'growth_lab_workspaces') return request.fulfill(json(workspace));
    if (table === 'funnel_lab_review_runs') {
      const slug = (url.searchParams.get('slug') ?? '').replace(/^eq\./u, '');
      if (slug) return request.fulfill(json(RUNS.find((r) => r.slug === slug) ?? null));
      return request.fulfill(json(RUNS.map((r) => ({ slug: r.slug, kind: r.kind, title: r.title, ran_at: r.ran_at, headline: r.headline, tally: r.meta?.tally ?? null, item_count: r.meta?.item_count ?? null }))));
    }
    return request.fulfill(json([]));
  });
  // createSignedUrls → relative signed paths · the image GETs come back from COVERS (or a 404)
  await page.route('**/storage/v1/object/sign/**', async (request) => {
    if (request.request().method() === 'POST') {
      const { paths } = JSON.parse(request.request().postData() ?? '{}');
      return request.fulfill(json((paths ?? []).map((path) => ({ path, signedURL: `/object/sign/funnel-lab-media/${path}?token=local`, error: null }))));
    }
    const file = coverFile(new URL(request.request().url()).pathname);
    return file ? request.fulfill({ status: 200, contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg', body: readFileSync(file) }) : request.fulfill({ status: 404, body: '' });
  });
  return writes;
}

const browser = await chromium.launch(process.env.CHANNEL ? { channel: process.env.CHANNEL } : {});   // CHANNEL=chrome = use the installed Chrome
try {
  for (const width of WIDTHS) {
    const label = `${width}px`;
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, deviceScaleFactor: width > 2000 ? 1 : 2 });
    await context.addInitScript(fakeSession);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error' && !/401|404|Failed to load resource/u.test(message.text())) errors.push(`console: ${message.text()}`); });
    const writes = await route(page);
    await page.goto(`${BASE}/funnel-lab.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#history-detail')?.dataset.slug, null, { timeout: 15_000 });

    check(!(await page.locator('#view-history').isHidden()), `${label}: ผลย้อนหลัง is the landing view`);
    check((await page.locator('.gl-tab[data-view="history"]').getAttribute('aria-current')) === 'page', `${label}: its tab is marked current`);
    check((await page.locator('#history-meta').textContent()).includes(`${RUNS.length} รอบ`), `${label}: header counts ${RUNS.length} runs`);
    check((await page.locator('#history-detail').getAttribute('data-slug')) === RUNS[0].slug, `${label}: newest run opens first (${RUNS[0].slug})`);
    check((await page.locator('#history-detail .gl-sheet').textContent()).includes(RUNS[0].headline ?? ''), `${label}: the one-line verdict leads the sheet`);
    if (width >= 1024) check((await page.locator('#history-list [data-hist-run]').count()) === RUNS.length, `${label}: every run is in the rail`);
    else check((await page.locator('#history-select option').count()) === RUNS.length, `${label}: every run is in the phone picker`);

    const items = allItems(RUNS[0]).length;
    check((await page.locator('#history-detail article.gl-panel').count()) === items, `${label}: one card per item (${items})`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${label}: no horizontal page scroll (${overflow}px)`);
    await page.locator('#view-history').screenshot({ path: join(OUT, `history-${label}-${RUNS[0].slug}.png`) });

    // open each run once (rail on desktop, picker on phones) — every sheet renders without errors
    for (const run of RUNS.slice(1)) {
      if (width >= 1024) await page.click(`#history-list [data-hist-run="${run.slug}"]`);
      else await page.selectOption('#history-select', run.slug);
      await page.waitForFunction((slug) => document.querySelector('#history-detail')?.dataset.slug === slug, run.slug, { timeout: 10_000 });
      const cards = await page.locator('#history-detail article.gl-panel').count();
      check(cards === allItems(run).length, `${label}: ${run.slug} → ${cards} cards`);
      if (process.env.SHOOT_ALL) await page.locator('#view-history').screenshot({ path: join(OUT, `history-${label}-${run.slug}.png`) });
    }
    check((await page.evaluate(() => location.hash)).startsWith("#run="), `${label}: the open run is in the URL (#run=…)`);

    // filter chips + search narrow the rail
    if (width >= 1024) {
      const kind = RUNS[0].kind;
      await page.click(`#history-kinds [data-hist-kind="${kind}"]`);
      check((await page.locator('#history-list [data-hist-run]').count()) === RUNS.filter((r) => r.kind === kind).length, `${label}: kind chip filters to ${kind}`);
      await page.click('#history-kinds [data-hist-kind=""]');
      await page.fill('#history-search', 'zzzz-no-match');
      check((await page.locator('#history-list [data-hist-run]').count()) === 0, `${label}: search with no match empties the rail`);
      await page.fill('#history-search', '');
    }
    check(writes.every((w) => w.includes('growth_lab')), `${label}: the tab itself writes nothing (${writes.join(', ') || 'no writes'})`);
    check(errors.length === 0, `${label}: no page errors${errors.length ? ` — ${errors.join(' | ')}` : ''}`);
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall checks passed');
