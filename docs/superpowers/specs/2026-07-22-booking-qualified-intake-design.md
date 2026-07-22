# Booking Qualified Intake Design

**Date:** 2026-07-22  
**Status:** Approved for specification; implementation pending final spec review  
**Scope:** `/booking` intake fields, validation, Response ID success flow, and existing `intake-form-v2` webhook validation.

## Goal

Turn `/booking` into a required, useful pre-call intake. Pun must be able to read the company context, sales-team size, revenue band, recurring problems, free-text situation, timing, budget, and source channel before responding.

The form must reject missing or obviously invalid data. A successful submission must redirect to the existing `/thank-you` page, where the visitor can copy a Response ID and open LINE OA.

This scope does not change the booking page's desktop width or unrelated service-page content.

## Form fields

Every visible field is required. Selects provide an honest answer such as “ยังไม่ได้ตั้งงบ” or “ไม่สะดวกระบุ” rather than allowing an empty value.

| Payload key | Customer label | Control and validation |
|---|---|---|
| `name` | ชื่อของคุณ | Text; trimmed, at least 2 characters, not one repeated character. |
| `phone` | เบอร์มือถือ | Thai mobile number only; normalize to E.164 `+66…`. Must match a valid Thai mobile structure and reject short values, invalid prefixes, all-repeated digits, and a repeated-digit run of 7 or more. |
| `line` | LINE ID | Text; 3–30 characters; letters, numbers, `.`, `_`, `-`, and an optional leading `@`; no whitespace-only value. Account existence is not verified. |
| `company` | ชื่อบริษัท / ชื่อร้าน | Text; trimmed, at least 2 characters. |
| `industry` | ธุรกิจของคุณทำเกี่ยวกับอะไร | Text; trimmed, at least 3 characters. |
| `position` | บทบาทของคุณในบริษัท | Select: เจ้าของ / CEO / ผู้บริหาร / หัวหน้าทีมขาย / ทีมขาย / อื่น ๆ. |
| `teamSize` | ทีมขายกี่คน | Select: ยังไม่มีทีมขาย / 1–4 / 5–10 / 11–20 / มากกว่า 20 คน. |
| `revenue` | รายได้บริษัทต่อปี | Select: น้อยกว่า 10M / 10–30M / 30–100M / 100–200M / มากกว่า 200M / ไม่สะดวกระบุ. |
| `budget` | งบที่คิดไว้ | Select: ยังไม่ได้ตั้งงบ / ต่ำกว่า ฿50,000 / ฿50,000–฿100,000 / ฿100,000–฿300,000 / มากกว่า ฿300,000. |
| `problems` | ตอนนี้เจอปัญหาเรื่องไหนบ่อยที่สุด | Checkbox group; at least one required. Options: data/deal scattered; sales admin/follow-up/report overload; volatile sales; dependence on key people; unclear sales process/KPI; unsure where AI helps sales first. |
| `comment` | เล่าให้ผมฟังหน่อยว่าธุรกิจของคุณติดตรงไหนอยู่ | Textarea; trimmed, at least 30 characters, not a repeated-character string. |
| `timeline` | อยากเริ่มแก้เมื่อไร | Select: ภายใน 2 สัปดาห์ / ภายใน 1 เดือน / ภายใน 2–3 เดือน / ยังศึกษาข้อมูลก่อน. |
| `source` | รู้จักผมจากช่องทางไหน | Select: TikTok / Facebook / Instagram / Google / ChatGPT หรือ AI Search / ลูกค้าแนะนำ / งานสัมมนา / อื่น ๆ. |
| `source_note` | โปรดระบุช่องทาง | Conditional text; required only when `source` is `other`. |
| `consent` | นโยบายความเป็นส่วนตัว | Required checkbox. |

The form heading is **“เล่าให้ผมฟังหน่อยว่าธุรกิจของคุณติดตรงไหนอยู่”**. Its helper text says the form takes about three minutes; the current two-minute claim is removed.

The primary button text is exactly **“ส่งข้อมูล ผมจะติดต่อกลับคุณเองใน 48 ชั่วโมง”**. Every booking/success reassurance that presently says one business day or two business days changes to the same 48-hour promise.

## Data and validation flow

1. Browser validation gives one Thai inline error at the invalid field and focuses it; it never sends an incomplete payload.
2. The browser serializes `problems` with `FormData.getAll()` so all selected problem values arrive as an array. `Object.fromEntries()` alone is not used for this field because it retains only the last checkbox value.
3. Before POST, the browser generates `PN-BK-YYYYMMDDHHMM-XXXX`, places it in `_meta.reference`, and sends `source_page: '/booking'` so the existing n8n form map marks it as BOOKING.
4. The n8n intake validation node repeats the required-field, phone, checkbox, and text-quality checks before it can create a CRM/Telegram lead. Invalid direct webhook posts receive an error response and do not create a lead.
5. Existing webhook fields (`company`, `industry`, `teamSize`, `revenue`, `problems`, `comment`, `timeline`, `budget`, `source`, `line`) are used directly; no CRM schema migration is required.

The existing honeypot remains. Client-side validation improves the customer experience; the n8n check enforces the same rule for direct requests.

## Response ID success flow

1. Only an accepted webhook response is a successful submission.
2. The user is redirected to `/thank-you?ref=<Response-ID>` with current UTM/click identifiers retained.
3. The existing noindex thank-you page displays the Response ID, keeps it selectable, and offers a primary **“คัดลอก ID แล้วเปิด LINE OA”** action. A separate copy control remains as a fallback.
4. The combined action copies the ID during the user click, then opens LINE OA. If clipboard permission is blocked, the visible selectable ID remains available.
5. If the webhook rejects or fails, the form stays visible with an error and LINE OA fallback. It must not redirect or fire the success conversion event.

## Implementation boundaries

- Web repository: `src/pages/booking.astro`, `src/pages/thank-you.astro`, and a focused booking-form verifier/test.
- Automation: the existing `intake-form-v2` workflow receives a validation step before its lead-notification/write path; it does not need a new workflow or endpoint.
- No pricing, service catalog, testimonials, or unrelated form routes are modified.

## Verification

1. Unit/static checks cover every required field, exact CTA, source options, `_meta.reference`, source-page value, and multi-checkbox array serialization.
2. Browser tests cover valid Thai mobile input; short, invalid-prefix, all-repeated, and repeated-run phone inputs; required fields; conditional source note; and textarea minimum.
3. Browser intercept tests confirm a valid payload has every expected key, an array of selected problems, E.164 phone, and Response ID.
4. Success-flow browser test confirms redirect to `/thank-you?ref=…`, ID display/copy, and LINE action; rejected submissions remain on `/booking`.
5. `pnpm build`, desktop/tablet/mobile visual QA, n8n validation test, GitHub Pages deployment, and live-domain verification complete the release.
