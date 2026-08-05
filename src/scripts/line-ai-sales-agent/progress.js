import { actionId } from './state.js';

export const STEP_STATUSES = Object.freeze(['not-started', 'in-progress', 'needs-attention', 'working']);

function actionItem(step, action, index) {
  if (typeof action === 'string') {
    return { id: actionId(step.id, index), stepId: step.id, label: action, required: true };
  }
  return {
    id: actionId(step.id, index),
    stepId: step.id,
    label: action?.label ?? '',
    required: action?.required !== false,
  };
}

export function getStepActionItems(step) {
  return (step.actions ?? []).map((action, index) => actionItem(step, action, index));
}

export function flattenSteps(playbook) {
  return (playbook.phases ?? []).flatMap((phase, phaseIndex) => (phase.steps ?? []).map((step, stepIndex) => ({
    ...step,
    phaseId: phase.id,
    phaseLabel: phase.label,
    phaseIndex,
    stepIndex,
    actionItems: getStepActionItems(step),
  })));
}

function completionFor(items, completedItemIds) {
  const completed = new Set(completedItemIds ?? []);
  const requiredItems = items.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => completed.has(item.id)).length;
  return {
    total: items.length,
    completed: items.filter((item) => completed.has(item.id)).length,
    required: requiredItems.length,
    requiredCompleted: completedRequired,
    ready: requiredItems.length > 0 && completedRequired === requiredItems.length,
  };
}

export function getStepProgress(step, state) {
  const completion = completionFor(step.actionItems ?? getStepActionItems(step), state.completedItemIds);
  const blocked = (state.blockedStepIds ?? []).includes(step.id);
  let status = 'not-started';
  if (blocked) status = 'needs-attention';
  else if (completion.ready) status = 'working';
  else if (completion.completed > 0) status = 'in-progress';
  return { ...step, completion, blocked, status };
}

export function getPhaseProgress(phase, state, steps = flattenSteps({ phases: [phase] })) {
  const phaseSteps = steps.filter((step) => step.phaseId === phase.id).map((step) => getStepProgress(step, state));
  const allItems = phaseSteps.flatMap((step) => step.actionItems);
  const completion = completionFor(allItems, state.completedItemIds);
  const milestoneConfirmed = (state.confirmedMilestoneIds ?? []).includes(phase.id);
  const needsAttention = phaseSteps.some((step) => step.status === 'needs-attention');
  let status = 'not-started';
  if (needsAttention) status = 'needs-attention';
  else if (completion.ready && milestoneConfirmed) status = 'working';
  else if (completion.completed > 0) status = 'in-progress';
  return {
    id: phase.id,
    label: phase.label,
    title: phase.title,
    milestone: { ...phase.milestone, confirmed: milestoneConfirmed, ready: completion.ready },
    steps: phaseSteps,
    completion,
    status,
  };
}

function findCurrentPhase(playbook, state) {
  return (playbook.phases ?? []).find((phase) => phase.id === state.current?.phaseId) ?? playbook.phases?.[0];
}

function firstIncompleteStep(phaseProgress) {
  return phaseProgress.steps.find((step) => step.status !== 'working');
}

export function getResumeRecommendation(playbook, state, phaseProgresses = (playbook.phases ?? []).map((phase) => getPhaseProgress(phase, state))) {
  const currentPhase = findCurrentPhase(playbook, state);
  const currentPhaseProgress = phaseProgresses.find((phase) => phase.id === currentPhase?.id);
  const currentStep = currentPhaseProgress?.steps.find((step) => step.id === state.current?.stepId);

  if (currentStep?.status === 'needs-attention') {
    return { phaseId: currentStep.phaseId, stepId: currentStep.id, reason: 'blocked' };
  }

  const firstBlocked = phaseProgresses.flatMap((phase) => phase.steps).find((step) => step.status === 'needs-attention');
  if (firstBlocked) return { phaseId: firstBlocked.phaseId, stepId: firstBlocked.id, reason: 'blocked' };

  const incompleteCurrent = currentPhaseProgress && firstIncompleteStep(currentPhaseProgress);
  if (incompleteCurrent) return { phaseId: incompleteCurrent.phaseId, stepId: incompleteCurrent.id, reason: 'required-step' };

  if (currentPhaseProgress && currentPhaseProgress.completion.ready && !currentPhaseProgress.milestone.confirmed) {
    const lastStep = currentPhaseProgress.steps.at(-1);
    return { phaseId: currentPhaseProgress.id, stepId: lastStep?.id ?? null, reason: 'milestone' };
  }

  const currentPhaseIndex = (playbook.phases ?? []).findIndex((phase) => phase.id === currentPhaseProgress?.id);
  const nextPhase = (playbook.phases ?? []).slice(currentPhaseIndex + 1).find((phase) => {
    const progress = phaseProgresses.find((item) => item.id === phase.id);
    return progress?.status !== 'working';
  });
  if (nextPhase) return { phaseId: nextPhase.id, stepId: nextPhase.steps?.[0]?.id ?? null, reason: 'next-phase' };

  return { phaseId: null, stepId: null, reason: 'final-review' };
}

export function deriveProgress(playbook, state) {
  const steps = flattenSteps(playbook);
  const phases = (playbook.phases ?? []).map((phase) => getPhaseProgress(phase, state, steps));
  const allItems = steps.flatMap((step) => step.actionItems);
  const overall = completionFor(allItems, state.completedItemIds);
  const percentage = overall.required === 0 ? 0 : Math.round((overall.requiredCompleted / overall.required) * 100);
  return {
    steps: phases.flatMap((phase) => phase.steps),
    phases,
    overall: { ...overall, percentage },
    resume: getResumeRecommendation(playbook, state, phases),
  };
}
