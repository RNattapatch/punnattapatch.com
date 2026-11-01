// Chat Single Gateway — pure rules for /app/gateway (no DOM, no network → tests/chat-gateway-logic.test.mjs)
// Spec: claude-code repo → docs/superpowers/specs/2026-11-01-chat-single-gateway-phase1.md

export type Channel = 'line' | 'messenger' | 'whatsapp';
export type Dir = 'in' | 'bot' | 'staff' | 'note';

export interface Contact {
  id: string; channel: Channel; external_id: string; display_name: string | null; picture_url: string | null;
  lead_id: string | null; tags: string[]; last_message_at: string | null; last_in_at: string | null;
  last_preview: string | null; last_read_at: string | null; bot_hold_until: string | null;
  bot_notes?: string[]; blocked?: boolean;
}
export type Kind = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'location';
// media: path = private storage object (signed URL) · url = customer's https link · sticker_url = LINE public sticker PNG
export interface Media { path?: string; url?: string; sticker_url?: string; mime?: string; size?: number | null; name?: string | null; duration?: number | null; lat?: number; lng?: number; title?: string | null; address?: string | null; error?: string }
export interface Message { id: number; contact_id: string; dir: Dir; body: string; ts: string; created_by: string | null; kind?: Kind; media?: Media | null }
export interface FileRow { id: string; contact_id: string; source: 'chat' | 'upload'; path: string; name: string; mime: string | null; size_bytes: number | null; created_at: string; created_by: string | null; note?: string | null }
// A file Pun already sent is evidence too: deleting it would break the chat image and the customer's link.
export const canDeleteFile = (f: FileRow) => f.source === 'upload' && !(f.note || '').startsWith('ส่งให้ลูกค้า');
export interface OutboxRow {
  id: string; contact_id: string; kind: 'text' | 'hold' | 'release'; body: string | null; status: 'pending' | 'sending' | 'sent' | 'failed';
  error: string | null; created_at: string; client_request_id: string;
}
export interface GatewayStatus {
  bot_mode?: string; office_auto?: boolean; holds?: number; send_off?: boolean; heartbeat?: string;
  quota?: { type?: string; limit?: number | null; used?: number | null } | null;
}

// Accent per channel: `accent` carries white text at ≥4.5:1 · `tint`/`ink` = light chip pair · `wash` = thread background.
// The open chat recolours the inbox so you always know where a reply goes.
export const CHANNEL_META: Record<Channel, { label: string; short: string; accent: string; tint: string; ink: string; wash: string }> = {
  line: { label: 'LINE', short: 'LINE', accent: '#06803c', tint: '#e3f6ea', ink: '#05622f', wash: '#f1faf4' },
  messenger: { label: 'Messenger', short: 'FB', accent: '#1b5fd6', tint: '#e7eefc', ink: '#1747a6', wash: '#f2f6fd' },
  whatsapp: { label: 'WhatsApp', short: 'WA', accent: '#0a6f68', tint: '#dff3f1', ink: '#08524d', wash: '#f0f8f7' },
};

export const MAX_MESSAGE = 2000;
export const STALE_HEARTBEAT_MS = 2 * 60_000;
export const WA_WINDOW_MS = 23.5 * 3600 * 1000; // same margin as the mini (gateway-lib.mjs)

// คนที่บล็อก OA ไปแล้วตอบไม่ได้ จึงไม่นับเป็นงานค้าง
export const isUnread = (c: Contact) => !c.blocked && !!c.last_in_at && (!c.last_read_at || c.last_in_at > c.last_read_at);

export function holdUntil(c: Contact, now = Date.now()): Date | null {
  if (!c.bot_hold_until) return null;
  const d = new Date(c.bot_hold_until);
  return d.getTime() > now ? d : null;
}

export type View = 'all' | 'unread' | 'held' | 'crm';
export function filterContacts(list: Contact[], view: View, q: string, now = Date.now(), hideBlocked = false): Contact[] {
  const needle = q.trim().toLowerCase();
  return list.filter((c) => {
    if (hideBlocked && c.blocked) return false;
    if (view === 'unread' && !isUnread(c)) return false;
    if (view === 'held' && !holdUntil(c, now)) return false;
    if (view === 'crm' && !c.lead_id) return false;
    if (!needle) return true;
    return [c.display_name, c.last_preview, ...(c.tags || [])].some((s) => (s || '').toLowerCase().includes(needle));
  });
}

const TZ = 'Asia/Bangkok';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });
export function fmtWhen(iso: string | null, now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: TZ });
}
export const fmtClock = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

export function checkDraft(text: string): { ok: true; body: string } | { ok: false; error: string } {
  const body = text.trim();
  if (!body) return { ok: false, error: 'ยังไม่ได้พิมพ์ข้อความ' };
  if (body.length > MAX_MESSAGE) return { ok: false, error: `ยาวเกิน ${MAX_MESSAGE.toLocaleString()} ตัวอักษร (ตอนนี้ ${body.length.toLocaleString()})` };
  return { ok: true, body };
}

export function parseTags(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[,\n]/)) {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 20);
}

export function heartbeatAge(s: GatewayStatus | null, now = Date.now()): number | null {
  if (!s?.heartbeat) return null;
  return now - new Date(s.heartbeat).getTime();
}
// ส่งได้เมื่อมินิยังเต้นอยู่และไม่ได้ปิดการส่งไว้ — ไม่งั้นคำสั่งจะค้างในคิวโดยที่คุณปันไม่รู้
export function canSend(s: GatewayStatus | null, c: Contact | null, now = Date.now()): { ok: boolean; why: string } {
  if (!c) return { ok: false, why: 'เลือกแชทก่อน' };
  if (c.channel !== 'line' && c.channel !== 'whatsapp') return { ok: false, why: 'ช่องทางนี้ยังตอบจากหน้านี้ไม่ได้ (รอแอป Meta)' };
  if (!c.last_in_at) return { ok: false, why: 'ลูกค้ายังไม่เคยทักมา ส่งก่อนไม่ได้' };
  // WhatsApp: free-form replies only within 24h of the customer's last message (after that Meta requires a paid template)
  if (c.channel === 'whatsapp' && now - Date.parse(c.last_in_at) > WA_WINDOW_MS) return { ok: false, why: 'WhatsApp: เกิน 24 ชม. หลังลูกค้าทักล่าสุด ตอบได้ด้วย template ที่ Meta อนุมัติเท่านั้น' };
  const age = heartbeatAge(s, now);
  if (age === null || age > STALE_HEARTBEAT_MS) return { ok: false, why: 'มินิไม่ตอบ ข้อความจะยังไม่ออก · ตอบในแอป LINE OA ไปก่อน' };
  if (s?.send_off) return { ok: false, why: 'ปิดการส่งไว้ที่มินิ (gw_send_off)' };
  return { ok: true, why: '' };
}

export const BOT_MODE_LABEL: Record<string, string> = {
  off: 'บอทพัก คุณปันตอบเองทั้งร้าน',
  shadow: 'บอทแค่ร่าง ไม่ส่งจริง (shadow)',
  review: 'บอทร่าง รอคุณปันอนุมัติใน Telegram (review)',
  guard: 'บอทตอบเอง (guard)',
};

export function quotaText(s: GatewayStatus | null): string {
  const q = s?.quota;
  if (!q) return 'ยังไม่รู้โควตา push';
  if (q.type === 'none') return `push เดือนนี้ ${Number(q.used ?? 0).toLocaleString()} ข้อความ (ไม่จำกัด)`;
  return `push เดือนนี้ ${Number(q.used ?? 0).toLocaleString()} / ${Number(q.limit ?? 0).toLocaleString()}`;
}

export const OUTBOX_LABEL: Record<OutboxRow['status'], string> = { pending: 'รอคิว', sending: 'กำลังส่ง', sent: 'ส่งแล้ว', failed: 'ส่งไม่ออก' };

// ข้อความที่ส่งแล้วจะกลับมาเป็นแถว staff จาก mirror ภายในไม่กี่วินาที → โชว์จาก outbox เฉพาะที่ยังไม่ออก/ออกไม่ได้
export const visibleOutbox = (rows: OutboxRow[]) => rows.filter((r) => r.kind === 'text' && r.status !== 'sent');

export const displayName = (c: Contact) => c.display_name || 'ลูกค้า LINE';
// ข้ามคำนำหน้า "คุณ" และสระหน้า เ แ โ ใ ไ ไม่งั้นชื่อ "คุณเอ" ได้ตัวย่อเป็นสระ
export const initialOf = (c: Contact) => (displayName(c).replace(/^คุณ/, '').trim().replace(/^[เแโใไ]/, '').charAt(0) || '?').toUpperCase();

// ---------- store-wide bot mode (same 4 modes as the Telegram commands) ----------
export const BOT_MODES: { id: 'off' | 'shadow' | 'review' | 'guard'; label: string }[] = [
  { id: 'off', label: 'พัก' }, { id: 'shadow', label: 'ร่างเงียบ' }, { id: 'review', label: 'รออนุมัติ' }, { id: 'guard', label: 'ตอบเอง' },
];

// ---------- files ----------
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // same cap as the bucket and gw_files.size_bytes

export function fmtSize(n: number | null | undefined): string {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function checkUpload(f: { name: string; size: number }): string | null {
  if (!f.size) return `${f.name}: ไฟล์ว่าง`;
  if (f.size > MAX_UPLOAD_BYTES) return `${f.name}: ใหญ่เกิน 25 MB`;
  return null;
}

// Thai vowels and tone marks are Unicode marks (\p{M}) — keep them, or "สัญญา" turns into "ส_ญญา"
export const safeName = (s: string) => String(s || '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N}._-]+/gu, '_').replace(/^[._]+/, '').slice(0, 80) || 'file';
export const uploadPath = (contactId: string, id: string, name: string) => `upload/${contactId}/${id}-${safeName(name)}`;

export const isImage = (mime: string | null | undefined) => /^image\//.test(mime || '');

// storage paths in a thread + file list that still need a signed URL
export function pathsToSign(messages: Message[], files: FileRow[], have: (p: string) => boolean): string[] {
  const out = new Set<string>();
  for (const m of messages) if (m.media?.path && !have(m.media.path)) out.add(m.media.path);
  for (const f of files) if (!have(f.path)) out.add(f.path);
  return [...out];
}

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;

// ---------- fold the bot's attachment notes into the attachment ----------
// The bot also writes its own line per attachment ("[ส่งสติกเกอร์ (…)]", "[ส่งไฟล์]") — a second bubble right after the real one.
// Photos get "[ลูกค้าส่งรูปมา N รูป — ในรูป …]", the AI's reading of the photo: keep it, as a caption under the image.
// Only folds when the real attachment row sits just before it, so history from before attachments were tracked stays as it was.
export type ShownMessage = Message & { caption?: string };
const IMG_NOTE = /^\[(?:ลูกค้าส่งรูปมา \d+ รูป(?: — )?|ส่งรูป \d+ รูป: )/;
export function foldMediaEchoes(msgs: Message[], windowMs = 120_000): ShownMessage[] {
  const out: ShownMessage[] = [];
  for (const m of msgs) {
    const isText = !m.kind || m.kind === 'text';
    const note = m.dir === 'in' && isText && m.body.startsWith('[') ? (IMG_NOTE.test(m.body) ? 'image' : m.body.startsWith('[ส่ง') ? 'other' : null)
      : m.dir === 'staff' && isText && m.body.startsWith('[ส่ง') ? 'staff' : null; // gateway-sync's memory line for what Pun sent
    let folded = false;
    if (note) {
      const t = Date.parse(m.ts);
      for (let i = out.length - 1; i >= 0; i--) {
        const p = out[i];
        if (t - Date.parse(p.ts) > windowMs) break;
        if (!p.kind || p.kind === 'text' || p.caption !== undefined) continue;
        if (note === 'staff') { if (p.dir !== 'staff') continue; p.caption = ''; folded = true; break; }
        if (p.dir !== 'in') continue;
        if (note === 'image' ? p.kind !== 'image' : p.kind === 'image') continue;
        if (note === 'image') p.caption = m.body.replace(IMG_NOTE, '').replace(/\]$/, '').trim() || 'บอทอ่านรูปนี้ไม่สำเร็จ';
        else p.caption = '';
        folded = true;
        break;
      }
    }
    if (!folded) out.push({ ...m });
  }
  return out;
}

// ---------- sending stickers + attachments ----------
// LINE lets bots send only these stickers: [packageId, firstStickerId, lastStickerId]. All 456 ids checked with LINE's
// validate endpoint on 2026-11-01. Same table on the Mac mini (gateway-lib.mjs STICKER_PACKS) — it re-checks every send.
export const STICKER_PACKS: [number, number, number][] = [
  [11537, 52002734, 52002773], [11538, 51626494, 51626533], [11539, 52114110, 52114149], [446, 1988, 2027], [789, 10855, 10894],
  [1070, 17839, 17878], [6136, 10551376, 10551399], [6325, 10979904, 10979927], [6359, 11069848, 11069871], [6362, 11087920, 11087943],
  [6370, 11088016, 11088039], [6632, 11825374, 11825397], [8515, 16581242, 16581265], [8522, 16581266, 16581289], [8525, 16581290, 16581313],
];
export const stickerUrl = (id: number) => `https://stickershop.line-scdn.net/stickershop/v1/sticker/${id}/android/sticker.png`;
export const stickersOf = ([, a, b]: [number, number, number]) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const MAX_ATTACH = 4; // LINE push = 5 messages: up to 4 attachments + the caption
const SENDABLE_IMAGE = /^image\/(jpeg|png|webp|gif|bmp)$/; // what the browser can redraw as JPEG; HEIC etc. go as a file link
export const attachKind = (f: { type: string }): 'image' | 'file' => (SENDABLE_IMAGE.test(f.type) ? 'image' : 'file');

export function checkAttach(f: { name: string; size: number }, already: number): string | null {
  if (already >= MAX_ATTACH) return `แนบได้ครั้งละ ${MAX_ATTACH} ไฟล์`;
  return checkUpload(f);
}

// Outgoing objects get ASCII-only names: LINE fetches them by URL, and Thai in a URL path is a needless risk.
export const outPath = (contactId: string, id: string, ext: string) => `upload/${contactId}/out-${id}.${ext.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || 'bin'}`;
export const extOfName = (name: string) => /\.([A-Za-z0-9]{1,8})$/.exec(name || '')?.[1]?.toLowerCase() || 'bin';
