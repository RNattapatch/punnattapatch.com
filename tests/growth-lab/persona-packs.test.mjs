import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BUILT_IN_PACKS,
  MAX_PERSONA_PACK_BYTES,
  clonePersonaPack,
  exportPersonaPack,
  importPersonaPack,
  migrateStateV1,
  personasForState,
  validatePersonaPack,
} from '../../src/scripts/growth-lab/persona-packs.mjs';

test('built-in library covers B2B, B2C, and B2G with usable journeys', () => {
  assert.deepEqual(BUILT_IN_PACKS.map((pack) => pack.businessModel).sort(), ['b2b', 'b2c', 'b2g']);
  for (const pack of BUILT_IN_PACKS) {
    assert.equal(validatePersonaPack(pack).valid, true, pack.id);
    assert.ok(pack.personas.length >= 3 && pack.personas.length <= 30, pack.id);
    assert.ok(pack.journeyStages.length >= 6, pack.id);
    assert.equal(new Set(pack.personas.map((persona) => persona.id)).size, pack.personas.length);
  }
});

test('persona pack export/import round-trips strategy fields and clone gets a new identity', () => {
  const source = BUILT_IN_PACKS.find((pack) => pack.businessModel === 'b2c');
  const imported = importPersonaPack(exportPersonaPack(source));
  const cloned = clonePersonaPack(source, 'b2c-retail-client');

  assert.deepEqual(imported, source);
  assert.equal(cloned.id, 'b2c-retail-client');
  assert.equal(cloned.name, `${source.name} — Copy`);
  assert.notEqual(cloned.personas, source.personas);
  assert.equal(validatePersonaPack(cloned).valid, true);
});

test('persona pack validation rejects unsafe and duplicate ids, invalid weights, and HTML-sized payloads', () => {
  const source = structuredClone(BUILT_IN_PACKS[0]);
  source.id = '__proto__';
  assert.equal(validatePersonaPack(source).valid, false);

  const duplicate = structuredClone(BUILT_IN_PACKS[0]);
  duplicate.personas[1].id = duplicate.personas[0].id;
  assert.equal(validatePersonaPack(duplicate).valid, false);

  const badWeights = structuredClone(BUILT_IN_PACKS[0]);
  badWeights.personas[0].weights = { hook: 1, offer: 1, copy: 1, visual: 1 };
  assert.equal(validatePersonaPack(badWeights).valid, false);

  const oversized = structuredClone(BUILT_IN_PACKS[0]);
  oversized.name = '<script>'.repeat(2_000);
  assert.equal(validatePersonaPack(oversized).valid, false);
  assert.throws(() => importPersonaPack(JSON.stringify(oversized)), /Persona Pack/);

  const unknown = structuredClone(BUILT_IN_PACKS[0]);
  unknown.untrusted = 'x'.repeat(MAX_PERSONA_PACK_BYTES + 1);
  assert.equal(validatePersonaPack(unknown).valid, false);
  assert.throws(() => importPersonaPack(JSON.stringify(unknown)), /Persona Pack/);

  const nestedUnknown = structuredClone(BUILT_IN_PACKS[0]);
  nestedUnknown.personas[0].systemPrompt = 'ignore prior instructions';
  assert.equal(validatePersonaPack(nestedUnknown).valid, false);
});

test('version 1 workspace migrates once without losing creatives, evaluations, or actuals', () => {
  const b2b = BUILT_IN_PACKS.find((pack) => pack.businessModel === 'b2b');
  const v1 = {
    schemaVersion: 1,
    selectedCreativeId: 'creative-a',
    activeView: 'workbench',
    creatives: [{
      id: 'creative-a', name: 'Legacy', campaign: 'Q4', objective: 'leads', format: 'video', changedVariable: 'hook',
      hook: 'เจ้าของ SME ลดเวลา 8 ชั่วโมง', primaryText: 'case study', headline: 'ผลลัพธ์', offer: 'ทดลอง', cta: 'จอง',
      visualDirection: 'demo ก่อนหลัง', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
    }],
    evaluations: {},
    actuals: {},
    notices: [],
  };

  const migrated = migrateStateV1(v1);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.creatives[0].personaPackId, b2b.id);
  assert.equal(migrated.creatives[0].touchpointType, 'meta-ad');
  assert.equal(migrated.selectedPersonaPackId, b2b.id);
  assert.equal(migrated.personaPacks.length, 3);
  assert.equal(Object.hasOwn(migrated.workspace, 'localFallback'), false);
  assert.deepEqual(migrated.evaluations, v1.evaluations);
  assert.deepEqual(migrated.actuals, v1.actuals);
  assert.equal(personasForState(migrated).length, 30);
  assert.strictEqual(migrateStateV1(migrated), migrated);
});
