import { onAuthed } from '../dashboard/on-authed';
import {
  ackAlert,
  loadOffice,
  loadOfficeUpdates,
  loadRoomContext,
  loadTaskContext,
  newChat,
  postMessage,
  queueSend,
  reportIncident,
  taskAction,
  type OfficeData,
} from './data';
import {
  ALERT_LEVEL_META,
  ALERT_STATUS_LABEL,
  GRADE_LABEL,
  GRADE_TONE,
  SEND_CHANNEL_LABEL,
  chatStatusMeta,
  collapseWorkerMessages,
  contextMeter,
  draftAfterAcknowledgement,
  fileKind,
  filesForTask,
  firstPassGoodByDepartment,
  fmtBytes,
  fmtWhen,
  groupConsecutiveMessages,
  heartbeatHealth,
  isQuietActive,
  isSendBusy,
  latestMessageByRoom,
  latestSends,
  openTaskCountByDepartment,
  roomUnreadCounts,
  runCountsByDepartment,
  sendStatusText,
  waitingForPunCount,
  type DepartmentSlug,
  type MessageGroup,
  type OfficeAlert,
  type OfficeFile,
  type OfficeMessage,
  type OfficeRoom,
  type OfficeSend,
  type OfficeTask,
  type SendChannel,
} from './logic';

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector(selector) as T;
const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> = {},
  ...children: (Node | string | null | false | undefined)[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') element.className = value;
    else element.setAttribute(key, value);
  }
  for (const child of children) if (child !== null && child !== false && child !== undefined) element.append(child);
  return element;
};

const empty: OfficeData = {
  tasks: [], alerts: [], departments: [], rooms: [], messages: [], runs: [], rubrics: [], grades: [], files: [], sends: [], desk: null, quiet: null,
};
const params = new URLSearchParams(location.search);
const DEMO = import.meta.env.DEV && params.has('demo');
const initialRoomSlug = params.get('room') || '';
const initialTaskId = Number(params.get('task')) || null;
const LAST_SEEN_KEY = 'office-room-last-seen-v1';

const readLastSeen = (): Record<string, number> => {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
};

const state = {
  data: empty,
  roomSlug: initialRoomSlug,
  taskId: initialTaskId as number | null,
  creating: false,
  expandedWorkers: new Set<string>(),
  lastSeen: readLastSeen(),
  drafts: {} as Record<string, string>,
  draftErrors: {} as Record<string, string>,
  polling: undefined as number | undefined,
  busy: false,
  loaded: false,
};
let refreshTail: Promise<unknown> = Promise.resolve();

type PendingAction = {
  action: 'reset_context' | 'handoff' | 'close' | 'archive' | 'redo';
  taskId: number;
  chooseRoom?: boolean;
  needsNote?: boolean;
};
let pendingAction: PendingAction | null = null;

const room = () => state.data.rooms.find((item) => item.slug === state.roomSlug) || null;
const selectedTask = () => state.data.tasks.find((item) => item.id === state.taskId) || null;
const taskRoom = (task: Pick<OfficeTask, 'room' | 'department'>) => task.room || task.department || 'system';
const isOpenAlert = (alert: OfficeAlert) => alert.status !== 'acked';
const maxMessageId = () => state.data.messages.reduce((max, item) => Math.max(max, item.id), 0);
const safeUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

const draftKey = () => state.creating ? `new:${state.roomSlug}` : state.taskId ? `task:${state.taskId}` : `room:${state.roomSlug}`;
function saveDraft() {
  const input = document.querySelector<HTMLTextAreaElement>('#of-compose-input');
  if (input) state.drafts[draftKey()] = input.value;
}
function restoreDraft() {
  const key = draftKey();
  const input = $('#of-compose-input') as HTMLTextAreaElement;
  input.value = state.drafts[key] || '';
  const error = state.draftErrors[key] || '';
  $('#of-compose-error').textContent = error;
  $('#of-compose-error').classList.toggle('hidden', !error);
}

function mergeMessages(messages: OfficeMessage[]) {
  const byId = new Map(state.data.messages.map((item) => [item.id, item]));
  for (const message of messages) byId.set(message.id, message);
  state.data.messages = [...byId.values()].sort((a, b) => a.id - b.id);
}

function mergeTasks(tasks: OfficeTask[]) {
  const byId = new Map(state.data.tasks.map((item) => [item.id, item]));
  for (const task of tasks) byId.set(task.id, task);
  state.data.tasks = [...byId.values()];
}

function serializedRefresh<T>(operation: () => Promise<T>): Promise<T> {
  const run = refreshTail.then(operation, operation);
  refreshTail = run.then(() => undefined, () => undefined);
  return run;
}

function showError(error: unknown) {
  const toast = $('#of-toast');
  toast.textContent = (error as Error)?.message || 'ทำรายการไม่สำเร็จ';
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 5000);
}

function updateUrl() {
  const url = new URL(location.href);
  if (state.roomSlug) url.searchParams.set('room', state.roomSlug); else url.searchParams.delete('room');
  if (state.taskId) url.searchParams.set('task', String(state.taskId)); else url.searchParams.delete('task');
  history.replaceState(null, '', url);
}

function setMobileStage(stage: 'rooms' | 'room' | 'chat') {
  $('#office-app').dataset.mobileStage = stage;
}

function markRoomSeen(slug: string) {
  const latest = state.data.messages.filter((item) => item.room_slug === slug).reduce((max, item) => Math.max(max, item.id), 0);
  if (!latest) return;
  state.lastSeen[slug] = latest;
  try { localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(state.lastSeen)); } catch { /* Private mode may block storage. */ }
}

function roomButton(item: OfficeRoom, latest: Record<string, OfficeMessage>, unread: Record<string, number>) {
  const message = latest[item.slug];
  return h('button', {
    class: 'of-room w-full p-2.5 text-left hover:bg-base-200', type: 'button', 'data-room': item.slug,
    'aria-current': String(item.slug === state.roomSlug),
  },
  h('span', { class: 'flex items-center gap-2' },
    h('span', { class: 'min-w-0 flex-1 truncate font-semibold' }, item.title),
    unread[item.slug] ? h('span', { class: 'badge badge-primary badge-sm', 'aria-label': `${unread[item.slug]} ข้อความยังไม่อ่าน` }, String(unread[item.slug])) : null),
  h('span', { class: 'mt-1 block truncate text-xs opacity-55' }, message?.body || 'ยังไม่มีข้อความ'));
}

function roomGroup(title: string, rooms: OfficeRoom[], latest: Record<string, OfficeMessage>, unread: Record<string, number>) {
  if (!rooms.length) return null;
  return h('section', {},
    h('h2', { class: 'px-2 pb-1 text-xs font-semibold uppercase tracking-[.12em] opacity-50' }, title),
    h('div', { class: 'space-y-1' }, ...rooms.map((item) => roomButton(item, latest, unread))));
}

function renderRooms() {
  const openRooms = state.data.rooms.filter((item) => item.status === 'open');
  const latest = latestMessageByRoom(state.data.messages);
  const unread = roomUnreadCounts(state.data.messages, state.lastSeen);
  $('#of-waiting').textContent = `รอคุณปัน ${waitingForPunCount(state.data.tasks, state.data.alerts)}`;
  $('#of-room-list').replaceChildren(
    roomGroup('ฝ่าย', openRooms.filter((item) => item.kind === 'dept'), latest, unread),
    roomGroup('ระบบ', openRooms.filter((item) => item.kind === 'system'), latest, unread),
    roomGroup('ห้องโปรเจกต์', openRooms.filter((item) => ['project', 'client'].includes(item.kind)), latest, unread),
  );
}

function chatButton(task: OfficeTask) {
  const meta = chatStatusMeta(task.status);
  const latest = state.data.messages.filter((item) => item.task_id === task.id).at(-1);
  return h('button', {
    class: 'of-chat w-full p-2.5 text-left hover:bg-base-200', type: 'button', 'data-task': String(task.id),
    'aria-current': String(task.id === state.taskId),
  },
  h('span', { class: 'flex items-start gap-2' },
    h('span', { class: 'min-w-0 flex-1' }, h('span', { class: 'block truncate font-semibold' }, task.title), h('span', { class: 'mt-1 block truncate text-xs opacity-55' }, latest?.body || task.brief)),
    h('span', { class: `badge badge-sm shrink-0 ${meta.tone}` }, meta.label)));
}

function reviewCard(task: OfficeTask) {
  return h('article', { class: 'rounded-xl border border-warning/40 bg-warning/10 p-3' },
    h('div', { class: 'flex flex-wrap items-start justify-between gap-2' },
      h('div', { class: 'min-w-0' }, h('h4', { class: 'font-semibold' }, task.title), h('p', { class: 'mt-1 of-copy text-sm opacity-70' }, task.result?.speak || task.result?.text || task.brief)),
      task.grade ? h('span', { class: `badge badge-sm ${GRADE_TONE[task.grade]}` }, GRADE_LABEL[task.grade]) : null),
    renderFiles(task),
    h('div', { class: 'mt-3 flex flex-wrap gap-2' },
      h('button', { class: 'btn btn-success btn-sm min-h-11', type: 'button', 'data-review': 'approve', 'data-task': String(task.id) }, 'อนุมัติ'),
      h('button', { class: 'btn btn-outline btn-sm min-h-11', type: 'button', 'data-review': 'redo', 'data-task': String(task.id) }, 'ให้แก้')));
}

function alertCard(alert: OfficeAlert) {
  const level = ALERT_LEVEL_META[alert.level];
  return h('article', { class: `rounded-xl border p-3 ${isOpenAlert(alert) ? 'border-error/40 bg-error/5' : 'border-base-300 opacity-60'}` },
    h('div', { class: 'flex flex-wrap items-center gap-2' }, h('span', { class: `badge badge-sm ${level.tone}` }, level.label), h('span', { class: 'badge badge-sm badge-ghost' }, ALERT_STATUS_LABEL[alert.status])),
    h('h4', { class: 'mt-2 font-semibold' }, alert.title),
    alert.detail ? h('p', { class: 'of-copy mt-1 text-sm opacity-70' }, alert.detail) : null,
    h('p', { class: 'mt-2 text-xs opacity-50' }, `${alert.source}  ${fmtWhen(alert.updated_at)}`),
    isOpenAlert(alert) ? h('button', { class: 'btn btn-outline btn-sm mt-3 min-h-11', type: 'button', 'data-alert': String(alert.id) }, 'ปิดเหตุ') : null);
}

const actorName = (message: OfficeMessage) => {
  if (message.actor_role === 'owner') return 'คุณปัน';
  if (message.actor_role === 'head') return 'หัวหน้าฝ่าย';
  if (message.actor_role === 'worker') return 'ลูกน้อง';
  return 'ระบบ';
};
const machineIcon = (message: OfficeMessage) => ({ macbook: '💻', mini: '🖥️', web: '📱', telegram: '📱', cloud: '☁️' }[message.source_machine || ''] || '');

function handoffTarget(message: OfficeMessage) {
  const payloadId = Number(message.payload?.handed_to || message.payload?.task_id || 0);
  const task = message.task_id ? state.data.tasks.find((item) => item.id === message.task_id) : null;
  return payloadId || task?.handed_to || null;
}

function renderFiles(task: OfficeTask) {
  const files = filesForTask(state.data.files, task.id);
  if (!files.length) return null;
  const latest = latestSends(state.data.sends);
  return h('div', { class: 'mt-3 space-y-2' }, ...files.map((file) => fileRow(file, latest)));
}

function renderMessageFiles(group: MessageGroup, task: OfficeTask | null) {
  const explicit = group.messages.map((item) => item.file_id).filter((id): id is number => id != null);
  if (explicit.length) {
    const latest = latestSends(state.data.sends);
    const files = state.data.files.filter((file) => explicit.includes(file.id));
    return files.length ? h('div', { class: 'mt-3 space-y-2' }, ...files.map((file) => fileRow(file, latest))) : null;
  }
  const last = group.messages.at(-1)!;
  return task && last.actor_role === 'head' && last.message_type === 'result' ? renderFiles(task) : null;
}

function fileRow(file: OfficeFile, latest: Map<string, OfficeSend>) {
  const kind = fileKind(file.name);
  const url = safeUrl(file.drive_url);
  const buttons = (['telegram', 'line'] as SendChannel[]).map((channel) => {
    const send = latest.get(`${file.id}:${channel}`);
    const busy = isSendBusy(send);
    return h('button', {
      class: 'of-send btn btn-xs min-h-11', type: 'button', 'data-file': String(file.id), 'data-channel': channel,
      ...(busy ? { disabled: '' } : {}),
    }, busy ? (send?.status === 'queued' ? 'รอส่ง' : 'กำลังส่ง') : SEND_CHANNEL_LABEL[channel]);
  });
  const statuses = (['telegram', 'line'] as SendChannel[]).map((channel) => latest.get(`${file.id}:${channel}`)).filter((send): send is OfficeSend => !!send && !isSendBusy(send));
  return h('div', { class: 'of-file' },
    h('div', { class: 'flex min-w-0 items-start gap-2' }, h('span', {}, kind.icon), h('div', { class: 'min-w-0 flex-1' },
      url ? h('a', { class: 'link block break-all font-medium', href: url, target: '_blank', rel: 'noopener noreferrer' }, file.name) : h('span', { class: 'block break-all font-medium' }, file.name),
      h('p', { class: 'text-xs opacity-55' }, `${kind.label}  ${fmtBytes(file.size_bytes)}`))),
    h('div', { class: 'mt-2 flex flex-wrap gap-2' }, ...buttons),
    ...statuses.map((send) => h('p', { class: `mt-1 text-xs ${send.status === 'failed' ? 'text-error' : 'opacity-55'}` }, sendStatusText(send))));
}

function messageGroup(group: MessageGroup, compact = false) {
  const first = group.messages[0];
  if (first.message_type === 'context_reset') return h('div', { class: 'of-separator py-2' }, first.body || 'เริ่มบริบทใหม่');
  if (first.message_type === 'handoff') {
    const target = handoffTarget(first);
    return h('article', { class: 'rounded-xl border border-info/40 bg-info/10 p-3 text-sm' },
      h('p', { class: 'font-semibold' }, 'สรุปส่งต่อ'), h('p', { class: 'of-copy mt-1 opacity-75' }, first.body),
      target ? h('button', { class: 'btn btn-link mt-1 min-h-11 px-0', type: 'button', 'data-open-task': String(target) }, 'เปิดแชทใหม่') : null);
  }
  const owner = first.actor_role === 'owner';
  const last = group.messages.at(-1)!;
  const task = last.task_id ? state.data.tasks.find((item) => item.id === last.task_id) : null;
  return h('article', { class: `of-bubble ${owner ? 'of-bubble-owner' : 'bg-base-200/70'} ${compact ? 'text-sm' : ''}` },
    h('div', { class: `mb-1 flex flex-wrap items-center gap-1 text-xs ${owner ? 'text-white/75' : 'opacity-55'}` },
      h('span', { class: 'font-semibold' }, actorName(first)), machineIcon(first), h('time', { datetime: first.created_at }, fmtWhen(first.created_at))),
    h('div', { class: 'of-message-stack' }, ...group.messages.map((item) => h('p', { class: 'of-copy' }, item.body))),
    renderMessageFiles(group, task || null));
}

function workerSteps(messages: OfficeMessage[]) {
  const key = `${messages[0]?.task_id || 0}:${messages[0]?.id || 0}`;
  const details = h('details', { class: 'rounded-xl border border-base-300 bg-base-200/40 p-2' },
    h('summary', { class: 'min-h-11 cursor-pointer px-2 py-2 font-semibold' }, `ดู ${messages.length} ขั้นของลูกน้อง`),
    h('div', { class: 'space-y-2 p-2 pt-0' }, ...groupConsecutiveMessages(messages).map((group) => messageGroup(group, true))));
  if (state.expandedWorkers.has(key)) details.open = true;
  details.addEventListener('toggle', () => details.open ? state.expandedWorkers.add(key) : state.expandedWorkers.delete(key));
  return details;
}

function renderRoomFeed() {
  const selected = room();
  if (!selected) return $('#of-room-feed').replaceChildren(h('p', { class: 'py-6 text-center text-sm opacity-50' }, 'เลือกห้องเพื่อดูฟีด'));
  const messages = state.data.messages.filter((item) => item.room_slug === selected.slug);
  const items = collapseWorkerMessages(messages, selected.report_mode);
  $('#of-room-feed').replaceChildren(...(items.length ? items.map((item) => item.kind === 'workers' ? workerSteps(item.messages) : messageGroup({ actorId: item.message.actor_id, taskId: item.message.task_id, messages: [item.message] }, true)) : [h('p', { class: 'py-6 text-center text-sm opacity-50' }, 'ยังไม่มีข้อความในห้องนี้')]));
}

function renderRoom() {
  const selected = room();
  $('#of-room-title').textContent = selected?.title || 'เลือกห้อง';
  $('#of-room-subtitle').textContent = selected ? (selected.kind === 'system' ? 'เหตุด่วนและสถานะระบบ' : selected.goal || 'คุยกับหัวหน้าฝ่าย') : '';
  $('#of-new-chat').classList.toggle('hidden', !selected);
  const chats = state.data.tasks.filter((item) => item.kind === 'chat' && item.room === state.roomSlug && !item.archived_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  $('#of-chat-list').replaceChildren(...(chats.length ? chats.map(chatButton) : [h('p', { class: 'rounded-xl border border-dashed border-base-300 p-4 text-center text-sm opacity-55' }, 'ยังไม่มีแชทในห้องนี้')]));

  const reviews = state.data.tasks.filter((item) => item.kind === 'action' && taskRoom(item) === state.roomSlug && item.status === 'in_review');
  $('#of-review-section').classList.toggle('hidden', !reviews.length);
  $('#of-review-list').replaceChildren(...reviews.map(reviewCard));

  const system = selected?.kind === 'system';
  $('#of-alert-section').classList.toggle('hidden', !system);
  if (system) $('#of-alert-list').replaceChildren(...[...state.data.alerts].sort((a, b) => Number(isOpenAlert(b)) - Number(isOpenAlert(a)) || b.created_at.localeCompare(a.created_at)).map(alertCard));
  $('#of-incident-form').classList.toggle('hidden', !system);
  renderRoomFeed();
}

function renderChat() {
  const task = selectedTask();
  const compose = $('#of-compose');
  if (state.creating) {
    $('#of-chat-title').textContent = `แชทใหม่ใน ${room()?.title || 'ห้อง'}`;
    $('#of-chat-status').textContent = 'ใหม่';
    $('#of-chat-status').className = 'badge badge-sm badge-primary';
    $('#of-chat-menu').classList.add('hidden');
    $('#of-context-wrap').classList.add('hidden');
    $('#of-readonly').classList.add('hidden');
    $('#of-message-list').replaceChildren(h('div', { class: 'm-auto max-w-sm py-16 text-center' }, h('p', { class: 'text-4xl' }, '💬'), h('p', { class: 'mt-3 font-semibold' }, 'เริ่มเรื่องที่อยากให้หัวหน้าฝ่ายช่วย'), h('p', { class: 'mt-1 text-sm opacity-55' }, 'ข้อความแรกจะเป็นชื่อแชทและบรีฟ')));
    compose.classList.remove('hidden');
    $('#of-compose-label').textContent = 'ข้อความแรก';
    restoreDraft();
    return;
  }
  if (!task) {
    $('#of-chat-title').textContent = 'เลือกแชท';
    $('#of-chat-status').textContent = 'ยังไม่เลือก';
    $('#of-chat-status').className = 'badge badge-sm badge-ghost';
    $('#of-chat-menu').classList.add('hidden');
    $('#of-context-wrap').classList.add('hidden');
    $('#of-readonly').classList.add('hidden');
    $('#of-message-list').replaceChildren(h('p', { class: 'm-auto py-16 text-center text-sm opacity-50' }, 'เลือกแชทจากห้องด้านซ้าย'));
    compose.classList.add('hidden');
    return;
  }

  const meta = chatStatusMeta(task.status);
  const readOnly = !!task.archived_at || ['done', 'cancelled'].includes(task.status);
  $('#of-chat-title').textContent = task.title;
  $('#of-chat-status').textContent = meta.label;
  $('#of-chat-status').className = `badge badge-sm ${meta.tone}`;
  $('#of-readonly').classList.toggle('hidden', !readOnly);
  $('#of-chat-menu').classList.toggle('hidden', readOnly);

  const latestRun = state.data.runs.filter((item) => item.task_id === task.id && item.role === 'head_chat').sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  const meter = contextMeter((latestRun?.input_tokens || 0) + (latestRun?.cached_tokens || 0));
  $('#of-context-wrap').classList.remove('hidden');
  const progress = $('#of-context') as HTMLProgressElement;
  progress.value = meter.percent;
  progress.style.setProperty('--of-meter', meter.level === 'danger' ? '#dc2626' : meter.level === 'warning' ? '#d97706' : '#64748b');
  $('#of-context-label').textContent = `${meter.tokens.toLocaleString('th-TH')} tokens`;
  $('#of-context-warning').classList.toggle('hidden', !meter.recommendHandoff);

  const messages = state.data.messages.filter((item) => item.task_id === task.id).sort((a, b) => a.id - b.id);
  $('#of-message-list').replaceChildren(...(messages.length ? groupConsecutiveMessages(messages).map((group) => messageGroup(group)) : [h('p', { class: 'm-auto py-16 text-center text-sm opacity-50' }, 'ยังไม่มีข้อความ')]));
  compose.classList.toggle('hidden', readOnly);
  $('#of-compose-label').textContent = 'พิมพ์ต่อในแชท';
  if (!readOnly) restoreDraft();
}

function statCard(label: string, value: string, note: string) {
  return h('article', { class: 'rounded-xl border border-base-300 p-3' }, h('p', { class: 'text-xs opacity-55' }, label), h('p', { class: 'mt-1 font-display text-2xl font-bold' }, value), h('p', { class: 'mt-1 text-xs opacity-50' }, note));
}

function renderOfficeStatus() {
  const health = heartbeatHealth(state.data.desk);
  const open = openTaskCountByDepartment(state.data.tasks);
  const quality = firstPassGoodByDepartment(state.data.tasks);
  const runs = runCountsByDepartment(state.data.runs);
  const departments = state.data.departments.map((department) => {
    const metric = quality[department.slug];
    return h('article', { class: 'rounded-xl border border-base-300 p-3' },
      h('div', { class: 'flex items-start justify-between gap-2' }, h('h4', { class: 'font-semibold' }, department.name_th), h('span', { class: 'badge badge-ghost badge-sm' }, `เปิด ${open[department.slug] || 0}`)),
      h('div', { class: 'mt-3 grid grid-cols-2 gap-3 text-sm' }, h('div', {}, h('p', { class: 'text-xs opacity-50' }, 'ดีรอบแรก'), h('p', { class: 'font-bold' }, metric.percent == null ? 'ยังไม่มีเกรด' : `${metric.percent}%`)), h('div', {}, h('p', { class: 'text-xs opacity-50' }, 'Run เดือนนี้'), h('p', { class: 'font-bold' }, `${runs[department.slug] || 0}/${department.monthly_run_cap}`))));
  });
  const rubrics = state.data.rubrics.map((rubric) => h('article', { class: 'rounded-xl border border-base-300 p-3' }, h('div', { class: 'flex items-start justify-between gap-2' }, h('h4', { class: 'font-semibold' }, rubric.title_th), h('span', { class: `badge badge-sm ${rubric.pun_reviewed ? 'badge-success' : 'badge-warning'}` }, rubric.pun_reviewed ? 'คุณปันตรวจแล้ว' : 'รอคุณปัน')), h('ol', { class: 'mt-2 list-decimal space-y-1 pl-5 text-sm opacity-70' }, ...rubric.criteria.map((criterion) => h('li', {}, criterion)))));
  const working = state.data.tasks.filter((item) => ['todo', 'in_progress'].includes(item.status)).length;
  const openAlerts = state.data.alerts.filter(isOpenAlert).length;
  $('#of-status-content').replaceChildren(
    h('section', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-4' },
      statCard('รอคุณปัน', String(waitingForPunCount(state.data.tasks, state.data.alerts)), 'งานและเหตุ'), statCard('กำลังทำ', String(working), 'รอคิวและกำลังทำ'), statCard('เหตุเปิด', String(openAlerts), 'ยังไม่ปิด'), statCard('Desk', health.state === 'normal' ? 'ปกติ' : health.state === 'slow' ? 'ช้า' : 'หยุด', isQuietActive(state.data.quiet) ? 'ช่วงห้ามรบกวนเปิดอยู่' : 'ช่วงห้ามรบกวนปิด')),
    h('section', {}, h('h3', { class: 'mb-2 font-display text-lg font-bold' }, 'ฝ่าย'), h('div', { class: 'grid gap-2 sm:grid-cols-2' }, ...departments)),
    h('section', {}, h('h3', { class: 'mb-2 font-display text-lg font-bold' }, 'เกณฑ์งาน'), h('div', { class: 'grid gap-2 sm:grid-cols-2' }, ...rubrics)),
    h('section', { class: 'rounded-xl border border-base-300 p-3 text-sm' }, h('h3', { class: 'font-semibold' }, 'สถานะ Desk'), h('div', { class: 'mt-2 flex flex-wrap gap-2' }, h('span', { class: `badge ${state.data.desk?.whatsapp ? 'badge-success' : 'badge-ghost'}` }, state.data.desk?.whatsapp ? 'WhatsApp พร้อม' : 'WhatsApp ยังไม่พร้อม'), h('span', { class: `badge ${state.data.desk?.phone ? 'badge-success' : 'badge-ghost'}` }, state.data.desk?.phone ? 'เบอร์โทรพร้อม' : 'เบอร์โทรยังไม่พร้อม'))));
  const nav = $('#of-nav-health');
  nav.textContent = health.state === 'normal' ? 'Desk ปกติ' : health.state === 'slow' ? 'Desk ช้า' : 'Desk หยุด';
  nav.className = `badge my-auto hidden sm:inline-flex ${health.state === 'normal' ? 'badge-success' : health.state === 'slow' ? 'badge-warning' : 'badge-error'}`;
}

function renderAll() {
  if (!state.roomSlug || !state.data.rooms.some((item) => item.slug === state.roomSlug)) state.roomSlug = state.data.rooms.find((item) => item.kind === 'dept')?.slug || state.data.rooms[0]?.slug || '';
  if (state.taskId && !state.data.tasks.some((item) => item.id === state.taskId)) state.taskId = null;
  if (state.roomSlug && (matchMedia('(min-width: 1024px)').matches || $('#office-app').dataset.mobileStage !== 'rooms')) markRoomSeen(state.roomSlug);
  renderRooms(); renderRoom(); renderChat(); renderOfficeStatus(); updateUrl();
}

function fullRefresh() {
  if (DEMO) { renderAll(); return Promise.resolve(); }
  return serializedRefresh(async () => {
    state.data = await loadOffice(); state.loaded = true;
    if (state.taskId) {
      try {
        const context = await loadTaskContext(state.taskId);
        mergeTasks([context.task]); mergeMessages(context.messages); state.data.runs.push(...context.runs.filter((run) => !state.data.runs.some((item) => item.id === run.id)));
      } catch { /* The global snapshot still renders; direct hydration can retry. */ }
    }
    renderAll();
  });
}

function incrementalRefresh() {
  if (DEMO || document.hidden) return Promise.resolve();
  if (!state.loaded) return fullRefresh();
  return serializedRefresh(async () => {
    const updates = await loadOfficeUpdates(maxMessageId());
    const existingMessages = state.data.messages;
    const existingRuns = state.data.runs;
    const newMessages = updates.messages;
    Object.assign(state.data, updates);
    state.data.messages = existingMessages;
    const runsById = new Map(existingRuns.filter((item) => item.id != null).map((item) => [item.id, item]));
    for (const run of updates.runs) if (run.id != null) runsById.set(run.id, run);
    state.data.runs = [...runsById.values()];
    mergeMessages(newMessages);
    renderAll();
  });
}

async function hydrateRoom(slug: string) {
  if (DEMO) return;
  const context = await loadRoomContext(slug);
  mergeTasks(context.tasks); mergeMessages(context.messages); renderAll();
}

async function hydrateTask(id: number) {
  if (DEMO) return;
  const context = await loadTaskContext(id);
  mergeTasks([context.task]); mergeMessages(context.messages);
  const byId = new Map(state.data.runs.map((item) => [item.id, item]));
  for (const run of context.runs) if (run.id != null) byId.set(run.id, run);
  state.data.runs = [...byId.values()]; renderAll();
}

function schedulePoll() {
  window.clearTimeout(state.polling);
  if (DEMO || document.hidden) return;
  state.polling = window.setTimeout(async () => {
    try { await incrementalRefresh(); } catch { /* The next visible poll retries. */ }
    schedulePoll();
  }, 5000);
}

function selectRoom(slug: string) {
  if (state.busy) return;
  saveDraft();
  state.roomSlug = slug; state.taskId = null; state.creating = false;
  markRoomSeen(slug); renderAll(); setMobileStage('room');
  void hydrateRoom(slug).catch(showError);
}

async function selectTask(id: number) {
  if (state.busy) return;
  saveDraft();
  if (!state.data.tasks.some((item) => item.id === id)) {
    try { await hydrateTask(id); } catch (error) { showError(error); return; }
  }
  const task = state.data.tasks.find((item) => item.id === id);
  if (!task) return;
  if (task.room) state.roomSlug = task.room;
  state.taskId = id; state.creating = false;
  if (state.roomSlug) markRoomSeen(state.roomSlug);
  renderAll(); setMobileStage('chat');
  void hydrateTask(id).catch(showError);
  window.setTimeout(() => { const list = $('#of-message-list'); list.scrollTop = list.scrollHeight; }, 0);
}

function startNewChat() {
  if (!room() || state.busy) return;
  saveDraft();
  state.taskId = null; state.creating = true; renderChat(); updateUrl(); setMobileStage('chat');
  ($('#of-compose-input') as HTMLTextAreaElement).focus();
}

function askAction(action: PendingAction, title: string, copy: string) {
  pendingAction = action;
  $('#of-confirm-title').textContent = title;
  $('#of-confirm-copy').textContent = copy;
  $('#of-confirm-error').classList.add('hidden');
  $('#of-confirm-room-wrap').classList.toggle('hidden', !action.chooseRoom);
  $('#of-confirm-note-wrap').classList.toggle('hidden', !action.needsNote);
  if (action.chooseRoom) {
    const select = $('#of-confirm-room') as HTMLSelectElement;
    select.replaceChildren(...state.data.rooms.filter((item) => item.status === 'open' && item.slug !== state.roomSlug).map((item) => h('option', { value: item.slug }, item.title)));
  }
  ($('#of-confirm-note') as HTMLTextAreaElement).value = '';
  ($('#of-confirm-dialog') as HTMLDialogElement).showModal();
}

function simulateTaskAction(task: OfficeTask, action: string, arg: string | null) {
  if (action === 'reset_context') state.data.messages.push({
    id: maxMessageId() + 1, room_slug: task.room!, task_id: task.id, run_id: null, file_id: null, actor_role: 'system', actor_id: 'office', source_machine: 'web', message_type: 'context_reset', body: 'เริ่มบริบทใหม่', payload: {}, created_at: new Date().toISOString(),
  });
  if (action === 'handoff') { task.pending_action = { action: 'handoff', room: arg || task.room || undefined }; task.status = 'todo'; }
  if (action === 'close') task.status = 'done';
  if (action === 'archive') { task.status = 'cancelled'; task.archived_at = new Date().toISOString(); }
  if (action === 'approve') task.status = 'done';
  if (action === 'redo') { task.status = 'todo'; task.pending_action = { action: 'redo', note: arg || undefined }; }
  if (action === 'notify' && ['final', 'all', 'off'].includes(arg || '')) task.notify = arg as OfficeTask['notify'];
  task.updated_at = new Date().toISOString();
}

async function runTaskAction(taskId: number, action: string, arg: string | null = null) {
  const task = state.data.tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (DEMO) simulateTaskAction(task, action, arg);
  else {
    await taskAction(taskId, action, arg);
    simulateTaskAction(task, action, arg);
  }
  renderAll();
  if (!DEMO) await fullRefresh().catch(() => showError(new Error('ทำรายการสำเร็จแล้ว แต่ยังโหลดสถานะล่าสุดไม่ได้')));
}

async function submitPendingAction() {
  if (!pendingAction) return;
  const select = $('#of-confirm-room') as HTMLSelectElement;
  const note = ($('#of-confirm-note') as HTMLTextAreaElement).value.trim();
  const arg = pendingAction.chooseRoom ? select.value : pendingAction.needsNote ? note : null;
  if (pendingAction.needsNote && !note) {
    $('#of-confirm-error').textContent = 'ใส่จุดที่อยากให้แก้ก่อนส่ง'; $('#of-confirm-error').classList.remove('hidden'); return;
  }
  const submit = $('#of-confirm-submit') as HTMLButtonElement;
  submit.disabled = true;
  try {
    await runTaskAction(pendingAction.taskId, pendingAction.action, arg);
    ($('#of-confirm-dialog') as HTMLDialogElement).close(); pendingAction = null;
  } catch (error) { $('#of-confirm-error').textContent = (error as Error).message; $('#of-confirm-error').classList.remove('hidden'); }
  finally { submit.disabled = false; }
}

async function submitCompose() {
  const input = $('#of-compose-input') as HTMLTextAreaElement;
  const button = $('#of-compose-send') as HTMLButtonElement;
  const errorBox = $('#of-compose-error');
  const key = draftKey();
  const submittedDraft = input.value;
  const body = input.value.trim();
  if (!body || state.busy) return;
  state.busy = true; button.disabled = true; errorBox.classList.add('hidden');
  try {
    if (DEMO) {
      if (state.creating) {
        const id = Math.max(0, ...state.data.tasks.map((item) => item.id)) + 1;
        const now = new Date().toISOString();
        const selectedRoom = room()!;
        state.data.tasks.push({ id, no: String(id).padStart(4, '0'), parent_id: null, title: body.replace(/\s+/g, ' ').slice(0, 80), brief: body, department: selectedRoom.department, room: selectedRoom.slug, kind: 'chat', priority: 'normal', status: 'todo', source: 'web', result: null, review_rounds: 0, grade: null, output_path: null, notify: 'final', handed_to: null, archived_at: null, pending_action: null, created_at: now, updated_at: now, done_at: null });
        state.data.messages.push({ id: maxMessageId() + 1, room_slug: selectedRoom.slug, task_id: id, run_id: null, file_id: null, actor_role: 'owner', actor_id: 'pun', source_machine: 'web', message_type: 'note', body, payload: {}, created_at: now });
        state.taskId = id; state.creating = false;
      } else if (selectedTask()) {
        const task = selectedTask()!; const now = new Date().toISOString();
        state.data.messages.push({ id: maxMessageId() + 1, room_slug: task.room!, task_id: task.id, run_id: null, file_id: null, actor_role: 'owner', actor_id: 'pun', source_machine: 'web', message_type: 'note', body, payload: {}, created_at: now });
        task.status = 'todo'; task.updated_at = now;
      }
      renderAll();
    } else if (state.creating) {
      const id = await newChat(state.roomSlug, body); state.taskId = Number(id); state.creating = false;
    } else if (state.taskId) { await postMessage(state.taskId, body); }
    const current = state.drafts[key] ?? submittedDraft;
    state.drafts[key] = draftAfterAcknowledgement(current, submittedDraft);
    state.draftErrors[key] = '';
    if (draftKey() === key) input.value = state.drafts[key];
    if (!DEMO) await fullRefresh().catch(() => showError(new Error('ส่งแล้ว แต่ยังโหลดข้อความล่าสุดไม่ได้')));
  } catch (error) { state.draftErrors[key] = (error as Error).message; errorBox.textContent = state.draftErrors[key]; errorBox.classList.remove('hidden'); }
  finally { state.busy = false; button.disabled = false; }
}

async function submitIncident() {
  const input = $('#of-incident-input') as HTMLTextAreaElement;
  const errorBox = $('#of-incident-error');
  const body = input.value.trim();
  if (!body) return;
  const button = $('#of-incident-form button[type="submit"]') as HTMLButtonElement;
  button.disabled = true; errorBox.classList.add('hidden');
  try {
    if (DEMO) {
      const id = Math.max(0, ...state.data.alerts.map((item) => item.id)) + 1; const now = new Date().toISOString();
      state.data.alerts.unshift({ id, level: 'urgent', title: body.slice(0, 200), detail: body, source: 'pun:web', status: 'notified', calls: 0, last_call_at: null, created_at: now, updated_at: now }); renderAll();
    } else { await reportIncident(body); }
    input.value = '';
    if (!DEMO) await fullRefresh().catch(() => showError(new Error('แจ้งเหตุแล้ว แต่ยังโหลดสถานะล่าสุดไม่ได้')));
  } catch (error) { errorBox.textContent = (error as Error).message; errorBox.classList.remove('hidden'); }
  finally { button.disabled = false; }
}

async function onFileSend(button: HTMLButtonElement) {
  const fileId = Number(button.dataset.file); const channel = button.dataset.channel as SendChannel;
  button.disabled = true;
  try {
    const send: OfficeSend = DEMO ? { id: Date.now(), file_id: fileId, channel, status: 'sent', error: null, share_expires_at: channel === 'line' ? new Date(Date.now() + 7 * 86_400_000).toISOString() : null, created_at: new Date().toISOString(), sent_at: new Date().toISOString() } : await queueSend(fileId, channel);
    state.data.sends = [send, ...state.data.sends]; renderAll();
  } catch (error) { showError(error); button.disabled = false; }
}

function wire() {
  $('#of-room-list').addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-room]'); if (button) selectRoom(button.dataset.room!); });
  $('#of-chat-list').addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-task]'); if (button) void selectTask(Number(button.dataset.task)); });
  for (const selector of ['#of-message-list', '#of-room-feed']) $(selector).addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-open-task]'); if (button) void selectTask(Number(button.dataset.openTask)); });
  $('#of-new-chat').addEventListener('click', startNewChat);
  $('.of-back-rooms').addEventListener('click', () => { if (state.busy) return; saveDraft(); state.taskId = null; state.creating = false; setMobileStage('rooms'); updateUrl(); });
  $('.of-back-room').addEventListener('click', () => { if (state.busy) return; saveDraft(); state.taskId = null; state.creating = false; renderAll(); setMobileStage('room'); });
  $('#of-office-status').addEventListener('click', () => ($('#of-status-dialog') as HTMLDialogElement).showModal());
  $('#of-refresh').addEventListener('click', () => fullRefresh().catch(showError));
  $('#of-compose').addEventListener('submit', (event) => { event.preventDefault(); void submitCompose(); });
  $('#of-compose-input').addEventListener('input', (event) => { state.drafts[draftKey()] = (event.target as HTMLTextAreaElement).value; state.draftErrors[draftKey()] = ''; $('#of-compose-error').classList.add('hidden'); });
  $('#of-compose-input').addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey && matchMedia('(min-width: 768px)').matches) { event.preventDefault(); void submitCompose(); } });
  $('#of-incident-form').addEventListener('submit', (event) => { event.preventDefault(); void submitIncident(); });
  $('#of-incident-input').addEventListener('input', () => $('#of-incident-error').classList.add('hidden'));
  $('#of-review-list').addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-review]'); if (!button) return;
    const id = Number(button.dataset.task);
    if (button.dataset.review === 'approve') void runTaskAction(id, 'approve').catch(showError);
    else askAction({ action: 'redo', taskId: id, needsNote: true }, 'ให้แก้งาน', 'บอกจุดที่อยากให้หัวหน้าฝ่ายแก้ก่อนส่งกลับ');
  });
  $('#of-alert-list').addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-alert]'); if (!button) return;
    const id = Number(button.dataset.alert); button.disabled = true;
    void (async () => { try { if (!DEMO) await ackAlert(id); const alert = state.data.alerts.find((item) => item.id === id); if (alert) alert.status = 'acked'; renderAll(); if (!DEMO) await fullRefresh().catch(() => showError(new Error('ปิดเหตุแล้ว แต่ยังโหลดสถานะล่าสุดไม่ได้'))); } catch (error) { showError(error); } finally { button.disabled = false; } })();
  });
  $('#of-chat-menu').addEventListener('click', (event) => {
    const notify = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-notify]');
    if (notify && state.taskId) { void runTaskAction(state.taskId, 'notify', notify.dataset.notify || 'final').catch(showError); return; }
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-chat-action]');
    if (!button || !state.taskId) return;
    const action = button.dataset.chatAction!;
    if (action === 'reset_context') askAction({ action, taskId: state.taskId }, 'เริ่มบริบทใหม่', 'หัวหน้าฝ่ายจะไม่จำบริบทเก่า แต่ข้อความยังอยู่ในแชท');
    if (action === 'handoff') askAction({ action, taskId: state.taskId }, 'สรุปส่งต่อแชทใหม่', 'หัวหน้าฝ่ายจะสรุปบริบทและเริ่มแชทใหม่ในห้องเดิม');
    if (action === 'handoff_other') askAction({ action: 'handoff', taskId: state.taskId, chooseRoom: true }, 'ส่งต่อไปห้องอื่น', 'เลือกห้องที่จะรับบริบทและทำต่อ');
    if (action === 'close') askAction({ action, taskId: state.taskId }, 'ปิดแชท', 'แชทนี้จะพิมพ์ต่อไม่ได้');
    if (action === 'archive') askAction({ action, taskId: state.taskId }, 'เก็บแชท', 'แชทนี้จะหายจากรายการห้องและเปิดได้แบบอ่านอย่างเดียว');
  });
  $('#of-confirm-form').addEventListener('submit', (event) => { event.preventDefault(); void submitPendingAction(); });
  $('#of-confirm-cancel').addEventListener('click', () => { pendingAction = null; ($('#of-confirm-dialog') as HTMLDialogElement).close(); });
  document.addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button.of-send'); if (button && !button.disabled) void onFileSend(button); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.clearTimeout(state.polling); else { void incrementalRefresh().catch(() => {}); schedulePoll(); } });
}

async function boot() {
  if (DEMO) return;
  wire();
  try {
    await fullRefresh();
    if (initialRoomSlug) { state.roomSlug = initialRoomSlug; await hydrateRoom(initialRoomSlug); setMobileStage('room'); }
    if (initialTaskId) { await hydrateTask(initialTaskId); await selectTask(initialTaskId); setMobileStage('chat'); }
  } catch (error) { showError(error); }
  schedulePoll();
}

onAuthed('office-app', 'office:authed', boot);

if (DEMO) {
  void import('./demo').then(({ DEMO_OFFICE }) => {
    document.getElementById('wr-gate')?.classList.add('hidden');
    $('#office-app').classList.remove('hidden');
    state.data = DEMO_OFFICE;
    wire(); renderAll();
    if (initialRoomSlug) setMobileStage('room');
    if (initialTaskId) setMobileStage('chat');
  }).catch(showError);
}
