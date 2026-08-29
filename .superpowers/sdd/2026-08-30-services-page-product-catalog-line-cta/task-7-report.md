# Phase 7 report — Full Build, Visual QA & Regression Gate

Date: 2026-08-30
Worktree: `/Users/r_nat/Documents/punnattapatch.com/.worktrees/services-page-vnext`
Branch: `codex/services-page-vnext`

## Outcome

Phase 7 passes. The temporary component preview route and its preview-only verifier hooks were removed. Production verification now consumes the supplied `--dist` directory, catalog verification follows the canonical `service-offers.ts` price mapping, all current public LINE destinations resolve through `SITE.social.line`, and the full release gate is green.

## Root-cause repairs made during the gate

1. `verify-catalog-v2.mjs` still asserted the retired pre-Phase-4 implementation: inline `fmtPrice('key')` calls, the old eight-image proof gallery, and a Package A redirect to `/services`. It now verifies public pricing keys in `service-offers.ts`, dynamic SSOT resolution in `/services`, legacy keys as compatibility-only, and the canonical C1 redirect.
2. `verify-services-vnext.mjs` ignored `--dist`, so even a nonexistent directory passed data-only checks. It now resolves and verifies the requested output directory; `--dist does-not-exist` fails and `--dist dist` runs the complete built-output contract.
3. `tests/ads/daruma-consult.test.mjs` targeted a page intentionally deleted by commit `8ec3276`; the live contract is a permanent redirect to `/ads/sales-ai-team`. The test now verifies that redirect and the replacement page.
4. The three public Ads pages and the homepage intake fallback duplicated a legacy LINE URL. They now use `SITE.social.line`; the only remaining `line.me` construction is customer-specific dashboard behavior.
5. Featured T2 and the A1 strip cropped approved 16:9 thumbnail copy at desktop widths. T2 now remains a full-width featured card with 16:9 media, while A1 uses `object-contain`. Six per-card captures confirm all thumbnail text remains visible.
6. The browser spec originally used `node:test`, so the required native Playwright CLI could not discover its tests. The spec now uses `@playwright/test` lifecycle and browser fixtures while retaining the built-`dist` HTTP server and all six behavioral checks. `@playwright/test` and `playwright` are aligned at 1.62.1.

## Gate evidence

| Gate | Result | Evidence |
|---|---|---|
| Build | Pass — 83 pages, exit 0 | `evidence/task-7/build.log` |
| Catalog | Pass — catalog v2 pricing checks | `evidence/task-7/catalog.log` |
| Pricing | Pass — no hardcoded package prices | `evidence/task-7/pricing.log` |
| Product contract | Pass — supplied `dist` verified | `evidence/task-7/services-contract.log` |
| Existing repository suites | Pass — 34/34 | `evidence/task-7/node-test-suite.log` |
| Native Playwright CLI | Pass — exact command, 6/6 | `evidence/task-7/playwright-runner.log` |
| Web Dev QA capture | Pass — exact 1440×900, 768×1024 and 390×844 viewports | `evidence/task-7/web-dev-qa.log` |
| Desktop QA | Pass — 1440×900 viewport, full page | `evidence/task-7/services-1440x900.png` |
| Tablet QA | Pass — 768×1024 viewport, full page | `evidence/task-7/services-768x1024.png` |
| Mobile QA | Pass — 390×844 viewport, full page | `evidence/task-7/services-390x844.png` |
| Accessibility | Pass — Nav → Hero → Cards → Chooser → FAQ → Final CTA → Floating LINE; reduced motion has no perpetual animation | `evidence/task-7/playwright-runner.log` |
| LINE/QR | Pass — `https://lin.ee/ioSnSUG`; decoded QR resolves to the same canonical LINE profile | `evidence/task-7/services-contract.log` |
| Analytics | Pass — one event/provider with complete props; thrown Plausible/Meta errors do not block TikTok or navigation | `evidence/task-7/playwright-runner.log` |
| Legacy anchors | Pass — `#sales-team-structure`, `#ai-agent-ceo`, `#offer-c1`, and all six chooser targets resolve uniquely | `evidence/task-7/playwright-runner.log` |

## Web Dev QA

| Check | Desktop | Tablet | Mobile |
|---|---|---|---|
| Approved typography readable | Pass | Pass | Pass |
| Navy / Coral / Cream hierarchy | Pass | Pass | Pass |
| Layout and responsive collapse | Pass | Pass | Pass |
| Buttons, cards, focus affordances | Pass | Pass | Pass |
| No placeholder/lorem content | Pass | Pass | Pass |
| Thai text and images render | Pass | Pass | Pass |

The website intentionally retains Sarabun/Trirong as its global font pair. Sukhumvit Set is rendered inside the six approved thumbnail assets, as required by the plan.

## Card-size image evidence

- `evidence/task-7/card-t1-390.png`
- `evidence/task-7/card-t2-390.png`
- `evidence/task-7/card-t3-390.png`
- `evidence/task-7/card-c1-390.png`
- `evidence/task-7/card-i1-390.png`
- `evidence/task-7/card-a1-390.png`

All six sources report 1600×900 natural dimensions, complete successfully after their real lazy-load path, and show the entire approved composition without text crop.

## Cleanup and integrity audit

- `src/pages/services-components-preview.astro`: removed.
- Preview-only verifier references and built route: removed.
- No `services-components-preview` or `Temporary Phase 3 preview` reference remains in `src`, `scripts`, `tests`, or `package.json`.
- No unused service image exists: six thumbnails and the QR are all referenced.
- No direct public-site LINE URL remains outside `src/data/site.ts`; `dashboard/QuickActions.astro` is intentionally customer-specific.
- Native Playwright's generated `test-results/` is ignored as disposable runner output; no generated result directory is present in the committed tree.
- No temporary source route, scratch source, unfinished marker, failed image request, Services console error, or horizontal overflow at 320/390/768/1440px remains.

## Exact final commands

```text
pnpm build
node scripts/verify-catalog-v2.mjs
node scripts/check-prices.mjs
pnpm verify:services -- --dist dist
node --test $(git ls-files 'tests/*.test.mjs' 'tests/**/*.test.mjs')
pnpm exec playwright test tests/services-vnext.spec.ts
```

Non-blocking pre-existing build warnings remain for Astro markdown plugin deprecations, an empty `src/content/framework` glob, and `%23n` runtime CSS resolution. None produces a build, browser, image, contract, or console failure in this phase.
