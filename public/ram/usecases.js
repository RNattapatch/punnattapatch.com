const state = {
  items: [],
  query: '',
  category: '',
  businessFunction: '',
};

const queryInput = document.querySelector('#case-query');
const categorySelect = document.querySelector('#case-category');
const functionSelect = document.querySelector('#case-function');
const count = document.querySelector('#case-count');
const results = document.querySelector('#case-results');
const empty = document.querySelector('#case-empty');
const reset = document.querySelector('#case-reset');

function normalise(value) {
  return String(value ?? '').trim().toLocaleLowerCase('th-TH');
}

function matches(item) {
  const searchable = normalise([
    item.name,
    item.summary,
    item.category,
    ...(item.platform ?? []),
    ...(item.businessFunctions ?? []),
    ...(item.tasks ?? []),
  ].join(' '));

  return (!state.query || searchable.includes(state.query))
    && (!state.category || item.categoryKey === state.category)
    && (!state.businessFunction || item.businessFunctions?.includes(state.businessFunction));
}

function appendText(element, value) {
  element.textContent = value;
  return element;
}

function renderCard(item) {
  const card = document.createElement('article');
  card.className = 'reader-card';
  card.dataset.caseCard = '';

  const heading = appendText(document.createElement('h2'), item.name);
  const summary = appendText(document.createElement('p'), item.summary);
  const footer = document.createElement('footer');
  const tags = [item.category, ...(item.businessFunctions ?? []), ...(item.platform ?? [])];

  for (const tag of [...new Set(tags)].filter(Boolean)) {
    const chip = appendText(document.createElement('span'), tag);
    chip.className = 'tag';
    footer.append(chip);
  }

  const link = appendText(document.createElement('a'), 'เปิดแหล่งต้นทาง ↗');
  link.href = item.primarySource ?? item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  card.append(heading, summary, footer, link);
  return card;
}

function render() {
  const filtered = state.items.filter(matches);
  const fragment = document.createDocumentFragment();

  for (const item of filtered) fragment.append(renderCard(item));
  results.replaceChildren(fragment);
  count.textContent = String(filtered.length);
  empty.hidden = filtered.length !== 0;
}

function syncFilters() {
  state.query = normalise(queryInput.value);
  state.category = categorySelect.value;
  state.businessFunction = functionSelect.value;
  render();
}

function populateCategories(items) {
  const categories = new Map(items.map((item) => [item.categoryKey, item.category]));
  const options = [...categories.entries()].sort((a, b) => a[1].localeCompare(b[1], 'th'));

  for (const [value, label] of options) {
    const option = appendText(document.createElement('option'), label);
    option.value = value;
    categorySelect.append(option);
  }
}

queryInput.addEventListener('input', syncFilters);
categorySelect.addEventListener('change', syncFilters);
functionSelect.addEventListener('change', syncFilters);
reset.addEventListener('click', () => {
  queryInput.value = '';
  categorySelect.value = '';
  functionSelect.value = '';
  syncFilters();
  queryInput.focus();
});

try {
  const response = await fetch('/ram/use-cases.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  state.items = await response.json();
  populateCategories(state.items);
  render();
} catch {
  count.textContent = '0';
  empty.hidden = false;
  empty.querySelector('h2').textContent = 'เปิดคลัง use case ไม่สำเร็จ';
  empty.querySelector('p').textContent = 'โหลดหน้านี้ใหม่อีกครั้ง หากยังไม่ขึ้นให้กลับหน้าคลาสแล้วเปิดจากลิงก์เดิม';
}
