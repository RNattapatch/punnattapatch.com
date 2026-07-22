# Catalog v2 Web Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the approved In-house A/B, Flagship, and Trust Content sales ladder while keeping Public Course off-web and Daruma Score private.

**Architecture:** `pricing.mjs` owns public price values. Public entry pages consume those tokens and point visitors to `/booking`; legacy public SKU routes redirect to `/services` anchors rather than serving outdated offers. The existing noindex Daruma Score ads page and its price token remain untouched.

**Tech Stack:** Astro 6, Tailwind 4, JavaScript verification script, Cloudflare Pages via Wrangler.

## Global Constraints

- Public Course, Venue, seat price, and registration UI must not be created or rendered.
- In-house A is `฿34,900`; In-house B renders `฿69,900` crossed out and `฿59,900` as the sale price.
- Daruma Score remains available only on `/ads/daruma-score` and remains `noindex`.
- Use Thai owner-to-owner copy guided by `pun-voice-and-tone.md` and `pun-voice-signatures.md`.
- No hard-coded public price strings in Astro pages; use `fmtPrice()` from `src/data/pricing.mjs`.
- Preserve the existing booking webhook field names and analytics event.

---

### Task 1: Lock Catalog v2 prices and build a regression check

**Files:**
- Modify: `src/data/pricing.mjs`
- Create: `scripts/verify-catalog-v2.mjs`

**Interfaces:**
- Consumes: `PRICES` and `fmtPrice()` from `src/data/pricing.mjs`.
- Produces: token keys `inhouse-a`, `inhouse-b-list`, and `inhouse-b`; a zero-exit verification command.

- [ ] **Step 1: Write the failing price assertions**

```js
import { PRICES, fmtPrice } from '../src/data/pricing.mjs';

const expected = {
  'inhouse-a': 34900,
  'inhouse-b-list': 69900,
  'inhouse-b': 59900,
  'daruma-transformation': 198000,
  'tiktok-workshop': 49900,
};

for (const [key, amount] of Object.entries(expected)) {
  if (PRICES[key]?.amount !== amount) throw new Error(`${key} price mismatch`);
  if (fmtPrice(key) !== `฿${amount.toLocaleString('en-US')}`) throw new Error(`${key} format mismatch`);
}
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: failure because the three In-house keys do not yet exist.

- [ ] **Step 3: Add the three public SKU tokens**

```js
'inhouse-a': { amount: 34900, url: '/services#inhouse-a', note: 'Sales × AI Agent 1 วัน' },
'inhouse-b-list': { amount: 69900, url: '/services#inhouse-b', note: 'Daruma Sales Office Bootcamp list price' },
'inhouse-b': { amount: 59900, url: '/services#inhouse-b', note: 'Daruma Sales Office Bootcamp 2 วัน' },
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: `catalog v2 pricing checks passed`.

### Task 2: Replace the public services ladder and shared service metadata

**Files:**
- Modify: `src/pages/services.astro`
- Modify: `src/data/site.ts`
- Modify: `scripts/verify-catalog-v2.mjs`

**Interfaces:**
- Consumes: new price tokens from Task 1 and `/booking` as the shared CTA route.
- Produces: four public offers in order: In-house A, In-house B, Flagship, Trust Content.

- [ ] **Step 1: Extend the failing verifier with page requirements**

```js
const services = await readFile(new URL('../src/pages/services.astro', import.meta.url), 'utf8');
for (const token of ['inhouse-a', 'inhouse-b-list', 'inhouse-b', 'daruma-transformation', 'tiktok-workshop']) {
  if (!services.includes(`fmtPrice('${token}')`)) throw new Error(`missing ${token} token`);
}
if (services.includes('Public Course') || services.includes('Daruma Score &amp; Transformation Roadmap')) {
  throw new Error('retired public offer remains');
}
```

- [ ] **Step 2: Run the verifier to confirm the current page fails**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: failure for missing In-house tokens and retired Daruma Score public card.

- [ ] **Step 3: Rewrite the public cards in approved order**

Use `id="inhouse-a"` and `id="inhouse-b"`; render the B list token with `line-through`, render the sale token in coral, and make every card CTA `/booking`. Use concrete owner-facing copy: work on the company’s real sales case, a sales assistant each person can use, and a clear Monday-morning next step. Keep Flagship at 45 days and Trust Content at its current price.

- [ ] **Step 4: Align `SERVICES` metadata**

Replace legacy Basic/Advance/Package A presentation data with In-house A and In-house B values; retain non-public legacy records only when needed for old content routes and label them as legacy in comments.

- [ ] **Step 5: Run the verifier**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: `catalog v2 pricing checks passed`.

### Task 3: Align homepage, Daruma intro, and booking with the free-consultation funnel

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/daruma.astro`
- Modify: `src/pages/booking.astro`
- Modify: `scripts/verify-catalog-v2.mjs`

**Interfaces:**
- Consumes: `/services` anchors and `/booking` as public routes.
- Produces: no public Daruma Score purchase/recommendation language outside the noindex ads page.

- [ ] **Step 1: Add negative and route assertions**

```js
for (const file of ['src/pages/index.astro', 'src/pages/daruma.astro', 'src/pages/booking.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (source.includes('เช็ค Daruma Score') || source.includes('จองวันตรวจ')) {
    throw new Error(`retired public Score CTA in ${file}`);
  }
}
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: failure naming the remaining public Score CTA.

- [ ] **Step 3: Change copy and paths**

Replace Score-first language with a free conversation and the four-offer ladder. Change booking’s `recommended_path` to a neutral intake category and make success copy promise a relevant next step after the conversation, not a diagnostic sale. Keep the webhook keys, privacy consent, and Plausible event unchanged.

- [ ] **Step 4: Run the verifier**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: no public Score CTA findings.

### Task 4: Retire stale public routes without breaking inbound links

**Files:**
- Modify: `src/pages/advance-ai.astro`
- Modify: `src/pages/ai-workshop-advance.astro`
- Modify: `src/pages/services/[slug].astro`
- Modify: `scripts/verify-catalog-v2.mjs`

**Interfaces:**
- Consumes: `/services#inhouse-a` and `/services#inhouse-b` anchors from Task 2.
- Produces: 301 redirects for retired Advance and Package A URLs.

- [ ] **Step 1: Add redirect assertions**

```js
for (const file of ['src/pages/advance-ai.astro', 'src/pages/ai-workshop-advance.astro']) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  if (!source.includes("Astro.redirect('/services#inhouse-a', 301)")) throw new Error(`${file} redirect missing`);
}
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `node scripts/verify-catalog-v2.mjs`

Expected: failure because the retired pages still render old offers.

- [ ] **Step 3: Install explicit redirects**

Redirect `advance-ai` and `ai-workshop-advance` to `#inhouse-a`. Map `package-a` in the dynamic service route to `#inhouse-b`; redirect other retired public variants to `/services`.

- [ ] **Step 4: Run build and validate generated redirects**

Run: `pnpm build && node scripts/verify-catalog-v2.mjs`

Expected: successful Astro build and passing catalog verification.

### Task 5: Visual QA, commit, and Cloudflare Pages release

**Files:**
- Modify: `memory/SHARED.md` in the project workspace only after release evidence exists.
- Modify: `memory/HANDOFF.md` in the project workspace only after release evidence exists.

**Interfaces:**
- Consumes: built `dist/`, authenticated Wrangler account, and Cloudflare Pages project name.
- Produces: a production deployment URL and verified live routes.

- [ ] **Step 1: Capture responsive screenshots**

Run Playwright against `pnpm preview` at 1440px, 768px, and 390px for `/`, `/services`, and `/booking`. Assert no horizontal overflow and that the crossed-out and sale prices remain legible.

- [ ] **Step 2: Run final verification**

Run: `pnpm build && node scripts/verify-catalog-v2.mjs && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 3: Commit the implementation**

Run: `git add src/data/pricing.mjs src/data/site.ts src/pages/services.astro src/pages/index.astro src/pages/daruma.astro src/pages/booking.astro src/pages/advance-ai.astro src/pages/ai-workshop-advance.astro src/pages/services/[slug].astro scripts/verify-catalog-v2.mjs && git commit -m "feat: publish catalog v2 service ladder"`

- [ ] **Step 4: Deploy and verify**

After `wrangler whoami` identifies the account and `wrangler pages project list` returns the exact Pages project name, deploy `dist` to that returned project on the production branch. Then request `/`, `/services`, and `/booking` from the deployment URL and production domain, checking HTTP 200 and the In-house B price pair. Do not infer or invent a Pages project name.
