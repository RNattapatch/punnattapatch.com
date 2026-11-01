// Chat Single Gateway — Supabase data layer for /app/gateway.
// The browser never talks to LINE: it writes gw_outbox rows and the Mac mini (gateway-sync) sends them.
// RLS (migration 202611010001) limits the owner to: read everything · insert notes + pending outbox · edit tags/last_read_at/lead_id.
import { supabase, getSupabaseSession } from '../dashboard/supabase';
import { uploadPath, type Contact, type Message, type OutboxRow, type GatewayStatus, type FileRow } from './logic';

async function who(): Promise<string> {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  return session.user.email || 'owner';
}
const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

const CONTACT_COLS = 'id,channel,external_id,display_name,picture_url,lead_id,tags,last_message_at,last_in_at,last_preview,last_read_at,bot_hold_until,bot_notes,blocked';

export async function loadContacts(): Promise<Contact[]> {
  await who();
  const { data, error } = await supabase.from('gw_contacts').select(CONTACT_COLS)
    .not('last_message_at', 'is', null).order('last_message_at', { ascending: false }).limit(500);
  fail(error);
  return (data || []) as Contact[];
}

export async function loadThread(contactId: string): Promise<{ messages: Message[]; outbox: OutboxRow[] }> {
  const [m, o] = await Promise.all([
    supabase.from('gw_messages').select('id,contact_id,dir,body,ts,created_by,kind,media').eq('contact_id', contactId).order('ts', { ascending: false }).limit(400),
    supabase.from('gw_outbox').select('id,contact_id,kind,body,status,error,created_at,client_request_id').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50),
  ]);
  fail(m.error); fail(o.error);
  return { messages: ((m.data || []) as Message[]).reverse(), outbox: ((o.data || []) as OutboxRow[]).reverse() };
}

export async function loadStatus(): Promise<GatewayStatus | null> {
  const { data, error } = await supabase.from('gw_status').select('data').eq('key', 'line').maybeSingle();
  fail(error);
  return (data?.data as GatewayStatus) || null;
}

export interface LeadCard { id: string; full_name: string | null; nickname: string | null; company_name: string | null; pipeline_status: string | null; next_action: string | null; next_action_due: string | null; phone: string | null }
export async function loadLead(id: string): Promise<LeadCard | null> {
  const { data, error } = await supabase.from('leads').select('id,full_name,nickname,company_name,pipeline_status,next_action,next_action_due,phone').eq('id', id).maybeSingle();
  fail(error);
  return (data as LeadCard) || null;
}

export async function queueMode(mode: string, clientRequestId: string): Promise<void> {
  const by = await who();
  const { error } = await supabase.from('gw_outbox').insert({ contact_id: null, kind: 'mode', body: mode, client_request_id: clientRequestId, created_by: by });
  if (error && error.code !== '23505') throw new Error(error.message);
}

// ---------- files (bucket gateway-media · private · signed URL 1 ชม.) ----------
const BUCKET = 'gateway-media';

export async function loadFiles(contactId: string): Promise<FileRow[]> {
  const { data, error } = await supabase.from('gw_files').select('id,contact_id,source,path,name,mime,size_bytes,created_at,created_by')
    .eq('contact_id', contactId).order('created_at', { ascending: false }).limit(200);
  fail(error);
  return (data || []) as FileRow[];
}

export async function signUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  fail(error);
  for (const r of data || []) if (r.signedUrl && r.path) out.set(r.path, r.signedUrl);
  return out;
}

export async function uploadFile(contactId: string, file: File): Promise<void> {
  const by = await who();
  const path = uploadPath(contactId, crypto.randomUUID().slice(0, 8), file.name);
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  fail(up.error);
  const { error } = await supabase.from('gw_files').insert({ contact_id: contactId, source: 'upload', path, name: file.name.slice(0, 200) || 'file', mime: file.type || null, size_bytes: file.size, created_by: by });
  if (error) { await supabase.storage.from(BUCKET).remove([path]); throw new Error(error.message); } // no orphan object without a row
}

// Only files Pun attached himself; chat files are evidence and RLS refuses to delete them anyway.
export async function deleteUpload(f: FileRow): Promise<void> {
  if (f.source !== 'upload') throw new Error('ไฟล์จากแชทลบไม่ได้');
  const { error } = await supabase.from('gw_files').delete().eq('id', f.id);
  fail(error);
  const rm = await supabase.storage.from(BUCKET).remove([f.path]);
  fail(rm.error);
}

// clientRequestId comes from the caller so a double click / retry after a network blip inserts one row, not two.
export async function queue(contactId: string, row: { kind: 'text' | 'hold' | 'release'; body?: string; hold_minutes?: number }, clientRequestId: string): Promise<void> {
  const by = await who();
  const { error } = await supabase.from('gw_outbox').insert({ contact_id: contactId, ...row, client_request_id: clientRequestId, created_by: by });
  if (error && error.code !== '23505') throw new Error(error.message); // 23505 = same request already queued
}

export async function addNote(contactId: string, body: string): Promise<void> {
  const by = await who();
  const { error } = await supabase.from('gw_messages').insert({ contact_id: contactId, dir: 'note', body, ts: new Date().toISOString(), created_by: by });
  fail(error);
}

export async function saveTags(contactId: string, tags: string[]): Promise<void> {
  await who();
  const { error } = await supabase.from('gw_contacts').update({ tags, updated_at: new Date().toISOString() }).eq('id', contactId);
  fail(error);
}

export async function markRead(contactId: string): Promise<void> {
  const { error } = await supabase.from('gw_contacts').update({ last_read_at: new Date().toISOString() }).eq('id', contactId);
  fail(error);
}
