/**
 * Content Center — ปุ่ม "📁 เปิดใน Drive" ของแต่ละ variant (regression · 2026-10-03)
 *
 * ทำไมต้องมี: คุณปันต้องไล่หาโฟลเดอร์ชุดรูปใน Google Drive เอง · worker บนมินิจด drive_folder_id
 * ของโฟลเดอร์ <batch> ไว้ใน media_assets แล้ว ปุ่มนี้ต้องพาไปโฟลเดอร์ "ชุดล่าสุด" คลิกเดียว
 *   1) ชุด render ขึ้น Drive แล้ว → ลิงก์ drive/folders/<id> · แท็บใหม่ · มี aria-label
 *   2) ชุดใหม่สุดยังไม่ขึ้น (render เพิ่งเสร็จ) → ปุ่มกดไม่ได้ + บอกเวลาโดยประมาณ ไม่ใช่ลิงก์เสีย
 *      แม้ชุดเก่าจะมีโฟลเดอร์แล้วก็ไม่เอาชุดเก่ามาแทน
 *   3) ขึ้นบางใบ → ลิงก์โฟลเดอร์ + บอก 6/12 · มีแต่ id ไฟล์ → fallback file/d/<id>/view
 *   4) ไม่มีรูปเลย → ไม่มีปุ่ม · id แปลก (กัน injection) → ไม่ทำลิงก์
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4342 node tests/content-center-drive-folder.test.mjs   (ต้องมี dev server)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

// drawer โชว์ได้ทีละ idea และ variant ละรหัส (CR/AR/...) → แต่ละเคสใช้ idea ของตัวเอง
// A: CR ชุดใหม่ยังไม่ขึ้น + AR ขึ้นครบ · B: ขึ้นบางใบ · C: มีแค่ id ไฟล์ · D: ไม่มีรูป · E: id แปลก
const CIDS = { A: 'CNT-2026-10-03-091', B: 'CNT-2026-10-03-092', C: 'CNT-2026-10-03-093', D: 'CNT-2026-10-03-094', E: 'CNT-2026-10-03-095' };
const IDEAS = Object.values(CIDS).map((cid) => ({
  content_id: cid, title: `ไอเดียทดสอบปุ่ม Drive ${cid}`, canonical_angle: null, topic_cluster: null, funnel_stage: null,
  pillar_bucket: null, pillar_v14: 'team', angle_type: null, acid_test: 'passed', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-10-03T00:00:00Z',
}));
const variant = (cid, code, format) => ({
  variant_id: `${cid}-${code}`, content_id: cid, format, target_platforms: ['instagram'],
  working_title: 'ไอเดียทดสอบปุ่ม Drive', markdown_path: null, variant_status: 'draft', cta_keyword: null,
  status_changed_at: '2026-10-03T00:00:00Z', created_at: '2026-10-03T00:00:00Z',
  script_draft: null, ai_result: null, ai_result_at: null, visual_spec: null,
});
const VARIANTS = [variant(CIDS.A, 'CR', 'carousel'), variant(CIDS.A, 'AR', 'article'),
  ...['B', 'C', 'D', 'E'].map((k) => variant(CIDS[k], 'CR', 'carousel'))];

const OLD_FOLDER = '1OLDfolderAAAAAAAAAAAAAAAAAAAAAAA';
const AR_FOLDER = '1ARfolder_-BBBBBBBBBBBBBBBBBBBBBB';
const XR_FOLDER = '1XRfolderCCCCCCCCCCCCCCCCCCCCCCCC';
const FR_FILE = '1FRfileDDDDDDDDDDDDDDDDDDDDDDDDDD';
const recent = new Date(Date.now() - 5 * 60_000).toISOString();   // render เพิ่งเสร็จ 5 นาที

let n = 0;
const asset = (vid, batch, o = {}) => ({
  asset_id: `00000000-0000-0000-0000-${String(++n).padStart(12, '0')}`, content_id: vid.slice(0, -3), variant_id: vid,
  asset_type: 'carousel_png', storage_path: `${vid.slice(0, -3)}/${vid}/${batch}/slide-${String(n).padStart(2, '0')}.png`,
  source: 'note_studio', render_batch: batch, sort_order: n, is_cover: false, asset_status: 'exported',
  drive_path: null, drive_file_id: null, drive_folder_id: null, width: 2160, height: 2700, created_at: '2026-10-03T05:00:00Z', ...o,
});
const inDrive = (folder) => ({ drive_file_id: `1file${String(n + 1).padStart(28, 'Z')}`, drive_folder_id: folder, drive_path: 'gdrive:Content Center/x' });
const MEDIA = [
  // CR: listMedia คืนเฉพาะที่ไม่ archived — ชุดเก่า (เก็บเข้ากรุ) จะไม่มาอยู่แล้ว แต่ใส่รูปอัปเองที่ขึ้น Drive ไว้ทดสอบว่าไม่ถูกเลือกแทนชุด render
  asset(`${CIDS.A}-CR`, 'studio-20261003070000', { created_at: recent }),
  asset(`${CIDS.A}-CR`, 'studio-20261003070000', { created_at: recent }),
  asset(`${CIDS.A}-CR`, null, { source: 'upload', render_batch: null, created_at: '2026-10-02T00:00:00Z', ...inDrive(OLD_FOLDER) }),
  asset(`${CIDS.A}-AR`, 'studio-20261003050000', inDrive(AR_FOLDER)),
  ...Array.from({ length: 12 }, (_, i) => asset(`${CIDS.B}-CR`, 'studio-20261003051000', i < 6 ? inDrive(i < 4 ? XR_FOLDER : null) : {})),
  asset(`${CIDS.C}-CR`, 'agent-2026-10-02', { drive_file_id: FR_FILE }),
  asset(`${CIDS.E}-CR`, 'studio-20261003052000', { drive_file_id: 'x"><img src=x onerror=alert(1)>', drive_folder_id: 'bad"id' }),
];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.route('**/*', async (route) => {
  const url = route.request().url();
  if (url.startsWith(SB)) return route.fallback();
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
  if (url.includes('/media_assets')) {
    const ids = decodeURIComponent(url).match(/variant_id=in\.\(([^)]*)\)/)?.[1].split(',').map((x) => x.replace(/"/g, '')) ?? [];
    return json(MEDIA.filter((m) => ids.includes(m.variant_id)));
  }
  if (url.includes('/object/sign/')) return json(MEDIA.map((m) => ({ path: m.storage_path, signedUrl: '/favicon.svg', error: null })));
  return json([]);
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => { errors.push(`dialog: ${d.message()}`); d.dismiss(); });
await page.addInitScript(([ref, token]) => {
  if (window !== window.top) return;
  localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
    access_token: token, token_type: 'bearer', expires_in: 999999,
    expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
    user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
  }));
}, [REF, jwt()]);
await page.goto(`${BASE}/app/content`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-card="variant"]', { timeout: 60000 });
// เปิด drawer ของ idea แล้วรอให้รูปโหลดเสร็จ (ช่องนับรูปถูกเติม หรือขึ้น "ยังไม่มีรูป")
async function open(cid) {
  await page.evaluate((vid) => document.querySelector(`[data-card="variant"][data-v="${vid}"]`)?.click(), `${cid}-CR`);
  await page.waitForFunction((vid) => {
    const box = document.querySelector(`[data-media-for="${vid}"]`);
    return box && !box.textContent.includes('กำลังโหลด');
  }, `${cid}-CR`, { timeout: 8000 }).catch(() => {});
}
const ctl = (vid) => page.$eval(`[data-drive-for="${vid}"]`, (el) => {
  const c = el.firstElementChild;
  return c ? { tag: c.tagName, href: c.getAttribute('href'), target: c.getAttribute('target'), rel: c.getAttribute('rel'),
    text: c.textContent.trim(), aria: c.getAttribute('aria-label'), disabled: c.hasAttribute('disabled') } : null;
}).catch(() => 'missing');

console.log('\n📁 Content Center — ปุ่มเปิดใน Drive\n');

await open(CIDS.A);
const ar = await ctl(`${CIDS.A}-AR`);
check(ar?.tag === 'A' && ar.href === `https://drive.google.com/drive/folders/${AR_FOLDER}`, `ขึ้นครบ → ลิงก์โฟลเดอร์ (${ar?.href})`);
check(ar?.target === '_blank' && /noopener/.test(ar?.rel ?? ''), 'เปิดแท็บใหม่ + rel=noopener');
check(ar?.text === '📁 เปิดใน Drive' && !!ar?.aria, `ป้าย "📁 เปิดใน Drive" + aria-label (${ar?.aria})`);

const cr = await ctl(`${CIDS.A}-CR`);
check(cr?.tag === 'BUTTON' && cr.disabled, 'ชุดใหม่สุดยังไม่ขึ้น Drive → ปุ่มกดไม่ได้');
check(/ขึ้น Drive ราว \d{1,2}:\d{2}/.test(cr?.text ?? ''), `บอกเวลาโดยประมาณ (${cr?.text})`);
check(!(cr?.href ?? '').includes(OLD_FOLDER), 'ไม่เอาโฟลเดอร์รูปอัปเองชุดเก่ามาแทนชุด render ใหม่');
check(!!cr?.aria && cr.aria.includes('30 นาที'), 'aria-label อธิบายว่าทำไมยังกดไม่ได้');

await open(CIDS.B);
const xr = await ctl(`${CIDS.B}-CR`);
check(xr?.href === `https://drive.google.com/drive/folders/${XR_FOLDER}` && xr.text.includes('6/12'), `ขึ้นบางใบ → ลิงก์โฟลเดอร์ + 6/12 (${xr?.text})`);

await open(CIDS.C);
const fr = await ctl(`${CIDS.C}-CR`);
check(fr?.href === `https://drive.google.com/file/d/${FR_FILE}/view`, `มีแค่ id ไฟล์ → fallback เปิดไฟล์ (${fr?.href})`);

await open(CIDS.D);
check(await ctl(`${CIDS.D}-CR`) === null, 'ไม่มีรูป → ไม่มีปุ่ม');
await open(CIDS.E);
const br = await ctl(`${CIDS.E}-CR`);
check(br?.tag === 'BUTTON' && br.disabled && !br.href, `id แปลก → ไม่ทำลิงก์ (${br?.text})`);

check(await page.$$eval('[data-drive-for] a, [data-drive-for] button', (els) => els.every((e) => e.classList.contains('tap-44'))), 'ทุกปุ่มขนาดแตะ 44px (tap-44)');
check(!errors.length, `ไม่มี JS error/alert (${errors.join(' | ') || '-'})`);

await open(CIDS.B);   // ป้ายยาวสุด (📁 เปิดใน Drive 6/12)
await page.setViewportSize({ width: 375, height: 812 });
const overflow = await page.evaluate(() => [...document.querySelectorAll('[data-drive-for]')].some((el) => {
  const card = el.closest('article'); return card && card.scrollWidth > card.clientWidth + 1;
}));
check(!overflow, 'จอมือถือ 375px — การ์ด variant ไม่ล้นแนวนอน');
await page.screenshot({ path: process.env.SHOT || '/tmp/drive-folder-button.png', fullPage: false });

await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
