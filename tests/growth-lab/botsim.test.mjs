// Funnel Lab "ทดสอบบอท": overview table, trial runs, pick view, transcript order, and the page/controller contract.
// Run: node --test tests/growth-lab/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  NOISE_PEOPLE, OVERVIEW_ROWS, botVerdict, botsimBrief, clampScore, countChange, versionRows, discoveryChecklist, filterPicks, interleaveTranscript, latestPickRun, leadFacts, orderLabels, outcomeLabel,
  overviewTable, parseThoughtTurn, partialRows, pct, pickRunView, pickView, probPct, resultTone, runOptions, segmentCounts, splitRuns,
} from '../../src/scripts/growth-lab/botsim.mjs';
import { FULL_LABELS, makeFixture } from './botsim-fixture.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const page = read('src/pages/app/funnel-lab.astro');
const ui = read('src/scripts/growth-lab/ui.mjs');
const botsimUi = read('src/scripts/growth-lab/botsim-ui.mjs');
const botsim = read('src/scripts/growth-lab/botsim.mjs');
const cloudTs = read('src/scripts/growth-lab/cloud.ts');
const storage = read('src/scripts/growth-lab/storage.mjs');
const migration = read('supabase/migrations/202610130001_funnel_lab_bot_sim.sql');

const run = (label, ranAt, summary, extra = {}) => ({ label, ran_at: ranAt, version_note: `note ${label}`, persona_count: 37, partial: false, summary, ...extra });
const summaryOf = (over = {}) => ({
  buyers: 10, gave_phone: 5, phone_and_time: 3, deferred: 2, dropped: 3, discovery_full: 6,
  savvy_avg: 3.5, leading_avg: 2, fit_avg: 4, interest_end_avg: 3, nonbuyer_ok: 4, nonbuyer_total: 5, intro_repeat: 1, ...over,
});

test('runs split into full and trial runs, each oldest first', () => {
  const { full, partial } = splitRuns([
    run('new', '2026-10-09T09:00:00Z', summaryOf()),
    run('trial', '2026-10-01T09:00:00Z', summaryOf(), { partial: true, persona_count: 1 }),
    run('base', '2026-10-06T09:00:00Z', summaryOf()),
  ]);
  assert.deepEqual(full.map((item) => item.label), ['base', 'new']);
  assert.deepEqual(partial.map((item) => item.label), ['trial']);
});

test('run labels follow the order the full runs happened; unknown labels go last', () => {
  const full = [{ label: 'base' }, { label: 'new' }, { label: 'final' }];
  assert.deepEqual(orderLabels(['final', 'zzz', 'base', 'base', 'new'], full), ['base', 'new', 'final', 'zzz']);
  assert.deepEqual(runOptions({ full: [{ label: 'base', version_note: 'x' }], partial: [{ label: 'trial' }] }), [
    { label: 'base', note: 'x', partial: false },
    { label: 'trial', note: '', partial: true },
  ]);
});

test('overview: the buyer count is the denominator, and the best cell per row is marked', () => {
  const table = overviewTable([
    run('base', '2026-10-06T09:00:00Z', summaryOf({ buyers: 10, gave_phone: 4, dropped: 3, intro_repeat: 2 })),
    run('final', '2026-10-09T09:00:00Z', summaryOf({ buyers: 10, gave_phone: 7, dropped: 1, intro_repeat: 0 })),
  ]);
  assert.deepEqual(table.columns.map((column) => column.label), ['base', 'final']);
  const row = (key) => table.rows.find((item) => item.key === key);
  assert.equal(row('gave_phone').cells[0].text, '4/10');
  assert.equal(row('gave_phone').cells[0].sub, '40%');
  assert.deepEqual(row('gave_phone').cells.map((cell) => cell.best), [false, true], 'more phones is better');
  assert.deepEqual(row('dropped').cells.map((cell) => cell.best), [false, true], 'fewer drop-outs is better');
  assert.deepEqual(row('intro_repeat').cells.map((cell) => cell.best), [false, true], 'fewer repeat intros is better');
  assert.equal(row('nonbuyer_ok').cells[0].text, '4/5', 'non-buyer count uses its own total');
});

test('overview: a row where every cell ties marks nothing, and a missing value shows a dash', () => {
  const table = overviewTable([
    run('a', '2026-10-06T09:00:00Z', summaryOf({ fit_avg: 4 })),
    run('b', '2026-10-07T09:00:00Z', summaryOf({ fit_avg: 4 })),
    run('c', '2026-10-08T09:00:00Z', summaryOf({ fit_avg: undefined })),
  ]);
  const fit = table.rows.find((item) => item.key === 'fit_avg');
  assert.deepEqual(fit.cells.map((cell) => cell.best), [false, false, false]);
  assert.equal(fit.cells[2].text, '–');
  assert.equal(fit.cells[0].text, '4.0', 'averages keep one decimal');
});

test('overview: every row is defined once and every full-run column has a cell', () => {
  const fixture = makeFixture();
  const table = overviewTable(splitRuns(fixture.runs).full);
  assert.equal(table.columns.length, FULL_LABELS.length);
  assert.equal(table.rows.length, OVERVIEW_ROWS.length);
  for (const row of table.rows) assert.equal(row.cells.length, FULL_LABELS.length, row.key);
});

test('trial runs stay out of the table and show their own counts', () => {
  const fixture = makeFixture();
  const rows = partialRows(splitRuns(fixture.runs).partial);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].personas, 1);
  assert.ok(rows.every((item) => item.cells.length === OVERVIEW_ROWS.length));
  assert.equal(rows[0].cells.find((cell) => cell.key === 'gave_phone').text.split('/')[1], '1', 'one buyer at most');
});

test('pct and probability helpers handle missing and zero denominators', () => {
  assert.equal(pct(3, 4), 75);
  assert.equal(pct(3, 0), null);
  assert.equal(pct(null, 4), null);
  assert.equal(probPct(0.333), 33);
  assert.equal(probPct(2), 100, 'probabilities are clamped to 0–1');
  assert.equal(probPct(undefined), null);
  assert.equal(clampScore(7), 4);
  assert.equal(clampScore(-1), 0);
  assert.equal(clampScore(null), null);
});

test('latest pick run is the newest by ran_at; no runs means none', () => {
  assert.equal(latestPickRun([]), null);
  const newest = latestPickRun([{ id: 'a', ran_at: '2026-10-10T00:00:00Z' }, { id: 'b', ran_at: '2026-10-12T00:00:00Z' }, { id: 'c', ran_at: '2026-10-11T00:00:00Z' }]);
  assert.equal(newest.id, 'b');
});

test('pick run view: wins and scores keep the label order, agreement rounds, Codex text is cleaned', () => {
  const view = pickRunView({
    picker_model: 'jev', reason_model: 'codex', ran_at: '2026-10-13T08:00:00Z', cost_usd: 1.234,
    summary: { wins: { base: 2, final: 5 }, agree_rate: 0.8649, avg_scores: { base: 1.5, final: 3.25 }, codex: { headline: ' หัวข้อ ', findings: ['a', '  ', 3, 'b'], next: null } },
  }, ['base', 'final']);
  assert.deepEqual(view.wins, [{ label: 'base', n: 2 }, { label: 'final', n: 5 }]);
  assert.equal(view.totalWins, 7);
  assert.equal(view.maxWins, 5);
  assert.equal(view.agreePct, 86);
  assert.equal(view.costUsd, 1.234);
  assert.equal(view.headline, 'หัวข้อ');
  assert.deepEqual(view.findings, ['a', 'b']);
  assert.deepEqual(view.next, []);
  assert.deepEqual(view.scores.map((item) => item.pct), [38, 81]);
});

test('pick run view survives an empty summary without throwing', () => {
  const view = pickRunView({ summary: {} }, []);
  assert.equal(view.agreePct, null);
  assert.equal(view.headline, '');
  assert.deepEqual(view.wins, []);
  assert.equal(view.maxWins, 0);
});

test('pick view: chosen probability, clamped scores, and the Codex disagreement', () => {
  const pick = {
    persona_id: 'persona-01', persona_name: 'ผู้ทดสอบ 01', segment: 'buy', chosen_label: 'final',
    probs: { base: 0.2, final: 0.7 }, scores: { base: 9, final: -2 },
    reasoning: { why: 'เพราะถามตรง', vs_worst: 'base ขอเบอร์เร็ว', worst_label: 'base', lesson: 'รู้จักก่อน', agree: false, codex_pick: 'base' },
  };
  const view = pickView(pick, ['base', 'final']);
  assert.equal(view.chosenPct, 70);
  assert.equal(view.segmentThai, 'ลูกค้าที่จ่ายแล้ว');
  assert.equal(view.agree, false);
  assert.equal(view.codexPick, 'base');
  assert.equal(view.worst, 'base');
  assert.deepEqual(view.scores.map((item) => item.score), [4, 0]);
  assert.deepEqual(view.labels, ['base', 'final']);
});

test('pick view: missing reasoning and an unknown segment still render', () => {
  const view = pickView({ persona_id: 'persona-09', segment: 'mystery', chosen_label: null, probs: {}, scores: {}, reasoning: null }, []);
  assert.equal(view.name, 'persona-09');
  assert.equal(view.segmentThai, 'mystery', 'an unknown segment is shown as it was stored');
  assert.equal(view.agree, null);
  assert.equal(view.why, '');
});

test('picks filter by segment and sort buyers first, then by name', () => {
  const picks = [
    { persona_id: 'p3', persona_name: 'ค', segment: 'off' },
    { persona_id: 'p1', persona_name: 'ข', segment: 'near' },
    { persona_id: 'p2', persona_name: 'ก', segment: 'buy' },
    { persona_id: 'p4', persona_name: 'ก', segment: 'buy' },
  ];
  assert.deepEqual(filterPicks(picks).map((item) => item.persona_id), ['p2', 'p4', 'p1', 'p3']);
  assert.deepEqual(filterPicks(picks, 'buy').map((item) => item.persona_id), ['p2', 'p4']);
  assert.deepEqual(segmentCounts(picks), { total: 4, buy: 2, near: 1, warm: 0, off: 1 });
});

test('thought turns: a number is a main reply, "ตาม N" is a nudge follow-up, anything else is unknown', () => {
  assert.deepEqual(parseThoughtTurn(2), { phase: 'main', n: 2 });
  assert.deepEqual(parseThoughtTurn('3'), { phase: 'main', n: 3 });
  assert.deepEqual(parseThoughtTurn('ตาม 1'), { phase: 'follow', n: 1 });
  assert.deepEqual(parseThoughtTurn('ตาม2'), { phase: 'follow', n: 2 });
  assert.deepEqual(parseThoughtTurn('??'), { phase: 'unknown', n: null });
});

test('transcript: a thought sits right before the customer message it led to; a silent one lands after the last reply', () => {
  const turns = [
    { role: 'bot', text: 'hi' },
    { role: 'customer', text: 'c1' },
    { role: 'bot', text: 'r1' },
    { role: 'customer', text: 'c2' },
    { role: 'bot', text: 'r2' },
  ];
  const thoughts = [{ turn: 1, interest: 3, action: 'reply', thought: 't1' }, { turn: 2, interest: 2, action: 'silent', thought: 't2' }];
  const items = interleaveTranscript(turns, thoughts);
  assert.deepEqual(items.map((item) => (item.type === 'thought' ? `T:${item.text}` : item.text)), ['hi', 'c1', 'r1', 'T:t1', 'c2', 'r2', 'T:t2']);
  assert.equal(items[3].label, 'หลังบอทตอบรอบ 1');
  assert.equal(items[3].interest, 3);
});

test('transcript: after the nudge, "ตาม N" thoughts sit before the follow-up customer messages', () => {
  const turns = [
    { role: 'bot', text: 'hi' },
    { role: 'customer', text: 'c1' },
    { role: 'bot', text: 'r1' },
    { role: 'bot', text: '(ผ่านไป 1 วัน)\nnudge' },
    { role: 'customer', text: 'f1' },
    { role: 'bot', text: 'rf1' },
  ];
  const thoughts = [{ turn: 1, interest: 2, action: 'silent', thought: 'before-nudge' }, { turn: 'ตาม1', interest: 2, action: 'reply', thought: 'before-f1' }, { turn: 'ตาม2', interest: 1, action: 'done', thought: 'end' }];
  const labels = interleaveTranscript(turns, thoughts).map((item) => (item.type === 'thought' ? `T:${item.text}` : item.text.split('\n')[0]));
  assert.deepEqual(labels, ['hi', 'c1', 'r1', 'T:before-nudge', '(ผ่านไป 1 วัน)', 'T:before-f1', 'f1', 'rf1', 'T:end']);
});

test('transcript: no thoughts gives back the turns; unknown thought turns go to the end', () => {
  const turns = [{ role: 'bot', text: 'hi' }, { role: 'customer', text: 'c1', action: 'give_phone' }];
  assert.deepEqual(interleaveTranscript(turns, []).map((item) => item.type), ['turn', 'turn']);
  assert.equal(interleaveTranscript(turns, null).length, 2);
  const items = interleaveTranscript(turns, [{ turn: 'x', thought: 'odd' }]);
  assert.equal(items.at(-1).text, 'odd');
  assert.equal(items.at(-1).label, 'หลังบอทตอบ');
  assert.equal(items[1].action, 'give_phone');
});

test('transcript: every fixture chat keeps all of its turns and thoughts, in order', () => {
  for (const convo of makeFixture().convos) {
    const items = interleaveTranscript(convo.turns, convo.thoughts);
    assert.equal(items.length, convo.turns.length + convo.thoughts.length, `${convo.run_label} ${convo.persona_id}`);
    assert.deepEqual(items.filter((item) => item.type === 'turn').map((item) => item.text), convo.turns.map((turn) => turn.text));
  }
});

test('result tone, outcome labels, the discovery checklist and lead facts', () => {
  assert.equal(resultTone('นัดได้-เบอร์+เวลา'), 'scale');
  assert.equal(resultTone('หลุดกลางทาง'), 'kill');
  assert.equal(resultTone('ไม่ใช่ผู้ซื้อ-จัดการผิด'), 'kill');
  assert.equal(resultTone('ไม่ให้เบอร์'), 'iterate');
  assert.equal(resultTone('ลูกค้าขอดูก่อน'), 'iterate');
  assert.equal(resultTone('ไม่รู้'), 'draft');
  assert.equal(outcomeLabel('dropped'), 'หลุดกลางทาง');
  assert.equal(outcomeLabel('weird'), 'weird');
  assert.equal(outcomeLabel(null), '–');
  const checklist = discoveryChecklist({ discovery: { business: true, product: false } });
  assert.deepEqual(checklist.map((item) => item.ok), [true, false, false, false]);
  const facts = leadFacts({ business: 'ร้าน', product: '', call_channel: 'line', parked: true, brief: false, phone_asks: 0 });
  assert.deepEqual(facts, [
    { label: 'ธุรกิจ', value: 'ร้าน' },
    { label: 'ขอเบอร์กี่รอบ', value: '0' },
    { label: 'ช่องทางคุย', value: 'LINE Call' },
    { label: 'พักไว้', value: 'ใช่' },
  ]);
  assert.deepEqual(leadFacts(null), []);
});

test('the run schema matches what the tests and the page assume', () => {
  for (const column of ['label text primary key', 'partial boolean', 'version_note text', 'summary jsonb']) assert.match(migration, new RegExp(column));
  for (const table of ['funnel_lab_bot_runs', 'funnel_lab_bot_convos', 'funnel_lab_bot_pick_runs', 'funnel_lab_bot_picks']) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
});

test('ทดสอบบอท is a saved view: tab, screen, dialog and actions are wired like ของจริง', () => {
  const views = new Set([...page.matchAll(/data-view="([a-z]+)"/g)].map((match) => match[1]));
  const screens = new Set([...page.matchAll(/data-screen="([a-z]+)"/g)].map((match) => match[1]));
  assert.ok(views.has('botsim') && screens.has('botsim'));
  assert.match(page, /<dialog id="botsim-dialog"/);
  assert.match(page, /data-action="botsim-refresh"/);
  assert.match(storage, /'botsim'/, 'the saved activeView accepts botsim');
  assert.match(ui, /if \(view === 'botsim'\) void renderBotsim\(\);/, 'opening the tab lazily loads the results');
  assert.match(ui, /action\.startsWith\('botsim-'\)/, 'the page routes botsim actions');
  assert.match(ui, /initBotsim\(\{ escapeHtml, announce \}\)/);
  assert.ok(ui.indexOf('initBotsim(') < ui.indexOf('renderAll();\n  if (local.notice)'), 'the view is wired before the first render (saved views reopen on load)');
});

test('every #id the botsim screen reads exists in the page', () => {
  const pageIds = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const used = new Set([...botsimUi.matchAll(/\$\('#([a-z0-9-]+)/g)].map((match) => match[1]));
  assert.deepEqual([...used].filter((id) => !pageIds.has(id)), []);
  assert.ok(used.size >= 12);
});

test('every data-* hook in the botsim rows avoids names the shared click handler already owns', () => {
  for (const reserved of ['data-view', 'data-creative-id', 'data-pack-id', 'data-edit-persona-id', 'data-persona-id', 'data-filter']) {
    assert.doesNotMatch(botsimUi, new RegExp(reserved), reserved);
  }
});

test('the botsim files and the new screen never use the banned word or system fonts', () => {
  assert.doesNotMatch(botsim + botsimUi, /คอร์ส/);
  assert.doesNotMatch(botsimUi, /-apple-system|Segoe UI|font-family:\s*Arial/);
});

test('the reader of this tab only uses supabase reads (no writes) and the cloud helpers exist', () => {
  for (const fn of ['listBotRuns', 'listBotPickRuns', 'listBotPicks', 'listBotConvoIndex', 'fetchBotConvo']) assert.match(cloudTs, new RegExp(`export async function ${fn}\\(`));
  const block = cloudTs.slice(cloudTs.indexOf('// ---------- "ทดสอบบอท"'));
  assert.doesNotMatch(block, /\.(insert|update|upsert|delete)\(/);
  assert.match(botsimUi, /from '.\/cloud\.ts'/);
});

test("ขอดูก่อน is neutral: no ดีสุด mark even when the counts differ", () => {
  const runs = [
    { label: "a", ran_at: "2026-10-12T09:00:00Z", partial: false, summary: { buyers: 34, deferred: 18 } },
    { label: "b", ran_at: "2026-10-12T10:00:00Z", partial: false, summary: { buyers: 34, deferred: 21 } },
  ];
  const row = overviewTable(splitRuns(runs).full).rows.find((r) => r.key === "deferred");
  assert.equal(row.cells.filter((cell) => cell.best).length, 0);
});

test("runs follow summary.order (bot version) before ran_at", () => {
  const runs = [
    { label: "new", ran_at: "2026-10-12T09:06:27Z", partial: false, summary: { order: 2 } },
    { label: "base2", ran_at: "2026-10-12T09:54:00Z", partial: false, summary: { order: 1 } },
    { label: "base", ran_at: "2026-10-12T09:06:47Z", partial: false, summary: { order: 0 } },
    { label: "trial", ran_at: "2026-10-12T08:52:00Z", partial: true, summary: { order: 108 } },
  ];
  const { full, partial } = splitRuns(runs);
  assert.deepEqual(full.map((r) => r.label), ["base", "base2", "new"]);
  assert.deepEqual(partial.map((r) => r.label), ["trial"]);
});

// ---------- ใบตัดสิน ----------
const vRun = (label, order, over = {}) => ({ label, ran_at: '2026-10-12T09:00:00Z', version_note: `note ${label}`, partial: false,
  summary: { order, buyers: 34, gave_phone: 10, phone_and_time: 9, deferred: 19, dropped: 4, discovery_full: 20, intro_repeat: 2, ...over } });
const vRuns = () => splitRuns([
  vRun('base', 0, { gave_phone: 10, dropped: 4, discovery_full: 10, intro_repeat: 35 }),
  vRun('base2', 1, { gave_phone: 9, dropped: 3, discovery_full: 10, intro_repeat: 33 }),
  vRun('new', 2, { gave_phone: 10, discovery_full: 26 }),
  vRun('new4b', 3, { gave_phone: 8, dropped: 4, phone_and_time: 7 }),
  vRun('final', 4, { gave_phone: 10, dropped: 2, discovery_full: 22 }),
]).full;
const vPick = (over = {}) => ({ summary: {
  wins: { base: 4, base2: 2, new: 7, new4b: 4, final: 10 },
  codex: { next: ['  ส่งสรุปหนึ่งหน้าก่อนขอเบอร์  ', ''] },
  by_segment: { buy: { base: 1, base2: 1, new: 3, new4b: 1, final: 1 }, near: { base: 2, new: 1, final: 5 }, off: { new4b: 1 } },
  ...over } });

test('verdict: the version the customers picked most is kept, in people not percentages', () => {
  const v = botVerdict(vRuns(), vPick());
  assert.equal(v.basis, 'picks');
  assert.equal(v.keeper.label, 'final');
  assert.equal(v.headline, 'ใช้ final ต่อ — ลูกค้าจำลองเลือกคุยต่อมากสุด 10 จาก 27 คน · ได้เบอร์ 10 จาก 34 คน');
  assert.doesNotMatch(v.headline + v.pick.join(' ') + v.leak.headline, /%|persona|jev|Codex|ตัวหาร/u, 'owner words only');
  assert.deepEqual(v.margin, { label: 'new', wins: 7, lead: 3 });
  assert.match(v.pick[0], /อันดับ 2 คือ new 7 คน/);
  assert.match(v.pick[2], /หลุดกลางทาง 2 คน \(น้อยสุด\)/);
});

test('verdict: compares with the previous version and the first one, and flags gaps within the noise', () => {
  const v = botVerdict(vRuns(), vPick());
  assert.equal(v.vsPrev.label, 'new4b');
  const phones = v.vsPrev.changes.find((c) => c.key === 'gave_phone');
  assert.deepEqual([phones.from, phones.to, phones.delta, phones.noise, phones.tone], [8, 10, 2, true, 'draft']);
  assert.equal(v.vsBase.label, 'base');
  assert.equal(v.vsBase.changes.find((c) => c.key === 'discovery_full').tone, 'scale', '10→22 is a real gain');
  assert.ok(v.cautions.some((c) => c.includes('ไม่เกิน 2 คนทุกข้อ')), 'every change vs new4b is ≤2 people');
  assert.ok(!v.cautions.some((c) => c.includes('นำอันดับ 2')), 'a 3-person lead is not flagged');
});

test('count change: fewer drops is good, more is bad, and ≤ NOISE_PEOPLE stays neutral', () => {
  const a = { summary: { dropped: 2, gave_phone: 15 } };
  const b = { summary: { dropped: 9, gave_phone: 10 } };
  assert.equal(countChange('dropped', a, b).tone, 'scale');
  assert.equal(countChange('dropped', b, a).tone, 'kill');
  assert.equal(countChange('gave_phone', a, b).tone, 'scale');
  assert.equal(countChange('gave_phone', { summary: { gave_phone: 10 + NOISE_PEOPLE } }, b).tone, 'draft');
  assert.equal(countChange('gave_phone', a, { summary: {} }), null);
});

test('verdict: what to fix = cleaned explainer steps, then counts another version clearly does better', () => {
  const v = botVerdict(vRuns(), vPick());
  assert.equal(v.fix[0], 'ส่งสรุปหนึ่งหน้าก่อนขอเบอร์');
  assert.ok(v.fix.includes('รู้จักธุรกิจครบ 4 เรื่อง: new ทำได้ 26 คน · final ได้ 22 คน'), v.fix.join(' | '));
  assert.ok(!v.fix.some((f) => f.startsWith('ได้เบอร์')), 'no one beats final on phones by more than the noise');
});

test('verdict: where customers stop — the biggest stop, and buyer groups that liked another version (never ไม่ใช่ผู้ซื้อ)', () => {
  const v = botVerdict(vRuns(), vPick());
  assert.equal(v.leak.headline, 'ติดที่ "ขอดูก่อน ยังไม่ให้เบอร์" มากสุด — 19 จาก 34 คน');
  assert.deepEqual(v.leak.bars.map((b) => [b.key, b.n, b.pct]), [['gave_phone', 10, 29], ['deferred', 19, 56], ['dropped', 2, 6], ['discovery_full', 22, 65]]);
  assert.deepEqual(v.leak.segments, ['ลูกค้าที่จ่ายแล้ว (7 คน): ชอบ new 3 คน · final ได้แค่ 1 คน']);
});

test('verdict without picks: most phones, then fewest drops, then the newer version; a thin lead is flagged', () => {
  const runs = splitRuns([vRun('a', 0, { gave_phone: 11, dropped: 5 }), vRun('b', 1, { gave_phone: 11, dropped: 2 }), vRun('c', 2, { gave_phone: 11, dropped: 2 })]).full;
  const v = botVerdict(runs, null);
  assert.equal(v.basis, 'numbers');
  assert.equal(v.keeper.label, 'c', 'tie on phones and drops goes to the newer version');
  assert.match(v.headline, /^ใช้ c ต่อ — ได้เบอร์มากสุด 11 จาก 34 คน · หลุดกลางทาง 2 คน$/u);
  assert.ok(v.cautions.some((c) => c.includes('นำอันดับ 2 (b) แค่ 0 คน')));
  assert.deepEqual(v.leak.segments, []);
  assert.equal(botVerdict([], null), null);
});

test('verdict: a lone version has nothing to compare; a version with no drops says so', () => {
  const v = botVerdict(splitRuns([vRun('only', 0, { dropped: 0, deferred: 0 })]).full, null);
  assert.equal(v.vsPrev, null);
  assert.equal(v.vsBase, null);
  assert.equal(v.margin, null);
  assert.equal(v.leak.headline, 'ไม่มีลูกค้าหลุดในรอบนี้');
});

test('verdict on the fixture runs and the brief to paste', () => {
  const { runs, pickRuns } = makeFixture();
  const v = botVerdict(splitRuns(runs).full, pickRuns[0]);
  assert.ok(FULL_LABELS.includes(v.keeper.label));
  const brief = botsimBrief(v);
  assert.ok(brief.startsWith('Funnel Lab · ทดสอบบอท LINE'));
  assert.ok(brief.includes(v.headline) && brief.includes('ลูกค้าหลุดตรงไหน:'));
  assert.equal(botsimBrief(null), '');
});

test('version rows: one per full run, phones bar relative to the best, keeper marked', () => {
  const rows = versionRows(vRuns(), vPick(), 'final');
  assert.deepEqual(rows.map((r) => r.label), ['base', 'base2', 'new', 'new4b', 'final']);
  assert.deepEqual(rows.find((r) => r.label === 'new4b'), { label: 'new4b', note: 'note new4b', keeper: false, buyers: 34, phones: 8, phonesWidth: 80, dropped: 4, wins: 4 });
  assert.equal(rows.filter((r) => r.keeper).length, 1);
  assert.equal(versionRows(vRuns(), null, '')[0].wins, null);
});
