# Phase 3 evidence — reusable services components

## TDD evidence

The build-output contract was added to `scripts/verify-services-vnext.mjs` before the components and temporary preview route existed.

```text
$ pnpm verify:services -- --build-output
AssertionError [ERR_ASSERTION]: component preview build output does not exist; run pnpm build after adding the services component preview
```

The failure was for the missing rendered artifact, not a verifier runtime error. The contract now checks six unique `offer-*` anchors, each offer code/kind data attribute, the T1 contact metadata, and the final CTA metadata from Astro's built HTML.

## Delivered component contract

- `OfferCard.astro` accepts `offer`, Astro `image`, `featured`, caller-resolved `priceLabel`, and `eagerImage`. It supplies a 1600 × 900 image, customer job, exactly three data-driven bullets, and at most one primary action plus one text LINE action. Only T2 receives featured layout treatment.
- `OfferChooser.astro` has the six approved symptom strings and routes them to `#offer-t1`, `#offer-t2`, `#offer-t3`, `#offer-c1`, `#offer-i1`, and `#offer-a1`.
- `AdvanceProgramStrip.astro` renders A1 without a price node and uses the required copy: `เรียนแล้วมีคนพาทำ จนใช้จริง`.
- `LineDecisionCTA.astro` owns final LINE CTA metadata and uses `SITE.social.line`; an optional Astro image enables the desktop QR.
- `src/pages/services-components-preview.astro` is a temporary, noindex preview route for component evidence. It must be removed before Phase 7 as the plan requires.

All new LINE actions include `data-contact-cta`, `data-cta-location`, `data-product-code`, and `data-cta-label`. They use LINE green; internal detail actions are Navy. Buttons/links use a 48px minimum target and visible `focus-visible` outlines. No motion utility or gradient was introduced.

## Visual and responsive evidence

Playwright rendered the temporary route at `http://127.0.0.1:4321/services-components-preview` after the implementation. Evidence is retained locally at `/tmp/services-phase3.egI6eQ/`:

| Required evidence | Files |
| --- | --- |
| T2 featured card | `t2-desktop.png`, `t2-mobile.png` |
| C1 consulting card | `c1-desktop.png`, `c1-mobile.png` |
| A1 strip | `a1-desktop.png`, `a1-mobile.png` |
| Offer chooser | `chooser-desktop.png`, `chooser-mobile.png` |
| Final LINE CTA with desktop QR | `final-cta-desktop.png` |
| 320px document | `mobile-320.png` |

Browser measurements recorded in `browser-check.json`:

```json
{
  "overflow": { "width": 320, "scrollWidth": 320, "bodyScrollWidth": 320 },
  "focus": { "focused": true, "outlineStyle": "solid", "outlineWidth": "2px" }
}
```

## Fresh verification

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ pnpm verify:services
services vnext data contract passed

$ git diff --check
(no output)
```

The build emitted pre-existing warnings about deprecated Astro markdown plugin configuration, an empty framework content glob, and unresolved `%23n`; the component sources introduce no new warnings.

## Fix round 1 — preview landmark contract

`BaseLayout.astro` already owns the sole `<main id="main">`. The temporary preview route had added a second nested landmark, so the build-output verifier was extended before the fix and failed as expected:

```text
AssertionError [ERR_ASSERTION]: the component preview must preserve BaseLayout's single main landmark
2 !== 1
```

The preview now yields its sibling sections directly to `BaseLayout`; it does not render another `<main>`. Fresh verification after the change:

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ node landmark-check
{"mainIdCount":1,"mainCount":1}

$ git diff --check
(no output)
```
