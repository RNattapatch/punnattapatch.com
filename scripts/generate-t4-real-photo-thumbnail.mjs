import sharp from 'sharp';

const source = 'public/lp/inhouse/hero-pointing.jpg';
const outputs = [
  { path: 'src/assets/services/product-thumbnails/t4-ai-workflow-pilot.png', format: 'png' },
  { path: 'public/services/thumbs/t4-ai-workflow-pilot.jpg', format: 'jpeg' },
];

const overlay = Buffer.from(`
<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <style>
    .eyebrow { font: 700 30px 'Sukhumvit Set'; letter-spacing: 4px; }
    .title { font: 700 91px 'Sukhumvit Set'; }
    .body { font: 600 32px 'Sukhumvit Set'; }
    .small { font: 600 25px 'Sukhumvit Set'; }
  </style>
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#082d4f" stop-opacity="1"/>
      <stop offset="0.84" stop-color="#082d4f" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#082d4f" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="970" height="900" fill="url(#wash)"/>
  <rect x="82" y="84" width="46" height="10" fill="#6fd7f2"/>
  <text x="148" y="97" class="eyebrow" fill="#6fd7f2">WORKFLOW PILOT DAY · T4</text>
  <text x="82" y="244" class="title" fill="#fff9ed">ลอง AI กับงาน</text>
  <text x="82" y="350" class="title" fill="#ff6b5e">ที่ทีมทำอยู่จริง</text>
  <text x="82" y="445" class="body" fill="#e9f4f5">เลือกหนึ่ง Flow · ทดลองด้วยข้อมูลที่ปลอดภัย</text>
  <text x="82" y="496" class="body" fill="#e9f4f5">แล้วค่อยตัดสินใจเรื่องระบบจริง</text>
  <rect x="82" y="594" width="218" height="60" fill="none" stroke="#6fd7f2" stroke-width="2"/>
  <text x="108" y="634" class="small" fill="#fff9ed">Pick  →  Test  →  Decide</text>
  <text x="82" y="802" class="small" fill="#fff9ed">Pun Nattapatch · Sales × AI</text>
</svg>`);

const base = sharp(source)
  .resize(1600, 900, { fit: 'cover', position: 'attention' })
  .modulate({ brightness: 0.9, saturation: 0.9 })
  .composite([{ input: overlay, top: 0, left: 0 }]);

for (const output of outputs) {
  const pipeline = base.clone();
  if (output.format === 'png') await pipeline.png({ compressionLevel: 9 }).toFile(output.path);
  else await pipeline.jpeg({ quality: 90, mozjpeg: true }).toFile(output.path);
  console.log(output.path);
}
