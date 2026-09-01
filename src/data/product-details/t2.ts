import t2TrainingBuild from '../../assets/services/proof/t2-training-build.png';
import t2TrainingCompany from '../../assets/services/proof/t2-training-company.png';
import t2TrainingContinue from '../../assets/services/proof/t2-training-continue.png';
import t2WorkshopClassroom from '../../assets/services/proof/t2-workshop-classroom.jpg';
import t2WorkshopCompany from '../../assets/services/proof/t2-workshop-company.jpg';
import t2WorkshopHandsOn from '../../assets/services/proof/t2-workshop-hands-on.jpg';
import type { ProductDetailPageData } from './types';

export const SHOW_BONUS_CARDS = false;

const T2_CLIENT_LOGOS = [
  { src: '/logos/clients/nissan.png', alt: 'Nissan' },
  { src: '/logos/clients/futureskill.png', alt: 'FutureSkill' },
  { src: '/logos/clients/ving.png', alt: 'V!NG' },
  { src: '/logos/clients/gpx.jpg', alt: 'GPX' },
  { src: '/logos/clients/royal-enfield.jpg', alt: 'Royal Enfield' },
  { src: '/logos/clients/zontes.png', alt: 'Zontes' },
  { src: '/logos/clients/lambretta.png', alt: 'Lambretta' },
  { src: '/logos/clients/hfc-healthfoods.png', alt: 'HFC HealthFoods Corporation' },
  { src: '/logos/clients/home-plus.png', alt: 'ฮ.โฮมพลัส' },
  { src: '/logos/clients/farevefarm.jpg', alt: 'Farevefarm' },
  { src: '/logos/clients/farmsuk.jpg', alt: 'ฟาร์มสุข farmsuk' },
  { src: '/logos/clients/business-boy.jpg', alt: 'เด็กประกอบการ The Business Boy' },
  { src: '/logos/clients/aes.jpg', alt: 'AES' },
  { src: '/logos/clients/nsscrap.avif', alt: 'NSSCRAP' },
  { src: '/logos/clients/scenery-farm.jpeg', alt: 'Scenery Farm' },
  { src: '/logos/clients/ud-clinic.jpg', alt: 'UD Clinic' },
];

const T2_TESTIMONIALS = [
  { src: '/testimonial/2026-05/review-01.jpg', alt: 'ทีมงานร่วม Workshop AI กับปัน ณัฐพัชร์', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-02.jpg', alt: 'ข้อความขอบคุณหลัง Workshop', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-03.jpg', alt: 'บรรยากาศห้องอบรม AI', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-04.jpg', alt: 'ข้อความจากผู้เข้าอบรมหลังจบคลาส', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-05.jpg', alt: 'ข้อความผู้เข้าร่วมเกี่ยวกับการนำ AI ไปใช้ในทีม', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-06.jpg', alt: 'ทีมงานถ่ายภาพร่วมกันที่ออฟฟิศ', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-07.jpg', alt: 'ทีมงานร่วมกันหลัง Workshop', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-08.jpg', alt: 'โพสต์สะท้อนการเรียนรู้ขององค์กร', width: 1000, height: 1000 },
  { src: '/testimonial/2026-07/review-09.jpg', alt: 'ข้อความผู้เรียนนำ AI ไปทำเว็บต่อ', width: 1410, height: 1410 },
  { src: '/testimonial/2026-07/review-10.jpg', alt: 'โพสต์แนะนำต่อจากผู้เรียน', width: 736, height: 736 },
  { src: '/testimonial/2026-07/review-11.jpg', alt: 'ข้อความผู้เรียนต่อยอดโปรเจกต์ AI', width: 914, height: 914 },
  { src: '/testimonial/2026-07/review-12.jpg', alt: 'กิจกรรม Nissan Sales Manager Seminar 2026', width: 1000, height: 1000 },
];

export const T2_PRODUCT_DETAIL: ProductDetailPageData = {
  code: 'T2',
  pricingKey: 'tiktok-workshop',
  route: '/services/online-to-sales',
  kind: 'course',
  showPriceInHero: true,
  hero: {
    eyebrow: 'IN-HOUSE WORKSHOP · ONLINE-TO-SALES',
    customerJob: 'เปลี่ยนคนเห็น Content/Ads ให้เป็นแชต นัดหมาย และการส่งต่อถึงทีมขายที่ชัดเจน',
    supportingCopy: [],
    steps: [
      { label: '01 · Message', title: 'ทำให้คนที่ทักมาเข้าใจข้อเสนอ', body: 'เริ่มจาก Content และ Ads ที่พาคนที่ใช่เข้าสู่บทสนทนา' },
      { label: '02 · Lead flow', title: 'รับ คัด และส่งต่อด้วยกติกาเดียวกัน', body: 'ทุกคนรู้ว่าต้องถามอะไร ใครรับ Lead ต่อ และต้องทำอะไรต่อ' },
      { label: '03 · Follow-up', title: 'ตามต่อจนได้คำตอบ ไม่ปล่อย Lead เงียบ', body: 'ใช้ Script, Tracker และรอบทบทวนที่หัวหน้าเปิดดูได้' },
    ],
    badges: ['In-house ที่บริษัทคุณ', 'ทีมขาย + การตลาด 5–20 คน', 'ใช้โจทย์จริงของบริษัท'],
    visual: {
      image: t2WorkshopCompany,
      alt: 'ปัน ณัฐพัชร์ยืนกับทีมผู้เข้าร่วม In-house Workshop ในห้องอบรม',
      label: 'IN-HOUSE WORKSHOP · ทีมจริง',
      caption: 'ทีมขาย + การตลาด ลงมือกับโจทย์จริงของบริษัท',
    },
  },
  authority: [
    'วิทยากร Nissan Sales Manager Seminar 2026',
    'อดีต Sales Engineer และ Instructor ฝั่ง Dealer',
    'อบรมและวางระบบร่วมกับ 18 องค์กร',
    'ทำงานกับธุรกิจยานยนต์ ผู้ผลิต ค้าปลีก โรงแรม และบริการ',
  ],
  proof: [
    { kind: 'photo', caption: 'ภาพกิจกรรม In-house Workshop: ทุกคนอยู่ในห้องเดียวกัน ใช้โจทย์จริงของบริษัทเป็นจุดเริ่มต้นของการทำงานร่วมกัน', image: t2WorkshopCompany, alt: 'ปัน ณัฐพัชร์ยืนกับทีมผู้เข้าร่วม In-house Workshop ในห้องอบรม' },
    { kind: 'photo', caption: 'ภาพกิจกรรม Workshop: ทีมขายและการตลาดลงมือกับ Laptop, คำถาม และข้อมูลของตัวเอง ไม่ได้นั่งฟังอย่างเดียว', image: t2WorkshopClassroom, alt: 'ผู้เข้าร่วม Workshop นั่งทำงานร่วมกันในห้องอบรม' },
    { kind: 'photo', caption: 'ภาพการทำงานแบบกลุ่มเล็ก: หยิบโจทย์จากทีมขึ้นมาคุยและวางวิธีทำงานต่อร่วมกัน', image: t2WorkshopHandsOn, alt: 'ปัน ณัฐพัชร์สอนผู้เข้าร่วม Workshop แบบกลุ่มเล็กในห้องอบรม' },
    { kind: 'quote', quote: 'ทำเว็บจ้างหลายแสน จบในคืนเดียว เป็นไปได้เฉยพี่', caption: 'ผู้เรียนส่งกลับมาหลังจบคลาส เพราะเอาวิธีคิดจากห้องไปต่อกับงานของตัวเอง', image: t2TrainingBuild, alt: 'ข้อความรีวิวหลังอบรมที่ปิดข้อมูลส่วนบุคคลแล้ว' },
    { kind: 'quote', quote: 'อาจารย์ปันสอนถูกใจทีมงานมากครับ', caption: 'ผู้บริหารเห็นภาพว่าจะขยายจากการใช้รายคน ไปสู่ระบบที่หลายฝ่ายใช้ร่วมกันยังไง', image: t2TrainingCompany, alt: 'ข้อความรีวิวจากผู้บริหารที่ปิดข้อมูลส่วนบุคคลแล้ว' },
    { kind: 'quote', quote: 'ต่อยอด โปรเจ็คเลขาครับ สนุกดีครับ😂', caption: 'เวลา 20:27 ผู้เรียนส่งภาพระบบ Morning Brief ที่ทำต่อเอง หลักฐานแบบนี้สำคัญเพราะความรู้ไม่ได้จบตอนปิดสไลด์', image: t2TrainingContinue, alt: 'ข้อความจากผู้เรียนหลังนำงานไปต่อยอด โดยปิดข้อมูลส่วนบุคคลแล้ว' },
  ],
  clientLogos: T2_CLIENT_LOGOS,
  testimonials: T2_TESTIMONIALS,
  decisionCtas: [
    {
      location: 'after_proof',
      eyebrow: 'ปรึกษาก่อนเลือก',
      heading: 'ไม่แน่ใจว่าจะเลือกคอร์สไหนดี?',
      body: 'เล่าโจทย์และขนาดทีมให้ผมฟังได้เลยครับ ปกติตอบภายใน 2 นาที',
      variant: 'sand',
      actions: [
        { kind: 'line', label: 'ทัก LINE ปรึกษาเลย', intent: 'course_selection' },
      ],
    },
    {
      location: 'after_scope',
      eyebrow: 'Course Outline',
      heading: 'อยากเห็นรายละเอียดก่อนส่งให้ทีม?',
      body: 'โหลด Course Outline ฉบับ PDF ไปเปิดกับทีมได้เลยครับ มีครบทั้งหัวข้อทั้ง 2 วัน สิ่งที่ทีมลงมือทำในห้อง และของที่ถือกลับไป',
      variant: 'light',
      actions: [
        { kind: 'download', label: 'ดาวน์โหลด Course Outline (PDF)', intent: 'course_outline', available: false },
        { kind: 'line', label: 'ทัก LINE สอบถาม', intent: 'general_question' },
      ],
    },
    {
      location: 'after_fit',
      eyebrow: 'ทีมใหญ่กว่าแพ็กเกจ',
      heading: 'มีผู้เข้าอบรมมากกว่า 20 คน?',
      body: 'ทักมาคุยกับผมได้เลยครับ ผมจัดรูปแบบให้เหมาะกับจำนวนคนและหน้างานของบริษัทให้เอง',
      variant: 'navy',
      actions: [
        { kind: 'booking', label: 'จองคิวรับบริการ', intent: 'large_team' },
        { kind: 'line', label: 'ทัก LINE', intent: 'general_question' },
      ],
    },
  ],
  pains: [
    'Message: Content/Ads บอกประโยชน์ไม่ชัด คนที่ทักมาไม่ตรงกับทีมที่อยากคุย',
    'Inbox: มีคนทัก แต่ตอบช้า หรือไม่มีคนรับผิดชอบตั้งแต่ข้อความแรก',
    'Qualification: ทีมถามไม่ครบ จึงไม่รู้ว่า Lead ไหนควรพาไปขั้นถัดไป',
    'Handoff: Marketing ส่งต่อแล้ว Sales ไม่รู้บริบท หรือไม่มี Owner และ Next action',
    'Follow-up: Lead ที่ยังไม่พร้อมซื้อเงียบหาย เพราะไม่มีจังหวะและเหตุผลให้ทักกลับ',
  ],
  boundary: {
    heading: 'ให้ทีมการตลาดและฝ่ายขายวาง Flow เดียวกัน',
    body: [
      'ให้ทีมการตลาดและฝ่ายขายวาง Flow เดียวกันตั้งแต่ Content/Ads, ข้อความแรก, การคัด Lead, การส่งต่อ ไปจนถึง Follow-up พร้อม Script, Tracker และชุดตรวจจุดรั่วที่ใช้กับแชทของบริษัทได้ตลอดช่วงดูแล 30 วัน',
      'คอร์สนี้ใช้ตัวอย่าง Content, Ads และบทสนทนาที่ปิดข้อมูลแล้วของบริษัทมาเป็นโจทย์ เพื่อให้ Marketing, คนตอบแชต และ Sales ตกลงนิยาม Lead, Owner และ Next action ร่วมกัน',
      'นี่ไม่ใช่ Agency: ไม่รับยิง Ads แทนบริษัท ไม่ผลิต Content รายเดือน และไม่รับประกัน ROAS, จำนวนการนัดหมาย หรือยอดขาย หากต้องการ Chatbot, CRM หรือ Integration ที่ใช้ข้อมูลจริงใน Production ให้ดูบริการ I1',
    ],
  },
  reasons: [
    { title: 'เริ่มจากข้อความที่พาคนที่ใช่เข้ามา', body: 'ทีมเห็นร่วมกันว่า Offer, Content และ Ads ต้องตอบคำถามอะไร ก่อนคาดหวังให้คนทักหรือส่งต่อข้อมูล' },
    { title: 'หนึ่ง Lead มีเจ้าของและข้อมูลที่ต้องรู้', body: 'Marketing, คนตอบแชต และ Sales ตกลงว่าใครตอบก่อน ถามอะไร และส่งต่อเมื่อไร จึงไม่ต้องเดาว่างานจบที่ใคร' },
    { title: 'Follow-up มีเหตุผลและจังหวะ', body: 'ทีมแยก Lead ที่ควรตามต่อจาก Lead ที่ควรพัก พร้อมใช้ Tracker ตรวจว่าคนไหนรับผิดชอบ Next action' },
  ],
  analogy: 'ค่าแอดไม่หายตอนกดเผยแพร่ครับ มันหายตอน Lead เข้ามาแล้วไม่มีใครรู้ว่าต้องตอบอะไร ส่งต่อให้ใคร และควรตามต่อเมื่อไร เราจึงเริ่มจาก Flow ที่คนในทีมใช้ร่วมกันก่อน',
  scope: [
    { label: 'ก่อน → หลัง', title: 'หยุดปล่อย Lead เดินตามความเคยชิน', learn: 'ก่อน: Content/Ads → แชต → ส่งต่อแบบเดาเอง → Lead เงียบ', action: 'หลัง: Offer/Message → First response → Qualification → Handoff → Follow-up → Review', output: 'Flow ที่ทุกฝ่ายเห็นและเรียกขั้นงานตรงกัน' },
    { label: 'ช่วงที่ 1 · Message', title: 'ทำให้ข้อความพาคนที่ใช่เข้ามา', learn: 'แยก Pain, Trigger และคำถามซื้อของกลุ่มเป้าหมายจากหลักฐานที่บริษัทมี', action: 'ปรับ Offer/Message, Content angle และ CTA ให้เชื่อมกับขั้นรับ Lead', output: 'Campaign/Offer Brief + Content angle ที่ใช้เริ่มงานต่อได้' },
    { label: 'ช่วงที่ 2 · Inbox + Qualification', title: 'รับ Lead และถามให้ได้ข้อมูลพอตัดสินใจ', learn: 'รู้ว่าคำถามใดช่วยแยกความต้องการ ความพร้อม และขั้นถัดไป โดยไม่ทำให้แชตกลายเป็นแบบสอบถาม', action: 'ออกแบบข้อความแรกและคำถาม Qualification จากสินค้าและ Journey ของบริษัท', output: 'Qualified Lead Definition + First-response Script' },
    { label: 'ช่วงที่ 3 · Handoff', title: 'ส่งต่อพร้อมบริบทและคนรับผิดชอบ', learn: 'Lead ที่ส่งต่อได้ต้องมีข้อมูลอะไร ใครเป็น Owner และ Next action ใดต้องเกิดก่อน', action: 'ทดลองส่งต่อระหว่าง Marketing, คนตอบแชต และ Sales ด้วยบทสนทนาที่ปิดข้อมูลแล้ว', output: 'Marketing-to-Sales Handoff Rule' },
    { label: 'ช่วงที่ 4 · Follow-up + Review', title: 'ตามต่อและดูจุดรั่วจากงานจริง', learn: 'แยก Lead ที่ควรตามต่อจาก Lead ที่ควรพัก พร้อมเก็บเหตุผลที่ทีมใช้ทบทวนได้', action: 'วาง Tracker และรอบ Review ให้หัวหน้าเห็น Owner, Next action และ Lead ที่ค้าง', output: 'Follow-up Tracker + แผนดูแล 30 วันตาม Catalog' },
  ],
  takeHome: [
    'Campaign/Offer Brief ที่ทีมใช้ตั้งต้น Content และ Ads', 'Qualified Lead Definition ที่ Marketing และ Sales ยืนยันร่วมกัน', 'First-response Script สำหรับข้อความแรกและคำถามคัด Lead', 'Marketing-to-Sales Handoff Rule ที่ระบุข้อมูล Owner และ Next action', 'Follow-up Tracker ที่ใช้เห็น Lead ค้างและจังหวะตามต่อ', 'Flow simulation หนึ่งรอบจาก Content/Ads ถึง Follow-up ด้วยข้อมูลที่ปิดแล้ว', 'ช่วงดูแล 30 วันตาม Catalog',
  ],
  bonusCards: {
    enabled: SHOW_BONUS_CARDS,
    heading: 'ของที่ทีมคุณได้รับกลับไปใช้ต่อ — รวมอยู่ในค่าอบรมแล้ว ไม่ต้องซื้อ Template เพิ่ม',
    intro: 'ทุกชิ้นช่วยให้ทีมเริ่มใช้ Flow หลังเรียนและให้หัวหน้าตามงานต่อจากหลักฐานจริง',
    items: [
      { number: '01', title: 'Content Hook Pack: 30 Hook ดึงคนที่ใช่', user: 'ทีม Content และ Marketing', timing: 'ก่อนทำ Content หรือ Ads ชุดใหม่', outcome: 'เริ่มจาก Pain, Trigger และคำถามซื้อ แทนการเจนโพสต์กว้างๆ', format: 'Google Sheet' },
      { number: '02', title: 'Chat Reply Templates: 20 สถานการณ์ตอบแชท', user: 'คนตอบแชตและ Sales', timing: 'เมื่อเจอคำถามราคา ขอรายละเอียด ยังไม่พร้อม หรือนัดแล้วเงียบ', outcome: 'เลือกข้อความที่พา Lead ไปสู่ขั้นถัดไปและส่งต่อพร้อมบริบท', format: 'Google Doc' },
      { number: '03', title: 'Ads-to-Sales Leak Checklist: เช็กจุดรั่ว 25 จุด', user: 'Owner และ Manager', timing: 'ก่อน Review Flow หรือเมื่อ Lead หลุดมากผิดปกติ', outcome: 'เห็นว่าจุดติดอยู่ที่ Message, Inbox, Qualification, Handoff หรือ Follow-up', format: 'Google Sheet/PDF' },
      { number: '04', title: 'Marketing × Sales Meeting Sheet: แบบประชุม 30 นาที', user: 'Marketing, Sales และ Manager', timing: 'รอบ Review จาก Lead จริง', outcome: 'จบประชุมด้วยกติกา ข้อความ Owner และ Next action ที่ชัด', format: 'Google Sheet' },
      { number: '05', title: 'Old Lead Follow-up Pack: ชุดตาม Lead เก่ากลับมาคุยใหม่', user: 'Sales และคนดูแล Inbox', timing: 'เมื่อคัด Lead เก่าที่มีเหตุผลให้ทักกลับ', outcome: 'เลือก Lead ที่ควรตามและใช้ข้อความตามบริบท ไม่ Blast ทั้งฐาน', format: 'Google Sheet + Google Doc' },
    ],
  },
  fit: ['บริษัทที่มี Content, Ads หรือ Lead ออนไลน์อยู่แล้ว แต่หลุดระหว่าง Marketing, Inbox และ Sales', 'Owner/Manager ที่พร้อมให้ Marketing, คนตอบแชต และ Sales ตกลง Flow เดียวกัน', 'ทีมที่นำตัวอย่าง Content, Ads และบทสนทนาที่ปิดข้อมูลส่วนตัวแล้วมาใช้ใน Workshop', 'ราคาเห็นก่อนทัก: หน้านี้แสดงราคาและ Scope จาก Catalog เพื่อให้ทีมตัดสินใจก่อนเริ่มคุย'],
  notFit: 'ไม่เหมาะถ้าบริษัทยังไม่มี Offer หรือ Traffic, ต้องการให้ทีมภายนอกรับยิง Ads/ผลิต Content รายเดือน หรือคาดหวังการรับประกัน ROAS, นัดหมาย หรือยอดขาย หากต้องการ Chatbot, CRM หรือ Integration production ให้เลือก I1 หลังประเมิน Scope',
  bio: [
    'ผมเริ่มจากงาน Sales Engineer ที่ตรีเพชรอีซูซุ เคยสอนเทคนิคการขายให้ Dealer Sale, Present สินค้าให้ลูกค้า และสอนการใช้ผลิตภัณฑ์ให้พนักงานในเครือ งานนั้นทำให้ผมเห็นว่าคนขายต้องเข้าใจทั้งสินค้า คนซื้อ และสถานการณ์หน้างานจริง',
    'อีกมุมหนึ่ง ผมเคยปั้นธุรกิจจากยอดติดลบไปสู่ยอดขายร้อยล้าน คัดเรซูเม่มากกว่า 1,000 ใบ และสัมภาษณ์คนเข้าทีมมากกว่า 100 คน เลยรู้ว่าการเพิ่มยอดไม่ได้จบที่สคริปต์ขาย มันแตะคน เป้า การส่งต่องาน และสิ่งที่หัวหน้ามองเห็นระหว่างเดือนด้วย',
    'วันนี้ผมใช้ AI และ Automation สร้างระบบทำงานของตัวเอง ตั้งแต่เตรียมข้อมูลก่อนคุยลูกค้า ร่างเอกสาร ติดตามดีล ไปจนถึง Morning Brief ผมจึงสอนได้ทั้งหลักคิดการขายและวิธีใช้เครื่องมือ โดยไม่แยกสองเรื่องนี้ออกจากงานประจำวัน',
    'ผมไม่ได้รู้จักธุรกิจคุณจากสไลด์หน้าเดียวครับ เพราะงั้นก่อนสอน ผมจะขอเห็นสินค้า ลูกค้า และเส้นทางขายจริง แล้วค่อยออกแบบ Workshop ให้พูดภาษาเดียวกับทีมคุณ',
  ],
  investment: { included: ['In-house Workshop 2 วันและช่วงดูแลตาม Catalog', 'ทำงานร่วมกันระหว่าง Marketing, คนตอบแชต และ Sales', 'Core artifacts: Campaign/Offer Brief, Qualified Lead Definition, First-response Script, Handoff Rule และ Follow-up Tracker', 'Flow simulation ด้วยบทสนทนาที่ปิดข้อมูลแล้วหนึ่งรอบ', 'Online Lead Bonus Pack และ Bonus กลางตามสิทธิ์ที่ผ่าน Release gate', 'เอกสารใบเสนอราคาและใบกำกับภาษีสำหรับบริษัท'], terms: 'ชำระค่าบริการ 100% ก่อนวันอบรมเพื่อยืนยันคิว ค่าเดินทางนอกพื้นที่มาตรฐานจะแจ้งให้ทราบก่อนยืนยันวันครับ', scarcity: 'ผมสอนเองทุกบริษัทและรับงานรวมไม่เกินเดือนละ 10 บริษัท เพื่อให้มีเวลาเตรียมโจทย์และดูงานหลังคลาสได้จริง' },
  faq: [
    { question: 'ต้องมีพื้นฐาน AI หรือยิง Ads มาก่อนมั้ย?', answer: 'ไม่จำเป็นต้องเก่งเครื่องมือครับ แต่บริษัทควรมีสินค้า/บริการที่ขายอยู่จริง มี Content/Ads หรือ Lead เข้ามา และมีคนรับ Lead ต่อได้ เราจะเริ่มจาก Offer, ข้อความ และ Flow ของทีมก่อน แล้วใช้ AI เฉพาะจุดที่ช่วยเตรียมงาน' },
    { question: 'ทีมขายกับทีมการตลาดต้องเข้าอบรมพร้อมกันหรือเปล่า?', answer: 'แนะนำให้มีทั้งสองฝั่ง โดยเฉพาะคนที่รับผิดชอบ Content/Ads, เซลล์ที่รับ Lead และ Manager ที่ดูภาพรวม เพราะจุดสำคัญของคอร์สคือการส่งต่องาน ถ้ามาเฉพาะฝ่ายใดฝ่ายหนึ่ง เราจะวาง Funnel ได้ แต่การล็อกวิธีทำงานร่วมกันจะไม่ครบ' },
    { question: 'ชื่อคอร์สมีคำว่า Online-to-Sales แต่ภาพที่เห็นเป็นรถ ใช้กับธุรกิจอื่นได้มั้ย?', answer: 'ได้ครับ ภาพรถคือ Dealer Edition ซึ่งเป็นตัวอย่างที่เห็น Journey ชัดที่สุด Product หลักใช้โครงเดียวกันกับคลินิก โรงแรม โรงงาน Distributor และธุรกิจบริการ เพียงเปลี่ยนปลายทางจากทดลองขับ เป็นนัดปรึกษา นัดสำรวจหน้างาน ขอใบเสนอราคา หรือจองบริการ' },
    { question: 'สองวันนี้จะยิง Ads จริงให้เลยหรือไม่?', answer: 'ทีมจะวาง Offer/Message, Campaign brief, CTA และจุดรับ Lead จากข้อมูลของบริษัทครับ ส่วนการเปิด Campaign จริงขึ้นอยู่กับบัญชี งบ Policy และสิทธิ์ที่บริษัทเตรียมไว้ งานดูแล Ads ต่อเนื่องไม่ได้รวมอยู่ในคอร์ส' },
    { question: 'AI จะทำวิดีโอให้อัตโนมัติทั้งหมดเลยมั้ย?', answer: 'ใน Workshop เราสอนให้ทีมใช้ AI และ Template ช่วยทำภาพ โครงวิดีโอ Subtitle และงานตัดต่อจากคลิปที่ถ่ายไว้ เพื่อให้ผลิตสื่อได้เร็วขึ้น ระบบอัปโหลดคลิปแล้ว Render อัตโนมัติทั้ง Pipeline เป็นงาน Implementation แยก เพราะต้องล็อก Brand template, License, Storage, Approval และ Human QC ก่อน' },
    { question: 'มีการติดตั้ง CRM หรือ Dashboard ให้ด้วยหรือเปล่า?', answer: 'สองวันนี้ทีมจะได้ Funnel Map และ Tracking sheet ชุดแรกสำหรับเริ่มใช้ครับ การเชื่อมหลายระบบหรือสร้าง Dashboard production อยู่ในบริการ I1 ซึ่งมีขั้น Map data, Build, UAT และสอนทีมใช้แยกต่างหาก' },
    { question: 'หลังเรียนมีคนช่วยดูต่อมั้ย?', answer: 'มีการดูแลต่อภายในระยะเวลาที่ระบุใน Catalog เพื่อช่วยตอบคำถามและเช็กว่าทีมเริ่มใช้ของที่ทำในห้องแล้วหรือยัง ขอบเขตคือการดูแลการนำ Workshop ไปใช้ ไม่รวมการรับทำ Campaign หรือสร้างระบบใหม่เพิ่ม' },
    { question: 'ต้องเตรียมอะไรล่วงหน้า?', answer: 'เตรียมสินค้า/บริการหลัก กลุ่มลูกค้า ภาพหรือคลิปจริง ตัวอย่าง Content/Ads เดิม ตัวอย่างแชตหรือ Lead ที่ปิดข้อมูลส่วนตัวแล้ว และรายชื่อผู้รับผิดชอบแต่ละช่วงครับ ทีมผมจะส่ง Pre-work checklist ให้ก่อนวันอบรม' },
  ],
  cta: {
    primary: 'จองคิวรับบริการ',
    secondary: 'ทัก LINE รับรายละเอียด',
    secondaryIntent: 'fit_check',
    heroSecondary: 'ทัก LINE เช็กความเหมาะสม',
    heroSecondaryIntent: 'suitability',
    finalSecondary: 'ทัก LINE พร้อมจำนวนทีม',
    finalSecondaryIntent: 'fit_check',
    finalCaption: 'สแกน QR แล้วพิมพ์คำว่า “ONLINE SALES” พร้อมจำนวนทีม',
    finalMobileInstruction: 'ทัก LINE แล้วพิมพ์คำว่า “ONLINE SALES” พร้อมจำนวนทีม',
    finalMicrocopy: 'ในข้อความแรกบอกจำนวนทีม และใครดู Ads, Inbox และ Sales พร้อม Lead ต่อเดือนกับจุดที่คิดว่าหลุด',
    keyword: 'ONLINE SALES',
  },
  seo: { title: 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', description: 'In-house Workshop 2 วันสำหรับทีมการตลาดและฝ่ายขายที่ต้องการวาง Flow ตั้งแต่ Content/Ads ถึงข้อความแรก การคัด Lead การส่งต่อ และ Follow-up ให้ชัดเจน' },
  sections: {
    authority: { heading: 'ผมสอนจากงานที่ต้องต่อ Marketing, Inbox และ Sales ให้เดินจริง', copy: 'ผมเคยอยู่ฝั่งที่ต้อง Present สินค้า สอนเทคนิคการขายให้ Dealer Sale และเห็นว่า Content ที่คนดูเยอะไม่ได้ช่วยอะไร ถ้า Lead เข้ามาแล้วไม่มีเจ้าของหรือไม่มีข้อมูลพอให้ Sales รับต่อ เราจึงออกแบบ Flow และกติกาที่คนในทีมใช้ร่วมกันก่อนใช้ AI ช่วยเตรียมงาน' },
    proof: { heading: 'ของที่ผมอยากให้คุณดูก่อน คือทีมกลับไปทำต่อได้หรือเปล่า', intro: 'คำว่าคลาสสนุกฟังแล้วดีครับ แต่สำหรับงาน In-house ผมดูต่อถึงวันรุ่งขึ้นว่า ทีมเปิดงานเดิมแล้วทำต่อเองได้มั้ย และผู้บริหารเห็นทางต่อยอดจากห้องเรียนหรือเปล่า' },
    pain: { heading: 'Lead หลุดตรงไหนระหว่าง Message ถึง Follow-up', close: 'ทีมคุณอาจเก่งในงานของตัวเองอยู่แล้ว จุดติดมักเกิดตอนแต่ละคนทำงานคนละช่วง แต่ยังไม่มี Flow กลางที่บอกว่า Lead หนึ่งรายต้องเดินต่ออย่างไร' },
    reasons: { heading: 'Flow ที่ใช้ได้ต้องทำให้ทั้งทีมเห็นงานชิ้นเดียวกัน' },
    scope: { heading: 'จาก Lead ที่เงียบ ไปสู่ Flow ที่ทีมรับช่วงกันได้', intro: 'เริ่มจาก Flow ก่อน–หลัง แล้วลงมือกำหนด Message, First response, Qualification, Handoff และ Follow-up ที่ใช้กับงานจริงของบริษัท', ctaHeading: 'พร้อมให้ทีมจัดการจุดรั่วที่ทำให้ค่าแอดค้างอยู่ใน Inbox หรือยัง?' },
    takeHome: { heading: 'ของที่ทีมใช้ต่อหลัง Workshop', close: 'ช่วงดูแล 30 วันอยู่ใน Main program ตาม Catalog เพื่อช่วยให้ทีมใช้ Flow ที่ทำในห้องต่อกับ Lead จริง ไม่ใช่ของแถมแยกต่างหาก' },
    fit: { heading: 'เหมาะกับบริษัทที่มี Lead แล้ว แต่ยังไม่มีเส้นทางกลางให้ทุกฝ่ายเดินร่วมกัน' },
    investment: { eyebrow: 'ราคาเดียวสำหรับทีม' },
    final: { heading: 'ก่อนปล่อยค่าแอดก้อนถัดไป ลองดูว่า Lead ที่เข้ามาวันนี้มีคนตามจนจบหรือยัง', copy: 'ทัก LINE แล้วพิมพ์ “ONLINE SALES” พร้อมจำนวนทีม บอกว่าใครดู Ads, Inbox และ Sales รวมถึง Lead ต่อเดือนกับจุดที่คิดว่าหลุด ผมจะช่วยเช็กความเหมาะสมก่อนออกใบเสนอราคา' },
  },
};
