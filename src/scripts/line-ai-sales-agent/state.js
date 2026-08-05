export const STATE_VERSION = 'v1';

export const STORAGE_KEYS = Object.freeze({
  progress: 'pun:line-ai-sales-agent:v1:progress',
  profile: 'pun:line-ai-sales-agent:v1:profile',
  ui: 'pun:line-ai-sales-agent:v1:ui',
});

const SECRET_FIELD_PATTERN = /api.?key|access.?token|channel.?secret|token|secret|password|bank|account.?number|accountnumber|phone|customer|slip|conversation|chat.?log/i;
const SECRET_VALUE_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]+\b/i,
  /\bBearer\s+[A-Za-z0-9._-]+\b/i,
  /\bChannel\s+(?:Access\s+Token|Secret)\s*:\s*\S+/i,
];

function readJson(storage, key) {
  if (!storage?.getItem) return {};
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function isAllowedScalar(value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isSafeProfileEntry(key, value) {
  return !SECRET_FIELD_PATTERN.test(key) && isAllowedScalar(value) && !SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(String(value)));
}

function sanitizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {};
  return Object.fromEntries(Object.entries(record).filter(([key, value]) => isSafeProfileEntry(key, value)));
}

function allSteps(playbook) {
  return (playbook?.phases ?? []).flatMap((phase) => (phase.steps ?? []).map((step) => ({ ...step, phaseId: phase.id })));
}

function allStepIds(playbook) {
  return new Set(allSteps(playbook).map((step) => step.id));
}

function actionId(stepId, index) {
  return `${stepId}:action-${index + 1}`;
}

function allActionIds(playbook) {
  return new Set(allSteps(playbook).flatMap((step) => (step.actions ?? []).map((_, index) => actionId(step.id, index))));
}

function allMilestoneIds(playbook) {
  return new Set((playbook?.phases ?? []).map((phase) => phase.id));
}

function firstLocation(playbook) {
  const phase = playbook?.phases?.[0];
  const step = phase?.steps?.[0];
  return phase && step ? { phaseId: phase.id, stepId: step.id } : { phaseId: null, stepId: null };
}

function isValidDateString(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function createInitialState(playbook) {
  return {
    version: STATE_VERSION,
    contentVersion: playbook?.contentVersion ?? playbook?.version ?? STATE_VERSION,
    completedItemIds: [],
    blockedStepIds: [],
    confirmedMilestoneIds: [],
    current: firstLocation(playbook),
    shopProfile: {},
    notes: {},
    savedAt: null,
  };
}

export function migrateState(rawState, playbook) {
  const initial = createInitialState(playbook);
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const stepIds = allStepIds(playbook);
  const itemIds = allActionIds(playbook);
  const milestoneIds = allMilestoneIds(playbook);
  const current = source.current && stepIds.has(source.current.stepId) && (playbook.phases ?? []).some((phase) => phase.id === source.current.phaseId && (phase.steps ?? []).some((step) => step.id === source.current.stepId))
    ? { phaseId: source.current.phaseId, stepId: source.current.stepId }
    : initial.current;

  return {
    ...initial,
    version: STATE_VERSION,
    contentVersion: initial.contentVersion,
    completedItemIds: Array.isArray(source.completedItemIds) ? source.completedItemIds.filter((id) => itemIds.has(id)) : [],
    blockedStepIds: Array.isArray(source.blockedStepIds) ? source.blockedStepIds.filter((id) => stepIds.has(id)) : [],
    confirmedMilestoneIds: Array.isArray(source.confirmedMilestoneIds) ? source.confirmedMilestoneIds.filter((id) => milestoneIds.has(id)) : [],
    current,
    shopProfile: sanitizeRecord(source.shopProfile),
    notes: sanitizeRecord(source.notes),
    savedAt: isValidDateString(source.savedAt) ? source.savedAt : null,
  };
}

export function loadState(storage, playbook) {
  const rawProgress = readJson(storage, STORAGE_KEYS.progress);
  const rawProfile = readJson(storage, STORAGE_KEYS.profile);
  const rawUi = readJson(storage, STORAGE_KEYS.ui);
  return migrateState({
    ...rawProgress,
    ...rawProfile,
    ...rawUi,
    shopProfile: rawProfile.shopProfile ?? rawProfile,
    notes: rawProfile.notes,
    current: rawUi.current,
  }, playbook);
}

export function saveState(storage, state, playbook, now = () => new Date()) {
  const migrated = migrateState({ ...state, savedAt: now().toISOString() }, playbook);
  if (!storage?.setItem) return migrated;

  storage.setItem(STORAGE_KEYS.progress, JSON.stringify({
    version: migrated.version,
    contentVersion: migrated.contentVersion,
    completedItemIds: migrated.completedItemIds,
    blockedStepIds: migrated.blockedStepIds,
    confirmedMilestoneIds: migrated.confirmedMilestoneIds,
    savedAt: migrated.savedAt,
  }));
  storage.setItem(STORAGE_KEYS.profile, JSON.stringify({ shopProfile: migrated.shopProfile, notes: migrated.notes }));
  storage.setItem(STORAGE_KEYS.ui, JSON.stringify({ current: migrated.current }));
  return migrated;
}

export function clearState(storage) {
  if (!storage?.removeItem) return;
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
}

export function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

export { actionId, SECRET_FIELD_PATTERN, SECRET_VALUE_PATTERNS };
