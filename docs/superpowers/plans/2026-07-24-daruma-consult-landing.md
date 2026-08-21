# Daruma Consult Ad Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a compliant Thai Facebook/Instagram ad landing page at `/ads/daruma-consult` that captures qualified bookings and measures the funnel with Meta Pixel.

**Architecture:** Add one Astro page that reuses `BaseLayout`, existing global styles, homepage client-logo assets, and the existing `/booking` fetch contract. Add the smallest layout prop needed to emit `noindex,follow`, and keep page-specific tracking, consent, UTM attribution, form state, and LINE fallback wiring in the page script.

**Tech Stack:** Astro 6, Tailwind v4 + DaisyUI, TypeScript-in-Astro inline scripts, Node built-in test runner, pnpm.

## Global Constraints

- Do not push to `main`.
- Use the existing Pun brand tokens and layout; do not create a new visual system.
- Mobile-first and fast; no hero image dependency.
- Use the webhook `https://rnat.app.n8n.cloud/webhook/intake-form-v2` with JSON, `Content-Type: application/json`, and `keepalive: true`.
- Pixel ID is public: `890649354099149`.
- Required events: `PageView`, one `ViewContent`, successful-submit `Lead`, LINE-click `Contact`.
- Required attribution fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- Banned route copy: `25,000`, `Daruma Score`, `ประหยัดเงินเดือน`, `แทนพนักงาน`, `การันตี`.
- Do not use Python, npm, system-font CSS, or new plain-CSS HTML architecture.

## File map

- Create: `src/pages/ads/daruma-consult.astro` — complete landing page, form markup, Meta Pixel, consent, UTM capture, submit flow, and LINE events.
- Modify: `src/layouts/BaseLayout.astro` — add an optional robots content prop while preserving current defaults.
- Create: `tests/ads/daruma-consult.test.mjs` — source-level contract tests for route copy, tracking events, payload fields, accessibility hooks, and banned-copy absence.
- Create: `docs/superpowers/specs/2026-07-24-daruma-consult-landing-design.md` — approved design record.
- Create: `docs/superpowers/plans/2026-07-24-daruma-consult-landing.md` — this implementation plan.

### Task 1: Establish a failing route contract test

**Files:**
- Create: `tests/ads/daruma-consult.test.mjs`

- [ ] **Step 1: Write the failing test**

Use Node's built-in `node:test` and `node:assert/strict`. Read the Astro source and assert the required route copy, form fields, Pixel events, webhook, UTM names, LINE URL, `noindex,follow`, and banned-copy absence. The first test run must fail because the page does not yet exist.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../../src/pages/ads/daruma-consult.astro', import.meta.url);

test('Daruma consult landing contract is present and compliant', async () => {
  const source = await readFile(pagePath, 'utf8');
  const required = [
    'ข้อมูลลูกค้าบริษัทคุณ อยู่กับบริษัท หรืออยู่กับเซลล์?',
    'จองคิวคุยฟรี 15–20 นาที',
    'daruma-consult-form',
    'name="utm_source"',
    'name="utm_medium"',
    'name="utm_campaign"',
    'name="utm_content"',
    'name="utm_term"',
    '890649354099149',
    "fbq('track', 'PageView')",
    "fbq('track', 'ViewContent'",
    "fbq('track', 'Lead'",
    "fbq('track', 'Contact'",
    'intake-form-v2',
    'source: \'ads-daruma-consult\'',
    'line.me/R/ti/p/@011xgvap',
    'noindex,follow',
  ];
  for (const value of required) assert.ok(source.includes(value), `missing ${value}`);

  for (const banned of ['25,000', 'Daruma Score', 'ประหยัดเงินเดือน', 'แทนพนักงาน', 'การันตี']) {
    assert.equal(source.includes(banned), false, `banned copy found: ${banned}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ads/daruma-consult.test.mjs`

Expected: FAIL with an `ENOENT` for the missing Astro page.

### Task 2: Add robots override support without changing existing pages

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add an optional `robots` prop**

Extend the layout props with `robots?: string`, destructure it without changing the existing default, and render `content={robots || 'noindex,nofollow'}` only when `noindex` is true. The new page will pass `noindex robots="noindex,follow"`; all existing pages keep their current behavior.

- [ ] **Step 2: Run the baseline build**

Run: `pnpm build`

Expected: exit 0 and the existing routes still build.

### Task 3: Build the compliant Astro page

**Files:**
- Create: `src/pages/ads/daruma-consult.astro`

- [ ] **Step 1: Add frontmatter and layout metadata**

Import `BaseLayout`, `DarumaMark`, and `SITE`. Define title/description and the exact homepage logo list used by `src/pages/index.astro`. Pass `noindex`, `robots="noindex,follow"`, canonical, OG image, and a WebPage schema.

- [ ] **Step 2: Add head Pixel and page structure**

Use the standard Pixel snippet in a head fragment with `PageView`, a noscript Pixel image, and the compact consent strip. Create the hero, self-check, call-value, proof, honest line, form, success state, and LINE fallback in the required order. Keep the hero CTA anchored to `#daruma-consult-form`.

- [ ] **Step 3: Add the form contract**

Add required labeled fields for `name`, `business`, and `contact`, optional `sales_issue`, required consent, honeypot, and five hidden UTM inputs. Use the existing `.field-label`/`.field` styling pattern and a real submit button.

- [ ] **Step 4: Add tracking and form behavior**

Read URL UTM values with `URLSearchParams`, use `window.pnAttribution` as a same-site fallback, populate hidden fields, and send `Object.fromEntries(new FormData(form).entries())` to the existing webhook. Assign `source: 'ads-daruma-consult'`, `source_page`, `booking_type`, `submitted_at`, `path`, and `recommended_path`. Fire `Lead` only after `response.ok`. Attach one `IntersectionObserver` to the form and two `Contact` listeners to LINE buttons.

- [ ] **Step 5: Add compliance and responsive CSS**

Use existing tokens and no gradients. Keep controls at least 44px, use `env(safe-area-inset-bottom)` for the consent strip where needed, set logo dimensions, include reduced-motion behavior, and suppress the global Nav CTA only when this page is present.

### Task 4: Run the contract test and build

**Files:**
- No new files.

- [ ] **Step 1: Run the contract test**

Run: `node --test tests/ads/daruma-consult.test.mjs`

Expected: PASS with 1 test and 0 failures.

- [ ] **Step 2: Build the site**

Run: `pnpm build`

Expected: exit 0 and the route list includes `/ads/daruma-consult.html`.

### Task 5: Verify the built route and handoff

**Files:**
- Modify: `memory/SHARED.md` in the project context repo.
- Modify: `memory/HANDOFF.md` in the project context repo.

- [ ] **Step 1: Verify Pixel and banned copy in the built route**

Run:

```bash
route='dist/ads/daruma-consult.html'
rg -o '890649354099149' "$route" | wc -l
for banned in '25,000' 'Daruma Score' 'ประหยัดเงินเดือน' 'แทนพนักงาน' 'การันตี'; do
  ! rg -n "$banned" "$route"
done
```

Expected: Pixel count is at least 1 and each banned-copy check exits 0 with no output.

- [ ] **Step 2: Check the route contract in generated HTML**

Run: `rg -n "noindex,follow|PageView|ViewContent|Lead|Contact|utm_source|intake-form-v2|line_add_daruma" dist/ads/daruma-consult.html`

Expected: all required markers are present; `Lead` appears only in the successful-submit branch and `Contact` is attached to LINE fallback listeners in source.

- [ ] **Step 3: Update shared handoff**

Add a concise dated entry to `memory/SHARED.md` and `memory/HANDOFF.md` describing the route, endpoint, Pixel event taxonomy, and that the page is built locally but not pushed.

- [ ] **Step 4: Prepare the English Claude Code update prompt**

Deliver a self-contained prompt that names the exact files, route, webhook, Pixel events, compliance checks, build command, and current assumption that `/booking` embeds the webhook rather than importing a shared handler. Tell Claude Code not to push `main`.
