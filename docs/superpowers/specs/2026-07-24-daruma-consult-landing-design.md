# Daruma Consult Ad Landing Page Design

**Date:** 2026-07-24
**Route:** `/ads/daruma-consult`
**Primary outcome:** Convert Facebook/Instagram ad visitors into a free 15–20 minute consultation booking.

## Design direction

The page uses the existing Pun warm-editorial system rather than introducing a separate ad microsite style. It reuses `BaseLayout`, the `punpaper` tokens, existing client-logo assets, the existing site navigation/footer, and the current form field treatment.

- Purpose: owner or sales leader of a 5–20 person team who clicked an ad about customer data being trapped with salespeople or sales being driven by luck.
- Direction: Editorial / Magazine; asymmetric hero, hairline rules, restrained paper surfaces, and one coral accent.
- Theme: existing `punpaper` tokens: navy `#072b4e`, coral `#dd4155`, warm ivory, sand, and surface.
- Typography: existing layout tokens `Trirong` for display and `Sarabun` for Thai body copy.
- Signature detail: a three-question self-check rendered as an editorial checklist with `01`, `02`, `03` markers and a coral rule.
- Layout: mobile-first; single-column reading order on small screens and a split hero/form composition at wider breakpoints.

## Page structure

1. Consent strip: compact PDPA/Meta Pixel notice in normal flow, with `/privacy`, accept, and decline controls.
2. Hero: exact ad-mirror headline, short owner-to-owner subhead, one scroll-to-form booking action, and a small Daruma mark panel.
3. Self-check: three questions — latest customer contact, deal stage, and quoted price — framed by “ถ้าตอบไม่ได้ ข้อมูลยังแขวนกับคน”.
4. Call value: maximum three practical outcomes from the conversation.
5. Proof strip: the homepage client logos reused with explicit dimensions and lazy loading.
6. Honest line: no guarantee language; explain that the call identifies where to repair first and the team must execute.
7. Booking form: name, business, phone/LINE contact, optional sales-team problem, required consent, hidden honeypot, five UTM fields, and a success panel that only explains the follow-up step.
8. LINE fallback: two green LINE buttons below the form, with inline white LINE mark, opening the same official account URL in a new tab.

The booking form is the single primary conversion path. The two LINE buttons are a secondary fallback required by the brief; they do not introduce a paid offer or a second sales objective.

## Data flow and tracking

- The page includes the standard Meta Pixel base snippet in the head with dataset ID `890649354099149`, followed by `PageView`.
- `ViewContent` fires once when `#daruma-consult-form` reaches approximately 40% visibility.
- Form submission copies the existing `/booking` shape and submit behavior: `FormData` → `Object.fromEntries` → `fetch` POST to `https://rnat.app.n8n.cloud/webhook/intake-form-v2` with JSON and `keepalive: true`.
- The page overrides `source` to `ads-daruma-consult`, retains `source_page`, `booking_type`, `submitted_at`, `path`, and `recommended_path`, and includes all five UTM values.
- `Lead` fires only after the webhook returns a 2xx response, with `content_name: 'daruma_consult_booking'`.
- `Contact` fires on either LINE button before navigation, with `content_name: 'line_add_daruma'`.
- The consent strip follows the existing lightweight pattern using localStorage key `pixel_consent`; declining calls `fbq('consent', 'revoke')`.

## Accessibility, performance, and compliance

- Use real buttons and labeled form controls; all external links have `target="_blank" rel="noopener"`.
- Keep tap targets at least 44px and preserve the existing visible focus ring.
- No hero image is required, avoiding an LCP dependency; proof logos are lazy-loaded and dimensioned.
- Add `noindex,follow` for the paid landing route and canonical `https://punnattapatch.com/ads/daruma-consult`.
- Reuse the existing brand OG image.
- Keep all customer-facing copy free of income claims, revenue guarantees, banned legacy offer terms, and paid upsells.
- The global header CTA is suppressed only on this route so the page has one clear primary booking action while retaining regular navigation and legal/footer links.

## Error handling

- Native `reportValidity()` prevents incomplete required submissions.
- The honeypot silently drops bot submissions.
- During submit, disable the submit button and show a loading label.
- A non-2xx response or network error restores the button and shows an inline alert telling the visitor to retry or use LINE.
- Tracking failures are defensive and must never block form submission or navigation.

## Acceptance criteria

- Astro build succeeds.
- Route renders at `/ads/daruma-consult`.
- Route output contains the Pixel ID and all four required event names.
- Route output contains zero banned strings: `25,000`, `Daruma Score`, `ประหยัดเงินเดือน`, `แทนพนักงาน`, `การันตี`.
- Five UTM fields are present and included in the JSON payload.
- `Lead` is after a successful 2xx response; `Contact` is separate and only attached to LINE clicks.
- Success state contains follow-up information only and no paid offer.
- No unrelated existing user changes are modified.
