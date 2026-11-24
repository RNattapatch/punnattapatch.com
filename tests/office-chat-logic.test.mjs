import assert from 'node:assert/strict';
import test from 'node:test';
import * as logic from '../src/scripts/office/logic.ts';

const message = (overrides = {}) => ({
  id: 1,
  room_slug: 'consult',
  task_id: 10,
  run_id: null,
  file_id: null,
  actor_role: 'head',
  actor_id: 'head:consult',
  source_machine: 'mini',
  message_type: 'note',
  body: 'ข้อความ',
  payload: {},
  created_at: '2026-11-24T09:00:00.000Z',
  ...overrides,
});

const task = (overrides = {}) => ({
  id: 10,
  no: '0010',
  parent_id: null,
  title: 'แชททดสอบ',
  brief: 'รายละเอียด',
  department: 'consult',
  room: 'consult',
  kind: 'chat',
  priority: 'normal',
  status: 'todo',
  source: 'web',
  result: null,
  review_rounds: 0,
  grade: null,
  output_path: null,
  notify: 'final',
  handed_to: null,
  archived_at: null,
  pending_action: null,
  created_at: '2026-11-24T08:00:00.000Z',
  updated_at: '2026-11-24T09:00:00.000Z',
  done_at: null,
  ...overrides,
});

test('groupConsecutiveMessages groups only adjacent messages from the same actor and task', () => {
  const groups = logic.groupConsecutiveMessages([
    message({ id: 1, actor_id: 'pun', actor_role: 'owner', body: 'หนึ่ง' }),
    message({ id: 2, actor_id: 'pun', actor_role: 'owner', body: 'สอง' }),
    message({ id: 3, actor_id: 'head:consult', body: 'สาม' }),
    message({ id: 4, actor_id: 'pun', actor_role: 'owner', body: 'สี่' }),
  ]);
  assert.deepEqual(groups.map((group) => group.messages.map((item) => item.id)), [[1, 2], [3], [4]]);
});

test('collapseWorkerMessages hides worker steps behind the related head message in head mode', () => {
  const items = logic.collapseWorkerMessages([
    message({ id: 1, actor_role: 'owner', actor_id: 'pun' }),
    message({ id: 2, actor_role: 'head', message_type: 'progress', body: 'สั่งงาน' }),
    message({ id: 3, actor_role: 'worker', actor_id: 'codex', message_type: 'progress' }),
    message({ id: 4, actor_role: 'worker', actor_id: 'codex', message_type: 'result' }),
    message({ id: 5, actor_role: 'head', message_type: 'result', body: 'สรุป' }),
  ], 'head');
  assert.deepEqual(items.map((item) => item.kind), ['message', 'message', 'workers', 'message']);
  assert.deepEqual(items[2].messages.map((item) => item.id), [3, 4]);
  assert.equal(items[2].taskId, 10);
});

test('collapseWorkerMessages keeps every step in all mode', () => {
  const items = logic.collapseWorkerMessages([
    message({ id: 1, actor_role: 'head' }),
    message({ id: 2, actor_role: 'worker' }),
  ], 'all');
  assert.deepEqual(items.map((item) => item.kind), ['message', 'message']);
  assert.deepEqual(items.map((item) => item.message.id), [1, 2]);
});

test('collapseWorkerMessages keeps interleaved worker steps with the matching head task', () => {
  const items = logic.collapseWorkerMessages([
    message({ id: 1, task_id: 10, actor_role: 'head', body: 'หัวหน้า A' }),
    message({ id: 2, task_id: 20, actor_role: 'head', body: 'หัวหน้า B' }),
    message({ id: 3, task_id: 10, actor_role: 'worker', body: 'ลูกน้อง A' }),
    message({ id: 4, task_id: 20, actor_role: 'worker', body: 'ลูกน้อง B' }),
  ], 'head');
  assert.deepEqual(items.map((item) => item.kind === 'message' ? `head:${item.message.task_id}` : `workers:${item.taskId}`), ['head:10', 'workers:10', 'head:20', 'workers:20']);
});

test('contextMeter follows the neutral warning and danger token boundaries', () => {
  assert.deepEqual(logic.contextMeter(99_999), { tokens: 99_999, percent: 50, level: 'neutral', recommendHandoff: false });
  assert.deepEqual(logic.contextMeter(100_000), { tokens: 100_000, percent: 50, level: 'warning', recommendHandoff: false });
  assert.deepEqual(logic.contextMeter(150_000), { tokens: 150_000, percent: 75, level: 'warning', recommendHandoff: false });
  assert.deepEqual(logic.contextMeter(150_001), { tokens: 150_001, percent: 75, level: 'danger', recommendHandoff: true });
  assert.equal(logic.contextMeter(250_000).percent, 100);
});

test('waitingForPunCount includes review tasks and open alerts only', () => {
  const tasks = [task({ id: 1, status: 'in_review' }), task({ id: 2, status: 'done' }), task({ id: 3, status: 'in_review' })];
  const alerts = [{ status: 'new' }, { status: 'notified' }, { status: 'calling' }, { status: 'acked' }, { status: 'gave_up' }];
  assert.equal(logic.waitingForPunCount(tasks, alerts), 6);
});

test('draftAfterAcknowledgement clears only the submitted draft', () => {
  assert.equal(logic.draftAfterAcknowledgement('ส่งข้อนี้', 'ส่งข้อนี้'), '');
  assert.equal(logic.draftAfterAcknowledgement('ส่งข้อนี้ แล้วพิมพ์ต่อ', 'ส่งข้อนี้'), 'ส่งข้อนี้ แล้วพิมพ์ต่อ');
});

test('chatStatusMeta uses the chat-specific Thai status labels', () => {
  assert.equal(logic.chatStatusMeta('todo').label, 'รอหัวหน้า');
  assert.equal(logic.chatStatusMeta('in_progress').label, 'กำลังทำ');
  assert.equal(logic.chatStatusMeta('in_review').label, 'รอคุณปัน');
  assert.equal(logic.chatStatusMeta('done').label, 'ปิด');
  assert.equal(logic.chatStatusMeta('cancelled').label, 'ปิด');
  assert.equal(logic.chatStatusMeta('blocked').label, 'ติดขัด');
});

test('roomUnreadCounts compares message ids with each room last-seen id', () => {
  const counts = logic.roomUnreadCounts([
    message({ id: 3, room_slug: 'consult' }),
    message({ id: 4, room_slug: 'consult' }),
    message({ id: 8, room_slug: 'tech' }),
    message({ id: 9, room_slug: 'tech' }),
  ], { consult: 3, tech: 9 });
  assert.deepEqual(counts, { consult: 1 });
});

test('latestMessageByRoom returns the highest-id message for each room', () => {
  const latest = logic.latestMessageByRoom([
    message({ id: 8, room_slug: 'tech', body: 'เก่า' }),
    message({ id: 2, room_slug: 'consult', body: 'ลูกค้า' }),
    message({ id: 10, room_slug: 'tech', body: 'ใหม่' }),
  ]);
  assert.equal(latest.tech.body, 'ใหม่');
  assert.equal(latest.consult.body, 'ลูกค้า');
});

test('collapseWorkerMessages keeps untasked reports (office-report from MacBook) on the feed in time order', () => {
  const items = logic.collapseWorkerMessages([
    message({ id: 1, actor_role: 'head', task_id: 10 }),
    message({ id: 2, actor_role: 'worker', actor_id: 'agent@macbook', task_id: null, source_machine: 'macbook' }),
    message({ id: 3, actor_role: 'worker', actor_id: 'codex', task_id: 10 }),
    message({ id: 4, actor_role: 'owner', actor_id: 'pun', task_id: 10 }),
  ], 'head');
  assert.deepEqual(items.map((item) => item.kind === 'message' ? `m${item.message.id}` : `w${item.messages.map((m) => m.id).join('')}`), ['m1', 'w3', 'm2', 'm4']);
});
