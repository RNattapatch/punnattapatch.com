// AI Office chat data layer. Reads use the signed-in Supabase session; mutations use office_* RPCs.
import { supabase, getSupabaseSession } from '../dashboard/supabase';
import { bangkokMonthStartIso } from './logic';
import type {
  DeskStatus,
  OfficeAlert,
  OfficeDepartment,
  OfficeFile,
  OfficeGrade,
  OfficeMessage,
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
  messages: OfficeMessage[];
  runs: OfficeRun[];
  rubrics: OfficeRubric[];
  grades: OfficeGrade[];
  files: OfficeFile[];
  sends: OfficeSend[];
  desk: DeskStatus | null;
  quiet: QuietStatus | null;
}

export interface OfficeUpdates {
  tasks: OfficeTask[];
  alerts: OfficeAlert[];
  rooms: OfficeRoom[];
  messages: OfficeMessage[];
  runs: OfficeRun[];
  grades: OfficeGrade[];
  files: OfficeFile[];
  sends: OfficeSend[];
  desk: DeskStatus | null;
  quiet: QuietStatus | null;
}

export interface OfficeRoomContext { tasks: OfficeTask[]; messages: OfficeMessage[] }
export interface OfficeTaskContext { task: OfficeTask; messages: OfficeMessage[]; runs: OfficeRun[] }

async function requireOwner(): Promise<void> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
}

const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
const TASK_COLS = 'id,no,parent_id,title,brief,department,room,kind,priority,status,source,result,review_rounds,grade,output_path,notify,handed_to,archived_at,pending_action,created_at,updated_at,done_at';
const ROOM_COLS = 'slug,title,department,kind,report_mode,status,goal,due_date,drive_url,links,folder,created_at,closed_at';
const RUN_COLS = 'id,task_id,department,role,provider,model,ok,ms,input_tokens,cached_tokens,output_tokens,started_at,ended_at';
const MESSAGE_COLS = 'id,room_slug,task_id,run_id,file_id,actor_role,actor_id,source_machine,message_type,body,payload,created_at';
const FILE_COLS = 'id,task_id,rel_path,name,mime,size_bytes,drive_url,drive_kind,missing,uploaded_at,updated_at';
const SEND_COLS = 'id,file_id,channel,status,error,share_expires_at,created_at,sent_at';

const statusesFrom = (rows: StatusRow[]) => {
  const statuses = Object.fromEntries(rows.map((row) => [row.key, row.data]));
  return { desk: (statuses.desk as DeskStatus) || null, quiet: (statuses.quiet as QuietStatus) || null };
};

async function loadMessages(afterId?: number): Promise<OfficeMessage[]> {
  const query = afterId == null
    ? supabase.from('of_messages').select(MESSAGE_COLS).order('id', { ascending: false }).limit(1000)
    : supabase.from('of_messages').select(MESSAGE_COLS).gt('id', afterId).order('id', { ascending: true }).limit(1000);
  const result = await query;
  fail(result.error);
  const messages = (result.data || []) as OfficeMessage[];
  return afterId == null ? messages.reverse() : messages;
}

async function loadChanging(afterMessageId: number): Promise<OfficeUpdates> {
  const monthStart = bangkokMonthStartIso();
  const [tasks, alerts, status, rooms, messages, runs, grades, files, sends] = await Promise.all([
    supabase.from('of_tasks').select(TASK_COLS).order('updated_at', { ascending: false }).limit(500),
    supabase.from('of_alerts').select('id,level,title,detail,source,status,calls,last_call_at,created_at,updated_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('of_status').select('key,data,updated_at'),
    supabase.from('of_rooms').select(ROOM_COLS).order('status', { ascending: false }).order('created_at', { ascending: false }),
    loadMessages(afterMessageId),
    supabase.from('of_runs').select(RUN_COLS).gte('started_at', monthStart).order('started_at', { ascending: false }).limit(5000),
    supabase.from('of_grades').select('id,task_id,grader,level,reasons,created_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('of_files').select(FILE_COLS).eq('missing', false).order('updated_at', { ascending: false }).limit(2000),
    supabase.from('of_sends').select(SEND_COLS).order('created_at', { ascending: false }).limit(500),
  ]);
  for (const result of [tasks, alerts, status, rooms, runs, grades, files, sends]) fail(result.error);
  return {
    tasks: (tasks.data || []) as OfficeTask[],
    alerts: (alerts.data || []) as OfficeAlert[],
    rooms: (rooms.data || []) as OfficeRoom[],
    messages,
    runs: (runs.data || []) as OfficeRun[],
    grades: (grades.data || []) as OfficeGrade[],
    files: (files.data || []) as OfficeFile[],
    sends: (sends.data || []) as OfficeSend[],
    ...statusesFrom((status.data || []) as StatusRow[]),
  };
}

export async function loadOffice(): Promise<OfficeData> {
  await requireOwner();
  const monthStart = bangkokMonthStartIso();
  const [tasks, alerts, status, departments, rooms, messages, runs, rubrics, grades, files, sends] = await Promise.all([
    supabase.from('of_tasks').select(TASK_COLS).order('updated_at', { ascending: false }).limit(500),
    supabase.from('of_alerts').select('id,level,title,detail,source,status,calls,last_call_at,created_at,updated_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('of_status').select('key,data,updated_at'),
    supabase.from('of_departments').select('slug,name_th,head_model,monthly_run_cap,brief,active,updated_at').order('slug'),
    supabase.from('of_rooms').select(ROOM_COLS).order('status', { ascending: false }).order('created_at', { ascending: false }),
    loadMessages(),
    supabase.from('of_runs').select(RUN_COLS).gte('started_at', monthStart).order('started_at', { ascending: false }).limit(5000),
    supabase.from('of_rubrics').select('key,title_th,criteria,gates,set_by,pun_reviewed,updated_at').order('key'),
    supabase.from('of_grades').select('id,task_id,grader,level,reasons,created_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('of_files').select(FILE_COLS).eq('missing', false).order('updated_at', { ascending: false }).limit(2000),
    supabase.from('of_sends').select(SEND_COLS).order('created_at', { ascending: false }).limit(500),
  ]);
  for (const result of [tasks, alerts, status, departments, rooms, runs, rubrics, grades, files, sends]) fail(result.error);
  return {
    tasks: (tasks.data || []) as OfficeTask[],
    alerts: (alerts.data || []) as OfficeAlert[],
    departments: (departments.data || []) as OfficeDepartment[],
    rooms: (rooms.data || []) as OfficeRoom[],
    messages,
    runs: (runs.data || []) as OfficeRun[],
    rubrics: (rubrics.data || []) as OfficeRubric[],
    grades: (grades.data || []) as OfficeGrade[],
    files: (files.data || []) as OfficeFile[],
    sends: (sends.data || []) as OfficeSend[],
    ...statusesFrom((status.data || []) as StatusRow[]),
  };
}

export async function loadOfficeUpdates(afterMessageId: number): Promise<OfficeUpdates> {
  await requireOwner();
  return loadChanging(afterMessageId);
}

export async function loadRoomContext(room: string): Promise<OfficeRoomContext> {
  await requireOwner();
  const [tasks, messages] = await Promise.all([
    supabase.from('of_tasks').select(TASK_COLS).eq('room', room).order('updated_at', { ascending: false }).limit(500),
    supabase.from('of_messages').select(MESSAGE_COLS).eq('room_slug', room).order('id', { ascending: false }).limit(1000),
  ]);
  fail(tasks.error); fail(messages.error);
  return { tasks: (tasks.data || []) as OfficeTask[], messages: ((messages.data || []) as OfficeMessage[]).reverse() };
}

export async function loadTaskContext(taskId: number): Promise<OfficeTaskContext> {
  await requireOwner();
  const [task, messages, runs] = await Promise.all([
    supabase.from('of_tasks').select(TASK_COLS).eq('id', taskId).single(),
    supabase.from('of_messages').select(MESSAGE_COLS).eq('task_id', taskId).order('id', { ascending: true }).limit(1000),
    supabase.from('of_runs').select(RUN_COLS).eq('task_id', taskId).order('started_at', { ascending: false }).limit(100),
  ]);
  fail(task.error); fail(messages.error); fail(runs.error);
  return { task: task.data as OfficeTask, messages: (messages.data || []) as OfficeMessage[], runs: (runs.data || []) as OfficeRun[] };
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  await requireOwner();
  const { data, error } = await supabase.rpc(name, args);
  fail(error);
  return data as T;
}

export const newChat = (room: string, body: string) => rpc<number>('office_new_chat', { p_room: room, p_body: body, p_source: 'web' });
export const postMessage = (task: number, body: string) => rpc<number>('office_post', { p_task: task, p_body: body, p_source: 'web' });
export const taskAction = (task: number, action: string, arg: string | null = null) => rpc<void>('office_task_action', { p_task: task, p_action: action, p_arg: arg, p_source: 'web' });
export const ackAlert = (alert: number) => rpc<void>('office_ack_alert', { p_alert: alert, p_source: 'web' });
export const reportIncident = (text: string) => rpc<number>('office_report_incident', { p_text: text, p_source: 'web' });

/** Existing file-delivery queue used by Telegram and LINE buttons. */
export async function queueSend(fileId: number, channel: SendChannel): Promise<OfficeSend> {
  await requireOwner();
  const { data, error } = await supabase.from('of_sends').insert({ file_id: fileId, channel }).select(SEND_COLS).single();
  fail(error);
  return data as OfficeSend;
}

export async function loadSends(): Promise<OfficeSend[]> {
  const { data, error } = await supabase.from('of_sends').select(SEND_COLS).order('created_at', { ascending: false }).limit(500);
  fail(error);
  return (data || []) as OfficeSend[];
}
