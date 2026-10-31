-- Chat Single Gateway phase 1 (LINE OA) — inbox ที่คุณปันตอบแชทได้จากหน้าเว็บ
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-01-chat-single-gateway-phase1.md
--
-- ใครเขียนอะไร:
--   gateway-sync บนมินิ (service role) → gw_contacts · gw_messages (in/bot/staff) · gw_status · อัปเดตสถานะ gw_outbox
--   หน้า /app/gateway (เจ้าของเท่านั้น ผ่าน RLS) → gw_outbox (สั่งส่ง/พักบอท) · gw_messages dir='note' · tags/last_read_at ของ gw_contacts
-- บอทเดิม (line-relay) ไม่รู้จักตารางพวกนี้เลย — ไม่มีโค้ดบอทถูกแก้

create table if not exists public.gw_contacts (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null check (channel in ('line', 'messenger')),
  external_id      text not null check (char_length(external_id) between 1 and 80),
  display_name     text,
  picture_url      text,
  lead_id          uuid references public.leads(id) on delete set null,
  tags             text[] not null default '{}' check (cardinality(tags) <= 20),
  last_message_at  timestamptz,
  last_in_at       timestamptz,
  last_preview     text,
  last_read_at     timestamptz,
  bot_hold_until   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (channel, external_id)
);

create table if not exists public.gw_messages (
  id          bigint generated always as identity primary key,
  contact_id  uuid not null references public.gw_contacts(id) on delete cascade,
  dir         text not null check (dir in ('in', 'bot', 'staff', 'note')),
  body        text not null check (char_length(body) between 1 and 5000),
  ts          timestamptz not null,
  source_key  text unique,                      -- กันซ้ำตอน mirror จากไฟล์บอท (null = note ที่เขียนจากหน้าเว็บ)
  created_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists gw_messages_contact_ts on public.gw_messages (contact_id, ts);

create table if not exists public.gw_outbox (
  id                 uuid primary key default gen_random_uuid(),
  contact_id         uuid not null references public.gw_contacts(id) on delete cascade,
  kind               text not null check (kind in ('text', 'hold', 'release')),
  body               text check (body is null or char_length(body) between 1 and 2000),
  hold_minutes       int check (hold_minutes is null or hold_minutes between 5 and 1440),
  status             text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  error              text,
  attempts           int not null default 0,
  client_request_id  uuid not null unique,      -- กดส่งซ้ำ/เน็ตกระตุก = แถวเดียว
  created_by         text,
  created_at         timestamptz not null default now(),
  sent_at            timestamptz,
  check (kind <> 'text' or body is not null)
);
create index if not exists gw_outbox_pending on public.gw_outbox (created_at) where status = 'pending';
create index if not exists gw_outbox_contact on public.gw_outbox (contact_id, created_at);

create table if not exists public.gw_status (
  key         text primary key,                 -- 'line'
  data        jsonb not null default '{}',      -- โหมดบอท · โควตา push · heartbeat · จำนวน hold
  updated_at  timestamptz not null default now()
);

-- RLS: เจ้าของเท่านั้น (แม่แบบเดียวกับ chat_* · ห่อ select ให้ initplan ทำงาน) · มินิใช้ service role
alter table public.gw_contacts enable row level security;
alter table public.gw_messages enable row level security;
alter table public.gw_outbox   enable row level security;
alter table public.gw_status   enable row level security;

drop policy if exists owner_all_gw_contacts on public.gw_contacts;
create policy owner_all_gw_contacts on public.gw_contacts
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- ข้อความจากลูกค้า/บอท/ที่ส่งไปแล้ว = ประวัติ ห้ามแก้จากหน้าเว็บ · หน้าเว็บเขียนได้แค่ note
drop policy if exists owner_read_gw_messages on public.gw_messages;
create policy owner_read_gw_messages on public.gw_messages
  for select to authenticated using ((select public.is_owner()));
drop policy if exists owner_note_gw_messages on public.gw_messages;
create policy owner_note_gw_messages on public.gw_messages
  for insert to authenticated with check ((select public.is_owner()) and dir = 'note' and source_key is null);
drop policy if exists owner_delete_note_gw_messages on public.gw_messages;
create policy owner_delete_note_gw_messages on public.gw_messages
  for delete to authenticated using ((select public.is_owner()) and dir = 'note');

-- outbox: เจ้าของสร้างคำสั่งใหม่ได้เฉพาะสถานะ pending และอ่านผลได้ · เปลี่ยนสถานะเป็นงานของมินิเท่านั้น
drop policy if exists owner_read_gw_outbox on public.gw_outbox;
create policy owner_read_gw_outbox on public.gw_outbox
  for select to authenticated using ((select public.is_owner()));
drop policy if exists owner_insert_gw_outbox on public.gw_outbox;
create policy owner_insert_gw_outbox on public.gw_outbox
  for insert to authenticated with check ((select public.is_owner()) and status = 'pending' and attempts = 0 and error is null and sent_at is null);

drop policy if exists owner_read_gw_status on public.gw_status;
create policy owner_read_gw_status on public.gw_status
  for select to authenticated using ((select public.is_owner()));

-- หน้าเว็บแก้ได้แค่ tags + last_read_at + lead_id ของ contact (ที่เหลือมินิเขียน) — column grant กันแก้ชื่อ/ID ลูกค้า
revoke update on public.gw_contacts from authenticated;
grant update (tags, last_read_at, lead_id, updated_at) on public.gw_contacts to authenticated;
revoke insert, delete on public.gw_contacts from authenticated;
revoke update on public.gw_messages from authenticated;
revoke update, delete on public.gw_outbox from authenticated;
revoke insert, update, delete on public.gw_status from authenticated;
revoke all on public.gw_contacts, public.gw_messages, public.gw_outbox, public.gw_status from anon;
