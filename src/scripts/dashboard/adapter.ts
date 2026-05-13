// Defense-in-depth UI mirror of RAW_TO_UI from dashboard-api.gs.
// The Apps Script returns clean UI shape already — this adapter exists only
// to coerce any raw rows that might leak from a legacy response or future
// debugging path. Plan §3.

export const RAW_TO_UI: Record<string, string> = {
  submittedAt: 'submitted_at',
  aiSignalCount: 'ai_signal_count',
  name: 'full_name',
  positionOther: 'position_other',
  company: 'company_name',
  industry: 'business_type',
  industryOther: 'business_type_other',
  teamSize: 'team_size',
  problems: 'pain_points',
  line: 'line_id',
  hookVariant: 'hook_variant',
  crm_status: 'pipeline_status',
  notes: 'crm_notes',
  last_touch: 'last_touch_at',
  next_action: 'next_action',
};

const UI_TO_RAW: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_TO_UI).map(([raw, ui]) => [ui, raw])
);

export type LeadUi = Record<string, unknown> & {
  lead_id?: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  line_id?: string;
  email?: string;
  business_type?: string;
  package?: string;
  package_price?: number | string;
  score?: number | string;
  tier?: string;
  submitted_at?: string;
  nickname?: string;
  fact_1?: string;
  fact_2?: string;
  fact_3?: string;
  crm_notes?: string;
  deal_outcome?: 'in_progress' | 'won' | 'lost' | 'unqualified';
  close_reason?: string;
  temperature?: 'hot' | 'warm' | 'cold' | '';
  next_action?: string;
  next_action_due?: string;
  last_touch_at?: string;
  proposal_sent_at?: string;
  walkthrough_at?: string;
  payment_status?: 'unpaid' | 'partial' | 'paid';
  manual_source?: string;
  pain_points?: string;
  hook_variant?: string;
  pipeline_status?: string;
  team_size?: string;
  revenue?: string;
  goal?: string;
  timeline?: string;
  budget?: string;
  source_page?: string;
  utm_source?: string;
  utm_campaign?: string;
  bosi_archetype?: string;
};

export function toUi(raw: Record<string, unknown>): LeadUi {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) {
    out[RAW_TO_UI[k] ?? k] = raw[k];
  }
  return out as LeadUi;
}

export function toRaw(ui: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(ui)) {
    out[UI_TO_RAW[k] ?? k] = ui[k];
  }
  return out;
}
