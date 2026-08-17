// ขอบเขตช่วงเวลาสำหรับตัวกรอง lead — ฟังก์ชันบริสุทธิ์ ไม่มี dependency
//
// แยกออกมาจาก store.ts เพื่อให้เทสต์ได้จริง (tests/date-range.test.mjs)
// เหตุผล: เลขวันที่คลาดไปวันเดียวจะไม่มีใครสังเกต — "เดือนนี้" ที่หายไป 1 วัน
// หรือ "สัปดาห์นี้" ที่เริ่มวันอาทิตย์แทนวันจันทร์ ดูปกติทุกประการจนกว่าจะเอาไปเทียบตัวเลขอื่น

/** ช่วงเวลาที่ดู lead — อิง submitted_at (วันที่ lead เข้ามา) ไม่ใช่วันที่แก้ล่าสุด */
export type RangeKey = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export const RANGE_LABELS: Record<RangeKey, string> = {
  all: 'ทั้งหมด',
  today: 'วันนี้',
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้',
  quarter: 'ไตรมาสนี้',
  year: 'ปีนี้',
  custom: 'กำหนดเอง',
};

/**
 * คืนขอบเขต [from, to) ของช่วงที่เลือก — `to` เป็นแบบ **ไม่รวม** เสมอ
 * (จะได้ไม่ต้องยุ่งกับ 23:59:59.999 ซึ่งพลาดง่ายและตกวินาทีสุดท้ายของวัน)
 *
 * `now` รับเข้ามาเพื่อให้เทสต์ตรึงเวลาได้ — โค้ดจริงไม่ต้องส่ง
 * เวลาทั้งหมดเป็นเวลาเครื่องผู้ใช้ (คุณปันอยู่ไทย = Asia/Bangkok ตรงกับที่ get_dashboard_data ใช้)
 *
 * คืน null = ไม่ต้องกรอง ('all' หรือ custom ที่ยังกรอกไม่ครบ/ไม่ถูกรูปแบบ)
 */
export function rangeBounds(
  key: RangeKey,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date()
): { from: Date; to: Date } | null {
  if (key === 'all') return null;

  const day = (d: Date, addDays = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + addDays);
  const today = day(now);

  switch (key) {
    case 'today':
      return { from: today, to: day(today, 1) };

    case 'week': {
      // สัปดาห์เริ่มวันจันทร์ (ISO) — getDay() คืนอาทิตย์ = 0 จึงต้องหมุนก่อน
      const dow = (today.getDay() + 6) % 7;
      const monday = day(today, -dow);
      return { from: monday, to: day(monday, 7) };
    }

    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };

    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), q * 3, 1),
        to: new Date(now.getFullYear(), q * 3 + 3, 1),
      };
    }

    case 'year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear() + 1, 0, 1),
      };

    case 'custom': {
      if (!customFrom || !customTo) return null;
      const f = new Date(`${customFrom}T00:00:00`);
      const t = new Date(`${customTo}T00:00:00`);
      if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return null;
      // ผู้ใช้เลือก "ถึงวันที่ X" = ต้องได้ทั้งวันนั้น → ขอบบวกอีก 1 วัน
      // เลือกกลับหัว (from > to) ก็สลับให้ ไม่ต้องขึ้น error ให้เสียจังหวะ
      const a = f <= t ? f : t;
      const b = f <= t ? t : f;
      return { from: day(a), to: day(b, 1) };
    }

    default:
      return null;
  }
}
