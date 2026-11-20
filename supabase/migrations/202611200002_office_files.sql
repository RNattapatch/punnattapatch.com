-- AI Office files — ไฟล์ที่ agent เขียนใน office/outputs ขึ้น Google Drive + คิวกดส่งเข้า Telegram/LINE
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-20-office-files-drive-send-design.md
-- ใครเขียน: office-desk บนมินิ (service role) · หน้าเว็บอ่าน of_files และเพิ่มแถว of_sends ได้แค่ file_id + channel

create table if not exists public.of_files (
  id          bigserial primary key,
  task_id     bigint not null references public.of_tasks(id) on delete cascade,
  rel_path    text not null check (rel_path !~ '(^/|(^|/)\.\.(/|$))'),   -- ใต้ office/outputs
  name        text not null,
  mime        text,
  size_bytes  bigint not null default 0,
  sha256      text not null,
  drive_id    text,
  drive_url   text check (drive_url is null or drive_url ~ '^https://(drive|docs)\.google\.com/'),
  drive_path  text,                                                     -- path ใน remote gdrive: (desk ใช้ export PDF)
  drive_kind  text not null default 'file' check (drive_kind in ('file', 'gdoc')),
  missing     boolean not null default false,                           -- ไฟล์หายจากดิสก์ = true ไม่ลบแถว
  uploaded_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (task_id, rel_path)
);
create index if not exists of_files_task on public.of_files (task_id);

create table if not exists public.of_sends (
  id               bigserial primary key,
  file_id          bigint not null references public.of_files(id) on delete cascade,
  channel          text not null check (channel in ('telegram', 'line')),
  status           text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  error            text,
  share_path       text,          -- สำเนาใน bucket documents สำหรับลิงก์ลูกค้า · null = ลบแล้ว/ไม่มี
  share_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);
create index if not exists of_sends_file on public.of_sends (file_id, created_at desc);
create index if not exists of_sends_queue on public.of_sends (status, created_at) where status in ('queued', 'sending');

do $$
declare t text;
begin
  foreach t in array array['of_files', 'of_sends'] loop
    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists owner_read_%1$s on public.%1$s', t);
    execute format('create policy owner_read_%1$s on public.%1$s for select to authenticated using ((select public.is_owner()))', t);
    execute format('revoke insert, update, delete on public.%1$s from authenticated', t);
    execute format('revoke all on public.%1$s from anon', t);
  end loop;
end $$;

-- ปุ่มส่งในหน้าเว็บ: เพิ่มแถวได้แค่ file_id + channel · status เป็น queued เสมอ (ค่า default) · แก้/ลบไม่ได้
grant insert (file_id, channel) on public.of_sends to authenticated;
grant usage on sequence public.of_sends_id_seq to authenticated;
drop policy if exists owner_insert_of_sends on public.of_sends;
create policy owner_insert_of_sends on public.of_sends for insert to authenticated
  with check ((select public.is_owner()) and status = 'queued');
