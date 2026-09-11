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

// 2026-09-12 — หน้าปิดผ่าน LINE (P1) + สลับลิงก์ตามอุปกรณ์ (ปันเทสต์ iPhone ผ่าน · desktop oaMessage เป็นทางตัน)
const p1page = await readFile(new URL('../src/pages/services/ai-sales-agent-bootcamp.astro', import.meta.url), 'utf8');
const tracking = await readFile(new URL('../src/components/ContactTracking.astro', import.meta.url), 'utf8');

test('prefill only replaces lin.ee on mobile; desktop keeps lin.ee (QR page)', () => {
  assert.match(src, /MOBILE_UA = \/Android\|iPhone\|iPad\|iPod\/i/);
  assert.match(src, /if \(mobile\) a\.href = buildLineHref/, 'lin.ee buttons must only be rewritten on mobile');
});

test('P1 closes via LINE: page declares keyword + per-button events, booking buttons become LINE links, no on-page form', () => {
  assert.match(p1page, /data-line-close data-line-keyword=\{P1_PRODUCT_DETAIL\.cta\.keyword\}/);
  assert.match(p1page, /data-cta-event-booking="P1 จองที่นั่ง"/);
  assert.match(p1page, /data-cta-event-line="P1 ถามก่อน"/);
  assert.doesNotMatch(p1page, /ProductLeadForm/, 'P1 must not render the consult form');
  assert.match(src, /PRODUCT_CODE_PATTERN = \/\^\(T\[1-4\]\|C1\|I1\|P1\)\$\//, 'P1 must be a valid tag code');
  assert.match(src, /BOOKING_LINK_SELECTOR = 'a\[data-booking-cta\]'/);
  assert.match(src, /if \(keyword\) return `\$\{keyword\} \$\{buildTag/, 'keyword pages must send "<keyword> [code/angle]" so the bot card fires');
});

test('ContactTracking fires the per-button custom event next to Contact', () => {
  assert.match(tracking, /trackCustom', cta\.dataset\.ctaEvent/);
});
