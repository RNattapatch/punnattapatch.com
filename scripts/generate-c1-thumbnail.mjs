// C1 thumbnail (2026-10-08 · day-rate model: 2 topics per day) — same render + audit flow as the T4 generator
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const htmlPath = resolve(scriptDir, 'c1-service-thumbnail.html');
const pngPath = resolve(root, 'src/assets/services/product-thumbnails/c1-daily-sales-consulting.png');
const jpgPath = resolve(root, 'public/services/thumbs/c1-daily-sales-consulting.jpg');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete && image.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((resolveImage, rejectImage) => {
          image.addEventListener('load', resolveImage, { once: true });
          image.addEventListener('error', () => rejectImage(new Error(`Image failed: ${image.src}`)), { once: true });
        })));
  });

  const audit = await page.locator('#c1-thumbnail').evaluate((artboard) => {
    const box = artboard.getBoundingClientRect();
    const overflow = [...artboard.querySelectorAll('[data-fit]')].filter((node) => {
      const rect = node.getBoundingClientRect();
      return node.scrollWidth > node.clientWidth + 2
        || rect.left < box.left - 2 || rect.top < box.top - 2
        || rect.right > box.right + 2 || rect.bottom > box.bottom + 2;
    }).map((node) => node.textContent.trim());
    // left copy must stay off the photo panel (x ≥ 889)
    const intoPhoto = [...artboard.querySelectorAll('.copy [data-fit], .topics [data-fit], .byline')]
      .filter((node) => node.getBoundingClientRect().right > 870).map((node) => node.textContent.trim());
    return { width: artboard.clientWidth, height: artboard.clientHeight, overflow, intoPhoto };
  });
  if (audit.width !== 1600 || audit.height !== 900) throw new Error(`Invalid artboard: ${audit.width}x${audit.height}`);
  if (audit.overflow.length) throw new Error(`Text overflow: ${audit.overflow.join(' | ')}`);
  if (audit.intoPhoto.length) throw new Error(`Copy runs into the photo: ${audit.intoPhoto.join(' | ')}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  await page.locator('#c1-thumbnail').screenshot({ path: pngPath, type: 'png', animations: 'disabled' });
  await sharp(pngPath).jpeg({ quality: 90, mozjpeg: true }).toFile(jpgPath);
  console.log(`HTML RENDER PASS: ${audit.width}x${audit.height}, no text overflow`);
  console.log(pngPath);
  console.log(jpgPath);
} finally {
  await browser.close();
}
