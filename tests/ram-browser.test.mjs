import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test, { after, before } from 'node:test';
import { chromium } from 'playwright';

const port = 4391;
const origin = `http://127.0.0.1:${port}`;
let server;
let browser;

before(async () => {
  server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', 'public'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve) => setTimeout(resolve, 350));
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  server?.kill('SIGTERM');
});

async function openRam() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(5_000);
  await page.goto(`${origin}/ram/index.html`, { waitUntil: 'domcontentloaded', timeout: 5_000 });
  return page;
}

async function selectTasks(page, indexes) {
  const tasks = page.locator('[data-work-task] input[type="checkbox"]');
  for (const index of indexes) await tasks.nth(index).check();
  await page.getByRole('button', { name: 'ดูผล 90/10' }).click();
}

test('mobile hero exposes the slide action without scrolling', async () => {
  const page = await openRam();
  const button = page.getByRole('link', { name: /โหลดสไลด์ \(PDF\)/ });
  const box = await button.boundingBox();

  assert.equal(await button.isVisible(), true);
  assert.match(await button.getAttribute('href'), /\.pdf$/, 'ต้องโหลดไฟล์จริง ไม่ใช่ปุ่มที่กดไม่ได้');
  assert.ok(box && box.y + box.height <= 844, `download action ends at ${box?.y + box?.height}px`);
  await page.close();
});

test('90/10 worksheet asks for at least three tasks before calculating', async () => {
  const page = await openRam();
  await page.getByRole('button', { name: 'ดูผล 90/10' }).click();

  await assert.doesNotReject(() => page.getByRole('alert').waitFor({ state: 'visible' }));
  assert.match(await page.getByRole('alert').textContent(), /เลือกอย่างน้อย 3 งาน/);
  await page.close();
});

test('interactive controls have names and images have alt text', async () => {
  const page = await openRam();
  const unnamed = await page.locator('a, button, input, select, textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const label = element.labels?.[0]?.textContent ?? '';
      return !(element.getAttribute('aria-label') || label.trim() || element.textContent.trim() || element.getAttribute('title'));
    })
    .map((element) => element.outerHTML));
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();

  assert.deepEqual(unnamed, []);
  assert.equal(imagesWithoutAlt, 0);
  await page.close();
});

test('90/10 worksheet renders all three result levels', async () => {
  const cases = [
    { indexes: [0, 1, 2, 3, 4, 5], heading: 'งานที่คุณทำอยู่ส่วนใหญ่ อยู่ในโซนที่ AI ทำได้ดีแล้ว', percent: '100%' },
    { indexes: [0, 1, 2, 8, 9, 10, 11, 12, 13, 14], heading: 'งานคุณอยู่ครึ่งทาง', percent: '30%' },
    { indexes: [0, 1, 8, 9, 10, 11, 12, 13], heading: 'งานคุณอยู่ในโซนที่ AI เสริมได้มากกว่าลดได้', percent: '25%' },
  ];

  for (const resultCase of cases) {
    const page = await openRam();
    await selectTasks(page, resultCase.indexes);
    const result = page.locator('#result-card');

    assert.equal(await result.isVisible(), true);
    assert.equal(await result.locator('[data-result-percent]').textContent(), resultCase.percent);
    assert.equal(await result.locator('[data-result-title]').textContent(), resultCase.heading);
    assert.match(await result.textContent(), /ไม่ได้วัดว่าใครจะถูกเลิกจ้าง/);
    await page.close();
  }
});

test('use-case reader filters the 154-item local snapshot', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(5_000);
  await page.goto(`${origin}/ram/usecases.html`, { waitUntil: 'domcontentloaded', timeout: 5_000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-case-card]').length === 154);
  assert.equal(await page.locator('[data-case-card]').count(), 154);
  assert.equal(await page.locator('#case-category option').count(), 15);

  await page.getByLabel('ค้นหา use case').fill('Meysure');
  assert.equal(await page.locator('[data-case-card]').count(), 1);
  assert.match(await page.locator('[data-case-card]').first().textContent(), /Meysure/);
  await page.close();
});
