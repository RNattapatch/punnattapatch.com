import t2TrainingBuild from '../../assets/services/proof/t2-training-build.png';
import t2TrainingCompany from '../../assets/services/proof/t2-training-company.png';
import t2TrainingContinue from '../../assets/services/proof/t2-training-continue.png';
import t2WorkshopClassroom from '../../assets/services/proof/t2-workshop-classroom.jpg';
import t2WorkshopCompany from '../../assets/services/proof/t2-workshop-company.jpg';
import t2WorkshopHandsOn from '../../assets/services/proof/t2-workshop-hands-on.jpg';
import type { ProductDetailPageData } from './types';

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
  hero: {
    eyebrow: 'IN-HOUSE WORKSHOP · ONLINE-TO-SALES',
    customerJob: 'ทีมขาย + การตลาด เห็นงานเดียวกัน ตั้งแต่ Content → Lead → นัดหมาย → โอกาสปิดการขาย',
    supportingCopy: [],
    steps: [
      { label: '01 · Attract', title: 'ทำให้คนสนใจ', body: 'แตก Content และ Ads จากสินค้า ลูกค้า และข้อเสนอของบริษัทคุณ' },
      { label: '02 · Convert', title: 'รับ Lead ให้ถึงฝ่ายขาย', body: 'คัดแชต ถามต่อ และพาไปสู่นัดหมายหรือใบเสนอราคา' },
      { label: '03 · Run together', title: 'ให้สองทีมเห็นงานเดียวกัน', body: 'ได้ Funnel Map, Chat Script และ Tracking ที่หัวหน้าเปิดดูต่อได้' },
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
      body: 'Course Outline ฉบับ PDF กำลังจัดทำครับ ระหว่างนี้ทักมาขอรายละเอียดหรือเล่าโจทย์ของทีมก่อนได้เลย',
      variant: 'light',
      actions: [
        { kind: 'download', label: 'Course Outline PDF กำลังจัดทำ', intent: 'course_outline', available: false },
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
    'เซลล์ขายเก่งเวลาเจอลูกค้า แต่พอให้ทำภาพหรือวิดีโอเอง งานค้างเพราะเครื่องมือไม่คล่อง',
    'คอนเทนต์มีคนดู Ads มีคนทัก แต่แชตจำนวนมากไม่กลายเป็นนัดหมายหรือการเข้าพบ',
    'การตลาดส่ง Lead แล้วไม่รู้ว่าใครรับต่อ ตามไปถึงไหน หรือปิดได้จากชิ้นไหน',
    'เซลล์แต่ละคน Follow-up ตามความถนัด คนที่ยังไม่พร้อมซื้อจึงเงียบหายไปจาก Pipeline',
    'หัวหน้ารู้ว่าเดือนนี้ยอดไม่ถึง แต่ไม่เห็นระหว่างทางว่าดีลกำลังหลุดตรงจุดไหน',
  ],
  boundary: {
    heading: 'สองวันนี้เรากำลังสร้าง “ทางเดินจากออนไลน์ไปถึงฝ่ายขาย”',
    body: [
      'นี่คือ In-house Workshop สำหรับบริษัทที่มีทีมขายและทำการตลาดออนไลน์อยู่แล้ว เราจะใช้สินค้า ลูกค้า ภาพ วิดีโอ และตัวอย่าง Lead ของบริษัทคุณเป็นวัตถุดิบ แล้วทำเส้นทางจริงตั้งแต่ Content → Ads → Chat → Qualification → Appointment/Meeting → Follow-up → Sales outcome',
      'ทีมจะได้ลงมือทำสื่อ วางข้อความรับ Lead ซ้อมส่งต่อระหว่าง Marketing กับ Sales และสร้าง Tracking sheet ชุดแรกที่หัวหน้าเปิดดูต่อได้',
      'คอร์สนี้ไม่ได้รับยิง Ads แทนบริษัท และไม่ได้ติดตั้ง CRM หรือ Dashboard production ให้เสร็จในห้อง แต่พาทีมวาง Funnel ทำของชิ้นแรก และกำหนดวิธีทำงานร่วมกันให้ชัดครับ ถ้าต้องการให้ทีมผมสร้างระบบ Report/Dashboard ให้ใช้จริง ให้ดูบริการ I1 ต่อได้เลย',
    ],
  },
  reasons: [
    { title: 'ของจริงบริษัทคุณ', body: 'เราใช้ภาพสินค้า ข้อเสนอ คำถามจากลูกค้า และขั้นตอนขายของบริษัทคุณ ทีมจึงเห็นทันทีว่าสิ่งที่ทำในห้องจะเอาไปใช้กับงานไหน' },
    { title: 'ทั้งสองทีมขยับพร้อมกัน', body: 'Marketing รู้ว่าจะส่ง Lead พร้อมข้อมูลอะไร Sales รู้ว่าจะรับและตามต่อยังไง ส่วนหัวหน้าเห็นว่าต้องดูตัวเลขและจุดค้างตรงไหน' },
    { title: 'AI อยู่ในจุดที่ช่วยคนได้จริง', body: 'AI ช่วยแตก Hook ร่าง Caption ทำภาพ เตรียมข้อความ Follow-up และสรุปข้อมูลให้เร็วขึ้น ส่วนการเลือกมุมขาย ตรวจความถูกต้อง และคุยกับลูกค้ายังเป็นหน้าที่ของคน' },
  ],
  analogy: 'ผมมอง AI เหมือนน้องฝึกงานที่รู้ทุกอย่างบนโลก แต่ยังไม่รู้จักบริษัทคุณครับ ถ้าเราไม่ให้ข้อมูลสินค้า ลูกค้า และกติกาของทีม งานที่ได้ก็จะดูเก่งแต่เอาไปใช้ต่อไม่ได้',
  scope: [
    { label: 'Day 1 · Generate', title: 'ไล่ Customer Journey ก่อนคิดคอนเทนต์', learn: 'ระบุ Segment หลัก เหตุผลซื้อ ความกังวล และ Revenue Event', action: 'เลือกเส้นทางลูกค้าจริงของบริษัท', output: 'Customer Journey และ Revenue Event ของบริษัท 1 เส้น' },
    { label: 'Day 1 · Generate', title: 'ทำ Content และ Offer ตามช่วงตัดสินใจ', learn: 'ใช้คำถามจริงจากลูกค้ามาแตกเป็น Content angle, Hook, Caption และ CTA', action: 'วาง Content ให้พาคนไปขั้นถัดไป', output: 'Content angle bank + Offer/CTA สำหรับ Segment หลัก' },
    { label: 'Day 1 · Generate', title: 'สร้างภาพและวิดีโอจากของจริง', learn: 'ใช้ AI ช่วยเตรียมภาพ โครงวิดีโอ Subtitle และ Shot list', action: 'ตรวจสเปกและ Brand ก่อนนำออกใช้', output: 'ภาพและวิดีโอพร้อมปรับต่อจาก Workshop อย่างน้อย 1 ชุด' },
    { label: 'Day 1 · Generate', title: 'วาง Ads test และจุดรับ Lead', learn: 'กำหนดว่า Creative พาคนไปไหน เก็บ Source ยังไง', action: 'ระบุเจ้าของ Lead ตั้งแต่ข้อความแรก', output: 'Campaign kit 1 ชุด + แผนรับ Lead' },
    { label: 'Day 2 · Convert', title: 'คัด Lead โดยไม่ทำให้ลูกค้ารู้สึกโดนสอบ', learn: 'กำหนดข้อมูลที่ทีมต้องรู้ก่อนเสนอขั้นถัดไป', action: 'ออกแบบคำถาม Qualification ให้เข้ากับการขายของบริษัท', output: 'Qualification guide + Chat opening' },
    { label: 'Day 2 · Convert', title: 'ทำ Chat-to-Appointment Script', learn: 'วางบทสนทนาจากคนทักเข้ามาไปสู่นัดหมายหรือใบเสนอราคา', action: 'กำหนดจุดส่งต่อให้คนที่เหมาะสม', output: 'Chat-to-appointment / meeting script' },
    { label: 'Day 2 · Convert', title: 'Follow-up ตามสถานการณ์ของดีล', learn: 'แยกข้อความสำหรับลูกค้าที่อ่านแล้วเงียบ ขอคิดก่อน หรือเปรียบเทียบคู่แข่ง', action: 'ใช้ AI ช่วยร่างจาก Context แล้วให้เซลล์ตรวจน้ำเสียง', output: 'Follow-up playbook ฉบับบริษัท + Prompt/Agent ช่วยร่าง' },
    { label: 'Day 2 · Convert', title: 'ต่อ Marketing-to-Sales Handoff และแผน 14 วัน', learn: 'กำหนด Stage, Lead owner, Next action และจุดที่หัวหน้าต้องเข้ามาช่วย', action: 'วางวิธีประชุมสั้นจาก Tracking sheet เดียวกัน', output: 'Online-to-Sales Funnel Map + Tracking sheet + Content/Sales action plan 14 วัน' },
  ],
  takeHome: [
    'Online-to-Sales Funnel Map ของบริษัท 1 เส้น', 'Customer Journey และ Revenue Event ที่ทีมใช้เป็นเป้าร่วมกัน', 'Campaign kit สำหรับเริ่มทดสอบ 1 ชุด', 'ภาพและวิดีโอที่ทำจากวัตถุดิบจริงในห้อง', 'Content angle bank + แผนทำงาน 14 วันพร้อมผู้รับผิดชอบ', 'Qualification guide และ Chat-to-appointment/meeting script', 'Follow-up playbook แยกตามสถานการณ์ของดีล', 'Tracking sheet ที่ Marketing, Sales และ Manager เปิดดูร่วมกัน', 'Prompt/Agent ช่วยร่าง Content และ Follow-up ภายใต้ Human Review', 'กลุ่มติดตามการนำไปใช้ตามระยะเวลาที่ระบุใน Catalog',
  ],
  fit: ['บริษัทที่มีทีมขายและการตลาดรวมกันประมาณ 5–20 คน', 'ธุรกิจที่มี Content, Ads หรือ Lead ออนไลน์อยู่แล้ว แต่ยอดหายระหว่างทาง', 'Owner หรือ Manager ที่พร้อมเข้าร่วมช่วงวาง Funnel และล็อกวิธีทำงานของทีม', 'ทีมที่นำสินค้า ภาพ คลิป คำถามลูกค้า และตัวอย่างแชตจริงมาใช้ใน Workshop ได้'],
  notFit: 'ถ้าต้องการจ้างทีมภายนอกทำ Content และยิง Ads ให้ทั้งหมด งานนี้จะไม่ตรงครับ เพราะเป้าหมายคือทำให้ทีมคุณคิด ทำ และรับ Lead ต่อเองได้ หรือถ้าปัญหาหลักอยู่ที่โครงทีม KPI ค่าคอม และ Manager ควรเริ่มจากบริการวางระบบฝ่ายขายแบบรายวันแทน',
  bio: [
    'ผมเริ่มจากงาน Sales Engineer ที่ตรีเพชรอีซูซุ เคยสอนเทคนิคการขายให้ Dealer Sale, Present สินค้าให้ลูกค้า และสอนการใช้ผลิตภัณฑ์ให้พนักงานในเครือ งานนั้นทำให้ผมเห็นว่าคนขายต้องเข้าใจทั้งสินค้า คนซื้อ และสถานการณ์หน้างานจริง',
    'อีกมุมหนึ่ง ผมเคยปั้นธุรกิจจากยอดติดลบไปสู่ยอดขายร้อยล้าน คัดเรซูเม่มากกว่า 1,000 ใบ และสัมภาษณ์คนเข้าทีมมากกว่า 100 คน เลยรู้ว่าการเพิ่มยอดไม่ได้จบที่สคริปต์ขาย มันแตะคน เป้า การส่งต่องาน และสิ่งที่หัวหน้ามองเห็นระหว่างเดือนด้วย',
    'วันนี้ผมใช้ AI และ Automation สร้างระบบทำงานของตัวเอง ตั้งแต่เตรียมข้อมูลก่อนคุยลูกค้า ร่างเอกสาร ติดตามดีล ไปจนถึง Morning Brief ผมจึงสอนได้ทั้งหลักคิดการขายและวิธีใช้เครื่องมือ โดยไม่แยกสองเรื่องนี้ออกจากงานประจำวัน',
    'ผมไม่ได้รู้จักธุรกิจคุณจากสไลด์หน้าเดียวครับ เพราะงั้นก่อนสอน ผมจะขอเห็นสินค้า ลูกค้า และเส้นทางขายจริง แล้วค่อยออกแบบ Workshop ให้พูดภาษาเดียวกับทีมคุณ',
  ],
  investment: { included: ['In-house Workshop ตามระยะเวลาจาก Catalog', 'ปรับโจทย์ให้เข้ากับสินค้า ลูกค้า และ Funnel ของบริษัท', 'Template, Script, Tracking sheet และไฟล์ Workshop ตามรายการ Take-home', 'ดูแลการนำไปใช้ต่อตามระยะเวลาที่ระบุใน Catalog', 'เอกสารใบเสนอราคาและใบกำกับภาษีสำหรับบริษัท'], terms: 'ชำระค่าบริการ 100% ก่อนวันอบรมเพื่อยืนยันคิว ค่าเดินทางนอกพื้นที่มาตรฐานจะแจ้งให้ทราบก่อนยืนยันวันครับ', scarcity: 'ผมสอนเองทุกบริษัทและรับงานรวมไม่เกินเดือนละ 10 บริษัท เพื่อให้มีเวลาเตรียมโจทย์และดูงานหลังคลาสได้จริง' },
  faq: [
    { question: 'ต้องมีพื้นฐาน AI หรือยิง Ads มาก่อนมั้ย?', answer: 'ไม่จำเป็นต้องเก่งเครื่องมือครับ แต่บริษัทควรมีสินค้า/บริการที่ขายอยู่จริง และมีทีมที่รับ Lead ต่อได้ ผมจะเริ่มจาก Customer Journey และงานขายก่อน แล้วใช้ AI กับ Ads เฉพาะจุดที่ช่วยให้ทีมทำงานเร็วขึ้น' },
    { question: 'ทีมขายกับทีมการตลาดต้องเข้าอบรมพร้อมกันหรือเปล่า?', answer: 'แนะนำให้มีทั้งสองฝั่ง โดยเฉพาะคนที่รับผิดชอบ Content/Ads, เซลล์ที่รับ Lead และ Manager ที่ดูภาพรวม เพราะจุดสำคัญของคอร์สคือการส่งต่องาน ถ้ามาเฉพาะฝ่ายใดฝ่ายหนึ่ง เราจะวาง Funnel ได้ แต่การล็อกวิธีทำงานร่วมกันจะไม่ครบ' },
    { question: 'ชื่อคอร์สมีคำว่า Online-to-Sales แต่ภาพที่เห็นเป็นรถ ใช้กับธุรกิจอื่นได้มั้ย?', answer: 'ได้ครับ ภาพรถคือ Dealer Edition ซึ่งเป็นตัวอย่างที่เห็น Journey ชัดที่สุด Product หลักใช้โครงเดียวกันกับคลินิก โรงแรม โรงงาน Distributor และธุรกิจบริการ เพียงเปลี่ยนปลายทางจากทดลองขับ เป็นนัดปรึกษา นัดสำรวจหน้างาน ขอใบเสนอราคา หรือจองบริการ' },
    { question: 'สองวันนี้จะยิง Ads จริงให้เลยหรือไม่?', answer: 'ทีมจะวาง Campaign test, Creative, CTA และจุดรับ Lead จากข้อมูลของบริษัทครับ ส่วนการเปิด Campaign จริงขึ้นอยู่กับบัญชี งบ Policy และสิทธิ์ที่บริษัทเตรียมไว้ งานดูแล Ads ต่อเนื่องไม่ได้รวมอยู่ในคอร์ส' },
    { question: 'AI จะทำวิดีโอให้อัตโนมัติทั้งหมดเลยมั้ย?', answer: 'ใน Workshop เราสอนให้ทีมใช้ AI และ Template ช่วยทำภาพ โครงวิดีโอ Subtitle และงานตัดต่อจากคลิปที่ถ่ายไว้ เพื่อให้ผลิตสื่อได้เร็วขึ้น ระบบอัปโหลดคลิปแล้ว Render อัตโนมัติทั้ง Pipeline เป็นงาน Implementation แยก เพราะต้องล็อก Brand template, License, Storage, Approval และ Human QC ก่อน' },
    { question: 'มีการติดตั้ง CRM หรือ Dashboard ให้ด้วยหรือเปล่า?', answer: 'สองวันนี้ทีมจะได้ Funnel Map และ Tracking sheet ชุดแรกสำหรับเริ่มใช้ครับ การเชื่อมหลายระบบหรือสร้าง Dashboard production อยู่ในบริการ I1 ซึ่งมีขั้น Map data, Build, UAT และสอนทีมใช้แยกต่างหาก' },
    { question: 'หลังเรียนมีคนช่วยดูต่อมั้ย?', answer: 'มีการดูแลต่อภายในระยะเวลาที่ระบุใน Catalog เพื่อช่วยตอบคำถามและเช็กว่าทีมเริ่มใช้ของที่ทำในห้องแล้วหรือยัง ขอบเขตคือการดูแลการนำ Workshop ไปใช้ ไม่รวมการรับทำ Campaign หรือสร้างระบบใหม่เพิ่ม' },
    { question: 'ต้องเตรียมอะไรล่วงหน้า?', answer: 'เตรียมสินค้า/บริการหลัก กลุ่มลูกค้า ภาพหรือคลิปจริง ตัวอย่าง Content/Ads เดิม ตัวอย่างแชตหรือ Lead ที่ปิดข้อมูลส่วนตัวแล้ว และรายชื่อผู้รับผิดชอบแต่ละช่วงครับ ทีมผมจะส่ง Pre-work checklist ให้ก่อนวันอบรม' },
  ],
  cta: {
    primary: 'จองคิวรับบริการ',
    secondary: 'ทัก LINE สอบถาม',
    secondaryIntent: 'general_question',
    heroSecondary: 'เช็กว่าธุรกิจคุณเหมาะกับคอร์สนี้ไหม',
    heroSecondaryIntent: 'suitability',
    finalSecondary: 'ทัก LINE สอบถาม',
    finalSecondaryIntent: 'general_question',
    keyword: 'ONLINE SALES',
  },
  seo: { title: 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI', description: 'In-house Workshop 2 วันสำหรับทีมขายและการตลาดที่ต้องการเปลี่ยน Content, Ads และ Lead ให้กลายเป็นนัดหมายและโอกาสปิดการขาย' },
  sections: {
    authority: { heading: 'ผมสอนเรื่องนี้จากทั้งฝั่งหน้าบ้านและหลังบ้านของงานขาย', copy: 'ผมเคยอยู่ฝั่งที่ต้อง Present สินค้า สอนเทคนิคการขายให้ Dealer Sale และเห็นโจทย์หน้างานจริงว่า “ขายเก่ง” กับ “ทำตลาดออนไลน์เป็น” เป็นคนละทักษะกัน วันนี้ AI ช่วยอุดช่องว่างด้านการทำสื่อและเตรียมงานได้ แต่เส้นทางรับ Lead และ Follow-up ยังต้องออกแบบให้คนในทีมรับช่วงกันเป็นครับ' },
    proof: { heading: 'ของที่ผมอยากให้คุณดูก่อน คือทีมกลับไปทำต่อได้หรือเปล่า', intro: 'คำว่าคลาสสนุกฟังแล้วดีครับ แต่สำหรับงาน In-house ผมดูต่อถึงวันรุ่งขึ้นว่า ทีมเปิดงานเดิมแล้วทำต่อเองได้มั้ย และผู้บริหารเห็นทางต่อยอดจากห้องเรียนหรือเปล่า' },
    pain: { heading: 'ตอนนี้ท่อออนไลน์ของทีมคุณขาดตรงไหนครับ', close: 'ทีมคุณอาจเก่งในงานของตัวเองอยู่แล้วครับ จุดติดมักเกิดตอนแต่ละคนทำงานคนละช่วง โดยยังไม่มีเส้นทางกลางที่บอกว่า Lead หนึ่งรายต้องเดินต่อยังไง' },
  },
};
