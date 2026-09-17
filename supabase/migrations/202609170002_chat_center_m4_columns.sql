-- คอลัมน์ที่เพิ่มระหว่างทำ M4 — เพิ่มเพราะการประกอบไฟล์คืนพบว่าของหาย (สเปก §18.1)
-- ทั้งหมด apply ขึ้น Supabase ไปแล้ววันที่ 2026-09-17 ไฟล์นี้คือบันทึกให้รีโปมีประวัติตรงกัน

-- ชื่อและคำ trigger ที่ "ไฟล์ของบอท" ใช้ ไม่ใช่ชื่อการตลาดใน catalog
-- core-scripts.mjs:98 เอา bot_name ไปใส่ prompt · :81 เอา bot_keywords ไป match ข้อความลูกค้า
alter table public.chat_offers
  add column if not exists bot_name     text,
  add column if not exists bot_keywords text[] not null default '{}';

-- ลำดับ first-match-wins ของการ์ดของฟรี (core-freebies.mjs:168) — สลับลำดับ = การ์ดที่เคยชนะแพ้เงียบๆ
alter table public.chat_keywords
  add column if not exists display_order int not null default 100;

-- ลำดับ FAQ ต้องคงที่ ไม่งั้นเนื้อไฟล์ต่างทุกรอบ แล้ว pull-brain จะเขียนไฟล์ทุก 5 นาทีตลอดกาล
alter table public.chat_snippets
  add column if not exists display_order int not null default 100;

-- ย้อนเวอร์ชัน = เอาไฟล์เก่ากลับไปให้บอทใช้ ไม่ใช่ย้อนข้อมูลใน DB
-- หลังย้อน bot_hash จะไม่ตรง db_hash โดยตั้งใจ เพื่อให้หน้าเว็บขึ้นเตือนว่าบอทใช้ของเก่าอยู่
alter table public.chat_publish
  add column if not exists rollback_to_version bigint references public.chat_publish_versions(id);
