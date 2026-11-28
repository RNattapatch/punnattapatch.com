const base = '/framewise-assets/';
const side = 224;
const means = [0.485, 0.456, 0.406];
const deviations = [0.229, 0.224, 0.225];

const groups = [
  ['cafe', /coffee|cafeteria|diner|restaurant|food_court|bar\/pub|pub\/indoor|bakery|ice_cream|tea_house|dining|pizzeria|sushi/],
  ['beach', /beach|coast|wave|lagoon|ocean|pier|harbor|marsh|river|lake|pond|canal|boardwalk|waterfront|swimming_pool|bayou|lighthouse|waterfall/],
  ['street', /alley|street|residential_neighborhood|driveway|medina|crosswalk|plaza|market|shopfront|carrousel|gas_station|parking|train_station|highway|sidewalk|downtown/],
  ['green', /forest|garden|botanical|orchard|park|bamboo|rainforest|jungle|field|picnic|lawn|swamp|oasis|pasture|vineyard|tree_farm/],
  ['open', /mountain|canyon|hill|valley|cliff|desert|dune|sky|badlands|butte|glacier|snowfield|ski_slope|overlook|ruin/],
  ['architecture', /apse|arcade|arch|corridor|stair|temple|palace|tower|building|museum|lobby|courtyard|porch|patio|bridge|terrace|balcony|library|church|cathedral|ruin|shrine|synagogue|mosque|barn/],
  ['interior', /room|studio|indoor|office|closet|bed|hall|kitchen|bathroom|home|attic|apartment|basement|locker|shop|store|hotel|gym|stage|gallery/],
];

let engine;
function loadClassifier() {
  if (!engine) {
    // Lazy and self-hosted. On a first run only, the browser fetches the
    // model and runtime. No canvas pixels are sent with these requests.
    const moduleUrl = base + 'ort.wasm.min.mjs';
    engine = Promise.all([
      import(/* @vite-ignore */ moduleUrl),
      fetch(base + 'places365-labels.json').then(response => {
        if (!response.ok) throw new Error('Scene labels unavailable');
        return response.json();
      }),
    ]).then(async ([ort, labels]) => {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = new URL(base, location.origin).href;
      const session = await ort.InferenceSession.create(base + 'places365-r18-int8.onnx', { executionProviders: ['wasm'] });
      return { ort, labels, session };
    }).catch(error => {
      engine = undefined;
      throw error;
    });
  }
  return engine;
}

function pixels(source, dimension, lower = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = dimension;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ddd';
  ctx.fillRect(0,0,dimension,dimension);
  const top = lower ? Math.round(source.naturalHeight / 4) : 0;
  ctx.drawImage(source, 0, top, source.naturalWidth, source.naturalHeight - top, 0, 0, dimension, dimension);
  return ctx.getImageData(0, 0, dimension, dimension).data;
}

export function estimateLight(source) {
  const dimension = 32;
  const rgba = pixels(source, dimension);
  let left = 0, right = 0, center = 0, outer = 0, centerCount = 0;
  for (let row = 0; row < dimension; row++) {
    for (let col = 0; col < dimension; col++) {
      const i = 4 * (row * dimension + col);
      const tone = rgba[i] * .2126 + rgba[i + 1] * .7152 + rgba[i + 2] * .0722;
      if (col < dimension / 2) left += tone;
      else right += tone;
      if (row >= 8 && row < 24 && col >= 8 && col < 24) {
        center += tone;
        centerCount++;
      } else outer += tone;
    }
  }
  const average = (left + right) / dimension ** 2;
  if (average < 70) return 'dim';
  if (outer / (dimension ** 2 - centerCount) - center / centerCount > 36) return 'back';
  if (Math.abs(left - right) / (dimension ** 2 / 2) > 31) return 'side';
  return average > 161 ? 'bright' : 'balanced';
}

async function predict({ ort, labels, session }, source, lower = false) {
  const rgba = pixels(source, side, lower);
  const size = side ** 2;
  const input = new Float32Array(size * 3);
  for (let channel = 0; channel < 3; channel++) {
    for (let i = 0; i < size; i++) {
      input[channel * size + i] = (rgba[i * 4 + channel] / 255 - means[channel]) / deviations[channel];
    }
  }
  const { scores } = await session.run({ image: new ort.Tensor('float32', input, [1, 3, side, side]) });
  const logits = scores.data;
  const max = Math.max(...logits);
  const totals = { other: 0 };
  for (const [i, logit] of logits.entries()) {
    const group = groups.find(([, pattern]) => pattern.test(labels[i]))?.[0] ?? 'other';
    totals[group] = (totals[group] ?? 0) + Math.exp(logit - max);
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return {
    topLabel: labels[logits.indexOf(max)],
    scores: Object.fromEntries(Object.entries(totals).map(([scene, score]) => [scene, score / sum])),
  };
}

export async function classifyScene(source) {
  const classifier = await loadClassifier();
  const full = await predict(classifier, source);
  if (/^(porch|patio)$/.test(full.topLabel)) {
    // A covered terrace can look like architecture from the ceiling alone.
    // Cue on the furniture level before deciding whether it is a dining area.
    const lower = (await predict(classifier, source, true)).scores;
    if (lower.cafe >= .34 && lower.cafe >= (lower.architecture ?? 0) * .82) return 'cafe';
    if (lower.cafe >= .25) return 'other';
  }
  const [[scene, score], [, second]] = Object.entries(full.scores).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return scene !== 'other' && score >= .34 && score - second >= .1 ? scene : 'other';
}
