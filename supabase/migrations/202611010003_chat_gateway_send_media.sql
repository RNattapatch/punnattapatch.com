-- Chat Single Gateway — ส่งสติกเกอร์ + รูป/ไฟล์ จากหน้าเว็บ (2026-11-01 รอบ 3)
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-01-chat-single-gateway-phase1.md §10
--
-- kind='sticker' payload {packageId, stickerId} — เฉพาะสติกเกอร์ที่ LINE ให้บอทส่งได้ (มินิเช็คกับรายการ 456 ตัวอีกชั้น)
-- kind='media'   payload [{type:'image'|'file', path, preview_path?, name, size}] 1–4 ชิ้น + body เป็นคำบรรยายได้
--   ไฟล์ต้องอยู่ใต้ upload/<contact นั้น>/ (มินิเช็ค) · รูปส่งเป็นข้อความรูปของ LINE · ไฟล์อื่นส่งเป็นลิงก์ 30 วัน (LINE ไม่ให้บอทส่งไฟล์)

alter table public.gw_outbox add column if not exists payload jsonb;
alter table public.gw_outbox drop constraint if exists gw_outbox_kind_check;
alter table public.gw_outbox add constraint gw_outbox_kind_check check (kind in ('text', 'hold', 'release', 'mode', 'sticker', 'media'));
alter table public.gw_outbox drop constraint if exists gw_outbox_sticker_payload;
alter table public.gw_outbox add constraint gw_outbox_sticker_payload check (
  kind <> 'sticker' or (jsonb_typeof(payload) = 'object' and payload ? 'packageId' and payload ? 'stickerId'));
alter table public.gw_outbox drop constraint if exists gw_outbox_media_payload;
alter table public.gw_outbox add constraint gw_outbox_media_payload check (
  kind <> 'media' or (jsonb_typeof(payload) = 'array' and jsonb_array_length(payload) between 1 and 4));
alter table public.gw_outbox drop constraint if exists gw_outbox_payload_size;
alter table public.gw_outbox add constraint gw_outbox_payload_size check (payload is null or pg_column_size(payload) < 8192);
