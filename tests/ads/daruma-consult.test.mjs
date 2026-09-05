import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const redirectsPath = new URL('../../public/_redirects', import.meta.url);
const replacementPagePath = new URL('../../src/pages/ads/sales-ai-team.astro', import.meta.url);

test('retired Daruma consult landing permanently redirects to its compliant replacement', async () => {
  const redirects = await readFile(redirectsPath, 'utf8');
  // ปลายทางเปลี่ยน 2026-09-04: แอด Daruma ที่ยังรันอยู่พูดเรื่อง automation → ชี้เข้า T4
  // แทน T1 (จิตวิทยาการขาย) ที่คนละเรื่องกับตัวโฆษณา · test เดิมค้างที่ปลายทางเก่าจนแดง
  assert.match(redirects, /^\/ads\/daruma-consult \/services\/advance-ai-automation 301$/m);

  const source = await readFile(replacementPagePath, 'utf8');
  const required = [
    "fmtPrice('inhouse-a')",
    "source: 'ads-sales-ai-team'",
    'SITE.social.line',
    'noindex,follow',
  ];
  for (const value of required) assert.ok(source.includes(value), `missing ${value}`);

  for (const banned of ['25,000', 'Daruma Score', 'ประหยัดเงินเดือน', 'แทนพนักงาน', 'การันตี', 'ads-daruma-consult']) {
    assert.equal(source.includes(banned), false, `banned copy found: ${banned}`);
  }
});
