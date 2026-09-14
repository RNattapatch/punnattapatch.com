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

test('the page starts with the slide and shared-context classroom sessions in order', async () => {
  const { context, page } = await openPage();
  const sectionIds = await page.locator('main > section').evaluateAll((sections) => sections.slice(0, 2).map((section) => section.id));

  assert.deepEqual(sectionIds, ['classroom-slides', 'shared-context-handoff-prompt']);
  const slides = page.locator('#classroom-slides');
  assert.match(await slides.getByRole('heading', { name: 'สไลด์บทเรียน' }).textContent(), /สไลด์บทเรียน/);
  assert.equal(await slides.getByRole('button', { name: 'ไฟล์ PDF กำลัง Export' }).isDisabled(), true);
  assert.equal(await slides.locator('a[href$=".pdf"]').count(), 0, 'pending slide section must not expose a fake download');
  await context.close();
});

test('a student can load and copy the complete Shared Context and Handoff Prompt', async () => {
  const { context, page } = await openPage();
  const section = page.locator('#shared-context-handoff-prompt');
  const prompt = page.locator('#shared-context-prompt');

  assert.equal(await section.isVisible(), true, 'Shared Context + Cross-Agent Handoff section is missing');
  await page.waitForFunction(() => document.querySelector('#shared-context-prompt')?.value.startsWith('สร้างระบบ Shared Context'));

  const promptText = await prompt.inputValue();
  assert.match(promptText, /^สร้างระบบ Shared Context \+ Cross-Agent Handoff/);
  assert.match(promptText, /AI Agent ที่ใช้: \[กรอก เช่น Claude Code, Codex, GPT\]/);
  assert.match(promptText, /memory\/SHARED\.md/);
  assert.match(promptText, /จำลอง Agent A เปิดงานและส่งต่อให้ Agent B/);

  await section.getByRole('button', { name: 'คัดลอก Shared Context Prompt' }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), promptText);
  assert.match(await section.locator('[data-copy-shared-status]').textContent(), /คัดลอกแล้ว/);
  await context.close();
});

test('the Agent A to Agent B handoff flow stays on one row on mobile', async () => {
  const { context, page } = await openPage({ width: 375, height: 812 });
  const boxes = await page.locator('[aria-label="Agent handoff flow"] > span:not([aria-hidden="true"])').evaluateAll((labels) => labels.map((label) => {
    const box = label.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom };
  }));

  assert.equal(boxes.length, 3);
  assert.ok(Math.max(...boxes.map((box) => box.top)) - Math.min(...boxes.map((box) => box.top)) < 2, 'handoff labels wrap onto different rows');
  await context.close();
});

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
