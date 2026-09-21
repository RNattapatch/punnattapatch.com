/**
 * lead-contact — ตอบคำถามเดียว: "lead รายนี้หยิบโทรศัพท์แล้วโทรได้เลยไหม"
 *
 * ช่อง `leads.phone` เก็บมาจากหลายท่อ รูปแบบจึงไม่เหมือนกันสักท่อ (ดูของจริง 2026-09-18):
 *   ฟอร์มเว็บ  → '0812345678'        บอท LINE → '66812345678' / '+66812345678'
 *   คีย์เอง    → '081-234-5678'      ของเสีย  → 'Pre-Flight Test' · 'ss_aor' · '987717822' (ลืม 0)
 * ถ้าดูแค่ว่า "ช่องเบอร์ว่างไหม" จะนับ 16 รายที่โทรไม่ได้จริงเป็นเบอร์ดี — ไฟล์นี้จึง
 * normalize ก่อนตัดสิน และแยก "เบอร์เพี้ยน" ออกจาก "ไม่มีเบอร์" เพราะสองอย่างนี้แก้คนละวิธี
 * (เพี้ยน = ไปตามเบอร์ที่ถูกมาเติม · ไม่มี = ต้องทักไปขอทาง LINE)
 */

import { tintedChipStyle } from './chip-style.ts';

export type ContactKey = 'callable' | 'broken' | 'line-only' | 'unreachable';

export type ContactMeta = {
  key: ContactKey;
  /** ป้ายบนการ์ด — เบอร์ที่โทรได้จะโชว์ตัวเลขเลย ไม่ต้องเปิดการ์ดอ่าน */
  label: string;
  /** ป้ายบน banner — ระดับกลุ่ม */
  groupLabel: string;
  icon: string;
  tint: string;
  /** เบอร์ที่ normalize แล้ว (0XXXXXXXXX) — ใช้กับ tel: · null เมื่อโทรไม่ได้ */
  dialable: string | null;
  /** คำอธิบายสั้นๆ ว่าทำไมโทรไม่ได้ / ติดต่อทางไหนแทน — ว่างเมื่อโทรได้ (ใช้เป็น tooltip บนการ์ด) */
  note: string;
  /** เบอร์ที่น่าจะถูกเมื่อเจอเบอร์เพี้ยนแบบเดาได้ (ลืม 0 หน้า) — ว่างเมื่อเดาไม่ได้ */
  suggestion: string;
};

type Group = { groupLabel: string; icon: string; tint: string };

/** ลำดับนี้คือลำดับบน banner — ตรึงไว้ให้ตำแหน่งไม่ขยับ */
export const CONTACT_GROUPS: Record<ContactKey, Group> = {
  'callable':    { groupLabel: 'โทรได้',        icon: '📞', tint: '--color-success' },
  'broken':      { groupLabel: 'เบอร์เพี้ยน',    icon: '⚠️', tint: '--color-warning' },
  'line-only':   { groupLabel: 'มีแต่ LINE',     icon: '💬', tint: '--color-primary' },
  'unreachable': { groupLabel: 'ติดต่อไม่ได้',   icon: '🚫', tint: '--color-secondary' },
};

export const CONTACT_ORDER: ContactKey[] = ['callable', 'broken', 'line-only', 'unreachable'];

/** โชว์เสมอแม้เป็น 0 — "โทรได้" คือช่องที่คุณปันกดทุกวัน ต้องอยู่ที่เดิมตลอด */
export const CONTACT_ALWAYS_SHOWN: ContactKey[] = ['callable'];

type ContactInput = {
  phone?: unknown;
  line_user_id?: unknown;
  line_id?: unknown;
  email?: unknown;
};

/**
 * ทำเบอร์ให้เป็นรูปแบบเดียว: ตัดอักขระที่ไม่ใช่ตัวเลข แล้วแปลง 66/+66 กลับเป็น 0
 * คืน null เมื่อไม่เหลือตัวเลขเลย
 */
export function normalizePhone(raw: unknown): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  // '66812345678' / '+66812345678' → '0812345678' (บอท LINE ส่งมาแบบนี้)
  if (/^66[0-9]{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
}

/** โทรได้จริงไหม — มือถือ 10 หลัก (06/08/09) หรือเบอร์บ้าน/ออฟฟิศ 9 หลัก (02–07) */
export function isDialable(digits: string | null): boolean {
  if (!digits) return false;
  return /^0[689][0-9]{8}$/.test(digits) || /^0[2-7][0-9]{7}$/.test(digits);
}

/** 0812345678 → 081-234-5678 · 021234567 → 02-123-4567 (อ่านออกเร็วกว่าเลขติดกัน) */
export function formatPhone(digits: string | null): string {
  if (!digits) return '';
  if (/^0[689][0-9]{8}$/.test(digits)) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (/^0[2-7][0-9]{7}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  return digits;
}

/**
 * เดาเบอร์ที่น่าจะถูกให้ตอนเจอเบอร์เพี้ยน — เคสเดียวที่เดาได้อย่างมั่นใจคือ
 * "ลืม 0 หน้า" (9 หลักขึ้นต้น 6/8/9) · เคสอื่นคืน null ไม่เดามั่ว
 */
export function suggestFix(digits: string | null): string | null {
  if (!digits) return null;
  if (/^[689][0-9]{8}$/.test(digits)) return `0${digits}`;
  return null;
}

function meta(key: ContactKey, over: Partial<ContactMeta> = {}): ContactMeta {
  const g = CONTACT_GROUPS[key];
  return {
    key,
    label: over.label ?? g.groupLabel,
    groupLabel: g.groupLabel,
    icon: g.icon,
    tint: g.tint,
    dialable: over.dialable ?? null,
    note: over.note ?? '',
    suggestion: over.suggestion ?? '',
  };
}

/** ตัดสินว่า lead รายนี้ติดต่อได้ทางไหน */
export function classifyContact(lead: ContactInput | null | undefined): ContactMeta {
  const rawPhone = String(lead?.phone ?? '').trim();
  const digits = normalizePhone(rawPhone);

  if (isDialable(digits)) {
    return meta('callable', { label: formatPhone(digits), dialable: digits });
  }

  // มีอะไรอยู่ในช่องเบอร์ แต่โทรไม่ได้ — ต้องรู้ว่าต้องไปตามเบอร์มาเติม
  if (rawPhone) {
    const fix = suggestFix(digits);
    return meta('broken', {
      label: 'เบอร์ไม่ครบ',
      note: fix ? `ในระบบเก็บไว้ว่า "${rawPhone}" — น่าจะเป็น ${formatPhone(fix)}` : `ในระบบเก็บไว้ว่า "${rawPhone}" — โทรไม่ออก`,
      suggestion: fix ? formatPhone(fix) : '',
    });
  }

  const hasLine = !!String(lead?.line_user_id ?? '').trim() || !!String(lead?.line_id ?? '').trim();
  const hasEmail = !!String(lead?.email ?? '').trim();
  if (hasLine || hasEmail) {
    const via = [hasLine ? 'LINE' : '', hasEmail ? 'อีเมล' : ''].filter(Boolean).join(' · ');
    return meta('line-only', { label: `ทักทาง ${via}`, note: `ยังไม่มีเบอร์ — ติดต่อได้ทาง ${via}` });
  }

  return meta('unreachable', { label: 'ไม่มีช่องทาง', note: 'ไม่มีทั้งเบอร์ LINE และอีเมล' });
}

/** สไตล์ป้ายช่องทางติดต่อ — สูตรเดียวกับป้ายที่มาของ lead */
export function contactChipStyle(m: Pick<ContactMeta, 'tint'>): string {
  return tintedChipStyle(m.tint);
}

export type ContactTally = {
  key: ContactKey;
  groupLabel: string;
  icon: string;
  tint: string;
  count: number;
  pct: number;
};

/** นับ lead ตามช่องทางติดต่อ — เรียงตาม CONTACT_ORDER · ซ่อนกลุ่มที่เป็น 0 ยกเว้น 'โทรได้' */
export function tallyContacts(leads: ReadonlyArray<ContactInput>): ContactTally[] {
  const counts = new Map<ContactKey, number>();
  for (const lead of leads) {
    const k = classifyContact(lead).key;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const total = leads.length;
  return CONTACT_ORDER
    .filter((k) => (counts.get(k) || 0) > 0 || CONTACT_ALWAYS_SHOWN.includes(k))
    .map((k) => {
      const g = CONTACT_GROUPS[k];
      const count = counts.get(k) || 0;
      return {
        key: k,
        groupLabel: g.groupLabel,
        icon: g.icon,
        tint: g.tint,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      };
    });
}
