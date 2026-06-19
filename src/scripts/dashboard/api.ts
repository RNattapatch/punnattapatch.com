// Shared dashboard TYPES.
//
// The dashboard runs entirely on Supabase now (see supabase.ts) — the old Apps
// Script / Google Sheets client that used to live here has been retired. This
// module is kept purely as the home for shared type definitions that several
// components import.

import type { LeadUi } from './adapter';

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
  pipeline: { in_progress: number; proposal_sent: number; walkthrough_done: number; won: number; repeat?: number };
  conversion_rate: number;
  // LTV / repeat (from the purchases ledger) — optional for back-compat
  repeat_customers?: number;
  ltv_total?: number;
  served_count?: number;
  top_industry: { label: string; count: number }[];
};

export type DashboardData = {
  kpis: Kpis;
  today: LeadUi[];
  leads: LeadUi[];
  total: number;
  expense_summary: ExpenseSummary | null;
  generated_at: string;
};

export type ExpenseRow = {
  id: string;
  date: string;
  category: 'travel' | 'client_gift' | 'ai_subscription' | 'other';
  amount_thb: number;
  description: string;
  linked_lead_id: string;
  created_at: string;
};

export type ExpenseSummary = {
  total_thb: number;
  this_month_thb: number;
  prev_month_thb: number;
  by_category: {
    travel: number;
    client_gift: number;
    ai_subscription: number;
    other: number;
  };
};

export type ExpensesData = {
  rows: ExpenseRow[];
  summary: ExpenseSummary;
};
