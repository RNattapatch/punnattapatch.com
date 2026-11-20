-- Applied to production 2026-11-20 via Supabase MCP (migration name: class_quiz_results).
-- Class quiz results (pre/post quiz on /class/* pages, first user /class/tni/). Separate from leads/audience on
-- purpose: learners are not customers. Browser writes only through submit_class_quiz(); anon cannot read the table.
-- Read results (SQL editor / service role):
--   select created_at, quiz, nickname, department, score, total, level from class_quiz_results
--   where class_slug = 'tni-w1' order by quiz, created_at;
create table if not exists public.class_quiz_results (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  attempt_id  text not null unique,
  class_slug  text not null,
  quiz        text not null check (quiz in ('pre','post')),
  nickname    text not null,
  department  text not null default '',
  score       smallint not null,
  total       smallint not null,
  level       smallint,
  answers     jsonb not null default '[]'::jsonb,
  page_path   text not null default '',
  user_agent  text not null default ''
);
create index if not exists class_quiz_results_class_idx on public.class_quiz_results (class_slug, quiz, created_at);

alter table public.class_quiz_results enable row level security;
revoke all on public.class_quiz_results from anon, authenticated;

create or replace function public.submit_class_quiz(payload jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_attempt text := nullif(trim(payload->>'attempt_id'), '');
  v_class   text := nullif(trim(payload->>'class_slug'), '');
  v_quiz    text := nullif(trim(payload->>'quiz'), '');
  v_nick    text := nullif(trim(payload->>'nickname'), '');
  v_score   int;
  v_total   int;
  v_level   int;
begin
  if v_attempt is null or v_class is null or v_nick is null or v_quiz not in ('pre','post') then
    raise exception 'missing field' using errcode = '22023';
  end if;
  if length(payload::text) > 8000 or jsonb_typeof(coalesce(payload->'answers','[]'::jsonb)) <> 'array' then
    raise exception 'bad payload' using errcode = '22023';
  end if;
  v_score := (payload->>'score')::int;
  v_total := (payload->>'total')::int;
  v_level := nullif(payload->>'level','')::int;
  if v_total not between 1 and 30 or v_score not between 0 and v_total or (v_level is not null and v_level not between 1 and 5) then
    raise exception 'bad score' using errcode = '22023';
  end if;

  insert into public.class_quiz_results
    (attempt_id, class_slug, quiz, nickname, department, score, total, level, answers, page_path, user_agent)
  values (
    left(v_attempt, 64), left(v_class, 40), v_quiz, left(v_nick, 60),
    left(coalesce(trim(payload->>'department'), ''), 80),
    v_score, v_total, v_level,
    coalesce(payload->'answers', '[]'::jsonb),
    left(coalesce(payload->>'page_path', ''), 200),
    left(coalesce(payload->>'user_agent', ''), 300)
  )
  on conflict (attempt_id) do nothing; -- double tap / retry = one row
end;
$$;

revoke all on function public.submit_class_quiz(jsonb) from public;
grant execute on function public.submit_class_quiz(jsonb) to anon, authenticated;
