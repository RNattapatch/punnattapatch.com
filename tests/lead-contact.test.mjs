/**
 * Regression tests for lead-contact — ป้าย "ติดต่อได้ไหม" ที่ banner · การ์ด · drawer · ตัวกรอง
 * ค่าที่เทสต์คือรูปแบบที่มีอยู่จริงใน public.leads (สำรวจ 2026-09-18: 207 แถว)
 * เบอร์ +66/66 มาจากบอท LINE · เบอร์ 9 หลักไม่มี 0 นำหน้ามาจากคนกรอกฟอร์มตกตัวแรก
 */
import {
  classifyContact, normalizePhone, isDialable, formatPhone, suggestFix, tallyContacts,
} from '../src/scripts/dashboard/lead-contact.ts';

let pass = 0;
let fail = 0;
const check = (condition, message) => {
  if (condition) { pass++; console.log(`  ✅ ${message}`); }
  else { fail++; console.log(`  ❌ ${message}`); }
};

console.log('\n[1] normalize — ทุกท่อเขียนเบอร์คนละแบบ ต้องจบที่รูปเดียว');
check(normalizePhone('0812345678') === '0812345678', 'ฟอร์มเว็บ: 0812345678 คงเดิม');
check(normalizePhone('66812345678') === '0812345678', 'บอท LINE: 66812345678 → 0812345678');
check(normalizePhone('+66816171766') === '0816171766', 'บอท LINE: +66816171766 → 0816171766');
check(normalizePhone('081-234-5678') === '0812345678', 'คีย์เอง: ขีดคั่นถูกตัดออก');
check(normalizePhone(' 081 234 5678 ') === '0812345678', 'เว้นวรรคถูกตัดออก');
check(normalizePhone('Pre-Flight Test') === null, 'ข้อความล้วน → null');
check(normalizePhone('') === null && normalizePhone(null) === null, 'ว่าง/null → null');

console.log('\n[2] โทรได้จริงไหม');
check(isDialable('0812345678') === true, 'มือถือ 08 สิบหลัก = โทรได้');
check(isDialable('0612345678') === true && isDialable('0912345678') === true, 'มือถือ 06/09 = โทรได้');
check(isDialable('021234567') === true, 'เบอร์บ้าน/ออฟฟิศ 02 เก้าหลัก = โทรได้');
check(isDialable('987717822') === false, '9 หลักไม่มี 0 นำหน้า = ยังโทรไม่ได้');
check(isDialable('57490312') === false, '8 หลัก = โทรไม่ได้');
check(isDialable('2012345678') === false, '10 หลักขึ้นต้น 2 = ไม่ใช่เบอร์ไทย');
check(isDialable('3475550183') === false, 'เบอร์ต่างประเทศในข้อมูลทดสอบ = โทรไม่ได้');
check(isDialable(null) === false, 'null = โทรไม่ได้');

console.log('\n[3] รูปแบบที่อ่านบนการ์ด');
check(formatPhone('0812345678') === '081-234-5678', 'มือถือคั่น 3-3-4');
check(formatPhone('021234567') === '02-123-4567', 'เบอร์บ้านคั่น 2-3-4');
check(suggestFix('987717822') === '0987717822', 'ลืม 0 หน้า → เสนอเบอร์ที่น่าจะถูก');
check(suggestFix('57490312') === null, 'เคสที่เดาไม่ได้ ต้องไม่เดา');

console.log('\n[4] จัดกลุ่ม lead ตามช่องทางที่ติดต่อได้');
const cases = [
  [{ phone: '0812345678' }, 'callable'],
  [{ phone: '66812345678' }, 'callable'],
  [{ phone: '+66992964293' }, 'callable'],
  [{ phone: '021234567' }, 'callable'],
  [{ phone: '987717822' }, 'broken'],
  [{ phone: 'Pre-Flight Test' }, 'broken'],
  [{ phone: 'ss_aor' }, 'broken'],
  [{ phone: '   ', line_user_id: 'U123' }, 'line-only'],
  [{ phone: null, line_user_id: 'U123' }, 'line-only'],
  [{ phone: null, line_id: '@somebody' }, 'line-only'],
  [{ phone: null, email: 'a@b.co' }, 'line-only'],
  [{ phone: null }, 'unreachable'],
  [{}, 'unreachable'],
  [null, 'unreachable'],
];
for (const [lead, expected] of cases) {
  const got = classifyContact(lead).key;
  check(got === expected, `${JSON.stringify(lead)} → ${expected}${got === expected ? '' : ` (ได้ ${got})`}`);
}

console.log('\n[5] ป้ายบนการ์ดต้องใช้งานได้ทันที');
const ok = classifyContact({ phone: '66812345678' });
check(ok.label === '081-234-5678', 'โทรได้ = โชว์เบอร์บนการ์ดเลย ไม่ต้องเปิดการ์ด');
check(ok.dialable === '0812345678', 'มีเบอร์ที่เอาไปทำลิงก์ tel: ได้');
const bad = classifyContact({ phone: '987717822' });
check(bad.note.includes('987717822') && bad.note.includes('098-771-7822'), 'เบอร์เพี้ยน = บอกค่าที่เก็บไว้ + เบอร์ที่น่าจะถูก');
check(classifyContact({ line_user_id: 'U1' }).label === 'ทักทาง LINE', 'ไม่มีเบอร์แต่มี LINE = บอกให้ไปทัก LINE');
check(classifyContact({ line_user_id: 'U1', email: 'a@b.co' }).label === 'ทักทาง LINE · อีเมล', 'มีสองทางบอกทั้งสอง');

console.log('\n[6] ตัวเลขบนแถบ');
const tally = tallyContacts([
  { phone: '0812345678' }, { phone: '+66992964293' }, { phone: '66863399980' },
  { phone: 'ss_aor' },
  { line_user_id: 'U1' },
]);
const byKey = Object.fromEntries(tally.map((t) => [t.key, t]));
check(byKey.callable.count === 3 && byKey.callable.pct === 60, 'โทรได้ 3 จาก 5 = 60%');
check(byKey.broken.count === 1, 'เบอร์เพี้ยน 1');
check(byKey['line-only'].count === 1, 'มีแต่ LINE 1');
check(!byKey.unreachable, 'กลุ่มที่ไม่มีใครถูกซ่อน');
check(tally[0].key === 'callable', 'ช่อง "โทรได้" อยู่ซ้ายสุดเสมอ');
const empty = tallyContacts([]);
check(empty.length === 1 && empty[0].key === 'callable' && empty[0].pct === 0, 'ไม่มี lead เลย → ยังเห็นช่องโทรได้ และไม่หาร 0');

console.log('\n────────────────────────────────────────────────');
console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
if (fail > 0) process.exit(1);
