/**
 * Content Center — แท็บแคมเปญ + รูปโปรไฟล์ใน Note Studio (regression)
 *
 * ทำไมต้องมี: 2026-10-02 คุณปันเจอ 2 อย่างบน production
 *   1) กดปุ่ม "🎯 แคมเปญ" แล้วไม่ไปไหน — ปุ่มไม่มี click handler (เทสต์รอบก่อนเรียก openCampaign ตรงๆ เลยไม่เห็น)
 *   2) พรีวิว Note Studio ไม่มีหน้าปัน — prune-for-app ไม่ยก images/pun-avatar-notes.jpg ขึ้นโดเมน app
 *      แล้วโค้ดเอาหน้า 404 (HTML) มาแปลงเป็น data URL ของรูป
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4341 node tests/content-center-campaign-studio.test.mjs   (ต้องมี dev server)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const CID = 'CNT-2026-10-02-099';
const IDEAS = [{
  content_id: CID, title: 'ไอเดียทดสอบแคมเปญ', canonical_angle: null, topic_cluster: null, funnel_stage: null,
  pillar_bucket: null, pillar_v14: 'team', angle_type: null, acid_test: 'pending', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-10-02T00:00:00Z',
}];
const VARIANTS = [{
  variant_id: `${CID}-CR`, content_id: CID, format: 'carousel', target_platforms: ['instagram'],
  working_title: 'ไอเดียทดสอบแคมเปญ', markdown_path: null, variant_status: 'draft', cta_keyword: null,
  status_changed_at: '2026-10-02T00:00:00Z', created_at: '2026-10-02T00:00:00Z',
  script_draft: null, ai_result: null, ai_result_at: null, visual_spec: null,
}];
const CAMPAIGNS = [{
  campaign_id: 'test-warm', name: 'Warm Retarget · ทดสอบ', goal: 'เห็น 7 ครั้งใน 7 วัน', audience: 'Warm: ทดสอบ',
  status: 'active', start_date: '2026-10-05', end_date: '2026-10-31', touch_per_week: 7, kpi_label: null,
  budget_note: null, mix_target: null, brief_md_path: null, drive_folder: null, created_at: '2026-10-02T00:00:00Z', temperature: 'warm',
}];
const ITEMS = [{
  id: '00000000-0000-0000-0000-000000000001', campaign_id: 'test-warm', content_id: CID, variant_id: `${CID}-CR`,
  slot_code: 'V1', role: 'value', week: 1, sort: 0, ad_status: 'draft', meta_ad_id: null, note: null, created_at: '2026-10-02T00:00:00Z',
}];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();

async function openPage({ avatar404 = false } = {}) {
  const ctx = await browser.newContext();
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(SB)) return route.fallback();
    if (avatar404 && url.startsWith(`${BASE}/images/pun-avatar-notes.jpg`)) {
      // จำลองโดเมน app ที่ไม่มีไฟล์: Cloudflare ตอบหน้า 404 เป็น HTML
      return route.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><h1>404</h1>' });
    }
    if (url.startsWith(BASE)) return route.continue();
    return route.abort();
  });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/content_items')) return json(IDEAS);
    if (url.includes('/content_variants')) return json(VARIANTS);
    if (url.includes('/campaign_items')) return json(ITEMS);
    if (url.includes('/campaigns')) return json(CAMPAIGNS);
    return json([]);
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(([ref, token]) => {
    if (window !== window.top) return;   // iframe พรีวิว Note Studio เป็น sandbox — แตะ localStorage ไม่ได้
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: token, token_type: 'bearer', expires_in: 999999,
      expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
      user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
    }));
  }, [REF, jwt()]);
  await page.goto(`${BASE}/app/content`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-card="variant"]', { timeout: 60000 });   // dev server คอมไพล์ครั้งแรกช้า
  return { page, ctx, errors };
}

console.log('\n🎯 Content Center — แท็บแคมเปญ + Note Studio\n');

// ── 1. กดปุ่มแคมเปญจากบอร์ด ต้องไปหน้าแคมเปญจริง ───────────────────────
{
  const { page, ctx, errors } = await openPage();
  await page.click('#wr-view-campaign');
  await page.waitForSelector('#cp-cards [data-cp-open]', { timeout: 8000 }).catch(() => {});
  const visible = await page.$eval('#wr-campaign-view', (el) => !el.classList.contains('hidden'));
  check(visible, 'กด 🎯 แคมเปญ → หน้าแคมเปญโผล่');
  check(await page.$eval('#wr-board-view', (el) => el.classList.contains('hidden')), 'บอร์ดถูกซ่อน');
  check(await page.$eval('#wr-view-campaign', (el) => el.getAttribute('aria-selected')) === 'true', 'ปุ่มแคมเปญเป็นแท็บที่เลือกอยู่ (aria-selected)');
  const cards = await page.$$eval('#cp-cards [data-cp-open]', (n) => n.map((x) => x.textContent));
  check(cards.length === 1 && cards[0].includes('Warm Retarget'), `การ์ดแคมเปญขึ้น (${cards.length} ใบ)`);
  check(cards[0]?.includes('Warm'), 'การ์ดมีป้าย Warm');
  check(new URL(page.url()).hash === '#campaigns', `URL = #campaigns (ได้ ${new URL(page.url()).hash})`);

  // เข้าแคมเปญ → ออกไปบอร์ด → กดแคมเปญอีกที ต้องกลับมาหน้ารายการ
  await page.click('#cp-cards [data-cp-open]');
  await page.waitForTimeout(300);
  check(await page.$eval('#cp-detail', (el) => !el.classList.contains('hidden')), 'กดการ์ด → เปิดหน้าแคมเปญ');
  await page.click('#wr-view-board');
  check(await page.$eval('#wr-campaign-view', (el) => el.classList.contains('hidden')), 'กลับบอร์ดได้');
  await page.click('#wr-view-campaign');
  await page.waitForTimeout(300);
  check(await page.$eval('#cp-list-wrap', (el) => !el.classList.contains('hidden')), 'กดแท็บแคมเปญซ้ำ → กลับหน้ารายการแคมเปญ');
  check(!errors.length, `ไม่มี JS error (${errors.join(' | ') || '-'})`);
  await ctx.close();
}

// ── 2. ทุกปุ่มมุมมองต้องมีคนรับ click ─────────────────────────────────────
{
  const src = readFileSync('src/pages/app/content.astro', 'utf8');
  const ids = [...src.matchAll(/id="(wr-view-[a-z]+)"/g)].map((m) => m[1]);
  const unwired = ids.filter((id) => !src.includes(`$('${id}').addEventListener('click'`));
  check(ids.length >= 4 && !unwired.length, `ปุ่มมุมมอง ${ids.length} ปุ่มมี click handler ครบ${unwired.length ? ` (ขาด ${unwired.join(', ')})` : ''}`);
}

// ── 3. Note Studio: พรีวิวต้องมีรูปโปรไฟล์จริง ────────────────────────────
async function studioAvatar(opts) {
  const { page, ctx } = await openPage(opts);
  await page.evaluate((vid) => document.querySelector(`[data-card="variant"][data-v="${vid}"]`)?.click(), `${CID}-CR`);
  await page.waitForSelector('[data-action="note-studio"]', { timeout: 8000 });
  await page.click('[data-action="note-studio"]');
  await page.waitForFunction(() => (document.getElementById('ns-frame')?.getAttribute('srcdoc') ?? '').includes('class="avatar'), null, { timeout: 8000 });
  const src = await page.$eval('#ns-frame', (f) => (f.getAttribute('srcdoc').match(/class="avatar[^"]*" src="([^"]{0,40})/) || [])[1]);
  await ctx.close();
  return src ?? '';
}
{
  const src = await studioAvatar();
  check(src.startsWith('data:image/jpeg;base64,'), `พรีวิวฝังรูปโปรไฟล์เป็น JPEG (${src.slice(0, 24)}…)`);
  const missing = await studioAvatar({ avatar404: true });
  check(missing.startsWith('data:image/svg+xml'), `รูปหาย (404 HTML) → ใช้วงกลมสำรอง ไม่แปลง HTML เป็นรูป (${missing.slice(0, 24)}…)`);
}

// ── 4. ไฟล์ใน public/ ที่หน้า app ใช้ ต้องอยู่ใน KEEP_ASSETS ของ prune-for-app ──
{
  const prune = readFileSync('scripts/prune-for-app.mjs', 'utf8');
  const keep = JSON.parse(prune.match(/const KEEP_ASSETS = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
  const files = [
    ...readdirSync('src/pages/app').filter((f) => f.endsWith('.astro')).map((f) => `src/pages/app/${f}`),
    ...readdirSync('src/scripts/war-room').map((f) => `src/scripts/war-room/${f}`),
    ...readdirSync('src/components/war-room').map((f) => `src/components/war-room/${f}`),
  ];
  const refs = new Set();
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/(?:fetch\(|src=)["'`](\/(?!_astro|app\/)[\w./-]+\.(?:jpe?g|png|svg|webp|json|gif))["'`]/g)) refs.add(m[1].slice(1));
  }
  const missing = [...refs].filter((r) => !keep.some((k) => r === k || r.startsWith(`${k}/`)));
  check(refs.has('images/pun-avatar-notes.jpg'), 'ตัวตรวจเจอรูปโปรไฟล์ที่ Note Studio ใช้');
  check(!missing.length, `ไฟล์ public ที่หน้า app ใช้ (${refs.size}) ถูกยกขึ้นโดเมน app ครบ${missing.length ? ` — ขาด ${missing.join(', ')}` : ''}`);
}

await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
