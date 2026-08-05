import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlaybook } from '../../src/data/line-ai-sales-agent/schema.js';

function validStep(id, overrides = {}) {
  return {
    id,
    title: `Step ${id}`,
    why: 'เหตุผลที่ต้องทำ',
    actions: ['ทำรายการนี้'],
    check: 'เห็นผลลัพธ์ที่ตรวจได้',
    fixes: ['ตรวจการตั้งค่าที่เกี่ยวข้อง'],
    proof: 'ทดสอบและบันทึกผลลัพธ์',
    ...overrides,
  };
}

function validPlaybook(overrides = {}) {
  return {
    version: 'v1',
    exampleBusiness: { name: 'บ้านโซฟา' },
    prompts: [],
    troubleshooting: [],
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: { title: 'พร้อมเริ่ม', proof: 'ทดสอบแล้ว' },
      steps: [validStep('P0')],
    }],
    ...overrides,
  };
}

test('rejects a required step with no observable proof', () => {
  const result = validatePlaybook({
    version: 'v1',
    exampleBusiness: {},
    prompts: [],
    troubleshooting: [],
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: {},
      steps: [{
        id: 'P0',
        title: 'Start',
        why: 'Why',
        actions: ['Do'],
        check: 'Check',
        fixes: ['Fix'],
        proof: '',
      }],
    }],
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /P0.*proof/i);
});

test('rejects duplicate step IDs and a missing dependency', () => {
  const result = validatePlaybook(validPlaybook({
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: { title: 'พร้อมเริ่ม', proof: 'ทดสอบแล้ว' },
      steps: [validStep('P0'), validStep('P0', { dependsOn: ['P99'] })],
    }],
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /duplicate step id: P0/i);
  assert.match(result.errors.join('\n'), /P0.*missing dependency: P99/i);
});

test('rejects prohibited public course language and secret-shaped strings', () => {
  const result = validatePlaybook(validPlaybook({
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: { title: 'พร้อมเริ่ม', proof: 'ทดสอบแล้ว' },
      steps: [validStep('P0', {
        title: 'FutureSkill Course setup',
        actions: ['วาง sk-or-not-a-real-secret ตรงนี้'],
      })],
    }],
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /prohibited public term: FutureSkill/i);
  assert.match(result.errors.join('\n'), /prohibited public term: Course/i);
  assert.match(result.errors.join('\n'), /secret-shaped content/i);
});

test('rejects Thai course language and standalone episode labels', () => {
  const result = validatePlaybook(validPlaybook({
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: { title: 'พร้อมเริ่ม', proof: 'ทดสอบแล้ว' },
      steps: [validStep('P0', { title: 'EP 1: คอร์สเริ่มต้น' })],
    }],
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /prohibited public term: คอร์ส/i);
  assert.match(result.errors.join('\n'), /prohibited public label: EP/i);
});

test('rejects a phase without an operating milestone or learner steps', () => {
  const result = validatePlaybook(validPlaybook({
    phases: [{ id: 'prepare', label: 'PREPARE', milestone: {}, steps: [] }],
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /PREPARE.*missing milestone title/i);
  assert.match(result.errors.join('\n'), /PREPARE.*missing milestone proof/i);
  assert.match(result.errors.join('\n'), /PREPARE.*requires at least one step/i);
});

test('rejects forward dependencies and references from prompts or troubleshooting', () => {
  const result = validatePlaybook(validPlaybook({
    prompts: [{ id: 'MP-01', stepIds: ['P99'], editableFields: ['shopName'], safetyNote: 'Keep every secret outside this prompt.' }],
    troubleshooting: [{ id: 'missing-step', stepIds: ['P98'], checks: ['ตรวจ log'], debugPromptContext: 'ตรวจเส้นทาง' }],
    phases: [{
      id: 'prepare',
      label: 'PREPARE',
      milestone: { title: 'พร้อมเริ่ม', proof: 'ทดสอบแล้ว' },
      steps: [validStep('P0', { dependsOn: ['P1'] }), validStep('P1')],
    }],
  }));

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /P0.*dependency must point backward: P1/i);
  assert.match(result.errors.join('\n'), /MP-01.*missing step reference: P99/i);
  assert.match(result.errors.join('\n'), /missing-step.*missing step reference: P98/i);
});
