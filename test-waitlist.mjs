import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join('/home/user/punnattapatch.com', 'screenshots');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    failures.push(message);
  }
}

async function setupContext(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.route('**/webhook/p1-waitlist-v1', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Workflow got started.' }),
    });
  });
  return context;
}

async function runDesktopTest(browser) {
  console.log('\n── Desktop test (1280×800) ──');
  const context = await setupContext(browser, { width: 1280, height: 800 });
  const page = await context.newPage();

  await page.goto('http://localhost:4321/waitlist', { waitUntil: 'networkidle' });

  // Assert 5 section headers
  for (let i = 1; i <= 5; i++) {
    const count = await page.locator(`text=ส่วนที่ ${i}`).count();
    assert(count > 0, `Section header "ส่วนที่ ${i}" exists`);
  }

  // Click อื่นๆ on business_type → conditional wrap reveals
  await page.locator('input[name="business_type"][value="อื่นๆ"]').click();
  const hasHidden = await page.locator('#wl-business-type-other-wrap').evaluate(el => el.classList.contains('hidden'));
  assert(!hasHidden, '#wl-business-type-other-wrap loses class "hidden" after selecting อื่นๆ');

  // Fill required fields
  await page.fill('#wl-name', 'Test Owner SME');
  await page.fill('#wl-email', 'testowner@example.com');
  await page.fill('#wl-contact', '081-234-5678');
  await page.fill('#wl-company', 'Test B2B Co., Ltd.');

  // Role: first option (เจ้าของ / CEO)
  await page.locator('input[name="role"]').first().click();

  // Team size: 3rd option (5-10 คน)
  await page.locator('input[name="team_size"]').nth(2).click();

  // business_type already set to อื่นๆ; fill the conditional textarea
  await page.fill('#wl-business_type_other', 'ธุรกิจครอบครัว B2B');

  // Pick 2 pain points
  const painCheckboxes = page.locator('input[name="pain_points"]');
  await painCheckboxes.nth(0).click();
  await painCheckboxes.nth(1).click();

  // 3 required textareas (≥10 chars each)
  await page.fill('#wl-why_join', 'อยากเรียนรู้เพื่อพัฒนาทีมขายให้มีระบบ');
  await page.fill('#wl-what_to_learn', 'วิธีสร้าง AI Agent สำหรับทีมขาย B2B');
  await page.fill('#wl-after_course_apply', 'ระบบ follow-up ลูกค้าอัตโนมัติ ลด manual work');

  // Future class notify → สนใจ
  await page.locator('input[name="future_class_notify"][value="yes"]').click();

  // Screenshot before submit
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'waitlist-desktop.png'), fullPage: false });
  console.log('  📸 Desktop screenshot saved (pre-submit)');

  // Submit
  await page.locator('#wl-submit-btn').click();

  // Wait for success card
  try {
    await page.waitForSelector('#wl-success-card:not(.hidden)', { timeout: 7000 });
    assert(true, '#wl-success-card becomes visible after submit');

    const refText = await page.locator('#wl-success-ref').textContent();
    assert(refText.startsWith('PN-WL-'), `Reference token starts with PN-WL- (got: ${refText})`);
  } catch (e) {
    assert(false, `#wl-success-card became visible (error: ${e.message})`);
  }

  await context.close();
}

async function runMobileScreenshot(browser) {
  console.log('\n── Mobile screenshot (390×844) ──');
  const context = await setupContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/waitlist', { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'waitlist-mobile.png'), fullPage: false });
  console.log('  📸 Mobile screenshot saved');
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await runDesktopTest(browser);
    await runMobileScreenshot(browser);
  } finally {
    await browser.close();
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.error('Failed assertions:');
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('✅ All Playwright assertions passed!');
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
