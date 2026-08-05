import {
  getInitialRoute,
  getNextLocation,
  getPreviousLocation,
  getReasonLabel,
  getResumeLabel,
  getStatusLabel,
  getStepByLocation,
} from './ui-model.js';

const PHASE_ACCENTS = {
  prepare: { color: '#24749a', soft: '#e1eff3', number: '01' },
  build: { color: '#d06442', soft: '#f7e5dc', number: '02' },
  sell: { color: '#dd4155', soft: '#f9e0e4', number: '03' },
  arm: { color: '#6a567e', soft: '#ebe4f1', number: '04' },
};

const FIELD_LABELS = {
  shopName: 'ชื่อร้าน',
  businessType: 'ประเภทธุรกิจ',
  catalogSource: 'แหล่งข้อมูลสินค้า',
  testMessage: 'ข้อความทดสอบ',
  expectedReply: 'คำตอบที่คาดหวัง',
  knowledgeLocation: 'ที่อยู่สมองร้าน',
  handoffRule: 'กติกาส่งต่อคน',
  tone: 'น้ำเสียง',
  qualificationQuestions: 'คำถามคัดกรอง',
  discountCeiling: 'เพดานส่วนลด',
  allowedGift: 'ของแถม/ข้อเสนอสำรอง',
  appointmentPolicy: 'นโยบายนัดหมาย',
  productName: 'ชื่อสินค้า',
  quoteFields: 'ช่องข้อมูลในใบเสนอราคา',
  paymentPolicy: 'นโยบายรับชำระ',
  reviewOwner: 'ผู้ตรวจหลักฐาน',
  evidenceRule: 'กติกาตรวจหลักฐาน',
  reportTime: 'เวลารายงาน',
  alertOwner: 'ผู้รับแจ้งเตือน',
  memoryRetention: 'อายุการเก็บ memory',
  quotaThreshold: 'เพดานแจ้งเตือน',
  phase: 'phase ที่กำลังตรวจ',
  step: 'step ที่กำลังตรวจ',
  symptom: 'อาการที่พบ',
  expectedResult: 'ผลที่คาดหวัง',
};

const DEFAULT_FIELD_VALUES = {
  businessType: 'ร้านโซฟาสั่งทำและเฟอร์นิเจอร์',
  catalogSource: 'ไฟล์ catalog.md ใน GitHub ของร้าน',
  testMessage: 'สนใจโซฟา L-shape ขอราคาและระยะเวลาผลิตครับ',
  expectedReply: 'ตอบราคา 38,000 บาท พร้อมแจ้งว่าปรับผ้า/ขนาดได้ และใช้เวลาประมาณ 15–20 วัน',
  knowledgeLocation: 'GitHub repository ของร้าน /knowledge',
  handoffRule: 'ยอดเกิน 50,000 บาท หรือ AI ไม่มีข้อมูลยืนยัน',
  tone: 'สุภาพ เป็นกันเอง กระชับ และถามทีละคำถาม',
  qualificationQuestions: 'ขนาดพื้นที่ งบประมาณ และวันที่อยากเริ่มใช้งาน',
  discountCeiling: 'ลดได้สูงสุด 5%',
  allowedGift: 'ของแถมหรือค่าจัดส่งตามเงื่อนไขร้าน',
  appointmentPolicy: 'เก็บวันเวลาและรอเจ้าหน้าที่ยืนยัน',
  productName: 'โซฟา L-shape',
  quoteFields: 'รายการ ราคา มัดจำ ระยะเวลาผลิต และวันหมดอายุใบเสนอราคา',
  paymentPolicy: 'มัดจำ 50% ก่อนเริ่มผลิต',
  reviewOwner: 'เจ้าของร้านหรือผู้ดูแลการเงิน',
  evidenceRule: 'ตรวจยอดและชื่อบัญชีก่อนยืนยันทุกครั้ง',
  reportTime: '09:00 น. เวลาไทย',
  alertOwner: 'เจ้าของร้าน',
  memoryRetention: 'ลบหรือทบทวนทุก 30 วัน',
  quotaThreshold: '80% ของงบที่ตั้งไว้',
  phase: 'SELL',
  step: 'S1',
  symptom: 'LINE รับข้อความแต่ไม่มีคำตอบกลับ',
  expectedResult: 'เห็น event เข้า Worker และมีคำตอบกลับหนึ่งครั้ง',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toText(value) {
  return escapeHtml(value).replaceAll('\n', '<br />');
}

function phaseAccent(phaseId) {
  return PHASE_ACCENTS[phaseId] ?? { color: '#072b4e', soft: '#e8eef2', number: '—' };
}

function phaseById(playbook, phaseId) {
  return playbook.phases.find((phase) => phase.id === phaseId) ?? playbook.phases[0];
}

function stepIndex(progress, stepId) {
  return progress.steps.findIndex((step) => step.id === stepId);
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
}

function formatCount(value, label) {
  return `${value} ${label}`;
}

function statePromptValues(engine, playbook, prompt) {
  const state = engine.getState();
  const example = playbook.exampleBusiness;
  const profile = state.shopProfile ?? {};
  const exampleValues = {
    shopName: example.name,
    businessType: example.businessType,
    discountCeiling: example.commercialRules.discountCeiling,
    allowedGift: example.commercialRules.fallbackOffer,
    appointmentPolicy: 'เก็บวันเวลาและรอเจ้าหน้าที่ยืนยัน',
    handoffRule: example.handoffRules.join(' / '),
    paymentPolicy: example.commercialRules.deposit,
    productName: example.catalog[0]?.name,
  };
  return Object.fromEntries((prompt.editableFields ?? []).map((field) => [
    field,
    profile[field] || exampleValues[field] || DEFAULT_FIELD_VALUES[field] || '',
  ]));
}

function renderProgressRing(progress) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, Number(progress.overall.percentage) || 0)) / 100) * circumference;
  return `<div class="progress-ring" aria-label="ความคืบหน้า ${escapeHtml(progress.overall.percentage)} เปอร์เซ็นต์">
    <svg viewBox="0 0 44 44" aria-hidden="true"><circle class="progress-ring-track" cx="22" cy="22" r="${radius}"></circle><circle class="progress-ring-value" cx="22" cy="22" r="${radius}" stroke-dasharray="${dash} ${circumference - dash}" transform="rotate(-90 22 22)"></circle></svg>
    <div class="progress-ring__inner"><strong>${escapeHtml(progress.overall.percentage)}%</strong><span>เสร็จแล้ว</span></div>
  </div>`;
}

function renderStatusPill(status) {
  return `<span class="status-pill status-${escapeHtml(status)}"><span class="status-dot"></span>${escapeHtml(getStatusLabel(status))}</span>`;
}

function renderPhaseRail(playbook, progress, route) {
  return `<aside class="phase-rail" aria-label="เส้นทางการทำงาน">
    <div class="rail-kicker">PLAYBOOK / 01</div>
    <a class="rail-brand" href="#home" data-route="home" aria-label="กลับภาพรวม Playbook">
      <span class="rail-mark">P</span><span><strong>LINE AI</strong><small>Sales Agent</small></span>
    </a>
    <div class="rail-rule"></div>
    <nav class="phase-list">
      ${playbook.phases.map((phase, index) => {
        const item = progress.phases.find((entry) => entry.id === phase.id);
        const accent = phaseAccent(phase.id);
        const active = route.phaseId === phase.id;
        return `<a href="#${phase.id}/${phase.steps[0].id}" data-route="step" data-phase-id="${phase.id}" data-step-id="${phase.steps[0].id}" class="phase-item ${active ? 'is-active' : ''}" style="--phase-color:${accent.color};--phase-soft:${accent.soft}" aria-current="${active ? 'step' : 'false'}">
          <span class="phase-number">${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
          <span class="phase-copy"><strong>${escapeHtml(phase.label)}</strong><small>${escapeHtml(item?.title ?? phase.title)}</small><em>${escapeHtml(item?.completion?.requiredCompleted ?? 0)}/${escapeHtml(item?.completion?.required ?? 0)} งาน</em></span>
          <span class="phase-state ${item?.status === 'working' ? 'is-done' : ''}" aria-hidden="true">${item?.status === 'working' ? '✓' : ''}</span>
        </a>`;
      }).join('')}
    </nav>
    <div class="rail-bottom">
      <button class="rail-utility" type="button" data-route="progress"><span>▦</span>ความคืบหน้าทั้งหมด</button>
      <button class="rail-utility" type="button" data-route="troubleshooting"><span>?</span>ศูนย์แก้ปัญหา</button>
      <p class="rail-byline">สร้างโดย<br /><strong>@pun_nattapatch</strong></p>
    </div>
  </aside>`;
}

function renderMobileHeader(progress) {
  return `<header class="mobile-header">
    <a href="#home" data-route="home" class="mobile-brand"><span class="rail-mark">P</span><span><strong>LINE AI</strong><small>Sales Agent</small></span></a>
    <div class="mobile-header-actions"><span class="mobile-percent">${escapeHtml(progress.overall.percentage)}%</span><button class="icon-button" type="button" data-route="progress" aria-label="ดูความคืบหน้า">▦</button></div>
  </header>`;
}

function renderTopbar(playbook, progress, route) {
  const phase = route.phaseId ? phaseById(playbook, route.phaseId) : null;
  return `<div class="app-topbar">
    <div class="breadcrumb"><span>PLAYBOOK</span><span class="breadcrumb-slash">/</span><strong>${escapeHtml(route.view === 'home' ? 'ภาพรวม' : route.view === 'progress' ? 'ความคืบหน้า' : route.view === 'troubleshooting' ? 'ศูนย์แก้ปัญหา' : phase?.label ?? '')}</strong></div>
    <div class="topbar-actions"><span class="save-status" aria-live="polite">บันทึกในเครื่องอัตโนมัติ</span><button class="text-button" type="button" data-action="export-backup">สำรองข้อมูล</button><button class="text-button" type="button" data-action="import-backup">นำเข้าข้อมูล</button><input class="visually-hidden" id="backup-file-input" type="file" accept="application/json" aria-label="เลือกไฟล์ backup JSON" /></div>
  </div>`;
}

function renderUtilityRail(playbook, progress, route, searchFilters) {
  const resume = progress.resume;
  const phase = resume.phaseId ? phaseById(playbook, resume.phaseId) : null;
  const step = resume.phaseId && resume.stepId ? getStepByLocation(progress, resume.phaseId, resume.stepId) : null;
  return `<aside class="utility-rail" aria-label="เครื่องมือช่วยทำตาม">
    <section class="utility-section utility-progress">
      <div class="utility-heading"><span>สถานะงาน</span><button type="button" class="mini-link" data-route="progress">ดูทั้งหมด →</button></div>
      <div class="utility-progress-row">${renderProgressRing(progress)}<div><strong>${escapeHtml(formatCount(progress.overall.requiredCompleted, 'งาน'))}</strong><span>จาก ${escapeHtml(formatCount(progress.overall.required, 'งานที่ต้องทำ'))}</span><small>${escapeHtml(progress.overall.ready ? 'พร้อมยืนยันหมุดหมาย' : 'ทำทีละงานตามลำดับ')}</small></div></div>
    </section>
    <section class="utility-section resume-card">
      <div class="utility-heading"><span>ทำต่อจากจุดนี้</span><span class="eyebrow coral">NEXT</span></div>
      <p>${escapeHtml(getReasonLabel(resume.reason))}</p>
      <strong>${escapeHtml(step?.title ?? (phase?.title ?? 'เริ่มจากภาพรวม'))}</strong>
      ${resume.phaseId && resume.stepId ? `<button class="primary-button compact" type="button" data-route="step" data-phase-id="${escapeHtml(resume.phaseId)}" data-step-id="${escapeHtml(resume.stepId)}">${escapeHtml(getResumeLabel(resume, playbook))} <span>→</span></button>` : ''}
    </section>
    <section class="utility-section search-section">
      <label class="utility-heading" for="playbook-search"><span>ค้นหาใน Playbook</span><span class="search-key">⌘ K</span></label>
      <div class="search-field"><span aria-hidden="true">⌕</span><input id="playbook-search" type="search" placeholder="เช่น webhook, ส่วนลด" autocomplete="off" data-action="search" /><kbd>⌘K</kbd></div>
      <div class="search-filters"><select id="search-phase-filter" aria-label="กรองตาม phase" data-action="search-filter"><option value="">ทุก phase</option>${playbook.phases.map((phase) => `<option value="${escapeHtml(phase.id)}" ${searchFilters.phaseId === phase.id ? 'selected' : ''}>${escapeHtml(phase.label)}</option>`).join('')}</select><select id="search-status-filter" aria-label="กรองตามสถานะ" data-action="search-filter"><option value="">ทุกสถานะ</option><option value="not-started" ${searchFilters.status === 'not-started' ? 'selected' : ''}>ยังไม่เริ่ม</option><option value="in-progress" ${searchFilters.status === 'in-progress' ? 'selected' : ''}>กำลังทำ</option><option value="needs-attention" ${searchFilters.status === 'needs-attention' ? 'selected' : ''}>ต้องแก้ก่อน</option><option value="working" ${searchFilters.status === 'working' ? 'selected' : ''}>ทำงานได้</option></select><select id="search-type-filter" aria-label="กรองตามประเภท" data-action="search-filter"><option value="">ทุกชนิด</option><option value="step" ${searchFilters.type === 'step' ? 'selected' : ''}>Step</option><option value="prompt" ${searchFilters.type === 'prompt' ? 'selected' : ''}>Prompt</option></select></div>
      <div id="search-results" class="search-results" aria-live="polite"></div>
    </section>
    <section class="utility-section safety-note"><span class="safety-icon">!</span><div><strong>กติกาความปลอดภัย</strong><p>ห้ามใส่ token, secret หรือรหัสผ่านลงในข้อมูลร้านและ prompt</p></div></section>
  </aside>`;
}

function renderHome(playbook, progress) {
  const resume = progress.resume;
  const resumeStep = resume.phaseId && resume.stepId ? getStepByLocation(progress, resume.phaseId, resume.stepId) : null;
  return `<div class="view home-view">
    <section class="home-intro">
      <div class="eyebrow">GUIDED PLAYBOOK / SALES SYSTEM</div>
      <h1>สร้าง LINE AI Agent<br /><span>ที่ช่วยปิดการขายได้จริง</span></h1>
      <p class="home-lead">คู่มือทำตามทีละขั้น ตั้งแต่จัดข้อมูลร้าน → เชื่อม LINE → ฝึกบทสนทนา → วัดผลจากงานจริง</p>
      <div class="home-meta"><span>โดย ${escapeHtml(playbook.byline)}</span><span class="meta-divider"></span><span>ทำตามได้ในร้านจริง</span></div>
    </section>
    <section class="home-action-panel">
      <div class="action-panel-top"><span class="eyebrow">YOUR NEXT MOVE</span><span class="stamp">${escapeHtml(progress.overall.percentage)}% WORKING</span></div>
      <h2>${escapeHtml(resumeStep?.title ?? 'เริ่มจากการตั้งข้อมูลร้าน')}</h2>
      <p>${escapeHtml(getReasonLabel(resume.reason))} — ทำเครื่องหมายเมื่อทำเสร็จ แล้วระบบจะบันทึกไว้ในเครื่องนี้</p>
      <button class="primary-button" type="button" data-route="step" data-phase-id="${escapeHtml(resume.phaseId ?? 'prepare')}" data-step-id="${escapeHtml(resume.stepId ?? 'P0')}">${escapeHtml(getResumeLabel(resume, playbook))} <span>→</span></button>
    </section>
    <section class="home-section journey-section">
      <div class="section-heading"><div><span class="eyebrow">THE JOURNEY</span><h2>เดินทางจากข้อมูล → บทสนทนา → ยอดขาย</h2></div><button type="button" class="mini-link" data-route="progress">ดูความคืบหน้า →</button></div>
      <div class="journey-line">
        ${playbook.phases.map((phase, index) => {
          const item = progress.phases.find((entry) => entry.id === phase.id);
          const accent = phaseAccent(phase.id);
          return `<button type="button" class="journey-node ${item?.status === 'working' ? 'is-complete' : ''}" data-route="step" data-phase-id="${escapeHtml(phase.id)}" data-step-id="${escapeHtml(phase.steps[0].id)}" style="--phase-color:${accent.color};--phase-soft:${accent.soft}"><span class="journey-node-number">${escapeHtml(String(index + 1).padStart(2, '0'))}</span><strong>${escapeHtml(phase.label)}</strong><small>${escapeHtml(phase.title)}</small><em>${escapeHtml(item?.completion?.requiredCompleted ?? 0)}/${escapeHtml(item?.completion?.required ?? 0)} งาน ${item?.status === 'working' ? '✓' : ''}</em></button>${index < playbook.phases.length - 1 ? '<span class="journey-connector" aria-hidden="true">→</span>' : ''}`;
        }).join('')}
      </div>
    </section>
    <section class="home-section architecture-section">
      <div class="section-heading"><div><span class="eyebrow">THE SYSTEM</span><h2>เข้าใจบทบาทก่อนต่อเครื่องมือ</h2></div><span class="section-note">แยกให้ชัด แล้วแก้ได้เร็ว</span></div>
      <div class="architecture-flow"><div class="architecture-node"><span class="architecture-label">01 / BUILDER</span><strong>คนออกแบบระบบ</strong><small>สร้าง workflow, ตรวจ log, ปรับกติกา</small></div><span class="architecture-arrow">→</span><div class="architecture-node featured"><span class="architecture-label">02 / WORKER</span><strong>ตัวแทนขาย AI</strong><small>อ่านสมองร้าน แล้วคุยกับลูกค้า</small></div><span class="architecture-arrow">→</span><div class="architecture-node"><span class="architecture-label">03 / LINE</span><strong>หน้าร้านสนทนา</strong><small>รับความต้องการและส่งต่อเมื่อถึงจุด</small></div></div>
    </section>
    <section class="home-section before-start-section">
      <div class="section-heading"><div><span class="eyebrow">BEFORE YOU START</span><h2>กติกา 4 ข้อของ Playbook นี้</h2></div></div>
      <div class="rule-list"><div><span>01</span><p><strong>เริ่มจากข้อมูลจริง</strong><small>อย่าเริ่มจาก prompt ที่ยังไม่มีราคาหรือเงื่อนไขรองรับ</small></p></div><div><span>02</span><p><strong>AI ไม่เดาเรื่องสำคัญ</strong><small>ไม่มั่นใจให้ส่งต่อคน ไม่แต่งข้อมูลเพื่อให้ดูตอบได้</small></p></div><div><span>03</span><p><strong>ทุกงานมีหลักฐาน</strong><small>เช็กผลด้วยข้อความ, log หรือภาพหน้าจอที่ย้อนดูได้</small></p></div><div><span>04</span><p><strong>ข้อมูลลับอยู่นอกเอกสาร</strong><small>Playbook นี้เก็บเฉพาะข้อมูลที่ปลอดภัยและแก้ไขได้</small></p></div></div>
    </section>
  </div>`;
}

function renderChecklist(step, state) {
  const completed = new Set(state.completedItemIds ?? []);
  return `<section class="step-section checklist-section"><div class="section-heading compact-heading"><div><span class="eyebrow">DO / CHECKLIST</span><h2>ลงมือทำทีละข้อ</h2></div><span class="completion-count">${escapeHtml(step.completion.completed)}/${escapeHtml(step.completion.total)} เสร็จแล้ว</span></div><div class="checklist-list">${step.actionItems.map((item, index) => `<label class="check-item ${completed.has(item.id) ? 'is-checked' : ''}"><input type="checkbox" data-action="toggle-check" data-item-id="${escapeHtml(item.id)}" ${completed.has(item.id) ? 'checked' : ''} /><span class="check-box" aria-hidden="true">✓</span><span class="check-copy"><strong>${escapeHtml(String(index + 1).padStart(2, '0'))}</strong><span>${toText(item.label)}</span>${item.required ? '<em>จำเป็น</em>' : '<em class="optional">เสริม</em>'}</span></label>`).join('')}</div></section>`;
}

function renderProfileFields(engine, playbook) {
  const state = engine.getState();
  const example = playbook.exampleBusiness;
  const fields = [
    ['shopName', 'ชื่อร้าน', state.shopProfile?.shopName || example.name],
    ['businessType', 'ประเภทธุรกิจ', state.shopProfile?.businessType || example.businessType],
    ['catalogSource', 'แหล่งข้อมูลสินค้า', state.shopProfile?.catalogSource || DEFAULT_FIELD_VALUES.catalogSource],
  ];
  return `<section class="shop-fields"><div class="section-heading compact-heading"><div><span class="eyebrow">SAFE SHOP CONTEXT</span><h2>ข้อมูลร้านที่แก้ไขได้</h2></div><span class="field-safe">ไม่รับข้อมูลลับ</span></div><p class="section-intro">เริ่มจากตัวอย่างบ้านโซฟา แล้วแก้ให้เป็นร้านของคุณ ข้อมูลนี้เก็บไว้ใน browser เครื่องนี้เท่านั้น</p><div class="field-grid">${fields.map(([field, label, value]) => `<label class="field-label"><span>${escapeHtml(label)}</span><input type="text" value="${escapeHtml(value)}" data-action="save-profile" data-field="${escapeHtml(field)}" /><small>ตัวอย่างที่ปลอดภัยสำหรับการทดลอง</small></label>`).join('')}</div></section>`;
}

function renderPromptBlock(engine, playbook, step) {
  const prompts = playbook.prompts.filter((prompt) => prompt.stepIds.includes(step.id));
  if (!prompts.length) return '';
  const prompt = prompts[0];
  const values = statePromptValues(engine, playbook, prompt);
  const composed = engine.composePrompt(prompt.id, values);
  return `<section class="step-section prompt-section"><div class="section-heading compact-heading"><div><span class="eyebrow">PROMPT COMPOSER / ${escapeHtml(prompt.id)}</span><h2>${escapeHtml(prompt.title)}</h2></div><button type="button" class="mini-link" data-action="copy-prompt" data-prompt-id="${escapeHtml(prompt.id)}">คัดลอก prompt</button></div><p class="section-intro">แก้เฉพาะช่องที่เกี่ยวกับร้านคุณ แล้วคัดลอกไปใช้กับ Builder ได้ทันที <strong>ไม่ใส่ token หรือรหัสผ่าน</strong></p><div class="prompt-fields">${prompt.editableFields.map((field) => `<label class="field-label"><span>${escapeHtml(FIELD_LABELS[field] ?? field)}</span><input type="text" value="${escapeHtml(values[field])}" data-prompt-field="${escapeHtml(field)}" data-prompt-id="${escapeHtml(prompt.id)}" /></label>`).join('')}</div><div class="prompt-output" data-prompt-output-id="${escapeHtml(prompt.id)}"><div class="prompt-output-head"><span>PREVIEW</span><span class="prompt-safe">✓ ปลอดภัยต่อการแชร์</span></div><pre>${toText(composed.text)}</pre><button type="button" class="copy-corner" data-action="copy-prompt" data-prompt-id="${escapeHtml(prompt.id)}" aria-label="คัดลอก prompt">⧉</button></div><p class="safety-caption">${escapeHtml(prompt.safetyNote)}</p></section>`;
}

function renderCheckFixProof(step) {
  return `<section class="step-section check-section"><div class="three-column-panels"><article class="micro-panel check-panel"><span class="panel-index">CHECK</span><h3>รู้ได้อย่างไรว่าผ่าน</h3><p>${toText(step.check)}</p></article><article class="micro-panel fix-panel"><span class="panel-index">FIX</span><h3>ถ้ายังไม่ผ่าน</h3><div class="fix-list">${step.fixes.map((fix, index) => `<details><summary><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(fix)}</summary><p>แก้ข้อนี้ก่อน แล้วกลับมาทดสอบซ้ำด้วยหลักฐานเดิม</p></details>`).join('')}</div></article><article class="micro-panel proof-panel"><span class="panel-index">PROOF</span><h3>หลักฐานที่ควรเก็บ</h3><p>${toText(step.proof)}</p><span class="proof-stamp">เก็บไว้ในโฟลเดอร์ร้าน</span></article></div></section>`;
}

function renderDependencyWarning(step, progress) {
  const missing = (step.dependsOn ?? []).map((dependency) => progress.steps.find((item) => item.id === dependency)).filter((item) => item && !item.completion.ready);
  if (!missing.length) return '';
  return `<aside class="dependency-warning"><span class="warning-mark">!</span><div><strong>ขั้นนี้ต่อจาก ${escapeHtml(missing.map((item) => item.id).join(' · '))}</strong><p>ยังทำงานก่อนหน้าไม่ครบ เปิดดูได้ แต่ควรกลับไปเก็บหลักฐานของขั้นก่อนก่อนเชื่อมต่อ</p></div><button type="button" class="mini-link" data-route="step" data-phase-id="${escapeHtml(missing[0].phaseId)}" data-step-id="${escapeHtml(missing[0].id)}">กลับไปดู →</button></aside>`;
}

function renderStep(playbook, progress, engine, route) {
  const step = getStepByLocation(progress, route.phaseId, route.stepId) ?? progress.steps[0];
  const phase = phaseById(playbook, step.phaseId);
  const accent = phaseAccent(step.phaseId);
  const previous = getPreviousLocation(playbook, step.phaseId, step.id);
  const next = getNextLocation(playbook, step.phaseId, step.id);
  const state = engine.getState();
  return `<div class="view step-view" style="--phase-color:${accent.color};--phase-soft:${accent.soft}">
    <section class="step-hero"><div class="step-overline"><span class="step-number">${escapeHtml(step.id)}</span><span class="step-phase">${escapeHtml(phase.label)} / ${escapeHtml(String(stepIndex(progress, step.id) + 1).padStart(2, '0'))}</span>${renderStatusPill(step.status)}<button type="button" class="block-button ${step.blocked ? 'is-blocked' : ''}" data-action="toggle-blocked" data-step-id="${escapeHtml(step.id)}">${step.blocked ? 'ปลดจุดติด' : 'ติดจุดนี้'}</button></div><h1>${escapeHtml(step.title)}</h1><div class="step-meta"><span>ผลลัพธ์ของขั้นนี้</span><strong>${escapeHtml(step.proof)}</strong></div></section>
    ${renderDependencyWarning(step, progress)}
    <section class="why-panel"><span class="eyebrow">WHY THIS STEP</span><p>${toText(step.why)}</p><div class="dependency-line">${step.dependsOn?.length ? `ต่อจาก <strong>${escapeHtml(step.dependsOn.join(' · '))}</strong>` : 'จุดเริ่มต้นของระบบ'}<span>•</span>${escapeHtml(formatCount(step.completion.required, 'งานจำเป็น'))}</div></section>
    ${renderChecklist(step, state)}
    ${step.id === 'P0' ? renderProfileFields(engine, playbook) : ''}
    ${renderPromptBlock(engine, playbook, step)}
    ${renderCheckFixProof(step)}
    <section class="milestone-panel"><div><span class="eyebrow">PHASE MILESTONE / ${escapeHtml(phase.label)}</span><h2>${escapeHtml(phase.milestone.title)}</h2><p>${escapeHtml(phase.milestone.proof)}</p></div><div class="milestone-action">${progress.phases.find((item) => item.id === phase.id)?.milestone.confirmed ? '<span class="confirmed-mark">✓ ยืนยันแล้ว</span>' : `<button type="button" class="primary-button compact" data-action="confirm-milestone" data-phase-id="${escapeHtml(phase.id)}" ${progress.phases.find((item) => item.id === phase.id)?.milestone.ready ? '' : 'disabled'}>${progress.phases.find((item) => item.id === phase.id)?.milestone.ready ? 'ยืนยันหมุดหมาย' : 'ทำ checklist ให้ครบก่อน'} <span>→</span></button>`}</div></section>
    <nav class="step-nav" aria-label="นำทางระหว่างขั้น"><button type="button" class="secondary-button" data-route="step" data-phase-id="${escapeHtml(previous?.phaseId ?? '')}" data-step-id="${escapeHtml(previous?.stepId ?? '')}" ${previous ? '' : 'disabled'}>← ก่อนหน้า</button><span>${escapeHtml(step.id)} / ${escapeHtml(String(progress.steps.length).padStart(2, '0'))}</span><button type="button" class="primary-button compact" data-route="step" data-phase-id="${escapeHtml(next?.phaseId ?? '')}" data-step-id="${escapeHtml(next?.stepId ?? '')}" ${next ? '' : 'disabled'}>${next ? 'ขั้นถัดไป →' : 'จบ Playbook'}</button></nav>
  </div>`;
}

function renderProgressView(playbook, progress) {
  return `<div class="view progress-view"><section class="page-heading"><span class="eyebrow">PROGRESS CONTROL</span><h1>ความคืบหน้าที่เห็นภาพเดียว</h1><p>ติดตามงานที่ทำแล้ว จุดที่ต้องแก้ และหมุดหมายที่พร้อมยืนยัน โดยไม่ต้องสมัครสมาชิก</p></section><section class="progress-overview"><div class="progress-overview-ring">${renderProgressRing(progress)}</div><div><span class="eyebrow">OVERALL STATUS</span><h2>${escapeHtml(progress.overall.percentage)}% ของงานจำเป็น</h2><p>${escapeHtml(progress.overall.requiredCompleted)} จาก ${escapeHtml(progress.overall.required)} งานจำเป็นเสร็จแล้ว</p><div class="progress-bar"><span style="width:${escapeHtml(formatPercent(progress.overall.percentage))}"></span></div></div><button type="button" class="secondary-button" data-action="copy-summary">คัดลอกสรุป</button></section><section class="phase-progress-list">${playbook.phases.map((phase) => { const item = progress.phases.find((entry) => entry.id === phase.id); const accent = phaseAccent(phase.id); return `<article class="phase-progress-card" style="--phase-color:${accent.color};--phase-soft:${accent.soft}"><div class="phase-progress-head"><div><span class="phase-number">${escapeHtml(accent.number)}</span><span class="eyebrow">${escapeHtml(phase.label)}</span><h2>${escapeHtml(phase.title)}</h2></div>${renderStatusPill(item.status)}</div><div class="progress-bar"><span style="width:${escapeHtml(item.completion.required ? `${Math.round((item.completion.requiredCompleted / item.completion.required) * 100)}%` : '0%')}"></span></div><div class="phase-progress-foot"><span>${escapeHtml(item.completion.requiredCompleted)}/${escapeHtml(item.completion.required)} งานจำเป็น</span><button type="button" class="mini-link" data-route="step" data-phase-id="${escapeHtml(phase.id)}" data-step-id="${escapeHtml(item.steps.find((step) => step.status !== 'working')?.id ?? phase.steps.at(-1).id)}">เปิด phase →</button></div></article>`; }).join('')}</section><section class="export-panel"><div><span class="eyebrow">LOCAL DATA</span><h2>ข้อมูลของคุณอยู่ในเครื่องนี้</h2><p>ส่งออกเป็นไฟล์ backup หรือ CSV ได้ทุกเมื่อ ไม่มีการส่งข้อมูลขึ้น server<br />หมายเหตุ: โหมด private/incognito อาจล้างข้อมูลเมื่อปิดหน้าต่าง</p></div><div class="export-actions"><button type="button" class="secondary-button" data-action="export-csv">ดาวน์โหลด CSV</button><button type="button" class="secondary-button" data-action="export-backup">ดาวน์โหลด backup</button><button type="button" class="danger-button" data-action="reset">เริ่มใหม่ทั้งหมด</button></div></section></div>`;
}

function renderTroubleshooting(playbook, progress) {
  return `<div class="view troubleshooting-view"><section class="page-heading"><span class="eyebrow">TROUBLESHOOTING DESK</span><h1>ติดตรงไหน ให้เริ่มจากหลักฐาน</h1><p>เลือกอาการที่ใกล้ที่สุด แล้วตรวจทีละข้อก่อนแก้ prompt หรือเปลี่ยนเครื่องมือ</p></section><div class="troubleshooting-grid">${playbook.troubleshooting.map((item) => { const linked = item.stepIds.map((stepId) => progress.steps.find((step) => step.id === stepId)).filter(Boolean); const target = linked[0]; return `<article class="trouble-card"><div class="trouble-card-top"><span class="trouble-id">${escapeHtml(item.id)}</span><span class="trouble-step">${escapeHtml(item.stepIds.join(' · '))}</span></div><h2>${escapeHtml(item.symptom)}</h2><div class="trouble-checks"><span class="eyebrow">CHECK FIRST</span><ul>${item.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join('')}</ul></div><p class="debug-context"><strong>หลักฐานที่ต้องหา:</strong> ${escapeHtml(item.debugPromptContext)}</p><div class="trouble-actions"><button type="button" class="secondary-button compact" data-route="step" data-phase-id="${escapeHtml(target?.phaseId ?? '')}" data-step-id="${escapeHtml(target?.id ?? '')}">ไปที่ ${escapeHtml(target?.id ?? 'step')} →</button><button type="button" class="mini-link" data-action="debug-prompt" data-symptom="${escapeHtml(item.symptom)}" data-step="${escapeHtml(item.stepIds[0])}">เปิด debug prompt</button></div></article>`; }).join('')}</div></div>`;
}

function renderMobileBottom(playbook, progress, route) {
  if (route.view !== 'step') return `<nav class="mobile-bottom-nav"><button type="button" data-route="home"><span>⌂</span>ภาพรวม</button><button type="button" data-route="progress"><span>▦</span>ความคืบหน้า</button><button type="button" data-route="troubleshooting"><span>?</span>แก้ปัญหา</button></nav>`;
  const previous = getPreviousLocation(playbook, route.phaseId, route.stepId);
  const next = getNextLocation(playbook, route.phaseId, route.stepId);
  return `<nav class="mobile-bottom-nav step-bottom"><button type="button" data-route="step" data-phase-id="${escapeHtml(previous?.phaseId ?? '')}" data-step-id="${escapeHtml(previous?.stepId ?? '')}" ${previous ? '' : 'disabled'}>← ก่อนหน้า</button><button type="button" data-route="progress">${escapeHtml(progress.overall.percentage)}% เสร็จ</button><button type="button" data-route="step" data-phase-id="${escapeHtml(next?.phaseId ?? '')}" data-step-id="${escapeHtml(next?.stepId ?? '')}" ${next ? '' : 'disabled'}>${next ? 'ถัดไป →' : 'จบ'}</button></nav>`;
}

function renderSearchResults(engine, query, filters) {
  const value = query.trim();
  if (!value) return '';
  const result = engine.search(value, filters);
  if (!result.items.length) return '<p class="search-empty">ไม่พบคำนี้ใน Playbook</p>';
  return `<div class="search-result-count">พบ ${escapeHtml(result.total)} จุด</div>${result.items.slice(0, 6).map((item) => `<button type="button" class="search-result" data-route="step" data-phase-id="${escapeHtml(item.phaseId)}" data-step-id="${escapeHtml(item.stepId)}"><span>${escapeHtml(item.type === 'prompt' ? 'PROMPT' : item.phaseLabel)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.matchText)}</small></button>`).join('')}`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

function announce(root, message) {
  const live = root.querySelector('[data-live-region]');
  if (live) live.textContent = message;
}

function readPromptValues(root, prompt) {
  return Object.fromEntries(prompt.editableFields.map((field) => [field, root.querySelector(`[data-prompt-id="${CSS.escape(prompt.id)}"][data-prompt-field="${CSS.escape(field)}"]`)?.value ?? '']));
}

function routeHash(route) {
  if (route.view === 'home') return '#home';
  if (route.view === 'progress') return '#progress';
  if (route.view === 'troubleshooting') return '#troubleshooting';
  return `#${route.phaseId}/${route.stepId}`;
}

export function mountPlaybook({ root, playbook, engine }) {
  if (!root || !playbook || !engine) throw new Error('Playbook UI requires root, playbook, and engine');
  let route = getInitialRoute(playbook, engine.getProgress(), window.location.hash);
  let searchQuery = '';
  let searchFilters = {};

  function go(nextRoute, replace = false) {
    route = nextRoute;
    const hash = routeHash(route);
    if (replace) history.replaceState(null, '', hash);
    else history.pushState(null, '', hash);
    render();
    root.querySelector('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function routeFromElement(target) {
    const kind = target.dataset.route;
    if (kind === 'home') return { view: 'home' };
    if (kind === 'progress') return { view: 'progress' };
    if (kind === 'troubleshooting') return { view: 'troubleshooting' };
    if (kind === 'step' && target.dataset.phaseId && target.dataset.stepId) return { view: 'step', phaseId: target.dataset.phaseId, stepId: target.dataset.stepId };
    return null;
  }

  function render() {
    const progress = engine.getProgress();
    root.innerHTML = `<div class="playbook-app"><div data-live-region class="visually-hidden" aria-live="polite"></div>${renderMobileHeader(progress)}<div class="playbook-layout">${renderPhaseRail(playbook, progress, route)}<main class="playbook-main" id="playbook-main" tabindex="-1">${renderTopbar(playbook, progress, route)}${route.view === 'home' ? renderHome(playbook, progress) : route.view === 'progress' ? renderProgressView(playbook, progress) : route.view === 'troubleshooting' ? renderTroubleshooting(playbook, progress) : renderStep(playbook, progress, engine, route)}</main>${renderUtilityRail(playbook, progress, route, searchFilters)}</div>${renderMobileBottom(playbook, progress, route)}</div>`;
    const search = root.querySelector('#playbook-search');
    if (search && searchQuery) {
      search.value = searchQuery;
      root.querySelector('#search-results').innerHTML = renderSearchResults(engine, searchQuery, searchFilters);
    }
  }

  root.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-route], [data-action]');
    if (!target || target.disabled) return;
    const nextRoute = routeFromElement(target);
    if (nextRoute) {
      event.preventDefault();
      go(nextRoute);
      return;
    }
    const action = target.dataset.action;
    try {
      if (action === 'toggle-check') return;
      if (action === 'toggle-blocked') {
        const nextBlocked = !engine.getState().blockedStepIds.includes(target.dataset.stepId);
        engine.setBlocked(target.dataset.stepId, nextBlocked);
        render();
        announce(root, nextBlocked ? 'ทำเครื่องหมายจุดติดแล้ว' : 'ปลดเครื่องหมายจุดติดแล้ว');
      } else if (action === 'confirm-milestone') {
        engine.confirmMilestone(target.dataset.phaseId, true);
        render();
        announce(root, 'ยืนยันหมุดหมายแล้ว');
      } else if (action === 'copy-prompt') {
        const prompt = playbook.prompts.find((item) => item.id === target.dataset.promptId);
        if (!prompt) return;
        const composed = engine.composePrompt(prompt.id, readPromptValues(root, prompt));
        await navigator.clipboard?.writeText(composed.text);
        announce(root, 'คัดลอก prompt แล้ว');
        target.textContent = 'คัดลอกแล้ว ✓';
        setTimeout(() => { if (target.isConnected) target.textContent = 'คัดลอก prompt'; }, 1800);
      } else if (action === 'debug-prompt') {
        const prompt = playbook.prompts.find((item) => item.id === 'DEBUG-01');
        const composed = engine.composePrompt(prompt.id, { phase: route.phaseId?.toUpperCase() || 'SELL', step: target.dataset.step, symptom: target.dataset.symptom, expectedResult: 'เห็นหลักฐานตามลำดับตรวจ' });
        await navigator.clipboard?.writeText(composed.text);
        announce(root, 'คัดลอก debug prompt แล้ว');
      } else if (action === 'copy-summary') {
        await navigator.clipboard?.writeText(engine.copyProgressSummary());
        announce(root, 'คัดลอกสรุปความคืบหน้าแล้ว');
      } else if (action === 'export-csv') {
        downloadFile('line-ai-sales-agent-progress.csv', engine.exportCsv(), 'text/csv;charset=utf-8');
        announce(root, 'ดาวน์โหลด CSV แล้ว');
      } else if (action === 'export-backup') {
        downloadFile('line-ai-sales-agent-backup.json', engine.exportBackup(), 'application/json;charset=utf-8');
        announce(root, 'ดาวน์โหลด backup แล้ว');
      } else if (action === 'import-backup') {
        root.querySelector('#backup-file-input')?.click();
      } else if (action === 'reset') {
        if (window.confirm('ล้างความคืบหน้าและข้อมูลร้านใน browser เครื่องนี้ทั้งหมดหรือไม่?')) {
          engine.reset();
          route = { view: 'home' };
          history.pushState(null, '', '#home');
          render();
          announce(root, 'ล้างข้อมูลแล้ว เริ่มใหม่ได้เลย');
        }
      }
    } catch (error) {
      announce(root, error instanceof Error ? error.message : 'ทำรายการไม่สำเร็จ');
    }
  });

  root.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'backup-file-input') {
      const file = target.files?.[0];
      if (!file) return;
      try {
        const payload = await file.text();
        const preview = engine.previewImport(payload);
        if (!window.confirm(`นำเข้าข้อมูล ${preview.completedItemCount} checklist, ${preview.blockedStepCount} จุดติด และ ${preview.confirmedMilestoneCount} หมุดหมายหรือไม่?`)) return;
        engine.importBackup(payload);
        render();
        announce(root, 'นำเข้าข้อมูลแล้ว');
      } catch (error) {
        announce(root, error instanceof Error ? error.message : 'ไฟล์ backup ใช้ไม่ได้');
      } finally {
        target.value = '';
      }
    } else if (target.dataset.action === 'toggle-check') {
      engine.setChecklistItem(target.dataset.itemId, target.checked);
      render();
      announce(root, target.checked ? 'ทำ checklist ข้อนี้แล้ว' : 'ยกเลิก checklist ข้อนี้แล้ว');
    } else if (target.dataset.action === 'save-profile') {
      try {
        engine.setShopProfile(target.dataset.field, target.value.trim());
        announce(root, `บันทึก${FIELD_LABELS[target.dataset.field] ?? 'ข้อมูล'}แล้ว`);
      } catch (error) {
        target.value = '';
        announce(root, error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลนี้ได้');
      }
    }
  });

  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.action === 'search') {
      searchQuery = target.value;
      const results = root.querySelector('#search-results');
      if (results) results.innerHTML = renderSearchResults(engine, searchQuery, searchFilters);
    } else if (target instanceof HTMLInputElement && target.dataset.promptField) {
      const prompt = playbook.prompts.find((item) => item.id === target.dataset.promptId);
      if (!prompt) return;
      const composed = engine.composePrompt(prompt.id, readPromptValues(root, prompt));
      const output = root.querySelector(`[data-prompt-output-id="${CSS.escape(prompt.id)}"] pre`);
      if (output) output.innerHTML = toText(composed.text);
    }
  });

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || target.dataset.action !== 'search-filter') return;
    if (target.id === 'search-phase-filter') searchFilters = { ...searchFilters, phaseId: target.value || undefined };
    if (target.id === 'search-status-filter') searchFilters = { ...searchFilters, status: target.value || undefined };
    if (target.id === 'search-type-filter') searchFilters = { ...searchFilters, type: target.value || undefined };
    const results = root.querySelector('#search-results');
    if (results) results.innerHTML = renderSearchResults(engine, searchQuery, searchFilters);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      root.querySelector('#playbook-search')?.focus();
    }
  });

  window.addEventListener('hashchange', () => {
    route = getInitialRoute(playbook, engine.getProgress(), window.location.hash);
    render();
  });
  window.addEventListener('popstate', () => {
    route = getInitialRoute(playbook, engine.getProgress(), window.location.hash);
    render();
  });

  render();
  return { getRoute: () => ({ ...route }), render };
}
