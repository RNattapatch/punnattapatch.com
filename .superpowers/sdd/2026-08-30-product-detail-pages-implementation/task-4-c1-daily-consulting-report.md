# Task 4 — C1 daily consulting detail page

## Outcome

Implemented the canonical C1 detail page at `/services/daily-consulting` from the shared typed detail-page shell. The page presents one daily consulting service with four selectable Primary Outcome tracks; it does not create four separately purchasable offers.

## TDD evidence

### RED

Added `C1 daily consulting is one service with four selectable primary-outcome tracks` to `tests/product-details.spec.ts` before creating the route or C1 data.

Command:

```sh
pnpm build && pnpm exec playwright test tests/product-details.spec.ts --grep 'C1 daily consulting'
```

Observed expected failure:

```text
AssertionError: C1 canonical route must render
404 !== 200
```

### GREEN

Implemented the C1 data, page route, typed public-proof image support, service-specific track labels, the symptom chooser, and its native hash/focus interaction. The focused test passed:

```text
1 passed
```

## Product-contract checks

- One Catalog-resolved H1, duration and price for `daily-sales-consulting`.
- Four stable Track IDs, four symptom chooser links, and no per-track price, checkout, or contact CTA.
- Choosing a symptom changes the URL hash, scrolls the selected track into view, and gives it keyboard focus with a visible focus treatment.
- Copy explicitly states `1 วัน · 1 Primary Outcome`, connected problems become `Proposal เดียว`, and a prospect can ask for track help without a paid Audit.
- Track D ends at prototype, test case and Human review rules; `/services/dashboard-build` is the single planned I1 build link.
- C1 emits Service, FAQPage and BreadcrumbList schema on the canonical URL.
- Every C1 contact CTA uses `SITE.social.line`, keyword `CONSULT`, and LINE green. Desktop keeps the real QR; mobile uses a tap instruction.
- Exactly one global Floating LINE CTA remains; no form or second sticky CTA was added.

## Proof / claim mapping

| Proof ID | Asset | Bounded claim |
| --- | --- | --- |
| `c1-scenery-room` | `public/testimonial/2026-07/scenery/scenery-room.jpg` | The Scenery team used a shared system view before moving to a prompt pack and prototype. |
| `c1-scenery-screen` | `public/testimonial/2026-07/scenery/scenery-screen.jpg` | A Consult output helps the owner decide what comes first, who owns it, and what must become Build work. |
| `c1-hfc-journey` | `src/assets/services/proof/t1-hfc-training.jpg` | Training can continue into Consulting for Company Knowledge, Dashboard and Roadmap work. |
| `c1-consult-feedback` | `public/testimonial/web/pun-consulting.jpg` | Exact approved feedback: `ปันคุยง่าย เข้าใจสิ่งที่ CEO ต้องการ และหาทางออกให้ได้`; no financial or outcome claim. |

The unsupported `ยอดขายร้อยล้าน` credential and the internal phrase `ตามระยะเวลาจาก Catalog` are not rendered.

## Changed files

- `src/data/product-details/c1.ts`
- `src/pages/services/daily-consulting.astro`
- `src/data/product-details/types.ts`
- `src/components/services/detail/ScopeTimeline.astro`
- `src/components/services/detail/ProofWall.astro`
- `src/components/services/detail/InstructorBio.astro`
- `src/components/services/detail/ProductDetailLayout.astro`
- `tests/product-details.spec.ts`

## Verification

All commands passed after the implementation:

```sh
pnpm build
node scripts/verify-services-vnext.mjs --build-output
pnpm verify:product-details
pnpm exec playwright test tests/product-details.spec.ts
node scripts/check-prices.mjs
git diff --check
```

- Product detail Playwright: 5 passed.
- `verify-services-vnext --build-output`: passed, including public-build positioning/price checks.
- `check-prices`: no hardcoded package price in articles or public assets.

## Copy QC

Ran the AI language structure measure on `src/data/product-details/c1.ts`: concrete-detail density was `5.44` per 1,000 Thai characters (threshold `≥2.0`), with no empty 1,000-character window, no theme-closing phrase, and no embodied-emotion pattern. Manual scan found no repeated negative parallelism, significance inflation, generic AI Transformation positioning, unsupported hundred-million claim, or Catalog placeholder in customer-facing copy.

## Visual QA

Full-page captures:

- `screenshots/c1-daily-consulting-desktop-full.png` — 1440×10186
- `screenshots/c1-daily-consulting-tablet-full.png` — 768×11726
- `screenshots/c1-daily-consulting-mobile-full.png` — 390×14597

Viewport captures for the responsive hero:

- `screenshots/c1-daily-consulting-tablet-viewport.png` — 768×1024
- `screenshots/c1-daily-consulting-mobile-viewport.png` — 390×844

Screenshots are stored beside this report under `.superpowers/sdd/2026-08-30-product-detail-pages-implementation/`.

## Scope preserved

- Did not change `service-offers.ts` or wire C1 catalog-card `detailHref`; that belongs to Phase 7.
- Did not implement I1, push, or deploy.
- Preserved unrelated untracked `output/`.
