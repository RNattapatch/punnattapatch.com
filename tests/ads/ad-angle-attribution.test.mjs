import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// ก่อนเปิดแอด T2 (2026-09-05): lead ต้องบอกได้ว่ามาจาก angle ไหน
// เส้นทางของค่า: ?angle= → pnAttribution.utm_content → hidden input utm_content →
// n8n Flatten Body1 (ส่งเฉพาะคีย์ utm_*) → RPC submit_lead → leads.ad_angle
// ถ้าใครลบ mapping ตรงไหนของเส้นนี้ แอดหลาย angle จะกลับไปแยกไม่ออกเหมือนก่อน
const layoutPath = new URL('../../src/layouts/BaseLayout.astro', import.meta.url);
const adsPages = [
  'sales-online-team',
  'sales-ai-team',
  'sales-backoffice-team',
  'dealer-online-sales',
].map((slug) => new URL(`../../src/pages/ads/${slug}.astro`, import.meta.url));

test('?angle= lands in utm_content so every ads lead carries its creative angle', async () => {
  const layout = await readFile(layoutPath, 'utf8');
  assert.match(layout, /params\.get\('angle'\)/, 'BaseLayout must read the ?angle= shortcut');
  assert.match(
    layout,
    /if \(angleParam && !fromUrl\.utm_content\) fromUrl\.utm_content = angleParam;/,
    'angle must fill utm_content, and must never overwrite an explicit utm_content',
  );
});

test('every ads landing page still carries the utm_content hidden field the angle rides in', async () => {
  for (const page of adsPages) {
    const source = await readFile(page, 'utf8');
    assert.ok(source.includes('name="utm_content"'), `${page.pathname} lost the utm_content field`);
    assert.match(source, /UTM_KEYS = \[[^\]]*'utm_content'/, `${page.pathname} stopped populating utm_content`);
  }
});
