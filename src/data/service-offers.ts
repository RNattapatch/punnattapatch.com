export type OfferCode = 'T1' | 'T2' | 'T3' | 'T4' | 'C1' | 'I1' | 'A1';

export type OfferKind = 'training' | 'consulting' | 'implementation' | 'upgrade';

export type ThumbnailFilename =
  | 't1-sales-skill-ai.png'
  | 't2-online-to-offline-ai.png'
  | 't3-sales-back-office-ai.png'
  | 't4-ai-workflow-pilot.png'
  | 'c1-daily-sales-consulting.png'
  | 'i1-automated-sales-dashboard.png'
  | 'a1-sales-mastery-with-ai.png';

export interface ServiceOffer {
  code: OfferCode;
  kind: OfferKind;
  publicName: string;
  customerJob: string;
  formatLabel: string;
  outcomeLabel: string;
  description: string;
  bullets: readonly [string, string, string];
  pricingKey: string | null;
  thumbnailFile: ThumbnailFilename;
  imageAlt: string;
  detailHref: string | null;
  primaryCtaLabel: string;
  primaryCtaKind: 'detail' | 'line';
}

export const SERVICE_OFFERS: readonly ServiceOffer[] = [
  {
    code: 'T1',
    kind: 'training',
    publicName: 'คอร์สจิตวิทยาการขาย + AI Agent สำหรับทีมขาย B2B',
    customerJob: 'เข้าใจเหตุผลซื้อและต่อรองเป็น',
    formatLabel: 'Training · 1 day',
    outcomeLabel: 'เข้าใจคน ปิดดีลเป็น และไม่รีบลดราคา',
    description: 'ฝึกทีมอ่านเหตุผลซื้อ ถามและต่อรองบนคุณค่า แล้วสร้าง AI Sales Coach จากเคสจริงเพื่อช่วยเตรียม ซ้อม และทบทวนดีล',
    bullets: ['แยกเหตุผลซื้อ Functional · Emotional · Social', 'ต่อรองและรับข้อโต้แย้งโดยรักษาคุณค่า', 'ซ้อมดีลกับ AI Agent จาก Company Context'],
    pricingKey: 'inhouse-a',
    thumbnailFile: 't1-sales-skill-ai.png',
    imageAlt: 'คอร์สจิตวิทยาการขายและ AI Agent สำหรับทีมขาย B2B',
    detailHref: '/services/t1-sales-skills',
    primaryCtaLabel: 'ดูรายละเอียดคอร์ส',
    primaryCtaKind: 'detail',
  },
  {
    code: 'T2',
    kind: 'training',
    publicName: 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI',
    customerJob: 'เปลี่ยนคนดู/Lead เป็นนัดหมายและยอดขาย',
    formatLabel: 'Training · 2 days',
    outcomeLabel: 'เปลี่ยนความสนใจออนไลน์ให้กลายเป็นนัดหมายและยอดขาย',
    description: 'เชื่อม Content, Ads และทีมขายให้พา Lead ต่อไปถึงการนัดหมายและการซื้อ โดยให้ AI ช่วยงานเตรียมและติดตาม',
    bullets: ['อ่านเส้นทางจากคนดูสู่การทักแชต', 'ออกแบบจุดส่งต่อ Lead ที่ไม่ตกหล่น', 'วางจังหวะติดตามเพื่อเปลี่ยนเป็นนัดหมาย'],
    pricingKey: 'tiktok-workshop',
    thumbnailFile: 't2-online-to-offline-ai.png',
    imageAlt: 'คอร์สเพิ่มยอดขายจากออนไลน์ไปสู่การนัดหมายและยอดขาย',
    detailHref: '/services/online-to-sales',
    primaryCtaLabel: 'ดูรายละเอียดคอร์ส',
    primaryCtaKind: 'detail',
  },
  {
    code: 'T3',
    kind: 'training',
    publicName: 'คอร์สอบรมวางระบบหลังบ้านฝ่ายขาย: Report + Dashboard + AI',
    customerJob: 'ให้หัวหน้าเห็นดีลค้างโดยไม่ไล่ Report',
    formatLabel: 'Training · 1 day',
    outcomeLabel: 'เห็นดีลค้างและจุดที่ต้องช่วยได้ทันเวลา',
    description: 'ทำให้ทีมใช้ภาษาเดียวกันในการรายงาน และให้หัวหน้าเห็นดีลค้าง งานที่ต้องตาม และจุดที่ควรเข้าไปช่วย โดยมี AI เป็นตัวช่วยสรุปงาน',
    bullets: ['กำหนดข้อมูลดีลที่ทุกคนต้องอัปเดต', 'ออกแบบ Report ที่ใช้ตัดสินใจได้จริง', 'ทำ Dashboard เพื่อเห็นงานค้างทันที'],
    pricingKey: 'ai-workshop-advance',
    thumbnailFile: 't3-sales-back-office-ai.png',
    imageAlt: 'คอร์สอบรมวางระบบ Report และ Dashboard สำหรับฝ่ายขาย',
    detailHref: '/services/t3-sales-back-office',
    primaryCtaLabel: 'ดูรายละเอียดคอร์ส',
    primaryCtaKind: 'detail',
  },
  {
    code: 'T4',
    kind: 'training',
    publicName: 'คอร์ส Advance AI & Business Automation',
    customerJob: 'ทดลอง AI Workflow ก่อนลงทุนทำระบบจริง',
    formatLabel: 'Workshop · 1 day',
    outcomeLabel: 'เลือกหนึ่งงานซ้ำ แล้วให้ทีมลอง AI Workflow แบบปลอดภัย',
    description: 'เอางานซ้ำหนึ่งเรื่องมาแยกหน้าที่คนและ AI สร้าง Safe Sandbox ให้ทีมลองรันด้วยข้อมูล dummy หรือข้อมูลที่ mask แล้ว ก่อนตัดสินใจลงทุนทำระบบจริง',
    bullets: ['เลือกหนึ่ง Workflow ที่มีเจ้าของชัด', 'แยกสิ่งที่ AI ช่วยได้และสิ่งที่คนต้องตัดสินใจ', 'รัน Safe Sandbox แล้วตัดสินใจ Stop, Revise หรือ Install'],
    pricingKey: 't4-ai-workflow-pilot-day',
    thumbnailFile: 't4-ai-workflow-pilot.png',
    imageAlt: 'ทีมไทยกำลังทดลอง AI Workflow จากงานจริงของบริษัท',
    detailHref: '/services/advance-ai-automation',
    primaryCtaLabel: 'ดูรายละเอียดคอร์ส',
    primaryCtaKind: 'detail',
  },
  {
    code: 'C1',
    kind: 'consulting',
    publicName: 'บริการวางระบบฝ่ายขายแบบรายวัน',
    customerJob: 'ช่วยคิดและออกแบบทางออกหนึ่งเรื่อง',
    formatLabel: 'Consulting · 1 primary outcome/day',
    outcomeLabel: 'จบหนึ่งเรื่องสำคัญพร้อมทางออกที่ทีมเดินต่อได้',
    description: 'ทำงานกับคุณหนึ่งวันเพื่อออกแบบ 1 primary outcome ที่ทีมเดินต่อได้ โดยเลือกได้ 1 หัวข้อ: Online-to-Sales Full Journey; team/KPI/commission; Sales Control/Report/Dashboard Design; AI workflow or AI agent prototype',
    bullets: ['จัดลำดับปัญหาที่กระทบยอดขายก่อน', 'ออกแบบทางออกหนึ่งเรื่องให้ตัดสินใจและลงมือได้', 'สรุปสิ่งที่ทีมต้องทำต่อหลังจบวัน'],
    pricingKey: 'daily-sales-consulting',
    thumbnailFile: 'c1-daily-sales-consulting.png',
    imageAlt: 'บริการวางระบบฝ่ายขายแบบรายวัน',
    detailHref: '/services/daily-consulting',
    primaryCtaLabel: 'ดูรายละเอียดบริการ',
    primaryCtaKind: 'detail',
  },
  {
    code: 'I1',
    kind: 'implementation',
    publicName: 'บริการทำ Sales Dashboard + Report อัตโนมัติ',
    customerJob: 'ให้ทีมปันสร้าง Production System',
    formatLabel: 'Implementation',
    outcomeLabel: 'ผู้จัดการเห็นสถานะขายโดยไม่ต้องรวบรวมเอง',
    description: 'ให้ทีมปันสร้างระบบ Dashboard และ Report ที่ทีมใช้กับงานจริง เพื่อให้ข้อมูลขายถูกส่งต่อและติดตามได้ทุกวัน',
    bullets: ['รวมข้อมูลดีลไว้ในจุดที่ทีมใช้ร่วมกัน', 'สร้าง Report ที่พร้อมใช้ในรอบการทำงานจริง', 'ส่งมอบพร้อม UAT และสอนทีมใช้'],
    pricingKey: 'daruma-starter',
    thumbnailFile: 'i1-automated-sales-dashboard.png',
    imageAlt: 'บริการสร้าง Sales Dashboard และ Report อัตโนมัติ',
    detailHref: '/services/dashboard-build',
    primaryCtaLabel: 'ดูรายละเอียดบริการ',
    primaryCtaKind: 'detail',
  },
  {
    code: 'A1',
    kind: 'upgrade',
    publicName: 'Advance Program: Sales Mastery with AI',
    customerJob: 'เรียนแล้วมีคนพาทำจนใช้จริง',
    formatLabel: 'Training + Guided Implementation',
    outcomeLabel: 'เปลี่ยนสิ่งที่เรียนให้กลายเป็นวิธีทำงานของทีม',
    description: 'โปรแกรมต่อยอดสำหรับทีมที่ต้องการคนพาทำจากสิ่งที่เรียนไปสู่ระบบขายที่ใช้ได้จริง โดย AI เป็นส่วนสนับสนุนการทำงาน',
    bullets: ['เลือกเรื่องที่ควรทำต่อจากสถานการณ์จริง', 'ลงมือวางระบบร่วมกับทีม', 'ติดตามให้วิธีทำงานใหม่ถูกใช้จริง'],
    pricingKey: null,
    thumbnailFile: 'a1-sales-mastery-with-ai.png',
    imageAlt: 'Advance Program เรียนและจับมือวางระบบทีมขายจนใช้จริง',
    detailHref: null,
    primaryCtaLabel: 'คุยกับปันใน LINE',
    primaryCtaKind: 'line',
  },
] as const;

export const OFFER_BY_CODE: Readonly<Record<OfferCode, ServiceOffer>> = Object.fromEntries(
  SERVICE_OFFERS.map((offer) => [offer.code, offer]),
) as Record<OfferCode, ServiceOffer>;
