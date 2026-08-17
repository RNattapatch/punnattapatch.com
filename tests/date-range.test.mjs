/**
 * เทสต์ขอบเขตช่วงเวลาของตัวกรอง lead — src/scripts/dashboard/date-range.ts
 *
 * ทำไมต้องมี: เลขวันที่คลาดไปวันเดียวไม่มีใครสังเกต ("เดือนนี้" ที่หายวันที่ 1 ไป
 * หรือ "สัปดาห์นี้" ที่เริ่มวันอาทิตย์) ตัวเลขจะดูปกติทุกประการจนกว่าจะเอาไปเทียบกับ KPI
 *
 * รันตรงด้วย Node 24 (type stripping ในตัว ไม่ต้อง build):
 *   node tests/date-range.test.mjs
 */
import { rangeBounds } from '../src/scripts/dashboard/date-range.ts';

let pass = 0, fail = 0;
const check = (cond, m) => { cond ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };
const d = (iso) => new Date(`${iso}T00:00:00`);
const fmt = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const span = (r) => (r ? `${fmt(r.from)} → ${fmt(r.to)}` : 'null');

// ตรึงเวลา: พุธ 12 ส.ค. 2026 เวลาบ่าย (กลางสัปดาห์ กลางเดือน กลางไตรมาส 3)
const NOW = new Date('2026-08-12T15:30:00');

console.log('\n[1] ช่วงพื้นฐาน (ตรึงวันพุธ 12 ส.ค. 2026)');
check(span(rangeBounds('today', undefined, undefined, NOW)) === '2026-08-12 → 2026-08-13', `today = ${span(rangeBounds('today', undefined, undefined, NOW))}`);
check(span(rangeBounds('week', undefined, undefined, NOW)) === '2026-08-10 → 2026-08-17', `week เริ่มวันจันทร์ = ${span(rangeBounds('week', undefined, undefined, NOW))}`);
check(span(rangeBounds('month', undefined, undefined, NOW)) === '2026-08-01 → 2026-09-01', `month = ${span(rangeBounds('month', undefined, undefined, NOW))}`);
check(span(rangeBounds('quarter', undefined, undefined, NOW)) === '2026-07-01 → 2026-10-01', `quarter (Q3) = ${span(rangeBounds('quarter', undefined, undefined, NOW))}`);
check(span(rangeBounds('year', undefined, undefined, NOW)) === '2026-01-01 → 2027-01-01', `year = ${span(rangeBounds('year', undefined, undefined, NOW))}`);
check(rangeBounds('all', undefined, undefined, NOW) === null, 'all = null (ไม่กรอง)');

console.log('\n[2] วันจันทร์และวันอาทิตย์ — จุดที่สูตรสัปดาห์พังบ่อยสุด');
// จันทร์ 10 ส.ค. 2026 → สัปดาห์ต้องเริ่มวันนั้นเอง ไม่ใช่ถอยไป 7 วัน
const MON = new Date('2026-08-10T09:00:00');
check(span(rangeBounds('week', undefined, undefined, MON)) === '2026-08-10 → 2026-08-17', `จันทร์: ${span(rangeBounds('week', undefined, undefined, MON))}`);
// อาทิตย์ 16 ส.ค. 2026 → ยังต้องอยู่สัปดาห์ที่เริ่ม 10 ส.ค. (ไม่ใช่ขึ้นสัปดาห์ใหม่แบบ US)
const SUN = new Date('2026-08-16T23:00:00');
check(span(rangeBounds('week', undefined, undefined, SUN)) === '2026-08-10 → 2026-08-17', `อาทิตย์ยังอยู่สัปดาห์เดิม: ${span(rangeBounds('week', undefined, undefined, SUN))}`);

console.log('\n[3] ขอบไตรมาส/ปี');
for (const [iso, want, label] of [
  ['2026-01-01T00:00:00', '2026-01-01 → 2026-04-01', 'Q1 วันแรก'],
  ['2026-03-31T23:59:00', '2026-01-01 → 2026-04-01', 'Q1 วันสุดท้าย'],
  ['2026-04-01T00:00:00', '2026-04-01 → 2026-07-01', 'Q2 วันแรก'],
  ['2026-12-31T23:59:00', '2026-10-01 → 2027-01-01', 'Q4 ข้ามปี'],
]) {
  const got = span(rangeBounds('quarter', undefined, undefined, new Date(iso)));
  check(got === want, `${label}: ${got}`);
}
check(span(rangeBounds('month', undefined, undefined, new Date('2026-12-15T10:00:00'))) === '2026-12-01 → 2027-01-01', 'ธ.ค. ต่อไปปีหน้าถูกต้อง');

console.log('\n[4] กำหนดเอง — "ถึงวันที่ X" ต้องได้ทั้งวันนั้น');
const c1 = rangeBounds('custom', '2026-08-01', '2026-08-17', NOW);
check(span(c1) === '2026-08-01 → 2026-08-18', `1–17 ส.ค. ครอบทั้งวันที่ 17: ${span(c1)}`);
const one = rangeBounds('custom', '2026-08-05', '2026-08-05', NOW);
check(span(one) === '2026-08-05 → 2026-08-06', `วันเดียวยังได้ 1 วันเต็ม: ${span(one)}`);
const rev = rangeBounds('custom', '2026-08-17', '2026-08-01', NOW);
check(span(rev) === '2026-08-01 → 2026-08-18', `เลือกกลับหัวแล้วสลับให้: ${span(rev)}`);
check(rangeBounds('custom', '', '2026-08-17', NOW) === null, 'กรอกไม่ครบ = null (ไม่ยิง query)');
check(rangeBounds('custom', 'ไม่ใช่วันที่', '2026-08-17', NOW) === null, 'วันที่พัง = null');

console.log('\n[5] lead จริงต้องตกอยู่ในช่วงที่ถูก');
// lead ตอน 23:50 ของวันที่ 12 ต้องนับเป็น "วันนี้" ไม่ใช่หลุดไปพรุ่งนี้
const late = new Date('2026-08-12T23:50:00');
const t = rangeBounds('today', undefined, undefined, NOW);
check(late >= t.from && late < t.to, 'lead เข้ามา 23:50 ยังนับเป็นวันนี้');
const midnight = new Date('2026-08-13T00:05:00');
check(!(midnight >= t.from && midnight < t.to), 'lead เข้ามา 00:05 ของวันถัดไป ไม่นับเป็นวันนี้');

console.log(`\n${'─'.repeat(48)}\nผ่าน ${pass} · ไม่ผ่าน ${fail}\n`);
process.exit(fail === 0 ? 0 : 1);
