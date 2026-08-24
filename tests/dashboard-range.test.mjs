/**
 * Regression tests for the dashboard view when Leads uses a submitted_at range.
 * The test intentionally imports the production helper: every KPI/chart/kanban
 * must be calculated from the same full result set as the Leads list.
 */
import { buildRangeDashboard, summarizeExpensesInRange } from '../src/scripts/dashboard/dashboard-range.ts';

let pass = 0;
let fail = 0;
const check = (condition, message) => {
  if (condition) { pass++; console.log(`  ✅ ${message}`); }
  else { fail++; console.log(`  ❌ ${message}`); }
};

const lead = (overrides = {}) => ({
  lead_id: crypto.randomUUID(),
  full_name: 'Test Lead',
  submitted_at: '2026-08-10T04:00:00.000Z',
  package_price: 0,
  deal_outcome: 'in_progress',
  pipeline_status: 'New',
  ...overrides,
});

const selected = [
  lead({ full_name: 'Won', deal_outcome: 'won', pipeline_status: 'Proposal Sent', package_price: 10000, tax_mode: 'wht_3', business_type: 'Retail', last_touch_at: '2026-08-10T04:00:00.000Z' }),
  lead({ full_name: 'Discovery', pipeline_status: 'Discovery Call', business_type: 'Retail', next_action_due: '2026-08-10' }),
  lead({ full_name: 'Lost', deal_outcome: 'lost', pipeline_status: 'Proposal Sent', business_type: 'Manufacturing' }),
  lead({ full_name: 'Qualified', pipeline_status: 'New', business_type: 'Manufacturing', proposal_sent_at: '2026-08-09T04:00:00.000Z', walkthrough_at: '2026-08-10T04:00:00.000Z' }),
];

console.log('\n[1] Selected lead range drives every lead-derived dashboard value');
const dashboard = buildRangeDashboard(selected, new Date('2026-08-10T12:00:00+07:00'));
check(dashboard.leads === selected, 'keeps the exact full lead result set for kanban/source charts');
check(dashboard.kpis.leads_total === 4, 'lead total equals selected range only');
check(dashboard.kpis.pipeline.in_progress === 2, 'pipeline excludes completed outcomes from the selected range');
check(dashboard.kpis.pipeline.proposal_sent === 1, 'proposal count follows proposal_sent_at in selected leads');
check(dashboard.kpis.pipeline.walkthrough_done === 1, 'walkthrough count comes from selected leads');
check(dashboard.kpis.pipeline.won === 1, 'won count comes from selected leads');
check(dashboard.kpis.sales_total === 9700, 'sales honours WHT net amount within selected leads');
check(dashboard.kpis.top_industry.length === 2 && dashboard.kpis.top_industry.every((row) => row.count === 2), 'industry chart is derived from selected leads');
check(dashboard.today.length === 1 && dashboard.today[0].full_name === 'Discovery', 'Today is constrained to the selected range too');

console.log('\n[2] Expenses use the same calendar bounds when a range is active');
const expenses = [
  { id: 'in', date: '2026-08-10', category: 'travel', amount_thb: 500, description: '', linked_lead_id: '', created_at: '' },
  { id: 'out', date: '2026-08-11', category: 'ai_subscription', amount_thb: 900, description: '', linked_lead_id: '', created_at: '' },
];
const expenseSummary = summarizeExpensesInRange(expenses, new Date('2026-08-10T00:00:00+07:00'), new Date('2026-08-11T00:00:00+07:00'));
check(expenseSummary.total_thb === 500, 'expense total excludes records outside the selected range');
check(expenseSummary.this_month_thb === 500, 'period expense value matches the selected range total');
check(expenseSummary.by_category.travel === 500 && expenseSummary.by_category.ai_subscription === 0, 'expense category cards use selected rows only');

console.log(`\n${'─'.repeat(48)}\nผ่าน ${pass} · ไม่ผ่าน ${fail}\n`);
process.exit(fail === 0 ? 0 : 1);
