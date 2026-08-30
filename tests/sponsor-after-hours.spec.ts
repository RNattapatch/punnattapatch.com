import { expect, test, type Page } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

let server: Server | undefined;
let localBaseURL = '';

async function resolveDistFile(pathname: string) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = cleanPath === ''
    ? ['index.html']
    : [cleanPath, `${cleanPath}.html`, join(cleanPath, 'index.html')];

  for (const candidate of candidates) {
    const resolved = normalize(join(dist, candidate));
    if (!resolved.startsWith(`${dist}/`)) continue;
    try {
      if ((await stat(resolved)).isFile()) return resolved;
    } catch {}
  }
  return null;
}

function targetBaseURL() {
  return (process.env.BASE_URL ?? localBaseURL).replace(/\/$/, '');
}

test.beforeAll(async () => {
  if (process.env.BASE_URL) return;
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const file = await resolveDistFile(pathname);
    if (!file) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' });
    response.end(await readFile(file));
  });
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  localBaseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
});

async function assertReadable(page: Page, selector: string, minimum: number) {
  const samples = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas context unavailable');
    const rgba = (css: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = css;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    };
    const textStyle = getComputedStyle(element);
    const card = element.closest('.ah-option');
    if (!card) throw new Error('Missing .ah-option ancestor');
    const foreground = rgba(textStyle.color);
    foreground.a *= Number(textStyle.opacity || 1);
    const background = rgba(getComputedStyle(card).backgroundColor);
    const composite = {
      r: foreground.r * foreground.a + background.r * (1 - foreground.a),
      g: foreground.g * foreground.a + background.g * (1 - foreground.a),
      b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    };
    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const light = Math.max(luminance(composite), luminance(background));
    const dark = Math.min(luminance(composite), luminance(background));
    return { text: element.textContent?.trim(), ratio: (light + 0.05) / (dark + 0.05) };
  }));

  for (const sample of samples) {
    assert.ok(sample.ratio >= minimum, `${sample.text}: ${sample.ratio.toFixed(2)}:1`);
  }
}

test('Sponsor after-hours choices remain readable in every state', async ({ browser }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${targetBaseURL()}/sponsor`);

    await expect(page.locator('.ah-title')).toHaveCount(2);
    await expect(page.locator('.ah-title').nth(0)).toHaveText('สะดวกครับ');
    await expect(page.locator('.ah-title').nth(1)).toHaveText('ขอในเวลาทำการ');
    await assertReadable(page, '.ah-title', 4.5);
    await assertReadable(page, '.ah-sub', 4.5);

    await page.locator('.ah-option').nth(0).click();
    await expect(page.locator('.ah-radio').nth(0)).toBeChecked();
    await assertReadable(page, '.ah-title', 4.5);
    await assertReadable(page, '.ah-sub', 4.5);

    await page.locator('.ah-radio').nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ah-radio').nth(1)).toBeFocused();
    const focus = await page.locator('.ah-option').nth(1).evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    assert.notEqual(focus.outlineStyle, 'none');
    assert.ok(parseFloat(focus.outlineWidth) >= 2);

    await page.evaluate(() => { document.documentElement.dataset.theme = 'pundark'; });
    await page.waitForTimeout(200);
    await assertReadable(page, '.ah-title', 4.5);
    await assertReadable(page, '.ah-sub', 4.5);
    await page.close();
  }
});
