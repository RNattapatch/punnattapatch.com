import test from 'node:test';
import assert from 'node:assert/strict';
import { playbook } from '../../src/data/line-ai-sales-agent/playbook.js';
import { createPlaybookEngine } from '../../src/scripts/line-ai-sales-agent/app.js';
import {
  getInitialRoute,
  getNextLocation,
  getPreviousLocation,
  getResumeLabel,
  getStepByLocation,
} from '../../src/scripts/line-ai-sales-agent/ui-model.js';

class TestStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
}

test('initial route starts at the resume location and falls back to home', () => {
  const engine = createPlaybookEngine({ playbook, storage: new TestStorage() });
  assert.deepEqual(getInitialRoute(playbook, engine.getProgress(), ''), { view: 'home' });
  assert.deepEqual(getInitialRoute(playbook, engine.getProgress(), '#prepare/P0'), { view: 'step', phaseId: 'prepare', stepId: 'P0' });
  assert.deepEqual(getInitialRoute(playbook, engine.getProgress(), '#progress'), { view: 'progress' });
  assert.deepEqual(getInitialRoute(playbook, engine.getProgress(), '#troubleshooting'), { view: 'troubleshooting' });
});

test('step navigation follows playbook order across phase boundaries', () => {
  assert.deepEqual(getNextLocation(playbook, 'prepare', 'P9'), { phaseId: 'build', stepId: 'B1' });
  assert.deepEqual(getPreviousLocation(playbook, 'build', 'B1'), { phaseId: 'prepare', stepId: 'P9' });
  assert.equal(getNextLocation(playbook, 'arm', 'A8'), null);
});

test('step lookup and resume labels expose actionable status', () => {
  const engine = createPlaybookEngine({ playbook, storage: new TestStorage() });
  const progress = engine.getProgress();
  const step = getStepByLocation(progress, 'sell', 'S4');
  assert.equal(step.title, 'ตั้งเพดานส่วนลดและทางออกเมื่อลดไม่ได้');
  assert.equal(getResumeLabel({ phaseId: 'prepare', stepId: 'P0', reason: 'required-step' }, playbook), 'เริ่มขั้นแรก');
  assert.equal(getResumeLabel({ phaseId: 'prepare', stepId: 'P0', reason: 'blocked' }, playbook), 'แก้จุดติดก่อน');
});
