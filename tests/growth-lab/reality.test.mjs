// Funnel Lab "ของจริง": tiers, compact summary, Spearman + bootstrap, honest verdicts, outcome metrics.
import test from 'node:test';
import assert from 'node:assert/strict';

import { bootstrapInterval, measure, measureVerdict, outcomesFor, personaTier, spearman, summarizeEvaluation } from '../../src/scripts/growth-lab/reality.mjs';

const pack = { personas: [
  { id: 'buy-dealer-owner', segment: 'ลูกค้าจริง' }, { id: 'near-hotel-owner', segment: 'ใกล้ซื้อ' },
  { id: 'warm-solo-seller', segment: 'สนใจ' }, { id: 'off-freebie', segment: 'ไม่ใช่กลุ่ม' },
] };
const result = (personaId, score, decision) => ({ personaId, score, decision, confidence: 0.7, componentScores: { hook: score, offer: score, copy: score, visual: score }, reaction: 'r', friction: 'f', improvement: 'i' });
const evaluation = { engine: 'codex-media', stopRate: 50, averageScore: 60, verdict: 'ITERATE', weakestComponent: 'offer', componentScores: { hook: 70, offer: 50, copy: 60, visual: 60 },
  personaResults: [result('buy-dealer-owner', 80, 'STOP'), result('near-hotel-owner', 70, 'WATCH'), result('warm-solo-seller', 50, 'SCROLL'), result('off-freebie', 40, 'SCROLL')] };

test('tier comes from the persona id prefix; generic packs have none', () => {
  assert.equal(personaTier({ id: 'buy-x' }), 'buy');
  assert.equal(personaTier({ id: 'off-x' }), 'off');
  assert.equal(personaTier({ id: 'owner-founder' }), null);
});

test('summary: ICP = paid + near, fit gap against non-buyers, every seat kept compactly', () => {
  const summary = summarizeEvaluation(evaluation, pack);
  assert.equal(summary.icpScore, 75);
  assert.equal(summary.icpStop, 50);
  assert.equal(summary.offScore, 40);
  assert.equal(summary.fitGap, 35);
  assert.deepEqual(summary.personaScores['near-hotel-owner'], [70, 'W']);
  assert.deepEqual(summary.personaScores['off-freebie'], [40, 'X']);
  assert.deepEqual(summary.personaScores['buy-dealer-owner'], [80, 'S']);
  assert.equal(summary.tiers.warm.n, 1);
  assert.equal(summary.top[0], 'buy-dealer-owner');
  const generic = summarizeEvaluation(evaluation, { personas: [{ id: 'a' }] });
  assert.equal(generic.icpScore, null, 'a pack without tiers reports no fit numbers');
});

test('spearman handles ties and perfect orders', () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1);
  assert.equal(spearman([1, 2, 3, 4], [40, 30, 20, 10]), -1);
  assert.ok(Math.abs(spearman([1, 1, 2, 3], [5, 5, 6, 7]) - 1) < 1e-9);
  assert.equal(spearman([1, 2], [1, 2]), null, 'too few pairs');
  assert.equal(spearman([1, 1, 1], [1, 2, 3]), null, 'no spread');
});

test('bootstrap interval is deterministic and brackets the estimate', () => {
  const xs = Array.from({ length: 40 }, (_, index) => index);
  const ys = xs.map((x) => x + ((x * 7) % 11) * 3);
  const first = bootstrapInterval(xs, ys);
  assert.deepEqual(bootstrapInterval(xs, ys), first);
  const rho = spearman(xs, ys);
  assert.ok(first.low <= rho && rho <= first.high);
});

test('verdicts never overclaim on small samples', () => {
  assert.equal(measureVerdict({ rho: 0.9, interval: { low: 0.5, high: 0.99 }, n: 5 }).key, 'too-few');
  assert.equal(measureVerdict({ rho: 0.45, interval: { low: 0.2, high: 0.6 }, n: 60 }).key, 'predictive');
  assert.equal(measureVerdict({ rho: 0.15, interval: { low: 0.02, high: 0.3 }, n: 120 }).key, 'weak');
  assert.equal(measureVerdict({ rho: 0.2, interval: { low: -0.1, high: 0.45 }, n: 30 }).key, 'none');
});

test('outcomes: rates per view for organic, CRM-backed rate for ads', () => {
  const logViews = outcomesFor('tiktok').find((outcome) => outcome.key === 'logViews');
  const saveRate = outcomesFor('tiktok').find((outcome) => outcome.key === 'saveRate');
  assert.equal(logViews.get({ views: 1000 }), 3);
  assert.equal(saveRate.get({ views: 1000, saves: 25 }), 2.5);
  assert.equal(saveRate.get({ views: 0, saves: 3 }), null);
  const talked = outcomesFor('meta').find((outcome) => outcome.key === 'crmTalkedPer1k');
  assert.equal(talked.get({ impressions: 10_000 }, { crm_leads: 15, talked: 4 }), 0.4);
  assert.equal(talked.get({ impressions: 10_000 }, {}), null, 'no CRM link → not counted as zero');
});

test('measure pairs the predictor with each outcome and skips signals without numbers', () => {
  const signals = Array.from({ length: 30 }, (_, index) => ({ eval_summary: { icpScore: index }, metrics: { views: 100 * (index + 1), saves: index, shares: 1, comments: 0 } }));
  signals.push({ eval_summary: null, metrics: { views: 5 } });
  const rows = measure(signals, 'tiktok');
  const views = rows.find((row) => row.key === 'logViews');
  assert.equal(views.n, 30);
  assert.equal(views.rho, 1);
  assert.equal(views.verdict.key, 'predictive');
});

test('relative views compare a clip with its own account neighbours, not with other accounts', async () => {
  const { withRelativeViews } = await import('../../src/scripts/growth-lab/reality.mjs');
  const day = (n) => `2026-0${n < 10 ? 1 : 2}-${String((n % 9) + 10)}T00:00:00Z`;
  const small = Array.from({ length: 8 }, (_, index) => ({ platform: 'tiktok', owner: 'small', published_at: day(index), metrics: { views: index === 4 ? 4000 : 1000 } }));
  const big = Array.from({ length: 8 }, (_, index) => ({ platform: 'tiktok', owner: 'big', published_at: day(index), metrics: { views: 100000 } }));
  const out = withRelativeViews([...small, ...big]);
  assert.equal(out[4].metrics.relViews, 4, 'the standout of a small account is 4× its neighbours');
  assert.equal(out[8].metrics.relViews, 1, 'a big account is not "better" just for being big');
  assert.equal(withRelativeViews([{ platform: 'tiktok', owner: 'x', published_at: day(1), metrics: { views: 10 } }])[0].metrics.relViews, undefined, 'too few neighbours → no ratio');
});

test('persona stop share and funnel rows', async () => {
  const { personaStopShare, funnelRows } = await import('../../src/scripts/growth-lab/reality.mjs');
  const signals = [{ eval_summary: { personaScores: { a: [80, 'S'], b: [40, 'X'] } } }, { eval_summary: { personaScores: { a: [60, 'W'], b: [70, 'S'] } } }, { eval_summary: null }];
  const share = personaStopShare(signals, ['a', 'b', 'c']);
  assert.deepEqual(share.a, { n: 2, stop: 50, score: 70 });
  assert.equal(share.c, null);
  const rows = funnelRows([{ channel: 'tiktok', leads: 34, talked: 7, proposed: 3, won: 2 }, { channel: 'line_oa', leads: 61, talked: 2, proposed: 1, won: 0 }]);
  assert.equal(rows[0].channel, 'tiktok', 'channels that close come first');
  assert.equal(rows[0].closeRate, 5.9);
  assert.equal(rows[1].talkRate, 3.3);
});

test('rows without an owner never get a ratio across different accounts', async () => {
  const { withRelativeViews } = await import('../../src/scripts/growth-lab/reality.mjs');
  const anonymous = Array.from({ length: 6 }, (_, index) => ({ platform: 'instagram', owner: '', published_at: `2026-03-1${index}T00:00:00Z`, metrics: { views: 100 * (index + 1) } }));
  assert.ok(withRelativeViews(anonymous).every((signal) => signal.metrics.relViews === undefined));
});
