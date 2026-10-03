-- Content Center: id ของโฟลเดอร์ชุด render ใน Google Drive (gdrive:Content Center/<แคมเปญ>/<CNT>/<variant>/<batch>/)
-- worker บนมินิ (wrjobs_worker.mjs archive/relocate sweep) เขียน · หน้าเว็บใช้ทำปุ่ม "📁 เปิดใน Drive"
-- → https://drive.google.com/drive/folders/<id> · applied ผ่าน Supabase MCP 2026-10-03 (media_assets_drive_folder_id)
alter table public.media_assets add column if not exists drive_folder_id text;
alter table public.media_assets drop constraint if exists media_assets_drive_folder_id_format;
alter table public.media_assets add constraint media_assets_drive_folder_id_format
  check (drive_folder_id is null or drive_folder_id ~ '^[A-Za-z0-9_-]{10,128}$');
comment on column public.media_assets.drive_folder_id is
  'Google Drive folder id of the render batch folder holding drive_file_id (set by wrjobs worker archive/relocate sweep)';
