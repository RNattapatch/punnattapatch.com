-- Chat Single Gateway — ไฟล์แนบ + ตู้ไฟล์ลูกค้า + คุมโหมดบอท (2026-11-01 รอบ 2)
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-01-chat-single-gateway-phase1.md §9
--
-- รูป/วิดีโอ/เสียง/ไฟล์ที่ลูกค้าส่งทาง LINE: บอทจด metadata ลง oa_media.jsonl → gateway-sync ดึงไฟล์จาก LINE
-- → bucket ส่วนตัว gateway-media ที่ line/<userId>/<messageId>.<ext> → แถว gw_messages (kind/media) + gw_files (source=chat)
-- ไฟล์ที่คุณปันแนบเองในแท็บลูกค้า → gateway-media ที่ upload/<contactId>/<uuid>-<ชื่อไฟล์> + gw_files (source=upload)
-- อ่านได้เฉพาะเจ้าของ · หน้าเว็บเขียน storage ได้เฉพาะโฟลเดอร์ upload/ · ไฟล์จากแชทเป็นหลักฐาน ห้ามลบจากหน้าเว็บ

alter table public.gw_messages add column if not exists kind text not null default 'text'
  check (kind in ('text', 'image', 'video', 'audio', 'file', 'sticker', 'location'));
alter table public.gw_messages add column if not exists media jsonb;

alter table public.gw_contacts add column if not exists bot_notes text[] not null default '{}';
alter table public.gw_contacts add column if not exists blocked boolean not null default false;

-- คำสั่งโหมดบอททั้งร้านไม่ผูกลูกค้าคนไหน
alter table public.gw_outbox alter column contact_id drop not null;
alter table public.gw_outbox drop constraint if exists gw_outbox_kind_check;
alter table public.gw_outbox add constraint gw_outbox_kind_check check (kind in ('text', 'hold', 'release', 'mode'));
alter table public.gw_outbox add constraint gw_outbox_mode_body check (
  kind <> 'mode' or body in ('off', 'shadow', 'review', 'guard', 'auto_on', 'auto_off'));
alter table public.gw_outbox add constraint gw_outbox_contact_needed check (kind = 'mode' or contact_id is not null);

create table if not exists public.gw_files (
  id                  uuid primary key default gen_random_uuid(),
  contact_id          uuid not null references public.gw_contacts(id) on delete cascade,
  source              text not null check (source in ('chat', 'upload')),
  path                text not null unique,
  name                text not null check (char_length(name) between 1 and 200),
  mime                text,
  size_bytes          bigint check (size_bytes is null or size_bytes between 0 and 26214400),
  message_source_key  text,
  note                text check (note is null or char_length(note) <= 500),
  created_by          text,
  created_at          timestamptz not null default now()
);
create index if not exists gw_files_contact on public.gw_files (contact_id, created_at desc);

alter table public.gw_files enable row level security;
drop policy if exists owner_read_gw_files on public.gw_files;
create policy owner_read_gw_files on public.gw_files
  for select to authenticated using ((select public.is_owner()));
drop policy if exists owner_upload_gw_files on public.gw_files;
create policy owner_upload_gw_files on public.gw_files
  for insert to authenticated with check ((select public.is_owner()) and source = 'upload' and path like 'upload/' || contact_id::text || '/%');
drop policy if exists owner_delete_upload_gw_files on public.gw_files;
create policy owner_delete_upload_gw_files on public.gw_files
  for delete to authenticated using ((select public.is_owner()) and source = 'upload');
revoke update on public.gw_files from authenticated;
revoke all on public.gw_files from anon;

insert into storage.buckets (id, name, public, file_size_limit)
values ('gateway-media', 'gateway-media', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists gateway_media_owner_select on storage.objects;
drop policy if exists gateway_media_owner_insert on storage.objects;
drop policy if exists gateway_media_owner_delete on storage.objects;
create policy gateway_media_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'gateway-media' and (select public.is_owner()));
create policy gateway_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'gateway-media' and (select public.is_owner()) and name like 'upload/%');
create policy gateway_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'gateway-media' and (select public.is_owner()) and name like 'upload/%');

-- ประวัติที่ backfill มาตอนเปิดระบบไม่ใช่ "ข้อความใหม่" (หน้าเว็บขึ้น "ยังไม่อ่าน 302") — ทักมาก่อนวันเปิดใช้ = อ่านแล้ว
update public.gw_contacts set last_read_at = last_message_at
  where last_read_at is null and last_in_at < timestamptz '2026-11-01 00:00:00+07';
