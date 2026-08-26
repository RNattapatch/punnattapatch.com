/**
 * prep-proof-images.mjs — redact + crop + resize ภาพ "ระบบที่ผมใช้เอง" ก่อนขึ้นเว็บ
 *
 * ทำไมต้องมี: ภาพต้นฉบับเป็น screenshot ระบบจริง มีทั้งชื่อลูกค้า ตัวเงิน ชื่อคู่แข่ง
 * บรรทัด error และ bookmarks bar ส่วนตัวติดมาด้วย — ต้อง redact ให้จบก่อน แล้ว
 * commit เฉพาะไฟล์ผลลัพธ์ลง public/proof/ (ต้นฉบับไม่อยู่ใน repo นี้)
 *
 * ลำดับ: blur (พิกัดของภาพต้นฉบับ) → crop → resize 2 ขนาด (1400 / 700) → jpeg
 *
 * Usage: node scripts/prep-proof-images.mjs [--src <dir>]
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = process.argv.includes('--src')
  ? process.argv[process.argv.indexOf('--src') + 1]
  : '/Users/r_nat/Documents/claude-code-pun-nattapatch/input-to-agent/testimonial/system-use-case/website-proof/img';
const OUT = path.resolve('public/proof');

/** ขนาดที่ปล่อยออก — ตัวใหญ่สำหรับ desktop, @700 สำหรับ srcset มือถือ */
const WIDTHS = [1400, 700];
/** thumbnail สำหรับ rail (booking + ท้ายบทความ) — ขึ้นทุกบทความ เลยต้องเล็กจริง */
const THUMB = 320;
const BLUR = 22;

/**
 * พิกัดทั้งหมดอ้างอิง "ภาพต้นฉบับ" (ก่อน crop)
 * blur: กล่องที่ต้องเบลอ · crop: กรอบที่เก็บไว้ · ไม่ใส่ = ใช้ทั้งภาพ
 */
const JOBS = {
  // 1400x770 — ครอป browser chrome + bookmarks · เบลอตัวเงินทุกช่อง (เก็บ label ไว้)
  '01-command-center.jpg': {
    crop: { left: 0, top: 78, width: 1400, height: 692 },
    blur: [
      { left: 305, top: 352, width: 125, height: 48 },   // ฿468K ยอดขายช่วงเลือก
      { left: 578, top: 357, width: 125, height: 48 },   // ฿132K ยอดปิดเดือนนี้
      { left: 748, top: 330, width: 72, height: 26 },    // +288.2%
      { left: 578, top: 402, width: 145, height: 26 },   // เทียบเดือนก่อน ฿34K
      { left: 850, top: 495, width: 115, height: 48 },   // ฿11K ค่าใช้จ่าย
      { left: 850, top: 540, width: 155, height: 26 },   // รวมทั้งหมด ฿11K
      { left: 1123, top: 495, width: 135, height: 48 },  // ฿120K กำไรสุทธิ
      { left: 1123, top: 540, width: 235, height: 26 },  // ยอดขาย ฿132K – ค่าใช้จ่าย ฿11K
      { left: 305, top: 676, width: 235, height: 26 },   // ให้บริการรวม 8 ครั้ง · LTV ฿279K
    ],
  },

  // 1400x770 — ครอป chrome · เบลอตัวเงินใน SALES TREND + วิดีโอ PiP มุมล่างขวา
  '02-command-charts.jpg': {
    crop: { left: 0, top: 78, width: 1400, height: 692 },
    blur: [
      { left: 758, top: 490, width: 76, height: 26 },    // Δ +288.2%
      { left: 652, top: 543, width: 64, height: 24 },    // ฿132K
      { left: 440, top: 648, width: 56, height: 24 },    // ฿34K
      { left: 318, top: 534, width: 42, height: 22 },    // axis 150K
      { left: 318, top: 588, width: 42, height: 22 },    // axis 100K
      { left: 322, top: 642, width: 36, height: 22 },    // axis 50K
      { left: 1236, top: 650, width: 162, height: 120 }, // picture-in-picture overlay
    ],
  },

  // 1400x770 — ครอป chrome · เบลอยอดเงินในคอลัมน์ WON
  '03-pipeline.jpg': {
    crop: { left: 0, top: 78, width: 1400, height: 640 },
    blur: [
      { left: 1338, top: 276, width: 62, height: 26 },   // ยอดเงินคอลัมน์ WON
      { left: 1338, top: 376, width: 62, height: 26 },
      { left: 1338, top: 476, width: 62, height: 26 },
      { left: 1338, top: 576, width: 62, height: 26 },
      { left: 984, top: 482, width: 178, height: 30 },   // ชื่อบริษัทลูกค้าที่หลุดมากับป้ายอุตสาหกรรม
    ],
  },

  // 1400x770 — ข่าวสาธารณะ ไม่มี PII · ครอป chrome อย่างเดียว
  '04-newsdesk.jpg': { crop: { left: 0, top: 78, width: 1400, height: 692 } },
  '05-newsdesk-post.jpg': { crop: { left: 0, top: 78, width: 1400, height: 692 } },

  // 760x1652 — ครอปขอบบนที่ค้างจากบับเบิลก่อนหน้า + ขอบล่างที่มี "ออกเอกสารไม่ได้ Timed out"
  //            เบลอเฉพาะ "ตัวเลขราคา" — ปุ่มยืนยัน/ยกเลิกกับ flow ทั้งหมดยังอ่านออกครบ
  '06-docbot-chat.jpg': {
    crop: { left: 0, top: 138, width: 760, height: 1387 },
    blur: [
      { left: 414, top: 298, width: 156, height: 44 },   // "30,000" ในคำสั่งที่พิมพ์
      { left: 420, top: 779, width: 192, height: 40 },   // ฿30,000.00 รายการ
      { left: 168, top: 879, width: 192, height: 40 },   // รวมเงิน
      { left: 290, top: 932, width: 170, height: 40 },   // หัก ณ ที่จ่าย
      { left: 168, top: 984, width: 204, height: 40 },   // ยอดสุทธิ
    ],
  },

  // 700x1044 — ใบเสนอราคา ชื่อลูกค้าเบลอมาแล้ว · เบลอเพิ่มเฉพาะตัวเลขราคาทั้งใบ
  //            (โครงเอกสาร เลขที่ QO วันยืนราคา และชื่อรายการยังอ่านออก = ยังพิสูจน์ว่าบอทออกใบจริง)
  '07-docbot-pdf.jpg': {
    blur: [
      { left: 320, top: 187, width: 178, height: 32 },   // คอลัมน์ราคา/หน่วย + จำนวนเงิน (2 แถว)
      { left: 425, top: 370, width: 68, height: 112 },   // แผงยอดรวม 4 บรรทัด (รวม โอนชำระสุทธิ)
      { left: 228, top: 790, width: 190, height: 42 },   // ยอดสุทธิ ในข้อความสรุป
    ],
  },

  // 700x916 — เบลอชื่อ "Natn" ที่ยังโผล่หน้ากล่องเบลอเดิม
  '08-line-agent-a.jpg': {
    blur: [{ left: 140, top: 602, width: 80, height: 36 }],
  },

  // 700x925 — ครอปสติกเกอร์ที่โดนตัดครึ่ง + แถบพิมพ์ว่างท้ายภาพ
  '09-line-agent-b.jpg': { crop: { left: 0, top: 0, width: 700, height: 686 } },

  // 760x1500 — screencap รายงานเต็ม · ครอปแค่ขอบบน (telegram plugin disconnected)
  //            กับขอบล่าง ([claude-bot] Restarted) ที่เป็นบรรทัดระบบ ไม่ใช่เนื้อรายงาน
  //            เบลอเฉพาะ "ชื่อช่องคู่แข่ง" ทั้ง 4 จุด + ลิงก์คลิป 2 ชุด (ลิงก์สะกดชื่อช่องอยู่ในตัว url)
  '10-night-scout.jpg': {
    crop: { left: 0, top: 22, width: 760, height: 1250 },
    blur: [
      { left: 460, top: 201, width: 156, height: 34 },   // TL;DR — ชื่อช่อง A
      { left: 164, top: 262, width: 138, height: 34 },   // TL;DR — ชื่อช่อง B
      { left: 50, top: 401, width: 186, height: 34 },    // ① ชื่อช่อง
      { left: 48, top: 491, width: 492, height: 62 },    // ① ลิงก์คลิป 2 บรรทัด
      { left: 70, top: 571, width: 186, height: 34 },    // ② ชื่อช่อง
      { left: 48, top: 661, width: 472, height: 62 },    // ② ลิงก์คลิป 2 บรรทัด
    ],
  },
};

/** เบลอเฉพาะกล่อง: ตัดชิ้นออกมา blur แล้ว composite กลับที่เดิม */
async function redact(file, rects) {
  let buf = await sharp(file).toBuffer();
  if (!rects?.length) return buf;
  const patches = await Promise.all(
    rects.map(async (r) => ({
      input: await sharp(buf).extract(r).blur(BLUR).toBuffer(),
      left: r.left,
      top: r.top,
    })),
  );
  return sharp(buf).composite(patches).toBuffer();
}

await mkdir(OUT, { recursive: true });
const available = new Set(await readdir(SRC));
let done = 0;

for (const [name, job] of Object.entries(JOBS)) {
  if (!available.has(name)) {
    console.log(`  ⚠️  ข้าม ${name} — ไม่เจอใน ${SRC}`);
    continue;
  }
  const redacted = await redact(path.join(SRC, name), job.blur);
  const cropped = job.crop
    ? await sharp(redacted).extract(job.crop).toBuffer()
    : redacted;

  const { width: w } = await sharp(cropped).metadata();
  const base = name.replace(/\.jpg$/, '');

  // ภาพแนวตั้ง (มือถือ) กว้างไม่ถึง 900 อยู่แล้ว — ไม่ต้องมี @700 ให้ซ้ำเปล่า ๆ
  const targets = w > 900 ? WIDTHS : [WIDTHS[0]];

  for (const target of targets) {
    const suffix = target === WIDTHS[0] ? '' : `@${target}`;
    const out = path.join(OUT, `${base}${suffix}.jpg`);
    await sharp(cropped)
      .resize({ width: Math.min(target, w), withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
  }
  await sharp(cropped)
    .resize({ width: THUMB, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(OUT, `${base}@${THUMB}.jpg`));

  done++;
  console.log(`  ✅ ${base}  (${w}px → ${targets.join(' / ')} / ${THUMB})`);
}

console.log(`\nเสร็จ ${done}/${Object.keys(JOBS).length} ไฟล์ → ${OUT}`);
