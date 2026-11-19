// DEV ONLY fixture for `astro dev` + /app/office?demo.
import type { OfficeData } from './data';
import type { DepartmentSlug, OfficeTask } from './logic';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const due = (days: number) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const task = (overrides: Partial<OfficeTask> & Pick<OfficeTask, 'id' | 'no' | 'title'>): OfficeTask => ({
  id: overrides.id,
  no: overrides.no,
  parent_id: null,
  title: overrides.title,
  brief: 'รายละเอียดงานตัวอย่างสำหรับดูโครงหน้า AI Office บนมือถือและคอมพิวเตอร์',
  department: 'consult',
  room: null,
  kind: 'work',
  priority: 'normal',
  status: 'todo',
  source: 'web',
  result: null,
  review_rounds: 0,
  grade: null,
  output_path: null,
  created_at: ago(120),
  updated_at: ago(120),
  done_at: null,
  ...overrides,
});

export const DEMO_OFFICE: OfficeData = {
  departments: ([
    ['consult', 'ฝ่ายลูกค้า', 400],
    ['class', 'ฝ่ายคลาส', 300],
    ['content', 'ฝ่ายคอนเทนต์', 450],
    ['tech', 'ฝ่ายเทค', 400],
  ] as [DepartmentSlug, string, number][]).map(([slug, name_th, monthly_run_cap]) => ({
    slug, name_th, monthly_run_cap, head_model: 'sonnet', active: true,
    brief: `${name_th}ดูแลงานตามมาตรฐานของคุณปัน โดย Claude วางแผนและตรวจ Codex ลงมือ`, updated_at: ago(30),
  })),
  tasks: [
    task({ id: 108, no: '0108', title: 'เตรียมข้อเสนอระบบตอบลูกค้า', department: 'consult', room: 'client-response', status: 'in_review', source: 'voice', priority: 'urgent', updated_at: ago(12), brief: 'สรุปขอบเขตงาน เงื่อนไข และขั้นถัดไปให้ลูกค้าอ่านแล้วตัดสินใจได้', grade: 'fair', review_rounds: 1, output_path: 'clients/example/proposals/customer-response.md', result: { speak: 'ร่างข้อเสนอพร้อมให้คุณปันตรวจแล้วค่ะ', text: 'จัดโครงข้อเสนอและตรวจเงื่อนไขหลักครบแล้ว เหลือยืนยันวันเริ่มงาน', next_step: 'คุณปันตรวจวันเริ่มงานก่อนส่งลูกค้า', sources: ['docs/PRICING-SSOT.md', 'clients/example/BRIEF.md'] } }),
    task({ id: 109, no: '0109', parent_id: 108, title: 'ตรวจเงื่อนไขจาก Pricing SSOT', department: 'consult', room: 'client-response', status: 'done', source: 'system', updated_at: ago(28), done_at: ago(28), grade: 'good', review_rounds: 0, result: { text: 'เงื่อนไขตรงกับ SSOT', sources: ['docs/PRICING-SSOT.md'] } }),
    task({ id: 110, no: '0110', parent_id: 108, title: 'เรียบเรียงข้อความส่งลูกค้า', department: 'consult', room: 'client-response', status: 'done', source: 'telegram', updated_at: ago(20), done_at: ago(20), grade: 'good', review_rounds: 0, result: { text: 'ข้อความพร้อมใช้และมีวันตัดสินใจถัดไป', next_step: 'รวมเข้าร่างงานแม่' } }),
    task({ id: 111, no: '0111', title: 'ทำภาพโปรโมตคลาสเดือนหน้า', department: 'content', room: 'public-class', status: 'in_progress', source: 'telegram', updated_at: ago(4), brief: 'ทำภาพโปรโมตที่อ่านได้ทันทีบนหน้าจอมือถือและใช้คำว่า คลาส', result: { text: 'กำลังประกอบภาพรอบแรก' } }),
    task({ id: 112, no: '0112', title: 'ตรวจหน้าเช็กอินผู้เรียน', department: 'tech', room: 'public-class', status: 'todo', source: 'web', updated_at: ago(40), brief: 'ตรวจ flow บน iPhone และสรุปจุดที่ต้องแก้ก่อนวันคลาส' }),
    task({ id: 113, no: '0113', title: 'สรุปฟีดแบ็กคลาสล่าสุด', department: 'class', status: 'done', source: 'system', updated_at: ago(1440), done_at: ago(1440), grade: 'good', review_rounds: 0, result: { speak: 'สรุปฟีดแบ็กเสร็จแล้วค่ะ', text: 'ผู้เรียนต้องการตัวอย่างงานจริงเพิ่มในช่วงฝึก', next_step: 'เพิ่มตัวอย่างใน outline รอบหน้า', sources: ['material/training/feedback.md'] } }),
    task({ id: 114, no: '0114', title: 'เชื่อมข้อมูลจากแบบฟอร์ม', department: 'tech', status: 'blocked', source: 'system', updated_at: ago(90), brief: 'รอสิทธิ์อ่านแบบฟอร์มจากบัญชีเจ้าของ' }),
  ],
  rooms: [
    { slug: 'client-response', title: 'ระบบตอบลูกค้าบริษัทตัวอย่าง', department: 'consult', status: 'open', goal: 'ส่งข้อเสนอที่ลูกค้าอ่านแล้วตัดสินใจได้', due_date: due(3), drive_url: 'https://drive.google.com/drive/folders/demo-client', links: [{ label: 'Brief ลูกค้า', url: 'https://example.com/client-brief' }], folder: 'office/rooms/client-response', created_at: ago(9000), closed_at: null },
    { slug: 'public-class', title: 'คลาสสาธารณะเดือนหน้า', department: 'class', status: 'open', goal: 'เปิดรับสมัครและเตรียมระบบหน้าคลาสให้พร้อม', due_date: due(10), drive_url: 'https://drive.google.com/drive/folders/demo-class', links: [{ label: 'หน้ารับสมัคร', url: 'https://example.com/class' }], folder: 'office/rooms/public-class', created_at: ago(5000), closed_at: null },
    { slug: 'old-campaign', title: 'แคมเปญที่ส่งมอบแล้ว', department: 'content', status: 'closed', goal: 'เก็บเป็นตัวอย่าง', due_date: due(-12), drive_url: null, links: [], folder: 'office/rooms/old-campaign', created_at: ago(30000), closed_at: ago(16000) },
  ],
  alerts: [
    { id: 21, level: 'critical', title: 'ระบบตอบลูกค้าหยุดทำงาน', detail: 'watchdog ไม่เห็น heartbeat ต่อเนื่อง ต้องตรวจ worker บนมินิ', source: 'watchdog', status: 'calling', calls: 1, last_call_at: ago(2), created_at: ago(8), updated_at: ago(2) },
    { id: 22, level: 'urgent', title: 'งานครบกำหนดวันนี้', detail: 'ข้อเสนอระบบตอบลูกค้ายังรอคุณปันตรวจ', source: 'office-desk', status: 'notified', calls: 0, last_call_at: null, created_at: ago(20), updated_at: ago(18) },
    { id: 20, level: 'info', title: 'งานสรุปฟีดแบ็กเสร็จ', detail: null, source: 'office-desk', status: 'acked', calls: 0, last_call_at: null, created_at: ago(1440), updated_at: ago(1400) },
  ],
  runs: [
    ...Array.from({ length: 28 }, (_, id) => ({ id, department: 'consult' as const, role: 'worker', started_at: ago(id * 60), ok: true })),
    ...Array.from({ length: 19 }, (_, id) => ({ id: id + 100, department: 'class' as const, role: 'head_grade', started_at: ago(id * 90), ok: true })),
    ...Array.from({ length: 42 }, (_, id) => ({ id: id + 200, department: 'content' as const, role: 'worker', started_at: ago(id * 45), ok: true })),
    ...Array.from({ length: 35 }, (_, id) => ({ id: id + 300, department: 'tech' as const, role: 'worker', started_at: ago(id * 70), ok: true })),
  ],
  rubrics: [
    { key: 'research', title_th: 'สรุปข้อมูลภายใน', criteria: ['ประโยคแรกตอบคำถามตรงๆ', 'ทุกข้อเท็จจริงมีไฟล์ที่มา', 'หาไม่เจอให้บอกตรงๆ'], gates: [], set_by: 'head', pun_reviewed: false, updated_at: ago(3000) },
    { key: 'client-message', title_th: 'ข้อความถึงลูกค้า', criteria: ['มีการตัดสินใจถัดไปพร้อมวัน', 'ทุกประโยคมีคนทำอะไรกับอะไร', 'ใช้คำว่า ลูกค้า ไม่ใช่ ลีด'], gates: ['scan-marks'], set_by: 'head', pun_reviewed: false, updated_at: ago(2600) },
    { key: 'code', title_th: 'โค้ดและระบบ', criteria: ['เทสต์ที่ระบุในงานผ่าน', 'แก้เฉพาะไฟล์ในขอบเขตงาน', 'ไม่มีความลับในโค้ด'], gates: [], set_by: 'head', pun_reviewed: false, updated_at: ago(2200) },
  ],
  grades: [
    { id: 1, task_id: 108, grader: 'head', level: 'redo', reasons: ['ยังไม่มีวันเริ่มงาน'], created_at: ago(80) },
    { id: 2, task_id: 108, grader: 'head', level: 'fair', reasons: ['แก้เงื่อนไขแล้ว เหลือยืนยันวันเริ่ม'], created_at: ago(14) },
    { id: 3, task_id: 109, grader: 'head', level: 'good', reasons: ['ตรงกับ SSOT'], created_at: ago(28) },
    { id: 4, task_id: 110, grader: 'head', level: 'good', reasons: ['ข้อความมีขั้นถัดไปชัด'], created_at: ago(20) },
    { id: 5, task_id: 113, grader: 'pun', level: 'good', reasons: ['สรุปตรงประเด็น'], created_at: ago(1400) },
  ],
  desk: { at: ago(1), worker: 'office-desk:demo', off: false, agent_id: 'demo-agent', whatsapp: true, phone: false, quiet: true },
  quiet: { until: new Date(Date.now() + 45 * 60_000).toISOString() },
};
