-- LINE Broadcast Library (applied to yykocvhorgcgzaluuldn 2026-10-18 via MCP apply_migration "line_rounds_broadcast_library")
-- spec: knowledge repo docs/superpowers/specs/2026-10-18-line-broadcast-library-design.md
alter type media_asset_type add value if not exists 'line_image';

create table public.line_rounds (
  round_id uuid primary key default gen_random_uuid(),
  variant_id text not null references public.content_variants(variant_id) on delete cascade,
  round_code text not null check (round_code ~ '^[A-Z0-9]{1,6}$'),
  role text not null default 'main' check (role in ('main','alternate')),
  text_body text not null,
  text_units int,
  image_asset_id uuid references public.media_assets(asset_id) on delete set null,
  link_url text,
  utm_campaign text,
  status text not null default 'ready' check (status in ('draft','ready','sent','skipped','unknown')),
  planned_at timestamptz,
  sent_at timestamptz,
  source_path text,
  text_sha text,
  edited_in_app boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, round_code)
);
comment on table public.line_rounds is 'One LINE OA broadcast send (image + 1 bubble text) per row; variant format line_broadcast. Pun sends by hand in OA Manager.';

create index line_rounds_image_idx on public.line_rounds (image_asset_id);
create index line_rounds_text_trgm on public.line_rounds using gin (text_body gin_trgm_ops);

alter table public.line_rounds enable row level security;
create policy owner_all_line_rounds on public.line_rounds for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

create trigger line_rounds_touch before update on public.line_rounds
  for each row execute function public.touch_updated_at();

create or replace function public.search_line_rounds(q text)
returns table (round_id uuid, score real)
language sql stable
set search_path = public
as $$
  select r.round_id,
         greatest(similarity(r.text_body, q), similarity(coalesce(v.working_title,''), q), similarity(coalesce(i.title,''), q)) as score
  from line_rounds r
  join content_variants v on v.variant_id = r.variant_id
  join content_items i on i.content_id = v.content_id
  where concat_ws(' ', r.text_body, v.working_title, i.title, r.round_code, r.utm_campaign, v.content_id) ilike '%' || q || '%'
     or r.text_body % q
  order by score desc
  limit 100;
$$;
revoke execute on function public.search_line_rounds(text) from anon;
