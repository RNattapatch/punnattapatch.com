-- Funnel Lab "ทดสอบบอท" (2026-10-13) — ผลการทดสอบบอท LINE OA กับ persona ของ Funnel Lab
-- 3 ก้อน:
--   1. funnel_lab_bot_runs     1 แถว = 1 รอบของ persona-sim (บอทเวอร์ชันหนึ่งคุยกับ persona ทั้ง pack)
--   2. funnel_lab_bot_convos   1 แถว = บทสนทนาของ persona หนึ่งคนในรอบนั้น (ข้อความ + ความคิดในใจ + ผลกรรมการ)
--   3. funnel_lab_bot_picks    1 แถว = persona หนึ่งคนดูแชททุกรอบแล้วเลือกว่าอยากคุยต่อกับแบบไหน (jev ตัดสิน · Codex อธิบายเหตุผล)
--      funnel_lab_bot_pick_runs = หัวของการเลือกแต่ละครั้ง (ใช้รอบไหนเทียบ · สรุปรวมจาก Codex)
-- เขียนโดย mac-mini-ops/line-relay/persona-pick.mjs ด้วย service role · หน้าเว็บอ่านผ่าน is_owner
-- ไม่มีข้อมูลลูกค้าจริง: persona สังเคราะห์จาก CRM · ข้อความทั้งหมดเป็นบทสนทนาจำลอง

create table if not exists public.funnel_lab_bot_runs (
  label text primary key check (label ~ '^[a-z0-9][a-z0-9-]{0,40}$'),
  pack_id text not null check (pack_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  ran_at timestamptz not null,
  sim_model text,
  judge_model text,
  persona_count int not null check (persona_count >= 0),
  partial boolean not null default false,
  version_note text,
  summary jsonb not null default '{}'::jsonb,
  loaded_at timestamptz not null default now()
);
comment on table public.funnel_lab_bot_runs is 'Funnel Lab — รอบทดสอบบอท LINE OA กับ persona (persona-sim.mjs) · summary = ตัวเลขรวมของรอบ';

create table if not exists public.funnel_lab_bot_convos (
  run_label text not null references public.funnel_lab_bot_runs(label) on delete cascade,
  persona_id text not null check (persona_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  persona_name text,
  segment text,
  entry text,
  opener text,
  outcome text,
  gave_phone boolean not null default false,
  booked boolean not null default false,
  turns jsonb not null default '[]'::jsonb,
  thoughts jsonb not null default '[]'::jsonb,
  lead jsonb,
  judge jsonb,
  primary key (run_label, persona_id)
);
create index if not exists funnel_lab_bot_convos_persona on public.funnel_lab_bot_convos (persona_id);
comment on table public.funnel_lab_bot_convos is 'Funnel Lab — บทสนทนาจำลองต่อ persona ต่อรอบ · turns [{role,text,action?}] · thoughts [{turn,interest,action,thought}] · judge = ผลกรรมการ';

create table if not exists public.funnel_lab_bot_pick_runs (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  pack_id text not null,
  picker_model text not null,
  reason_model text,
  run_labels text[] not null,
  ran_at timestamptz not null default now(),
  cost_usd numeric,
  summary jsonb not null default '{}'::jsonb
);
comment on table public.funnel_lab_bot_pick_runs is 'Funnel Lab — การให้ persona เลือกแชทที่ชอบที่สุดข้ามรอบ · summary = {wins:{label:n}, avg_scores:{label:x}, codex:{headline,findings[],next[]}}';

create table if not exists public.funnel_lab_bot_picks (
  pick_run_id text not null references public.funnel_lab_bot_pick_runs(id) on delete cascade,
  persona_id text not null check (persona_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  persona_name text,
  segment text,
  chosen_label text,
  probs jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  reasoning jsonb,
  primary key (pick_run_id, persona_id)
);
comment on table public.funnel_lab_bot_picks is 'Funnel Lab — persona เลือกแชทรอบไหน (jev: chosen_label + probs + scores 0–4) · reasoning = Codex {why, vs_worst, lesson, agree}';

alter table public.funnel_lab_bot_runs enable row level security;
alter table public.funnel_lab_bot_convos enable row level security;
alter table public.funnel_lab_bot_pick_runs enable row level security;
alter table public.funnel_lab_bot_picks enable row level security;
drop policy if exists owner_all_funnel_lab_bot_runs on public.funnel_lab_bot_runs;
create policy owner_all_funnel_lab_bot_runs on public.funnel_lab_bot_runs
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists owner_all_funnel_lab_bot_convos on public.funnel_lab_bot_convos;
create policy owner_all_funnel_lab_bot_convos on public.funnel_lab_bot_convos
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists owner_all_funnel_lab_bot_pick_runs on public.funnel_lab_bot_pick_runs;
create policy owner_all_funnel_lab_bot_pick_runs on public.funnel_lab_bot_pick_runs
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
drop policy if exists owner_all_funnel_lab_bot_picks on public.funnel_lab_bot_picks;
create policy owner_all_funnel_lab_bot_picks on public.funnel_lab_bot_picks
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
