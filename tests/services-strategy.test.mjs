import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function builtPage(route) {
  const filename = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}.html`;
  return readFile(join(root, 'dist', filename), 'utf8');
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('services catalog gives Training and Consulting equal first-screen routes', async () => {
  const html = await builtPage('/services');

  assert.match(visibleText(html), /ฝึกทีมให้ทำเป็น หรือให้ผมเข้าไปวางระบบให้/);
  assert.match(html, /href="#core-training"[^>]*>\s*ดูคอร์สสำหรับทีมขาย/);
  assert.match(html, /href="#system-services"[^>]*>\s*ดูบริการวางระบบฝ่ายขาย/);
  assert.ok(
    html.indexOf('id="system-services"') < html.indexOf('id="trusted-by"'),
    'Consulting must appear before the long proof section so service buyers do not have to cross the gallery first',
  );
});

test('each course card states the artifact the team takes back', async () => {
  const html = await builtPage('/services');

  assert.match(html, /Sales Context Pack/);
  assert.match(html, /Stage dictionary/);
  assert.match(html, /Funnel map \+ Campaign kit \+ Chat script/);
  assert.doesNotMatch(html, />วาง Funnel และวิธีใช้ AI ในงานขายที่ทีมทำอยู่จริง</);
});

test('global floating LINE contact follows the public and transaction visibility contract', async () => {
  const [home, services, booking, thankYou, intakeForm, ad] = await Promise.all([
    builtPage('/'),
    builtPage('/services'),
    builtPage('/booking'),
    builtPage('/thank-you'),
    builtPage('/intake-form'),
    builtPage('/ads/dealer-online-sales'),
  ]);

  for (const [name, html] of [['home', home], ['services', services]]) {
    assert.equal((html.match(/<a\b[^>]*\bdata-floating-line(?:\s|>)/g) ?? []).length, 1, `${name} must render one floating LINE control`);
    assert.match(html, /href="https:\/\/lin\.ee\/ioSnSUG"/);
    assert.match(html, /data-cta-location="floating_line"/);
    assert.match(html, /data-product-code="none"/);
    assert.match(html, /data-cta-label="ทัก LINE · ให้ผมช่วยเลือก"/);
  }

  for (const [name, html] of [['booking', booking], ['thank-you', thankYou], ['intake form', intakeForm], ['ads LP', ad]]) {
    assert.doesNotMatch(html, /<a\b[^>]*\bdata-floating-line(?:\s|>)/, `${name} must not render the global floating LINE control`);
  }
  assert.equal((ad.match(/id="dealer-ai-sticky"/g) ?? []).length, 1, 'ads LP must retain exactly one bottom sticky CTA');
});

test('site identity leads with sales systems instead of AI transformation', async () => {
  const html = await builtPage('/services');

  assert.match(html, /ที่ปรึกษาวางระบบและพัฒนาทีมขาย B2B สำหรับ SME/);
  assert.doesNotMatch(html, /<p class="mt-2 text-sm[^>]*>AI Agent Transformation Consultant for B2B Business<\/p>/);
});
