# T4 Operating Journey — Design Specification

**Status:** Proposed for implementation  
**Date:** 2026-09-02  
**Pilot scope:** `/services/advance-ai-automation` only  
**Reference studied:** <https://www.pakorn.in.th/facebookadsmaster/#curriculum>

## 1. Objective

Turn the T4 landing page from a sequence of similarly weighted information boxes into a guided decision journey. An SME owner should understand, in order:

1. what one-day Pilot changes;
2. exactly what is included in the offer;
3. what proof supports it;
4. how the team moves from a repeated task to a Stop, Revise, or Install decision;
5. whether the course fits before contacting Pun.

T4 is the pilot. T1–T3 must remain visually and behaviorally unchanged until Pun reviews and approves the T4 result.

## 2. Research Synthesis

The reference page is effective because each viewport has one dominant question, each major section changes visual field, and Curriculum/Bonus content is introduced by a compact overview before detail. Its useful principles are:

- one section equals one decision;
- strong contrast between section fields;
- oversized headings and sequence numbers;
- an offer appears before the long explanation;
- modules are scannable before they are readable;
- real photographs and evidence interrupt text-heavy stretches.

The implementation must not copy the reference page's visual identity, promotional countdown, claimed bonus values, wording, or assets.

## 3. Core Concept

**Operating Journey:** the page should feel like following one real workflow across a workshop table, not reading a course brochure.

The page uses Pun's existing navy/coral/ivory system, blueprint grid, real workshop photography, large chapter numbers, and output panels. Every section answers one owner-level question and ends with a concrete artifact or decision.

### Insight

An SME owner wants evidence that one workshop day will change the team's work, but most course pages make them infer the link between the problem, the activity, and the output because every section looks equally important.

### One-sentence idea

Follow one repeated task from **Pick → Map → Sandbox → Responsibility → Decide**, with each scroll revealing the next decision and the artifact produced there.

## 4. Page Choreography

The required DOM and visual order is:

1. **Hero** — customer job, real activity photograph, price, short three-step outcome, primary CTA.
2. **Offer Stack** — immediately below Hero. Shows the complete offer, core artifacts, five included Bonus tools, terms, and CTA.
3. **Journey Map** — compact navigation: Proof → Diagnose → Workshop → Decision.
4. **Proof** — real workshop photos and real system evidence.
5. **Diagnosis** — repeated-work symptoms, offer boundary, and why the Pilot is intentionally one Workflow.
6. **Curriculum Journey** — Pick → Map → Sandbox → Responsibility → Decide.
7. **Take-home Decision Pack** — the four core artifacts, visually separated from Bonus tools.
8. **Fit / Not Fit** — who should join and when to use C1 or I1 instead.
9. **Instructor / Investment / FAQ / Final CTA** — decision closure.

The current Bonus section after Take-home must be removed for T4 to avoid duplicate content.

## 5. Offer Stack

The Offer Stack is a full-width ivory section directly below the Hero. It must look materially different from Proof and Curriculum.

### Content hierarchy

1. Eyebrow: `T4 · Workflow Pilot Day`
2. Heading: `หนึ่งวัน เพื่อรู้ว่างานนี้ควรหยุด ปรับ หรือทำระบบต่อ`
3. Commercial summary: Catalog-derived price, duration, one company, one Workflow, masked/dummy data.
4. Core offer: Workflow Map, Safe Sandbox Prototype, Human–AI Responsibility Brief, Stop/Revise/Install Decision Memo.
5. Included Bonus tools: the five T4 cards already present in `t4.ts`.
6. Terms: 100% upfront and Fit Gate before invoice, sourced from the existing investment data.
7. Primary CTA: existing booking/Fit Gate action and LINE option.

### Bonus rules

- Render all five T4 Bonus descriptions now, as explicitly approved by Pun.
- Describe them as included materials; do not add download links until public files exist.
- Do not show invented baht values, countdowns, lifetime access, fake scarcity, or outcome guarantees.
- Keep Core artifacts and Bonus materials visually and semantically separate.
- Existing source material may be unfinished, but the public page must not claim immediate download availability.

### Layout

- Desktop: 5/7 split. Commercial summary and CTA remain sticky within the section's visual frame; Core + Bonus occupy the larger column.
- Tablet: two columns without sticky behavior.
- Mobile: one column; commercial summary first, then Core, then Bonus. No horizontal carousel.
- Five Bonus cards use one leading wide card plus four compact cards. Each card shows number, title, primary user, use moment, and operational outcome.

## 6. Curriculum Journey

Replace the current low-contrast border-only list presentation for T4 with an `operating-journey` presentation variant.

### Overview rail

A five-node rail presents:

`Pick → Map → Sandbox → Responsibility → Decide`

The active reading order must remain clear without color. Nodes use sequence number, stage name, and a one-line decision.

### Module card anatomy

Each module includes:

- oversized sequence number;
- module label and plain-language decision;
- `เข้าใจอะไร` from the existing learning field;
- `ลงมือทำ` from the existing action field;
- a high-contrast `ได้อะไรกลับไป` output panel.

Desktop cards alternate the emphasis side to create scroll rhythm. Mobile cards remain in one reading column. Content stays present in HTML; if disclosure is used on small screens, the first item is open and controls use native accessible semantics.

## 7. Visual System

### Fields

- Hero: navy.
- Offer Stack: warm ivory with a navy commercial panel and coral rule.
- Journey Map: sand.
- Proof: white.
- Diagnosis: sand and navy contrast bands.
- Curriculum: pale blue-grey blueprint field.
- Decision: ivory leading into navy final CTA.

### Typography

- Keep the existing brand type system and Thai-capable fonts.
- Display heading: 48–64px desktop, 36–44px tablet, 32–38px mobile.
- Module numbers: 64–96px desktop, 48–64px mobile.
- Body copy remains at least 16px on mobile with 1.6–1.75 line-height.
- Long copy is constrained to a readable measure.

### Interaction and motion

- One primary CTA per visual panel.
- Touch targets at least 44×44px.
- Hover/focus treatments must not shift layout.
- Motion is limited to short opacity/transform emphasis and must respect `prefers-reduced-motion`.
- Fixed LINE CTA must not obscure primary content or controls.

### Imagery

- Existing real workshop photographs only.
- No AI-generated people, stock-office scenes, robots, neon circuits, or fabricated dashboards.
- Non-hero images remain lazy-loaded with dimensions reserved.

## 8. Component Architecture

Add a presentation opt-in so the T4 pilot does not change T1–T3.

### Data contract

Extend `ProductDetailPageData` with an optional `presentation` object:

```ts
presentation?: {
  mode: 'operating-journey';
  offerHeading: string;
  offerIntro: string;
  journeyLabel: string;
}
```

T4 opts in. Existing pages render the current layout when this property is absent.

### Components

- Add `OfferStack.astro` for the top offer and included Bonus materials.
- Add `OperatingJourney.astro` or an explicit variant in `ScopeTimeline.astro` for the T4 curriculum.
- `ProductDetailLayout.astro` controls placement and guarantees the Offer Stack is directly after Hero for opt-in pages.
- Reuse existing Catalog resolution, CTA components, T4 Bonus data, Take-home data, and Investment terms. Do not duplicate prices or LINE URL construction.

## 9. Accessibility and SEO

- Preserve one H1 and sequential heading hierarchy.
- Offer, Bonus, and Curriculum require distinct accessible headings.
- The five-stage rail must be an ordered list, not decorative divs.
- Bonus cards must be articles inside a labelled section.
- No meaning communicated by coral/navy color alone.
- Keyboard order follows DOM order.
- Existing Course, FAQ, Breadcrumb, canonical, and tracking contracts remain unchanged.

## 10. Acceptance Criteria

- T4 alone uses the new presentation; T1–T3 screenshots remain unchanged.
- `data-detail-block="offer"` is the first major block after Hero.
- T4 shows exactly four Core artifacts and five Bonus materials.
- Bonus titles match the approved T4 pack in `t4.ts`.
- Price remains Catalog-derived; no hardcoded package price is introduced.
- No fake value, countdown, lifetime access, guarantee, or download button.
- Journey order is exactly Pick → Map → Sandbox → Responsibility → Decide.
- Desktop, tablet, mobile, small mobile, and landscape have no horizontal overflow.
- All links, focus states, images, structured data, and tracking gates continue to pass.
- Full build, product/service contracts, price check, copy lint, Node suite, and Playwright suite pass without weakening any gate.

## 11. Visual Review Checkpoint

Implementation stops after a T4 preview and screenshot set at 1440, 768, 390, 320, and 844×390. Pun reviews T4 before the `operating-journey` presentation is applied to T1–T3.
