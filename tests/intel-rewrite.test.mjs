/**
 * Intel Warroom + Content Center — แก้ชื่อการ์ด · "เกลาเป็น version ผม" (2026-09-08)
 *
 * ทำไมต้องมี: คุณปันขอ (1) แก้หัวข้อการ์ดได้ทั้ง 2 หน้า (2) ปุ่มบนการ์ดคลิปให้เลือกธง/ธีม
 * แล้วส่งให้ Codex บนมินิเกลาเป็นบทของปัน → ผลกลับมาอยู่บนการ์ด + ส่งต่อเข้า Content Center ได้
 * ไฟล์นี้ขับ UI จริง แล้วนับ request ที่วิ่งออกไป Supabase (ทุกอย่างถูก intercept — ไม่แตะ production)
 *
 * Usage: node tests/intel-rewrite.test.mjs   (ต้องมี dev server ที่ :4325)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const ITEM_ID = '3b9f2a10-1c2d-4e5f-8a9b-0c1d2e3f4a5b';
const NO_TS_ID = '4c0a3b21-2d3e-4f60-9b0c-1d2e3f4a5b6c';
const REPORT = `## [พี่แอมป์ การตลาดการเตลิด] ไลฟ์ TikTok พูดคำว่า ราคาผิดมั้ย
**meta:** views 69,200 · rising 69,200 views · https://www.tiktok.com/@amp.sarun/video/7681615818634956053

**1. สรุปคลิป 2-3 ประโยค**
คลิปตัดจากงานพูดสด

**5. 🔁 Steal-the-structure**
สูตร: **[คำถามท้าทาย] → [เคสคนพลาด] → [เฉลย] → CTA**
ตัวอย่างที่ปันเอาไปใช้: "ถ้าทีมขายของคุณพูดสคริปต์เดียวกันกับลูกค้าทุกคน คุณรู้มั้ยว่านั่นคือเหตุผลที่ deal หลุด?" → เล่าเคส

**🎙 บทพูดเต็ม (ถอดจากเสียงจริง)**

\`[0:00]\` ถ้าเธอเป็นติ๊กต๊อกคนพูดว่าพาราในไลค์ที่ขายของเธอรู้มั้ย มึงเอาความมั่นอะไรว่าเราจะเก่งกว่าเขาอะ

\`[0:14]\` เธอนึกออกปะ เพราะว่าราคา 799 แต่พูดไม่ตรง 799 เคล็ดลับของแอมป์ในการทำ แอมป์จะบอกว่า

\`[0:36]\` ราคานั้นแม่ประมาณ 700 กว่าบาท แต่ละเครื่องได้ไม่เท่ากัน
`;
const item = (id, extra = {}) => ({
  id, job_id: 'night-2026-09-07-04', kind: 'clip', platform: 'tiktok', source_url: 'https://www.tiktok.com/@amp.sarun/video/7681615818634956053',
  title: 'Night Scout — [พี่แอมป์ การตลาดการเตลิด] ไลฟ์ TikTok พูดคำว่า ราคาผิดมั้ย', channel: 'พี่แอมป์ การตลาดการเตลิด',
  summary: 'คลิปตัดจากงานพูดสด', verdict: 'STEAL 6/10', score: 6, views: 69200, duration_s: null, cover_path: null, media: [],
  report_md: REPORT, report_path: 'wiki/intel/night-scout/2026-09-07.md', tags: [], scraped_at: '2026-09-07', created_at: '2026-09-07T03:50:00Z', target_id: null, ...extra,
});
const ITEMS = { [ITEM_ID]: item(ITEM_ID), [NO_TS_ID]: item(NO_TS_ID, { report_md: '## [x] เก่า\n**meta:** views 1 · u\n\n**1. สรุปคลิป**\nไม่มีบทพูด', title: 'การ์ดเก่าไม่มีบทพูด' }) };
const SCRIPT_MD = '# 🎯 ธง\nคนดูได้ของ\n# Hook (0-2 วิ)\nบอกราคาในคลิป ผิดไหม?\n# Setup (2-10 วิ)\nเดี๋ยวพาไปดู\n# Body\nb\n↻ Rehook: แล้วถ้า…\n# Payoff\np\n# CTA\nทัก DM คำว่า Agent\n# 🔤 Hook Text\nบอกราคา\nโดนแบน?\n# 📝 Caption\n📍 หนึ่ง\n📍 สอง\n📍 สาม ☺️';
const IDEA = { content_id: 'CNT-2026-09-08-001', title: 'คนเป็นเซลล์ ทำคอนเทนต์บอกราคาไป ผิดไหม', canonical_angle: 'x', topic_cluster: null, funnel_stage: null, pillar_bucket: 'sales_team', angle_type: null, acid_test: 'pending', idea_status: 'active', source_type: 'webapp', source_ref: null, created_at: '2026-09-08T00:00:00Z' };

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();

/** เปิดหน้า app พร้อม session ปลอม + Supabase ปลอม — คืน page + log request ที่เขียน */
async function open(path, { scripts = [], jobStatus = ['running', 'done'] } = {}) {
  const ctx = await browser.newContext();
  const writes = [];
  let jobPolls = 0;
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE)) return route.continue();
    if (url.startsWith(SB)) return route.fallback();
    return route.abort();
  });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = req.url(), method = req.method();
    const single = (req.headers()['accept'] || '').includes('pgrst.object');
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (['PATCH', 'POST', 'DELETE'].includes(method) && !url.includes('/auth/')) {
      const table = url.split('/rest/v1/')[1]?.split('?')[0];
      writes.push({ method, table, url, body: method === 'DELETE' ? null : req.postDataJSON() });
      if (table === 'wr_jobs' && method === 'POST') return json({ id: 'job-1' });
      if (table === 'content_items' && method === 'POST') return json(IDEA);
      if (table === 'content_variants' && method === 'POST') return json({ variant_id: 'CNT-2026-09-08-001-RL', content_id: IDEA.content_id, format: 'reel', target_platforms: ['tiktok'], variant_status: 'draft', script_draft: null, ai_result: null, ai_result_at: null, status_changed_at: '2026-09-08T00:00:00Z', created_at: '2026-09-08T00:00:00Z' });
      if (table === 'newsroom_jobs' && method === 'POST') return json([]);
      return json(single ? {} : []);
    }
    if (url.includes('/rest/v1/newsroom_items')) {
      const m = /id=eq\.([0-9a-f-]+)/.exec(url);
      if (m) return json(single ? ITEMS[m[1]] : [ITEMS[m[1]]]);
      return json(Object.values(ITEMS));
    }
    if (url.includes('/rest/v1/intel_scripts')) return json(scripts);
    if (url.includes('/rest/v1/wr_jobs')) {
      const st = jobStatus[Math.min(jobPolls++, jobStatus.length - 1)];
      const job = { id: 'job-1', job_type: 'rewrite_reel', status: st, result: st === 'done' ? { improved: SCRIPT_MD, script_id: 's-1' } : null, error: null, payload: {}, created_at: '2026-09-08T00:00:00Z' };
      if (st === 'done') scripts.unshift({ id: 's-1', item_id: ITEM_ID, job_id: 'job-1', title: 'คนเป็นเซลล์ ทำคอนเทนต์บอกราคาไป ผิดไหม', brief: { theme: 'คนเป็นเซลล์ ทำคอนเทนต์บอกราคาไป ผิดไหม โดนแบนไหม?', pillar: 'sales_team', hook_style: 'question', length: 'mid', cta_keyword: 'Agent' }, script_md: SCRIPT_MD, content_id: null, created_at: '2026-09-08T01:00:00Z' });
      return json(single ? job : [job]);
    }
    if (url.includes('/rest/v1/content_items')) return json([IDEA]);
    if (url.includes('/rest/v1/content_variants')) return json([{ variant_id: 'CNT-2026-09-08-001-RL', content_id: IDEA.content_id, format: 'reel', target_platforms: ['tiktok'], working_title: IDEA.title, markdown_path: null, variant_status: 'ai_improved', cta_keyword: null, status_changed_at: '2026-09-08T00:00:00Z', created_at: '2026-09-08T00:00:00Z', script_draft: null, ai_result: SCRIPT_MD, ai_result_at: null }]);
    return json(single ? {} : []);   // targets, jobs, publications, storage, auth
  });
  const page = await ctx.newPage();
  await page.addInitScript(([ref, token]) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: token, token_type: 'bearer', expires_in: 999999, expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
      user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
    }));
  }, [REF, jwt()]);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  return { page, ctx, writes, errors };
}

console.log('\n📋 Intel Warroom — แก้ชื่อการ์ด + เกลาเป็น version ผม\n');

// ── 1. แก้ชื่อการ์ดในโมดัล ────────────────────────────────────────────────
{
  const { page, ctx, writes, errors } = await open(`/app/intel?item=${ITEM_ID}`);
  await page.waitForSelector('#nr-title-wrap h2', { timeout: 15000 });
  const before = await page.textContent('#nr-title-wrap h2');
  check(before.includes('ราคาผิดมั้ย'), 'โมดัลเปิดพร้อมหัวข้อเดิม');
  await page.click('[data-edit-title]');
  await page.waitForSelector('#nr-title-input');
  await page.fill('#nr-title-input', 'ไลฟ์บอกราคาผิดไหม (แก้แล้ว)');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#nr-title-wrap h2')?.textContent?.includes('แก้แล้ว'), null, { timeout: 5000 });
  const patch = writes.find((w) => w.method === 'PATCH' && w.table === 'newsroom_items');
  check(!!patch && patch.body.title === 'ไลฟ์บอกราคาผิดไหม (แก้แล้ว)' && patch.url.includes(`id=eq.${ITEM_ID}`), 'Enter → PATCH newsroom_items {title} ที่ id ถูกต้อง');
  check(writes.filter((w) => w.method === 'PATCH' && w.table === 'newsroom_items').length === 1, 'บันทึกครั้งเดียว ไม่ยิงซ้ำ');
  await page.click('[data-edit-title]');
  await page.fill('#nr-title-input', 'ห้ามบันทึก');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#nr-title-wrap h2');
  check((await page.textContent('#nr-title-wrap h2')).includes('แก้แล้ว'), 'Esc ยกเลิก — หัวข้อเดิมคงอยู่');
  check(await page.isVisible('#nr-modal'), 'Esc ในช่องแก้ชื่อไม่ปิดโมดัล');
  check(writes.filter((w) => w.method === 'PATCH' && w.table === 'newsroom_items').length === 1, 'ยกเลิกแล้วไม่ยิง PATCH เพิ่ม');
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 2. เกลาเป็น version ผม: ฟอร์ม → wr_jobs → ผลกลับมาบนการ์ด → ส่งเข้า Content Center ──
{
  const { page, ctx, writes, errors } = await open(`/app/intel?item=${ITEM_ID}`);
  await page.waitForSelector('#nr-rewrite', { timeout: 15000 });
  check(await page.isHidden('#nr-rw-form'), 'ฟอร์มซ่อนอยู่จนกว่าจะกดปุ่ม');
  await page.waitForFunction(() => document.querySelector('#nr-scripts')?.textContent?.includes('ยังไม่มีเวอร์ชัน'), null, { timeout: 5000 });
  await page.click('[data-rewrite-open]');
  check(await page.isVisible('#nr-rw-form'), 'กด "เกลาเป็น version ผม" → ฟอร์มโผล่');
  check(await page.isVisible('[data-use-hint]'), 'มีคำใบ้ธงจาก Steal-the-structure');
  await page.click('[data-rewrite-submit]');
  await page.waitForTimeout(300);
  check(!writes.some((w) => w.table === 'wr_jobs'), 'ธงว่าง → ไม่ส่งงาน (บอกให้กรอกก่อน)');
  await page.fill('#nr-rw-theme', 'คนเป็นเซลล์ ทำคอนเทนต์บอกราคาไป ผิดไหม โดนแบนไหม?');
  await page.click('input[name="nr-rw-pillar"][value="sales_team"]');
  await page.selectOption('#nr-rw-hook', 'question');
  await page.selectOption('#nr-rw-len', 'mid');
  await page.click('[data-rewrite-submit]');
  await page.waitForFunction(() => !document.querySelector('#nr-rw-status')?.classList.contains('hidden'), null, { timeout: 5000 });
  const job = writes.find((w) => w.table === 'wr_jobs' && w.method === 'POST');
  check(!!job && job.body.job_type === 'rewrite_reel', 'POST wr_jobs job_type=rewrite_reel');
  check(job?.body.payload.item_id === ITEM_ID && job?.body.payload.theme.startsWith('คนเป็นเซลล์') && job?.body.payload.pillar === 'sales_team' && job?.body.payload.hook_style === 'question' && job?.body.payload.length === 'mid' && job?.body.payload.cta_keyword === 'Agent', 'payload ครบ: item_id · theme · pillar · hook_style · length · cta_keyword');
  check(await page.isHidden('#nr-rw-form'), 'ส่งแล้วฟอร์มพับ แสดงสถานะรอ');
  await page.waitForFunction(() => document.querySelector('#nr-scripts')?.textContent?.includes('บอกราคาในคลิป ผิดไหม'), null, { timeout: 20000 });
  check(true, 'poll จน done → เวอร์ชันใหม่โผล่บนการ์ด (มีเนื้อบท)');
  check(await page.isHidden('#nr-rw-status'), 'สถานะรอหายเมื่อเสร็จ');
  check((await page.textContent('#nr-rw-count')).includes('1'), 'นับเวอร์ชัน = 1');
  check(await page.isVisible('[data-script-handoff]'), 'มีปุ่มส่งเข้า Content Center');
  await page.click('[data-script-handoff]');
  await page.waitForFunction(() => document.querySelector('#nr-scripts')?.textContent?.includes('อยู่ใน Content Center แล้ว'), null, { timeout: 5000 });
  const idea = writes.find((w) => w.table === 'content_items' && w.method === 'POST');
  const variant = writes.find((w) => w.table === 'content_variants' && w.method === 'POST');
  const vPatch = writes.find((w) => w.table === 'content_variants' && w.method === 'PATCH');
  const sPatch = writes.find((w) => w.table === 'intel_scripts' && w.method === 'PATCH');
  check(!!idea && idea.body.title === 'คนเป็นเซลล์ ทำคอนเทนต์บอกราคาไป ผิดไหม' && idea.body.pillar_bucket === 'sales_team' && String(idea.body.source_ref).startsWith(`intel:${ITEM_ID}`), 'สร้าง idea ใน Content Center จากธง + หมวด + อ้างอิงการ์ด');
  check(!!variant && variant.body.variant_id === 'CNT-2026-09-08-001-RL', 'สร้าง variant RL ของ idea นั้น');
  check(!!vPatch && vPatch.body.ai_result === SCRIPT_MD && vPatch.body.variant_status === 'ai_improved' && vPatch.body.cta_keyword === 'Agent', 'บทไปอยู่ช่อง AI ของ Script Studio + สถานะ ai_improved');
  check(!!sPatch && sPatch.body.content_id === 'CNT-2026-09-08-001', 'เวอร์ชันถูกผูก content_id');
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 3. การ์ดเก่าไม่มีบทพูด → บอกตรงๆ + ปุ่มแกะใหม่ ─────────────────────────
{
  const { page, ctx, writes, errors } = await open(`/app/intel?item=${NO_TS_ID}`);
  await page.waitForSelector('#nr-rewrite', { timeout: 15000 });
  check((await page.textContent('#nr-rewrite')).includes('ยังไม่มีบทพูดถอดเสียง'), 'บอกว่าการ์ดนี้ไม่มีบทพูด');
  check(!(await page.$('#nr-rw-form')), 'ไม่มีฟอร์มให้สั่ง (สั่งไปก็พัง)');
  await page.click('[data-rescout]');
  await page.waitForTimeout(500);
  const j = writes.find((w) => w.table === 'newsroom_jobs' && w.method === 'POST');
  check(!!j && j.body.kind === 'clip' && j.body.target.includes('tiktok.com') && String(j.body.note).startsWith('intel:'), 'ปุ่มแกะใหม่ → newsroom_jobs clip พร้อมโน้ต intel: (ผ่านด่านกันซ้ำของ scout)');
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 4. Content Center: แก้ชื่อไอเดียในแผงรายละเอียด ────────────────────────
{
  const { page, ctx, writes, errors } = await open('/app/content');
  await page.waitForSelector('[data-card="variant"]', { timeout: 15000 });
  await page.click('[data-card="variant"]');
  await page.waitForSelector('#wr-title-wrap h2');
  await page.click('[data-action="edit-title"]');
  await page.waitForSelector('#wr-title-input');
  await page.fill('#wr-title-input', 'ชื่อใหม่จากแผง');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#wr-title-wrap h2')?.textContent?.includes('ชื่อใหม่จากแผง'), null, { timeout: 5000 });
  const p = writes.find((w) => w.table === 'content_items' && w.method === 'PATCH');
  check(!!p && p.body.title === 'ชื่อใหม่จากแผง' && p.url.includes('content_id=eq.CNT-2026-09-08-001'), 'Enter → PATCH content_items {title}');
  check((await page.textContent('[data-card="variant"]')).includes('ชื่อใหม่จากแผง'), 'การ์ดบนบอร์ดเปลี่ยนชื่อตามทันที');
  check(await page.isVisible('#wr-drawer-panel'), 'แผงยังเปิดอยู่หลังบันทึก');
  await page.click('[data-action="edit-title"]');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#wr-title-wrap h2');
  check(!(await page.$('#wr-drawer.hidden')), 'Esc ในช่องแก้ชื่อไม่ปิดแผง');
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${pass} · ตก ${fail}\n`);
process.exit(fail ? 1 : 0);
