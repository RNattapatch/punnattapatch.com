/**
 * Lead pipeline regression test — ฟอร์มที่ live จริงเท่านั้น
 *
 * ทำไมต้องมี: ฟอร์มพวกนี้คือท่อรับ lead เข้า n8n (+ Supabase fallback ใน /intake-form)
 * ถ้า payload เพี้ยนแม้แต่ key เดียว lead จะหายเงียบโดยไม่มีใครรู้ทั้งสองฝั่ง
 * รันทุกครั้งที่แตะ booking.astro / intake-form.astro / after-hours.ts
 *
 * ⚠️ ทุก request ถูก intercept — ไม่มีอะไรวิ่งไป n8n/Supabase production จริง
 * (ยืนยันด้วย assertion "ไม่มี request หลุดออกนอกเครื่อง" ท้ายไฟล์)
 *
 * Usage: node tests/lead-forms.test.mjs      (ต้องมี dev server ที่ :4325)
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const N8N = '**/webhook/intake-form-v2';
const FREE_MATERIAL = '**/webhook/free-material';   // ท่อของฟรี → Audience Center (ไม่ใช่ lead)
const SUPABASE = '**/rest/v1/rpc/submit_lead';

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const browser = await chromium.launch();
const escaped = [];               // request ที่หลุดออก network จริง (ต้องว่าง)

/** endpoint ที่ "ห้ามโดนจริง" เด็ดขาด — ถ้าหลุดแปลว่าเทสต์สร้าง lead ปลอมใน production */
const LEAD_ENDPOINTS = /rnat\.app\.n8n\.cloud|supabase\.co/;

/** ดักทุก request ออกนอก localhost — asset ภายนอกปล่อยผ่านแบบ stub, lead endpoint ถือเป็นของหลุด */
async function sealContext(ctx) {
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    // abort ไว้ก่อนเสมอ (ไม่มีทางถึง production จริง) แต่บันทึกไว้ให้เห็นว่ามีเคสที่เทสต์ยังไม่ได้ครอบ
    if (LEAD_ENDPOINTS.test(u)) { escaped.push(u); return route.abort(); }
    return route.abort();          // third-party asset (pixel/CDN/font) — บล็อกเพื่อความนิ่ง ไม่นับว่าหลุด
  });
}

/** เติม required ทุกช่องแบบไม่ต้องรู้จักฟอร์มล่วงหน้า — ฟอร์มเพิ่มช่องใหม่แล้วเทสต์ยังรอด */
async function fillAllRequired(page, formSel, values = {}) {
  for (const [name, v] of Object.entries(values)) {
    // timeout สั้น — field ที่ไม่มีในฟอร์มนั้น (เช่น company บน /ads/*) ต้องไม่รอ default 30s
    await page.fill(`${formSel} [name="${name}"]`, v, { timeout: 1000 }).catch(() => {});
  }
  const handles = await page.locator(`${formSel} [required]`).all();
  for (const h of handles) {
    const [tag, type, filled] = await h.evaluate((e) => [e.tagName, e.type, !!e.value && e.value !== '']);
    if (tag === 'SELECT') await h.selectOption({ index: 1 }).catch(() => {});
    else if (type === 'checkbox' || type === 'radio') await h.check().catch(() => {});
    else if (!filled) await h.fill('ทดสอบ').catch(() => {});
  }
  const invalid = await page.locator(`${formSel} [required]`).evaluateAll(
    (els) => els.filter((e) => !e.checkValidity()).map((e) => e.name || e.id)
  );
  return invalid;
}

// ═══════════════════════════════════════════════ /booking — ท่อหลัก (CTA ทุกปุ่มหน้าแรก)
{
  console.log('\n[1] /booking — ส่งสำเร็จ · payload ครบ');
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sent = null;
  await page.route(N8N, async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, body: '{"ok":true}' }); });

  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
  const invalid1 = await fillAllRequired(page, '#booking-form', {
    name: 'ทดสอบ ระบบ', phone: '081-234 5678', line: '@punline', company: 'บจก. ทดสอบ', business: 'ขายเครื่องจักร B2B',
  });
  check(invalid1.length === 0, `กรอก required ครบทุกช่อง${invalid1.length ? ` (ค้าง: ${invalid1})` : ''}`);
  await page.click('#booking-submit');
  await page.waitForTimeout(1200);

  check(sent !== null, 'ยิงไป n8n webhook');
  if (sent) {
    // key ที่ INTAKE-DATA-CONTRACT.md + n8n Flatten Body1 ต้องเจอ
    // (2026-08-12: แยก contact ช่องเดียว → phone บังคับ + line optional)
    for (const k of ['name', 'phone', 'line', 'company', 'industry', 'problems', 'source', 'source_page', 'booking_type', 'submitted_at', 'path', 'recommended_path', 'consent']) {
      check(k in sent, `payload มี key "${k}"`);
    }
    check(sent.name === 'ทดสอบ ระบบ', 'ค่าไทยไม่เพี้ยน (UTF-8)');
    check(sent.phone === '0812345678', `⭐ เบอร์ normalize เป็นตัวเลขล้วน (ได้ "${sent.phone}")`);
    check(sent.line === '@punline', 'LINE ID ติดไปด้วย');
    check(sent.company === 'บจก. ทดสอบ', 'company ส่งค่าที่กรอก ไม่ใช่ fallback business');
    check(sent.industry === 'ขายเครื่องจักร B2B', 'industry alias ผูกกับ business');
    check(sent.source === 'website-booking', 'source tag ถูก');
    check(!('honeypot-name' in sent) || !sent['honeypot-name'], 'honeypot ว่าง (ไม่ใช่บอท)');
  }
  await page.waitForURL(/\/thank-you/, { timeout: 5000 }).catch(() => {});
  check(new URL(page.url()).pathname === '/thank-you', 'เด้งไป /thank-you (จุดเดียวที่ Lead pixel ยิง)');
  check(!(await page.locator('#booking-form').isVisible().catch(() => true)), 'ซ่อนฟอร์มหลังส่งสำเร็จ');
  await ctx.close();
}

// ═════════════════════ /booking — รับ product attribution จากหน้า Product Detail ═════════════════════
{
  console.log('\n[1b] /booking — Product Detail ส่ง package + intent มาถึง lead payload');
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sent = null;
  await page.route(N8N, async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, body: '{"ok":true}' }); });

  await page.goto(`${BASE}/booking?package=T2&intent=quote`, { waitUntil: 'domcontentloaded' });
  check(await page.locator('[data-booking-product-context]').isVisible(), 'เห็นบริบทบริการที่ส่งต่อมาจาก Product Detail');
  check((await page.locator('[data-booking-product-name]').textContent() || '').includes('T2'), 'แสดงชื่อ T2 ให้ลูกค้ารู้ว่ากำลังส่งโจทย์เรื่องอะไร');
  check(await page.locator('[name="package"]').inputValue() === 'T2 · คอร์สเพิ่มยอดขายจากออนไลน์', 'hidden package ใช้ canonical key และชื่อที่คนอ่านรู้เรื่อง');

  await fillAllRequired(page, '#booking-form', {
    name: 'ทดสอบ ระบบ', phone: '0812345678', company: 'บจก. ทดสอบ', business: 'ขายเครื่องจักร B2B',
  });
  await page.click('#booking-submit');
  await page.waitForTimeout(1200);

  check(sent?.package === 'T2 · คอร์สเพิ่มยอดขายจากออนไลน์', 'payload เก็บ package ของ Product ที่ลูกค้าสนใจ');
  check((sent?.comment || '').includes('T2 · คอร์สเพิ่มยอดขายจากออนไลน์'), 'comment บอก Product ให้เห็นใน CRM/Telegram');
  check((sent?.comment || '').includes('ขอแผนและใบเสนอราคา'), 'comment แปล intent เป็นภาษาที่คนขายอ่านรู้เรื่อง');
  check(sent?.recommended_path === '/services/online-to-sales', 'recommended_path ย้อนกลับไปหน้า Product ต้นทางได้');
  check(sent?.path === '/booking?package=T2&intent=quote', 'path เก็บ query attribution ครบ');
  check(sent?.source === 'website-booking' && sent?.source_page === 'website-booking', 'ไม่เปลี่ยน canonical booking source ที่ production gate ใช้');
  await ctx.close();
}

{
  console.log('\n[2] /booking — ล่มทั้ง n8n และ Supabase → error ต้องอยู่ถาวร + ฟอร์มไม่หาย');
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  await page.route(N8N, (r) => r.fulfill({ status: 500, body: 'boom' }));
  await page.route(SUPABASE, (r) => r.fulfill({ status: 500, body: 'boom' }));

  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
  await fillAllRequired(page, '#booking-form', {
    name: 'ทดสอบ ระบบ', phone: '0812345678', company: 'บจก. ทดสอบ', business: 'ขายเครื่องจักร',
  });
  await page.click('#booking-submit');
  await page.waitForTimeout(1200);

  check(await page.locator('#booking-error').isVisible(), 'ขึ้น error');
  check(await page.locator('#booking-form').isVisible(), 'ฟอร์มยังอยู่ ข้อมูลที่กรอกไม่หาย');
  check(await page.locator('[name="name"]').inputValue() === 'ทดสอบ ระบบ', 'ค่าที่กรอกยังอยู่ครบ กดส่งซ้ำได้เลย');
  check(!(await page.locator('#booking-submit').isDisabled()), 'ปุ่มกลับมากดได้');
  await page.waitForTimeout(9000);
  check(await page.locator('#booking-error').isVisible(), '⭐ ผ่าน 9 วิ error ยังอยู่ (ไม่หายเอง)');
  await ctx.close();
}

// ═════════════════════ /booking — Supabase fallback (เพิ่ม 2026-08-09 · แยกช่อง 2026-08-12) ═════════════════════
for (const [label, phoneValue, lineValue, expectPhone, expectLine] of [
  ['เบอร์อย่างเดียว', '081-234-5678', '', '0812345678', ''],
  ['เบอร์ + LINE',    '0812345678', '@punnattapatch', '0812345678', '@punnattapatch'],
]) {
  console.log(`\n[2b] /booking — n8n ล่ม → Supabase fallback (${label})`);
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sb = null;
  await page.route(N8N, (r) => r.fulfill({ status: 500, body: 'boom' }));
  await page.route(SUPABASE, async (r) => {
    sb = { body: JSON.parse(r.request().postData() || '{}'), headers: r.request().headers() };
    await r.fulfill({ status: 200, body: '{"ok":true}' });
  });

  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
  await fillAllRequired(page, '#booking-form', {
    name: 'ทดสอบ ระบบ', phone: phoneValue, line: lineValue, company: 'บจก. ทดสอบ', business: 'ขายเครื่องจักร B2B',
  });
  await page.click('#booking-submit');
  await page.waitForTimeout(1500);

  check(sb !== null, 'fallback ยิงไป Supabase RPC submit_lead');
  if (sb) {
    const p = sb.body.payload || {};
    check(!!sb.body.payload, 'ห่อด้วย { payload: … }');
    check(!!sb.headers.apikey && (sb.headers.authorization || '').startsWith('Bearer '), 'ส่ง apikey + Bearer');
    // ⭐ ข้อสำคัญสุด: fallback ข้าม Flatten Body1 → ต้อง canonical เองครบ
    check(p.phone === expectPhone, `⭐ phone = "${p.phone}" (คาดหวัง "${expectPhone}")`);
    check(p.line === expectLine, `⭐ line = "${p.line}" (คาดหวัง "${expectLine}")`);
    check(p.company === 'บจก. ทดสอบ', 'company canonical');
    check(p.industry === 'ขายเครื่องจักร B2B', 'industry canonical');
    check(!!p.problems, 'problems canonical (ไม่ว่าง)');
    check(!!p.submittedAt, 'submittedAt (camelCase) — key ที่ RPC อ่านจริง');
    check(/^PN-\d{12}-[A-Z0-9]{4}$/.test(p.reference || ''), `มี reference (${p.reference})`);
    check(p.fallback_reason === 'n8n-unreachable', 'ติดธงว่ามาจาก fallback (ไล่ย้อนได้ว่า n8n ล่มตอนไหน)');
    check(p.consent === 'on' || p.consent === 'yes', 'consent ติดมาด้วย (หลักฐาน PDPA)');
  }
  // 2026-08-31: สำเร็จแล้วต้องเด้งไป /thank-you — Lead pixel ยิงที่หน้านั้นที่เดียว
  // เดิมโชว์ success ในหน้าเดิม = Meta ไม่เคยเห็น conversion จาก /booking เลย
  await page.waitForURL(/\/thank-you/, { timeout: 5000 }).catch(() => {});
  const ty = new URL(page.url());
  check(ty.pathname === '/thank-you', `เด้งไป /thank-you (ได้ "${ty.pathname}")`);
  check(ty.searchParams.get('type') === 'booking', 'บอกปลายทางว่ามาจาก booking (ใช้สลับคำ + content_name ของ Lead)');
  check(/^PN-\d{12}-[A-Z0-9]{4}$/.test(ty.searchParams.get('ref') || ''), `พก reference ไปโชว์ที่ /thank-you (${ty.searchParams.get('ref')})`);
  await ctx.close();
}

// ═════════════ /booking — UTM ต้องไปถึง payload (เพิ่ม 2026-08-31 ก่อนเปิดแอด T2) ═════════════
// ทำไมต้องมี: /booking ไม่เคยมี hidden input utm_* → FormData ไม่พา utm ไปด้วย →
// pipeline.mjs อ่าน b.utm_campaign ได้ค่าว่าง = lead จากแอดเข้า CRM แบบไม่รู้ที่มา
for (const [label, landing, hop] of [
  ['utm ติดมากับ URL ของ /booking ตรงๆ', '/booking?package=T2&intent=quote&utm_source=facebook&utm_medium=paid&utm_campaign=cold_t2_content_capA&utm_content=feed&utm_term=c2-content&fbclid=TESTFBCLID123', null],
  ['ลงที่หน้า Product ก่อน แล้วค่อยกด CTA มา /booking (เส้นทางจริงของแอด)', '/services/online-to-sales?utm_source=facebook&utm_medium=paid&utm_campaign=cold_t2_content_capA&utm_content=feed&utm_term=c2-content&fbclid=TESTFBCLID123', '/booking?package=T2&intent=quote'],
]) {
  console.log(`\n[1c] /booking — ${label}`);
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sent = null;
  await page.route(N8N, async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, body: '{"ok":true}' }); });

  await page.goto(`${BASE}${landing}`, { waitUntil: 'domcontentloaded' });
  if (hop) await page.goto(`${BASE}${hop}`, { waitUntil: 'domcontentloaded' });
  await fillAllRequired(page, '#booking-form', {
    name: 'ทดสอบ ระบบ', phone: '0812345678', company: 'บจก. ทดสอบ', business: 'ขายเครื่องจักร B2B',
  });
  await page.click('#booking-submit');
  await page.waitForTimeout(1200);

  check(sent?.utm_source === 'facebook', `⭐ utm_source ถึง payload (ได้ "${sent?.utm_source}")`);
  check(sent?.utm_medium === 'paid', 'utm_medium ถึง payload');
  check(sent?.utm_campaign === 'cold_t2_content_capA', `⭐ utm_campaign ถึง payload — ตัวที่ใช้แยก A/B (ได้ "${sent?.utm_campaign}")`);
  check(sent?.utm_content === 'feed', 'utm_content ถึง payload (placement)');
  check(sent?.utm_term === 'c2-content', 'utm_term ถึง payload (ชื่อครีเอทีฟ)');
  check(sent?.fbclid === 'TESTFBCLID123', 'fbclid ถึง payload (ไว้ match กับ Meta)');

  await page.waitForURL(/\/thank-you/, { timeout: 5000 }).catch(() => {});
  const ty = new URL(page.url());
  check(ty.searchParams.get('utm_campaign') === 'cold_t2_content_capA', 'utm ส่งต่อไป /thank-you ให้ Lead event แนบไปด้วย');
  await ctx.close();
}

// ═══════════════════════════════════════════ /intake-form — มี Supabase fallback
{
  console.log('\n[3] /intake-form — n8n ล่ม → Supabase fallback รับช่วง');
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sb = null;
  await page.route(N8N, (r) => r.fulfill({ status: 500, body: 'boom' }));
  await page.route(SUPABASE, async (r) => {
    sb = { body: JSON.parse(r.request().postData() || '{}'), headers: r.request().headers() };
    await r.fulfill({ status: 200, body: '{"ok":true}' });
  });

  await page.goto(`${BASE}/intake-form`, { waitUntil: 'domcontentloaded' });
  const invalid3 = await fillAllRequired(page, 'form', {
    name: 'ทดสอบ ระบบ', email: 'test@example.com', phone: '0812345678', company: 'บจก. ทดสอบ',
  });
  check(invalid3.length === 0, `กรอก required ครบทุกช่อง${invalid3.length ? ` (ค้าง: ${invalid3})` : ''}`);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  check(sb !== null, 'fallback ยิงไป Supabase RPC submit_lead');
  if (sb) {
    check(!!sb.body.payload, 'ห่อด้วย { payload: … } ตามที่ RPC ต้องการ');
    check(!!sb.headers.apikey, 'ส่ง apikey header');
    check((sb.headers.authorization || '').startsWith('Bearer '), 'ส่ง Bearer token');
    check(sb.body.payload?.name === 'ทดสอบ ระบบ', 'ข้อมูลใน fallback ครบ');
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════ iOS attributes + press feedback
{
  console.log('\n[4] iOS keyboard hints + press feedback (iPhone 15 Pro)');
  const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'] });
  await sealContext(ctx);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
  const at = (s, a) => page.locator(s).first().getAttribute(a);
  check((await at('[name="name"]', 'autocomplete')) === 'name', 'booking: name → autocomplete=name');
  check((await at('[name="name"]', 'enterkeyhint')) === 'next', 'booking: name → enterkeyhint=next');
  check((await at('[name="company"]', 'autocomplete')) === 'organization', 'booking: company → organization');
  check((await at('#booking-form [name="phone"]', 'inputmode')) === 'tel', 'booking: phone → inputmode=tel (แป้นตัวเลข)');
  check((await at('#booking-form [name="phone"]', 'required')) !== null, 'booking: phone บังคับกรอก');
  check((await at('#booking-form [name="line"]', 'autocorrect')) === 'off', 'booking: LINE ID → ปิด autocorrect (ไม่โดนแก้คำ)');
  check((await at('#booking-form [name="line"]', 'required')) === null, 'booking: LINE ID ไม่บังคับ');

  await page.goto(`${BASE}/intake-form`, { waitUntil: 'domcontentloaded' });
  check((await at('#phone', 'inputmode')) === 'tel', 'intake: phone → inputmode=tel');
  check((await at('#email', 'inputmode')) === 'email', 'intake: email → inputmode=email');
  check((await at('#company', 'autocomplete')) === 'organization', 'intake: company → organization');
  check((await at('#line', 'autocorrect')) === 'off', 'intake: LINE ID → ปิด autocorrect');

  const btn = await page.evaluate(() => {
    const b = document.querySelector('.btn') || document.querySelector('.cta-btn');
    if (!b) return null;
    const s = getComputedStyle(b);
    return { prop: s.transitionProperty, touch: s.touchAction };
  });
  check(!!btn && /scale|transform/.test(btn.prop), `ปุ่ม transition ครอบ scale/transform (${btn?.prop})`);
  check(!!btn && btn.touch === 'manipulation', 'touch-action: manipulation');
  await ctx.close();
}

// ═══════════════════════════════════════════ reduced motion ยังมี feedback อยู่
{
  console.log('\n[5] Reduce Motion เปิด → feedback ต้องไม่ตาย');
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  await sealContext(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/booking`, { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(() => {
    const b = document.querySelector('.btn');
    const i = document.querySelector('.field, input');
    return { btn: getComputedStyle(b).transitionDuration, input: i ? getComputedStyle(i).transitionDuration : null,
             rm: matchMedia('(prefers-reduced-motion: reduce)').matches };
  });
  check(r.rm, 'browser รายงานว่า reduced-motion เปิดอยู่จริง');
  const ms = parseFloat(r.btn) * 1000;
  check(ms >= 50 && ms <= 200, `ปุ่มยังมี transition ${r.btn} (ไม่ใช่ 0.01ms แบบเดิม)`);
  await ctx.close();
}

// ══════ canonical keys ต่อฟอร์ม — regression บั๊กที่เจอจาก E2E production 2026-08-09 ══════
{
  console.log('\n[6] canonical keys — กัน lead ตกหล่นจาก formMap / business_type');
  const CASES = [
    { slug: 'sponsor', path: '/sponsor', form: '#sponsorForm', submit: 'button[type="submit"]',
      expect: { source_page: 'sponsor' },
      why: 'ไม่ส่ง source_page → Flatten default /intake-form → งานสปอนเซอร์ขึ้นว่า INTAKE FORM' },
    // 2026-08-28 catalog revision: หน้า ads เก่า (dealer-ai-sales / hotel-resort-ai) ถูก redirect ทิ้ง
    // ชั้นวางใหม่ = sales-ai-team (core 1 วัน) / sales-online-team (generic 2 วัน) / dealer-online-sales (Dealer Edition)
    { slug: 'ads-dealer', path: '/ads/dealer-online-sales', form: '#dealer-ai-booking-form', submit: '#dealer-ai-submit',
      expect: { industry: 'ดีลเลอร์รถ / โชว์รูม', source: 'ads-dealer-online-sales' },
      why: 'ไม่ส่ง industry → business_type ว่างใน CRM' },
    { slug: 'ads-core-1day', path: '/ads/sales-ai-team', form: '#dealer-ai-booking-form', submit: '#dealer-ai-submit',
      expect: { source: 'ads-sales-ai-team' },
      why: 'source ต้องระบุหน้า ไม่งั้นวัด vertical/angle ไม่ได้' },
    { slug: 'ads-generic-2day', path: '/ads/sales-online-team', form: '#dealer-ai-booking-form', submit: '#dealer-ai-submit',
      expect: { source: 'ads-sales-online-team' },
      why: 'หน้ากลางไม่ผูกวงการ — industry ว่างโดยตั้งใจ แต่ source ต้องครบ' },
  ];

  for (const c of CASES) {
    const ctx = await browser.newContext();
    await sealContext(ctx);
    const page = await ctx.newPage();
    let sent = null;
    await page.route(N8N, async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, body: '{"ok":true}' }); });

    await page.goto(`${BASE}${c.path}`, { waitUntil: 'domcontentloaded' });
    await fillAllRequired(page, c.form, {
      name: 'ทดสอบ ระบบ', company: 'บจก. ทดสอบ', business: 'บจก. ทดสอบ',
      brandName: 'บจก. ทดสอบ', yourName: 'ทดสอบ ระบบ', phone: '0812345678',
      yourPhone: '0812345678', email: 'test@example.com', brandWebsite: 'https://example.com',
    });
    await page.click(c.submit);
    // poll แทน fixed timeout — หน้าที่โหลดช้ากว่าเพื่อนเคยทำให้เทสต์ flaky (hotel-resort-ai)
    for (let i = 0; i < 12 && sent === null; i++) await page.waitForTimeout(400);

    check(sent !== null, `${c.slug}: ยิง payload`);
    for (const [k, v] of Object.entries(c.expect)) {
      check(sent?.[k] === v, `${c.slug}: ${k} = "${sent?.[k]}" (ต้อง "${v}") — ${c.why}`);
    }
    await ctx.close();
  }
}

// ══════ bosi quiz — ของฟรี ต้องไม่แตะท่อ lead ══════
// เปลี่ยน 2026-08-17: quiz ย้ายไป /webhook/free-material (Audience Center)
// assertion ที่สำคัญที่สุดคือ "ห้ามยิงเข้า intake-form-v2" — ถ้ากลับไปยิงเมื่อไหร่
// Telegram จะเด้งทุกครั้งที่มีคนเล่น, leads จะปนอีก และ TikTok จะได้ conversion ปลอม
// spec: docs/superpowers/specs/2026-08-17-audience-center-design.md
for (const [label, contact] of [
  ['เบอร์',    '0812345678'],
  ['LINE',     '@punline'],
  ['เว้นว่าง', ''],
]) {
  console.log(`\n[7] /bosi-dna-quiz — ของฟรีเข้า Audience Center (${label})`);
  const ctx = await browser.newContext();
  await sealContext(ctx);
  const page = await ctx.newPage();
  let sent = null;
  let hitLeadPipe = false;
  await page.route(FREE_MATERIAL, async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, body: '{"ok":true}' }); });
  await page.route(N8N, async (r) => { hitLeadPipe = true; await r.fulfill({ status: 200, body: '{"ok":true}' }); });

  await page.goto(`${BASE}/bosi-dna-quiz`, { waitUntil: 'domcontentloaded' });
  await page.fill('#intro-name', 'ทดสอบ ระบบ');
  await page.fill('#intro-company', 'บจก. ทดสอบ');
  if (contact) await page.fill('#intro-contact', contact);
  await page.click('#btn-start');
  await page.waitForTimeout(300);
  for (let q = 0; q < 10; q++) await page.locator(`input[name="q${q}"]`).first().check().catch(() => {});
  await page.waitForTimeout(200);
  await page.click('#btn-submit');
  for (let i = 0; i < 12 && sent === null; i++) await page.waitForTimeout(400);

  check(sent !== null, 'quiz ยิง payload เข้า /webhook/free-material');
  check(hitLeadPipe === false, 'ไม่แตะ /webhook/intake-form-v2 (ท่อ lead + Telegram + TikTok)');
  check(sent?.lead_kind === 'audience', `lead_kind = audience ได้ "${sent?.lead_kind}"`);
  check(sent?.asset_slug === 'bosi-quiz', `asset_slug = bosi-quiz ได้ "${sent?.asset_slug}"`);
  check(sent?.contact === contact, `contact ส่งดิบไปให้ปลายทางแยกเอง = "${sent?.contact}" (ต้อง "${contact}")`);
  // ผล BOSI ต้องไปถึงปลายทางเป็นก้อน — ของเดิมส่งแยก key แล้ว n8n อ่านไม่เจอ ค่าหายทุกแถว
  check('BOSI'.includes(sent?.asset_result?.dominant ?? ''), `asset_result.dominant = "${sent?.asset_result?.dominant}"`);
  const sc = sent?.asset_result?.scores;
  check(sc && (sc.B + sc.O + sc.S + sc.I) === 10, `asset_result.scores รวมได้ 10 ข้อ ได้ ${sc ? sc.B + sc.O + sc.S + sc.I : '?'}`);
  check((sent?.asset_result?.answers || '').split(',').length === 10, 'asset_result.answers ครบ 10 ข้อ');
  await ctx.close();
}

await browser.close();
console.log(`\n${'─'.repeat(56)}`);
check(escaped.length === 0, `ทุก lead endpoint ถูก mock ครบ ไม่มีเคสหลุด${escaped.length ? ` — ยังไม่ได้ mock: ${[...new Set(escaped)].join(', ')} (ถูก abort ไว้แล้ว ไม่ถึง production แต่แปลว่าเทสต์ครอบไม่ครบ)` : ''}`);
console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}\n`);
process.exit(fail === 0 ? 0 : 1);
