import type { LeadUi } from './adapter';

const API_URL = 'https://script.google.com/macros/s/AKfycbxGxIc44_3S4VQHoGScVZx3mhQ2SwiWerddkBGdQ9iJlZMs0P_2tKeaNk4bTZZTHAg/exec';

const TOKEN_KEY = 'pun_dash_token';
const TOKEN_EXP_KEY = 'pun_dash_exp';

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; message: string };
export type ApiResp<T> = ApiOk<T> | ApiErr;

export type Interaction = {
  id: string;
  lead_id: string;
  at: string;
  type: 'call' | 'line' | 'meeting' | 'email' | 'note';
  summary: string;
  by: string;
};

export type Kpis = {
  sales_total: number;
  sales_this_month: number;
  sales_prev_month: number;
  sales_delta_pct: number;
  leads_total: number;
  leads_this_month: number;
  pipeline: { in_progress: number; proposal_sent: number; walkthrough_done: number; won: number };
  conversion_rate: number;
  top_industry: { label: string; count: number }[];
};

export type DashboardData = {
  kpis: Kpis;
  today: LeadUi[];
  leads: LeadUi[];
  total: number;
  generated_at: string;
};

export function getToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  const t = sessionStorage.getItem(TOKEN_KEY);
  const exp = sessionStorage.getItem(TOKEN_EXP_KEY);
  if (!t || !exp) return null;
  if (Date.now() > parseInt(exp, 10)) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
    return null;
  }
  return t;
}

export function clearToken(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
}

function setToken(token: string, expiresAt: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXP_KEY, String(new Date(expiresAt).getTime()));
}

async function apiPost<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (API_URL === '__API_URL__') {
    throw new Error('API_URL not configured. Replace __API_URL__ in src/scripts/dashboard/api.ts after Apps Script deploy.');
  }
  const body = JSON.stringify({ action, token: getToken(), ...payload });
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow',
  });
  const json = (await res.json()) as ApiResp<T>;
  if (!json.ok) {
    if (json.error === 'invalid_token') clearToken();
    const e = new Error(json.message || json.error) as Error & { code?: string };
    e.code = json.error;
    throw e;
  }
  return json.data;
}

export async function login(pin: string): Promise<{ token: string; expires_at: string }> {
  const data = await apiPost<{ ok?: boolean; token?: string; expires_at?: string; error?: string; message?: string }>(
    'login',
    { pin }
  );
  if (!data.token || !data.expires_at) {
    const err = new Error(data.message || data.error || 'login_failed') as Error & { code?: string };
    err.code = data.error;
    throw err;
  }
  setToken(data.token, data.expires_at);
  return { token: data.token, expires_at: data.expires_at };
}

export function getDashboardData(): Promise<DashboardData> {
  return apiPost<DashboardData>('getDashboardData');
}

export function getLead(lead_id: string): Promise<{ lead: LeadUi; interactions: Interaction[] }> {
  return apiPost('getLead', { lead_id });
}

export function updateLead(lead_id: string, fields: Partial<LeadUi>): Promise<{ lead: LeadUi }> {
  return apiPost('updateLead', { lead_id, fields });
}

export function addLead(fields: Partial<LeadUi>): Promise<{ lead: LeadUi }> {
  return apiPost('addLead', { fields });
}

export function addInteraction(
  lead_id: string,
  type: Interaction['type'],
  summary: string
): Promise<{ interaction: Interaction; lead: LeadUi }> {
  return apiPost('addInteraction', { lead_id, type, summary });
}

export function getLeadsPage(
  offset: number,
  limit: number,
  filter?: { outcome?: string; manual_only?: boolean }
): Promise<{ leads: LeadUi[]; total: number; offset: number }> {
  return apiPost('getLeadsPage', { offset, limit, filter });
}
