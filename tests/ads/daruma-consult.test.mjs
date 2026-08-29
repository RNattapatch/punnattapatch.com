import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const redirectsPath = new URL('../../public/_redirects', import.meta.url);
const replacementPagePath = new URL('../../src/pages/ads/sales-ai-team.astro', import.meta.url);

test('retired Daruma consult landing permanently redirects to its compliant replacement', async () => {
  const redirects = await readFile(redirectsPath, 'utf8');
  assert.match(redirects, /^\/ads\/daruma-consult \/ads\/sales-ai-team 301$/m);

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
