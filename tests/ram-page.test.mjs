import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { existsSync } from 'node:fs';

const ramPage = new URL('../public/ram/index.html', import.meta.url);
const ramStyles = new URL('../public/ram/styles.css', import.meta.url);
const ramScript = new URL('../public/ram/app.js', import.meta.url);
const readerScript = new URL('../public/ram/usecases.js', import.meta.url);
const useCasesPage = new URL('../public/ram/usecases.html', import.meta.url);
const useCasesData = new URL('../public/ram/use-cases.json', import.meta.url);

async function source(url) {
  return readFile(url, 'utf8');
}

test('RAM page ships at the static /ram route with a separate use-case reader', async () => {
  const [page, reader, data] = await Promise.all([
    source(ramPage),
    source(useCasesPage),
    source(useCasesData),
  ]);

  assert.match(page, /<title>[^<]*Rethink Business In The Age Of Agentic AI[^<]*<\/title>/);
  assert.match(page, /<link rel="canonical" href="https:\/\/punnattapatch\.com\/ram">/);
  assert.match(reader, /<link rel="canonical" href="https:\/\/punnattapatch\.com\/ram\/usecases">/);
  assert.equal(JSON.parse(data).length, 154);
});

test('RAM page keeps the classroom boundary and collects no personal data', async () => {
  const page = await source(ramPage);
  const scripts = `${await source(ramScript)}\n${await source(readerScript)}`;

  for (const forbidden of ['คอร์ส', 'ปรึกษาฟรี', '/booking', 'localStorage', 'sessionStorage', 'plausible', 'fbq(', 'ttq.']) {
    assert.doesNotMatch(page, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `must not contain ${forbidden}`);
  }
  assert.doesNotMatch(page, /฿|บาท\/?(?:เดือน|ปี)|ราคา/);
  assert.doesNotMatch(scripts, /localStorage|sessionStorage|plausible|fbq\(|ttq\.|fetch\(['"]https?:\/\//i);
  assert.match(page, /เทส 90\/10 คำนวณในเครื่องคุณ ไม่ส่งไปไหน ไม่บันทึก/);
});

test('the first hero action is the slide download and the quiz anchor follows it', async () => {
  const page = await source(ramPage);
  const hero = page.match(/<section[^>]+id="hero"[\s\S]*?<\/section>/)?.[0] ?? '';
  const firstAction = hero.match(/<(?:a|button)\b[\s\S]*?<\/(?:a|button)>/)?.[0] ?? '';

  assert.match(firstAction, /โหลดสไลด์ \(PDF\)/);
  assert.match(hero, /href="#work-test"[^>]*>[\s\S]*?ทดสอบงานของคุณ 90\/10/);
});

test('90/10 worksheet has the exact 16 tasks and zone distribution', async () => {
  const page = await source(ramPage);
  const tasks = [...page.matchAll(/<input[^>]+type="checkbox"[^>]+data-zone="(ai|shared|human)"[^>]*>/g)];
  const counts = tasks.reduce((result, match) => {
    result[match[1]] += 1;
    return result;
  }, { ai: 0, shared: 0, human: 0 });

  assert.equal(tasks.length, 16);
  assert.deepEqual(counts, { ai: 8, shared: 2, human: 6 });
  assert.match(page, /งานที่คุณทำอยู่ส่วนใหญ่ อยู่ในโซนที่ AI ทำได้ดีแล้ว/);
  assert.match(page, /งานคุณอยู่ครึ่งทาง/);
  assert.match(page, /งานคุณอยู่ในโซนที่ AI เสริมได้มากกว่าลดได้/);
  assert.match(page, /นี่คือเครื่องมือสะท้อนงานตัวเอง ไม่ใช่การทำนายอนาคต — วัด exposure ของงาน ไม่ได้วัดว่าใครจะถูกเลิกจ้าง/);
});

test('all required public proof and disclosure sections are present', async () => {
  const page = await source(ramPage);

  for (const id of ['slides', 'work-test', 'read-next', 'thai-systems', 'use-case-library', 'live-systems', 'line-agent', 'privacy', 'build-notes', 'about-pun']) {
    assert.match(page, new RegExp(`id="${id}"`), `missing #${id}`);
  }
  for (const project of ['KP CRM', 'Roost Farm', 'Meysure', 'ช้างไพล์', 'จุดกางเต็นท์', 'CF Shops']) {
    assert.match(page, new RegExp(project), `missing ${project}`);
  }
  assert.match(page, /ตัวเลขตามที่เจ้าของระบบระบุ ยังไม่มีการยืนยันอิสระ/);
  assert.match(page, /ความต่างอยู่ที่ Context ไม่ใช่ที่โมเดลฉลาดขึ้น/);
});

test('public-page metadata and accessibility foundations are present', async () => {
  const [page, styles] = await Promise.all([source(ramPage), source(ramStyles)]);

  assert.match(page, /<html lang="th"/);
  assert.match(page, /<meta name="description"/);
  assert.match(page, /<meta property="og:title"/);
  assert.match(page, /<meta name="twitter:card"/);
  assert.match(page, /<script type="application\/ld\+json">/);
  assert.match(page, /<link rel="icon"/);
  assert.match(page, /class="skip-link" href="#main-content"/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(page, /aria-live="polite"/);
});

test('slide download is a real file, not a disabled button', async () => {
  const page = await source(ramPage);
  const hero = page.match(/<section[^>]+id="hero"[\s\S]*?<\/section>/)?.[0] ?? '';
  const pdf = '/ram/rethink-business-agentic-ai-ram-2026-09-13.pdf';

  assert.doesNotMatch(hero, /disabled/, 'ปุ่มโหลดสไลด์ต้องกดได้ — สไลด์หน้า 2 ของเดคสัญญาไว้ว่าโหลดได้เลย');
  assert.match(hero, new RegExp(`href="${pdf}"[^>]*download`), 'ต้องลิงก์ไปไฟล์ PDF จริงพร้อม download');
  assert.ok(existsSync(new URL(`..${pdf}`.replace('../', '../public/'), import.meta.url)) ||
            existsSync(new URL(`../public${pdf}`, import.meta.url)), 'ไฟล์ PDF ต้องมีอยู่จริงใน public/');
});

test('all five class frames link to image files that exist', async () => {
  const page = await source(ramPage);
  const frames = [...page.matchAll(/href="(\/ram\/frames\/[^"]+\.png)"/g)].map((m) => m[1]);
  const unique = [...new Set(frames)];

  assert.equal(unique.length, 5, 'ต้องมีเฟรมให้โหลด 5 ใบ');
  assert.doesNotMatch(page, /รออัปเดตหลังคลาส/, 'ห้ามเหลือการ์ดที่ยังไม่มีของ');
  for (const src of unique) {
    assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), `ไม่มีไฟล์ ${src}`);
  }
});

test('no third-party script or stylesheet beyond the webfont', async () => {
  for (const file of [ramPage, new URL('../public/ram/usecases.html', import.meta.url)]) {
    const page = await source(file);
    assert.doesNotMatch(page, /cdn\.jsdelivr\.net/, 'ตัด Tailwind browser + DaisyUI ออกแล้ว — หน้านี้ไม่ได้ใช้');
    assert.doesNotMatch(page, /unpkg\.com/, 'ห้ามโหลด lucide แบบไม่ pin version');
  }
});

test('the LINE section does not promise a keyword the bot has no answer for', async () => {
  const page = await source(ramPage);
  assert.doesNotMatch(page, /พิมพ์คำว่า <strong>RAM<\/strong>/, 'ไม่มีคีย์เวิร์ด RAM ใน oa-freebies.json');
  assert.doesNotMatch(page, /เพิ่ม LINE OA แล้วพิมพ์ RAM/);
});
