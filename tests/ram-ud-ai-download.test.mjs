import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const port = 4397;
const localOrigin = `http://127.0.0.1:${port}`;
const targetUrl = process.env.UD_AI_URL ?? `${localOrigin}/ram/ud-ai.html`;
let server;
let browser;

async function waitForServer(url, timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The local static server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

before(async () => {
  if (!process.env.UD_AI_URL) {
    server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', 'public'], {
      stdio: 'ignore',
    });
    await waitForServer(targetUrl);
  }
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  server?.kill('SIGTERM');
});

async function openPage(viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({
    viewport,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7_000);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  return { context, page };
}

test('a student can load and copy the complete LINE Agent Building Prompt', async () => {
  const { context, page } = await openPage();
  const section = page.locator('#line-agent-building-prompt');
  const prompt = page.locator('#line-agent-prompt');

  assert.equal(await section.isVisible(), true, 'LINE Agent Building Prompt section is missing');
  assert.match(await section.getByRole('heading', { level: 2 }).textContent(), /LINE Agent Building Prompt/);
  await page.waitForFunction(() => document.querySelector('#line-agent-prompt')?.value.startsWith('ตั้งระบบ “LINE Bot'));

  const promptText = await prompt.inputValue();
  assert.match(promptText, /^ตั้งระบบ “LINE Bot ติดตาม & แจ้งเตือนงานส่วนตัว” ให้ผมจนผ่านการทดสอบจริง/);
  assert.match(promptText, /@line\/line-bot-mcp-server@0\.5\.0/);
  assert.match(promptText, /ตอนจบให้รายงานตารางสั้น 7 แถว/);
  assert.doesNotMatch(promptText, /LINE_(?:CHANNEL_ACCESS_TOKEN|CHANNEL_SECRET|USER_ID)=\S+/);

  await section.getByRole('button', { name: 'คัดลอก LINE Agent Prompt' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), promptText);
  assert.match(await section.locator('[data-copy-line-status]').textContent(), /คัดลอกแล้ว/);
  await context.close();
});

test('the section keeps a usable fallback when its prompt file cannot load', async () => {
  const { context, page } = await openPage();
  await page.route('**/line-agent-building-prompt.md', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.reload({ waitUntil: 'domcontentloaded' });

  const section = page.locator('#line-agent-building-prompt');
  const button = section.getByRole('button', { name: 'คัดลอก LINE Agent Prompt' });
  await page.waitForFunction(() => document.querySelector('[data-copy-line-status]')?.textContent.includes('โหลด Prompt ไม่สำเร็จ'));
  assert.equal(await button.isDisabled(), true);
  assert.match(await section.getByRole('link', { name: 'เปิด Prompt แบบไฟล์' }).getAttribute('href'), /line-agent-building-prompt\.md$/);
  await context.close();
});

test('the delivery page has no horizontal overflow at classroom viewports', async () => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 1000 },
  ]) {
    const { context, page } = await openPage(viewport);
    await page.locator('#line-agent-building-prompt').waitFor({ state: 'visible' });
    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      sectionWidth: document.querySelector('#line-agent-building-prompt')?.getBoundingClientRect().width,
    }));
    assert.ok(geometry.scrollWidth <= geometry.clientWidth, `${viewport.width}px viewport overflows by ${geometry.scrollWidth - geometry.clientWidth}px`);
    assert.ok(geometry.sectionWidth > 0 && geometry.sectionWidth <= geometry.clientWidth, `${viewport.width}px prompt section is outside the viewport`);
    await context.close();
  }
});
