export const REQUIRED_STEP_FIELDS = ['id', 'title', 'why', 'actions', 'check', 'fixes', 'proof'];

export const PROHIBITED_PUBLIC_TERMS = [
  'FutureSkill',
  'Course',
  'Course Companion',
  'Class Project',
  'Certificate',
  'คอร์ส',
];

export const PROHIBITED_PUBLIC_PATTERNS = [
  { label: 'EP', pattern: /(?:^|\W)EP(?:$|\W)/i },
];

export const PROHIBITED_SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]+\b/i,
  /\bBearer\s+[A-Za-z0-9._-]+\b/i,
  /\bChannel Access Token\s*:\s*\S+/i,
  /\bChannel Secret\s*:\s*\S+/i,
];

function collectStrings(value, strings = []) {
  if (typeof value === 'string') strings.push(value);
  if (Array.isArray(value)) value.forEach((item) => collectStrings(item, strings));
  if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, strings));
  return strings;
}

export function validatePlaybook(playbook) {
  const errors = [];
  const stepIds = new Set();
  const steps = [];

  for (const phase of playbook.phases ?? []) {
    if (!phase.milestone?.title) errors.push(`${phase.label}: missing milestone title`);
    if (!phase.milestone?.proof) errors.push(`${phase.label}: missing milestone proof`);
    if (!phase.steps?.length) errors.push(`${phase.label}: requires at least one step`);

    for (const step of phase.steps ?? []) {
      if (stepIds.has(step.id)) errors.push(`duplicate step id: ${step.id}`);
      stepIds.add(step.id);
      steps.push(step);

      for (const field of REQUIRED_STEP_FIELDS) {
        const value = step[field];
        const missing = value === '' || value === undefined || value === null || (Array.isArray(value) && value.length === 0);
        if (missing) errors.push(`${step.id}: missing ${field}`);
      }
    }
  }

  const stepPosition = new Map(steps.map((step, index) => [step.id, index]));

  for (const step of steps) {
    for (const dependency of step.dependsOn ?? []) {
      if (!stepIds.has(dependency)) errors.push(`${step.id}: missing dependency: ${dependency}`);
      if (stepPosition.get(dependency) >= stepPosition.get(step.id)) {
        errors.push(`${step.id}: dependency must point backward: ${dependency}`);
      }
    }
  }

  for (const prompt of playbook.prompts ?? []) {
    for (const stepId of prompt.stepIds ?? []) {
      if (!stepIds.has(stepId)) errors.push(`${prompt.id}: missing step reference: ${stepId}`);
    }
  }

  for (const item of playbook.troubleshooting ?? []) {
    for (const stepId of item.stepIds ?? []) {
      if (!stepIds.has(stepId)) errors.push(`${item.id}: missing step reference: ${stepId}`);
    }
  }

  const publicStrings = collectStrings(playbook);
  for (const term of PROHIBITED_PUBLIC_TERMS) {
    if (publicStrings.some((value) => value.toLocaleLowerCase('en').includes(term.toLocaleLowerCase('en')))) {
      errors.push(`prohibited public term: ${term}`);
    }
  }

  for (const { label, pattern } of PROHIBITED_PUBLIC_PATTERNS) {
    if (publicStrings.some((value) => pattern.test(value))) {
      errors.push(`prohibited public label: ${label}`);
    }
  }

  if (PROHIBITED_SECRET_PATTERNS.some((pattern) => publicStrings.some((value) => pattern.test(value)))) {
    errors.push('secret-shaped content found');
  }

  return { valid: errors.length === 0, errors };
}
