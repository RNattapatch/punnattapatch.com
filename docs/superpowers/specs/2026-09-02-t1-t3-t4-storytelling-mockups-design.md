# T1–T3 T4 Storytelling Mockups — Design Specification

**Status:** Approved by user brief for mockup implementation  
**Date:** 2026-09-02  
**Reference:** Live `/services/advance-ai-automation` at `origin/main@356e0bf`  
**Offer SSOT:** `wiki/pages/strategy-t1-t4-5a-offer-bonus-system.md`

## Objective

Rebuild the T1, T2, and T3 product pages on an isolated branch so each page tells its product story with the same conversion sequence and visual grammar as the live T4 page. Production remains unchanged until Pun reviews the branch preview.

## Exact storytelling contract

All four training pages use this order:

1. Hero with Catalog name, Catalog price, real activity image, three-step summary, booking CTA, LINE CTA, and real capacity note.
2. Offer Stack with the complete offer, four Core outputs, five course-specific Bonus tools, and no unsupported claims.
3. Instructor trust bridge and approved full-colour organization logos.
4. Proof gallery using existing real activity/system images, quotes, and approved testimonial images.
5. Why now with four product-specific pains.
6. Two Spotlight modules derived from the course process and artifacts in the Offer SSOT.
7. Curriculum Journey where every step states `เข้าใจอะไร`, `ลงมือทำ`, and `ได้อะไรกลับไป`.
8. What’s new in the September 2026 repackage beside the stable Core that survives tool changes.
9. Four Core take-home outputs.
10. Five detailed Bonus cards. T1–T3 show “รวมอยู่ในค่าอบรมแล้ว”; they do not show baht values because the SSOT has approved monetary valuation only for T4.
11. Why learn with Pun, tailored to the course.
12. Fit / Not fit and the correct C1/I1/T2 route.
13. Full instructor profile.
14. Investment, FAQ, and final CTA.

## Product narratives

### T1 — Decision → Ask → Defend → Rehearse → Follow up

The owner sees fewer deals lost to shallow questions, premature discounting, and aimless follow-up. The employee sees a Decision Map, Question Playbook, price-defense practice, AI Sales Coach, and a real Next Step for one deal.

### T2 — Message → Respond → Qualify → Handoff → Follow up → Review

The owner sees where ad spend is trapped between Inbox and Sales. Marketing and Sales see one lead definition, one owner per stage, one handoff rule, and a 30-day review rhythm.

### T3 — Stage → Report → Warn → Review → Prototype

The owner sees which deals are stuck and who needs help without asking each salesperson. The team sees one reporting language, one input standard, Manager intervention rules, and a prototype boundary distinct from I1 production implementation.

## Presentation architecture

Add an optional `journey` presentation object to `ProductDetailPageData`. Its presence selects the live T4 layout. The object supplies product-specific hero metadata, Offer copy, Why-now labels and heading, curriculum label/media, and final eyebrow. T4 receives explicit values matching current output so the refactor is behavior-preserving.

Journey components must not contain T4-only business copy. Generic layout and styling remain shared; every commercial phrase that varies by product comes from product data.

Shared, approved evidence may be exported from a small `shared-journey` data module: organization logos, testimonial image metadata, instructor identity, credentials, and profile image. Product-specific proof captions and instructor angles stay in each product file.

## Visual contract

- Preserve the live T4 Navy/Coral/ivory fields, Trirong/Sarabun typography, editorial split, rounded evidence cards, and CTA colors.
- Booking is Coral; LINE is LINE green.
- Use existing real photographs and redacted system screenshots only.
- Keep full-colour logos and minimum mobile logo size from the site design system.
- No new animation. Preserve visible focus, press feedback, and reduced-motion behavior.
- Validate 1440×1000, 768×1024, 390×844, 320×800, and 844×390 with no horizontal overflow.

## Copy and claim rules

- Product names and prices resolve from Catalog keys `inhouse-a`, `tiktok-workshop`, and `ai-workshop-advance`.
- Use the T1–T3 A1/A2 offer blocks, process, artifacts, fit, not-fit, and CTA keywords from the Offer SSOT.
- Do not guarantee revenue, ROAS, appointment count, adoption, headcount reduction, or production readiness.
- Do not invent Bonus values, fake countdowns, lifetime support, or downloadable files.
- T2 30-day support is Core, not Bonus.
- T3 stops at rules, templates, and prototype; I1 remains production Build/UAT/Handover.

## Acceptance criteria

- T1–T3 select the same journey renderer as T4; C1 and I1 remain on the legacy renderer.
- T4 output retains its existing section order, Core/Bonus counts, price, copy contract, CTA destinations, and tracking attributes.
- Each T1–T3 page renders exactly four Offer Core items, five Bonus items, four Why-now items, two Spotlight modules, at least four curriculum stages, six Why-me cards, four Fit items, and eight FAQs.
- T1–T3 each show a real Hero visual, organization logo wall, proof content, Bonus detail section, instructor profile, price, and final QR/LINE instruction.
- Metadata, canonical URL, Course schema, FAQ schema, tracking, booking query, and LINE keyword remain correct.
- Build, product/service verifiers, price/copy gates, Node tests, focused Playwright tests, accessibility checks, and responsive visual QA pass.
- Only the feature branch and optional Cloudflare branch preview change; production is not deployed.
