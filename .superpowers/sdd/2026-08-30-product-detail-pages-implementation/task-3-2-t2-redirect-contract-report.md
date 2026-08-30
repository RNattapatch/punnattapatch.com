# Task 3.2 — T2 Redirect Contract Report

## Status

Implemented and committed the scoped T2 legacy redirect reconciliation.

## TDD evidence

### RED

After changing only the verifier expectation and running a fresh build:

```text
pnpm exec node scripts/verify-services-vnext.mjs --build-output
AssertionError: /services/trust-content-tiktok-workshop static fallback must redirect to /services/online-to-sales
actual: http-equiv="refresh" content="0;url=/services#trust-content"
```

### GREEN

After changing the single source mapping in `src/pages/services/[slug].astro` and rebuilding, the targeted redirect-contract check passed:

```text
redirect contract targeted check passed (8/8)
```

The targeted check confirms Cloudflare and static fallback mappings for all eight legacy routes, including the T2 route, and confirms that the other seven mappings are unchanged.

## Changed files

- `scripts/verify-services-vnext.mjs` — updated the one T2 verifier expectation to `/services/online-to-sales`.
- `src/pages/services/[slug].astro` — updated the one T2 static fallback destination to `/services/online-to-sales`.

`public/_redirects`, Catalog data, T1 content, and `output/` were not changed. Existing untracked `output/` remains preserved.

## Verification

| Command | Result |
| --- | --- |
| `pnpm build` | Passed; 87 pages built |
| `pnpm exec playwright test tests/product-details.spec.ts` | Passed; 4/4 |
| `pnpm exec playwright test tests/services-vnext.spec.ts` | Passed; 6/6 |
| `pnpm exec node scripts/verify-product-details.mjs` | Passed |
| `pnpm exec node scripts/verify-services-vnext.mjs --data-only` | Passed |
| `pnpm exec node scripts/check-prices.mjs` | Passed |
| `git diff --check` | Passed |
| targeted redirect-contract check | Passed; 8/8 |

## Concern

`pnpm exec node scripts/verify-services-vnext.mjs --build-output` still exits non-zero after the redirect fix because of unrelated baseline build-content violations:

- `services/online-to-sales.html` contains the Catalog regular price `฿59,900`, which is also the retired `package-a` amount.
- `services/t1-sales-skills.html` contains the pre-existing phrase `Agentic AI Transformation`.

Both are outside this brief's scope and were deliberately left unchanged.

## Commit

`9853df1 fix: align legacy T2 redirect fallback`
