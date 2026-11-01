/**
 * Ticket Center — rules that must not drift: status buckets · sort · agent timeline · allowed actions (= applyAction on the mini) · owners · groups
 * Usage: node tests/ticket-center-logic.test.mjs
 */
import {
  statusMeta, filterTickets, countBy, timeline, fmtMs, stuckMinutes, allowed, checkNote, deskHealth, ownerOf, groupTasks, groupRows, isGroupId, jobLabel, STATUS_META,
} from '../src/scripts/tickets/logic.ts';

let pass = 0, fail = 0;
const check = (c, m) => { c ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const T = (over = {}) => ({
  id: 'TK-261101-aaaaaa', project: 'demo', client: 'ร้าน', system_name: 'POS', title: 'ยอดติดลบ', status: 'new', source: 'line',
  reporter: 'มิ้น', urgency: 'normal', created_at: '2026-11-01T06:00:00Z', updated_at: '2026-11-01T06:00:00Z', data: {}, ...over,
});

console.log('สถานะ + มุมมอง');
check(statusMeta('awaiting_approval').bucket === 'decide' && statusMeta('fix_failed').bucket === 'decide', 'รออนุมัติ/แก้ไม่สำเร็จ = ต้องตัดสิน');
check(statusMeta('needs_info').bucket === 'client' && statusMeta('closed').bucket === 'done', 'รอลูกค้า · ปิดแล้ว');
check(statusMeta('weird').label === 'weird', 'สถานะไม่รู้จักไม่พัง');
const list = [
  T({ id: 'a', status: 'shipped', updated_at: '2026-11-01T09:00:00Z' }),
  T({ id: 'b', status: 'awaiting_approval', updated_at: '2026-11-01T07:00:00Z' }),
  T({ id: 'c', status: 'fixing', urgency: 'urgent', updated_at: '2026-11-01T06:30:00Z' }),
  T({ id: 'd', status: 'fixing', updated_at: '2026-11-01T08:00:00Z', title: 'พิมพ์ใบเสร็จไม่ออก' }),
];
check(filterTickets(list, 'all').map((t) => t.id).join('') === 'bcda', 'ต้องตัดสินขึ้นก่อน แล้วด่วน แล้วล่าสุด');
check(filterTickets(list, 'working').length === 2, 'มุมเครื่องกำลังทำ');
check(filterTickets(list, 'all', 'ใบเสร็จ').map((t) => t.id).join('') === 'd', 'ค้นหัวข้อ');
check(countBy(list).decide === 1 && countBy(list).working === 2, 'นับต่อมุม');

console.log('เส้นทาง agent');
const shipped = T({ status: 'shipped', data: {
  history: ['new', 'triaging', 'fixing', 'review', 'awaiting_approval', 'approved', 'shipping', 'shipped'].map((s) => ({ at: 'x', status: s })),
  runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 12600, at: 'x' }, { stage: 'fix', provider: 'codex', ok: true, ms: 31200, at: 'x' },
    { stage: 'tests', provider: 'sandbox', ok: true, ms: 900, at: 'x' }, { stage: 'review', provider: 'claude', ok: true, ms: 10700, at: 'x' },
    { stage: 'ship', provider: 'ship_cmd', ok: true, ms: 130, at: 'x' }], tests: { ok: true, tail: '' } } });
const st = timeline(shipped);
check(st.every((s) => s.state === 'done'), 'ขึ้นระบบแล้ว = ทุกขั้นเสร็จ');
check(st[1].who === 'Claude' && st[2].who === 'Codex' && st[2].ms === 31200, 'บอกว่าใครทำขั้นไหน นานเท่าไร');
const fixing = timeline(T({ status: 'fixing', data: { history: [{ at: 'x', status: 'triaging' }, { at: 'x', status: 'fixing' }], runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 1, at: 'x' }] } }));
check(fixing[2].state === 'now' && fixing[1].state === 'done' && fixing[5].state === 'todo', 'กำลังแก้ = ขั้นแก้ "now"');
const info = timeline(T({ status: 'needs_info', data: { history: [{ at: 'x', status: 'needs_info' }], runs: [{ stage: 'triage', provider: 'claude', ok: true, ms: 1, at: 'x' }] } }));
check(info.slice(2).every((s) => s.state === 'skip'), 'รอลูกค้า = ขั้นหลังคัดแยกถูกข้าม');
const failed = timeline(T({ status: 'fix_failed', data: { runs: [{ stage: 'fix', provider: 'codex', ok: true, ms: 1, at: 'x' }, { stage: 'tests', provider: 'sandbox', ok: false, ms: 1, at: 'x' }], tests: { ok: false, tail: '' } } }));
check(failed[3].state === 'fail', 'เทสต์ไม่ผ่านขึ้นแดง');
check(fmtMs(31200) === '31 วิ' && fmtMs(125000) === '2 นาที 5 วิ' && fmtMs(null) === '', 'แสดงเวลา');
check(stuckMinutes(T({ status: 'fixing', updated_at: '2026-11-01T06:00:00Z' }), Date.parse('2026-11-01T07:00:00Z')) === 60, 'ค้าง 60 นาที = เตือน');
check(stuckMinutes(T({ status: 'awaiting_approval', updated_at: '2026-11-01T06:00:00Z' }), Date.parse('2026-11-02T07:00:00Z')) === null, 'รออนุมัติไม่นับว่าค้าง');

console.log('ปุ่มคำสั่ง (ต้องตรงกับ applyAction บนมินิ)');
check(allowed(T({ status: 'awaiting_approval' })).join() === 'approve,decline,rerun,close', 'รออนุมัติ');
check(allowed(T({ status: 'fixing' })).length === 0, 'เครื่องกำลังทำ = ไม่มีปุ่ม');
check(allowed(T({ status: 'fix_failed' })).join() === 'rerun,close', 'แก้ไม่สำเร็จ = ทำใหม่/ปิด');
check(allowed(T({ status: 'closed' })).join() === 'rerun', 'ปิดแล้วเปิดใหม่ได้');
check(checkNote('', 'rerun') !== null && checkNote('ดู pos.mjs', 'rerun') === null && checkNote('', 'approve') === null, 'สั่งทำใหม่ต้องบอกเครื่องว่าต่างจากเดิมยังไง');
check(checkNote('x'.repeat(2001), 'close') !== null, 'โน้ตยาวเกินถูกกัน (DB CHECK 2,000)');

console.log('มินิ · งานส่งต่อ · กลุ่ม');
const now = Date.parse('2026-11-01T07:00:00Z');
check(deskHealth({ at: '2026-11-01T06:59:00Z', worker: true, worker_off: false, queue: 2 }, now).ok, 'มินิปกติ');
check(!deskHealth({ at: '2026-11-01T06:50:00Z', worker: true, worker_off: false, queue: 0 }, now).ok, 'เงียบเกิน 3 นาที = เตือน');
check(!deskHealth({ at: '2026-11-01T06:59:00Z', worker: false, worker_off: false, queue: 0 }, now).ok && !deskHealth(null, now).ok, 'worker ตาย/ไม่มีข้อมูล = เตือน');
check(ownerOf('Codex (Mac mini)') === 'codex' && ownerOf('คุณปัน (ตัดสิน)') === 'pun' && ownerOf('Claude Code') === 'claude' && ownerOf('Antigravity') === 'other', 'จัด Next Owner');
const g = groupTasks([{ id: '1', status: 'done', next_owner: 'Codex' }, { id: '2', status: 'in_progress', next_owner: 'Codex' }, { id: '3', status: null, next_owner: null }]);
check(g.codex.length === 1 && g.other.length === 1, 'งานที่ done ไม่ขึ้น');
check(groupTasks([{ id: '4', status: 'done · รอคุณปันตัดสิน 2 ข้อ', next_owner: 'คุณปัน' }]).pun.length === 1, 'done แต่ยังรอคุณปัน = ยังเปิดอยู่');
const gid = 'C' + 'a'.repeat(32);
const rows = groupRows({ [gid]: { name: 'ทีม POS', joined_at: '2026-11-01' }, ['C' + 'b'.repeat(32)]: { name: 'ออกแล้ว', left_at: 'x' }, ['C' + 'c'.repeat(32)]: { name: 'ใหม่', joined_at: '2026-11-02' } },
  [{ slug: 'demo', line_groups: [{ id: gid, name: null }] }]);
check(rows.length === 2 && rows[0].name === 'ใหม่' && rows[1].project === 'demo', 'กลุ่มยังไม่ผูกขึ้นก่อน · กลุ่มที่บอทออกแล้วซ่อน');
check(isGroupId(gid) && !isGroupId('C123') && !isGroupId("C'; drop"), 'group id ต้องรูปแบบ LINE');
check(jobLabel('ticket-fix-TK-261101-aaaaaa') === 'ticket แก้ TK-261101-aaaaaa' && jobLabel('night-scout') === 'night-scout', 'ชื่องาน agent');
check(Object.keys(STATUS_META).length === 14, 'ครบทุกสถานะของ worker');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
