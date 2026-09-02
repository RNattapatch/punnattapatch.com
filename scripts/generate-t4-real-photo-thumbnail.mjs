import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const htmlPath = resolve(scriptDir, 't4-service-thumbnail.html');
const sourcePhoto = resolve(root, 'public/lp/inhouse/office-session.jpg');
const pngPath = resolve(root, 'src/assets/services/product-thumbnails/t4-ai-workflow-pilot.png');
const jpgPath = resolve(root, 'public/services/thumbs/t4-ai-workflow-pilot.jpg');

const html = await readFile(htmlPath, 'utf8');
if (!html.includes('../public/lp/inhouse/office-session.jpg')) throw new Error('T4 thumbnail must use the approved real workshop photograph');
await sharp(sourcePhoto).metadata();

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

  const audit = await page.locator('#t4-thumbnail').evaluate((artboard) => {
    const artboardRect = artboard.getBoundingClientRect();
    const overflow = [...artboard.querySelectorAll('[data-fit]')].filter((node) => {
      const rect = node.getBoundingClientRect();
      return node.scrollWidth > node.clientWidth + 2
        || rect.left < artboardRect.left - 2
        || rect.top < artboardRect.top - 2
        || rect.right > artboardRect.right + 2
        || rect.bottom > artboardRect.bottom + 2;
    }).map((node) => node.textContent.trim());
    return {
      width: artboard.clientWidth,
      height: artboard.clientHeight,
      sourceKind: artboard.dataset.sourceKind,
      overflow,
    };
  });
  if (audit.width !== 1600 || audit.height !== 900) throw new Error(`Invalid artboard: ${audit.width}x${audit.height}`);
  if (audit.sourceKind !== 'real-workshop-photo') throw new Error('Missing real-photo provenance marker');
  if (audit.overflow.length) throw new Error(`Text overflow: ${audit.overflow.join(' | ')}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);

  await page.locator('#t4-thumbnail').screenshot({ path: pngPath, type: 'png', animations: 'disabled' });
  await sharp(pngPath).jpeg({ quality: 90, mozjpeg: true }).toFile(jpgPath);
  console.log(`HTML RENDER PASS: ${audit.width}x${audit.height}, real workshop photo, no text overflow`);
  console.log(pngPath);
  console.log(jpgPath);
} finally {
  await browser.close();
}
