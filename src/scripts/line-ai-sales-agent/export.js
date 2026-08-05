import { migrateState, SECRET_FIELD_PATTERN, SECRET_VALUE_PATTERNS } from './state.js';

const BACKUP_FORMAT = 'pun-line-ai-sales-agent-backup';
const SUPPORTED_BACKUP_VERSIONS = new Set(['v0', 'v1']);

function safeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {};
  return Object.fromEntries(Object.entries(record).filter(([key, value]) => (
    !SECRET_FIELD_PATTERN.test(key)
    && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    && !SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(String(value)))
  )));
}

export function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safeText) ? `"${safeText.replaceAll('"', '""')}"` : safeText;
}

export function formatSavedAt(value) {
  if (!value) return 'ยังไม่มีการบันทึก';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'ยังไม่มีการบันทึก';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')} ICT`;
}

export function createProgressSummary(playbook, progress, state) {
  const lines = [
    'LINE AI Sales Agent Playbook — Progress Summary',
    'by @pun_nattapatch',
    '',
    `Overall: ${progress.overall.requiredCompleted}/${progress.overall.required} required actions`,
  ];

  for (const phase of progress.phases) {
    lines.push(`${phase.label}: ${phase.status.replace('-', ' ')}`);
  }

  const blocked = progress.steps.filter((step) => step.status === 'needs-attention');
  lines.push('', 'Needs attention:');
  if (blocked.length === 0) lines.push('- ไม่มีขั้นที่ติดอยู่');
  for (const step of blocked) lines.push(`- ${step.phaseLabel} / ${step.id} ${step.title}`);

  const resume = progress.resume;
  const resumeStep = progress.steps.find((step) => step.id === resume.stepId);
  lines.push('', 'Next recommended step:');
  lines.push(resumeStep ? `- ${resume.phaseId?.toUpperCase()} / ${resume.stepId} ${resumeStep.title}` : '- Final System Review');
  lines.push('', `Saved locally: ${formatSavedAt(state.savedAt)}`);
  return lines.join('\n');
}

export function createProgressCsv(playbook, progress, state) {
  const rows = [['phase', 'phase_label', 'step_id', 'step_title', 'action_id', 'action', 'required', 'completed', 'status', 'blocked', 'proof']];
  for (const step of progress.steps) {
    for (const item of step.actionItems) {
      rows.push([
        step.phaseId,
        step.phaseLabel,
        step.id,
        step.title,
        item.id,
        item.label,
        item.required,
        state.completedItemIds.includes(item.id),
        step.status,
        step.blocked,
        step.proof,
      ]);
    }
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function serializeBackup(state, now = () => new Date()) {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: state.version,
    contentVersion: state.contentVersion,
    exportedAt: now().toISOString(),
    progress: {
      completedItemIds: [...state.completedItemIds],
      blockedStepIds: [...state.blockedStepIds],
      confirmedMilestoneIds: [...state.confirmedMilestoneIds],
      savedAt: state.savedAt,
    },
    profile: { shopProfile: safeRecord(state.shopProfile), notes: safeRecord(state.notes) },
    ui: { current: state.current },
  }, null, 2);
}

function parseBackupPayload(payload) {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      throw new Error('Backup is not valid JSON');
    }
  }
  return payload;
}

function backupToState(payload) {
  return {
    version: payload.version,
    contentVersion: payload.contentVersion,
    ...payload.progress,
    ...payload.profile,
    ...payload.ui,
  };
}

export function previewBackup(payload, playbook) {
  const parsed = parseBackupPayload(payload);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Backup must be an object');
  if (parsed.format !== BACKUP_FORMAT) throw new Error('Unsupported backup format');
  if (!SUPPORTED_BACKUP_VERSIONS.has(parsed.version)) throw new Error(`Unsupported backup version: ${parsed.version}`);
  const state = migrateState(backupToState(parsed), playbook);
  return {
    valid: true,
    version: parsed.version,
    contentVersion: state.contentVersion,
    completedItemCount: state.completedItemIds.length,
    blockedStepCount: state.blockedStepIds.length,
    confirmedMilestoneCount: state.confirmedMilestoneIds.length,
    savedAt: state.savedAt,
    state,
  };
}

export function restoreBackup(payload, playbook, now = () => new Date()) {
  const preview = previewBackup(payload, playbook);
  return { ...preview, state: { ...preview.state, savedAt: now().toISOString() } };
}
