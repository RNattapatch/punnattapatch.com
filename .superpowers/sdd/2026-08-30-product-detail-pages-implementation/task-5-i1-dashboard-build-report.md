# Task 5 — I1 sales dashboard build detail page

## Outcome

Implemented the canonical I1 service detail page at `/services/dashboard-build` for Catalog key `daruma-starter`. The page sells a bounded production implementation: Pun’s team Maps/Designs, Builds/Tests, runs UAT, and trains the customer team to take over.

Implementation commit: `7e4daeb feat(i1): add sales dashboard build detail page`

## TDD evidence

### RED

Added the browser contract `I1 dashboard build presents bounded implementation evidence, handover, and LINE conversion` to `tests/product-details.spec.ts` before adding I1 data or its route.

```sh
pnpm build && pnpm exec playwright test tests/product-details.spec.ts --grep 'I1 dashboard build'
```

Observed the expected missing-route failure:

```text
AssertionError: I1 route must render
404 !== 200
```

### GREEN

Implemented the I1 data and route, then added the small shared-shell extensions required to use an approved public system receipt in the Hero and render the Catalog-derived support duration in I1 scope. The focused browser test passed with the exact route, Catalog, proof, scope, acceptance, CTA, schema, QR, and responsive contracts.

```text
1 passed
```

## Product contract

- H1, duration, and price resolve only through `daruma-starter` and the existing Catalog helper.
- Service schema type is exactly `Sales System Implementation`; canonical Service, FAQPage, and BreadcrumbList schema match visible content.
- The three scope stages are exactly `Map/Design`, `Build/Test`, and `UAT/Train`; the current Catalog duration is visible in scope.
- The take-home section places the Acceptance statement next to the deliverables: Owner, Stage, Next action, missing-data separation, usable Export, and source traceability within agreed scope.
- Custom integration, Custom AI Agent, complex approval, and large migration are Proposal/Expansion scope before the post-scope CTA.
- I1 explicitly distinguishes T3 (team learns to design/build a prototype) from I1 (Pun’s team Builds, runs UAT, and trains), and links once to `/services/t3-sales-back-office`.
- Eight LINE actions use `SITE.social.line` and `DASHBOARD`, across Hero, after Scope, after Investment, and Final CTA. The global Floating LINE CTA remains exactly one; there is no form or second sticky control.

## Proof and redaction inspection

| Proof ID | Approved asset | Bounded visible claim |
| --- | --- | --- |
| `i1-command-center` | `public/proof/01-command-center.jpg` | One view identifies follow-up work and manager intervention. |
| `i1-command-charts` | `public/proof/02-command-charts.jpg` | Aggregate Pipeline and Source views support the manager conversation. |
| `i1-pipeline` | `public/proof/03-pipeline.jpg` | Lead Owner, Stage, Last touch, and Next action are traceable. |
| `i1-docbot-chat` | `public/proof/06-docbot-chat.jpg` | A document flow keeps Human review in a consequential step. |
| `i1-scenery-uat` | `public/testimonial/2026-07/scenery/scenery-screen.jpg` | Users working through a real system/UAT screen are the delivery standard. |

The five assets were visually inspected in the contact sheet. Names, values, and contact fields are visibly blurred; captions and alt text avoid customer names, phone numbers, emails, deal values, secrets, revenue claims, and automation-outcome claims. `/proof/07-docbot-pdf.jpg` is excluded everywhere because redaction review found a legible personal name and quotation number. No raw `input-to-agent` source is referenced.

## Changed files

- `src/data/product-details/i1.ts`
- `src/pages/services/dashboard-build.astro`
- `src/data/product-details/types.ts`
- `src/components/services/detail/ProductHero.astro`
- `src/components/services/detail/ProductDetailLayout.astro`
- `src/components/services/detail/ScopeTimeline.astro`
- `tests/product-details.spec.ts`

## Verification

All checks passed after implementation:

```sh
pnpm build
pnpm verify:product-details
node scripts/verify-services-vnext.mjs --data-only
node scripts/verify-services-vnext.mjs --build-output
node scripts/check-prices.mjs
pnpm exec playwright test tests/product-details.spec.ts tests/services-vnext.spec.ts
rg -n '฿[0-9]' src/data/product-details src/components/services/detail src/pages/services
git diff --check
```

- Combined Product Detail + Services Playwright: 12 passed.
- Product-detail verifier and both Services-vNext verifier modes: passed.
- Price scan: no hardcoded package price.
- `git diff --check`: clean.

## Copy QC

Ran the AI-language structure measure on `src/data/product-details/i1.ts` after the final copy:

- Concrete-detail density: `6.85` per 1,000 Thai characters (threshold `≥2.0`).
- Empty 1,000-character window: `0` (the S3c warning does not apply).
- Theme-closer (S1): `0`; embodied-emotion (S2): `0`.
- Manual RED-family review found no repeated negative parallelism inside a unit, significance inflation, banned AI-language clusters, false urgency, generic transformation positioning, authoring placeholders, or unsupported commercial outcomes.
- Manual structural review: S3a/S3b pass; S1, S4, S5, and S6 do not produce a structural RED for this declared 13-block service page. No YELLOW finding needs a copy change.

## Visual QA artifacts

- `screenshots/i1-dashboard-build-desktop-full.png` — 1440×9931
- `screenshots/i1-dashboard-build-tablet-full.png` — 768×11698
- `screenshots/i1-dashboard-build-mobile-full.png` — 390×14806
- `screenshots/i1-proof-redaction-contact-sheet.png` — 1400×1320, the exact approved five assets

Each page capture was made after fonts were ready and the proof section was walked to trigger lazy images. Visual inspection found no horizontal overflow or floating-CTA obstruction at 1440, 768, or 390 pixels; the browser contract separately checks these conditions for every in-flow I1 CTA.

## Scope preserved

- Did not implement T3 or wire the consolidated services catalog; both belong to later phases.
- Did not push or deploy.
- Preserved unrelated untracked `output/`.
