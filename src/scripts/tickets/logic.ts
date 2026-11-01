// Ticket Center — pure rules for /app/tickets (no DOM, no network) · tests: node tests/ticket-center-logic.test.mjs
// ข้อมูลจริงอยู่บนมินิ (ticket-desk) · หน้านี้อ่านกระจกใน td_* และเขียนได้แค่คำสั่ง pending ลง td_actions

export interface Run { stage: string; provider: string | null; ok: boolean; ms: number; at: string; attempts?: string }
export interface HistoryItem { at: string; status: string; note?: string }
export interface Ticket {
  id: string; project: string; client: string | null; system_name: string | null; title: string; status: string;
  source: 'line' | 'email' | 'form' | 'manual'; reporter: string | null; urgency: string | null; created_at: string; updated_at: string;
  data: {
    what_happened?: string; replies?: { at: string; text: string }[]; pun_notes?: { at: string; text: string }[];
    history?: HistoryItem[]; runs?: Run[]; fix_summary?: string | null; branch?: string | null; images?: number;
    spec?: { kind: string; clear: boolean; risk: string; summary: string; repro: string; expected: string; acceptance: string[]; suspect_files: string[]; questions: string[] } | null;
    guard?: { files: string[]; lines: number; flags: string[] } | null;
    tests?: { ok: boolean; tail: string } | null;
    review?: { verdict: string; risk: string; notes: string; client_message: string } | null;
    origin?: { type: string; from?: string; group?: string | null } | null;
  };
}
export interface Action { id: string; ticket_id: string | null; kind: string; note: string | null; status: string; result: string | null; created_at: string; done_at: string | null }
export interface Task { id: string; title: string | null; status: string | null; current_owner: string | null; next_owner: string | null; path: string | null; updated_at: string | null }
export interface AgentRun { id: string; ts: string; job: string; provider: string | null; ok: boolean; degraded: boolean; ms: number | null; attempts: string | null }
export interface Project { slug: string; client: string | null; name: string | null; line_groups: { id: string; name: string | null }[]; emails: string[]; auto_ship: boolean; has_tests: boolean }
export interface DeskStatus { at: string; line: boolean; mail: string; worker: boolean; worker_off: boolean; queue: number }
export interface GroupInfo { name?: string | null; joined_at?: string | null; left_at?: string | null; warned_at?: string | null }

const TZ = 'Asia/Bangkok';

// --------------------------------------------------------------------------- สถานะ

export type Bucket = 'decide' | 'working' | 'client' | 'done';
export const STATUS_META: Record<string, { label: string; tone: string; bucket: Bucket }> = {
  new:               { label: 'เข้าคิว',            tone: 'badge-ghost',   bucket: 'working' },
  triaging:          { label: 'Claude คัดแยก',      tone: 'badge-info',    bucket: 'working' },
  fixing:            { label: 'Codex กำลังแก้',      tone: 'badge-info',    bucket: 'working' },
  review:            { label: 'Claude รีวิว',        tone: 'badge-info',    bucket: 'working' },
  approved:          { label: 'อนุมัติแล้ว รอขึ้น',    tone: 'badge-info',    bucket: 'working' },
  shipping:          { label: 'กำลังขึ้นระบบ',       tone: 'badge-info',    bucket: 'working' },
  awaiting_approval: { label: 'รอคุณปันอนุมัติ',     tone: 'badge-warning', bucket: 'decide' },
  needs_human:       { label: 'ต้องให้คุณปันดู',      tone: 'badge-warning', bucket: 'decide' },
  fix_failed:        { label: 'เครื่องแก้ไม่สำเร็จ',  tone: 'badge-error',   bucket: 'decide' },
  ship_failed:       { label: 'ขึ้นระบบไม่สำเร็จ',   tone: 'badge-error',   bucket: 'decide' },
  needs_info:        { label: 'รอลูกค้าตอบ',        tone: 'badge-ghost',   bucket: 'client' },
  shipped:           { label: 'ขึ้นระบบแล้ว',        tone: 'badge-success', bucket: 'done' },
  declined:          { label: 'ไม่อนุมัติ',          tone: 'badge-ghost',   bucket: 'done' },
  closed:            { label: 'ปิดแล้ว',            tone: 'badge-ghost',   bucket: 'done' },
};
export const statusMeta = (s: string) => STATUS_META[s] || { label: s, tone: 'badge-ghost', bucket: 'working' as Bucket };

export type View = 'decide' | 'working' | 'client' | 'done' | 'all';
export const VIEWS: { id: View; label: string }[] = [
  { id: 'decide', label: 'ต้องตัดสิน' }, { id: 'working', label: 'เครื่องกำลังทำ' }, { id: 'client', label: 'รอลูกค้า' },
  { id: 'done', label: 'จบแล้ว' }, { id: 'all', label: 'ทั้งหมด' },
];

// มุม "ทั้งหมด": ของที่ต้องตัดสินก่อน แล้วงานที่ยังเดิน แล้วรอลูกค้า แล้วที่จบแล้ว
const BUCKET_RANK: Record<Bucket, number> = { decide: 0, working: 1, client: 2, done: 3 };

export function filterTickets(list: Ticket[], view: View, q = ''): Ticket[] {
  const needle = q.trim().toLowerCase();
  return list
    .filter((t) => view === 'all' || statusMeta(t.status).bucket === view)
    .filter((t) => !needle || [t.id, t.title, t.client, t.system_name, t.reporter, t.data?.what_happened].some((v) => String(v || '').toLowerCase().includes(needle)))
    .sort((a, b) => BUCKET_RANK[statusMeta(a.status).bucket] - BUCKET_RANK[statusMeta(b.status).bucket]
      || (a.urgency === 'urgent' ? 0 : 1) - (b.urgency === 'urgent' ? 0 : 1)
      || b.updated_at.localeCompare(a.updated_at));
}

export const countBy = (list: Ticket[]) => list.reduce((acc, t) => { const b = statusMeta(t.status).bucket; acc[b] = (acc[b] || 0) + 1; return acc; }, {} as Record<Bucket, number>);

// --------------------------------------------------------------------------- ความคืบหน้าของ agent

export const PROVIDER_LABEL: Record<string, string> = { claude: 'Claude', codex: 'Codex', sandbox: 'เทสต์ใน sandbox', ship_cmd: 'คำสั่งขึ้นระบบ' };
export interface Step { key: string; label: string; state: 'done' | 'now' | 'fail' | 'todo' | 'skip'; who?: string; ms?: number }

/** เส้นทางของ ticket หนึ่งใบเป็นขั้น ๆ: ใครทำ (Claude/Codex/sandbox) นานเท่าไร ตอนนี้อยู่ขั้นไหน */
export function timeline(t: Ticket): Step[] {
  const runs = t.data?.runs || [];
  const last = (stage: string) => [...runs].reverse().find((r) => r.stage === stage);
  const seen = new Set((t.data?.history || []).map((h) => h.status));
  const s = t.status;
  const mk = (key: string, label: string, stage: string | null, nowWhen: string[], reached: boolean): Step => {
    const r = stage ? last(stage) : undefined;
    const who = r?.provider ? PROVIDER_LABEL[r.provider] || r.provider : undefined;
    if (nowWhen.includes(s)) return { key, label, state: 'now', who };
    if (r) return { key, label, state: r.ok ? 'done' : 'fail', who, ms: r.ms };
    return { key, label, state: reached ? 'done' : 'todo' };
  };
  const steps: Step[] = [
    { key: 'in', label: t.source === 'email' ? 'รับทางอีเมล' : t.source === 'line' ? 'รับทาง LINE' : 'รับเรื่อง', state: 'done' },
    mk('triage', 'คัดแยก', 'triage', ['new', 'triaging'], seen.has('fixing') || seen.has('needs_info') || seen.has('needs_human')),
    mk('fix', 'แก้โค้ด', 'fix', ['fixing'], seen.has('review')),
    mk('tests', 'เทสต์', 'tests', [], Boolean(t.data?.tests)),
    mk('review', 'รีวิว', 'review', ['review'], seen.has('awaiting_approval') || seen.has('approved')),
    { key: 'approve', label: 'คุณปันอนุมัติ', state: s === 'awaiting_approval' ? 'now' : seen.has('approved') ? 'done' : s === 'declined' ? 'fail' : 'todo' },
    mk('ship', 'ขึ้นระบบ', 'ship', ['approved', 'shipping'], s === 'shipped'),
  ];
  // ไม่ใช่บั๊ก/ถามลูกค้า = ขั้นหลังคัดแยกไม่เกิดขึ้น ไม่ใช่ "ยังไม่ถึง"
  if (['needs_info', 'needs_human'].includes(s) && !runs.some((r) => r.stage === 'fix')) for (const st of steps.slice(2)) st.state = 'skip';
  if (s === 'fix_failed' && !t.data?.tests) steps[3].state = 'skip';
  return steps;
}

export function fmtMs(ms?: number | null): string {
  if (ms == null) return '';
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} วิ` : `${Math.floor(s / 60)} นาที ${s % 60} วิ`;
}

export function fmtWhen(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  const key = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: TZ });
  const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  if (key(d) === key(now)) return time;
  if (key(d) === key(new Date(now.getTime() - 86_400_000))) return `เมื่อวาน ${time}`;
  return `${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: TZ })} ${time}`;
}

/** ค้างขั้นเดียวนานเกินไปไหม (worker ตาย/agent ค้าง) — โชว์เตือนแทนที่จะหมุนเงียบ */
export function stuckMinutes(t: Ticket, now = Date.now()): number | null {
  if (!['triaging', 'fixing', 'review', 'shipping'].includes(t.status)) return null;
  const m = Math.floor((now - Date.parse(t.updated_at)) / 60_000);
  return m >= 40 ? m : null;
}

// --------------------------------------------------------------------------- คำสั่ง

export type ActionKind = 'approve' | 'decline' | 'rerun' | 'close';
/** ปุ่มไหนกดได้ — กติกาเดียวกับ applyAction บนมินิ (มินิเช็คซ้ำเสมอ) */
export function allowed(t: Ticket): ActionKind[] {
  const s = t.status;
  const out: ActionKind[] = [];
  if (s === 'awaiting_approval') out.push('approve', 'decline');
  if (['needs_human', 'fix_failed', 'ship_failed', 'declined', 'awaiting_approval', 'needs_info', 'closed'].includes(s)) out.push('rerun');
  if (statusMeta(s).bucket !== 'working' && s !== 'closed') out.push('close');
  return out;
}
export const ACTION_LABEL: Record<string, string> = {
  approve: 'อนุมัติขึ้นระบบจริง', decline: 'ไม่อนุมัติ', rerun: 'ให้เครื่องทำใหม่', close: 'ปิดเคส', bind_group: 'ผูกกลุ่ม',
};
export const MAX_NOTE = 2000;
export function checkNote(note: string, kind: ActionKind): string | null {
  const n = note.trim();
  if (n.length > MAX_NOTE) return `โน้ตยาวเกิน ${MAX_NOTE} ตัวอักษร`;
  if (kind === 'rerun' && n.length < 5) return 'บอกเครื่องสั้นๆ ว่าครั้งนี้ให้ทำอะไรต่างจากเดิม';
  return null;
}

// --------------------------------------------------------------------------- มินิ / งานส่งต่อ / กลุ่ม

export function deskHealth(st: DeskStatus | null, now = Date.now()): { ok: boolean; text: string } {
  if (!st?.at) return { ok: false, text: 'ยังไม่เห็นมินิ' };
  const age = Math.round((now - Date.parse(st.at)) / 60_000);
  if (age > 3) return { ok: false, text: `มินิเงียบ ${age} นาที` };
  if (st.worker_off) return { ok: false, text: 'ปิด worker อยู่' };
  if (!st.worker) return { ok: false, text: 'worker ไม่ทำงาน' };
  return { ok: true, text: `มินิปกติ · คิว ${st.queue}` };
}
export const MAIL_LABEL: Record<string, string> = { on: 'support@ พร้อม', not_configured: 'support@ ยังไม่ตั้งค่า', error: 'support@ ส่งไม่ออก (เปิด Email Sending หรือยัง?)', unknown: 'อีเมล …' };
export interface Stranger { from: string; subject: string; at: string }

export type Owner = 'claude' | 'codex' | 'pun' | 'other';
export const OWNER_LABEL: Record<Owner, string> = { pun: 'รอคุณปัน', claude: 'Claude', codex: 'Codex', other: 'Agent อื่น' };
export function ownerOf(s: string | null): Owner {
  const v = String(s || '').toLowerCase();
  if (/ปัน|pun/.test(v)) return 'pun';
  if (/codex/.test(v)) return 'codex';
  if (/claude|fable/.test(v)) return 'claude';
  return 'other';
}
// "done · รอคุณปันตัดสิน 2 ข้อ" = agent เสร็จแต่ยังรอคน → ยังเปิดอยู่
export const isOpenTask = (t: Task) => !/^\s*(done|✅|archived)/i.test(t.status || '') || /รอ/.test(t.status || '');

export function groupTasks(tasks: Task[]): Record<Owner, Task[]> {
  const out: Record<Owner, Task[]> = { pun: [], claude: [], codex: [], other: [] };
  for (const t of tasks.filter(isOpenTask)) out[ownerOf(t.next_owner)].push(t);
  for (const k of Object.keys(out) as Owner[]) out[k].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  return out;
}

/** กลุ่ม LINE ที่บอทอยู่ + ผูกกับระบบไหนแล้ว (กลุ่มที่บอทออกแล้วไม่ต้องโชว์) */
export function groupRows(groups: Record<string, GroupInfo>, projects: Project[]) {
  const boundTo = (id: string) => projects.find((p) => p.line_groups.some((g) => g.id === id))?.slug || null;
  return Object.entries(groups || {})
    .filter(([, g]) => !g.left_at)
    .map(([id, g]) => ({ id, name: g.name || null, joined_at: g.joined_at || null, project: boundTo(id) }))
    .sort((a, b) => (a.project ? 1 : 0) - (b.project ? 1 : 0) || String(b.joined_at).localeCompare(String(a.joined_at)));
}
export const isGroupId = (id: string) => /^[CR][0-9a-f]{32}$/.test(id);

export const jobLabel = (job: string) => job.replace(/^ticket-(triage|fix|review)-/, (_, s) => `ticket ${({ triage: 'คัดแยก', fix: 'แก้', review: 'รีวิว' } as Record<string, string>)[s]} `);
