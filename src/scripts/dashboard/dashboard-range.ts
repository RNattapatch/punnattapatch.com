// Dashboard calculations for an active Leads date range.
//
// The selector is intentionally based on `submitted_at`: once the complete
// matching cohort is loaded, every lead-driven surface must read this same
// array. This mirrors the production `get_dashboard_data` KPI contract without
// adding a second, drifting dashboard query.

import type { ExpenseRow, ExpenseSummary, Kpis, PurchaseUi } from './api';
import type { LeadUi } from './adapter';

const CLOSED = new Set(['won', 'repeat', 'retainer']);
const COMPLETE = new Set(['won', 'repeat', 'retainer', 'lost', 'unqualified']);
const TODAY_COMPLETE = new Set(['won', 'repeat', 'retainer', 'lost']);

function monthKey(value: string | undefined, fallback: Date): string {
  const date = value ? new Date(value) : fallback;
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function startOfTomorrow(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

function isDueToday(lead: LeadUi, now: Date): boolean {
  if (!lead.next_action_due || TODAY_COMPLETE.has(String(lead.deal_outcome || ''))) return false;
  const due = new Date(lead.next_action_due).getTime();
  return Number.isFinite(due) && due < startOfTomorrow(now);
}

function localYmd(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildRangeDashboard(
  leads: LeadUi[],
  purchases: PurchaseUi[] = [],
  now: Date = new Date(),
  from?: Date,
  to?: Date,
): { leads: LeadUi[]; today: LeadUi[]; kpis: Kpis } {
  const currentMonth = monthKey(undefined, now);
  const previousMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${now.getMonth() === 0 ? 11 : now.getMonth() - 1}`;
  const outcomes = (lead: LeadUi) => String(lead.deal_outcome || 'in_progress');
  const inProgress = leads.filter((lead) => !COMPLETE.has(outcomes(lead))).length;
  const won = leads.filter((lead) => CLOSED.has(outcomes(lead)));
  const lost = leads.filter((lead) => outcomes(lead) === 'lost').length;
  const rangePurchases = purchases.filter((purchase) => {
    const time = new Date(purchase.purchased_at).getTime();
    return Number.isFinite(time) && (!from || time >= from.getTime()) && (!to || time < to.getTime());
  });
  const purchaseNet = (purchase: PurchaseUi) => Number(purchase.net_amount_thb) || 0;
  const salesThisMonth = rangePurchases
    .filter((purchase) => monthKey(purchase.purchased_at, now) === currentMonth)
    .reduce((total, purchase) => total + purchaseNet(purchase), 0);
  const salesPrevMonth = rangePurchases
    .filter((purchase) => monthKey(purchase.purchased_at, now) === previousMonth)
    .reduce((total, purchase) => total + purchaseNet(purchase), 0);
  const industry = new Map<string, number>();
  for (const lead of leads) {
    const label = String(lead.business_type || '').trim();
    if (label) industry.set(label, (industry.get(label) || 0) + 1);
  }
  const denominator = won.length + lost + inProgress;

  return {
    leads,
    today: leads.filter((lead) => isDueToday(lead, now)),
    kpis: {
      sales_total: rangePurchases.reduce((total, purchase) => total + purchaseNet(purchase), 0),
      sales_this_month: salesThisMonth,
      sales_prev_month: salesPrevMonth,
      sales_delta_pct: salesPrevMonth > 0
        ? Math.max(-9.99, Math.min(9.99, (salesThisMonth - salesPrevMonth) / salesPrevMonth))
        : salesThisMonth > 0 ? 1 : 0,
      leads_total: leads.length,
      leads_this_month: leads.filter((lead) => monthKey(lead.submitted_at, now) === currentMonth).length,
      pipeline: {
        in_progress: inProgress,
        proposal_sent: leads.filter((lead) => !!lead.proposal_sent_at).length,
        walkthrough_done: leads.filter((lead) => !!lead.walkthrough_at).length,
        won: won.length,
        repeat: leads.filter((lead) => outcomes(lead) === 'repeat').length,
        retainer: leads.filter((lead) => outcomes(lead) === 'retainer').length,
      },
      conversion_rate: denominator ? Math.round((won.length / denominator) * 10000) / 10000 : 0,
      repeat_customers: leads.filter((lead) => outcomes(lead) === 'repeat').length,
      retainer_customers: leads.filter((lead) => outcomes(lead) === 'retainer').length,
      ltv_total: leads.reduce((total, lead) => total + (Number(lead.lifetime_value_thb) || 0), 0),
      served_count: leads.reduce((total, lead) => total + (Number(lead.purchase_count) || 0), 0),
      top_industry: [...industry.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([label, count]) => ({ label, count })),
    },
  };
}

/** Expense rows use the same calendar bounds, via their own `date` field. */
export function expensesInRange(rows: ExpenseRow[], from: Date, to: Date): ExpenseRow[] {
  const fromYmd = localYmd(from);
  const toYmd = localYmd(to);
  return rows.filter((row) => row.date >= fromYmd && row.date < toYmd);
}

/** Expense values follow the same calendar bounds as the active Lead cohort. */
export function summarizeExpensesInRange(rows: ExpenseRow[], from: Date, to: Date): ExpenseSummary {
  const byCategory: ExpenseSummary['by_category'] = { travel: 0, client_gift: 0, ai_subscription: 0, other: 0 };
  let total = 0;
  for (const row of expensesInRange(rows, from, to)) {
    const amount = Number(row.amount_thb) || 0;
    total += amount;
    if (row.category in byCategory) byCategory[row.category] += amount;
    else byCategory.other += amount;
  }
  return { total_thb: total, this_month_thb: total, prev_month_thb: 0, by_category: byCategory };
}
