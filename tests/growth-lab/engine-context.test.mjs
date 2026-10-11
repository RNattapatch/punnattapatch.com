// Regression tests for the 2026-10-11 QC findings: the Local engine used to ignore channel, touchpoint,
// journey stage and business model (identical scores for Meta Ad vs SMS vs Sales call; a strong B2C
// promotion scored KILL and *improved* when B2B words were pasted in), stamped every evaluation 1970,
// gave every persona the same reason, and wiped the whole workspace when one stored result went stale.
import test from 'node:test';
import assert from 'node:assert/strict';

import { countWords, extractFeatures } from '../../src/scripts/growth-lab/features.mjs';
import { evaluateCreative } from '../../src/scripts/growth-lab/engine-local.mjs';
import { predictJourney } from '../../src/scripts/growth-lab/journey.mjs';
import { BUILT_IN_PACKS } from '../../src/scripts/growth-lab/persona-packs.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';
import { loadState, readRecovery, STORAGE_KEY } from '../../src/scripts/growth-lab/storage.mjs';

const NOW = '2026-10-11T09:00:00.000Z';
const [B2B, B2C, B2G] = ['b2b', 'b2c', 'b2g'].map((model) => BUILT_IN_PACKS.find((pack) => pack.businessModel === model));
const seedCreative = seedState().creatives[0];

const b2cPromo = {
  ...seedCreative,
  id: 'b2c-promo',
  personaPackId: B2C.id,
  businessModel: 'b2c',
  journeyStage: 'awareness',
  touchpointType: 'promotion',
  channel: 'line-oa',
  hook: 'ผิวแห้งลอกช่วงหน้าหนาว? เซรั่มสูตรใหม่ชุ่มชื่นใน 7 วัน',
  primaryText: 'รีวิวจากลูกค้าจริง 2,000 คน ผิวนุ่มขึ้นตั้งแต่ครั้งแรก ส่งฟรีทั่วประเทศ',
  headline: 'ซื้อ 1 แถม 1 ถึงสิ้นเดือน',
  offer: 'ซื้อ 1 แถม 1 + ส่งฟรี เหลือ 590 บาท รับประกันคืนเงินใน 30 วัน',
  cta: 'สั่งซื้อทาง LINE',
  visualDirection: 'ภาพก่อน-หลังผิวจริง คนจริงถือสินค้า',
};

const b2gProposal = {
  ...seedCreative,
  id: 'b2g-proposal',
  personaPackId: B2G.id,
  businessModel: 'b2g',
  journeyStage: 'requirement-fit',
  touchpointType: 'sales-outreach',
  channel: 'email',
  hook: 'เทศบาลที่คิวรับเรื่องร้องเรียนยาวเกิน 7 วัน',
  primaryText: 'ระบบรับเรื่องที่ผ่านมาตรฐาน ISO 27001 และ PDPA ใช้แล้วใน 12 หน่วยงาน ลดเวลารอเฉลี่ย 60% ตรวจสอบย้อนหลังได้ทุกขั้นตอน',
  headline: 'ลดเวลารอเรื่องร้องเรียนของประชาชน 60%',
  offer: 'requirement matrix เทียบ TOR + benchmark จากหน่วยงานที่ใช้จริง ภายใน 14 วัน',
  cta: 'ขอเอกสาร requirement matrix',
  visualDirection: 'ตารางเทียบก่อน-หลัง หน้าจอระบบจริง',
};

const run = (creative, pack) => evaluateCreative(creative, pack.personas, pack, { now: NOW });

test('channel and touchpoint change the Local score (no more identical results across channels)', () => {
  const results = [['meta-ad', 'meta'], ['line-oa', 'line-oa'], ['sales-outreach', 'sales-call'], ['promotion', 'sms']]
    .map(([touchpointType, channel]) => run({ ...seedCreative, touchpointType, channel }, B2B));
  assert.equal(new Set(results.map((result) => JSON.stringify(result.componentScores))).size, results.length);
  // SMS and sales calls have no visual — the 4th component scores delivery, and a 300-char SMS is penalised.
  const sms = results[3];
  assert.ok(sms.componentScores.copy < results[0].componentScores.copy, 'long copy over the SMS budget scores lower');
});

test('a strong B2C promotion passes with the B2C lexicon and B2B words do not raise its score', () => {
  const strong = run(b2cPromo, B2C);
  const vague = run({ ...b2cPromo, hook: 'สินค้าระดับโลก ดีที่สุด', primaryText: 'นวัตกรรมเปลี่ยนชีวิต', headline: 'ใหม่', offer: 'ลองเลย', cta: 'คลิก', visualDirection: 'สวยๆ' }, B2C);
  const b2bWords = run({ ...b2cPromo, hook: `เจ้าของ SME ฝ่ายขาย B2B โรงงาน: ${b2cPromo.hook}` }, B2C);
  assert.ok(strong.stopRate >= 50, `strong B2C promo should stop most of the panel (got ${strong.stopRate}%)`);
  assert.notEqual(strong.verdict, 'KILL');
  assert.equal(vague.verdict, 'KILL');
  assert.ok(strong.averageScore > vague.averageScore + 30);
  assert.ok(b2bWords.averageScore <= strong.averageScore, 'B2B vocabulary must not help a consumer message');
});

test('B2G evaluation rewards public-sector evidence over B2B owner copy', () => {
  const fit = run(b2gProposal, B2G);
  const b2bCopy = run({ ...seedCreative, id: 'b2b-on-b2g', personaPackId: B2G.id, businessModel: 'b2g', journeyStage: 'requirement-fit' }, B2G);
  assert.ok(fit.stopRate > b2bCopy.stopRate);
  assert.ok(fit.componentScores.hook > b2bCopy.componentScores.hook + 20);
});

test('late-stage touchpoints are judged on proof: removing evidence lowers the offer score', () => {
  const late = { ...seedCreative, journeyStage: 'procurement' };
  const withProof = run(late, B2B);
  const withoutProof = run({ ...late, primaryText: 'เวิร์กช็อปที่ปรึกษาลงมือทำที่ออฟฟิศ 1 วัน', offer: 'วินิจฉัย workflow + สร้าง prototype หน้างาน' }, B2B);
  assert.ok(withoutProof.componentScores.offer < withProof.componentScores.offer);
});

test('reactions are persona-specific, channel-worded, and SCROLL never claims a strength as its reason', () => {
  const result = run(b2cPromo, B2C);
  assert.ok(new Set(result.personaResults.map((item) => item.reaction)).size > 1, 'personas give different reasons');
  assert.ok(result.personaResults.some((item) => item.reaction.includes('เปิดอ่าน')), 'LINE OA wording, not ad wording');
  const vague = run({ ...b2cPromo, hook: 'ดีที่สุด', primaryText: 'นวัตกรรม', headline: 'ใหม่', offer: 'ลอง', cta: 'คลิก', visualDirection: '' }, B2C);
  for (const item of vague.personaResults.filter((entry) => entry.decision === 'SCROLL')) {
    assert.match(item.reaction, /อ่านผ่านไม่กด เพราะ/u);
  }
});

test('evaluations and journeys record the real time, not 1970', () => {
  const evaluation = evaluateCreative(b2cPromo, B2C.personas, B2C);
  const journey = predictJourney(b2cPromo, B2C.personas, evaluation, B2C);
  assert.ok(new Date(evaluation.evaluatedAt).getFullYear() >= 2026);
  assert.ok(new Date(journey.generatedAt).getFullYear() >= 2026);
});

test('journey starts at the touchpoint stage: earlier stages are passed, bottleneck is downstream', () => {
  const evaluation = run(b2gProposal, B2G);
  const forecast = predictJourney(b2gProposal, B2G.personas, evaluation, B2G, { now: NOW });
  const intended = B2G.journeyStages.findIndex((stage) => stage.id === b2gProposal.journeyStage);
  assert.ok(intended > 0);
  for (const stage of forecast.stageForecasts.slice(0, intended)) {
    assert.equal(stage.probability, 100);
    assert.equal(stage.dropOff, 0);
  }
  const bottleneckIndex = B2G.journeyStages.findIndex((stage) => stage.id === forecast.strategy.bottleneckStage);
  assert.ok(bottleneckIndex >= intended);
  assert.ok(forecast.personaPaths.every((path) => B2G.journeyStages.findIndex((stage) => stage.id === path.bottleneckStage) >= intended));
});

test('channel changes the downstream journey', () => {
  const late = { ...seedCreative, journeyStage: 'proposal' };
  const viaMeta = predictJourney(late, B2B.personas, run(late, B2B), B2B, { now: NOW });
  const viaCall = predictJourney({ ...late, channel: 'sales-call' }, B2B.personas, run(late, B2B), B2B, { now: NOW });
  assert.notDeepEqual(viaMeta.stageForecasts.map((stage) => stage.probability), viaCall.stageForecasts.map((stage) => stage.probability));
  assert.ok(viaCall.stageForecasts.at(-1).probability > viaMeta.stageForecasts.at(-1).probability, 'a sales call moves late-stage buyers better than an ad');
});

test('personas get stuck at different stages that match their own weak spot', () => {
  const creative = { ...seedCreative, journeyStage: 'awareness' };
  const forecast = predictJourney(creative, B2B.personas, run(creative, B2B), B2B, { now: NOW });
  const stages = new Set(forecast.personaPaths.map((path) => path.bottleneckStage));
  assert.ok(stages.size >= 3, `expected varied bottlenecks, got ${[...stages].join(', ')}`);
  assert.ok(!stages.has('awareness'), 'the touchpoint stage itself is not reported as the bottleneck');
  const b2c = { ...b2cPromo, journeyStage: 'awareness' };
  const b2cForecast = predictJourney(b2c, B2C.personas, run(b2c, B2C), B2C, { now: NOW });
  const dealSeeker = b2cForecast.personaPaths.find((path) => path.personaId === 'b2c-deal-seeker');
  const reviewer = b2cForecast.personaPaths.find((path) => path.personaId === 'b2c-reviewer');
  assert.notEqual(dealSeeker.bottleneckStage, reviewer.bottleneckStage, 'price hunter and review reader drop at different stages');
});

test('custom packs with more stages than the playbook still forecast (no crash)', () => {
  const pack = structuredClone(B2B);
  pack.id = 'custom-10-stage';
  pack.journeyStages = Array.from({ length: 10 }, (_, index) => ({ id: `stage-${index}`, label: `Stage ${index + 1}` }));
  const creative = { ...seedCreative, personaPackId: pack.id, journeyStage: 'stage-0' };
  const forecast = predictJourney(creative, pack.personas, run(creative, pack), pack, { now: NOW });
  assert.equal(forecast.stageForecasts.length, 10);
  assert.ok(forecast.stageForecasts.every((stage) => stage.nextBestAction.length > 4));
});

test('Thai text is counted as words and Thai price/date notation is recognised', () => {
  assert.ok(countWords('ลดเวลาตามงานขายแปดชั่วโมงต่อสัปดาห์') >= 5);
  const features = extractFeatures({ hook: 'เซรั่ม 1 แถม 1', primaryText: '', headline: '590.- ถึง 31 ต.ค.', offer: 'ส่งฟรี', cta: 'กดลิงก์', visualDirection: '' }, 'b2c');
  assert.ok(features.priceValueSignals >= 2);
  assert.ok(features.urgencySignals >= 1);
  assert.ok(features.timeframeSignals >= 1);
});

test('an unreadable stored workspace is kept under a recovery key instead of being overwritten silently', () => {
  const store = new Map();
  const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
  storage.setItem(STORAGE_KEY, '{"schemaVersion":2,"creatives":"broken"');
  const result = loadState(storage);
  assert.equal(result.recovered, true);
  assert.equal(readRecovery(storage), '{"schemaVersion":2,"creatives":"broken"');
});
