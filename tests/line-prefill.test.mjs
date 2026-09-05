import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// ปุ่ม LINE เปิดแชตพร้อมข้อความ + แท็ก [รหัส/angle] — ปันสั่ง 2026-09-06 เพราะลูกค้าไม่พิมพ์คีย์เวิร์ดเอง
// ทดสอบ logic ล้วนผ่านการอ่าน source (ไฟล์เป็น TS · ไม่มี ts loader ใน node --test)
const src = await readFile(new URL('../src/scripts/line-prefill.ts', import.meta.url), 'utf8');
const site = await readFile(new URL('../src/data/site.ts', import.meta.url), 'utf8');
const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

test('LINE prefill builds an oaMessage link with the course tag and angle', () => {
  assert.match(site, /lineOaId: '@011xgvap'/, 'site must carry the real LINE OA basic id');
  assert.match(src, /line\.me\/R\/oaMessage\//, 'links must use the oaMessage scheme so the message is prefilled');
  assert.match(src, /\[\$\{code\}\/\$\{safeAngle\}\]/, 'tag must be [CODE/angle] — the bot parses this exact shape');
  assert.match(src, /ANGLE_PATTERN = \/\^\[a-z0-9-\]\{1,40\}\$\//, 'angle must be sanitised before it is put in a message');
  assert.match(src, /lineOriginalHref/, 'original lin.ee href must be kept for fallback/debugging');
});

test('BaseLayout mounts LinePrefill next to ContactTracking so every page rewrites its LINE buttons', () => {
  assert.match(layout, /<ContactTracking \/>\s*<LinePrefill \/>/);
});
