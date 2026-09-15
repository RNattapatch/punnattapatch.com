-- Chat Center — สถานะการส่งของให้บอท (ย้ายมาจากเฟส 4 มาสร้างตอน M3)
-- เหตุผล: แท็บ Publish ต้อง "อ่าน" สถานะได้ตั้งแต่ M3 เพื่อบอกว่าแก้อะไรแล้วยังไม่ถึงบอท
-- ส่วนการ "สั่ง" publish/rollback เปิดใน M4 ตอนที่ pull-brain.mjs ฝั่งมินิมีจริง (spec §17)
create table if not exists public.chat_publish (
  file           text primary key,          -- oa-service-scripts.json | oa-freebies.json
  status         text not null default 'idle',   -- idle | requested | applied | failed
  requested_at   timestamptz,
  requested_by   text,
  db_hash        text,                      -- sha256 ของ payload ที่ควรเป็น
  bot_hash       text,                      -- มินิรายงานกลับหลังเขียนไฟล์จริง
  bot_written_at timestamptz,
  error          text
);

create table if not exists public.chat_publish_versions (
  id         bigserial primary key,
  file       text not null,
  payload    jsonb not null,
  hash       text not null,
  created_at timestamptz not null default now(),
  created_by text,
  note       text
);
create index if not exists chat_publish_versions_file_idx on public.chat_publish_versions (file, created_at desc);

alter table public.chat_publish          enable row level security;
alter table public.chat_publish_versions enable row level security;

drop policy if exists owner_all_chat_publish on public.chat_publish;
create policy owner_all_chat_publish on public.chat_publish
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists owner_all_chat_publish_versions on public.chat_publish_versions;
create policy owner_all_chat_publish_versions on public.chat_publish_versions
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- สองไฟล์ที่ Chat Center เป็นเจ้าของ · ยังไม่เคยส่ง จึง bot_written_at เป็น null
insert into public.chat_publish (file, status) values ('oa-service-scripts.json', 'idle'), ('oa-freebies.json', 'idle')
on conflict (file) do nothing;
