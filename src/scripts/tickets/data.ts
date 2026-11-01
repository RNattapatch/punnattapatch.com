// Ticket Center — Supabase data layer for /app/tickets.
// The browser never runs anything: it reads the td_* mirror and writes pending rows into td_actions,
// which desk-sync on the Mac mini validates and applies (migration 202611010004).
import { supabase, getSupabaseSession } from '../dashboard/supabase';
import type { Ticket, Action, Task, AgentRun, Project, DeskStatus, GroupInfo, ActionKind, Stranger } from './logic';

async function who(): Promise<string> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  return session.user.email || 'owner';
}
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export async function loadTickets(): Promise<Ticket[]> {
  await who();
  const { data, error } = await supabase.from('td_tickets')
    .select('id,project,client,system_name,title,status,source,reporter,urgency,created_at,updated_at,data')
    .order('updated_at', { ascending: false }).limit(300);
  fail(error);
  return (data || []) as Ticket[];
}

export async function loadActions(ticketId: string): Promise<Action[]> {
  const { data, error } = await supabase.from('td_actions').select('id,ticket_id,kind,note,status,result,created_at,done_at')
    .eq('ticket_id', ticketId).order('created_at', { ascending: false }).limit(30);
  fail(error);
  return (data || []) as Action[];
}

export async function loadBoard(): Promise<{ tasks: Task[]; runs: AgentRun[]; projects: Project[]; desk: DeskStatus | null; groups: Record<string, GroupInfo>; strangers: Stranger[] }> {
  const [t, r, p, s] = await Promise.all([
    supabase.from('td_tasks').select('id,title,status,current_owner,next_owner,path,updated_at').limit(500),
    supabase.from('td_agent_runs').select('id,ts,job,provider,ok,degraded,ms,attempts').order('ts', { ascending: false }).limit(150),
    supabase.from('td_projects').select('slug,client,name,line_groups,emails,auto_ship,has_tests').order('slug'),
    supabase.from('td_status').select('key,data'),
  ]);
  fail(t.error); fail(r.error); fail(p.error); fail(s.error);
  const st = Object.fromEntries((s.data || []).map((x: { key: string; data: unknown }) => [x.key, x.data]));
  return {
    tasks: (t.data || []) as Task[], runs: (r.data || []) as AgentRun[], projects: (p.data || []) as Project[],
    desk: (st.desk as DeskStatus) || null, groups: (st.groups as Record<string, GroupInfo>) || {},
    strangers: ((st.mail_strangers as { list?: Stranger[] })?.list) || [],
  };
}

/** client_request_id สร้างตอนเปิดฟอร์ม → กดซ้ำ/เน็ตกระตุก = แถวเดียว (23505 = เคยส่งแล้ว ถือว่าสำเร็จ) */
export async function queueAction(kind: ActionKind | 'bind_group', ticketId: string | null, note: string, payload: Record<string, string>, clientRequestId: string): Promise<void> {
  const by = await who();
  const { error } = await supabase.from('td_actions').insert({
    ticket_id: ticketId, kind, note: note.trim() || null, payload, client_request_id: clientRequestId, created_by: by,
  });
  if (error && error.code !== '23505') throw new Error(error.message);
}
