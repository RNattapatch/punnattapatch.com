import test from 'node:test';
import assert from 'node:assert/strict';
import { playbook } from '../../src/data/line-ai-sales-agent/playbook.js';
import { validatePlaybook } from '../../src/data/line-ai-sales-agent/schema.js';

test('defines the four-phase LINE AI Sales Agent journey with one example business', () => {
  assert.deepEqual(playbook.phases.map((phase) => phase.label), ['PREPARE', 'BUILD', 'SELL', 'ARM']);
  assert.equal(playbook.exampleBusiness.name, 'บ้านโซฟา');
  assert.equal(validatePlaybook(playbook).valid, true);
});

test('maps the complete 32-step journey to observable operating milestones', () => {
  const expectedSteps = {
    prepare: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'],
    build: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'],
    sell: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
    arm: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
  };

  assert.equal(playbook.phases.flatMap((phase) => phase.steps).length, 32);
  for (const [phaseId, stepIds] of Object.entries(expectedSteps)) {
    const phase = playbook.phases.find((item) => item.id === phaseId);
    assert.deepEqual(phase.steps.map((step) => step.id), stepIds);
    assert.ok(phase.milestone.title);
    assert.ok(phase.milestone.proof);
    for (const step of phase.steps) {
      assert.ok(step.why);
      assert.ok(step.actions.length > 0);
      assert.ok(step.check);
      assert.ok(step.fixes.length > 0);
      assert.ok(step.proof);
    }
  }
});

test('covers all setup companion sources and only points dependencies backward', () => {
  const steps = playbook.phases.flatMap((phase) => phase.steps);
  const sourceRefs = new Set(steps.flatMap((step) => step.sourceRefs));
  for (const sourceRef of ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'D-01', 'D-02']) {
    assert.ok(sourceRefs.has(sourceRef), `missing source mapping: ${sourceRef}`);
  }

  const position = new Map(steps.map((step, index) => [step.id, index]));
  for (const step of steps) {
    for (const dependency of step.dependsOn ?? []) {
      assert.ok(position.get(dependency) < position.get(step.id), `${step.id} depends on a later step: ${dependency}`);
    }
  }
});

test('defines eight safe master prompts and one debug prompt for real steps', () => {
  assert.deepEqual(playbook.prompts.map((prompt) => prompt.id), [
    'MP-01', 'MP-02', 'MP-03', 'MP-04', 'MP-05', 'MP-06', 'MP-07', 'MP-08', 'DEBUG-01',
  ]);

  const stepIds = new Set(playbook.phases.flatMap((phase) => phase.steps.map((step) => step.id)));
  for (const prompt of playbook.prompts) {
    assert.ok(prompt.stepIds.length > 0, prompt.id);
    assert.ok(prompt.stepIds.every((stepId) => stepIds.has(stepId)), prompt.id);
    assert.equal(/api key|token|secret|password/i.test(prompt.editableFields.join(' ')), false, prompt.id);
    assert.match(prompt.safetyNote, /secret/i);
  }
});

test('links every global symptom to real learner steps', () => {
  const stepIds = new Set(playbook.phases.flatMap((phase) => phase.steps.map((step) => step.id)));
  assert.equal(playbook.troubleshooting.length, 20);
  for (const item of playbook.troubleshooting) {
    assert.ok(item.symptom);
    assert.ok(item.stepIds.length > 0);
    assert.ok(item.stepIds.every((stepId) => stepIds.has(stepId)), item.id);
    assert.ok(item.checks.length > 0, item.id);
    assert.ok(item.debugPromptContext);
  }
});
