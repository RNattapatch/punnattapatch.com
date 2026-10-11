import { countPersonaKeywordMatches, extractFeatures, matchedPersonaTerms, resolveBusinessModel } from './features.mjs';

const COMPONENTS = Object.freeze(['hook', 'offer', 'copy', 'visual']);

// How each channel is consumed. hookMax/bodyMax are character budgets for what the recipient reads;
// weights shift attention between components; `delivery` channels have no visual, so the 4th component
// scores send timing / length / personalization instead (UI labels it "Delivery").
export const CHANNEL_PROFILES = Object.freeze({
  meta: Object.freeze({ hookMax: 125, bodyMax: 700, mode: 'visual', weights: { hook: 1.15, offer: 1, copy: 0.9, visual: 1.2 } }),
  'line-oa': Object.freeze({ hookMax: 60, bodyMax: 400, mode: 'visual', weights: { hook: 1.05, offer: 1.1, copy: 1.05, visual: 0.85 } }),
  email: Object.freeze({ hookMax: 90, bodyMax: 1800, mode: 'visual', subject: [20, 70], weights: { hook: 1.2, offer: 1, copy: 1.15, visual: 0.55 } }),
  sms: Object.freeze({ hookMax: 70, bodyMax: 140, mode: 'delivery', weights: { hook: 1.2, offer: 1.15, copy: 1, visual: 0.35 } }),
  'sales-call': Object.freeze({ hookMax: 120, bodyMax: 900, mode: 'delivery', weights: { hook: 1.1, offer: 1, copy: 1.25, visual: 0.35 } }),
  website: Object.freeze({ hookMax: 90, bodyMax: 1500, mode: 'visual', weights: { hook: 1.1, offer: 1.05, copy: 1.1, visual: 0.95 } }),
  offline: Object.freeze({ hookMax: 40, bodyMax: 250, mode: 'visual', weights: { hook: 1.2, offer: 1.1, copy: 0.7, visual: 1.25 } }),
});

const TOUCHPOINT_PROFILES = Object.freeze({
  'meta-ad': Object.freeze({ hook: 1.1, offer: 1, copy: 0.95, visual: 1.1 }),
  promotion: Object.freeze({ hook: 1, offer: 1.3, copy: 0.9, visual: 0.95 }),
  'line-oa': Object.freeze({ hook: 1, offer: 1.1, copy: 1.1, visual: 0.9 }),
  'sales-outreach': Object.freeze({ hook: 1.1, offer: 0.95, copy: 1.25, visual: 0.6 }),
});

// Early stages buy attention, late stages buy a decision.
const PHASE_WEIGHTS = Object.freeze({
  early: Object.freeze({ hook: 1.2, offer: 0.85, copy: 0.95, visual: 1.1 }),
  mid: Object.freeze({ hook: 1, offer: 1, copy: 1.15, visual: 0.95 }),
  late: Object.freeze({ hook: 0.8, offer: 1.25, copy: 1.1, visual: 0.85 }),
});

const LABELS = Object.freeze({
  audienceSpecificity: 'การเรียกกลุ่มเป้าหมายตรงตัว',
  numericProof: 'ตัวเลขที่จับต้องได้',
  painSignals: 'ปัญหาที่เขาเจออยู่จริง',
  outcomeSignals: 'ผลลัพธ์ที่เขาอยากได้',
  mechanismSignals: 'วิธีการที่ชัด',
  timeframeSignals: 'กรอบเวลา',
  evidenceSignals: 'หลักฐานรองรับ',
  visualProof: 'ภาพที่พิสูจน์ผล',
  priceValueSignals: 'ราคาและความคุ้มค่าที่ชัด',
  personalization: 'การพูดถึงเขาโดยเฉพาะ',
  vagueClaims: 'คำเคลมกว้างที่พิสูจน์ไม่ได้',
  jargonSignals: 'ศัพท์ที่ไม่บอกภาพจริง',
});

const COMPONENT_THAI = Object.freeze({ hook: 'Hook', offer: 'Offer', copy: 'Copy', visual: 'Visual' });
const DELIVERY_THAI = 'Delivery (จังหวะส่ง)';

// What "scroll past" means on each channel, so a persona's reaction reads like the real moment.
const CHANNEL_VERBS = Object.freeze({
  meta: { STOP: 'หยุดดู', WATCH: 'ชะงักแต่ยังลังเล', SCROLL: 'เลื่อนผ่าน' },
  'line-oa': { STOP: 'เปิดอ่านจนจบ', WATCH: 'เปิดดูแต่ยังไม่กด', SCROLL: 'อ่านผ่านไม่กด' },
  email: { STOP: 'เปิดอ่าน', WATCH: 'เปิดแต่อ่านไม่จบ', SCROLL: 'ไม่เปิด' },
  sms: { STOP: 'อ่านแล้วกด', WATCH: 'อ่านแต่ยังไม่กด', SCROLL: 'ลบทิ้ง' },
  'sales-call': { STOP: 'ยอมคุยต่อ', WATCH: 'ฟังแต่ขอข้อมูลก่อน', SCROLL: 'ขอวางสาย' },
  website: { STOP: 'อ่านต่อ', WATCH: 'ไล่ดูแต่ยังไม่กด', SCROLL: 'ออกจากหน้า' },
  offline: { STOP: 'หยุดดู', WATCH: 'มองแต่ไม่เข้าไป', SCROLL: 'เดินผ่าน' },
});

export function decisionVerbs(channel) {
  return CHANNEL_VERBS[channel] ?? CHANNEL_VERBS.meta;
}

export function componentLabel(component, channel) {
  return component === 'visual' && CHANNEL_PROFILES[channel]?.mode === 'delivery' ? DELIVERY_THAI : COMPONENT_THAI[component];
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

export function stagePhase(creative, pack) {
  const stages = pack?.journeyStages ?? [];
  const index = stages.findIndex((stage) => stage.id === creative.journeyStage);
  if (index < 0 || stages.length < 2) return 'early';
  const position = index / (stages.length - 1);
  return position < 0.34 ? 'early' : position < 0.67 ? 'mid' : 'late';
}

function lengthFit(chars, max) {
  if (!chars) return -15;
  if (chars <= max) return 5;
  if (chars <= max * 1.5) return 0;
  return -8;
}

function clarityLevel(chars, max) {
  if (!chars) return 0;
  if (chars <= max) return 3;
  if (chars <= max * 1.6) return 2;
  if (chars <= max * 2.5) return 1;
  return 0;
}

const HARD_SELL = /ซื้อเลย|โอนเลย|ชำระเงิน|สั่งซื้อเลย|buy now|pay now/iu;

function scoreComponents(features, creative, persona, context) {
  const { channel, profile, phase } = context;
  const relevance = Math.min(5, countPersonaKeywordMatches(creative, persona));
  const noEvidence = features.evidenceSignals === 0;
  const riskPenalty = persona.risk <= 2 && noEvidence ? 7 : 0;
  const pricePenalty = persona.priceSensitivity >= 4 && features.priceValueSignals === 0 ? 6 : 0;
  const urgencyPenalty = persona.urgency >= 4 && features.timeframeSignals === 0 && features.urgencySignals === 0 ? 4 : 0;
  const evidenceBonus = Math.min(10, features.evidenceSignals * (persona.evidenceNeed >= 4 ? 3 : 2));
  const proofGap = persona.evidenceNeed >= 4 && noEvidence && features.numericProof === 0 ? 5 : 0;

  let hook = 28 +
    Math.min(15, features.audienceSpecificity * 5) +
    Math.min(9, features.hookAudience * 9) +
    Math.min(14, features.numericProof * 3) +
    Math.min(12, features.painSignals * 4) +
    Math.min(10, features.outcomeSignals * 3) +
    relevance * 3 +
    lengthFit(features.hookChars, profile.hookMax) -
    features.vagueClaims * 9 -
    features.jargonSignals * 3;
  if (profile.subject) {
    const [min, max] = profile.subject;
    hook += features.headlineChars >= min && features.headlineChars <= max ? 4 : -4;
  }

  let offer = 28 +
    Math.min(20, features.mechanismSignals * 5) +
    Math.min(12, features.timeframeSignals * 4) +
    evidenceBonus +
    Math.min(12, features.priceValueSignals * 4) +
    Math.min(8, features.outcomeSignals * 2) +
    Math.min(6, features.riskReversal * 3) -
    riskPenalty - pricePenalty - urgencyPenalty -
    features.vagueClaims * 6;
  // Short channels cannot carry a mechanism paragraph; judge them on price, deadline and proof instead.
  if (profile.bodyMax <= 400) offer += 8;
  if (creative.touchpointType === 'promotion') {
    offer += features.urgencySignals > 0 ? Math.min(8, features.urgencySignals * 4) : -6;
    if (features.priceValueSignals === 0) offer -= 8;
  }
  if (phase === 'late' && noEvidence) offer -= 6;

  let copy = 30 +
    Math.min(15, features.mechanismSignals * 4) +
    Math.min(15, features.evidenceSignals * 4) +
    Math.min(10, features.ctaClarity * 5) +
    clarityLevel(features.deliveredChars, profile.bodyMax) * 4 +
    Math.min(8, relevance * 2) -
    proofGap -
    features.jargonSignals * 5 -
    features.vagueClaims * 5;
  if (channel === 'sms' && features.deliveredChars > 140) copy -= 10;
  if (creative.touchpointType === 'sales-outreach') {
    copy += Math.min(10, features.personalization * 5) + Math.min(6, features.questionSignals * 3);
    if (phase === 'early' && HARD_SELL.test(`${creative.cta} ${creative.offer}`)) copy -= 6;
  }

  let visual;
  if (profile.mode === 'delivery') {
    visual = 40 +
      Math.min(20, features.timingSignals * 6) +
      Math.min(18, features.personalization * 6) -
      (String(creative.visualDirection ?? '').trim().length < 12 ? 10 : 0);
    if (channel === 'sms') visual += features.deliveredChars <= 70 ? 15 : features.deliveredChars <= 140 ? 5 : -15;
    if (channel === 'sales-call') visual += Math.min(12, features.questionSignals * 4);
  } else {
    visual = 30 +
      Math.min(42, features.visualProof * 7) +
      (String(creative.format).toLowerCase() === 'video' ? 5 : 0) +
      Math.min(10, features.numericProof * 2) -
      (String(creative.visualDirection ?? '').trim().length < 12 ? 12 : 0);
  }

  return Object.freeze({ hook: clamp(hook), offer: clamp(offer), copy: clamp(copy), visual: clamp(visual) });
}

export function effectiveWeights(persona, context) {
  const touchpoint = TOUCHPOINT_PROFILES[context.touchpointType] ?? TOUCHPOINT_PROFILES['meta-ad'];
  const phase = PHASE_WEIGHTS[context.phase] ?? PHASE_WEIGHTS.early;
  const raw = Object.fromEntries(COMPONENTS.map((key) => [key, persona.weights[key] * context.profile.weights[key] * touchpoint[key] * phase[key]]));
  const total = COMPONENTS.reduce((sum, key) => sum + raw[key], 0);
  return Object.fromEntries(COMPONENTS.map((key) => [key, total > 0 ? raw[key] / total : 0.25]));
}

function weightedAverage(componentScores, weights) {
  return COMPONENTS.reduce((total, key) => total + componentScores[key] * weights[key], 0);
}

export function classifyDecision(score, threshold) {
  if (score >= threshold) return 'STOP';
  if (score >= threshold - 6) return 'WATCH';
  return 'SCROLL';
}

const POSITIVE_SIGNALS = Object.freeze(['audienceSpecificity', 'numericProof', 'painSignals', 'outcomeSignals', 'mechanismSignals', 'timeframeSignals', 'evidenceSignals', 'visualProof', 'priceValueSignals', 'personalization']);

// The pull is persona-specific: a matched keyword first, then the signal this persona's traits care
// about most, then whatever the message is strongest at.
function positiveFor(features, creative, persona) {
  const [keyword] = matchedPersonaTerms(creative, persona);
  if (keyword) return `คำที่ตรงใจ “${keyword}”`;
  const priorities = [];
  if (persona.priceSensitivity >= 4) priorities.push('priceValueSignals');
  if (persona.evidenceNeed >= 4) priorities.push('evidenceSignals', 'numericProof');
  if (persona.urgency >= 4) priorities.push('timeframeSignals');
  const trait = priorities.find((key) => features[key] > 0);
  if (trait) return LABELS[trait];
  const best = [...POSITIVE_SIGNALS].sort((a, b) => features[b] - features[a])[0];
  return features[best] > 0 ? LABELS[best] : null;
}

function frictionFor(features, componentScores, persona, channel) {
  if (features.vagueClaims > 0) return LABELS.vagueClaims;
  if (features.jargonSignals > 0) return LABELS.jargonSignals;
  if (persona.risk <= 2 && features.evidenceSignals === 0) return 'ยังไม่เห็นหลักฐานพอให้กล้าเสี่ยง';
  if (persona.priceSensitivity >= 4 && features.priceValueSignals === 0) return 'ไม่เห็นราคาหรือความคุ้มค่า';
  const weakest = Object.entries(componentScores).sort(([, a], [, b]) => a - b)[0][0];
  return `${componentLabel(weakest, channel)} ยังไม่พอสำหรับมุมนี้`;
}

function personaExplanation(creative, persona, decision, score, features, componentScores, channel) {
  const verbs = CHANNEL_VERBS[channel] ?? CHANNEL_VERBS.meta;
  const positive = positiveFor(features, creative, persona);
  const friction = frictionFor(features, componentScores, persona, channel);
  const weakest = Object.entries(componentScores).sort(([, a], [, b]) => a - b)[0][0];
  const fixed = COMPONENTS.filter((component) => component !== weakest).map((component) => componentLabel(component, channel)).join(', ');
  const rounded = Math.round(score);
  let reaction;
  if (decision === 'STOP') reaction = `${persona.role} ${verbs.STOP} เพราะเห็น${positive ?? 'ข้อความที่ตรงกับตัวเอง'} (คะแนน ${rounded})`;
  else if (decision === 'WATCH') reaction = `${persona.role} ${verbs.WATCH} — สนใจ${positive ?? 'หัวข้อ'} แต่ติดเรื่อง${friction} (คะแนน ${rounded})`;
  else reaction = `${persona.role} ${verbs.SCROLL} เพราะ${friction}${positive ? ` แม้จะมี${positive}` : ''} (คะแนน ${rounded})`;
  return {
    reaction,
    friction: `จุดติดหลักคือ${friction} · ต้องได้ ${persona.threshold} ขึ้นไปถึงจะ${verbs.STOP}`,
    improvement: `ทดสอบ ${componentLabel(weakest, channel)} ให้ชัดขึ้น โดยคง ${fixed} ไว้เหมือนเดิม`,
  };
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function verdictFor(stopRate, averageScore, componentScores) {
  const floor = Math.min(...Object.values(componentScores));
  if (stopRate >= 70 && averageScore >= 72 && floor >= 60) return 'SCALE';
  if (stopRate >= 45 || averageScore >= 55) return 'ITERATE';
  return 'KILL';
}

const HYPOTHESIS = Object.freeze({
  hook: 'เขียน Hook ใหม่ให้เรียกคนรับสารและปัญหาที่วัดได้ในประโยคแรก',
  offer: 'ทำ Offer ให้เห็นขอบเขต กรอบเวลา หลักฐาน และความคุ้มค่าในบล็อกเดียว',
  copy: 'ตัด Copy ให้เหลือปัญหา → วิธีการ → หลักฐาน → CTA และเอาศัพท์กว้างออก',
  visual: 'เปลี่ยน Visual ให้ 3 วินาทีแรกมีคน/สินค้าจริง ผลแบบ before/after และตัวหนังสือที่อ่านทัน',
  delivery: 'ปรับจังหวะส่ง ความยาว และการเอ่ยถึงผู้รับโดยตรง (ชื่อ/บริษัท/สิ่งที่คุยค้างไว้) โดยไม่แตะเนื้อข้อเสนอ',
});

export function buildNextHypothesis(evaluation, channel = evaluation?.channel) {
  const changedVariable = evaluation.weakestComponent;
  const keepFixed = COMPONENTS.filter((component) => component !== changedVariable);
  const delivery = changedVariable === 'visual' && CHANNEL_PROFILES[channel]?.mode === 'delivery';
  return Object.freeze({
    changedVariable,
    keepFixed: Object.freeze(keepFixed),
    instruction: delivery ? HYPOTHESIS.delivery : HYPOTHESIS[changedVariable],
    baselineScore: evaluation.componentScores[changedVariable],
  });
}

export function evaluationContext(creative, pack) {
  const channel = CHANNEL_PROFILES[creative.channel] ? creative.channel : 'meta';
  return Object.freeze({
    channel,
    profile: CHANNEL_PROFILES[channel],
    touchpointType: TOUCHPOINT_PROFILES[creative.touchpointType] ? creative.touchpointType : 'meta-ad',
    phase: stagePhase(creative, pack),
    businessModel: resolveBusinessModel(creative, pack?.businessModel ?? 'b2b'),
  });
}

// pack is optional for backwards compatibility (stage weighting falls back to "early").
// options.now lets tests pin evaluatedAt; production calls record the real evaluation time.
export function evaluateCreative(creative, personas, pack = null, options = {}) {
  const context = evaluationContext(creative, pack);
  const features = extractFeatures(creative, context.businessModel);
  const personaResults = personas.map((persona) => {
    const componentScores = scoreComponents(features, creative, persona, context);
    const score = clamp(weightedAverage(componentScores, effectiveWeights(persona, context)));
    const decision = classifyDecision(score, persona.threshold);
    const confidence = clamp(Math.abs(score - persona.threshold) / 35, 0.08, 0.99);
    const explanation = personaExplanation(creative, persona, decision, score, features, componentScores, context.channel);
    return Object.freeze({ personaId: persona.id, decision, confidence, score, componentScores, ...explanation });
  });

  const componentScores = Object.freeze(Object.fromEntries(COMPONENTS.map((component) => [
    component,
    clamp(average(personaResults.map((result) => result.componentScores[component]))),
  ])));
  const averageScore = clamp(average(personaResults.map((result) => result.score)));
  const stopRate = clamp((personaResults.filter((result) => result.decision === 'STOP').length / Math.max(1, personaResults.length)) * 100);
  const segmentNames = [...new Set(personas.map((persona) => persona.segment))];
  const segmentScores = Object.freeze(Object.fromEntries(segmentNames.map((segment) => {
    const ids = new Set(personas.filter((persona) => persona.segment === segment).map((persona) => persona.id));
    return [segment, clamp(average(personaResults.filter((result) => ids.has(result.personaId)).map((result) => result.score)))];
  })));
  const weakestComponent = Object.entries(componentScores).sort(([, a], [, b]) => a - b)[0][0];
  const base = {
    creativeId: creative.id,
    engine: 'local-matrix-v2',
    evaluatedAt: options.now ?? new Date().toISOString(),
    channel: context.channel,
    stopRate,
    averageScore,
    verdict: verdictFor(stopRate, averageScore, componentScores),
    weakestComponent,
    componentScores,
    segmentScores,
    personaResults: Object.freeze(personaResults),
  };
  return Object.freeze({ ...base, nextHypothesis: buildNextHypothesis(base, context.channel) });
}
