/**
 * Regression tests for lead-source — ป้าย "มาจากไหน" ที่ banner · การ์ด · drawer · filter ใช้ร่วมกัน
 * ค่าดิบที่เทสต์คือค่าที่มีอยู่จริงใน public.leads (2026-09-18) ไม่ใช่ค่าที่สมมติขึ้น
 */
import { classifySource, tallySources, sourceChipText } from '../src/scripts/dashboard/lead-source.ts';

let pass = 0;
let fail = 0;
const check = (condition, message) => {
  if (condition) { pass++; console.log(`  ✅ ${message}`); }
  else { fail++; console.log(`  ❌ ${message}`); }
};

console.log('\n[1] ค่าดิบที่มีอยู่จริงในฐานข้อมูล แยกกลุ่มถูก');
const cases = [
  [{ source: 'line-oa', manual_source: 'bot-collected' }, 'line-bot'],
  [{ source: null, manual_source: 'bot-collected' }, 'line-bot'],
  [{ source: 'website-booking' }, 'booking-form'],
  [{ source: 'lp-p1-ai-sale-loop' }, 'landing'],
  [{ source: 'lp-t4-advance-ai-automation' }, 'landing'],
  [{ source: 'ads-daruma-consult' }, 'ads'],
  [{ source: 'ads-hotel-resort-ai' }, 'ads'],
  [{ source: 'tiktok' }, 'social'],
  [{ source: 'TikTok' }, 'social'],
  [{ source: 'Instagram' }, 'social'],
  [{ source: 'facebook' }, 'social'],
  [{ source: 'chatgpt' }, 'social'],
  [{ source: 'sponsor-form' }, 'sponsor'],
  [{ source: 'doc-bot', manual_source: 'doc-bot-auto' }, 'doc-bot'],
  [{ source: 'referral' }, 'referral'],
  [{ source: 'manual', manual_source: 'manual' }, 'manual'],
  [{ source: null, manual_source: 'manual' }, 'manual'],
  [{ source: 'other' }, 'other'],
  [{}, 'other'],
  [null, 'other'],
];
for (const [lead, expected] of cases) {
  const got = classifySource(lead).key;
  check(got === expected, `${JSON.stringify(lead)} → ${expected}${got === expected ? '' : ` (ได้ ${got})`}`);
}

console.log('\n[2] ป้ายบนการ์ดเจาะจงกว่ากลุ่ม — แคมเปญไหนต้องอ่านออกจากการ์ด');
check(sourceChipText({ source: 'line-oa' }) === '🤖 LINE Bot', 'LINE Bot ได้ป้าย 🤖 LINE Bot');
check(sourceChipText({ source: 'website-booking' }) === '📝 ฟอร์มจองเว็บ', 'booking ได้ป้าย 📝 ฟอร์มจองเว็บ');
check(classifySource({ source: 'ads-hotel-resort-ai' }).label === 'แอด hotel-resort-ai', 'แอดบอกชื่อ vertical');
check(classifySource({ source: 'lp-p1-ai-sale-loop' }).label === 'LP p1-ai-sale-loop', 'LP บอกชื่อแคมเปญ');
check(classifySource({ source: 'tiktok' }).label === 'TikTok', 'โซเชียลบอกชื่อแพลตฟอร์ม ไม่ใช่คำว่าโซเชียล');
check(classifySource({ source: 'ads-daruma-consult' }).detail === 'ads-daruma-consult', 'ค่าดิบติดมาใน detail สำหรับ drawer');

console.log('\n[3] ตัวเลขบน banner — นับตามกลุ่ม เรียงคงที่ ซ่อน 0 ยกเว้นสองท่อหลัก');
const tally = tallySources([
  { source: 'line-oa', manual_source: 'bot-collected' },
  { source: 'line-oa', manual_source: 'bot-collected' },
  { source: 'line-oa', manual_source: 'bot-collected' },
  { source: 'website-booking' },
  { source: 'ads-hotel-resort-ai' },
]);
const byKey = Object.fromEntries(tally.map((t) => [t.key, t]));
check(byKey['line-bot'].count === 3, 'LINE Bot นับได้ 3');
check(byKey['line-bot'].pct === 60, 'LINE Bot = 60% ของ 5 รายที่นับ');
check(byKey['booking-form'].count === 1, 'ฟอร์มจองเว็บ นับได้ 1');
check(byKey['ads'].count === 1, 'แอด นับได้ 1');
check(!byKey['social'], 'กลุ่มที่ไม่มี lead ถูกซ่อน (โซเชียล)');
check(tally[0].key === 'line-bot' && tally[1].key === 'booking-form', 'ลำดับตรึง: LINE Bot มาก่อน ฟอร์มจองเว็บ');

const emptyTally = tallySources([]);
check(emptyTally.length === 2, 'ไม่มี lead เลย → ยังเห็นสองท่อหลัก (LINE Bot · ฟอร์มจองเว็บ)');
check(emptyTally.every((t) => t.count === 0 && t.pct === 0), 'ฐานเป็น 0 ไม่หาร 0 (pct = 0 ไม่ใช่ NaN)');

console.log('\n────────────────────────────────────────────────');
console.log(`ผ่าน ${pass} · ไม่ผ่าน ${fail}`);
if (fail > 0) process.exit(1);
