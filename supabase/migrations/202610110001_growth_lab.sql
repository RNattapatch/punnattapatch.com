-- Growth Journey Lab (/app/growth-lab · 2026-10-11)
-- 1) growth_lab_workspaces — workspace ทั้งก้อน (Persona Packs · Touchpoints · ผลประเมิน · Journey · ผลจริง)
--    แถวเดียวต่อ workspace (id 'default') เพราะ is_owner() มี 2 อีเมลของคุณปัน → เปิดจากบัญชีไหน/เครื่องไหนก็เห็นชุดเดียวกัน
--    rev = optimistic lock: หน้าเว็บส่ง rev ที่เห็นล่าสุด → update ... where rev = X ไม่เจอแถว = อีกเครื่องเพิ่งบันทึก
--    หน้าเว็บจะโหลดฉบับนั้นมาแทน และเก็บฉบับของเครื่องนี้ไว้ให้ดาวน์โหลดจาก Settings (ไม่มีอะไรหายเงียบๆ)
-- 2) wr_jobs.job_type เพิ่ม 'growth_eval' — ปุ่ม "ประเมินด้วย Codex (มินิ)" → worker บน Mac mini รัน codex exec แบบปิดเครื่องมือทั้งหมด
-- applied ผ่าน Supabase MCP 2026-10-11 (growth_lab)

create table if not exists public.growth_lab_workspaces (
  id          text primary key default 'default',
  state       jsonb not null,
  rev         bigint not null default 1,
  device      text,
  updated_at  timestamptz not null default now(),
  constraint growth_lab_workspaces_id_format check (id ~ '^[a-z0-9-]{1,40}$'),
  constraint growth_lab_workspaces_state_object check (jsonb_typeof(state) = 'object'),
  constraint growth_lab_workspaces_state_size check (octet_length(state::text) <= 3000000),
  constraint growth_lab_workspaces_device_len check (device is null or char_length(device) <= 80),
  constraint growth_lab_workspaces_rev_positive check (rev >= 1)
);

alter table public.growth_lab_workspaces enable row level security;
-- RLS ปิดอยู่แล้วสำหรับ anon แต่ถอนสิทธิ์ตารางออกด้วยอีกชั้น (applied แยก: growth_lab_revoke_anon)
revoke all on public.growth_lab_workspaces from anon;

drop policy if exists owner_all_growth_lab_workspaces on public.growth_lab_workspaces;
create policy owner_all_growth_lab_workspaces on public.growth_lab_workspaces
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

comment on table public.growth_lab_workspaces is
  'Growth Journey Lab workspace state (one row per workspace, optimistic lock on rev) — app.punnattapatch.com/growth-lab';

alter table public.wr_jobs drop constraint if exists wr_jobs_job_type_check;
alter table public.wr_jobs add constraint wr_jobs_job_type_check check (job_type = any (array[
  'render_card', 'ai_improve', 'publish', 'rewrite_copy', 'render_text_card', 'rewrite_reel', 'render_notes', 'growth_eval'
]));

-- ---------- growth_lab_safety (applied 2026-10-11 หลัง review) ----------
-- 3) app_version = รูปแบบข้อมูลของหน้าเว็บที่เขียน · DB ปฏิเสธการเขียนจากหน้าเว็บรุ่นเก่ากว่า (แท็บเก่าที่เปิดค้างใน iPhone
--    จะไม่ทับข้อมูลรูปแบบใหม่) — หน้าเว็บเจอ error นี้แล้วเข้าโหมดอ่านอย่างเดียว ขอให้รีเฟรช
-- 4) growth_lab_workspace_history — ฉบับที่ถูกเขียนทับถูกเก็บไว้ (60 ฉบับล่าสุดต่อ workspace) เมื่อ: อีกเครื่องเขียน · รูปแบบข้อมูลเปลี่ยน ·
--    ฉบับเดิมอายุ ≥10 นาที · หรือถูกลบ (เครื่องเดียวกันพิมพ์ต่อเนื่องไม่เก็บทุกจังหวะ ประวัติจึงครอบคลุมเวลาจริง ไม่ใช่แค่ไม่กี่นาที)
--    กู้ได้ด้วย select state from growth_lab_workspace_history where workspace_id = 'default' order by archived_at desc
alter table public.growth_lab_workspaces add column if not exists app_version integer not null default 1;

create table if not exists public.growth_lab_workspace_history (
  id            bigint generated always as identity primary key,
  workspace_id  text not null,
  rev           bigint not null,
  app_version   integer not null,
  state         jsonb not null,
  device        text,
  saved_at      timestamptz not null,
  archived_at   timestamptz not null default now()
);
create index if not exists growth_lab_workspace_history_ws_idx on public.growth_lab_workspace_history (workspace_id, archived_at desc);
alter table public.growth_lab_workspace_history enable row level security;
revoke all on public.growth_lab_workspace_history from anon;
drop policy if exists owner_read_growth_lab_workspace_history on public.growth_lab_workspace_history;
create policy owner_read_growth_lab_workspace_history on public.growth_lab_workspace_history
  for select to authenticated using ((select public.is_owner()));

-- ---------- growth_lab_server_copies (applied 2026-10-11 หลัง review รอบ 3) ----------
-- history.kind: 'auto' (ทุก ≥10 นาที / อีกเครื่อง / รูปแบบเปลี่ยน · เก็บ 60) · 'before-overwrite' (เขียนทับโดยตั้งใจ: restore JSON,
-- import CSV, "ใช้ฉบับในเครื่องนี้แทน" — หน้าเว็บส่ง archive_previous = true) · 'local-replaced' / 'cloud-before-repair'
-- (หน้าเว็บส่งผ่าน growth_lab_keep_copy แทนการเก็บในเบราว์เซอร์ → ไม่ติดโควต้า ดาวน์โหลดได้จากทุกเครื่อง) · ชนิดที่ไม่ใช่ auto เก็บ 30
alter table public.growth_lab_workspace_history add column if not exists kind text not null default 'auto';
alter table public.growth_lab_workspace_history add column if not exists label text;
alter table public.growth_lab_workspace_history drop constraint if exists growth_lab_history_kind_check;
alter table public.growth_lab_workspace_history add constraint growth_lab_history_kind_check
  check (kind in ('auto', 'before-overwrite', 'local-replaced', 'cloud-before-repair'));
alter table public.growth_lab_workspace_history drop constraint if exists growth_lab_history_label_len;
alter table public.growth_lab_workspace_history add constraint growth_lab_history_label_len check (label is null or char_length(label) <= 200);
alter table public.growth_lab_workspaces add column if not exists archive_previous boolean not null default false;

create or replace function public.growth_lab_workspace_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_auto timestamptz;
  forced boolean := tg_op = 'UPDATE' and new.archive_previous;
begin
  if tg_op = 'UPDATE' and new.app_version < old.app_version then
    raise exception 'growth_lab: data version % is older than stored version %', new.app_version, old.app_version
      using errcode = 'P0001', hint = 'reload the page';
  end if;
  select max(h.archived_at) into last_auto from public.growth_lab_workspace_history h where h.workspace_id = old.id and h.kind = 'auto';
  if tg_op = 'DELETE' or forced
     or new.device is distinct from old.device
     or new.app_version <> old.app_version
     or coalesce(last_auto, '-infinity'::timestamptz) <= now() - interval '10 minutes' then
    insert into public.growth_lab_workspace_history (workspace_id, rev, app_version, state, device, saved_at, kind, label)
    values (old.id, old.rev, old.app_version, old.state, old.device, old.updated_at,
            case when forced then 'before-overwrite' else 'auto' end,
            case when forced then 'ฉบับคลาวด์ก่อนถูกเขียนทับโดยตั้งใจ' else null end);
  end if;
  delete from public.growth_lab_workspace_history h
  where h.workspace_id = old.id and h.kind = 'auto'
    and h.id not in (select h2.id from public.growth_lab_workspace_history h2 where h2.workspace_id = old.id and h2.kind = 'auto' order by h2.archived_at desc, h2.id desc limit 60);
  delete from public.growth_lab_workspace_history h
  where h.workspace_id = old.id and h.kind <> 'auto'
    and h.id not in (select h2.id from public.growth_lab_workspace_history h2 where h2.workspace_id = old.id and h2.kind <> 'auto' order by h2.archived_at desc, h2.id desc limit 30);
  if tg_op = 'DELETE' then return old; end if;
  new.archive_previous := false;
  return new;
end;
$$;
revoke all on function public.growth_lab_workspace_guard() from public, anon, authenticated;

create or replace function public.growth_lab_keep_copy(p_state jsonb, p_kind text, p_label text, p_device text, p_app_version integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare new_id bigint; current_rev bigint;
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_kind not in ('local-replaced', 'cloud-before-repair') then raise exception 'unknown copy kind %', p_kind; end if;
  if jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 3000000 then raise exception 'copy too large or not an object'; end if;
  select w.rev into current_rev from public.growth_lab_workspaces w where w.id = 'default';
  insert into public.growth_lab_workspace_history (workspace_id, rev, app_version, state, device, saved_at, kind, label)
  values ('default', coalesce(current_rev, 0), coalesce(p_app_version, 0), p_state, left(p_device, 80), now(), p_kind, left(p_label, 200))
  returning id into new_id;
  delete from public.growth_lab_workspace_history h
  where h.workspace_id = 'default' and h.kind <> 'auto'
    and h.id not in (select h2.id from public.growth_lab_workspace_history h2 where h2.workspace_id = 'default' and h2.kind <> 'auto' order by h2.archived_at desc, h2.id desc limit 30);
  return new_id;
end;
$$;
revoke all on function public.growth_lab_keep_copy(jsonb, text, text, text, integer) from public, anon;
grant execute on function public.growth_lab_keep_copy(jsonb, text, text, text, integer) to authenticated;

drop trigger if exists growth_lab_workspace_guard on public.growth_lab_workspaces;
create trigger growth_lab_workspace_guard
  before update or delete on public.growth_lab_workspaces
  for each row execute function public.growth_lab_workspace_guard();

-- ---------- growth_lab_results_split (applied 2026-10-11 หลัง review รอบ 4) ----------
-- 5) ผลประเมิน (evaluation + journey) แยกเป็นแถวละ touchpoint — ก้อนใหญ่ที่สุดของ workspace ไม่อยู่ในแถว core อีกต่อไป
--    (วัดจริง: ผล Codex 30 personas ≈130 KB/ชิ้น → แถวเดียว 3 MB เต็มที่ ~20 ชิ้น) · core เหลือ Pack/Touchpoint/ผลจริง/ตั้งค่า
--    แต่ละผลจด contentRevision ของข้อความที่ให้คะแนน
--    แก้ตามรีวิวรอบ 5 (applied growth_lab_results_by_key · ตารางรุ่นแรกยังไม่มีข้อมูลจึงสร้างใหม่ตามด้านล่าง):
--    ผลผูกกับ "สิ่งที่ให้คะแนน" (result_key = fingerprint ข้อความ + revision ของ pack) → ผลของข้อความเก่าทับผลข้อความปัจจุบันไม่ได้
--    คีย์เดียวกัน: Codex ชนะ Local เสมอ (ไม่เทียบนาฬิกาข้ามเครื่อง) · engine เดียวกัน → ใหม่กว่าชนะ · เก็บไม่เกิน 3 คีย์ต่อ touchpoint
-- 6) history: content_hash กันสำเนาซ้ำ · ตัดแยกถังตามชนิด (auto 60 · ชนิดอื่นชนิดละ 10)
create table if not exists public.growth_lab_results (
  workspace_id  text not null default 'default',
  creative_id   text not null,
  result_key    text not null,
  engine        text not null,
  evaluation    jsonb not null,
  journey       jsonb not null,
  evaluated_at  timestamptz not null,
  device        text,
  updated_at    timestamptz not null default now(),
  primary key (workspace_id, creative_id, result_key),
  constraint growth_lab_results_creative_id check (creative_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'),
  constraint growth_lab_results_key check (result_key ~ '^[A-Za-z0-9._:-]{1,120}$'),
  constraint growth_lab_results_engine check (engine in ('local', 'codex')),
  constraint growth_lab_results_objects check (jsonb_typeof(evaluation) = 'object' and jsonb_typeof(journey) = 'object'),
  constraint growth_lab_results_size check (octet_length(evaluation::text) + octet_length(journey::text) <= 2000000),
  constraint growth_lab_results_device_len check (device is null or char_length(device) <= 80)
);
alter table public.growth_lab_results enable row level security;
revoke all on public.growth_lab_results from anon;
drop policy if exists owner_all_growth_lab_results on public.growth_lab_results;
create policy owner_all_growth_lab_results on public.growth_lab_results
  for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

create or replace function public.growth_lab_results_keep_best()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.engine = 'codex' and new.engine = 'local' then return null; end if;          -- deeper result stays
  if old.engine = new.engine and new.evaluated_at < old.evaluated_at then return null; end if;
  return new;
end;
$$;
drop trigger if exists growth_lab_results_keep_best on public.growth_lab_results;
create trigger growth_lab_results_keep_best before update on public.growth_lab_results
  for each row execute function public.growth_lab_results_keep_best();

create or replace function public.growth_lab_results_trim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.growth_lab_results r
  where r.workspace_id = new.workspace_id and r.creative_id = new.creative_id
    and r.result_key not in (
      select r2.result_key from public.growth_lab_results r2
      where r2.workspace_id = new.workspace_id and r2.creative_id = new.creative_id
      order by r2.updated_at desc limit 3);
  return null;
end;
$$;
revoke all on function public.growth_lab_results_trim() from public, anon, authenticated;
drop trigger if exists growth_lab_results_trim on public.growth_lab_results;
create trigger growth_lab_results_trim after insert on public.growth_lab_results
  for each row execute function public.growth_lab_results_trim();

alter table public.growth_lab_workspace_history add column if not exists content_hash text;
update public.growth_lab_workspace_history set content_hash = md5(state::text) where content_hash is null;

create or replace function public.growth_lab_prune_history(p_workspace text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.growth_lab_workspace_history h
  where h.workspace_id = p_workspace
    and h.id not in (
      select ranked.id from (
        select h2.id, row_number() over (partition by h2.kind order by h2.archived_at desc, h2.id desc) as n, h2.kind
        from public.growth_lab_workspace_history h2 where h2.workspace_id = p_workspace
      ) ranked
      where ranked.n <= case when ranked.kind = 'auto' then 60 else 10 end
    );
$$;
revoke all on function public.growth_lab_prune_history(text) from public, anon, authenticated;

-- guard + keep_copy (final versions): same rules as above, plus content_hash and per-kind pruning via growth_lab_prune_history;
-- keep_copy returns the existing id when the same version of that kind is already kept, and accepts up to 6 MB.
create or replace function public.growth_lab_workspace_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_auto timestamptz;
  forced boolean := tg_op = 'UPDATE' and new.archive_previous;
begin
  if tg_op = 'UPDATE' and new.app_version < old.app_version then
    raise exception 'growth_lab: data version % is older than stored version %', new.app_version, old.app_version
      using errcode = 'P0001', hint = 'reload the page';
  end if;
  select max(h.archived_at) into last_auto from public.growth_lab_workspace_history h where h.workspace_id = old.id and h.kind = 'auto';
  if tg_op = 'DELETE' or forced
     or new.device is distinct from old.device
     or new.app_version <> old.app_version
     or coalesce(last_auto, '-infinity'::timestamptz) <= now() - interval '10 minutes' then
    insert into public.growth_lab_workspace_history (workspace_id, rev, app_version, state, device, saved_at, kind, label, content_hash)
    values (old.id, old.rev, old.app_version, old.state, old.device, old.updated_at,
            case when forced then 'before-overwrite' else 'auto' end,
            case when forced then 'ฉบับคลาวด์ก่อนถูกเขียนทับโดยตั้งใจ' else null end,
            md5(old.state::text));
    perform public.growth_lab_prune_history(old.id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.archive_previous := false;
  return new;
end;
$$;
revoke all on function public.growth_lab_workspace_guard() from public, anon, authenticated;

create or replace function public.growth_lab_keep_copy(p_state jsonb, p_kind text, p_label text, p_device text, p_app_version integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare new_id bigint; current_rev bigint; hash text := md5(p_state::text);
begin
  if not public.is_owner() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_kind not in ('local-replaced', 'cloud-before-repair') then raise exception 'unknown copy kind %', p_kind; end if;
  if jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 6000000 then raise exception 'copy too large or not an object'; end if;
  select h.id into new_id from public.growth_lab_workspace_history h
    where h.workspace_id = 'default' and h.kind = p_kind and h.content_hash = hash limit 1;
  if new_id is not null then return new_id; end if;
  select w.rev into current_rev from public.growth_lab_workspaces w where w.id = 'default';
  insert into public.growth_lab_workspace_history (workspace_id, rev, app_version, state, device, saved_at, kind, label, content_hash)
  values ('default', coalesce(current_rev, 0), coalesce(p_app_version, 0), p_state, left(p_device, 80), now(), p_kind, left(p_label, 200), hash)
  returning id into new_id;
  perform public.growth_lab_prune_history('default');
  return new_id;
end;
$$;
revoke all on function public.growth_lab_keep_copy(jsonb, text, text, text, integer) from public, anon;
grant execute on function public.growth_lab_keep_copy(jsonb, text, text, text, integer) to authenticated;

-- ---------- growth_lab_results_server_stamp (applied 2026-10-11 หลัง review รอบ 6) ----------
-- updated_at ของผลใช้นาฬิกา server (trim เก็บ 3 คีย์ล่าสุดตาม updated_at — เครื่องที่นาฬิกาช้าต้องไม่โดนตัดแถวใหม่ทิ้ง)
create or replace function public.growth_lab_results_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists growth_lab_results_stamp on public.growth_lab_results;
create trigger growth_lab_results_stamp before insert or update on public.growth_lab_results
  for each row execute function public.growth_lab_results_stamp();
