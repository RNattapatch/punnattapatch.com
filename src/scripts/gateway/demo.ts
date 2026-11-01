// DEV ONLY — fixture data for `astro dev` + /app/gateway?demo (UI check without signing in).
// Imported behind `import.meta.env.DEV`, so it never ships in the production bundle. All names/text are made up.
import type { Contact, Message, OutboxRow, GatewayStatus, FileRow } from './logic';

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const U = (c: string) => 'U' + c.repeat(32);

export const DEMO_STATUS: GatewayStatus = { bot_mode: 'guard', office_auto: false, holds: 1, quota: { type: 'limited', limit: 15000, used: 37 }, heartbeat: ago(0.2) };

export const DEMO_CONTACTS: Contact[] = [
  { id: 'd1', channel: 'line', external_id: U('a'), display_name: 'คุณเอ (ตัวอย่าง)', picture_url: null, lead_id: 'demo-lead', tags: ['ร้อน', 'in-house'], last_message_at: ago(2), last_in_at: ago(2), last_preview: 'อยากได้ใบเสนอราคาคลาส in-house ค่ะ', last_read_at: null, bot_hold_until: null, bot_notes: ['2026-10-30: HR บริษัท 8 คน ต้องการ in-house', '2026-11-01: ขอ outline ก่อนเสนอหัวหน้า'] },
  { id: 'd2', channel: 'line', external_id: U('b'), display_name: 'Somchai (ตัวอย่าง)', picture_url: null, lead_id: null, tags: [], last_message_at: ago(40), last_in_at: ago(41), last_preview: 'ขอบคุณครับ เดี๋ยวคุยกับหุ้นส่วนก่อน', last_read_at: ago(30), bot_hold_until: ago(-25) },
  { id: 'd3', channel: 'messenger', external_id: '1234567890', display_name: 'ลูกค้า Messenger (ตัวอย่าง)', picture_url: null, lead_id: null, tags: [], last_message_at: ago(300), last_in_at: ago(300), last_preview: 'สนใจคลาสฟรี', last_read_at: ago(200), bot_hold_until: null },
];

export const DEMO_THREADS: Record<string, { messages: Message[]; outbox: OutboxRow[] }> = {
  d1: {
    messages: [
      { id: 1, contact_id: 'd1', dir: 'in', body: 'สวัสดีค่ะ เห็นคลิปเรื่องทีมขายใช้ AI', ts: ago(30), created_by: null },
      { id: 2, contact_id: 'd1', dir: 'bot', body: 'สวัสดีค่ะ ขอบคุณที่ทักมานะคะ ทีมขายตอนนี้มีกี่คนคะ', ts: ago(29), created_by: null },
      { id: 3, contact_id: 'd1', dir: 'in', body: '8 คนค่ะ อยากได้ใบเสนอราคาคลาส in-house ค่ะ <script>alert(1)</script>', ts: ago(2), created_by: null },
      { id: 10, contact_id: 'd1', dir: 'in', kind: 'image', body: '[รูป]', ts: ago(3), created_by: null, media: { path: 'line/demo/1.png', mime: 'image/png', size: 182000 } },
      { id: 11, contact_id: 'd1', dir: 'in', kind: 'sticker', body: '[สติกเกอร์: ok]', ts: ago(2.5), created_by: null, media: { sticker_url: 'https://stickershop.line-scdn.net/stickershop/v1/sticker/52002734/android/sticker.png' } },
      { id: 12, contact_id: 'd1', dir: 'in', kind: 'file', body: '[ไฟล์: ทีมขาย-โครงสร้าง.pdf]', ts: ago(2.2), created_by: null, media: { path: 'line/demo/2.pdf', name: 'ทีมขาย-โครงสร้าง.pdf', mime: 'application/pdf', size: 420000 } },
      { id: 13, contact_id: 'd1', dir: 'in', kind: 'location', body: 'ซอยทองหล่อ 15', ts: ago(2.1), created_by: null, media: { lat: 13.7306, lng: 100.5822, title: 'ออฟฟิศ', address: 'ซอยทองหล่อ 15' } },
      { id: 14, contact_id: 'd1', dir: 'in', kind: 'image', body: '[รูป]', ts: ago(2.05), created_by: null, media: { error: 'ไฟล์หมดอายุที่ LINE แล้ว' } },
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

const PNG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#cfe8d8"/><text x="200" y="160" font-size="28" text-anchor="middle" fill="#05622f">รูปตัวอย่างจากลูกค้า</text></svg>');
export const DEMO_URLS: Record<string, string> = { 'line/demo/1.png': PNG, 'line/demo/2.pdf': PNG, 'upload/d1/aa-quote.pdf': PNG, 'upload/d1/bb-site.png': PNG };
export const DEMO_FILES: Record<string, FileRow[]> = {
  d1: [
    { id: 'f1', contact_id: 'd1', source: 'upload', path: 'upload/d1/bb-site.png', name: 'หน้างาน.png', mime: 'image/png', size_bytes: 230000, created_at: ago(1), created_by: 'nattabadi@gmail.com' },
    { id: 'f2', contact_id: 'd1', source: 'upload', path: 'upload/d1/aa-quote.pdf', name: 'ใบเสนอราคา QO-2026-11-001.pdf', mime: 'application/pdf', size_bytes: 88000, created_at: ago(1), created_by: 'nattabadi@gmail.com' },
    { id: 'f3', contact_id: 'd1', source: 'chat', path: 'line/demo/2.pdf', name: 'ทีมขาย-โครงสร้าง.pdf', mime: 'application/pdf', size_bytes: 420000, created_at: ago(2.2), created_by: null },
    { id: 'f4', contact_id: 'd1', source: 'chat', path: 'line/demo/1.png', name: 'image-1.png', mime: 'image/png', size_bytes: 182000, created_at: ago(3), created_by: null },
  ],
};
