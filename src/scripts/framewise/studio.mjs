import { lights, moods, poses, poseTypes, props, rankPoses, samples, scenes } from './playbook.mjs';
import { estimateLight, classifyScene } from './vision.mjs';
import { paintGuide } from './guides.mjs';
import { setupCamera } from './camera.mjs';

const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const svg = name => `<svg aria-hidden="true"><use href="#${name}"></use></svg>`;
const img = $('scene-image');
const sceneBadge = $('scene-badge').lastElementChild;
const poseDialog = $('pose-dialog');
const notesDialog = $('notes-dialog');
const camera = setupCamera(loadPhoto);
const key = 'framewise:saved-poses:v1';
let saved = new Set();
try {
  const value = JSON.parse(localStorage.getItem(key) ?? '[]');
  if (Array.isArray(value)) saved = new Set(value.filter(id => poses.some(pose => pose.id === id)));
} catch { /* Storage can be disabled. */ }

const state = {
  profile: 'men', mood: 'natural', scene: 'cafe', sample: 'cafe',
  light: 'side', props: [...samples[0].props], filter: 'all', activePose: null,
};
let revision = 0;
let photoUrl = null;
let analysisPending = false;
let phase = 'sample';

function pressed(selector, dataKey, value) {
  for (const button of all(selector)) button.setAttribute('aria-pressed', String(button.dataset[dataKey] === value));
}

function report(message = '') {
  $('scene-status').hidden = !message;
  $('scene-status').textContent = message;
}

function visual(pose, badge = false) {
  const art = document.createElement('span');
  art.className = 'pose-art';
  art.style.setProperty('--art', moods[pose.vibe[0]].color);
  if (pose.images) {
    const picture = document.createElement('img');
    picture.src = pose.images[state.profile];
    picture.alt = '';
    picture.loading = badge ? 'eager' : 'lazy';
    art.append(picture);
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;
    canvas.setAttribute('aria-hidden', 'true');
    paintGuide(canvas, pose.guide);
    art.append(canvas);
  }
  if (badge) {
    const flag = document.createElement('span');
    flag.className = 'pose-flag';
    flag.textContent = 'ท่าแนะนำ';
    art.append(flag);
  }
  return art;
}

function poseCard(pose, first) {
  const card = document.createElement('article');
  card.className = 'pose-card';
  const view = document.createElement('button');
  view.className = 'pose-open';
  view.type = 'button';
  view.dataset.pose = pose.id;
  view.setAttribute('aria-label', pose.name);
  view.append(visual(pose, first));
  const info = document.createElement('span');
  info.className = 'pose-info';
  info.innerHTML = `<span class="pose-type">${poseTypes[pose.type]}</span><strong>${pose.name}</strong><small>${pose.english}</small>`;
  view.append(info);
  view.addEventListener('click', () => showPose(pose));

  const bookmark = document.createElement('button');
  bookmark.type = 'button';
  bookmark.className = 'icon-button card-save';
  bookmark.dataset.save = pose.id;
  bookmark.setAttribute('aria-label', `บันทึกท่า ${pose.name}`);
  bookmark.setAttribute('aria-pressed', String(saved.has(pose.id)));
  bookmark.innerHTML = svg('bookmark');
  bookmark.addEventListener('click', () => toggleSaved(pose));
  card.append(view, bookmark);
  return card;
}

function renderRecommendations() {
  $('result-context').textContent = `${scenes[state.scene].label} / ${moods[state.mood].label}`;
  $('recommendations').replaceChildren(...rankPoses(state.scene, state.mood, state.props).slice(0,3)
    .map((pose,i) => poseCard(pose,i === 0)));
  $('light-note-copy').textContent = `${lights[state.light]?.tip ?? scenes[state.scene].tip} ${moods[state.mood].direction}`;
}

function renderLibrary() {
  const root = $('library-grid');
  const list = poses.filter(pose => state.filter === 'all' || pose.type === state.filter || (state.filter === 'saved' && saved.has(pose.id)));
  $('library-count').textContent = `${list.length} ท่า`;
  pressed('[data-filter]', 'filter', state.filter);
  if (list.length) root.replaceChildren(...list.map(pose => poseCard(pose,false)));
  else {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'คุณกดไอคอนที่คั่นบนท่าที่ชอบ แล้วกลับมาดูได้ที่นี่';
    root.replaceChildren(empty);
  }
}

function updateScene() {
  $('scene-select').value = state.scene;
  $('stage-label').textContent = analysisPending ? 'กำลังดูฉาก' : scenes[state.scene].label;
  sceneBadge.textContent = { sample:'ฉากตัวอย่าง', loading:'กำลังดูรูป', guessed:'ฉากที่แอปคาดไว้', manual:'ฉากที่คุณเลือก', unclear:'เลือกประเภทฉากได้' }[phase];
  $('scene-tip').textContent = scenes[state.scene].tip;
  $('light-tag').hidden = !state.light;
  $('light-tag').lastElementChild.textContent = lights[state.light]?.label ?? '';
  $('props-count').textContent = String(state.props.length);
  pressed('[data-sample]', 'sample', state.sample);
  for (const button of all('[data-prop]')) button.setAttribute('aria-pressed', String(state.props.includes(button.dataset.prop)));
  pressed('[data-profile]', 'profile', state.profile);
  pressed('[data-mood]', 'mood', state.mood);
  $('notes-mood').textContent = moods[state.mood].direction;
  renderRecommendations();
}

function showTab(tab) {
  const library = tab === 'library';
  $('studio').hidden = library;
  $('library').hidden = !library;
  $('studio-tab').setAttribute('aria-pressed', String(!library));
  $('library-tab').setAttribute('aria-pressed', String(library));
  if (library) renderLibrary();
  window.scrollTo({ top: 0 });
}

function selectSample(sample) {
  revision++;
  analysisPending = false;
  const old = photoUrl;
  photoUrl = null;
  img.src = sample.image;
  if (old) URL.revokeObjectURL(old);
  img.alt = `ฉากตัวอย่าง${sample.name}`;
  Object.assign(state, { sample: sample.scene, scene: sample.scene, props: [...sample.props], light: sample.light });
  phase = 'sample';
  report();
  updateScene();
}

async function loadPhoto(file) {
  const current = ++revision;
  const nextUrl = URL.createObjectURL(file);
  const source = new Image();
  source.src = nextUrl;
  try {
    await source.decode();
    if (!source.naturalWidth) throw new Error('Empty image');
  } catch {
    URL.revokeObjectURL(nextUrl);
    if (current === revision) {
      if (analysisPending) {
        analysisPending = false;
        phase = 'unclear';
        state.scene = 'other';
        updateScene();
      }
      report('คุณลองเลือกรูป JPEG, PNG หรือ WebP ที่เปิดได้บนเครื่องนี้');
    }
    return;
  }
  if (current !== revision) { URL.revokeObjectURL(nextUrl); return; }
  const old = photoUrl;
  photoUrl = nextUrl;
  img.src = photoUrl;
  img.alt = 'ภาพฉากของคุณ';
  if (old) URL.revokeObjectURL(old);
  state.sample = null;
  state.scene = 'other';
  state.props = [];
  state.light = estimateLight(source);
  phase = 'loading';
  analysisPending = true;
  report('Framewise กำลังดูรูปในเบราว์เซอร์ การเปิดครั้งแรกอาจใช้เวลาสักครู่');
  updateScene();
  try {
    const scene = await classifyScene(source);
    if (current !== revision) return;
    state.scene = scene;
    phase = scene === 'other' ? 'unclear' : 'guessed';
    report(scene === 'other' ? 'คุณเลือกประเภทฉากด้านล่างได้ เพราะแอปยังอ่านสถานที่จากรูปนี้ได้ไม่ชัด' : 'คุณเปลี่ยนประเภทฉากและระบุของที่มีจริงได้ด้านล่าง');
  } catch {
    if (current !== revision) return;
    phase = 'unclear';
    report('Framewise เปิดตัววิเคราะห์ฉากไม่ได้ คุณยังเลือกประเภทฉากด้านล่างได้');
  } finally {
    if (current === revision) {
      analysisPending = false;
      updateScene();
    }
  }
}

function refreshSavedButtons() {
  for (const button of all('[data-save]')) button.setAttribute('aria-pressed', String(saved.has(button.dataset.save)));
  if (state.activePose) {
    const isSaved = saved.has(state.activePose.id);
    $('save-pose').setAttribute('aria-pressed', String(isSaved));
    $('save-pose').lastElementChild.textContent = isSaved ? 'บันทึกแล้ว' : 'บันทึกท่า';
  }
}

function toggleSaved(pose) {
  if (saved.has(pose.id)) saved.delete(pose.id);
  else saved.add(pose.id);
  try { localStorage.setItem(key, JSON.stringify([...saved])); } catch { /* Keep the current session usable. */ }
  if (!$('library').hidden && state.filter === 'saved' && !poseDialog.open) {
    renderLibrary();
    document.querySelector('[data-filter=saved]').focus();
  }
  refreshSavedButtons();
}

function showPose(pose) {
  state.activePose = pose;
  $('pose-visual').replaceChildren(visual(pose));
  $('pose-type').textContent = `${poseTypes[pose.type]} / ${moods[pose.vibe[0]].label}`;
  $('pose-title').textContent = pose.name;
  $('subject-cue').textContent = pose.subject;
  $('camera-cue').textContent = pose.camera;
  $('pose-needs').hidden = !pose.needs.length;
  $('pose-needs').textContent = `ท่านี้ใช้${pose.needs.map(id => props[id]).join('และ')}`;
  refreshSavedButtons();
  poseDialog.showModal();
}

$('home').onclick = $('studio-tab').onclick = () => showTab('studio');
$('browse-library').onclick = $('library-tab').onclick = () => showTab('library');
$('notes-open').onclick = () => notesDialog.showModal();
$('camera-scene').onclick = () => camera.open();
$('file-button').onclick = () => $('scene-file').click();
$('scene-file').onchange = event => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (file) void loadPhoto(file);
};
$('scene-select').onchange = event => {
  revision++;
  analysisPending = false;
  state.scene = event.target.value;
  phase = 'manual';
  report();
  updateScene();
};
for (const button of all('[data-sample]')) button.onclick = () => selectSample(samples.find(sample => sample.scene === button.dataset.sample));
for (const button of all('[data-prop]')) button.onclick = () => {
  const id = button.dataset.prop;
  state.props = state.props.includes(id) ? state.props.filter(prop => prop !== id) : [...state.props, id];
  updateScene();
};
for (const button of all('[data-profile]')) button.onclick = () => {
  state.profile = button.dataset.profile;
  updateScene();
  if (!$('library').hidden) renderLibrary();
};
for (const button of all('[data-mood]')) button.onclick = () => {
  state.mood = button.dataset.mood;
  updateScene();
};
for (const button of all('[data-filter]')) button.onclick = () => {
  state.filter = button.dataset.filter;
  renderLibrary();
};
for (const button of all('[data-close]')) button.onclick = () => button.closest('dialog').close();
$('save-pose').onclick = () => toggleSaved(state.activePose);
$('use-pose').onclick = () => {
  poseDialog.close();
  camera.open(state.activePose);
};
poseDialog.addEventListener('close', () => {
  if (!$('library').hidden && state.filter === 'saved') renderLibrary();
});
updateScene();
