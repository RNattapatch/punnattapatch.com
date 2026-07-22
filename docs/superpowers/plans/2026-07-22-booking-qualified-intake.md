# Booking Qualified Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the short `/booking` lead form with a fully required, validated pre-call intake and restore the Response ID → thank-you → LINE OA flow.

**Architecture:** `booking.astro` owns customer-visible field rendering, browser validation, reference generation, payload serialization, and success redirect. The existing `/thank-you` route remains the canonical noindex success page. The current `intake-form-v2` n8n workflow validates the same payload before it creates a lead, so direct webhook posts cannot bypass browser validation.

**Tech Stack:** Astro 6, Tailwind 4/DaisyUI, browser FormData/Clipboard APIs, Playwright, n8n intake-form-v2.

## Global Constraints

- Do not alter pricing, service catalog, testimonials, or unrelated routes.
- Every visible form field is required; “ไม่สะดวกระบุ” and “ยังไม่ได้ตั้งงบ” are selected values, never empty submits.
- The submit label is exactly `ส่งข้อมูล ผมจะติดต่อกลับคุณเองใน 48 ชั่วโมง`.
- Use `source_page: '/booking'`, `_meta.reference`, and `problems: string[]`.
- No success redirect or Lead event before the webhook accepts the payload.
- Preserve existing BaseLayout, Warm Editorial tokens, and no reveal/`opacity-0` patterns.

---

### Task 1: Add a booking-intake regression verifier

**Files:**
- Create: `scripts/verify-booking-intake.mjs`
- Test: `scripts/verify-booking-intake.mjs`

**Interfaces:**
- Consumes: source text from `src/pages/booking.astro` and `src/pages/thank-you.astro`.
- Produces: exit 0 only when the required fields, 48-hour CTA, reference flow, and copy/LINE UI are present.

- [ ] **Step 1: Write the failing verifier**

```js
import { readFile } from 'node:fs/promises';

const booking = await readFile(new URL('../src/pages/booking.astro', import.meta.url), 'utf8');
const thankYou = await readFile(new URL('../src/pages/thank-you.astro', import.meta.url), 'utf8');
const required = ['name', 'phone', 'line', 'company', 'industry', 'position', 'teamSize', 'revenue', 'budget', 'problems', 'comment', 'timeline', 'source', 'source_note', 'consent'];

for (const name of required) {
  if (!booking.includes(`name="${name}"`)) throw new Error(`missing required field: ${name}`);
}
for (const text of [
  'เล่าให้ผมฟังหน่อยว่าธุรกิจของคุณติดตรงไหนอยู่',
  'ตอนนี้เจอปัญหาเรื่องไหนบ่อยที่สุด',
  'ส่งข้อมูล ผมจะติดต่อกลับคุณเองใน 48 ชั่วโมง',
  "source_page: '/booking'",
  'FormData.getAll(\'problems\')',
  "thankYouUrl.searchParams.set('ref'",
]) {
  if (!booking.includes(text)) throw new Error(`booking requirement missing: ${text}`);
}
for (const text of ['id="ref-display"', 'คัดลอก ID แล้วเปิด LINE OA', '48 ชั่วโมง']) {
  if (!thankYou.includes(text)) throw new Error(`thank-you requirement missing: ${text}`);
}
for (const stalePromise of ['ภายใน 1 วันทำการ', 'ภายใน 2 วันทำการ']) {
  if (booking.includes(stalePromise) || thankYou.includes(stalePromise)) {
    throw new Error(`stale response-time promise remains: ${stalePromise}`);
  }
}
console.log('booking intake checks passed');
```

- [ ] **Step 2: Run it to verify RED**

Run: `node scripts/verify-booking-intake.mjs`  
Expected: failure naming the first missing required field, currently `phone`.

- [ ] **Step 3: Commit the test-only change after RED is recorded**

```bash
git add scripts/verify-booking-intake.mjs
git commit -m "test: define qualified booking intake"
```

### Task 2: Build the required booking form and valid payload

**Files:**
- Modify: `src/pages/booking.astro`
- Test: `scripts/verify-booking-intake.mjs`

**Interfaces:**
- Consumes: field values from the rendered form.
- Produces: a JSON payload with `phone` normalized to E.164, `problems` as `string[]`, and `_meta.reference` in `PN-BK-YYYYMMDDHHMM-XXXX` form.

- [ ] **Step 1: Render the exact required fields**

Replace the ambiguous `contact`, `business`, and single `issue` controls with `phone`, `line`, `company`, `industry`, `position`, `teamSize`, `revenue`, `budget`, `problems`, `comment`, `timeline`, `source`, conditional `source_note`, and consent. Use the label/copy/options listed in `docs/superpowers/specs/2026-07-22-booking-qualified-intake-design.md`.

- [ ] **Step 2: Add browser validation helpers**

```ts
function normaliseThaiMobile(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, '');
  const local = compact.startsWith('+66') ? `0${compact.slice(3)}` : compact;
  if (!/^0[689]\d{8}$/.test(local)) return null;
  if (/^(\d)\1+$/.test(local) || /(\d)\1{6,}/.test(local)) return null;
  return `+66${local.slice(1)}`;
}

function hasMeaningfulText(value: string, minimum: number): boolean {
  const text = value.trim();
  return text.length >= minimum && !/^(.)\1+$/.test(text);
}
```

Use a per-field error node and `aria-describedby`; validate on blur and again on submit. `source_note` becomes required only for `source === 'other'`.

- [ ] **Step 3: Serialize and submit without losing checkbox values**

```ts
const data = new FormData(form);
const payload = Object.fromEntries(data.entries()) as Record<string, unknown>;
payload.problems = data.getAll('problems').map(String);
payload.phone = normaliseThaiMobile(String(data.get('phone') ?? ''))!;
payload._meta = { reference: makeReference(), submitted_at: new Date().toISOString(), path: window.location.pathname };
Object.assign(payload, { source_page: '/booking', booking_type: 'daruma-qualification' });
```

- [ ] **Step 4: Redirect only after an accepted response**

```ts
const thankYouUrl = new URL('/thank-you', window.location.origin);
thankYouUrl.searchParams.set('ref', String((payload._meta as { reference: string }).reference));
for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid']) {
  const value = new URLSearchParams(window.location.search).get(key);
  if (value) thankYouUrl.searchParams.set(key, value);
}
window.location.assign(thankYouUrl);
```

Keep the form visible with its Thai error message when the webhook fails or rejects.

- [ ] **Step 5: Run GREEN checks**

Run: `node scripts/verify-booking-intake.mjs`  
Expected: `booking intake checks passed`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/booking.astro scripts/verify-booking-intake.mjs
git commit -m "feat: qualify booking intake"
```

### Task 3: Restore the Response ID thank-you handoff

**Files:**
- Modify: `src/pages/thank-you.astro`
- Test: `scripts/verify-booking-intake.mjs`

**Interfaces:**
- Consumes: `ref` and attribution query parameters.
- Produces: visible/selectable ID, a user-gesture copy operation, and LINE OA handoff.

- [ ] **Step 1: Change success copy and action labels**

Use the 48-hour promise everywhere on this route. Keep `id="ref-display"`; replace the LINE button with `id="copy-open-line"` and text `คัดลอก ID แล้วเปิด LINE OA`. Keep a secondary `id="copy-ref"` button with text `คัดลอก ID`.

- [ ] **Step 2: Implement combined copy/open behavior**

```js
const copyOpenLine = document.getElementById('copy-open-line');
copyOpenLine?.addEventListener('click', async () => {
  if (ref !== '—') {
    try { await navigator.clipboard.writeText(ref); } catch { /* visible ID is fallback */ }
  }
  window.open(copyOpenLine.dataset.lineUrl, '_blank', 'noopener');
});
```

Provide `data-line-url={SITE.social.line}` on the button. Do not fire a duplicate Lead event here; preserve the existing success-page conversion event.

- [ ] **Step 3: Run GREEN checks**

Run: `node scripts/verify-booking-intake.mjs`  
Expected: `booking intake checks passed`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/thank-you.astro scripts/verify-booking-intake.mjs
git commit -m "feat: restore booking response ID handoff"
```

### Task 4: Enforce the webhook gate and run end-to-end QA

**Files:**
- Modify: active n8n workflow `intake-form-v2`, immediately after Webhook and before Flatten Body.
- Test: `scripts/verify-booking-intake.mjs`, Playwright browser checks, `pnpm build`.

**Interfaces:**
- Consumes: the booking JSON payload from Task 2.
- Produces: HTTP 2xx and normal lead processing only for validated booking payloads; HTTP 422 and no lead write/notification for invalid direct requests.

- [ ] **Step 1: Add the n8n validation Code node**

The node checks `source_page === '/booking'` and returns an invalid branch when any required key is absent, `phone` fails `/^\+66[689]\d{8}$/`, `problems` is not a non-empty array, `comment.trim().length < 30`, or consent is absent. Valid items continue to Flatten Body; invalid items return HTTP 422 before Telegram/CRM nodes.

- [ ] **Step 2: Test both n8n branches with payloads**

Valid minimum: `phone: '+66812345678'`, non-empty `problems`, 30-character `comment`, all select values, `consent: 'on'`, and `_meta.reference`.  
Invalid minimum: `phone: '+66111111111'`.  
Expected: valid payload reaches Flatten Body; invalid payload returns 422 and has no Telegram/CRM side effect.

- [ ] **Step 3: Run local browser and build verification**

Run:

```bash
node scripts/verify-booking-intake.mjs
pnpm build
pnpm preview --host 127.0.0.1 --port 4326
```

Use Playwright at 1440×900, 768×1024, and 390×844. Intercept the valid booking POST to assert all keys and `problems` array; test each invalid phone class, empty text/select/checkbox, conditional source note, and failure response. Verify the accepted submit arrives at `/thank-you?ref=PN-BK-…` and the copy/open action exists.

- [ ] **Step 4: Commit and release**

```bash
git add src/pages/booking.astro src/pages/thank-you.astro scripts/verify-booking-intake.mjs
git commit -m "feat: enforce qualified booking flow"
git push origin main
```

Wait for the GitHub Pages deployment, then assert live `/booking` has the exact CTA, all required fields, and a valid intercepted submission redirects to `/thank-you` with a Response ID.
