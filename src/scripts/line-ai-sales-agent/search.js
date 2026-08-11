import { deriveProgress } from './progress.js';

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('th');
}

function asText(value) {
  if (Array.isArray(value)) return value.map(asText).join(' ');
  if (value && typeof value === 'object') return Object.values(value).map(asText).join(' ');
  return String(value ?? '');
}

function excerpt(value, query) {
  const text = asText(value).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const index = normalize(text).indexOf(normalize(query));
  if (index < 0 || text.length <= 150) return text.slice(0, 150);
  const start = Math.max(0, index - 45);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 150)}${start + 150 < text.length ? '…' : ''}`;
}

function relatedPrompts(playbook, stepId) {
  return (playbook.prompts ?? []).filter((prompt) => (prompt.stepIds ?? []).includes(stepId));
}

function relatedTroubleshooting(playbook, stepId) {
  return (playbook.troubleshooting ?? []).filter((item) => (item.stepIds ?? []).includes(stepId));
}

function fieldsFor(step, phase, playbook) {
  const prompts = relatedPrompts(playbook, step.id);
  const troubleshooting = relatedTroubleshooting(playbook, step.id);
  return [
    ['guideline', [step.title, step.why, phase.title]],
    ['action', step.actions],
    ['checkpoint', [step.check, step.proof, phase.milestone?.title, phase.milestone?.proof]],
    ['prompt', prompts.flatMap((prompt) => [prompt.title, prompt.template, prompt.safetyNote])],
    ['troubleshooting', troubleshooting.flatMap((item) => [item.symptom, item.checks, item.debugPromptContext])],
  ];
}

function matchesType(fields, type) {
  if (!type || type === 'all') return true;
  return fields.some(([fieldType, values]) => fieldType === type && asText(values).trim());
}

export function searchPlaybook(playbook, state, query = '', filters = {}) {
  const normalizedQuery = normalize(query).trim();
  const progress = deriveProgress(playbook, state);
  const progressByStep = new Map(progress.steps.map((step) => [step.id, step]));
  const items = [];

  for (const phase of playbook.phases ?? []) {
    for (const step of phase.steps ?? []) {
      const stepProgress = progressByStep.get(step.id);
      if (filters.phaseId && filters.phaseId !== 'all' && filters.phaseId !== phase.id) continue;
      if (filters.status && filters.status !== 'all' && filters.status !== stepProgress.status) continue;

      const fields = fieldsFor(step, phase, playbook);
      if (!matchesType(fields, filters.type)) continue;
      const matchedFields = fields.filter(([, values]) => !normalizedQuery || normalize(asText(values)).includes(normalizedQuery));
      if (normalizedQuery && matchedFields.length === 0) continue;
      // With a type filter on, only keep steps whose match is in that kind of content —
      // otherwise a step that merely owns a prompt would surface under a prompt-only search.
      const typeFilter = filters.type && filters.type !== 'all' ? filters.type : '';
      if (typeFilter && normalizedQuery && !matchedFields.some(([fieldType]) => fieldType === typeFilter)) continue;

      const matched = (typeFilter ? matchedFields.find(([fieldType]) => fieldType === typeFilter) : matchedFields[0]) ?? fields[0];
      items.push({
        stepId: step.id,
        phaseId: phase.id,
        phaseLabel: phase.label,
        title: step.title,
        status: stepProgress.status,
        type: matched[0],
        matchedFields: matchedFields.map(([fieldType]) => fieldType),
        excerpt: excerpt(matched[1], query),
        promptIds: relatedPrompts(playbook, step.id).map((prompt) => prompt.id),
        troubleshootingIds: relatedTroubleshooting(playbook, step.id).map((item) => item.id),
      });
    }
  }

  return { query, filters, total: items.length, items };
}
