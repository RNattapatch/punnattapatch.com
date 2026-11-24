-- offers — interactive proposal pages at punnattapatch.com/proposal/<slug>
-- Design: knowledge repo wiki/pages/teardown-interactive-quote-page-vs-pdf-quote-2026-11.md
-- Read/write by the owner (dashboard, RLS is_owner()) and by the Worker "offer-api" with service_role.
-- anon gets NOTHING: no policy, no grant, no RPC (lesson of 202611210001).

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[0-9a-f]{32}$'),   -- 128-bit CSPRNG, same as doc-bot newShortId()
  lead_id uuid references public.leads(id) on delete set null,
  kind text not null check (kind in ('class','project','seminar')),
  status text not null default 'sent'
    check (status in ('draft','sent','viewed','chosen','paid','expired','void','superseded')),
  title text not null,
  client_display_name text not null,
  content jsonb not null default '{}'::jsonb,   -- tldr, scope, excluded, timeline, terms, faq, proof, next_step
  options jsonb not null default '[]'::jsonb,   -- [{group,key,label,price_thb,includes[],type,default}]
  valid_until date,
  decision_date date not null,                  -- Funnel v2: no link without a decision date
  walkthrough_at timestamptz,
  qo_document_id uuid references public.documents(id) on delete set null,
  superseded_by uuid references public.offers(id) on delete set null,
  source_path text,                             -- clients/<slug>/proposals/offer.json
  first_viewed_at timestamptz,
  view_count int not null default 0,
  chosen_options jsonb,                         -- last selection the client sent (Pun confirms in LINE)
  chosen_total_thb numeric,
  chosen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offer_events (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.offers(id) on delete cascade,
  evt text not null check (evt in ('open','choose','pdf','line')),
  meta jsonb not null default '{}'::jsonb,
  ip_hash text,
  at timestamptz not null default now()
);
create index if not exists offer_events_offer_at on public.offer_events (offer_id, at desc);
create index if not exists offers_lead on public.offers (lead_id);

alter table public.offers enable row level security;
alter table public.offer_events enable row level security;

drop policy if exists offers_owner_all on public.offers;
create policy offers_owner_all on public.offers for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists offer_events_owner_all on public.offer_events;
create policy offer_events_owner_all on public.offer_events for all to authenticated using (public.is_owner()) with check (public.is_owner());

revoke all on public.offers, public.offer_events from anon, public;
grant select, insert, update, delete on public.offers, public.offer_events to authenticated;

create or replace function public.offers_touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
revoke execute on function public.offers_touch_updated_at() from anon, public;
drop trigger if exists offers_touch on public.offers;
create trigger offers_touch before update on public.offers for each row execute function public.offers_touch_updated_at();
