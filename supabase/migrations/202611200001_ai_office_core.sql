-- AI Office core — ฝ่าย (หัวหน้า Claude · ลูกน้อง Codex) · ห้องโปรเจกต์ · run/session/เกณฑ์/เกรด
-- spec: claude-code-pun-nattapatch/docs/superpowers/specs/2026-11-19-call-center-ai-office-design.md (Part 2)
-- ต่อจาก 202611190001_office_call_center.sql · ใครเขียน: office-desk บนมินิ (service role) · หน้าเว็บอ่านอย่างเดียว

-- งานลูก (หัวหน้าแตกงานให้ลูกน้อง) + ผลตรวจ + ช่อง Telegram ที่ต้องตอบ (โหมดวอล์กกี้)
alter table public.of_tasks add column if not exists parent_id bigint references public.of_tasks(id) on delete cascade;
alter table public.of_tasks add column if not exists rubric_key text;
alter table public.of_tasks add column if not exists review_rounds integer not null default 0;
alter table public.of_tasks add column if not exists grade text check (grade is null or grade in ('good', 'fair', 'redo'));
alter table public.of_tasks add column if not exists output_path text;
alter table public.of_tasks add column if not exists reply_chat text;
alter table public.of_tasks drop constraint if exists of_tasks_kind_check;
alter table public.of_tasks add constraint of_tasks_kind_check check (kind in ('research', 'action', 'work'));
create index if not exists of_tasks_parent on public.of_tasks (parent_id) where parent_id is not null;

create table if not exists public.of_departments (
  slug             text primary key check (slug in ('consult', 'class', 'content', 'tech')),
  name_th          text not null,
  head_model       text not null default 'sonnet',
  monthly_run_cap  integer not null default 400 check (monthly_run_cap > 0),
  brief            text not null default '',
  active           boolean not null default true,
  updated_at       timestamptz not null default now()
);

insert into public.of_departments (slug, name_th, brief) values
  ('consult', 'ฝ่ายลูกค้า', 'งานลูกค้าที่ปรึกษา ดีล ใบเสนอราคา proposal SOW ข้อความถึงลูกค้า · ไฟล์หลัก: clients/<ลูกค้า>/ · docs/PRICING-SSOT.md (ราคาเท่านั้น) · docs/CRM-SSOT.md · กฎ Sales Funnel v2 ใน CLAUDE.md'),
  ('class',   'ฝ่ายคลาส',   'คลาส อบรม FutureSkill TNI คลาสสาธารณะ Class Outline การบ้าน · ไฟล์หลัก: material/training/ · agent/workstreams/ (เช่น tni-w1-class.md) · คำว่า คลาส ไม่ใช่ คอร์ส'),
  ('content', 'ฝ่ายคอนเทนต์', 'คลิป reel โพสต์ carousel แอด broadcast · ไฟล์หลัก: output/content/ · agent/content-team/content-performance-rules.md · branding/strategy/ai-writing-rules.md'),
  ('tech',    'ฝ่ายเทค',    'เว็บ บอท ระบบบนมินิ automation · ไฟล์หลัก: mac-mini-ops/ · ~/Documents/punnattapatch.com (เว็บ) · ห้าม deploy เอง')
on conflict (slug) do nothing;

create table if not exists public.of_rooms (
  slug        text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  title       text not null check (char_length(title) between 1 and 120),
  department  text not null references public.of_departments(slug),
  status      text not null default 'open' check (status in ('open', 'closed')),
  goal        text,
  due_date    date,
  drive_url   text check (drive_url is null or drive_url ~ '^https://drive\.google\.com/'),
  links       jsonb not null default '[]',        -- [{label, url}]
  folder      text,                               -- office/rooms/<slug> ในรีโปความรู้
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

create table if not exists public.of_runs (
  id             bigint generated always as identity primary key,
  task_id        bigint references public.of_tasks(id) on delete set null,
  department     text,
  role           text not null check (role in ('research', 'head_plan', 'worker', 'head_grade')),
  provider       text,
  model          text,
  session_id     text,
  ok             boolean,
  ms             integer,
  input_tokens   integer,
  cached_tokens  integer,
  output_tokens  integer,
  error          text,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz
);
create index if not exists of_runs_month on public.of_runs (department, started_at desc);

-- session ผูกกับ agent + งาน (หลักของ Paperclip) · key เช่น worker:task:42
create table if not exists public.of_sessions (
  key         text primary key,
  provider    text not null,
  session_id  text not null,
  cwd         text,
  runs        integer not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists public.of_rubrics (
  key           text primary key,
  title_th      text not null,
  criteria      jsonb not null,                    -- ["...", ...]
  gates         jsonb not null default '[]',       -- ["scan-marks"] เครื่องตรวจก่อนให้เกรด
  set_by        text not null default 'head' check (set_by in ('pun', 'head')),
  pun_reviewed  boolean not null default false,
  updated_at    timestamptz not null default now()
);

insert into public.of_rubrics (key, title_th, criteria, gates) values
  ('research', 'สรุปข้อมูลภายใน', '["ประโยคแรกตอบคำถามของคุณปันตรงๆ","ทุกข้อเท็จจริงมีไฟล์ที่มา","ไม่เดาตัวเลข ราคา หรือวันที่ที่ไม่มีในไฟล์","หาไม่เจอให้บอกตรงๆ ว่าไม่เจออะไรและควรถามใคร","บอกชัดว่าเรื่องไหนคุณปันต้องตัดสิน"]', '[]'),
  ('client-doc', 'เอกสารลูกค้า (proposal SOW QO outline รายงาน)', '["เปิดด้วยสรุปสั้น TL;DR 3 ถึง 5 ข้อ: ได้อะไร ราคาหรือเงื่อนไขหลัก ไม่รวมอะไร ขั้นถัดไป (SOW สัญญา QO ไม่บังคับ)","ภาษาทางการทั้งเล่ม ประธานคือ ผู้ให้บริการ ผู้ว่าจ้าง ห้าม ผม ครับ ชื่อเล่นลูกค้า หรือคำสร้อย","เปิดด้วยขอบเขตหรือสิ่งที่เปลี่ยน ไม่ปูเรื่อง ไม่มีฉากชีวิตก่อนหลัง","ราคามาจาก docs/PRICING-SSOT.md เท่านั้น ราคา custom ลงท้ายด้วย 4 7 หรือ 8","ชำระ 100% ก่อนเริ่มงาน","คู่สัญญา 2 ฝ่ายเท่านั้น ห้ามคำว่า บุคคลที่สาม บุคคลภายนอก ผู้ให้บริการภายนอก","ใช้คำว่า คลาส ไม่ใช่ คอร์ส","ชื่อหัวข้อ = การ + กริยา + ของที่ได้"]', '["scan-marks"]'),
  ('client-message', 'ข้อความถึงลูกค้า (LINE อีเมล)', '["มีการตัดสินใจถัดไปพร้อมวัน","ไม่มีคำว่า ไม่รีบ หรือ แล้วแต่สะดวก โดยไม่มีวัน","ราคาตรง catalog และราคาไม่อยู่บรรทัดสุดท้าย","ใช้คำว่า ลูกค้า ไม่ใช่ ลีด","ไม่มีเครื่องหมาย จุดกลาง จุดนำบรรทัด ขีดยาว","ทุกประโยคมีคนทำอะไรกับอะไร ไม่เปิดด้วยกริยา"]', '["scan-marks"]'),
  ('content', 'คอนเทนต์ (reel โพสต์ carousel)', '["ตัดหน้าคุณปันออกแล้วคนดูยังได้ของกลับบ้าน","ตอบได้ว่าคนจะ save ไปทำอะไร","2 วินาทีแรกขายของ ไม่ปูเรื่อง","ทุกประโยคมีคนทำอะไรกับอะไร ร้อยด้วยคำเชื่อม","ชิ้นยาว 80 คำขึ้นไปมีคน ฉาก สิ่งที่เจอ จุดหัก และผลที่ตรวจได้","ไม่มีเครื่องหมาย จุดกลาง จุดนำบรรทัด ขีดยาว","ห้ามแต่งเคส ตัวเลข หรือฉากที่ไม่มีที่มา"]', '["scan-marks"]'),
  ('code', 'โค้ดและระบบ', '["เทสต์ที่ระบุในงานผ่าน","แก้เฉพาะไฟล์ในขอบเขตงาน","ไม่มีความลับหรือ token ในโค้ด","ใช้ของที่มีในรีโปก่อนเขียนใหม่","logic ใหม่มีเทสต์หรือ self-check อย่างน้อย 1 อัน"]', '[]')
on conflict (key) do nothing;

create table if not exists public.of_grades (
  id          bigint generated always as identity primary key,
  task_id     bigint not null references public.of_tasks(id) on delete cascade,
  grader      text not null check (grader in ('head', 'pun', 'gate')),
  level       text not null check (level in ('good', 'fair', 'redo')),
  reasons     jsonb not null default '[]',
  created_at  timestamptz not null default now()
);
create index if not exists of_grades_task on public.of_grades (task_id);

-- ล็อกงานลูกได้เฉพาะ status todo · งานแม่ที่รอลูกใช้ assignee = 'children' (sweep ห้ามคืนเข้าคิว)
do $$
declare t text;
begin
  foreach t in array array['of_departments', 'of_rooms', 'of_runs', 'of_sessions', 'of_rubrics', 'of_grades'] loop
    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists owner_read_%1$s on public.%1$s', t);
    execute format('create policy owner_read_%1$s on public.%1$s for select to authenticated using ((select public.is_owner()))', t);
    execute format('revoke insert, update, delete on public.%1$s from authenticated', t);
    execute format('revoke all on public.%1$s from anon', t);
  end loop;
end $$;
