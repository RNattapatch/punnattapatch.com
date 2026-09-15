-- Chat Center เฟส 2 — SSOT ของข้อความตอบแชตและ CTA keyword
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-09-15-chat-center-spec.md §5
--
-- หลักที่ schema นี้บังคับ: ไม่มีคอลัมน์ราคาในตารางไหนเลย
-- ข้อความเก็บ token {{price:<key>}} แล้ว render ตอนส่งจริงจาก catalog.json
-- ราคายังมี SSOT เดียวคือ src/data/pricing.mjs เหมือนเดิม

create table if not exists public.chat_offers (
  code          text primary key,                    -- T1 T2 T3 T4 C1 I1 P1
  pricing_key   text not null,                       -- → key ใน CATALOG (ชื่อ/ราคาดึงจากที่นั่น ไม่ copy มา)
  display_order int  not null default 100,
  one_liner     text not null,                       -- ประโยคเดียวว่าคืออะไร
  fit           text,                                -- ใครเหมาะ
  not_fit       text,                                -- ใครยังไม่เหมาะ
  next_step     text,                                -- ปลายทางที่อยากให้ลูกค้าไปต่อ
  lp_url        text,
  outline_url   text,
  enabled       boolean not null default true,
  updated_at    timestamptz not null default now()
);

create table if not exists public.chat_snippets (
  id          uuid primary key default gen_random_uuid(),
  offer_code  text not null references public.chat_offers(code) on delete cascade,
  slot        text not null,                         -- b1..b6 | faq
  channel     text not null default 'any',           -- any | line | messenger | manual
  body        text not null,                         -- มี {{price:<key>}} ได้ · ห้ามมีตัวเลขราคาดิบ
  faq_q       text,                                  -- ใช้เมื่อ slot = faq
  status      text not null default 'draft',         -- draft | live
  char_count  int generated always as (char_length(body)) stored,
  updated_at  timestamptz not null default now(),
  updated_by  text
);
-- unique ที่มี coalesce ต้องเป็น index ไม่ใช่ table constraint
create unique index if not exists chat_snippets_slot_uniq
  on public.chat_snippets (offer_code, slot, channel, coalesce(faq_q, ''));

create table if not exists public.chat_keywords (
  id          uuid primary key default gen_random_uuid(),
  keyword     text not null unique,                  -- คำหลักตามที่ประกาศในแอด
  aliases     text[] not null default '{}',
  match_mode  text not null default 'contains',      -- contains | exact
  max_len     int  not null default 60,              -- ข้อความยาวเกินนี้ไม่นับเป็น keyword
  offer_code  text references public.chat_offers(code),
  freebie_id  text,                                  -- ผูกกับ id เดิมใน oa-freebies.json
  declared_in jsonb not null default '[]',           -- [{type:'ad'|'lp'|'reel'|'broadcast',ref,url}]
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now()
);

create index if not exists chat_snippets_offer_idx on public.chat_snippets (offer_code, slot);
create index if not exists chat_keywords_offer_idx on public.chat_keywords (offer_code);

-- RLS: เจ้าของเท่านั้น (แม่แบบเดียวกับ public.documents — ห่อ select เพื่อให้ initplan ทำงาน)
alter table public.chat_offers   enable row level security;
alter table public.chat_snippets enable row level security;
alter table public.chat_keywords enable row level security;

drop policy if exists owner_all_chat_offers on public.chat_offers;
create policy owner_all_chat_offers on public.chat_offers
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists owner_all_chat_snippets on public.chat_snippets;
create policy owner_all_chat_snippets on public.chat_snippets
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists owner_all_chat_keywords on public.chat_keywords;
create policy owner_all_chat_keywords on public.chat_keywords
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
