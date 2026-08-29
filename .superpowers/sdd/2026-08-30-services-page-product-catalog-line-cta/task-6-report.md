# Phase 6 evidence — SEO, schema, redirects and content integrity

## Metadata before and after

| Field | Before | After |
| --- | --- | --- |
| `<title>` / OG title | `คอร์สและบริการสำหรับทีมขาย ที่อยากเพิ่มยอดและทำงานเป็นระบบ · ปัน ณัฐพัชร์` | `คอร์สสำหรับทีมขาย และบริการวางระบบฝ่ายขาย \| ปัน ณัฐพัชร์` |
| Description / OG description | `เลือกคอร์สและบริการจากงานที่ทีมขายต้องทำได้จริง ตั้งแต่ทักษะการขาย การเปลี่ยน Lead เป็นยอดขาย ไปจนถึง Report, Dashboard และระบบฝ่ายขายที่ใช้งานจริง` | `Training, Consulting และ Implementation สำหรับทีมขายที่ต้องการเพิ่มยอด วาง Funnel, Follow-up, Report และ Dashboard โดยใช้ AI เป็นตัวช่วยในงานที่เหมาะสม` |
| Canonical / OG URL | `https://punnattapatch.com/services` | unchanged and explicitly supplied as `https://punnattapatch.com/services` |
| OG image | generic `/og-image.jpg` | absolute hashed T2 catalog artwork, `/_astro/t2-online-to-offline-ai.*.png` |

The required title already contains `SITE.nameTh`. `BaseLayout` previously appended ` · ปัน ณัฐพัชร์` to every non-default title, so passing the required title would duplicate the brand. Per the Phase 6 ruling, the layout now skips its suffix only when the supplied title already contains `SITE.nameTh`; all other title behavior is unchanged. The built-output verifier asserts the exact title and rejects the duplicated form.

The new description explicitly names Training, Consulting and Implementation, leads with sales outcomes and workflows, and positions AI as support. It contains no obsolete price.

## Schema inventory

The services page emits one JSON-LD block, parsed successfully as JSON. Its graph contains:

| Schema type | Count | Catalog role |
| --- | ---: | --- |
| `WebSite` | 1 | Existing site identity node |
| `WebPage` | 1 | Canonical services page metadata |
| `ItemList` | 1 | All six visible roles in page order: T2, T1, T3, C1, I1, A1 |
| `Course` | 3 | T1, T2 and T3 only; each has name, description, URL, provider and course code |
| `Service` | 2 | C1 Consulting and I1 Implementation only; each has name, description, URL, provider, service type and area served |
| `FAQPage` | 1 | Built from the same `faqs` array as the ten visible `<details>` entries |
| `BreadcrumbList` | 1 | Home → Services |

There is no `Product` schema and no offer/price object on this page. The verifier checks exact schema type counts, each T1–I1 node against the visible `SERVICE_OFFERS` contract, ItemList order, one FAQPage only, JSON parsing, and visible FAQ count = schema FAQ count (`10 = 10`).

## Redirect and compatibility inventory

Deploy output and Astro static fallback pages agree on these permanent destinations:

| Legacy route | Permanent destination |
| --- | --- |
| `/services/ai-workshop` | `/services#inhouse-a` |
| `/services/ai-workshop-followup` | `/services#inhouse-a` |
| `/services/ai-workshop-advance` | `/services#sales-report` |
| `/services/paid-audit` | `/services#offer-c1` |
| `/services/package-a` | `/services#offer-c1` |
| `/services/sales-system-sprint` | `/services#offer-c1` |
| `/services/sale-training-bundle` | `/services#offer-t1` |
| `/services/trust-content-tiktok-workshop` | `/services#trust-content` |

`dist/_redirects` contains each entry with status `301`. Astro also builds a fallback redirect HTML file for every route with the same destination, so these entry points do not rely on a single hosting layer and do not become 404s.

Legacy hash compatibility remains on the canonical page for `inhouse-a`, `inhouse-b`, `back-office`, `package-a`, and `daruma-transformation`, in addition to the previously retained `sales-report`, `trust-content`, `daruma-starter`, `sales-team-structure`, and `ai-agent-ceo` anchors. Paid Audit is handled as a route redirect instead of a canonical-page anchor so the retired name does not remain in page output.

The sitemap includes `https://punnattapatch.com/services` exactly once and excludes all eight redirect-only legacy URLs.

## Retired-term search

An independent scan of fresh `dist/services.html` produced:

```json
{
  "Package A": 0,
  "Paid Audit": 0,
  "AI Transformation": 0,
  "retired Package A price": 0
}
```

The retired price is resolved at verification time with `fmtPrice('package-a')`, so the verifier does not duplicate a price literal outside the pricing SSOT. The fresh value checked was `฿59,900`.

## TDD evidence

### RED 1 — metadata/schema contract

The new built-output assertions were added before production edits.

```text
$ pnpm verify:services -- --build-output
AssertionError [ERR_ASSERTION]: services title must match the approved title exactly once
```

The failure showed the old rendered title, proving the new metadata contract was absent.

### GREEN 1

After implementing exact metadata, catalog schema, redirects, anchors and sitemap filtering, the build completed. The verifier then exposed one overly strict test assumption: Astro preserves imported OG metadata as a hashed PNG rather than the card renderer's WebP output. The assertion was corrected to verify the T2 source identity and hashed PNG contract, not a codec that the page does not promise. The focused verifier passed.

### RED 2 — static redirect fallback

The verifier was extended to inspect every generated redirect page as well as `dist/_redirects`.

```text
AssertionError [ERR_ASSERTION]: /services/ai-workshop-followup static fallback must redirect to /services#inhouse-a
```

The old fallback still chained through `/services/ai-workshop`; route source and config were updated to the final destination.

### RED 3 — retired Paid Audit positioning

A strict retired-term assertion was added before replacing the compatibility anchor.

```text
AssertionError [ERR_ASSERTION]: retired public positioning must not appear in services output
```

The failure was caused by `id="paid-audit"`. It was replaced with the permanent `/services/paid-audit → /services#offer-c1` route and sitemap exclusion.

## Fresh verification

```text
$ pnpm build
[build] 84 page(s) built
[build] Complete!

$ pnpm verify:services -- --build-output
services vnext data contract passed

$ node --test tests/services-strategy.test.mjs tests/services-vnext.spec.ts
tests 7 · pass 7 · fail 0

$ git diff --check
(no output)
```

The independent evidence parser reported one parsed JSON-LD block, the schema inventory above, FAQ parity `10 = 10`, canonical sitemap count `1`, zero retired-term/price hits, and all eight permanent redirects. The build retains the repository's pre-existing warnings about deprecated Astro markdown configuration, the empty `src/content/framework` glob, and unresolved `%23n`; Phase 6 adds no new build warning.
