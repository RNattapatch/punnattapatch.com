import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4392';
const outputDir = process.argv[3] ?? 'qa/ram';
const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${origin}/ram`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    heading: document.querySelector('h1')?.getBoundingClientRect().toJSON(),
    download: document.querySelector('#hero button')?.getBoundingClientRect().toJSON(),
  }));

  await page.screenshot({ path: `${outputDir}/ram-${viewport.name}.png`, fullPage: true });
  report.push({ viewport: viewport.name, errors, ...metrics });
  await page.close();
}

const resultPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await resultPage.goto(`${origin}/ram`, { waitUntil: 'networkidle' });
for (let index = 0; index < 6; index += 1) {
  await resultPage.locator('[data-work-task] input').nth(index).check();
}
await resultPage.getByRole('button', { name: 'ดูผล 90/10' }).click();
await resultPage.locator('#result-card').screenshot({ path: `${outputDir}/ram-result-card-mobile-390.png` });
await resultPage.close();

const readerPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await readerPage.goto(`${origin}/ram/usecases`, { waitUntil: 'networkidle' });
await readerPage.locator('[data-case-card]').first().waitFor();
await readerPage.screenshot({ path: `${outputDir}/ram-usecases-mobile-390.png`, fullPage: true });
await readerPage.close();

await browser.close();

const failed = report.filter((item) => item.errors.length || item.documentWidth > item.viewportWidth);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
