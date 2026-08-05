function allSteps(playbook) {
  return (playbook.phases ?? []).flatMap((phase) => (phase.steps ?? []).map((step) => ({
    ...step,
    phaseId: phase.id,
    phaseLabel: phase.label,
  })));
}

function isLocation(playbook, phaseId, stepId) {
  return (playbook.phases ?? []).some((phase) => phase.id === phaseId && phase.steps?.some((step) => step.id === stepId));
}

export function getInitialRoute(playbook, progress, hash = '') {
  const cleanHash = String(hash).replace(/^#/, '');
  if (cleanHash === 'progress') return { view: 'progress' };
  if (cleanHash === 'troubleshooting') return { view: 'troubleshooting' };
  if (cleanHash === 'home' || !cleanHash) return { view: 'home' };

  const [phaseId, stepId] = cleanHash.split('/');
  if (isLocation(playbook, phaseId, stepId)) return { view: 'step', phaseId, stepId };

  if (progress.resume.phaseId && progress.resume.stepId) {
    return { view: 'step', phaseId: progress.resume.phaseId, stepId: progress.resume.stepId };
  }
  return { view: 'home' };
}

export function getStepByLocation(progress, phaseId, stepId) {
  return progress.steps.find((step) => step.phaseId === phaseId && step.id === stepId) ?? null;
}

function locationAt(playbook, index) {
  const step = allSteps(playbook)[index];
  return step ? { phaseId: step.phaseId, stepId: step.id } : null;
}

function indexAt(playbook, phaseId, stepId) {
  return allSteps(playbook).findIndex((step) => step.phaseId === phaseId && step.id === stepId);
}

export function getNextLocation(playbook, phaseId, stepId) {
  const index = indexAt(playbook, phaseId, stepId);
  return index < 0 ? null : locationAt(playbook, index + 1);
}

export function getPreviousLocation(playbook, phaseId, stepId) {
  const index = indexAt(playbook, phaseId, stepId);
  return index <= 0 ? null : locationAt(playbook, index - 1);
}

export function getResumeLabel(resume, playbook) {
  if (!resume?.reason) return 'ดูภาพรวม';
  if (resume.reason === 'blocked') return 'แก้จุดติดก่อน';
  if (resume.reason === 'milestone') return 'ยืนยันหมุดหมาย';
  if (resume.reason === 'final-review') return 'ทบทวนทั้งระบบ';
  if (resume.reason === 'next-phase') {
    const phase = playbook.phases.find((item) => item.id === resume.phaseId);
    return phase ? `เริ่ม ${phase.label}` : 'ไปขั้นถัดไป';
  }
  return 'เริ่มขั้นแรก';
}

export function getStatusLabel(status) {
  return {
    'not-started': 'ยังไม่เริ่ม',
    'in-progress': 'กำลังทำ',
    'needs-attention': 'ต้องแก้ก่อน',
    working: 'ทำงานได้',
  }[status] ?? 'ยังไม่เริ่ม';
}

export function getReasonLabel(reason) {
  return {
    blocked: 'มีจุดติดที่ต้องแก้',
    'required-step': 'ขั้นที่ต้องทำต่อ',
    milestone: 'พร้อมยืนยันหมุดหมาย',
    'next-phase': 'พร้อมไป phase ถัดไป',
    'final-review': 'พร้อมทบทวนทั้งระบบ',
  }[reason] ?? 'จุดที่ควรทำต่อ';
}
