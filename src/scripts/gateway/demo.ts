// DEV ONLY — fixture data for `astro dev` + /app/gateway?demo (UI check without signing in).
// Imported behind `import.meta.env.DEV`, so it never ships in the production bundle. All names/text are made up.
import type { Contact, Message, OutboxRow, GatewayStatus } from './logic';

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const U = (c: string) => 'U' + c.repeat(32);

export const DEMO_STATUS: GatewayStatus = { bot_mode: 'guard', holds: 1, quota: { type: 'limited', limit: 15000, used: 37 }, heartbeat: ago(0.2) };

export const DEMO_CONTACTS: Contact[] = [
  { id: 'd1', channel: 'line', external_id: U('a'), display_name: 'คุณเอ (ตัวอย่าง)', picture_url: null, lead_id: 'demo-lead', tags: ['ร้อน', 'in-house'], last_message_at: ago(2), last_in_at: ago(2), last_preview: 'อยากได้ใบเสนอราคาคลาส in-house ค่ะ', last_read_at: null, bot_hold_until: null },
  { id: 'd2', channel: 'line', external_id: U('b'), display_name: 'Somchai (ตัวอย่าง)', picture_url: null, lead_id: null, tags: [], last_message_at: ago(40), last_in_at: ago(41), last_preview: 'ขอบคุณครับ เดี๋ยวคุยกับหุ้นส่วนก่อน', last_read_at: ago(30), bot_hold_until: ago(-25) },
  { id: 'd3', channel: 'messenger', external_id: '1234567890', display_name: 'ลูกค้า Messenger (ตัวอย่าง)', picture_url: null, lead_id: null, tags: [], last_message_at: ago(300), last_in_at: ago(300), last_preview: 'สนใจคลาสฟรี', last_read_at: ago(200), bot_hold_until: null },
];

export const DEMO_THREADS: Record<string, { messages: Message[]; outbox: OutboxRow[] }> = {
  d1: {
    messages: [
      { id: 1, contact_id: 'd1', dir: 'in', body: 'สวัสดีค่ะ เห็นคลิปเรื่องทีมขายใช้ AI', ts: ago(30), created_by: null },
      { id: 2, contact_id: 'd1', dir: 'bot', body: 'สวัสดีค่ะ ขอบคุณที่ทักมานะคะ ทีมขายตอนนี้มีกี่คนคะ', ts: ago(29), created_by: null },
      { id: 3, contact_id: 'd1', dir: 'in', body: '8 คนค่ะ อยากได้ใบเสนอราคาคลาส in-house ค่ะ <script>alert(1)</script>', ts: ago(2), created_by: null },
      { id: 4, contact_id: 'd1', dir: 'note', body: 'เป็น HR ต้องอธิบายหัวหน้าได้ ส่ง outline ก่อน', ts: ago(1), created_by: 'nattabadi@gmail.com' },
    ],
    outbox: [{ id: 'o1', contact_id: 'd1', kind: 'text', body: 'ได้เลยครับ ขอชื่อบริษัทสำหรับออกใบเสนอราคาครับ', status: 'failed', error: 'LINE 400: The request body has 1 error(s)', created_at: ago(1), client_request_id: 'x' }],
  },
  d2: {
    messages: [
      { id: 5, contact_id: 'd2', dir: 'in', body: 'ราคาเท่าไหร่ครับ', ts: ago(50), created_by: null },
      { id: 6, contact_id: 'd2', dir: 'staff', body: 'วันละ 34,900 บาทครับ ขอเล่าโจทย์ก่อนได้ไหมครับ', ts: ago(45), created_by: null },
      { id: 7, contact_id: 'd2', dir: 'in', body: 'ขอบคุณครับ เดี๋ยวคุยกับหุ้นส่วนก่อน', ts: ago(41), created_by: null },
    ],
    outbox: [],
  },
  d3: { messages: [{ id: 8, contact_id: 'd3', dir: 'in', body: 'สนใจคลาสฟรี', ts: ago(300), created_by: null }], outbox: [] },
};
