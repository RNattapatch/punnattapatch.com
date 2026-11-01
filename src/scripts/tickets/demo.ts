// DEV ONLY fixture for `astro dev` + /app/tickets?demo — dropped from the production build (import.meta.env.DEV guard in the page)
import type { Ticket, Task, AgentRun, Project, DeskStatus, GroupInfo } from './logic';

const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hist = (...s: [string, number][]) => s.map(([status, m]) => ({ at: ago(m), status }));

export const DEMO_TICKETS: Ticket[] = [
  {
    id: 'TK-261101-f23bb1', project: 'demo-pos', client: 'ร้านตัวอย่าง', system_name: 'POS หน้าร้าน', title: 'ใส่ส่วนลดแล้วยอดเงินติดลบ', status: 'awaiting_approval',
    source: 'line', reporter: 'น้องมิ้น แคชเชียร์', urgency: 'urgent', created_at: ago(9), updated_at: ago(7),
    data: {
      what_happened: 'วันนี้ลูกค้าใช้คูปองลด 10 เปอร์เซ็นต์ พอพิมพ์ 10 ในช่องส่วนลด ยอดที่ต้องจ่ายขึ้นเป็นติดลบ ของ 100 บาทขึ้นว่าต้องจ่าย -900 บาท เป็นทุกเครื่อง',
      replies: [], pun_notes: [], images: 2, branch: 'ticket/TK-261101-f23bb1', origin: { type: 'line', group: 'ทีม POS ร้านตัวอย่าง' },
      history: hist(['new', 9], ['triaging', 8], ['fixing', 8], ['review', 7], ['awaiting_approval', 7]),
      runs: [
        { stage: 'triage', provider: 'claude', ok: true, ms: 12642, at: ago(8) }, { stage: 'fix', provider: 'codex', ok: true, ms: 31193, at: ago(8) },
        { stage: 'tests', provider: 'sandbox', ok: true, ms: 640, at: ago(7) }, { stage: 'review', provider: 'claude', ok: true, ms: 10699, at: ago(7) },
      ],
      spec: { kind: 'bug', clear: true, risk: 'low', summary: 'ส่วนลดเปอร์เซ็นต์ถูกคูณตรงๆ โดยไม่หาร 100 ยอดจึงติดลบ', repro: 'สินค้า 100 บาท ส่วนลด 10 กดชำระ', expected: 'ยอด 90 บาท', acceptance: ['ส่วนลด 10% ได้ 90 บาท', 'ไม่มีกรณียอดติดลบ'], suspect_files: ['receipt.mjs'], questions: [] },
      fix_summary: 'ต้นเหตุ: receipt.mjs นำเปอร์เซ็นต์ไปคูณ subtotal โดยไม่หาร 100\nแก้ให้หาร 100 และจำกัดช่วง 0 ถึง 100 พร้อมเทสต์ 4 เคส',
      guard: { files: ['receipt.mjs', 'receipt.test.mjs'], lines: 36, flags: ['tests_modified:receipt.test.mjs'] },
      tests: { ok: true, tail: 'ℹ tests 5\nℹ pass 5\nℹ fail 0' },
      review: { verdict: 'ship', risk: 'low', notes: 'แก้ตรงต้นเหตุ ค่านอกช่วงถูกบีบเข้าช่วงโดยไม่เตือนแคชเชียร์', client_message: 'เราแก้ระบบคิดส่วนลดแล้ว พิมพ์ 10 ของ 100 บาทจะเหลือ 90 บาทตามปกติค่ะ' },
    },
  },
  {
    id: 'TK-261101-defdd7', project: 'demo-pos', client: 'ร้านตัวอย่าง', system_name: 'POS หน้าร้าน', title: 'ใบเสร็จพิมพ์ช้ามาก', status: 'needs_info',
    source: 'email', reporter: 'owner@shop.co.th', urgency: 'normal', created_at: ago(70), updated_at: ago(68),
    data: { what_happened: 'ตอนกดชำระเงินหน้าจอค้างนานมาก', history: hist(['new', 70], ['triaging', 69], ['needs_info', 68]),
      runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 9800, at: ago(69) }], origin: { type: 'email', from: 'owner@shop.co.th' },
      spec: { kind: 'bug', clear: false, risk: 'low', summary: 'กดชำระแล้วค้างนานก่อนพิมพ์ใบเสร็จ', repro: '', expected: '', acceptance: [], suspect_files: [], questions: ['ค้างนานประมาณกี่วินาที', 'เป็นทุกเครื่องหรือบางเครื่อง'] } },
  },
  {
    id: 'TK-261101-c0ffee', project: 'crm-k', client: 'บริษัท เค', system_name: 'CRM ฝ่ายขาย', title: 'ปุ่มส่งใบเสนอราคาไม่ทำงาน', status: 'fixing',
    source: 'line', reporter: 'คุณบี', urgency: 'normal', created_at: ago(4), updated_at: ago(2),
    data: { what_happened: 'กดส่งใบเสนอราคาแล้วไม่มีอะไรเกิดขึ้น', history: hist(['new', 4], ['triaging', 3], ['fixing', 2]),
      runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 15000, at: ago(3) }] },
  },
  {
    id: 'TK-261031-beef01', project: 'crm-k', client: 'บริษัท เค', system_name: 'CRM ฝ่ายขาย', title: 'อยากได้รายงานยอดขายรายสัปดาห์', status: 'needs_human',
    source: 'line', reporter: 'คุณบี', urgency: 'normal', created_at: ago(1500), updated_at: ago(1490),
    data: { what_happened: 'อยากให้ระบบส่งรายงานยอดขายทุกวันจันทร์', history: hist(['new', 1500], ['needs_human', 1490]),
      runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 8000, at: ago(1495) }],
      spec: { kind: 'change', clear: true, risk: 'medium', summary: 'ขอฟีเจอร์รายงานรายสัปดาห์', repro: '', expected: '', acceptance: [], suspect_files: [], questions: [] } },
  },
];

export const DEMO_TASKS: Task[] = [
  { id: 'MAEWDAM-SEC-01', title: 'เจาะ + QA ความปลอดภัย แมวดำ CRM', status: 'done · รอคุณปันตัดสิน 2 ข้อ', current_owner: 'Fable', next_owner: 'คุณปัน', path: 'handoffs/active/x.md', updated_at: ago(3000) },
  { id: '1INISEKAI-HD2D-04', title: 'Painted nights for the seven HD-2D plates', status: 'in_progress', current_owner: 'Codex (Mac mini)', next_owner: 'Claude Code', path: 'handoffs/active/y.md', updated_at: ago(600) },
  { id: 'KIT-V2-NIGHT-01', title: 'Marketing Warroom OS port', status: 'ready_for_handoff', current_owner: 'Claude Code', next_owner: 'Codex', path: 'handoffs/active/z.md', updated_at: ago(9000) },
];

export const DEMO_RUNS: AgentRun[] = [
  { id: '1', ts: ago(7), job: 'ticket-review-TK-261101-f23bb1', provider: 'claude', ok: true, degraded: false, ms: 10699, attempts: null },
  { id: '2', ts: ago(8), job: 'ticket-fix-TK-261101-f23bb1', provider: 'codex', ok: true, degraded: false, ms: 31193, attempts: null },
  { id: '3', ts: ago(200), job: 'night-scout', provider: 'codex', ok: true, degraded: true, ms: 182000, attempts: 'claude:quota' },
  { id: '4', ts: ago(400), job: 'intel-bot', provider: null, ok: false, degraded: false, ms: 420000, attempts: 'claude:timeout codex:timeout' },
];

export const DEMO_PROJECTS: Project[] = [
  { slug: 'demo-pos', client: 'ร้านตัวอย่าง', name: 'POS หน้าร้าน', line_groups: [{ id: 'C' + 'a'.repeat(32), name: 'ทีม POS ร้านตัวอย่าง' }], emails: ['owner@shop.co.th'], auto_ship: false, has_tests: true },
  { slug: 'crm-k', client: 'บริษัท เค', name: 'CRM ฝ่ายขาย', line_groups: [], emails: ['*@k.co.th'], auto_ship: false, has_tests: false },
];
export const DEMO_DESK: DeskStatus = { at: ago(0.5), line: true, mail: 'not_configured', worker: true, worker_off: false, queue: 1 };
export const DEMO_GROUPS: Record<string, GroupInfo> = {
  ['C' + 'a'.repeat(32)]: { name: 'ทีม POS ร้านตัวอย่าง', joined_at: ago(3000) },
  ['C' + 'b'.repeat(32)]: { name: 'บริษัท เค x คุณปัน', joined_at: ago(30) },
};
