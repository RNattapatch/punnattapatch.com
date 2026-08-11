import test from 'node:test';
import assert from 'node:assert/strict';
import { playbook } from '../../src/data/line-ai-sales-agent/playbook.js';
import { createPlaybookEngine } from '../../src/scripts/line-ai-sales-agent/app.js';
import { csvCell } from '../../src/scripts/line-ai-sales-agent/export.js';

class TestStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.get(key) ?? null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

const fixedNow = () => new Date('2026-08-05T07:30:00.000Z');

function createEngine(storage = new TestStorage()) {
  return createPlaybookEngine({ playbook, storage, now: fixedNow });
}

test('starts with an empty local state and persists checklist progress across reloads', () => {
  const storage = new TestStorage();
  const engine = createEngine(storage);

  assert.equal(engine.getState().completedItemIds.length, 0);
  assert.equal(engine.getProgress().overall.completed, 0);

  engine.setChecklistItem('P0:action-1', true);
  engine.setCurrent('prepare', 'P1');
  engine.setBlocked('P1', true);

  const reloaded = createEngine(storage);
  assert.deepEqual(reloaded.getState().completedItemIds, ['P0:action-1']);
  assert.deepEqual(reloaded.getState().current, { phaseId: 'prepare', stepId: 'P1' });
  assert.deepEqual(reloaded.getState().blockedStepIds, ['P1']);
  assert.equal(reloaded.getState().savedAt, '2026-08-05T07:30:00.000Z');
});

test('derives step and phase readiness without auto-confirming a milestone', () => {
  const engine = createEngine();
  const prepare = playbook.phases.find((phase) => phase.id === 'prepare');
  const p0 = prepare.steps.find((step) => step.id === 'P0');

  for (let index = 0; index < p0.actions.length; index += 1) {
    engine.setChecklistItem(`P0:action-${index + 1}`, true);
  }

  let progress = engine.getProgress();
  assert.equal(progress.steps.find((step) => step.id === 'P0').status, 'working');
  assert.equal(progress.phases.find((phase) => phase.id === 'prepare').status, 'in-progress');
  assert.equal(progress.phases.find((phase) => phase.id === 'prepare').milestone.confirmed, false);

  engine.confirmMilestone('prepare', true);
  progress = engine.getProgress();
  assert.equal(progress.phases.find((phase) => phase.id === 'prepare').status, 'in-progress');
  assert.deepEqual(progress.phases.find((phase) => phase.id === 'prepare').milestone.confirmed, true);
});

test('resume logic prioritizes the current blocked step, then incomplete work, then milestones', () => {
  const engine = createEngine();

  engine.setCurrent('prepare', 'P2');
  engine.setBlocked('P2', true);
  assert.deepEqual(engine.getProgress().resume, { phaseId: 'prepare', stepId: 'P2', reason: 'blocked' });

  engine.setBlocked('P2', false);
  assert.deepEqual(engine.getProgress().resume, { phaseId: 'prepare', stepId: 'P0', reason: 'required-step' });
});

test('searches Thai and English content and applies phase, status, and type filters', () => {
  const engine = createEngine();

  const webhookResults = engine.search('webhook');
  assert.ok(webhookResults.items.some((item) => item.stepId === 'S1'));

  const negotiationResults = engine.search('ส่วนลด', { phaseId: 'sell', status: 'not-started' });
  assert.ok(negotiationResults.items.some((item) => item.stepId === 'S4'));
  assert.ok(negotiationResults.items.every((item) => item.phaseId === 'sell'));

  const promptResults = engine.search('การ์ดสินค้า', { type: 'prompt' });
  assert.ok(promptResults.items.some((item) => item.stepId === 'A1'));
  assert.ok(promptResults.items.every((item) => item.type === 'prompt'));
});

test('composes an editable prompt and redacts secret-shaped values', () => {
  const engine = createEngine();

  const safe = engine.composePrompt('MP-01', {
    shopName: 'บ้านโซฟา',
    catalogSource: 'products.xlsx',
    tone: 'สุภาพ เป็นกันเอง',
    discountCeiling: 'ลดได้สูงสุด 5%',
    allowedGift: 'ชุดหมอนอิง',
    escalationAmount: '50,000 บาท',
    paymentPolicy: 'โอนบัญชี',
    depositRate: '50%',
    currentPromotion: 'ยังไม่มี ให้ทำโครงว่างไว้',
  });
  assert.match(safe.text, /ลดได้สูงสุด 5%/);
  assert.doesNotMatch(safe.text, /\{\{.*?\}\}/);
  assert.deepEqual(safe.redactedFields, []);

  const unsafe = engine.composePrompt('MP-01', {
    discountCeiling: 'sk-live-not-for-public',
    allowedGift: 'ของแถม',
  });
  assert.doesNotMatch(unsafe.text, /sk-live-not-for-public/);
  assert.deepEqual(unsafe.redactedFields, ['discountCeiling']);
});

test('refuses secret profile fields and prefixes formula-shaped CSV cells', () => {
  const engine = createEngine();
  assert.throws(() => engine.setShopProfile('openRouterApiKey', 'sk-live-not-for-public'), /secret-shaped/i);
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell('@customer'), "'@customer");
});

test('exports a safe progress summary, CSV, and previewable JSON backup', () => {
  const engine = createEngine();
  engine.setChecklistItem('P0:action-1', true);
  engine.setShopProfile('shopName', 'บ้านโซฟา');

  const summary = engine.copyProgressSummary();
  assert.match(summary, /LINE AI Sales Agent Playbook/);
  assert.match(summary, /Saved locally: 5 Aug 2026/);
  assert.doesNotMatch(summary, /token|secret|password|sk-/i);

  const csv = engine.exportCsv();
  assert.match(csv, /P0/);
  assert.match(csv, /action-1/);
  assert.ok(csv.split('\n').length > 10);

  const backup = engine.exportBackup();
  const preview = engine.previewImport(backup);
  assert.equal(preview.valid, true);
  assert.equal(preview.completedItemCount, 1);
  assert.equal(preview.blockedStepCount, 0);
});

test('imports a validated backup and reset clears all local state', () => {
  const engine = createEngine();
  engine.setChecklistItem('P0:action-1', true);
  engine.setBlocked('P1', true);
  const backup = engine.exportBackup();

  engine.reset();
  assert.equal(engine.getState().completedItemIds.length, 0);
  assert.equal(engine.getState().blockedStepIds.length, 0);

  const restored = engine.importBackup(backup);
  assert.equal(restored.completedItemCount, 1);
  assert.deepEqual(engine.getState().blockedStepIds, ['P1']);
  assert.throws(() => engine.previewImport('{"format":"pun-line-ai-sales-agent-backup","version":"v9","completedItemIds":["P0:action-1"]}'), /unsupported backup version/i);
});

test('migrates old local data while dropping unknown and secret-shaped profile fields', () => {
  const storage = new TestStorage();
  storage.setItem('pun:line-ai-sales-agent:v1:progress', JSON.stringify({
    version: 'v0',
    contentVersion: 'old-content',
    completedItemIds: ['P0:action-1', 'UNKNOWN:action-1'],
    blockedStepIds: ['P1', 'UNKNOWN'],
    confirmedMilestoneIds: [],
    savedAt: '2026-08-04T00:00:00.000Z',
  }));
  storage.setItem('pun:line-ai-sales-agent:v1:profile', JSON.stringify({
    shopName: 'บ้านโซฟา',
    openRouterApiKey: 'sk-do-not-store',
  }));
  storage.setItem('pun:line-ai-sales-agent:v1:ui', JSON.stringify({
    current: { phaseId: 'missing', stepId: 'missing' },
  }));

  const engine = createEngine(storage);
  const state = engine.getState();
  assert.equal(state.version, 'v1');
  assert.equal(state.contentVersion, 'v1');
  assert.deepEqual(state.completedItemIds, ['P0:action-1']);
  assert.deepEqual(state.blockedStepIds, ['P1']);
  assert.deepEqual(state.current, { phaseId: 'prepare', stepId: 'P0' });
  assert.deepEqual(state.shopProfile, { shopName: 'บ้านโซฟา' });
});
