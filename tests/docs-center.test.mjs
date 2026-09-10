/**
 * Doc Center — หน้า /app/docs (2026-09-10)
 *
 * ขับ UI จริงบน Chromium โดย intercept Supabase ทั้งหมด (ไม่แตะ production) แล้วเช็คว่า
 * แฟ้ม/ตราประทับ/หย่อนใส่แฟ้ม/รอบภาษี ทำงานและเขียนอะไรออกไปตรงตาม data contract
 * Usage: node tests/docs-center.test.mjs   (ต้องมี dev server ที่ :4325)
 * SHOTS=1 → เซฟภาพ desktop/mobile ลง tests/shots/docs-*.png
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4325';
const REF = 'yykocvhorgcgzaluuldn';
const SB = `https://${REF}.supabase.co`;
let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const L1 = '11111111-1111-4111-8111-111111111111', L2 = '22222222-2222-4222-8222-222222222222', L3 = '33333333-3333-4333-8333-333333333333';
const LEADS = [
  { id: L1, company_name: 'บริษัท ไลค์ มี จำกัด', full_name: 'คุณเอ', nickname: null, tax_id: '0105555061861', deal_outcome: 'won', pipeline_status: 'Proposal Sent', lifetime_value_thb: 34920, last_purchase_at: '2026-09-07T00:00:00Z' },
  { id: L2, company_name: null, full_name: 'คุณบี', nickname: 'บี', tax_id: '1103900048085', deal_outcome: 'won', pipeline_status: null, lifetime_value_thb: 9900, last_purchase_at: '2026-08-20T00:00:00Z' },
  { id: L3, company_name: 'บจก. ยังคุยอยู่', full_name: null, nickname: null, tax_id: null, deal_outcome: 'in_progress', pipeline_status: 'Discovery Call', lifetime_value_thb: null, last_purchase_at: null },
];
const PURCHASES = [
  { id: 'p1', lead_id: L1, amount_thb: 34920, purchased_at: '2026-09-07T00:00:00Z', document_id: 'd-inv' },
  { id: 'p0', lead_id: L1, amount_thb: 50000, purchased_at: '2026-01-10T00:00:00Z', document_id: null },
  { id: 'p2', lead_id: L2, amount_thb: 9900, purchased_at: '2026-08-20T00:00:00Z', document_id: null },
];
const DOCS = [
  { id: 'd-inv', lead_id: L1, kind: 'invoice', direction: 'out', title: 'INV-2026-09-001 — บริษัท ไลค์ มี จำกัด', doc_number: 'INV-2026-09-001', doc_date: '2026-09-07', amount_thb: 34920, wht_amount_thb: null, wht_rate: null, payer_name: null, payer_tax_id: '0105555061861', tax_year: 2569, tax_period: 'H2', filed_at: null, bucket: 'documents', storage_path: 'invoice/INV-2026-09-001.pdf', preview_path: 'invoice/INV-2026-09-001.png', external_url: null, mime: 'application/pdf', size_bytes: null, source: 'doc-bot', is_pii: false, expires_at: null, confirmed_at: null, notes: null, created_at: '2026-09-07T00:00:00Z', origin: 'documents' },
  { id: 'd-qo', lead_id: L1, kind: 'quotation', direction: 'out', title: 'QO-2026-08-005-A — บริษัท ไลค์ มี จำกัด', doc_number: 'QO-2026-08-005-A', doc_date: '2026-08-20', amount_thb: 33853, wht_amount_thb: null, wht_rate: null, payer_name: null, payer_tax_id: null, tax_year: 2569, tax_period: 'H2', filed_at: null, bucket: 'documents', storage_path: 'qo/QO-2026-08-005-A.pdf', preview_path: null, external_url: null, mime: 'application/pdf', size_bytes: null, source: 'doc-bot', is_pii: false, expires_at: null, confirmed_at: null, notes: null, created_at: '2026-08-20T00:00:00Z', origin: 'documents' },
  { id: 'd-wht', lead_id: L1, kind: 'wht_cert', direction: 'in', title: 'ใบหัก ณ ที่จ่าย ก.ย. 69 — บริษัท ไลค์ มี จำกัด', doc_number: '0001/2569', doc_date: '2026-09-08', amount_thb: 34920, wht_amount_thb: 1047.6, wht_rate: 3, payer_name: 'บริษัท ไลค์ มี จำกัด', payer_tax_id: '0105555061861', tax_year: 2569, tax_period: 'H2', filed_at: null, bucket: 'client-docs', storage_path: `${L1}/wht_cert/2026/x.pdf`, preview_path: null, external_url: null, mime: 'application/pdf', size_bytes: 180000, source: 'web-upload', is_pii: false, expires_at: null, confirmed_at: '2026-09-08T00:00:00Z', notes: null, created_at: '2026-09-08T00:00:00Z', origin: 'client_docs' },
  { id: 'd-slip', lead_id: L2, kind: 'payment_slip', direction: 'in', title: 'สลิปโอนเงิน ส.ค. 69 — คุณบี', doc_number: null, doc_date: '2026-08-20', amount_thb: 9900, wht_amount_thb: null, wht_rate: null, payer_name: null, payer_tax_id: null, tax_year: null, tax_period: null, filed_at: null, bucket: 'client-docs', storage_path: `${L2}/payment_slip/2026/s.jpg`, preview_path: null, external_url: null, mime: 'image/jpeg', size_bytes: 210000, source: 'web-upload', is_pii: false, expires_at: null, confirmed_at: '2026-08-20T00:00:00Z', notes: null, created_at: '2026-08-20T00:00:00Z', origin: 'client_docs' },
];

const jwt = () => { const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url'); return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'test-user', role: 'authenticated', exp: 4102444800 })}.sig`; };
const browser = await chromium.launch();

async function open(path, { mobile = false } = {}) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 860 } });
  const writes = [];
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith(BASE)) return route.continue(); if (u.startsWith(SB)) return route.fallback(); return route.abort(); });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request(); const url = req.url(), method = req.method();
    const single = (req.headers()['accept'] || '').includes('pgrst.object');
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/storage/v1/object/sign/')) { writes.push({ method, kind: 'sign', url }); return json(url.includes('/sign/client-docs') || url.includes('/sign/documents') ? (req.postDataJSON()?.paths ? req.postDataJSON().paths.map((p) => ({ path: p, signedURL: `/object/sign/x/${p}?token=t` })) : { signedURL: '/object/sign/x?token=t' }) : {}); }
    if (url.includes('/storage/v1/object/client-docs/') && method === 'POST') { writes.push({ method, kind: 'upload', url, size: Number(req.headers()['content-length'] || 0) }); return json({ Key: url.split('/object/')[1] }); }
    if (url.includes('/storage/v1/object/client-docs') && method === 'DELETE') { writes.push({ method, kind: 'remove', url }); return json([]); }
    if (['PATCH', 'POST', 'DELETE'].includes(method) && !url.includes('/auth/')) {
      const table = url.split('/rest/v1/')[1]?.split('?')[0];
      const body = method === 'DELETE' ? null : req.postDataJSON();
      writes.push({ method, table, url, body });
      if (table === 'client_docs' && method === 'POST') return json({ id: 'new-1', ...body, created_at: '2026-09-10T00:00:00Z' });
      return json(single ? {} : []);
    }
    if (url.includes('/rest/v1/client_docs_all')) return json(DOCS);
    if (url.includes('/rest/v1/client_docs?') && url.includes('sha256=eq.')) return json([]);
    if (url.includes('/rest/v1/leads')) return json(LEADS);
    if (url.includes('/rest/v1/purchases')) return json(PURCHASES);
    return json(single ? {} : []);
  });
  const page = await ctx.newPage();
  await page.addInitScript(([ref, token]) => { localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ access_token: token, token_type: 'bearer', expires_in: 999999, expires_at: Math.floor(Date.now() / 1000) + 999999, refresh_token: 'r', user: { id: 'test-user', aud: 'authenticated', role: 'authenticated', email: 'test@example.com' } })); }, [REF, jwt()]);
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  return { page, ctx, writes, errors };
}
const shots = process.env.SHOTS === '1'; if (shots) mkdirSync('tests/shots', { recursive: true });

console.log('\n📁 Doc Center — /app/docs\n');

// ── 1. แฟ้ม + ตราประทับ + สัญญาณ ──
{
  const { page, ctx, errors } = await open('/app/docs');
  await page.waitForSelector('[data-lead]', { timeout: 15000 });
  const signals = await page.textContent('#dc-signals');
  check(signals.includes('4ใบในแฟ้ม'), `แถบสัญญาณนับเอกสาร (${signals.replace(/\s+/g, ' ').slice(0, 80)})`);
  check(signals.includes('2ดีลปิดแล้วยังขาดเอกสาร'), 'นับดีลปิดแล้วที่ยังขาดเอกสาร = 2 (ไลค์มี · คุณบี)');
  check(signals.includes('1ถูกหัก ณ ที่จ่ายแต่ยังไม่มีใบ 50 ทวิ'), 'ช่องว่าง 50 ทวิ = 1 (ซื้อ ม.ค. ไม่มีใบ)');
  const first = await page.textContent('[data-lead]');
  check(first.includes('ไลค์ มี') && first.includes('ขาด'), 'แฟ้มที่ขาดมากสุดอยู่บนสุด + ป้าย "ขาด"');
  check(!(await page.textContent('#dc-roster')).includes('ยังคุยอยู่') || (await page.$$('[data-lead]')).length === 3, 'ดีลที่ยังไม่ปิดอยู่ในรายชื่อโดยไม่มีป้ายขาด');
  await page.click(`[data-lead="${L1}"]`);
  await page.waitForSelector('#dc-folder .stamp');
  const stamps = await page.$$eval('#dc-folder .stamp', (els) => els.map((e) => e.className.replace('stamp ', '') + ':' + e.textContent.trim()));
  check(stamps.some((s) => s.startsWith('stamp-have:QO')) && stamps.some((s) => s.startsWith('stamp-have:50ทวิ')), 'ตรา QO + 50 ทวิ ประทับแล้ว');
  check(stamps.some((s) => s.startsWith('stamp-missing:SLIP')) && stamps.some((s) => s.startsWith('stamp-missing:RC')), 'ตราสลิป + ใบเสร็จ = เส้นประขาด');
  const folder = await page.textContent('#dc-folder');
  check(folder.includes('ออกให้ลูกค้า') && folder.includes('การเงินขาเข้า') && folder.includes('INV-2026-09-001') && folder.includes('฿34,920'), 'แฟ้มจัดกลุ่มตามหมวด + เลขใบ + ยอด');
  check(folder.includes('doc-bot'), 'เอกสารจาก doc-bot ติดป้ายบอกที่มา');
  check(new URL(page.url()).searchParams.get('lead') === L1, 'deep link ?lead= อัปเดตตามแฟ้มที่เปิด');
  await page.click(`[data-lead="${L2}"]`);
  await page.waitForFunction(() => document.querySelector('#dc-folder h2')?.textContent?.includes('คุณบี'));
  const s2 = await page.$$eval('#dc-folder .stamp', (els) => els.map((e) => e.className + ':' + e.textContent.trim()));
  check(s2.some((s) => s.includes('stamp-na') && s.includes('50ทวิ')), 'บุคคลธรรมดา: ตรา 50 ทวิ จาง (ไม่เกี่ยว)');
  await page.fill('#dc-search', '34,920');
  await page.waitForTimeout(150);
  check((await page.$$('[data-lead]')).length === 1, 'ค้นด้วยยอดเงินเหลือแฟ้มเดียว');
  if (shots) await page.screenshot({ path: 'tests/shots/docs-folders.png', fullPage: true });
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 2. หย่อนใส่แฟ้ม: เดาชนิดจากชื่อไฟล์ → ผูกแฟ้ม → upload + insert ──
{
  const { page, ctx, writes, errors } = await open(`/app/docs?lead=${L1}`);
  await page.waitForSelector('#dc-folder [data-upload-for]', { timeout: 15000 });
  await page.click('#dc-folder [data-upload-for]');
  await page.waitForSelector('#dc-upload[open]');
  check((await page.inputValue('#dc-lead-id')) === L1, 'เปิดจากแฟ้ม = ผูกลูกค้าให้แล้ว');
  await page.setInputFiles('#dc-file', { name: '50ทวิ_ไลค์มี_ก.ย.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
  check((await page.inputValue('#dc-kind')) === 'wht_cert', 'ชื่อไฟล์ 50ทวิ → เดาชนิดเป็นใบหัก ณ ที่จ่าย');
  check(await page.isVisible('#dc-wht'), 'ช่องภาษีหัก/ผู้จ่ายโผล่เฉพาะชนิด 50 ทวิ');
  check((await page.inputValue('#dc-title')).includes('ใบหัก ณ ที่จ่าย') && (await page.inputValue('#dc-title')).includes('ไลค์ มี'), 'ตั้งชื่อให้จากชนิด + ลูกค้า');
  await page.fill('#dc-number', '0002/2569'); await page.fill('#dc-date', '2026-09-09'); await page.fill('#dc-amount', '34920'); await page.fill('#dc-wht', '1047.6'); await page.fill('#dc-payer', 'บริษัท ไลค์ มี จำกัด'); await page.fill('#dc-payer-tax', '0105555061861');
  await page.click('#dc-upload-submit');
  await page.waitForFunction(() => !document.querySelector('#dc-upload')?.open, null, { timeout: 10000 });
  const up = writes.find((w) => w.kind === 'upload'); const ins = writes.find((w) => w.table === 'client_docs' && w.method === 'POST');
  check(!!up && /\/client-docs\/11111111-1111-4111-8111-111111111111\/wht_cert\/\d{4}\/\d{14}-[a-zA-Z0-9-]*\.pdf$/.test(up.url), `ไฟล์ขึ้น bucket client-docs ตาม <lead>/<kind>/<yyyy>/ (${up?.url?.split('/object/')[1]})`);
  check(!!ins && ins.body.kind === 'wht_cert' && ins.body.lead_id === L1 && ins.body.amount_thb === 34920 && ins.body.wht_amount_thb === 1047.6 && ins.body.wht_rate === 3, 'INSERT client_docs ครบ: ชนิด · ลูกค้า · ยอด · ภาษีหัก · อัตรา 3%');
  check(ins.body.tax_year === 2569 && ins.body.tax_period === 'H2' && ins.body.payer_tax_id === '0105555061861' && ins.body.source === 'web-upload' && ins.body.storage_path === up.url.split('/object/client-docs/')[1], 'ปีภาษี/งวด คำนวณจากวันที่ · storage_path ตรงกับที่อัปโหลด');
  check(writes.indexOf(up) < writes.indexOf(ins), 'อัปโหลดไฟล์ก่อน แล้วค่อยลงทะเบียน (ไม่มีแถวชี้ไฟล์ที่ไม่มี)');
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 3. รอบภาษี: สมุดบัญชี · ช่องว่าง · CSV · ประทับยื่นแล้ว ──
{
  const { page, ctx, writes, errors } = await open('/app/docs#tax');
  await page.waitForSelector('#dc-view-tax .ledger', { timeout: 15000 });
  const tax = await page.textContent('#dc-view-tax');
  check(tax.includes('ปีภาษี 2569') && tax.includes('ครึ่งปีหลัง'), 'จัดงวด 2569 H2 ให้ใบ 50 ทวิ ก.ย.');
  check(tax.includes('ภาษีหักรวม') && tax.includes('฿1,048'), 'รวมภาษีหักต่องวด');
  check(tax.includes('ถูกหัก ณ ที่จ่ายแล้ว แต่ยังไม่ได้ใบ 50 ทวิ') && tax.includes('฿1,500'), 'ตารางช่องว่าง: ซื้อ 50,000 คาดหัก 1,500');
  check((await page.textContent('#dc-tax-badge')) === '1' && await page.isVisible('#dc-tax-badge'), 'badge บนแท็บรอบภาษีบอกจำนวนช่องว่าง');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-csv]')]);
  check(dl.suggestedFilename() === 'wht-2569-H2.csv', `ดาวน์โหลด CSV ชื่อ ${dl.suggestedFilename()}`);
  page.once('dialog', (d) => d.accept());
  await page.click('[data-file-one]');
  await page.waitForTimeout(400);
  const patch = writes.find((w) => w.method === 'PATCH' && w.table === 'client_docs');
  check(!!patch && typeof patch.body.filed_at === 'string' && patch.url.includes('id=eq.d-wht'), 'ประทับ ยื่นแล้ว → PATCH client_docs {filed_at} ที่ใบนั้น');
  if (shots) await page.screenshot({ path: 'tests/shots/docs-tax.png', fullPage: true });
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

// ── 4. ตามชนิด + มือถือ ──
{
  const { page, ctx, errors } = await open('/app/docs#kinds', { mobile: true });
  await page.waitForSelector('#dc-kind-chips [data-kind]', { timeout: 15000 });
  const chips = await page.$$eval('#dc-kind-chips [data-kind]', (els) => els.map((e) => e.textContent.trim()));
  check(chips.some((c) => c.startsWith('ทั้งหมด 4')) && chips.some((c) => c.includes('ใบหัก ณ ที่จ่าย')), `chip ต่อชนิดพร้อมจำนวน (${chips.join(' | ')})`);
  await page.click('[data-kind="payment_slip"]');
  await page.waitForTimeout(150);
  const list = await page.textContent('#dc-kind-list');
  check(list.includes('สลิปโอนเงิน') && list.includes('คุณบี') && !list.includes('INV-2026'), 'กรองชนิดสลิป: เห็นเฉพาะสลิป + ชื่อลูกค้า');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(!overflow, 'มือถือ 390px ไม่ล้นแนวนอน');
  if (shots) await page.screenshot({ path: 'tests/shots/docs-mobile.png', fullPage: true });
  check(errors.length === 0, `ไม่มี JS error (${errors.join(' | ')})`);
  await ctx.close();
}

await browser.close();
console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail ? 1 : 0);
