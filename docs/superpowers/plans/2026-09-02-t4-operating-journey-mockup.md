# T4 Operating Journey Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, reviewable HTML mockup of the T4 Operating Journey without changing the production T4 page or T1–T3.

**Architecture:** A single static HTML page under `public/previews/` uses Tailwind CDN, DaisyUI, the production brand palette, production T4 copy, and existing real workshop photographs. A focused Playwright test protects content order, real-photo provenance, Bonus count, responsive overflow, accessibility landmarks, and the absence of fake download/value/countdown claims.

**Tech Stack:** HTML, Tailwind CSS Play CDN, DaisyUI CDN, Playwright, Node.js, existing public JPEG assets.

**Spec:** `docs/superpowers/specs/2026-09-02-t4-operating-journey-design.md`

## Global Constraints

- This is a mockup only; do not modify production components, product data, or T1–T3.
- Use existing real workshop photographs only; no AI-generated people or stock-office imagery.
- Offer Stack is the first major section after Hero.
- Render exactly four Core artifacts and five T4 Bonus descriptions.
- Do not add Bonus download links, invented baht values, countdowns, lifetime access, fake scarcity, or guarantees.
- Journey order is exactly Pick → Map → Sandbox → Responsibility → Decide.
- Use Thai-capable Google Fonts; do not use system-font stacks.
- Responsive checks cover 1440, 768, 390, 320, and 844×390.

---

### Task 1: Mockup Contract Test

**Files:**
- Create: `tests/t4-operating-journey-mockup.spec.ts`
- Test: `tests/t4-operating-journey-mockup.spec.ts`

**Interfaces:**
- Consumes: preview server URL from `PLAYWRIGHT_BASE_URL` or `http://127.0.0.1:4328`.
- Produces: assertions for `[data-mockup="t4-operating-journey"]`, `[data-section]`, `[data-core-artifact]`, `[data-bonus-card]`, `[data-journey-stage]`, and real-photo `<img>` elements.

- [x] **Step 1: Write the failing structural test**

```ts
test('T4 mockup tells the operating journey in the approved order', async ({ page }) => {
  await page.goto(`${baseURL}/previews/t4-operating-journey-mockup.html`);
  assert.deepEqual(await page.locator('[data-section]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-section'))), [
    'hero', 'offer', 'journey-map', 'proof', 'diagnosis', 'curriculum', 'decision-pack', 'fit', 'investment', 'final-cta',
  ]);
  assert.equal(await page.locator('[data-core-artifact]').count(), 4);
  assert.equal(await page.locator('[data-bonus-card]').count(), 5);
  assert.deepEqual(await page.locator('[data-journey-stage]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-journey-stage'))), [
    'Pick', 'Map', 'Sandbox', 'Responsibility', 'Decide',
  ]);
});
```

- [x] **Step 2: Add safety and responsive assertions**

Assert that every content image resolves from `/lp/inhouse/`, declares width/height and has non-empty alt text; no anchors under Bonus; no `countdown`, `ตลอดชีพ`, `มูลค่า ฿`, or guarantee language; one H1; heading levels do not skip; and each required viewport has `scrollWidth <= clientWidth`.

- [x] **Step 3: Run the test and verify RED**

Run: `pnpm exec playwright test tests/t4-operating-journey-mockup.spec.ts --reporter=line`

Expected: FAIL because `/previews/t4-operating-journey-mockup.html` does not exist or the root marker cannot be found.

### Task 2: Standalone HTML Mockup

**Files:**
- Create: `public/previews/t4-operating-journey-mockup.html`
- Test: `tests/t4-operating-journey-mockup.spec.ts`

**Interfaces:**
- Consumes: `/lp/inhouse/office-session.jpg`, `/lp/inhouse/hands-on.jpg`, `/lp/inhouse/class-full.jpg`, `/lp/inhouse/hero-pointing.jpg`; production T4 copy and Bonus titles from `src/data/product-details/t4.ts`.
- Produces: a standalone review page at `/previews/t4-operating-journey-mockup.html`; its displayed price is fetched from `/catalog.json` using the existing T4 Catalog key.

- [x] **Step 1: Build the Hero and Offer Stack**

Create semantic `header`, `main`, `section`, and `article` markup. The Hero uses the real `office-session.jpg`, a three-step summary, and existing T4 CTA language. The immediately following Offer Stack fetches the current T4 price from `/catalog.json`, then presents four Core artifacts, five Bonus cards, and no Bonus links. If Catalog loading fails, show `สอบถามราคาตามขอบเขต` instead of a stale number.

- [x] **Step 2: Build Proof, Diagnosis, and Curriculum Journey**

Use real workshop photos for the Proof editorial spread. Use a navy/sand diagnosis band. Build the Curriculum as an ordered list with exact `data-journey-stage` values and separate `เข้าใจอะไร`, `ลงมือทำ`, and `ได้อะไรกลับไป` regions.

- [x] **Step 3: Build Decision closure**

Add the four-item Decision Pack, fit/not-fit split, investment/terms panel, and final Fit Gate CTA. Keep Core artifacts semantically distinct from Bonus descriptions.

- [x] **Step 4: Add responsive and accessible behavior**

Use a 4/8px spacing rhythm, minimum 44px controls, responsive grid collapse, visible focus rings, reserved image dimensions, `prefers-reduced-motion`, and no horizontal carousel or scroll-jacking.

- [x] **Step 5: Run the focused test and verify GREEN**

Run: `pnpm exec playwright test tests/t4-operating-journey-mockup.spec.ts --reporter=line`

Expected: all focused tests pass.

### Task 3: Visual QA and Handoff

**Files:**
- Create: `/Users/agentmacmini/Documents/claude-code-pun-nattapatch-mac-mini/output/images/qa/t4-operating-journey-mockup-1440.png`
- Create: `/Users/agentmacmini/Documents/claude-code-pun-nattapatch-mac-mini/output/images/qa/t4-operating-journey-mockup-390.png`
- Create: `/Users/agentmacmini/Documents/claude-code-pun-nattapatch-mac-mini/output/images/qa/t4-operating-journey-offer-1440.png`
- Modify: `docs/superpowers/plans/2026-09-02-t4-operating-journey-mockup.md`

**Interfaces:**
- Consumes: the built static mockup and focused Playwright contract.
- Produces: desktop/mobile evidence for Pun's approve-or-revise checkpoint.

- [x] **Step 1: Run repository build and gates**

Run:

```bash
pnpm build
node scripts/verify-product-details.mjs
node scripts/check-prices.mjs
git diff --check
```

Expected: exit 0 for every command.

- [x] **Step 2: Capture the review set**

Start `pnpm preview --host 127.0.0.1 --port 4328`. Use Playwright to capture full-page desktop 1440×1000, full-page mobile 390×844, and the desktop Offer Stack. Wait for fonts and every image before capture.

- [x] **Step 3: Inspect and refine**

Inspect all three images. Correct clipped text, weak section separation, hidden content, fixed CTA overlap, or unreadable mobile type. Re-run the focused test after every HTML correction.

- [x] **Step 4: Final verification**

Run the focused Playwright test, build, product/price contracts, and `git diff --check` fresh. Confirm T1–T3 production source files have no diff.

- [x] **Step 5: Commit the mockup checkpoint**

```bash
git add docs/superpowers/plans/2026-09-02-t4-operating-journey-mockup.md public/previews/t4-operating-journey-mockup.html tests/t4-operating-journey-mockup.spec.ts
git commit -m "feat: prototype T4 operating journey"
git push origin codex/t4-live
```

Stop after reporting the preview and screenshots. Do not apply the presentation to T1–T3 until Pun explicitly approves the T4 mockup.
