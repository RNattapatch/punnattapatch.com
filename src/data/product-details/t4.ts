import t2WorkshopHandsOn from '../../assets/services/proof/t2-workshop-hands-on.jpg';
import t2WorkshopCompany from '../../assets/services/proof/t2-workshop-company.jpg';
import type { ProductDetailPageData, PublicProofImage } from './types';

export const T4_LINE_KEYWORD = 'AI WORKFLOW';
export const SHOW_T4_BONUS_CARDS = false;

const T4_REAL_ACTIVITY: PublicProofImage = {
  publicSrc: '/lp/inhouse/hero-pointing.jpg',
  width: 1600,
  height: 1200,
};

export const T4_PRODUCT_DETAIL: ProductDetailPageData = {
  code: 'T4',
  pricingKey: 't4-ai-workflow-pilot-day',
  route: '/services/advance-ai-automation',
  kind: 'course',
  showPriceInHero: true,
  chapters: [
    { id: 'proof', number: '01', navLabel: 'ดูห้องทำงานจริง', heading: 'เริ่มจากคนและงานที่อยู่ตรงหน้า', copy: 'ดูภาพจาก Workshop และการทำงานจริงก่อน แล้วค่อยดูว่า Pilot Day พาทีมแยกงานหนึ่งเรื่องอย่างไร', tone: 'ivory' },
    { id: 'diagnose', number: '02', navLabel: 'เลือกงานให้ถูก', heading: 'เลือกงานซ้ำที่ควรลองก่อน', copy: 'งานต้องมีเจ้าของ อธิบาย Input และ Output ได้ และมีข้อมูลที่ทำให้ทดลองอย่างปลอดภัยได้', tone: 'sand' },
    { id: 'workshop', number: '03', navLabel: 'ลองใน Sandbox', heading: 'ให้ทีมลองรัน Flow ด้วยตัวเอง', copy: 'Map งานเดิม วางจุดตรวจของคน แล้วทดลองด้วยข้อมูลจำลองหรือข้อมูลที่ปิดข้อมูลแล้วในหนึ่งวัน', tone: 'ivory' },
    { id: 'decision', number: '04', navLabel: 'ตัดสินใจรอบถัดไป', heading: 'จบด้วยคำตอบที่ใช้ตัดสินใจได้', copy: 'ใช้สิ่งที่ทดสอบได้จริงเลือกว่าจะ Stop, Revise หรือเตรียม Scope สำหรับงาน Build ต่อ', tone: 'sand' },
  ],
  hero: {
    eyebrow: 'IN-HOUSE WORKFLOW PILOT DAY · T4',
    customerJob: 'ทดลอง AI Workflow จากงานจริงของบริษัท ก่อนลงทุนทำระบบจริง',
    supportingCopy: [],
    microcopy: 'ทดลองงานจริงก่อนลงทุนระบบจริง',
    steps: [
      { label: '01 · Pick', title: 'เลือกงานที่ทีมทำซ้ำ', body: 'เริ่มจากงานที่เกิดบ่อย มี Process owner และอธิบาย Input/Output ได้' },
      { label: '02 · Test', title: 'ลองกับข้อมูลที่ปลอดภัย', body: 'ทีมรัน Flow ด้วยข้อมูลจำลอง พร้อมจุดตรวจที่คนต้องรับผิดชอบ' },
      { label: '03 · Decide', title: 'จบวันด้วยข้อสรุป', body: 'ใช้ผลทดสอบเลือก Stop, Revise หรือเตรียมทำระบบต่อ' },
    ],
    badges: ['หนึ่งบริษัท · หนึ่งวัน', 'หนึ่ง Workflow', 'ใช้ข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask'],
    visual: {
      image: T4_REAL_ACTIVITY,
      alt: 'ปัน ณัฐพัชร์สอนทีมในกิจกรรม Workshop หน้าจอทำงานจริง',
      label: 'WORKFLOW PILOT DAY · ทีมจริง',
      caption: 'ภาพกิจกรรมจริง: ไล่งานหนึ่งเรื่องบนหน้าจอร่วมกัน ก่อนเลือก Flow ที่จะทดลอง',
    },
  },
  authority: [
    'สร้าง AI Workflow ใช้กับงานขายและงานที่ปรึกษาของตัวเอง',
    'ทำงานตั้งแต่การแยกโจทย์ธุรกิจถึงจุดตรวจโดยคน',
    'ออกแบบ Workshop จากงานจริงของทีม ไม่เริ่มจากรายชื่อ Tool',
    'อบรมและวางระบบร่วมกับ 18 องค์กร',
  ],
  proof: [
    { id: 't4-live-workflow-session', kind: 'photo', image: T4_REAL_ACTIVITY, alt: 'ปัน ณัฐพัชร์สอนทีมในกิจกรรม Workshop หน้าจอทำงานจริง', caption: 'ภาพจากกิจกรรมจริง: ทีมดูงานบนหน้าจอเดียวกัน แล้วไล่สิ่งที่เข้ามา กติกาที่ใช้ และจุดที่คนต้องตัดสิน' },
    { id: 't4-hands-on-workshop', kind: 'photo', image: t2WorkshopHandsOn, alt: 'ผู้เข้าร่วม Workshop ทำงานร่วมกันบนแล็ปท็อป', caption: 'ในห้อง Workshop ทีมต้องอธิบายงานของตัวเองให้กันฟัง ไม่ได้เริ่มจากเดโมที่ตัดข้อยกเว้นออก' },
    { id: 't4-team-workshop', kind: 'photo', image: t2WorkshopCompany, alt: 'ปัน ณัฐพัชร์ยืนกับทีมผู้เข้าร่วม In-house Workshop', caption: 'งาน In-house ใช้คนที่ทำงานนั้นจริงอยู่ในห้อง เพื่อให้คนตัดสินกติกาและรับผิดชอบ Flow ต่อได้' },
  ],
  pains: [
    'งานซ้ำกินเวลาทีม แต่ไม่มีใครระบุได้ว่าขั้นไหนควรให้ AI ช่วยและขั้นไหนต้องให้คนตัดสิน',
    'ซื้อ AI หรือเข้าอบรมมาแล้ว แต่ทีมยังไม่รู้ว่าจะเริ่มจากงานจริงชิ้นใด',
    'ไอเดีย Automation ขยายไปหลายเรื่องจนไม่มี Workflow ใดจบและทดสอบได้',
    'ข้อมูลในงานมีความเสี่ยง แต่ยังไม่มีวิธีแยกว่าอะไรใช้ได้ ต้อง Mask ต้องขออนุมัติ หรือห้ามส่งออก',
    'Owner ต้องตัดสินใจว่าจะหยุด ปรับ หรือจ้างทำระบบ โดยยังไม่มีหลักฐานจากการทดลอง',
  ],
  boundary: {
    heading: 'Workflow Pilot Day สำหรับหนึ่ง Workflow ใน Safe Sandbox',
    body: [
      'วัน Workshop เราหยิบงานซ้ำที่ทีมเสียเวลาอยู่หนึ่งเรื่องมาแยกว่า AI ควรช่วยตรงไหน และตรงไหนต้องให้คนตัดสิน จากนั้น Core build team จะลองรันใน Safe Sandbox ด้วยข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask',
      'เมื่อจบวัน ทีมมี Workflow Map, Safe Sandbox, Human–AI Responsibility Brief และ Stop/Revise/Install Decision Memo สำหรับตัดสินใจก่อนซื้อระบบหรือจ้างพัฒนาจริง',
      'Fit Gate ก่อนออกใบแจ้งหนี้ ต้องเช็กว่างานมี Process owner, เกิดบ่อยพอให้ทดสอบ, ใช้ข้อมูลปลอดภัยได้ และยอมรับ Scope หนึ่ง Workflow. งานหลาย Workflow, Production integration, Migration, SLA หรือการรับประกันลด Headcount ต้องประเมินเป็น I1/งาน Build แยก',
    ],
  },
  reasons: [
    { title: 'เริ่มจากงานซ้ำ ไม่เริ่มจากชื่อ Tool', body: 'ทีมเลือกงานที่อธิบาย Input, Rule, Exception และ Output ได้ จึงเห็นว่า AI ช่วยตรงไหนได้จริง' },
    { title: 'ข้อมูลยังไม่ออกจากขอบเขตที่ตกลงกัน', body: 'ทีมทดสอบด้วยข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask และตั้ง Human review ก่อนแตะข้อมูลหรือการตัดสินใจที่มีผลจริง' },
    { title: 'Decision Memo เก็บสิ่งที่ลองไว้ครบ', body: 'Owner เห็นสิ่งที่ทดสอบ ข้อจำกัด ความเสี่ยง และ Next step ก่อนเลือก Stop, Revise หรือ Install' },
  ],
  analogy: 'Sandbox คือพื้นที่ลองเดิน Flow ก่อนใช้กับงานจริงครับ ถ้าทีมยังอธิบายกติกาและจุดตรวจไม่ได้ การซื้อ Tool เพิ่มจะทำให้ความไม่ชัดเดินเร็วขึ้น',
  scope: [
    { label: 'Fit Gate', title: 'ตอบ 4 คำถามก่อนเลือกงาน', learn: 'งานซ้ำอะไร · เกิดบ่อยแค่ไหน · ใครเป็น Process owner · มีข้อมูลเสี่ยงไหม', action: 'เลือก Candidate หนึ่งเรื่องที่ทีมอธิบายงานเดิมและความเสี่ยงได้', output: 'Fit decision + ขอบเขตหนึ่ง Workflow' },
    { label: 'ช่วงที่ 1 · Map', title: 'เห็นงานเดิมก่อนให้ AI แตะงาน', learn: 'แยก Trigger, Input, Rule, Exception, Output และขั้นที่คนต้องตัดสิน', action: 'ทำ Workflow Map จากตัวอย่างงานที่ปิดข้อมูลแล้ว', output: 'Workflow Map ฉบับบริษัท' },
    { label: 'ช่วงที่ 2 · Sandbox', title: 'สร้างที่ทดลองให้ทีมลองรันเอง', learn: 'กำหนดข้อมูลจำลอง, เส้นทางทดสอบ, จุดหยุด และเกณฑ์ที่ถือว่าผลใช้ได้', action: 'สร้าง Safe Sandbox และให้ Core build team รันจาก Input ถึง Output', output: 'Safe Sandbox Prototype + Test record' },
    { label: 'ช่วงที่ 3 · Responsibility', title: 'ล็อกว่าคนต้องตรวจและรับผิดชอบตรงไหน', learn: 'AI ช่วยเตรียมหรือจัดรูปแบบได้ แต่คนยังตรวจข้อมูล, อนุมัติ และสื่อสารในจุดที่มีผลจริง', action: 'เขียน Human–AI Responsibility Brief จาก Flow ที่ทดสอบ', output: 'Human–AI Responsibility Brief' },
    { label: 'ช่วงที่ 4 · Decide', title: 'เลือก Stop, Revise หรือ Install', learn: 'ตัดสินจากสิ่งที่รันได้จริง, ความเสี่ยง และสิ่งที่ต้องเตรียมก่อนขยาย', action: 'Owner/Manager ลงข้อสรุปและ Next step ใน Decision Memo', output: 'Stop/Revise/Install Decision Memo' },
  ],
  takeHome: [
    'Workflow Map สำหรับงานซ้ำหนึ่งเรื่อง',
    'Safe Sandbox Prototype ที่ทดสอบด้วยข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask',
    'Human–AI Responsibility Brief ระบุจุด Human review และความรับผิดชอบ',
    'Stop/Revise/Install Decision Memo พร้อม Owner, เหตุผล, ความเสี่ยง และ Next step',
    'บันทึกการทดสอบจาก Core build team',
  ],
  bonusCards: {
    enabled: SHOW_T4_BONUS_CARDS,
    heading: 'ของที่ทีมคุณได้รับกลับไปใช้ต่อ — รวมอยู่ในค่าอบรมแล้ว ไม่ต้องซื้อ Template เพิ่ม',
    intro: 'ไฟล์เหล่านี้ช่วยให้ทีมคัดงาน, ตรวจข้อมูล และทบทวนการตัดสินใจหลัง Workshop',
    items: [
      { number: '01', title: '30 AI Workflow Ideas: ตัวอย่างงานซ้ำที่ AI อาจช่วยได้', user: 'Owner และ Champion', timing: 'ก่อนเลือก Candidate', outcome: 'หางานจาก Pain ของทีม ไม่เริ่มจากชื่อ Tool', format: 'Google Sheet' },
      { number: '02', title: 'AI Data Safety Checklist: เช็กก่อนให้ AI แตะข้อมูล 30 จุด', user: 'Champion และ Manager', timing: 'ก่อนทดลองข้อมูล', outcome: 'แยกข้อมูลที่ใช้ได้ ต้อง Mask ต้องขออนุมัติ หรือห้ามส่งออก', format: 'Google Sheet/PDF' },
      { number: '03', title: 'AI Build Brief: คู่มือสั่ง AI สร้างระบบโดยไม่บวม', user: 'Champion และ Core build team', timing: 'ก่อนเริ่ม Build', outcome: 'กำหนด Goal, User, Input, Rule, Exception, Output และ Acceptance', format: 'Google Doc' },
      { number: '04', title: 'Workflow Example Library: ตัวอย่างพร้อมคำอธิบายว่าอะไรไม่ควรลอก', user: 'Owner และทีมปฏิบัติการ', timing: 'เมื่อหา Pattern ที่เหมาะ', outcome: 'Adapt ตาม Context ของบริษัท ไม่ Copy ระบบคนอื่นทั้งก้อน', format: 'Google Doc' },
      { number: '05', title: '30-Minute Decision Review: ตรวจงานหลังคลาส', user: 'Owner และ Manager', timing: 'ภายใน 14 วันหลัง Workshop', outcome: 'เลือก Stop, Revise หรือ Install จากหลักฐานที่ทีมมี', format: 'Google Sheet' },
    ],
  },
  fit: [
    'บริษัทที่มีงานซ้ำชัดเจนและเลือกทดลองได้หนึ่ง Workflow',
    'มี Process owner ที่อธิบายงานเดิมและตัดสินใจเรื่องกติกาได้',
    'ยอมใช้ข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask ใน Workshop',
    'Owner ที่อยากตัดสินใจก่อนลงทุนระบบ Production จริง',
  ],
  notFit: 'ยังไม่เหมาะถ้าต้องการหลาย Workflow, ระบบ Production, Live integration, Migration, SLA, Bug-free guarantee หรือหวังลด Headcount ทันที. ถ้า Process หรือ Priority ยังไม่ชัด ให้เริ่ม C1; ถ้าพร้อมใช้ Live data และต้องการ Build production ให้ประเมิน I1/งาน Build แยก',
  relatedOffer: { href: '/services/dashboard-build', label: 'ต้องการระบบ Production ที่มี Data map, Build, UAT และสอนใช้? ดูบริการ I1' },
  bio: [
    'ผมใช้ AI และ Automation กับงานของตัวเองตั้งแต่เตรียมข้อมูลก่อนคุยลูกค้า ร่างเอกสาร ติดตามดีล และทำ Morning Brief จึงเห็นว่าคำถามสำคัญไม่ใช่ “ใช้ Tool ไหน” แต่เป็นงานไหนควรเริ่ม และใครต้องรับผิดชอบผลลัพธ์',
    'เวลาทำ Workshop ผมไม่ให้ AI แตะข้อมูลจริงก่อนทีมแยกความเสี่ยงและวาง Human review. Sandbox ที่ดีทำให้ทีมเรียนรู้ได้โดยไม่เอาลูกค้าหรือระบบจริงไปเสี่ยง',
    'ผมจะช่วยให้ Owner เห็นทั้งสิ่งที่ต้นแบบทำได้และข้อที่ยังต้องไปทำต่อก่อนจ้าง Build เพื่อให้การลงทุนรอบถัดไปมี Scope ที่ตรวจสอบได้',
  ],
  investment: {
    included: ['In-house Workflow Pilot Day หนึ่งบริษัท หนึ่ง Workflow', 'Fit Gate ก่อนออกใบแจ้งหนี้', 'Workflow Map, Safe Sandbox, Human–AI Responsibility Brief และ Decision Memo', 'Core build team รัน Sandbox ด้วยข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask', 'เอกสารใบเสนอราคาและใบกำกับภาษีสำหรับบริษัท'],
    terms: 'ชำระค่าบริการ 100% หลังผ่าน Fit Gate และก่อนวัน Workshop เพื่อยืนยันคิว บริษัทต้องเตรียม Process owner และตัวอย่างข้อมูลที่ปลอดภัยตาม Pre-work',
    scarcity: 'ผมสอนเองทุกบริษัทและรับงานรวมไม่เกินเดือนละ 10 บริษัท เพื่อให้มีเวลาอ่าน Workflow และเตรียม Safe Sandbox ให้ตรงกับงานจริง',
  },
  faq: [
    { question: 'T4 ต่างจาก I1 ที่ทีมปันสร้างระบบให้ยังไง?', answer: 'T4 ใช้หนึ่งวันเพื่อทดลอง Workflow ใน Safe Sandbox และออก Decision Memo ครับ I1/งาน Build เพิ่ม Data map, สิทธิ์ผู้ใช้, การเชื่อมระบบ, UAT, Handover และ Scope Production ที่ต้องประเมินแยก' },
    { question: 'ต้องมีทีม IT หรือเขียนโค้ดเป็นไหม?', answer: 'ไม่จำเป็นต้องเขียนโค้ดครับ แต่ต้องมี Process owner ที่อธิบายงานเดิมได้ และ Core build team ที่ช่วยทดสอบ Flow กับข้อมูลปลอดภัย' },
    { question: 'ใช้ข้อมูลลูกค้าจริงใน Workshop ได้ไหม?', answer: 'เริ่มจากข้อมูลจำลองหรือข้อมูลที่ผ่านการ Mask ครับ หากข้อมูลมีความเสี่ยง ต้องแยกว่าใช้ได้ ต้องขออนุมัติ หรือห้ามส่งออกก่อนเริ่มทดลอง' },
    { question: 'จบวันแล้วใช้ระบบกับงานจริงได้เลยไหม?', answer: 'Sandbox ใช้พิสูจน์ Flow และความรับผิดชอบก่อนครับ ความพร้อมใช้งานจริงขึ้นกับข้อมูล สิทธิ์ การเชื่อมระบบ การทดสอบ และการดูแลต่อเนื่อง จึงต้องตัดสินใน Decision Memo ก่อน' },
    { question: 'ถ้าทีมมีหลายงานที่อยาก Automate ล่ะ?', answer: 'ในหนึ่งวันเลือกหนึ่ง Workflow เพื่อให้ Map และทดสอบจบก่อน งานอื่นให้บันทึกไว้จัดลำดับในรอบถัดไป; การทำหลาย Workflow ต้องประเมิน Scope ใหม่' },
    { question: 'Fit Gate ดูอะไรบ้าง?', answer: 'ดูว่างานซ้ำอะไร เกิดบ่อยแค่ไหน ใครเป็น Process owner มีข้อมูลเสี่ยงหรือไม่ และบริษัทพร้อมทดลองด้วยข้อมูลปลอดภัยใน Scope หนึ่ง Workflow หรือไม่' },
    { question: 'หลัง Workshop ต้องตัดสินใจ Install เลยไหม?', answer: 'ไม่จำเป็นครับ Decision Memo อาจสรุปให้ Stop ถ้างานไม่คุ้ม, Revise ถ้ากติกายังไม่ชัด, หรือ Install discovery เมื่อมีหลักฐานและความพร้อมพอ' },
    { question: 'ต้องเตรียมอะไรล่วงหน้า?', answer: 'เตรียม Process owner, ตัวอย่างงานซ้ำหนึ่งเรื่อง, Input/Output ที่ปิดข้อมูลแล้ว, กติกาหรือข้อยกเว้นที่ทีมเจอ และรายชื่อ Core build team' },
  ],
  cta: {
    primary: 'เริ่ม Fit Gate ก่อนออกใบแจ้งหนี้',
    secondary: 'ทัก LINE ส่งโจทย์ Workflow',
    secondaryIntent: 'fit_check',
    heroSecondary: 'ทัก LINE เช็ก Fit Gate',
    heroSecondaryIntent: 'fit_check',
    finalSecondary: 'ทัก LINE พร้อมโจทย์ทีม',
    finalSecondaryIntent: 'fit_check',
    finalCaption: 'สแกน QR แล้วพิมพ์คำว่า “AI WORKFLOW” พร้อมจำนวนทีม',
    finalMobileInstruction: 'ทัก LINE แล้วพิมพ์คำว่า “AI WORKFLOW” พร้อมจำนวนทีม',
    finalMicrocopy: 'บอกงานซ้ำ, ความถี่, Process owner และว่ามีข้อมูลเสี่ยงหรือไม่ เพื่อเช็ก Fit Gate ก่อนออกใบแจ้งหนี้',
    keyword: T4_LINE_KEYWORD,
  },
  seo: {
    title: 'Advance AI & Business Automation | Workflow Pilot Day',
    description: 'In-house Workflow Pilot Day สำหรับทีมที่อยากทดลอง AI กับงานซ้ำหนึ่งเรื่องใน Safe Sandbox ก่อนตัดสินใจลงทุนระบบ Production',
  },
  sections: {
    authority: { heading: 'ผมใช้ AI กับงานจริง แต่ไม่เอาข้อมูลลูกค้ามาเป็นที่ทดลอง', copy: 'Automation ที่ใช้ได้เริ่มจากคนในทีมอธิบายงานเดิมได้ก่อนครับ เมื่อรู้ Input, Rule, Exception, Output และจุดที่ต้องให้คนตัดสิน เราจึงเลือก Tool และขอบเขตการทดลองได้พอดีกับงาน' },
    proof: { heading: 'ดูทีมทำงานกับโจทย์จริงก่อน', intro: 'ภาพทั้งหมดเป็นกิจกรรมจริงของคุณปันและผู้เข้าร่วม Workshop เราใช้ตัวอย่างงานที่ปลอดภัยเพื่อไล่ Owner กติกา และจุด Human review ของ Workflow หนึ่งเส้น' },
    pain: { heading: 'งานซ้ำที่ทีมอยากให้ AI ช่วย มีข้อไหนกำลังเกิดอยู่', close: 'เลือก Flow ที่ทีมพิสูจน์ได้หนึ่งเรื่องก่อน แล้วใช้ผลทดสอบตัดสินว่าควรเดินต่ออย่างไร' },
    reasons: { heading: 'Pilot ที่มีประโยชน์ต้องช่วยให้ Owner ตัดสินใจได้' },
    scope: { heading: 'Pick → Map → Sandbox → Responsibility → Decide', intro: 'ก่อนเข้า Workshop ให้ตอบงานซ้ำอะไร, เกิดบ่อยแค่ไหน, ใครเป็น Process owner และมีข้อมูลเสี่ยงไหม. คำตอบทั้งสี่ข้อใช้ผ่าน Fit Gate และกำหนดขอบเขตการทดลอง', ctaHeading: 'มีงานซ้ำหนึ่งเรื่องที่อยากให้ทีมทดลองก่อนลงทุนระบบจริงหรือยัง?' },
    takeHome: { heading: 'Artifact 4 ชิ้นที่ใช้ตัดสินใจหลัง Workshop', close: 'ทั้งสี่ชิ้นเป็น Core deliverable ของ Pilot Day. งานต่อจากนี้ยึดตามใบเสนอราคา และ Sandbox ต้องผ่าน Scope, การทดสอบ และการดูแลเพิ่มก่อนใช้กับงานจริง' },
    fit: { heading: 'เหมาะกับทีมที่อยากรู้ว่าควรเดินต่อกับ AI Workflow อย่างไร ก่อนซื้อหรือจ้าง Build' },
    investment: { eyebrow: 'ราคาเดียวสำหรับหนึ่งบริษัท · หนึ่ง Workflow' },
    final: { heading: 'มีงานซ้ำที่ทีมอยากหยุดทำมือ แต่ยังไม่แน่ใจว่าควรให้ AI ช่วยตรงไหน?', copy: 'ทัก LINE แล้วพิมพ์ “AI WORKFLOW” พร้อมจำนวนทีม บอกงานซ้ำ ความถี่ Process owner และข้อมูลเสี่ยงที่เกี่ยวข้อง ผมจะช่วยเช็ก Fit Gate ก่อนออกใบแจ้งหนี้' },
  },
};
