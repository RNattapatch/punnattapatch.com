// note-lint.ts — ตัวจับกลิ่น AI + ขนาดตัวอักษรของ Note Studio (เขียนมือ · ไม่ใช่ไฟล์ gen)
import { stripTags, plain, maxLineWidth, sizePx, type NoteSlide } from './note-render';

/** ตัวจับกลิ่น AI แบบเร็ว (ย่อจาก branding/strategy/ai-writing-rules.md) — เตือน ไม่บล็อก */
export function lintSlides(slides: NoteSlide[], mobile: boolean): { slide: number; level: 'red' | 'yellow'; msg: string }[] {
  const out: { slide: number; level: 'red' | 'yellow'; msg: string }[] = [];
  const all = slides.map((s) => stripTags(s.text + ' ' + (s.sub ?? ''))).join('\n');
  const negPar = (all.match(/ไม่ใช่[^\n]{0,40}แต่(?:คือ|เป็น)?/g) ?? []).length;
  if (negPar > 1) out.push({ slide: 0, level: 'red', msg: `"ไม่ใช่…แต่…" ${negPar} ครั้ง (ทั้งชุดได้ 1)` });
  const RULES: [RegExp, 'red' | 'yellow', string][] = [
    [/ซึ่งสะท้อน|ซึ่งตอกย้ำ|แสดงให้เห็นถึง/, 'red', 'ประโยคสรุปความสำคัญ (ซึ่งสะท้อน/ตอกย้ำ)'],
    [/ก้าวสำคัญ|จุดเปลี่ยนสำคัญ|ยุคใหม่|ครั้งสำคัญ/, 'red', 'คำเว่อร์ (ก้าวสำคัญ/ยุคใหม่)'],
    [/ทำหน้าที่เป็น/, 'yellow', '"ทำหน้าที่เป็น" → ใช้ "คือ"'],
    [/สรุปแล้ว|โดยสรุป/, 'red', 'ปิดด้วย "สรุปแล้ว"'],
    [/ขับเคลื่อน|ยกระดับ|ครอบคลุมทุก/, 'yellow', 'คำกลิ่น AI (ขับเคลื่อน/ยกระดับ)'],
    [/คอร์ส/, 'red', 'คำว่า "คอร์ส" → ใช้ "คลาส"'],
    [/—/, 'yellow', 'em-dash (—) ใช้ให้น้อย'],
  ];
  slides.forEach((s, i) => {
    const t = stripTags(s.text + ' ' + (s.sub ?? ''));
    for (const [re, level, msg] of RULES) if (re.test(t)) out.push({ slide: i + 1, level, msg });
    if (s.type === 'hook' && mobile && stripTags(s.text).split('\n').length > 2) out.push({ slide: i + 1, level: 'yellow', msg: 'ปก: หัวควร ≤2 บรรทัด (ส่วนเกินย้ายไปบรรทัดรอง)' });
    if (s.type === 'hook' && mobile && maxLineWidth(s.text) > 16) out.push({ slide: i + 1, level: 'yellow', msg: 'ปก: บรรทัดหัวยาวเกิน จะถูกตัดเป็นหลายบรรทัด — ย่อให้สั้นลง' });
    if (s.type !== 'hook' && mobile && sizePx(s.text, true) < 64) out.push({ slide: i + 1, level: 'yellow', msg: `ตัวอักษรเหลือ ${sizePx(s.text, true)}px (<64) — ตัดคำหรือแยกใบ` });
    if (plain(s.text).length > 170) out.push({ slide: i + 1, level: 'yellow', msg: 'ยาวเกิน 170 ตัวอักษร' });
  });
  return out;
}
