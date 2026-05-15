import {
  login,
  getToken,
  clearToken,
  getDashboardData,
  getLead,
  updateLead,
  addLead,
  addInteraction,
  getLeadsPage,
  getExpenses,
  addExpense as apiAddExpense,
  deleteExpense as apiDeleteExpense,
  type DashboardData,
  type Interaction,
  type Kpis,
  type ExpenseRow,
  type ExpenseSummary,
} from './api';
import type { LeadUi } from './adapter';
import { pickTemplate } from './templates';

type FilterChip =
  | 'all'
  | 'today'
  | 'in_progress'
  | 'proposal_sent'
  | 'walkthrough_done'
  | 'won'
  | 'lost'
  | 'unqualified'
  | 'manual'
  | 'hot'
  | 'warm'
  | 'cold';

type SortMode = 'submitted_desc' | 'next_due_asc' | 'amount_desc';

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
  selectedLeadId: string | null;
  selectedLead: LeadUi | null;
  interactions: Interaction[];
  activeTab: 'leads' | 'expenses';
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
export async function tryLogin(pin: string): Promise<void> {
  await login(pin);
  state.authed = true;
  notify();
  await refresh();
}

export function logout(): void {
  clearToken();
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
  notify();
  emit('auth:logged_out');
}

// ------- Data flow -------
export async function refresh(): Promise<void> {
  const prevLeadCount = state.leads.length;
  state.loading = true;
  notify();
  try {
    const data: DashboardData = await getDashboardData();
    state.kpis = data.kpis;
    state.today = data.today;
    state.total = data.total;
    state.generatedAt = data.generated_at;
    if (data.expense_summary) {
      state.expenseSummary = data.expense_summary;
      state.expensesLoaded = true;
    }
    // Re-fetch extra pages if user had loaded more than initial 30
    if (prevLeadCount > data.leads.length && data.total > data.leads.length) {
      const extra = await getLeadsPage(data.leads.length, prevLeadCount - data.leads.length);
      state.leads = [...data.leads, ...extra.leads];
    } else {
      state.leads = data.leads;
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
}

export async function patchLead(leadId: string, fields: Partial<LeadUi>): Promise<void> {
  try {
    const res = await updateLead(leadId, fields);
    state.selectedLead = res.lead;
    mergeIntoLeadList(res.lead);
    notify();
    toast('บันทึกแล้ว');
    void refresh();
  } catch (err) {
    handleApiError(err, 'บันทึกไม่สำเร็จ');
  }
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
export function switchTab(tab: 'leads' | 'expenses'): void {
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

export function visibleLeads(): LeadUi[] {
  let rows = state.leads.slice();
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
      rows = rows.filter((r) => isDueByToday(r) && r.deal_outcome !== 'won' && r.deal_outcome !== 'lost');
      break;
    case 'in_progress':
      rows = rows.filter((r) => (r.deal_outcome || 'in_progress') === 'in_progress');
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
  console.error('api_error', err);
  toast(`${fallback}: ${e?.message || ''}`.trim(), 'error');
}

// ------- Init -------
export function initDashboard(): void {
  if (typeof window === 'undefined') return;
  if (getToken()) {
    state.authed = true;
    notify();
    void refresh();
  } else {
    notify();
  }
}
