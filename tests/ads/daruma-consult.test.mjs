import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../../src/pages/ads/daruma-consult.astro', import.meta.url);

test('Daruma consult landing contract is present and compliant', async () => {
  const source = await readFile(pagePath, 'utf8');
  const required = [
    'ข้อมูลลูกค้าบริษัทคุณ อยู่กับบริษัท หรืออยู่กับเซลล์?',
    'จองคิวคุยฟรี 15–20 นาที',
    'daruma-consult-form',
    'name="utm_source"',
    'name="utm_medium"',
    'name="utm_campaign"',
    'name="utm_content"',
    'name="utm_term"',
    '890649354099149',
    "fbq('track', 'PageView')",
    "fbq('track', 'ViewContent'",
    "fbq('track', 'Lead'",
    "fbq('track', 'Contact'",
    'intake-form-v2',
    "source: 'ads-daruma-consult'",
    'line.me/R/ti/p/@011xgvap',
    'noindex,follow',
  ];
  for (const value of required) assert.ok(source.includes(value), `missing ${value}`);

  for (const banned of ['25,000', 'Daruma Score', 'ประหยัดเงินเดือน', 'แทนพนักงาน', 'การันตี']) {
    assert.equal(source.includes(banned), false, `banned copy found: ${banned}`);
  }
});
