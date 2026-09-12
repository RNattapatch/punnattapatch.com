const worksheet = document.querySelector('#work-form');
const errorBox = document.querySelector('#work-error');
const resultCard = document.querySelector('#result-card');
const resultPercent = document.querySelector('[data-result-percent]');
const resultTitle = document.querySelector('[data-result-title]');
const resultAdvice = document.querySelector('[data-result-advice]');
const resultNote = document.querySelector('[data-result-note]');
const resultFraction = document.querySelector('[data-result-fraction]');
const MIN_TASKS = 3; // ต่ำกว่านี้ เปอร์เซ็นต์จะเหวี่ยงจนไม่มีความหมาย (ติ๊กข้อเดียว = 100%)
const copy = JSON.parse(document.querySelector('#result-copy').textContent);

function classifyResult(aiShare) {
  if (aiShare >= 0.6) return copy.high;
  if (aiShare >= 0.3) return copy.mid;
  return copy.low;
}

function renderResult(selectedTasks) {
  const aiTasks = selectedTasks.filter((task) => task.dataset.zone === 'ai').length;
  const aiShare = aiTasks / selectedTasks.length;
  const percent = Math.round(aiShare * 100);
  const result = classifyResult(aiShare);

  resultPercent.textContent = `${percent}%`;
  if (resultFraction) resultFraction.textContent = `${aiTasks} จาก ${selectedTasks.length}`;
  resultTitle.textContent = result.title;
  resultAdvice.textContent = result.advice;
  resultNote.textContent = result.note;
  resultCard.hidden = false;
  resultCard.focus({ preventScroll: true });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resultCard.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
}

worksheet?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selectedTasks = [...worksheet.querySelectorAll('input[type="checkbox"]:checked')];

  errorBox.hidden = true;
  if (selectedTasks.length < MIN_TASKS) {
    resultCard.hidden = true;
    errorBox.hidden = false;
    errorBox.focus();
    return;
  }

  renderResult(selectedTasks);
});

worksheet?.addEventListener('reset', () => {
  window.requestAnimationFrame(() => {
    errorBox.hidden = true;
    resultCard.hidden = true;
    worksheet.querySelector('input[type="checkbox"]')?.focus();
  });
});

document.querySelectorAll('[data-copy-link]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = button.textContent;
      button.textContent = 'คัดลอกลิงก์แล้ว';
      window.setTimeout(() => { button.textContent = original; }, 1800);
    } catch {
      button.textContent = 'คัดลอกไม่ได้ — ใช้เมนูแชร์ของเบราว์เซอร์';
    }
  });
});
