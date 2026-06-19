// Supabase data layer for the dashboard — SINGLE SOURCE OF TRUTH.
//
// All reads AND writes go to Supabase (Postgres + RLS owner_all). Auth is a pure
// Supabase Google session (signInWithIdToken). The legacy Apps Script / Google
// Sheets backend has been retired — api.ts now only holds shared TYPES.
// Reason for the migration: keeping reads on Supabase but writes on Sheets made
// edits silently revert (no live sync). One datastore = no divergence.

import { createClient, type Session } from '@supabase/supabase-js';
import type { DashboardData, Interaction, ExpenseRow, ExpenseSummary, ExpensesData } from './api';
import type { LeadUi } from './adapter';

export const SUPABASE_URL = 'https://yykocvhorgcgzaluuldn.supabase.co';

// Anon key — PUBLIC by design (ships in the browser bundle). Security does NOT
// depend on hiding it: Row Level Security only lets the owner's authenticated
// session read rows (anon sees 0). Same trust model as the GOOGLE_CLIENT_ID.
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a29jdmhvcmdjZ3phbHV1bGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjYwNTYsImV4cCI6MjA5NTgwMjA1Nn0.04ya1crnMRK6SgLfwhhxIp14DQ1n_ZkY5Fj-urTsv1E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export async function getSupabaseSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Bridge: exchange a Google ID token (from GIS) for a Supabase session so RLS
// reads work. Never throws — a failure here must not block the GAS login.
export async function signInToSupabase(idToken: string, nonce?: string): Promise<boolean> {
  try {
    // nonce: raw value whose SHA-256 hash is embedded in the FedCM ID token.
    // Supabase rejects the token if the nonces don't match (or one is missing).
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce });
    if (error) {
      console.error('[supabase] signInWithIdToken failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[supabase] signInWithIdToken threw:', err);
    return false;
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[supabase] signOut failed:', err);
  }
}

// Read path: Supabase RPC get_dashboard_data (computed in Postgres, RLS-scoped).
export async function getDashboardDataSmart(): Promise<DashboardData> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { data, error } = await supabase.rpc('get_dashboard_data');
  if (error) throw new Error(error.message);
  return data as DashboardData;
}

const DOC_API_URL = 'https://doc-api.punnattapatch.com/generate';

// Generate a document via the Mac mini doc-api, authenticated with the current
// Supabase session JWT (owner-only, verified server-side). Returns a signed PDF URL.
export async function generateDoc(
  spec: Record<string, unknown>
): Promise<{ doc_number: string; pdf_url: string; png_url?: string; grand_total?: number; line_sent?: boolean }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('ยังไม่ได้เข้าสู่ระบบ Supabase — ออกแล้วล็อกอินใหม่');
  const res = await fetch(DOC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(spec),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || `doc-api ${res.status}`);
  return json as { doc_number: string; pdf_url: string; png_url?: string; grand_total?: number; line_sent?: boolean };
}

const PURCHASE_API_URL = 'https://doc-api.punnattapatch.com/purchase';

// Log a repeat/manual sale into the LTV ledger (Supabase, via doc-api service_role).
// Flips the lead to won/repeat and returns the updated aggregates. Authenticated
// with the Supabase session JWT — same trust model as generateDoc.
export async function logPurchase(spec: {
  lead_id: string;
  package?: string;
  amount_thb: number;
  tax_mode?: 'cash' | 'wht_3' | 'vat_7';
  note?: string;
}): Promise<{ purchase_count: number; lifetime_value_thb: number; deal_outcome: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('ยังไม่ได้เข้าสู่ระบบ Supabase — ออกแล้วล็อกอินใหม่');
  const res = await fetch(PURCHASE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(spec),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || `purchase-api ${res.status}`);
  return json as { purchase_count: number; lifetime_value_thb: number; deal_outcome: string };
}

// ──────────────────────────────────────────────────────────────────────────
// Lead reads/writes — Supabase-native (browser client under RLS owner_all).
//
// WHY: the dashboard READS leads from Supabase (RPC get_dashboard_data), but the
// legacy write path went to Apps Script → Google Sheets (one-time migration, no
// live sync). So a status change saved to Sheets never reached Supabase, and the
// next refresh() re-read Supabase and reverted the card/kanban. Writing to
// Supabase (where reads live) makes edits stick. Falls back to Apps Script only
// when there's no Supabase session (so login still degrades gracefully).
// ──────────────────────────────────────────────────────────────────────────

// Real, writable columns on public.leads (everything else — score/tier/raw_payload
// /purchase_count/etc — is derived or lives in raw_payload, never written here).
const LEAD_COLS = new Set([
  'full_name', 'nickname', 'company_name', 'business_type', 'position', 'phone', 'email', 'line_id',
  'fact_1', 'fact_2', 'fact_3', 'pipeline_status', 'temperature', 'deal_outcome', 'close_reason',
  'package', 'package_price', 'deal_value_thb', 'tax_mode', 'crm_notes', 'next_action', 'pain_points',
  'source', 'payment_status', 'manual_source', 'tax_id', 'address_line1', 'address_line2',
  'branch_type', 'branch_number', 'next_action_due', 'proposal_sent_at', 'walkthrough_at',
  'last_touch_at', 'submitted_at',
]);

function cleanLeadPatch(fields: Record<string, unknown>): { patch: Record<string, unknown>; dropped: string[] } {
  const patch: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (!LEAD_COLS.has(k)) { dropped.push(k); continue; }
    patch[k] = v === '' ? null : v; // empty string clears → null (date/text safe)
  }
  return { patch, dropped };
}

// Map a raw leads row → the UI shape the dashboard expects (lead_id = id, score/tier
// lifted out of raw_payload — mirrors what the RPC does for the list rows).
function rowToLeadUi(row: Record<string, unknown> | null): LeadUi {
  if (!row) return {} as LeadUi;
  const { raw_payload, ...rest } = row as Record<string, unknown> & { raw_payload?: Record<string, unknown> };
  return {
    ...rest,
    lead_id: row.id as string,
    score: raw_payload?.score,
    tier: raw_payload?.tier,
  } as LeadUi;
}

function mapInteraction(r: Record<string, unknown>): Interaction {
  return {
    id: String(r.id),
    lead_id: String(r.lead_id),
    at: String(r.occurred_at || r.created_at || ''),
    type: r.type as Interaction['type'],
    summary: String(r.summary || ''),
    by: String(r.created_by || ''),
  };
}

export async function updateLeadSmart(
  lead_id: string,
  fields: Partial<LeadUi>
): Promise<{ lead: LeadUi; dropped_fields?: string[] }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { patch, dropped } = cleanLeadPatch(fields as Record<string, unknown>);
  patch.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('leads').update(patch).eq('id', lead_id).select('*').single();
  if (error) throw new Error(error.message);
  return { lead: rowToLeadUi(data), dropped_fields: dropped };
}

export async function addLeadSmart(fields: Partial<LeadUi>): Promise<{ lead: LeadUi }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { patch } = cleanLeadPatch(fields as Record<string, unknown>);
  if (!patch.full_name) patch.full_name = patch.company_name || 'New Lead'; // NOT NULL
  if (!patch.submitted_at) patch.submitted_at = new Date().toISOString();
  if (!patch.source) patch.source = 'manual';
  if (!patch.manual_source) patch.manual_source = 'dashboard';
  const { data, error } = await supabase.from('leads').insert(patch).select('*').single();
  if (error) throw new Error(error.message);
  return { lead: rowToLeadUi(data) };
}

export async function getLeadSmart(lead_id: string): Promise<{ lead: LeadUi; interactions: Interaction[] }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const [leadRes, ixRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', lead_id).single(),
    supabase.from('interactions').select('*').eq('lead_id', lead_id).order('occurred_at', { ascending: false }),
  ]);
  if (leadRes.error) throw new Error(leadRes.error.message);
  const interactions = (ixRes.data || []).map(mapInteraction);
  // Keep raw_payload on the detail object so the drawer can render the full
  // form submission (brand website, brief, utm, etc.). The list rows (RPC) omit it.
  const lead = rowToLeadUi(leadRes.data);
  (lead as Record<string, unknown>).raw_payload = (leadRes.data as Record<string, unknown>)?.raw_payload ?? null;
  return { lead, interactions };
}

export async function addInteractionSmart(
  lead_id: string,
  type: Interaction['type'],
  summary: string
): Promise<{ interaction: Interaction; lead: LeadUi }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const nowIso = new Date().toISOString();
  const { data: ixRow, error } = await supabase
    .from('interactions')
    .insert({ lead_id, type, summary, occurred_at: nowIso, created_by: session.user?.email || 'dashboard' })
    .select('*').single();
  if (error) throw new Error(error.message);
  const { data: lead } = await supabase.from('leads').update({ last_touch_at: nowIso }).eq('id', lead_id).select('*').single();
  return { interaction: mapInteraction(ixRow), lead: rowToLeadUi(lead) };
}

export async function getLeadsPageSmart(
  offset: number,
  limit: number,
  filter?: { outcome?: string; manual_only?: boolean }
): Promise<{ leads: LeadUi[]; total: number; offset: number }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  let q = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (filter?.outcome) q = q.eq('deal_outcome', filter.outcome);
  if (filter?.manual_only) q = q.not('manual_source', 'is', null);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { leads: (data || []).map(rowToLeadUi), total: count ?? (data ? data.length : 0), offset };
}

// ── Expenses — Supabase-native CRUD (table public.expenses, RLS owner_all) ──
function computeExpenseSummary(rows: ExpenseRow[]): ExpenseSummary {
  const now = new Date();
  const curM = `${now.getFullYear()}-${now.getMonth()}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevM = `${prev.getFullYear()}-${prev.getMonth()}`;
  const by = { travel: 0, client_gift: 0, ai_subscription: 0, other: 0 };
  let total = 0, thisM = 0, prevMo = 0;
  for (const r of rows) {
    const a = Number(r.amount_thb) || 0;
    total += a;
    const d = new Date(r.date);
    const ym = `${d.getFullYear()}-${d.getMonth()}`;
    if (ym === curM) thisM += a;
    if (ym === prevM) prevMo += a;
    if (r.category in by) by[r.category as keyof typeof by] += a; else by.other += a;
  }
  return { total_thb: total, this_month_thb: thisM, prev_month_thb: prevMo, by_category: by };
}

export async function getExpensesSmart(): Promise<ExpensesData> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data || []) as ExpenseRow[];
  return { rows, summary: computeExpenseSummary(rows) };
}

export async function addExpenseSmart(data: {
  date: string; category: string; amount_thb: number; description: string; linked_lead_id?: string;
}): Promise<{ id: string }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const row: Record<string, unknown> = {
    date: data.date, category: data.category, amount_thb: data.amount_thb, description: data.description || null,
  };
  if (data.linked_lead_id) row.linked_lead_id = data.linked_lead_id;
  const { data: ins, error } = await supabase.from('expenses').insert(row).select('id').single();
  if (error) throw new Error(error.message);
  return { id: String(ins.id) };
}

export async function deleteExpenseSmart(id: string): Promise<{ deleted: boolean }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { deleted: true };
}

export async function editExpenseSmart(id: string, data: {
  date: string; category: string; amount_thb: number; description: string;
}): Promise<{ updated: boolean }> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  const { error } = await supabase.from('expenses')
    .update({ date: data.date, category: data.category, amount_thb: data.amount_thb, description: data.description || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return { updated: true };
}
