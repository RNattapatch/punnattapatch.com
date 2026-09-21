import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const [url = 'http://127.0.0.1:4321/portfolio', outputDirArg] = process.argv.slice(2);
if (!outputDirArg) {
  throw new Error('Usage: node scripts/qa-portfolio-visual.mjs <url> <output-dir>');
}

const outputDir = resolve(outputDirArg);
await mkdir(outputDir, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) image.loading = 'eager';
      const step = Math.max(480, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolveStep) => setTimeout(resolveStep, 120));
      }
      await Promise.all([...document.images].map(async (image) => {
        if (!image.complete) {
          await new Promise((resolveImage) => {
            image.addEventListener('load', resolveImage, { once: true });
            image.addEventListener('error', resolveImage, { once: true });
          });
        }
        if (image.complete && image.naturalWidth > 0 && image.decode) {
          await image.decode().catch(() => {});
        }
      }));
      window.scrollTo(0, 0);
      await new Promise((resolveStep) => setTimeout(resolveStep, 250));
    });

    const audit = await page.evaluate(() => ({
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      brokenImages: [...document.images]
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      placeholders: document.body.innerText.match(/lorem ipsum|placeholder|TODO/gi) || [],
      futureSkillHref: document.querySelector('a[href*="futureskill.co"]')?.href || null,
      privateTerms: ['M2Homecar', 'รามคำแหง', 'TNI', 'วิทยาลัยเทคโนโลยีชลบุรี', 'Good & Rich']
        .filter((term) => document.body.innerText.includes(term)),
    }));

    const output = resolve(outputDir, `portfolio-${viewport.name}.png`);
    await page.screenshot({ path: output, fullPage: true });
    console.log(JSON.stringify({ viewport, output, audit, pageErrors }));
    await context.close();
  }
} finally {
  await browser.close();
}
