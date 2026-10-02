// Note Studio (2026-10-02) — ทำรูป carousel / รูปเดี่ยว สไตล์ Notes ใน Content Center
// แก้ข้อความทีละใบ → พรีวิวสดในเบราว์เซอร์ (CSS ชุดเดียวกับ render.mjs) → กด Render
// → wr_jobs render_notes → มินิทำ PNG จริง → media_assets (bucket ส่วนตัว content-media)
import { slideDoc, withFollow, sizePx, toMarkup, toEditable, type NoteSpec, type NoteSlide } from './note-render';
import { lintSlides } from './note-lint';
import { saveVisualSpec, enqueueJob, waitJob, listMedia, type Variant, type MediaAsset } from './data';

type Deps = { toast: (m: string, k?: 'success' | 'error') => void; onRendered: () => Promise<void> };

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// iframe พรีวิวเป็น sandbox (origin ทึบ) — โหลดรูปจาก URL ไม่ขึ้น จึงฝังเป็น data URL ครั้งเดียว
let avatarData = '';
const AVATAR = () => avatarData || `${location.origin}/images/pun-avatar-notes.jpg`;
async function loadAvatar() {
  if (avatarData) return;
  try {
    const blob = await (await fetch('/images/pun-avatar-notes.jpg')).blob();
    avatarData = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
  } catch { /* พรีวิวไม่มีรูปโปรไฟล์ ไม่ใช่เหตุให้พัง */ }
}
const TYPE_LABEL: Record<string, string> = { hook: 'ปก', content: 'เนื้อ', cta: 'ปิดท้าย' };

let deps: Deps;
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
    const px = s.type === 'hook' && mobile ? 108 : sizePx(s.text, mobile);
    const small = s.type !== 'hook' && mobile && px < 64;
    const hasSub = s.type === 'hook' || s.type === 'cta';
    return `<li class="rounded-xl border ${i === current ? 'border-[var(--color-brand-navy)] ring-2 ring-[var(--color-brand-navy)]/20' : 'border-base-300'} bg-base-100 p-3" data-slide="${i}">
      <div class="flex flex-wrap items-center gap-2">
        <button data-ns="select" data-i="${i}" class="font-display text-sm font-bold tap-44 px-1" aria-label="ดูพรีวิวใบที่ ${i + 1}">ใบ ${i + 1}</button>
        <select data-ns="type" data-i="${i}" class="select select-bordered select-xs" aria-label="ชนิดใบที่ ${i + 1}">
          ${['hook', 'content', 'cta'].map((t) => `<option value="${t}" ${s.type === t ? 'selected' : ''}>${TYPE_LABEL[t]}</option>`).join('')}
        </select>
        <span class="text-xs ${small ? 'text-error font-semibold' : 'opacity-60'}">${px}px</span>
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
  frame.srcdoc = slideDoc(spec, all[current], AVATAR());
  // ย่อ 1080px ให้พอดีกรอบ
  requestAnimationFrame(() => {
    const w = (frame.parentElement as HTMLElement).clientWidth;
    frame.style.width = '1080px'; frame.style.height = `${H}px`;
    frame.style.transform = `scale(${w / 1080})`; frame.style.transformOrigin = 'top left';
    (frame.parentElement as HTMLElement).style.height = `${(H * w) / 1080}px`;
  });
  const isFollow = all[current].type === 'follow';
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

async function loadRendered() {
  if (!variant) return;
  const media: MediaAsset[] = await listMedia([variant.variant_id]);
  const rendered = media.filter((m) => m.source !== 'upload');
  $('ns-rendered').innerHTML = rendered.length
    ? rendered.map((m, i) => `<a href="${esc(m.url ?? '#')}" target="_blank" rel="noopener" class="block"><img src="${esc(m.url ?? '')}" alt="รูปที่ render แล้ว ใบ ${i + 1}" loading="lazy" class="w-full aspect-[4/5] rounded-lg object-cover bg-base-200"></a>`).join('')
    : '<p class="col-span-full text-sm opacity-60">ยังไม่มีรูปที่ render</p>';
}

export async function openNoteStudio(v: Variant) {
  variant = v;
  spec = v.visual_spec ? structuredClone(v.visual_spec) : seedSpec(v);
  current = 0; dirty = !v.visual_spec;
  $('ns-title').textContent = v.working_title ?? v.variant_id;
  $('ns-id').textContent = v.variant_id;
  $('ns-dirty').textContent = dirty ? 'ร่างใหม่ — ยังไม่บันทึก' : 'บันทึกแล้ว';
  $('ns-status').textContent = '';
  await loadAvatar();
  refreshAll();
  ($('ns-dialog') as HTMLDialogElement).showModal();
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
    current = i; markDirty(); renderPreview();
    const px = list.querySelector(`[data-slide="${i}"] span.text-xs`);
    if (px && spec.slides[i].type !== 'hook') px.textContent = `${sizePx(spec.slides[i].text, spec.mobile === true)}px`;
  });
  list.addEventListener('focusin', (e) => {
    const i = Number((e.target as HTMLElement).dataset.i ?? NaN);
    if (!Number.isNaN(i) && i !== current) { current = i; renderPreview(); list.querySelectorAll('li').forEach((li, k) => li.classList.toggle('ring-2', k === i)); }
  });
  list.addEventListener('change', (e) => {
    const el = e.target as HTMLSelectElement;
    if (!spec || el.dataset.ns !== 'type') return;
    const i = Number(el.dataset.i);
    spec.slides[i].type = el.value as NoteSlide['type'];
    if (el.value === 'content') delete spec.slides[i].sub;
    markDirty(); refreshAll();
  });
  const onAction = (e: Event) => {
    const el = (e.target as HTMLElement).closest('[data-ns]') as HTMLElement | null;
    if (!el || !spec || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
    const i = Number(el.dataset.i);
    const s = spec.slides;
    switch (el.dataset.ns) {
      case 'select': case 'jump': current = i; renderList(); renderPreview(); return;
      case 'up': [s[i - 1], s[i]] = [s[i], s[i - 1]]; current = i - 1; break;
      case 'down': [s[i + 1], s[i]] = [s[i], s[i + 1]]; current = i + 1; break;
      case 'del': if (!confirm(`ลบใบ ${i + 1}?`)) return; s.splice(i, 1); current = Math.max(0, i - 1); break;
      default: return;
    }
    markDirty(); refreshAll();
  };
  list.addEventListener('click', onAction);
  $('ns-lint').addEventListener('click', onAction);
  window.addEventListener('resize', () => { if (dlg.open) renderPreview(); });
}
