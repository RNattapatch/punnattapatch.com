/**
 * after-hours — พ่วงคำตอบ "สะดวกให้ติดต่อกลับนอกเวลาทำการไหม" เข้า payload ก่อน POST
 *
 * ทำไมต้องพ่วงเข้า `comment` ด้วยแทนที่จะส่ง key เดี่ยว:
 * n8n node "Flatten Body1" อ่าน key แบบ FIXED LIST — key ที่ไม่อยู่ใน list จะถูกทิ้งทั้ง
 * ใน Telegram alert และ payload ที่ส่งต่อให้ submit_lead (ดู docs/INTAKE-DATA-CONTRACT.md)
 * การพ่วงเข้า `comment` (canonical key) ทำให้คุณปันเห็นบนการ์ด Telegram + ลง crm_notes ทันที
 * โดยไม่ต้องรอแก้ n8n · ส่วน key `after_hours_ok` ส่งไปด้วยเลย จะได้ลง column ทันทีที่
 * (ก) ฟอร์มวิ่งผ่าน Supabase fallback หรือ (ข) เพิ่ม key นี้ใน Flatten Body1 แล้ว
 */
export type AfterHours = 'yes' | 'no' | '';

export function afterHoursLabel(value: unknown): string {
  if (value === 'yes') return 'สะดวก';
  if (value === 'no') return 'ไม่สะดวก';
  return '';
}

/**
 * เติม comment ด้วยบรรทัดนอกเวลาทำการ (ถ้ามีคำตอบ) — mutate payload ในที่
 * @param payload object ที่กำลังจะ POST (ต้องมี after_hours_ok จาก FormData แล้ว)
 */
export function foldAfterHours(payload: Record<string, unknown>): void {
  const label = afterHoursLabel(payload.after_hours_ok);
  if (!label) return;
  const line = `⏰ ติดต่อกลับนอกเวลาทำการ: ${label}`;
  const current = typeof payload.comment === 'string' ? payload.comment.trim() : '';
  payload.comment = current ? `${line} — ${current}` : line;
}

// ── ฝั่งอ่าน (CRM dashboard) ──────────────────────────────────────────────
// ภาษาภาพเดียวกันทั้ง Telegram alert และ dashboard — กวาดตาทีเดียวรู้ว่าโทรตอนไหนได้
//   🌒 = สะดวกนอกเวลาทำการ (เย็น / เสาร์-อาทิตย์)
//   🌤️ = ขอเฉพาะในเวลาทำการ
// (การ์ด Telegram ประกอบใน n8n workflow "Intake Form v2 — Split Path" node "Add After-Hours")
export const AFTER_HOURS_MARK = '🌒';
export const OFFICE_HOURS_MARK = '🌤️';

/**
 * ธงหน้าชื่อลูกค้าใน CRM — คืน 🌒 เฉพาะตอน column `after_hours_ok` เป็น true จริงๆ
 * (false = ขอในเวลาทำการ, null = ไม่ได้ถาม → ไม่ติดธง จะได้ไม่รกทั้งลิสต์)
 */
export function afterHoursMark(value: unknown): string {
  return value === true ? AFTER_HOURS_MARK : '';
}

/** ต่อ 🌒 หน้าชื่อ — ใช้ทุกจุดที่ dashboard แสดงชื่อลูกค้า (list · kanban · today · drawer) */
export function markName(name: string, value: unknown): string {
  const mark = afterHoursMark(value);
  return mark ? `${mark} ${name}` : name;
}
