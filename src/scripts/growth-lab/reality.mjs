// Funnel Lab "ของจริง" (2026-10-12): compare what the persona panel predicted with what really happened.
// Pure helpers shared by the page and the Mac mini signals worker (vendored there like the other growth-lab modules).
//
// Persona fit tiers come from the persona id prefix of a pack mined from the CRM:
//   buy-*  already paid · near-* talked / got a quote · warm-* interested, no deal yet · off-* not a buyer at all
// Built-in packs have no prefix → tier null, and the fit numbers are simply left out.

export const TIERS = Object.freeze(['buy', 'near', 'warm', 'off']);
export const TIER_THAI = Object.freeze({ buy: 'ลูกค้าจริง (จ่ายแล้ว)', near: 'ใกล้ซื้อ (คุย/เสนอราคาแล้ว)', warm: 'สนใจ ยังไม่ซื้อ', off: 'ไม่ใช่กลุ่มที่ซื้อ' });
const ICP = new Set(['buy', 'near']);
const DECISION_CODE = Object.freeze({ STOP: 'S', WATCH: 'W', SCROLL: 'X' });

export function personaTier(persona) {
  const prefix = String(persona?.id ?? '').split('-')[0];
  return TIERS.includes(prefix) ? prefix : null;
}

const round1 = (value) => Math.round(value * 10) / 10;
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

/**
 * Compact numbers the "ของจริง" list needs, so the page never downloads 400 full persona panels.
 * personaScores keeps every seat as [score, 'S'|'W'|'X'] (STOP/WATCH/SCROLL) for the drill-down grid.
 */
export function summarizeEvaluation(evaluation, pack) {
  const byId = new Map((pack?.personas ?? []).map((persona) => [persona.id, persona]));
  const tiers = {};
  for (const tier of TIERS) {
    const results = evaluation.personaResults.filter((result) => personaTier(byId.get(result.personaId)) === tier);
    if (!results.length) continue;
    tiers[tier] = { n: results.length, score: round1(mean(results.map((result) => result.score))), stop: round1((results.filter((result) => result.decision === 'STOP').length / results.length) * 100) };
  }
  const pick = (want) => evaluation.personaResults.filter((result) => want(personaTier(byId.get(result.personaId))));
  const icp = pick((tier) => ICP.has(tier));
  const off = pick((tier) => tier === 'off');
  const icpScore = icp.length ? round1(mean(icp.map((result) => result.score))) : null;
  const offScore = off.length ? round1(mean(off.map((result) => result.score))) : null;
  return {
    engine: evaluation.engine,
    stopRate: evaluation.stopRate,
    averageScore: evaluation.averageScore,
    verdict: evaluation.verdict,
    weakestComponent: evaluation.weakestComponent,
    componentScores: evaluation.componentScores,
    tiers,
    icpScore,
    icpStop: icp.length ? round1((icp.filter((result) => result.decision === 'STOP').length / icp.length) * 100) : null,
    offScore,
    offStop: off.length ? round1((off.filter((result) => result.decision === 'STOP').length / off.length) * 100) : null,
    // positive = the message speaks to people who buy more than to people who never will
    fitGap: icpScore !== null && offScore !== null ? round1(icpScore - offScore) : null,
    personaScores: Object.fromEntries(evaluation.personaResults.map((result) => [result.personaId, [result.score, DECISION_CODE[result.decision]]])),
    top: [...evaluation.personaResults].sort((left, right) => right.score - left.score).slice(0, 5).map((result) => result.personaId),
  };
}

function ranks(values) {
  const order = values.map((value, index) => [value, index]).sort((left, right) => left[0] - right[0]);
  const out = new Array(values.length);
  for (let start = 0; start < order.length;) {
    let end = start;
    while (end + 1 < order.length && order[end + 1][0] === order[start][0]) end += 1;
    const rank = (start + end) / 2 + 1;                      // ties share the average rank
    for (let index = start; index <= end; index += 1) out[order[index][1]] = rank;
    start = end + 1;
  }
  return out;
}

function pearson(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0; let dx = 0; let dy = 0;
  for (let index = 0; index < xs.length; index += 1) {
    num += (xs[index] - mx) * (ys[index] - my);
    dx += (xs[index] - mx) ** 2;
    dy += (ys[index] - my) ** 2;
  }
  return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : null;
}

/** Spearman rank correlation (ties averaged). null when fewer than 3 pairs or no spread. */
export function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  return pearson(ranks(xs), ranks(ys));
}

// Deterministic PRNG so the same data always shows the same interval (mulberry32).
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Percentile bootstrap interval of spearman(xs, ys). */
export function bootstrapInterval(xs, ys, { iterations = 1000, level = 0.9, seed = 7 } = {}) {
  if (xs.length < 5) return null;
  const random = rng(seed);
  const samples = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const bx = []; const by = [];
    for (let index = 0; index < xs.length; index += 1) {
      const pickIndex = Math.floor(random() * xs.length);
      bx.push(xs[pickIndex]); by.push(ys[pickIndex]);
    }
    const value = spearman(bx, by);
    if (value !== null) samples.push(value);
  }
  if (samples.length < iterations / 2) return null;
  samples.sort((left, right) => left - right);
  const tail = (1 - level) / 2;
  return { low: samples[Math.floor(tail * (samples.length - 1))], high: samples[Math.ceil((1 - tail) * (samples.length - 1))] };
}

/** Plain-Thai reading of one correlation, honest about small samples. */
export function measureVerdict({ rho, interval, n }) {
  if (rho === null || n < 8) return { key: 'too-few', thai: `ข้อมูลยังน้อย (n=${n}) — ยังสรุปไม่ได้` };
  const excludesZero = interval && (interval.low > 0 || interval.high < 0);
  if (excludesZero && Math.abs(rho) >= 0.3) return { key: rho > 0 ? 'predictive' : 'inverse', thai: rho > 0 ? 'ทำนายได้จริง — คะแนนสูง ตัวเลขจริงสูงตาม' : 'สวนทาง — คะแนนสูง ตัวเลขจริงกลับต่ำ' };
  if (excludesZero) return { key: 'weak', thai: rho > 0 ? 'สัมพันธ์จริงแต่อ่อน — ใช้คัดกรองได้ ห้ามใช้ฟันธง' : 'สวนทางแบบอ่อน' };
  return { key: 'none', thai: 'ยังไม่เห็นความสัมพันธ์ — panel ยังทำนายตัวเลขนี้ไม่ได้' };
}

const num = (value) => (Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : null);
const per = (part, whole, scale = 100) => (num(part) !== null && num(whole) > 0 ? (num(part) / num(whole)) * scale : null);

/**
 * The outcome numbers each kind of signal can be judged on. Organic metrics are rates per view so a
 * clip that went viral for the wrong crowd does not win by size alone; views are compared on a log scale.
 */
export const OUTCOMES = Object.freeze({
  meta: [
    { key: 'linkCtr', label: 'คลิกลิงก์ / แสดงผล (%)', get: (m) => per(m.link_clicks, m.impressions) },
    { key: 'leadsPer1k', label: 'ลีด Meta / 1,000 แสดงผล', get: (m) => per(m.leads, m.impressions, 1000) },
    { key: 'crmTalkedPer1k', label: 'ลีดที่ได้คุยจริง (CRM) / 1,000 แสดงผล', get: (m, a) => (a?.crm_leads !== undefined ? per(a.talked ?? 0, m.impressions, 1000) : null) },
    { key: 'hookRate', label: 'ดูถึง 25% / แสดงผล (%)', get: (m) => per(m.video_p25, m.impressions) },
  ],
  tiktok: [
    { key: 'relViews', label: 'วิวเทียบคลิปข้างเคียงของช่องเดียวกัน (เท่า)', get: (m) => num(m.relViews) },
    { key: 'logViews', label: 'ยอดวิว (log)', get: (m) => (num(m.views) > 0 ? Math.log10(num(m.views)) : null) },
    { key: 'saveRate', label: 'เซฟ / วิว (%)', get: (m) => per(m.saves, m.views) },
    { key: 'shareRate', label: 'แชร์ / วิว (%)', get: (m) => per(m.shares, m.views) },
    { key: 'commentRate', label: 'คอมเมนต์ / วิว (%)', get: (m) => per(m.comments, m.views) },
  ],
  instagram: [
    { key: 'relViews', label: 'ยอดเล่นเทียบโพสต์ข้างเคียง (เท่า)', get: (m) => num(m.relViews) },
    { key: 'logViews', label: 'ยอดเล่น (log)', get: (m) => (num(m.plays) > 0 ? Math.log10(num(m.plays)) : null) },
    { key: 'commentRate', label: 'คอมเมนต์ / เล่น (%)', get: (m) => per(m.comments, m.plays) },
  ],
});

export function outcomesFor(platform) {
  return OUTCOMES[platform === 'facebook' ? 'meta' : platform] ?? [];
}

/**
 * Correlate a predictor (from eval_summary) with every outcome of one group of signals.
 * predictor: 'icpScore' | 'averageScore' | 'stopRate' | 'fitGap'
 */
export function measure(signals, platform, predictor = 'icpScore', options = {}) {
  return outcomesFor(platform).map((outcome) => {
    const pairs = signals
      .map((signal) => [num(signal.eval_summary?.[predictor]), outcome.get(signal.metrics ?? {}, signal.attribution ?? {})])
      .filter(([x, y]) => x !== null && y !== null);
    const xs = pairs.map(([x]) => x);
    const ys = pairs.map(([, y]) => y);
    const rho = spearman(xs, ys);
    const interval = rho === null ? null : bootstrapInterval(xs, ys, options);
    return { key: outcome.key, label: outcome.label, n: pairs.length, rho: rho === null ? null : Math.round(rho * 100) / 100, interval, verdict: measureVerdict({ rho, interval, n: pairs.length }) };
  });
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Views against the same account's neighbouring posts (±window posts by date). Raw views mix "was this clip
 * good" with "how big was the account that month" (Pun's TikTok median fell 13,600 → 1,933 in May 2026) and
 * with account size across competitors; the ratio keeps only the first. Adds metrics.relViews (1 = typical).
 */
export function withRelativeViews(signals, { window = 7, viewsKey = 'views' } = {}) {
  const byOwner = new Map();
  for (const signal of signals) {
    const views = num(signal.metrics?.[viewsKey]);
    // no owner = cannot tell accounts apart (some scout IG/FB rows) → no ratio rather than a ratio across accounts
    if (views === null || views <= 0 || !signal.published_at || !signal.owner) continue;
    const key = `${signal.platform}|${signal.owner ?? ''}`;
    if (!byOwner.has(key)) byOwner.set(key, []);
    byOwner.get(key).push(signal);
  }
  const relative = new Map();
  for (const list of byOwner.values()) {
    list.sort((left, right) => String(left.published_at).localeCompare(String(right.published_at)));
    list.forEach((signal, index) => {
      const neighbours = list.slice(Math.max(0, index - window), index + window + 1).filter((other) => other !== signal).map((other) => num(other.metrics[viewsKey]));
      const typical = neighbours.length >= 3 ? median(neighbours) : null;
      if (typical) relative.set(signal, num(signal.metrics[viewsKey]) / typical);
    });
  }
  return signals.map((signal) => (relative.has(signal) ? { ...signal, metrics: { ...signal.metrics, relViews: Math.round(relative.get(signal) * 100) / 100 } } : signal));
}

/**
 * For each persona: in how many of these touchpoints the panel says it STOPs (from eval_summary.personaScores).
 * Read next to the CRM numbers per persona it shows who the content reaches versus who actually buys.
 */
export function personaStopShare(signals, personaIds, summaryKey = 'eval_summary') {
  const evaluated = signals.filter((signal) => signal[summaryKey]?.personaScores);
  return Object.fromEntries(personaIds.map((id) => {
    const seats = evaluated.map((signal) => signal[summaryKey].personaScores[id]).filter(Boolean);
    return [id, seats.length ? { n: seats.length, stop: Math.round((seats.filter(([, code]) => code === 'S').length / seats.length) * 1000) / 10, score: round1(mean(seats.map(([score]) => score))) } : null];
  }));
}

/** Funnel rows (funnel_lab_channel_funnel) with step-to-step conversion, biggest channels first. */
export function funnelRows(rows) {
  const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);
  return [...rows]
    .map((row) => ({ ...row, leads: Number(row.leads), talked: Number(row.talked), proposed: Number(row.proposed), won: Number(row.won), revenue_thb: Number(row.revenue_thb ?? 0),
      talkRate: pct(Number(row.talked), Number(row.leads)), closeRate: pct(Number(row.won), Number(row.leads)) }))
    .sort((left, right) => right.won - left.won || right.leads - left.leads);
}
