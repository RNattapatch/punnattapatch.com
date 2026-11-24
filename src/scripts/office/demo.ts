// DEV-only fixture for /app/office?demo. It covers chat, baton, handoff, reset and incident states.
import type { OfficeData } from './data';
import type { DepartmentSlug, OfficeFile, OfficeMessage, OfficeTask } from './logic';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const departmentNames: Record<DepartmentSlug, string> = { consult: 'ฝ่ายลูกค้า', class: 'ฝ่ายคลาส', content: 'ฝ่ายคอนเทนต์', tech: 'ฝ่ายเทค' };

const task = (overrides: Partial<OfficeTask> & Pick<OfficeTask, 'id' | 'title'>): OfficeTask => ({
  id: overrides.id,
  no: String(overrides.id).padStart(4, '0'),
  parent_id: null,
  title: overrides.title,
  brief: 'รายละเอียดงานตัวอย่างสำหรับตรวจหน้าออฟฟิศ',
  department: 'consult', room: 'consult', kind: 'chat', priority: 'normal', status: 'todo', source: 'web', result: null,
  review_rounds: 0, grade: null, output_path: null, notify: 'final', handed_to: null, archived_at: null, pending_action: null,
  created_at: ago(180), updated_at: ago(10), done_at: null,
  ...overrides,
});

const message = (overrides: Partial<OfficeMessage> & Pick<OfficeMessage, 'id' | 'room_slug' | 'body'>): OfficeMessage => ({
  id: overrides.id, room_slug: overrides.room_slug, task_id: 101, run_id: null, file_id: null, actor_role: 'head', actor_id: 'head:consult',
  source_machine: 'mini', message_type: 'note', body: overrides.body, payload: {}, created_at: ago(30), ...overrides,
});

const demoFile = (id: number, taskId: number, name: string, size: number): OfficeFile => ({
  id, task_id: taskId, rel_path: `${taskId}/work/${name}`, name, mime: null, size_bytes: size,
  drive_url: name.endsWith('.md') ? 'https://docs.google.com/document/d/demo/edit' : 'https://drive.google.com/file/d/demo/view',
  drive_kind: name.endsWith('.md') ? 'gdoc' : 'file', missing: false, uploaded_at: ago(22), updated_at: ago(22),
});

export const DEMO_OFFICE: OfficeData = {
  departments: (Object.entries(departmentNames) as [DepartmentSlug, string][]).map(([slug, name_th], index) => ({
    slug, name_th, head_model: 'sonnet', monthly_run_cap: index === 0 ? 400 : 300, brief: `${name_th}ดูแลงานตามมาตรฐานของคุณปัน`, active: true, updated_at: ago(10),
  })),
  rooms: [
    ...((Object.entries(departmentNames) as [DepartmentSlug, string][]).map(([slug, title], index) => ({ slug, title, department: slug, kind: 'dept' as const, report_mode: 'head' as const, status: 'open' as const, goal: null, due_date: null, drive_url: null, links: [], folder: null, created_at: ago(900 + index), closed_at: null }))),
    { slug: 'system', title: 'ระบบ', department: 'tech', kind: 'system', report_mode: 'all', status: 'open', goal: null, due_date: null, drive_url: null, links: [], folder: null, created_at: ago(880), closed_at: null },
    { slug: 'tni-ai', title: 'คลาส AI ที่ TNI', department: 'class', kind: 'project', report_mode: 'head', status: 'open', goal: 'เตรียมคลาสและการบ้านทุกสัปดาห์', due_date: null, drive_url: 'https://drive.google.com/drive/folders/demo', links: [], folder: 'clients/tni', created_at: ago(700), closed_at: null },
  ],
  tasks: [
    task({ id: 101, title: 'ร่างขอบเขตระบบตอบลูกค้า', status: 'in_review', priority: 'urgent', updated_at: ago(8), result: { text: 'สรุปขอบเขตและขั้นถัดไปแล้ว' } }),
    task({ id: 102, title: 'แชทที่ส่งต่อแล้ว', status: 'done', handed_to: 103, updated_at: ago(55), done_at: ago(55) }),
    task({ id: 103, title: 'ทำข้อเสนอต่อจากแชทเดิม', status: 'in_progress', updated_at: ago(6) }),
    task({ id: 104, title: 'วางแผนโพสต์สัปดาห์หน้า', department: 'content', room: 'content', status: 'todo', updated_at: ago(16) }),
    task({ id: 105, title: 'ไล่หาสาเหตุเว็บช้า', department: 'tech', room: 'system', status: 'blocked', priority: 'urgent', updated_at: ago(3), result: { error: 'รอข้อมูลเพิ่มจาก monitoring' } }),
    task({ id: 201, title: 'อนุมัติข้อความส่งลูกค้า', kind: 'action', status: 'in_review', result: { speak: 'ข้อความพร้อมให้คุณปันตรวจก่อนส่ง' }, grade: 'good', updated_at: ago(12) }),
  ],
  messages: [
    message({ id: 1, room_slug: 'consult', task_id: 101, actor_role: 'owner', actor_id: 'pun', source_machine: 'web', body: 'ช่วยสรุปขอบเขตระบบตอบลูกค้าให้หน่อยครับ', created_at: ago(90) }),
    message({ id: 2, room_slug: 'consult', task_id: 101, actor_role: 'head', message_type: 'progress', body: 'รับเรื่องแล้ว ผมจะแยกให้ลูกน้องตรวจเงื่อนไขและเรียบเรียงครับ', created_at: ago(82) }),
    message({ id: 3, room_slug: 'consult', task_id: 101, actor_role: 'worker', actor_id: 'codex', message_type: 'progress', body: 'กำลังตรวจเงื่อนไขจาก Pricing SSOT', created_at: ago(70) }),
    message({ id: 4, room_slug: 'consult', task_id: 101, actor_role: 'worker', actor_id: 'codex', message_type: 'result', body: 'ตรวจราคาและข้อจำกัดครบแล้ว', file_id: 1, created_at: ago(45) }),
    message({ id: 5, room_slug: 'consult', task_id: 101, actor_role: 'system', actor_id: 'office', message_type: 'context_reset', body: 'เริ่มบริบทใหม่', created_at: ago(38) }),
    message({ id: 6, room_slug: 'consult', task_id: 101, actor_role: 'head', message_type: 'result', body: 'สรุปขอบเขตและขั้นถัดไปไว้ในเอกสารแล้วครับ', created_at: ago(8) }),
    message({ id: 7, room_slug: 'consult', task_id: 102, actor_role: 'head', message_type: 'handoff', body: 'ส่งบริบทไปแชทใหม่แล้ว', payload: { handed_to: 103 }, created_at: ago(55) }),
    message({ id: 8, room_slug: 'consult', task_id: 103, actor_role: 'head', message_type: 'handoff', body: 'รับบริบทต่อจากแชท 0102', payload: { from_task: 102 }, created_at: ago(54) }),
    message({ id: 9, room_slug: 'content', task_id: 104, actor_role: 'owner', actor_id: 'pun', source_machine: 'telegram', body: 'วางแผนโพสต์สัปดาห์หน้าให้หน่อย', created_at: ago(16) }),
    message({ id: 10, room_slug: 'system', task_id: 105, actor_role: 'owner', actor_id: 'pun', source_machine: 'web', message_type: 'alert', body: 'หน้าเว็บโหลดช้ากว่าปกติ', payload: { alert_id: 1 }, created_at: ago(4) }),
  ],
  alerts: [
    { id: 1, level: 'urgent', title: 'หน้าเว็บโหลดช้า', detail: 'พบเวลาตอบสนองสูงกว่าปกติจากมือถือ', source: 'pun:web', status: 'notified', calls: 0, last_call_at: null, created_at: ago(4), updated_at: ago(4) },
    { id: 2, level: 'info', title: 'สำรองข้อมูลเรียบร้อย', detail: null, source: 'backup', status: 'acked', calls: 0, last_call_at: null, created_at: ago(500), updated_at: ago(480) },
  ],
  runs: [
    { id: 1, task_id: 101, department: 'consult', role: 'head_chat', provider: 'claude', model: 'sonnet', ok: true, ms: 55_000, input_tokens: 121_000, cached_tokens: 35_000, output_tokens: 2_400, started_at: ago(9), ended_at: ago(8) },
    ...Array.from({ length: 14 }, (_, index) => ({ id: index + 20, task_id: null, department: 'consult' as const, role: 'worker', input_tokens: 1000, cached_tokens: 0, output_tokens: 200, started_at: ago(index * 20), ok: true })),
  ],
  rubrics: [
    { key: 'client-message', title_th: 'ข้อความถึงลูกค้า', criteria: ['มีขั้นตัดสินใจถัดไป', 'บอกคนทำและวันให้ชัด'], gates: ['scan-marks'], set_by: 'head', pun_reviewed: false, updated_at: ago(300) },
    { key: 'code', title_th: 'โค้ดและระบบ', criteria: ['เทสต์ผ่าน', 'แก้เฉพาะไฟล์ในขอบเขต'], gates: [], set_by: 'head', pun_reviewed: true, updated_at: ago(280) },
  ],
  grades: [{ id: 1, task_id: 201, grader: 'head', level: 'good', reasons: ['ตรงกับบรีฟ'], created_at: ago(12) }],
  files: [demoFile(1, 101, 'customer-scope.md', 5680), demoFile(2, 201, 'message-preview.pdf', 224_000)],
  sends: [{ id: 1, file_id: 1, channel: 'telegram', status: 'sent', error: null, share_expires_at: null, created_at: ago(7), sent_at: ago(7) }],
  desk: { at: ago(1), worker: 'office-desk:demo', off: false, agent_id: 'demo-agent', whatsapp: true, phone: true, quiet: false },
  quiet: { until: null },
};
