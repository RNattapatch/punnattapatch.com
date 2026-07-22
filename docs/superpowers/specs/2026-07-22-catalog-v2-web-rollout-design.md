# Catalog v2 Web Rollout Design

**Goal:** Put the approved sales-facing Catalog v2 on the public website without publishing a Public Course or Venue-dependent offer.

## Approved commercial decisions

- Do not publish Public Course, Venue, seat price, or registration UI.
- In-house A is **Sales × AI Agent 1 วัน** at **฿34,900**.
- In-house B is **Daruma Sales Office Bootcamp 2 วัน** with **฿69,900** as the crossed-out list price and **฿59,900** as the selling price.
- Daruma Sales Transformation remains the flagship at **฿198,000**.
- AI Trust Content Cycle remains **฿49,900**.
- Daruma Score remains a private diagnostic/closing option on its existing noindex ads page; it is removed from public entry and recommendation paths.

## Public experience

1. `/services` presents four clear choices in this order: In-house A, In-house B, Flagship, then Trust Content. Each card says who it is for, what happens, and the single next action: book a free conversation.
2. Homepage, Daruma intro, and booking use the same free-consultation funnel. They no longer frame Daruma Score as the mandatory first purchase.
3. Legacy public workshop/package URLs redirect to the relevant `/services` anchor so an old Google result cannot display a retired price or offer.
4. Public copy speaks owner-to-owner: short Thai sentences, concrete work situations, direct `ผม–คุณ`, and the Sales × AI Agent positioning. It avoids guru claims, abstract AI jargon, and copied pricing language.

## Data and routing

- `src/data/pricing.mjs` is the single price source. New public SKU keys are `inhouse-a`, `inhouse-b-list`, and `inhouse-b`.
- Existing Daruma Score pricing stays for the noindex ads page only. Retired public package price keys are not consumed by the new public service cards.
- Booking submissions keep their existing webhook and analytics contract; only the neutral recommendation label changes so it does not pre-sell a diagnostic.

## Verification and release

- Static checks assert the four public offers, the exact In-house B list/sale prices, no Public Course text, no public Daruma Score entry CTA, and all visible prices are token-derived.
- Run `pnpm build` and responsive browser QA before commit.
- Deploy the verified `dist` to the authenticated Cloudflare Pages project, then validate the production URL and key routes.
