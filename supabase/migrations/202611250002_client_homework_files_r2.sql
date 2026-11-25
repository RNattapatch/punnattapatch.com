-- Attachments moved to Cloudflare R2 (bucket client-homework-files, Worker offer-api binding HW_FILES):
-- Pun wants no size limit, Supabase Free caps uploads at 50 MB per file and 1 GB total. Applied 2026-11-25.
-- The empty Supabase bucket "homework" from 202611250001 is left unused (storage rows can't be deleted from SQL).
alter table public.client_homework_files alter column bytes type bigint;
comment on column public.client_homework_files.path is 'R2 key in bucket client-homework-files: <slug>/<uuid>.<ext>';
