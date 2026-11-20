// AI Office — Supabase data layer for /app/office · อ่านทุกตาราง · เขียนได้อย่างเดียวคือเพิ่มคำขอส่งไฟล์ (of_sends: file_id + channel)
import { supabase, getSupabaseSession } from '../dashboard/supabase';
import { bangkokMonthStartIso } from './logic';
import type {
  DeskStatus,
  OfficeAlert,
  OfficeDepartment,
  OfficeFile,
  OfficeGrade,
  OfficeRoom,
  OfficeRubric,
  OfficeRun,
  OfficeSend,
  OfficeTask,
  QuietStatus,
  SendChannel,
  StatusRow,
} from './logic';

export interface OfficeData {
  tasks: OfficeTask[];
  alerts: OfficeAlert[];
  departments: OfficeDepartment[];
  rooms: OfficeRoom[];
  runs: OfficeRun[];
  rubrics: OfficeRubric[];
  grades: OfficeGrade[];
  files: OfficeFile[];
  sends: OfficeSend[];
  desk: DeskStatus | null;
  quiet: QuietStatus | null;
}
async function requireOwner(): Promise<void> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
}

const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };

const FILE_COLS = 'id,task_id,rel_path,name,mime,size_bytes,drive_url,drive_kind,missing,uploaded_at,updated_at';
const SEND_COLS = 'id,file_id,channel,status,error,share_expires_at,created_at,sent_at';

export async function loadOffice(): Promise<OfficeData> {
  await requireOwner();
  const monthStart = bangkokMonthStartIso();
  const [tasks, alerts, status, departments, rooms, runs, rubrics, grades, files, sends] = await Promise.all([
    supabase.from('of_tasks')
      .select('id,no,parent_id,title,brief,department,room,kind,priority,status,source,result,review_rounds,grade,output_path,created_at,updated_at,done_at')
      .order('created_at', { ascending: false }).limit(500),
    supabase.from('of_alerts')
      .select('id,level,title,detail,source,status,calls,last_call_at,created_at,updated_at')
      .order('created_at', { ascending: false }).limit(200),
    supabase.from('of_status').select('key,data,updated_at'),
    supabase.from('of_departments')
      .select('slug,name_th,head_model,monthly_run_cap,brief,active,updated_at').order('slug'),
    supabase.from('of_rooms')
      .select('slug,title,department,status,goal,due_date,drive_url,links,folder,created_at,closed_at')
      .order('status', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('of_runs')
      .select('id,task_id,department,role,provider,model,ok,ms,started_at,ended_at')
      .gte('started_at', monthStart).order('started_at', { ascending: false }).limit(5000),
    supabase.from('of_rubrics')
      .select('key,title_th,criteria,gates,set_by,pun_reviewed,updated_at').order('key'),
    supabase.from('of_grades')
      .select('id,task_id,grader,level,reasons,created_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('of_files')
      .select(FILE_COLS).eq('missing', false).order('updated_at', { ascending: false }).limit(2000),
    supabase.from('of_sends')
      .select(SEND_COLS).order('created_at', { ascending: false }).limit(500),
  ]);
  for (const result of [tasks, alerts, status, departments, rooms, runs, rubrics, grades, files, sends]) fail(result.error);

  const statuses = Object.fromEntries(((status.data || []) as StatusRow[]).map((row) => [row.key, row.data]));
  return {
    tasks: (tasks.data || []) as OfficeTask[],
    alerts: (alerts.data || []) as OfficeAlert[],
    departments: (departments.data || []) as OfficeDepartment[],
    rooms: (rooms.data || []) as OfficeRoom[],
    runs: (runs.data || []) as OfficeRun[],
    rubrics: (rubrics.data || []) as OfficeRubric[],
    grades: (grades.data || []) as OfficeGrade[],
    files: (files.data || []) as OfficeFile[],
    sends: (sends.data || []) as OfficeSend[],
    desk: (statuses.desk as DeskStatus) || null,
    quiet: (statuses.quiet as QuietStatus) || null,
  };
}

/** ปุ่มส่งไฟล์ · desk บนมินิหยิบคิวภายในราว 5 วินาที */
export async function queueSend(fileId: number, channel: SendChannel): Promise<OfficeSend> {
  await requireOwner();
  const { data, error } = await supabase.from('of_sends').insert({ file_id: fileId, channel }).select(SEND_COLS).single();
  fail(error);
  return data as OfficeSend;
}

/** ดึงสถานะส่งล่าสุดอย่างเดียว (ตอนมีงานรอส่ง) */
export async function loadSends(): Promise<OfficeSend[]> {
  const { data, error } = await supabase.from('of_sends').select(SEND_COLS).order('created_at', { ascending: false }).limit(500);
  fail(error);
  return (data || []) as OfficeSend[];
}
