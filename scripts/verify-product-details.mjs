import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDirectory = `${root}/src/data/product-details`;
const detailDirectory = `${root}/src/components/services/detail`;
const indexPath = `${dataDirectory}/index.ts`;
const typesPath = `${dataDirectory}/types.ts`;
const expectedProducts = [
  ['T2', '/services/online-to-sales', 'tiktok-workshop'],
  ['T1', '/services/t1-sales-skills', 'inhouse-a'],
  ['C1', '/services/daily-consulting', 'daily-sales-consulting'],
  ['I1', '/services/dashboard-build', 'daruma-starter'],
  ['T3', '/services/t3-sales-back-office', 'ai-workshop-advance'],
  ['T4', '/services/advance-ai-automation', 't4-ai-workflow-pilot-day'],
  ['P1', '/services/ai-sales-agent-bootcamp', 'public-p1-bootcamp'],
];
const requiredComponents = [
  'ProductDetailLayout.astro',
  'ProductHero.astro',
  'AuthoritySnapshot.astro',
  'ProofWall.astro',
  'PainChecklist.astro',
  'OfferBoundary.astro',
  'ReasonBlock.astro',
  'ScopeTimeline.astro',
  'TakeHomeStack.astro',
  'FitBlock.astro',
  'InstructorBio.astro',
  'InvestmentBlock.astro',
  'ProductFAQ.astro',
  'DetailLineCTA.astro',
];

function source(path) {
  assert.ok(existsSync(path), `missing required file: ${path.replace(`${root}/`, '')}`);
  return readFileSync(path, 'utf8');
}

function allFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? allFiles(path) : [path];
  });
}

const typesSource = source(typesPath);
const indexSource = source(indexPath);

assert.match(typesSource, /export type ProductDetailCode = 'T1' \| 'T2' \| 'T3' \| 'T4' \| 'C1' \| 'I1' \| 'P1';/, 'ProductDetailCode must cover exactly the seven public details');
assert.match(typesSource, /export interface ProductDetailPageData/, 'typed ProductDetailPageData contract is required');
for (const forbiddenField of ['h1', 'duration', 'price']) {
  assert.doesNotMatch(typesSource, new RegExp(`\\b${forbiddenField}\\s*:`), `${forbiddenField} must resolve from Catalog, not product data`);
}

for (const [code, route, pricingKey] of expectedProducts) {
  assert.match(indexSource, new RegExp(`\\b${code}\\s*:`), `missing ${code} in the product index`);
  assert.match(indexSource, new RegExp(route.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')), `missing canonical route for ${code}`);
  assert.match(indexSource, new RegExp(`['\"]${pricingKey}['\"]`), `missing pricing key for ${code}`);
}

for (const component of requiredComponents) {
  source(`${detailDirectory}/${component}`);
}

const productionDetailFiles = [
  ...allFiles(dataDirectory).filter((path) => path.endsWith('.ts')),
  ...allFiles(detailDirectory).filter((path) => path.endsWith('.astro')),
];
for (const path of productionDetailFiles) {
  assert.doesNotMatch(source(path), /฿\s*\d/, `hardcoded public price in ${path.replace(`${root}/`, '')}`);
}

console.log('product detail data contract passed');
