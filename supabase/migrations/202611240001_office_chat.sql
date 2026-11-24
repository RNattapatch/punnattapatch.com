-- AI Office chat — ห้องแชทรายฝ่าย · แชทผูก session · ท่อรายงานเดียว (of_messages) · ห้องระบบ
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-24-office-chat-phase1-spec.md (§2 = สัญญานี้)
-- ใครเขียน: office-desk บนมินิ (service role) + RPC office_* (owner จากเว็บ หรือ service role จากตัวรับ Telegram)
-- หน้าเว็บอ่านตารางอย่างเดียว · เขียนผ่าน RPC เท่านั้น · additive ทั้งไฟล์ (รันซ้ำได้)

-- 1. ห้อง: ชนิด + โหมดรายงาน + ห้องฝ่ายครบ 4 + ห้องระบบ
alter table public.of_rooms add column if not exists kind text not null default 'project';
alter table public.of_rooms drop constraint if exists of_rooms_kind_check;
alter table public.of_rooms add constraint of_rooms_kind_check check (kind in ('dept', 'project', 'client', 'system'));
alter table public.of_rooms add column if not exists report_mode text not null default 'head';
alter table public.of_rooms drop constraint if exists of_rooms_report_mode_check;
alter table public.of_rooms add constraint of_rooms_report_mode_check check (report_mode in ('head', 'all'));

insert into public.of_rooms (slug, title, department, kind, report_mode) values
  ('consult', 'ฝ่ายลูกค้า',   'consult', 'dept',   'head'),
  ('class',   'ฝ่ายคลาส',    'class',   'dept',   'head'),
  ('content', 'ฝ่ายคอนเทนต์', 'content', 'dept',   'head'),
  ('tech',    'ฝ่ายเทค',     'tech',    'dept',   'head'),
  ('system',  'ระบบ',        'tech',    'system', 'all')
on conflict (slug) do nothing;

-- 2. งาน: ชนิด chat · ตั้งค่าแจ้งเตือน · ส่งต่อ · เก็บ · คำสั่งค้างให้ desk ทำ · FK ห้อง
alter table public.of_tasks drop constraint if exists of_tasks_kind_check;
alter table public.of_tasks add constraint of_tasks_kind_check check (kind in ('research', 'action', 'work', 'chat'));
alter table public.of_tasks add column if not exists notify text not null default 'final';
alter table public.of_tasks drop constraint if exists of_tasks_notify_check;
alter table public.of_tasks add constraint of_tasks_notify_check check (notify in ('final', 'all', 'off'));
alter table public.of_tasks add column if not exists handed_to bigint references public.of_tasks(id) on delete set null;
alter table public.of_tasks add column if not exists archived_at timestamptz;
-- {"action":"handoff","room":"tech"} · {"action":"redo","note":"..."} — desk หยิบไปทำแล้วล้างเป็น null
alter table public.of_tasks add column if not exists pending_action jsonb;
alter table public.of_tasks drop constraint if exists of_tasks_room_fkey;
alter table public.of_tasks add constraint of_tasks_room_fkey foreign key (room) references public.of_rooms(slug) on update cascade;
create index if not exists of_tasks_room_chat on public.of_tasks (room, updated_at desc) where kind = 'chat';

alter table public.of_runs drop constraint if exists of_runs_role_check;
alter table public.of_runs add constraint of_runs_role_check
  check (role in ('research', 'head_plan', 'worker', 'head_grade', 'head_chat', 'head_handoff'));

-- 3. ข้อความในห้อง (ท่อรายงานเดียว)
create table if not exists public.of_messages (
  id               bigint generated always as identity primary key,
  room_slug        text not null references public.of_rooms(slug) on update cascade,
  task_id          bigint references public.of_tasks(id) on delete cascade,
  run_id           bigint references public.of_runs(id) on delete set null,
  file_id          bigint references public.of_files(id) on delete set null,
  actor_role       text not null check (actor_role in ('owner', 'head', 'worker', 'system')),
  actor_id         text not null check (char_length(actor_id) between 1 and 80),
  source_machine   text check (source_machine is null or source_machine in ('macbook', 'mini', 'web', 'telegram', 'cloud')),
  message_type     text not null check (message_type in
                     ('progress', 'result', 'decision', 'question', 'alert', 'note', 'file', 'system', 'handoff', 'context_reset')),
  body             text not null check (char_length(body) between 1 and 8000),
  payload          jsonb not null default '{}'::jsonb,   -- {tg_message_id, file_path, alert_id, grade, ...}
  client_event_id  text unique check (client_event_id is null or char_length(client_event_id) <= 120),
  created_at       timestamptz not null default now()
);
create index if not exists of_messages_room_time on public.of_messages (room_slug, created_at desc);
create index if not exists of_messages_task_time on public.of_messages (task_id, created_at) where task_id is not null;
create index if not exists of_messages_tg on public.of_messages ((payload ->> 'tg_message_id')) where payload ? 'tg_message_id';

alter table public.of_messages enable row level security;
drop policy if exists owner_read_of_messages on public.of_messages;
create policy owner_read_of_messages on public.of_messages for select to authenticated using ((select public.is_owner()));
revoke insert, update, delete on public.of_messages from authenticated;
revoke all on public.of_messages from anon;

-- 4. RPC — เว็บ (owner) และตัวรับ Telegram (service role) ใช้ชุดเดียวกัน ความหมายจึงตรงกันทุกช่องทาง
create or replace function public.office_can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select (select public.is_owner()) or coalesce(auth.role(), '') = 'service_role';
$$;

create or replace function public.office_source(p_source text) returns text
language sql immutable set search_path = public as $$
  select case when p_source in ('web', 'telegram') then p_source else 'web' end;
$$;

-- แชทใหม่ในห้อง: สร้างงาน kind=chat (todo = ปลุกหัวหน้าห้อง) + ข้อความแรกของคุณปัน → คืน id งาน
create or replace function public.office_new_chat(p_room text, p_body text, p_source text default 'web')
returns bigint language plpgsql security definer set search_path = public as $$
declare r public.of_rooms; v_body text := btrim(coalesce(p_body, '')); v_id bigint; v_src text := public.office_source(p_source);
begin
  if not public.office_can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into r from public.of_rooms where slug = p_room and status = 'open';
  if not found then raise exception 'room not found or closed'; end if;
  if char_length(v_body) not between 1 and 4000 then raise exception 'body must be 1-4000 chars'; end if;
  insert into public.of_tasks (title, brief, department, room, kind, status, source, callback)
  values (left(regexp_replace(v_body, '\s+', ' ', 'g'), 80), v_body, r.department, r.slug, 'chat', 'todo', v_src, false)
  returning id into v_id;
  insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body)
  values (r.slug, v_id, 'owner', 'pun', v_src, 'note', v_body);
  return v_id;
end $$;

-- พิมพ์ต่อในแชทเดิม → ปลุกหัวหน้า (ถ้ากำลังตอบอยู่ desk จะเห็นข้อความใหม่หลังตอบเสร็จแล้วคิวรอบถัดไปเอง)
create or replace function public.office_post(p_task bigint, p_body text, p_source text default 'web')
returns bigint language plpgsql security definer set search_path = public as $$
declare t public.of_tasks; v_body text := btrim(coalesce(p_body, '')); v_id bigint; v_src text := public.office_source(p_source);
begin
  if not public.office_can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into t from public.of_tasks where id = p_task for update;
  if not found or t.kind <> 'chat' then raise exception 'chat not found'; end if;
  if t.archived_at is not null or t.status in ('done', 'cancelled') then raise exception 'chat is closed'; end if;
  if char_length(v_body) not between 1 and 4000 then raise exception 'body must be 1-4000 chars'; end if;
  insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body)
  values (t.room, t.id, 'owner', 'pun', v_src, 'note', v_body) returning id into v_id;
  update public.of_tasks set status = case when status = 'in_progress' then status else 'todo' end,
         not_before = null, updated_at = now() where id = t.id;
  return v_id;
end $$;

-- ปุ่มของแชท/งาน: reset_context · handoff · archive · close · notify · approve · redo
create or replace function public.office_task_action(p_task bigint, p_action text, p_arg text default null, p_source text default 'web')
returns void language plpgsql security definer set search_path = public as $$
declare t public.of_tasks; v_src text := public.office_source(p_source); v_arg text := nullif(btrim(coalesce(p_arg, '')), '');
begin
  if not public.office_can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into t from public.of_tasks where id = p_task for update;
  if not found then raise exception 'task not found'; end if;
  if t.room is null then raise exception 'task has no room'; end if;

  if p_action = 'reset_context' then
    delete from public.of_sessions where key = 'head:chat:' || t.id;
    insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body)
    values (t.room, t.id, 'system', 'office', v_src, 'context_reset', 'เริ่มบริบทใหม่');
  elsif p_action = 'handoff' then
    if t.kind <> 'chat' or t.archived_at is not null or t.status in ('done', 'cancelled') then raise exception 'chat is closed'; end if;
    if v_arg is not null and not exists (select 1 from public.of_rooms where slug = v_arg and status = 'open') then
      raise exception 'target room not found';
    end if;
    update public.of_tasks set pending_action = jsonb_build_object('action', 'handoff', 'room', coalesce(v_arg, t.room)),
           status = 'todo', not_before = null, updated_at = now() where id = t.id;
  elsif p_action = 'archive' then
    update public.of_tasks set archived_at = now(), status = 'cancelled', updated_at = now() where id = t.id;
  elsif p_action = 'close' then
    update public.of_tasks set status = 'done', done_at = now(), updated_at = now() where id = t.id;
  elsif p_action = 'notify' then
    if v_arg not in ('final', 'all', 'off') then raise exception 'notify must be final, all or off'; end if;
    update public.of_tasks set notify = v_arg, updated_at = now() where id = t.id;
  elsif p_action = 'approve' then
    if t.status <> 'in_review' then raise exception 'task is not waiting for review'; end if;
    insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body)
    values (t.room, t.id, 'owner', 'pun', v_src, 'decision', 'อนุมัติ');
    update public.of_tasks set status = 'done', done_at = now(), pending_action = null, updated_at = now() where id = t.id;
  elsif p_action = 'redo' then
    if v_arg is null then raise exception 'redo needs a note'; end if;
    insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body)
    values (t.room, t.id, 'owner', 'pun', v_src, 'decision', left('ให้แก้: ' || v_arg, 4000));
    update public.of_tasks set pending_action = jsonb_build_object('action', 'redo', 'note', left(v_arg, 4000)),
           status = 'todo', not_before = null, updated_at = now() where id = t.id;
  else
    raise exception 'unknown action %', p_action;
  end if;
end $$;

-- รับทราบ/ปิดเหตุ (เว็บหรือปุ่มใน Telegram) → of_alerts.acked + ข้อความในห้องระบบ
create or replace function public.office_ack_alert(p_alert bigint, p_source text default 'web')
returns void language plpgsql security definer set search_path = public as $$
declare a public.of_alerts; v_src text := public.office_source(p_source);
begin
  if not public.office_can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.of_alerts set status = 'acked', updated_at = now() where id = p_alert and status <> 'acked' returning * into a;
  if not found then return; end if;
  insert into public.of_messages (room_slug, actor_role, actor_id, source_machine, message_type, body, payload)
  values ('system', 'owner', 'pun', v_src, 'decision',
          'ปิดเหตุ: ' || a.title || case when v_src = 'telegram' then ' (จาก Telegram)' else '' end,
          jsonb_build_object('alert_id', a.id));
end $$;

-- คุณปันแจ้งเหตุเอง → of_alerts (source pun:* = ไม่โทรปลุก) + แชทในห้องระบบให้หัวหน้าฝ่ายเทคไล่หาสาเหตุ → คืน id แชท
create or replace function public.office_report_incident(p_text text, p_source text default 'web')
returns bigint language plpgsql security definer set search_path = public as $$
declare v_text text := btrim(coalesce(p_text, '')); v_src text := public.office_source(p_source); v_alert bigint; v_task bigint;
begin
  if not public.office_can_write() then raise exception 'not allowed' using errcode = '42501'; end if;
  if char_length(v_text) not between 1 and 2000 then raise exception 'text must be 1-2000 chars'; end if;
  insert into public.of_alerts (level, title, detail, source, status)
  values ('urgent', left(regexp_replace(v_text, '\s+', ' ', 'g'), 200), v_text, 'pun:' || v_src, 'notified')
  returning id into v_alert;
  insert into public.of_tasks (title, brief, department, room, kind, status, source, callback, priority)
  values (left('เหตุ: ' || regexp_replace(v_text, '\s+', ' ', 'g'), 80),
          'คุณปันแจ้งเหตุ: ' || v_text || E'\n\nไล่หาสาเหตุ บอกว่ากระทบอะไร และเสนอทางแก้ ห้าม deploy หรือแก้ระบบ production เอง',
          'tech', 'system', 'chat', 'todo', v_src, false, 'urgent')
  returning id into v_task;
  insert into public.of_messages (room_slug, task_id, actor_role, actor_id, source_machine, message_type, body, payload)
  values ('system', v_task, 'owner', 'pun', v_src, 'alert', v_text, jsonb_build_object('alert_id', v_alert));
  return v_task;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'office_new_chat(text, text, text)', 'office_post(bigint, text, text)',
    'office_task_action(bigint, text, text, text)', 'office_ack_alert(bigint, text)',
    'office_report_incident(text, text)', 'office_can_write()'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
