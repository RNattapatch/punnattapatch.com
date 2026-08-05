import { validatePlaybook } from '../../data/line-ai-sales-agent/schema.js';
import { clearState, createInitialState, createMemoryStorage, loadState, saveState, SECRET_FIELD_PATTERN, SECRET_VALUE_PATTERNS } from './state.js';
import { deriveProgress, flattenSteps } from './progress.js';
import { searchPlaybook } from './search.js';
import { composePrompt } from './prompt-composer.js';
import { createProgressCsv, createProgressSummary, previewBackup, restoreBackup, serializeBackup } from './export.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function browserStorage() {
  try {
    return globalThis.localStorage ?? createMemoryStorage();
  } catch {
    return createMemoryStorage();
  }
}

function assertSafeValue(field, value) {
  if (SECRET_FIELD_PATTERN.test(field) || SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(String(value ?? '')))) {
    throw new Error('Secret-shaped fields are not stored in this Playbook');
  }
}

export function createPlaybookEngine({ playbook, storage = browserStorage(), now = () => new Date() } = {}) {
  if (!playbook) throw new Error('Playbook content is required');
  const validation = validatePlaybook(playbook);
  if (!validation.valid) throw new Error(`Invalid Playbook content: ${validation.errors.join('; ')}`);

  let state = loadState(storage, playbook);
  const stepIndex = new Map(flattenSteps(playbook).map((step) => [step.id, step]));
  const phaseIndex = new Map((playbook.phases ?? []).map((phase) => [phase.id, phase]));
  const itemIndex = new Set(flattenSteps(playbook).flatMap((step) => step.actionItems.map((item) => item.id)));

  function persist(nextState) {
    state = saveState(storage, nextState, playbook, now);
    return clone(state);
  }

  function updateList(list, value, enabled) {
    const next = new Set(list);
    if (enabled) next.add(value);
    else next.delete(value);
    return [...next];
  }

  return {
    validate: () => clone(validation),
    getState: () => clone(state),
    getProgress: () => deriveProgress(playbook, state),
    setChecklistItem(itemId, completed = true) {
      if (!itemIndex.has(itemId)) throw new Error(`Unknown checklist item: ${itemId}`);
      return persist({ ...state, completedItemIds: updateList(state.completedItemIds, itemId, completed) });
    },
    setBlocked(stepId, blocked = true) {
      if (!stepIndex.has(stepId)) throw new Error(`Unknown step: ${stepId}`);
      return persist({ ...state, blockedStepIds: updateList(state.blockedStepIds, stepId, blocked) });
    },
    confirmMilestone(phaseId, confirmed = true) {
      if (!phaseIndex.has(phaseId)) throw new Error(`Unknown phase: ${phaseId}`);
      return persist({ ...state, confirmedMilestoneIds: updateList(state.confirmedMilestoneIds, phaseId, confirmed) });
    },
    setCurrent(phaseId, stepId) {
      const phase = phaseIndex.get(phaseId);
      if (!phase || !(phase.steps ?? []).some((step) => step.id === stepId)) throw new Error(`Unknown Playbook location: ${phaseId}/${stepId}`);
      return persist({ ...state, current: { phaseId, stepId } });
    },
    setShopProfile(field, value) {
      assertSafeValue(field, value);
      return persist({ ...state, shopProfile: { ...state.shopProfile, [field]: value } });
    },
    setNote(noteId, value) {
      assertSafeValue(noteId, value);
      return persist({ ...state, notes: { ...state.notes, [noteId]: value } });
    },
    search(query = '', filters = {}) {
      return searchPlaybook(playbook, state, query, filters);
    },
    composePrompt(promptId, values = {}) {
      const prompt = (playbook.prompts ?? []).find((item) => item.id === promptId);
      if (!prompt) throw new Error(`Unknown prompt: ${promptId}`);
      return composePrompt(prompt, values);
    },
    copyProgressSummary() {
      return createProgressSummary(playbook, deriveProgress(playbook, state), state);
    },
    exportCsv() {
      return createProgressCsv(playbook, deriveProgress(playbook, state), state);
    },
    exportBackup() {
      return serializeBackup(state, now);
    },
    previewImport(payload) {
      return previewBackup(payload, playbook);
    },
    importBackup(payload) {
      const imported = restoreBackup(payload, playbook, now);
      const saved = persist(imported.state);
      return { ...imported, state: saved };
    },
    reset() {
      clearState(storage);
      state = createInitialState(playbook);
      return clone(state);
    },
  };
}
