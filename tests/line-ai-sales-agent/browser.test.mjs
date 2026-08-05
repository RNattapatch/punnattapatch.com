import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const port = 4327;
const baseUrl = `http://127.0.0.1:${port}/app/line-ai-sales-agent`;
let devServer;

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        // The dev server is still booting.
      }
      if (Date.now() - startedAt > timeoutMs) return reject(new Error(`Timed out waiting for ${url}`));
      setTimeout(poll, 250);
    };
    poll();
  });
}

test.before(async () => {
  const worktree = fileURLToPath(new URL('../..', import.meta.url));
  devServer = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: worktree,
    stdio: 'ignore',
  });
  await waitForServer(baseUrl);
});

test.after(async () => {
  if (!devServer || devServer.killed) return;
  const stopped = new Promise((resolve) => {
    devServer.once('close', resolve);
    setTimeout(resolve, 1000);
  });
  devServer.kill('SIGTERM');
  await stopped;
});

test('covers the critical Playbook browser paths without console errors', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}#home`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  assert.equal(await page.locator('.phase-item').count(), 4);
  assert.equal(await page.locator('.architecture-node').count(), 3);
  assert.match(await page.locator('h1').first().textContent(), /LINE AI Agent/);
  assert.equal(await page.locator('html').getAttribute('lang'), 'th');
  assert.equal(await page.locator('main#playbook-main').count(), 1);
  assert.deepEqual(await page.locator('button, a').evaluateAll((elements) => elements
    .filter((element) => !element.closest('astro-dev-toolbar'))
    .filter((element) => !element.getRootNode()?.host?.tagName?.toLowerCase().startsWith('astro-dev-toolbar'))
    .filter((element) => !element.getAttribute('aria-label') && !element.textContent.trim())
    .map((element) => `${element.tagName}.${element.className}`)), []);
  assert.deepEqual(await page.locator('input').evaluateAll((elements) => elements
    .filter((element) => !element.getRootNode()?.host?.tagName?.toLowerCase().startsWith('astro-dev-toolbar'))
    .filter((element) => !element.getAttribute('aria-label') && !element.closest('label') && !element.id)
    .map((element) => element.outerHTML)), []);
  assert.deepEqual(await page.locator('img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.getAttribute('src'))), []);
  await page.locator('a[href="#main"]').focus();
  assert.equal(await page.locator('a[href="#main"]').evaluate((element) => document.activeElement === element), true);

  await page.goto(`${baseUrl}#prepare/P0`, { waitUntil: 'networkidle' });
  const firstChecklist = page.locator('input[data-action="toggle-check"]').first();
  await firstChecklist.check();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('input[data-action="toggle-check"]').first().isChecked(), true);

  await page.goto(`${baseUrl}#prepare/P1`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.dependency-warning').count(), 1);
  await page.locator('button[data-action="toggle-blocked"]').click();
  assert.match(await page.locator('.block-button').textContent(), /ปลดจุดติด/);
  await page.goto(`${baseUrl}#progress`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.status-needs-attention').count(), 1);
  assert.match(await page.locator('.resume-card').textContent(), /แก้จุดติดก่อน/);

  await page.goto(`${baseUrl}#home`, { waitUntil: 'networkidle' });
  await page.locator('#playbook-search').fill('webhook');
  assert.ok(await page.locator('.search-result').count() > 0);
  await page.locator('#search-phase-filter').selectOption('sell');
  await page.locator('#playbook-search').fill('ส่วนลด');
  const filteredResults = page.locator('.search-result');
  assert.ok(await filteredResults.count() > 0);
  assert.equal(await filteredResults.evaluateAll((items) => items.every((item) => item.dataset.phaseId === 'sell')), true);

  await page.goto(`${baseUrl}#prepare/P9`, { waitUntil: 'networkidle' });
  const promptInput = page.locator('input[data-prompt-field="shopName"]').first();
  await promptInput.fill('ร้านทดสอบ Stage 4');
  assert.match(await page.locator('.prompt-output pre').textContent(), /ร้านทดสอบ Stage 4/);
  await page.locator('button[data-action="copy-prompt"]').first().click();
  await page.waitForTimeout(100);
  assert.match(await page.locator('[data-live-region]').textContent(), /คัดลอก prompt/);

  await page.goto(`${baseUrl}#progress`, { waitUntil: 'networkidle' });
  await page.locator('button[data-action="copy-summary"]').click();
  await page.waitForTimeout(100);
  assert.match(await page.locator('[data-live-region]').textContent(), /คัดลอกสรุป/);

  await page.goto(`${baseUrl}#home`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Control+K');
  assert.equal(await page.locator('#playbook-search').evaluate((element) => document.activeElement === element), true);

  page.once('dialog', (dialog) => dialog.accept());
  await page.goto(`${baseUrl}#progress`, { waitUntil: 'networkidle' });
  await page.locator('button[data-action="reset"]').click();
  await page.waitForTimeout(50);
  assert.equal(await page.locator('.home-view').count(), 1);
  assert.equal(await page.evaluate(() => localStorage.getItem('pun:line-ai-sales-agent:v1:progress')), null);

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});
