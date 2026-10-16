// Funnel Lab "ผลย้อนหลัง" screen (2026-10-17) — every review run from the mini, newest first, opened as a "ใบตัดสิน":
//   one-line verdict + tally → ใช้ตัวไหน / แก้อะไรก่อน / รั่วตรงไหน → per-item cards → score table → full report.
// Rows: funnel_lab_review_runs (written by mac-mini-ops/funnel-lab/publish_review.mjs) · logic in history.mjs (pure, tested).
// Self-contained: owns its clicks/inputs inside #view-history, so ui.mjs only calls initHistory + renderHistory.
import {
  KIND_THAI, allItems, bulletParts, compareSides, displayTitle, filterRuns, fixBrief, isFlat, itemText, kindCounts, resolveRef, sheet, tally, verdictInfo, verdictKey,
} from './history.mjs';
import { fetchReviewRun, listReviewRuns, signedThumbUrls } from './cloud.ts';

const TONE_CHIP = Object.freeze({ scale: 'gl-chip-scale', iterate: 'gl-chip-iterate', kill: 'gl-chip-kill', draft: 'gl-chip-draft' });
const DISAGREE_HINT = 'ผู้ตรวจ (Codex) อ่านเหตุผลแล้วไม่เห็นด้วยกับคะแนนของผู้ซื้อจำลอง (jev) — อ่านเหตุผลก่อนตัดสิน';

let ctx = null;
let runs = null;                   // list stubs, newest first
let listLoading = null;
const runCache = new Map();        // slug → Promise<{ run, thumbs }>
let filter = { kind: '', query: '' };
let selected = '';
let detailSeq = 0;                 // the newest detail request wins

const $ = (selector) => document.querySelector(selector);
const esc = (value) => ctx.escapeHtml(value ?? '');
const dateTh = (iso) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '–');
const dayTh = (iso) => (iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '–');
const chip = (info, extra = '') => `<span class="badge border-0 ${TONE_CHIP[info.tone] ?? TONE_CHIP.draft} ${extra}">${esc(info.label)}</span>`;

function hashSlug() {
  const m = location.hash.match(/run=([a-z0-9._-]+)/);
  return m ? m[1] : '';
}

function loadList(force = false) {
  if (force) { runs = null; listLoading = null; runCache.clear(); }
  if (!listLoading) listLoading = listReviewRuns().then((rows) => { runs = rows; return rows; }).catch((error) => { listLoading = null; throw error; });
  return listLoading;
}

function loadRun(slug) {
  if (!runCache.has(slug)) {
    runCache.set(slug, fetchReviewRun(slug).then(async (run) => {
      const paths = Object.values(run?.covers ?? {});
      const thumbs = paths.length ? await signedThumbUrls(paths).catch(() => ({})) : {};
      return { run, thumbs };
    }).catch((error) => { runCache.delete(slug); throw error; }));
  }
  return runCache.get(slug);
}

// ---------- rail (list + filters) ----------
function renderRail() {
  const shown = filterRuns(runs, filter);
  $('#history-kinds').innerHTML = [{ kind: '', label: 'ทั้งหมด', count: runs.length }, ...kindCounts(runs)]
    .map((k) => `<button type="button" class="btn btn-xs rounded-full tap-44 ${filter.kind === k.kind ? 'gl-primary' : 'btn-ghost'}" data-hist-kind="${esc(k.kind)}" aria-pressed="${filter.kind === k.kind}">${esc(k.label)} <span class="opacity-60">${k.count}</span></button>`)
    .join('');
  $('#history-list').innerHTML = shown.length ? shown.map((r) => {
    const marks = tally(r.tally).slice(0, 3).map((t) => `<span class="badge badge-sm border-0 ${TONE_CHIP[t.tone]}">${esc(t.label)} ${t.count}</span>`).join(' ');
    const active = r.slug === selected;
    return `<li><button type="button" class="w-full rounded-xl p-2.5 text-left transition-colors hover:bg-base-100 ${active ? 'gl-card-active' : ''}" data-hist-run="${esc(r.slug)}"${active ? ' aria-current="true"' : ''}>
      <span class="flex items-center justify-between gap-2 text-xs opacity-60"><span>${esc(KIND_THAI[r.kind] ?? r.kind)}</span><span>${esc(dayTh(r.ran_at))}</span></span>
      <span class="mt-0.5 block font-semibold leading-snug">${esc(r.title)}</span>
      ${r.headline ? `<span class="mt-1 block text-xs leading-snug opacity-70 line-clamp-2">${esc(r.headline)}</span>` : ''}
      ${marks ? `<span class="mt-1.5 flex flex-wrap gap-1">${marks}</span>` : ''}
    </button></li>`;
  }).join('') : '<li class="p-3 text-sm opacity-60">ไม่เจอรอบที่ตรงกับที่ค้น</li>';
  $('#history-select').innerHTML = shown.map((r) => `<option value="${esc(r.slug)}"${r.slug === selected ? ' selected' : ''}>${esc(dayTh(r.ran_at))} · ${esc(r.title)}</option>`).join('');
}

// ---------- detail (ใบตัดสิน) ----------
function refChip(run, thumbs, ref) {
  const item = resolveRef(run, ref);
  if (!item) return `<span class="badge badge-sm badge-ghost font-mono align-middle">${esc(ref)}</span>`;
  const cover = run.covers?.[item.id] && thumbs[run.covers[item.id]];
  const name = displayTitle(run, item);
  const label = name && name !== item.id ? (item.id.length <= 12 ? `${item.id} · ${name}` : name) : item.id;
  return `<span class="mb-0.5 flex items-center gap-2">${cover ? `<img src="${esc(cover)}" alt="" class="h-12 w-10 shrink-0 rounded object-cover" loading="lazy">` : ''}<b class="leading-snug">${esc(label)}</b></span>`;
}

function answerBlock(run, thumbs, group, { icon, title, tone, limit = 5 }) {
  if (!group?.items?.length) return '';
  const items = group.items.slice(0, limit);
  return `<section class="gl-panel p-4" aria-label="${esc(title)}">
    <p class="gl-eyebrow">${icon} ${esc(title)}</p>
    <h3 class="font-display text-base font-semibold ${tone}">${esc(group.label)}</h3>
    <ol class="mt-2 space-y-2 text-sm">${items.map((x, i) => `<li class="flex gap-2"><span class="mt-0.5 shrink-0 font-semibold opacity-50">${i + 1}.</span><span class="min-w-0">${x.ref ? `${refChip(run, thumbs, x.ref)} ` : ''}${esc(x.text)}</span></li>`).join('')}</ol>
    ${group.items.length > limit ? `<p class="mt-2 text-xs opacity-60">+ อีก ${group.items.length - limit} ข้อในสรุปด้านล่าง</p>` : ''}
  </section>`;
}

function itemCard(run, thumbs, item) {
  const info = verdictInfo(verdictKey(item));
  const cover = run.covers?.[item.id] && thumbs[run.covers[item.id]];
  const sides = run.kind === 'compare' ? compareSides(run, item) : null;
  const { lead, bullets } = itemText(item);
  const name = displayTitle(run, item);
  return `<article class="gl-panel flex flex-col gap-2 p-3">
    <div class="flex items-start gap-3">
      ${cover ? `<img src="${esc(cover)}" alt="ปกของ ${esc(item.id)}" class="h-[88px] w-[70px] shrink-0 rounded-lg object-cover" loading="lazy">` : ''}
      <div class="min-w-0 flex-1">
        <p class="truncate font-mono text-xs opacity-60">${esc(item.id)}</p>
        ${name ? `<p class="font-semibold leading-snug">${esc(name)}</p>` : ''}
        <div class="mt-1 flex flex-wrap gap-1">${chip(info)}${item.disagree ? `<span class="badge badge-sm badge-ghost" title="${esc(DISAGREE_HINT)}">⚖️ ผู้ตรวจเห็นต่าง</span>` : ''}</div>
      </div>
    </div>
    ${lead ? `<p class="text-sm leading-relaxed">${esc(lead)}</p>` : ''}
    ${sides?.winner ? `<div class="rounded-lg border-l-4 border-[#2f7a55] bg-base-100 p-2.5 text-sm"><p class="text-xs font-semibold opacity-70">ตัวที่ชนะ · ${esc(sides.winner.variant)}${sides.winner.title ? ` — ${esc(sides.winner.title)}` : ''}</p>${sides.winner.text ? `<p class="mt-1 whitespace-pre-line line-clamp-6">${esc(sides.winner.text)}</p>` : ''}</div>` : ''}
    ${bullets.length || item.glossary ? `<details class="text-sm"><summary class="cursor-pointer select-none font-semibold tap-44">เหตุผล + วิธีแก้ (${bullets.length + (item.glossary ? 1 : 0)})</summary>
      <ul class="mt-2 space-y-1.5">${bullets.map((b) => { const p = bulletParts(b); return `<li class="leading-relaxed">${p.label ? `<b>${esc(p.label)}:</b> ` : ''}${esc(p.text)}</li>`; }).join('')}${item.glossary ? `<li class="leading-relaxed opacity-80"><b>คำที่ควรเปลี่ยน:</b> ${esc(item.glossary)}</li>` : ''}</ul></details>` : ''}
    ${sides?.others?.length ? `<details class="text-sm"><summary class="cursor-pointer select-none tap-44 opacity-80">ดูตัวอื่นที่เทียบ (${sides.others.length})</summary>
      <div class="mt-2 space-y-2">${sides.others.map((o) => `<div class="rounded-lg bg-base-100 p-2.5"><p class="text-xs font-semibold opacity-70">${esc(o.variant ?? o.id)}${o.title ? ` — ${esc(o.title)}` : ''}</p>${o.text ? `<p class="mt-1 whitespace-pre-line line-clamp-6">${esc(o.text)}</p>` : ''}</div>`).join('')}</div></details>` : ''}
  </article>`;
}

function itemsBlock(run, thumbs) {
  const items = allItems(run);
  const grid = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4';
  if (isFlat(run)) {
    if (!items.length) return '';
    const sorted = [...items].sort((a, b) => verdictInfo(verdictKey(a)).rank - verdictInfo(verdictKey(b)).rank);
    return `<section aria-label="รายชิ้น"><h3 class="mb-2 font-display text-lg font-semibold">รายชิ้น <span class="text-sm font-normal opacity-60">${items.length} ชิ้น · ดีสุดอยู่ซ้าย</span></h3><div class="${grid}">${sorted.map((i) => itemCard(run, thumbs, i)).join('')}</div></section>`;
  }
  return `<section class="space-y-4" aria-label="รายชิ้น"><h3 class="font-display text-lg font-semibold">รายชิ้น <span class="text-sm font-normal opacity-60">${items.length} ชิ้น</span></h3>
    ${run.sections.map((s) => `<div><h4 class="font-semibold">${esc(s.title)}</h4>${s.intro ? `<p class="mt-0.5 text-sm opacity-75">${esc(s.intro)}</p>` : ''}${s.glossary ? `<p class="mt-0.5 text-xs opacity-60"><b>คำที่ควรเปลี่ยน:</b> ${esc(s.glossary)}</p>` : ''}
      ${s.items?.length ? `<div class="mt-2 ${grid}">${s.items.map((i) => itemCard(run, thumbs, i)).join('')}</div>` : ''}</div>`).join('')}
  </section>`;
}

function scoresBlock(run) {
  const t = run.scores;
  if (!t?.rows?.length) return '';
  return `<details class="gl-panel p-4"><summary class="cursor-pointer select-none font-semibold tap-44">${esc(t.title || 'ตารางคะแนน')} <span class="text-sm font-normal opacity-60">· ยิ่งสูงยิ่งดี (เต็ม 5)</span></summary>
    <div class="mt-3 overflow-x-auto"><table class="table table-xs table-zebra"><thead><tr>${t.head.map((h) => `<th class="whitespace-nowrap">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map((row) => `<tr>${row.map((c, i) => `<td class="${i === 0 ? 'font-mono whitespace-nowrap' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

function renderDetail(run, thumbs) {
  const s = sheet(run);
  const marks = tally(run);
  const meta = run.meta ?? {};
  const facts = [
    meta.item_count ? `${meta.item_count} ชิ้น` : '',
    meta.persona_count ? `ผู้ซื้อจำลอง ${meta.persona_count} แบบ` : '',
  ].filter(Boolean);
  $('#history-detail').dataset.slug = run.slug;
  $('#history-detail').innerHTML = `
    <header>
      <div class="flex flex-wrap items-center gap-1.5 text-xs"><span class="badge badge-sm badge-outline">${esc(KIND_THAI[run.kind] ?? run.kind)}</span><span class="opacity-70">${esc(dateTh(run.ran_at))}</span>${facts.map((f) => `<span class="opacity-70">· ${esc(f)}</span>`).join('')}</div>
      <h2 class="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">${esc(run.title)}</h2>
      <p class="font-mono text-xs opacity-50">${esc(run.slug)}</p>
      ${meta.note ? `<details class="mt-2 text-sm"><summary class="cursor-pointer select-none tap-44 opacity-80">รอบนี้ทดสอบอะไร</summary><p class="mt-1 whitespace-pre-line opacity-80">${esc(meta.note)}</p></details>` : ''}
    </header>

    <section class="gl-sheet rounded-2xl p-5 sm:p-6" aria-label="คำตัดสิน">
      <p class="gl-eyebrow">คำตัดสิน</p>
      <p class="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl 3xl:text-3xl">${esc(run.headline || 'รอบนี้ไม่มีบทสรุป — ดูรายชิ้นด้านล่าง')}</p>
      ${marks.length ? `<div class="mt-4 flex flex-wrap gap-2">${marks.map((t) => `<span class="gl-tally badge badge-lg font-semibold" data-tone="${esc(t.tone)}">${esc(t.label)} <span class="ml-1 tabular-nums">${t.count}</span></span>`).join('')}</div>` : ''}
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="gl-sheet-action btn btn-sm tap-44" data-hist="copy-brief">📋 คัดลอกคำตัดสิน + สิ่งที่ต้องแก้</button>
        <button type="button" class="gl-sheet-quiet btn btn-sm tap-44" data-hist="copy-report">คัดลอกรายงานเต็ม</button>
      </div>
    </section>

    <div class="grid items-start gap-3 md:grid-cols-2 3xl:grid-cols-3">
      ${answerBlock(run, thumbs, s.pick, { icon: '✅', title: 'ใช้ตัวไหน', tone: 'gl-scale' })}
      ${answerBlock(run, thumbs, s.fix, { icon: '🛠', title: 'แก้อะไรก่อน', tone: 'gl-iterate' })}
      ${answerBlock(run, thumbs, s.leak, { icon: '⚠️', title: 'รั่ว/ขวางตรงไหน', tone: 'gl-kill' })}
      ${answerBlock(run, thumbs, s.skip, { icon: '⏸', title: 'พักไว้ก่อน', tone: 'opacity-80' })}
    </div>

    ${itemsBlock(run, thumbs)}

    ${s.rest.length ? `<details class="gl-panel p-4"><summary class="cursor-pointer select-none font-semibold tap-44">อ่านเพิ่มจากสรุป (${s.rest.length} หัวข้อ)</summary>
      <div class="mt-3 grid gap-4 md:grid-cols-2">${s.rest.map((g) => `<div><h4 class="font-semibold">${esc(g.label)}</h4><ul class="mt-1 list-disc space-y-1 pl-5 text-sm">${g.items.map((x) => `<li>${x.ref ? `<b>${esc(x.ref)}</b> — ` : ''}${esc(x.text)}</li>`).join('')}</ul></div>`).join('')}</div></details>` : ''}

    ${scoresBlock(run)}

    <details class="gl-panel p-4"><summary class="cursor-pointer select-none font-semibold tap-44">รายงานฉบับเต็ม</summary>
      <pre class="mt-3 max-h-[70vh] overflow-auto whitespace-pre-wrap font-body text-sm leading-relaxed">${esc(run.report_md)}</pre></details>

    ${(meta.notes ?? []).length || (meta.lines ?? []).length ? `<footer class="space-y-1 text-xs opacity-60">${(meta.notes ?? []).map((n) => `<p>${esc(n)}</p>`).join('')}${(meta.lines ?? []).map((n) => `<p>${esc(n)}</p>`).join('')}<p>ผู้ซื้อทั้งหมดเป็นแบบจำลอง ผลจริงจากแอด / LINE / ทีมขาย คือคำตอบสุดท้าย</p></footer>` : ''}`;
}

async function select(slug, { focus = false } = {}) {
  if (!slug) return;
  selected = slug;
  history.replaceState(null, '', `#run=${slug}`);
  renderRail();
  const seq = ++detailSeq;
  delete $('#history-detail').dataset.slug;
  $('#history-detail').innerHTML = '<p class="gl-panel p-6 text-sm opacity-70">กำลังโหลดใบตัดสิน…</p>';
  try {
    const { run, thumbs } = await loadRun(slug);
    if (seq !== detailSeq) return;
    if (!run) { $('#history-detail').innerHTML = '<p class="gl-panel p-6 text-sm">ไม่เจอรอบนี้แล้ว — กด "โหลดใหม่"</p>'; return; }
    renderDetail(run, thumbs);
    if (focus) $('#history-detail h2')?.focus?.();
  } catch (error) {
    if (seq === detailSeq) $('#history-detail').innerHTML = `<p class="gl-panel p-6 text-sm">โหลดไม่สำเร็จ: ${esc(error.message)}</p>`;
  }
}

export async function renderHistory({ force = false } = {}) {
  // ui.mjs re-renders the active view after every cloud sync (tab focus) — keep an open sheet as it is (open <details> stay open).
  if (!force && runs && selected && $('#history-detail').dataset.slug === selected) return;
  $('#history-meta').textContent = 'กำลังโหลดผลจากคลาวด์…';
  try {
    await loadList(force);
  } catch (error) {
    $('#history-meta').textContent = `โหลดไม่สำเร็จ: ${error.message}`;
    return;
  }
  if (!runs.length) {
    $('#history-meta').textContent = 'ยังไม่มีรอบรีวิว — รันสคริปต์รีวิวบนมินิ แล้วผลจะขึ้นที่นี่เอง';
    $('#history-list').innerHTML = ''; $('#history-detail').innerHTML = '';
    return;
  }
  $('#history-meta').textContent = `${runs.length} รอบ · ล่าสุด ${dateTh(runs[0].ran_at)} · รันรีวิวบนมินิแล้วผลขึ้นที่นี่เอง`;
  const wanted = hashSlug();
  const slug = runs.some((r) => r.slug === wanted) ? wanted : runs.some((r) => r.slug === selected) ? selected : runs[0].slug;
  await select(slug);
}

async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); ctx.announce(done); } catch { ctx.announce('คัดลอกไม่ได้ — เบราว์เซอร์ไม่อนุญาต'); }
}

export function initHistory(context) {
  ctx = context;
  const root = $('#view-history');
  root.addEventListener('click', (event) => {
    const run = event.target.closest('[data-hist-run]');
    if (run) { void select(run.dataset.histRun, { focus: true }); return; }
    const kind = event.target.closest('[data-hist-kind]');
    if (kind) { filter = { ...filter, kind: kind.dataset.histKind }; renderRail(); return; }
    const action = event.target.closest('[data-hist]')?.dataset.hist;
    if (action === 'refresh') { void renderHistory({ force: true }); return; }
    if (action === 'copy-brief' || action === 'copy-report') {
      void loadRun(selected).then(({ run }) => copy(action === 'copy-brief' ? fixBrief(run) : run.report_md,
        action === 'copy-brief' ? 'คัดลอกคำตัดสิน + สิ่งที่ต้องแก้แล้ว — วางให้ Codex/ทีมได้เลย' : 'คัดลอกรายงานเต็มแล้ว'));
    }
  });
  $('#history-search').addEventListener('input', (event) => { filter = { ...filter, query: event.target.value }; if (runs) renderRail(); });
  $('#history-select').addEventListener('change', (event) => { void select(event.target.value); });
}
