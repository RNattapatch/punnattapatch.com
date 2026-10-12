// Funnel Lab "ทดสอบบอท" screen (2026-10-13). Shows what persona-sim and persona-pick wrote (funnel_lab_bot_*):
//   01 every full run side by side (+ trial runs)   02 which chat each persona liked (jev picks, Codex explains)
//   03 one row per persona → dialog with reasoning and the chosen + worst chats   04 any transcript on demand
// Numbers, labels and the transcript order live in botsim.mjs (pure, tested); this file fetches and renders only.
import {
  ACTION_THAI, OUTCOME_THAI, SEGMENT_ORDER, SEGMENT_THAI, discoveryChecklist, filterPicks, interleaveTranscript, latestPickRun,
  leadFacts, orderLabels, outcomeLabel, overviewTable, partialRows, pickRunView, pickView, resultTone, runOptions, segmentCounts,
  splitRuns,
} from './botsim.mjs';
import { fetchBotConvo, listBotConvoIndex, listBotPicks, listBotPickRuns, listBotRuns } from './cloud.ts';

const SEGMENT_CHIP = Object.freeze({ buy: 'gl-chip-scale', near: 'gl-chip-iterate', warm: 'gl-chip-draft', off: 'gl-chip-kill' });
const TONE_CHIP = Object.freeze({ scale: 'gl-chip-scale', iterate: 'gl-chip-iterate', kill: 'gl-chip-kill', draft: 'gl-chip-draft' });

let ctx = null;
let data = null;                 // { full, partial, pickRun, picks, loadedAt }
let loading = null;
const indexCache = new Map();    // run label → Promise<index rows without transcripts>
const convoCache = new Map();    // "run|persona" → Promise<full convo | null>
let viewerSeq = 0;               // the newest transcript-viewer request wins
let lastTrigger = null;          // the row that opened the dialog gets focus back on close
let dialogPersona = null;        // the persona the open dialog is about

const $ = (selector) => document.querySelector(selector);
const esc = (value) => ctx.escapeHtml(value);
const fmt = (value, digits = 0) => (value === null || value === undefined || Number.isNaN(Number(value)) ? '–' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: digits }));
const dateTh = (iso) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '–');

function convoIndex(run) {
  if (!indexCache.has(run)) indexCache.set(run, listBotConvoIndex(run).catch((error) => { indexCache.delete(run); throw error; }));
  return indexCache.get(run);
}

function convo(run, persona) {
  const key = `${run}|${persona}`;
  if (!convoCache.has(key)) convoCache.set(key, fetchBotConvo(run, persona).catch((error) => { convoCache.delete(key); throw error; }));
  return convoCache.get(key);
}

/** Labels that the pick run ranked over, in full-run order. */
function pickLabels() {
  const pick = data?.pickRun;
  return orderLabels([...(pick?.run_labels ?? []), ...Object.keys(pick?.summary?.wins ?? {})], data?.full ?? []);
}

export function initBotsim(context) {
  ctx = context;
  $('#botsim-segment')?.addEventListener('change', renderPicks);
  $('#botsim-picks')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-botsim-persona]');
    if (row) void openPick(row.dataset.botsimPersona, row);
  });
  $('#botsim-view-run')?.addEventListener('change', () => { void loadViewerPersonas(); });
  $('#botsim-view-persona')?.addEventListener('change', () => { void renderViewer(); });
  $('#botsim-dialog-body')?.addEventListener('change', (event) => {
    const select = event.target.closest('[data-botsim-side-run]');
    if (select) void loadSide(select.closest('[data-botsim-side]'));
  });
  $('#botsim-dialog')?.addEventListener('close', () => {
    dialogPersona = null;
    lastTrigger?.focus?.();
    lastTrigger = null;
  });
}

export async function handleBotsimAction(action) {
  if (action === 'botsim-refresh') return renderBotsim(true);
  return null;
}

export async function renderBotsim(force = false) {
  if (!ctx) return;
  if (data && !force) return;
  if (loading) return loading;
  if (force) { indexCache.clear(); convoCache.clear(); }
  $('#botsim-meta').textContent = 'กำลังโหลดผลทดสอบจากคลาวด์…';
  loading = (async () => {
    try {
      const [runs, pickRuns] = await Promise.all([listBotRuns(), listBotPickRuns()]);
      const pickRun = latestPickRun(pickRuns);
      const picks = pickRun ? await listBotPicks(pickRun.id) : [];
      data = { ...splitRuns(runs), pickRun, picks, loadedAt: Date.now() };
      renderAll();
    } catch (error) {
      $('#botsim-meta').textContent = `โหลดผลทดสอบไม่ได้: ${error.message}`;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function renderAll() {
  const { full, partial, pickRun, picks } = data;
  $('#botsim-meta').textContent = `รอบเต็ม ${full.length} รอบ · รอบละ ${full[0]?.persona_count ?? '–'} persona · รอบทดลอง ${partial.length} รอบ · ผลเลือกล่าสุด ${pickRun ? dateTh(pickRun.ran_at) : 'ยังไม่มี'} · ${picks.length} คน`;
  renderOverview();
  renderPartial();
  renderSheet();
  renderPickMeta();
  renderBars();
  renderSegmentOptions();
  renderPicks();
  renderViewerControls();
}

// ---------- 01 overview ----------
function renderOverview() {
  const table = overviewTable(data.full);
  if (!table.columns.length) { $('#botsim-overview').innerHTML = '<p class="text-sm opacity-70">ยังไม่มีรอบทดสอบแบบเต็ม</p>'; return; }
  const head = table.columns.map((column) => `<th scope="col" class="min-w-[7.5rem] whitespace-normal align-bottom">
      <span class="block font-display text-sm font-semibold">${esc(column.label)}</span>
      <span class="block text-[11px] font-normal leading-snug opacity-70">${esc(column.note || '—')}</span>
      <span class="block text-[10px] font-normal opacity-50">${esc(dateTh(column.ranAt))}</span></th>`).join('');
  const body = table.rows.map((row) => `<tr>
      <th scope="row" class="whitespace-normal text-left align-middle text-sm font-semibold">${esc(row.label)}${row.scale ? ` <span class="text-[10px] font-normal opacity-50">${esc(row.scale)}</span>` : ''}</th>
      ${row.cells.map((cell) => `<td class="text-right align-middle tabular-nums ${cell.best ? 'gl-stop font-semibold' : ''}">
        ${esc(cell.text)}${cell.sub ? `<span class="block text-[11px] font-normal opacity-60">${esc(cell.sub)}</span>` : ''}
        ${cell.best ? '<span class="badge badge-xs gl-chip-scale mt-1 border-0">ดีสุด</span>' : ''}</td>`).join('')}
    </tr>`).join('');
  $('#botsim-overview').innerHTML = `<div class="overflow-x-auto"><table class="table table-sm">
    <caption class="sr-only">ผลทดสอบบอทแต่ละรอบ เทียบตัวชี้วัด</caption>
    <thead><tr><th scope="col" class="min-w-[11rem]">ตัวชี้วัด</th>${head}</tr></thead>
    <tbody>${body}</tbody></table></div>`;
}

const cellText = (row, key) => row.cells.find((cell) => cell.key === key)?.text ?? '–';

function renderPartial() {
  const rows = partialRows(data.partial);
  $('#botsim-partial').innerHTML = rows.length ? `<h3 class="text-sm font-semibold">รอบทดลอง · persona 1 คน (ไม่นับในตารางรวม)</h3>
    <ul class="mt-2 divide-y divide-base-300">${rows.map((row) => `<li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2 text-sm">
      <span><strong>${esc(row.label)}</strong> <span class="opacity-70">${esc(row.note || '—')}</span></span>
      <span class="text-xs opacity-70">${esc(dateTh(row.ranAt))} · ได้เบอร์ ${esc(cellText(row, 'gave_phone'))} · หลุด ${esc(cellText(row, 'dropped'))}</span></li>`).join('')}</ul>` : '';
}

// ---------- 02 which chat personas picked ----------
function renderSheet() {
  const sheet = $('#botsim-sheet');
  if (!data.pickRun) {
    sheet.innerHTML = '<p class="gl-eyebrow">สรุปจาก Codex</p><p class="mt-1 font-display text-lg font-semibold">ยังไม่มีผลการเลือก</p><p class="mt-1 text-sm opacity-80">ผลจะขึ้นเมื่อ jev เลือกเสร็จ และ Codex อธิบายเหตุผลเสร็จ</p>';
    return;
  }
  const view = pickRunView(data.pickRun, pickLabels());
  const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join('');
  sheet.innerHTML = `<p class="gl-eyebrow">สรุปจาก Codex</p>
    <p class="mt-1 font-display text-lg font-semibold leading-snug">${esc(view.headline || 'Codex ยังไม่ได้เขียนหัวข้อสรุป')}</p>
    <h3 class="gl-eyebrow mt-4">สิ่งที่เห็น</h3>
    <ul class="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">${list(view.findings) || '<li class="opacity-70">ยังไม่มี</li>'}</ul>
    <h3 class="gl-eyebrow mt-4">ขั้นต่อไป</h3>
    <ol class="mt-1 list-decimal space-y-1 pl-5 text-sm leading-relaxed">${list(view.next) || '<li class="opacity-70">ยังไม่มี</li>'}</ol>`;
}

function renderPickMeta() {
  const box = $('#botsim-pick-meta');
  if (!data.pickRun) { box.innerHTML = ''; return; }
  const view = pickRunView(data.pickRun, pickLabels());
  const cell = (label, value) => `<div class="min-w-0"><dt class="gl-eyebrow">${esc(label)}</dt><dd class="break-words font-semibold">${value}</dd></div>`;
  box.innerHTML = `<dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
    ${cell('ผู้เลือก (jev)', esc(view.pickerModel || '–'))}
    ${cell('ผู้อธิบาย (Codex)', esc(view.reasonModel || '–'))}
    ${cell('เลือกเมื่อ', esc(dateTh(view.ranAt)))}
    ${cell('ค่าโมเดล', view.costUsd === null ? '–' : `$${fmt(view.costUsd, 2)}`)}
    ${cell('Codex เห็นด้วยกับ jev', view.agreePct === null ? '–' : `${view.agreePct}%`)}
    ${cell('จำนวนผู้เลือก', `${fmt(data.picks.length)} คน`)}</dl>`;
}

function renderBars() {
  const box = $('#botsim-bars');
  if (!data.pickRun) { box.innerHTML = ''; return; }
  const view = pickRunView(data.pickRun, pickLabels());
  const width = (value, max) => (max > 0 ? Math.round((value / max) * 100) : 0);
  const winRows = view.wins.map((win) => `<li class="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-sm">
      <span class="truncate">${esc(win.label)}</span>
      <span class="gl-bar" role="img" aria-label="${esc(win.label)} ชนะ ${win.n} คน"><span style="width:${width(win.n, view.maxWins)}%"></span></span>
      <span class="text-right tabular-nums">${fmt(win.n)}</span></li>`).join('');
  const scoreRows = view.scores.map((item) => `<li class="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm">
      <span class="truncate">${esc(item.label)}</span>
      <span class="gl-bar" role="img" aria-label="${esc(item.label)} คะแนนเฉลี่ย ${item.score === null ? 'ไม่มีข้อมูล' : fmt(item.score, 2)} จาก 4"><span style="width:${item.pct ?? 0}%"></span></span>
      <span class="text-right tabular-nums">${item.score === null ? '–' : `${fmt(item.score, 2)}/4`}</span></li>`).join('');
  const segments = view.bySegment.length ? `<div class="overflow-x-auto"><table class="table table-xs mt-2"><caption class="text-left text-xs font-semibold opacity-80">ชนะแยกตามกลุ่ม</caption>
      <thead><tr><th scope="col">กลุ่ม</th>${view.wins.map((win) => `<th scope="col" class="text-right">${esc(win.label)}</th>`).join('')}</tr></thead>
      <tbody>${view.bySegment.map((row) => `<tr><th scope="row" class="font-normal">${esc(row.label)}</th>${row.counts.map((count) => `<td class="text-right tabular-nums">${fmt(count)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
  box.innerHTML = `<div><p class="text-sm font-semibold">ชนะรอบละกี่คน <span class="text-xs font-normal opacity-60">(รวม ${fmt(view.totalWins)} คน)</span></p><ul class="mt-2 space-y-1.5">${winRows}</ul></div>
    <div><p class="text-sm font-semibold">คะแนนเฉลี่ยของแต่ละรอบ <span class="text-xs font-normal opacity-60">(0–4)</span></p><ul class="mt-2 space-y-1.5">${scoreRows}</ul></div>
    ${segments}`;
}

// ---------- 03 one row per persona ----------
function renderSegmentOptions() {
  const select = $('#botsim-segment');
  const counts = segmentCounts(data.picks);
  const keep = select.value;
  select.innerHTML = `<option value="">ทั้งหมด (${counts.total})</option>${SEGMENT_ORDER.map((segment) => `<option value="${segment}">${SEGMENT_THAI[segment]} (${counts[segment]})</option>`).join('')}`;
  select.value = SEGMENT_ORDER.includes(keep) ? keep : '';
}

function agreeBadge(view) {
  return view.agree === false ? `<span class="badge badge-sm gl-chip-iterate border-0">Codex เลือก ${esc(view.codexPick ?? 'ต่างออกไป')}</span>` : '';
}

function renderPicks() {
  const list = $('#botsim-picks');
  if (!data.picks.length) {
    list.innerHTML = '<li class="py-4 text-sm"><p class="font-semibold">ยังไม่มีผลการเลือก</p><p class="mt-1 opacity-70">ผลรายคนจะขึ้นเมื่อ jev เลือกเสร็จ</p></li>';
    return;
  }
  const labels = pickLabels();
  const rows = filterPicks(data.picks, $('#botsim-segment').value);
  list.innerHTML = rows.map((pick) => {
    const view = pickView(pick, labels);
    return `<li><button type="button" class="tap-44 flex w-full flex-col items-start gap-1 py-3 text-left hover:bg-base-100 focus-visible:outline focus-visible:outline-2" data-botsim-persona="${esc(view.personaId)}" aria-haspopup="dialog">
      <span class="flex w-full flex-wrap items-center gap-2"><strong class="min-w-0 truncate text-sm">${esc(view.name)}</strong>
        <span class="badge badge-sm ${SEGMENT_CHIP[view.segment] ?? 'gl-chip-draft'} border-0">${esc(view.segmentThai)}</span>
        <span class="text-xs">เลือก <strong>${esc(view.chosen ?? '–')}</strong>${view.chosenPct === null ? '' : ` ${view.chosenPct}%`}</span>${agreeBadge(view)}</span>
      <span class="line-clamp-2 text-xs opacity-75">${esc(view.why || '—')}</span></button></li>`;
  }).join('') || '<li class="py-4 text-sm opacity-70">ไม่มี persona ในกลุ่มนี้</li>';
}

async function openPick(personaId, trigger) {
  const pick = data?.picks.find((item) => item.persona_id === personaId);
  const dialog = $('#botsim-dialog');
  if (!pick || !dialog) return;
  lastTrigger = trigger ?? null;
  dialogPersona = personaId;
  const labels = pickLabels();
  const view = pickView(pick, labels);
  $('#botsim-dialog-title').textContent = view.name;
  $('#botsim-dialog-body').innerHTML = dialogHtml(view, labels);
  if (!dialog.open) dialog.showModal();
  await Promise.all([...document.querySelectorAll('[data-botsim-side]')].map((side) => loadSide(side)));
}

function dialogHtml(view, labels) {
  const chosen = view.chosen ? `<span class="badge ${SEGMENT_CHIP[view.segment] ?? 'gl-chip-draft'} border-0">${esc(view.segmentThai)}</span>
      <span class="text-sm">เลือก <strong>${esc(view.chosen)}</strong>${view.chosenPct === null ? '' : ` · ${view.chosenPct}%`}</span>` : '';
  const reasons = [['เหตุผล', view.why], ['เทียบกับแชทที่แย่สุด', view.vsWorst], ['บทเรียน', view.lesson]]
    .filter(([, body]) => body)
    .map(([heading, body]) => `<div><p class="gl-eyebrow">${heading}</p><p class="mt-1 text-sm leading-relaxed">${esc(body)}</p></div>`).join('')
    || '<p class="text-sm opacity-70">Codex ยังไม่ได้อธิบายรายคนนี้</p>';
  const strip = view.scores.map((item) => `<li class="grid grid-cols-[7.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-xs">
      <span class="truncate ${item.label === view.chosen ? 'font-semibold' : ''}">${esc(item.label)}${item.label === view.chosen ? ' (เลือก)' : ''}</span>
      <span class="gl-bar" role="img" aria-label="${esc(item.label)} ${item.score === null ? 'ไม่มีคะแนน' : `${fmt(item.score, 1)} จาก 4`}"><span style="width:${item.pct ?? 0}%"></span></span>
      <span class="text-right tabular-nums">${item.score === null ? '–' : `${fmt(item.score, 1)}/4`}</span></li>`).join('');
  return `<div class="flex flex-wrap items-center gap-2">${chosen}${agreeBadge(view)}</div>
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div class="space-y-3">${reasons}</div>
      <div><p class="gl-eyebrow">คะแนนทุกแชท (0–4)</p><ul class="mt-2 space-y-1.5">${strip}</ul></div>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      ${sideShell('chosen', 'แชทที่เลือก', view.chosen, labels)}
      ${sideShell('worst', 'แชทที่แย่สุด', view.worst, labels)}
    </div>`;
}

function sideShell(side, title, run, labels) {
  const fallback = labels.at(-1) ?? '';
  const options = labels.map((label) => `<option value="${esc(label)}" ${label === (run ?? fallback) ? 'selected' : ''}>${esc(label)}</option>`).join('');
  return `<section data-botsim-side="${side}" class="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="gl-eyebrow">${title}</p>
        <label class="form-control"><span class="label-text text-xs">รอบ</span>
          <select class="select select-bordered select-sm tap-44" data-botsim-side-run aria-label="รอบของ${title}">${options}</select></label>
      </div>
      <div data-botsim-side-body class="mt-3 text-sm opacity-70">${run ? 'กำลังโหลดบทสนทนา…' : 'Codex ไม่ได้ระบุแชทที่แย่สุดของ persona นี้ เลือกรอบเองได้'}</div>
    </section>`;
}

async function loadSide(side) {
  if (!side || !dialogPersona) return;
  const run = side.querySelector('[data-botsim-side-run]')?.value;
  const body = side.querySelector('[data-botsim-side-body]');
  const persona = dialogPersona;
  const seq = String(Number(side.dataset.seq || 0) + 1);
  side.dataset.seq = seq;
  if (!run) return;
  body.innerHTML = '<p class="opacity-70">กำลังโหลดบทสนทนา…</p>';
  try {
    const row = await convo(run, persona);
    if (side.dataset.seq !== seq || dialogPersona !== persona) return;
    body.innerHTML = row ? convoHtml(row) : `<p>รอบ ${esc(run)} ไม่มีบทสนทนาของ persona นี้</p>`;
  } catch (error) {
    if (side.dataset.seq === seq) body.innerHTML = `<p>โหลดบทสนทนาไม่ได้: ${esc(error.message)}</p>`;
  }
}

// ---------- 04 transcript viewer ----------
function renderViewerControls() {
  const select = $('#botsim-view-run');
  const options = runOptions(data);
  const keep = select.value;
  select.innerHTML = options.map((option) => `<option value="${esc(option.label)}">${esc(option.label)}${option.partial ? ' · ทดลอง' : ''}${option.note ? ` · ${esc(option.note)}` : ''}</option>`).join('');
  const fallback = data.full.at(-1)?.label ?? data.partial.at(-1)?.label ?? '';
  select.value = options.some((option) => option.label === keep) ? keep : fallback;
  void loadViewerPersonas();
}

async function loadViewerPersonas() {
  const run = $('#botsim-view-run').value;
  const select = $('#botsim-view-persona');
  const keep = select.value;
  if (!run) { select.innerHTML = ''; await renderViewer(); return; }
  select.disabled = true;
  try {
    const rows = await convoIndex(run);
    if ($('#botsim-view-run').value !== run) return;
    rows.sort((a, b) => SEGMENT_ORDER.indexOf(a.segment) - SEGMENT_ORDER.indexOf(b.segment) || String(a.persona_name || a.persona_id).localeCompare(String(b.persona_name || b.persona_id), 'th'));
    select.innerHTML = rows.map((row) => `<option value="${esc(row.persona_id)}">${esc(row.persona_name || row.persona_id)} · ${esc(SEGMENT_THAI[row.segment] ?? row.segment ?? '–')} · ${esc(OUTCOME_THAI[row.outcome] ?? row.outcome ?? '–')}</option>`).join('');
    select.value = rows.some((row) => row.persona_id === keep) ? keep : (rows[0]?.persona_id ?? '');
  } catch (error) {
    select.innerHTML = '';
    $('#botsim-transcript').innerHTML = `<p class="text-sm">โหลดรายชื่อ persona ไม่ได้: ${esc(error.message)}</p>`;
    return;
  } finally {
    select.disabled = false;
  }
  await renderViewer();
}

async function renderViewer() {
  const run = $('#botsim-view-run').value;
  const persona = $('#botsim-view-persona').value;
  const out = $('#botsim-transcript');
  if (!run || !persona) { out.innerHTML = '<p class="text-sm opacity-70">ยังไม่มีบทสนทนาให้แสดง</p>'; return; }
  const seq = ++viewerSeq;
  out.innerHTML = '<p class="text-sm opacity-70">กำลังโหลดบทสนทนา…</p>';
  try {
    const row = await convo(run, persona);
    if (seq !== viewerSeq) return;
    out.innerHTML = row ? convoHtml(row) : '<p class="text-sm">ไม่พบบทสนทนานี้</p>';
  } catch (error) {
    if (seq === viewerSeq) out.innerHTML = `<p class="text-sm">โหลดบทสนทนาไม่ได้: ${esc(error.message)}</p>`;
  }
}

// ---------- transcript ----------
function turnHtml(item) {
  if (item.type === 'thought') {
    return `<li class="mx-auto w-[92%] rounded-xl border border-dashed border-base-content/40 bg-base-200 px-3 py-2 text-xs" data-kind="thought">
      <p class="font-semibold opacity-80">ความคิดในใจ (บอทไม่เห็น) · ${esc(item.label)}${item.interest === null ? '' : ` · สนใจ ${fmt(item.interest)}/5`}${item.action ? ` · ${esc(ACTION_THAI[item.action] ?? item.action)}` : ''}</p>
      <p class="mt-1 italic">${esc(item.text || '—')}</p></li>`;
  }
  const isBot = item.role === 'bot';
  const tag = isBot ? 'บอท' : `ลูกค้าจำลอง${item.action && item.action !== 'reply' ? ` · ${esc(ACTION_THAI[item.action] ?? item.action)}` : ''}`;
  return `<li class="flex ${isBot ? 'justify-start' : 'justify-end'}" data-kind="${isBot ? 'bot' : 'customer'}">
    <div class="max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${isBot ? 'rounded-tl-sm border border-base-300 bg-base-100' : 'gl-primary rounded-tr-sm'}">
      <span class="block text-[10px] font-semibold opacity-70">${tag}</span>${esc(item.text)}</div></li>`;
}

function judgeHtml(judge, lead) {
  const facts = leadFacts(lead);
  const leadBlock = facts.length ? `<div><p class="gl-eyebrow">สิ่งที่บอทจดไว้</p><dl class="mt-1 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-2">
    ${facts.map((fact) => `<div class="flex min-w-0 gap-2"><dt class="shrink-0 opacity-70">${esc(fact.label)}</dt><dd class="min-w-0 break-words">${esc(fact.value)}</dd></div>`).join('')}</dl></div>` : '';
  if (!judge || typeof judge !== 'object') {
    return `<section class="space-y-3 rounded-xl border border-base-300 bg-base-100 p-3 text-sm"><p class="opacity-80">ยังไม่มีผลกรรมการสำหรับบทนี้</p>${leadBlock}</section>`;
  }
  const result = judge.result ? `<span class="badge ${TONE_CHIP[resultTone(judge.result)]} border-0">${esc(judge.result)}</span>` : '';
  const scores = [['ไหวพริบ', judge.savvy], ['นำขั้นต่อไป', judge.leading], ['ข้อเสนอตรงคน', judge.fit]]
    .map(([label, value]) => `<div class="rounded-lg bg-base-200 p-2 text-center"><p class="text-[11px] opacity-70">${label}</p>
      <p class="font-display text-lg font-semibold tabular-nums">${value === null || value === undefined ? '–' : fmt(value)}<span class="text-xs opacity-60">/5</span></p></div>`).join('');
  const discovery = discoveryChecklist(judge).map((item) => `<li class="${item.ok ? '' : 'opacity-60'}">${item.ok ? 'ครบ' : 'ยังไม่ครบ'} · ${esc(item.label)}</li>`).join('');
  const quotes = [['ข้อความที่ดีที่สุด', judge.best], ['ข้อความที่ทำให้เสียที่สุด', judge.worst], ['เพราะ', judge.why], ['ควรแก้', judge.fix]]
    .filter(([, body]) => body)
    .map(([heading, body]) => `<div><p class="gl-eyebrow">${heading}</p><p class="mt-1 whitespace-pre-line leading-relaxed">${esc(body)}</p></div>`).join('');
  const dropped = Number.isInteger(judge.drop_after_bot_turn) ? `<p class="text-xs opacity-70">หลุดหลังบอทตอบรอบ ${judge.drop_after_bot_turn}</p>` : '';
  return `<section class="space-y-3 rounded-xl border border-base-300 bg-base-100 p-3 text-sm">
    <div class="flex flex-wrap items-center gap-2"><p class="gl-eyebrow">ผลกรรมการ</p>${result}</div>
    <div class="grid grid-cols-3 gap-2">${scores}</div>
    <div><p class="gl-eyebrow">ได้ข้อมูลอะไรบ้างตอนจบ</p><ul class="mt-1 grid grid-cols-1 gap-x-3 text-xs sm:grid-cols-2">${discovery}</ul></div>
    ${dropped}${quotes}${leadBlock}</section>`;
}

function convoHtml(row) {
  const items = interleaveTranscript(row.turns, row.thoughts);
  const chips = [outcomeLabel(row.outcome), row.gave_phone ? 'ได้เบอร์แล้ว' : 'ยังไม่ได้เบอร์', row.booked ? 'นัดแล้ว' : 'ยังไม่นัด'];
  return `<div class="space-y-4">
    <div class="flex flex-wrap gap-1.5 text-xs">${chips.map((chip) => `<span class="badge badge-ghost badge-sm">${esc(chip)}</span>`).join('')}
      ${row.entry ? `<span class="badge badge-ghost badge-sm">เข้ามาทาง ${esc(row.entry)}</span>` : ''}</div>
    ${row.opener ? `<p class="text-xs opacity-70">ข้อความเปิด: ${esc(row.opener)}</p>` : ''}
    <ol class="space-y-2" aria-label="บทสนทนา ${esc(row.persona_name || row.persona_id)}">${items.map(turnHtml).join('') || '<li class="text-sm opacity-70">ไม่มีข้อความ</li>'}</ol>
    ${judgeHtml(row.judge, row.lead)}</div>`;
}
