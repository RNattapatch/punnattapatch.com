/**
 * Content Center — เรียงการ์ด + กรองตามฟอร์แมต + ลากเรียงเอง (Custom) · 2026-10-15
 *
 * ทำไมต้องมี: คุณปันขอ sort การ์ด (วันที่ / หมายเลข ID / custom) และกรองดูทีละฟอร์แมต
 * (Carousel / Reel / Article). ลำดับ Custom เก็บใน database (board_rank) — ถ้าบันทึกผิด
 * การ์ดที่ถูกซ่อนด้วยตัวกรองจะเสียที่ ไฟล์นี้ดักทั้งลำดับที่เห็นและ id ที่ส่งไปบันทึก
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป Supabase production จริง
 *
 * Usage: BASE=http://localhost:4355 node tests/content-center-sort-filter.test.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const mkIdea = (content_id, created_at, board_rank = null, idea_status = 'captured') => ({
  content_id, title: `ไอเดีย ${content_id.slice(-3)}`, canonical_angle: null, topic_cluster: null,
  funnel_stage: null, pillar_bucket: null, angle_type: null, acid_test: 'pending', idea_status,
  source_type: 'webapp', source_ref: null, created_at, board_rank,
});
const IDEAS = [
  mkIdea('CNT-2026-09-01-001', '2026-09-01T00:00:00Z', null, 'active'),
  mkIdea('CNT-2026-09-08-004', '2026-09-08T00:00:00Z', null, 'active'),
  mkIdea('CNT-2026-09-05-002', '2026-09-05T00:00:00Z', 2),     // backlog
  mkIdea('CNT-2026-09-03-003', '2026-09-03T00:00:00Z', 1),     // backlog
];
const mkVariant = (variant_id, status, created_at, status_changed_at, board_rank = null) => ({
  variant_id, content_id: variant_id.slice(0, 18), format: { RL: 'reel', CR: 'carousel', AR: 'article' }[variant_id.slice(-2)],
  target_platforms: ['tiktok'], working_title: null, markdown_path: null, variant_status: status, cta_keyword: null,
  status_changed_at, created_at, script_draft: null, ai_result: null, ai_result_at: null, board_rank,
});
// ช่อง Ready to record: A B C D · ช่องถ่ายแล้ว: E
const A = 'CNT-2026-09-01-001-RL', B = 'CNT-2026-09-01-001-CR', C = 'CNT-2026-09-08-004-RL',
  D = 'CNT-2026-09-08-004-AR', E = 'CNT-2026-09-08-004-CR';
const VARIANTS = [
  mkVariant(A, 'ready_to_record', '2026-09-01T00:00:00Z', '2026-09-10T00:00:00Z', 2),
  mkVariant(B, 'draft',           '2026-09-02T00:00:00Z', '2026-09-05T00:00:00Z'),
  mkVariant(C, 'ready_to_record', '2026-09-08T00:00:00Z', '2026-09-12T00:00:00Z', 1),
  mkVariant(D, 'draft',           '2026-09-09T00:00:00Z', '2026-09-08T00:00:00Z'),
  mkVariant(E, 'recorded',        '2026-09-09T00:00:00Z', '2026-09-11T00:00:00Z'),
];

// A (Reel) ลงไปนานแล้วยังไม่มี snapshot → นับใน Analytics due
const PUBS = [{ publication_id: 'p1', variant_id: A, platform: 'tiktok', post_url: null, published_at: '2026-09-01T00:00:00Z', status: 'posted' }];

const jwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`;
};

const browser = await chromium.launch();
const blocked = [];

async function openBoard({ prefs } = {}) {
  const ctx = await browser.newContext();
  const calls = { patch: [], rpcV: [], rpcI: [] };
  await ctx.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE)) return route.continue();
    if (url.startsWith(SB)) return route.fallback();
    blocked.push(url);
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
    if (url.includes('/rpc/content_variants_reorder')) { calls.rpcV.push(req.postDataJSON()); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (url.includes('/rpc/content_items_reorder')) { calls.rpcI.push(req.postDataJSON()); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (url.includes('/content_variants') && req.method() === 'PATCH') { calls.patch.push({ url, body: req.postDataJSON() }); return json([]); }
    if (url.includes('/content_items')) return json(IDEAS);
    if (url.includes('/content_variants')) return json(VARIANTS);
    if (url.includes('/publications')) return json(PUBS);
    return json([]);
  });
  const page = await ctx.newPage();
  await page.addInitScript(([ref, token, p]) => {
    localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
      access_token: token, token_type: 'bearer', expires_in: 999999,
      expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r',
      user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' },
    }));
    if (p && !sessionStorage.getItem('prefs-seeded')) { localStorage.setItem('wr-board-prefs', JSON.stringify(p)); sessionStorage.setItem('prefs-seeded', '1'); }
  }, [REF, jwt(), prefs ?? null]);
  await page.goto(`${BASE}/app/content`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-card="variant"]', { timeout: 15000 });
  return { page, ctx, calls };
}

const colIds = (page, key) => page.$$eval(`.wr-col[data-colkey="${key}"] [data-card]`, (n) => n.map((x) => x.dataset.v ?? x.dataset.cid));
const setSort = (page, v) => page.selectOption('#wr-board-sort', v);
const short = (ids) => ids.map((x) => ({ [A]: 'A', [B]: 'B', [C]: 'C', [D]: 'D', [E]: 'E' })[x] ?? x.slice(-3)).join('');

/** ลาก `fromSel` ไปปล่อยบนการ์ด `onSel` (ครึ่งบน = วางก่อนใบนั้น) หรือก้นคอลัมน์ `colKey` */
async function drag(page, fromSel, { onSel, colKey }) {
  await page.evaluate(([fromSel, onSel, colKey]) => {
    const dt = new DataTransfer();
    const fire = (el, type, x) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientY: x }));
    const card = document.querySelector(fromSel);
    let target, y;
    if (onSel) { target = document.querySelector(onSel); const r = target.getBoundingClientRect(); y = r.top + 2; }
    else { target = document.querySelector(`.wr-col[data-colkey="${colKey}"] .wr-drop`); const r = target.getBoundingClientRect(); y = r.bottom - 2; }
    fire(card, 'dragstart', y);
    fire(target, 'dragover', y);
    fire(target, 'drop', y);
    fire(card, 'dragend', y);
  }, [fromSel, onSel ?? null, colKey ?? null]);
  await page.waitForTimeout(500);
}

console.log('\n📋 Content Center — เรียง + กรอง + Custom\n');

// ── 1. เรียงทุกแบบ ─────────────────────────────────────────────────────
{
  const { page, ctx } = await openBoard();
  const expect = { stale: 'BDAC', newest: 'DCBA', oldest: 'ABCD', id_asc: 'BADC', id_desc: 'CDAB', custom: 'CADB' };
  check(await page.$eval('#wr-board-sort', (s) => s.value) === 'stale', 'ค่าเริ่มต้น = ค้างนานสุดก่อน (เหมือนเดิม)');
  for (const [k, want] of Object.entries(expect)) {
    await setSort(page, k);
    const got = short(await colIds(page, 'ready'));
    check(got === want, `เรียง ${k} → ${got} (ควรเป็น ${want})`);
  }
  await setSort(page, 'id_desc');
  check(eq(await colIds(page, 'ideas'), ['CNT-2026-09-05-002', 'CNT-2026-09-03-003']), 'ช่อง Ideas เรียงตาม ID ด้วย (ID ขึ้นต้นด้วยวันที่ → 09-05 ก่อน 09-03)');
  await setSort(page, 'custom');
  check(short(await colIds(page, 'ideas')) === '003002', 'ช่อง Ideas เรียงตาม Custom (board_rank)');
  check(await page.isVisible('#wr-custom-hint'), 'โหมด Custom มีคำอธิบายวิธีลากเรียง');
  check(await page.$$eval('[data-action="move-up"]', (n) => n.length) === 7, 'โหมด Custom มีปุ่ม ↑ ↓ ครบทุกการ์ด (สำหรับมือถือ)');
  await setSort(page, 'stale');
  check(await page.$$eval('[data-action="move-up"]', (n) => n.length) === 0, 'โหมดอื่นไม่มีปุ่ม ↑ ↓ รกการ์ด');
  await ctx.close();
}

// ── 2. กรองตามฟอร์แมต + จำค่าหลังรีโหลด ─────────────────────────────────
{
  const { page, ctx } = await openBoard();
  const chipCR = '#wr-fmt-filter [data-fmt="CR"]';
  check((await page.textContent(chipCR)).includes('2'), 'chip Carousel บอกจำนวน 2 ใบ');
  await page.click(chipCR);
  const visible = await page.$$eval('[data-card="variant"]', (n) => n.map((x) => x.dataset.v));
  check(visible.length === 2 && visible.every((v) => v.endsWith('-CR')), `กด Carousel → เหลือแต่ Carousel (${short(visible)})`);
  check(await page.getAttribute(chipCR, 'aria-pressed') === 'true', 'chip ที่เลือกบอกสถานะ aria-pressed');
  check(await page.$('.wr-col[data-colkey="ideas"]') === null, 'ตอนกรองฟอร์แมต ช่อง Ideas (ยังไม่มีฟอร์แมต) ถูกซ่อน');
  await page.click('#wr-fmt-filter [data-fmt="RL"]');
  const two = await page.$$eval('[data-card="variant"]', (n) => n.map((x) => x.dataset.v.slice(-2)));
  check(two.length === 4 && two.every((f) => f === 'CR' || f === 'RL'), `เลือกได้หลายอัน: Carousel + Reel → ${two.length} ใบ`);
  await page.click('#wr-fmt-filter [data-fmt="RL"]');
  await setSort(page, 'id_desc');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#wr-fmt-filter [data-fmt="CR"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  const after = await page.$$eval('[data-card="variant"]', (n) => n.map((x) => x.dataset.v.slice(-2)));
  check(after.length === 2 && after.every((f) => f === 'CR'), 'รีโหลดแล้วยังกรอง Carousel อยู่');
  check(await page.$eval('#wr-board-sort', (s) => s.value) === 'id_desc', 'รีโหลดแล้วยังจำการเรียงที่เลือก');
  await page.click('#wr-fmt-filter [data-fmt=""]');
  check(await page.$$eval('[data-card="variant"]', (n) => n.length) === 5, 'กด "ทั้งหมด" → การ์ดกลับมาครบ 5 ใบ');
  check(await page.$('.wr-col[data-colkey="ideas"]') !== null, 'กด "ทั้งหมด" → ช่อง Ideas กลับมา');
  await page.fill('#wr-board-search', '004');
  check((await page.textContent(chipCR)).includes('1'), 'จำนวนบน chip นับตามคำค้นด้วย (004 → Carousel 1 ใบ)');
  await ctx.close();
}

// ── 2b. กล่องตัวเลข + แถบเตือนค้าง นับตามตัวกรอง ───────────────────────────
{
  const { page, ctx } = await openBoard();
  const pills = () => page.$$eval('#wr-stats article', (n) => n.map((x) => Number(x.querySelector('.font-display').textContent)));
  check(eq(await pills(), [2, 1, 0, 1]), `ไม่กรอง → ยอดรวม ${(await pills()).join('/')} (ควรเป็น 2/1/0/1)`);
  check(await page.isHidden('#wr-stats-scope'), 'ไม่กรอง → ไม่มีบรรทัดบอกขอบเขต');
  check((await page.textContent('#wr-stale')).includes(E), 'แถบเตือนค้างชี้ E (Carousel ค้าง recorded)');
  await page.click('#wr-fmt-filter [data-fmt="CR"]');
  check(eq(await pills(), [0, 1, 0, 0]), `กรอง Carousel → ${(await pills()).join('/')} (ควรเป็น 0/1/0/0)`);
  check((await page.textContent('#wr-stats-scope')).includes('Carousel'), 'บอกว่าตัวเลขนับเฉพาะ Carousel');
  await page.click('#wr-fmt-filter [data-fmt="CR"]');
  await page.click('#wr-fmt-filter [data-fmt="RL"]');
  check(eq(await pills(), [2, 0, 0, 1]), `กรอง Reel → ${(await pills()).join('/')} (ควรเป็น 2/0/0/1)`);
  check(await page.isHidden('#wr-stale'), 'กรอง Reel → ไม่มี Reel ค้าง แถบเตือนซ่อน');
  await page.click('#wr-fmt-filter [data-fmt=""]');
  check(eq(await pills(), [2, 1, 0, 1]), 'กด "ทั้งหมด" → ยอดรวมกลับมา');
  // คำค้น: 004 = C (Reel ready) · D (Article draft) · E (Carousel recorded)
  await page.fill('#wr-board-search', '004');
  check(eq(await pills(), [1, 1, 0, 0]), `ค้น "004" → ${(await pills()).join('/')} (ควรเป็น 1/1/0/0 · A ที่รอ analytics ไม่ตรงคำค้น)`);
  check((await page.textContent('#wr-stats-scope')).includes('"004"'), 'บอกว่าตัวเลขนับเฉพาะที่ค้นว่า "004"');
  await page.click('#wr-fmt-filter [data-fmt="CR"]');
  check(eq(await pills(), [0, 1, 0, 0]), `ค้น "004" + Carousel → ${(await pills()).join('/')} (ควรเป็น 0/1/0/0)`);
  const scope = await page.textContent('#wr-stats-scope');
  check(scope.includes('Carousel') && scope.includes('"004"') && scope.includes('ล้างช่องค้นหา'), `บรรทัดขอบเขตบอกทั้งฟอร์แมตและคำค้น → "${scope}"`);
  await page.fill('#wr-board-search', '001');
  check((await page.textContent('#wr-stale')).length === 0 || await page.isHidden('#wr-stale'), 'ค้น "001" + Carousel → ไม่มีการ์ดค้าง แถบเตือนซ่อน');
  await page.click('#wr-fmt-filter [data-fmt=""]');
  check(eq(await pills(), [1, 0, 0, 1]), `ค้น "001" อย่างเดียว → ${(await pills()).join('/')} (ควรเป็น 1/0/0/1 · A รอ analytics)`);
  await page.fill('#wr-board-search', '');
  check(eq(await pills(), [2, 1, 0, 1]) && await page.isHidden('#wr-stats-scope'), 'ล้างคำค้น → ยอดรวมกลับมา บรรทัดขอบเขตหาย');
  await ctx.close();
}

// ── 3. Custom: ลากเรียงในช่องเดียวกัน = บันทึกลำดับ ไม่เปลี่ยนสถานะ ───────
{
  const { page, ctx, calls } = await openBoard({ prefs: { sort: 'custom', fmt: [] } });
  await drag(page, `[data-v="${B}"]`, { onSel: `[data-v="${C}"]` });
  check(calls.patch.length === 0, `ลากในช่องเดิม → ไม่ PATCH สถานะ (${calls.patch.length})`);
  check(eq(calls.rpcV[0]?.p_ids, [B, C, A, D]), `บันทึกลำดับ ${short(calls.rpcV[0]?.p_ids ?? [])} (ควรเป็น BCAD)`);
  check(short(await colIds(page, 'ready')) === 'BCAD', 'การ์ดขยับบนจอทันที');
  await ctx.close();
}

// ── 4. Custom: ปุ่ม ↓ ─────────────────────────────────────────────────
{
  const { page, ctx, calls } = await openBoard({ prefs: { sort: 'custom', fmt: [] } });
  await page.click(`[data-action="move-down"][data-move-v="${C}"]`);
  await page.waitForTimeout(400);
  check(eq(calls.rpcV[0]?.p_ids, [A, C, D, B]), `↓ บน C → ${short(calls.rpcV[0]?.p_ids ?? [])} (ควรเป็น ACDB)`);
  await page.click(`[data-action="move-up"][data-move-v="${C}"]`);
  await page.waitForTimeout(400);
  check(eq(calls.rpcV[1]?.p_ids, [C, A, D, B]), `↑ กลับ → ${short(calls.rpcV[1]?.p_ids ?? [])} (ควรเป็น CADB)`);
  const drawerOpen = await page.$eval('#wr-drawer', (d) => !d.classList.contains('hidden'));
  check(!drawerOpen, 'กด ↑ ↓ ไม่เปิดแผงรายละเอียด');
  await ctx.close();
}

// ── 5. Custom + กรองอยู่: การ์ดที่ถูกซ่อนต้องไม่เสียที่ ─────────────────────
{
  const { page, ctx, calls } = await openBoard({ prefs: { sort: 'custom', fmt: ['RL'] } });
  check(short(await colIds(page, 'ready')) === 'CA', 'กรอง Reel ในโหมด Custom → เห็น C A');
  await drag(page, `[data-v="${A}"]`, { onSel: `[data-v="${C}"]` });
  check(eq(calls.rpcV[0]?.p_ids, [A, C, D, B]), `ลาก A ขึ้นบน → ${short(calls.rpcV[0]?.p_ids ?? [])} (D B ที่ซ่อนอยู่คงที่เดิม · ควรเป็น ACDB)`);
  await ctx.close();
}

// ── 6. Custom: ลากข้ามช่อง = เปลี่ยนสถานะ + วางตรงจุดที่ปล่อย ───────────────
{
  const { page, ctx, calls } = await openBoard({ prefs: { sort: 'custom', fmt: [] } });
  await drag(page, `[data-v="${E}"]`, { onSel: `[data-v="${A}"]` });
  await page.waitForTimeout(400);
  check(calls.patch.length === 1 && calls.patch[0].body.variant_status === 'ready_to_record', `ข้ามช่อง → PATCH สถานะ 1 ครั้ง (${calls.patch.length})`);
  check(eq(calls.rpcV[0]?.p_ids, [C, E, A, D, B]), `วาง E ก่อน A → ${short(calls.rpcV[0]?.p_ids ?? [])} (ควรเป็น CEADB)`);
  await ctx.close();
}

// ── 7. โหมดอื่น: ลากในช่องเดิม = ไม่ทำอะไร + บอกวิธี ────────────────────────
{
  const { page, ctx, calls } = await openBoard();
  await drag(page, `[data-v="${B}"]`, { onSel: `[data-v="${C}"]` });
  check(calls.patch.length === 0 && calls.rpcV.length === 0, 'โหมดค้างนานสุด: ลากในช่องเดิมไม่บันทึกอะไร');
  check((await page.textContent('#wr-toast')).includes('Custom'), 'บอกให้เลือก Custom ถ้าอยากเรียงเอง');
  await drag(page, `[data-v="${B}"]`, { colKey: 'recorded' });
  check(calls.patch.length === 1 && calls.rpcV.length === 0, 'ลากข้ามช่องยังเปลี่ยนสถานะได้เหมือนเดิม (ไม่แตะลำดับ)');
  check(await page.$$eval('[data-card="idea"][draggable="true"]', (n) => n.length) === 0, 'การ์ดไอเดียลากไม่ได้นอกโหมด Custom');
  await ctx.close();
}

// ── 8. Custom: ลากเรียงไอเดีย ──────────────────────────────────────────
{
  const { page, ctx, calls } = await openBoard({ prefs: { sort: 'custom', fmt: [] } });
  await drag(page, '[data-card="idea"][data-cid="CNT-2026-09-05-002"]', { onSel: '[data-card="idea"][data-cid="CNT-2026-09-03-003"]' });
  check(eq(calls.rpcI[0]?.p_ids, ['CNT-2026-09-05-002', 'CNT-2026-09-03-003']), 'ลากไอเดีย 002 ขึ้นบน → บันทึก content_items_reorder');
  await drag(page, '[data-card="idea"][data-cid="CNT-2026-09-05-002"]', { colKey: 'recorded' });
  check(calls.patch.length === 0 && calls.rpcV.length === 0, 'ลากไอเดียไปช่องอื่น → ไม่รับ');
  await ctx.close();
}

const leaked = blocked.filter((u) => /supabase\.co|n8n|doc-api|punnattapatch\.com/.test(u));
check(leaked.length === 0, `ไม่มี request วิ่งไป production จริง (บล็อกของนอก ${blocked.length} รายการ)`);
await browser.close();
console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${pass} · ตก ${fail}\n`);
process.exit(fail ? 1 : 0);
