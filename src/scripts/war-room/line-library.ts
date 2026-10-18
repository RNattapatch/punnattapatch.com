// แท็บ 📣 LINE (2026-10-18) — คลังรูป + ข้อความ broadcast LINE OA ที่ค้นได้จากเนื้อข้อความ
// 1 การ์ด = 1 รอบส่ง (line_rounds) · รอบของไอเดียเดียวกันวางติดกัน (V1 → V2 → สำรอง)
// คุณปันกดส่งเองใน OA Manager — หน้านี้แค่ คัดลอกข้อความ · โหลดรูป · จดว่าส่งแล้ว
import type { Idea, Variant, LineRound, LineRoundImage, LineRoundStatus } from './data';

export type LineApi = {
  listLineRounds: () => Promise<LineRound[]>;
  lineRoundImages: (assetIds: string[]) => Promise<Map<string, LineRoundImage>>;
  lineImageDownloadUrl: (path: string, filename: string) => Promise<string>;
  updateLineRound: (id: string, patch: Partial<LineRound>) => Promise<void>;
};
type Deps = {
  api: LineApi;
  data: () => { ideas: Idea[]; variants: Variant[] };
  openDrawer: (cid: string) => void;
  toast: (m: string, k?: 'success' | 'error') => void;
};
export type LineFilter = 'all' | 'todo' | 'sent' | 'alt' | 'unknown';

export const LINE_LIMIT = 500; // OA Manager: 1 bubble ≤ 500 (นับแบบ UTF-16 เหมือน broadcast.py units())
const FILTERS: [LineFilter, string][] = [['all', 'ทั้งหมด'], ['todo', 'รอส่ง'], ['sent', 'ส่งแล้ว'], ['alt', 'สำรอง'], ['unknown', 'ไม่ทราบ']];
const STATUS_LABEL: Record<LineRoundStatus, string> = { draft: 'ร่าง', ready: 'รอส่ง', sent: 'ส่งแล้ว', skipped: 'ข้าม', unknown: 'ไม่ทราบ' };

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// ---------- pure (ทดสอบผ่าน harness ได้) ----------

export const roundDate = (r: LineRound) => r.sent_at ?? r.planned_at ?? r.created_at;
export const monthKey = (iso: string) => iso.slice(0, 7);

export function inFilter(r: LineRound, f: LineFilter): boolean {
  if (f === 'all') return true;
  if (f === 'sent') return r.status === 'sent';
  if (f === 'unknown') return r.status === 'unknown';
  if (f === 'alt') return r.role === 'alternate' && r.status !== 'sent';
  return r.role === 'main' && (r.status === 'ready' || r.status === 'draft');
}

/** ค้นทั้งเนื้อข้อความ + พาดหัว + ชื่อไอเดีย + รหัสรอบ/UTM/CNT (ภาษาไทยไม่มีเว้นวรรค → substring ตรงๆ) */
export function matchRound(r: LineRound, q: string, extra = ''): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return `${r.text_body} ${r.round_code} ${r.utm_campaign ?? ''} ${r.variant_id} ${extra}`.toLowerCase().includes(s);
}

/** จัดกลุ่มตาม variant: กลุ่มใหม่สุดก่อน · ในกลุ่ม main ก่อนสำรอง แล้วเรียงรหัสรอบ */
export function orderRounds(list: LineRound[]): LineRound[] {
  const newest = new Map<string, string>();
  for (const r of list) {
    const d = roundDate(r);
    if (d > (newest.get(r.variant_id) ?? '')) newest.set(r.variant_id, d);
  }
  return [...list].sort((a, b) =>
    (newest.get(b.variant_id) ?? '').localeCompare(newest.get(a.variant_id) ?? '')
    || a.variant_id.localeCompare(b.variant_id)
    || (a.role === b.role ? 0 : a.role === 'main' ? -1 : 1)
    || a.round_code.localeCompare(b.round_code, 'en', { numeric: true }));
}

export function highlight(text: string, q: string): string {
  const s = q.trim();
  if (!s) return esc(text);
  const re = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let out = '', last = 0;
  for (const m of text.matchAll(re)) {
    out += esc(text.slice(last, m.index)) + `<mark class="rounded bg-warning/60 px-0.5">${esc(m[0])}</mark>`;
    last = m.index! + m[0].length;
  }
  return out + esc(text.slice(last));
}

// ---------- state ----------
let deps: Deps;
let rounds: LineRound[] = [];
let images = new Map<string, LineRoundImage>();
let filter: LineFilter = 'all';
let month = '';
let search = '';
let openId: string | null = null;
let editing = false;
let loaded = false;

const variantOf = (vid: string) => deps.data().variants.find((v) => v.variant_id === vid);
const ideaTitle = (vid: string) => {
  const v = variantOf(vid);
  return deps.data().ideas.find((i) => i.content_id === v?.content_id)?.title ?? '';
};
const headlineOf = (r: LineRound) => variantOf(r.variant_id)?.working_title || ideaTitle(r.variant_id) || r.variant_id;
const thDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

function visible(): LineRound[] {
  return orderRounds(rounds.filter((r) =>
    (!month || monthKey(roundDate(r)) === month)
    && matchRound(r, search, `${headlineOf(r)} ${ideaTitle(r.variant_id)}`)));
}

function statusChip(r: LineRound) {
  const tone = r.status === 'sent' ? 'badge-success' : r.status === 'ready' ? 'badge-warning' : 'badge-ghost';
  const when = r.status === 'sent' && r.sent_at ? ` ${thDate(r.sent_at)}` : '';
  return `<span class="badge badge-sm ${tone}">${STATUS_LABEL[r.status]}${when}</span>`;
}

function render() {
  const pool = visible();
  $('ln-filter').innerHTML = FILTERS.map(([k, label]) => {
    const n = pool.filter((r) => inFilter(r, k)).length, on = filter === k;
    return `<button data-ln-filter="${k}" aria-pressed="${on}" class="btn btn-xs rounded-full tap-44 ${on ? 'text-white' : 'btn-ghost border border-base-300'}" ${on ? 'style="background-color:var(--color-brand-navy);"' : ''}>${label} <span class="opacity-70">${n}</span></button>`;
  }).join('');

  const months = [...new Set(rounds.map((r) => monthKey(roundDate(r))))].sort().reverse();
  const sel = $('ln-month') as HTMLSelectElement;
  sel.innerHTML = `<option value="">ทุกเดือน</option>` + months.map((m) =>
    `<option value="${m}" ${m === month ? 'selected' : ''}>${new Date(`${m}-01T00:00:00`).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}</option>`).join('');

  const list = pool.filter((r) => inFilter(r, filter));
  const grid = $('ln-grid');
  if (!list.length) {
    grid.innerHTML = `<p class="col-span-full rounded-xl bg-base-200 p-4 text-sm opacity-70">${rounds.length ? 'ไม่เจอรอบที่ตรงกับคำค้น/ตัวกรอง' : 'ยังไม่มี broadcast ในคลัง · ให้ agent รัน broadcast.py register บนมินิ'}</p>`;
    return;
  }
  grid.innerHTML = list.map((r) => {
    const img = r.image_asset_id ? images.get(r.image_asset_id) : undefined;
    const preview = r.text_body.split('\n').filter((l) => l.trim()).slice(0, 2).join('\n');
    return `<button data-ln-open="${esc(r.round_id)}" class="group flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 text-left transition hover:border-[color:var(--color-brand-coral)] ${r.role === 'alternate' ? 'opacity-75' : ''}">
      <div class="aspect-[4/5] w-full bg-base-200">${img?.url
        ? `<img src="${esc(img.url)}" alt="รูป ${esc(r.round_code)} ${esc(headlineOf(r))}" loading="lazy" class="h-full w-full object-contain" />`
        : '<span class="flex h-full items-center justify-center text-xs opacity-50">ไม่มีรูป</span>'}</div>
      <div class="flex flex-1 flex-col gap-1 p-2">
        <div class="flex flex-wrap items-center gap-1">
          <span class="badge badge-sm font-mono text-white" style="background-color:var(--color-brand-navy);">${esc(r.round_code)}</span>
          ${r.role === 'alternate' ? '<span class="badge badge-sm badge-outline">สำรอง</span>' : ''}
          ${statusChip(r)}
        </div>
        <p class="line-clamp-2 whitespace-pre-line text-xs leading-snug">${highlight(preview, search)}</p>
        <p class="mt-auto truncate text-[11px] opacity-50">${esc(r.variant_id.replace(/-LN$/, ''))}</p>
      </div>
    </button>`;
  }).join('');
}

function renderDialog() {
  const r = rounds.find((x) => x.round_id === openId);
  if (!r) return;
  const img = r.image_asset_id ? images.get(r.image_asset_id) : undefined;
  const v = variantOf(r.variant_id);
  const n = r.text_body.length;
  $('ln-d-title').textContent = `${r.round_code}${r.role === 'alternate' ? ' (สำรอง)' : ''} · ${headlineOf(r)}`;
  const sentBlock = r.status === 'sent'
    ? `<p class="text-sm">✅ ส่งแล้ว ${r.sent_at ? new Date(r.sent_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p>
       <button data-ln-act="unsend" class="btn btn-ghost btn-xs tap-44">↩︎ ยังไม่ได้ส่ง</button>`
    : `<label class="flex flex-wrap items-center gap-2 text-sm"><span class="opacity-70">ส่งเมื่อ</span>
         <input id="ln-sent-at" type="datetime-local" class="input input-bordered input-sm" value="${localInput(new Date())}" aria-label="วันเวลาที่ส่ง" /></label>
       <div class="flex flex-wrap gap-2">
         <button data-ln-act="sent" class="btn btn-sm text-white tap-44" style="background-color:var(--color-brand-coral);">✅ ส่งแล้ว</button>
         ${r.status !== 'skipped' ? '<button data-ln-act="skip" class="btn btn-ghost btn-sm tap-44">⏭ ข้ามรอบนี้</button>' : '<button data-ln-act="unsend" class="btn btn-ghost btn-sm tap-44">↩︎ กลับมารอส่ง</button>'}
       </div>`;
  const textBlock = editing
    ? `<textarea id="ln-edit" class="textarea textarea-bordered min-h-72 w-full text-sm leading-relaxed" aria-label="แก้ข้อความ broadcast">${esc(r.text_body)}</textarea>
       <div class="flex items-center justify-between gap-2"><span id="ln-edit-count" class="text-xs">${n}/${LINE_LIMIT}</span>
         <span class="flex gap-2"><button data-ln-act="edit-cancel" class="btn btn-ghost btn-sm tap-44">ยกเลิก</button>
         <button data-ln-act="edit-save" class="btn btn-sm text-white tap-44" style="background-color:var(--color-brand-navy);">💾 บันทึก</button></span></div>`
    : `<pre id="ln-text" class="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-base-200 p-3 font-sans text-sm leading-relaxed">${highlight(r.text_body, search)}</pre>
       <div class="flex flex-wrap items-center justify-between gap-2">
         <span class="text-xs ${n > LINE_LIMIT ? 'text-error font-bold' : 'opacity-60'}">${n}/${LINE_LIMIT} ตัวอักษร${r.edited_in_app ? ' · แก้ในเว็บแล้ว' : ''}</span>
         <button data-ln-act="edit" class="btn btn-ghost btn-xs tap-44">✏️ แก้ข้อความ</button>
       </div>`;
  $('ln-d-body').innerHTML = `
    <div class="space-y-2">
      <div class="overflow-hidden rounded-xl bg-base-200">${img?.url
        ? `<img src="${esc(img.url)}" alt="รูป broadcast ${esc(r.round_code)}" class="max-h-[60vh] w-full object-contain" />`
        : '<p class="p-6 text-center text-sm opacity-60">รอบนี้ไม่มีรูป</p>'}</div>
      <div class="flex flex-wrap gap-2">
        ${img?.storage_path ? '<button data-ln-act="download" class="btn btn-sm tap-44">⬇️ โหลดรูป</button>' : ''}
        ${img?.drive_file_id ? `<a href="https://drive.google.com/file/d/${esc(img.drive_file_id)}/view" target="_blank" rel="noopener" class="btn btn-ghost btn-sm tap-44">📁 ต้นฉบับใน Drive</a>` : ''}
      </div>
    </div>
    <div class="flex min-w-0 flex-col gap-3">
      <button data-ln-act="copy" class="btn text-white tap-44" style="background-color:var(--color-brand-navy);">📋 คัดลอกข้อความ</button>
      ${textBlock}
      <div class="space-y-2 rounded-xl border border-base-300 p-3">${sentBlock}</div>
      <div class="flex flex-wrap gap-2 text-sm">
        ${r.link_url ? `<a href="${esc(r.link_url)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm tap-44">🔗 เปิดลิงก์${r.utm_campaign ? ` (${esc(r.utm_campaign)})` : ''}</a>` : ''}
        ${v ? `<button data-ln-act="idea" class="btn btn-ghost btn-sm tap-44">↗ ไปที่ไอเดีย</button>` : ''}
      </div>
      ${r.source_path ? `<p class="break-all font-mono text-[10px] opacity-50">${esc(r.source_path)}</p>` : ''}
    </div>`;
}

async function patch(r: LineRound, p: Partial<LineRound>, msg: string) {
  await deps.api.updateLineRound(r.round_id, p);
  Object.assign(r, p);
  deps.toast(msg);
  render(); renderDialog();
}

async function act(name: string) {
  const r = rounds.find((x) => x.round_id === openId);
  if (!r) return;
  if (name === 'copy') { await navigator.clipboard.writeText(r.text_body); deps.toast('คัดลอกข้อความแล้ว ไปวางใน OA Manager ได้เลย'); }
  else if (name === 'download') {
    const img = images.get(r.image_asset_id!);
    if (!img?.storage_path) return;
    const ext = img.storage_path.split('.').pop() ?? 'jpg';
    const a = document.createElement('a');
    a.href = await deps.api.lineImageDownloadUrl(img.storage_path, `${r.variant_id}-${r.round_code}.${ext}`);
    a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  } else if (name === 'sent') {
    const val = ($('ln-sent-at') as HTMLInputElement | null)?.value;
    await patch(r, { status: 'sent', sent_at: (val ? new Date(val) : new Date()).toISOString() }, `จดว่า ${r.round_code} ส่งแล้ว`);
  } else if (name === 'unsend') await patch(r, { status: 'ready', sent_at: null }, `${r.round_code} กลับมารอส่ง`);
  else if (name === 'skip') await patch(r, { status: 'skipped' }, `ข้าม ${r.round_code}`);
  else if (name === 'edit') { editing = true; renderDialog(); ($('ln-edit') as HTMLTextAreaElement).focus(); }
  else if (name === 'edit-cancel') { editing = false; renderDialog(); }
  else if (name === 'edit-save') {
    const text = ($('ln-edit') as HTMLTextAreaElement).value.trim();
    if (!text) return deps.toast('ข้อความว่างไม่ได้', 'error');
    if (text.length > LINE_LIMIT) return deps.toast(`ยาว ${text.length} เกิน ${LINE_LIMIT} ตัวอักษร (1 bubble)`, 'error');
    editing = false;
    await patch(r, { text_body: text, text_units: text.length, edited_in_app: true }, 'บันทึกข้อความแล้ว');
  } else if (name === 'idea') {
    const v = variantOf(r.variant_id);
    ($('ln-dialog') as HTMLDialogElement).close();
    if (v) deps.openDrawer(v.content_id);
  }
}

// ---------- public ----------

export async function loadLineRounds() {
  rounds = await deps.api.listLineRounds();
  images = await deps.api.lineRoundImages(rounds.map((r) => r.image_asset_id!).filter(Boolean));
  loaded = true;
  render();
  if (openId) openLineRound(openId);
}

export function openLineRound(id: string | null) {
  openId = id;
  editing = false;
  history.replaceState(null, '', id ? `#line=${encodeURIComponent(id)}` : '#line');
  if (!id || !loaded) return;
  if (!rounds.some((r) => r.round_id === id)) { deps.toast('ไม่เจอรอบนี้ในคลัง', 'error'); return; }
  renderDialog();
  const d = $('ln-dialog') as HTMLDialogElement;
  if (!d.open) d.showModal();
}

/** จากการ์ด variant -LN ในบอร์ด → แท็บ LINE กรองเฉพาะชุดนั้น */
export function showLineVariant(vid: string) {
  search = vid;
  ($('ln-search') as HTMLInputElement).value = vid;
  filter = 'all';
  if (loaded) render();
}

export function initLineView(d: Deps) {
  deps = d;
  $('wr-line-view').addEventListener('click', (e) => void (async () => {
    const el = (e.target as HTMLElement).closest('[data-ln-open],[data-ln-filter],[data-ln-act]') as HTMLElement | null;
    if (!el) return;
    try {
      if (el.dataset.lnOpen) openLineRound(el.dataset.lnOpen);
      else if (el.dataset.lnFilter) { filter = el.dataset.lnFilter as LineFilter; render(); }
      else if (el.dataset.lnAct) await act(el.dataset.lnAct);
    } catch (err) { deps.toast((err as Error).message, 'error'); }
  })());
  $('wr-line-view').addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'ln-search') { search = (t as HTMLInputElement).value; render(); }
    else if (t.id === 'ln-edit') {
      const n = (t as HTMLTextAreaElement).value.trim().length, c = $('ln-edit-count');
      c.textContent = `${n}/${LINE_LIMIT}`;
      c.className = `text-xs ${n > LINE_LIMIT ? 'text-error font-bold' : ''}`;
    }
  });
  $('ln-month').addEventListener('change', (e) => { month = (e.target as HTMLSelectElement).value; render(); });
  $('ln-refresh').addEventListener('click', () => void loadLineRounds().catch((err) => deps.toast(err.message, 'error')));
  $('ln-dialog').addEventListener('close', () => {
    if (openId) { openId = null; editing = false; if (location.hash.startsWith('#line')) history.replaceState(null, '', '#line'); }
  });
}
