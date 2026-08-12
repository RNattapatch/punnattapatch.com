/**
 * 🔴 E2E LIVE — ยิง production จริง (n8n → Supabase → Telegram → TikTok CAPI)
 *
 * ไม่ใช่เทสต์ที่รันประจำ! ใช้เฉพาะตอน pre-deploy ที่ต้องพิสูจน์ทั้งเส้นจริง
 * เทสต์ประจำที่ปลอดภัยคือ tests/lead-forms.test.mjs (mock ทุก endpoint)
 *
 * ผลข้างเคียงที่ย้อนไม่ได้: TikTok CAPI CompleteRegistration ยิงทุก submission
 * ผลข้างเคียงที่ลบได้: row ใน leads (ชื่อขึ้นต้น ZZ TEST) · ข้อความ Telegram
 *
 * ขั้นตอนตาม docs/INTAKE-DATA-CONTRACT.md § Verification checklist
 *   1. รันไฟล์นี้            → submit ทุกฟอร์มด้วยชื่อ ZZ TEST <slug>
 *   2. ตรวจ Supabase        → ทุก column ที่ควรเติมต้องไม่ null
 *   3. ตรวจ Telegram        → เห็นการ์ดครบ
 *   4. ลบ row ทดสอบ         → delete from leads where full_name like 'ZZ TEST%'
 *
 * Usage: node tests/e2e-live-forms.mjs          (ต้องมี dev server ที่ :4325)
 *        node tests/e2e-live-forms.mjs --only booking
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4325';
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1] : null;

/** เบอร์ทดสอบต่างกันต่อฟอร์ม → ไล่ได้ว่า row ไหนมาจากฟอร์มไหน + ไม่ชนเบอร์คนจริง */
const FORMS = [
  { slug: 'booking',        path: '/booking',              form: '#booking-form',                submit: '#booking-submit',        phoneField: 'contact', phone: '0812340001', success: '#booking-success' },
  { slug: 'intake',         path: '/intake-form',          form: '#intake-form',                 submit: 'button[type="submit"]',  phoneField: 'phone',   phone: '0812340002', success: null },
  { slug: 'sponsor',        path: '/sponsor',              form: '#sponsorForm',                 submit: 'button[type="submit"]',  phoneField: 'yourPhone', phone: '0812340003', success: null },
  { slug: 'ads-dealer',     path: '/ads/dealer-ai-sales',  form: '#dealer-ai-booking-form',      submit: '#dealer-ai-submit',      phoneField: 'phone',   phone: '0812340004', success: null },
  { slug: 'ads-daruma',     path: '/ads/daruma-consult',   form: '#daruma-consult-booking-form', submit: '#daruma-consult-submit', phoneField: 'phone',   phone: '0812340005', success: null },
  { slug: 'ads-hotel',      path: '/ads/hotel-resort-ai',  form: '#hotel-ai-booking-form',       submit: '#hotel-ai-submit',       phoneField: 'phone',   phone: '0812340006', success: null },
  { slug: 'bosi-quiz',      path: '/bosi-dna-quiz',        form: null,                           submit: null,                     phoneField: null,      phone: null,         success: null, quiz: true },
];

const results = [];

async function fillAllRequired(page, formSel, values) {
  for (const [name, v] of Object.entries(values)) {
    await page.fill(`${formSel} [name="${name}"]`, v).catch(() => {});
  }
  for (const h of await page.locator(`${formSel} [required]`).all()) {
    const [tag, type, filled] = await h.evaluate((e) => [e.tagName, e.type, !!e.value]);
    if (tag === 'SELECT') await h.selectOption({ index: 1 }).catch(() => {});
    else if (type === 'checkbox' || type === 'radio') await h.check().catch(() => {});
    else if (!filled) await h.fill('ทดสอบระบบก่อน deploy — ข้อความยาวพอผ่าน validation gate ที่บังคับ 30 ตัวอักษร').catch(() => {});
  }
  return page.locator(`${formSel} [required]`).evaluateAll((els) =>
    els.filter((e) => !e.checkValidity()).map((e) => e.name || e.id));
}

const browser = await chromium.launch();

for (const f of FORMS) {
  if (ONLY && f.slug !== ONLY) continue;
  const name = `ZZ TEST ${f.slug}`;
  const rec = { slug: f.slug, name, webhookStatus: null, ok: false, note: '' };
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // ดูว่า webhook ตอบอะไร (ไม่ block — ปล่อยวิ่งไป production จริง)
  page.on('response', (r) => {
    if (r.url().includes('intake-form-v2')) rec.webhookStatus = r.status();
  });
  page.on('pageerror', (e) => { rec.note += `pageerror: ${e.message.slice(0, 80)}; `; });

  try {
    await page.goto(BASE + f.path, { waitUntil: 'domcontentloaded' });

    if (f.quiz) {
      await page.fill('#intro-name', name);
      await page.fill('#intro-role', 'CEO / เจ้าของกิจการ');
      await page.fill('#intro-company', 'บจก. ทดสอบระบบ');
      await page.click('#btn-start');
      await page.waitForTimeout(400);
      for (let q = 0; q < 10; q++) {
        await page.locator(`input[name="q${q}"]`).first().check().catch(() => {});
      }
      await page.waitForTimeout(300);
      await page.click('#btn-submit');
    } else {
      const vals = { name, company: 'บจก. ทดสอบระบบ', business: 'ทดสอบระบบ B2B',
                     brandName: 'บจก. ทดสอบระบบ', yourName: name, email: 'zz-test@example.com',
                     brandWebsite: 'https://example.com' };
      if (f.phoneField) vals[f.phoneField] = f.phone;
      const invalid = await fillAllRequired(page, f.form, vals);
      if (invalid.length) rec.note += `required ค้าง: ${invalid}; `;
      await page.click(f.submit);
    }

    await page.waitForTimeout(4000);
    rec.ok = rec.webhookStatus === 200;
    if (f.success) rec.successUI = await page.locator(f.success).isVisible().catch(() => false);
  } catch (err) {
    rec.note += `error: ${String(err).slice(0, 120)}`;
  }
  results.push(rec);
  console.log(`${rec.ok ? '✅' : '❌'} ${f.slug.padEnd(12)} webhook=${rec.webhookStatus ?? 'ไม่ยิง'} ${rec.successUI !== undefined ? `successUI=${rec.successUI} ` : ''}${rec.note}`);
  await ctx.close();
}

await browser.close();
console.log('\n' + '─'.repeat(60));
console.log(`ยิงสำเร็จ ${results.filter((r) => r.ok).length}/${results.length} ฟอร์ม`);
console.log('ต่อไป: ตรวจ Supabase → ตรวจ Telegram → ลบ row ZZ TEST');
