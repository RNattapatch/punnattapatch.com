// ป้าย "อัปเดตเนื้อหา" ที่แปะบนกล่อง Offer ของทุก service (คุณปันสั่ง 2026-09-05)
// แก้ที่นี่ที่เดียว → T1/T2/T3/T4 (OfferStack) และ C1/I1 (InvestmentBlock) เปลี่ยนตาม
export const CONTENT_UPDATE = {
  month: 'กันยายน 2026',
  models: ['GPT-6 Astra', 'Claude Fable 5.1'],
} as const;

export const CONTENT_UPDATE_LINE_1 = `อัปเดตเนื้อหา ${CONTENT_UPDATE.month}`;
export const CONTENT_UPDATE_LINE_2 = `รองรับ ${CONTENT_UPDATE.models.join(' · ')}`;
