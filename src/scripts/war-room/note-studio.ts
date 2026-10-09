// Note Studio (2026-10-02) — ทำรูป carousel / รูปเดี่ยว สไตล์ Notes ใน Content Center
// แก้ข้อความทีละใบ → พรีวิวสดในเบราว์เซอร์ (CSS ชุดเดียวกับ render.mjs) → กด Render
// → wr_jobs render_notes → มินิทำ PNG จริง → media_assets (bucket ส่วนตัว content-media)
import { slideDoc, withFollow, sizePx, toMarkup, toEditable, parsePos, SIZE_MIN, SIZE_MAX, ZOOM_MAX, type NoteSpec, type NoteSlide } from './note-render';
import { lintSlides } from './note-lint';
import { saveVisualSpec, enqueueJob, waitJob, listMedia, uploadStudioPhoto, downloadMediaBlob, type Variant, type MediaAsset } from './data';
import { driveButtonHtml, downloadMediaZip, zipTitle } from './media-actions';

type Deps = { toast: (m: string, k?: 'success' | 'error') => void; onRendered: () => Promise<void> };

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// iframe พรีวิวเป็น sandbox (origin ทึบ) — โหลดรูปจาก URL ไม่ขึ้น จึงฝังเป็น data URL ครั้งเดียว
let avatarData = '';
const toDataUrl = (b: Blob) => new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = bad; r.readAsDataURL(b); });
// รูปพื้นหลังของใบ photo card: storage path → data URL (โหลดครั้งเดียวต่อรูป)
const photoData = new Map<string, string>();
// โหลดไม่ได้ → วงกลมเทาแทน (เคยใช้ URL ตรงเป็นสำรอง แต่ iframe sandbox โหลด URL ไม่ได้อยู่ดี ได้แค่ไอคอนรูปแตก)
const AVATAR_FALLBACK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><circle cx=".5" cy=".5" r=".5" fill="#d9d6ce"/></svg>');
const AVATAR = () => avatarData || AVATAR_FALLBACK;
async function loadAvatar() {
  if (avatarData) return;
  try {
    const res = await fetch('/images/pun-avatar-notes.jpg');
    // ไฟล์หายบนโดเมน app → Cloudflare ตอบหน้า 404 (HTML) · ห้ามแปลง HTML เป็นรูป
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) throw new Error(`avatar ${res.status}`);
    const blob = await res.blob();
    avatarData = await toDataUrl(blob);
  } catch (e) { console.warn('Note Studio: โหลดรูปโปรไฟล์ไม่ได้', e); }
}
const TYPE_LABEL: Record<string, string> = { hook: 'ปก', content: 'เนื้อ', cta: 'ปิดท้าย', follow: 'ปิดท้าย · ปุ่มติดตาม' };

let deps: Deps;
let media: MediaAsset[] = [];   // รูปที่ใช้อยู่ของ variant (ชุด render + ที่อัปเอง) — ให้ปุ่ม .zip / Drive ใน footer
let variant: Variant | null = null;
let spec: NoteSpec | null = null;
let current = 0;
let dirty = false;
let busy = false;

/** ร่างตั้งต้นเมื่อ variant ยังไม่มีสเปก — ดึงจากข้อความ AI ถ้ามี */
function seedSpec(v: Variant): NoteSpec {
  const src = (v.ai_result || v.script_draft || '').trim();
  const single = v.format !== 'carousel';
  // ข้อความ carousel ที่ agent ลงทะเบียนไว้เป็นรูปแบบ "[1] …\n\n[2] …"
  const blocks = src.split(/^\[\d+\]\s*/m).map((b) => b.trim()).filter(Boolean);
  let slides: NoteSlide[];
  if (!single && blocks.length > 1) {
    slides = blocks.map((b, i) => {
      const [main, sub] = b.split(/\n— /);
      return { type: i === 0 ? 'hook' : i === blocks.length - 1 ? 'cta' : 'content', text: main.trim(), ...(sub ? { sub: sub.trim() } : {}) } as NoteSlide;
    }).filter((s) => !/^สวัสดีครับ ปัน/.test(s.text));
  } else {
    const lines = src.split('\n').map((l) => l.trim()).filter(Boolean);
    slides = [{ type: 'hook', text: lines.slice(0, 2).join('\n') || (v.working_title ?? 'หัวข้อ'), sub: lines.slice(2, 4).join('\n') || undefined }];
    if (!single) slides.push({ type: 'content', text: '1/ หัวข้อข้อแรก\nรายละเอียดสั้นๆ' }, { type: 'cta', text: 'เซฟไว้ใช้\nครั้งหน้านะครับ' });
  }
  return { slug: v.variant_id.toLowerCase(), skin: 'notes', group: 'note-studio', ratio: '4:5', mobile: true, follow: !single, ...(single ? { cue: '' } : {}), slides };
}

function isSingle() { return spec?.cue === '' && spec?.follow === false && spec.slides.length === 1; }

function renderList() {
  if (!spec) return;
  const mobile = spec.mobile === true;
  $('ns-slides').innerHTML = spec.slides.map((s, i) => {
    const auto = s.type === 'hook' && mobile ? 108 : sizePx(s.text, mobile);
    const px = s.size ?? auto;
    const small = s.type !== 'hook' && mobile && px < 64;
    const hasSub = s.type === 'hook' || s.type === 'cta';
    const lines = s.text.split('\n').length;
    const photo = s.type !== 'content' ? '' : s.photo
      ? `<span class="flex flex-wrap items-center gap-1">
          <span class="whitespace-nowrap opacity-60">รูป</span>
          <label class="btn btn-ghost btn-xs border border-base-300 tap-44">🔄 เปลี่ยนรูป<input type="file" accept="image/jpeg,image/png,image/webp" data-ns="photo" data-i="${i}" class="sr-only"></label>
          <button data-ns="photo-del" data-i="${i}" class="btn btn-ghost btn-xs tap-44" aria-label="เอารูปพื้นหลังใบที่ ${i + 1} ออก">✕ เอารูปออก</button>
        </span>`
      : `<label class="btn btn-ghost btn-xs border border-dashed border-base-300 tap-44">📷 ใส่รูปพื้นหลัง (แบบการ์ดลอย)<input type="file" accept="image/jpeg,image/png,image/webp" data-ns="photo" data-i="${i}" class="sr-only"></label>`;
    // แถบจัดรูป (2026-10-09): ใบ 4:5 กับรูปแนวนอน/จัตุรัส ไม่มีที่ให้เลื่อนแนวตั้ง — "ชิดบน/กลาง/ล่าง" แบบเดิมจึงไม่ขยับ
    // → ซูม + จุดโฟกัส x/y (ซูมรอบจุดนั้น) ใช้ได้ทุกสัดส่วนรูป
    const [fx, fy] = s.photo ? parsePos(s.photo.pos) : [50, 0];
    const zoomPct = Math.round((s.photo?.zoom ?? 1) * 100);
    const slider = (ns: string, label: string, val: number, min: number, max: number, unit: string, aria: string) =>
      `<label class="flex min-w-0 items-center gap-2"><span class="w-16 shrink-0 whitespace-nowrap opacity-60">${label}</span>
        <input data-ns="${ns}" data-i="${i}" type="range" min="${min}" max="${max}" step="${ns === 'zoom' ? 5 : 1}" value="${val}" class="range range-xs min-w-0 flex-1" aria-label="${aria} ใบที่ ${i + 1}">
        <output data-out="${ns}" class="w-12 shrink-0 text-right tabular-nums opacity-70">${val}${unit}</output></label>`;
    const adjust = s.photo ? `<div class="mt-2 grid gap-1 rounded-lg bg-base-200/60 px-3 py-2 text-xs sm:grid-cols-3 sm:gap-3">
        ${slider('zoom', 'ซูม', zoomPct, 100, ZOOM_MAX * 100, '%', 'ซูมรูปพื้นหลัง')}
        ${slider('fx', 'ซ้าย ↔ ขวา', fx, 0, 100, '%', 'เลื่อนรูปซ้ายขวา')}
        ${slider('fy', 'บน ↕ ล่าง', fy, 0, 100, '%', 'เลื่อนรูปขึ้นลง')}
        <p class="opacity-60 sm:col-span-3">รูปแนวนอน/จัตุรัส: ซูมก่อน แล้วค่อยเลื่อนบน↕ล่าง (ซูม 100% รูปเต็มความสูงใบพอดี ไม่มีที่ให้เลื่อนขึ้นลง)</p>
      </div>` : '';
    const warn = s.photo && !s.photo.path ? 'รูปนี้มาจากไฟล์ในเครื่อง — กด 🔄 เปลี่ยนรูป เพื่ออัปโหลดก่อน Render'
      : s.photo && lines > 4 ? `ใบรูปควรมีข้อความ ≤4 บรรทัด (ตอนนี้ ${lines}) ไม่งั้นการ์ดสูงจนทับหน้าคนในรูป` : '';
    return `<li class="rounded-xl border ${i === current ? 'border-[var(--color-brand-navy)] ring-2 ring-[var(--color-brand-navy)]/20' : 'border-base-300'} bg-base-100 p-3" data-slide="${i}">
      <div class="flex flex-wrap items-center gap-2">
        <button data-ns="select" data-i="${i}" class="font-display text-sm font-bold tap-44 px-1" aria-label="ดูพรีวิวใบที่ ${i + 1}">ใบ ${i + 1}</button>
        <select data-ns="type" data-i="${i}" class="select select-bordered select-xs" aria-label="ชนิดใบที่ ${i + 1}">
          ${['hook', 'content', 'cta', 'follow'].map((t) => `<option value="${t}" ${s.type === t ? 'selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}
        </select>
        <span data-px class="text-xs ${small ? 'text-error font-semibold' : 'opacity-60'}">${px}px</span>
        <span class="ml-auto flex gap-1">
          <button data-ns="up" data-i="${i}" class="btn btn-ghost btn-xs tap-44" aria-label="เลื่อนใบ ${i + 1} ขึ้น" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button data-ns="down" data-i="${i}" class="btn btn-ghost btn-xs tap-44" aria-label="เลื่อนใบ ${i + 1} ลง" ${i === spec!.slides.length - 1 ? 'disabled' : ''}>▼</button>
          <button data-ns="del" data-i="${i}" class="btn btn-ghost btn-xs tap-44" aria-label="ลบใบ ${i + 1}" ${spec!.slides.length === 1 ? 'disabled' : ''}>✕</button>
        </span>
      </div>
      <label class="mt-2 block">
        <span class="sr-only">ข้อความหลักใบที่ ${i + 1}</span>
        <textarea data-ns="text" data-i="${i}" rows="${Math.max(2, s.text.split('\n').length)}" class="textarea textarea-bordered w-full text-base leading-relaxed">${esc(toEditable(s.text))}</textarea>
      </label>
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <label class="flex items-center gap-1"><span class="whitespace-nowrap opacity-60">ขนาดตัวอักษร</span>
          <input data-ns="size" data-i="${i}" type="number" inputmode="numeric" min="${SIZE_MIN}" max="${SIZE_MAX}" step="2" value="${s.size ?? ''}" placeholder="${auto}" class="input input-bordered input-xs w-20" aria-label="ขนาดตัวอักษรใบที่ ${i + 1} (px · เว้นว่าง = อัตโนมัติ ${auto}px)"><span class="whitespace-nowrap opacity-60">px${s.size ? '' : ' (อัตโนมัติ)'}</span></label>
        ${photo}
      </div>
      ${adjust}
      ${warn ? `<p class="mt-1 text-xs text-error">${warn}</p>` : ''}
      ${hasSub ? `<label class="mt-2 block"><span class="text-xs opacity-60">${s.type === 'hook' ? 'บรรทัดรอง (ใต้หัว)' : 'บรรทัดเล็กด้านล่าง'}</span>
        <textarea data-ns="sub" data-i="${i}" rows="2" class="textarea textarea-bordered textarea-sm w-full">${esc(toEditable(s.sub ?? ''))}</textarea></label>` : ''}
    </li>`;
  }).join('');
}

function renderPreview() {
  if (!spec) return;
  const all = withFollow(spec);
  current = Math.min(current, all.length - 1);
  const frame = $('ns-frame') as HTMLIFrameElement;
  const H = spec.ratio === '1:1' ? 1080 : 1350;
  frame.style.aspectRatio = `1080 / ${H}`;
  const ph = all[current].photo?.path;
  frame.srcdoc = slideDoc(spec, all[current], AVATAR(), ph ? photoData.get(ph) ?? '' : '');
  // ย่อ 1080px ให้พอดีกรอบ
  requestAnimationFrame(() => {
    const w = (frame.parentElement as HTMLElement).clientWidth;
    frame.style.width = '1080px'; frame.style.height = `${H}px`;
    frame.style.transform = `scale(${w / 1080})`; frame.style.transformOrigin = 'top left';
    (frame.parentElement as HTMLElement).style.height = `${(H * w) / 1080}px`;
  });
  const isFollow = current >= spec.slides.length;   // เฉพาะหน้า Follow ที่ต่อท้ายให้เอง · ใบติดตามที่เขียนเองแก้ได้ตามปกติ
  $('ns-pos').textContent = `ใบ ${current + 1} / ${all.length}${isFollow ? ' · หน้า Follow (ใส่ให้อัตโนมัติ)' : ''}`;
  ($('ns-prev') as HTMLButtonElement).disabled = current === 0;
  ($('ns-next') as HTMLButtonElement).disabled = current >= all.length - 1;
  const warns = lintSlides(spec.slides, spec.mobile === true);
  $('ns-lint').innerHTML = warns.length
    ? warns.map((w) => `<li><button data-ns="jump" data-i="${Math.max(0, w.slide - 1)}" class="text-left text-sm ${w.level === 'red' ? 'text-error' : ''}">${w.level === 'red' ? '🔴' : '🟡'} ${w.slide ? `ใบ ${w.slide}: ` : ''}${esc(w.msg)}</button></li>`).join('')
    : '<li class="text-sm text-success">✓ ไม่เจอกลิ่น AI ตามกฎพื้นฐาน</li>';
}

function syncControls() {
  if (!spec) return;
  ($('ns-mode') as HTMLSelectElement).value = isSingle() ? 'single' : 'carousel';
  ($('ns-ratio') as HTMLSelectElement).value = spec.ratio ?? '4:5';
  ($('ns-follow') as HTMLInputElement).checked = spec.follow !== false;
  ($('ns-follow') as HTMLInputElement).disabled = isSingle();
}

function refreshAll() { renderList(); renderPreview(); syncControls(); }
function markDirty() { dirty = true; $('ns-dirty').textContent = 'ยังไม่บันทึก'; }

/** โหลดรูปพื้นหลังที่ยังไม่มีใน cache (เปิดชิ้นที่บันทึกไว้แล้ว) */
async function ensurePhotos() {
  const paths = [...new Set((spec?.slides ?? []).map((s) => s.photo?.path).filter((p): p is string => !!p && !photoData.has(p)))];
  for (const p of paths) {
    try { photoData.set(p, await toDataUrl(await downloadMediaBlob(p))); renderPreview(); }
    catch (e) { deps.toast((e as Error).message, 'error'); }
  }
}

async function attachPhoto(i: number, f: File) {
  if (!variant || !spec) return;
  $('ns-status').textContent = 'กำลังอัปโหลดรูป…';
  try {
    const path = await uploadStudioPhoto(variant, f);
    photoData.set(path, await toDataUrl(f));
    spec.slides[i].photo = { path, pos: '50% 0%' };   // รูปใหม่ = เริ่มจากไม่ซูม โฟกัสกลางบน
    current = i; markDirty(); refreshAll();
    $('ns-status').textContent = '✓ ใส่รูปแล้ว — กดบันทึก/Render ได้เลย';
  } catch (e) {
    $('ns-status').textContent = `⚠️ ${(e as Error).message}`;
    deps.toast((e as Error).message, 'error');
  }
}

async function loadRendered() {
  if (!variant) return;
  const vid = variant.variant_id;
  const rows = await listMedia([vid]);
  if (variant?.variant_id !== vid) return;   // ปิดแล้วเปิดชิ้นอื่นระหว่างโหลด — อย่าเอารูปชิ้นเก่ามาทับ
  media = rows;
  const rendered = media.filter((m) => m.source !== 'upload');
  const zip = $('ns-zip') as HTMLButtonElement;
  zip.disabled = !media.length;
  zip.title = zipTitle(media); zip.setAttribute('aria-label', zip.title);
  $('ns-drive').innerHTML = driveButtonHtml(variant.variant_id, media);
  $('ns-rendered').innerHTML = rendered.length
    ? rendered.map((m, i) => `<a href="${esc(m.url ?? '#')}" target="_blank" rel="noopener" class="block"><img src="${esc(m.url ?? '')}" alt="รูปที่ render แล้ว ใบ ${i + 1}" loading="lazy" class="w-full aspect-[4/5] rounded-lg object-cover bg-base-200"></a>`).join('')
    : '<p class="col-span-full text-sm opacity-60">ยังไม่มีรูปที่ render</p>';
}

export async function openNoteStudio(v: Variant) {
  variant = v;
  spec = v.visual_spec ? structuredClone(v.visual_spec) : seedSpec(v);
  current = 0; dirty = !v.visual_spec;
  // ไม่โชว์รูป/ปุ่มของชิ้นก่อนระหว่างโหลด
  media = []; ($('ns-zip') as HTMLButtonElement).disabled = true; $('ns-drive').innerHTML = '';
  $('ns-rendered').innerHTML = '<p class="col-span-full text-sm opacity-60">กำลังโหลด…</p>';
  $('ns-title').textContent = v.working_title ?? v.variant_id;
  $('ns-id').textContent = v.variant_id;
  $('ns-dirty').textContent = dirty ? 'ร่างใหม่ — ยังไม่บันทึก' : 'บันทึกแล้ว';
  $('ns-status').textContent = '';
  await loadAvatar();
  refreshAll();
  ($('ns-dialog') as HTMLDialogElement).showModal();
  void ensurePhotos();
  await loadRendered();
}

async function save(silent = false) {
  if (!variant || !spec) return;
  await saveVisualSpec(variant.variant_id, spec);
  variant.visual_spec = structuredClone(spec);
  dirty = false; $('ns-dirty').textContent = 'บันทึกแล้ว';
  if (!silent) deps.toast('บันทึกสไลด์แล้ว');
}

async function render() {
  if (!variant || !spec || busy) return;
  const reds = lintSlides(spec.slides, spec.mobile === true).filter((w) => w.level === 'red');
  if (reds.length && !confirm(`ยังมีจุดแดง ${reds.length} จุด (กลิ่น AI/คำต้องห้าม) — render ต่อเลยไหม?`)) return;
  busy = true;
  const btn = $('ns-render') as HTMLButtonElement;
  btn.disabled = true;
  try {
    await save(true);
    const id = await enqueueJob('render_notes', { variant_id: variant.variant_id });
    $('ns-status').textContent = 'ส่งให้ Mac mini แล้ว…';
    const job = await waitJob(id, { intervalMs: 4000, onTick: (s) => { $('ns-status').textContent = `Mac mini กำลังทำรูป… ${s} วิ`; } });
    const n = (job.result as { count?: number } | null)?.count ?? 0;
    $('ns-status').textContent = `✓ ได้รูป ${n} ใบ — อยู่ในชิ้นงานนี้แล้ว`;
    deps.toast(`Render เสร็จ ${n} ใบ`);
    await loadRendered();
    await deps.onRendered();
  } catch (e) {
    $('ns-status').textContent = `⚠️ ${(e as Error).message}`;
    deps.toast((e as Error).message, 'error');
  } finally { busy = false; btn.disabled = false; }
}

function close() {
  if (dirty && !confirm('ยังไม่ได้บันทึก — ปิดเลยไหม? (ที่แก้จะหาย)')) return;
  ($('ns-dialog') as HTMLDialogElement).close();
}

export function initNoteStudio(d: Deps) {
  deps = d;
  const dlg = $('ns-dialog') as HTMLDialogElement;
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  $('ns-close').addEventListener('click', close);
  $('ns-save').addEventListener('click', () => void save().catch((e) => deps.toast(e.message, 'error')));
  $('ns-render').addEventListener('click', () => void render());
  $('ns-zip').addEventListener('click', () => {
    if (variant) void downloadMediaZip(variant.variant_id, media, deps.toast).catch((e) => deps.toast((e as Error).message, 'error'));
  });
  $('ns-prev').addEventListener('click', () => { current--; renderList(); renderPreview(); });
  $('ns-next').addEventListener('click', () => { current++; renderList(); renderPreview(); });
  $('ns-add').addEventListener('click', () => {
    if (!spec) return;
    const at = spec.slides.findIndex((s) => s.type === 'cta');
    const idx = at === -1 ? spec.slides.length : at;
    spec.slides.splice(idx, 0, { type: 'content', text: `${idx}/ หัวข้อ\nรายละเอียด` });
    current = idx; markDirty(); refreshAll();
  });
  $('ns-mode').addEventListener('change', (e) => {
    if (!spec) return;
    if ((e.target as HTMLSelectElement).value === 'single') {
      if (spec.slides.length > 1 && !confirm('รูปเดี่ยวใช้แค่ใบแรก — ใบอื่นจะถูกตัดออก ทำต่อไหม?')) { syncControls(); return; }
      spec.slides = [{ ...spec.slides[0], type: 'hook' }]; spec.follow = false; spec.cue = '';
    } else {
      delete spec.cue; spec.follow = true;
      if (spec.slides.length === 1) spec.slides.push({ type: 'content', text: '1/ หัวข้อ\nรายละเอียด' }, { type: 'cta', text: 'เซฟไว้ใช้\nครั้งหน้านะครับ' });
    }
    current = 0; markDirty(); refreshAll();
  });
  $('ns-ratio').addEventListener('change', (e) => { if (spec) { spec.ratio = (e.target as HTMLSelectElement).value as '4:5' | '1:1'; markDirty(); renderPreview(); } });
  $('ns-follow').addEventListener('change', (e) => { if (spec) { spec.follow = (e.target as HTMLInputElement).checked; markDirty(); renderPreview(); } });

  const list = $('ns-slides');
  list.addEventListener('input', (e) => {
    const el = e.target as HTMLTextAreaElement;
    if (!spec || !el.dataset.ns) return;
    const i = Number(el.dataset.i);
    if (el.dataset.ns === 'text') spec.slides[i].text = toMarkup(el.value);
    if (el.dataset.ns === 'sub') { const v = el.value.trim(); if (v) spec.slides[i].sub = toMarkup(el.value); else delete spec.slides[i].sub; }
    if (el.dataset.ns === 'size') {
      const n = Number(el.value);
      if (el.value === '') delete spec.slides[i].size;
      else if (Number.isInteger(n) && n >= SIZE_MIN && n <= SIZE_MAX) spec.slides[i].size = n;
      else return;   // ยังพิมพ์ไม่จบ (เช่น "7") — รอค่าที่ใช้ได้
    }
    if (['zoom', 'fx', 'fy'].includes(el.dataset.ns) && spec.slides[i].photo) {
      const ph = spec.slides[i].photo!;
      const v = Number(el.value);
      if (el.dataset.ns === 'zoom') { if (v > 100) ph.zoom = v / 100; else delete ph.zoom; }
      else { const [x, y] = parsePos(ph.pos); ph.pos = el.dataset.ns === 'fx' ? `${v}% ${y}%` : `${x}% ${v}%`; }
      const out = list.querySelector(`[data-slide="${i}"] [data-out="${el.dataset.ns}"]`);
      if (out) out.textContent = `${v}%`;
      current = i; markDirty(); renderPreview();
      return;
    }
    if (el.dataset.ns !== 'text' && el.dataset.ns !== 'sub' && el.dataset.ns !== 'size') return;
    current = i; markDirty(); renderPreview();
    const s = spec.slides[i];
    const px = list.querySelector(`[data-slide="${i}"] [data-px]`);
    if (px && (s.size || s.type !== 'hook')) px.textContent = `${s.size ?? sizePx(s.text, spec.mobile === true)}px`;
  });
  list.addEventListener('focusin', (e) => {
    const i = Number((e.target as HTMLElement).dataset.i ?? NaN);
    if (!Number.isNaN(i) && i !== current) { current = i; renderPreview(); list.querySelectorAll('li').forEach((li, k) => li.classList.toggle('ring-2', k === i)); }
  });
  list.addEventListener('change', (e) => {
    const el = e.target as HTMLSelectElement & HTMLInputElement;
    if (!spec || !el.dataset.ns) return;
    const i = Number(el.dataset.i);
    const s = spec.slides[i];
    switch (el.dataset.ns) {
      case 'type':
        s.type = el.value as NoteSlide['type'];
        if (el.value === 'content') delete s.sub;
        else delete s.photo;   // photo card มีเฉพาะใบเนื้อ
        break;
      // size: เก็บค่าตอน input แล้ว · ห้ามวาดรายการใหม่ตอน change (blur) — คลิกช่องข้อความต่อแล้วโฟกัสหลุด พิมพ์หาย
      case 'photo': { const f = el.files?.[0]; if (f) void attachPhoto(i, f); return; }
      default: return;
    }
    current = i; markDirty(); refreshAll();
  });
  const onAction = (e: Event) => {
    const el = (e.target as HTMLElement).closest('[data-ns]') as HTMLElement | null;
    if (!el || !spec || ['TEXTAREA', 'SELECT', 'INPUT'].includes(el.tagName)) return;
    const i = Number(el.dataset.i);
    const s = spec.slides;
    switch (el.dataset.ns) {
      case 'select': case 'jump': current = i; renderList(); renderPreview(); return;
      case 'up': [s[i - 1], s[i]] = [s[i], s[i - 1]]; current = i - 1; break;
      case 'down': [s[i + 1], s[i]] = [s[i], s[i + 1]]; current = i + 1; break;
      case 'del': if (!confirm(`ลบใบ ${i + 1}?`)) return; s.splice(i, 1); current = Math.max(0, i - 1); break;
      case 'photo-del': delete s[i].photo; current = i; break;
      default: return;
    }
    markDirty(); refreshAll();
  };
  list.addEventListener('click', onAction);
  $('ns-lint').addEventListener('click', onAction);
  window.addEventListener('resize', () => { if (dlg.open) renderPreview(); });
}
