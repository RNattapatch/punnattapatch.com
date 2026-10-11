// Growth Lab page controller (/app/growth-lab). Ported from the standalone Growth Journey Lab
// (public/app.mjs) with: DaisyUI rendering, Supabase workspace sync, and Codex via the Mac mini job queue.
import { isSameComparisonGroup, objectiveComponentFor, rankAgreement, rankVariants } from './compare.mjs';
import { applyCsvRecords, parseCsv, toCsv } from './csv.mjs';
import { CHANNEL_PROFILES, componentLabel, decisionVerbs, evaluateCreative } from './engine-local.mjs';
import { predictJourney } from './journey.mjs';
import { calculateMetrics, calibrate, validateActual } from './metrics.mjs';
import { BUILT_IN_PACKS, MAX_PERSONA_PACK_BYTES, clonePersonaPack, exportPersonaPack, importPersonaPack, personaPackRevision, personasForState, validatePersonaPack } from './persona-packs.mjs';
import { updateCreativeDraft, validateState } from './storage.mjs';
import { codexJobVerdict, contentRevision, coreFingerprint, coreOf, DATA_VERSION, decideSync, mergeResults, outranks, pendingResultUploads, wantedResultKeys, withLocalUi } from './sync.mjs';
import { enqueueCodexEvaluation, fetchResults, fetchServerCopy, fetchWorkspace, keepCopyOnServer, listRecentCodexJobs, listResultStamps, listServerCopies, readCodexJob, saveWorkspace, upsertResults } from './cloud.ts';
import { seedState } from './seed.mjs';

// One envelope {v, rev, dirty, state}: the state and the cloud rev it is based on are always written together.
const LOCAL_KEY = 'pun.growthLab.workspace.v2';
const UNREADABLE_KEY = `${LOCAL_KEY}:unreadable`;   // raw local copy that could not be opened (kept, never overwritten silently)
const COPIES_KEY = `${LOCAL_KEY}:copies`;           // offline fallback only — replaced versions normally go to the server (growth_lab_keep_copy)
const JOBS_KEY = `${LOCAL_KEY}:jobs`;               // Codex jobs in flight {jobId: {creativeId, startedAt}} — survives closing the tab
const JOB_MAX_AGE_MS = 30 * 60_000;
const JOB_POLL_MS = 4_000;
const CLOUD_DEBOUNCE_MS = 1_200;
const CLOUD_RETRY_MS = 20_000;
const MAX_COPIES = 5;
const MAX_COPIES_CHARS = 1_500_000;                // copies never crowd out the main local copy (shared app.punnattapatch.com quota)
const CORE_LIMIT_BYTES = 3_000_000;                // growth_lab_workspaces.state_size — warn at 80%
const MAX_DECIDED_JOBS = 50;                       // Codex job ids already decided, kept *in the synced state* so every device agrees
const BUILT_IN_IDS = new Set(BUILT_IN_PACKS.map((pack) => pack.id));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const VERDICT_COPY = {
  SCALE: 'ส่งเข้า test budget ได้ สัญญาณหยุดดูแข็งแรงและไม่มีองค์ประกอบไหนต่ำเกินไป',
  ITERATE: 'มีแรงดึงบางกลุ่ม แต่ควรแก้ตัวแปรที่อ่อนที่สุดหนึ่งจุดก่อนเพิ่มงบ',
  KILL: 'ยังไม่คุ้มซื้อ impression รอบนี้ ให้เปลี่ยนแกนข้อความก่อนยิงจริง',
};
const CHANNEL_THAI = { meta: 'Meta', 'line-oa': 'LINE OA', email: 'Email', sms: 'SMS', 'sales-call': 'Sales call', website: 'Website', offline: 'Offline' };
const ACTUAL_FIELDS = [
  ['date', 'date'], ['spend', 'number'], ['impressions', 'number'], ['clicks', 'number'], ['landingViews', 'number'],
  ['leads', 'number'], ['qualifiedLeads', 'number'], ['purchases', 'number'], ['revenue', 'number'],
];
const ACTUAL_LABELS_BY_CHANNEL = {
  meta: ['วันที่', 'Spend (บาท)', 'Impressions', 'Clicks', 'Landing Views', 'Leads', 'Qualified Leads', 'Purchases', 'Revenue (บาท)'],
  'line-oa': ['วันที่', 'ค่าใช้จ่าย (บาท)', 'ข้อความที่ส่ง', 'เปิดอ่าน', 'คลิก / ไปขั้นถัดไป', 'ตอบกลับ / Leads', 'Qualified Leads', 'Conversions', 'Revenue (บาท)'],
  email: ['วันที่', 'ค่าใช้จ่าย (บาท)', 'Emails delivered', 'Opens', 'Clicks', 'Replies / Leads', 'Qualified Leads', 'Conversions', 'Revenue (บาท)'],
  sms: ['วันที่', 'ค่าใช้จ่าย (บาท)', 'SMS delivered', 'Engagements', 'Clicks / Next step', 'Replies / Leads', 'Qualified Leads', 'Conversions', 'Revenue (บาท)'],
  'sales-call': ['วันที่', 'ต้นทุนทีมขาย (บาท)', 'Prospects contacted', 'Connections', 'Meetings', 'Opportunities', 'Qualified Opportunities', 'Wins', 'Revenue (บาท)'],
  website: ['วันที่', 'ค่าใช้จ่าย (บาท)', 'Page views', 'Engaged visits', 'Key-page views', 'Leads', 'Qualified Leads', 'Conversions', 'Revenue (บาท)'],
  offline: ['วันที่', 'ค่าใช้จ่าย (บาท)', 'Reach / Footfall', 'Engagements', 'Offer views', 'Claims / Leads', 'Qualified Leads', 'Redemptions', 'Revenue (บาท)'],
};
const RAW_METRIC_LABELS = { cpm: 'Cost / 1k reach', ctr: 'Engagement rate', cpc: 'Cost / engagement', lpvRate: 'Next-step rate', cvr: 'Conversion rate', cpl: 'Cost / lead', cpql: 'Cost / qualified', cpa: 'Cost / conversion', roas: 'Return / cost' };
const META_METRIC_LABELS = { cpm: 'CPM', ctr: 'CTR', cpc: 'CPC', lpvRate: 'LPV rate', cvr: 'CVR', cpl: 'CPL', cpql: 'CPQL', cpa: 'CPA', roas: 'ROAS' };

let state;
let busy = false;
let draftTimer = 0;
let selectedPersonaId = '';
// hold = cloud copy could not be opened → never auto-write over it · readOnly = cloud written by a newer page
// editSeq counts content edits only, so a push clears `dirty` exactly when nothing was edited while it was in flight.
// holdRev = rev of the unreadable cloud copy (kept separate from rev so every reload re-detects it).
// archiveNext = the next push deliberately replaces the cloud copy (restore / import / "use local") → DB archives it first.
// syncedResults = {creativeId: evaluatedAt} last uploaded/downloaded result per touchpoint (results sync outside the core rev).
// inherited = this tab took another tab's unsent edit and keeps following that tab until it edits itself.
const cloud = { rev: null, dirty: false, editSeq: 0, timer: 0, inflight: false, again: false, offline: false, syncedAt: '', hold: false, holdRev: null, readOnly: false, localOk: true, archiveNext: false, unreadableState: null, syncedResults: {}, inherited: false, inheritSeq: 0, commitSeq: 0, inheritCommitSeq: 0, tooLarge: false, sizeWarned: false };
const following = new Set();

// ---------- small helpers ----------

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}



function formatNumber(value, digits = 0) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('th-TH', { maximumFractionDigits: digits }) : '—';
}

function formatMetric(key, value) {
  if (value === null || value === undefined) return '—';
  if (['ctr', 'lpvRate', 'cvr'].includes(key)) return `${formatNumber(value, 2)}%`;
  if (['cpm', 'cpc', 'cpl', 'cpql', 'cpa'].includes(key)) return `฿${formatNumber(value, 2)}`;
  if (key === 'roas') return `${formatNumber(value, 2)}×`;
  return formatNumber(value, 1);
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function mmss(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function announce(message, action = null) {
  const node = $('#notice');
  $('#notice-text').textContent = message;
  const button = $('#notice-action');
  button.hidden = !action;
  button.onclick = null;
  if (action) { button.textContent = action.label; button.onclick = action.run; }
  node.hidden = !message;
}

// Horizontal strips (tabs, touchpoint rail) scroll on their own axis only — scrollIntoView would also move
// the page and cancel the scroll that brings the result into view on phones.
function revealInRail(rail, item) {
  if (!rail || !item || rail.scrollWidth <= rail.clientWidth) return;
  const railBox = rail.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  if (itemBox.left < railBox.left) rail.scrollLeft -= railBox.left - itemBox.left + 16;
  else if (itemBox.right > railBox.right) rail.scrollLeft += itemBox.right - railBox.right + 16;
}

function verdictTone(verdict) {
  return { SCALE: 'scale', ITERATE: 'iterate', KILL: 'kill' }[verdict] ?? 'draft';
}

function decisionTone(decision) {
  return { STOP: 'stop', WATCH: 'watch', SCROLL: 'scroll' }[decision] ?? 'pending';
}

function inkFor(hex) {
  const value = /^#([0-9a-f]{6})$/iu.exec(hex)?.[1];
  if (!value) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255).map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#1e1b16' : '#ffffff';
}

// ---------- selection ----------

function selectedCreative() {
  return state.creatives.find((creative) => creative.id === state.selectedCreativeId) ?? state.creatives[0];
}

function packFor(creative) {
  return state.personaPacks.find((pack) => pack.id === creative?.personaPackId) ?? state.personaPacks[0];
}

function selectedPack() {
  return packFor(selectedCreative());
}

function workspacePack() {
  return state.personaPacks.find((pack) => pack.id === state.selectedPersonaPackId) ?? state.personaPacks[0];
}

function activePersonas() {
  return selectedPack()?.personas ?? personasForState(state);
}


// ---------- persistence: localStorage envelope now, Supabase shortly after ----------

function setSaveState(text) {
  $('#save-state').textContent = text;
}

function setSyncStatus(text, tone = 'ghost') {
  const node = $('#sync-status');
  node.textContent = text;
  node.className = `badge badge-sm whitespace-nowrap badge-${tone}`;
}

function readEnvelope() {
  let raw = null;
  try { raw = localStorage.getItem(LOCAL_KEY); } catch { return { state: seedState(), rev: null, dirty: false, usable: true, notice: '' }; }
  if (!raw) return { state: seedState(), rev: null, dirty: false, usable: true, notice: '' };
  try {
    const envelope = JSON.parse(raw);
    const validated = validateState(envelope?.state);
    if (validated.recovered) throw new Error('unreadable');
    // A repaired local copy is no longer exactly what `rev` describes: forget the rev so the cloud copy wins and this one is kept as a backup.
    const rev = validated.repaired ? null : (Number.isFinite(envelope.rev) ? envelope.rev : null);
    return { state: validated.state, rev, dirty: Boolean(envelope.dirty) || validated.repaired > 0, hold: Boolean(envelope.hold), holdRev: Number.isFinite(envelope.holdRev) ? envelope.holdRev : null, archiveNext: Boolean(envelope.archiveNext), syncedResults: envelope.syncedResults && typeof envelope.syncedResults === 'object' ? envelope.syncedResults : {}, usable: true, notice: validated.notice };
  } catch {
    try { localStorage.setItem(UNREADABLE_KEY, raw); } catch { /* quota — the cloud copy still exists */ }
    return { state: seedState(), rev: null, dirty: false, usable: false, notice: 'ข้อมูลในเครื่องนี้เปิดไม่ได้ จึงใช้ฉบับบนคลาวด์ — สำเนาเดิมเก็บไว้ ดาวน์โหลดได้ที่ ⚙️ Settings' };
  }
}

function writeEnvelope() {
  // Another tab may hold unsent edits on the same rev: never clear its marker from here.
  let dirty = cloud.dirty;
  if (!dirty) {
    try { const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null'); dirty = Boolean(existing?.dirty && existing.rev === cloud.rev); } catch { /* unreadable → ours wins */ }
  }
  const envelope = (body) => JSON.stringify({ v: 2, rev: cloud.rev, dirty, hold: cloud.hold, holdRev: cloud.holdRev, archiveNext: cloud.archiveNext, syncedResults: cloud.syncedResults, state: body });
  const attempts = [() => envelope(state), () => envelope(trimmedForStorage())];
  for (const build of attempts) {
    for (;;) {
      try {
        localStorage.setItem(LOCAL_KEY, build());
        cloud.localOk = true;
        return true;
      } catch {
        // Out of room: backup copies go first (oldest first), the working copy matters more.
        const copies = readCopies();
        if (copies.length) { try { localStorage.setItem(COPIES_KEY, JSON.stringify(copies.slice(0, -1))); continue; } catch { /* fall through */ } }
        break;
      }
    }
  }
  if (cloud.localOk) announce('เก็บสำเนาในเครื่องไม่ได้ (พื้นที่เบราว์เซอร์เต็มหรือถูกปิด) — ยังบันทึกขึ้นคลาวด์ตามปกติ อย่าปิดแท็บจนกว่าป้ายจะขึ้น "ซิงก์แล้ว"');
  cloud.localOk = false;
  return false;
}

// Last resort when the browser is full: keep results only where the cloud does not have them yet (or on screen) —
// everything else is re-downloaded from growth_lab_results on the next load.
function trimmedForStorage() {
  const keep = new Set([state.selectedCreativeId, ...pendingResultUploads(state, cloud.syncedResults, personaPackRevision).map((row) => row.creative_id)]);
  return {
    ...state,
    evaluations: Object.fromEntries(Object.entries(state.evaluations).filter(([id]) => keep.has(id))),
    journeys: Object.fromEntries(Object.entries(state.journeys).filter(([id]) => keep.has(id))),
  };
}

function readCopies() {
  try { return JSON.parse(localStorage.getItem(COPIES_KEY) ?? '[]'); } catch { return []; }
}

// Keep a version that is about to be replaced. If the browser has no room, hand it to the user as a file instead.
// Keep a version this device is about to lose. Server first (no quota, any device can download it), then browser
// storage while offline, and as a last resort a button the user taps (phones block downloads not started by a tap).
async function keepCopy(kind, data, label) {
  try { await keepCopyOnServer(data, kind, label); return; } catch (error) { console.warn('[growth-lab] server copy failed, keeping it in this browser', error); }
  const entry = { kind, label, at: new Date().toISOString(), json: JSON.stringify(data) };
  const existing = readCopies();
  if (existing.some((copy) => copy.kind === kind && copy.json === entry.json)) return;
  let copies = [entry, ...existing].slice(0, MAX_COPIES);
  while (copies.length > 1 && JSON.stringify(copies).length > MAX_COPIES_CHARS) copies = copies.slice(0, -1);
  if (JSON.stringify(copies).length <= MAX_COPIES_CHARS) {
    try { localStorage.setItem(COPIES_KEY, JSON.stringify(copies)); return; } catch { /* no room */ }
  }
  announce(`${label} — ยังเก็บไว้ไม่ได้ (ออฟไลน์และพื้นที่เบราว์เซอร์เต็ม) กดดาวน์โหลดเก็บไว้ก่อน`, {
    label: '↓ ดาวน์โหลดเก็บไว้',
    run: () => download(`growth-lab-${kind}-${entry.at.slice(0, 19).replace(/[:T]/g, '-')}.json`, entry.json, 'application/json'),
  });
}

// content = the workspace changed (sync it) · view-only changes stay on this device and never create a conflict.
function commitLocal(candidate, message = '', { content = true } = {}) {
  const validated = validateState(candidate);
  if (validated.recovered) { setSaveState('บันทึกไม่สำเร็จ'); announce('บันทึกไม่สำเร็จ: ข้อมูลไม่ผ่านการตรวจโครงสร้าง'); return false; }
  const coreChanged = content && coreFingerprint(validated.state) !== coreFingerprint(state);
  state = validated.state;
  if (content) cloud.commitSeq += 1;   // any change of this tab's own (results included) — catch-up must not take a shared copy over it
  if (coreChanged) { cloud.dirty = true; cloud.editSeq += 1; cloud.inherited = false; }
  writeEnvelope();
  setSaveState(!cloud.localOk ? 'บันทึกในเครื่องไม่ได้' : cloud.readOnly || cloud.hold ? 'เก็บในเครื่อง ยังไม่ขึ้นคลาวด์' : 'บันทึกแล้ว');
  if (message) announce(message);
  if (content) scheduleCloudSave();
  return true;
}

function persist(message = '') {
  return commitLocal(state, message, { content: true });
}

function persistView() {
  return commitLocal(state, '', { content: false });
}

function scheduleCloudSave(delay = CLOUD_DEBOUNCE_MS) {
  clearTimeout(cloud.timer);
  if (cloud.hold || cloud.readOnly) return;
  cloud.timer = window.setTimeout(() => { void pushCloud(); }, delay);
}

// Unsent edits stay marked as unsent, so after the reload they are kept as a backup copy instead of being replaced.
function enterReadOnly() {
  cloud.readOnly = true;
  clearTimeout(cloud.timer);
  setSyncStatus('🔒 มีเวอร์ชันใหม่กว่า — รีเฟรชหน้า', 'error');
  announce('ฉบับบนคลาวด์บันทึกจาก Growth Lab เวอร์ชันใหม่กว่า หน้านี้จึงหยุดบันทึกเพื่อไม่ทับข้อมูล — รีเฟรชหน้า (⌘R) แล้วใช้งานต่อได้เลย');
}

async function pushCloud() {
  if (cloud.hold || cloud.readOnly) return;
  const results = pendingResultUploads(state, cloud.syncedResults, personaPackRevision);
  const sendCore = cloud.dirty && !cloud.tooLarge;   // results are separate rows: they still sync when the core is too large
  if (!sendCore && !results.length) return;
  if (cloud.inflight) { cloud.again = true; return; }
  cloud.inflight = true;
  setSyncStatus('☁️ กำลังซิงก์…');
  const seqAtSend = cloud.editSeq;
  try {
    if (sendCore) {
      const core = coreOf(state);
      warnIfLarge(core);
      const archivePrevious = cloud.archiveNext;
      const result = await saveWorkspace(core, cloud.rev, { archivePrevious });
      if (!result.ok) {
        if ('outdated' in result) enterReadOnly();
        else if ('tooLarge' in result) enterTooLarge();
        else adoptRemote(result.conflict, { keepLocal: true });
        return;
      }
      cloud.rev = result.rev;
      cloud.syncedAt = result.updated_at;
      if (archivePrevious) cloud.archiveNext = false;
      if (cloud.editSeq === seqAtSend) { cloud.dirty = false; cloud.inherited = false; }
    }
    if (results.length) {
      const landed = await upsertResults(results);
      // Rows the database ignored (it already holds a Codex/newer result for that text) are fetched instead.
      for (const row of results) cloud.syncedResults[row.creative_id] = `${row.result_key}@${row.evaluated_at}`;
      if (landed.length < results.length) void pullResults();
    }
    cloud.offline = false;
    writeEnvelope();
    if (cloud.tooLarge && cloud.dirty) setSyncStatus('⛔ ใหญ่เกินซิงก์ — เก็บในเครื่องอยู่', 'error');   // results went up, the core did not
    else setSyncStatus(`☁️ ซิงก์แล้ว ${formatTime(cloud.syncedAt || new Date().toISOString())}`, 'success');
  } catch (error) {
    cloud.offline = true;
    setSyncStatus('📴 ยังไม่ขึ้นคลาวด์ — เก็บในเครื่องไว้ก่อน', 'warning');
    console.warn('[growth-lab] cloud save failed', error);
    scheduleCloudSave(CLOUD_RETRY_MS);
  } finally {
    cloud.inflight = false;
    if (cloud.again) { cloud.again = false; scheduleCloudSave(0); }
  }
}

function warnIfLarge(core) {
  if (cloud.sizeWarned) return;
  const bytes = new TextEncoder().encode(JSON.stringify(core)).length;
  if (bytes < CORE_LIMIT_BYTES * 0.8) return;
  cloud.sizeWarned = true;
  announce(`Workspace ใกล้เต็ม (${(bytes / 1_000_000).toFixed(1)} จาก 3 MB) — ลบ Persona Pack หรือ Touchpoint ที่ไม่ใช้แล้ว หรือ Backup JSON แยกเก็บเป็นรายลูกค้า`);
}

function enterTooLarge() {
  cloud.tooLarge = true;
  clearTimeout(cloud.timer);
  setSyncStatus('⛔ ใหญ่เกินซิงก์ — เก็บในเครื่องอยู่', 'error');
  announce('Workspace ใหญ่เกิน 3 MB จึงซิงก์ขึ้นคลาวด์ไม่ได้ งานยังเก็บในเครื่องนี้ — Backup JSON ไว้ก่อน แล้วลบ Persona Pack / Touchpoint ที่ไม่ใช้ จากนั้นกด ☁️ ซิงก์ตอนนี้ ที่ Settings');
}

// Load the cloud copy. keepLocal = this device has unsent edits → keep them as a downloadable copy first.
function adoptRemote(remote, { keepLocal = false, quiet = false } = {}) {
  if (Number(remote.app_version ?? 0) > DATA_VERSION) { enterReadOnly(); return; }
  const validated = validateState(remote.state);
  if (validated.recovered) {
    // Never write over a cloud copy we cannot open: stop syncing until the user decides (Settings).
    cloud.unreadableState = remote.state;   // it is still the cloud row; "use local instead" archives it before overwriting
    cloud.hold = true;
    cloud.holdRev = remote.rev;   // rev stays at the last copy we could read, so every reload re-checks the cloud copy
    clearTimeout(cloud.timer);
    writeEnvelope();
    setSyncStatus('⚠️ หยุดซิงก์ — ฉบับคลาวด์เปิดไม่ได้', 'error');
    announce('ฉบับบนคลาวด์เปิดไม่ได้ จึงยังไม่บันทึกทับ — งานในเครื่องนี้ยังอยู่ครบ · ไปที่ ⚙️ Settings เพื่อดาวน์โหลดฉบับคลาวด์ หรือสั่งใช้ฉบับในเครื่องนี้แทน');
    renderSettingsIfOpen();
    return;
  }
  if (validated.repaired) void keepCopy('cloud-before-repair', remote.state, `ฉบับคลาวด์ก่อนล้างผลที่ใช้ไม่ได้ (rev ${remote.rev})`);
  // Two tabs pushing the same content is not a conflict — nothing would be lost, so no copy and no warning.
  if (keepLocal && cloud.dirty && coreFingerprint(validated.state) === coreFingerprint(state)) keepLocal = false;
  if (keepLocal && cloud.dirty) void keepCopy('local-replaced', state, 'ฉบับที่แก้ในเครื่องนี้ก่อนโหลดของอีกเครื่อง');
  state = withLocalResults(withLocalUi(validated.state, state), state);
  cloud.rev = remote.rev;
  cloud.dirty = false;
  cloud.inherited = false;
  cloud.archiveNext = false;   // a deliberate overwrite that lost the conflict is not carried into the next ordinary push
  cloud.hold = false;
  cloud.holdRev = null;
  cloud.unreadableState = null;
  cloud.syncedAt = remote.updated_at;
  writeEnvelope();
  setSyncStatus(`☁️ ซิงก์แล้ว ${formatTime(remote.updated_at)}`, 'success');
  const from = remote.device ? ` จาก ${remote.device}` : '';
  if (keepLocal) announce(`มีการบันทึก${from} ก่อนหน้านี้ จึงโหลดฉบับนั้นมาแทน — ฉบับที่เพิ่งแก้ในเครื่องนี้เก็บไว้แล้ว ดาวน์โหลดได้ที่ ⚙️ Settings`);
  else if (!quiet) announce(`โหลดฉบับล่าสุด${from} (${formatTime(remote.updated_at)}) แล้ว`);
  if (validated.notice) announce(validated.notice);
  renderAll();
  void pullResults();
}

// The cloud core carries no results: keep this device's results that still match the incoming text and packs.
function withLocalResults(incoming, local) {
  const next = { ...incoming, evaluations: {}, journeys: {} };
  for (const [id, evaluation] of Object.entries(local.evaluations ?? {})) {
    const creative = incoming.creatives.find((item) => item.id === id);
    if (!creative || !local.journeys?.[id]) continue;
    const localCreative = local.creatives?.find((item) => item.id === id);
    const scoredText = evaluation.contentRevision ?? (localCreative ? contentRevision(localCreative) : null);
    if (scoredText !== contentRevision(creative)) continue;   // the other device changed this text — this result is stale
    next.evaluations[id] = evaluation;
    next.journeys[id] = local.journeys[id];
  }
  const validated = validateState(next);
  return validated.recovered ? incoming : validated.state;
}

// Download results another device made for the current text of each touchpoint (Codex beats Local; same engine → newer).
async function pullResults() {
  try {
    const keys = wantedResultKeys(state, personaPackRevision);
    const stamps = await listResultStamps([...new Set(Object.values(keys))]);
    const wanted = stamps.filter((row) => keys[row.creative_id] === row.result_key
      && outranks({ engine: row.engine === 'codex' ? 'codex' : 'local', evaluatedAt: row.evaluated_at }, state.evaluations[row.creative_id]));
    if (!wanted.length) return;
    const rows = await fetchResults(wanted.map((row) => row.result_key));
    // Merge into the state as it is *now* — edits made while the download ran must survive.
    const merged = mergeResults(state, rows, personaPackRevision);
    if (!merged.taken.length) return;
    const validated = validateState(merged.state);
    if (validated.recovered) return;
    state = validated.state;
    const keysNow = wantedResultKeys(state, personaPackRevision);
    for (const id of merged.taken) if (state.evaluations[id]) cloud.syncedResults[id] = `${keysNow[id]}@${state.evaluations[id].evaluatedAt}`;
    writeEnvelope();
    renderAll();
  } catch (error) {
    console.warn('[growth-lab] results download failed', error);
  }
}

// A tab holding another tab's unsent edit gives that tab a moment to push, then catches up from the shared local copy.
async function catchUpInherited() {
  if (!cloud.inherited) return;
  flushDraftSave();
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  // Same rule as onStorage: never take the shared copy over this tab's own edits (typed during the wait, or still in the draft timer).
  if (!cloud.inherited || cloud.editSeq !== cloud.inheritSeq || cloud.commitSeq !== cloud.inheritCommitSeq || draftTimer) return;
  try {
    const envelope = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null');
    if (!envelope || !(Number(envelope.rev) >= (cloud.rev ?? -1))) return;
    const validated = validateState(envelope.state);
    if (validated.recovered || validated.repaired) return;
    state = withLocalUi(validated.state, state);
    cloud.rev = Number.isFinite(envelope.rev) ? envelope.rev : cloud.rev;
    cloud.dirty = Boolean(envelope.dirty);
    cloud.inherited = cloud.dirty;
    cloud.inheritSeq = cloud.editSeq;
    cloud.inheritCommitSeq = cloud.commitSeq;
    cloud.archiveNext = Boolean(envelope.archiveNext);
    if (envelope.syncedResults && typeof envelope.syncedResults === 'object') cloud.syncedResults = envelope.syncedResults;
    renderAll();
  } catch { /* keep what this tab has */ }
}

async function syncFromCloud(reason) {
  if (cloud.readOnly) return;
  await catchUpInherited();
  try {
    const remote = await fetchWorkspace();
    if (cloud.hold && remote && Number(remote.app_version ?? 0) <= DATA_VERSION) {
      // Re-check the copy we could not open: still unreadable → stay on hold; fixed elsewhere → load it (keeping unsent work).
      adoptRemote(remote, { keepLocal: cloud.dirty, quiet: true });
      return;
    }
    const action = decideSync({ rev: cloud.rev, dirty: cloud.dirty }, remote);
    if (action === 'insert') { cloud.rev = null; cloud.dirty = true; cloud.hold = false; writeEnvelope(); await pushCloud(); return; }
    if (action === 'read-only') { enterReadOnly(); return; }
    if (action === 'in-sync') { cloud.syncedAt = remote.updated_at; setSyncStatus(`☁️ ซิงก์แล้ว ${formatTime(remote.updated_at)}`, 'success'); await pullResults(); void pushCloud(); return; }
    if (action === 'push') { await pushCloud(); await pullResults(); return; }
    adoptRemote(remote, { keepLocal: action === 'adopt-keep-local', quiet: reason === 'boot' });
  } catch (error) {
    cloud.offline = true;
    setSyncStatus('📴 ออฟไลน์ — ทำงานต่อได้ เดี๋ยวซิงก์ให้เอง', 'warning');
    console.warn('[growth-lab] cloud fetch failed', error);
    scheduleCloudSave(CLOUD_RETRY_MS);
  }
}

// Another tab on this device saved: follow it when this tab has nothing unsent. Its unsent marker comes along, so
// if that tab closes before its push lands, this tab pushes the edit (or keeps a copy) instead of dropping it.
function onStorage(event) {
  if (event.key !== LOCAL_KEY || !event.newValue) return;
  if (cloud.inherited && cloud.editSeq !== cloud.inheritSeq) cloud.inherited = false;
  if (cloud.dirty && !cloud.inherited) return;   // this tab's own unsent edit — its push decides
  try {
    const envelope = JSON.parse(event.newValue);
    if (Number.isFinite(cloud.rev) && !(Number(envelope.rev) >= cloud.rev)) return;   // never fall back to an older copy
    const validated = validateState(envelope.state);
    if (validated.recovered || validated.repaired) return;
    state = withLocalUi(validated.state, state);
    cloud.rev = Number.isFinite(envelope.rev) ? envelope.rev : cloud.rev;
    cloud.dirty = Boolean(envelope.dirty);
    cloud.archiveNext = Boolean(envelope.archiveNext);
    if (envelope.syncedResults && typeof envelope.syncedResults === 'object') cloud.syncedResults = envelope.syncedResults;
    cloud.inherited = cloud.dirty;
    cloud.inheritSeq = cloud.editSeq;
    cloud.inheritCommitSeq = cloud.commitSeq;
    renderAll();
  } catch { /* ignore a half-written value */ }
}

function forceUseLocal() {
  if (!window.confirm('ใช้ฉบับในเครื่องนี้แทนฉบับบนคลาวด์? ฉบับคลาวด์เดิมจะถูกเก็บในประวัติของฐานข้อมูลก่อนเขียนทับ (ดาวน์โหลดได้ที่รายการด้านล่าง)')) return;
  cloud.hold = false;
  if (cloud.holdRev !== null) cloud.rev = cloud.holdRev;
  cloud.holdRev = null;
  cloud.dirty = true;
  cloud.editSeq += 1;
  cloud.archiveNext = true;
  writeEnvelope();
  void pushCloud().then(renderSettingsIfOpen);
}

function renderSettingsIfOpen() {
  if (state.activeView === 'settings') renderSettings();
}

// ---------- rendering ----------

function renderBrand() {
  const accent = state.workspace.accentColor;
  const root = $('#growth-lab-app');
  root.style.setProperty('--gl-accent', accent);
  root.style.setProperty('--gl-accent-ink', inkFor(accent));
  $('#brand-name').textContent = state.workspace.appName;
  $('#brand-client').textContent = state.workspace.clientName || 'Mar-Tech · Sales-Tech workbench · B2B / B2C / B2G';
  document.title = state.workspace.clientName ? `${state.workspace.appName} — ${state.workspace.clientName}` : 'Growth Lab — Pun';
}

function renderCreativeList() {
  $('#creative-count').textContent = state.creatives.length;
  $('#creative-list').innerHTML = state.creatives.map((creative) => {
    const evaluation = state.evaluations[creative.id];
    const verdict = evaluation?.verdict ?? 'DRAFT';
    const active = creative.id === state.selectedCreativeId;
    return `<button type="button" class="${active ? 'gl-card-active' : ''} flex min-w-[11rem] shrink-0 flex-col items-start gap-1 rounded-xl border border-base-300 bg-base-200 p-3 text-left text-sm tap-44 lg:min-w-0" data-creative-id="${escapeHtml(creative.id)}" ${active ? 'aria-current="true"' : ''}>
      <strong class="line-clamp-2 leading-snug">${escapeHtml(creative.name)}</strong>
      <span class="text-xs opacity-60">${escapeHtml(CHANNEL_THAI[creative.channel] ?? creative.channel)} · เปลี่ยน ${escapeHtml(creative.changedVariable || '—')}</span>
      <span class="gl-chip-${verdictTone(verdict)} rounded-full px-2 py-0.5 text-[11px] font-semibold">${verdict}${evaluation ? ` · ${formatNumber(evaluation.stopRate)}%` : ''}</span>
    </button>`;
  }).join('');
  requestAnimationFrame(() => revealInRail($('#creative-list'), $('#creative-list [aria-current="true"]')));
}

function renderContextControls() {
  const creative = selectedCreative();
  const pack = selectedPack();
  const packSelect = $('#persona-pack-select');
  packSelect.innerHTML = state.personaPacks.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.businessModel.toUpperCase())} · ${escapeHtml(item.name)}</option>`).join('');
  packSelect.value = pack.id;
  const stageSelect = $('#journey-stage-select');
  stageSelect.innerHTML = pack.journeyStages.map((stage) => `<option value="${escapeHtml(stage.id)}">${escapeHtml(stage.label)}</option>`).join('');
  stageSelect.value = pack.journeyStages.some((stage) => stage.id === creative.journeyStage) ? creative.journeyStage : pack.journeyStages[0].id;
  $('#persona-count').textContent = pack.personas.length;
  renderBudgets();
}

function renderBudgets() {
  const form = $('#creative-form');
  const channel = form.elements.channel.value;
  const profile = CHANNEL_PROFILES[channel] ?? CHANNEL_PROFILES.meta;
  const hookChars = form.elements.hook.value.trim().length;
  const delivered = ['hook', 'primaryText', 'headline', 'offer', 'cta'].map((name) => form.elements[name].value.trim()).filter(Boolean).join(' ').length;
  const label = CHANNEL_THAI[channel] ?? channel;
  $('#hook-budget').textContent = `· ${hookChars}/${profile.hookMax} ตัวอักษรสำหรับ ${label}`;
  $('#body-budget').textContent = `· ข้อความรวม ${delivered}/${profile.bodyMax} ตัวอักษร${channel === 'sms' ? ' (SMS ภาษาไทย 70 ตัว/ข้อความ)' : ''}`;
  $('#hook-budget').classList.toggle('text-error', hookChars > profile.hookMax * 1.5);
  $('#body-budget').classList.toggle('text-error', delivered > profile.bodyMax * 1.6);
}

function fillCreativeForm() {
  const creative = selectedCreative();
  const form = $('#creative-form');
  for (const field of ['name', 'changedVariable', 'personaPackId', 'touchpointType', 'channel', 'businessModel', 'journeyStage', 'hook', 'primaryText', 'headline', 'offer', 'cta', 'visualDirection']) {
    form.elements[field].value = creative[field] ?? '';
  }
  renderBudgets();
}

function renderLegend(channel) {
  const verbs = decisionVerbs(channel);
  $('#decision-legend').innerHTML = [['stop', 'STOP', '#2f7a55'], ['watch', 'WATCH', '#d69e2e'], ['scroll', 'SCROLL', 'var(--color-brand-coral)']]
    .map(([, key, color]) => `<span class="inline-flex items-center gap-1.5"><i class="gl-dot" style="background:${color}"></i><b>${key}</b><span class="opacity-70">${escapeHtml(verbs[key])}</span></span>`).join('');
}

function renderDecision() {
  const creative = selectedCreative();
  const evaluation = state.evaluations[creative.id];
  const personas = activePersonas();
  $('#buyer-panel-label').textContent = `Buyer panel · ${personas.length} ที่นั่ง · ${selectedPack().name}`;
  renderLegend(creative.channel);
  if (!evaluation) {
    $('#evaluation-engine').textContent = 'ยังไม่ประเมิน';
    $('#decision-summary').innerHTML = `<p class="font-display text-3xl font-bold opacity-40">READY?</p><p class="mt-1 text-sm opacity-70">กรอก Touchpoint แล้วให้ผู้ซื้อจำลองทั้ง ${personas.length} ที่นั่งตัดสินใจ</p>`;
    $('#component-bars').innerHTML = '';
    $('#hypothesis-card').innerHTML = '';
    $('#persona-panel').innerHTML = personas.map((persona, index) => personaCell(persona, index, null)).join('');
    return;
  }
  const engine = String(evaluation.engine);
  $('#evaluation-engine').textContent = engine.startsWith('codex') ? 'CODEX · มินิ' : engine.startsWith('jev') ? 'JEV' : 'LOCAL';
  const segments = Object.entries(evaluation.segmentScores).sort(([, left], [, right]) => right - left);
  const when = evaluation.evaluatedAt && !evaluation.evaluatedAt.startsWith('1970') ? ` · ${new Date(evaluation.evaluatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}` : '';
  $('#decision-summary').innerHTML = `<div class="flex items-end justify-between gap-3"><p class="gl-${verdictTone(evaluation.verdict)} font-display text-4xl font-bold leading-none">${evaluation.verdict}</p><p class="text-right"><span class="font-display text-3xl font-bold leading-none">${formatNumber(evaluation.stopRate)}%</span><br><span class="text-[11px] font-semibold uppercase tracking-wider opacity-60">Stop rate</span></p></div>
    <p class="mt-2 text-sm">${VERDICT_COPY[evaluation.verdict]} คะแนนเฉลี่ย ${formatNumber(evaluation.averageScore, 1)}/100<span class="opacity-60">${when}</span></p>
    <div class="mt-2 flex flex-wrap gap-1" aria-label="คะแนนแยกตามกลุ่ม">${segments.map(([segment, score]) => `<span class="badge badge-ghost badge-sm">${escapeHtml(segment)} <b class="ml-1">${formatNumber(score)}</b></span>`).join('')}</div>`;
  $('#component-bars').innerHTML = Object.entries(evaluation.componentScores).map(([key, value]) => {
    const pct = Math.max(0, Math.min(100, Number(value)));
    return `<div class="grid grid-cols-[minmax(0,9.5rem)_1fr_2.25rem] items-center gap-2 text-sm"><span class="truncate ${key === evaluation.weakestComponent ? 'font-semibold' : ''}">${escapeHtml(componentLabel(key, creative.channel))}</span><div class="gl-bar ${key === evaluation.weakestComponent ? 'gl-weak' : ''}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${escapeHtml(componentLabel(key, creative.channel))}"><span style="width:${pct}%"></span></div><output class="text-right tabular-nums">${formatNumber(value)}</output></div>`;
  }).join('');
  const hypothesis = evaluation.nextHypothesis ?? { changedVariable: evaluation.weakestComponent, instruction: 'สร้าง variant ใหม่โดยเปลี่ยนเฉพาะองค์ประกอบที่อ่อนที่สุด' };
  $('#hypothesis-card').innerHTML = `<div class="rounded-xl border border-base-300 bg-base-100 p-3"><p class="gl-eyebrow">ทดสอบต่อ · เปลี่ยนแค่ ${escapeHtml(componentLabel(hypothesis.changedVariable, creative.channel) ?? hypothesis.changedVariable)}</p><p class="mt-1 text-sm">${escapeHtml(hypothesis.instruction)}</p><button type="button" class="btn btn-xs mt-2 tap-44" data-action="duplicate">⧉ สร้าง variant ทดสอบข้อนี้</button></div>`;
  const resultMap = new Map(evaluation.personaResults.map((result) => [result.personaId, result]));
  $('#persona-panel').innerHTML = personas.map((persona, index) => personaCell(persona, index, resultMap.get(persona.id))).join('');
}

function personaCell(persona, index, result) {
  const decision = result?.decision ?? 'PENDING';
  return `<button type="button" class="gl-seat gl-seat-${decisionTone(decision)} flex flex-col items-start gap-0.5 rounded-xl bg-base-100 p-2.5 text-left tap-44" data-persona-id="${escapeHtml(persona.id)}" aria-label="ที่นั่ง ${index + 1} ${escapeHtml(persona.name)} ${decision}">
    <span class="w-full truncate text-[10px] font-semibold uppercase tracking-wider opacity-55">Seat ${String(index + 1).padStart(2, '0')} · ${escapeHtml(persona.segment)}</span>
    <span class="w-full truncate text-sm font-semibold">${escapeHtml(persona.name)}</span>
    <span class="w-full truncate text-xs opacity-70">${escapeHtml(persona.role)}</span>
    <span class="text-xs font-semibold">${decision}${result ? ` · ${formatNumber(result.score)}` : ''}</span>
  </button>`;
}

function renderCompare() {
  const anchor = selectedCreative();
  const ranked = rankVariants(state.creatives.filter((creative) => isSameComparisonGroup(anchor, creative) && state.evaluations[creative.id]).map((creative) => ({ ...creative, evaluation: state.evaluations[creative.id] })));
  if (!ranked.length) {
    $('#compare-content').innerHTML = '<div class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm">ยังไม่มีผลประเมินในกลุ่มนี้ — กลับไปกด "ประเมินทันที" ที่ Workbench ก่อน</div>';
    return;
  }
  const rows = ranked.map((creative, index) => {
    const e = creative.evaluation;
    return `<tr class="${creative.id === anchor.id ? 'bg-base-100' : ''}"><td class="font-display text-lg font-bold">#${index + 1}</td><td><button type="button" class="link link-hover text-left font-semibold" data-creative-id="${escapeHtml(creative.id)}">${escapeHtml(creative.name)}</button><div class="text-xs opacity-60">เปลี่ยน ${escapeHtml(creative.changedVariable || '—')}</div></td><td class="tabular-nums">${formatNumber(e.stopRate)}%</td><td class="tabular-nums">${formatNumber(e.averageScore, 1)}</td><td class="tabular-nums">${formatNumber(e.componentScores.hook)}</td><td class="tabular-nums">${formatNumber(e.componentScores.offer)}</td><td><span class="gl-chip-${verdictTone(e.verdict)} rounded-full px-2 py-0.5 text-xs font-semibold">${e.verdict}</span></td></tr>`;
  }).join('');
  const tieComponent = objectiveComponentFor(ranked[0].objective);
  $('#compare-content').innerHTML = `<p class="mb-2 text-sm opacity-70">เทียบเฉพาะ Variant ที่ใช้ Campaign, Persona Pack, Touchpoint, Channel, Journey stage และ Objective เดียวกับ “${escapeHtml(anchor.name)}” — ทดสอบที่ยุติธรรมต้องเปลี่ยนทีละตัวแปร</p>
    <div class="overflow-x-auto rounded-2xl border border-base-300 bg-base-200"><table class="table table-sm"><caption class="sr-only">อันดับ Variant ตาม Stop rate</caption><thead><tr><th scope="col">อันดับ</th><th scope="col">Variant</th><th scope="col">Stop</th><th scope="col">Score</th><th scope="col">Hook</th><th scope="col">Offer</th><th scope="col">Verdict</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-4 text-sm"><strong>ตัดสิน:</strong> เริ่ม test budget ที่ “${escapeHtml(ranked[0].name)}” เพราะชนะด้วย Stop rate ก่อน แล้วจึงใช้คะแนนเฉลี่ย และ ${escapeHtml(componentLabel(tieComponent, anchor.channel))} ตาม objective เมื่อคะแนนเสมอ</div>`;
}

function renderActualForm() {
  const creative = selectedCreative();
  const actual = state.actuals[creative.id] ?? { creativeId: creative.id, date: new Date().toISOString().slice(0, 10), spend: 0, impressions: 0, clicks: 0, landingViews: 0, leads: 0, qualifiedLeads: 0, purchases: 0, revenue: 0 };
  const labels = ACTUAL_LABELS_BY_CHANNEL[creative.channel] ?? ACTUAL_LABELS_BY_CHANNEL.meta;
  $('#actual-context').textContent = `${CHANNEL_THAI[creative.channel] ?? creative.channel} · ${creative.touchpointType}`;
  $('#actual-results-form').innerHTML = `<label class="form-control"><span class="label-text mb-1 text-xs font-semibold">Variant</span><select class="select select-bordered select-sm w-full" name="creativeId">${state.creatives.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === creative.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${ACTUAL_FIELDS.map(([field, type], index) => `<label class="form-control"><span class="label-text mb-1 text-xs font-semibold">${escapeHtml(labels[index])}</span><input class="input input-bordered input-sm w-full" name="${field}" type="${type}" ${type === 'number' ? 'min="0" step="any" inputmode="decimal"' : 'required'} value="${escapeHtml(actual[field] ?? '')}"></label>`).join('')}</div>
    <p class="text-xs opacity-60">ช่องเหล่านี้ใช้ funnel กลาง 8 ช่องเพื่อเทียบข้ามช่องทาง ชื่อเปลี่ยนตาม ${escapeHtml(CHANNEL_THAI[creative.channel] ?? creative.channel)} อัตโนมัติ</p>
    <p class="min-h-[1.25rem] text-sm text-error" id="actual-error" role="alert"></p>
    <button class="gl-primary btn btn-sm tap-44" type="submit">Save actual result</button>`;
}

function metricGrid(metrics, labels) {
  return `<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">${Object.entries(metrics).map(([key, value]) => `<div class="rounded-xl border border-base-300 bg-base-100 p-2.5"><span class="block text-[11px] opacity-60">${labels[key]}</span><strong class="tabular-nums">${formatMetric(key, value)}</strong></div>`).join('')}</div>`;
}

function renderCalibration() {
  const creative = selectedCreative();
  const evaluation = state.evaluations[creative.id];
  const actual = state.actuals[creative.id];
  if (!evaluation || !actual) {
    $('#calibration-content').innerHTML = '<p class="text-sm opacity-70">ต้องมีทั้งผลจำลองและผลจริงจากช่องทางเดียวกันของ Variant นี้ จึงจะเทียบได้</p>';
    return;
  }
  if (creative.channel !== 'meta') {
    $('#calibration-content').innerHTML = `<p class="mb-2 text-sm opacity-70">แสดงผลจริงแบบ raw funnel ของ ${escapeHtml(CHANNEL_THAI[creative.channel] ?? creative.channel)} โดยยังไม่ตีความเป็น prediction bias จนกว่าจะมี benchmark ของช่องทางนี้</p>${metricGrid(calculateMetrics(actual), RAW_METRIC_LABELS)}`;
    return;
  }
  const result = calibrate(evaluation, actual, creative.objective);
  const biasCopy = { overestimated: 'ระบบคาดสูงกว่าผลจริง', aligned: 'คำทำนายใกล้ผลจริง', underestimated: 'ผลจริงดีกว่าที่ระบบคาด' }[result.bias];
  const comparable = state.creatives.filter((item) => isSameComparisonGroup(creative, item) && item.channel === 'meta' && state.evaluations[item.id] && state.actuals[item.id]).map((item) => ({ ...item, evaluation: state.evaluations[item.id] }));
  const actualScores = Object.fromEntries(comparable.map((item) => [item.id, { actualScore: calibrate(item.evaluation, state.actuals[item.id], item.objective).actualScore }]));
  const agreement = rankAgreement(comparable, actualScores);
  $('#calibration-content').innerHTML = `<div class="grid grid-cols-2 gap-2"><div class="rounded-xl border border-base-300 bg-base-100 p-3"><span class="gl-eyebrow">Predicted</span><strong class="block font-display text-3xl">${formatNumber(result.predictedScore, 1)}</strong></div><div class="rounded-xl border border-base-300 bg-base-100 p-3"><span class="gl-eyebrow">Actual</span><strong class="block font-display text-3xl">${formatNumber(result.actualScore, 1)}</strong></div></div>
    <p class="my-2"><span class="badge badge-sm">${biasCopy} · GAP ${result.gap > 0 ? '+' : ''}${formatNumber(result.gap, 1)}</span></p>
    ${agreement === null ? '' : `<p class="mb-2 text-sm"><strong>Rank agreement ${formatNumber(agreement, 1)}%</strong> จาก ${comparable.length} variants ที่มีผลจริง</p>`}${metricGrid(result.metrics, META_METRIC_LABELS)}`;
}

function stageLabel(pack, stageId) {
  return pack.journeyStages.find((stage) => stage.id === stageId)?.label ?? stageId;
}

function renderJourney() {
  const creative = selectedCreative();
  const pack = selectedPack();
  const forecast = state.journeys[creative.id];
  if (!forecast || forecast.personaPackId !== pack.id) {
    $('#journey-summary').innerHTML = '<div class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm sm:col-span-3">ประเมิน Touchpoint นี้ที่ Workbench ก่อน แล้ว Journey Forecast จะขึ้นที่นี่</div>';
    $('#journey-rail').innerHTML = '';
    $('#journey-persona-table').innerHTML = '';
    $('#journey-assumptions').innerHTML = '<div class="card-body p-4 text-sm opacity-70">ยังไม่มีสมมติฐาน เพราะยังไม่ได้ประเมิน</div>';
    return;
  }
  const bottleneck = forecast.stageForecasts.find((stage) => stage.stageId === forecast.strategy.bottleneckStage);
  const intendedIndex = Math.max(0, pack.journeyStages.findIndex((stage) => stage.id === creative.journeyStage));
  $('#journey-summary').innerHTML = `<div class="rounded-2xl border border-base-300 bg-base-200 p-4"><p class="gl-eyebrow">Touchpoint</p><strong class="block truncate">${escapeHtml(creative.name)}</strong><span class="text-xs opacity-60">${escapeHtml(pack.businessModel.toUpperCase())} · ${escapeHtml(CHANNEL_THAI[creative.channel] ?? creative.channel)} · ส่งที่ ${escapeHtml(stageLabel(pack, creative.journeyStage))}</span></div>
    <div class="rounded-2xl border border-base-300 bg-base-200 p-4"><p class="gl-eyebrow">Bottleneck</p><strong class="block">${escapeHtml(bottleneck?.label ?? forecast.strategy.bottleneckStage)}</strong><span class="text-xs opacity-60">หลุด ${formatNumber(bottleneck?.dropOff, 1)} จุด</span></div>
    <div class="rounded-2xl border border-base-300 bg-base-200 p-4"><p class="gl-eyebrow">Confidence</p><strong class="block">${formatNumber(forecast.confidence)}%</strong><span class="text-xs opacity-60">${escapeHtml(forecast.confidenceLabel)} forecast · ${String(forecast.engine).startsWith('codex') ? 'Codex' : 'Local'}</span></div>`;
  $('#journey-rail').innerHTML = forecast.stageForecasts.map((stage, index) => {
    const passed = index < intendedIndex;
    const pct = Math.max(0, Math.min(100, Number(stage.probability)));
    return `<article class="${stage.stageId === forecast.strategy.bottleneckStage ? 'gl-stage-bottleneck' : ''} ${passed ? 'gl-stage-passed' : ''} flex w-56 shrink-0 snap-start flex-col gap-1.5 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div class="flex items-center justify-between text-xs"><span class="font-semibold opacity-60">${String(index + 1).padStart(2, '0')}</span>${stage.stageId === forecast.strategy.bottleneckStage ? '<span class="badge badge-error badge-xs">คอขวด</span>' : passed ? '<span class="badge badge-ghost badge-xs">ผ่านแล้ว</span>' : ''}</div>
      <strong class="leading-tight">${escapeHtml(stage.label)}</strong>
      <div class="gl-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="โอกาสผ่าน ${escapeHtml(stage.label)}"><span style="width:${pct}%"></span></div>
      <div class="flex items-baseline justify-between"><span class="font-display text-xl font-bold tabular-nums">${formatNumber(stage.probability, 1)}%</span><small class="opacity-60">−${formatNumber(stage.dropOff, 1)}</small></div>
      <p class="text-xs leading-snug">${escapeHtml(stage.nextBestAction)}</p>
      <footer class="mt-auto text-[11px] opacity-60">${escapeHtml(CHANNEL_THAI[stage.channel] ?? stage.channel)} · ${escapeHtml(stage.timing)}</footer>
    </article>`;
  }).join('');
  const personaMap = new Map(pack.personas.map((persona) => [persona.id, persona]));
  const paths = [...forecast.personaPaths].sort((left, right) => left.conversionProbability - right.conversionProbability);
  $('#journey-persona-table').innerHTML = `<table class="table table-sm"><caption class="sr-only">เส้นทางของแต่ละ persona เรียงจากโอกาสต่ำสุด</caption><thead><tr><th scope="col">Persona</th><th scope="col">ไปถึง</th><th scope="col">ติดที่</th><th scope="col">โอกาสถึงปลายทาง</th><th scope="col">ทำอะไรต่อ</th></tr></thead><tbody>${paths.map((path) => {
    const persona = personaMap.get(path.personaId);
    return `<tr class="cursor-pointer hover:bg-base-100" data-persona-id="${escapeHtml(path.personaId)}"><td><button type="button" class="link link-hover text-left font-semibold" data-persona-id="${escapeHtml(path.personaId)}">${escapeHtml(persona?.name ?? path.personaId)}</button><div class="text-xs opacity-60">${escapeHtml(persona?.role ?? '')}</div></td><td>${escapeHtml(stageLabel(pack, path.likelyNextStage))}</td><td>${escapeHtml(stageLabel(pack, path.bottleneckStage))}<div class="text-xs opacity-60">${escapeHtml(path.friction)}</div></td><td class="font-semibold tabular-nums">${formatNumber(path.conversionProbability, 1)}%</td><td class="text-xs">${escapeHtml(path.nextBestAction)}</td></tr>`;
  }).join('')}</tbody></table>`;
  $('#journey-assumptions').innerHTML = `<div class="card-body gap-3 p-4"><div class="flex items-baseline gap-2"><strong class="font-display text-2xl">${formatNumber(forecast.confidence)}%</strong><span class="text-sm opacity-60">${escapeHtml(forecast.confidenceLabel)}</span></div><ul class="list-disc space-y-1 pl-4 text-sm">${forecast.assumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join('')}</ul><div><p class="gl-eyebrow mb-1">Next best actions</p><ol class="list-decimal space-y-1 pl-4 text-sm">${forecast.strategy.nextBestActions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ol></div></div>`;
}

function setFormValues(form, values) {
  for (const [key, value] of Object.entries(values)) {
    if (!form.elements[key]) continue;
    form.elements[key].value = value ?? '';
  }
}

function commaList(value) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function parseList(value) {
  return String(value ?? '').split(/[,\n]/u).map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

function renderWeightTotal() {
  const form = $('#persona-editor');
  const total = ['weightHook', 'weightOffer', 'weightCopy', 'weightVisual'].reduce((sum, name) => sum + (Number(form.elements[name].value) || 0), 0);
  const node = $('#weight-total');
  node.textContent = `รวม ${total.toFixed(2)}`;
  node.classList.toggle('text-error', Math.abs(total - 1) >= 0.001);
}

function renderPackBuilder() {
  const pack = workspacePack();
  $('#pack-count').textContent = state.personaPacks.length;
  $('#pack-library').innerHTML = state.personaPacks.map((item) => `<button type="button" class="${item.id === pack.id ? 'gl-card-active' : ''} flex min-w-[12rem] shrink-0 flex-col items-start gap-0.5 rounded-xl border border-base-300 bg-base-200 p-3 text-left tap-44 lg:min-w-0" data-pack-id="${escapeHtml(item.id)}" ${item.id === pack.id ? 'aria-current="true"' : ''}><span class="badge badge-ghost badge-xs">${escapeHtml(item.businessModel.toUpperCase())}${BUILT_IN_IDS.has(item.id) ? ' · ตั้งต้น' : ''}</span><strong class="text-sm leading-snug">${escapeHtml(item.name)}</strong><small class="text-xs opacity-60">${item.personas.length} personas · ${escapeHtml(item.industry)}</small></button>`).join('');
  $('#pack-builtin-note').hidden = !BUILT_IN_IDS.has(pack.id);
  setFormValues($('#pack-form'), { name: pack.name, businessModel: pack.businessModel, industry: pack.industry, product: pack.product, primaryOutcome: pack.primaryOutcome, kpis: commaList(pack.kpis) });
  if (!pack.personas.some((persona) => persona.id === selectedPersonaId)) selectedPersonaId = pack.personas[0]?.id ?? '';
  $('#persona-editor-list').innerHTML = pack.personas.map((persona, index) => `<button type="button" class="${persona.id === selectedPersonaId ? 'gl-card-active' : ''} flex min-w-[10rem] shrink-0 items-baseline gap-2 rounded-lg border border-base-300 bg-base-200 px-2.5 py-2 text-left text-sm tap-44 md:min-w-0" data-edit-persona-id="${escapeHtml(persona.id)}" ${persona.id === selectedPersonaId ? 'aria-current="true"' : ''}><span class="text-xs opacity-50">${String(index + 1).padStart(2, '0')}</span><span class="min-w-0"><strong class="block truncate">${escapeHtml(persona.name)}</strong><small class="block truncate text-xs opacity-60">${escapeHtml(persona.role)}</small></span></button>`).join('');
  const persona = pack.personas.find((item) => item.id === selectedPersonaId) ?? pack.personas[0];
  if (!persona) return;
  setFormValues($('#persona-editor'), {
    id: persona.id, name: persona.name, role: persona.role, segment: persona.segment, decisionRole: persona.decisionRole,
    awareness: persona.awareness, threshold: persona.threshold, risk: persona.risk, priceSensitivity: persona.priceSensitivity,
    evidenceNeed: persona.evidenceNeed, urgency: persona.urgency, pains: commaList(persona.pains), outcomes: commaList(persona.outcomes),
    keywords: commaList(persona.keywords), objections: commaList(persona.objections), weightHook: persona.weights.hook,
    weightOffer: persona.weights.offer, weightCopy: persona.weights.copy, weightVisual: persona.weights.visual,
  });
  $('#persona-editor-error').textContent = '';
  renderWeightTotal();
}

function renderSettings() {
  setFormValues($('#settings-form'), state.workspace);
  const unreadable = (() => { try { return localStorage.getItem(UNREADABLE_KEY); } catch { return null; } })();
  const copies = readCopies();
  const synced = cloud.readOnly ? 'หยุดบันทึก (มีเวอร์ชันใหม่กว่า รีเฟรชหน้า)' : cloud.hold ? 'หยุดซิงก์ — ฉบับคลาวด์เปิดไม่ได้' : cloud.syncedAt ? `ซิงก์ล่าสุด ${new Date(cloud.syncedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}` : 'ยังไม่ได้ซิงก์';
  $('#privacy-summary').innerHTML = `<div class="card-body gap-3 p-4"><p class="gl-eyebrow">Privacy receipt</p><h2 class="font-display font-semibold">ข้อมูลไปที่ไหน?</h2>
    <dl class="space-y-2 text-sm">
      <div><dt class="font-semibold">ในเครื่อง + Supabase ของคุณปัน</dt><dd class="opacity-70">Touchpoint, Persona Pack, Journey และผลจริงเก็บในเบราว์เซอร์นี้ และซิงก์ขึ้นตาราง growth_lab_workspaces (เปิดได้เฉพาะบัญชีคุณปัน · ทุกฉบับที่ถูกเขียนทับเก็บไว้ 60 ฉบับล่าสุด) · ${escapeHtml(synced)} · rev ${cloud.rev ?? '—'}</dd></div>
      <div><dt class="font-semibold">⚡ ประเมินทันที (Local)</dt><dd class="opacity-70">คำนวณในเบราว์เซอร์ ไม่ส่งข้อความไปที่ไหน</dd></div>
      <div><dt class="font-semibold">🧠 Codex (มินิ)</dt><dd class="opacity-70">ส่ง Touchpoint + Persona Pack ไปคิว Mac mini แล้ว Codex CLI ประเมินแบบปิดเครื่องมือทั้งหมด (อ่าน/เขียนไฟล์ รันคำสั่ง ค้นเว็บไม่ได้) ใช้ quota Codex ของมินิ ไม่ใช้ Claude</dd></div>
    </dl>
    <p class="text-xs opacity-60">Backup JSON และ Export pack ไม่มี credential ใดๆ — ส่งไฟล์ .persona-pack.json ให้ลูกค้าต่อได้</p>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-sm tap-44" data-action="sync-now" ${cloud.readOnly ? 'disabled' : ''}>☁️ ซิงก์ตอนนี้</button>
      ${cloud.hold ? '<button type="button" class="btn btn-sm btn-warning tap-44" data-action="force-local">ใช้ฉบับในเครื่องนี้แทนบนคลาวด์</button>' : ''}
      ${cloud.unreadableState ? '<button type="button" class="btn btn-sm btn-warning tap-44" data-action="download-cloud-unreadable">↓ ฉบับคลาวด์ที่เปิดไม่ได้</button>' : ''}
      ${unreadable ? '<button type="button" class="btn btn-sm btn-warning tap-44" data-action="download-unreadable">↓ ข้อมูลในเครื่องที่เปิดไม่ได้</button>' : ''}
    </div>
    <div id="server-copies"><p class="text-xs opacity-60">กำลังโหลดฉบับที่เก็บไว้บนคลาวด์…</p></div>
    ${copies.length ? `<div><p class="gl-eyebrow mb-1">สำเนาที่เก็บในเครื่องตอนออฟไลน์ (${copies.length})</p><ul class="space-y-1 text-sm">${copies.map((copy, index) => `<li class="flex flex-wrap items-center justify-between gap-2"><span>${escapeHtml(copy.label)} · <span class="opacity-60">${escapeHtml(new Date(copy.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }))}</span></span><button type="button" class="btn btn-xs tap-44" data-action="download-copy" data-copy-index="${index}">↓ ดาวน์โหลด</button></li>`).join('')}</ul></div>` : ''}
  </div>`;
  void renderServerCopies();
}

const COPY_KIND_LABEL = { auto: 'ประวัติอัตโนมัติ', 'before-overwrite': 'ก่อนถูกเขียนทับโดยตั้งใจ', 'local-replaced': 'ฉบับที่ถูกแทนตอนชนกับอีกเครื่อง', 'cloud-before-repair': 'ฉบับคลาวด์ก่อนล้างผลที่ใช้ไม่ได้' };

function copyRow(copy) {
  return `<li class="flex flex-wrap items-center justify-between gap-2"><span>${escapeHtml(copy.label || COPY_KIND_LABEL[copy.kind] || copy.kind)} · <span class="opacity-60">${escapeHtml(new Date(copy.archived_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }))}${copy.device ? ` · ${escapeHtml(copy.device)}` : ''}</span></span><button type="button" class="btn btn-xs tap-44" data-action="download-server-copy" data-server-copy-id="${Number(copy.id)}">↓ เตรียมไฟล์</button></li>`;
}

async function renderServerCopies() {
  if (!$('#server-copies')) return;
  try {
    const { kept, history } = await listServerCopies();
    if (!$('#server-copies')) return;
    $('#server-copies').innerHTML = `
      <p class="gl-eyebrow mb-1">ฉบับที่เก็บไว้ก่อนถูกแทน (${kept.length})</p>
      ${kept.length ? `<ul class="space-y-1 text-sm">${kept.map(copyRow).join('')}</ul>` : '<p class="text-xs opacity-60">ยังไม่มี — จะเก็บให้เองเมื่อ Restore / Import / ชนกับอีกเครื่อง / ใช้ฉบับในเครื่องแทน</p>'}
      <p class="gl-eyebrow mb-1 mt-3">ประวัติอัตโนมัติ (ล่าสุด ${history.length})</p>
      ${history.length ? `<ul class="space-y-1 text-sm">${history.map(copyRow).join('')}</ul>` : '<p class="text-xs opacity-60">ยังไม่มี — เก็บให้ทุก 10 นาทีที่แก้ และทุกครั้งที่อีกเครื่องเขียนทับ</p>'}
      <p class="mt-1 text-xs opacity-60">ได้ไฟล์แล้วใช้ปุ่ม ↑ Restore JSON ที่ Workbench เพื่อกลับไปใช้ฉบับนั้น (ฉบับปัจจุบันจะถูกเก็บไว้ก่อน)</p>`;
  } catch {
    if ($('#server-copies')) $('#server-copies').innerHTML = '<p class="text-xs opacity-60">ตอนนี้โหลดรายการฉบับบนคลาวด์ไม่ได้ (ออฟไลน์?)</p>';
  }
}

function renderPersonaDirectory() {
  const pack = workspacePack();
  $('#persona-directory').innerHTML = pack.personas.map((persona, index) => `<article class="card border border-base-300 bg-base-200"><div class="card-body gap-1.5 p-4">
    <div class="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-60"><span>Seat ${String(index + 1).padStart(2, '0')} · ${escapeHtml(persona.segment)}</span><span>STOP ≥ ${formatNumber(persona.threshold)}</span></div>
    <h2 class="font-display font-semibold">${escapeHtml(persona.name)}</h2>
    <p class="text-sm opacity-70">${escapeHtml(persona.role)} · ${escapeHtml(persona.decisionRole)}</p>
    <div class="flex flex-wrap gap-1"><span class="badge badge-ghost badge-sm">Risk ${formatNumber(persona.risk)}/5</span><span class="badge badge-ghost badge-sm">Evidence ${formatNumber(persona.evidenceNeed)}/5</span><span class="badge badge-ghost badge-sm">Urgency ${formatNumber(persona.urgency)}/5</span><span class="badge badge-ghost badge-sm">Price ${formatNumber(persona.priceSensitivity)}/5</span></div>
    <p class="text-sm"><strong>คำค้าน:</strong> ${persona.objections.map(escapeHtml).join(' · ') || '—'}</p>
  </div></article>`).join('');
}

function pendingJobs() {
  try { return JSON.parse(localStorage.getItem(JOBS_KEY) ?? '{}') ?? {}; } catch { return {}; }
}

function savePendingJobs(jobs) {
  try { localStorage.setItem(JOBS_KEY, JSON.stringify(jobs)); } catch { /* quota — the recent-jobs scan still finds the result */ }
}

function pendingFor(creativeId) {
  return Object.entries(pendingJobs()).find(([, job]) => job.creativeId === creativeId) ?? null;
}

function renderProviderButton(label = '') {
  const button = $('#provider-button');
  const pending = pendingFor(selectedCreative()?.id);
  button.disabled = busy || Boolean(pending);
  if (label) { button.textContent = label; return; }
  button.textContent = pending ? `⏳ Codex กำลังประเมิน ${mmss(Math.round((Date.now() - pending[1].startedAt) / 1000))}` : '🧠 ประเมินลึกด้วย Codex (มินิ)';
}

function renderAll() {
  renderBrand();
  renderCreativeList();
  renderContextControls();
  fillCreativeForm();
  renderDecision();
  renderProviderButton();
  switchView(state.activeView || 'workbench', false);
}

function switchView(view, shouldPersist = true) {
  state.activeView = view;
  $$('[data-screen]').forEach((section) => { section.hidden = section.dataset.screen !== view; });
  $$('.gl-tab').forEach((button) => { if (button.dataset.view === view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (view === 'compare') renderCompare();
  if (view === 'journey') renderJourney();
  if (view === 'results') { renderActualForm(); renderCalibration(); }
  if (view === 'personas') { renderPackBuilder(); renderPersonaDirectory(); }
  if (view === 'settings') renderSettings();
  if (shouldPersist) persistView();
  revealInRail($('.gl-tabs'), $('.gl-tab[aria-current="page"]'));
}

// ---------- creative editing & evaluation ----------

function creativeFromForm() {
  const creative = { ...selectedCreative() };
  const formData = new FormData($('#creative-form'));
  for (const [key, value] of formData.entries()) creative[key] = String(value).trim();
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId) ?? selectedPack();
  creative.businessModel = pack.businessModel;
  if (!pack.journeyStages.some((stage) => stage.id === creative.journeyStage)) creative.journeyStage = pack.journeyStages[0].id;
  creative.updatedAt = new Date().toISOString();
  return creative;
}

function flushDraftSave() {
  if (!draftTimer) return;
  clearTimeout(draftTimer);
  draftTimer = 0;
  persist();
}

function queueDraftSave(event) {
  try {
    const hadEvaluation = Boolean(state.evaluations[selectedCreative().id]);
    state = updateCreativeDraft(state, creativeFromForm());
    setSaveState('กำลังบันทึก…');
    renderBudgets();
    if (hadEvaluation && !state.evaluations[selectedCreative().id]) {
      renderDecision();
      renderCreativeList();
      announce('ข้อความเปลี่ยนแล้ว — กดประเมินใหม่เพื่อไม่ตัดสินจากคะแนนเก่า');
    } else if (['name', 'channel', 'changedVariable'].includes(event.target.name)) {
      renderCreativeList();
      renderLegend(selectedCreative().channel);
    }
    clearTimeout(draftTimer);
    draftTimer = window.setTimeout(() => { draftTimer = 0; persist(); }, 300);
  } catch (error) {
    announce(`บันทึก draft ไม่สำเร็จ: ${error.message}`);
  }
}

function validateCreative(creative) {
  const required = ['name', 'hook', 'primaryText', 'headline', 'offer', 'cta', 'visualDirection'];
  const missing = required.find((field) => !creative[field]);
  if (!missing) { $('#creative-error').textContent = ''; return true; }
  const input = $('#creative-form').elements[missing];
  const label = input.closest('label')?.querySelector('.label-text')?.childNodes[0]?.textContent?.trim() ?? missing;
  $('#creative-error').textContent = `กรอก ${label} ก่อนประเมิน`;
  input.focus();
  return false;
}

function storeLocalBaseline(creative, pack) {
  const evaluation = { ...evaluateCreative(creative, pack.personas, pack), personaPackId: pack.id, personaPackRevision: personaPackRevision(pack), contentRevision: contentRevision(creative) };
  state.evaluations[creative.id] = evaluation;
  state.journeys[creative.id] = predictJourney(creative, pack.personas, evaluation, pack);
  return evaluation;
}

function evaluateLocal(creative = creativeFromForm()) {
  if (!validateCreative(creative)) return;
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId) ?? selectedPack();
  state = updateCreativeDraft(state, creative);
  state.selectedPersonaPackId = pack.id;
  const evaluation = storeLocalBaseline(creative, pack);
  persist(`ประเมินครบ ${pack.personas.length} ที่นั่งแล้ว: ${evaluation.verdict} · Stop ${formatNumber(evaluation.stopRate)}%`);
  renderAll();
  revealDecision();
}

// On phones the decision card sits below the long form — bring the result into view after a run.
function revealDecision() {
  if (window.matchMedia('(min-width: 1024px)').matches) return;
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#decision-title').closest('section')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

async function evaluateCodex() {
  if (busy) return;
  const creative = creativeFromForm();
  if (!validateCreative(creative)) return;
  if (pendingFor(creative.id)) { announce('Touchpoint นี้กำลังรอผล Codex อยู่แล้ว'); return; }
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId) ?? selectedPack();
  state = updateCreativeDraft(state, creative);
  state.selectedPersonaPackId = pack.id;
  storeLocalBaseline(creative, pack);
  persist(`เก็บผล Local ไว้ก่อนแล้ว กำลังส่ง ${pack.personas.length} ที่นั่งเข้าคิว Codex บน Mac mini…`);
  renderAll();
  busy = true;
  renderProviderButton('⏳ กำลังส่งเข้าคิว…');
  try {
    // The job payload is the exact content evaluated; the result is matched back against it, not against this tab's memory.
    const jobId = await enqueueCodexEvaluation(selectedCreative(), pack);
    savePendingJobs({ ...pendingJobs(), [jobId]: { creativeId: creative.id, startedAt: Date.now() } });
    busy = false;
    void followCodexJob(jobId);
  } catch (error) {
    busy = false;
    announce(`ส่งเข้าคิว Codex ไม่สำเร็จ: ${error.message} — ผล Local ยังอยู่`);
  } finally {
    renderProviderButton();
  }
}

function forgetJob(jobId) {
  const jobs = pendingJobs();
  delete jobs[jobId];
  savePendingJobs(jobs);
}

// Poll one job until it ends. Network blips (locked phone, flaky wifi) never drop the job — only an error status,
// a vanished row, or 30 minutes do. Closing the tab is fine: boot / focus resumes from JOBS_KEY.
async function followCodexJob(jobId) {
  if (following.has(jobId)) return;
  following.add(jobId);
  try {
    for (;;) {
      const tracked = pendingJobs()[jobId];
      if (!tracked) return;
      if (Date.now() - tracked.startedAt > JOB_MAX_AGE_MS) {
        forgetJob(jobId);
        announce('Codex ยังไม่เสร็จใน 30 นาที — ดูสถานะได้ที่คิวงานใน Content Center · ถ้าเสร็จทีหลัง เปิดหน้านี้ใหม่จะรับผลให้เอง');
        return;
      }
      let job = null;
      try { job = await readCodexJob(jobId); } catch (error) { console.warn('[growth-lab] job poll failed, retrying', error); }
      if (job === null) {
        // Either a network error (keep waiting) or the row is gone; a second read tells them apart.
        try { if ((await readCodexJob(jobId)) === null) { forgetJob(jobId); return; } } catch { /* still offline */ }
      } else if (job.status === 'done') {
        forgetJob(jobId);
        applyCodexJob(job, { announceSkip: true });
        return;
      } else if (job.status === 'error') {
        forgetJob(jobId);
        announce(`Codex ไม่สำเร็จ: ${job.error ?? 'ไม่ทราบสาเหตุ'} — ผล Local ยังใช้ได้`);
        return;
      }
      if (pendingFor(selectedCreative()?.id)?.[0] === jobId) renderProviderButton();
      await new Promise((resolve) => setTimeout(resolve, JOB_POLL_MS));
    }
  } finally {
    following.delete(jobId);
    renderProviderButton();
  }
}

function decidedJobs(source = state) {
  return Array.isArray(source.decidedJobs) ? source.decidedJobs.filter((id) => typeof id === 'string') : [];
}

function withDecided(source, jobId) {
  return { ...source, decidedJobs: [jobId, ...decidedJobs(source).filter((id) => id !== jobId)].slice(0, MAX_DECIDED_JOBS) };
}

const SKIP_COPY = {
  superseded: 'มีผล Codex ที่ใหม่กว่าของ Touchpoint นี้อยู่แล้ว จึงไม่ใช้ผลรอบก่อน',
  edited: 'ทิ้งผล Codex เพราะข้อความถูกแก้ระหว่างรอ — กดประเมินใหม่ได้เลย',
  'pack-changed': 'ทิ้งผล Codex เพราะ Persona Pack ถูกแก้ระหว่างรอ — กดประเมินใหม่ได้เลย',
  missing: 'ผล Codex กลับมาแต่ Touchpoint นั้นถูกลบไปแล้ว',
  invalid: 'ผลจาก Codex ไม่ครบ จึงไม่บันทึก — ผล Local ยังอยู่',
};

// The decision (applied or skipped) is stored in the synced state with the result itself, so every device agrees
// and a conflict that replaces the state also brings the job back for the next scan.
function applyCodexJob(job, { announceSkip = false } = {}) {
  if (decidedJobs().includes(job.id)) return false;
  const verdict = codexJobVerdict(job, state, personaPackRevision);
  if (!verdict.apply) {
    if (announceSkip && SKIP_COPY[verdict.reason]) announce(SKIP_COPY[verdict.reason]);
    if (verdict.reason !== 'invalid') commitLocal(withDecided(state, job.id));
    return false;
  }
  const { evaluation, journey } = job.result;
  const creativeId = job.creative.id;
  const candidate = withDecided(structuredClone(state), job.id);
  candidate.evaluations[creativeId] = { ...evaluation, sourceJobId: job.id, contentRevision: contentRevision(job.creative) };
  candidate.journeys[creativeId] = journey;
  const checked = validateState(candidate);
  if (checked.recovered || !checked.state.evaluations[creativeId] || !checked.state.journeys[creativeId]) {
    if (announceSkip) announce('ผลจาก Codex ไม่ผ่านการตรวจโครงสร้าง จึงไม่บันทึก — ผล Local ยังอยู่');
    return false;
  }
  state = checked.state;
  const name = state.creatives.find((item) => item.id === creativeId)?.name ?? 'Touchpoint';
  persist(`Codex ประเมิน “${name}” เสร็จ: ${evaluation.verdict} · Stop ${formatNumber(evaluation.stopRate)}%`);
  renderAll();
  if (creativeId === state.selectedCreativeId) revealDecision();
  return true;
}

// On boot / focus: keep following jobs started earlier, and pick up results that finished while no tab was
// watching (closed tab, or "ลองใหม่" from the Content Center queue).
async function resumeCodexJobs() {
  for (const jobId of Object.keys(pendingJobs())) void followCodexJob(jobId);
  try {
    const recent = await listRecentCodexJobs(new Date(Date.now() - JOB_MAX_AGE_MS).toISOString());
    for (const job of recent) if (!following.has(job.id)) applyCodexJob(job);
  } catch (error) {
    console.warn('[growth-lab] recent Codex jobs unavailable', error);
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function duplicateCreative() {
  const source = creativeFromForm();
  const id = newId('creative');
  const now = new Date().toISOString();
  const evaluation = state.evaluations[source.id];
  const changedVariable = evaluation?.nextHypothesis?.changedVariable ?? source.changedVariable;
  state.creatives.push({ ...source, id, name: `${source.name} — ทดสอบ ${changedVariable}`, changedVariable, createdAt: now, updatedAt: now });
  state.selectedCreativeId = id;
  persist(`สร้าง Variant สำเนาแล้ว — เปลี่ยนเฉพาะ ${changedVariable} เพื่อให้เทียบผลได้`);
  state.activeView = 'workbench';
  renderAll();
  $('#creative-form').elements[changedVariable === 'visual' ? 'visualDirection' : changedVariable === 'copy' ? 'primaryText' : changedVariable]?.focus();
}

function newCreative() {
  const source = selectedCreative();
  const id = newId('creative');
  const now = new Date().toISOString();
  state.creatives.push({ ...source, id, name: `Variant ${state.creatives.length + 1}`, hook: '', primaryText: '', headline: '', offer: '', cta: '', visualDirection: '', createdAt: now, updatedAt: now });
  state.selectedCreativeId = id;
  persist('สร้าง Variant เปล่าแล้ว');
  renderAll();
  $('#creative-form').elements.hook.focus();
}

// ---------- persona packs ----------

function commitPack(updated, message) {
  const validation = validatePersonaPack(updated);
  if (!validation.valid) throw new TypeError(`Persona Pack ไม่ถูกต้อง: ${validation.errors.join(', ')}`);
  state.personaPacks = state.personaPacks.map((pack) => pack.id === updated.id ? structuredClone(updated) : pack);
  state.selectedPersonaPackId = updated.id;
  const validStages = new Set(updated.journeyStages.map((stage) => stage.id));
  state.creatives = state.creatives.map((creative) => creative.personaPackId === updated.id ? {
    ...creative,
    businessModel: updated.businessModel,
    journeyStage: validStages.has(creative.journeyStage) ? creative.journeyStage : updated.journeyStages[0].id,
  } : creative);
  for (const creative of state.creatives.filter((item) => item.personaPackId === updated.id)) {
    delete state.evaluations[creative.id];
    delete state.journeys[creative.id];
  }
  persist(message);
  renderAll();
}

function savePack(event) {
  event.preventDefault();
  try {
    const pack = structuredClone(workspacePack());
    const data = new FormData(event.currentTarget);
    const nextModel = String(data.get('businessModel'));
    pack.name = String(data.get('name')).trim();
    pack.industry = String(data.get('industry')).trim();
    pack.product = String(data.get('product')).trim();
    pack.primaryOutcome = String(data.get('primaryOutcome')).trim();
    pack.kpis = parseList(data.get('kpis'));
    if (nextModel !== pack.businessModel) {
      pack.businessModel = nextModel;
      pack.journeyStages = structuredClone(BUILT_IN_PACKS.find((item) => item.businessModel === nextModel).journeyStages);
    }
    commitPack(pack, `บันทึก ${pack.name} แล้ว และล้างผลจำลองเก่าของ pack นี้`);
  } catch (error) { announce(error.message); }
}

function savePersona(event) {
  event.preventDefault();
  try {
    const pack = structuredClone(workspacePack());
    const data = new FormData(event.currentTarget);
    const persona = pack.personas.find((item) => item.id === String(data.get('id')));
    if (!persona) throw new TypeError('ไม่พบ persona ที่กำลังแก้');
    for (const key of ['name', 'role', 'segment', 'decisionRole', 'awareness']) persona[key] = String(data.get(key)).trim();
    for (const key of ['threshold', 'risk', 'priceSensitivity', 'evidenceNeed', 'urgency']) persona[key] = Number(data.get(key));
    for (const key of ['pains', 'outcomes', 'keywords', 'objections']) persona[key] = parseList(data.get(key));
    persona.weights = { hook: Number(data.get('weightHook')), offer: Number(data.get('weightOffer')), copy: Number(data.get('weightCopy')), visual: Number(data.get('weightVisual')) };
    const validation = validatePersonaPack(pack);
    if (!validation.valid) throw new TypeError(`แก้ persona ไม่สำเร็จ: ${validation.errors.join(', ')} — ตรวจช่วงคะแนน และ weights ต้องรวมเป็น 1`);
    commitPack(pack, `บันทึก persona ${persona.name} แล้ว และล้างผลจำลองเก่า`);
  } catch (error) { $('#persona-editor-error').textContent = error.message; }
}

function addPersona() {
  const pack = structuredClone(workspacePack());
  if (pack.personas.length >= 30) { announce('Persona Pack มีได้สูงสุด 30 personas'); return; }
  const source = pack.personas.find((item) => item.id === selectedPersonaId) ?? pack.personas[0];
  const id = newId('persona');
  pack.personas.push({ ...structuredClone(source), id, name: 'Persona ใหม่', role: 'ระบุบทบาท', keywords: ['เป้าหมาย'], pains: ['ปัญหาหลัก'], outcomes: ['ผลลัพธ์ที่ต้องการ'], objections: ['ข้อกังวลหลัก'] });
  selectedPersonaId = id;
  commitPack(pack, 'เพิ่ม persona ใหม่แล้ว ปรับรายละเอียดด้านล่างได้เลย');
}

function removePersona() {
  const pack = structuredClone(workspacePack());
  if (pack.personas.length <= 3) { announce('Persona Pack ต้องมีอย่างน้อย 3 personas'); return; }
  const target = pack.personas.find((persona) => persona.id === selectedPersonaId);
  pack.personas = pack.personas.filter((persona) => persona.id !== selectedPersonaId);
  selectedPersonaId = pack.personas[0].id;
  commitPack(pack, `ลบ ${target?.name ?? 'persona'} แล้ว`);
}

function clonePackForClient(newPack = false) {
  const source = workspacePack();
  const id = newId('pack');
  const copy = clonePersonaPack(source, id);
  if (newPack) {
    copy.name = `New ${source.businessModel.toUpperCase()} Persona Pack`;
    copy.industry = 'ระบุอุตสาหกรรม';
    copy.product = 'ระบุสินค้า/บริการ';
    copy.primaryOutcome = 'ระบุผลลัพธ์หลัก';
    copy.kpis = ['Conversion'];
  }
  state.personaPacks.push(copy);
  state.selectedPersonaPackId = id;
  selectedPersonaId = copy.personas[0].id;
  persist(newPack ? 'สร้าง Persona Pack ใหม่จากโครงที่ใช้งานได้แล้ว' : 'Clone แล้ว — แก้ให้ลูกค้าได้โดยไม่กระทบต้นฉบับ');
  renderPackBuilder();
  renderPersonaDirectory();
  renderContextControls();
}

function exportSelectedPack() {
  const pack = workspacePack();
  download(`${pack.id}.persona-pack.json`, exportPersonaPack(pack), 'application/json');
  announce('Export Persona Pack แล้ว — ไม่มี credential อยู่ในไฟล์');
}

async function importPack(file) {
  try {
    if (file.size > MAX_PERSONA_PACK_BYTES) throw new TypeError(`ไฟล์ใหญ่เกิน ${Math.round(MAX_PERSONA_PACK_BYTES / 1000)} KB`);
    const pack = structuredClone(importPersonaPack(await file.text()));
    if (state.personaPacks.some((item) => item.id === pack.id)) {
      pack.id = newId(`${pack.id.slice(0, 120)}-import`);
      pack.name = `${pack.name} — Imported`;
    }
    const validation = validatePersonaPack(pack);
    if (!validation.valid) throw new TypeError(`Persona Pack ไม่ถูกต้อง: ${validation.errors.join(', ')}`);
    state.personaPacks.push(pack);
    state.selectedPersonaPackId = pack.id;
    selectedPersonaId = pack.personas[0].id;
    persist(`Import ${pack.name} สำเร็จ`);
    renderAll();
  } catch (error) { announce(`Import Persona Pack ไม่สำเร็จ: ${error.message}`); }
}

// ---------- settings, results, files ----------

function saveSettings(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const accentColor = String(data.get('accentColor')).toLowerCase();
  const workspace = { appName: String(data.get('appName')).trim(), clientName: String(data.get('clientName')).trim(), accentColor, preferredProvider: 'local' };
  if (!workspace.appName || workspace.appName.length > 120 || workspace.clientName.length > 200 || !/^#[0-9a-f]{6}$/u.test(accentColor)) {
    $('#settings-error').textContent = 'ตรวจชื่อ workspace และสีรูปแบบ #RRGGBB';
    return;
  }
  state.workspace = workspace;
  $('#settings-error').textContent = '';
  persist('บันทึกชื่อ workspace แล้ว');
  renderBrand();
}

function saveActual(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const actual = { creativeId: String(formData.get('creativeId')), date: String(formData.get('date')) };
  for (const [field] of ACTUAL_FIELDS.slice(1)) actual[field] = Number(formData.get(field));
  const validation = validateActual(actual);
  if (!validation.valid) {
    const [field, message] = Object.entries(validation.errors)[0];
    $('#actual-error').textContent = `${field}: ${message}`;
    event.currentTarget.elements[field]?.focus();
    return;
  }
  state.selectedCreativeId = actual.creativeId;
  state.actuals[actual.creativeId] = actual;
  persist(`บันทึกผลจริงจาก ${CHANNEL_THAI[selectedCreative().channel] ?? selectedCreative().channel} แล้ว`);
  renderActualForm();
  renderCalibration();
}

function openPersona(personaId) {
  const persona = activePersonas().find((item) => item.id === personaId);
  if (!persona) return;
  const creative = selectedCreative();
  const result = state.evaluations[creative.id]?.personaResults.find((item) => item.personaId === personaId);
  $('#persona-dialog-content').innerHTML = `<p class="gl-eyebrow">${escapeHtml(persona.segment)} · เกณฑ์หยุด ${formatNumber(persona.threshold)}</p><h2 id="persona-dialog-title" class="font-display text-lg font-semibold">${escapeHtml(persona.name)}</h2><p class="text-sm opacity-70">${escapeHtml(persona.role)} · ${escapeHtml(persona.decisionRole)}</p>${result ? `
    <div class="my-3 flex items-baseline gap-3"><strong class="font-display text-2xl">${result.decision}</strong><span class="text-sm opacity-70">${formatNumber(result.score, 1)}/100 · มั่นใจ ${formatNumber(result.confidence * 100)}%</span></div>
    <div class="mb-3 flex flex-wrap gap-1">${Object.entries(result.componentScores).map(([key, score]) => `<span class="badge badge-ghost">${escapeHtml(componentLabel(key, creative.channel))} <b class="ml-1">${formatNumber(score)}</b></span>`).join('')}</div>
    <dl class="space-y-2 text-sm"><div><dt class="gl-eyebrow">Reaction</dt><dd>${escapeHtml(result.reaction)}</dd></div><div><dt class="gl-eyebrow">Friction</dt><dd>${escapeHtml(result.friction)}</dd></div><div><dt class="gl-eyebrow">Improvement</dt><dd>${escapeHtml(result.improvement)}</dd></div></dl>` : '<p class="mt-3 text-sm opacity-70">ยังไม่ได้ประเมิน Variant นี้</p>'}`;
  $('#persona-dialog').showModal();
}

async function restoreJson(file) {
  try {
    const restored = validateState(JSON.parse(await file.text()));
    if (restored.recovered) throw new Error('ไฟล์ไม่ตรงกับ schema version 1 หรือ 2');
    cloud.archiveNext = true;   // the cloud copy being replaced goes to history first
    commitLocal(withLocalUi(restored.state, state), `Restore ข้อมูลสำเร็จ — ฉบับคลาวด์เดิมถูกเก็บในประวัติ${restored.notice ? ` · ${restored.notice}` : ''}`);
    renderAll();
  } catch (error) { announce(`Restore ไม่สำเร็จ: ${error.message}`); }
}

async function importCsv(file) {
  const result = parseCsv(await file.text());
  const merged = applyCsvRecords(state, result.records);
  const validated = validateState(merged.state);
  if (merged.applied && validated.recovered) {
    $('#import-report').textContent = 'Import ไม่สำเร็จ: ข้อมูลทั้งชุดไม่ผ่าน schema จึงไม่เปลี่ยน workspace';
    return;
  }
  if (merged.applied) cloud.archiveNext = true;
  if (merged.applied && !commitLocal(validated.state)) {
    $('#import-report').textContent = 'Import ไม่สำเร็จ: บันทึกไม่ได้ จึงคืน workspace เดิม';
    return;
  }
  const errors = [...result.errors, ...merged.errors];
  $('#import-report').innerHTML = `<strong>นำเข้าสำเร็จ ${merged.applied} แถว</strong>${errors.length ? ` · ข้าม ${errors.length} แถว: ${errors.map((error) => `แถว ${error.row} (${escapeHtml(error.reasons.join('; '))})`).join(', ')}` : ' · ไม่พบข้อผิดพลาด'}`;
  renderAll();
}

function exportCsv() {
  const rows = state.creatives.map((creative) => ({ creative, evaluation: state.evaluations[creative.id], actual: state.actuals[creative.id] ?? { creativeId: creative.id } }));
  download(`growth-lab-${new Date().toISOString().slice(0, 10)}.csv`, `﻿${toCsv(rows)}`, 'text/csv;charset=utf-8');
  announce('ส่งออก CSV แล้ว');
}

function backupJson() {
  download(`growth-lab-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json');
  announce('Backup workspace แล้ว — ไฟล์ไม่มี API key หรือ credential');
}

// ---------- wiring ----------

function onClick(event) {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) { flushDraftSave(); switchView(viewButton.dataset.view); return; }
  const creativeButton = event.target.closest('[data-creative-id]');
  if (creativeButton) { flushDraftSave(); state.selectedCreativeId = creativeButton.dataset.creativeId; persistView(); renderAll(); return; }
  const packButton = event.target.closest('[data-pack-id]');
  if (packButton) { state.selectedPersonaPackId = packButton.dataset.packId; selectedPersonaId = ''; persistView(); renderPackBuilder(); renderPersonaDirectory(); return; }
  const personaEditButton = event.target.closest('[data-edit-persona-id]');
  if (personaEditButton) { selectedPersonaId = personaEditButton.dataset.editPersonaId; renderPackBuilder(); return; }
  const personaButton = event.target.closest('[data-persona-id]');
  if (personaButton) { openPersona(personaButton.dataset.personaId); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'duplicate') duplicateCreative();
  else if (action === 'new-creative') newCreative();
  else if (action === 'evaluate-provider') void evaluateCodex();
  else if (action === 'clone-pack') clonePackForClient(false);
  else if (action === 'new-pack') clonePackForClient(true);
  else if (action === 'export-pack') exportSelectedPack();
  else if (action === 'add-persona') addPersona();
  else if (action === 'remove-persona') {
    const persona = workspacePack().personas.find((item) => item.id === selectedPersonaId);
    $('#confirm-persona-name').textContent = persona?.name ?? 'persona นี้';
    $('#confirm-remove-dialog').showModal();
  } else if (action === 'confirm-remove-persona') { $('#confirm-remove-dialog').close(); removePersona(); }
  else if (action === 'cancel-remove-persona') $('#confirm-remove-dialog').close();
  else if (action === 'backup-json') backupJson();
  else if (action === 'export-csv') exportCsv();
  else if (action === 'sync-now') { cloud.tooLarge = false; cloud.sizeWarned = false; void syncFromCloud('manual').then(() => pushCloud()).then(renderSettingsIfOpen); }
  else if (action === 'force-local') forceUseLocal();
  else if (action === 'download-unreadable') { try { const raw = localStorage.getItem(UNREADABLE_KEY); if (raw) download('growth-lab-unreadable-local.json', raw, 'application/json'); } catch { /* storage blocked */ } }
  else if (action === 'download-cloud-unreadable') { if (cloud.unreadableState) download('growth-lab-cloud-unreadable.json', JSON.stringify(cloud.unreadableState, null, 2), 'application/json'); }
  else if (action === 'download-server-copy') {
    // Two taps: fetch first, then save on a fresh tap (phones block downloads that start after a slow await).
    const button = event.target.closest('[data-server-copy-id]');
    const id = Number(button?.dataset.serverCopyId);
    button.disabled = true;
    button.textContent = 'กำลังโหลด…';
    void fetchServerCopy(id).then((copy) => {
      if (!copy) { announce('ไม่พบฉบับนี้แล้ว'); return; }
      const json = JSON.stringify(copy, null, 2);
      announce(`ฉบับ #${id} พร้อมแล้ว`, { label: '↓ บันทึกไฟล์', run: () => download(`growth-lab-version-${id}.json`, json, 'application/json') });
    }).catch((error) => announce(`โหลดไม่สำเร็จ: ${error.message}`)).finally(() => { button.disabled = false; button.textContent = '↓ เตรียมไฟล์'; });
  }
  else if (action === 'download-copy') {
    const copy = readCopies()[Number(event.target.closest('[data-copy-index]')?.dataset.copyIndex)];
    if (copy) download(`growth-lab-${copy.kind}-${copy.at.slice(0, 19).replace(/[:T]/g, '-')}.json`, copy.json, 'application/json');
  }
}

function wire() {
  document.getElementById('growth-lab-app').addEventListener('click', onClick);
  $('#creative-form').addEventListener('submit', (event) => { event.preventDefault(); evaluateLocal(); });
  $('#creative-form').addEventListener('input', queueDraftSave);
  $('#creative-form').addEventListener('change', (event) => {
    if (event.target.name !== 'personaPackId') return;
    const pack = state.personaPacks.find((item) => item.id === event.target.value);
    if (!pack) return;
    state.selectedPersonaPackId = pack.id;
    const form = $('#creative-form');
    form.elements.businessModel.value = pack.businessModel;
    $('#journey-stage-select').innerHTML = pack.journeyStages.map((stage) => `<option value="${escapeHtml(stage.id)}">${escapeHtml(stage.label)}</option>`).join('');
    form.elements.journeyStage.value = pack.journeyStages[0].id;
    queueDraftSave(event);
    renderDecision();
    renderContextControls();
  });
  $('#actual-results-form').addEventListener('submit', saveActual);
  $('#actual-results-form').addEventListener('change', (event) => { if (event.target.name === 'creativeId') { state.selectedCreativeId = event.target.value; persistView(); renderAll(); } });
  $('#pack-form').addEventListener('submit', savePack);
  $('#persona-editor').addEventListener('submit', savePersona);
  $('#persona-editor').addEventListener('input', (event) => { if (String(event.target.name).startsWith('weight')) renderWeightTotal(); });
  $('#settings-form').addEventListener('submit', saveSettings);
  $('#json-restore').addEventListener('change', (event) => { if (event.target.files[0]) void restoreJson(event.target.files[0]); event.target.value = ''; });
  $('#csv-import').addEventListener('change', (event) => { if (event.target.files[0]) void importCsv(event.target.files[0]); event.target.value = ''; });
  $('#persona-pack-import').addEventListener('change', (event) => { if (event.target.files[0]) void importPack(event.target.files[0]); event.target.value = ''; });
  window.addEventListener('pagehide', () => { flushDraftSave(); if (!cloud.inherited) void pushCloud(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncFromCloud('focus').then(resumeCodexJobs);
    else { flushDraftSave(); if (!cloud.inherited) void pushCloud(); }   // the tab that made the edit pushes it
  });
  window.addEventListener('online', () => { void syncFromCloud('focus'); });
  window.addEventListener('storage', onStorage);
}

export async function boot() {
  const local = readEnvelope();
  state = local.state;
  cloud.rev = local.rev;
  cloud.dirty = local.dirty;
  cloud.hold = Boolean(local.hold);
  cloud.holdRev = local.holdRev ?? null;
  cloud.archiveNext = Boolean(local.archiveNext);
  cloud.syncedResults = local.syncedResults ?? {};
  wire();
  renderAll();
  if (local.notice) announce(local.notice);
  setSyncStatus('☁️ กำลังเช็คฉบับบนคลาวด์…');
  await syncFromCloud('boot');
  await resumeCodexJobs();
}
