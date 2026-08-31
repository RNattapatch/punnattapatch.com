import { OFFER_ASSET_BY_CODE } from '../service-offer-assets';
import type { ProductDetailPageData } from './types';

export const PRODUCT_DETAIL_FIXTURE: ProductDetailPageData = {
  code: 'T2',
  pricingKey: 'tiktok-workshop',
  route: '/services/detail-fixture',
  kind: 'course',
  hero: {
    eyebrow: 'Private detail-page fixture',
    customerJob: 'เปลี่ยนคนเห็นออนไลน์ให้กลายเป็นนัดหมายที่ทีมตามต่อได้',
    supportingCopy: ['Fixture นี้ใช้ตรวจ shared layout, Catalog resolver และ accessibility ก่อนนำ copy จริงของ T2 ขึ้น route public.'],
    badges: ['In-house', 'Proof-first', 'LINE conversion'],
  },
  authority: ['Workshop จากโจทย์ของบริษัทจริง', 'ทีมขายและการตลาดทำงานร่วมกัน', 'AI ช่วยเตรียมงาน ไม่ขายแทนคน'],
  proof: [{
    kind: 'photo',
    image: OFFER_ASSET_BY_CODE.T2,
    alt: 'ภาพประกอบคอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content Ads และ AI',
    caption: 'ภาพประกอบ fixture สำหรับตรวจการแสดงผลของ proof wall เท่านั้น',
  }],
  pains: ['Lead เข้ามาแล้วไม่มีคนรับช่วงชัดเจน', 'ทีมทำ Content กับทีมขายทำงานคนละจังหวะ', 'หัวหน้ามองไม่เห็นว่า Lead ค้างอยู่ตรงไหน'],
  boundary: { heading: 'หน้านี้ขายอะไร', body: ['Workshop ที่ใช้ข้อมูลจริงของบริษัทมาวางเส้นทางตั้งแต่ Content ถึง Follow-up.', 'ไม่ใช่ระบบที่เปิดใช้แล้วปล่อยให้ทำงานเองโดยไม่มีคนตรวจ.'] },
  reasons: [
    { title: 'ทำจากของจริง', body: 'ทุกคนเห็นว่างานในห้องจะต่อกับงานประจำตรงไหน' },
    { title: 'ทีมขยับพร้อมกัน', body: 'Marketing และ Sales ตกลงจุดส่งต่อจากโจทย์เดียวกัน' },
  ],
  analogy: 'AI เป็นน้องฝึกงานที่รู้หลายอย่าง แต่ยังต้องมีคนในบริษัทบอกบริบทและตรวจงาน.',
  scope: [{ label: 'Day 1', title: 'Generate', learn: 'อ่านเส้นทางลูกค้า', action: 'วาง Content และจุดรับ Lead', output: 'Journey และ test plan ชุดแรก' }],
  takeHome: ['Journey ที่ทีมใช้คุยกันได้', 'ชุดงานทดลองที่นำไปต่อได้', 'รายการเจ้าของงานและ next action'],
  fit: ['ทีมที่รับ Lead ออนไลน์อยู่แล้ว', 'มีคนดู Content และคนตาม Lead', 'พร้อมนำตัวอย่างจริงเข้าห้อง'],
  notFit: 'ไม่เหมาะกับทีมที่ต้องการซื้อระบบสำเร็จรูปโดยไม่ลงมือกำหนดวิธีทำงานร่วมกัน.',
  bio: ['ผมเริ่มจากงานขายและการสอนทีมขาย จึงออกแบบ Workshop ให้ต่อกับงานหน้างาน.', 'สิ่งที่ไม่ได้ใช้ต่อหลังห้องเรียน ไม่มีประโยชน์กับทีมครับ.'],
  investment: { included: ['Workshop ตาม scope ที่ตกลง', 'เอกสารและ output จากห้อง', 'การดูแลต่อเนื่องตาม Catalog'], terms: 'ชำระ 100% ก่อนเริ่มงาน', scarcity: 'ผมสอนเองและรับจำนวนบริษัทตามคิวงานจริง' },
  faq: [
    { question: 'ต้องมีทีมกี่คน?', answer: 'เริ่มจากคนที่ทำ Content รับ Lead และดูภาพรวมการขายร่วมกัน.' },
    { question: 'ใช้กับธุรกิจนอกดีลเลอร์ได้ไหม?', answer: 'ได้ โดยเปลี่ยนปลายทางของ Journey ให้ตรงกับการนัดหมายหรือการขายของธุรกิจคุณ.' },
    { question: 'AI จะขายแทนทีมไหม?', answer: 'ไม่ครับ AI ช่วยเตรียมงาน ส่วนการตัดสินใจและการคุยกับลูกค้ายังเป็นหน้าที่ของคน.' },
    { question: 'ต้องเตรียมอะไร?', answer: 'เตรียมสินค้า กลุ่มลูกค้า และตัวอย่าง Content หรือ Lead ที่ปิดข้อมูลส่วนตัวแล้ว.' },
    { question: 'หลังเรียนมีอะไรต่อ?', answer: 'ทีมใช้ output ที่ทำในห้องเป็นจุดเริ่มต้นและรับการดูแลตามรายการใน Catalog.' },
    { question: 'ขอคุยก่อนตัดสินใจได้ไหม?', answer: 'ได้ครับ ทัก LINE เพื่อเล่าโจทย์และดูความเหมาะสมก่อน.' },
  ],
  cta: { primary: 'ทัก LINE ขอใบเสนอราคา', secondary: 'ทัก LINE ขอคลิปตัวอย่างสอน', keyword: 'ONLINE' },
  seo: { title: 'Fixture · Product Detail', description: 'Private fixture for product detail page quality assurance.' },
};
