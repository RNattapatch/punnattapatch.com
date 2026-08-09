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
