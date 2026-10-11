// Funnel Lab "ของจริง" screen (2026-10-12). Reads what the Mac mini wrote (funnel_lab_signals + CRM views) and shows:
//   01 can the panel predict real numbers (Spearman + bootstrap, per dataset)  02 cold → warm → hot → paid per channel
//   03 who buys vs who the content stops (per persona)  04 every ad / clip with its panel, numbers and a copy-to-workbench button
// Numbers are computed in reality.mjs (pure, tested); this file only fetches and renders.
import { TIERS, TIER_THAI, funnelRows, measure, outcomesFor, personaStopShare, personaTier, withRelativeViews } from './reality.mjs';
import { fetchSignalDetail, listChannelFunnel, listPersonaFunnel, listSignals, requestSignalEvaluation, signedThumbUrls } from './cloud.ts';

const CRM_PACK_ID = 'pun-crm-2026-10';
const PAGE = 40;
const SOURCE_THAI = { own_ad: 'แอด', own_organic: 'ของปัน', competitor: 'คู่แข่ง' };
const PLATFORM_THAI = { meta: 'Meta', tiktok: 'TikTok', instagram: 'IG', facebook: 'FB', youtube: 'YouTube', web: 'เว็บ', other: 'อื่นๆ' };
const CHANNEL_THAI = {
  tiktok: 'TikTok (กรอกฟอร์ม/ลิงก์จากคลิป)', instagram: 'Instagram', facebook: 'Facebook', meta_ads: 'แอด Meta (ฟอร์ม/LP)', line_oa: 'LINE OA',
  website: 'เว็บ/จองคิว', direct: 'ลูกค้าเดิม/แนะนำ/ออกใบตรง (ไม่รู้ต้นทาง)', referral: 'มีคนแนะนำ', sponsor: 'คนมาเสนอขาย', other: 'อื่นๆ',
};
const DATASETS = [
  { key: 'ads', label: 'แอด Meta ของปัน', platform: 'meta', pick: (s) => s.source === 'own_ad' && Number(s.metrics?.impressions) >= 300 },
  { key: 'tiktok', label: 'TikTok ของปัน', platform: 'tiktok', pick: (s) => s.source === 'own_organic' && s.platform === 'tiktok' },
  { key: 'instagram', label: 'Instagram ของปัน', platform: 'instagram', pick: (s) => s.source === 'own_organic' && s.platform === 'instagram' },
  { key: 'competitor', label: 'TikTok คู่แข่ง (Warroom)', platform: 'tiktok', pick: (s) => s.source === 'competitor' && s.platform === 'tiktok' },
];

let ctx = null;          // { getState, escapeHtml, announce, importCreative, personaPackRevision, cloudInSync }
let data = null;         // { signals, funnel, personas, loadedAt }
let thumbs = {};         // path → { url, until } (signed URLs live 1 hour; re-sign after 50 minutes)
const THUMB_TTL_MS = 50 * 60_000;
const DECISION_CLASS = Object.freeze({ STOP: 'stop', WATCH: 'watch', SCROLL: 'scroll' });
let shown = PAGE;
let loading = null;

const $ = (selector) => document.querySelector(selector);
const esc = (value) => ctx.escapeHtml(value);
const fmt = (value, digits = 0) => (value === null || value === undefined || Number.isNaN(Number(value)) ? '–' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: digits }));

function crmPack() {
  return ctx.getState().personaPacks.find((pack) => pack.id === CRM_PACK_ID) ?? null;
}

function summaryOf(signal) {
  return $('#reality-engine')?.value === 'local' ? signal.local_summary : signal.eval_summary;
}

export function initReality(context) {
  ctx = context;
  for (const id of ['#reality-predictor', '#reality-engine']) $(id)?.addEventListener('change', () => { renderMeasure(); renderPersonas(); renderList(); });
  for (const id of ['#reality-source', '#reality-platform', '#reality-sort']) $(id)?.addEventListener('change', () => { shown = PAGE; renderList(); });
  $('#reality-list')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-signal]');
    if (row) void openSignal(row.dataset.signal);
  });
  $('#reality-list')?.addEventListener('keydown', (event) => {
    const row = event.target.closest('[data-signal]');
    if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); void openSignal(row.dataset.signal); }
  });
}

export async function handleRealityAction(action) {
  if (action === 'reality-refresh') return renderReality(true);
  if (action === 'reality-more') { shown += PAGE; renderList(); return; }
  if (action === 'reality-reevaluate') {
    const pack = crmPack();
    if (!pack) { ctx.announce('ยังไม่มี Persona Pack จาก CRM ใน workspace'); return; }
    // The mini uses the pack stored in the cloud; an unsynced edit here would re-queue every row forever.
    if (!ctx.cloudInSync()) { ctx.announce('รอซิงก์ workspace ขึ้นคลาวด์ก่อน แล้วค่อยสั่งประเมินใหม่ (มินิใช้ pack ฉบับบนคลาวด์)'); return; }
    const count = await requestSignalEvaluation(null, ctx.personaPackRevision(pack));
    ctx.announce(count ? `ส่ง ${count} ชิ้นให้มินิประเมินใหม่แล้ว — ทยอยเสร็จราว 70 ชิ้น/ชั่วโมง กด "โหลดใหม่" เพื่อดูความคืบหน้า` : 'ทุกชิ้นประเมินด้วย pack ปัจจุบันแล้ว');
    return renderReality(true);
  }
  if (action === 'reality-to-workbench') return copyToWorkbench();
  return null;
}

export async function renderReality(force = false) {
  if (!ctx) return;
  if (data && !force && Date.now() - data.loadedAt < 5 * 60_000) { renderAll(); return; }
  if (loading) return loading;
  $('#reality-meta').textContent = 'กำลังโหลดข้อมูลจริงจากมินิ…';
  loading = (async () => {
    try {
      const [signals, funnel, personas] = await Promise.all([listSignals(), listChannelFunnel(), listPersonaFunnel(CRM_PACK_ID)]);
      // views are compared with the same account's neighbouring posts (IG counts plays, the rest views)
      const others = withRelativeViews(signals.filter((s) => s.platform !== 'instagram'));
      const ig = withRelativeViews(signals.filter((s) => s.platform === 'instagram'), { viewsKey: 'plays' });
      data = { signals: [...others, ...ig], funnel, personas, loadedAt: Date.now() };
      const now = Date.now();
      const paths = data.signals.map((s) => s.thumb_path).filter((path) => path && !(thumbs[path]?.until > now));
      if (paths.length) {
        const signed = await signedThumbUrls(paths).catch(() => ({}));
        for (const [path, url] of Object.entries(signed)) thumbs[path] = { url, until: now + THUMB_TTL_MS };
      }
      renderAll();
    } catch (error) {
      $('#reality-meta').textContent = `โหลดข้อมูลจริงไม่ได้: ${error.message}`;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function renderAll() {
  const pack = crmPack();
  const revision = pack ? ctx.personaPackRevision(pack) : null;
  const total = data.signals.length;
  const done = data.signals.filter((s) => s.eval_summary && s.pack_revision === revision).length;
  const waiting = data.signals.filter((s) => !s.eval_summary || s.eval_requested_at).length;
  const bySource = (key) => data.signals.filter((s) => s.source === key).length;
  $('#reality-meta').textContent = `แอด ${bySource('own_ad')} · ของปัน ${bySource('own_organic')} · คู่แข่ง ${bySource('competitor')} — Codex ประเมินแล้ว ${done}/${total}${waiting ? ` · รอคิวมินิ ${waiting}` : ''}${pack ? '' : ' · ⚠️ ยังไม่มี pack จาก CRM ใน workspace'}`;
  renderMeasure();
  renderFunnel();
  renderPersonas();
  renderList();
}

// ---------- 01 can it be measured ----------
function rhoCell(row) {
  if (row.rho === null) return `<td class="text-center opacity-50">–</td>`;
  const tone = row.verdict.key === 'predictive' ? 'gl-stop' : row.verdict.key === 'inverse' ? 'gl-scroll' : row.verdict.key === 'weak' ? 'gl-watch' : '';
  const ci = row.interval ? `<span class="block text-[10px] opacity-60">${row.interval.low.toFixed(2)} ถึง ${row.interval.high.toFixed(2)}</span>` : '';
  return `<td class="text-center"><strong class="${tone}">${row.rho.toFixed(2)}</strong>${ci}</td>`;
}

function renderMeasure() {
  if (!data) return;
  const predictor = $('#reality-predictor').value;
  const engine = $('#reality-engine').value;
  const blocks = DATASETS.map((dataset) => {
    const rows = data.signals.filter(dataset.pick).map((s) => ({ ...s, eval_summary: summaryOf(s) }));
    const evaluated = rows.filter((s) => s.eval_summary).length;
    const results = measure(rows, dataset.platform, predictor);
    const body = results.map((row) => `<tr><td class="text-xs">${esc(row.label)}</td><td class="text-center text-xs">${row.n}</td>${rhoCell(row)}<td class="text-xs">${esc(row.verdict.thai)}</td></tr>`).join('');
    return `<div class="min-w-[18rem] flex-1"><p class="text-sm font-semibold">${esc(dataset.label)} <span class="text-xs font-normal opacity-60">ประเมินแล้ว ${evaluated}/${rows.length} (${engine === 'local' ? 'Local' : 'Codex'})</span></p>
      <table class="table table-xs mt-1"><thead><tr><th>ตัวเลขจริง</th><th class="text-center">n</th><th class="text-center">ρ</th><th>อ่านว่า</th></tr></thead><tbody>${body}</tbody></table></div>`;
  });
  $('#reality-measure').innerHTML = `<div class="flex flex-wrap gap-6">${blocks.join('')}</div>`;
}

// ---------- 02 funnel ----------
function renderFunnel() {
  if (!data) return;
  const rows = funnelRows(data.funnel).filter((row) => row.channel !== 'sponsor');
  const max = Math.max(1, ...rows.map((row) => row.leads));
  const bar = (value, tone) => `<span class="block h-2 rounded-full ${tone}" style="width:${Math.max(2, (value / max) * 100)}%"></span>`;
  $('#reality-funnel').innerHTML = `<div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>ช่องทางที่ลีดเข้ามา</th><th class="text-right">ลีด</th><th class="text-right">ได้คุย</th><th class="text-right">เสนอราคา</th><th class="text-right">ปิดได้</th><th class="text-right">รายได้ใน CRM</th><th class="min-w-[8rem]">สัดส่วน</th></tr></thead><tbody>
    ${rows.map((row) => `<tr><td>${esc(CHANNEL_THAI[row.channel] ?? row.channel)}</td><td class="text-right">${fmt(row.leads)}</td><td class="text-right">${fmt(row.talked)} <span class="text-xs opacity-60">${row.talkRate ?? '–'}%</span></td><td class="text-right">${fmt(row.proposed)}</td><td class="text-right font-semibold ${row.won ? 'gl-stop' : ''}">${fmt(row.won)} <span class="text-xs font-normal opacity-60">${row.closeRate ?? '–'}%</span></td><td class="text-right">฿${fmt(row.revenue_thb)}</td>
      <td><div class="space-y-0.5">${bar(row.leads, 'bg-base-300')}${bar(row.talked, 'bg-[#d69e2e]')}${bar(row.won, 'bg-[#2f7a55]')}</div></td></tr>`).join('')}
  </tbody></table></div>
  <p class="mt-1 text-xs opacity-60">"ได้คุย" = Discovery Call ขึ้นไป · "ปิดได้" = จ่ายแล้ว/won/ซื้อซ้ำ · รายได้นับจาก lifetime_value ใน CRM (บางดีลยังไม่ได้ลงยอด)</p>`;
  const ads = data.signals.filter((s) => s.source === 'own_ad' && s.attribution?.crm_leads).sort((a, b) => (b.attribution.talked ?? 0) - (a.attribution.talked ?? 0));
  $('#reality-ads').innerHTML = ads.length ? `<p class="text-sm font-semibold">แอดที่ลีดใน CRM ระบุตัวได้ (utm ตรงตัวแอด)</p>
    <table class="table table-sm mt-1"><thead><tr><th>แอด</th><th class="text-right">ใช้เงิน</th><th class="text-right">ลีด Meta</th><th class="text-right">ลีดใน CRM</th><th class="text-right">ได้คุย</th><th class="text-right">เสนอราคา</th><th class="text-right">ปิด</th><th class="text-right">฿/ลีดที่ได้คุย</th></tr></thead><tbody>
    ${ads.map((s) => `<tr><td class="max-w-[16rem] truncate">${esc(s.title)}</td><td class="text-right">฿${fmt(s.metrics.spend)}</td><td class="text-right">${fmt(s.metrics.leads)}</td><td class="text-right">${fmt(s.attribution.crm_leads)}</td><td class="text-right">${fmt(s.attribution.talked)}</td><td class="text-right">${fmt(s.attribution.proposed)}</td><td class="text-right ${s.attribution.won ? 'gl-stop font-semibold' : ''}">${fmt(s.attribution.won)}</td><td class="text-right">${s.attribution.talked ? `฿${fmt(Number(s.metrics.spend) / s.attribution.talked)}` : '–'}</td></tr>`).join('')}
    </tbody></table>` : '';
}

// ---------- 03 who buys vs who the content stops ----------
function renderPersonas() {
  if (!data) return;
  const pack = crmPack();
  if (!pack) { $('#reality-personas').innerHTML = '<p class="text-sm opacity-70">ยังไม่มี Persona Pack จาก CRM ใน workspace</p>'; return; }
  const ids = pack.personas.map((persona) => persona.id);
  const key = $('#reality-engine').value === 'local' ? 'local_summary' : 'eval_summary';
  const organic = personaStopShare(data.signals.filter((s) => s.source === 'own_organic'), ids, key);
  const ads = personaStopShare(data.signals.filter((s) => s.source === 'own_ad'), ids, key);
  const rival = personaStopShare(data.signals.filter((s) => s.source === 'competitor'), ids, key);
  const crm = new Map(data.personas.map((row) => [row.persona_id, row]));
  const cell = (share) => (share ? `<td class="text-right">${share.stop}%<span class="block text-[10px] opacity-50">n=${share.n}</span></td>` : '<td class="text-right opacity-40">–</td>');
  const rows = TIERS.flatMap((tier) => pack.personas.filter((persona) => personaTier(persona) === tier).map((persona) => {
    const c = crm.get(persona.id) ?? {};
    return `<tr><td><span class="badge badge-sm ${tier === 'buy' ? 'gl-chip-scale' : tier === 'near' ? 'gl-chip-iterate' : tier === 'off' ? 'gl-chip-kill' : 'gl-chip-draft'}">${esc(TIER_THAI[tier].split(' ')[0])}</span></td>
      <td class="max-w-[16rem]"><span class="font-semibold">${esc(persona.name)}</span><span class="block truncate text-xs opacity-60">${esc(persona.revenueBand)}</span></td>
      <td class="text-right">${fmt(c.leads)}</td><td class="text-right">${fmt(c.talked)}</td><td class="text-right">${fmt(c.proposed)}</td><td class="text-right ${Number(c.won) ? 'gl-stop font-semibold' : ''}">${fmt(c.won)}</td>
      ${cell(organic[persona.id])}${cell(ads[persona.id])}${cell(rival[persona.id])}</tr>`;
  })).join('');
  $('#reality-personas').innerHTML = `<table class="table table-sm"><thead><tr><th></th><th>persona</th><th class="text-right">ลีด</th><th class="text-right">คุย</th><th class="text-right">เสนอ</th><th class="text-right">ปิด</th><th class="text-right">คลิปปันหยุดได้</th><th class="text-right">แอดหยุดได้</th><th class="text-right">คู่แข่งหยุดได้</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="mt-1 text-xs opacity-60">ลีด/คุย/เสนอ/ปิด = lead จริงใน CRM ที่จัดเข้า persona นี้ (funnel_lab_lead_personas) · "หยุดได้" = สัดส่วนชิ้นที่ panel บอกว่า persona นี้หยุดดู</p>`;
}

// ---------- 04 list ----------
function viewsLabel(s) {
  const m = s.metrics ?? {};
  if (s.platform === 'meta') return `฿${fmt(m.spend)} · ${fmt(m.impressions)} แสดงผล · ${fmt(m.leads)} ลีด`;
  const views = m.views ?? m.plays;
  const rel = m.relViews ? ` · ${m.relViews}× ของช่อง` : '';
  return `${fmt(views)} วิว${rel}${m.saves !== undefined && m.saves !== null ? ` · เซฟ ${fmt(m.saves)}` : ''}${m.shares ? ` · แชร์ ${fmt(m.shares)}` : ''}`;
}

function scoreChip(summary) {
  if (!summary) return '<span class="badge badge-sm gl-chip-draft">รอประเมิน</span>';
  const gap = summary.fitGap;
  const tone = gap === null || gap === undefined ? '' : gap >= 5 ? 'gl-stop' : gap <= -5 ? 'gl-scroll' : 'gl-watch';
  return `<span class="text-xs">ICP <strong>${fmt(summary.icpScore)}</strong> · ไม่ใช่กลุ่ม ${fmt(summary.offScore)} · <span class="${tone}">ห่าง ${gap > 0 ? '+' : ''}${fmt(gap, 1)}</span></span>`;
}

function filtered() {
  const source = $('#reality-source').value;
  const platform = $('#reality-platform').value;
  const sort = $('#reality-sort').value;
  const rows = data.signals.filter((s) => (!source || s.source === source) && (!platform || s.platform === platform));
  const val = (s) => {
    const summary = summaryOf(s);
    if (sort === 'icp') return summary?.icpScore ?? -1;
    if (sort === 'gap') return summary?.fitGap ?? -999;
    if (sort === 'views') return s.metrics?.relViews ?? -1;
    return Date.parse(s.published_at ?? 0) || 0;
  };
  return rows.sort((a, b) => val(b) - val(a));
}

function renderScatter(rows) {
  const points = rows.map((s) => ({ s, x: summaryOf(s)?.icpScore, y: s.metrics?.relViews })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y > 0);
  if (points.length < 8) { $('#reality-scatter').innerHTML = ''; return; }
  const W = 640; const H = 220; const pad = 32;
  const ys = points.map((p) => Math.log10(p.y));
  const yMin = Math.min(...ys, -1); const yMax = Math.max(...ys, 1);
  const sx = (x) => pad + (x / 100) * (W - pad * 2);
  const sy = (y) => H - pad - ((Math.log10(y) - yMin) / (yMax - yMin || 1)) * (H - pad * 2);
  const color = { own_ad: 'var(--color-brand-navy)', own_organic: '#2f7a55', competitor: 'var(--color-brand-coral)' };
  const dots = points.map((p) => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="4" fill="${color[p.s.source]}" fill-opacity=".7"><title>${esc(p.s.title ?? '')} — ICP ${p.x} · ${p.y}× ของช่อง</title></circle>`).join('');
  $('#reality-scatter').innerHTML = `<figure><svg viewBox="0 0 ${W} ${H}" class="w-full" role="img" aria-label="คะแนน ICP เทียบวิวเทียบช่อง ${points.length} ชิ้น">
    <line x1="${pad}" y1="${sy(1)}" x2="${W - pad}" y2="${sy(1)}" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="4 4"/>
    <text x="${pad}" y="${H - 8}" font-size="11" fill="currentColor" opacity=".6">คะแนน ICP 0</text><text x="${W - pad}" y="${H - 8}" font-size="11" text-anchor="end" fill="currentColor" opacity=".6">100</text>
    <text x="${pad - 4}" y="${sy(1) - 4}" font-size="11" fill="currentColor" opacity=".6">1× = ปกติของช่อง</text>${dots}</svg>
    <figcaption class="text-xs opacity-60">แต่ละจุด = 1 ชิ้น (เขียว ของปัน · ส้ม คู่แข่ง) · แกนตั้ง log วิวเทียบโพสต์ข้างเคียงของช่องเดียวกัน</figcaption></figure>`;
}

function renderList() {
  if (!data) return;
  const rows = filtered();
  renderScatter(rows);
  $('#reality-list').innerHTML = rows.slice(0, shown).map((s) => {
    const thumb = s.thumb_path && thumbs[s.thumb_path] ? `<img src="${esc(thumbs[s.thumb_path].url)}" alt="" loading="lazy" class="size-14 shrink-0 rounded-lg object-cover">` : '<span class="grid size-14 shrink-0 place-items-center rounded-lg bg-base-300 text-xs opacity-60">ไม่มีภาพ</span>';
    const status = s.eval_error ? '<span class="badge badge-sm gl-chip-kill">ประเมินไม่ผ่าน</span>' : s.eval_requested_at ? '<span class="badge badge-sm gl-chip-draft">รอคิว</span>' : '';
    return `<li data-signal="${esc(s.id)}" tabindex="0" role="button" class="flex cursor-pointer items-center gap-3 py-2 hover:bg-base-100 focus-visible:outline focus-visible:outline-2">
      ${thumb}<div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">${esc(s.title ?? s.id)}</p>
      <p class="truncate text-xs opacity-70">${esc(SOURCE_THAI[s.source])} · ${esc(PLATFORM_THAI[s.platform] ?? s.platform)}${s.owner && s.source === 'competitor' ? ` · @${esc(s.owner)}` : ''} · ${s.published_at ? new Date(s.published_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : ''} · ${esc(viewsLabel(s))}</p>
      <p>${scoreChip(summaryOf(s))} ${status}</p></div></li>`;
  }).join('') || '<li class="py-4 text-sm opacity-70">ยังไม่มีข้อมูลในตัวกรองนี้</li>';
  document.querySelector('[data-action="reality-more"]').hidden = rows.length <= shown;
}

// ---------- detail ----------
let openSignalId = null;
let openCreative = null;

async function openSignal(id) {
  const signal = data.signals.find((s) => s.id === id);
  if (!signal) return;
  openSignalId = id;
  openCreative = null;
  const dialog = $('#signal-dialog');
  $('#signal-dialog-title').textContent = signal.title ?? id;
  $('#signal-detail').innerHTML = '<p class="text-sm opacity-70">กำลังโหลด panel…</p>';
  dialog.showModal();
  try {
    const detail = await fetchSignalDetail(id);
    if (openSignalId !== id) return;
    openCreative = detail?.creative ?? null;
    $('#signal-detail').innerHTML = detailHtml(signal, detail);
  } catch (error) {
    $('#signal-detail').innerHTML = `<p class="text-sm">โหลดไม่ได้: ${esc(error.message)}</p>`;
  }
}

function detailHtml(signal, detail) {
  const pack = crmPack();
  const byId = new Map((pack?.personas ?? []).map((persona) => [persona.id, persona]));
  const evaluation = detail?.evaluation;
  const metrics = Object.entries(signal.metrics ?? {}).filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
    .map(([key, value]) => `<span class="badge badge-ghost badge-sm">${esc(key)} ${esc(typeof value === 'number' ? fmt(value, 2) : value)}</span>`).join(' ');
  const a = signal.attribution ?? {};
  const attribution = a.crm_leads ? `<p class="text-sm">CRM: ลีด ${fmt(a.crm_leads)} · ได้คุย ${fmt(a.talked)} · เสนอราคา ${fmt(a.proposed)} · ปิด ${fmt(a.won)}</p>` : '';
  const seats = evaluation ? TIERS.map((tier) => {
    const results = evaluation.personaResults.filter((result) => personaTier(byId.get(result.personaId)) === tier).sort((a, b) => b.score - a.score);
    if (!results.length) return '';
    return `<div><p class="gl-eyebrow">${esc(TIER_THAI[tier])}</p><ul class="mt-1 grid gap-2 sm:grid-cols-2">${results.map((result) => `<li class="gl-seat gl-seat-${DECISION_CLASS[result.decision] ?? 'pending'} rounded-lg p-2 text-xs">
      <p class="flex justify-between gap-2"><strong>${esc(byId.get(result.personaId)?.name ?? result.personaId)}</strong><span class="gl-${DECISION_CLASS[result.decision] ?? 'watch'}">${esc(result.decision)} ${fmt(result.score)}</span></p>
      <p class="mt-1">${esc(result.reaction)}</p><p class="mt-1 opacity-70">ติด: ${esc(result.friction)}</p><p class="mt-1 opacity-70">ปรับ: ${esc(result.improvement)}</p></li>`).join('')}</ul></div>`;
  }).join('') : `<p class="text-sm opacity-70">${signal.eval_error ? `ประเมินไม่ผ่าน: ${esc(signal.eval_error)}` : 'ยังรอคิวประเมินบนมินิ'}</p>`;
  const summary = signal.eval_summary;
  const head = summary ? `<p class="text-sm">${scoreChip(summary)} · หยุดดู ${fmt(summary.stopRate)}% · จุดอ่อน ${esc(summary.weakestComponent)} · ${esc(signal.engine === 'codex-media' ? 'Codex ดูภาพ/คลิปจริง' : 'Codex อ่านข้อความ')}</p>` : '';
  const transcript = detail?.transcript ? `<details><summary class="cursor-pointer text-sm font-semibold">คำพูดในคลิป</summary><p class="mt-2 whitespace-pre-line text-sm opacity-80">${esc(detail.transcript)}</p></details>` : '';
  const link = /^https?:\/\//iu.test(signal.url ?? '') ? `<a class="link text-sm" href="${esc(signal.url)}" target="_blank" rel="noopener noreferrer">เปิดต้นฉบับ ↗</a>` : '';
  return `<div class="flex flex-wrap items-center gap-2">${link}
      <button type="button" class="gl-primary btn btn-sm tap-44" data-action="reality-to-workbench" ${detail?.creative ? '' : 'disabled'}>คัดลอกไปโต๊ะทดลองเพื่อปรับต่อ</button></div>
    <div class="flex flex-wrap gap-1">${metrics}</div>${attribution}${head}${seats}${transcript}`;
}

function copyToWorkbench() {
  if (!openCreative) return;
  const pack = crmPack();
  ctx.importCreative({ ...openCreative, personaPackId: pack ? pack.id : openCreative.personaPackId });
  $('#signal-dialog').close();
}
