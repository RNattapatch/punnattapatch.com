import {
  getDashboardDataSmart,
  signInToSupabase,
  signOutSupabase,
  getSupabaseSession,
  generateDoc,
  logPurchase,
  // All lead + expense reads/writes are Supabase-native (single source of truth —
  // writes land where reads come from, so edits stick instead of reverting).
  getLeadSmart as getLead,
  updateLeadSmart as updateLead,
  addLeadSmart as addLead,
  addInteractionSmart as addInteraction,
  getLeadsPageSmart as getLeadsPage,
  getLeadsInRangeSmart as getLeadsInRange,
  getExpensesSmart as getExpenses,
  addExpenseSmart as apiAddExpense,
  deleteExpenseSmart as apiDeleteExpense,
  editExpenseSmart as apiEditExpense,
} from './supabase';
import type {
  DashboardData,
  Interaction,
  Kpis,
  ExpenseRow,
  ExpenseSummary,
} from './api';
import type { LeadUi } from './adapter';
import { pickTemplate } from './templates';
import { rangeBounds, RANGE_LABELS, type RangeKey } from './date-range';
import { buildRangeDashboard, expensesInRange, summarizeExpensesInRange } from './dashboard-range';

export type { RangeKey };

type FilterChip =
  | 'all'
  | 'today'
  | 'in_progress'
  | 'proposal_sent'
  | 'walkthrough_done'
  | 'won'
  | 'repeat'
  | 'retainer'
  | 'lost'
  | 'unqualified'
  | 'sponsor'
  | 'manual'
  | 'hot'
  | 'warm'
  | 'cold'
  | 'after_hours';

type SortMode = 'submitted_desc' | 'next_due_asc' | 'amount_desc';

export type RangeSummary = {
  label: string;
  count: number;      // lead ที่เข้ามาในช่วงนี้
  won: number;        // ปิดได้ (won/repeat/retainer)
  lost: number;
  valueThb: number;   // ยอดรวมของดีลที่ปิดได้ในช่วง (หัก wht 3% ตามที่ตั้งไว้ที่ lead)
};

type State = {
  authed: boolean;
  loading: boolean;
  kpis: Kpis | null;
  today: LeadUi[];
  leads: LeadUi[];
  total: number;
  generatedAt: string | null;
  filter: FilterChip;
  sort: SortMode;
  search: string;
  // ── ช่วงเวลา ──
  // rangeLeads = ผลจากฐานข้อมูลของทั้งช่วง (ไม่แบ่งหน้า) · null = ยังไม่ได้เลือกช่วง (ดูแบบเดิม)
  // แยกจาก state.leads เพื่อไม่ให้ทับรายการที่ผู้ใช้กด "โหลดเพิ่ม" มาแล้ว
  range: RangeKey;
  rangeFrom: string | null;   // ISO — ต้นช่วง (รวม)
  rangeTo: string | null;     // ISO — ท้ายช่วง (ไม่รวม)
  rangeLeads: LeadUi[] | null;
  rangeExpenseSummary: ExpenseSummary | null;
  rangeLoading: boolean;
  selectedLeadId: string | null;
  selectedLead: LeadUi | null;
  interactions: Interaction[];
  activeTab: 'leads' | 'expenses' | 'war-room';
  expenses: ExpenseRow[];
  expenseSummary: ExpenseSummary | null;
  expensesLoaded: boolean;
};

const state: State = {
  authed: false,
  loading: false,
  kpis: null,
  today: [],
  leads: [],
  total: 0,
  generatedAt: null,
  filter: 'all',
  sort: 'submitted_desc',
  search: '',
  range: 'all',
  rangeFrom: null,
  rangeTo: null,
  rangeLeads: null,
  rangeExpenseSummary: null,
  rangeLoading: false,
  selectedLeadId: null,
  selectedLead: null,
  interactions: [],
  activeTab: 'leads',
  expenses: [],
  expenseSummary: null,
  expensesLoaded: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => {
    try { fn(); } catch (err) { console.error('listener_error', err); }
  });
}

export function getState(): Readonly<State> {
  return state;
}

/** Shared dashboard lens: use the complete selected cohort, not the first 30 leads. */
export function dashboardLeads(): LeadUi[] {
  return state.rangeLeads ?? state.leads;
}

export function dashboardKpis(): Kpis | null {
  return state.rangeLeads ? buildRangeDashboard(state.rangeLeads).kpis : state.kpis;
}

export function dashboardToday(): LeadUi[] {
  return state.rangeLeads ? buildRangeDashboard(state.rangeLeads).today : state.today;
}

export function dashboardExpenseSummary(): ExpenseSummary | null {
  return state.rangeExpenseSummary ?? state.expenseSummary;
}

export function dashboardExpenses(): ExpenseRow[] {
  if (!state.rangeFrom || !state.rangeTo) return state.expenses;
  return expensesInRange(state.expenses, new Date(state.rangeFrom), new Date(state.rangeTo));
}

export function hasDashboardRange(): boolean {
  return state.rangeLeads !== null;
}

export function dashboardRangeLabel(): string {
  return hasDashboardRange() ? RANGE_LABELS[state.range] : 'ทั้งหมด';
}

const bus = new EventTarget();
export function on(event: string, fn: (e: CustomEvent) => void): () => void {
  const handler = (e: Event) => fn(e as CustomEvent);
  bus.addEventListener(event, handler);
  return () => bus.removeEventListener(event, handler);
}
export function emit(event: string, detail?: unknown): void {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
}

// ------- Toast helper -------
export function toast(message: string, kind: 'success' | 'error' | 'info' = 'success'): void {
  emit('toast', { message, kind });
}

// ------- Auth flow -------
export async function tryLoginGoogle(idToken: string, nonce?: string): Promise<void> {
  // Pure Supabase auth: exchange the Google ID token for a Supabase session (RLS
  // owner_all gates the data). nonce = raw value matching the hash in the FedCM token.
  const ok = await signInToSupabase(idToken, nonce);
  if (!ok) throw new Error('เข้าสู่ระบบไม่สำเร็จ — ลองอีกครั้ง');
  state.authed = true;
  notify();
  await refresh();
}

export function logout(): void {
  void signOutSupabase();
  state.authed = false;
  state.kpis = null;
  state.today = [];
  state.leads = [];
  state.selectedLeadId = null;
  state.selectedLead = null;
  state.interactions = [];
  state.activeTab = 'leads';
  state.expenses = [];
  state.expenseSummary = null;
  state.expensesLoaded = false;
  state.range = 'all';
  state.rangeFrom = null;
  state.rangeTo = null;
  state.rangeLeads = null;
  state.rangeExpenseSummary = null;
  notify();
  emit('auth:logged_out');
}

// ------- Data flow -------
export async function refresh(): Promise<void> {
  const prevLeadCount = state.leads.length;
  state.loading = true;
  notify();
  try {
    const data: DashboardData = await getDashboardDataSmart();
    state.kpis = data.kpis;
    state.today = data.today;
    state.total = data.total;
    state.generatedAt = data.generated_at;
    if (data.expense_summary) {
      state.expenseSummary = data.expense_summary;
      // expensesLoaded stays false until loadExpenses() populates state.expenses rows.
      // If user is already on expenses tab when refresh runs, reload rows too.
      if (state.activeTab === 'expenses') void loadExpenses();
    }
    // Re-fetch extra pages if user had loaded more than initial 30
    if (prevLeadCount > data.leads.length && data.total > data.leads.length) {
      const extra = await getLeadsPage(data.leads.length, prevLeadCount - data.leads.length);
      state.leads = [...data.leads, ...extra.leads];
    } else {
      state.leads = data.leads;
    }
    // เลือกช่วงเวลาค้างไว้ → ดึงช่วงนั้นใหม่ด้วย ไม่งั้นกดรีเฟรชแล้วรายการค้างของเก่า
    if (state.rangeFrom && state.rangeTo) {
      const [leadResult, expenseResult] = await Promise.all([
        getLeadsInRange(state.rangeFrom, state.rangeTo),
        getExpenses(),
      ]);
      state.rangeLeads = leadResult.leads;
      state.expenses = expenseResult.rows;
      state.expensesLoaded = true;
      state.rangeExpenseSummary = summarizeExpensesInRange(
        expenseResult.rows, new Date(state.rangeFrom), new Date(state.rangeTo)
      );
    }
  } catch (err) {
    handleApiError(err, 'โหลดข้อมูลไม่สำเร็จ');
  } finally {
    state.loading = false;
    notify();
  }
}

export async function loadMore(): Promise<void> {
  if (state.leads.length >= state.total) return;
  try {
    const page = await getLeadsPage(state.leads.length, 30);
    state.leads = [...state.leads, ...page.leads];
    state.total = page.total;
    notify();
  } catch (err) {
    handleApiError(err, 'โหลดเพิ่มไม่สำเร็จ');
  }
}

export async function openLead(leadId: string): Promise<void> {
  state.selectedLeadId = leadId;
  state.selectedLead = state.leads.find((l) => l.lead_id === leadId) || null;
  state.interactions = [];
  notify();
  emit('drawer:open', { leadId });
  try {
    const data = await getLead(leadId);
    state.selectedLead = data.lead;
    state.interactions = data.interactions;
    mergeIntoLeadList(data.lead);
    notify();
  } catch (err) {
    handleApiError(err, 'โหลดข้อมูลผู้สนใจไม่สำเร็จ');
  }
}

export function closeLead(): void {
  state.selectedLeadId = null;
  state.selectedLead = null;
  state.interactions = [];
  notify();
  emit('drawer:close');
}

function mergeIntoLeadList(lead: LeadUi): void {
  if (!lead.lead_id) return;
  const idx = state.leads.findIndex((l) => l.lead_id === lead.lead_id);
  if (idx >= 0) {
    state.leads = [...state.leads.slice(0, idx), lead, ...state.leads.slice(idx + 1)];
  }
  const tIdx = state.today.findIndex((l) => l.lead_id === lead.lead_id);
  if (tIdx >= 0) {
    state.today = [...state.today.slice(0, tIdx), lead, ...state.today.slice(tIdx + 1)];
  }
  // รายการของช่วงเวลาเป็นคนละชุดกับ state.leads — ถ้าไม่อัปเดตด้วย
  // แก้สถานะจากในช่วงเวลาแล้วการ์ดจะเด้งกลับค่าเดิมทันทีที่ re-render
  if (state.rangeLeads) {
    const rIdx = state.rangeLeads.findIndex((l) => l.lead_id === lead.lead_id);
    if (rIdx >= 0) {
      state.rangeLeads = [...state.rangeLeads.slice(0, rIdx), lead, ...state.rangeLeads.slice(rIdx + 1)];
    }
  }
}

export async function patchLead(leadId: string, fields: Partial<LeadUi>): Promise<void> {
  try {
    const res = await updateLead(leadId, fields);
    state.selectedLead = res.lead;
    mergeIntoLeadList(res.lead);
    notify();
    if (res.dropped_fields && res.dropped_fields.length) {
      toast(`บันทึกไม่ครบ — Sheet ไม่มีคอลัมน์: ${res.dropped_fields.join(', ')} (รัน runEnsureCrmColumns ใน Apps Script)`, 'error');
    } else {
      toast('บันทึกแล้ว');
    }
    void refresh();
  } catch (err) {
    handleApiError(err, 'บันทึกไม่สำเร็จ');
  }
}

// Unified status setter — the single "Pipeline Stage" dropdown writes here.
// Maps the chosen option to pipeline_status + deal_outcome (won/lost/repeat/retainer)
// so won/lost/repeat/retainer all live in one control. Saves immediately.
const PIPELINE_STAGES = ['New', 'Discovery Call', 'Site Visit', 'Proposal Sent', 'Proposal — Follow-up'];
export async function setLeadStatus(leadId: string, statusKey: string, closeReason?: string): Promise<void> {
  const fields: Partial<LeadUi> = {};
  if (PIPELINE_STAGES.includes(statusKey)) {
    fields.pipeline_status = statusKey;
    fields.deal_outcome = 'in_progress';
  } else if (statusKey === 'won' || statusKey === 'repeat' || statusKey === 'retainer') {
    fields.deal_outcome = statusKey as LeadUi['deal_outcome'];
  } else if (statusKey === 'lost' || statusKey === 'unqualified') {
    fields.deal_outcome = statusKey as LeadUi['deal_outcome'];
    if (closeReason) fields.close_reason = closeReason;
  } else {
    return;
  }
  await patchLead(leadId, fields);
}

export async function createLead(fields: Partial<LeadUi>): Promise<LeadUi | null> {
  try {
    const res = await addLead(fields);
    state.leads = [res.lead, ...state.leads];
    state.total = state.total + 1;
    notify();
    toast('เพิ่ม lead แล้ว');
    void refresh();
    return res.lead;
  } catch (err) {
    handleApiError(err, 'เพิ่ม lead ไม่สำเร็จ');
    return null;
  }
}

export async function logInteraction(
  leadId: string,
  type: Interaction['type'],
  summary: string
): Promise<void> {
  try {
    const res = await addInteraction(leadId, type, summary);
    state.interactions = [res.interaction, ...state.interactions];
    if (res.lead) {
      state.selectedLead = res.lead;
      mergeIntoLeadList(res.lead);
    }
    notify();
    toast('บันทึก interaction แล้ว');
  } catch (err) {
    handleApiError(err, 'บันทึก interaction ไม่สำเร็จ');
  }
}

export async function createProposalTask(leadId: string): Promise<void> {
  const due = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await patchLead(leadId, { next_action: 'ส่ง proposal', next_action_due: due });
  await logInteraction(leadId, 'note', 'กำหนดส่ง proposal');
}

// Generate QO/Invoice/Receipt for a lead → download PDF (+ optional LINE push).
// Sends lead_id (Supabase uuid) — the doc-api resolves the full lead from Supabase
// (name / tax_id / address / package / tax_mode) and links the document to the lead.
export type DocItem = { description: string; quantity: number; unit: string; unit_price: number };

export async function generateDocFor(
  lead: LeadUi,
  docType: 'qo' | 'invoice' | 'receipt',
  deliver: boolean,
  opts?: { items?: DocItem[]; tax_mode?: string; note?: string }
): Promise<boolean> {
  const leadId = ((lead as Record<string, unknown>).lead_id ?? '').toString().trim();
  if (!leadId) { toast('ลูกค้านี้ไม่มี id — เปิดการ์ดใหม่อีกครั้ง', 'error'); return false; }
  toast('กำลังออกเอกสาร...', 'info');
  try {
    const spec: Record<string, unknown> = { doc_type: docType, lead_id: leadId, valid_days: 7, deliver };
    if (opts?.items && opts.items.length) spec.items = opts.items;
    if (opts?.tax_mode) spec.tax_mode = opts.tax_mode;
    if (opts?.note) spec.note = opts.note;
    const r = await generateDoc(spec);
    toast(`✅ ${r.doc_number} พร้อมแล้ว${deliver ? ' · ส่ง LINE แล้ว' : ''}`);
    if (r.pdf_url && typeof window !== 'undefined') window.open(r.pdf_url, '_blank');
    void refresh();
    return true;
  } catch (err) {
    handleApiError(err, 'ออกเอกสารไม่สำเร็จ');
    return false;
  }
}

// Log a repeat/manual sale into the LTV ledger (no document). Flips the lead to
// won/repeat and refreshes so the LTV badge + KPIs update immediately.
export async function logRepeatPurchaseFor(
  lead: LeadUi,
  data: { package?: string; amount_thb: number; tax_mode?: 'cash' | 'wht_3' | 'vat_7'; note?: string }
): Promise<boolean> {
  const leadId = ((lead as Record<string, unknown>).lead_id ?? '').toString().trim();
  if (!leadId) { toast('ลูกค้านี้ไม่มี id — เปิดการ์ดใหม่อีกครั้ง', 'error'); return false; }
  try {
    const r = await logPurchase({ lead_id: leadId, ...data });
    toast(`🔁 บันทึกการซื้อแล้ว · ครั้งที่ ${r.purchase_count} · LTV ฿${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Number(r.lifetime_value_thb) || 0)}`);
    void refresh();
    return true;
  } catch (err) {
    handleApiError(err, 'บันทึกการซื้อไม่สำเร็จ');
    return false;
  }
}

export function copyFollowUp(lead: LeadUi): void {
  const text = pickTemplate(lead);
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => toast('คัดลอกแล้ว'),
      () => toast('คัดลอกไม่สำเร็จ', 'error')
    );
  } else {
    toast('เบราว์เซอร์ไม่รองรับ clipboard', 'error');
  }
}

// ------- Expense tab -------
export function switchTab(tab: 'leads' | 'expenses' | 'war-room'): void {
  state.activeTab = tab;
  notify();
  if (tab === 'expenses' && !state.expensesLoaded) {
    void loadExpenses();
  }
}

export async function loadExpenses(): Promise<void> {
  try {
    const data = await getExpenses();
    state.expenses = data.rows;
    state.expenseSummary = data.summary;
    if (state.rangeFrom && state.rangeTo) {
      state.rangeExpenseSummary = summarizeExpensesInRange(
        data.rows, new Date(state.rangeFrom), new Date(state.rangeTo)
      );
    }
    state.expensesLoaded = true;
    notify();
  } catch (err) {
    handleApiError(err, 'โหลดค่าใช้จ่ายไม่สำเร็จ');
  }
}

export async function createExpense(data: {
  date: string;
  category: string;
  amount_thb: number;
  description: string;
}): Promise<boolean> {
  try {
    await apiAddExpense(data);
    await loadExpenses();
    toast('บันทึกค่าใช้จ่ายแล้ว');
    return true;
  } catch (err) {
    handleApiError(err, 'บันทึกค่าใช้จ่ายไม่สำเร็จ');
    return false;
  }
}

export async function removeExpense(id: string): Promise<void> {
  try {
    await apiDeleteExpense(id);
    await loadExpenses();
    toast('ลบค่าใช้จ่ายแล้ว');
  } catch (err) {
    handleApiError(err, 'ลบค่าใช้จ่ายไม่สำเร็จ');
  }
}

export async function updateExpense(id: string, data: {
  date: string;
  category: string;
  amount_thb: number;
  description: string;
}): Promise<boolean> {
  try {
    await apiEditExpense(id, data);
    await loadExpenses();
    toast('แก้ไขค่าใช้จ่ายแล้ว');
    return true;
  } catch (err) {
    handleApiError(err, 'แก้ไขค่าใช้จ่ายไม่สำเร็จ');
    return false;
  }
}

// ------- Filtering / sorting (client-side) -------
export function setFilter(f: FilterChip): void {
  state.filter = f;
  notify();
}
export function setSort(s: SortMode): void {
  state.sort = s;
  notify();
}
export function setSearch(q: string): void {
  state.search = q;
  notify();
}

// ------- ช่วงเวลา (ถามฐานข้อมูลเสมอ — ดูเหตุผลที่ getLeadsInRangeSmart) -------
// ตรรกะขอบเขตวันอยู่ใน date-range.ts (ฟังก์ชันบริสุทธิ์ + มีเทสต์)

export async function setRange(key: RangeKey, customFrom?: string, customTo?: string): Promise<void> {
  const bounds = rangeBounds(key, customFrom, customTo);
  state.range = key;
  if (!bounds) {
    // 'all' หรือ custom ที่ยังกรอกไม่ครบ → กลับไปดูแบบแบ่งหน้าเหมือนเดิม
    state.rangeFrom = null;
    state.rangeTo = null;
    state.rangeLeads = null;
    state.rangeExpenseSummary = null;
    notify();
    return;
  }
  state.rangeFrom = bounds.from.toISOString();
  state.rangeTo = bounds.to.toISOString();
  state.rangeLoading = true;
  notify();
  try {
    const [leadResult, expenseResult] = await Promise.all([
      getLeadsInRange(state.rangeFrom, state.rangeTo),
      getExpenses(),
    ]);
    state.rangeLeads = leadResult.leads;
    state.expenses = expenseResult.rows;
    state.expensesLoaded = true;
    state.rangeExpenseSummary = summarizeExpensesInRange(
      expenseResult.rows, new Date(state.rangeFrom), new Date(state.rangeTo)
    );
  } catch (err) {
    state.rangeLeads = null;
    handleApiError(err, 'ดึง lead ตามช่วงเวลาไม่สำเร็จ');
  } finally {
    state.rangeLoading = false;
    notify();
  }
}

/** สรุปตัวเลขของช่วงที่เลือก — null เมื่อยังไม่ได้เลือกช่วง */
export function rangeSummary(): RangeSummary | null {
  if (!state.rangeLeads || !state.rangeFrom || !state.rangeTo) return null;
  const rows = state.rangeLeads;
  const isWon = (r: LeadUi) => ['won', 'repeat', 'retainer'].includes(String(r.deal_outcome || ''));
  const fmtD = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  // ท้ายช่วงเป็นแบบไม่รวม — ถอยหนึ่งวันตอนแสดงผล ไม่งั้น "เดือนนี้" จะอ่านว่าเลยไปวันที่ 1 เดือนหน้า
  const lastDay = new Date(new Date(state.rangeTo).getTime() - 864e5).toISOString();
  return {
    label: `${RANGE_LABELS[state.range]} · ${fmtD(state.rangeFrom)} – ${fmtD(lastDay)}`,
    count: rows.length,
    won: rows.filter(isWon).length,
    lost: rows.filter((r) => r.deal_outcome === 'lost').length,
    valueThb: rows.filter(isWon).reduce(
      (sum, r) => sum + (Number(r.package_price) || 0) * (r.tax_mode === 'wht_3' ? 0.97 : 1), 0),
  };
}

export function visibleLeads(): LeadUi[] {
  // เลือกช่วงเวลาอยู่ → ใช้ผลจากฐานข้อมูลทั้งช่วง ไม่ใช่ 30 แถวที่โหลดมา
  let rows = (state.rangeLeads ?? state.leads).slice();
  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    rows = rows.filter((r) => {
      const hay = [
        r.full_name, r.nickname, r.company_name, r.phone,
      ].map((v) => (v || '').toString().toLowerCase()).join(' ');
      return hay.includes(q);
    });
  }
  switch (state.filter) {
    case 'today':
      rows = rows.filter((r) => isDueByToday(r) && r.deal_outcome !== 'won' && r.deal_outcome !== 'repeat' && r.deal_outcome !== 'retainer' && r.deal_outcome !== 'lost');
      break;
    case 'retainer':
      rows = rows.filter((r) => r.deal_outcome === 'retainer');
      break;
    case 'sponsor':
      rows = rows.filter((r) => (r.source || '').toString().toLowerCase().includes('sponsor'));
      break;
    case 'in_progress':
      rows = rows.filter((r) => (r.deal_outcome || 'in_progress') === 'in_progress');
      break;
    case 'repeat':
      rows = rows.filter((r) => r.deal_outcome === 'repeat' || (Number(r.purchase_count) || 0) > 1);
      break;
    case 'proposal_sent':
      rows = rows.filter((r) => !!r.proposal_sent_at);
      break;
    case 'walkthrough_done':
      rows = rows.filter((r) => !!r.walkthrough_at);
      break;
    case 'won':
      rows = rows.filter((r) => r.deal_outcome === 'won');
      break;
    case 'lost':
      rows = rows.filter((r) => r.deal_outcome === 'lost');
      break;
    case 'unqualified':
      rows = rows.filter((r) => r.deal_outcome === 'unqualified');
      break;
    case 'manual':
      rows = rows.filter((r) => (r.manual_source || '') !== '' && r.manual_source !== 'intake-form');
      break;
    case 'hot':
      rows = rows.filter((r) => r.temperature === 'hot');
      break;
    case 'warm':
      rows = rows.filter((r) => r.temperature === 'warm');
      break;
    case 'cold':
      rows = rows.filter((r) => r.temperature === 'cold');
      break;
    // 🌒 คนที่ตอบว่ารับสายนอกเวลาทำการได้ — ใช้ตอนว่างช่วงเย็น/เสาร์-อาทิตย์
    // เทียบ true ตรงๆ: false = ขอในเวลาทำการ, null = ไม่ได้ถาม (ทั้งคู่ไม่ควรโทรตอนดึก)
    case 'after_hours':
      rows = rows.filter((r) => r.after_hours_ok === true);
      break;
  }
  switch (state.sort) {
    case 'next_due_asc':
      rows.sort((a, b) => {
        const av = a.next_action_due ? new Date(a.next_action_due).getTime() : Infinity;
        const bv = b.next_action_due ? new Date(b.next_action_due).getTime() : Infinity;
        return av - bv;
      });
      break;
    case 'amount_desc':
      rows.sort((a, b) => (Number(b.package_price) || 0) - (Number(a.package_price) || 0));
      break;
    default:
      rows.sort((a, b) => {
        const av = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const bv = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return bv - av;
      });
  }
  return rows;
}

function isDueByToday(r: LeadUi): boolean {
  if (!r.next_action_due) return false;
  const due = new Date(r.next_action_due).getTime();
  if (!Number.isFinite(due)) return false;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return due <= end.getTime();
}

function handleApiError(err: unknown, fallback: string): void {
  const e = err as Error & { code?: string };
  if (e?.code === 'invalid_token') {
    state.authed = false;
    notify();
    emit('auth:expired');
    toast('เซสชันหมดอายุ ใส่ PIN อีกครั้ง', 'error');
    return;
  }
  // แท็บที่เปิดค้างไว้ถือ lead ที่ถูกลบ/merge ไปแล้ว → Postgres ตีกลับด้วย FK violation (23503)
  // ข้อความดิบอ่านไม่รู้เรื่อง ("violates foreign key constraint interactions_lead_id_fkey")
  // และผู้ใช้ไม่รู้ว่าต้องรีเฟรช — แปลเป็นภาษาคน แล้วดึงข้อมูลใหม่ให้เลย
  if (isStaleLeadError(e)) {
    console.error('api_error (stale lead)', err);
    toast('ลูกค้ารายนี้ถูกลบหรือรวมกับรายอื่นแล้ว — กำลังโหลดข้อมูลใหม่', 'error');
    closeLead();
    void refresh();
    return;
  }
  console.error('api_error', err);
  toast(`${fallback}: ${e?.message || ''}`.trim(), 'error');
}

/** FK violation ที่ชี้ไปตาราง leads = record ที่เปิดค้างอยู่หายไปแล้ว (ลบ/merge จากที่อื่น) */
function isStaleLeadError(e: Error & { code?: string }): boolean {
  const msg = `${e?.code || ''} ${e?.message || ''}`.toLowerCase();
  return msg.includes('23503') || (msg.includes('foreign key') && msg.includes('lead_id'));
}

// ------- Init -------
export function initDashboard(): void {
  if (typeof window === 'undefined') return;
  // Restore the persisted Supabase session (localStorage) on load.
  void (async () => {
    const session = await getSupabaseSession();
    if (session) {
      state.authed = true;
      notify();
      await refresh();
    } else {
      notify();
    }
  })();
}
