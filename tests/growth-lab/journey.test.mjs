import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCreative } from '../../src/scripts/growth-lab/engine-local.mjs';
import { predictJourney, validateJourneyForecast } from '../../src/scripts/growth-lab/journey.mjs';
import { BUILT_IN_PACKS } from '../../src/scripts/growth-lab/persona-packs.mjs';
import { seedState } from '../../src/scripts/growth-lab/seed.mjs';
import { validateState } from '../../src/scripts/growth-lab/storage.mjs';

const NOW = '2026-10-11T09:00:00.000Z';

function fixtureFor(pack) {
  const base = seedState().creatives[0];
  const creative = {
    ...base,
    id: `touchpoint-${pack.businessModel}`,
    businessModel: pack.businessModel,
    personaPackId: pack.id,
    journeyStage: pack.journeyStages[0].id,
    touchpointType: pack.businessModel === 'b2c' ? 'promotion' : pack.businessModel === 'b2g' ? 'sales-outreach' : 'line-oa',
    channel: pack.businessModel === 'b2c' ? 'line-oa' : 'email',
  };
  return { creative, evaluation: evaluateCreative(creative, pack.personas, pack, { now: NOW }) };
}

test('journey forecast uses each pack stage model and never raises later-stage aggregate probability', () => {
  const expectedEnds = { b2b: 'Expansion', b2c: 'Repeat / Advocate', b2g: 'Delivery' };
  for (const pack of BUILT_IN_PACKS) {
    const { creative, evaluation } = fixtureFor(pack);
    const forecast = predictJourney(creative, pack.personas, evaluation, pack);
    const probabilities = forecast.stageForecasts.map((stage) => stage.probability);

    assert.equal(forecast.stageForecasts[0].label, pack.journeyStages[0].label);
    assert.equal(forecast.stageForecasts.at(-1).label, expectedEnds[pack.businessModel]);
    assert.ok(probabilities.every((value, index) => index === 0 || value <= probabilities[index - 1]));
    assert.ok(forecast.stageForecasts.every((stage) => stage.nextBestAction && stage.channel && stage.timing));
  }
});

test('forecast exposes a complete persona path, bottleneck, trigger, and action for every persona', () => {
  const pack = BUILT_IN_PACKS.find((item) => item.businessModel === 'b2g');
  const { creative, evaluation } = fixtureFor(pack);
  const forecast = predictJourney(creative, pack.personas, evaluation, pack);

  assert.equal(forecast.personaPaths.length, pack.personas.length);
  assert.equal(new Set(forecast.personaPaths.map((path) => path.personaId)).size, pack.personas.length);
  assert.ok(forecast.personaPaths.every((path) =>
    path.conversionProbability >= 0 && path.conversionProbability <= 100 &&
    pack.journeyStages.some((stage) => stage.id === path.bottleneckStage) &&
    path.trigger.length > 4 && path.friction.length > 4 && path.nextBestAction.length > 4,
  ));
  assert.ok(pack.journeyStages.some((stage) => stage.id === forecast.strategy.bottleneckStage));
  assert.ok(forecast.strategy.priorityPersonaIds.length > 0);
  assert.ok(forecast.assumptions.some((item) => item.includes('directional')));
});

test('journey output is deterministic and changes its next action by business model', () => {
  const forecasts = BUILT_IN_PACKS.map((pack) => {
    const { creative, evaluation } = fixtureFor(pack);
    const first = predictJourney(creative, pack.personas, evaluation, pack, { now: NOW });
    const second = predictJourney(creative, pack.personas, evaluation, pack, { now: NOW });
    assert.deepEqual(first, second);
    return first;
  });

  assert.equal(new Set(forecasts.map((forecast) => forecast.stageForecasts[1].nextBestAction)).size, 3);
  assert.ok(forecasts.every((forecast) => forecast.confidenceLabel === 'directional'));
});

test('journey validator and state reject non-finite or cross-pack forecasts', () => {
  const state = seedState();
  const pack = state.personaPacks.find((item) => item.id === state.selectedPersonaPackId);
  const creative = state.creatives[0];
  const forecast = predictJourney(creative, pack.personas, state.evaluations[creative.id], pack);

  assert.equal(validateJourneyForecast(forecast, creative.id, pack).valid, true);
  state.journeys[creative.id] = forecast;
  assert.equal(validateState(state).recovered, false);

  const broken = structuredClone(forecast);
  broken.stageForecasts[0].probability = Number.NaN;
  assert.equal(validateJourneyForecast(broken, creative.id, pack).valid, false);
  state.journeys[creative.id] = broken;
  const repairedBroken = validateState(state);
  assert.equal(repairedBroken.recovered, false);
  assert.equal(repairedBroken.state.journeys[creative.id], undefined);
  assert.ok(repairedBroken.state.evaluations[creative.id], 'evaluation survives a broken journey');

  const stale = structuredClone(forecast);
  stale.personaPackRevision = 'stale-pack';
  state.journeys[creative.id] = stale;
  assert.equal(validateState(state).state.journeys[creative.id], undefined);

  const otherPack = state.personaPacks.find((item) => item.id !== pack.id);
  assert.equal(validateJourneyForecast(forecast, creative.id, otherPack).valid, false);
});
