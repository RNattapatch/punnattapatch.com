-- client_homework — "การบ้านก่อนเริ่มโครงการ" as a link the client fills in, autosaved, at punnattapatch.com/homework/<slug>
-- Same security model as offers (202611240001): owner-only RLS, anon gets nothing, the Worker "offer-api" uses service_role.
-- Several departments fill one link at the same time, so answers merge per question in homework_save() (no whole-object overwrite).

create table if not exists public.client_homework (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[0-9a-f]{32}$'),   -- 128-bit CSPRNG, the only secret
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'open' check (status in ('open','submitted','closed','void')),
  title text not null,
  client_display_name text not null,
  due_date date,
  content jsonb not null default '{}'::jsonb,   -- {intro, tldr[], sections:[{id,title,note,items:[{id,q,who,kind}]}], later[]}
  answers jsonb not null default '{}'::jsonb,   -- {"1.1.1": {"text": "...", "by": "ชื่อ", "at": "iso"}}
  source_path text,
  first_opened_at timestamptz,
  last_saved_at timestamptz,
  submitted_at timestamptz,
  submit_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_homework_files (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.client_homework(id) on delete cascade,
  qid text not null check (length(qid) <= 20),
  path text not null unique,                    -- storage object in bucket "homework": <slug>/<uuid>.<ext>
  name text not null check (length(name) <= 160),
  mime text not null,
  bytes int not null,
  created_at timestamptz not null default now()
);
create index if not exists client_homework_files_hw on public.client_homework_files (homework_id, qid);
create index if not exists client_homework_lead on public.client_homework (lead_id);

alter table public.client_homework enable row level security;
alter table public.client_homework_files enable row level security;
drop policy if exists client_homework_owner_all on public.client_homework;
create policy client_homework_owner_all on public.client_homework for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists client_homework_files_owner_all on public.client_homework_files;
create policy client_homework_files_owner_all on public.client_homework_files for all to authenticated using (public.is_owner()) with check (public.is_owner());
revoke all on public.client_homework, public.client_homework_files from anon, public;
grant select, insert, update, delete on public.client_homework, public.client_homework_files to authenticated;

create or replace function public.client_homework_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
revoke execute on function public.client_homework_touch() from anon, public;
drop trigger if exists client_homework_touch on public.client_homework;
create trigger client_homework_touch before update on public.client_homework for each row execute function public.client_homework_touch();

-- Merge answers per question key so two people saving different questions never overwrite each other.
create or replace function public.homework_save(p_slug text, p_patch jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := now();
begin
  update public.client_homework
     set answers = answers || p_patch, last_saved_at = v_at
   where slug = p_slug and status in ('open','submitted');
  if not found then raise exception 'homework_not_open'; end if;
  return v_at;
end $$;
revoke execute on function public.homework_save(text, jsonb) from anon, authenticated, public;
grant execute on function public.homework_save(text, jsonb) to service_role;

-- Private bucket; the Worker streams files with service_role. 10 MB cap, images and PDF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homework', 'homework', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
