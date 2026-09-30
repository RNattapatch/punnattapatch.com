// C1 hero calculator — ชั่วโมงงานซ้ำสะสมของทีมขาย: ทำมือต่อ vs ให้ AI Agent รับงานซ้ำ
// ใช้ทั้งตอน render (ค่าตัวอย่าง) และในเบราว์เซอร์ (ลูกค้าใส่ตัวเลขตัวเอง) — สูตรเดียว ไม่มีเลขซ่อน
// กติกา (audit 2026-09-30 §2): เป็น "ราคาของปัญหา" จากเลขลูกค้า ไม่ใช่ผลที่รับประกัน
// เดือนแรก = ช่วงวัดและทดลอง AI ยังไม่รับงาน · เวลาคืนไม่ใช่เงินสดจนกว่าจะชะลอการจ้าง/ย้ายไปทำงานขาย

export interface LeakInputs {
  team: number; // คนในทีมขาย
  hoursPerDay: number; // ชั่วโมงงานซ้ำต่อคนต่อวัน
  salary: number; // เงินเดือนเฉลี่ยต่อคน (บาท)
  aiShare: number; // สัดส่วนงานซ้ำที่ AI Agent รับได้ (0–1) — สมมติฐาน ปรับได้
}

export const WORK_DAYS = 22;
export const WORK_HOURS = 8;
export const LEAK_MONTHS = [1, 6, 12] as const;
export const LEAK_DEFAULTS: LeakInputs = { team: 8, hoursPerDay: 1.5, salary: 25000, aiShare: 0.5 };

export interface LeakPoint { months: number; manualHours: number; manualBaht: number; aiHours: number; aiBaht: number; }

const clamp = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);

export function sanitize(input: Partial<LeakInputs>): LeakInputs {
  return {
    team: Math.round(clamp(input.team ?? LEAK_DEFAULTS.team, 1, 200)),
    hoursPerDay: clamp(input.hoursPerDay ?? LEAK_DEFAULTS.hoursPerDay, 0.25, 8),
    salary: Math.round(clamp(input.salary ?? LEAK_DEFAULTS.salary, 5000, 500000)),
    aiShare: clamp(input.aiShare ?? LEAK_DEFAULTS.aiShare, 0, 0.9),
  };
}

export function leakSeries(raw: Partial<LeakInputs>): LeakPoint[] {
  const { team, hoursPerDay, salary, aiShare } = sanitize(raw);
  const monthlyHours = team * hoursPerDay * WORK_DAYS;
  const hourly = salary / (WORK_DAYS * WORK_HOURS);
  return LEAK_MONTHS.map((months) => {
    const manualHours = monthlyHours * months;
    const aiHours = monthlyHours + monthlyHours * (1 - aiShare) * (months - 1);
    return { months, manualHours, manualBaht: manualHours * hourly, aiHours, aiBaht: aiHours * hourly };
  });
}

export const fmtHours = (n: number) => Math.round(n).toLocaleString('en-US');
export const fmtBaht = (n: number) => `฿${(Math.round(n / 50) * 50).toLocaleString('en-US')}`;
export const monthLabel = (m: number) => (m === 12 ? '1 ปี' : `${m} เดือน`);
