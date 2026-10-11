-- Funnel Lab media (2026-10-12) — applied ผ่าน Supabase MCP (funnel_lab_media)
-- รูป/วิดีโอของแต่ละข้อความ → bucket ส่วนตัว funnel-lab-media ที่ <creativeId>/<sha256>.<ext>
-- → ปุ่ม "ให้ Codex ดูรูป/คลิปจริง" → wr_jobs.funnel_media_eval → mac-mini-ops/services/funnel_media_worker.mjs
--   (คิวแยกจาก wrjobs_worker เพื่อไม่ให้งานวิดีโอหลายนาทีบล็อกงาน Content Center)
-- ขนาด ≤ 50 MB · ชนิดไฟล์เดียวกับที่หน้าเว็บรับ · อ่าน/เขียน/ลบได้เฉพาะบัญชีคุณปัน (is_owner)
-- ทดสอบ RLS 2026-10-12: owner เขียน+อ่านได้ · บัญชีอื่นมองไม่เห็น (0 แถว) และ insert ถูกปฏิเสธ

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('funnel-lab-media', 'funnel-lab-media', false, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists funnel_lab_media_owner_select on storage.objects;
drop policy if exists funnel_lab_media_owner_insert on storage.objects;
drop policy if exists funnel_lab_media_owner_update on storage.objects;
drop policy if exists funnel_lab_media_owner_delete on storage.objects;
create policy funnel_lab_media_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'funnel-lab-media' and (select public.is_owner()));
create policy funnel_lab_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'funnel-lab-media' and (select public.is_owner()));
create policy funnel_lab_media_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'funnel-lab-media' and (select public.is_owner()))
  with check (bucket_id = 'funnel-lab-media' and (select public.is_owner()));
create policy funnel_lab_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'funnel-lab-media' and (select public.is_owner()));

alter table public.wr_jobs drop constraint if exists wr_jobs_job_type_check;
alter table public.wr_jobs add constraint wr_jobs_job_type_check check (job_type = any (array[
  'render_card', 'ai_improve', 'publish', 'rewrite_copy', 'render_text_card', 'rewrite_reel', 'render_notes', 'growth_eval', 'funnel_media_eval'
]));
