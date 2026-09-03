# T1–T3 T4 Storytelling Mockups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Produce production-ready T1–T3 branch mockups that use the live T4 storytelling format with course-specific SSOT content, then publish a non-production branch preview for Pun.

**Architecture:** Generalize the existing T4 journey renderer behind an optional typed `journey` presentation object, preserve T4 output, and opt T1–T3 into it through product data. Reuse existing components, Catalog resolution, real evidence assets, CTA tracking, metadata, and schema; add only the data/configuration needed to remove T4-only assumptions.

**Tech Stack:** Astro 6, TypeScript, Tailwind CSS 4, DaisyUI 5, Node.js tests, Playwright 1.62, Cloudflare Pages branch preview.

**Spec:** `docs/superpowers/specs/2026-09-02-t1-t3-t4-storytelling-mockups-design.md`

## Global Constraints

- Work only on branch `codex/t1-t3-t4-format-mockups`; do not merge main or deploy production.
- Catalog is the only source for product names, prices, duration, image URL, and outline URL.
- Use the exact live T4 section sequence and visual grammar.
- Derive T1–T3 commercial content from `strategy-t1-t4-5a-offer-bonus-system.md` sections 4–6.
- T1–T3 Bonus cards have no baht valuation until evidence is approved in SSOT.
- Existing real photos, redacted screenshots, approved testimonials, and full-colour logos only.
- Keep C1/I1 renderer and behavior unchanged.

---

### Task 1: Journey renderer contract

**Files:**
- Modify: `src/data/product-details/types.ts`
- Modify: `src/components/services/detail/ProductDetailLayout.astro`
- Modify: `src/components/services/detail/JourneyHero.astro`
- Modify: `src/components/services/detail/OfferStack.astro`
- Modify: `src/components/services/detail/WhyNowBlock.astro`
- Modify: `src/components/services/detail/JourneyCurriculum.astro`
- Modify: `src/components/services/detail/WhyMeGrid.astro`
- Test: `tests/t1-t3-journey-mockups.spec.ts`

**Interfaces:**
- Consumes: optional `ProductDetailPageData.journey` presentation data.
- Produces: one generic journey renderer selected by data rather than `code === 'T4'`.

- [x] Write a Playwright contract that expects T1–T3 to expose journey sections and expects C1/I1 not to expose them.
- [x] Run the focused test and record RED because T1–T3 still use the legacy renderer.
- [x] Add the typed journey presentation contract and replace T4-hardcoded labels with data-backed values.
- [x] Preserve T4 output by adding explicit T4 journey values.
- [x] Run focused T4 and new journey tests GREEN.

### Task 2: Shared trust evidence

**Files:**
- Create: `src/data/product-details/shared-journey.ts`
- Modify: `src/data/product-details/t1.ts`
- Modify: `src/data/product-details/t2.ts`
- Modify: `src/data/product-details/t3.ts`
- Modify: `src/data/product-details/t4.ts`
- Test: `tests/t1-t3-journey-mockups.spec.ts`

**Interfaces:**
- Produces: approved client logos, testimonial metadata, profile image, identity, and credential helpers.
- Consumes: product-specific instructor headings, angles, and quotes.

- [x] Extend the failing contract to require a real Hero image, logos, testimonials, and instructor profile on T1–T3.
- [x] Run RED against the current product data.
- [x] Extract only identical approved evidence into the shared module and keep product-specific claims local.
- [x] Add real Hero visuals and trust evidence to T1–T3.
- [x] Run the focused evidence contract GREEN.

### Task 3: T1 sales-conversation journey

**Files:**
- Modify: `src/data/product-details/t1.ts`
- Test: `tests/t1-t3-journey-mockups.spec.ts`

**Interfaces:**
- Produces: Decision → Ask → Defend → Rehearse → Follow up journey; five approved T1 Bonus cards; T1 Spotlight, September repackage, Why-me, and instructor copy.

- [x] Write literal assertions for the T1 Hero promise, four Core outputs, five Bonus titles, five journey stage IDs, live keyword `SALES PSYCHOLOGY`, and Catalog price.
- [x] Run RED for missing journey data.
- [x] Implement T1 data from SSOT section 4 without revenue guarantees or production CRM claims.
- [x] Run focused T1 tests GREEN.

### Task 4: T2 online-lead journey

**Files:**
- Modify: `src/data/product-details/t2.ts`
- Test: `tests/t1-t3-journey-mockups.spec.ts`

**Interfaces:**
- Produces: Message → Respond → Qualify → Handoff → Follow up → Review journey; five approved Online Lead Bonus cards; 30-day support remains Core.

- [x] Write literal assertions for the T2 Hero promise, four Core outputs, five Bonus titles, six journey stage IDs, keyword `ONLINE SALES`, Catalog price, and 30-day Core treatment.
- [x] Run RED for missing journey data.
- [x] Implement T2 data from SSOT section 5 without Agency/ROAS claims.
- [x] Run focused T2 tests GREEN.

### Task 5: T3 report-to-manager journey

**Files:**
- Modify: `src/data/product-details/t3.ts`
- Modify: `src/components/services/detail/ProofGallery.astro`
- Test: `tests/t1-t3-journey-mockups.spec.ts`

**Interfaces:**
- Produces: Stage → Report → Warn → Review → Prototype journey; five approved Sales Report Bonus cards; explicit I1 production boundary.

- [x] Write literal assertions for the T3 Hero promise, four Core outputs, five Bonus titles, five journey stage IDs, keyword `SALES REPORT`, Catalog price, and I1 boundary.
- [x] Run RED for missing journey data.
- [x] Let the journey proof gallery render approved `system` evidence alongside photos and quotes.
- [x] Implement T3 data from SSOT section 6 without claiming production software.
- [x] Run focused T3 tests GREEN.

### Task 6: Copy, accessibility, metadata, and visual QA

**Files:**
- Modify: product/component files above only when a verified issue requires it.
- Create: `output/images/qa/t1-t3-t4-format-mockups/*.png` (gitignored evidence).

**Interfaces:**
- Produces: responsive screenshots and machine-verifiable proof that mockups are reviewable.

- [x] Run `pnpm build`, product/services verifiers, price gate, offer copy lint, Node suite, and focused/full Playwright suites.
- [x] Run accessibility checks for H1, headings, accessible CTA names, visible focus, image alt text, reduced motion, and keyboard navigation.
- [x] Verify title, description, canonical, OG image, Course/FAQ schema, and `noindex` behavior is unchanged for product routes.
- [x] Run AI language scan on T1–T3 data and resolve every RED flag.
- [x] Capture 1440×900 and 390×844 full-page screenshots for all three routes plus 768, 320, and 844×390 overflow checks.
- [x] Inspect contact sheets, fix clipping/weak hierarchy/empty proof blocks, then rerun all affected tests.

### Task 7: Branch preview and handoff

**Files:**
- Modify: this plan to mark completed checkpoints.
- Modify: repository shared handoff outside the web repo through the approved shared-memory tool.

**Interfaces:**
- Produces: branch `codex/t1-t3-t4-format-mockups`, optional Cloudflare branch preview URLs, exact changed-file list, test evidence, and rollback-safe handoff.

- [x] Run fresh final verification and `git diff --check`.
- [x] Commit and push only the Codex branch.
- [x] Deploy a Cloudflare Pages branch preview only; do not use the production branch.
- [x] Verify all three preview URLs return 200 and load their full journey sections.
- [x] Record results in shared memory and deliver the preview URLs/screenshots to Pun for approve-or-revise review.
