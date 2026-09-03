// Phase 4 — mobile mockup shots for Pun's review (390×844, the way he actually looks at it).
// Usage: node tests/shots-p1.mjs <baseUrl> <outDir>
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const [baseUrl, outDir] = process.argv.slice(2);
const url = `${baseUrl}/services/ai-sales-agent-bootcamp`;

// One shot per decision point Pun needs to judge.
const SHOTS = [
  ['01-hero', 'hero'],
  ['02-offer', 'offer'],
  ['03-proof', 'proof'],
  ['04-spotlight', 'spotlight'],
  ['05-curriculum', 'curriculum'],
  ['06-bonus', 'bonus'],
  ['07-investment', 'investment'],
  ['08-final', 'final'],
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const response = await page.goto(url, { waitUntil: 'networkidle' });
if (response?.status() !== 200) throw new Error(`expected 200 from ${url}, got ${response?.status()}`);

// Let every lazy image settle before we photograph anything.
await page.evaluate(async () => {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  window.scrollTo(0, 0);
  await new Promise((resolve) => setTimeout(resolve, 500));
});

await page.screenshot({ path: `${outDir}/00-fullpage.png`, fullPage: true });

for (const [name, section] of SHOTS) {
  const target = page.locator(`[data-journey-section="${section}"]`).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  // Viewport-sized frame anchored at the section top — this is what Pun sees on his phone.
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log(`shot ${name} (${section})`);
}

// The public-cohort notice is the one thing T1–T4 do not have — capture it on its own too.
const notice = page.locator('[data-public-notice="offer"]').first();
await notice.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/09-public-notice.png` });
console.log('shot 09-public-notice');

await browser.close();
console.log('done');
