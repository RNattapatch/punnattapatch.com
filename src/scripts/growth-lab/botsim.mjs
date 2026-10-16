// Funnel Lab "ทดสอบบอท" (2026-10-13) — pure logic. No DOM, no network: botsim-ui.mjs renders, cloud.ts reads.
// Data: funnel_lab_bot_runs + funnel_lab_bot_convos (persona-sim on the Mac mini) and funnel_lab_bot_pick_runs +
// funnel_lab_bot_picks (jev picks the chat a persona liked best, Codex explains). Schema: supabase/migrations/202610130001_funnel_lab_bot_sim.sql
// Counts in a full run cover buyer personas only (segment ≠ off), so `buyers` is the denominator.

export const SEGMENT_ORDER = Object.freeze(['buy', 'near', 'warm', 'off']);
// ตรงกับกลุ่มใน pack pun-crm-2026-10 (id ขึ้นต้นด้วยกลุ่ม) · ห้ามใช้ อุ่น/ร้อน/เย็น (คุณปันไม่ชอบ)
export const SEGMENT_THAI = Object.freeze({ buy: 'ลูกค้าที่จ่ายแล้ว', near: 'ใกล้ซื้อ', warm: 'สนใจ ยังไม่ซื้อ', off: 'ไม่ใช่ผู้ซื้อ' });
export const OUTCOME_THAI = Object.freeze({ dropped: 'หลุดกลางทาง', closed: 'ลูกค้าจบเอง', max_turns: 'ครบรอบสูงสุด', sim_error: 'จำลองไม่สำเร็จ' });
export const ACTION_THAI = Object.freeze({ reply: 'ตอบต่อ', give_phone: 'ให้เบอร์', pick_time: 'เลือกเวลา', refuse_phone: 'ไม่ให้เบอร์', silent: 'เงียบ', done: 'จบ' });
export const DISCOVERY_THAI = Object.freeze({ business: 'ธุรกิจ', product: 'สินค้า/บริการ', customers: 'ลูกค้ากลุ่มไหน', sales_way: 'ขายยังไง' });
export const CHANNEL_THAI = Object.freeze({ line: 'LINE Call', phone: 'โทรศัพท์' });

// Rows of the overview table, in the order Pun reads them. `lowerIsBetter` marks the two counts where less is good;
// `neutral` rows get no "ดีสุด" mark (more "ขอดูก่อน" is not better, and fewer is not either — it trades with ได้เบอร์/หลุด).
export const OVERVIEW_ROWS = Object.freeze([
  { key: 'gave_phone', label: 'ได้เบอร์', base: 'buyers' },
  { key: 'phone_and_time', label: 'ได้เบอร์ + เวลาโทร', base: 'buyers' },
  { key: 'deferred', label: 'ขอดูก่อน', base: 'buyers', neutral: true },
  { key: 'dropped', label: 'หลุดกลางทาง', base: 'buyers', lowerIsBetter: true },
  { key: 'discovery_full', label: 'รู้จักธุรกิจครบ 4 เรื่อง', base: 'buyers' },
  { key: 'savvy_avg', label: 'ไหวพริบ', kind: 'avg', scale: '1–5' },
  { key: 'leading_avg', label: 'นำขั้นต่อไป', kind: 'avg', scale: '1–5' },
  { key: 'fit_avg', label: 'ข้อเสนอตรงคน', kind: 'avg', scale: '1–5' },
  { key: 'interest_end_avg', label: 'ความสนใจตอนจบ', kind: 'avg', scale: '1–5' },
  { key: 'nonbuyer_ok', label: 'ไม่ใช่ผู้ซื้อ จัดการถูก', base: 'nonbuyer_total' },
  { key: 'intro_repeat', label: 'แนะนำตัวซ้ำ', kind: 'count', lowerIsBetter: true },
]);

const LEAD_FACTS = Object.freeze([
  ['business', 'ธุรกิจ'], ['product', 'สินค้า/บริการ'], ['customers', 'ลูกค้า'], ['sales_way', 'วิธีขาย'],
  ['readiness', 'ความพร้อม'], ['call_window', 'เวลาที่โทรได้'], ['discovery_asks', 'ถามเรื่องธุรกิจกี่ครั้ง'], ['phone_asks', 'ขอเบอร์กี่รอบ'],
]);
const LEAD_FLAGS = Object.freeze([['parked', 'พักไว้'], ['brief', 'ส่งสรุปแล้ว'], ['non_buyer', 'ไม่ใช่ผู้ซื้อ']]);
const FOLLOWUP_PREFIX = '(ผ่านไป';

const num = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const lines = (value) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

/** Whole percent of part/whole, or null when the denominator is missing. */
export function pct(part, whole) {
  const p = num(part);
  const w = num(whole);
  if (p === null || w === null || w <= 0) return null;
  return Math.round((p / w) * 100);
}

/** A probability (0–1) as a whole percent. */
export function probPct(value) {
  const p = num(value);
  return p === null ? null : Math.round(clamp(p, 0, 1) * 100);
}

/** Scores are 0–4 on the pick side. */
export function clampScore(value) {
  const s = num(value);
  return s === null ? null : clamp(s, 0, 4);
}

/** Full runs and trial (partial) runs. Order = summary.order (bot version order set by persona-pick.mjs), then oldest first. */
export function splitRuns(runs = []) {
  const order = (run) => (Number.isFinite(run.summary?.order) ? run.summary.order : 1e9);
  const sorted = [...runs].sort((a, b) => (order(a) - order(b)) || (Date.parse(a.ran_at) - Date.parse(b.ran_at)) || String(a.label).localeCompare(String(b.label)));
  return { full: sorted.filter((run) => !run.partial), partial: sorted.filter((run) => run.partial) };
}

/** Labels in the order the full runs happened; unknown labels keep their input order at the end. */
export function orderLabels(labels = [], fullRuns = []) {
  const rank = new Map(fullRuns.map((run, index) => [run.label, index]));
  const unique = [...new Set(labels.filter((label) => typeof label === 'string' && label))];
  return unique
    .map((label, index) => ({ label, index }))
    .sort((a, b) => (rank.get(a.label) ?? 1e9) - (rank.get(b.label) ?? 1e9) || a.index - b.index)
    .map((entry) => entry.label);
}

/** Run choices for a select: full runs, then trial runs. */
export function runOptions({ full = [], partial = [] } = {}) {
  return [
    ...full.map((run) => ({ label: run.label, note: run.version_note ?? '', partial: false })),
    ...partial.map((run) => ({ label: run.label, note: run.version_note ?? '', partial: true })),
  ];
}

/** Latest run of anything: the newest first, so the page reads the freshest pick. */
export function latestPickRun(pickRuns = []) {
  return [...pickRuns].sort((a, b) => (Date.parse(b.ran_at) || 0) - (Date.parse(a.ran_at) || 0))[0] ?? null;
}

// One cell of the overview table. `compare` is what best-value highlighting ranks on.
function cellOf(summary, row) {
  const raw = num(summary?.[row.key]);
  if (raw === null) return { raw: null, compare: null, text: '–', sub: '' };
  if (row.kind === 'avg') return { raw, compare: raw, text: raw.toFixed(1), sub: '' };
  if (row.base) {
    const whole = num(summary?.[row.base]);
    const share = pct(raw, whole);
    return { raw, compare: whole ? raw / whole : raw, text: whole === null ? String(raw) : `${raw}/${whole}`, sub: share === null ? '' : `${share}%` };
  }
  return { raw, compare: raw, text: String(raw), sub: '' };
}

/**
 * Overview table for the full runs. Each row marks its best cell; a row whose cells all tie marks nothing.
 * @returns {{ columns: object[], rows: object[] }}
 */
export function overviewTable(fullRuns = []) {
  const columns = fullRuns.map((run) => ({ label: run.label, note: run.version_note ?? '', ranAt: run.ran_at, buyers: num(run.summary?.buyers) }));
  const rows = OVERVIEW_ROWS.map((row) => {
    const cells = fullRuns.map((run) => cellOf(run.summary ?? {}, row));
    const values = cells.map((cell) => cell.compare).filter((value) => value !== null);
    const distinct = new Set(values).size > 1;
    const best = distinct && !row.neutral ? (row.lowerIsBetter ? Math.min(...values) : Math.max(...values)) : null;
    return {
      key: row.key,
      label: row.label,
      scale: row.scale ?? '',
      cells: cells.map((cell) => ({ ...cell, best: best !== null && cell.compare === best })),
    };
  });
  return { columns, rows };
}

/** Trial runs: one persona each, so they sit in their own list and never join the table. */
export function partialRows(partialRuns = []) {
  return partialRuns.map((run) => ({
    label: run.label,
    note: run.version_note ?? '',
    ranAt: run.ran_at,
    personas: num(run.persona_count),
    cells: OVERVIEW_ROWS.map((row) => ({ key: row.key, label: row.label, ...cellOf(run.summary ?? {}, row) })),
  }));
}

/**
 * Everything the summary sheet and bars need from one pick run.
 * `labels` = the run labels to show, in display order (see orderLabels).
 */
export function pickRunView(run, labels = []) {
  const summary = run?.summary ?? {};
  const wins = labels.map((label) => ({ label, n: num(summary.wins?.[label]) ?? 0 }));
  const scores = labels.map((label) => {
    const score = clampScore(summary.avg_scores?.[label]);
    return { label, score, pct: score === null ? null : Math.round((score / 4) * 100) };
  });
  const agree = num(summary.agree_rate);
  return {
    pickerModel: text(run?.picker_model),
    reasonModel: text(run?.reason_model),
    ranAt: run?.ran_at ?? null,
    costUsd: num(run?.cost_usd),
    agreePct: agree === null ? null : Math.round(clamp(agree, 0, 1) * 100),
    headline: text(summary.codex?.headline),
    findings: lines(summary.codex?.findings),
    next: lines(summary.codex?.next),
    wins,
    totalWins: wins.reduce((sum, win) => sum + win.n, 0),
    maxWins: Math.max(0, ...wins.map((win) => win.n)),
    scores,
    bySegment: SEGMENT_ORDER.filter((segment) => summary.by_segment?.[segment]).map((segment) => ({
      segment,
      label: SEGMENT_THAI[segment],
      counts: labels.map((label) => num(summary.by_segment[segment][label]) ?? 0),
    })),
  };
}

/** Everything the per-persona row and dialog need from one pick. */
export function pickView(pick, labels = []) {
  const reasoning = pick?.reasoning ?? {};
  const probs = pick?.probs ?? {};
  const scores = pick?.scores ?? {};
  const all = [...new Set([...labels, ...Object.keys(scores), ...Object.keys(probs)])];
  return {
    personaId: text(pick?.persona_id),
    name: text(pick?.persona_name) || text(pick?.persona_id),
    segment: pick?.segment ?? '',
    segmentThai: SEGMENT_THAI[pick?.segment] ?? (pick?.segment || '–'),
    chosen: pick?.chosen_label ?? null,
    chosenPct: probPct(probs[pick?.chosen_label]),
    worst: reasoning.worst_label ?? null,
    why: text(reasoning.why),
    vsWorst: text(reasoning.vs_worst),
    lesson: text(reasoning.lesson),
    agree: typeof reasoning.agree === 'boolean' ? reasoning.agree : null,
    codexPick: reasoning.codex_pick ?? null,
    labels: all,
    scores: all.map((label) => {
      const score = clampScore(scores[label]);
      return { label, score, pct: score === null ? null : Math.round((score / 4) * 100), prob: probPct(probs[label]) };
    }),
  };
}

const segmentRank = (segment) => {
  const index = SEGMENT_ORDER.indexOf(segment);
  return index === -1 ? 99 : index;
};

/** Picks in one segment (or all when segment is ''), sorted by segment then name. */
export function filterPicks(picks = [], segment = '') {
  return picks
    .filter((pick) => !segment || pick.segment === segment)
    .sort((a, b) => segmentRank(a.segment) - segmentRank(b.segment)
      || String(a.persona_name || a.persona_id).localeCompare(String(b.persona_name || b.persona_id), 'th'));
}

export function segmentCounts(picks = []) {
  const counts = { total: picks.length };
  for (const segment of SEGMENT_ORDER) counts[segment] = picks.filter((pick) => pick.segment === segment).length;
  return counts;
}

/** thoughts[].turn is a number (after the bot's Nth reply) or "ตาม N" (after the Nth nudge follow-up). */
export function parseThoughtTurn(turn) {
  if (Number.isInteger(turn)) return { phase: 'main', n: turn };
  const label = String(turn ?? '').trim();
  const follow = /^ตาม\s*(\d+)$/u.exec(label);
  if (follow) return { phase: 'follow', n: Number(follow[1]) };
  if (/^\d+$/u.test(label)) return { phase: 'main', n: Number(label) };
  return { phase: 'unknown', n: null };
}

function thoughtLabel({ phase, n }) {
  if (phase === 'main') return `หลังบอทตอบรอบ ${n}`;
  if (phase === 'follow') return `หลังบอททักตาม · ครั้งที่ ${n}`;
  return 'หลังบอทตอบ';
}

/**
 * Chat in reading order with the customer's hidden thoughts placed where they happened.
 * A thought with turn N was thought after the bot's Nth reply, which led to the customer message that follows it,
 * so it sits right before that message. Thoughts that led to no message (silent / done) land after the last reply.
 * Items: { type: 'turn', role, text, action } | { type: 'thought', label, interest, action, text }.
 */
export function interleaveTranscript(turns = [], thoughts = []) {
  const queue = { main: [], follow: [], unknown: [] };
  for (const thought of Array.isArray(thoughts) ? thoughts : []) {
    if (!thought || typeof thought !== 'object') continue;
    const where = parseThoughtTurn(thought.turn);
    queue[where.phase].push({ thought, where });
  }
  const out = [];
  const take = (list, test) => {
    const keep = list.filter(test);
    for (const item of keep) list.splice(list.indexOf(item), 1);
    return keep.map(({ thought, where }) => ({
      type: 'thought',
      label: thoughtLabel(where),
      interest: num(thought.interest),
      action: thought.action ?? null,
      text: text(thought.thought),
    }));
  };
  let mainCustomers = 0;
  let followCustomers = 0;
  let afterNudge = false;
  for (const turn of Array.isArray(turns) ? turns : []) {
    if (!turn) continue;
    const body = String(turn.text ?? '');
    if (turn.role === 'bot' && body.startsWith(FOLLOWUP_PREFIX)) {
      out.push(...take(queue.main, () => true));   // nothing before the nudge is still pending
      afterNudge = true;
    }
    if (turn.role === 'customer') {
      if (afterNudge) {
        out.push(...take(queue.follow, (item) => item.where.n === followCustomers + 1));
        followCustomers += 1;
      } else {
        out.push(...take(queue.main, (item) => item.where.n === mainCustomers));
        mainCustomers += 1;
      }
    }
    out.push({ type: 'turn', role: turn.role === 'customer' ? 'customer' : 'bot', text: body, action: turn.action ?? null });
  }
  out.push(...take(queue.main, () => true), ...take(queue.follow, () => true), ...take(queue.unknown, () => true));
  return out;
}

export function outcomeLabel(outcome) {
  return OUTCOME_THAI[outcome] ?? (outcome ? String(outcome) : '–');
}

/** Colour tone for a judge result: scale (go), iterate (keep working), kill (lost), draft (unclear). */
export function resultTone(result = '') {
  const value = String(result);
  if (/จัดการผิด|หลุด/u.test(value)) return 'kill';
  if (/ไม่ให้เบอร์|ขอดูก่อน|พักไว้|ค้าง/u.test(value)) return 'iterate';
  if (/นัดได้|ได้เบอร์|จัดการถูก/u.test(value)) return 'scale';
  return 'draft';
}

export function discoveryChecklist(judge) {
  return Object.entries(DISCOVERY_THAI).map(([key, label]) => ({ key, label, ok: judge?.discovery?.[key] === true }));
}

/** What the bot wrote down for the lead, as label/value pairs. Empty values are dropped. */
export function leadFacts(lead) {
  if (!lead || typeof lead !== 'object') return [];
  const facts = [];
  for (const [key, label] of LEAD_FACTS) {
    const value = lead[key];
    if (value === null || value === undefined || value === '') continue;
    facts.push({ label, value: String(value) });
  }
  if (lead.call_channel) facts.push({ label: 'ช่องทางคุย', value: CHANNEL_THAI[lead.call_channel] ?? String(lead.call_channel) });
  for (const [key, label] of LEAD_FLAGS) if (lead[key] === true) facts.push({ label, value: 'ใช่' });
  return facts;
}

// ---------- ใบตัดสิน (2026-10-17) ----------
// The tab used to open on an 8×11 matrix; the owner could not tell which bot version won. The verdict sheet answers
// ใช้เวอร์ชันไหน / แก้อะไรต่อ / ลูกค้าหลุดตรงไหน from the same data (full-run summaries + the latest pick run),
// in counts of people ("ได้เบอร์ 10 จาก 34 คน"), never percentages of a denominator.

// The same bot run twice (base vs base2) moved by up to 2 people on every count, so a gap of ≤2 people is not a result.
export const NOISE_PEOPLE = 2;
const LIVE_SEGMENTS = Object.freeze(['buy', 'near', 'warm']);
// Short owner words for the change chips; keys are OVERVIEW_ROWS keys.
const CHANGE_KEYS = Object.freeze([['gave_phone', 'ได้เบอร์'], ['dropped', 'หลุดกลางทาง'], ['phone_and_time', 'ได้เวลาโทร'], ['discovery_full', 'รู้จักธุรกิจครบ']]);
// Rows where another version beating the keeper by more than the noise is worth fixing (count rows only).
const LOSS_KEYS = Object.freeze(['gave_phone', 'phone_and_time', 'dropped', 'discovery_full', 'intro_repeat']);
const rowOf = (key) => OVERVIEW_ROWS.find((row) => row.key === key);
const countOf = (run, key) => num(run?.summary?.[key]);
const ratioOf = (run, key, missing) => {
  const n = countOf(run, key);
  return n === null ? missing : n / (countOf(run, 'buyers') || 1);
};

/** One count, keeper vs another version. `tone` is noise-aware: a change of ≤ NOISE_PEOPLE people stays neutral. */
export function countChange(key, keeperRun, otherRun) {
  const to = countOf(keeperRun, key);
  const from = countOf(otherRun, key);
  if (to === null || from === null) return null;
  const delta = to - from;
  const label = CHANGE_KEYS.find(([k]) => k === key)?.[1] ?? rowOf(key)?.label ?? key;
  const noise = Math.abs(delta) <= NOISE_PEOPLE;
  const good = rowOf(key)?.lowerIsBetter ? delta < 0 : delta > 0;
  return { key, label, from, to, delta, noise, tone: noise ? 'draft' : good ? 'scale' : 'kill' };
}

/**
 * The verdict sheet for the bot-test tab, or null when there is no full run yet.
 * Keeper = the version the simulated customers picked most (latest pick run); without picks, the most phones then the
 * fewest drops. Ties go to the newer version.
 */
export function botVerdict(fullRuns = [], pickRun = null) {
  if (!fullRuns.length) return null;
  const wins = pickRun?.summary?.wins ?? {};
  const winsOf = (label) => num(wins[label]);
  const byPicks = fullRuns.some((run) => (winsOf(run.label) ?? 0) > 0);
  const ranked = fullRuns.map((run, index) => ({ run, index })).sort((a, b) => (byPicks ? (winsOf(b.run.label) ?? 0) - (winsOf(a.run.label) ?? 0) : 0)
    || ratioOf(b.run, 'gave_phone', -1) - ratioOf(a.run, 'gave_phone', -1)
    || ratioOf(a.run, 'dropped', 1e9) - ratioOf(b.run, 'dropped', 1e9)
    || b.index - a.index);
  const { run: keeperRun, index: keeperIndex } = ranked[0];
  const runnerUp = ranked[1]?.run ?? null;
  const prevRun = keeperIndex > 0 ? fullRuns[keeperIndex - 1] : null;
  const baseRun = keeperIndex > 1 ? fullRuns[0] : null;   // when the keeper is the 2nd version, "previous" already is the baseline
  const buyers = countOf(keeperRun, 'buyers');
  const of = (key) => {
    const n = countOf(keeperRun, key);
    return n === null ? '–' : `${n}${buyers === null ? '' : ` จาก ${buyers}`} คน`;
  };
  const totalPicks = Object.values(wins).reduce((sum, value) => sum + (num(value) ?? 0), 0);
  const keeperWins = winsOf(keeperRun.label);
  const runnerWins = runnerUp ? winsOf(runnerUp.label) : null;
  const keeper = { label: keeperRun.label, note: keeperRun.version_note ?? '', wins: keeperWins, totalPicks, buyers };

  const headline = byPicks
    ? `ใช้ ${keeper.label} ต่อ — ลูกค้าจำลองเลือกคุยต่อมากสุด ${keeperWins} จาก ${totalPicks} คน · ได้เบอร์ ${of('gave_phone')}`
    : `ใช้ ${keeper.label} ต่อ — ได้เบอร์มากสุด ${of('gave_phone')} · หลุดกลางทาง ${countOf(keeperRun, 'dropped') ?? '–'} คน`;
  const changesVs = (other) => (other ? CHANGE_KEYS.map(([key]) => countChange(key, keeperRun, other)).filter(Boolean) : []);
  const vsPrev = prevRun ? { label: prevRun.label, note: prevRun.version_note ?? '', changes: changesVs(prevRun) } : null;
  const vsBase = baseRun ? { label: baseRun.label, note: baseRun.version_note ?? '', changes: changesVs(baseRun) } : null;
  // Lead over the runner-up, in the unit the keeper was chosen by (picks, else phones).
  const margin = !runnerUp ? null : byPicks
    ? { label: runnerUp.label, wins: runnerWins ?? 0, lead: (keeperWins ?? 0) - (runnerWins ?? 0) }
    : { label: runnerUp.label, wins: null, lead: (countOf(keeperRun, 'gave_phone') ?? 0) - (countOf(runnerUp, 'gave_phone') ?? 0) };
  const cautions = [];
  if (margin && margin.lead <= NOISE_PEOPLE) cautions.push(`นำอันดับ 2 (${margin.label}) แค่ ${margin.lead} คน — ยังเรียกว่าชนะขาดไม่ได้`);
  if (vsPrev?.changes.length && vsPrev.changes.every((change) => change.noise)) {
    cautions.push(`ต่างจากรอบก่อน (${vsPrev.label}) ไม่เกิน ${NOISE_PEOPLE} คนทุกข้อ — บอทตัวเดิมรันซ้ำก็ต่างได้เท่านี้ ควรรันซ้ำก่อนสรุปว่าดีขึ้น`);
  }

  // ✅ ใช้เวอร์ชันไหน
  const isBest = (key) => overviewTable(fullRuns).rows.find((row) => row.key === key)?.cells[keeperIndex]?.best === true;
  const pick = [];
  if (byPicks) pick.push(`ลูกค้าจำลองเลือกคุยต่อ ${keeperWins} จาก ${totalPicks} คน (มากสุด)${margin ? ` · อันดับ 2 คือ ${margin.label} ${margin.wins} คน` : ''}`);
  else pick.push('ยังไม่มีผลว่าลูกค้าจำลองชอบเวอร์ชันไหน — ตัดสินจากจำนวนเบอร์ที่ได้ก่อน');
  pick.push(`ได้เบอร์ ${of('gave_phone')}${isBest('gave_phone') ? ' (มากสุด)' : ''} · ได้ทั้งเบอร์และเวลาโทร ${countOf(keeperRun, 'phone_and_time') ?? '–'} คน`);
  pick.push(`หลุดกลางทาง ${countOf(keeperRun, 'dropped') ?? '–'} คน${isBest('dropped') ? ' (น้อยสุด)' : ''}`);
  if (vsBase) pick.push(`เทียบบอทตัวแรก (${vsBase.label}): ${vsBase.changes.map((c) => `${c.label} ${c.from}→${c.to}`).join(' · ')}`);

  // 🛠 แก้อะไรต่อ — the explainer's next steps first, then counts where another version clearly beats the keeper
  const losses = [];
  for (const key of LOSS_KEYS) {
    const row = rowOf(key);
    const mine = countOf(keeperRun, key);
    if (!row || mine === null) continue;
    const better = fullRuns.filter((run) => run !== keeperRun && countOf(run, key) !== null)
      .map((run) => ({ run, n: countOf(run, key) }))
      .filter(({ n }) => (row.lowerIsBetter ? mine - n : n - mine) > NOISE_PEOPLE)
      .sort((a, b) => (row.lowerIsBetter ? a.n - b.n : b.n - a.n))[0];
    if (better) losses.push(row.lowerIsBetter
      ? `${row.label}: ${better.run.label} มีแค่ ${better.n} คน · ${keeper.label} มี ${mine} คน`
      : `${row.label}: ${better.run.label} ทำได้ ${better.n} คน · ${keeper.label} ได้ ${mine} คน`);
  }
  const fix = [...lines(pickRun?.summary?.codex?.next), ...losses];

  // ⚠️ ลูกค้าหลุดตรงไหน — where the keeper's buyers stopped, and the customer groups that liked another version more
  const bars = [
    { key: 'gave_phone', label: 'ให้เบอร์', stop: false },
    { key: 'deferred', label: 'ขอดูก่อน ยังไม่ให้เบอร์', stop: true },
    { key: 'dropped', label: 'หลุดกลางทาง (เงียบไป)', stop: true },
    { key: 'discovery_full', label: 'บอทถามเรื่องธุรกิจครบ 4 เรื่อง', stop: false },
  ].map((bar) => ({ ...bar, n: countOf(keeperRun, bar.key), pct: pct(countOf(keeperRun, bar.key), buyers) }))
    .filter((bar) => bar.n !== null);
  const biggest = bars.filter((bar) => bar.stop).sort((a, b) => b.n - a.n)[0] ?? null;
  const segments = [];
  for (const segment of LIVE_SEGMENTS) {
    const counts = pickRun?.summary?.by_segment?.[segment];
    if (!counts) continue;
    const entries = Object.entries(counts).map(([label, n]) => ({ label, n: num(n) ?? 0 }));
    const total = entries.reduce((sum, entry) => sum + entry.n, 0);
    const mine = entries.find((entry) => entry.label === keeper.label)?.n ?? 0;
    const top = [...entries].sort((a, b) => b.n - a.n)[0];
    if (top && top.label !== keeper.label && top.n > mine) segments.push({ segment, label: SEGMENT_THAI[segment], total, keeperWins: mine, top });
  }
  const leak = {
    buyers,
    bars,
    biggest,
    headline: biggest && biggest.n > 0 ? `ติดที่ "${biggest.label}" มากสุด — ${biggest.n} จาก ${buyers ?? '–'} คน` : 'ไม่มีลูกค้าหลุดในรอบนี้',
    segments: segments.map((s) => `${s.label} (${s.total} คน): ชอบ ${s.top.label} ${s.top.n} คน · ${keeper.label} ได้แค่ ${s.keeperWins} คน`),
  };
  return { keeper, headline, vsPrev, vsBase, margin, cautions, pick, fix, leak, basis: byPicks ? 'picks' : 'numbers' };
}

/** Plain text to paste to whoever writes the next bot version: the verdict, what to fix, where customers stop. */
export function botsimBrief(verdict) {
  if (!verdict) return '';
  const out = ['Funnel Lab · ทดสอบบอท LINE', '', verdict.headline];
  if (verdict.keeper.note) out.push(`${verdict.keeper.label} = ${verdict.keeper.note}`);
  if (verdict.vsPrev) out.push(`เทียบรอบก่อน (${verdict.vsPrev.label}): ${verdict.vsPrev.changes.map((c) => `${c.label} ${c.from}→${c.to}`).join(' · ')}`);
  out.push(...verdict.cautions.map((c) => `หมายเหตุ: ${c}`));
  if (verdict.fix.length) out.push('', 'แก้อะไรต่อ:', ...verdict.fix.map((item, i) => `${i + 1}. ${item}`));
  out.push('', `ลูกค้าหลุดตรงไหน: ${verdict.leak.headline}`, ...verdict.leak.segments.map((s) => `- ${s}`));
  return out.join('\n').trim();
}

/** One compact row per full run for the "ทุกเวอร์ชันเทียบกัน" list — phones, drops and picks, keeper marked. */
export function versionRows(fullRuns = [], pickRun = null, keeperLabel = '') {
  const wins = pickRun?.summary?.wins ?? {};
  const maxPhones = Math.max(0, ...fullRuns.map((run) => countOf(run, 'gave_phone') ?? 0));
  return fullRuns.map((run) => {
    const phones = countOf(run, 'gave_phone');
    return {
      label: run.label,
      note: run.version_note ?? '',
      keeper: run.label === keeperLabel,
      buyers: countOf(run, 'buyers'),
      phones,
      phonesWidth: phones === null || maxPhones === 0 ? 0 : Math.round((phones / maxPhones) * 100),
      dropped: countOf(run, 'dropped'),
      wins: num(wins[run.label]),
    };
  });
}
