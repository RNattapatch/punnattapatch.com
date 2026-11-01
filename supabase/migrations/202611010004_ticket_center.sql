-- Ticket Center — เคสลูกค้า (แจ้งผ่านบอท LINE ในกลุ่ม / อีเมล) + งานที่ส่งให้ agent ทำต่อ
-- runbook: claude-code-pun-nattapatch/mac-mini-ops/ticket-desk/README.md
--
-- ใครเขียนอะไร:
--   edge function ticket-line-webhook (service role) → td_inbox (เฉพาะข้อความที่แท็กบอท/อ้างเลข ticket + event เข้า/ออกกลุ่ม)
--   desk-sync บนมินิ (service role)                 → td_tickets · td_projects · td_tasks · td_agent_runs · td_status · สถานะ td_actions/td_inbox
--   หน้า /app/tickets (เจ้าของเท่านั้น ผ่าน RLS)      → td_actions (คำสั่ง pending) อย่างเดียว
-- ไฟล์ ticket จริงอยู่บนมินิ (~/Library/PunOps/ticket-desk) · ตารางนี้คือกระจกให้ดู + คิวคำสั่ง

create table if not exists public.td_tickets (
  id          text primary key check (id ~ '^TK-[0-9]{6}-[0-9a-f]{6}$'),
  project     text not null,
  client      text,
  system_name text,
  title       text not null,
  status      text not null,
  source      text not null check (source in ('line', 'email', 'form', 'manual')),
  reporter    text,
  urgency     text,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  data        jsonb not null default '{}'          -- สเปก · ประวัติ · ขั้นของ agent · diff stat · รีวิว (ไม่มี token/คำสั่ง shell)
);
create index if not exists td_tickets_updated on public.td_tickets (updated_at desc);

create table if not exists public.td_actions (
  id                 uuid primary key default gen_random_uuid(),
  ticket_id          text references public.td_tickets(id) on delete cascade,
  kind               text not null check (kind in ('approve', 'decline', 'rerun', 'close', 'bind_group')),
  note               text check (note is null or char_length(note) between 1 and 2000),
  payload            jsonb not null default '{}' check (pg_column_size(payload) < 2048),
  status             text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  result             text,
  client_request_id  uuid not null unique,         -- กดซ้ำ/เน็ตกระตุก = แถวเดียว
  created_by         text,
  created_at         timestamptz not null default now(),
  done_at            timestamptz,
  check (kind = 'bind_group' or ticket_id is not null)
);
create index if not exists td_actions_pending on public.td_actions (created_at) where status = 'pending';

create table if not exists public.td_inbox (
  id            bigint generated always as identity primary key,
  source        text not null check (source in ('line')),
  event         jsonb not null check (pg_column_size(event) < 16384),
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  result        text
);
create index if not exists td_inbox_pending on public.td_inbox (id) where processed_at is null;

create table if not exists public.td_projects (
  slug         text primary key,
  client       text,
  name         text,
  line_groups  jsonb not null default '[]',        -- [{id, name}]
  emails       text[] not null default '{}',
  auto_ship    boolean not null default false,
  has_tests    boolean not null default false,
  updated_at   timestamptz not null default now()
);

create table if not exists public.td_tasks (
  id             text primary key,                 -- TASK-ID ของ Task Packet ใน handoffs/active
  title          text,
  status         text,
  current_owner  text,
  next_owner     text,
  path           text,
  updated_at     timestamptz
);

create table if not exists public.td_agent_runs (
  id         text primary key,                     -- ts|job
  ts         timestamptz not null,
  job        text not null,
  provider   text,
  ok         boolean not null,
  degraded   boolean not null default false,
  ms         integer,
  attempts   text
);
create index if not exists td_agent_runs_ts on public.td_agent_runs (ts desc);

create table if not exists public.td_status (
  key         text primary key,                    -- 'desk' (heartbeat · ช่องทางพร้อมไหม) · 'groups' (กลุ่ม LINE ที่บอทอยู่)
  data        jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.td_tickets    enable row level security;
alter table public.td_actions    enable row level security;
alter table public.td_inbox      enable row level security;
alter table public.td_projects   enable row level security;
alter table public.td_tasks      enable row level security;
alter table public.td_agent_runs enable row level security;
alter table public.td_status     enable row level security;

-- อ่านได้: เจ้าของเท่านั้น
do $$
declare t text;
begin
  foreach t in array array['td_tickets', 'td_actions', 'td_inbox', 'td_projects', 'td_tasks', 'td_agent_runs', 'td_status'] loop
    execute format('drop policy if exists owner_read_%1$s on public.%1$s', t);
    execute format('create policy owner_read_%1$s on public.%1$s for select to authenticated using ((select public.is_owner()))', t);
  end loop;
end $$;

-- เขียนได้: แค่สร้างคำสั่ง pending (มินิเป็นคนตัดสินว่าคำสั่งใช้ได้ไหม และเปลี่ยนสถานะเอง)
drop policy if exists owner_insert_td_actions on public.td_actions;
create policy owner_insert_td_actions on public.td_actions
  for insert to authenticated
  with check ((select public.is_owner()) and status = 'pending' and result is null and done_at is null);

revoke insert, update, delete on public.td_tickets, public.td_inbox, public.td_projects, public.td_tasks, public.td_agent_runs, public.td_status from authenticated;
revoke update, delete on public.td_actions from authenticated;
revoke all on public.td_tickets, public.td_actions, public.td_inbox, public.td_projects, public.td_tasks, public.td_agent_runs, public.td_status from anon;

-- LINE ส่ง event ซ้ำได้ (redelivery) — webhookEventId เดียว = แถวเดียว
alter table public.td_inbox add column if not exists eid text generated always as (event->>'eid') stored;
create unique index if not exists td_inbox_eid on public.td_inbox (eid);

-- อีเมล support@punnattapatch.com (Cloudflare Email Routing → worker ticket-mail) เข้าคิวเดียวกับ LINE
alter table public.td_inbox drop constraint if exists td_inbox_source_check;
alter table public.td_inbox add constraint td_inbox_source_check check (source in ('line', 'email'));
-- รูปที่ลูกค้าแนบอีเมล · ส่วนตัว (ไม่มี policy = มีแค่ service role ของ worker/มินิที่แตะได้)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-media', 'ticket-media', false, 10485760, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do nothing;
