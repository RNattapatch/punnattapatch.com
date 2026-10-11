-- Funnel Lab "ของจริง" (2026-10-12) — applied ผ่าน Supabase MCP (funnel_lab_reality)
-- ต่อ Funnel Lab เข้ากับของจริง 3 ก้อน:
--   1. lead_company_facts      ข้อมูลบริษัทที่ agent ไปตรวจจากของจริง (DBD/เว็บ/โน้ตลูกค้า) — ไม่เขียนทับ leads (กติกา CRM-SSOT ข้อ 3)
--   2. funnel_lab_lead_personas lead แต่ละรายตรงกับ persona ไหนใน pack ที่ขุดจาก CRM → นับ ลีด/คุย/เสนอราคา/ปิด ต่อ persona ได้สด
--   3. funnel_lab_signals      แอด · คลิป/โพสต์ของคุณปัน · คอนเทนต์คู่แข่งจาก Intel Warroom + ตัวเลขจริง + ผลที่ panel ทำนาย
--      (เขียนโดย mac-mini-ops/funnel-lab/* ด้วย service role · หน้าเว็บอ่านและแก้ intent/note ได้ผ่าน is_owner)
-- views (security_invoker = RLS ของคนเรียก): funnel_lab_persona_funnel · funnel_lab_channel_funnel

create table if not exists public.lead_company_facts (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  matched text not null check (matched in ('yes', 'probable', 'no')),
  legal_name text,
  what_they_do text,
  sells_to text check (sells_to in ('b2b', 'b2c', 'both', 'unknown')),
  industry text,
  province text,
  founded_year int check (founded_year between 1800 and 2100),
  ownership text check (ownership in ('founder', 'family-2nd-gen', 'corporate-group', 'listed', 'unknown')),
  registered_capital_thb numeric check (registered_capital_thb >= 0),
  revenue_thb numeric check (revenue_thb >= 0),
  revenue_year int check (revenue_year between 2000 and 2100),
  employees_est int check (employees_est >= 0),
  sales_team_est int check (sales_team_est >= 0),
  branches int check (branches >= 0),
  size_band text check (size_band in ('micro', 'small', 'mid', 'large', 'unknown')),
  form_vs_reality jsonb not null default '[]'::jsonb,
  persona_signals text,
  sources jsonb not null default '[]'::jsonb,
  confidence text check (confidence in ('high', 'medium', 'low')),
  researched_at timestamptz not null default now(),
  researched_by text not null default 'claude-agent'
);
comment on table public.lead_company_facts is 'Funnel Lab — ข้อมูลบริษัทของ lead ที่ตรวจจากของจริง (ฟอร์มมักกรอกไม่ตรง) · ไม่เขียนทับ leads · mac-mini-ops/funnel-lab/load_company_facts.py';

create table if not exists public.funnel_lab_lead_personas (
  lead_id uuid not null references public.leads(id) on delete cascade,
  pack_id text not null check (pack_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  persona_id text not null check (persona_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  fit numeric not null check (fit between 0 and 1),
  reason text,
  assigned_at timestamptz not null default now(),
  primary key (lead_id, pack_id)
);
create index if not exists funnel_lab_lead_personas_persona on public.funnel_lab_lead_personas (pack_id, persona_id);
comment on table public.funnel_lab_lead_personas is 'Funnel Lab — lead ↔ persona หลัก (1 persona ต่อ lead ต่อ pack) ใช้นับผลจริงต่อ persona';

create table if not exists public.funnel_lab_signals (
  id text primary key check (id ~ '^[a-z]+:[A-Za-z0-9_.-]{1,120}$'),
  source text not null check (source in ('own_ad', 'own_organic', 'competitor')),
  platform text not null check (platform in ('meta', 'tiktok', 'instagram', 'facebook', 'youtube', 'web', 'other')),
  native_id text not null,
  url text,
  title text,
  owner text,
  published_at timestamptz,
  format text check (format in ('video', 'image', 'carousel', 'text')),
  creative jsonb not null,
  transcript text,
  thumb_path text,
  metrics jsonb not null default '{}'::jsonb,
  metrics_history jsonb not null default '[]'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  content_id text,
  intent_stage text check (intent_stage in ('cold', 'warm', 'hot')),
  note text,
  evaluation jsonb,
  journey jsonb,
  pack_id text,
  pack_revision text,
  engine text,
  evaluated_at timestamptz,
  eval_error text,
  eval_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists funnel_lab_signals_source on public.funnel_lab_signals (source, platform, published_at desc);
create index if not exists funnel_lab_signals_pending on public.funnel_lab_signals (eval_requested_at) where eval_requested_at is not null;
comment on table public.funnel_lab_signals is 'Funnel Lab ของจริง — แอด/คอนเทนต์ของคุณปัน/คอนเทนต์คู่แข่ง + ตัวเลขจริง + ผล panel · mac-mini-ops/funnel-lab/';

create or replace function public.funnel_lab_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists funnel_lab_signals_touch on public.funnel_lab_signals;
create trigger funnel_lab_signals_touch before update on public.funnel_lab_signals for each row execute function public.funnel_lab_touch();

alter table public.lead_company_facts enable row level security;
alter table public.funnel_lab_lead_personas enable row level security;
alter table public.funnel_lab_signals enable row level security;
drop policy if exists owner_all_lead_company_facts on public.lead_company_facts;
create policy owner_all_lead_company_facts on public.lead_company_facts
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists owner_all_funnel_lab_lead_personas on public.funnel_lab_lead_personas;
create policy owner_all_funnel_lab_lead_personas on public.funnel_lab_lead_personas
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists owner_all_funnel_lab_signals on public.funnel_lab_signals;
create policy owner_all_funnel_lab_signals on public.funnel_lab_signals
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- A lead counts as "won" when money moved or the deal is marked won/repeat/retainer.
create or replace view public.funnel_lab_lead_outcomes with (security_invoker = true) as
select l.id as lead_id,
  case
    when l.source in ('ads-daruma-consult', 'ads-dealer-ai-sales', 'ads-hotel-resort-ai', 'ads-sales-online-team') or l.source like 'lp-%' then 'meta_ads'
    when lower(l.source) = 'tiktok' then 'tiktok'
    when lower(l.source) = 'instagram' then 'instagram'
    when lower(l.source) = 'facebook' then 'facebook'
    when l.source = 'line-oa' then 'line_oa'
    when l.source = 'website-booking' then 'website'
    when l.source in ('referral') then 'referral'
    when l.source in ('doc-bot', 'manual') or l.source is null then 'direct'
    when l.source = 'sponsor-form' then 'sponsor'
    else 'other'
  end as channel,
  (coalesce(l.deal_outcome, '') = 'unqualified') as disqualified,
  (l.pipeline_status in ('Discovery Call', 'Site Visit', 'Proposal Sent') or l.deal_outcome in ('in_progress', 'won', 'repeat', 'retainer')
    or (l.deal_outcome = 'lost' and coalesce(l.pipeline_status, 'New') <> 'New')
    or coalesce(l.purchase_count, 0) > 0) as talked,
  (l.pipeline_status = 'Proposal Sent' or l.proposal_sent_at is not null or l.deal_outcome in ('won', 'repeat', 'retainer')
    or exists (select 1 from public.documents d where d.lead_id = l.id and d.doc_type = 'qo') or coalesce(l.purchase_count, 0) > 0) as proposed,
  (l.deal_outcome in ('won', 'repeat', 'retainer') or coalesce(l.purchase_count, 0) > 0) as won,
  coalesce(l.lifetime_value_thb, 0) as revenue_thb,
  coalesce(l.submitted_at, l.created_at) as entered_at,
  l.first_purchase_at
from public.leads l
where coalesce(l.company_name, '') !~* '^(test|ทดสอบ)' and coalesce(l.company_name, '') !~* 'ทดสอบ meta';

create or replace view public.funnel_lab_channel_funnel with (security_invoker = true) as
select channel,
  count(*) as leads,
  count(*) filter (where disqualified) as disqualified,
  count(*) filter (where talked) as talked,
  count(*) filter (where proposed) as proposed,
  count(*) filter (where won) as won,
  sum(revenue_thb) as revenue_thb,
  percentile_cont(0.5) within group (order by extract(epoch from (first_purchase_at - entered_at)) / 86400)
    filter (where first_purchase_at is not null and first_purchase_at >= entered_at) as median_days_to_buy
from public.funnel_lab_lead_outcomes
group by channel;

create or replace view public.funnel_lab_persona_funnel with (security_invoker = true) as
select p.pack_id, p.persona_id,
  count(*) as leads,
  count(*) filter (where o.disqualified) as disqualified,
  count(*) filter (where o.talked) as talked,
  count(*) filter (where o.proposed) as proposed,
  count(*) filter (where o.won) as won,
  sum(o.revenue_thb) as revenue_thb,
  jsonb_object_agg(o.channel, 1) as channels_seen
from public.funnel_lab_lead_personas p
join public.funnel_lab_lead_outcomes o on o.lead_id = p.lead_id
group by p.pack_id, p.persona_id;

grant select on public.funnel_lab_lead_outcomes, public.funnel_lab_channel_funnel, public.funnel_lab_persona_funnel to authenticated;

-- ---------- funnel_lab_signals_summaries (applied 2026-10-12) ----------
alter table public.funnel_lab_signals add column if not exists eval_summary jsonb;
alter table public.funnel_lab_signals add column if not exists local_summary jsonb;
alter table public.funnel_lab_signals add column if not exists local_pack_revision text;
comment on column public.funnel_lab_signals.eval_summary is 'reality.mjs summarizeEvaluation() ของผล Codex — หน้า "ของจริง" โหลดเฉพาะคอลัมน์นี้ (evaluation เต็มโหลดเมื่อเปิดดูรายตัว)';
comment on column public.funnel_lab_signals.local_summary is 'ผลเดียวกันจาก Local engine (ตัวเทียบฐาน) — คำนวณโดย funnel_signals_worker.mjs';

-- ---------- funnel_lab_outcomes_talked_fix (applied 2026-10-12 หลัง review) ----------
-- deal ที่ lost ทั้งที่ยังอยู่ New ไม่นับว่า "ได้คุย" (นับเฉพาะ lost ที่ผ่าน New มาแล้ว)
-- (นิยามเต็มของ view ดูด้านบน · ส่วนที่เปลี่ยน:)
--   (l.pipeline_status in (...) or l.deal_outcome in ('in_progress','won','repeat','retainer')
--    or (l.deal_outcome = 'lost' and coalesce(l.pipeline_status, 'New') <> 'New') or coalesce(l.purchase_count, 0) > 0) as talked
