const METRIC_FIELDS = Object.freeze([
  'spend',
  'impressions',
  'clicks',
  'landingViews',
  'leads',
  'qualifiedLeads',
  'purchases',
  'revenue',
]);

function rounded(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function ratio(numerator, denominator, multiplier = 1) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return rounded((numerator / denominator) * multiplier);
}

export function calculateMetrics(input) {
  const actual = Object.fromEntries(METRIC_FIELDS.map((field) => [field, Number(input?.[field] ?? 0)]));
  return Object.freeze({
    cpm: ratio(actual.spend, actual.impressions, 1000),
    ctr: ratio(actual.clicks, actual.impressions, 100),
    cpc: ratio(actual.spend, actual.clicks),
    lpvRate: ratio(actual.landingViews, actual.clicks, 100),
    cvr: ratio(actual.leads, actual.landingViews, 100),
    cpl: ratio(actual.spend, actual.leads),
    cpql: ratio(actual.spend, actual.qualifiedLeads),
    cpa: ratio(actual.spend, actual.purchases),
    roas: ratio(actual.revenue, actual.spend),
  });
}

export function validateActual(input) {
  const errors = {};
  const actual = {};
  const date = String(input?.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = 'ต้องเป็นวันที่รูปแบบ YYYY-MM-DD';
  else {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) errors.date = 'วันที่ไม่มีอยู่จริง';
  }
  for (const field of METRIC_FIELDS) {
    const value = Number(input?.[field] ?? 0);
    actual[field] = value;
    if (!Number.isFinite(value)) errors[field] = 'ต้องเป็นตัวเลขที่ใช้งานได้';
    else if (value < 0) errors[field] = 'ค่าติดลบไม่ได้';
  }

  const funnel = [
    ['clicks', 'impressions'],
    ['landingViews', 'clicks'],
    ['leads', 'landingViews'],
    ['qualifiedLeads', 'leads'],
    ['purchases', 'qualifiedLeads'],
  ];
  for (const [downstream, upstream] of funnel) {
    if (actual[downstream] > actual[upstream]) {
      errors[downstream] = `${downstream} ต้องไม่เกิน ${upstream}`;
    }
  }

  return Object.freeze({ valid: Object.keys(errors).length === 0, errors: Object.freeze(errors) });
}

function highIsGood(value, target) {
  if (value === null) return 0;
  return Math.min(100, (value / target) * 70);
}

function lowIsGood(value, target) {
  if (value === null || value <= 0) return 0;
  return Math.min(100, (target / value) * 70);
}

const OBJECTIVE_WEIGHTS = Object.freeze({
  awareness: { ctr: 0.45, lpvRate: 0.25, cpm: 0.2, roas: 0.1 },
  traffic: { ctr: 0.35, cpc: 0.25, lpvRate: 0.3, cvr: 0.1 },
  engagement: { ctr: 0.45, cpc: 0.2, lpvRate: 0.2, cvr: 0.15 },
  leads: { ctr: 0.2, cvr: 0.25, cpl: 0.25, cpql: 0.2, roas: 0.1 },
  sales: { ctr: 0.1, cvr: 0.15, cpql: 0.15, cpa: 0.25, roas: 0.35 },
  purchases: { ctr: 0.1, cvr: 0.15, cpa: 0.25, roas: 0.5 },
});

const TARGETS = Object.freeze({ cpm: 180, ctr: 2, cpc: 12, lpvRate: 75, cvr: 5, cpl: 1500, cpql: 3000, cpa: 5000, roas: 3 });
const LOWER_IS_BETTER = new Set(['cpm', 'cpc', 'cpl', 'cpql', 'cpa']);

export function calibrate(evaluation, actual, objective = 'leads') {
  const metrics = calculateMetrics(actual);
  const weights = OBJECTIVE_WEIGHTS[objective] ?? OBJECTIVE_WEIGHTS.leads;
  const actualScore = rounded(
    Object.entries(weights).reduce((sum, [metric, weight]) => {
      const metricScore = LOWER_IS_BETTER.has(metric)
        ? lowIsGood(metrics[metric], TARGETS[metric])
        : highIsGood(metrics[metric], TARGETS[metric]);
      return sum + metricScore * weight;
    }, 0),
    1,
  );
  const predictedScore = rounded(Number(evaluation?.averageScore ?? 0), 1);
  const gap = rounded(actualScore - predictedScore, 1);
  const bias = gap > 8 ? 'underestimated' : gap < -8 ? 'overestimated' : 'aligned';
  return Object.freeze({ predictedScore, actualScore, gap, bias, metrics });
}
