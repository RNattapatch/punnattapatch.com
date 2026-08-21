# Claude Code Update Prompt — Daruma Consult Ad Landing

You are taking over a local Astro implementation in `/Users/r_nat/Documents/punnattapatch.com`.

## Current state

The Daruma Facebook/Instagram consultation landing page is already implemented locally at:

- Route source: `src/pages/ads/daruma-consult.astro`
- Route: `/ads/daruma-consult`
- Layout change: `src/layouts/BaseLayout.astro` now accepts an optional `robots` prop so this route can emit `noindex,follow` without changing existing pages.
- Contract test: `tests/ads/daruma-consult.test.mjs`
- Design spec: `docs/superpowers/specs/2026-07-24-daruma-consult-landing-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-24-daruma-consult-landing.md`

Do not rebuild the page from scratch. Inspect the current files first and preserve the working implementation unless a requirement below is missing.

## Product behavior

- Thai, mobile-first, existing Pun warm-editorial visual system.
- Primary conversion path: free 15–20 minute consultation booking.
- Hero mirrors the ad pain: `ข้อมูลลูกค้าบริษัทคุณ อยู่กับบริษัท หรืออยู่กับเซลล์?`
- Booking form fields: name, business, phone/LINE contact, optional sales-team issue, required privacy consent, honeypot, and five hidden UTM fields.
- Two secondary LINE fallback buttons appear below the form and both use `https://line.me/R/ti/p/@011xgvap` with `target="_blank" rel="noopener"`.
- Success state only explains that Pun will follow up through LINE or phone; it must not introduce a paid offer.

## Submission contract

Reuse the `/booking` payload shape and submit behavior. The webhook is:

`https://rnat.app.n8n.cloud/webhook/intake-form-v2`

Submit JSON with `Content-Type: application/json` and `keepalive: true`. The page sets:

```js
{
  source: 'ads-daruma-consult',
  source_page: 'ads/daruma-consult',
  booking_type: 'daruma-consult',
  submitted_at: new Date().toISOString(),
  path: window.location.pathname,
  recommended_path: 'free-consultation',
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term,
}
```

Current assumption: `/booking` does not import a shared handler; it embeds the webhook URL and payload logic directly in `src/pages/booking.astro`.

## Meta Pixel contract

Dataset ID: `890649354099149`.

- `PageView`: base Pixel code in the page head.
- `ViewContent`: once when the booking form section reaches about 40% visibility; content name `daruma_consult_form`.
- `Lead`: only after the webhook returns 2xx; content name `daruma_consult_booking`.
- `Contact`: on either LINE fallback click before navigation; content name `line_add_daruma`.
- Consent: reuse the lightweight `pixel_consent` localStorage pattern. Declining must call `fbq('consent', 'revoke')`.

## Compliance and QA

- Keep the route free of income or revenue promises and paid-offer copy.
- Route output must contain zero of these strings: `25,000`, `Daruma Score`, `ประหยัดเงินเดือน`, `แทนพนักงาน`, `การันตี`.
- Keep exactly one `data-primary-cta` booking action; the LINE buttons are fallback contacts, not a second primary objective.
- Keep `noindex,follow` and canonical `https://punnattapatch.com/ads/daruma-consult`.
- Run:

```bash
node --test tests/ads/daruma-consult.test.mjs
pnpm build
```

- Verify `dist/ads/daruma-consult.html` for the Pixel ID, all event names, five UTM names, webhook URL, `noindex,follow`, and zero banned strings.
- Do not push to `main` unless the owner explicitly asks for deployment.
