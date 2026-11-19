-- Office Call Center — คุณปันโทรสั่งงานเลขาฯ (ElevenLabs agent) · เลขาฯ โทรกลับ/โทรแจ้งเหตุด่วน
-- runbook: claude-code-pun-nattapatch/mac-mini-ops/office-desk/README.md
--
-- ใครเขียนอะไร:
--   edge function office-voice-tools (service role) → of_tasks (สร้างงาน) · of_status 'quiet' · อ่านสถานะ
--   office-desk บนมินิ (service role)               → ล็อกงานด้วย of_checkout · ผลงาน · of_alerts · of_status 'desk'
--   หน้าเว็บ (เจ้าของเท่านั้น ผ่าน RLS)              → อ่านอย่างเดียว (AI Office เฟสถัดไปค่อยเปิดเขียน)
-- ชื่อสถานะงานตาม Paperclip (todo → in_progress → in_review/done · blocked · cancelled) ให้ AI Office ใช้ตารางเดียวกันต่อได้

create table if not exists public.of_tasks (
  id              bigint generated always as identity primary key,
  no              text generated always as (lpad((id % 10000)::text, 4, '0')) stored,   -- เลขที่ที่เลขาฯ พูดในสาย
  title           text not null check (char_length(title) between 1 and 200),
  brief           text not null check (char_length(brief) between 1 and 4000),
  department      text check (department is null or department in ('consult', 'class', 'content', 'tech')),
  room            text,                                                                   -- ห้องโปรเจกต์ (AI Office)
  kind            text not null default 'research' check (kind in ('research', 'action')),
  priority        text not null default 'normal' check (priority in ('urgent', 'normal')),
  status          text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled')),
  source          text not null check (source in ('voice', 'telegram', 'web', 'system')),
  callback        boolean not null default true,
  assignee        text,                    -- worker ที่ล็อกงานอยู่
  checked_out_at  timestamptz,
  attempts        integer not null default 0,
  not_before      timestamptz,             -- agent ไม่ว่าง → พักแล้วค่อยหยิบใหม่
  conversation_id text,                    -- สาย ElevenLabs ที่สร้างงานนี้
  result          jsonb,                   -- {speak, text, sources, needs_pun, next_step, provider}
  heard_at        timestamptz,             -- คุณปันฟังผลแล้ว (รับสายโทรกลับ / ถามในสาย)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  done_at         timestamptz
);
create index if not exists of_tasks_queue on public.of_tasks (id) where status = 'todo';
create index if not exists of_tasks_updated on public.of_tasks (updated_at desc);

create table if not exists public.of_alerts (
  id               bigint generated always as identity primary key,
  level            text not null check (level in ('critical', 'urgent', 'info')),
  title            text not null check (char_length(title) between 1 and 200),
  detail           text check (detail is null or char_length(detail) <= 2000),
  source           text not null,
  dedupe_key       text,
  status           text not null default 'new' check (status in ('new', 'notified', 'calling', 'acked', 'gave_up')),
  calls            integer not null default 0,
  last_call_at     timestamptz,
  conversation_ids text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists of_alerts_open on public.of_alerts (id) where status in ('new', 'notified', 'calling');

create table if not exists public.of_status (
  key         text primary key,            -- 'desk' (heartbeat · WhatsApp พร้อมไหม) · 'quiet' (ห้ามรบกวนถึงเมื่อไร)
  data        jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- Atomic checkout (หลักของ Paperclip): worker หลายตัวแย่งงานเดียวกันไม่ได้ · งานด่วนก่อน
create or replace function public.of_checkout(p_worker text)
returns setof public.of_tasks
language sql
security definer
set search_path = public
as $$
  update public.of_tasks t
     set status = 'in_progress', assignee = p_worker, checked_out_at = now(),
         attempts = t.attempts + 1, updated_at = now()
   where t.id = (
     select id from public.of_tasks
      where status = 'todo' and (not_before is null or not_before <= now())
      order by (priority = 'urgent') desc, id
      limit 1
      for update skip locked)
  returning t.*;
$$;
revoke execute on function public.of_checkout(text) from public, anon, authenticated;
grant execute on function public.of_checkout(text) to service_role;

alter table public.of_tasks  enable row level security;
alter table public.of_alerts enable row level security;
alter table public.of_status enable row level security;

do $$
declare t text;
begin
  foreach t in array array['of_tasks', 'of_alerts', 'of_status'] loop
    execute format('drop policy if exists owner_read_%1$s on public.%1$s', t);
    execute format('create policy owner_read_%1$s on public.%1$s for select to authenticated using ((select public.is_owner()))', t);
  end loop;
end $$;

revoke insert, update, delete on public.of_tasks, public.of_alerts, public.of_status from authenticated;
revoke all on public.of_tasks, public.of_alerts, public.of_status from anon;
