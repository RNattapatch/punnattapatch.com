// Sync + Codex-apply rules, including every data-loss path found in the 2026-10-11 review.
import test from 'node:test';
import assert from 'node:assert/strict';

import { codexJobVerdict, contentRevision, DATA_VERSION, decideSync, stableStringify, withLocalUi } from '../../src/scripts/growth-lab/sync.mjs';
import { personaPackRevision } from '../../src/scripts/growth-lab/persona-packs.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';

test('no cloud row → insert; newer cloud format → read-only (an old tab never writes over newer data)', () => {
  assert.equal(decideSync({ rev: null, dirty: false }, null), 'insert');
  assert.equal(decideSync({ rev: 4, dirty: true }, { rev: 4, app_version: DATA_VERSION + 1 }), 'read-only');
  assert.equal(decideSync({ rev: 4, dirty: false }, { rev: 9, app_version: DATA_VERSION + 1 }), 'read-only');
});

test('clean local always takes the cloud copy; equal revs with nothing to send are in sync', () => {
  assert.equal(decideSync({ rev: 3, dirty: false }, { rev: 3, app_version: DATA_VERSION }), 'in-sync');
  assert.equal(decideSync({ rev: 3, dirty: false }, { rev: 5, app_version: DATA_VERSION }), 'adopt');
  assert.equal(decideSync({ rev: null, dirty: false }, { rev: 5, app_version: DATA_VERSION }), 'adopt', 'fresh device with no work just loads the cloud');
});

test('local edits on the same rev are pushed; anything else keeps both copies', () => {
  assert.equal(decideSync({ rev: 5, dirty: true }, { rev: 5, app_version: DATA_VERSION }), 'push');
  assert.equal(decideSync({ rev: 4, dirty: true }, { rev: 5, app_version: DATA_VERSION }), 'adopt-keep-local', 'both changed');
  assert.equal(decideSync({ rev: null, dirty: true }, { rev: 5, app_version: DATA_VERSION }), 'adopt-keep-local', 'offline work on a never-synced device is backed up, on boot or on focus');
});

test('view fields stay per device when a cloud copy is adopted', () => {
  const remote = seedState();
  remote.activeView = 'settings';
  const local = { activeView: 'journey', selectedCreativeId: 'creative-b', selectedPersonaPackId: 'thai-b2c-growth-panel' };
  const merged = withLocalUi(remote, local);
  assert.equal(merged.activeView, 'journey');
  assert.equal(merged.selectedCreativeId, 'creative-b');
  assert.equal(merged.selectedPersonaPackId, 'thai-b2c-growth-panel');
  assert.equal(withLocalUi(remote, { ...local, selectedCreativeId: 'gone' }).selectedCreativeId, remote.selectedCreativeId);
});

test('content revision ignores key order and non-scoring fields', () => {
  const creative = seedState().creatives[0];
  const reordered = Object.fromEntries(Object.entries(creative).reverse());
  assert.equal(contentRevision(reordered), contentRevision(creative));
  assert.equal(contentRevision({ ...creative, updatedAt: 'later', name: 'renamed' }), contentRevision(creative));
  assert.notEqual(contentRevision({ ...creative, hook: 'changed' }), contentRevision(creative));
  assert.equal(stableStringify({ b: 1, a: [2, { d: 3, c: 4 }] }), '{"a":[2,{"c":4,"d":3}],"b":1}');
});

function finishedJob(state, overrides = {}) {
  const creative = state.creatives[0];
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId);
  return {
    creative: Object.fromEntries(Object.entries(creative).reverse()),   // jsonb reorders keys
    result: { evaluation: { evaluatedAt: '2026-10-11T12:04:59.000Z', personaPackRevision: personaPackRevision(pack) }, journey: {} },
    ...overrides,
  };
}

test('a Codex result applies only to the exact content and pack it evaluated', () => {
  const state = seedState();
  state.evaluations[state.creatives[0].id].evaluatedAt = '2026-10-11T12:00:00.000Z';
  assert.deepEqual(codexJobVerdict(finishedJob(state), state, personaPackRevision), { apply: true, reason: 'ok' });

  const edited = structuredClone(state);
  edited.creatives[0].hook = 'edited while Codex was running';
  assert.equal(codexJobVerdict(finishedJob(state), edited, personaPackRevision).reason, 'edited');

  const packChanged = structuredClone(state);
  packChanged.personaPacks[0].personas[0].threshold = 10;
  assert.equal(codexJobVerdict(finishedJob(state), packChanged, personaPackRevision).reason, 'pack-changed');

  const removed = structuredClone(state);
  removed.creatives = removed.creatives.slice(1);
  assert.equal(codexJobVerdict(finishedJob(state), removed, personaPackRevision).reason, 'missing');
});

test('a Codex result is not applied twice, nor over a newer Codex result; a Local run never blocks it', () => {
  const state = seedState();
  const job = finishedJob(state);
  const id = state.creatives[0].id;
  state.evaluations[id].evaluatedAt = job.result.evaluation.evaluatedAt;
  assert.equal(codexJobVerdict(job, state, personaPackRevision).reason, 'already');
  state.evaluations[id] = { ...state.evaluations[id], engine: 'codex-cli', evaluatedAt: '2026-10-11T13:00:00.000Z' };
  assert.equal(codexJobVerdict(job, state, personaPackRevision).reason, 'superseded');
  state.evaluations[id] = { ...state.evaluations[id], engine: 'local-matrix-v2', evaluatedAt: '2026-10-11T14:00:00.000Z' };
  assert.deepEqual(codexJobVerdict(job, state, personaPackRevision), { apply: true, reason: 'ok' }, 'phone clock ahead / Local re-run does not drop the Codex result');
  assert.equal(codexJobVerdict({ ...job, result: null }, state, personaPackRevision).reason, 'invalid');
  state.evaluations[id] = { ...state.evaluations[id], sourceJobId: 'job-1' };
  assert.equal(codexJobVerdict({ ...job, id: 'job-1' }, state, personaPackRevision).reason, 'already', 'the applied job is recognised on every device via the synced evaluation');
});

import { coreFingerprint, coreOf, mergeResults, outranks, pendingResultUploads, resultKey } from '../../src/scripts/growth-lab/sync.mjs';

function rowFor(state, id, evaluatedAt, engine = 'local-matrix-v2') {
  const creative = state.creatives.find((item) => item.id === id);
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId);
  const evaluation = { ...state.evaluations[id], engine, evaluatedAt, contentRevision: contentRevision(creative), personaPackRevision: personaPackRevision(pack) };
  return { creative_id: id, result_key: resultKey(creative, pack, personaPackRevision), engine: engine.startsWith('codex') ? 'codex' : 'local', evaluation, journey: { stub: true }, evaluated_at: evaluatedAt };
}

test('core excludes results; result-only changes do not change the core fingerprint', () => {
  const state = seedState();
  assert.deepEqual(coreOf(state).evaluations, {});
  const before = coreFingerprint(state);
  const changed = structuredClone(state);
  changed.evaluations['creative-a'].averageScore = 1;
  changed.activeView = 'journey';
  assert.equal(coreFingerprint(changed), before, 'evaluations and view fields are not core edits');
  changed.creatives[0].hook = 'edited';
  assert.notEqual(coreFingerprint(changed), before);
});

test('result keys change with the text or the pack, so old-text results never collide with current ones', () => {
  const state = seedState();
  const creative = state.creatives[0];
  const pack = state.personaPacks[0];
  const key = resultKey(creative, pack, personaPackRevision);
  assert.match(key, /^[A-Za-z0-9._:-]{1,120}$/u);
  assert.notEqual(resultKey({ ...creative, hook: 'v2' }, pack, personaPackRevision), key);
  assert.notEqual(resultKey(creative, { ...pack, name: 'renamed' }, personaPackRevision), key);
  assert.equal(resultKey({ ...creative, name: 'label only' }, pack, personaPackRevision), key, 'renaming a touchpoint keeps its result');
});

test('only current-text results that changed since the last upload are sent', () => {
  const state = seedState();
  const row = rowFor(state, 'creative-a', '2026-10-11T10:00:00.000Z');
  state.evaluations['creative-a'] = row.evaluation;
  state.journeys['creative-a'] = {};
  assert.deepEqual(pendingResultUploads(state, {}, personaPackRevision).map((item) => item.creative_id), ['creative-a'], 'seed result without contentRevision is not uploaded');
  assert.deepEqual(pendingResultUploads(state, { 'creative-a': `${row.result_key}@2026-10-11T10:00:00.000Z` }, personaPackRevision), []);
  const edited = structuredClone(state);
  edited.creatives[0].hook = 'edited, result now stale';
  assert.deepEqual(pendingResultUploads(edited, {}, personaPackRevision), [], 'a result for old text is never uploaded');
});

test('Codex outranks Local for the same text regardless of clocks; same engine → newer', () => {
  assert.equal(outranks({ engine: 'codex-cli', evaluatedAt: '2026-10-11T10:00:00Z' }, { engine: 'local-matrix-v2', evaluatedAt: '2026-10-11T11:00:00Z' }), true);
  assert.equal(outranks({ engine: 'local-matrix-v2', evaluatedAt: '2026-10-11T12:00:00Z' }, { engine: 'codex-cli', evaluatedAt: '2026-10-11T10:00:00Z' }), false);
  assert.equal(outranks({ engine: 'codex-cli', evaluatedAt: '2026-10-11T12:00:00Z' }, { engine: 'codex-cli', evaluatedAt: '2026-10-11T10:00:00Z' }), true);
});

test('cloud results are merged only for the current key and when they outrank the local one', () => {
  const state = seedState();
  state.evaluations['creative-a'].evaluatedAt = '2026-10-11T09:00:00.000Z';
  const newer = rowFor(state, 'creative-a', '2026-10-11T10:00:00.000Z');
  let merged = mergeResults(state, [newer], personaPackRevision);
  assert.deepEqual(merged.taken, ['creative-a']);
  merged = mergeResults(merged.state, [rowFor(state, 'creative-a', '2026-10-11T08:00:00.000Z')], personaPackRevision);
  assert.deepEqual(merged.taken, [], 'older Local result never replaces a newer one');
  const codex = rowFor(state, 'creative-a', '2026-10-11T07:00:00.000Z', 'codex-cli');
  assert.deepEqual(mergeResults(merged.state, [codex], personaPackRevision).taken, ['creative-a'], 'Codex wins even with an earlier clock');
  const edited = structuredClone(state);
  edited.creatives[0].hook = 'edited after the result was made';
  assert.deepEqual(mergeResults(edited, [newer], personaPackRevision).taken, [], 'result for old text is ignored');
  assert.deepEqual(mergeResults(state, [{ ...newer, creative_id: 'gone' }], personaPackRevision).taken, []);
});
