/**
 * Content Center — Kanban board regression test (ย้ายการ์ด)
 *
 * ทำไมต้องมี: 2026-09-07 คุณปันเจอ "ย้ายการ์ดแล้วการ์ดไปโผล่ช่องใหม่ซ้ำกัน" กับ
 * "บางครั้งย้ายไม่ได้ ขึ้น Failed to fetch" — สองอาการนี้ไม่มีอะไรดักเลย
 * ไฟล์นี้ยิง drag event จริงใส่บอร์ดจริง แล้วนับ PATCH ที่วิ่งออก
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: node tests/content-center-board.test.mjs   (ต้องมี dev server ที่ :4325)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

// ไอเดียเดียว 3 ฟอร์แมต = เคสที่ทำให้ปันเห็นเป็น "การ์ดซ้ำ"
const IDEAS = [{
  content_id: 'CNT-2026-09-07-001', title: 'ไอเดียทดสอบ สามชิ้นจากเรื่องเดียว',
  canonical_angle: null, topic_cluster: null, funnel_stage: null, pillar_bucket: null,
  angle_type: null, acid_test: 'pending', idea_status: 'active',
  source_type: 'webapp', source_ref: null, created_at: '2026-09-07T00:00:00Z',
}];
const mkVariant = (code, format, status) => ({
  variant_id: `CNT-2026-09-07-001-${code}`, content_id: 'CNT-2026-09-07-001', format,
  target_platforms: ['tiktok'], working_title: 'ไอเดียทดสอบ สามชิ้นจากเรื่องเดียว',
  markdown_path: null, variant_status: status, cta_keyword: null,
  status_changed_at: '2026-09-07T00:00:00Z', created_at: '2026-09-07T00:00:00Z',
  script_draft: null, ai_result: null, ai_result_at: null,
});
const VARIANTS = [
  mkVariant('RL', 'reel', 'ready_to_record'),
  mkVariant('CR', 'carousel', 'draft'),
  mkVariant('AR', 'article', 'draft'),
];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();
const blocked = [];

/** เปิดหน้า /app/content พร้อม session ปลอม + Supabase ปลอม — คืน page + ตัวนับ PATCH */
async function openBoard({ patchHandler } = {}) {
  const ctx = await browser.newContext();
  const patches = [];
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE)) return route.continue();
    if (url.startsWith(SB)) return route.fallback();
    blocked.push(url);            // ของนอกเครื่อง (ฟอนต์/Google GSI) — ตัดทิ้ง ไม่ให้วิ่งจริง
    return route.abort();
  });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    const json = (body, status = 200) => route.fulfill({
      status, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body),
    });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/content_variants') && req.method() === 'PATCH') {
      patches.push({ url, body: req.postDataJSON() });
      if (patchHandler) return patchHandler(route, patches.length);
      return json([]);
    }
    if (url.includes('/content_items')) return json(IDEAS);
    if (url.includes('/content_variants')) return json(VARIANTS);
    if (url.includes('/rpc/search_similar_content')) return json([]);
    return json([]);   // publications, analytics_snapshots, auth
  });

  const page = await ctx.newPage();
  await page.addInitScript(([ref, token]) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: token, token_type: 'bearer', expires_in: 999999,
      expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
      user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
    }));
  }, [REF, jwt()]);
  await page.goto(`${BASE}/app/content`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-card="variant"]', { timeout: 15000 });
  return { page, ctx, patches };
}

/** ยิง drag ของจริงผ่าน DragEvent + DataTransfer (HTML5 DnD ขับด้วยเมาส์จำลองไม่ได้) */
const DRAG = `(() => {
  const dt = new DataTransfer();
  const fire = (el, type, data) => {
    const ev = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data });
    el.dispatchEvent(ev);
    return ev;
  };
  return { dt, fire };
})()`;

console.log('\\n📋 Content Center — บอร์ดย้ายการ์ด\\n');

// ── 1. การ์ดพี่น้องต้องแยกออกจากกันด้วยตา ─────────────────────────────────
{
  const { page, ctx } = await openBoard();
  const ids = await page.$$eval('[data-card="variant"] .font-mono', (n) => n.map((x) => x.textContent.trim()));
  check(new Set(ids).size === 3, `การ์ด 3 ใบของไอเดียเดียวกันแสดงรหัสต่างกัน → ${ids.join(', ')}`);
  check(ids.every((i) => /-(RL|CR|AR|LN)$/.test(i)), 'รหัสบนการ์ดบอกฟอร์แมต (ลงท้าย -RL/-CR/-AR)');
  const hint = await page.$$eval('[data-card="variant"]', (n) => n.filter((x) => x.textContent.includes('⧉')).length);
  check(hint === 3, `ทุกการ์ดเตือนว่าไอเดียนี้มีฟอร์แมตอื่น (${hint}/3)`);
  await ctx.close();
}

// ── 2. ย้ายปกติ = PATCH ครั้งเดียว ────────────────────────────────────────
{
  const { page, ctx, patches } = await openBoard();
  await page.evaluate(`(() => {
    const { dt, fire } = ${DRAG};
    const card = document.querySelector('[data-card="variant"][data-v="CNT-2026-09-07-001-RL"]');
    const col = document.querySelector('.wr-col[data-col="recorded"]');
    fire(card, 'dragstart', dt);
    fire(col, 'dragover', dt);
    fire(col, 'drop', dt);
    fire(card, 'dragend', dt);
  })()`);
  await page.waitForTimeout(600);
  check(patches.length === 1, `ลากลงช่องใหม่ → PATCH 1 ครั้ง (ได้ ${patches.length})`);
  check(patches[0]?.url.includes('CNT-2026-09-07-001-RL'), 'PATCH ยิงใส่การ์ดที่ลากจริง');
  check(patches[0]?.body?.variant_status === 'recorded', `สถานะใหม่ = recorded (ได้ ${patches[0]?.body?.variant_status})`);
  await ctx.close();
}

// ── 3. REGRESSION: ลากค้างแล้วปล่อยนอกช่อง ต้องไม่ค้าง id ไว้ย้ายทีหลัง ──
{
  const { page, ctx, patches } = await openBoard();
  await page.evaluate(`(() => {
    const { dt, fire } = ${DRAG};
    const card = document.querySelector('[data-card="variant"][data-v="CNT-2026-09-07-001-RL"]');
    fire(card, 'dragstart', dt);
    fire(card, 'dragend', dt);                    // ปล่อยนอกช่อง = ยกเลิก
    // จากนั้นลาก "อย่างอื่น" (ข้อความ/ไฟล์) ทับช่องใหม่
    const foreign = new DataTransfer();
    foreign.setData('text/plain', 'ข้อความที่เลือกมา');
    const col = document.querySelector('.wr-col[data-col="posted"]');
    fire(col, 'dragover', foreign);
    fire(col, 'drop', foreign);
  })()`);
  await page.waitForTimeout(600);
  check(patches.length === 0, `ลากของนอกบอร์ดทับช่อง → ไม่มีการ์ดไหนขยับ (PATCH ${patches.length} ครั้ง)`);
  await ctx.close();
}

// ── 4. ปล่อยรัวสองที = ยิงครั้งเดียว ─────────────────────────────────────
{
  const { page, ctx, patches } = await openBoard();
  await page.evaluate(`(() => {
    const { dt, fire } = ${DRAG};
    const card = document.querySelector('[data-card="variant"][data-v="CNT-2026-09-07-001-CR"]');
    const col = document.querySelector('.wr-col[data-col="edited"]');
    fire(card, 'dragstart', dt);
    fire(col, 'dragover', dt);
    fire(col, 'drop', dt);
    fire(col, 'drop', dt);
  })()`);
  await page.waitForTimeout(600);
  check(patches.length === 1, `ปล่อยซ้ำสองที → PATCH 1 ครั้ง (ได้ ${patches.length})`);
  await ctx.close();
}

// ── 5. เน็ตสะดุดนัดแรก ต้องลองใหม่เองแล้วผ่าน ────────────────────────────
{
  const { page, ctx, patches } = await openBoard({
    patchHandler: (route, n) => n === 1
      ? route.abort('failed')                      // = TypeError: Failed to fetch
      : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' }),
  });
  await page.evaluate(`(() => {
    const { dt, fire } = ${DRAG};
    const card = document.querySelector('[data-card="variant"][data-v="CNT-2026-09-07-001-AR"]');
    const col = document.querySelector('.wr-col[data-col="recorded"]');
    fire(card, 'dragstart', dt);
    fire(col, 'dragover', dt);
    fire(col, 'drop', dt);
  })()`);
  await page.waitForTimeout(2500);
  check(patches.length >= 2, `PATCH นัดแรกพัง → ยิงซ้ำเอง (ยิงไป ${patches.length} ครั้ง)`);
  const toast = await page.$eval('#wr-toast', (el) => ({ text: el.textContent, cls: el.className }));
  check(!toast.cls.includes('alert-error'), `ผู้ใช้ไม่เห็น error หลังลองใหม่สำเร็จ → "${toast.text}"`);
  await ctx.close();
}

// ── 6. เน็ตพังจริง = ข้อความไทยที่บอกว่าต้องทำอะไร ไม่ใช่ "Failed to fetch" ──
{
  const { page, ctx } = await openBoard({ patchHandler: (route) => route.abort('failed') });
  await page.evaluate(`(() => {
    const { dt, fire } = ${DRAG};
    const card = document.querySelector('[data-card="variant"][data-v="CNT-2026-09-07-001-AR"]');
    const col = document.querySelector('.wr-col[data-col="posted"]');
    fire(card, 'dragstart', dt);
    fire(col, 'dragover', dt);
    fire(col, 'drop', dt);
  })()`);
  await page.waitForTimeout(3500);
  const toast = await page.$eval('#wr-toast', (el) => el.textContent);
  check(/เช็คเน็ต|รีเฟรช/.test(toast), `ข้อความบอกทางออก ไม่ใช่ศัพท์ดิบ → "${toast}"`);
  await ctx.close();
}

const leaked = blocked.filter((u) => /supabase\.co|n8n|doc-api|punnattapatch\.com/.test(u));
check(leaked.length === 0, `ไม่มี request วิ่งไป production จริง (บล็อกของนอก ${blocked.length} รายการ: ${[...new Set(blocked.map((u) => new URL(u).host))].join(', ') || '—'})`);
await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${pass} · ตก ${fail}\n`);
process.exit(fail ? 1 : 0);
