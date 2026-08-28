/**
 * เรนเดอร์ปก + หน้าตัวอย่างในเล่ม + PDF จากไฟล์ e-book ตัวจริง
 *
 *   node scripts/shoot-ebook.mjs
 *
 * ต้นทาง : public/downloads/ebook-stop-hiring-wrong-sales.html
 *          (ไฟล์นี้ build มาจาก claude-code repo → branding/output/free-ebook/build-ebook-html.mjs)
 * ปลายทาง: public/images/ebook-{cover-page,page-questions,page-toc}.jpg  ← ใช้ในหน้า /ebook-sales-interview
 *          public/downloads/ebook-stop-hiring-wrong-sales.pdf            ← ปุ่มดาวน์โหลดในหน้า thank-you
 *
 * รันใหม่ทุกครั้งที่เนื้อหาในเล่มเปลี่ยน — ภาพกับ PDF จะได้ไม่หลุดจากตัวเล่ม
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EBOOK = path.join(ROOT, 'public/downloads/ebook-stop-hiring-wrong-sales.html');
const IMG = path.join(ROOT, 'public/images');
const PDF = path.join(ROOT, 'public/downloads/ebook-stop-hiring-wrong-sales.pdf');

const W = 860; // ความกว้างหน้ากระดาษจำลอง
const H = Math.round((W * 297) / 210); // อัตราส่วน A4
const OUT_W = 1000; // ความกว้างไฟล์ภาพที่เสิร์ฟจริง

/** PNG จาก Playwright ใหญ่เกินไปสำหรับหน้าเว็บ — ย่อ + แปลงเป็น JPEG ก่อนเก็บ */
const save = async (buf, name) => {
  const out = path.join(IMG, name);
  await sharp(buf).resize({ width: OUT_W }).jpeg({ quality: 88, progressive: true }).toFile(out);
  console.log(name.padEnd(30), (fs.statSync(out).size / 1024).toFixed(0).padStart(5), 'KB');
};

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await pg.goto(pathToFileURL(EBOOK).href, { waitUntil: 'networkidle' });
await pg.waitForTimeout(2500); // รอ Tailwind CDN + Google Fonts จัดหน้าเสร็จก่อนถ่าย
await pg.evaluate(() => document.querySelector('button.no-print')?.remove());

// 1) ปกตัวจริงจากในเล่ม (ไม่ใช่ปกจำลองด้วย HTML)
await save(await pg.locator('header.cover').screenshot(), 'ebook-cover-page.jpg');

// 2-3) หน้าตัวอย่าง — ตัดจากตำแหน่งจริงให้ได้สัดส่วนเท่าหน้ากระดาษ A4
for (const [sel, name] of [
  ['#ch1', 'ebook-page-questions.jpg'],
  ['#toc', 'ebook-page-toc.jpg'],
]) {
  const box = await pg.locator(sel).boundingBox();
  const buf = await pg.screenshot({
    clip: { x: 0, y: Math.max(0, box.y - 24), width: W, height: H },
    fullPage: true,
  });
  await save(buf, name);
}

// 4) PDF ตัวจริง — เรนเดอร์ผ่าน print CSS ในไฟล์ (A4 + ปกเต็มหน้าแบบไม่มีขอบ)
await pg.pdf({ path: PDF, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();

console.log(path.basename(PDF).padEnd(30), (fs.statSync(PDF).size / 1024).toFixed(0).padStart(5), 'KB');
