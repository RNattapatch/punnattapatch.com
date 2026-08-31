import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routes = {
  T1: 'services/t1-sales-skills.html',
  T2: 'services/online-to-sales.html',
  T3: 'services/t3-sales-back-office.html',
  C1: 'services/daily-consulting.html',
  I1: 'services/dashboard-build.html',
};

test('every Product page separates Coral booking actions from LINE-green actions', async () => {
  for (const [code, file] of Object.entries(routes)) {
    const html = await readFile(join(root, 'dist', file), 'utf8');
    const bookingLinks = [...html.matchAll(/<a\b[^>]*data-booking-cta[^>]*>/g)].map(([tag]) => tag);
    const lineLinks = [...html.matchAll(/<a\b[^>]*data-line-cta[^>]*>/g)].map(([tag]) => tag);

    assert.ok(bookingLinks.length >= 3, `${code} must lead to booking at the main decision points`);
    assert.ok(lineLinks.length >= 1, `${code} must retain a direct LINE alternative`);

    for (const tag of bookingLinks) {
      assert.match(tag, /href="\/booking\?package=[^&"]+&amp;intent=[^"]+"/, `${code} booking CTA must carry product and intent`);
      assert.match(tag, /class="[^"]*\sbg-\[#c43245\]/i, `${code} booking CTA must use the AA-safe Coral action shade`);
      assert.doesNotMatch(tag, /lin\.ee/, `${code} booking CTA must not open LINE`);
    }

    for (const tag of lineLinks) {
      assert.match(tag, /href="https:\/\/lin\.ee\/ioSnSUG"/, `${code} LINE CTA must use the real LINE destination`);
      assert.match(tag, /bg-\[#06c755\]/i, `${code} LINE CTA must use LINE green`);
      assert.doesNotMatch(tag, /class="[^"]*\sbg-\[#c43245\]/i, `${code} LINE CTA must not look like the booking action`);
    }
  }
});

test('booking page exposes product context without replacing its canonical lead source', async () => {
  const [html, source] = await Promise.all([
    readFile(join(root, 'dist', 'booking.html'), 'utf8'),
    readFile(join(root, 'src', 'pages', 'booking.astro'), 'utf8'),
  ]);

  assert.match(html, /data-booking-product-context/);
  assert.match(html, /name="package"/);
  assert.match(source, /source:\s*["']website-booking["']/);
  assert.match(source, /source_page:\s*["']website-booking["']/);
  assert.match(html, /จองคิวรับบริการ/);
});
