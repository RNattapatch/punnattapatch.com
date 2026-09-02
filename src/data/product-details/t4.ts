import type { ClientLogo, ProductDetailPageData, ProductTestimonial, PublicProofImage } from './types';

export const T4_LINE_KEYWORD = 'AI WORKFLOW';
export const SHOW_T4_BONUS_CARDS = true;

const publicImage = (publicSrc: string, width: number, height: number): PublicProofImage => ({ publicSrc, width, height });

const T4_HERO_IMAGE = publicImage('/lp/inhouse/office-session.jpg', 1600, 1200);

const T4_CLIENT_LOGOS: ClientLogo[] = [
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

const T4_TESTIMONIALS: ProductTestimonial[] = [
  { src: '/testimonial/2026-05/review-01.jpg', alt: 'ทีมงานร่วม Workshop AI กับปัน ณัฐพัชร์', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-02.jpg', alt: 'ข้อความขอบคุณหลัง Workshop', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-03.jpg', alt: 'บรรยากาศห้องอบรม AI', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-04.jpg', alt: 'ข้อความจากผู้เข้าอบรมหลังจบคลาส', width: 1000, height: 1000 },
  { src: '/testimonial/2026-05/review-08.jpg', alt: 'โพสต์สะท้อนการเรียนรู้หลังอบรม', width: 1000, height: 1000 },
];

export const T4_PRODUCT_DETAIL: ProductDetailPageData = {
  code: 'T4',
  pricingKey: 't4-ai-workflow-pilot-day',
  route: '/services/advance-ai-automation',
  kind: 'course',
  showPriceInHero: true,
  hero: {
    eyebrow: 'IN-HOUSE TRAINING · T4',
    customerJob: 'สอนทีมคุณให้ใช้ AI Agent ทำงานเอกสารจุกจิกแทนคนเก่ง',
    supportingCopy: [
      'คอร์สอบรมการนำ AI Agent มาใช้ลดงานเพิ่มยอด ในองค์กร',
      'ทีมเลือกงานซ้ำหนึ่งเรื่องจากบริษัท แล้วลงมือทำตั้งแต่เห็นขั้นตอนเดิม สร้างต้นแบบ วางกติกาความปลอดภัย ไปจนถึงแผนใช้ต่อ 30 วัน',
    ],
    microcopy: 'เริ่มจากงานที่คนเก่งไม่ควรเสียเวลาทำซ้ำทุกวัน',
    steps: [
      { label: '01 · เลือก', title: 'เลือกงานซ้ำที่คุ้มจะย้ายให้ AI', body: 'ดูความถี่ เวลาที่เสีย และคนที่รับผิดชอบงานนั้นจริง' },
      { label: '02 · สร้าง', title: 'ทำ AI Agent Working Prototype', body: 'สร้างต้นแบบจากหนึ่ง Workflow พร้อมข้อมูลจำลองหรือข้อมูลที่ Mask แล้ว' },
      { label: '03 · ใช้ต่อ', title: 'วาง Data Safety และ Human Review', body: 'กำหนดว่าตรงไหน AI ทำ ตรงไหนคนตรวจ และเริ่มใช้ต่ออย่างไรใน 30 วัน' },
    ],
    badges: ['In-house · 1 วัน', '1 Workflow', 'Owner + Manager + Core team'],
    visual: {
      image: T4_HERO_IMAGE,
      alt: 'ปัน ณัฐพัชร์สอนทีมใช้ AI ในห้องอบรมจริง โดยมีชื่อคอร์ส Advance AI บนจอ',
      label: 'ADVANCE AI · ทีมจริง',
      caption: 'ภาพกิจกรรมจริง: ทีมอยู่หน้าจอเดียวกันและลงมือกับโจทย์ขององค์กร',
    },
  },
  authority: [
    'อดีต Sales Engineer และ Instructor ฝั่ง Dealer',
    'คัดเคสขายและสัมภาษณ์คนเข้าทีมรวมกว่า 1,000 เคส',
    'สร้าง AI Workflow ใช้กับงานขาย งานเอกสาร และการบริหารของตัวเอง',
    'อบรมและวางระบบร่วมกับ 18 องค์กร',
  ],
  proof: [
    { id: 't4-real-session', kind: 'photo', image: publicImage('/lp/inhouse/hero-pointing.jpg', 1600, 1200), alt: 'ปันอธิบาย AI Workflow ให้ผู้เข้าร่วมในห้องอบรมจริง', caption: 'อธิบาย Flow บนจอ แล้วให้ทีมถามจากงานที่ตัวเองทำอยู่' },
    { id: 't4-team-group', kind: 'photo', image: publicImage('/lp/inhouse/team-group.jpg', 1200, 1600), alt: 'ปันถ่ายภาพร่วมกับผู้เข้าร่วมอบรมในองค์กร', caption: 'ห้องอบรมที่มี Owner, Manager และคนทำงานจริงร่วมกัน' },
    { id: 't4-onsite-cafe', kind: 'photo', image: publicImage('/lp/inhouse/onsite-cafe.jpg', 1200, 1600), alt: 'ปันสอนทีมแบบกลุ่มเล็กในสถานที่ขององค์กร', caption: 'กลุ่มเล็กช่วยให้หยิบขั้นตอนงานและข้อยกเว้นขึ้นมาคุยได้ตรงจุด' },
    { id: 't4-hands-on', kind: 'photo', image: publicImage('/lp/inhouse/hands-on.jpg', 1600, 1200), alt: 'ผู้เข้าร่วมลงมือทำงานบนแล็ปท็อปใน Workshop', caption: 'ทุกคนลงมือบน Laptop ของตัวเอง ไม่ได้นั่งดูเดโมอย่างเดียว' },
    { id: 't4-class-full', kind: 'photo', image: publicImage('/lp/inhouse/class-full.jpg', 1600, 1200), alt: 'ผู้เข้าร่วม Workshop เต็มห้องพร้อมอุปกรณ์ทำงาน', caption: 'ใช้ห้องจริง ทีมจริง และคำถามที่เกิดจากงานจริงของบริษัท' },
    { id: 't4-activity-six', kind: 'photo', image: publicImage('/advance-ai-course/testimonial6.JPG', 1800, 1350), alt: 'ปันทำกิจกรรม Advance AI ร่วมกับผู้เข้าอบรม', caption: 'ออกแบบกิจกรรมให้ทีมเห็นว่าขั้นไหนควรให้ AI ช่วย และขั้นไหนคนต้องตรวจ' },
    { id: 't4-activity-seven', kind: 'photo', image: publicImage('/advance-ai-course/testimonial7.JPG', 1800, 1350), alt: 'ผู้เข้าอบรม Advance AI ทำงานร่วมกันในห้อง', caption: 'การใช้ AI ในองค์กรเริ่มจากการตกลงวิธีทำงานร่วมกันของคนในทีม' },
    { id: 't4-activity-eight', kind: 'photo', image: publicImage('/advance-ai-course/gallery7.JPG', 1479, 1109), alt: 'บรรยากาศการสอน AI Workflow จากกิจกรรมจริง', caption: 'ภาพจากกิจกรรมจริง ไม่ใช่ภาพจำลองหรือภาพที่สร้างด้วย AI' },
    { id: 't4-quote-company', kind: 'quote', quote: 'อาจารย์ปันสอนถูกใจทีมงานมากครับ', image: publicImage('/testimonial/2026-05/review-05.jpg', 1000, 1000), alt: 'ข้อความรีวิวจากผู้บริหารหลังอบรม', caption: 'ข้อความที่ผู้บริหารส่งกลับมาหลังทีมเข้าอบรม' },
    { id: 't4-quote-build', kind: 'quote', quote: 'ทำเว็บจ้างหลายแสน จบในคืนเดียว เป็นไปได้เฉยพี่', image: publicImage('/testimonial/2026-07/review-09.jpg', 1410, 1410), alt: 'ข้อความผู้เรียนนำวิธีคิดไปสร้างงานต่อ', caption: 'ผู้เรียนนำวิธีคิดจากห้องไปต่อกับงานของตัวเอง' },
    { id: 't4-quote-continue', kind: 'quote', quote: 'ต่อยอดโปรเจกต์เลขาครับ สนุกดีครับ', image: publicImage('/testimonial/2026-07/review-11.jpg', 914, 914), alt: 'ข้อความผู้เรียนต่อยอดโปรเจกต์ AI หลังอบรม', caption: 'หลักฐานว่าผู้เรียนยังหยิบงานกลับไปทำต่อหลังคลาส' },
  ],
  clientLogos: T4_CLIENT_LOGOS,
  testimonials: T4_TESTIMONIALS,
  decisionCtas: [
    {
      location: 'after_proof',
      eyebrow: 'เลือกงานแรกให้ถูก',
      heading: 'ยังไม่แน่ใจว่างานไหนควรเริ่มให้ AI ทำแทน?',
      body: 'ส่งตัวอย่างงานซ้ำและขนาดทีมมาได้ครับ ผมช่วยดูว่าควรหยิบ Workflow ไหนเข้าห้องก่อน',
      variant: 'sand',
      actions: [{ kind: 'line', label: 'ทัก LINE ส่งโจทย์งาน', intent: 'workflow_selection' }],
    },
    {
      location: 'after_scope',
      eyebrow: 'เห็นภาพวันอบรมแล้ว',
      heading: 'ถ้ามีหนึ่ง Workflow ในใจ ส่งมาให้ผมเช็กก่อนจองคิว',
      body: 'บอกว่างานอะไร เกิดบ่อยแค่ไหน ใครเป็นเจ้าของงาน และข้อมูลส่วนไหนที่ต้องระวัง',
      variant: 'light',
      actions: [
        { kind: 'booking', label: 'จองคิวรับบริการ', intent: 'workflow_training' },
        { kind: 'line', label: 'ทัก LINE เช็กโจทย์', intent: 'workflow_fit' },
      ],
    },
    {
      location: 'after_fit',
      eyebrow: 'ทีมคุณเข้าข่ายไหม',
      heading: 'มี Owner และงานซ้ำหนึ่งเรื่อง ก็เริ่มคุยกันได้ครับ',
      body: 'ก่อนออกใบแจ้งหนี้ ผมจะเช็กขอบเขต ข้อมูล และคนที่ควรอยู่ในห้องให้ครบ',
      variant: 'navy',
      actions: [
        { kind: 'booking', label: 'จองคิวรับบริการ', intent: 'fit_check' },
        { kind: 'line', label: 'ทัก LINE เช็กความเหมาะสม', intent: 'fit_check' },
      ],
    },
  ],
  pains: [
    'อยากให้ธุรกิจโตโดยไม่ต้องเพิ่มคนทุกครั้งที่งานเพิ่ม — แต่ยังไม่รู้ว่างานไหนควรย้ายให้ AI ก่อน',
    'ใครก็สร้างระบบด้วย AI ได้ แต่คำถามคือใช้กับงานจริงได้ไหม ข้อมูลปลอดภัยไหม และใครเป็นคนตรวจผล',
    'อยากเอา AI Agent มาใช้ในองค์กร แต่ไม่รู้ว่าจะเริ่มจากฝ่ายไหน งานไหน หรือ Tool อะไรก่อน',
    'คนเก่งเสียเวลากับการคัดลอก สรุป จัดเอกสาร และตามข้อมูล แทนที่จะได้ใช้เวลากับงานที่ต้องอาศัยประสบการณ์',
  ],
  boundary: {
    heading: 'คอร์สหนึ่งวัน ที่พาทีมสร้าง AI Agent จากงานจริงหนึ่ง Workflow',
    body: [
      'เราเริ่มจากงานซ้ำที่กินเวลาคนในทีม เลือกหนึ่ง Workflow ที่มีเจ้าของชัด แล้วทำ Workflow Map ให้เห็น Input, Rule, Exception, Output และจุดที่คนต้องตัดสิน',
      'ทีมลงมือสร้าง AI Agent Working Prototype ด้วยข้อมูลจำลองหรือข้อมูลที่ Mask แล้ว พร้อมกำหนด Data Safety และ Human Review ก่อนเอาไปแตะงานที่มีผลจริง',
      'สิ่งที่จบในห้องคือ Working Prototype และ 30-Day Adoption Plan ไม่ใช่ระบบ Production. ถ้าต้องเชื่อม Live data, กำหนดสิทธิ์, ทำ UAT หรือมี SLA จะส่งต่อไปประเมินบริการ I1 แยก',
    ],
  },
  reasons: [
    { title: 'โตได้โดยไม่โยนงานเพิ่มให้คนเดิม', body: 'ให้ AI รับงานเตรียมข้อมูล จัดรูปแบบ และเอกสารซ้ำ เพื่อให้คนกลับไปทำงานที่ต้องใช้ประสบการณ์และการตัดสินใจ' },
    { title: 'สร้างได้ไม่พอ ต้องรู้ว่าใช้จริงได้แค่ไหน', body: 'ต้นแบบทุกชิ้นต้องมีเจ้าของงาน ขอบเขตข้อมูล และจุด Human Review ที่ระบุได้' },
    { title: 'เริ่มจากหนึ่ง Workflow ที่เห็นผลกับทีม', body: 'หนึ่งวันจึงไม่แตกเป็นหลายไอเดีย แต่จบด้วยงานหนึ่งเส้นที่ทีมอธิบาย สร้าง และเอาไปทำต่อได้' },
    { title: 'คนเก่งได้เวลากลับคืนมา', body: 'เป้าหมายคือให้คนที่มีประสบการณ์หยุดเสียเวลากับงานเอกสารจุกจิก แล้วกลับไปทำงานที่ต้องใช้การตัดสินใจ' },
  ],
  analogy: 'AI Agent เหมือนพนักงานใหม่ครับ ทำงานเร็วได้ แต่ต้องมีขอบเขต ตัวอย่างงาน และคนตรวจ ก่อนให้แตะข้อมูลหรือส่งงานออกไปจริง',
  scope: [
    { id: 'choose', label: '01 · Choose', title: 'เลือกงานซ้ำที่คุ้มจะย้ายให้ AI', learn: 'ดูความถี่ เวลาที่เสีย ความชัดของ Input/Output และคนที่เป็น Process owner', action: 'เทียบ Candidate จากงานของทีม แล้วเลือกหนึ่ง Workflow สำหรับวันอบรม', output: 'Workflow Candidate + Success condition' },
    { id: 'map', label: '02 · Map', title: 'แยกงานเดิมให้เห็นก่อนสร้าง', learn: 'เห็น Trigger, Input, Rule, Exception, Output และจุดที่ยังต้องใช้การตัดสินใจของคน', action: 'วาด Workflow Map จากตัวอย่างงานที่ปิดข้อมูลส่วนบุคคลแล้ว', output: 'Workflow Map สำหรับ 1 Workflow' },
    { id: 'build', label: '03 · Build', title: 'สร้าง AI Agent Working Prototype', learn: 'รู้วิธีให้ Context, ตัวอย่าง, กติกา และรูปแบบ Output ที่ AI ทำตามได้', action: 'ให้ Core team ลงมือสร้างและรันต้นแบบด้วยข้อมูลจำลองหรือข้อมูลที่ Mask แล้ว', output: 'AI Agent Working Prototype' },
    { id: 'guardrail', label: '04 · Guardrail', title: 'กำหนด Data Safety และ Human Review', learn: 'แยกข้อมูลที่ใช้ได้ ต้อง Mask ต้องขออนุมัติ หรือห้ามส่ง พร้อมระบุว่าใครตรวจผล', action: 'ทดสอบข้อผิดพลาดและเขียนกติกาก่อนใช้กับงานที่มีผลจริง', output: 'Data Safety + Human Review Rules' },
    { id: 'adopt', label: '05 · Adopt', title: 'วางแผนใช้ต่อให้ไม่จบแค่วันอบรม', learn: 'กำหนด Owner, ผู้ใช้กลุ่มแรก, งานที่จะทดลองใช้ และรอบทบทวนผล', action: 'วางแผน 30 วันโดยระบุสัปดาห์แรก คนรับผิดชอบ และหลักฐานที่ต้องเก็บ', output: '30-Day Adoption Plan' },
  ],
  takeHome: [
    'Workflow Map สำหรับ 1 Workflow',
    'AI Agent Working Prototype ที่ทีมสร้างและรันเองในห้อง',
    'Data Safety + Human Review Rules ก่อนแตะงานที่มีผลจริง',
    '30-Day Adoption Plan พร้อม Owner และสัปดาห์แรกที่ต้องเริ่ม',
  ],
  bonusCards: {
    enabled: SHOW_T4_BONUS_CARDS,
    heading: 'Bonus Material 5 ชิ้น ช่วยให้ทีมเริ่มและใช้ต่อได้ง่ายขึ้น',
    intro: 'ตอนนี้เปิดให้เห็นรายการก่อน คุณปันกำลังจัดทำไฟล์ฉบับใช้งานจริง จึงยังไม่มีปุ่มดาวน์โหลดบนหน้าเว็บ',
    items: [
      { number: '01', title: '30 AI Workflow Ideas', user: 'Owner และ Manager', timing: 'ก่อนเลือกงานแรก', outcome: 'เห็นตัวอย่างงานซ้ำจากหลายฝ่ายโดยไม่เริ่มจากชื่อ Tool', format: 'Material กำลังจัดทำ' },
      { number: '02', title: 'AI Data Safety Checklist 30 จุด', user: 'Owner, Manager และ Core team', timing: 'ก่อนให้ AI แตะข้อมูล', outcome: 'แยกสิ่งที่ใช้ได้ ต้อง Mask ต้องขออนุมัติ หรือห้ามส่ง', format: 'Material กำลังจัดทำ' },
      { number: '03', title: 'AI Build Brief', user: 'คนสร้างต้นแบบและ Process owner', timing: 'ก่อนเริ่ม Build', outcome: 'เขียน Goal, Input, Rule, Exception และ Output ให้ครบ', format: 'Material กำลังจัดทำ' },
      { number: '04', title: 'Workflow Example Library', user: 'ทุกฝ่ายที่กำลังหา Use case', timing: 'ตอนเทียบแนวทาง', outcome: 'เห็น Pattern แล้วปรับให้เข้ากับบริบทบริษัท ไม่ลอกทั้งระบบ', format: 'Material กำลังจัดทำ' },
      { number: '05', title: '30-Minute Adoption Review', user: 'Owner และ Manager', timing: 'ภายใน 30 วันหลังอบรม', outcome: 'ทบทวนการใช้จริง ปัญหาที่เจอ และงานที่ควรทำต่อ', format: 'Material กำลังจัดทำ' },
    ],
  },
  fit: [
    'องค์กรที่มีงานเอกสารหรืองานข้อมูลซ้ำ และเลือกมาเริ่มได้ 1 Workflow',
    'มี Process owner ที่อธิบายขั้นตอนเดิม กติกา และข้อยกเว้นได้',
    'มี Owner, Manager หรือ Champion ที่จะพาทีมใช้ต่อหลังวันอบรม',
    'ยอมเริ่มจากข้อมูลจำลองหรือข้อมูลที่ Mask แล้ว เพื่อวางความปลอดภัยให้ถูกก่อน',
  ],
  notFit: 'ยังไม่เหมาะถ้าต้องการสร้างหลาย Workflow ในวันเดียว ต้องการเชื่อม Live data หรือคาดหวังระบบ Production พร้อม SLA ทันที และไม่ได้รับประกันว่าจะลดจำนวนคนได้ทันที เป้าหมายของ T4 คือให้ทีมลดงานจุกจิกและเริ่มใช้ AI อย่างรับผิดชอบ ถ้าต้องการระบบ Production ให้ประเมิน I1 แยก',
  relatedOffer: { href: '/services/dashboard-build', label: 'ต้องการระบบ Production, Live integration, UAT และ Handover? ดูบริการ I1' },
  bio: [
    'ผมไม่ได้สอนจากรายชื่อ Tool อย่างเดียว งานขาย งานเอกสาร การติดตามดีล และ Morning Brief ในธุรกิจของผมมี AI Workflow ช่วยอยู่ทุกวัน จึงรู้ว่าต้นแบบที่ดูดี ต่างจากระบบที่ทีมกล้าใช้จริงตรงไหน',
    'ประสบการณ์ขายและโค้ชทีมทำให้ผมเริ่มจากคนรับผิดชอบ กติกาของงาน และจุดที่ต้องตัดสิน ไม่ใช่รีบเอาทุกอย่างให้ AI ทำแทน',
    'ในห้องผมจะพาทีมสร้างเองกับหนึ่ง Workflow เพื่อให้หลังจบคลาส คนในองค์กรยังอธิบาย แก้ และวางแผนใช้ต่อได้ครับ',
  ],
  investment: {
    included: ['In-house Training 1 วัน สำหรับหนึ่งองค์กร', 'เลือกและทำงานกับ 1 Workflow ของบริษัท', 'Workflow Map + AI Agent Working Prototype', 'Data Safety + Human Review Rules', '30-Day Adoption Plan และ Bonus Material 5 ชิ้น', 'เอกสารใบเสนอราคาและใบกำกับภาษีสำหรับบริษัท'],
    terms: 'ชำระค่าบริการ 100% ก่อนวันอบรมเพื่อยืนยันคิว บริษัทเตรียม Process owner และตัวอย่างงานที่ใช้ข้อมูลจำลองหรือข้อมูลที่ Mask แล้วตาม Pre-work',
    scarcity: '1 เดือนผมรับอบรมจำกัดแค่ 10 องค์กร สงวนสิทธิให้องค์กรที่ชำระค่าบริการและคิวก่อน',
  },
  faq: [
    { question: 'คอร์สนี้เหมาะกับฝ่ายไหน?', answer: 'เริ่มได้ทั้งฝ่ายขาย การตลาด แอดมิน บัญชี จัดซื้อ HR หรือ Operations ครับ ขอเพียงมีงานซ้ำหนึ่ง Workflow และมีคนที่อธิบายงานนั้นได้จริง' },
    { question: 'ต้องมีทีม IT หรือเขียนโค้ดเป็นไหม?', answer: 'ไม่จำเป็นครับ ทีมใช้เครื่องมือ AI ที่เรียนรู้ได้ในห้อง สิ่งที่ต้องมีคือ Process owner, ตัวอย่างงาน และคนที่จะรับผิดชอบการใช้ต่อ' },
    { question: 'ในหนึ่งวันสร้างได้กี่ระบบ?', answer: 'เราเลือก 1 Workflow เพื่อให้ทีมได้ครบตั้งแต่ Map, Build, Guardrail ถึง Adoption Plan ครับ ถ้าแบ่งหลายเรื่องพร้อมกัน มักเหลือแต่เดโมที่ไม่มีเจ้าของเอาไปใช้ต่อ' },
    { question: 'ใช้ข้อมูลลูกค้าจริงในห้องได้ไหม?', answer: 'เริ่มจากข้อมูลจำลองหรือข้อมูลที่ Mask แล้วครับ ทีมจะใช้ Data Safety Checklist แยกว่าอะไรใช้ได้ ต้องขออนุมัติ หรือต้องห้ามส่งออกก่อน' },
    { question: 'จบวันแล้วได้ระบบ Production เลยไหม?', answer: 'สิ่งที่ได้คือ AI Agent Working Prototype และแผนใช้ต่อ 30 วันครับ หากต้องเชื่อม Live data, จัดสิทธิ์ผู้ใช้, ทำ UAT, Monitoring หรือ SLA จะประเมินเป็นบริการ I1 แยก' },
    { question: 'คอร์สนี้ช่วยลดคนได้ไหม?', answer: 'ผมไม่รับประกันการลดจำนวนคนครับ เป้าหมายคือย้ายงานเอกสารและงานข้อมูลซ้ำให้ AI ช่วย เพื่อให้คนเก่งมีเวลากลับไปทำงานที่ต้องใช้ประสบการณ์และการตัดสินใจ' },
    { question: 'ต้องเตรียมอะไรก่อนวันอบรม?', answer: 'เตรียมรายชื่อ Candidate งานซ้ำ, Process owner, ตัวอย่าง Input/Output ที่ปิดข้อมูลแล้ว, กติกาหรือข้อยกเว้น และรายชื่อ Core team ที่จะลงมือสร้าง' },
    { question: 'ถ้ายังไม่รู้ว่าจะเลือก Workflow ไหน?', answer: 'ทัก LINE ส่งตัวอย่างงานที่ทีมทำซ้ำพร้อมความถี่มาได้ครับ ผมจะช่วยเช็กความเหมาะสมก่อนออกใบแจ้งหนี้' },
  ],
  cta: {
    primary: 'จองคิวรับบริการ',
    secondary: 'ทัก LINE ส่งโจทย์ Workflow',
    secondaryIntent: 'workflow_fit',
    heroSecondary: 'ทัก LINE เช็กโจทย์ก่อน',
    heroSecondaryIntent: 'workflow_fit',
    finalSecondary: 'ทัก LINE ส่งโจทย์ทีม',
    finalSecondaryIntent: 'workflow_fit',
    finalCaption: 'สแกน QR แล้วพิมพ์คำว่า “AI WORKFLOW” พร้อมจำนวนทีม',
    finalMobileInstruction: 'ทัก LINE แล้วพิมพ์คำว่า “AI WORKFLOW” พร้อมจำนวนทีม',
    finalMicrocopy: 'บอกงานซ้ำ ความถี่ Process owner และข้อมูลที่ต้องระวัง ผมจะช่วยดูว่า 1 Workflow ไหนเหมาะจะเริ่มก่อน',
    keyword: T4_LINE_KEYWORD,
    locations: {
      afterInvestment: { primary: 'จองคิวรับบริการ', primaryIntent: 'book_training', secondary: 'ทัก LINE เช็กคิวว่าง', secondaryIntent: 'availability' },
      final: { primary: 'จองคิวรับบริการ', primaryIntent: 'book_training', secondary: 'ทัก LINE ส่งโจทย์ Workflow', secondaryIntent: 'workflow_fit' },
    },
  },
  seo: {
    title: 'Advance AI & Business Automation | สอนทีมใช้ AI Agent ในองค์กร',
    description: 'คอร์สอบรม In-house 1 วัน สอนทีมใช้ AI Agent ลดงานเอกสารจุกจิก สร้าง Working Prototype พร้อม Data Safety, Human Review และแผนใช้ต่อ 30 วัน',
  },
  sections: {
    authority: { heading: 'สอนจากประสบการณ์ขาย โค้ชทีม และสร้าง AI Workflow ใช้งานจริง', copy: 'ผมพาทีมเริ่มจากงานที่คนทำอยู่ ไม่เริ่มจาก Tool เพื่อให้สิ่งที่สร้างในห้องมีเจ้าของ มีคนตรวจ และมีทางใช้ต่อหลังจบคลาส' },
    proof: { heading: 'ภาพจากห้องอบรมจริง และงานที่ผู้เรียนเอาไปทำต่อ', intro: 'รูปกิจกรรมทุกใบเป็นภาพจริงของปันและผู้เข้าร่วม ส่วนข้อความรีวิวใช้เฉพาะหลักฐานที่ได้รับอนุญาตให้เผยแพร่' },
    pain: { heading: 'AI ควรช่วยธุรกิจโต โดยไม่เพิ่มงานให้คนเก่ง' },
    reasons: { heading: 'เหตุผลที่องค์กรควรเริ่มจากงานจริงหนึ่ง Workflow' },
    scope: { heading: 'Choose → Map → Build → Guardrail → Adopt', intro: 'วันอบรมเดินทีละขั้น ตั้งแต่เลือกงานจนถึงแผนใช้ต่อ 30 วัน ทุกช่วงตอบให้ได้ว่าเข้าใจอะไร ลงมือทำอะไร และถืออะไรกลับไป', ctaHeading: 'มีงานซ้ำหนึ่งเรื่องที่อยากให้ AI ช่วยรับไปทำหรือยัง?' },
    takeHome: { heading: 'Core 4 ชิ้นที่ทีมถือกลับไปใช้ต่อ', close: 'ทั้งสี่ชิ้นอยู่ในขอบเขต 1 Workflow และใช้เป็นฐานตัดสินใจว่าควรทดลองใช้ต่อ ปรับกติกา หรือประเมินระบบ Production ผ่าน I1' },
    fit: { heading: 'เหมาะกับองค์กรที่อยากเริ่มใช้ AI ให้ถูกงานและปลอดภัย' },
    bio: { eyebrow: 'Instructor', heading: 'คนสอนคือคนที่สร้าง AI Workflow ใช้กับธุรกิจตัวเองทุกวัน' },
    investment: { eyebrow: 'ค่าอบรมสำหรับหนึ่งองค์กร · 1 วัน · 1 Workflow' },
    final: { heading: 'เลือกงานจุกจิกหนึ่งเรื่อง แล้วเริ่มคืนเวลาให้คนเก่งในทีม', copy: 'จองคิวหรือทัก LINE พร้อมคำว่า “AI WORKFLOW” บอกงานซ้ำ ความถี่ และจำนวนทีม ผมจะเช็กโจทย์ก่อนออกใบแจ้งหนี้' },
  },
};
