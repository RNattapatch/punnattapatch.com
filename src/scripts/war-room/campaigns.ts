// แท็บแคมเปญ (2026-10-02) — "มุมลูกค้า / มุมผลิต"
// แคมเปญ = เส้นทาง N จุดที่ลูกค้าหนึ่งคนจะเจอคุณในสัปดาห์ · ช่องว่าง = วันที่เขาไม่เห็นคุณ
import {
  PILLAR_V14_LABEL, type PillarV14, type Idea, type Variant, type Publication,
  type Campaign, type CampaignItem, type MediaAsset,
} from './data';

export type CampaignApi = {
  listCampaigns: () => Promise<Campaign[]>;
  listCampaignItems: () => Promise<CampaignItem[]>;
  updateCampaignItem: (id: string, patch: Partial<CampaignItem>) => Promise<void>;
  addCampaignItems: (rows: Partial<CampaignItem>[]) => Promise<void>;
  deleteCampaignItem: (id: string) => Promise<void>;
  createCampaign: (c: { name: string; goal: string; start_date: string | null; end_date: string | null; value: number; me: number }) => Promise<string>;
  updateIdea: (cid: string, patch: Partial<Idea>) => Promise<void>;
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>;
  listMedia: (variantIds: string[]) => Promise<MediaAsset[]>;
};
type Deps = {
  api: CampaignApi;
  data: () => { ideas: Idea[]; variants: Variant[]; pubs: Publication[] };
  openDrawer: (cid: string) => void;
  toast: (m: string, k?: 'success' | 'error') => void;
};

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const STATUS: Record<string, [string, string]> = {
  idea: ['ไอเดีย', 'badge-ghost'], planning: ['วางแผน', 'badge-outline'], producing: ['กำลังผลิต', 'badge-secondary'],
  live: ['กำลังยิง', 'badge-success'], paused: ['พัก', 'badge-warning'], done: ['จบแล้ว', 'badge-ghost'],
};
const AD: Record<string, string> = { none: 'ยังไม่ตั้ง', ready: 'พร้อมตั้ง', live: 'กำลังยิง', paused: 'พัก' };
const FORMAT: Record<string, string> = { reel: 'Reel', carousel: 'Carousel', article: 'Post', line_broadcast: 'LINE' };
const AFTER_SHOOT = ['recorded', 'editing', 'edited', 'scheduled', 'posted', 'analyzed', 'repurposed'];

let deps: Deps;
let campaigns: Campaign[] = [];
let items: CampaignItem[] = [];
let cover = new Map<string, string>(); // variant_id → url ปก
let mediaCount = new Map<string, number>();
let openId: string | null = null;
let loaded = false;
let lens: 'customer' | 'factory' = 'customer';
let pickFor: { slot: CampaignItem | null } | null = null;
let pickFilter: 'all' | PillarV14 = 'all';

type Ready = { w: boolean; i: boolean; o: boolean; a: boolean };
function readiness(it: CampaignItem): Ready {
  const { variants, pubs } = deps.data();
  const v = variants.find((x) => x.variant_id === it.variant_id);
  if (!v) return { w: false, i: false, o: false, a: false };
  const reel = v.format === 'reel';
  return {
    w: reel ? AFTER_SHOOT.includes(v.variant_status) || !!(v.script_draft || v.ai_result) : !!(v.script_draft || v.ai_result || v.visual_spec),
    i: reel ? AFTER_SHOOT.includes(v.variant_status) : (mediaCount.get(v.variant_id) ?? 0) > 0,
    o: pubs.some((p) => p.variant_id === v.variant_id),
    a: it.ad_status === 'live',
  };
}
function nextStep(it: CampaignItem, r: Ready): string {
  const v = deps.data().variants.find((x) => x.variant_id === it.variant_id);
  if (!v) return it.role === 'me' ? 'เลือก ME จาก IG' : 'เลือกชิ้นงาน';
  if (!r.w) return 'เขียน/เกลาข้อความ';
  if (!r.i) return v.format === 'reel' ? 'อัด/ตัดคลิป' : 'ทำรูปใน Note Studio';
  if (!r.o) return 'โพสต์ organic แล้วบันทึกลิงก์';
  if (!r.a) return it.ad_status === 'ready' ? 'ตั้งแอดใน Ads Manager' : 'ตั้งสถานะแอด';
  return 'ครบ ✓';
}
const dots = (r: Ready) => {
  const lab = ['เขียน', 'รูป/คลิป', 'organic', 'แอด'];
  return `<span class="flex gap-1" role="img" aria-label="${[r.w, r.i, r.o, r.a].map((v, k) => `${lab[k]} ${v ? 'เสร็จ' : 'ยัง'}`).join(' · ')}">${[r.w, r.i, r.o, r.a]
    .map((v, k) => `<span title="${lab[k]}" class="size-2.5 rounded-full ${v ? 'bg-success' : 'bg-base-300'}"></span>`).join('')}</span>`;
};
const ideaOf = (cid: string | null) => deps.data().ideas.find((i) => i.content_id === cid);
const variantOf = (vid: string | null) => deps.data().variants.find((v) => v.variant_id === vid);
const slotsOf = (cid: string) => items.filter((i) => i.campaign_id === cid && i.slot_code).sort((a, b) => a.week - b.week || a.sort - b.sort);
const benchOf = (cid: string) => items.filter((i) => i.campaign_id === cid && !i.slot_code).sort((a, b) => a.sort - b.sort);
const isReady = (it: CampaignItem) => { const r = readiness(it); return !!it.variant_id && r.w && r.i; };

export async function loadCampaigns() {
  [campaigns, items] = await Promise.all([deps.api.listCampaigns(), deps.api.listCampaignItems()]);
  loaded = true;
  const vids = [...new Set(items.map((i) => i.variant_id).filter(Boolean) as string[])];
  const media = vids.length ? await deps.api.listMedia(vids) : [];
  cover = new Map(); mediaCount = new Map();
  for (const m of media) {
    if (!m.variant_id) continue;
    mediaCount.set(m.variant_id, (mediaCount.get(m.variant_id) ?? 0) + 1);
    if (!cover.has(m.variant_id) && m.url) cover.set(m.variant_id, m.url);
  }
  render();
}

function render() {
  if (openId && campaigns.some((c) => c.campaign_id === openId)) renderDetail(); else renderCards();
}

function renderCards() {
  if (loaded) openId = null; // ยังไม่โหลด = อย่าลืมแคมเปญที่ขอเปิดจาก deep link
  $('cp-list-wrap').classList.remove('hidden'); $('cp-detail').classList.add('hidden');
  if (!campaigns.length) {
    $('cp-cards').innerHTML = '<div class="col-span-full rounded-2xl border border-dashed border-base-300 p-8 text-center"><p class="font-semibold">ยังไม่มีแคมเปญ</p><p class="mt-1 text-sm opacity-70">กด "+ แคมเปญใหม่" — ใส่แค่ชื่อกับจำนวนจุดต่อสัปดาห์ก็เริ่มได้</p></div>';
    return;
  }
  $('cp-cards').innerHTML = campaigns.map((c) => {
    const slots = slotsOf(c.campaign_id);
    const ready = slots.filter(isReady).length;
    const emptyMe = slots.filter((s) => s.role === 'me' && !s.variant_id).length;
    const empty = slots.filter((s) => !s.variant_id).length;
    const [lbl, cls] = STATUS[c.status] ?? [c.status, 'badge-ghost'];
    const dates = [c.start_date, c.end_date].filter(Boolean).map((d) => new Date(d!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })).join('–');
    return `<button data-cp-open="${esc(c.campaign_id)}" class="group rounded-2xl bg-base-200 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-3 focus-visible:outline-[var(--color-brand-navy)] active:scale-[.99] motion-reduce:transition-none">
      <div class="flex items-center justify-between gap-2"><span class="badge ${cls}">${lbl}</span><span class="text-sm opacity-70">${esc(dates)}</span></div>
      <h3 class="mt-3 font-display text-lg font-bold">${esc(c.name)}</h3>
      ${c.goal ? `<p class="mt-0.5 line-clamp-2 text-sm opacity-80">${esc(c.goal)}</p>` : ''}
      <div class="mt-4 flex gap-1.5" aria-hidden="true">${slots.map((s) => `<span class="h-2 flex-1 rounded-full ${!s.variant_id ? 'bg-base-300' : isReady(s) ? 'bg-success' : 'bg-warning'}"></span>`).join('')}</div>
      <p class="mt-2 text-sm"><b>${ready}/${slots.length}</b> จุดพร้อม${emptyMe ? ` · <span class="font-semibold" style="color:var(--color-brand-coral)">ขาด ME ${emptyMe} ช่อง</span>` : empty ? ` · ว่าง ${empty} ช่อง` : ''}</p>
    </button>`;
  }).join('');
}

function renderDetail() {
  const c = campaigns.find((x) => x.campaign_id === openId)!;
  $('cp-list-wrap').classList.add('hidden'); $('cp-detail').classList.remove('hidden');
  const slots = slotsOf(c.campaign_id);
  const ready = slots.filter(isReady).length;
  const [lbl, cls] = STATUS[c.status] ?? [c.status, 'badge-ghost'];
  $('cp-head').innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <label class="sr-only" for="cp-status">สถานะแคมเปญ</label>
          <select id="cp-status" class="select select-bordered select-xs w-auto" aria-label="สถานะแคมเปญ">${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${k === c.status ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <span class="badge ${cls} hidden sm:inline-flex">${lbl}</span>
          <span class="badge badge-outline">${c.touch_per_week} จุด/สัปดาห์</span>
          ${c.start_date ? `<span class="badge badge-outline">${esc(c.start_date)} → ${esc(c.end_date ?? '…')}</span>` : ''}
        </div>
        <h2 class="font-display text-2xl font-bold">${esc(c.name)}</h2>
        ${c.goal ? `<p class="mt-1 opacity-80">${esc(c.goal)}</p>` : ''}
        ${c.audience ? `<p class="mt-1 text-sm opacity-70">กลุ่ม: ${esc(c.audience)}</p>` : ''}
      </div>
      <dl class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-base-100 px-3 py-2"><dt class="text-xs opacity-70">พร้อม</dt><dd class="text-2xl font-bold">${ready}/${slots.length}</dd></div>
        <div class="rounded-xl bg-base-100 px-3 py-2"><dt class="text-xs opacity-70">วัดผลด้วย</dt><dd class="mt-1 text-sm font-semibold">${esc(c.kpi_label ?? '—')}</dd></div>
        <div class="rounded-xl bg-base-100 px-3 py-2"><dt class="text-xs opacity-70">งบ</dt><dd class="mt-1 text-sm font-semibold">${esc(c.budget_note ?? '—')}</dd></div>
      </dl>
    </div>
    <div class="mt-3 flex flex-wrap gap-2 text-xs">
      ${c.brief_md_path ? `<button data-cp-copy="${esc(c.brief_md_path)}" class="btn btn-ghost btn-xs tap-44">📝 บรีฟ: ${esc(c.brief_md_path.split('/').pop())}</button>` : ''}
      ${c.drive_folder ? `<button data-cp-copy="${esc(c.drive_folder)}" class="btn btn-ghost btn-xs tap-44">📁 ${esc(c.drive_folder)}</button>` : ''}
      <a class="btn btn-ghost btn-xs tap-44" href="https://adsmanager.facebook.com/adsmanager/manage/campaigns" target="_blank" rel="noopener">📊 Ads Manager</a>
    </div>`;
  ($('cp-status') as HTMLSelectElement).onchange = async (e) => {
    await deps.api.updateCampaign(c.campaign_id, { status: (e.target as HTMLSelectElement).value as Campaign['status'] });
    deps.toast('อัปเดตสถานะแล้ว'); await loadCampaigns();
  };

  // ---- มุมลูกค้า: ราง N จุด
  $('cp-track').innerHTML = slots.map((s, idx) => {
    const v = variantOf(s.variant_id);
    const idea = ideaOf(s.content_id);
    const me = s.role === 'me';
    const pill = me ? 'background-color:var(--color-brand-coral);color:#fff' : 'background-color:var(--color-brand-navy);color:#fff';
    const head = `<div class="flex w-14 shrink-0 flex-col items-center sm:w-auto"><span class="z-10 grid size-11 place-items-center rounded-full text-sm font-bold ring-4 ring-base-100" style="${pill}">${esc(s.slot_code)}</span><span class="mt-1 text-xs opacity-70">${DAYS[idx % 7]}</span></div>`;
    if (!v) {
      return `<li class="flex items-start gap-3 sm:block">${head}<button data-cp-pick="${esc(s.id)}" class="grid min-h-20 w-full flex-1 sm:mt-2 sm:aspect-[4/5] place-items-center rounded-2xl border-2 border-dashed p-3 text-center transition hover:bg-base-200 focus-visible:outline-3" style="border-color:${me ? 'var(--color-brand-coral)' : 'var(--color-base-300)'}">
        <span><span class="block text-2xl" style="color:var(--color-brand-coral)">+</span><span class="text-xs">${esc(s.note ?? (me ? 'เลือก ME' : 'เลือกชิ้นงาน'))}</span></span></button></li>`;
    }
    const r = readiness(s);
    const img = cover.get(v.variant_id);
    const pv = idea?.pillar_v14;
    return `<li class="flex items-start gap-3 sm:block">${head}<div class="min-w-0 flex-1 rounded-2xl bg-base-200 p-2 sm:mt-2">
      <button data-cp-drawer="${esc(v.content_id)}" class="flex w-full gap-3 text-left focus-visible:outline-3 sm:block" aria-label="เปิด ${esc(idea?.title ?? v.variant_id)}">
        <div class="grid aspect-[4/5] w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-base-300 text-center text-xs sm:w-full sm:text-sm">${img ? `<img src="${esc(img)}" alt="" loading="lazy" class="h-full w-full object-cover" />` : `<span class="opacity-70">${v.format === 'reel' ? '▶ Reel' : 'ยังไม่มีรูป'}</span>`}</div>
        <p class="line-clamp-2 text-sm font-semibold leading-snug sm:mt-2">${esc((idea?.title ?? v.working_title ?? v.variant_id).replace(/^\[แอดอุ่น ต\.ค\.\]\s*/, ''))}</p>
      </button>
      <div class="mt-1 flex items-center justify-between gap-1"><span class="text-xs opacity-70">${pv ? PILLAR_V14_LABEL[pv] : 'ยังไม่ระบุหมวด'} · ${FORMAT[v.format] ?? v.format}</span>${dots(r)}</div>
      <button data-cp-clear="${esc(s.id)}" class="btn btn-ghost btn-xs mt-1 w-full opacity-70 tap-44" aria-label="ย้ายออกจากช่อง ${esc(s.slot_code)} ไปม้านั่ง">ย้ายไปม้านั่ง</button>
    </div></li>`;
  }).join('');

  // ---- มุมผลิต
  const ic = (b: boolean) => (b ? '<span class="text-success" aria-label="เสร็จ">●</span>' : '<span class="opacity-30" aria-label="ยัง">○</span>');
  $('cp-factory-rows').innerHTML = slots.map((s) => {
    const v = variantOf(s.variant_id);
    if (!v) return `<tr><td class="font-bold">${esc(s.slot_code)}</td><td colspan="6" style="color:var(--color-brand-coral)">ช่องว่าง — ${esc(s.note ?? 'เลือกชิ้นงาน')}</td><td><button data-cp-pick="${esc(s.id)}" class="btn btn-xs tap-44">เลือก</button></td></tr>`;
    const r = readiness(s);
    const idea = ideaOf(s.content_id);
    return `<tr><td class="font-bold">${esc(s.slot_code)}</td>
      <td><button data-cp-drawer="${esc(v.content_id)}" class="link text-left">${esc((idea?.title ?? v.variant_id).replace(/^\[แอดอุ่น ต\.ค\.\]\s*/, ''))}</button></td>
      <td>${FORMAT[v.format] ?? v.format}</td><td class="text-center">${ic(r.w)}</td><td class="text-center">${ic(r.i)}</td><td class="text-center">${ic(r.o)}</td>
      <td><select data-cp-ad="${esc(s.id)}" class="select select-bordered select-xs w-auto" aria-label="สถานะแอดช่อง ${esc(s.slot_code)}">${Object.entries(AD).map(([k, l]) => `<option value="${k}" ${k === s.ad_status ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td class="text-sm">${nextStep(s, r)}</td></tr>`;
  }).join('');
  setLens(lens);

  // ---- ม้านั่ง
  const bench = benchOf(c.campaign_id);
  const empties = slots.filter((s) => !s.variant_id);
  $('cp-bench').innerHTML = bench.length ? bench.map((b) => {
    const v = variantOf(b.variant_id); const idea = ideaOf(b.content_id);
    const img = v && cover.get(v.variant_id);
    const r = readiness(b);
    return `<li class="flex gap-3 rounded-xl bg-base-100 p-2">
      <button data-cp-drawer="${esc(b.content_id ?? '')}" class="shrink-0" aria-label="เปิดรายละเอียด">${img ? `<img src="${esc(img)}" alt="" loading="lazy" class="aspect-[4/5] w-16 rounded-lg object-cover" />` : `<span class="grid aspect-[4/5] w-16 place-items-center rounded-lg bg-base-300 text-[10px] opacity-70">${v ? FORMAT[v.format] : '—'}</span>`}</button>
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-sm font-semibold leading-snug">${esc((idea?.title ?? b.variant_id ?? '').replace(/^\[แอดอุ่น ต\.ค\.\]\s*/, ''))}</p>
        <p class="text-xs opacity-70">${v ? FORMAT[v.format] : ''}${(mediaCount.get(b.variant_id ?? '') ?? 0) ? ` · ${mediaCount.get(b.variant_id!)} รูป` : ''}${idea?.pillar_v14 ? ` · ${PILLAR_V14_LABEL[idea.pillar_v14]}` : ''}</p>
        <div class="mt-1 flex flex-wrap items-center gap-1">${dots(r)}
          ${empties.length ? `<select data-cp-move="${esc(b.id)}" class="select select-bordered select-xs w-auto" aria-label="ใส่ช่อง"><option value="">ใส่ช่อง…</option>${empties.map((e) => `<option value="${esc(e.id)}">${esc(e.slot_code)}</option>`).join('')}</select>` : ''}
          <button data-cp-del="${esc(b.id)}" class="btn btn-ghost btn-xs tap-44" aria-label="เอาออกจากแคมเปญ">✕</button>
        </div>
      </div></li>`;
  }).join('') : '<li class="col-span-full text-sm opacity-60">ยังไม่มีชิ้นสำรอง</li>';

  // ---- สมดุล
  const target = { team: 40, buyer: 30, ai: 30, value: 5, me: 2, ...(c.mix_target ?? {}) };
  const vals = slots.filter((s) => s.role !== 'me' && s.variant_id).map((s) => ideaOf(s.content_id)?.pillar_v14 ?? null);
  const n = vals.length || 1;
  const row = (label: string, k: PillarV14, t: number) => {
    const pct = Math.round((vals.filter((x) => x === k).length / n) * 100);
    const off = Math.abs(pct - t) > 15;
    return `<div class="mb-3"><div class="flex justify-between text-sm"><span>${label}</span><span ${off ? 'class="font-semibold" style="color:var(--color-brand-coral)"' : ''}>${pct}% <span class="opacity-60">/ เป้า ${t}%</span></span></div>
      <progress class="progress w-full ${off ? 'progress-secondary' : 'progress-primary'}" value="${pct}" max="100" aria-label="${label} ${pct}%"></progress></div>`;
  };
  const meFilled = slots.filter((s) => s.role === 'me' && s.variant_id).length;
  const valFilled = vals.length;
  const unknown = vals.filter((x) => !x).length;
  $('cp-mix').innerHTML = row('ปั้นทีมขาย', 'team', target.team) + row('ถอดรหัสคนซื้อ', 'buyer', target.buyer) + row('AI รับงานซ้ำ', 'ai', target.ai)
    + (unknown ? `<p class="text-xs opacity-70">${unknown} ชิ้นยังไม่ระบุหมวด — ตั้งได้ในแผงชิ้นงาน</p>` : '')
    + `<div class="mt-3 rounded-xl bg-base-100 p-3 text-sm"><b>VALUE ${valFilled} : ME ${meFilled}</b> <span class="opacity-70">/ เป้า ${target.value}:${target.me}</span>
       ${meFilled < target.me ? `<br><span class="font-semibold" style="color:var(--color-brand-coral)">⚠ ยังขาด ME ${target.me - meFilled} ช่อง</span> — คนเห็นของดี แต่ยังไม่รู้จักคุณ` : '<br><span class="text-success">✓ ครบสัดส่วน</span>'}</div>`;
}

function setLens(l: 'customer' | 'factory') {
  lens = l;
  $('cp-track').classList.toggle('hidden', l !== 'customer');
  $('cp-factory').classList.toggle('hidden', l !== 'factory');
  for (const [id, on] of [['cp-lens-customer', l === 'customer'], ['cp-lens-factory', l === 'factory']] as const) {
    const b = $(id);
    b.setAttribute('aria-selected', String(on));
    b.classList.toggle('btn-ghost', !on); b.classList.toggle('text-white', on);
    (b as HTMLElement).style.backgroundColor = on ? 'var(--color-brand-navy)' : '';
  }
}

// ---- ตัวเลือกชิ้นงาน
function renderPicker() {
  const q = ($('cp-picker-q') as HTMLInputElement).value.trim().toLowerCase();
  const { ideas, variants } = deps.data();
  const used = new Set(items.filter((i) => i.campaign_id === openId).map((i) => i.variant_id));
  const list = variants
    .filter((v) => v.format !== 'line_broadcast' && !used.has(v.variant_id))
    .map((v) => ({ v, idea: ideas.find((i) => i.content_id === v.content_id) }))
    .filter(({ v, idea }) => (pickFilter === 'all' || idea?.pillar_v14 === pickFilter)
      && (!q || `${v.variant_id} ${idea?.title ?? ''}`.toLowerCase().includes(q)))
    .slice(0, 80);
  $('cp-picker-filter').innerHTML = (['all', 'team', 'buyer', 'ai', 'me', 'bonus'] as const).map((k) =>
    `<button data-cp-pf="${k}" class="btn btn-xs tap-44 ${pickFilter === k ? 'text-white' : 'btn-ghost'}" ${pickFilter === k ? 'style="background-color:var(--color-brand-navy)"' : ''} aria-pressed="${pickFilter === k}">${k === 'all' ? 'ทั้งหมด' : PILLAR_V14_LABEL[k]}</button>`).join('');
  $('cp-picker-list').innerHTML = list.length ? list.map(({ v, idea }) => `<li>
      <button data-cp-choose="${esc(v.variant_id)}" class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-base-200 focus-visible:outline-3">
        <span class="badge badge-sm shrink-0">${FORMAT[v.format] ?? v.format}</span>
        <span class="min-w-0 flex-1"><span class="block truncate text-sm font-semibold">${esc(idea?.title ?? v.working_title ?? v.variant_id)}</span>
        <span class="block font-mono text-[11px] opacity-50">${esc(v.variant_id)} · ${esc(v.variant_status)}${idea?.pillar_v14 ? ` · ${PILLAR_V14_LABEL[idea.pillar_v14]}` : ''}</span></span>
      </button></li>`).join('') : '<li class="p-3 text-sm opacity-60">ไม่เจอชิ้นงาน — ลองคำค้นอื่น หรือสร้างไอเดียในแท็บ Board ก่อน</li>';
}
function openPicker(slot: CampaignItem | null) {
  pickFor = { slot };
  pickFilter = slot?.role === 'me' ? 'me' : 'all';
  $('cp-picker-title').textContent = slot ? `เลือกชิ้นงานใส่ช่อง ${slot.slot_code}` : 'เพิ่มชิ้นเข้าม้านั่งสำรอง';
  $('cp-picker-sub').textContent = slot?.role === 'me' ? 'ช่อง ME: เลือกคอนเทนต์ที่ทำให้คนรู้สึกรู้จักคุณ (ทดสอบ: ดูจบแล้วอยากชวนกินข้าวไหม)' : '';
  ($('cp-picker-q') as HTMLInputElement).value = '';
  renderPicker();
  ($('cp-picker') as HTMLDialogElement).showModal();
  ($('cp-picker-q') as HTMLInputElement).focus();
}
async function choose(vid: string) {
  const v = variantOf(vid); if (!v || !openId || !pickFor) return;
  if (pickFor.slot) await deps.api.updateCampaignItem(pickFor.slot.id, { content_id: v.content_id, variant_id: v.variant_id });
  else await deps.api.addCampaignItems([{ campaign_id: openId, slot_code: null, role: 'bench', content_id: v.content_id, variant_id: v.variant_id, week: 1, sort: 100 + benchOf(openId).length }]);
  ($('cp-picker') as HTMLDialogElement).close();
  deps.toast(pickFor.slot ? `ใส่ช่อง ${pickFor.slot.slot_code} แล้ว` : 'เพิ่มเข้าม้านั่งแล้ว');
  await loadCampaigns();
}

export function openCampaign(id: string | null) {
  openId = id;
  history.replaceState(null, '', id ? `#campaign=${encodeURIComponent(id)}` : '#campaigns');
  if (loaded) render();
}

export function initCampaigns(d: Deps) {
  deps = d;
  const root = $('wr-campaign-view');
  root.addEventListener('click', (e) => void (async () => {
    const t = e.target as HTMLElement;
    const el = t.closest('[data-cp-open],[data-cp-pick],[data-cp-drawer],[data-cp-clear],[data-cp-del],[data-cp-copy]') as HTMLElement | null;
    if (!el) return;
    try {
      if (el.dataset.cpOpen) openCampaign(el.dataset.cpOpen);
      else if (el.dataset.cpPick) openPicker(items.find((i) => i.id === el.dataset.cpPick) ?? null);
      else if (el.dataset.cpDrawer) deps.openDrawer(el.dataset.cpDrawer);
      else if (el.dataset.cpCopy) { await navigator.clipboard.writeText(el.dataset.cpCopy); deps.toast('คัดลอกแล้ว'); }
      else if (el.dataset.cpClear) {
        const s = items.find((i) => i.id === el.dataset.cpClear)!;
        await deps.api.addCampaignItems([{ campaign_id: s.campaign_id, slot_code: null, role: 'bench', content_id: s.content_id, variant_id: s.variant_id, week: s.week, sort: 100 + benchOf(s.campaign_id).length }]);
        await deps.api.updateCampaignItem(s.id, { content_id: null, variant_id: null, ad_status: 'none' });
        deps.toast(`ย้ายออกจาก ${s.slot_code} ไปม้านั่งแล้ว`); await loadCampaigns();
      } else if (el.dataset.cpDel) {
        if (!confirm('เอาชิ้นนี้ออกจากแคมเปญ? (ชิ้นงานยังอยู่ใน Content Center)')) return;
        await deps.api.deleteCampaignItem(el.dataset.cpDel); deps.toast('เอาออกแล้ว'); await loadCampaigns();
      }
    } catch (err) { deps.toast((err as Error).message, 'error'); }
  })());
  root.addEventListener('change', (e) => void (async () => {
    const el = e.target as HTMLSelectElement;
    try {
      if (el.dataset.cpAd) { await deps.api.updateCampaignItem(el.dataset.cpAd, { ad_status: el.value }); deps.toast('อัปเดตสถานะแอดแล้ว'); await loadCampaigns(); }
      else if (el.dataset.cpMove && el.value) {
        const b = items.find((i) => i.id === el.dataset.cpMove)!;
        const slot = items.find((i) => i.id === el.value)!;
        await deps.api.updateCampaignItem(slot.id, { content_id: b.content_id, variant_id: b.variant_id });
        await deps.api.deleteCampaignItem(b.id);
        deps.toast(`ใส่ช่อง ${slot.slot_code} แล้ว`); await loadCampaigns();
      }
    } catch (err) { deps.toast((err as Error).message, 'error'); }
  })());
  $('cp-back').addEventListener('click', () => openCampaign(null));
  $('cp-lens-customer').addEventListener('click', () => setLens('customer'));
  $('cp-lens-factory').addEventListener('click', () => setLens('factory'));
  $('cp-bench-add').addEventListener('click', () => openPicker(null));
  $('cp-picker-q').addEventListener('input', renderPicker);
  $('cp-picker').addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-cp-choose],[data-cp-pf]') as HTMLElement | null;
    if (!el) return;
    if (el.dataset.cpPf) { pickFilter = el.dataset.cpPf as typeof pickFilter; renderPicker(); }
    else void choose(el.dataset.cpChoose!).catch((err) => deps.toast(err.message, 'error'));
  });
  $('cp-new').addEventListener('click', () => ($('cp-create') as HTMLDialogElement).showModal());
  $('cp-create-cancel').addEventListener('click', () => ($('cp-create') as HTMLDialogElement).close());
  $('cp-create-form').addEventListener('submit', (e) => void (async () => {
    e.preventDefault();
    const f = new FormData(e.target as HTMLFormElement);
    const name = String(f.get('name') ?? '').trim();
    if (!name) return;
    try {
      const id = await deps.api.createCampaign({
        name, goal: String(f.get('goal') ?? '').trim(),
        start_date: String(f.get('start') || '') || null, end_date: String(f.get('end') || '') || null,
        value: Math.max(1, Number(f.get('value') || 5)), me: Math.max(0, Number(f.get('me') || 0)),
      });
      ($('cp-create') as HTMLDialogElement).close(); (e.target as HTMLFormElement).reset();
      deps.toast('สร้างแคมเปญแล้ว'); await loadCampaigns(); openCampaign(id);
    } catch (err) { deps.toast((err as Error).message, 'error'); }
  })());
}
