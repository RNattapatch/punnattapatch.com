/**
 * Note Studio — กด Render แล้วเบราว์เซอร์วาด PNG เอง ไม่ต้องรอคิว Mac mini (2026-10-12)
 *
 * ทำไมต้องมี: คุณปันแก้แค่ข้อความแล้วกด Render ต้องรอมินิที่มีงาน growth_eval ต่อคิวอยู่ ~15 นาที
 *   → เบราว์เซอร์ (Chrome) วาดด้วยแม่แบบเดียวกับพรีวิว แล้วเขียน bucket + media_assets ในรูปแบบเดียวกับ worker
 *   ให้ archive sweep ของมินิส่งต้นฉบับขึ้น Drive ต่อได้เหมือนเดิม · Safari/วาดพัง → ส่งให้มินิทำแทน
 * เทสต์นี้กันว่า
 *   1) Chrome: ได้ PNG 2160×2700 ครบทุกใบ ที่ path/แถวที่ archive sweep อ่านได้ · ไม่มี wr_jobs
 *   2) อัปไฟล์ครบก่อนค่อยเก็บชุดเก่าเข้ากรุ (อัปพังกลางทาง ชุดเดิมยังอยู่)
 *   3) Safari → ส่ง render_notes ให้มินิเหมือนเดิม
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4341 node tests/note-studio-browser-render.test.mjs   (ต้องมี dev server)
 *        DUMP=<โฟลเดอร์> = เซฟ PNG ที่เบราว์เซอร์วาดไว้ดูด้วยตา
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const CID = 'CNT-2026-10-12-099';
const VID = `${CID}-CR`;
const PHOTO = `${CID}/${VID}/studio-photo/1760000000000-team.png`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
// supabase-js ส่ง Blob เป็น multipart (เหมือนปุ่มอัปรูปเดิม) → หา PNG ข้างใน body แล้วอ่าน IHDR
const pngSize = (b) => {
  const at = b ? b.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47])) : -1;
  return at >= 0 && b.length > at + 24 ? [b.readUInt32BE(at + 16), b.readUInt32BE(at + 20)] : null;
};
const partType = (b) => b?.toString('latin1').match(/Content-Type: (image\/[a-z]+)/i)?.[1] ?? null;

const IDEAS = [{
  content_id: CID, title: 'ทดสอบ Render ในเบราว์เซอร์', canonical_angle: null, topic_cluster: null, funnel_stage: null,
  pillar_bucket: null, pillar_v14: 'team', angle_type: null, acid_test: 'pending', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-10-12T00:00:00Z',
}];
const VARIANTS = [{
  variant_id: VID, content_id: CID, format: 'carousel', target_platforms: ['instagram'],
  working_title: 'ทดสอบ Render ในเบราว์เซอร์', markdown_path: null, variant_status: 'draft', cta_keyword: null,
  status_changed_at: '2026-10-12T00:00:00Z', created_at: '2026-10-12T00:00:00Z',
  script_draft: null, ai_result: null, ai_result_at: null,
  visual_spec: { slug: VID.toLowerCase(), skin: 'notes', ratio: '4:5', mobile: true, follow: true, slides: [
    { type: 'hook', text: 'ปกทดสอบ\n<mark>บรรทัดสอง</mark>', sub: 'บรรทัดรอง <mark class="y">เหลือง</mark>' },
    { type: 'content', text: 'ใบรูป\nมีรูปพื้นหลัง', photo: { path: PHOTO, pos: '50% 0%', zoom: 1.4, card: 'top' } },
    { type: 'content', text: 'หัวข้อ\nเนื้อ <mark>คำเน้น</mark>' },
  ] },
}];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();

/** เปิด Note Studio ของชิ้นทดสอบ → กด Render → คืน log ของ request ที่หน้าเว็บยิง */
async function runRender(userAgent) {
  const ctx = await browser.newContext(userAgent ? { userAgent } : {});
  const log = [];   // ลำดับเหตุการณ์ทั้งหมด (เช็คว่าอัปครบก่อนเก็บชุดเก่าเข้ากรุ)
  const uploads = [];
  const media = { patch: [], post: [] };
  const jobs = [];
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
    if (url.includes('/storage/v1/object/') && req.method() === 'POST' && !url.includes('/sign/')) {
      const path = decodeURIComponent(new URL(url).pathname.replace(/^\/storage\/v1\/object\/content-media\//, ''));
      const body = req.postDataBuffer();
      uploads.push({ path, size: pngSize(body), type: partType(body) });
      if (process.env.DUMP && /slide-\d+\.png$/.test(path)) {
        mkdirSync(process.env.DUMP, { recursive: true });
        const at = body.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47])), end = body.indexOf(Buffer.from('IEND'), at);
        writeFileSync(`${process.env.DUMP}/${path.split('/').pop()}`, body.subarray(at, end + 8));
      }
      log.push(`upload ${path.split('/').pop()}`);
      return json({ Key: path });
    }
    if (url.includes('/storage/v1/object/')) return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: PNG });
    if (url.includes('/media_assets') && req.method() === 'PATCH') {
      media.patch.push({ url: decodeURIComponent(url), body: JSON.parse(req.postData() || '{}') });
      log.push(`media PATCH ${JSON.parse(req.postData() || '{}').asset_status ?? 'order'}`);
      return json([]);
    }
    if (url.includes('/media_assets') && req.method() === 'POST') { media.post.push(JSON.parse(req.postData() || '[]')); log.push('media POST'); return json([]); }
    if (url.includes('/wr_jobs') && req.method() === 'POST') { jobs.push(JSON.parse(req.postData() || '{}')); return json({ id: 'job-1' }); }
    if (url.includes('/wr_jobs')) return json({ id: 'job-1', job_type: 'render_notes', status: 'done', result: { count: 4 }, error: null });
    if (url.includes('/content_variants') && req.method() === 'PATCH') return json([]);
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
  await page.evaluate((vid) => document.querySelector(`[data-card="variant"][data-v="${vid}"]`)?.click(), VID);
  await page.waitForSelector('[data-action="note-studio"]', { timeout: 8000 });
  await page.click('[data-action="note-studio"]');
  await page.waitForSelector('textarea[data-ns="text"][data-i="2"]', { timeout: 8000 });
  const t0 = Date.now();
  await page.click('#ns-render');
  await page.waitForFunction(() => /^(✓|⚠️)/.test(document.getElementById('ns-status')?.textContent ?? ''), null, { timeout: 60000 }).catch(() => {});
  const status = await page.$eval('#ns-status', (el) => el.textContent);
  const ms = Date.now() - t0;
  await ctx.close();
  return { status, ms, log, uploads, media, jobs, errors };
}

// ── 1. Chrome: วาดเองในเบราว์เซอร์ ──
console.log('\n🖨 Note Studio — Render ในเบราว์เซอร์ (Chrome)\n');
const a = await runRender();
check(/^✓ ได้รูป 4 ใบ \(เบราว์เซอร์\)/.test(a.status), `ขึ้นสถานะว่าได้รูปจากเบราว์เซอร์ (${a.status}) · ${(a.ms / 1000).toFixed(1)} วิ`);
check(a.jobs.length === 0, 'ไม่ส่งงานเข้าคิว Mac mini (wr_jobs)');
const pngs = a.uploads.filter((u) => /\/slide-\d+\.png$/.test(u.path));
check(pngs.length === 4, `อัป PNG 4 ใบ = 3 ใบ + หน้า Follow (${pngs.length})`);
const batch = pngs[0]?.path.split('/')[2] ?? '';
check(pngs.every((u, i) => u.path === `${CID}/${VID}/${batch}/slide-${String(i + 1).padStart(2, '0')}.png`) && /^studio-\d{14}$/.test(batch),
  `path แบบเดียวกับ worker: <CNT>/<variant>/studio-<เวลา>/slide-NN.png (${pngs[0]?.path})`);
check(pngs.every((u) => u.size?.[0] === 2160 && u.size?.[1] === 2700), `ทุกใบเป็น PNG 2160×2700 เท่ากับ render.mjs (${pngs.map((u) => u.size?.join('×')).join(', ')})`);
check(pngs.every((u) => u.type === 'image/png'), 'ไฟล์ที่อัปเป็น image/png');
const archive = a.media.patch.find((p) => p.body.asset_status === 'archived');
check(!!archive && archive.url.includes(`variant_id=eq.${VID}`) && archive.url.includes('source=in.(note_studio,agent)') && archive.url.includes('asset_status=neq.archived'),
  'ชุด render เก่า (note_studio/agent) ของชิ้นนี้ถูกเก็บเข้ากรุ ไม่แตะรูปที่อัปเอง');
const rows = a.media.post[0] ?? [];
check(rows.length === 4 && rows.every((r, i) => r.source === 'note_studio' && r.render_batch === batch && r.sort_order === i && r.asset_status === 'exported'
  && r.asset_type === 'carousel_png' && r.content_id === CID && r.variant_id === VID && r.width === 2160 && r.height === 2700 && r.bytes > 10_000),
  'แถว media_assets ครบ 4 ใบ รูปแบบเดียวกับ worker (archive sweep ส่งขึ้น Drive ต่อได้)');
check(rows[0]?.is_cover === true && rows.slice(1).every((r) => !r.is_cover), 'ใบแรก = ปก');
const lastUpload = a.log.findLastIndex((l) => l.startsWith('upload slide-'));
const archivedAt = a.log.findIndex((l) => l === 'media PATCH archived');
check(lastUpload >= 0 && archivedAt > lastUpload, `อัปครบทุกใบก่อนค่อยเก็บชุดเก่าเข้ากรุ (${a.log.join(' → ')})`);
check(a.uploads.some((u) => u.path === PHOTO) === false, 'ไม่อัปรูปพื้นหลังซ้ำ');
check(!a.errors.length, `ไม่มี JS error (${a.errors.join(' | ') || '-'})`);

// ── 2. Safari: ส่งให้มินิทำเหมือนเดิม ──
console.log('\n🍎 Safari → Mac mini ทำแทน\n');
const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const b = await runRender(SAFARI);
check(b.jobs.length === 1 && b.jobs[0].job_type === 'render_notes' && b.jobs[0].payload?.variant_id === VID, `ส่ง render_notes ให้มินิ (${JSON.stringify(b.jobs[0] ?? {})})`);
check(!b.uploads.some((u) => /\/slide-\d+\.png$/.test(u.path)) && !b.media.post.length, 'เบราว์เซอร์ไม่อัปรูปเอง');
check(/^✓ ได้รูป 4 ใบ \(Mac mini\)/.test(b.status), `สถานะบอกว่ามินิทำ (${b.status})`);
check(!b.errors.length, `ไม่มี JS error (${b.errors.join(' | ') || '-'})`);

await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ${pass} ผ่าน · ${fail} ไม่ผ่าน\n`);
process.exit(fail ? 1 : 0);
