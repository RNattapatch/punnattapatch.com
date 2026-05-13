// Thai follow-up message templates picked by last_touch_at age and deal_outcome.
// "Copy follow-up" Quick Action calls pickTemplate(lead) and writes to clipboard.

import type { LeadUi } from './adapter';

function ageDays(iso?: string | null): number {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / 86400000;
}

function name(lead: LeadUi): string {
  const nick = (lead.nickname || '').toString().trim();
  if (nick) return nick;
  const full = (lead.full_name || '').toString().trim();
  if (full) {
    const first = full.split(/\s+/)[0];
    return first || full;
  }
  return 'พี่';
}

export function pickTemplate(lead: LeadUi): string {
  const n = name(lead);
  const company = (lead.company_name || '').toString().trim();
  const age = ageDays(lead.last_touch_at);
  const outcome = lead.deal_outcome || 'in_progress';
  const co = company ? ` ที่ ${company}` : '';

  if (outcome === 'won') {
    return `สวัสดีครับพี่${n} ขอบคุณที่ไว้ใจปันนะครับ ตอนนี้ระบบเดินตามแผนแล้ว มีอะไรอยากให้ช่วยเพิ่มแจ้งได้เลยครับ`;
  }
  if (outcome === 'lost') {
    return `สวัสดีครับพี่${n} ปันแวะมาสวัสดีนะครับ ถ้ามีจังหวะใหม่หรืออยากชวนคุยอีกรอบ บอกปันได้เสมอครับ`;
  }

  if (age <= 1) {
    return `สวัสดีครับพี่${n} ขอบคุณที่คุยกันเมื่อกี้นะครับ ปันส่งสรุป + next step ตามที่คุยกันไว้แล้ว ลองดูแล้วบอกปันได้เลยครับ`;
  }
  if (age <= 3) {
    return `สวัสดีครับพี่${n}${co} ปันตามอัปเดตเรื่องที่คุยกันครับ มีจุดไหนอยากให้ขยายเพิ่มก่อนตัดสินใจไหมครับ`;
  }
  if (age <= 7) {
    return `สวัสดีครับพี่${n} อาทิตย์ที่ผ่านมาเป็นยังไงบ้างครับ ปันยังเก็บโจทย์ของพี่ไว้อยู่ ถ้าพร้อมให้ลงมือต่อ บอกปันได้เลยครับ`;
  }
  if (age <= 21) {
    return `สวัสดีครับพี่${n} ปันเช็คอินครับ ช่วงนี้ทีมขายเป็นไงบ้าง ถ้าจังหวะลงตัวค่อยกลับมาคุยต่อได้เสมอครับ`;
  }
  return `สวัสดีครับพี่${n} ห่างหายไปนาน ปันเอาไอเดียใหม่ที่น่าจะเข้ากับ${co || 'ทีมพี่'}มาฝากครับ ถ้าสนใจเดี๋ยวปันส่งสรุปสั้นๆ ให้ดูได้เลย`;
}
