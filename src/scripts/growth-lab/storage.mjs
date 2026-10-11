import { seedState } from './seed.mjs';
import { validateActual } from './metrics.mjs';
import { isSafeId } from './ids.mjs';
import { isMedia } from './media.mjs';
import { createWorkspaceDefaults, migrateStateV1, personaPackRevision, validatePersonaPack } from './persona-packs.mjs';
import { validateJourneyForecast } from './journey.mjs';

export const STORAGE_KEY = 'pun.metaPersonaLab.v1';
export const RECOVERY_SUFFIX = ':recovery';

function clone(value) {
  return structuredClone(value);
}

const VIEWS = new Set(['workbench', 'compare', 'journey', 'results', 'personas', 'settings']);
const VERDICTS = new Set(['SCALE', 'ITERATE', 'KILL']);
const DECISIONS = new Set(['STOP', 'WATCH', 'SCROLL']);
const COMPONENTS = ['hook', 'offer', 'copy', 'visual'];
const SCORING_FIELDS = ['hook', 'primaryText', 'headline', 'offer', 'cta', 'visualDirection', 'touchpointType', 'channel', 'businessModel', 'journeyStage', 'personaPackId'];
const TOUCHPOINT_TYPES = new Set(['meta-ad', 'promotion', 'line-oa', 'sales-outreach']);
const CHANNELS = new Set(['meta', 'line-oa', 'email', 'sms', 'sales-call', 'website', 'offline']);
const BUSINESS_MODELS = new Set(['b2b', 'b2c', 'b2g']);
const PROVIDERS = new Set(['local', 'codex', 'jev']);

function finiteScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isCreative(creative) {
  return isPlainObject(creative) &&
    isSafeId(creative.id) &&
    typeof creative.name === 'string' && creative.name.length <= 500 &&
    TOUCHPOINT_TYPES.has(creative.touchpointType) && CHANNELS.has(creative.channel) && BUSINESS_MODELS.has(creative.businessModel) &&
    isSafeId(creative.personaPackId) && isSafeId(creative.journeyStage) &&
    SCORING_FIELDS.every((field) => typeof creative[field] === 'string' && creative[field].length <= 20_000) &&
    isMedia(creative.media, creative.id);
}

function isWorkspace(workspace) {
  return isPlainObject(workspace) &&
    typeof workspace.appName === 'string' && workspace.appName.length > 0 && workspace.appName.length <= 120 &&
    typeof workspace.clientName === 'string' && workspace.clientName.length <= 200 &&
    /^#[0-9a-f]{6}$/iu.test(workspace.accentColor) &&
    PROVIDERS.has(workspace.preferredProvider);
}

function sameSet(received, expected) {
  return received.size === expected.size && [...received].every((value) => expected.has(value));
}

function isEvaluation(evaluation, creative, pack) {
  if (!isPlainObject(evaluation) || evaluation.creativeId !== creative.id || evaluation.personaPackId !== pack.id || evaluation.personaPackRevision !== personaPackRevision(pack) || typeof evaluation.engine !== 'string') return false;
  if (!finiteScore(evaluation.stopRate) || !finiteScore(evaluation.averageScore) || !VERDICTS.has(evaluation.verdict)) return false;
  if (!COMPONENTS.includes(evaluation.weakestComponent) || !isPlainObject(evaluation.componentScores)) return false;
  if (!COMPONENTS.every((key) => finiteScore(evaluation.componentScores[key]))) return false;
  if (!isPlainObject(evaluation.segmentScores) || !Object.values(evaluation.segmentScores).every(finiteScore)) return false;
  if (!Array.isArray(evaluation.personaResults) || evaluation.personaResults.length < 1 || evaluation.personaResults.length > 30) return false;
  const personaIds = new Set();
  for (const result of evaluation.personaResults) {
    if (!isPlainObject(result) || typeof result.personaId !== 'string' || personaIds.has(result.personaId)) return false;
    personaIds.add(result.personaId);
    if (!DECISIONS.has(result.decision) || !finiteScore(result.score) || !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1) return false;
    if (!isPlainObject(result.componentScores) || !COMPONENTS.every((key) => finiteScore(result.componentScores[key]))) return false;
    if (!['reaction', 'friction', 'improvement'].every((key) => typeof result[key] === 'string')) return false;
  }
  const expectedPersonaIds = new Set(pack.personas.map((persona) => persona.id));
  const expectedSegments = new Set(pack.personas.map((persona) => persona.segment));
  return sameSet(personaIds, expectedPersonaIds) && sameSet(new Set(Object.keys(evaluation.segmentScores)), expectedSegments) &&
    isPlainObject(evaluation.nextHypothesis) && COMPONENTS.includes(evaluation.nextHypothesis.changedVariable);
}

function isState(candidate) {
  if (!isPlainObject(candidate) || candidate.schemaVersion !== 2 || !Array.isArray(candidate.creatives) || candidate.creatives.length < 1) return false;
  if (!isWorkspace(candidate.workspace) || !Array.isArray(candidate.personaPacks) || !candidate.personaPacks.every((pack) => validatePersonaPack(pack).valid)) return false;
  const packIds = candidate.personaPacks.map((pack) => pack.id);
  if (new Set(packIds).size !== packIds.length || !packIds.includes(candidate.selectedPersonaPackId)) return false;
  if (!candidate.creatives.every(isCreative) || candidate.creatives.some((creative) => {
    const pack = candidate.personaPacks.find((item) => item.id === creative.personaPackId);
    return !pack || creative.businessModel !== pack.businessModel || !pack.journeyStages.some((stage) => stage.id === creative.journeyStage);
  }) || !isPlainObject(candidate.evaluations) || !isPlainObject(candidate.actuals) || !isPlainObject(candidate.journeys)) return false;
  const ids = candidate.creatives.map((creative) => creative.id);
  if (new Set(ids).size !== ids.length || !ids.includes(candidate.selectedCreativeId) || !VIEWS.has(candidate.activeView)) return false;
  if (!Object.entries(candidate.evaluations).every(([id, evaluation]) => {
    const creative = candidate.creatives.find((item) => item.id === id);
    const pack = candidate.personaPacks.find((item) => item.id === creative?.personaPackId);
    return Boolean(creative && pack && isEvaluation(evaluation, creative, pack));
  })) return false;
  if (!Object.entries(candidate.actuals).every(([id, actual]) => ids.includes(id) && actual.creativeId === id && validateActual(actual).valid)) return false;
  if (!Object.entries(candidate.journeys).every(([id, journey]) => {
    const creative = candidate.creatives.find((item) => item.id === id);
    const pack = candidate.personaPacks.find((item) => item.id === creative?.personaPackId);
    return Boolean(creative && pack && validateJourneyForecast(journey, id, pack).valid);
  })) return false;
  return true;
}

export function updateCreativeDraft(currentState, draft) {
  const state = clone(currentState);
  const index = state.creatives.findIndex((creative) => creative.id === draft?.id);
  if (index < 0 || !isCreative(draft)) throw new TypeError('draft creative ไม่ถูกต้อง');
  const previous = state.creatives[index];
  state.creatives[index] = clone(draft);
  if (SCORING_FIELDS.some((field) => previous[field] !== draft[field]) || (previous.media?.sha256 ?? '') !== (draft.media?.sha256 ?? '')) {
    delete state.evaluations[draft.id];
    delete state.journeys[draft.id];
  }
  return state;
}

// Repair what can be repaired instead of throwing the whole workspace away: a stale evaluation,
// journey or actual (e.g. written by an older engine, or tied to a pack revision that changed) is
// dropped; creatives, packs and settings survive. Only a state whose core shape is unusable falls
// back to the sample workspace — and loadState() keeps the raw copy under a recovery key first.
function sanitize(candidate) {
  if (!isPlainObject(candidate) || candidate.schemaVersion !== 2) return { value: candidate, dropped: 0 };
  const value = clone(candidate);
  let dropped = 0;
  if (!isWorkspace(value.workspace)) { value.workspace = createWorkspaceDefaults(); dropped += 1; }
  if (Array.isArray(value.personaPacks)) {
    const seen = new Set();
    const packs = value.personaPacks.filter((pack) => validatePersonaPack(pack).valid && !seen.has(pack.id) && seen.add(pack.id));
    dropped += value.personaPacks.length - packs.length;
    value.personaPacks = packs;
  }
  const packs = Array.isArray(value.personaPacks) ? value.personaPacks : [];
  if (packs.length && Array.isArray(value.creatives)) {
    const seen = new Set();
    value.creatives = value.creatives.filter((creative) => isPlainObject(creative) && isSafeId(creative.id) && !seen.has(creative.id) && seen.add(creative.id)).map((input) => {
      // A broken media reference never costs the touchpoint: drop the reference, keep the text.
      let creative = input;
      if (!isMedia(input.media, input.id)) { const { media, ...rest } = input; creative = rest; dropped += 1; }
      let pack = packs.find((item) => item.id === creative.personaPackId);
      if (!pack) { pack = packs.find((item) => item.businessModel === creative.businessModel) ?? packs[0]; dropped += 1; }
      const stageOk = pack.journeyStages.some((stage) => stage.id === creative.journeyStage);
      return { ...creative, personaPackId: pack.id, businessModel: pack.businessModel, journeyStage: stageOk ? creative.journeyStage : pack.journeyStages[0].id };
    }).filter((creative) => {
      const ok = isCreative(creative);
      if (!ok) dropped += 1;
      return ok;
    });
    if (!packs.some((pack) => pack.id === value.selectedPersonaPackId)) value.selectedPersonaPackId = packs[0].id;
    if (value.creatives.length && !value.creatives.some((creative) => creative.id === value.selectedCreativeId)) value.selectedCreativeId = value.creatives[0].id;
  }
  if (!VIEWS.has(value.activeView)) value.activeView = 'workbench';
  const creatives = Array.isArray(value.creatives) ? value.creatives : [];
  const packFor = (id) => packs.find((pack) => pack.id === creatives.find((creative) => creative.id === id)?.personaPackId);
  for (const key of ['evaluations', 'journeys', 'actuals']) {
    if (!isPlainObject(value[key])) { value[key] = {}; continue; }
    for (const [id, entry] of Object.entries(value[key])) {
      const creative = creatives.find((item) => item.id === id);
      const pack = packFor(id);
      const ok = key === 'evaluations' ? Boolean(creative && pack && isEvaluation(entry, creative, pack))
        : key === 'journeys' ? Boolean(creative && pack && validateJourneyForecast(entry, id, pack).valid)
          : Boolean(creative && entry?.creativeId === id && validateActual(entry).valid);
      if (!ok) { delete value[key][id]; dropped += 1; }
    }
  }
  return { value, dropped };
}

export function validateState(candidate, fallback = null) {
  const { value, dropped } = sanitize(migrateStateV1(candidate));
  if (isState(value)) {
    const notices = [];
    if (candidate?.schemaVersion === 1) notices.push('อัปเกรดข้อมูลเดิมเป็น schema version 2 แล้ว');
    if (dropped) notices.push(`ล้างผลประเมินหรือข้อมูลที่ใช้ไม่ได้ ${dropped} รายการ — Touchpoint และ Persona Pack ยังอยู่ครบ`);
    return Object.freeze({ state: clone(value), recovered: false, repaired: dropped, notice: notices.join(' · ') });
  }
  return Object.freeze({
    state: fallback ? clone(fallback) : seedState(),
    recovered: true,
    repaired: 0,
    notice: 'ข้อมูลที่พบเปิดไม่ได้ จึงเริ่มจาก workspace ตัวอย่าง — สำเนาข้อมูลเดิมเก็บไว้แล้ว ดาวน์โหลดได้ที่ Settings',
  });
}

export function loadState(storage = globalThis.localStorage, key = STORAGE_KEY) {
  let raw = null;
  try { raw = storage?.getItem(key) ?? null; } catch { raw = null; }
  if (!raw) return Object.freeze({ state: seedState(), recovered: false, repaired: 0, notice: '' });
  let result;
  try { result = validateState(JSON.parse(raw)); } catch { result = validateState(null); }
  if (result.recovered) {
    try { storage?.setItem(`${key}${RECOVERY_SUFFIX}`, raw); } catch { /* quota: the notice still tells the user */ }
  }
  return result;
}

export function readRecovery(storage = globalThis.localStorage, key = STORAGE_KEY) {
  try { return storage?.getItem(`${key}${RECOVERY_SUFFIX}`) ?? null; } catch { return null; }
}

export function saveState(state, storage = globalThis.localStorage, key = STORAGE_KEY) {
  const validated = validateState(state);
  if (validated.recovered) throw new TypeError('บันทึกไม่ได้: state ไม่ผ่าน schema version 2');
  storage?.setItem(key, JSON.stringify(validated.state));
  return validated.state;
}
