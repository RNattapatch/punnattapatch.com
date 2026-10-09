/**
 * Note Studio — ปรับขนาดตัวอักษร · ไฮไลต์ 2 สี (==coral== / ++เหลือง++) · รูปพื้นหลังแบบการ์ดลอย (photo card) — 2026-10-09
 *
 * ทำไมต้องมี: คุณปันขอให้แก้ใน Note Studio ได้เอง (เดิมต้องให้ agent แก้ JSON) — เทสต์นี้กันว่า
 *   1) ค่าที่ตั้งในหน้าเว็บไปถึงพรีวิว และถูกบันทึกลง visual_spec ในรูปที่ worker บนมินิรับ (size · markup ==/++ · photo.path)
 *   2) รูปที่อัปขึ้น bucket ใต้ <CNT>/<variant>/studio-photo/ (worker ปฏิเสธ path อื่น)
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4341 node tests/note-studio-controls.test.mjs   (ต้องมี dev server)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const CID = 'CNT-2026-10-09-099';
const VID = `${CID}-CR`;
const SAVED_PHOTO = `${CID}/${VID}/studio-photo/1760000000000-alex.jpg`;
// PNG 1×1 จริง — ให้ FileReader/รูปในพรีวิวทำงานเหมือนรูปจริง
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const IDEAS = [{
  content_id: CID, title: 'ทดสอบ Note Studio', canonical_angle: null, topic_cluster: null, funnel_stage: null,
  pillar_bucket: null, pillar_v14: 'team', angle_type: null, acid_test: 'pending', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-10-09T00:00:00Z',
}];
const VARIANTS = [{
  variant_id: VID, content_id: CID, format: 'carousel', target_platforms: ['instagram'],
  working_title: 'ทดสอบ Note Studio', markdown_path: null, variant_status: 'draft', cta_keyword: null,
  status_changed_at: '2026-10-09T00:00:00Z', created_at: '2026-10-09T00:00:00Z',
  script_draft: null, ai_result: null, ai_result_at: null,
  visual_spec: { slug: VID.toLowerCase(), skin: 'notes', ratio: '4:5', mobile: true, follow: false, slides: [
    { type: 'hook', text: 'ปกทดสอบ\n<mark>บรรทัดสอง</mark>' },
    { type: 'content', text: 'Alex Hormozi\nรูปที่บันทึกไว้แล้ว', photo: { path: SAVED_PHOTO, pos: 'center top' } },
    { type: 'content', text: 'หัวข้อ\nเนื้อ <mark>คำเน้น</mark>' },
  ] },
}];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();
const ctx = await browser.newContext();
const uploads = [];
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
  if (url.includes('/storage/v1/object/') && req.method() === 'POST') {
    uploads.push(decodeURIComponent(new URL(url).pathname.replace(/^\/storage\/v1\/object\/content-media\//, '')));
    return json({ Key: 'ok' });
  }
  if (url.includes('/storage/v1/object/')) return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: PNG });
  if (url.includes('/content_variants') && req.method() === 'PATCH') { patches.push(JSON.parse(req.postData() || '{}')); return json([]); }
  if (url.includes('/content_items')) return json(IDEAS);
  if (url.includes('/content_variants')) return json(VARIANTS);
  return json([]);
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());
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

console.log('\n🎨 Note Studio — ขนาด · สีไฮไลต์ · รูปพื้นหลัง\n');

const srcdoc = () => page.$eval('#ns-frame', (f) => f.getAttribute('srcdoc') ?? '');
const waitDoc = (needle, not = false) => page.waitForFunction(([n, neg]) => {
  const d = document.getElementById('ns-frame')?.getAttribute('srcdoc') ?? '';
  return neg ? !d.includes(n) : d.includes(n);
}, [needle, not], { timeout: 8000 }).catch(() => {});

await page.evaluate((vid) => document.querySelector(`[data-card="variant"][data-v="${vid}"]`)?.click(), VID);
await page.waitForSelector('[data-action="note-studio"]', { timeout: 8000 });
await page.click('[data-action="note-studio"]');
await page.waitForSelector('input[data-ns="size"][data-i="2"]', { timeout: 8000 });

// ── 1. รูปที่บันทึกไว้แล้ว: โหลดจาก bucket มาพรีวิวเป็น photo card ──
await page.click('[data-ns="select"][data-i="1"]');
await waitDoc('class="pc-bg" src="data:image/png');
const d1 = await srcdoc();
check(d1.includes('photo-card') && d1.includes('class="pc-card"'), 'ใบที่มีรูป → พรีวิวเป็น photo card (รูปเต็มใบ + การ์ดลอย)');
check(d1.includes('class="pc-bg" src="data:image/png'), 'รูปพื้นหลังโหลดจาก bucket แล้วฝังเป็น data URL (iframe sandbox โหลด URL ตรงไม่ได้)');
check(await page.$eval('select[data-ns="pos"][data-i="1"]', (el) => el.value) === 'center top', 'ตำแหน่งรูปเริ่มที่ "ชิดบน"');
check(!(await page.$('[data-i="0"][data-ns="photo"]')), 'ใบปกไม่มีปุ่มใส่รูป (photo card เฉพาะใบเนื้อ)');

// ── 2. ขนาดตัวอักษร ──
await page.click('[data-ns="select"][data-i="2"]');
await page.fill('input[data-ns="size"][data-i="2"]', '90');
await waitDoc('font-size:90px');
check((await srcdoc()).includes('font-size:90px'), 'ใส่ขนาด 90 → พรีวิวใช้ 90px');
check((await page.$eval('[data-slide="2"] [data-px]', (el) => el.textContent)) === '90px', 'ป้าย px ของใบเปลี่ยนเป็น 90px');
await page.fill('input[data-ns="size"][data-i="2"]', '7');
check((await srcdoc()).includes('font-size:90px'), 'พิมพ์ค่ายังไม่จบ/นอกช่วง (7) → ยังใช้ค่าเดิม ไม่พัง');
await page.fill('input[data-ns="size"][data-i="2"]', '');
await waitDoc('style="font-size:', true);
check(!(await srcdoc()).includes('style="font-size:'), 'ลบค่าออก → กลับไปขนาดอัตโนมัติ');
await page.fill('input[data-ns="size"][data-i="2"]', '72');
await waitDoc('font-size:72px');

// ── 3. ไฮไลต์ 2 สีในใบเดียว: ==coral== · ++เหลือง++ ──
await page.fill('textarea[data-ns="text"][data-i="2"]', 'หัวข้อ\nเน้น ==coral== กับ ++เหลือง++ นะ');
await waitDoc('<mark class="y">เหลือง</mark>');
const d3 = await srcdoc();
check(d3.includes('<mark>coral</mark>') && d3.includes('<mark class="y">เหลือง</mark>'), '==คำ== = coral · ++คำ++ = เหลือง อยู่ในใบเดียวกันได้');
check(d3.includes('mark.y'), 'CSS ไฮไลต์เหลืองถูกซิงก์มาจากแม่แบบจริง');
check(!(await page.$('select[data-ns="hl"]')), 'ไม่มีตัวเลือกสีทั้งใบแล้ว (ใช้ ++ แทน)');

// ── 4. อัปรูปพื้นหลังให้ใบ 3 ──
await page.setInputFiles('input[data-ns="photo"][data-i="2"]', { name: 'My Photo!.png', mimeType: 'image/png', buffer: PNG });
await page.waitForSelector('select[data-ns="pos"][data-i="2"]', { timeout: 8000 }).catch(() => {});
await waitDoc('class="pc-card"');
const up = uploads.at(-1) ?? '';
check(new RegExp(`^${CID}/${VID}/studio-photo/\\d+-my-photo-.png$`).test(up), `อัปขึ้น path ที่ worker รับ (${up})`);
check((await srcdoc()).includes('class="pc-card"') && (await srcdoc()).includes('<mark class="y">'), 'ใบ 3 กลายเป็น photo card และยังคงไฮไลต์เหลือง');
await page.selectOption('select[data-ns="pos"][data-i="2"]', 'center center');
await waitDoc('object-position:center center');
check((await srcdoc()).includes('object-position:center center'), 'เปลี่ยนตำแหน่งรูปเป็น "ชิดกลาง" → พรีวิวตาม');

// ── 5. บันทึก → visual_spec มีค่าครบในรูปที่ worker ตรวจ ──
await page.click('#ns-save');
await page.waitForFunction(() => document.getElementById('ns-dirty')?.textContent === 'บันทึกแล้ว', null, { timeout: 8000 }).catch(() => {});
const saved = patches.at(-1)?.visual_spec?.slides ?? [];
check(saved[2]?.size === 72 && saved[2]?.text === 'หัวข้อ\nเน้น <mark>coral</mark> กับ <mark class="y">เหลือง</mark> นะ', `บันทึก size 72 + markup 2 สี (${JSON.stringify({ size: saved[2]?.size, text: saved[2]?.text })})`);
check(saved[2]?.photo?.path === up && saved[2]?.photo?.pos === 'center center' && !saved[2]?.photo?.src, 'บันทึก photo {path, pos} — ไม่มี src ของเครื่อง');
check(saved[1]?.photo?.path === SAVED_PHOTO && !saved[1]?.hl && !saved[1]?.size, 'ใบอื่นไม่ถูกแตะ');

// ── 5b. เปิดใหม่ markup กลับเป็น ==/++ ในช่องแก้ ──
check((await page.inputValue('textarea[data-ns="text"][data-i="2"]')) === 'หัวข้อ\nเน้น ==coral== กับ ++เหลือง++ นะ', 'ช่องแก้แสดง ==coral== กับ ++เหลือง++ ตามที่พิมพ์');

// ── 6. เอารูปออก / เปลี่ยนชนิดใบ ──
await page.click('[data-ns="photo-del"][data-i="2"]');
await waitDoc('class="pc-card"', true);
check(!(await srcdoc()).includes('class="pc-card"') && (await srcdoc()).includes('class="n-bar"'), 'กด ✕ เอารูปออก → กลับเป็นใบ Notes ปกติ');
await page.selectOption('select[data-ns="type"][data-i="1"]', 'cta');
await page.click('#ns-save');
await page.waitForTimeout(500);
check(!patches.at(-1)?.visual_spec?.slides?.[1]?.photo, 'เปลี่ยนใบรูปเป็นใบปิดท้าย → รูปถูกถอด (worker รับรูปเฉพาะใบเนื้อ)');

check(!errors.length, `ไม่มี JS error (${errors.join(' | ') || '-'})`);
await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
