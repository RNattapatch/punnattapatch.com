# Phase 5 evidence — global floating LINE decision CTA

## TDD evidence

The build-output and Playwright contracts were added before the production component/layout changes. The first targeted run failed for the intended missing behavior:

```text
$ node --test tests/services-strategy.test.mjs tests/services-vnext.spec.ts
✖ global floating LINE contact follows the public and transaction visibility contract
✖ visibility matrix renders one global control only on public marketing pages
```

The old component exposed `data-line-placement="floating"`; the new tests required the canonical `[data-floating-line]` control, public/transaction visibility matrix, exact contact metadata, safe-area positioning, keyboard/QR behavior, delegated provider calls, failure isolation, and preserved navigation.

The first GREEN build exposed Astro's static `format: file` path as `/booking.html`. `BaseLayout` now normalizes `.html` before applying the `/booking`, `/thank-you`, and `/intake-form` automatic exclusions. The regression is covered by both built-output and browser assertions.

## Delivered contract

- The legacy `FloatingLineCta.astro` implementation was case-renamed and replaced by the single canonical `FloatingLineCTA.astro` implementation.
- `BaseLayout` adds `hideFloatingLine?: boolean` with default `false`; the prior `showFloatingLine?: boolean` interface remains compatible.
- The canonical control uses `SITE.social.line`, the exact label `ทัก LINE · ให้ผมช่วยเลือก`, `target="_blank"`, `rel="noopener"`, and the required contact metadata.
- Mobile renders the LINE icon with a meaningful accessible name and a minimum 48 × 48 target. Desktop renders the exact decision-assist label.
- Positioning is 16px plus safe-area on mobile and 24px plus safe-area on desktop.
- The desktop QR is the existing local Astro asset. CSS-only hover and `:focus-within` reveal the popover; the existing verifier decodes the source QR and confirms it resolves to the same canonical destination as `SITE.social.line`.
- `ContactTracking.astro` installs one delegated listener for all `[data-contact-cta]` anchors. Plausible, Meta, and TikTok calls are isolated in separate `try/catch` blocks.
- The previous home mobile sticky booking bar and its page-wide bottom padding were removed, so Home has one bottom control and no global blank strip.
- All three Ads LPs retain their existing mobile sticky CTA and explicitly hide the global floating control. Transaction/interactive funnels that were excluded by the legacy component now opt out explicitly.

## Visibility matrix

| Page type | Route/evidence | Floating LINE |
| --- | --- | --- |
| Home | `/` browser + built HTML | Show — exactly 1 |
| Services | `/services` browser + built HTML | Show — exactly 1 |
| Training detail | `src/pages/training/[slug].astro` inherits `BaseLayout`; `/training` browser/build proxy because every detail entry is currently draft | Show when published |
| Case Study | `/case-studies/forklift-distributor-5-person-team` | Show — exactly 1 |
| Insight | `/insights/ai-transformation-sales` | Show — exactly 1 |
| FAQ | `/faq` | Show — exactly 1 |
| Ads LP | `/ads/dealer-online-sales` plus all three Ads page props | Hide global; retain exactly 1 existing sticky CTA |
| Booking | `/booking` | Hide |
| Intake form | `/intake-form` | Hide |
| Thank-you | `/thank-you` | Hide |
| Quiz / lead magnet / private playbook | `/bosi-dna-quiz`, `/ebook-sales-interview`, `/playbook/line-ai-sales-agent` | Hide by explicit opt-out |
| Dashboard/Admin | `/app/dashboard` uses `DashboardLayout`, not `BaseLayout` | Hide |

The Playwright matrix also proves the Ads sticky bar becomes visible on a mobile viewport after the hero, while the global selector remains absent.

## Interaction and analytics evidence

The browser suite verifies:

- focused control is the active element and exposes a non-none outline;
- desktop hover and focus each reveal the QR popover;
- desktop and mobile targets remain at least 48 × 48;
- computed right/bottom values are 24px desktop and 16px mobile (the `env(safe-area-inset-bottom)` term computes to zero in headless Chromium);
- the mobile label is visually hidden while `aria-label` remains the complete decision-assist label;
- a footer privacy link remains clickable at mobile width;
- one click produces exactly one call per provider with:
  - `cta_location: floating_line`
  - `page_path: /services`
  - `product_code: none`
  - `cta_label: ทัก LINE · ให้ผมช่วยเลือก`
- Plausible and Meta throwing still allows TikTok to fire once and the `_blank` anchor to navigate;
- the floating control contains no `ตอบใน 5 นาที` response-time claim.

## Visual evidence

Visual inspection confirmed the QR popover and fixed control do not introduce horizontal overflow, and the Ads LP retains only its own full-width sticky bar.

- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-5-floating-desktop-qr.png`
- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-5-floating-mobile.png`
- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-5-ads-sticky-mobile.png`

## Fresh verification

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ node --test tests/services-strategy.test.mjs
tests 4 · pass 4 · fail 0

$ node --test tests/services-vnext.spec.ts
tests 3 · pass 3 · fail 0

$ git diff --check
(no output)
```

The build retains the repository's pre-existing warnings about deprecated Astro markdown plugin configuration, the empty `src/content/framework` glob, and unresolved `%23n`; Phase 5 adds no new build warning.
