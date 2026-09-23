// Messenger Console — pure logic (no DOM, no network) · tested by tests/messenger-console-logic.test.mjs
//
// ทำไมมีหน้านี้: Meta App Review รอบ 1 (18 ก.ย. 2026) ตีกลับทั้ง 5 สิทธิ์ด้วยเหตุ "Screencast Not Aligned"
// reviewer ขอเห็น login ของ Meta → กดให้สิทธิ์ → เลือกเพจ → กดส่งจาก "UI ของแอปเราเอง" → ข้อความโผล่ใน Messenger
// บอทบนมินิตอบอัตโนมัติหลังบ้านไม่มีหน้าจอ → หน้านี้คือหน้าจอของแอป chat-bot-n8n และใช้ตอบลูกค้า FB เองได้จริง
// Runbook: claude-code repo → mac-mini-ops/line-relay/APP-REVIEW-SUBMISSION.md (ROUND 2)

export const APP_ID = '2457605941352131';
export const PAGE_ID = '841096959096494';
export const GRAPH_VERSION = 'v26.0';
export const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Facebook Login for Business configuration (App Dashboard → Facebook Login for Business → Configurations).
// ว่าง = ใช้ scope แทน (Meta อาจบังคับ config_id สำหรับแอปประเภท Business)
export const LOGIN_CONFIG_ID = '';

// The five permissions under review, in the order the screencast demonstrates them.
export const REQUIRED_SCOPES = [
  'business_management',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_messaging',
] as const;

// Must equal what the live bot relies on — POST subscribed_apps REPLACES the field list,
// so dropping message_echoes here would make the bot forget what staff typed by hand.
export const SUBSCRIBED_FIELDS = [
  'messages',
  'messaging_postbacks',
  'message_deliveries',
  'message_reads',
  'message_echoes',
  'messaging_optins',
  'messaging_policy_enforcement',
  'messaging_referrals',
  'messaging_handovers',
] as const;

// Echoed back on the message_echoes webhook so the bot can tell "a human sent this from
// the console" from "the bot sent this" — both carry our app_id.
export const CONSOLE_METADATA = 'console';

// Meta's standard window is 24h; stop a little early like the bot does (fb-adapter WINDOW_MS).
export const WINDOW_MS = 23.5 * 3600 * 1000;

export function buildLoginUrl(opts: { redirectUri: string; state: string; configId?: string }): string {
  const p = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    response_type: 'token',
  });
  if (opts.configId) p.set('config_id', opts.configId);
  else p.set('scope', REQUIRED_SCOPES.join(','));
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${p.toString()}`;
}

export type AuthResult =
  | { kind: 'none' }
  | { kind: 'token'; token: string; expiresIn: number; state: string }
  | { kind: 'error'; message: string; state: string };

// Meta returns the token in the URL fragment (#access_token=…) and errors in the query
// (?error=…&error_description=…) or the fragment, depending on the flow.
export function parseAuthReturn(hash: string, search: string): AuthResult {
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  const q = new URLSearchParams(search.replace(/^\?/, ''));
  const token = h.get('access_token');
  if (token) {
    return { kind: 'token', token, expiresIn: Number(h.get('expires_in') || 0), state: h.get('state') || '' };
  }
  const err = h.get('error') || q.get('error');
  if (err) {
    const desc = h.get('error_description') || q.get('error_description') || h.get('error_reason') || q.get('error_reason') || err;
    return { kind: 'error', message: desc.replace(/\+/g, ' '), state: h.get('state') || q.get('state') || '' };
  }
  return { kind: 'none' };
}

export interface PermissionRow { permission: string; status: string }

export function permissionReport(rows: PermissionRow[]) {
  const granted = new Set(rows.filter((r) => r.status === 'granted').map((r) => r.permission));
  return REQUIRED_SCOPES.map((scope) => ({ scope, granted: granted.has(scope) }));
}

export interface GraphMessage { id?: string; message?: string; created_time: string; from?: { id: string; name?: string } }
export interface GraphConversation {
  id: string;
  updated_time?: string;
  participants?: { data: { id: string; name?: string }[] };
  messages?: { data: GraphMessage[] };
}

export interface ThreadItem { id: string; text: string; at: string; fromPage: boolean }

// The customer is whichever participant is not our Page.
export function customerOf(conv: GraphConversation, pageId = PAGE_ID) {
  return conv.participants?.data.find((p) => p.id !== pageId) || null;
}

// Graph returns newest first; a chat reads oldest first.
export function threadItems(messages: GraphMessage[], pageId = PAGE_ID): ThreadItem[] {
  return [...messages]
    .sort((a, b) => Date.parse(a.created_time) - Date.parse(b.created_time))
    .map((m, i) => ({
      id: m.id || `m${i}`,
      text: m.message || '(attachment)',
      at: m.created_time,
      fromPage: m.from?.id === pageId,
    }));
}

export function lastCustomerAt(messages: GraphMessage[], pageId = PAGE_ID): number {
  let last = 0;
  for (const m of messages) {
    if (m.from?.id && m.from.id !== pageId) last = Math.max(last, Date.parse(m.created_time) || 0);
  }
  return last;
}

// Can a standard reply still be sent? Returns remaining ms when open.
export function replyWindow(lastInbound: number, now: number) {
  if (!lastInbound) return { open: false, remainingMs: 0 };
  const remainingMs = lastInbound + WINDOW_MS - now;
  return { open: remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
}

export function formatRemaining(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const MAX_TEXT = 2000;

export function buildSendBody(psid: string, text: string) {
  const clean = text.trim();
  if (!psid) throw new Error('No recipient selected');
  if (!clean) throw new Error('Message is empty');
  if (clean.length > MAX_TEXT) throw new Error(`Message is longer than ${MAX_TEXT} characters`);
  return {
    recipient: { id: psid },
    messaging_type: 'RESPONSE',
    message: { text: clean, metadata: CONSOLE_METADATA },
  };
}

// Never let a token reach the screen or a log line (screen recordings are uploaded to Meta).
export function redactToken(value: string): string {
  return String(value || '').replace(/EA[A-Za-z0-9]{20,}/g, 'EA…[hidden]');
}
