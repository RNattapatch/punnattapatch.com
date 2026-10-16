-- Funnel Lab "ผลย้อนหลัง" (2026-10-17) — รอบรีวิวที่รันบนมินิ (carousel · แผน reel · เทียบ A/B ทั้ง loop · deck คลาส)
-- 1 แถว = 1 โฟลเดอร์ใน ~/funnel-lab-data/work/<slug> · เขียนโดย mac-mini-ops/funnel-lab/publish_review.mjs ด้วย service role
-- (สคริปต์รีวิวทุกตัวเรียกเองตอนจบ + backfill รอบเก่า) · หน้าเว็บอ่านผ่าน is_owner
-- summary / sections / scores = แตกมาจาก out/report.md ให้หน้าเว็บวาง "ใบตัดสิน" ได้ · report_md เก็บฉบับเต็มไว้อ่านต่อ
-- covers = item id → path ในบัคเก็ต funnel-lab-media (reviews/<slug>/<item>.jpg) · ไม่มีข้อมูลลูกค้าจริง (ผู้ซื้อเป็นแบบจำลอง)

create table if not exists public.funnel_lab_review_runs (
  slug         text primary key check (slug ~ '^[a-z0-9][a-z0-9._-]{0,99}$'),
  kind         text not null check (kind in ('compare', 'carousel', 'reel_plan', 'class_deck', 'other')),
  title        text not null check (char_length(title) <= 300),
  ran_at       timestamptz not null,
  headline     text,
  summary      jsonb not null default '[]'::jsonb,
  sections     jsonb not null default '[]'::jsonb,
  scores       jsonb,
  meta         jsonb not null default '{}'::jsonb,
  covers       jsonb not null default '{}'::jsonb,
  report_md    text not null,
  published_at timestamptz not null default now(),
  constraint funnel_lab_review_runs_shapes check (
    jsonb_typeof(summary) = 'array' and jsonb_typeof(sections) = 'array'
    and jsonb_typeof(meta) = 'object' and jsonb_typeof(covers) = 'object'),
  constraint funnel_lab_review_runs_size check (
    octet_length(report_md) + octet_length(summary::text) + octet_length(sections::text) <= 2000000)
);
comment on table public.funnel_lab_review_runs is 'Funnel Lab — ผลรีวิวแต่ละรอบจากมินิ (publish_review.mjs) · หน้าเว็บแท็บ "ผลย้อนหลัง"';
create index if not exists funnel_lab_review_runs_ran_at on public.funnel_lab_review_runs (ran_at desc);

alter table public.funnel_lab_review_runs enable row level security;
revoke all on public.funnel_lab_review_runs from anon;
drop policy if exists owner_all_funnel_lab_review_runs on public.funnel_lab_review_runs;
create policy owner_all_funnel_lab_review_runs on public.funnel_lab_review_runs
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
