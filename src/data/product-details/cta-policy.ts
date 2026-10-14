// CTA policy — หน้าที่มีฟอร์ม 2 ขั้นในหน้า (T2 · T4 · C1) ใช้ฟอร์มเป็นปุ่มหลักปุ่มเดียว
// ที่มา: wiki framework-lp-cta-form-first-consult-2026-10 (ข้อ 1–2, 6) + audit-closing-funnel-loop-grandma-test-2026-10 §5
// คนเย็นจากแอดงานปรึกษา: ฟอร์มพาถึงคอล 19/53 (36%) vs บอท LINE 2/62 (3%) → LINE เหลือเป็นลิงก์ตัวหนังสือ ไม่แข่งกับปุ่มหลัก
import type { ProductDetailCode } from './types';

export const FORM_FIRST_CODES: ReadonlySet<ProductDetailCode> = new Set<ProductDetailCode>(['T2', 'T4', 'C1']);

/** ข้อความปุ่มหลักที่ล็อกไว้ (กติกาแอดข้อ 5 "เล่าโจทย์มา") — ปุ่มนี้เลื่อนลงไปที่ฟอร์มในหน้าเดียวกัน */
export const FORM_CTA_LABEL = 'เล่าโจทย์ทีมขายให้ปันฟัง';

/** ขั้นต่อไปชุดเดียวทั้ง loop — หน้าเว็บ/ฟอร์มบอกแค่ขั้นนี้ ส่วน ①②③ เต็มชุดไว้หลังส่งฟอร์มกับในบอท */
export const NEXT_STEP_CALL = 'ผมโทรกลับภายในวันนี้ ส่วนใหญ่ช่วงเย็น คุย 15 นาที ไม่มีค่าใช้จ่าย';

export const isFormFirst = (code: ProductDetailCode) => FORM_FIRST_CODES.has(code);

/** ปุ่ม LINE บนหน้าฟอร์มก่อน = ลิงก์ตัวหนังสือ (ยังกดง่าย 44px) */
export const lineLinkClass = (inverse: boolean) =>
  inverse
    ? 'inline-flex min-h-11 w-full items-center justify-center px-2 font-semibold text-white underline decoration-[#06C755] decoration-2 underline-offset-4 hover:text-[#06C755] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto'
    : 'inline-flex min-h-11 w-full items-center justify-center px-2 font-semibold text-navy underline decoration-[#06C755] decoration-2 underline-offset-4 hover:text-[#05813a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:w-auto';
