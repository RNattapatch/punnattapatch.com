/**
 * AI Office board — pure rules for /app/office.
 * Usage: node tests/office-board-logic.test.mjs
 */
import {
  ALERT_LEVEL_META,
  ALERT_STATUS_LABEL,
  GRADE_LABEL,
  SOURCE_LABEL,
  TASK_VIEWS,
  bangkokMonthStartIso,
  filesForTask,
  fileKind,
  fmtBytes,
  hasPendingSend,
  isSendBusy,
  latestSends,
  sendStatusText,
  firstPassGoodByDepartment,
  filterTasks,
  groupTasks,
  heartbeatHealth,
  isQuietActive,
  officeCounts,
  openTaskCountByDepartment,
  roomDueText,
  runCountsByDepartment,
  statusMeta,
} from '../src/scripts/office/logic.ts';

let pass = 0;
let fail = 0;
const check = (condition, message) => {
  if (condition) { pass += 1; console.log(`  ✅ ${message}`); }
  else { fail += 1; console.log(`  ❌ ${message}`); }
};

const task = (overrides = {}) => ({
  id: 1,
  no: '0001',
  parent_id: null,
  title: 'งานตัวอย่าง',
  brief: 'รายละเอียดงาน',
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
  created_at: '2026-11-01T00:00:00.000Z',
  updated_at: '2026-11-01T00:00:00.000Z',
  done_at: null,
  ...overrides,
});

console.log('ป้ายและตัวกรอง');
check(statusMeta('todo').label === 'รอคิว' && statusMeta('in_progress').label === 'กำลังทำ', 'ป้ายงานที่กำลังเดิน');
check(statusMeta('in_review').label === 'รอคุณปัน' && statusMeta('done').label === 'เสร็จ', 'ป้ายรอตรวจและเสร็จ');
check(statusMeta('blocked').label === 'ติด' && statusMeta('cancelled').label === 'ยกเลิก', 'ป้ายติดและยกเลิก');
check(statusMeta('unexpected').label === 'unexpected', 'สถานะไม่รู้จักไม่ทำให้หน้าพัง');
check(GRADE_LABEL.good === 'ดี' && GRADE_LABEL.fair === 'พอใช้' && GRADE_LABEL.redo === 'ปรับปรุง', 'ป้ายเกรดไทย');
check(SOURCE_LABEL.voice === 'โทร' && SOURCE_LABEL.telegram === 'Telegram' && SOURCE_LABEL.web === 'เว็บ' && SOURCE_LABEL.system === 'ระบบ', 'ป้ายแหล่งงาน');
check(ALERT_LEVEL_META.critical.label === 'วิกฤต' && ALERT_STATUS_LABEL.calling === 'กำลังโทร', 'ป้ายเหตุด่วนไทย');
check(TASK_VIEWS.map((view) => view.label).join(',') === 'ทั้งหมด,รอคุณปัน,กำลังทำ,เสร็จ,ติด/ยกเลิก', 'ตัวกรองครบตามหน้า');
const viewTasks = [
  task({ id: 1, status: 'done' }),
  task({ id: 2, status: 'in_review' }),
  task({ id: 3, status: 'in_progress' }),
  task({ id: 4, status: 'todo' }),
  task({ id: 5, status: 'blocked' }),
  task({ id: 6, status: 'cancelled' }),
];
check(filterTasks(viewTasks, 'review').map((item) => item.id).join() === '2', 'กรองรอคุณปัน');
check(filterTasks(viewTasks, 'working').map((item) => item.id).join() === '3,4', 'กรอง todo + in_progress เป็นกำลังทำ');
check(filterTasks(viewTasks, 'stopped').map((item) => item.id).join() === '5,6', 'กรองติด/ยกเลิก');

console.log('งานแม่ลูกและตัวเลขภาพรวม');
const nested = groupTasks([
  task({ id: 12, parent_id: 10, title: 'ลูกสอง', created_at: '2026-11-03T00:00:00Z' }),
  task({ id: 99, parent_id: 404, title: 'ลูกกำพร้า', created_at: '2026-11-04T00:00:00Z' }),
  task({ id: 10, title: 'งานแม่', created_at: '2026-11-01T00:00:00Z' }),
  task({ id: 11, parent_id: 10, title: 'ลูกหนึ่ง', created_at: '2026-11-02T00:00:00Z' }),
]);
check(nested.length === 2 && nested[0].task.id === 99 && nested[1].task.id === 10, 'งานแม่และลูกกำพร้าเป็นแถวหลัก เรียงล่าสุดก่อน');
check(nested[1].children.map((item) => item.id).join() === '12,11', 'ลูกซ้อนใต้แม่แม้ข้อมูลลูกมาก่อนแม่');
const counts = officeCounts(viewTasks, [
  { status: 'new' }, { status: 'notified' }, { status: 'calling' }, { status: 'acked' },
]);
check(counts.review === 1 && counts.working === 2 && counts.openAlerts === 3, 'นับรอคุณปัน กำลังทำ และเหตุด่วนเปิด');
const deptOpen = openTaskCountByDepartment([
  task({ id: 1, department: 'consult', status: 'todo' }),
  task({ id: 2, department: 'consult', status: 'done' }),
  task({ id: 3, department: 'tech', status: 'blocked' }),
  task({ id: 4, department: null, status: 'in_review' }),
]);
check(deptOpen.consult === 1 && deptOpen.tech === 1 && !('null' in deptOpen), 'นับงานเปิดต่อฝ่าย ไม่รวมเสร็จและงานไร้ฝ่าย');

console.log('ผลงานเดือนนี้ตามเวลาไทย');
const monthNow = Date.parse('2026-11-20T05:00:00.000Z');
check(bangkokMonthStartIso(monthNow) === '2026-10-31T17:00:00.000Z', 'ต้นเดือนกรุงเทพแปลงเป็น UTC สำหรับ query ถูกต้อง');
const graded = [
  task({ id: 1, department: 'consult', grade: 'good', review_rounds: 0, updated_at: '2026-10-31T17:00:00.000Z' }), // 1 พ.ย. กรุงเทพ
  task({ id: 2, department: 'consult', grade: 'good', review_rounds: 1, updated_at: '2026-11-05T00:00:00.000Z' }),
  task({ id: 3, department: 'consult', grade: 'fair', review_rounds: 0, updated_at: '2026-11-06T00:00:00.000Z' }),
  task({ id: 4, department: 'consult', grade: null, review_rounds: 0, updated_at: '2026-11-07T00:00:00.000Z' }),
  task({ id: 5, department: 'consult', kind: 'research', grade: 'good', review_rounds: 0, updated_at: '2026-11-08T00:00:00.000Z' }),
  task({ id: 6, department: 'tech', grade: 'good', review_rounds: 0, updated_at: '2026-10-31T16:59:59.000Z' }), // ต.ค. กรุงเทพ
];
const quality = firstPassGoodByDepartment(graded, monthNow);
check(quality.consult.total === 3 && quality.consult.good === 1 && quality.consult.percent === 33, 'ดีรอบแรก 1 จาก 3 = 33% และตัดเดือนด้วยกรุงเทพ');
check(quality.tech.total === 0 && quality.tech.percent === null, 'ไม่มีงานที่มีเกรดเดือนนี้ = ยังไม่มีเปอร์เซ็นต์');
const runCounts = runCountsByDepartment([
  { department: 'consult', started_at: '2026-10-31T17:00:00.000Z' },
  { department: 'consult', started_at: '2026-11-30T16:59:59.000Z' },
  { department: 'consult', started_at: '2026-11-30T17:00:00.000Z' },
  { department: 'tech', started_at: '2026-10-31T16:59:59.000Z' },
  { department: null, started_at: '2026-11-02T00:00:00.000Z' },
], monthNow);
check(runCounts.consult === 2 && !runCounts.tech && !('null' in runCounts), 'นับ run เฉพาะฝ่ายและเดือนกรุงเทพเดียวกัน');

console.log('desk ห้อง และห้ามรบกวน');
const healthNow = Date.parse('2026-11-20T05:00:00.000Z');
check(heartbeatHealth({ at: '2026-11-20T04:58:00.000Z' }, healthNow).state === 'normal', 'heartbeat อายุ 2 นาที = ปกติ');
check(heartbeatHealth({ at: '2026-11-20T04:57:59.000Z' }, healthNow).state === 'slow', 'heartbeat เกิน 2 นาที = ช้า');
check(heartbeatHealth({ at: '2026-11-20T04:50:00.000Z' }, healthNow).state === 'slow', 'heartbeat อายุ 10 นาทียังช้า');
check(heartbeatHealth({ at: '2026-11-20T04:49:59.000Z' }, healthNow).state === 'stopped', 'heartbeat เกิน 10 นาที = หยุด');
check(heartbeatHealth(null, healthNow).state === 'stopped', 'ไม่มี heartbeat = หยุด');
check(roomDueText('2026-11-20', healthNow) === 'เหลือ 0 วัน', 'วันส่งวันนี้');
check(roomDueText('2026-11-23', healthNow) === 'เหลือ 3 วัน', 'วันส่งในอนาคต');
check(roomDueText('2026-11-18', healthNow) === 'เลยกำหนด 2 วัน', 'วันส่งเลยกำหนด');
check(roomDueText(null, healthNow) === '', 'ห้องไม่มีวันส่งไม่แสดงข้อความ');
check(isQuietActive({ until: '2026-11-20T05:00:01.000Z' }, healthNow), 'ห้ามรบกวนที่ยังไม่หมดเวลาเปิดอยู่');
check(!isQuietActive({ until: '2026-11-20T05:00:00.000Z' }, healthNow) && !isQuietActive(null, healthNow), 'หมดเวลาแล้วหรือไม่มีข้อมูล = ปิด');

console.log('ไฟล์และปุ่มส่ง');
const file = (overrides = {}) => ({ id: 1, task_id: 5, rel_path: '0004/1-tni/a.md', name: 'a.md', mime: 'text/markdown', size_bytes: 10, drive_url: 'https://docs.google.com/document/d/x/edit', drive_kind: 'gdoc', missing: false, uploaded_at: '2026-11-20T05:00:00.000Z', updated_at: '2026-11-20T05:00:00.000Z', ...overrides });
check(fmtBytes(512) === '512 B' && fmtBytes(1536) === '1.5 KB' && fmtBytes(52428800) === '50 MB', 'ขนาดไฟล์อ่านง่าย');
check(fileKind('x.md').label === 'เอกสาร' && fileKind('deck.pptx').label === 'สไลด์' && fileKind('a.PDF').label === 'PDF' && fileKind('pic.jpg').label === 'รูป' && fileKind('x.bin').label === 'ไฟล์', 'ชนิดไฟล์เป็นภาษาไทย');
const files = [file({ id: 2, rel_path: '0004/1-tni/b.md' }), file({ id: 1 }), file({ id: 3, missing: true }), file({ id: 4, task_id: 6 })];
check(filesForTask(files, 5).map((f) => f.id).join(',') === '1,2', 'ไฟล์ของงาน เรียงตาม path ไม่เอาไฟล์ที่หาย');
const sends = [
  { id: 1, file_id: 1, channel: 'line', status: 'failed', error: 'x', share_expires_at: null, created_at: '2026-11-20T05:00:00.000Z', sent_at: null },
  { id: 2, file_id: 1, channel: 'line', status: 'sent', error: null, share_expires_at: '2026-11-27T05:00:00.000Z', created_at: '2026-11-20T05:01:00.000Z', sent_at: '2026-11-20T05:01:10.000Z' },
  { id: 3, file_id: 1, channel: 'telegram', status: 'queued', error: null, share_expires_at: null, created_at: '2026-11-20T05:02:00.000Z', sent_at: null },
];
const latest = latestSends(sends);
check(latest.get('1:line').id === 2 && latest.get('1:telegram').id === 3 && !latest.has('2:line'), 'สถานะล่าสุดต่อไฟล์ต่อช่องทาง');
const sendNow = Date.parse('2026-11-20T05:03:00.000Z');
check(sendStatusText(latest.get('1:line'), sendNow).includes('ลูกค้าเปิดได้ถึง 27 พ.ย.'), 'LINE ส่งแล้วบอกวันหมดอายุลิงก์');
check(sendStatusText(latest.get('1:telegram'), sendNow) === 'รอส่ง', 'รอคิว');
check(sendStatusText({ ...sends[0], error: 'ไฟล์ใหญ่เกิน 50MB เปิดจาก Drive แทน' }, sendNow) === 'ส่งไม่สำเร็จ: ไฟล์ใหญ่เกิน 50MB เปิดจาก Drive แทน', 'ส่งไม่สำเร็จบอกเหตุ');
check(sendStatusText({ ...sends[1], share_expires_at: '2026-11-20T05:00:00.000Z' }, sendNow).includes('ลิงก์หมดอายุแล้ว'), 'ลิงก์ที่หมดอายุแล้ว');
check(hasPendingSend(sends, sendNow) && !hasPendingSend(sends.slice(0, 2), sendNow), 'มีงานรอส่ง = ต้องดึงสถานะถี่ขึ้น');
const staleNow = Date.parse('2026-11-20T05:04:01.000Z');
check(!isSendBusy(sends[2], staleNow) && !hasPendingSend(sends, staleNow), 'คิวค้างเกิน 2 นาที = ปลดปุ่ม เลิกดึงถี่');
check(sendStatusText(sends[2], staleNow).includes('desk อาจหยุดอยู่'), 'คิวค้างบอกว่า desk อาจหยุด');
check(isSendBusy({ status: 'sending', created_at: '2026-11-20T00:00:00.000Z' }, staleNow), 'กำลังส่งยังล็อกปุ่มแม้นาน');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
