// "ผลย้อนหลัง" verdict-sheet logic (history.mjs) against synthetic runs shaped like publish_review.mjs output.
// Run: node --test tests/growth-lab/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  allItems, bulletParts, compareSides, displayTitle, itemText, filterRuns, fixBrief, isFlat, kindCounts, resolveRef, sheet, tally, verdictInfo, verdictKey,
} from '../../src/scripts/growth-lab/history.mjs';

const carousel = {
  slug: 'carousel-test-v2', kind: 'carousel', title: 'carousel 2 ชุด', headline: 'ทั้งชุดงงเพราะตัวเลขมาก่อนบริบท',
  summary: [
    { label: 'อันดับ', items: [{ ref: 'D-chat', text: 'ดีที่สุด' }, { ref: 'A-ad', text: 'รองลงมา' }] },
    { label: 'สาเหตุที่งงซ้ำ', items: [{ text: 'ไม่อธิบายลูกค้าจำลอง' }] },
    { label: 'กติกาแก้ทุกชุด', items: [{ text: 'บอกผลลัพธ์ใน 2 ใบแรก' }] },
    { label: 'เขียนใหม่/พัก', items: [{ ref: 'A-ad', text: 'เขียนใหม่ตั้งแต่แกน' }] },
    { label: 'โพสต์ก่อน', items: [{ ref: 'D-chat', text: 'โพสต์ก่อนหลังแก้ใบ 2' }] },
  ],
  sections: [
    { title: 'A-ad', intro: '', glossary: '', items: [{ id: 'A-ad', title: 'อย่าเพิ่งยิงแอด', verdict: 'rewrite', winner: false, disagree: true, lead: 'งง', bullets: ['ปก: 2/5 · ไม่ชัด'] }] },
    { title: 'D-chat', intro: '', glossary: '', items: [{ id: 'D-chat', title: 'AI ตอบแชท', verdict: 'fix_small', winner: false, disagree: false, lead: 'ดี', bullets: [] }] },
  ],
  meta: {}, covers: { 'D-chat': 'reviews/carousel-test-v2/D-chat.jpg' },
};

const loop = {
  slug: 'loop-test', kind: 'compare', title: 'เทียบ A/B ทั้ง loop · 2 จุด', headline: 'รั่วที่ความเชื่อใจ',
  summary: [
    { label: 'รูรั่วเรียงจากหนักสุด', items: [{ ref: 'lp', text: '19 จาก 34 คนอยากเห็นหลักฐาน' }] },
    { label: 'แก้ก่อนเปิดแอดกลับ', items: [{ ref: 'lp', text: 'ใส่ผลงานจริงก่อนช่องให้เบอร์' }] },
  ],
  sections: [
    { title: 'หน้าเว็บ', intro: 'รั่วที่ความน่าเชื่อถือ', glossary: '', items: [{ id: 'lp', title: '', verdict: 'B', winner: true, disagree: false, lead: '', bullets: ['B ชัดสุด', 'แก้ต่อ: เหลือทางเดียว'] }] },
    { title: 'ฟอร์ม', intro: '', glossary: '', items: [{ id: 'form', title: '', verdict: 'เสมอ', winner: true, disagree: true, lead: '', bullets: ['สูสี'] }] },
  ],
  meta: { inputs: [
    { id: 'lp-A', pair: 'lp', variant: 'A', title: 'ของจริง', text: 'ข้อความ A' },
    { id: 'lp-B', pair: 'lp', variant: 'B', title: 'ฉบับแก้', text: 'ข้อความ B' },
  ] },
};

test('verdict keys and Thai labels: A/B winners, ties, reel/carousel verdicts, unknowns', () => {
  assert.equal(verdictKey(loop.sections[0].items[0]), 'win:B');
  assert.deepEqual([verdictInfo('win:B').label, verdictInfo('win:B').tone], ['ชนะ: B', 'scale']);
  assert.deepEqual([verdictInfo('win:เสมอ').label, verdictInfo('win:เสมอ').tone], ['เสมอ', 'draft']);
  assert.equal(verdictInfo('fix_then_shoot').label, 'แก้แล้วค่อยถ่าย');
  assert.equal(verdictInfo('drop').tone, 'kill');
  assert.equal(verdictInfo('mystery').label, 'mystery');
  assert.ok(verdictInfo('shoot_now').rank < verdictInfo('drop').rank);
});

test('tally counts from a full row and from the list stub, best verdict first', () => {
  assert.deepEqual(tally(carousel).map((t) => [t.label, t.count]), [['แก้นิดเดียว', 1], ['เขียนใหม่', 1]]);
  assert.deepEqual(tally({ drop: 2, shoot_now: 1 }).map((t) => t.key), ['shoot_now', 'drop']);
  assert.deepEqual(tally(null), []);
});

test('sheet picks the ranking / fix / leak / skip groups and leaves the rest for "อ่านเพิ่ม"', () => {
  const s = sheet(carousel);
  assert.equal(s.pick.label, 'อันดับ');
  assert.equal(s.fix.label, 'กติกาแก้ทุกชุด');
  assert.equal(s.leak.label, 'สาเหตุที่งงซ้ำ');
  assert.equal(s.skip.label, 'เขียนใหม่/พัก');
  assert.deepEqual(s.rest.map((g) => g.label), ['โพสต์ก่อน']);
});

test('an A/B run answers "ใช้ตัวไหน" with its winners', () => {
  const s = sheet(loop);
  assert.equal(s.pick.label, 'ตัวที่ชนะ');
  assert.deepEqual(s.pick.items.map((x) => x.ref), ['lp', 'form']);
  assert.match(s.pick.items[0].text, /^ชนะ: B — B ชัดสุด/);
  assert.equal(s.fix.label, 'แก้ก่อนเปิดแอดกลับ');
  assert.equal(s.leak.label, 'รูรั่วเรียงจากหนักสุด');
});

test('refs resolve to items, including "S1 (H1)" style refs; unknown refs stay plain', () => {
  const reel = { sections: [{ title: 'T4', items: [{ id: 'S1' }, { id: 'S10' }] }] };
  assert.equal(resolveRef(reel, 'S1 (H1)').id, 'S1');
  assert.equal(resolveRef(reel, 'S10').id, 'S10');
  assert.equal(resolveRef(reel, 'ชุด E และ F'), null);
  assert.equal(resolveRef(carousel, 'D-chat').id, 'D-chat');
});

test('compareSides puts the winning variant first and keeps the rest; ties have no winner', () => {
  const sides = compareSides(loop, loop.sections[0].items[0]);
  assert.equal(sides.winner.variant, 'B');
  assert.deepEqual(sides.others.map((o) => o.variant), ['A']);
  assert.equal(compareSides(loop, loop.sections[1].items[0]), null, 'no inputs for that pair');
});

test('cards get a human title and a lead line even when the report gave neither', () => {
  assert.equal(displayTitle(loop, loop.sections[0].items[0]), 'ฉบับแก้', 'A/B: the winner input title');
  assert.equal(displayTitle(carousel, carousel.sections[0].items[0]), 'อย่าเพิ่งยิงแอด');
  assert.equal(displayTitle(loop, loop.sections[1].items[0]), '', 'no inputs → no invented title');
  assert.deepEqual(itemText(loop.sections[0].items[0]), { lead: 'B ชัดสุด', bullets: ['แก้ต่อ: เหลือทางเดียว'] });
  assert.deepEqual(itemText(carousel.sections[0].items[0]), { lead: 'งง', bullets: ['ปก: 2/5 · ไม่ชัด'] });
});

test('flat layout only for one-item-per-section reports (carousel), grouped otherwise', () => {
  assert.equal(isFlat(carousel), true);
  assert.equal(isFlat(loop), false);
  assert.equal(allItems(loop)[1].section, 'ฟอร์ม');
});

test('bullet labels split only when short; the copy brief carries verdict + picks + fixes', () => {
  assert.deepEqual(bulletParts('ปก: 2/5 · ไม่ชัด'), { label: 'ปก', text: '2/5 · ไม่ชัด' });
  assert.equal(bulletParts('ประโยคยาวมากที่ไม่มีป้าย แต่มีเวลา 10:30 อยู่ข้างใน').label, '');
  const brief = fixBrief(loop);
  assert.match(brief, /loop-test/);
  assert.match(brief, /รั่วที่ความเชื่อใจ/);
  assert.match(brief, /ตัวที่ชนะ:\n1\. lp — ชนะ: B/);
  assert.match(brief, /แก้ก่อนเปิดแอดกลับ:\n1\. lp — ใส่ผลงานจริง/);
});

test('list filter by kind and free text; kind chips only for kinds present', () => {
  const runs = [carousel, loop];
  assert.deepEqual(filterRuns(runs, { kind: 'compare' }).map((r) => r.slug), ['loop-test']);
  assert.deepEqual(filterRuns(runs, { query: 'ตัวเลข' }).map((r) => r.slug), ['carousel-test-v2']);
  assert.deepEqual(filterRuns(runs, { query: 'V2' }).map((r) => r.slug), ['carousel-test-v2']);
  assert.deepEqual(kindCounts(runs).map((k) => [k.kind, k.count]), [['compare', 1], ['carousel', 1]]);
});

test('every #id the history screen queries exists in the page, and the tab is wired as the landing view', () => {
  const page = readFileSync(new URL('../../src/pages/app/funnel-lab.astro', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../../src/scripts/growth-lab/history-ui.mjs', import.meta.url), 'utf8');
  const controller = readFileSync(new URL('../../src/scripts/growth-lab/ui.mjs', import.meta.url), 'utf8');
  const storage = readFileSync(new URL('../../src/scripts/growth-lab/storage.mjs', import.meta.url), 'utf8');
  const used = new Set([...ui.matchAll(/\$\('#([a-z0-9-]+)/g)].map((m) => m[1]));
  const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...used].filter((id) => !ids.has(id)), []);
  assert.match(page, /data-view="history" aria-current="page"/);
  assert.match(page, /id="view-workbench" data-screen="workbench"[^>]*hidden/);
  assert.match(controller, /state\.activeView = 'history';/);
  assert.match(storage, /'history'/);
  assert.doesNotMatch(ui, /คอร์ส/);
});

test('the review-runs table is owner-only', () => {
  const migration = readFileSync(new URL('../../supabase/migrations/202610170001_funnel_lab_review_runs.sql', import.meta.url), 'utf8');
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.funnel_lab_review_runs from anon/);
  assert.match(migration, /using \(\(select public\.is_owner\(\)\)\) with check \(\(select public\.is_owner\(\)\)\)/);
});
