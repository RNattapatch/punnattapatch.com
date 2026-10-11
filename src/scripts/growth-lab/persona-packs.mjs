import { isSafeId } from './ids.mjs';
import { PERSONAS } from './personas.mjs';

const BUSINESS_MODELS = new Set(['b2b', 'b2c', 'b2g']);
const COMPONENTS = ['hook', 'offer', 'copy', 'visual'];
const DEFAULT_WEIGHTS = Object.freeze({ hook: 0.32, offer: 0.29, copy: 0.23, visual: 0.16 });
export const MAX_PERSONA_PACK_BYTES = 256_000;

const PACK_KEYS = new Set(['schemaVersion', 'kind', 'id', 'name', 'businessModel', 'industry', 'product', 'primaryOutcome', 'kpis', 'journeyStages', 'personas']);
const STAGE_KEYS = new Set(['id', 'label']);
const PERSONA_KEYS = new Set(['id', 'name', 'role', 'segment', 'decisionRole', 'revenueBand', 'awareness', 'pains', 'outcomes', 'risk', 'priceSensitivity', 'evidenceNeed', 'urgency', 'keywords', 'objections', 'weights', 'threshold']);
const WEIGHT_KEYS = new Set(COMPONENTS);

const JOURNEY_STAGES = Object.freeze({
  b2b: Object.freeze([
    ['awareness', 'Awareness'], ['consideration', 'Consideration'], ['alignment', 'Internal Alignment'],
    ['proposal', 'Demo / Proposal'], ['procurement', 'Procurement'], ['close', 'Close'], ['expansion', 'Expansion'],
  ]),
  b2c: Object.freeze([
    ['awareness', 'Awareness'], ['interest', 'Interest'], ['compare', 'Compare'], ['purchase', 'Purchase'],
    ['experience', 'Experience'], ['loyalty', 'Repeat / Advocate'],
  ]),
  b2g: Object.freeze([
    ['need-signal', 'Need / RFP Signal'], ['requirement-fit', 'Requirement Fit'], ['technical', 'Technical Evaluation'],
    ['budget', 'Budget / Approval'], ['procurement', 'Procurement'], ['award', 'Award'], ['delivery', 'Delivery'],
  ]),
});

function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) freezeDeep(nested);
  return Object.freeze(value);
}

function stage([id, label]) {
  return { id, label };
}

function makePersona(id, name, role, segment, profile = {}) {
  return {
    id,
    name,
    role,
    segment,
    decisionRole: profile.decisionRole ?? 'buyer',
    revenueBand: profile.revenueBand ?? 'ไม่ระบุ',
    awareness: profile.awareness ?? 'problem-aware',
    pains: profile.pains ?? [],
    outcomes: profile.outcomes ?? [],
    risk: profile.risk ?? 3,
    priceSensitivity: profile.priceSensitivity ?? 3,
    evidenceNeed: profile.evidenceNeed ?? 3,
    urgency: profile.urgency ?? 3,
    keywords: profile.keywords ?? [],
    objections: profile.objections ?? [],
    weights: { ...DEFAULT_WEIGHTS, ...(profile.weights ?? {}) },
    threshold: profile.threshold ?? 65,
  };
}

function enrichB2BPersona(persona) {
  return {
    ...structuredClone(persona),
    decisionRole: ['Finance', 'Governance', 'Technology'].includes(persona.segment) ? 'gatekeeper' : persona.segment === 'Influencer' ? 'influencer' : 'buyer',
    pains: [...persona.objections],
    outcomes: [...persona.keywords.slice(0, 3)],
  };
}

const B2C_PERSONAS = [
  makePersona('b2c-deal-seeker', 'เมย์', 'นักล่าโปร', 'Value', { priceSensitivity: 5, urgency: 5, threshold: 61, keywords: ['โปร', 'ลด', 'คุ้ม', 'ฟรี'], pains: ['กลัวซื้อแพง'], outcomes: ['ได้ราคาดี'], objections: ['เงื่อนไขเยอะ', 'ลดไม่จริง'] }),
  makePersona('b2c-quality-parent', 'คุณฝน', 'พ่อแม่เน้นคุณภาพ', 'Family', { risk: 2, evidenceNeed: 5, threshold: 72, keywords: ['ปลอดภัย', 'คุณภาพ', 'ครอบครัว', 'รีวิว'], pains: ['กลัวไม่ปลอดภัย'], outcomes: ['มั่นใจให้ครอบครัวใช้'], objections: ['ไม่มีรีวิว', 'ข้อมูลไม่ครบ'] }),
  makePersona('b2c-convenience', 'นนท์', 'คนเมืองเวลาน้อย', 'Convenience', { urgency: 5, threshold: 63, keywords: ['เร็ว', 'ส่ง', 'ง่าย', 'วันนี้'], pains: ['ขั้นตอนเยอะ'], outcomes: ['จบเร็ว'], objections: ['ต้องรอ', 'สมัครยาก'] }),
  makePersona('b2c-reviewer', 'อิง', 'สายรีวิวก่อนซื้อ', 'Research', { evidenceNeed: 5, risk: 2, threshold: 70, keywords: ['รีวิว', 'เทียบ', 'ทดลอง', 'ของจริง'], pains: ['กลัวไม่ตรงปก'], outcomes: ['ตัดสินใจจากข้อมูล'], objections: ['เคลมเกินจริง', 'ไม่มีหลักฐาน'] }),
  makePersona('b2c-early-adopter', 'ไท', 'สายลองของใหม่', 'Trend', { risk: 5, urgency: 4, threshold: 58, keywords: ['ใหม่', 'ก่อนใคร', 'เทคโนโลยี', 'รุ่นล่าสุด'], pains: ['ของเดิมน่าเบื่อ'], outcomes: ['ได้ประสบการณ์ใหม่'], objections: ['ไม่ต่างจากเดิม'] }),
  makePersona('b2c-loyal', 'พี่แอน', 'ลูกค้าเดิม', 'Loyalty', { awareness: 'product-aware', risk: 3, threshold: 60, keywords: ['สมาชิก', 'สิทธิ์', 'ขอบคุณ', 'พิเศษ'], pains: ['ไม่ได้รับการดูแล'], outcomes: ['ได้สิทธิ์เฉพาะ'], objections: ['ลูกค้าใหม่ได้ดีกว่า'] }),
  makePersona('b2c-premium', 'คุณวิน', 'ผู้ซื้อเน้นประสบการณ์', 'Premium', { priceSensitivity: 1, evidenceNeed: 4, threshold: 68, keywords: ['บริการ', 'คุณภาพ', 'พรีเมียม', 'รับประกัน'], pains: ['เสียเวลาแก้ปัญหา'], outcomes: ['ได้รับการดูแลครบ'], objections: ['ภาพลักษณ์ไม่ถึง', 'บริการหลังขายไม่ชัด'] }),
  makePersona('b2c-conscious', 'ใบหม่อน', 'ผู้ซื้อใส่ใจผลกระทบ', 'Values', { risk: 3, evidenceNeed: 5, threshold: 71, keywords: ['ยั่งยืน', 'ชุมชน', 'โปร่งใส', 'ที่มา'], pains: ['ไม่รู้ที่มาสินค้า'], outcomes: ['ซื้อแล้วสอดคล้องคุณค่า'], objections: ['greenwashing', 'ตรวจสอบไม่ได้'] }),
];

const B2G_PERSONAS = [
  makePersona('b2g-policy-owner', 'ผู้อำนวยการภารกิจ', 'เจ้าของนโยบาย', 'Sponsor', { decisionRole: 'buyer', risk: 2, evidenceNeed: 5, threshold: 74, keywords: ['นโยบาย', 'ผลลัพธ์', 'ประชาชน', 'ตัวชี้วัด'], pains: ['ไม่ตอบ KPI'], outcomes: ['บรรลุเป้าหมายนโยบาย'], objections: ['ไม่สอดคล้องแผน', 'อธิบายผู้บริหารไม่ได้'] }),
  makePersona('b2g-procurement', 'เจ้าหน้าที่พัสดุ', 'ฝ่ายจัดซื้อภาครัฐ', 'Procurement', { decisionRole: 'gatekeeper', risk: 1, priceSensitivity: 5, evidenceNeed: 5, threshold: 80, keywords: ['tor', 'ขอบเขต', 'ราคา', 'สัญญา'], pains: ['เอกสารไม่ครบ'], outcomes: ['ตรวจสอบได้'], objections: ['ผิดระเบียบ', 'คุณสมบัติไม่ชัด'] }),
  makePersona('b2g-budget', 'นักวิเคราะห์งบประมาณ', 'ฝ่ายงบประมาณ', 'Finance', { decisionRole: 'gatekeeper', risk: 1, priceSensitivity: 5, evidenceNeed: 5, threshold: 79, keywords: ['งบประมาณ', 'ความคุ้มค่า', 'ผลลัพธ์', 'ปีงบ'], pains: ['วงเงินไม่พอ'], outcomes: ['ใช้งบคุ้มค่า'], objections: ['ประเมินราคาไม่ได้', 'ผลตอบแทนไม่ชัด'] }),
  makePersona('b2g-technical', 'กรรมการเทคนิค', 'ผู้ประเมินด้านเทคนิค', 'Technical', { decisionRole: 'influencer', risk: 2, evidenceNeed: 5, threshold: 77, keywords: ['สเปก', 'มาตรฐาน', 'ทดสอบ', 'integration'], pains: ['ระบบใช้ร่วมกันไม่ได้'], outcomes: ['ผ่านเกณฑ์เทคนิค'], objections: ['ไม่มี benchmark', 'ล็อกอินผู้ขาย'] }),
  makePersona('b2g-legal', 'นิติกรโครงการ', 'ฝ่ายกฎหมาย', 'Governance', { decisionRole: 'gatekeeper', risk: 1, evidenceNeed: 5, threshold: 81, keywords: ['กฎหมาย', 'pdpa', 'สัญญา', 'ความรับผิด'], pains: ['ความเสี่ยงข้อพิพาท'], outcomes: ['เงื่อนไขรัดกุม'], objections: ['ข้อกำหนดไม่ชัด', 'ข้อมูลเสี่ยง'] }),
  makePersona('b2g-auditor', 'ผู้ตรวจสอบภายใน', 'ตรวจสอบและกำกับ', 'Governance', { decisionRole: 'influencer', risk: 1, evidenceNeed: 5, threshold: 80, keywords: ['audit', 'ตรวจสอบ', 'หลักฐาน', 'โปร่งใส'], pains: ['ไม่มี audit trail'], outcomes: ['ตรวจย้อนหลังได้'], objections: ['อนุมัติไม่ได้', 'หลักฐานไม่ครบ'] }),
  makePersona('b2g-end-user', 'หัวหน้าหน่วยงานผู้ใช้', 'ผู้ใช้งานหน้างาน', 'User', { decisionRole: 'user', risk: 2, urgency: 4, threshold: 70, keywords: ['ใช้ง่าย', 'หน้างาน', 'อบรม', 'support'], pains: ['งานเพิ่ม', 'ระบบซับซ้อน'], outcomes: ['ลดภาระงาน'], objections: ['ทีมใช้ไม่เป็น', 'ไม่มี support'] }),
  makePersona('b2g-executive', 'รองอธิบดี', 'ผู้บริหารอนุมัติ', 'Sponsor', { decisionRole: 'approver', risk: 2, evidenceNeed: 5, urgency: 3, threshold: 76, keywords: ['ประชาชน', 'ผลกระทบ', 'ชื่อเสียง', 'เป้าหมาย'], pains: ['โครงการล่าช้า'], outcomes: ['ผลลัพธ์ที่สื่อสารได้'], objections: ['เสี่ยงต่อชื่อเสียง', 'ผลกระทบไม่ชัด'] }),
];

function makePack({ id, name, businessModel, industry, product, primaryOutcome, kpis, personas }) {
  return freezeDeep({
    schemaVersion: 1,
    kind: 'persona-pack',
    id,
    name,
    businessModel,
    industry,
    product,
    primaryOutcome,
    kpis,
    journeyStages: JOURNEY_STAGES[businessModel].map(stage),
    personas,
  });
}

export const BUILT_IN_PACKS = Object.freeze([
  makePack({ id: 'thai-b2b-buying-committee', name: 'Thai B2B Buying Committee', businessModel: 'b2b', industry: 'ธุรกิจบริการและองค์กร', product: 'โซลูชัน B2B', primaryOutcome: 'Qualified pipeline และการปิดการขาย', kpis: ['CTR', 'Qualified Leads', 'Pipeline', 'Win Rate'], personas: PERSONAS.map(enrichB2BPersona) }),
  makePack({ id: 'thai-b2c-growth-panel', name: 'Thai B2C Growth Panel', businessModel: 'b2c', industry: 'Retail / Consumer', product: 'สินค้าและบริการผู้บริโภค', primaryOutcome: 'ยอดซื้อและการกลับมาซื้อซ้ำ', kpis: ['Engagement', 'Conversion', 'Revenue', 'Repeat Rate'], personas: B2C_PERSONAS }),
  makePack({ id: 'thai-b2g-procurement-panel', name: 'Thai B2G Procurement Panel', businessModel: 'b2g', industry: 'Government / Public Sector', product: 'โครงการและโซลูชันภาครัฐ', primaryOutcome: 'ผ่านข้อกำหนดและได้รับการอนุมัติ', kpis: ['Requirement Fit', 'Technical Score', 'Approval', 'Award'], personas: B2G_PERSONAS }),
]);

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function shortString(value, max = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function stringList(value, maxItems = 30, maxLength = 500) {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => shortString(item, maxLength));
}

function hasOnlyKeys(value, allowed) {
  return isPlainObject(value) && Object.keys(value).every((key) => allowed.has(key));
}

function byteLength(value) {
  try { return new TextEncoder().encode(JSON.stringify(value)).byteLength; } catch { return Number.POSITIVE_INFINITY; }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

export function personaPackRevision(pack) {
  const source = JSON.stringify(stableValue(pack));
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `pack-v1-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function validPersona(persona) {
  if (!hasOnlyKeys(persona, PERSONA_KEYS) || !isSafeId(persona.id)) return false;
  if (!['name', 'role', 'segment', 'decisionRole', 'awareness'].every((key) => shortString(persona[key]))) return false;
  if (!['pains', 'outcomes', 'keywords', 'objections'].every((key) => stringList(persona[key]))) return false;
  if (!['risk', 'priceSensitivity', 'evidenceNeed', 'urgency'].every((key) => Number.isFinite(persona[key]) && persona[key] >= 1 && persona[key] <= 5)) return false;
  if (!Number.isFinite(persona.threshold) || persona.threshold < 0 || persona.threshold > 100) return false;
  if (!hasOnlyKeys(persona.weights, WEIGHT_KEYS) || Object.keys(persona.weights).length !== COMPONENTS.length || !COMPONENTS.every((key) => Number.isFinite(persona.weights[key]) && persona.weights[key] >= 0 && persona.weights[key] <= 1)) return false;
  const total = COMPONENTS.reduce((sum, key) => sum + persona.weights[key], 0);
  return Math.abs(total - 1) < 0.001;
}

export function validatePersonaPack(pack) {
  const errors = [];
  if (byteLength(pack) > MAX_PERSONA_PACK_BYTES) errors.push('size');
  if (!hasOnlyKeys(pack, PACK_KEYS)) errors.push('unknownFields');
  if (!isPlainObject(pack) || pack.schemaVersion !== 1 || pack.kind !== 'persona-pack') errors.push('schema');
  if (!isSafeId(pack?.id)) errors.push('id');
  if (!shortString(pack?.name) || !shortString(pack?.industry) || !shortString(pack?.product) || !shortString(pack?.primaryOutcome, 2_000)) errors.push('metadata');
  if (!BUSINESS_MODELS.has(pack?.businessModel)) errors.push('businessModel');
  if (!stringList(pack?.kpis, 20)) errors.push('kpis');
  if (!Array.isArray(pack?.journeyStages) || pack.journeyStages.length < 3 || pack.journeyStages.length > 12) errors.push('journeyStages');
  else {
    const ids = pack.journeyStages.map((item) => item?.id);
    if (new Set(ids).size !== ids.length || !pack.journeyStages.every((item) => hasOnlyKeys(item, STAGE_KEYS) && isSafeId(item.id) && shortString(item.label))) errors.push('journeyStages');
  }
  if (!Array.isArray(pack?.personas) || pack.personas.length < 3 || pack.personas.length > 30) errors.push('personas');
  else {
    const ids = pack.personas.map((item) => item?.id);
    if (new Set(ids).size !== ids.length || !pack.personas.every(validPersona)) errors.push('personas');
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze([...new Set(errors)]) });
}

export function importPersonaPack(text) {
  let value;
  try { value = JSON.parse(String(text)); } catch { throw new TypeError('ไฟล์ Persona Pack ไม่ใช่ JSON ที่ถูกต้อง'); }
  const validation = validatePersonaPack(value);
  if (!validation.valid) throw new TypeError(`ไฟล์ Persona Pack ไม่ผ่านการตรวจสอบ: ${validation.errors.join(', ')}`);
  return freezeDeep(structuredClone(value));
}

export function exportPersonaPack(pack) {
  const validation = validatePersonaPack(pack);
  if (!validation.valid) throw new TypeError(`Persona Pack ไม่ผ่านการตรวจสอบ: ${validation.errors.join(', ')}`);
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export function clonePersonaPack(pack, newId = `${pack.id}-copy`) {
  const copy = structuredClone(pack);
  copy.id = newId;
  copy.name = `${pack.name} — Copy`;
  const validation = validatePersonaPack(copy);
  if (!validation.valid) throw new TypeError(`Persona Pack สำเนาไม่ถูกต้อง: ${validation.errors.join(', ')}`);
  return copy;
}

export function personasForState(state) {
  const pack = state?.personaPacks?.find((item) => item.id === state.selectedPersonaPackId);
  return pack?.personas ?? BUILT_IN_PACKS[0].personas;
}

function workspaceDefaults() {
  return { appName: 'Funnel Lab', clientName: '', accentColor: '#072b4e', preferredProvider: 'local' };
}

function addLegacyPackRevisions(state) {
  let copy = state;
  if (isPlainObject(state.workspace) && Object.hasOwn(state.workspace, 'localFallback')) {
    copy = structuredClone(state);
    delete copy.workspace.localFallback;
  }
  for (const [creativeId, evaluation] of Object.entries(state.evaluations ?? {})) {
    if (evaluation?.personaPackId && evaluation?.personaPackRevision) continue;
    const creative = state.creatives?.find((item) => item.id === creativeId);
    const pack = state.personaPacks?.find((item) => item.id === creative?.personaPackId);
    const received = new Set(Array.isArray(evaluation?.personaResults) ? evaluation.personaResults.map((item) => item?.personaId) : []);
    const expected = new Set(pack?.personas?.map((item) => item.id) ?? []);
    if (!pack || received.size !== expected.size || ![...received].every((id) => expected.has(id))) continue;
    if (copy === state) copy = structuredClone(state);
    copy.evaluations[creativeId].personaPackId = pack.id;
    copy.evaluations[creativeId].personaPackRevision = personaPackRevision(pack);
  }
  for (const [creativeId, journey] of Object.entries(state.journeys ?? {})) {
    if (journey?.personaPackRevision) continue;
    const creative = state.creatives?.find((item) => item.id === creativeId);
    const pack = state.personaPacks?.find((item) => item.id === creative?.personaPackId);
    if (!pack || journey?.personaPackId !== pack.id) continue;
    if (copy === state) copy = structuredClone(state);
    copy.journeys[creativeId].personaPackRevision = personaPackRevision(pack);
  }
  return copy;
}

export function migrateStateV1(value) {
  if (value?.schemaVersion === 2) return addLegacyPackRevisions(value);
  if (!isPlainObject(value) || value.schemaVersion !== 1) return null;
  const packId = BUILT_IN_PACKS[0].id;
  return addLegacyPackRevisions({
    ...structuredClone(value),
    schemaVersion: 2,
    workspace: workspaceDefaults(),
    personaPacks: BUILT_IN_PACKS.map((pack) => structuredClone(pack)),
    selectedPersonaPackId: packId,
    creatives: value.creatives.map((creative) => ({
      touchpointType: 'meta-ad', channel: 'meta', businessModel: 'b2b', journeyStage: 'awareness', personaPackId: packId, ...structuredClone(creative),
    })),
    journeys: {},
  });
}

export function createWorkspaceDefaults() {
  return workspaceDefaults();
}
