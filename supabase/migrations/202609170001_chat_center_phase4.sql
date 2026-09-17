-- Chat Center เฟส 4 — campaign registry + สถิติ keyword + เนื้อการ์ดของฟรี
--
-- chat_keywords เดิมเก็บแค่ "คำกับโหมด match" แต่ oa-freebies.json มีอีก 14 field ที่ประกอบเป็น
-- การ์ด Flex จริง (title · blurb · url · howto · image · notify · startsAt/expiresAt ฯลฯ)
-- ถ้า publish กลับโดยไม่มีของพวกนี้ การ์ดของฟรีจะเหลือแต่คำ = พังทันที
-- เก็บส่วนที่เหลือทั้งก้อนเป็น jsonb เพื่อให้วนกลับได้ครบ โดยไม่ต้องไล่ทำคอลัมน์ทีละอัน
alter table public.chat_keywords
  add column if not exists card jsonb not null default '{}';
comment on column public.chat_keywords.card is 'field ที่เหลือของรายการใน oa-freebies.json (title/blurb/url/howto/…) — pull-brain ประกอบคืนตอน publish';

-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-09-15-chat-center-spec.md §5, §9
create table if not exists public.chat_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  channel      text not null,                       -- fb-ads | tiktok | organic | broadcast | line-oa
  offer_code   text references public.chat_offers(code),
  keyword_id   uuid references public.chat_keywords(id),
  utm          text,
  creative_url text,
  starts_on    date,
  ends_on      date,
  status       text not null default 'planned',     -- planned | running | paused | ended
  note         text
);

-- สถิติว่าคำไหนถูกพิมพ์เข้ามาจริง · user_hash เท่านั้น ห้ามเก็บ LINE userId ดิบ (สเปก §9)
create table if not exists public.chat_keyword_hits (
  id           bigserial primary key,
  hit_at       timestamptz not null default now(),
  keyword_id   uuid references public.chat_keywords(id) on delete set null,
  matched_text text not null,                       -- คำที่ลูกค้าพิมพ์จริง ใช้ดูว่าพิมพ์ผิดรูปยังไง
  channel      text not null,                       -- line | messenger
  user_hash    text,
  offer_code   text,
  outcome      text not null                        -- sent | near_miss | blocked_maxlen | disabled
);
create index if not exists chat_keyword_hits_at_idx  on public.chat_keyword_hits (hit_at desc);
create index if not exists chat_keyword_hits_kw_idx  on public.chat_keyword_hits (keyword_id, hit_at desc);

create or replace view public.v_chat_keyword_stats as
select k.id, k.keyword, k.offer_code, k.enabled,
       count(h.*) filter (where h.hit_at > now() - interval '30 days') as hits_30d,
       count(h.*) filter (where h.hit_at > now() - interval '7 days')  as hits_7d,
       count(h.*) filter (where h.outcome = 'near_miss' and h.hit_at > now() - interval '30 days') as near_miss_30d,
       max(h.hit_at) as last_hit_at
from public.chat_keywords k
left join public.chat_keyword_hits h on h.keyword_id = k.id
group by k.id;

alter table public.chat_campaigns     enable row level security;
alter table public.chat_keyword_hits  enable row level security;

drop policy if exists owner_all_chat_campaigns on public.chat_campaigns;
create policy owner_all_chat_campaigns on public.chat_campaigns
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

drop policy if exists owner_all_chat_keyword_hits on public.chat_keyword_hits;
create policy owner_all_chat_keyword_hits on public.chat_keyword_hits
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
