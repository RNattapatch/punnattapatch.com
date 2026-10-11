import test from 'node:test';
import assert from 'node:assert/strict';

import { calibrate, calculateMetrics, validateActual } from '../../src/scripts/growth-lab/metrics.mjs';
import { isSameComparisonGroup, rankVariants } from '../../src/scripts/growth-lab/compare.mjs';
import { applyCsvRecords, parseCsv, toCsv } from '../../src/scripts/growth-lab/csv.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';
import { updateCreativeDraft, validateState } from '../../src/scripts/growth-lab/storage.mjs';
import { isSafeId } from '../../src/scripts/growth-lab/ids.mjs';

const actual = {
  creativeId: 'creative-a',
  date: '2026-10-10',
  spend: 5000,
  impressions: 100000,
  clicks: 2000,
  landingViews: 1600,
  leads: 100,
  qualifiedLeads: 25,
  purchases: 10,
  revenue: 20000,
};

test('calculateMetrics returns hand-checked Meta funnel metrics', () => {
  assert.deepEqual(calculateMetrics(actual), {
    cpm: 50,
    ctr: 2,
    cpc: 2.5,
    lpvRate: 80,
    cvr: 6.25,
    cpl: 50,
    cpql: 200,
    cpa: 500,
    roas: 4,
  });
});

test('calculateMetrics returns null for every zero denominator', () => {
  const metrics = calculateMetrics({
    ...actual,
    spend: 0,
    impressions: 0,
    clicks: 0,
    landingViews: 0,
    leads: 0,
    qualifiedLeads: 0,
    purchases: 0,
    revenue: 0,
  });
  assert.deepEqual(metrics, {
    cpm: null,
    ctr: null,
    cpc: null,
    lpvRate: null,
    cvr: null,
    cpl: null,
    cpql: null,
    cpa: null,
    roas: null,
  });
  assert.ok(Object.values(metrics).every((value) => value === null));
});

test('validateActual rejects negatives and impossible funnel counts by field', () => {
  const result = validateActual({
    ...actual,
    spend: -1,
    impressions: 100,
    clicks: 101,
    landingViews: 102,
    leads: 103,
    qualifiedLeads: 104,
    purchases: 105,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.spend.includes('ติดลบ'));
  assert.ok(result.errors.clicks.includes('impressions'));
  assert.ok(result.errors.landingViews.includes('clicks'));
  assert.ok(result.errors.qualifiedLeads.includes('leads'));
  assert.ok(result.errors.purchases.includes('qualifiedLeads'));
});

test('validateActual requires a real ISO calendar date', () => {
  assert.equal(validateActual({ ...actual, date: '' }).valid, false);
  assert.equal(validateActual({ ...actual, date: '2026-02-30' }).valid, false);
  assert.equal(validateActual(actual).valid, true);
});

test('rankVariants resolves ties by average score then objective component', () => {
  const variants = [
    { id: 'b', objective: 'leads', evaluation: { stopRate: 70, averageScore: 72, componentScores: { offer: 88 } } },
    { id: 'c', objective: 'leads', evaluation: { stopRate: 70, averageScore: 74, componentScores: { offer: 65 } } },
    { id: 'a', objective: 'leads', evaluation: { stopRate: 70, averageScore: 72, componentScores: { offer: 91 } } },
  ];

  assert.deepEqual(rankVariants(variants).map((item) => item.id), ['c', 'a', 'b']);
});

test('CSV parser keeps quoted commas, imports valid rows, and reports invalid row numbers', () => {
  const csv = [
    'ad_name,creative_id,date,amount_spent,impressions,link_clicks,landing_page_views,leads,qualified_leads,purchases,purchase_value',
    '"Owner, proof angle",creative-a,2026-10-10,5000,100000,2000,1600,100,25,10,20000',
    'Broken row,creative-b,2026-10-10,-100,1000,1200,900,50,10,2,3000',
  ].join('\n');
  const result = parseCsv(csv);

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].name, 'Owner, proof angle');
  assert.equal(result.records[0].actual.creativeId, 'creative-a');
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].row, 3);
  assert.ok(result.errors[0].reasons.some((reason) => reason.includes('spend')));
});

test('CSV export round-trips commas, quotes, evaluation summary, and calculated metrics', () => {
  const rows = [{
    creative: { id: 'creative-a', campaign: 'Q4, Growth', name: 'Hook "A"', objective: 'leads', changedVariable: 'hook' },
    evaluation: { verdict: 'SCALE', stopRate: 73.3, averageScore: 78, weakestComponent: 'copy' },
    actual,
  }];
  const output = toCsv(rows);
  const parsed = parseCsv(output);

  assert.ok(output.includes('"Q4, Growth"'));
  assert.ok(output.includes('"Hook ""A"""'));
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].actual.creativeId, 'creative-a');
});

test('CSV rejects missing required columns, blank numbers, and duplicate creative ids', () => {
  const missing = parseCsv('creative_id,date,spend\ncreative-a,2026-10-10,100');
  assert.equal(missing.records.length, 0);
  assert.ok(missing.errors[0].reasons.some((reason) => reason.includes('header')));

  const header = 'creative_id,date,spend,impressions,clicks,landing_views,leads,qualified_leads,purchases,revenue';
  const rows = parseCsv([header,
    'creative-a,2026-10-10,100,1000,20,15,2,1,1,300',
    'creative-a,2026-10-11,120,1200,24,18,3,1,1,350',
    'creative-b,2026-10-11,,1200,24,18,3,1,1,350',
  ].join('\n'));
  assert.equal(rows.records.length, 1);
  assert.equal(rows.errors.length, 2);
  assert.equal(rows.errors[0].row, 3);
  assert.equal(rows.errors[1].row, 4);
});

test('CSV applies unknown creatives explicitly and neutralizes spreadsheet formulas', () => {
  const seeded = seedState();
  const record = {
    row: 2,
    name: '=WEBSERVICE("bad")',
    campaign: '+Malicious',
    objective: 'leads',
    changedVariable: 'hook',
    actual: { ...actual, creativeId: 'creative-imported' },
    evaluation: {},
  };
  const applied = applyCsvRecords(seeded, [record]);
  assert.equal(applied.applied, 1);
  assert.ok(applied.state.creatives.some((creative) => creative.id === 'creative-imported'));
  assert.equal(applied.state.actuals['creative-imported'].spend, 5000);
  const imported = applied.state.creatives.find((creative) => creative.id === 'creative-imported');
  const pack = applied.state.personaPacks.find((item) => item.id === imported.personaPackId);
  assert.equal(imported.businessModel, pack.businessModel);
  assert.equal(imported.touchpointType, 'meta-ad');
  assert.equal(imported.channel, 'meta');
  assert.ok(pack.journeyStages.some((stage) => stage.id === imported.journeyStage));
  assert.equal(validateState(applied.state).recovered, false);

  const csv = toCsv([{ creative: { id: 'x', name: '=2+2', campaign: '@cmd' }, actual }]);
  assert.ok(csv.includes("'=2+2"));
  assert.ok(csv.includes("'@cmd"));
});

test('comparison groups require the same experiment context', () => {
  const base = seedState().creatives[0];
  assert.equal(isSameComparisonGroup(base, { ...base, id: 'variant-b', hook: 'new' }), true);
  for (const [field, value] of [
    ['campaign', 'another-campaign'],
    ['personaPackId', 'another-pack'], ['businessModel', 'b2c'], ['touchpointType', 'promotion'],
    ['channel', 'line-oa'], ['journeyStage', 'consideration'], ['objective', 'sales'],
  ]) assert.equal(isSameComparisonGroup(base, { ...base, id: `changed-${field}`, [field]: value }), false, field);
});

test('validateState preserves valid state and recovers malformed payload to seed data', () => {
  const seeded = seedState();
  const valid = validateState(seeded);
  const recovered = validateState({ schemaVersion: 99, creatives: 'broken' });

  assert.equal(valid.recovered, false);
  assert.equal(valid.state.creatives.length, 2);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.state.schemaVersion, 2);
  assert.equal(recovered.state.creatives.length, 2);
  assert.ok(recovered.notice.includes('workspace ตัวอย่าง'));
});

test('state validation migrates a schema version 1 backup and accepts all Growth Journey Lab views', () => {
  const current = seedState();
  const legacy = {
    schemaVersion: 1,
    selectedCreativeId: current.selectedCreativeId,
    activeView: 'personas',
    creatives: current.creatives.map(({ touchpointType, channel, businessModel, journeyStage, personaPackId, ...creative }) => creative),
    evaluations: current.evaluations,
    actuals: current.actuals,
    notices: [],
  };
  const migrated = validateState(legacy);
  assert.equal(migrated.recovered, false);
  assert.equal(migrated.state.schemaVersion, 2);
  assert.equal(migrated.state.creatives[0].touchpointType, 'meta-ad');

  for (const activeView of ['workbench', 'compare', 'journey', 'results', 'personas', 'settings']) {
    const candidate = structuredClone(migrated.state);
    candidate.activeView = activeView;
    assert.equal(validateState(candidate).recovered, false, activeView);
  }
});

test('state validation drops only the malformed evaluation and draft updates invalidate stale scores', () => {
  const seeded = seedState();
  const corrupted = structuredClone(seeded);
  corrupted.evaluations['creative-a'].personaResults = 'not-an-array';
  const repaired = validateState(corrupted);
  assert.equal(repaired.recovered, false);
  assert.equal(repaired.repaired, 1);
  assert.equal(repaired.state.evaluations['creative-a'], undefined);
  assert.ok(repaired.state.evaluations['creative-b'], 'healthy evaluation survives');
  assert.equal(repaired.state.creatives.length, 2);
  assert.ok(repaired.notice.includes('ยังอยู่ครบ'));

  const edited = updateCreativeDraft(seeded, { ...seeded.creatives[0], hook: 'new hook' });
  assert.equal(edited.creatives[0].hook, 'new hook');
  assert.equal(edited.evaluations['creative-a'], undefined);
});

test('state validation repairs cross-entity model/stage drift and drops foreign or stale evaluations', () => {
  const seeded = seedState();
  const creativeId = seeded.creatives[0].id;
  const pack = seeded.personaPacks.find((item) => item.id === seeded.creatives[0].personaPackId);
  for (const mutate of [
    (copy) => { copy.creatives[0].businessModel = 'b2c'; },
    (copy) => { copy.creatives[0].journeyStage = 'not-in-pack'; },
  ]) {
    const corrupted = structuredClone(seeded);
    mutate(corrupted);
    const result = validateState(corrupted);
    assert.equal(result.recovered, false);
    assert.equal(result.state.creatives[0].businessModel, pack.businessModel);
    assert.ok(pack.journeyStages.some((stage) => stage.id === result.state.creatives[0].journeyStage));
  }
  for (const mutate of [
    (copy) => { copy.evaluations[creativeId].personaResults[0].personaId = 'foreign-persona'; },
    (copy) => { copy.evaluations[creativeId].personaPackRevision = 'stale-pack'; },
  ]) {
    const corrupted = structuredClone(seeded);
    mutate(corrupted);
    const result = validateState(corrupted);
    assert.equal(result.recovered, false);
    assert.equal(result.state.evaluations[creativeId], undefined);
    assert.equal(result.state.creatives.length, 2);
  }
});

test('creative ids reject prototype collisions in state and CSV paths', () => {
  assert.equal(isSafeId('creative-123_ok'), true);
  assert.equal(isSafeId('__proto__'), false);
  assert.equal(isSafeId('constructor'), false);
  const seeded = seedState();
  seeded.creatives[0].id = 'toString';
  seeded.selectedCreativeId = 'toString';
  const result = validateState(seeded);
  assert.ok(result.state.creatives.every((creative) => isSafeId(creative.id)));
  assert.ok(!result.state.creatives.some((creative) => creative.id === 'toString'));
  assert.ok(isSafeId(result.state.selectedCreativeId));

  const header = 'creative_id,date,spend,impressions,clicks,landing_views,leads,qualified_leads,purchases,revenue';
  const parsed = parseCsv(`${header}\n__proto__,2026-10-10,100,1000,20,15,2,1,1,300`);
  assert.equal(parsed.records.length, 0);
  assert.ok(parsed.errors[0].reasons.some((reason) => reason.includes('creativeId')));
});

test('calibration labels optimistic and conservative prediction bias', () => {
  const strongActual = { ...actual, spend: 2000, revenue: 30000, leads: 150, qualifiedLeads: 60, purchases: 20 };
  const weakActual = { ...actual, spend: 10000, revenue: 1000, clicks: 400, landingViews: 250, leads: 8, qualifiedLeads: 2, purchases: 1 };

  const underestimated = calibrate({ averageScore: 35 }, strongActual, 'leads');
  const overestimated = calibrate({ averageScore: 90 }, weakActual, 'leads');

  assert.equal(underestimated.bias, 'underestimated');
  assert.equal(overestimated.bias, 'overestimated');
  assert.ok(underestimated.actualScore > underestimated.predictedScore);
  assert.ok(overestimated.actualScore < overestimated.predictedScore);
});
