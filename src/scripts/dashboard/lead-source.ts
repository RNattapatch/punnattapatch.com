/**
 * lead-source — แปลงค่าดิบใน `leads.source` / `leads.manual_source` ให้เป็น "ที่มาที่กวาดตาแล้วรู้"
 *
 * ค่าดิบในฐานข้อมูลสะสมมาหลายยุค (line-oa · website-booking · ads-hotel-resort-ai ·
 * lp-p1-ai-sale-loop · TikTok กับ tiktok ปนกัน) — ถ้าเอาขึ้นจอดิบๆ ต้องอ่านทีละตัวถึงจะรู้ว่า
 * lead นี้บอทเก็บให้หรือกรอกฟอร์มมาเอง ไฟล์นี้คือที่เดียวที่ตัดสินเรื่องนั้น ทั้ง banner
 * ที่การ์ด ที่ drawer และที่ filter อ่านจากฟังก์ชันเดียวกัน จะได้ไม่มีวันเถียงกันเอง
 *
 * กติกา: ไม่รู้จัก = 'other' เสมอ ห้ามเดา — เดาผิดแล้วตัวเลขใน banner จะโกหกเงียบๆ
 */

import { tintedChipStyle } from './chip-style.ts';

export type SourceKey =
  | 'line-bot'
  | 'booking-form'
  | 'landing'
  | 'ads'
  | 'social'
  | 'sponsor'
  | 'doc-bot'
  | 'referral'
  | 'manual'
  | 'other';

export type SourceMeta = {
  key: SourceKey;
  /** ป้ายบนการ์ด — เฉพาะเจาะจงกว่ากลุ่ม (เช่น 'TikTok' ไม่ใช่ 'โซเชียล') */
  label: string;
  /** ป้ายบน banner — ระดับกลุ่ม */
  groupLabel: string;
  icon: string;
  /**
   * ชื่อ CSS var ของสีประจำที่มา — ใช้ผสมเป็น "พื้นอ่อน" เท่านั้น ห้ามเอาไปทำสีตัวอักษร
   * (วัดจริงบนธีมครีม: badge-soft ของ DaisyUI ให้คอนทราสต์ 1.6–3.4 = อ่านไม่ออก
   *  ป้ายนี้จึงใช้ตัวอักษร base-content เสมอ แล้วให้สีเป็นแค่พื้น + ขอบ)
   */
  tint: string;
  /** ค่าดิบที่มาจากฐานข้อมูล — ไว้โชว์ใน drawer ตอนอยากรู้ว่าแคมเปญไหน */
  detail: string;
};

type Group = { groupLabel: string; icon: string; tint: string };

/**
 * สีประจำที่มา — พาเลตแบรนด์มีแค่ 4 สีจริง (navy · coral · เขียว · อำพัน) จึงไม่แจกสีรายท่อ
 * แต่แจกตาม "ประเภทของท่อ" แล้วให้ไอคอน + ชื่อเป็นตัวบอกว่าท่อไหนแน่:
 *   เขียว  = ระบบเก็บมาให้เอง (บอท)      navy   = คนกรอกบนเว็บเรา (ฟอร์ม · LP)
 *   อำพัน  = ซื้อมาด้วยเงิน (แอด)          coral  = คนอื่นพามา (โซเชียล · สปอนเซอร์ · บอกต่อ)
 *   เทา    = ไม่มีท่อ (คีย์เอง · ไม่ระบุ)
 * ใช้ตัวแปรเชิงความหมาย (--color-primary/secondary/…) ไม่ใช่ --color-brand-* เพราะ brand-*
 * เป็นค่าเดียวทั้งสองธีม — ธีมมืดจะจมหายไปกับพื้น
 * ลำดับใน record นี้คือลำดับบน banner — ตรึงไว้ให้ตำแหน่งไม่ขยับ จะได้จำที่ได้
 */
export const SOURCE_GROUPS: Record<SourceKey, Group> = {
  'line-bot':     { groupLabel: 'LINE Bot',    icon: '🤖', tint: '--color-success' },
  'booking-form': { groupLabel: 'ฟอร์มจองเว็บ', icon: '📝', tint: '--color-primary' },
  'landing':      { groupLabel: 'LP แคมเปญ',   icon: '🎯', tint: '--color-primary' },
  'ads':          { groupLabel: 'แอด',         icon: '📣', tint: '--color-warning' },
  'social':       { groupLabel: 'โซเชียล',      icon: '📱', tint: '--color-secondary' },
  'sponsor':      { groupLabel: 'Sponsor',     icon: '🤝', tint: '--color-secondary' },
  'doc-bot':      { groupLabel: 'Doc Bot',     icon: '🧾', tint: '--color-success' },
  'referral':     { groupLabel: 'บอกต่อ',       icon: '🙌', tint: '--color-secondary' },
  'manual':       { groupLabel: 'คีย์เอง',       icon: '✍️', tint: '--color-base-content' },
  'other':        { groupLabel: 'ไม่ระบุ',       icon: '❔', tint: '--color-base-content' },
};

export const SOURCE_ORDER: SourceKey[] = [
  'line-bot', 'booking-form', 'landing', 'ads', 'social',
  'sponsor', 'doc-bot', 'referral', 'manual', 'other',
];

/** กลุ่มที่ต้องโชว์เสมอแม้เป็น 0 — สองท่อรับ lead หลักที่คุณปันดูทุกวัน */
export const ALWAYS_SHOWN: SourceKey[] = ['line-bot', 'booking-form'];

const SOCIAL_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  chatgpt: 'ChatGPT',
};

function meta(key: SourceKey, detail: string, label?: string): SourceMeta {
  const g = SOURCE_GROUPS[key];
  return { key, label: label || g.groupLabel, groupLabel: g.groupLabel, icon: g.icon, tint: g.tint, detail };
}

type SourceInput = {
  source?: unknown;
  manual_source?: unknown;
  line_user_id?: unknown;
};

/**
 * ตัดสินที่มาของ lead หนึ่งราย
 * อ่าน `source` เป็นหลัก · `manual_source` เป็นตัวช่วยเมื่อ source ว่างหรือกำกวม
 */
export function classifySource(lead: SourceInput | null | undefined): SourceMeta {
  const raw = String(lead?.source ?? '').trim();
  const manual = String(lead?.manual_source ?? '').trim();
  const s = raw.toLowerCase();
  const m = manual.toLowerCase();
  const detail = raw || manual;

  // บอท LINE เก็บให้ — เชื่อ manual_source ด้วย เพราะ relay เขียน 'bot-collected' กำกับไว้
  if (s === 'line-oa' || s.startsWith('line') || m === 'bot-collected') return meta('line-bot', detail);

  if (s === 'doc-bot' || m === 'doc-bot-auto') return meta('doc-bot', detail);
  if (s.includes('sponsor')) return meta('sponsor', detail);

  // ฟอร์มจองบนเว็บหลัก (booking / intake) — ท่อ lead หลักที่ไม่ผ่านบอท
  if (s.includes('booking') || s.includes('intake-form') || s === 'website') return meta('booking-form', detail);

  // ฟอร์มบน landing page ของแคมเปญ — แยกจาก booking เพราะอยากรู้ว่า LP ไหนทำงาน
  if (s.startsWith('lp-')) return meta('landing', detail, `LP ${raw.slice(3)}`);

  if (s.startsWith('ads-')) return meta('ads', detail, `แอด ${raw.slice(4)}`);

  if (SOCIAL_LABEL[s]) return meta('social', detail, SOCIAL_LABEL[s]);

  if (s === 'referral' || s.includes('referral')) return meta('referral', detail);
  if (s === 'manual' || (!s && m === 'manual')) return meta('manual', detail);
  if (!s && !m) return meta('other', '');
  return meta('other', detail);
}

/**
 * สไตล์ป้ายที่มา — พื้นอ่อนสีประจำท่อ + ตัวอักษร base-content (อ่านออกทั้งธีมสว่างและมืด)
 * ใส่เป็น style attribute เพราะสีมาจาก CSS var ที่ Tailwind ไม่ได้ generate เป็นคลาสไว้
 */
export function sourceChipStyle(meta: Pick<SourceMeta, 'tint'>): string {
  return tintedChipStyle(meta.tint);
}

/** ป้ายสั้นสำหรับการ์ด — ไอคอน + ชื่อ */
export function sourceChipText(lead: SourceInput | null | undefined): string {
  const t = classifySource(lead);
  return `${t.icon} ${t.label}`;
}

export type SourceTally = {
  key: SourceKey;
  groupLabel: string;
  icon: string;
  tint: string;
  count: number;
  /** สัดส่วนจากฐานที่นับ (0–100 ปัดเป็นจำนวนเต็ม) */
  pct: number;
};

/**
 * นับ lead ตามกลุ่มที่มา — เรียงตาม SOURCE_ORDER (ตำแหน่งคงที่)
 * ซ่อนกลุ่มที่เป็น 0 ยกเว้น ALWAYS_SHOWN
 */
export function tallySources(leads: ReadonlyArray<SourceInput>): SourceTally[] {
  const counts = new Map<SourceKey, number>();
  for (const lead of leads) {
    const k = classifySource(lead).key;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const total = leads.length;
  return SOURCE_ORDER
    .filter((k) => (counts.get(k) || 0) > 0 || ALWAYS_SHOWN.includes(k))
    .map((k) => {
      const g = SOURCE_GROUPS[k];
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
