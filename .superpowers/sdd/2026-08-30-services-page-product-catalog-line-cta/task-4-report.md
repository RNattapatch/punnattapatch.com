# Phase 4 evidence — services page composition and copy migration

## TDD evidence

The services-page build-output contract was added to `scripts/verify-services-vnext.mjs` before the production page was recomposed. The first run was corrected to target Astro's actual static output path (`dist/services.html`); it then failed for the intended missing page contract:

```text
$ pnpm verify:services -- --build-output
AssertionError [ERR_ASSERTION]: #services-hero must exist in the required section order
```

The verifier now exercises the built HTML and checks:

- all nine required section IDs in exact order;
- exact offer-code order `T2, T1, T3, C1, I1, A1`, with every code appearing once;
- approved Hero copy and both Hero actions;
- caller-resolved CATALOG price agreement for T1/T2/T3/C1/I1 and no public A1 price;
- legacy `sales-team-structure` and `ai-agent-ceo` anchors inside the C1 wrapper;
- ten visible FAQ entries and the same ten question/answer pairs in FAQPage JSON-LD;
- explicit T2 availability for Clinic, Hotel, B2B, and other lead-based businesses;
- no Paid Audit positioning in rendered services HTML.

After the services page rewrite:

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed
```

A final requirements audit found that the organisation section had relevant work/event proof but no visible customer testimonial. Before adding one, the verifier was extended to require the already-published forklift-distributor case-study link and failed as intended:

```text
AssertionError [ERR_ASSERTION]: the sales testimonial must link to its published case study
```

The page now renders that repository-backed anonymized B2B sales/report quote and links to its existing case study. The final build-output run passes the visible testimonial contract.

## Section inventory

| Order | Section ID | Role |
| ---: | --- | --- |
| 1 | `services-hero` | Approved Sales Training / Consulting / Implementation positioning and two decision paths |
| 2 | `services-proof-strip` | Existing organization logos |
| 3 | `training-catalog` | T2 featured first, followed by T1 and T3 |
| 4 | `consulting-implementation` | One C1 Consulting card and one I1 Implementation card |
| 5 | `advance-program` | A1 upgrade strip without a price |
| 6 | `offer-chooser` | Six symptom-to-offer rows |
| 7 | `organisation-proof` | Relevant sales, funnel, training, report, dashboard evidence, and a published B2B customer testimonial |
| 8 | `faq` | Ten answers shared with FAQPage schema |
| 9 | `services-final-cta` | LINE decision-assist block with canonical QR |

## Product inventory

All visible price labels are resolved by the page caller from each offer's `pricingKey` using `fmtPrice`; no price amount is hardcoded in the page or verifier.

| Code | Customer job visible | Primary CTA destination | Pricing key | Proof used |
| --- | --- | --- | --- | --- |
| T2 | เปลี่ยนคนดู/Lead เป็นนัดหมายและยอดขาย | `/services/trust-content-tiktok-workshop` | `tiktok-workshop` | Approved T2 Dealer thumbnail plus Nissan Sales Manager Seminar 2026 image; adjacent copy explains the same engine works for Clinic, Hotel, B2B, and other lead-based businesses |
| T1 | คุยกับลูกค้าและตามดีลเป็น | `/services#inhouse-a` | `inhouse-a` | Existing In-house team group image |
| T3 | ให้หัวหน้าเห็นดีลค้างโดยไม่ไล่ Report | `/services#sales-report` | `ai-workshop-advance` | Existing Command Charts / Pipeline dashboard image |
| C1 | ช่วยคิดและออกแบบทางออกหนึ่งเรื่อง | `SITE.social.line` | `daily-sales-consulting` | Approved C1 thumbnail plus the published anonymized B2B Manufacturing / Distribution testimonial; no unsupported outcome claim added |
| I1 | ให้ทีมปันสร้าง Production System | `SITE.social.line` | `daruma-starter` | Existing Command Charts / Pipeline dashboard image and the published sales/report customer testimonial |
| A1 | เรียนแล้วมีคนพาทำจนใช้จริง | `SITE.social.line` | none | Approved A1 program thumbnail; no public price or unsupported result claim |

C1 remains one public Consulting card. Its four selectable primary outcomes stay inside the single offer description; there are no separate legacy AI-agent or sales-team-structure cards. A1 renders once as the upgrade role.

## Compatibility and SEO evidence

- Existing traffic-bearing detail route `/services/trust-content-tiktok-workshop` is unchanged and continues to resolve to `/services#trust-content`.
- Existing anchors `inhouse-a`, `sales-report`, `trust-content`, and `daruma-starter` remain available.
- Playwright measured both `sales-team-structure` and `ai-agent-ceo` at delta `0` from the C1 card top, so each legacy hash resolves to C1 rather than a removed package.
- No route was retired in Phase 4, so no additional redirect was required.
- The old services metadata and stale ServiceList package schema were removed. The page now emits WebPage, Person, BreadcrumbList, and FAQPage data for the new positioning.

## Responsive and visual evidence

The web-dev QA skill's referenced screenshot helper was not present on this machine. The same workflow was executed with the repository's installed Playwright: full-page captures at the three prescribed viewports, visual inspection, lazy-image loading, broken-image checks, and document-width measurements.

| Check | Desktop 1440 × 900 | Tablet 768 × 1024 | Mobile 390 × 844 |
| --- | --- | --- | --- |
| Existing site typography preserved | pass | pass | pass |
| Navy / Coral / Cream brand hierarchy | pass | pass | pass |
| Product order and responsive collapse | pass | pass | pass |
| CTA/card rendering and readable Thai | pass | pass | pass |
| Visible broken images | 0 | 0 | 0 |
| Horizontal overflow | `1440 = 1440` | `768 = 768` | `390 = 390` |

The additional 320px stress check recorded:

```json
{
  "innerWidth": 320,
  "scrollWidth": 320,
  "bodyScrollWidth": 320,
  "visibleBrokenImages": []
}
```

Full-page evidence remains in the shared worktree (ignored, not committed):

- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-4-services-desktop.png`
- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-4-services-tablet.png`
- `.superpowers/sdd/2026-08-30-services-page-product-catalog-line-cta/task-4-services-mobile.png`

The desktop file is the requested single-page screenshot. Tablet and mobile captures provide the responsive evidence.

## Fresh verification

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ git diff --check
(no output)

$ rg -n 'Paid Audit|paid audit|system-health-check|฿[0-9]|amount:' src/pages/services.astro
(no output)
```

Build emitted the repository's pre-existing Astro/Vite warnings about deprecated markdown plugin configuration, an empty framework content glob, and unresolved `%23n`; this phase introduces no new build warning.

## Fix round 1 — migration contracts

Reviewer findings were reproduced against the built page before production edits.

```text
$ node --test tests/services-strategy.test.mjs
tests 4 · pass 2 · fail 2

✖ services catalog gives Training and Consulting equal first-screen routes
✖ each course card states the artifact the team takes back
```

The built-output verifier was extended first and failed on the first mismatched required heading:

```text
AssertionError [ERR_ASSERTION]: services page must use exact required heading: คอร์สสำหรับทีมขายที่เปิดสอนตอนนี้
```

The fix preserves the Phase 4 composition while restoring migration behavior:

- exact Training, Consulting/Implementation, Proof, FAQ, and final CTA headings are enforced against built HTML;
- `core-training`, `system-services`, `trusted-by`, and `course-selector` remain unique aliases inside their replacement sections;
- `sales-team-structure` and `ai-agent-ceo` are now actual descendants of the `#offer-c1` article, enforced before its closing `</article>`;
- the Hero visibly retains the Training/Consulting decision and links to the compatibility anchors while keeping the approved catalog and LINE actions;
- T1, T2, and T3 visibly retain their take-home artifacts: `Sales Context Pack`, `Funnel map + Campaign kit + Chat script`, and `Stage dictionary`;
- C1 uses `เล่าโจทย์ให้ผมฟัง`; I1 uses `ขอประเมิน Scope`. The verifier rejects the retired `คุยกับปันใน LINE` label for both cards.

Fresh fix-round responsive evidence is retained locally in the ignored task directory as `task-4-services-desktop-fix1.png`, `task-4-services-tablet-fix1.png`, and `task-4-services-mobile-fix1.png`. Playwright recorded zero visible broken images and exact document/viewport width agreement at 1440px, 768px, 390px, and the additional 320px stress check.

```text
$ pnpm build
[build] 83 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ node --test tests/services-strategy.test.mjs
tests 4 · pass 4 · fail 0

$ git diff --check
(no output)
```

The same pre-existing Astro/Vite warnings remain; this fix round adds no new warning.

An additional repository-wide `*.test.mjs` run was attempted. The Phase 4 and other executed suites passed, but the unrelated pre-existing `tests/ads/daruma-consult.test.mjs` fails before assertions because `src/pages/ads/daruma-consult.astro` does not exist in this worktree (`ENOENT`). That out-of-scope missing ads page was not created or altered in this fix round. The specifically required complete services strategy suite passes 4/4.
