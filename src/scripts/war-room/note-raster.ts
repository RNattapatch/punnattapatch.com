// note-raster.ts — วาดการ์ด Note Studio เป็น PNG ในเบราว์เซอร์ (2026-10-12)
// ใช้ HTML ชุดเดียวกับพรีวิว (slideDoc) → SVG foreignObject → canvas 2x = 2160px เท่ากับ render.mjs บนมินิ
// เทียบกับ render.mjs (ชุด speed-to-lead 10 ใบ ใน Chromium): ต่างแค่ขอบตัวอักษร anti-alias · 10 ใบ ~2 วินาที
// มินิยังเป็นทางสำรอง (Safari/WebKit วาดรูปใน foreignObject ไม่เสถียร · หรือวาดพังด้วยเหตุอื่น)

const W = 1080;
const SCALE = 2;

/** Chrome / Edge / Brave (Blink) วาดได้ตรงกับมินิ · Safari, Firefox → ให้มินิทำ */
export function canRasterInBrowser(ua = navigator.userAgent): boolean {
  return /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua) && typeof document.fonts !== 'undefined';
}

/** HTML ทั้งหน้าของ 1 ใบ → PNG 2160 × (2 × H)
 *  ⚠️ ต้องเป็น data URL — SVG ที่มี foreignObject จาก blob: ทำ canvas ติด taint แล้ว toBlob ไม่ได้ (เจอใน Chromium 2026-10-12)
 *  รูปทุกรูปใน HTML ต้องเป็น data URL อยู่แล้ว (พรีวิวใน iframe sandbox ก็ต้องใช้แบบนี้) */
export async function rasterSlide(html: string, H: number): Promise<Blob> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.querySelector('img[src^="http"], img[src^="blob:"]')) throw new Error('รูปในการ์ดยังไม่ได้โหลดเป็นไฟล์ในเครื่อง');
  const xhtml = new XMLSerializer().serializeToString(doc.documentElement);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xhtml}</foreignObject></svg>`;
  await document.fonts.ready;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = W * SCALE; c.height = H * SCALE;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('เบราว์เซอร์ไม่มี canvas');
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!blob || blob.size < 10_000) throw new Error('วาดรูปไม่สำเร็จ (ได้ภาพว่าง)');
  return blob;
}
