import { personaPackRevision } from './persona-packs.mjs';

const CHANNELS = new Set(['meta', 'line-oa', 'email', 'sms', 'sales-call', 'website', 'offline', 'tiktok', 'instagram', 'facebook']);

const PLAYBOOKS = Object.freeze({
  b2b: Object.freeze([
    ['ส่ง proof-led message ที่เรียกบทบาทและปัญหาธุรกิจให้ตรง', 'meta', 'ทันที'],
    ['ส่ง case study อุตสาหกรรมเดียวกันพร้อมตัวเลขก่อน–หลัง', 'email', 'ภายใน 1 วัน'],
    ['ทำ one-page สำหรับแชร์ให้ผู้อนุมัติและฝ่ายที่เกี่ยวข้อง', 'line-oa', 'ภายใน 2 วัน'],
    ['นัด discovery/demo โดยใช้ข้อมูลหน้างานของลูกค้า', 'sales-call', 'ภายใน 3 วัน'],
    ['ส่ง ROI, scope, security และ procurement pack ให้ครบชุด', 'email', 'ก่อนประชุมอนุมัติ'],
    ['ติดตาม decision gap และยืนยัน next step ที่มีเจ้าของ/วันนัด', 'sales-call', 'ภายใน 2 วันหลังข้อเสนอ'],
    ['สรุป quick win แล้วเสนอ use case ถัดไปจากผลจริง', 'email', '30 วันหลังเริ่มใช้'],
  ]),
  b2c: Object.freeze([
    ['เปิดด้วยภาพประโยชน์ที่เข้าใจได้ใน 3 วินาที', 'meta', 'ทันที'],
    ['ย้ำคุณค่า รีวิว และเงื่อนไขโปรแบบอ่านจบในหน้าจอเดียว', 'line-oa', 'ภายใน 1 ชั่วโมง'],
    ['ส่งตัวช่วยเปรียบเทียบ ราคา รีวิว และคำถามที่พบบ่อย', 'website', 'ภายใน 1 วัน'],
    ['ลดแรงเสียดทาน checkout พร้อม deadline/stock ที่เป็นจริง', 'line-oa', 'ก่อนโปรหมด'],
    ['ขอ feedback หลังได้รับสินค้าและแก้ pain อย่างรวดเร็ว', 'line-oa', '1 วันหลังใช้งาน'],
    ['ให้สิทธิ์สมาชิกหรือ referral จากพฤติกรรมที่เกิดขึ้นจริง', 'line-oa', '7–30 วันหลังซื้อ'],
  ]),
  b2g: Object.freeze([
    ['เชื่อมปัญหากับภารกิจ ตัวชี้วัด และผลต่อประชาชน', 'email', 'เมื่อพบสัญญาณความต้องการ'],
    ['ทำ requirement matrix เทียบข้อกำหนดทีละข้อ', 'email', 'ก่อนร่าง TOR'],
    ['ส่ง technical evidence, benchmark, integration และ security pack', 'email', 'ก่อนประชุมเทคนิค'],
    ['ทำเอกสารความคุ้มค่า วงเงิน และแผนปีงบประมาณ', 'email', 'ก่อนเสนออนุมัติงบ'],
    ['เตรียมเอกสารคุณสมบัติ ราคา สัญญา และ audit trail', 'email', 'ก่อนเปิดจัดซื้อ'],
    ['ปิด clarification ทุกข้อและยืนยันแผนส่งมอบ', 'sales-call', 'ตามกรอบประกาศ'],
    ['รายงาน milestone, acceptance criteria และหลักฐานผลลัพธ์', 'email', 'ตามงวดส่งมอบ'],
  ]),
});

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

// How well each channel moves people at each part of the journey (applied to the 2 stages right after
// the stage the touchpoint is sent at — that is where a single touchpoint has direct influence).
const CHANNEL_STAGE_FIT = Object.freeze({
  meta: Object.freeze({ early: 0.02, mid: 0, late: -0.03 }),
  'line-oa': Object.freeze({ early: 0, mid: 0.015, late: 0.01 }),
  email: Object.freeze({ early: -0.01, mid: 0.015, late: 0.015 }),
  sms: Object.freeze({ early: -0.015, mid: 0, late: 0.01 }),
  'sales-call': Object.freeze({ early: -0.01, mid: 0.02, late: 0.03 }),
  website: Object.freeze({ early: 0.005, mid: 0.015, late: 0 }),
  offline: Object.freeze({ early: 0.01, mid: 0, late: -0.01 }),
  // Organic feeds earn attention cheaply and rarely carry a decision on their own.
  tiktok: Object.freeze({ early: 0.03, mid: -0.005, late: -0.04 }),
  instagram: Object.freeze({ early: 0.025, mid: 0.005, late: -0.03 }),
  facebook: Object.freeze({ early: 0.02, mid: 0.005, late: -0.025 }),
});

const CHANNEL_THAI = Object.freeze({ meta: 'Meta', 'line-oa': 'LINE OA', email: 'Email', sms: 'SMS', 'sales-call': 'Sales call', website: 'Website', offline: 'Offline', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook' });

function phaseOf(index, total) {
  const position = total < 2 ? 0 : index / (total - 1);
  return position < 0.34 ? 'early' : position < 0.67 ? 'mid' : 'late';
}

// Playbooks have one step per built-in stage. Custom packs may carry 3–12 stages, so map by position.
function playbookStep(playbook, index, total) {
  if (total === playbook.length) return playbook[index];
  return playbook[Math.min(playbook.length - 1, Math.round((index * (playbook.length - 1)) / Math.max(1, total - 1)))];
}

export function intendedStageIndex(creative, pack) {
  return Math.max(0, pack.journeyStages.findIndex((stage) => stage.id === creative.journeyStage));
}

// Bottleneck = the stage *after* the touchpoint where this persona loses the largest share of those
// still in the journey (relative drop). The touchpoint stage itself is already scored by the STOP rate,
// and absolute drops would always point at the first downstream stage simply because it is the biggest.
function weakestDrop(stages, from) {
  if (from >= stages.length - 1) return { index: from, drop: 100 - stages[from].probability };
  let winner = { index: from + 1, drop: -1 };
  for (let index = from + 1; index < stages.length; index += 1) {
    const previous = stages[index - 1].probability;
    const drop = previous > 0 ? (previous - stages[index].probability) / previous : 0;
    if (drop > winner.drop) winner = { index, drop };
  }
  return winner;
}

// Which buyer trait each stage tests. A persona leaves where its own weak spot is tested: price-sensitive
// buyers at Purchase/Budget, evidence-hungry ones at Compare/Technical, risk-averse ones at Close/Award,
// gatekeepers and approvers at Alignment/Procurement. Custom stage ids fall back to their position.
const STAGE_GATES = Object.freeze({
  awareness: ['urgency'], consideration: ['evidence'], alignment: ['committee', 'risk'], proposal: ['evidence', 'price'],
  procurement: ['price', 'committee'], close: ['risk'], expansion: ['outcome'],
  interest: ['urgency'], compare: ['evidence'], purchase: ['price'], experience: ['quality'], loyalty: ['outcome'],
  'need-signal': ['urgency'], 'requirement-fit': ['evidence'], technical: ['evidence', 'committee'], budget: ['price'],
  award: ['risk', 'committee'], delivery: ['outcome'],
});
const PHASE_GATES = Object.freeze({ early: ['urgency'], mid: ['evidence'], late: ['price', 'risk'] });

function gatePenalty(gate, persona) {
  const role = persona.decisionRole ?? 'buyer';
  switch (gate) {
    case 'urgency': return (5 - persona.urgency) * 0.02;
    case 'evidence': return Math.max(0, persona.evidenceNeed - 2) * 0.025;
    case 'price': return Math.max(0, persona.priceSensitivity - 2) * 0.03;
    case 'risk': return Math.max(0, 4 - persona.risk) * 0.025;
    case 'committee': return role === 'gatekeeper' || role === 'approver' ? 0.07 : role === 'influencer' ? 0.03 : 0.01;
    case 'quality': return Math.max(0, persona.evidenceNeed - 3) * 0.02;
    default: return 0.02;   // outcome: everyone who got this far mostly continues
  }
}

function stageRetention(persona, pack, index, creative, intendedIndex, result) {
  const total = pack.journeyStages.length;
  const stage = pack.journeyStages[index];
  const gates = STAGE_GATES[stage.id] ?? PHASE_GATES[phaseOf(index, total)];
  let retention = 0.925 - index * 0.006;
  for (const gate of gates) retention -= gatePenalty(gate, persona);
  // A message that clears this persona's bar comfortably carries momentum downstream (and vice versa).
  retention += Math.max(-0.04, Math.min(0.04, (Number(result.score) - persona.threshold) / 250));
  if (index > intendedIndex && index <= intendedIndex + 2) retention += CHANNEL_STAGE_FIT[creative.channel]?.[phaseOf(index, total)] ?? 0;
  return Math.min(0.97, Math.max(0.55, retention));
}

function makePersonaPath(creative, persona, result, pack, intendedIndex) {
  const playbook = PLAYBOOKS[pack.businessModel];
  const total = pack.journeyStages.length;
  const start = clamp(
    result.score * 0.8 + persona.urgency * 3 + persona.risk * 1.5 - persona.evidenceNeed * 1.3 - persona.priceSensitivity * 0.8 +
    (result.decision === 'STOP' ? 9 : result.decision === 'WATCH' ? 2 : -7),
    5,
    96,
  );
  // Stages before the one this touchpoint is sent at are already behind the persona (100%).
  const stages = [];
  for (let index = 0; index < total; index += 1) {
    let probability;
    if (index < intendedIndex) probability = 100;
    else if (index === intendedIndex) probability = start;
    else probability = clamp(Math.min(stages[index - 1].probability, stages[index - 1].probability * stageRetention(persona, pack, index, creative, intendedIndex, result)), 1, 99);
    stages.push({ stageId: pack.journeyStages[index].id, probability });
  }
  const bottleneck = weakestDrop(stages, intendedIndex);
  const belowHalf = stages.findIndex((item, index) => index >= intendedIndex && item.probability < 50);
  const nextIndex = belowHalf < 0 ? total - 1 : Math.max(intendedIndex, belowHalf - 1);
  const friction = persona.objections?.[bottleneck.index % Math.max(1, persona.objections.length)] ?? persona.pains?.[0] ?? 'ยังไม่มีหลักฐานพอสำหรับตัดสินใจ';
  const trigger = persona.outcomes?.[0] ?? persona.keywords?.[0] ?? 'ผลลัพธ์ที่ตรงกับบทบาท';
  const confidence = clamp(45 + Number(result.confidence ?? 0.3) * 35 + (persona.keywords?.length ?? 0) * 2, 35, 82);
  return Object.freeze({
    personaId: persona.id,
    conversionProbability: stages.at(-1).probability,
    likelyNextStage: pack.journeyStages[nextIndex].id,
    bottleneckStage: pack.journeyStages[bottleneck.index].id,
    trigger,
    friction,
    nextBestAction: playbookStep(playbook, bottleneck.index, total)[0],
    confidence,
    stages: Object.freeze(stages.map(Object.freeze)),
  });
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))[0]?.[0] ?? 'ยังไม่มีหลักฐานพอสำหรับตัดสินใจ';
}

// options.now pins generatedAt for tests; production records the real time.
export function predictJourney(creative, personas, evaluation, pack, options = {}) {
  if (!creative || !evaluation || !pack || !Array.isArray(personas) || !personas.length) throw new TypeError('ข้อมูลสำหรับสร้าง Journey ไม่ครบ');
  const intendedIndex = intendedStageIndex(creative, pack);
  const total = pack.journeyStages.length;
  const resultMap = new Map(evaluation.personaResults.map((item) => [item.personaId, item]));
  const personaPaths = personas.map((persona) => {
    const result = resultMap.get(persona.id);
    if (!result) throw new TypeError(`ไม่พบผลประเมินของ persona ${persona.id}`);
    return makePersonaPath(creative, persona, result, pack, intendedIndex);
  });
  const playbook = PLAYBOOKS[pack.businessModel];
  const intendedLabel = pack.journeyStages[intendedIndex].label;
  const stageForecasts = pack.journeyStages.map((stage, index) => {
    const step = playbookStep(playbook, index, total);
    const probability = clamp(average(personaPaths.map((path) => path.stages[index].probability)));
    const previous = index === 0 ? 100 : clamp(average(personaPaths.map((path) => path.stages[index - 1].probability)));
    if (index < intendedIndex) {
      return Object.freeze({
        stageId: stage.id, label: stage.label, probability, dropOff: 0,
        topFriction: 'ผ่านมาแล้ว', nextBestAction: `ผ่าน stage นี้มาแล้ว — touchpoint นี้เริ่มที่ ${intendedLabel}`,
        channel: step[1], timing: 'ผ่านแล้ว',
      });
    }
    const affected = personaPaths.filter((path) => path.bottleneckStage === stage.id);
    return Object.freeze({
      stageId: stage.id,
      label: stage.label,
      probability,
      dropOff: clamp(previous - probability),
      topFriction: mostCommon((affected.length ? affected : personaPaths).map((path) => path.friction)),
      nextBestAction: step[0],
      channel: step[1],
      timing: step[2],
    });
  });
  const downstream = stageForecasts.map((stage, index) => ({ stage, index })).filter(({ index }) => index > intendedIndex);
  const relativeDrop = ({ stage, index }) => {
    const previous = stageForecasts[index - 1].probability;
    return previous > 0 ? stage.dropOff / previous : 0;
  };
  const bottleneckStage = downstream.length
    ? [...downstream].sort((left, right) => relativeDrop(right) - relativeDrop(left) || left.index - right.index)[0].stage.stageId
    : stageForecasts[intendedIndex].stageId;
  const priorityPersonaIds = [...personaPaths]
    .sort((left, right) => right.conversionProbability - left.conversionProbability)
    .slice(0, Math.min(5, personaPaths.length))
    .map((path) => path.personaId);
  const actionStart = Math.max(intendedIndex, stageForecasts.findIndex((stage) => stage.stageId === bottleneckStage));
  const confidence = clamp(average(personaPaths.map((path) => path.confidence)), 35, 82);
  return Object.freeze({
    creativeId: creative.id,
    personaPackId: pack.id,
    personaPackRevision: personaPackRevision(pack),
    engine: 'local-journey-v2',
    generatedAt: options.now ?? new Date().toISOString(),
    confidence,
    confidenceLabel: 'directional',
    assumptions: Object.freeze([
      'เป็นการคาดการณ์เชิงทิศทาง (directional) จาก persona จำลอง ไม่ใช่พฤติกรรมจริงของคนรายบุคคล',
      `เริ่มนับจาก stage “${intendedLabel}” ที่ touchpoint นี้ตั้งใจใช้ stage ก่อนหน้าถือว่าผ่านมาแล้ว`,
      `ช่องทาง ${CHANNEL_THAI[creative.channel] ?? creative.channel} มีผลโดยตรงกับ 2 stage ถัดจากจุดที่ส่ง`,
      'ผลจริงจากแคมเปญ CRM ทีมขาย หรือการจัดซื้อ คือคำตอบสุดท้าย ให้กรอกที่หน้า Results เพื่อเทียบ',
    ]),
    stageForecasts: Object.freeze(stageForecasts),
    personaPaths: Object.freeze(personaPaths),
    strategy: Object.freeze({
      bottleneckStage,
      priorityPersonaIds: Object.freeze(priorityPersonaIds),
      nextBestActions: Object.freeze(stageForecasts.slice(actionStart, actionStart + 3).map((stage) => stage.nextBestAction)),
    }),
  });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function percent(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export function validateJourneyForecast(value, creativeId, pack) {
  const errors = [];
  if (!isPlainObject(value) || value.creativeId !== creativeId || value.personaPackId !== pack?.id || value.personaPackRevision !== personaPackRevision(pack)) errors.push('identity');
  if (typeof value?.engine !== 'string' || typeof value?.generatedAt !== 'string' || !percent(value?.confidence) || !['low', 'directional', 'calibrated'].includes(value?.confidenceLabel)) errors.push('metadata');
  if (!Array.isArray(value?.assumptions) || !value.assumptions.every((item) => typeof item === 'string')) errors.push('assumptions');
  if (!Array.isArray(value?.stageForecasts) || value.stageForecasts.length !== pack?.journeyStages?.length) errors.push('stages');
  else {
    for (let index = 0; index < value.stageForecasts.length; index += 1) {
      const item = value.stageForecasts[index];
      if (!isPlainObject(item) || item.stageId !== pack.journeyStages[index].id || !percent(item.probability) || !percent(item.dropOff) || !CHANNELS.has(item.channel) || !['label', 'topFriction', 'nextBestAction', 'timing'].every((key) => typeof item[key] === 'string')) errors.push('stages');
      if (index > 0 && item.probability > value.stageForecasts[index - 1].probability) errors.push('stages');
    }
  }
  if (!Array.isArray(value?.personaPaths) || value.personaPaths.length !== pack?.personas?.length) errors.push('personas');
  else {
    const expected = new Set(pack.personas.map((persona) => persona.id));
    const received = new Set();
    for (const path of value.personaPaths) {
      if (!isPlainObject(path) || !expected.has(path.personaId) || received.has(path.personaId) || !percent(path.conversionProbability) || !percent(path.confidence)) errors.push('personas');
      received.add(path.personaId);
      if (!pack.journeyStages.some((stage) => stage.id === path.likelyNextStage) || !pack.journeyStages.some((stage) => stage.id === path.bottleneckStage)) errors.push('personas');
      if (!['trigger', 'friction', 'nextBestAction'].every((key) => typeof path[key] === 'string')) errors.push('personas');
      if (!Array.isArray(path.stages) || path.stages.length !== pack.journeyStages.length || !path.stages.every((stage, index) => stage.stageId === pack.journeyStages[index].id && percent(stage.probability))) errors.push('personas');
    }
  }
  if (!isPlainObject(value?.strategy) || !pack?.journeyStages?.some((stage) => stage.id === value.strategy.bottleneckStage) || !Array.isArray(value.strategy.priorityPersonaIds) || value.strategy.priorityPersonaIds.length < 1 || new Set(value.strategy.priorityPersonaIds).size !== value.strategy.priorityPersonaIds.length || !value.strategy.priorityPersonaIds.every((id) => pack.personas.some((persona) => persona.id === id)) || !Array.isArray(value.strategy.nextBestActions) || value.strategy.nextBestActions.length < 1 || !value.strategy.nextBestActions.every((item) => typeof item === 'string' && item.length > 0)) errors.push('strategy');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze([...new Set(errors)]) });
}
