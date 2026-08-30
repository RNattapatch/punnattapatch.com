# Task 4 — C1 daily consulting detail page

## Outcome

Implemented the canonical C1 detail page at `/services/daily-consulting` from the shared typed detail-page shell. The page presents one daily consulting service with four selectable Primary Outcome tracks; it does not create four separately purchasable offers.

Implementation commits:

- Initial C1 implementation: `0deee8b feat(c1): add daily sales consulting detail page`
- Review remediation: `0cd9d84 fix(c1): harden service schema and proof acceptance`

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

### Review-remediation RED → GREEN

Added failing acceptance assertions for the distinct `Sales Consulting` schema subtype, the required system receipt, exact eight CTA journey, QR/image readiness, FAQ/Breadcrumb schema parity, no floating-CTA obstruction, and absence of authoring-guard prose. Before the fix, the focused test failed as expected because `c1-system-receipt` did not exist. After remediation, the expanded C1 test passed.

## Product-contract checks

- One Catalog-resolved H1, duration and price for `daily-sales-consulting`.
- Four stable Track IDs, four symptom chooser links, and no per-track price, checkout, or contact CTA.
- Choosing a symptom changes the URL hash, scrolls the selected track into view, and gives it keyboard focus with a visible focus treatment.
- Copy explicitly states `1 วัน · 1 Primary Outcome`, connected problems become `Proposal เดียว`, and a prospect can ask for track help without a paid Audit.
- Track D ends at prototype, test case and Human review rules; `/services/dashboard-build` is the single planned I1 build link.
- C1 emits `Service` with exact subtype `Sales Consulting`, plus FAQPage and BreadcrumbList schema on the canonical URL; the schema FAQ and breadcrumb items are deep-compared with visible output.
- Exactly eight C1 contact CTAs use `SITE.social.line`, keyword `CONSULT`, and LINE green. Desktop QR is loaded and visible; mobile hides it and shows a tap instruction.
- Exactly one global Floating LINE CTA remains; no form or second sticky CTA was added. Each C1 CTA is checked against the floating control at 1440, 768, and 390 widths.

## Proof / claim mapping

| Proof ID | Asset | Bounded claim |
| --- | --- | --- |
| `c1-scenery-room` | `public/testimonial/2026-07/scenery/scenery-room.jpg` | The Scenery team used a shared system view before moving to a prompt pack and prototype. |
| `c1-scenery-screen` | `public/testimonial/2026-07/scenery/scenery-screen.jpg` | A Consult output helps the owner decide what comes first, who owns it, and what must become Build work. |
| `c1-hfc-journey` | `src/assets/services/proof/t1-hfc-training.jpg` | Training can continue into Consulting for Company Knowledge, Dashboard and Roadmap work. |
| `c1-consult-feedback` | `public/testimonial/web/pun-consulting.jpg` | Exact approved feedback: `ปันคุยง่าย เข้าใจสิ่งที่ CEO ต้องการ และหาทางออกให้ได้`; no financial or outcome claim. |
| `c1-system-receipt` | `public/proof/01-command-center.jpg` | A redacted Personal Business Command Center shows that Consult scope and production Build scope are different kinds of work. |

The unsupported `ยอดขายร้อยล้าน` credential, internal `Catalog` duration placeholder, and authoring guards such as `ไม่เติมตัวเลขผลลัพธ์` and `ไม่อ้างผลลัพธ์ทางการเงิน` are not rendered.

## Changed files

- `src/data/product-details/c1.ts`
- `src/pages/services/daily-consulting.astro`
- `src/data/product-details/types.ts`
- `src/components/services/detail/ScopeTimeline.astro`
- `src/components/services/detail/ProofWall.astro`
- `src/components/services/detail/InstructorBio.astro`
- `src/components/services/detail/ProductDetailLayout.astro`
- `src/components/Schema.astro`
- `tests/product-details.spec.ts`

## Verification

All commands passed after review remediation:

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

- `screenshots/c1-daily-consulting-desktop-full.png` — 1440×10130
- `screenshots/c1-daily-consulting-tablet-full.png` — 768×11686
- `screenshots/c1-daily-consulting-mobile-full.png` — 390×14839

Viewport captures for the responsive hero:

- `screenshots/c1-daily-consulting-tablet-viewport.png` — 768×1024
- `screenshots/c1-daily-consulting-mobile-viewport.png` — 390×844

All three full-page captures were recaptured after `document.fonts.ready`, a page-wide lazy-image trigger pass, and image decode time. The HFC proof is visible in the refreshed tablet capture.

Screenshots are stored beside this report under `.superpowers/sdd/2026-08-30-product-detail-pages-implementation/`.

## Scope preserved

- Did not change `service-offers.ts` or wire C1 catalog-card `detailHref`; that belongs to Phase 7.
- Did not implement I1, push, or deploy.
- Preserved unrelated untracked `output/`.
