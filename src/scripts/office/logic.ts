// AI Office — pure display rules for /app/office (no DOM, no network).
// Tests: node tests/office-board-logic.test.mjs

export type DepartmentSlug = 'consult' | 'class' | 'content' | 'tech';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' | 'cancelled';
export type TaskGrade = 'good' | 'fair' | 'redo';
export type TaskSource = 'voice' | 'telegram' | 'web' | 'system';

export interface TaskResult {
  speak?: string | null;
  text?: string | null;
  next_step?: string | null;
  sources?: string[] | null;
  provider?: string | null;
  needs_pun?: boolean;
  error?: string | null;
}

export interface OfficeTask {
  id: number;
  no: string;
  parent_id: number | null;
  title: string;
  brief: string;
  department: DepartmentSlug | null;
  room: string | null;
  kind: 'research' | 'action' | 'work';
  priority: 'urgent' | 'normal';
  status: TaskStatus;
  source: TaskSource;
  result: TaskResult | null;
  review_rounds: number;
  grade: TaskGrade | null;
  output_path: string | null;
  created_at: string;
  updated_at: string;
  done_at: string | null;
}

export interface OfficeAlert {
  id: number;
  level: 'critical' | 'urgent' | 'info';
  title: string;
  detail: string | null;
  source: string;
  status: 'new' | 'notified' | 'calling' | 'acked' | 'gave_up';
  calls: number;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficeDepartment {
  slug: DepartmentSlug;
  name_th: string;
  head_model: string;
  monthly_run_cap: number;
  brief: string;
  active: boolean;
  updated_at: string;
}

export interface OfficeRoomLink { label: string; url: string }
export interface OfficeRoom {
  slug: string;
  title: string;
  department: DepartmentSlug;
  status: 'open' | 'closed';
  goal: string | null;
  due_date: string | null;
  drive_url: string | null;
  links: OfficeRoomLink[];
  folder: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface OfficeRun {
  id?: number;
  task_id?: number | null;
  department: DepartmentSlug | null;
  role?: string;
  provider?: string | null;
  model?: string | null;
  ok?: boolean | null;
  ms?: number | null;
  started_at: string;
  ended_at?: string | null;
}

export interface OfficeRubric {
  key: string;
  title_th: string;
  criteria: string[];
  gates: string[];
  set_by: 'pun' | 'head';
  pun_reviewed: boolean;
  updated_at: string;
}

export interface OfficeGrade {
  id: number;
  task_id: number;
  grader: 'head' | 'pun' | 'gate';
  level: TaskGrade;
  reasons: string[];
  created_at: string;
}

export interface DeskStatus {
  at?: string | null;
  worker?: string | null;
  off?: boolean;
  agent_id?: string | null;
  whatsapp?: boolean;
  phone?: boolean;
  quiet?: boolean;
}

export interface QuietStatus { until?: string | null }
export interface StatusRow { key: string; data: Record<string, unknown>; updated_at: string }

export const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: string }> = {
  todo: { label: 'รอคิว', tone: 'badge-ghost' },
  in_progress: { label: 'กำลังทำ', tone: 'badge-info' },
  in_review: { label: 'รอคุณปัน', tone: 'badge-warning' },
  done: { label: 'เสร็จ', tone: 'badge-success' },
  blocked: { label: 'ติด', tone: 'badge-error' },
  cancelled: { label: 'ยกเลิก', tone: 'badge-ghost' },
};

export const statusMeta = (status: string) => TASK_STATUS_META[status as TaskStatus] || { label: status, tone: 'badge-ghost' };

export const GRADE_LABEL: Record<TaskGrade, string> = { good: 'ดี', fair: 'พอใช้', redo: 'ปรับปรุง' };
export const GRADE_TONE: Record<TaskGrade, string> = { good: 'badge-success', fair: 'badge-warning', redo: 'badge-error' };
export const SOURCE_LABEL: Record<TaskSource, string> = { voice: 'โทร', telegram: 'Telegram', web: 'เว็บ', system: 'ระบบ' };

export const ALERT_LEVEL_META: Record<OfficeAlert['level'], { label: string; tone: string }> = {
  critical: { label: 'วิกฤต', tone: 'badge-error' },
  urgent: { label: 'ด่วน', tone: 'badge-warning' },
  info: { label: 'แจ้งให้ทราบ', tone: 'badge-info' },
};
export const ALERT_STATUS_LABEL: Record<OfficeAlert['status'], string> = {
  new: 'ใหม่', notified: 'แจ้งแล้ว', calling: 'กำลังโทร', acked: 'รับทราบแล้ว', gave_up: 'หยุดโทรแล้ว',
};

export type TaskView = 'all' | 'review' | 'working' | 'done' | 'stopped';
export const TASK_VIEWS: { id: TaskView; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'review', label: 'รอคุณปัน' },
  { id: 'working', label: 'กำลังทำ' },
  { id: 'done', label: 'เสร็จ' },
  { id: 'stopped', label: 'ติด/ยกเลิก' },
];

export function filterTasks(tasks: OfficeTask[], view: TaskView): OfficeTask[] {
  if (view === 'all') return [...tasks];
  const statuses: Record<Exclude<TaskView, 'all'>, TaskStatus[]> = {
    review: ['in_review'], working: ['todo', 'in_progress'], done: ['done'], stopped: ['blocked', 'cancelled'],
  };
  return tasks.filter((task) => statuses[view].includes(task.status));
}

export interface TaskGroup { task: OfficeTask; children: OfficeTask[] }
const newestFirst = (a: OfficeTask, b: OfficeTask) => b.created_at.localeCompare(a.created_at) || b.id - a.id;

/** Keeps every task visible: missing parents become roots, while known children are nested under their parent. */
export function groupTasks(tasks: OfficeTask[]): TaskGroup[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const children = new Map<number, OfficeTask[]>();
  for (const task of tasks) {
    if (task.parent_id != null && byId.has(task.parent_id)) {
      const list = children.get(task.parent_id) || [];
      list.push(task);
      children.set(task.parent_id, list);
    }
  }
  return tasks
    .filter((task) => task.parent_id == null || !byId.has(task.parent_id))
    .sort(newestFirst)
    .map((task) => ({ task, children: (children.get(task.id) || []).sort(newestFirst) }));
}

const OPEN_TASKS = new Set<TaskStatus>(['todo', 'in_progress', 'in_review', 'blocked']);
const OPEN_ALERTS = new Set<OfficeAlert['status']>(['new', 'notified', 'calling']);

export function officeCounts(tasks: Pick<OfficeTask, 'status'>[], alerts: Pick<OfficeAlert, 'status'>[]) {
  return {
    review: tasks.filter((task) => task.status === 'in_review').length,
    working: tasks.filter((task) => task.status === 'todo' || task.status === 'in_progress').length,
    openAlerts: alerts.filter((alert) => OPEN_ALERTS.has(alert.status)).length,
  };
}

export function openTaskCountByDepartment(tasks: Pick<OfficeTask, 'department' | 'status'>[]): Partial<Record<DepartmentSlug, number>> {
  const counts: Partial<Record<DepartmentSlug, number>> = {};
  for (const task of tasks) {
    if (!task.department || !OPEN_TASKS.has(task.status)) continue;
    counts[task.department] = (counts[task.department] || 0) + 1;
  }
  return counts;
}

const BANGKOK = 'Asia/Bangkok';
const monthFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK, year: 'numeric', month: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK, year: 'numeric', month: '2-digit', day: '2-digit' });
const monthKey = (value: string | number | Date) => monthFormatter.format(new Date(value));

export interface QualityMetric { good: number; total: number; percent: number | null }
export function firstPassGoodByDepartment(tasks: Pick<OfficeTask, 'department' | 'kind' | 'grade' | 'review_rounds' | 'updated_at'>[], now = Date.now()): Record<DepartmentSlug, QualityMetric> {
  const key = monthKey(now);
  const out: Record<DepartmentSlug, QualityMetric> = {
    consult: { good: 0, total: 0, percent: null },
    class: { good: 0, total: 0, percent: null },
    content: { good: 0, total: 0, percent: null },
    tech: { good: 0, total: 0, percent: null },
  };
  for (const task of tasks) {
    if (!task.department || task.kind !== 'work' || !task.grade || monthKey(task.updated_at) !== key) continue;
    const metric = out[task.department];
    metric.total += 1;
    if (task.grade === 'good' && task.review_rounds === 0) metric.good += 1;
  }
  for (const metric of Object.values(out)) metric.percent = metric.total ? Math.round((metric.good / metric.total) * 100) : null;
  return out;
}

export function runCountsByDepartment(runs: Pick<OfficeRun, 'department' | 'started_at'>[], now = Date.now()): Partial<Record<DepartmentSlug, number>> {
  const key = monthKey(now);
  const counts: Partial<Record<DepartmentSlug, number>> = {};
  for (const run of runs) {
    if (!run.department || monthKey(run.started_at) !== key) continue;
    counts[run.department] = (counts[run.department] || 0) + 1;
  }
  return counts;
}

export type HeartbeatState = 'normal' | 'slow' | 'stopped';
export function heartbeatHealth(desk: Pick<DeskStatus, 'at'> | null, now = Date.now()): { state: HeartbeatState; ageMinutes: number | null; label: string } {
  const stamp = desk?.at ? Date.parse(desk.at) : Number.NaN;
  if (!Number.isFinite(stamp)) return { state: 'stopped', ageMinutes: null, label: 'ยังไม่พบ heartbeat' };
  const ageMinutes = Math.max(0, Math.floor((now - stamp) / 60_000));
  if (now - stamp > 10 * 60_000) return { state: 'stopped', ageMinutes, label: `หยุด · ${ageMinutes} นาที` };
  if (now - stamp > 2 * 60_000) return { state: 'slow', ageMinutes, label: `ช้า · ${ageMinutes} นาที` };
  return { state: 'normal', ageMinutes, label: ageMinutes ? `ปกติ · ${ageMinutes} นาที` : 'ปกติ · เมื่อครู่' };
}

const dateParts = (value: string | number | Date) => {
  const parts = Object.fromEntries(dayFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
};

export function bangkokMonthStartIso(now = Date.now()): string {
  const { year, month } = dateParts(now);
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+07:00`).toISOString();
}

export function roomDueText(dueDate: string | null | undefined, now = Date.now()): string {
  const match = dueDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const today = dateParts(now);
  const dueDay = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const todayDay = Date.UTC(today.year, today.month - 1, today.day);
  const days = Math.round((dueDay - todayDay) / 86_400_000);
  return days >= 0 ? `เหลือ ${days} วัน` : `เลยกำหนด ${Math.abs(days)} วัน`;
}

export const isQuietActive = (quiet: QuietStatus | null | undefined, now = Date.now()) => {
  const until = quiet?.until ? Date.parse(quiet.until) : Number.NaN;
  return Number.isFinite(until) && until > now;
};

export function fmtWhen(iso: string | null | undefined, now = Date.now()): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return '';
  const value = new Date(iso);
  const today = dayFormatter.format(new Date(now));
  const day = dayFormatter.format(value);
  const time = value.toLocaleTimeString('th-TH', { timeZone: BANGKOK, hour: '2-digit', minute: '2-digit' });
  if (day === today) return time;
  return `${value.toLocaleDateString('th-TH', { timeZone: BANGKOK, day: 'numeric', month: 'short' })} ${time}`;
}

// ---------------------------------------------------------------- ไฟล์ผลงาน (of_files) + ปุ่มส่ง (of_sends)
export type SendChannel = 'telegram' | 'line';
export type SendStatus = 'queued' | 'sending' | 'sent' | 'failed';

export interface OfficeFile {
  id: number;
  task_id: number;
  rel_path: string;
  name: string;
  mime: string | null;
  size_bytes: number;
  drive_url: string | null;
  drive_kind: 'file' | 'gdoc';
  missing: boolean;
  uploaded_at: string | null;
  updated_at: string;
}

export interface OfficeSend {
  id: number;
  file_id: number;
  channel: SendChannel;
  status: SendStatus;
  error: string | null;
  share_expires_at: string | null;
  created_at: string;
  sent_at: string | null;
}

export const SEND_CHANNEL_LABEL: Record<SendChannel, string> = { telegram: 'ส่ง Telegram', line: 'ส่ง LINE' };

const FILE_KINDS: [RegExp, string, string][] = [
  [/\.(md|txt|docx?|rtf)$/i, '📝', 'เอกสาร'],
  [/\.pdf$/i, '📕', 'PDF'],
  [/\.(pptx?|key)$/i, '📊', 'สไลด์'],
  [/\.(xlsx?|csv)$/i, '📈', 'ตาราง'],
  [/\.(png|jpe?g|gif|webp|svg)$/i, '🖼️', 'รูป'],
  [/\.(mp4|mov|webm)$/i, '🎬', 'วิดีโอ'],
  [/\.(mp3|m4a|wav)$/i, '🎧', 'เสียง'],
];
export function fileKind(name: string): { icon: string; label: string } {
  const hit = FILE_KINDS.find(([re]) => re.test(name));
  return hit ? { icon: hit[1], label: hit[2] } : { icon: '📄', label: 'ไฟล์' };
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const [value, unit] = bytes < 1024 ** 2 ? [bytes / 1024, 'KB'] : [bytes / 1024 ** 2, 'MB'];
  return `${Number(value.toFixed(1))} ${unit}`;
}

export const filesForTask = (files: OfficeFile[], taskId: number) =>
  files.filter((file) => file.task_id === taskId && !file.missing).sort((a, b) => a.rel_path.localeCompare(b.rel_path));

/** แถวส่งล่าสุดต่อ "ไฟล์:ช่องทาง" */
export function latestSends(sends: OfficeSend[]): Map<string, OfficeSend> {
  const out = new Map<string, OfficeSend>();
  for (const send of sends) {
    const key = `${send.file_id}:${send.channel}`;
    const seen = out.get(key);
    if (!seen || send.created_at > seen.created_at || (send.created_at === seen.created_at && send.id > seen.id)) out.set(key, send);
  }
  return out;
}

export const hasPendingSend = (sends: Pick<OfficeSend, 'status'>[]) => sends.some((send) => send.status === 'queued' || send.status === 'sending');

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { timeZone: BANGKOK, day: 'numeric', month: 'short' });

export function sendStatusText(send: OfficeSend, now = Date.now()): string {
  if (send.status === 'queued') return 'รอส่ง';
  if (send.status === 'sending') return 'กำลังส่ง';
  if (send.status === 'failed') return `ส่งไม่สำเร็จ: ${send.error || 'ไม่ทราบสาเหตุ'}`;
  const sent = `ส่งแล้ว ${fmtWhen(send.sent_at, now)}`.trim();
  if (send.channel !== 'line' || !send.share_expires_at) return sent;
  return Date.parse(send.share_expires_at) > now ? `${sent} · ลูกค้าเปิดได้ถึง ${shortDate(send.share_expires_at)}` : `${sent} · ลิงก์หมดอายุแล้ว`;
}
