const DEFAULT_WEIGHTS = Object.freeze({ hook: 0.32, offer: 0.29, copy: 0.23, visual: 0.16 });

function persona(id, name, role, segment, profile = {}) {
  return Object.freeze({
    id,
    name,
    role,
    segment,
    revenueBand: profile.revenueBand ?? '฿30–200M',
    awareness: profile.awareness ?? 'problem-aware',
    risk: profile.risk ?? 3,
    priceSensitivity: profile.priceSensitivity ?? 3,
    evidenceNeed: profile.evidenceNeed ?? 3,
    urgency: profile.urgency ?? 3,
    keywords: Object.freeze(profile.keywords ?? []),
    objections: Object.freeze(profile.objections ?? []),
    weights: Object.freeze({ ...DEFAULT_WEIGHTS, ...(profile.weights ?? {}) }),
    threshold: profile.threshold ?? 65,
  });
}

export const PERSONAS = Object.freeze([
  persona('owner-growth', 'คุณอานนท์', 'เจ้าของธุรกิจสายโต', 'Owner', {
    risk: 4, urgency: 5, evidenceNeed: 3, threshold: 63,
    keywords: ['เจ้าของ', 'เติบโต', 'ยอดขาย', 'roi', 'pipeline'],
    objections: ['ช้า', 'ไม่เห็นผลลัพธ์'],
  }),
  persona('owner-conservative', 'คุณวิชัย', 'เจ้าของระวังความเสี่ยง', 'Owner', {
    risk: 1, priceSensitivity: 4, evidenceNeed: 5, threshold: 73,
    keywords: ['เจ้าของ', 'คุ้ม', 'ควบคุม', 'หลักฐาน'],
    objections: ['เสี่ยง', 'ลงทุนสูง', 'กระทบงานเดิม'],
  }),
  persona('family-founder', 'เฮียสมชาย', 'ผู้ก่อตั้งธุรกิจครอบครัว', 'Owner', {
    awareness: 'solution-aware', risk: 2, evidenceNeed: 4, threshold: 70,
    keywords: ['คนจริง', 'หน้างาน', 'ความไว้ใจ', 'ส่งต่อ'],
    objections: ['ทีมไม่ยอมใช้', 'ไม่เข้ากับวิธีทำงานเดิม'],
  }),
  persona('successor-digital', 'คุณมิ้นท์', 'ทายาทรุ่นสอง', 'Owner', {
    awareness: 'product-aware', risk: 4, urgency: 4, threshold: 61,
    keywords: ['ai', 'automation', 'ขยาย', 'ระบบ', 'รุ่นสอง'],
    objections: ['ภาพลักษณ์เก่า', 'พ่อไม่อนุมัติ'],
  }),
  persona('ceo-professional', 'คุณศิริน', 'CEO มืออาชีพ', 'Executive', {
    risk: 3, evidenceNeed: 5, urgency: 4, threshold: 69,
    keywords: ['strategy', 'ผลลัพธ์', 'roi', 'รายได้', 'เร็ว'],
    objections: ['ไม่วัดผล', 'ไม่เชื่อมกับยุทธศาสตร์'],
  }),
  persona('md-pragmatic', 'คุณธนา', 'Managing Director', 'Executive', {
    risk: 3, evidenceNeed: 4, threshold: 66,
    keywords: ['ผลลัพธ์', 'แผน', 'เจ้าของ', 'ทีมงาน'],
    objections: ['ใช้เวลาผู้บริหาร', 'ขาดเจ้าภาพ'],
  }),
  persona('cfo-roi', 'คุณปราง', 'CFO', 'Finance', {
    risk: 1, priceSensitivity: 5, evidenceNeed: 5, weights: { hook: 0.2, offer: 0.42, copy: 0.28, visual: 0.1 }, threshold: 75,
    keywords: ['roi', 'คุ้ม', 'ต้นทุน', 'กระแสเงิน', 'ลด'],
    objections: ['ต้นทุนแฝง', 'คืนทุนช้า', 'ตัวเลขไม่ชัด'],
  }),
  persona('controller-detail', 'คุณนุช', 'ผู้ควบคุมการเงิน', 'Finance', {
    risk: 1, priceSensitivity: 4, evidenceNeed: 5, threshold: 76,
    keywords: ['งบประมาณ', 'วัดผล', 'รายงาน', 'ตัวเลข'],
    objections: ['ข้อมูลไม่ครบ', 'อนุมัติยาก'],
  }),
  persona('coo-efficiency', 'คุณประภัสสร', 'COO', 'Operations', {
    risk: 2, urgency: 4, evidenceNeed: 4, threshold: 68,
    keywords: ['workflow', 'ลดเวลา', 'ขั้นตอน', 'ประสิทธิภาพ'],
    objections: ['งานสะดุด', 'เชื่อมระบบไม่ได้'],
  }),
  persona('ops-manager', 'คุณเมธา', 'ผู้จัดการฝ่ายปฏิบัติการ', 'Operations', {
    risk: 2, urgency: 5, threshold: 66,
    keywords: ['หน้างาน', 'เวลา', 'ลดงานซ้ำ', 'automation'],
    objections: ['เพิ่มงาน', 'ทีมทำไม่เป็น'],
  }),
  persona('sales-director', 'คุณกร', 'ผู้อำนวยการฝ่ายขาย', 'Sales', {
    risk: 4, urgency: 5, evidenceNeed: 3, threshold: 62,
    keywords: ['pipeline', 'ปิดการขาย', 'ยอดขาย', 'ลูกค้า', 'b2b'],
    objections: ['ไม่ช่วยปิดงาน', 'ทีมไม่ใช้'],
  }),
  persona('sales-relationship', 'คุณชาญ', 'หัวหน้าขายแบบความสัมพันธ์', 'Sales', {
    risk: 2, evidenceNeed: 3, threshold: 68,
    keywords: ['ความไว้ใจ', 'ลูกค้าเดิม', 'ติดตาม', 'คนจริง'],
    objections: ['เสียความเป็นมนุษย์', 'ai แทนคน'],
  }),
  persona('sales-manager-legacy', 'คุณบอย', 'ผู้จัดการขายสายเดิม', 'Sales', {
    risk: 1, evidenceNeed: 3, threshold: 71,
    keywords: ['ง่าย', 'ทีมขาย', 'เอกเซล', 'ลูกค้า'],
    objections: ['เรียนยาก', 'ระบบซับซ้อน'],
  }),
  persona('marketing-director', 'คุณพลอย', 'ผู้อำนวยการฝ่ายการตลาด', 'Marketing', {
    risk: 4, evidenceNeed: 4, urgency: 4, weights: { hook: 0.38, offer: 0.22, copy: 0.22, visual: 0.18 }, threshold: 65,
    keywords: ['brand', 'กลุ่มเป้าหมาย', 'แคมเปญ', 'เติบโต'],
    objections: ['ไม่ตรง brand', 'เคลมแรงเกิน'],
  }),
  persona('performance-marketer', 'คุณไอซ์', 'Performance Marketer', 'Marketing', {
    risk: 5, evidenceNeed: 5, urgency: 5, weights: { hook: 0.4, offer: 0.26, copy: 0.18, visual: 0.16 }, threshold: 61,
    keywords: ['ctr', 'cpl', 'roas', 'test', 'ครีเอทีฟ'],
    objections: ['ไม่มี metric', 'ทดสอบไม่ได้'],
  }),
  persona('brand-manager', 'คุณออม', 'Brand Manager', 'Marketing', {
    risk: 2, evidenceNeed: 3, threshold: 69,
    keywords: ['brand', 'ภาพลักษณ์', 'ความเชื่อถือ', 'ลูกค้า'],
    objections: ['ภาษาขายเกิน', 'ภาพไม่ตรงแบรนด์'],
  }),
  persona('content-lead', 'คุณเจน', 'Content Lead', 'Marketing', {
    risk: 4, urgency: 4, weights: { hook: 0.42, offer: 0.18, copy: 0.24, visual: 0.16 }, threshold: 62,
    keywords: ['hook', 'คอนเทนต์', 'เล่าเรื่อง', 'วิดีโอ'],
    objections: ['hook ไม่หยุด', 'เนื้อหาซ้ำ'],
  }),
  persona('hr-director', 'คุณนิ่ม', 'ผู้อำนวยการฝ่ายบุคคล', 'People', {
    risk: 2, evidenceNeed: 4, threshold: 70,
    keywords: ['คน', 'ทีม', 'ทักษะ', 'เปลี่ยนแปลง'],
    objections: ['คนต่อต้าน', 'ไม่มีแผนพัฒนา'],
  }),
  persona('learning-manager', 'คุณแพร', 'L&D Manager', 'People', {
    risk: 3, evidenceNeed: 4, threshold: 67,
    keywords: ['workshop', 'ลงมือทำ', 'ทักษะ', 'วัดผล'],
    objections: ['อบรมแล้วไม่ใช้', 'ไม่มี output'],
  }),
  persona('cio-governance', 'คุณวรุณ', 'CIO', 'Technology', {
    risk: 1, evidenceNeed: 5, threshold: 75,
    keywords: ['security', 'governance', 'integration', 'data', 'ai'],
    objections: ['ข้อมูลรั่ว', 'ไม่ผ่านนโยบาย'],
  }),
  persona('cto-builder', 'คุณภูมิ', 'CTO', 'Technology', {
    risk: 4, evidenceNeed: 5, threshold: 68,
    keywords: ['prototype', 'api', 'integration', 'ระบบ', 'ai'],
    objections: ['เทคโนโลยีล็อกอิน', 'สเกลไม่ได้'],
  }),
  persona('it-manager', 'คุณตั้ม', 'IT Manager', 'Technology', {
    risk: 1, evidenceNeed: 4, threshold: 72,
    keywords: ['setup', 'support', 'integration', 'ปลอดภัย'],
    objections: ['ต้องดูแลเพิ่ม', 'ไม่มี support'],
  }),
  persona('procurement', 'คุณกล้วย', 'จัดซื้อ', 'Governance', {
    risk: 1, priceSensitivity: 5, evidenceNeed: 4, threshold: 76,
    keywords: ['ราคา', 'ขอบเขต', 'เทียบ', 'สัญญา'],
    objections: ['ราคาไม่ชัด', 'ขอบเขตไม่ชัด'],
  }),
  persona('legal-compliance', 'คุณลดา', 'กฎหมายและ Compliance', 'Governance', {
    risk: 1, evidenceNeed: 5, threshold: 78,
    keywords: ['pdpa', 'ข้อมูล', 'ควบคุม', 'นโยบาย'],
    objections: ['เคลมเกินจริง', 'เสี่ยงกฎหมาย'],
  }),
  persona('bu-director', 'คุณเอก', 'Business Unit Director', 'Executive', {
    risk: 4, urgency: 5, threshold: 64,
    keywords: ['p&l', 'รายได้', 'ลูกค้า', 'เร็ว'],
    objections: ['ไม่ช่วย target', 'ต้องรอส่วนกลาง'],
  }),
  persona('gm-balanced', 'คุณญา', 'General Manager', 'Executive', {
    risk: 3, evidenceNeed: 4, threshold: 67,
    keywords: ['ทีม', 'ผลลัพธ์', 'งบ', 'แผน'],
    objections: ['ประสานยาก', 'เจ้าของไม่เห็นด้วย'],
  }),
  persona('ecommerce-owner', 'คุณโจ้', 'เจ้าของ E-commerce', 'Owner', {
    revenueBand: '฿30–80M', risk: 5, urgency: 5, evidenceNeed: 3, threshold: 59,
    keywords: ['roas', 'ads', 'สเกล', 'ยอดขาย', 'เร็ว'],
    objections: ['เวิร์กช็อปช้า', 'ใช้กับ ads ไม่ได้'],
  }),
  persona('services-partner', 'อาจารย์วี', 'หุ้นส่วนธุรกิจบริการ', 'Owner', {
    risk: 2, evidenceNeed: 4, threshold: 69,
    keywords: ['ความเชี่ยวชาญ', 'ลูกค้า', 'ความไว้ใจ', 'กรณีศึกษา'],
    objections: ['ลดทอนความเชี่ยวชาญ', 'ภาษาตลาดเกิน'],
  }),
  persona('manufacturer-owner', 'เฮียนพ', 'เจ้าของโรงงาน', 'Owner', {
    revenueBand: '฿80–200M', risk: 1, evidenceNeed: 4, threshold: 72,
    keywords: ['โรงงาน', 'หน้างาน', 'ต้นทุน', 'ของเสีย'],
    objections: ['ใช้ไม่ได้กับโรงงาน', 'กระทบ production'],
  }),
  persona('advisor-trusted', 'คุณนิธิ', 'ที่ปรึกษาเจ้าของ', 'Influencer', {
    risk: 2, evidenceNeed: 5, threshold: 73,
    keywords: ['กรณีศึกษา', 'หลักฐาน', 'ผลลัพธ์', 'แผน'],
    objections: ['เสียชื่อ', 'อ้างเกินจริง'],
  }),
]);

export function getPersona(personaId) {
  return PERSONAS.find((item) => item.id === personaId) ?? null;
}
