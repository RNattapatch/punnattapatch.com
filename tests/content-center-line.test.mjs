/**
 * Content Center — แท็บ 📣 LINE (คลังรูป + ข้อความ broadcast · 2026-10-18)
 *
 * ทำไมต้องมี: คุณปันทำรูป broadcast LINE เยอะจนหาไม่เจอว่ารูปไหนคู่ข้อความไหน ส่งไปหรือยัง
 *   → แท็บนี้ต้อง ค้นจากเนื้อข้อความได้ · คัดลอกข้อความตรงตัวอักษร · จดว่าส่งแล้ว · กันข้อความเกิน 500
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4338 node tests/content-center-line.test.mjs   (ต้องมี dev server)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const CID = 'CNT-2026-10-18-099';
const VID = `${CID}-LN`;
const IDEAS = [{
  content_id: CID, title: 'ไอเดียทดสอบบริษัทไม่มีพนักงาน', canonical_angle: null, topic_cluster: null, funnel_stage: null,
  pillar_bucket: null, pillar_v14: null, angle_type: null, acid_test: 'pending', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-10-18T00:00:00Z',
}];
const VARIANTS = [{
  variant_id: VID, content_id: CID, format: 'line_broadcast', target_platforms: ['line_oa'],
  working_title: 'บริษัทไม่มีพนักงาน แต่ยอด 6 หลักทุกเดือน', markdown_path: null, variant_status: 'ai_improved', cta_keyword: null,
  status_changed_at: '2026-10-18T00:00:00Z', created_at: '2026-10-18T00:00:00Z',
  script_draft: null, ai_result: 'บริษัทผมไม่มีพนักงานสักคนครับ\nทุกอย่างจบใน Mac mini เครื่องเดียว', ai_result_at: null, visual_spec: null,
}];
const T1 = 'บริษัทผมไม่มีพนักงานสักคนครับ\nแต่ยอดเข้า 6 หลักทุกเดือน\n\n👉 อ่านเต็ม\nhttps://punnattapatch.com/insights/x?utm_campaign=nostaff-v1';
const T2 = 'ถ้าคุณไม่อยู่ออฟฟิศ ลูกค้ายังได้คำตอบไหมครับ?\n\nรูปนี้ผมอยู่ร้านกาแฟ\nแต่ Mac mini ที่บ้านยังทำงานอยู่';
const round = (id, code, role, text, asset, extra = {}) => ({
  round_id: id, variant_id: VID, round_code: code, role, text_body: text, text_units: text.length, image_asset_id: asset,
  link_url: null, utm_campaign: code.startsWith('V1') ? 'nostaff-v1' : 'nostaff-v2', status: 'ready', planned_at: null, sent_at: null,
  source_path: 'output/content/line-broadcast/x/y.event.json', edited_in_app: false,
  created_at: '2026-10-18T07:00:00Z', updated_at: '2026-10-18T07:00:00Z', ...extra,
});
const R1 = '00000000-0000-0000-0000-0000000000a1', R2 = '00000000-0000-0000-0000-0000000000a2', R3 = '00000000-0000-0000-0000-0000000000a3';
const ROUNDS = [
  round(R3, 'V1A', 'alternate', T1, 'asset-3'),
  round(R2, 'V2', 'main', T2, 'asset-2'),
  round(R1, 'V1', 'main', T1, 'asset-1'),
];
const MEDIA = ['1', '2', '3'].map((n) => ({
  asset_id: `asset-${n}`, content_id: CID, variant_id: VID, asset_type: 'line_image', storage_path: `${CID}/${VID}/line/r${n}.png`,
  source: 'broadcast', render_batch: `V${n}`, sort_order: Number(n) - 1, is_cover: n === '1', asset_status: 'exported',
  drive_path: null, drive_file_id: null, drive_folder_id: null, created_at: '2026-10-18T07:00:00Z', width: 2160, height: 2700,
}));
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();

async function openPage({ hash = '', viewport } = {}) {
  const ctx = await browser.newContext({ viewport: viewport ?? { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const patches = [];
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(SB)) return route.fallback();
    if (url.startsWith(BASE)) return route.continue();
    return route.abort();
  });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    const cors = { 'access-control-allow-origin': '*' };
    const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/storage/v1/object/sign/') && req.method() === 'POST') {
      const body = req.postDataJSON();
      if (body?.paths) return json(body.paths.map((p) => ({ path: p, signedURL: `/object/sign/content-media/${p}?token=t`, error: null })));
      return json({ signedURL: `/object/sign/content-media/x.png?token=t&download=1` });
    }
    if (url.includes('/storage/v1/object/sign/')) return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: PNG });
    if (url.includes('/line_rounds')) {
      if (req.method() === 'PATCH') { patches.push(req.postDataJSON()); return route.fulfill({ status: 204, headers: cors }); }
      return json(ROUNDS);
    }
    if (url.includes('/content_items')) return json(IDEAS);
    if (url.includes('/content_variants')) return json(VARIANTS);
    if (url.includes('/media_assets')) return json(MEDIA);
    return json([]);
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(([ref, token]) => {
    if (window !== window.top) return;
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: token, token_type: 'bearer', expires_in: 999999,
      expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
      user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
    }));
  }, [REF, jwt()]);
  await page.goto(`${BASE}/app/content${hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(hash ? '#ln-grid [data-ln-open]' : '[data-card="variant"]', { timeout: 60000 });
  return { page, ctx, errors, patches };
}
const SHOTS = process.env.SHOTS;   // SHOTS=<dir> → เก็บภาพหน้าจอไว้ตรวจด้วยตา
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png` }) : null);
const cards = (page) => page.$$eval('#ln-grid [data-ln-open]', (n) => n.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));

console.log('\n📣 Content Center — แท็บ LINE\n');

// ── 1. เปิดแท็บ · การ์ดเรียงเป็นชุด · ค้นจากเนื้อข้อความ · ตัวกรอง ─────────
{
  const { page, ctx, errors } = await openPage();
  await page.click('#wr-view-line');
  await page.waitForSelector('#ln-grid [data-ln-open]', { timeout: 8000 });
  check(await page.$eval('#wr-line-view', (el) => !el.classList.contains('hidden')), 'กด 📣 LINE → แท็บ LINE โผล่');
  check(await page.$eval('#wr-board-view', (el) => el.classList.contains('hidden')), 'บอร์ดถูกซ่อน');
  check(new URL(page.url()).hash === '#line', `URL = #line (ได้ ${new URL(page.url()).hash})`);
  let c = await cards(page);
  check(c.length === 3, `การ์ด 3 รอบ (ได้ ${c.length})`);
  check(c[0]?.startsWith('V1') && c[1]?.startsWith('V2') && c[2]?.startsWith('V1A'), `เรียง main ก่อนสำรอง: ${c.map((x) => x.split(' ')[0]).join(' → ')}`);
  check(c[2]?.includes('สำรอง'), 'รอบสำรองมีป้ายสำรอง');
  await shot(page, 'line-grid-desktop');
  const imgs = await page.$$eval('#ln-grid img', (n) => n.map((i) => i.getAttribute('src')));
  check(imgs.length === 3 && imgs.every((s) => s?.includes('/storage/v1/object/sign/content-media/')), 'ทุกการ์ดมีรูปจาก signed URL');

  await page.fill('#ln-search', 'ร้านกาแฟ');
  c = await cards(page);
  check(c.length === 1 && c[0].startsWith('V2'), `ค้น "ร้านกาแฟ" (อยู่บรรทัด 3 ไม่ใช่พาดหัว) → เจอ V2 ใบเดียว (ได้ ${c.length})`);
  await page.fill('#ln-search', 'ยอด 6 หลัก');
  check((await cards(page)).length === 3, 'ค้นคำจากพาดหัว variant → เจอทั้งชุด');
  await page.fill('#ln-search', 'nostaff-v2');
  check((await cards(page)).length === 1, 'ค้นด้วย utm_campaign ได้');
  await page.fill('#ln-search', '');

  const chip = (k) => page.$eval(`[data-ln-filter="${k}"]`, (el) => el.textContent.replace(/\s+/g, ' ').trim());
  check((await chip('todo')).endsWith('2'), `ชิปรอส่ง = 2 (main เท่านั้น) · ได้ "${await chip('todo')}"`);
  check((await chip('alt')).endsWith('1'), 'ชิปสำรอง = 1');
  await page.click('[data-ln-filter="todo"]');
  check((await cards(page)).length === 2, 'กดรอส่ง → เหลือ 2 การ์ด');
  check(!errors.length, `ไม่มี JS error (${errors.join(' | ') || '-'})`);
  await ctx.close();
}

// ── 2. เปิดรอบ · คัดลอกตรงตัวอักษร · จดว่าส่งแล้ว · กันเกิน 500 ────────────
{
  const { page, ctx, errors, patches } = await openPage();
  await page.click('#wr-view-line');
  await page.waitForSelector(`[data-ln-open="${R2}"]`, { timeout: 8000 });
  await page.click(`[data-ln-open="${R2}"]`);
  check(await page.$eval('#ln-dialog', (d) => d.open), 'กดการ์ด → เปิดหน้ารอบนั้น');
  check(new URL(page.url()).hash === `#line=${R2}`, 'URL มี #line=<round_id> ไว้แชร์ลิงก์ตรง');
  await page.click('[data-ln-act="copy"]');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(clip === T2, 'คัดลอกข้อความได้ตรงตัวอักษร (รวมบรรทัดว่าง)');
  await shot(page, 'line-dialog-desktop');

  await page.click('[data-ln-act="sent"]');
  await page.waitForFunction((id) => document.querySelector(`[data-ln-open="${id}"]`)?.textContent?.includes('ส่งแล้ว'), R2, { timeout: 4000 }).catch(() => {});
  const p = patches.at(-1) ?? {};
  check(p.status === 'sent' && !Number.isNaN(Date.parse(p.sent_at)), `✅ ส่งแล้ว → PATCH status=sent + sent_at (${JSON.stringify(p)})`);
  check((await page.$eval(`[data-ln-open="${R2}"]`, (el) => el.textContent)).includes('ส่งแล้ว'), 'การ์ดเปลี่ยนเป็นส่งแล้ว');

  await page.click('[data-ln-act="edit"]');
  await page.fill('#ln-edit', 'ก'.repeat(501));
  check((await page.textContent('#ln-edit-count')).startsWith('501/500'), 'ตัวนับขึ้น 501/500 ระหว่างพิมพ์');
  const before = patches.length;
  await page.click('[data-ln-act="edit-save"]');
  await page.waitForTimeout(300);
  check(patches.length === before, 'ข้อความเกิน 500 → ไม่บันทึก');
  await page.fill('#ln-edit', `${T2}\nแก้ในเว็บ`);
  await page.click('[data-ln-act="edit-save"]');
  await page.waitForTimeout(300);
  const e = patches.at(-1) ?? {};
  check(e.edited_in_app === true && e.text_body?.endsWith('แก้ในเว็บ'), 'แก้ข้อความ → บันทึก + ตั้ง edited_in_app (agent จะไม่ทับ)');
  check(!errors.length, `ไม่มี JS error (${errors.join(' | ') || '-'})`);
  await ctx.close();
}

// ── 3. ลิงก์ตรง #line=<id> เปิดหน้ารอบเลย · บอร์ดค้นเนื้อบทได้ · มือถือไม่ล้น ─
{
  const { page, ctx } = await openPage({ hash: `#line=${R1}` });
  await page.waitForFunction(() => document.getElementById('ln-dialog')?.open, null, { timeout: 8000 }).catch(() => {});
  check(await page.$eval('#ln-dialog', (d) => d.open), 'เปิดลิงก์ #line=<id> → หน้ารอบ V1 เปิดเอง');
  check((await page.textContent('#ln-d-title')).includes('V1'), 'หัวข้อเป็นรอบ V1');
  await ctx.close();
}
{
  const { page, ctx } = await openPage();
  await page.fill('#wr-board-search', 'Mac mini เครื่องเดียว');
  await page.waitForTimeout(200);
  const n = await page.$$eval('[data-card="variant"]', (n) => n.filter((x) => x.offsetParent !== null).length);
  check(n === 1, `บอร์ด: ค้นประโยคใน ai_result เจอการ์ด (ได้ ${n})`);
  await page.evaluate((vid) => document.querySelector(`[data-card="variant"][data-v="${vid}"]`)?.click(), VID);
  await page.waitForSelector('[data-action="open-line"]', { timeout: 8000 });
  await page.waitForFunction((vid) => document.querySelectorAll(`[data-media-for="${vid}"] img`).length === 3, VID, { timeout: 8000 }).catch(() => {});
  check(await page.$$eval(`[data-media-for="${VID}"] img`, (n) => n.length) === 3, 'การ์ด variant LN โชว์รูปทุกรอบ');
  await page.click('[data-action="open-line"]');
  await page.waitForSelector('#ln-grid [data-ln-open]', { timeout: 8000 });
  check(await page.$eval('#ln-search', (el) => el.value) === VID && (await cards(page)).length === 3, 'ปุ่ม 📣 เปิดในแท็บ LINE → กรองเฉพาะชุดนี้');
  await ctx.close();
}
{
  const { page, ctx } = await openPage({ hash: '#line', viewport: { width: 375, height: 812 } });
  const over = await page.evaluate(() => document.scrollingElement.scrollWidth - window.innerWidth);
  const wide = await page.evaluate(() => [...document.querySelectorAll('#war-room-app *')]
    .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest('.overflow-x-auto'))
    .slice(0, 3).map((e) => `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}`).join(', '));
  await shot(page, 'line-grid-mobile');
  check(over <= 0, `มือถือ 375px: แท็บ LINE ไม่ล้นแนวนอน (เกิน ${over}px${wide ? ` · ${wide}` : ''})`);
  await page.click(`[data-ln-open="${R2}"]`);
  const box = await page.$eval('#ln-dialog .modal-box', (el) => el.getBoundingClientRect().width);
  await page.waitForTimeout(400);   // modal fade-in
  await shot(page, 'line-dialog-mobile');
  check(box <= 375, `มือถือ: หน้ารอบกว้างไม่เกินจอ (${Math.round(box)}px)`);
  await ctx.close();
}

await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
