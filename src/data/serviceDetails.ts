export type AccentToken = 'cyan' | 'coral' | 'violet';

export type ServiceDetail = {
  slug: string;
  accent: AccentToken;
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  headlineTail?: string;
  subhead: string;
  pains: { emoji: string; title: string; body: string }[];
  audience: string[];
  agenda: { time: string; title: string; body: string }[];
  outcomes: string[];
  priceHeadline: string;
  priceCompare?: string;
  priceNote?: string;
  inclusions: string[];
  notIncluded?: string[];
  faqs: { q: string; a: string }[];
};

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  'ai-workshop': {
    slug: 'ai-workshop',
    accent: 'cyan',
    eyebrow: 'Advance AI & Business Automation · 1 วัน',
    headline: 'ผมไม่ได้แค่สอน',
    headlineAccent: 'ผมจับมือทำ AI ตัวแรก',
    headlineTail: 'ของธุรกิจคุณในวันเดียว',
    subhead:
      '1 วันเต็ม 6-7 ชั่วโมง · ทีมขาย 5-20 คน · ออกจากห้องพร้อม n8n workflow + AI Agent ที่ run ได้จริง + 30 prompts ready-to-use · ไม่ใช่ concept ไม่ใช่ roadmap — ทีมได้เวลาคืน ≥5 ชม./สัปดาห์ หรือคืนเงิน 100%',
    pains: [
      {
        emoji: '💬',
        title: 'ตอบ Chat ลูกค้าไม่ทัน',
        body: 'LINE/IG/FB เข้ามาพร้อมกัน ทีมตอบไม่ทัน ลูกค้ารอนาน = เสียดีล เจ้าของต้องมาตอบเอง = หมดแรงเต็มวัน',
      },
      {
        emoji: '🤔',
        title: 'อยากเริ่ม AI แต่ไม่รู้จะเริ่มตรงไหน',
        body: 'เห็นคนอื่นใช้ AI ทำงานได้หลายอย่าง อ่านข่าวทุกวัน แต่พอจะเริ่มกับธุรกิจตัวเอง ติดตรง "ควรเริ่ม use case ไหนก่อน"',
      },
      {
        emoji: '🚀',
        title: 'อยากขยายแต่ไม่อยากจ้างเพิ่ม',
        body: 'ยอดเริ่มโต ทีมเริ่มไม่พอ แต่การจ้างพนักงานใหม่ = cost คงที่ + onboard + risk · อยากให้ระบบทำแทนได้หรือเปล่า',
      },
      {
        emoji: '📈',
        title: 'อยากสร้างระบบ AI ให้มียอดจริง',
        body: 'ไม่ใช่ "มี AI เพื่อว่ามี" แต่อยากให้ AI ทำงานที่วัดผลได้ — ยอดขายเพิ่ม · เวลาคืน · cost ลด ไม่ใช่แค่ hype',
      },
    ],
    audience: [
      'SME B2B ทีมขาย 5-20 คน ที่เจ้าของอยากให้ทีมใช้ AI ลดงานซ้ำ',
      'ทีมที่เคยซื้อ course ออนไลน์แล้วไม่ได้ implement ต่อ',
      'เจ้าของที่อยากเห็น AI รันจริง ก่อนตัดสินใจลงทุนก้อนใหญ่',
    ],
    agenda: [
      {
        time: 'ช่วงเช้า (9:00-12:00)',
        title: 'Diagnose + Design',
        body: 'วิเคราะห์ workflow ทีมขายจริงของลูกค้า · ชี้จุดที่ AI ลดเวลาได้มากสุด · ออกแบบ workflow 1 ตัวที่สำคัญที่สุด',
      },
      {
        time: 'ช่วงบ่าย (13:00-16:00)',
        title: 'Build + Train',
        body: 'Build workflow จริงในห้อง (Google Sheets + n8n / Apps Script) · ทีมลองใช้ทันที · วัดผล Before / After ในวันเดียวกัน',
      },
      {
        time: 'ช่วงเย็น (16:00-17:00)',
        title: 'Handover',
        body: 'สอน team lead maintain ระบบต่อ · ส่ง documentation + screen recording · บอกขั้นตอนต่อไปถ้าต้องการขยาย',
      },
    ],
    outcomes: [
      'กลับบ้านพร้อม n8n workflow + AI Agent ที่ run ได้จริง · ใช้งานวันรุ่งขึ้นได้เลย',
      'Prompt library 30 ตัว tested · ทีมขาย copy-paste ใช้ทันที',
      'วัดผล Before / After ภายใน workshop วันเดียว · ไม่ใช่รอเดือน',
      'Team lead maintain ระบบเองได้ ไม่ต้องพึ่งผมต่อเดือน',
      'ทีมเห็น AI ทำงานจริงกับธุรกิจตัวเอง ไม่ใช่แค่ theory',
    ],
    priceHeadline: '฿24,900 / 1 วัน',
    priceCompare: '🔥 ราคาพิเศษเดือนนี้ ฿24,900 (ปกติ ฿30,000) · เหลือ 2 เจ้าจาก 5 เจ้า · หมดแล้วกลับเป็นราคาเต็ม',
    priceNote: 'Format: in-house on-demand · ปันจัดเวลาให้ตามความสะดวกของทีมคุณ · 100% upfront ก่อนเริ่มงาน',
    inclusions: [
      'Workshop 1 วัน 6-7 ชม. · On-site หรือ Online',
      'n8n workflow + AI Agent 1 ตัวที่ build ในห้อง (production-ready)',
      'Prompt library 30 prompts tested สำหรับงาน admin + sales',
      '30-day async LINE support หลัง workshop (Mon-Fri)',
      'Handover document + screen recording ทุก session',
      'Team lead training session — ทีมดูแลต่อเองได้',
    ],
    notIncluded: [
      'Monthly retainer (คุยได้หลัง workshop ถ้าต้องการต่อยอด)',
      'Custom agent development เกิน scope 1 วัน (scope แยก)',
      'ค่าเดินทาง on-site ต่างจังหวัด (คิดแยก ตามระยะทาง)',
    ],
    faqs: [
      {
        q: 'ทีมต้องเตรียมอะไรบ้างก่อน Workshop',
        a: 'ผมส่ง checklist ล่วงหน้า 1 สัปดาห์ — หลักๆ คือเตรียม Google account, access ไปยัง data ที่อยากใช้ (Sheets/Drive), และมีตัวอย่าง workflow จริง 2-3 เคสมาเล่าให้ฟัง · ไม่ต้องเตรียม tech ใดๆ',
      },
      {
        q: 'ถ้าทีมไม่เก่ง tech จะตามทันไหม',
        a: 'ตาม 100% ได้ · ลูกค้าผม 8/10 ทีมไม่มีใครเขียน code · stack ที่ผมใช้ (Sheets + n8n + Claude) ออกแบบให้ non-tech ดูแลต่อเองได้ 100%',
      },
      {
        q: 'หลัง Workshop ถ้าเจอปัญหาถามใครได้',
        a: '30-day async LINE support รวมในราคาแล้ว · ผมตอบทุกข้อความใน 24 ชม. (Mon-Fri) · ถ้าต้องการ scope ต่อยอดระยะยาว คุยเรื่อง Monthly Consulting หลัง workshop ได้',
      },
      {
        q: 'Early Bird ราคา ฿19,900 ต่างจาก ฿25K ยังไง',
        a: 'ฟีเจอร์ + deliverables เหมือนกันทุกประการ · Early Bird คือ signal ว่าคุณพร้อม commit ก่อน batch ถัดไปเปิด · ติดต่อผมเพื่อเช็ค current batch status',
      },
      {
        q: 'Guarantee "ได้เวลาคืน ≥5 ชม./สัปดาห์" วัดยังไง',
        a: 'ก่อน workshop วัด baseline เวลาที่ทีมใช้กับงานซ้ำ · 30 วันหลัง workshop เปรียบเทียบ · ถ้าไม่ได้ ≥5 ชม./สัปดาห์ (เฉลี่ย 4 สัปดาห์) = คืนเงิน 100%',
      },
      {
        q: 'Advance AI & Business Automation ต่าง AI & Business Marketing ยังไง',
        a: 'Automation = admin overhead (report, follow-up manual, data entry) · Marketing = content production + funnel · ถ้าไม่แน่ใจ ทักผมช่วย diagnose ก่อนเลือก',
      },
    ],
  },
  'ai-workshop-followup': {
    slug: 'ai-workshop-followup',
    accent: 'cyan',
    eyebrow: 'AI Workshop + 30 Days',
    headline: 'Workshop จบแล้วทีมหยุดใช้',
    headlineAccent: 'ใน 2 สัปดาห์?',
    headlineTail: 'ปันอยู่กับทีม 30 วัน จนใช้เป็นนิสัย',
    subhead:
      'AI Workshop 1 วัน + Follow-up 4 ครั้ง + Async LINE Support 30 วัน — guarantee ว่าระบบที่สร้างจะไม่ตายหลัง workshop',
    pains: [
      {
        emoji: '😩',
        title: 'Workshop จบ ทีมกลับไปใช้ Excel เหมือนเดิม',
        body: 'ลูกค้าเคยจ่าย ฿30k Workshop กับที่ปรึกษาคนอื่น 2 สัปดาห์ต่อมาเปิดไฟล์ไม่มีใครใช้ เสียเงินฟรี',
      },
      {
        emoji: '🤷',
        title: 'เจอปัญหาจริงแล้วไม่มีใครช่วย',
        body: 'ระบบใช้ไปเจอเคสแปลกๆ ที่ workshop ไม่ได้สอน — ถามใครก็ไม่ได้ ทิ้งไปเลยง่ายกว่า',
      },
      {
        emoji: '📊',
        title: 'วัดผลจริงของ AI ไม่ได้',
        body: 'ไม่รู้ว่า AI ช่วยทีมจริงไหม ช่วยกี่เปอร์เซ็นต์ ROI คุ้มกับค่า workshop ที่จ่ายไปไหม',
      },
    ],
    audience: [
      'เคยจ่าย Workshop แล้วทีมเลิกใช้ภายใน 2 สัปดาห์ ไม่อยากเสียเงินฟรีอีก',
      'ทีมขายที่ยังกลัวว่า AI จะมา replace ตัวเอง ต้องมีคนช่วย coach 30 วัน',
      'เจ้าของที่ต้องการ ROI วัดได้ ไม่ใช่แค่ "ทีมรู้สึกดี"',
    ],
    agenda: [
      {
        time: 'Day 1',
        title: 'AI Workshop (6-7 ชม.)',
        body: 'Diagnose → Design → Build → Train — ทุกอย่างใน AI Day Workshop รวมอยู่แล้ว',
      },
      {
        time: 'Week 1',
        title: 'Follow-up Session #1',
        body: 'เช็คว่าทีมใช้จริงไหม เจอปัญหาอะไร ปรับ workflow ตามจริงที่หน้างาน',
      },
      {
        time: 'Week 2-3',
        title: 'Follow-up #2 + #3',
        body: 'ขยาย use case เพิ่มอีก 1-2 workflow · ฝึกทีมที่ใช้ยังไม่คล่องให้คล่อง · debug เคสที่แปลก',
      },
      {
        time: 'Week 4',
        title: 'Follow-up + Handover Final',
        body: 'สรุปผล Before / After วัด ROI จริง · handover document + recording · set plan หลัง 30 วัน',
      },
    ],
    outcomes: [
      'ระบบยังรันอยู่หลัง 30 วัน ทีมใช้เป็นนิสัย ไม่ใช่ของใหม่ที่ดูเฉยๆ',
      'Before / After report ที่วัดเวลาประหยัด + งานที่ AI รับไป',
      '2-3 AI workflow พร้อมใช้ ไม่ใช่แค่ 1 ตัวเหมือน package เริ่มต้น',
      'Team lead โตเป็นคนที่ดูแลระบบต่อเอง ไม่ต้องพึ่งผม',
    ],
    priceHeadline: '฿50,000 / ทั้ง package',
    priceCompare: '฿30,000 workshop เดี่ยว → ฿50,000 + 30 วัน = คุ้มกว่า ฿10,000 vs ซื้อแยก',
    priceNote: '100% upfront · ครอบคลุม workshop + 4 follow-up + async LINE support 30 วัน',
    inclusions: [
      'AI Day Workshop 1 วัน (ทุกอย่างใน package แรก)',
      'Follow-up session 4 ครั้ง (สัปดาห์ละ 1)',
      'Async LINE support 30 วัน ตอบใน 24 ชม. (จ-ศ)',
      'ขยาย workflow เพิ่มอีก 1-2 ตัว',
      'Before / After ROI report ตอนจบ 30 วัน',
    ],
    notIncluded: [
      'Monthly retainer หลัง 30 วัน (คุยได้หลังจบ ถ้าต้องการต่อ)',
      'ค่าเดินทาง on-site ต่างจังหวัด',
    ],
    faqs: [
      {
        q: 'ถ้าทีมไม่ใช้ AI ต่อหลัง 30 วันจะเป็นไง',
        a: 'เป็นไปได้ยาก เพราะ 4 follow-up จะปรับให้ AI กลายเป็นส่วนหนึ่งของ workflow ทีม ไม่ใช่ "ของใหม่" แต่ถ้าเกิดจริง ผม refund 20% ของค่าบริการ',
      },
      {
        q: '4 follow-up นัดยังไง ต้องมาทุกคน',
        a: 'นัดเวลาที่ทีมสะดวก ไม่ต้องมาทุกคน ให้ team lead + 1-2 key user พอ ส่วนที่เหลือดูผ่าน recording',
      },
      {
        q: 'async LINE support คือยังไง',
        a: 'กลุ่ม LINE กับผม ถามได้ตลอด จ-ศ ผมตอบใน 24 ชม. ใช้สำหรับ debug เคสที่เจอหน้างาน ไม่ใช่ scope ใหม่',
      },
    ],
  },
  'sales-system-sprint': {
    slug: 'sales-system-sprint',
    accent: 'coral',
    eyebrow: 'Sales System · 1 Month',
    headline: 'ทีมขายมี 5-20 คน แต่ยอด',
    headlineAccent: '80% มาจากคุณคนเดียว',
    headlineTail: 'วางระบบให้ทีมวิ่งเอง ใน 1 เดือน',
    subhead:
      '1 เดือนจบ: Discovery → Design → Build → Training พร้อม KPI dashboard + Commission calculator + n8n workflow — ทีม run ต่อเองได้หลัง handover',
    pains: [
      {
        emoji: '⚖️',
        title: 'Commission ไม่แฟร์ ทีม turnover สูง',
        body: 'จ่ายตาม "ความรู้สึก" หรือ formula เก่าที่ outdated — คนเก่งเซ็งเพราะปิด deal ใหญ่ได้ commission เท่ากับคนอื่น',
      },
      {
        emoji: '📉',
        title: 'KPI ไม่รู้ว่าทีมกำลังแพ้หรือชนะ',
        body: 'เห็นยอดตอนสิ้นเดือนเท่านั้น ระหว่างเดือนไม่รู้ว่าใครแผ่ว ใครวิ่งดี แก้ไม่ทัน',
      },
      {
        emoji: '🚪',
        title: 'เจ้าของต้องเข้าไป close deal ใหญ่เอง',
        body: 'ทีมปิด deal เล็กได้ แต่ deal ใหญ่ต้องเรียกเจ้าของ ถ้าเจ้าของไม่ว่าง เสียดีลหรือลูกค้ารอ',
      },
    ],
    audience: [
      'SME ทีมขาย 5-20 คน รายได้ 30-200M บาท/ปี กำลัง scale',
      'เจ้าของที่อยากปล่อยมือจากการ close deal แทนทีม',
      'ทีมที่ยังไม่มี KPI / Commission structure ชัดเจน หรือมีแต่ไม่เวิร์ก',
    ],
    agenda: [
      {
        time: 'Week 1 — Discovery',
        title: 'Map สถานการณ์จริง',
        body: 'สัมภาษณ์เจ้าของ + ทีมขาย · ดู data 3 เดือนย้อนหลัง · ระบุ bottleneck + จุดที่ scale ติด',
      },
      {
        time: 'Week 2 — Design',
        title: 'วางระบบ KPI + Commission',
        body: 'Design KPI ที่ทีมวิ่งได้จริง · Commission structure ที่ fair + วัดได้ · Sales process ที่ reproducible',
      },
      {
        time: 'Week 3 — Build',
        title: 'Build ระบบจริง',
        body: 'Commission calculator ที่คำนวณเอง · KPI dashboard real-time · n8n workflow + AI tools สำหรับ automate งานซ้ำ',
      },
      {
        time: 'Week 4 — Training + Handover',
        title: 'ฝึกทีม + ส่งมอบ',
        body: 'Training 2 วันเต็ม ทีมใช้งานจริง · Handover document + recording · Q&A 30 วัน async support',
      },
    ],
    outcomes: [
      'ทีมรู้ KPI ของตัวเอง real-time ไม่ต้องรอสิ้นเดือน',
      'Commission structure ที่ทีมเข้าใจทุกคน คำนวณเองได้',
      'n8n workflow ช่วย automate lead qualification + follow-up reminder + report',
      'เจ้าของลดเวลา micromanage 50%+ ปล่อยให้ทีมวิ่งเอง',
    ],
    priceHeadline: '฿65,000 / project',
    priceNote: '1 เดือนจบ · 100% upfront · ไม่มี monthly retainer บังคับ',
    inclusions: [
      'Discovery + data audit',
      'KPI + Commission structure (document + calculator)',
      'KPI dashboard real-time (Google Sheets + Apps Script)',
      'n8n workflow 2-3 ตัว สำหรับ automate งานซ้ำ',
      'Training 2 วัน + Handover document + screen recording',
      'Async LINE support 30 วันหลัง handover',
    ],
    notIncluded: [
      'AI Day Workshop (separate ฿30k — ส่วนใหญ่รวมมาด้วยแล้วผ่าน AI workflow ใน sprint)',
      'ค่าเดินทาง on-site ต่างจังหวัด',
      'Monthly retainer หลัง handover (optional)',
    ],
    faqs: [
      {
        q: '1 เดือนพอไหม ทำจริงหรือแค่ framework',
        a: '1 เดือนพอสำหรับ SME 5-20 คน เพราะผม focus ที่ 3 deliverable หลัก (KPI + Commission + 2-3 workflow) ไม่ทำ everything — ถ้าทีมใหญ่กว่า 20 คน หรือหลายสาขา อาจต้อง Sprint 2 เดือน (quote แยก)',
      },
      {
        q: 'ถ้าทีมไม่ co-operate ระหว่าง sprint',
        a: 'ผมต้องการ commitment จากเจ้าของก่อนเริ่ม ว่าทีมจะให้เวลา 4-6 ชม./สัปดาห์ ถ้าเจ้าของไม่สามารถ enforce ได้ ผมจะบอกก่อนรับงาน ไม่ใช่รับเงินแล้วมาทะเลาะกัน',
      },
      {
        q: 'ต่อ retainer หลังจบได้ไหม',
        a: 'ได้ quote ตาม scope จริง ไม่มี retainer บังคับ ลูกค้าส่วนใหญ่ maintain เองได้หลัง 30 วัน เพราะ stack ออกแบบให้ non-tech ดูแลได้',
      },
    ],
  },
  'sale-training-bundle': {
    slug: 'sale-training-bundle',
    accent: 'coral',
    eyebrow: 'Sale Training · 2 Days',
    headline: 'ทีมยังปิดการขายด้วย',
    headlineAccent: 'การลดราคา',
    headlineTail: 'เปลี่ยนเป็นปิดด้วยคุณค่า ใน 2 วัน',
    subhead:
      'Value-Based Selling + Sales Psychology — Workshop 2 วันเต็มสำหรับทีมขาย ≤20 คน ลูกค้าซื้อเพราะเชื่อ ไม่ใช่เพราะถูก',
    pains: [
      {
        emoji: '💸',
        title: 'ปิดดีลได้ก็ต่อเมื่อยอมลดราคา',
        body: 'Margin หดทุกเดือน เพราะทีมไม่มี tool อื่นนอกจาก "ขอส่วนลด" เพื่อ close ปิดสามดีลแต่กำไรเท่าหนึ่งดีล',
      },
      {
        emoji: '😵',
        title: 'ลูกค้าเทียบราคาแล้วไปที่ถูกกว่า',
        body: 'ทีมเซลล์ฝากของไปแล้วหายเงียบ ไม่รู้ว่าลูกค้าไปถามคนอื่นหรือเปล่า ไม่เคยชวนลูกค้าคุยถึงปัญหาจริง',
      },
      {
        emoji: '🤖',
        title: 'ทีมใช้ script ตายตัวเหมือน chatbot',
        body: 'ฟังเสียงเดียวกับทุกคน ลูกค้ารู้ว่า "สคริปต์" แล้วเลิกสนใจ ปิดการขายไม่ได้',
      },
    ],
    audience: [
      'ทีมขาย Telesales / Chat Commerce / Field Sales ที่ปิดด้วยลดราคาเป็นหลัก',
      'SME ที่ margin ถูกกิน เพราะทีมไม่มีวิธีขายคุณค่า',
      'ทีมที่ต้องเปลี่ยนจาก "ขายสินค้า" เป็น "ขายการแก้ปัญหา"',
    ],
    agenda: [
      {
        time: 'Day 1 — Value-Based Selling',
        title: 'เปลี่ยน mindset + tool',
        body: 'Jobs to be Done framework · Pain Point Discovery · Solution Mapping · Workshop ทำจริงกับเคสของบริษัท',
      },
      {
        time: 'Day 2 — Consultative Closing',
        title: 'ปิดด้วยจิตวิทยา ไม่ใช่ส่วนลด',
        body: 'Functional / Emotional / Social decision framework · Handle objection โดยไม่ drop ราคา · Role-play 3 รอบ + feedback',
      },
      {
        time: 'หลัง Training',
        title: 'Post-training KPI',
        body: 'ติดตาม 30 วัน: closing rate + discount rate + deal size — วัดผลจริง ไม่ใช่แค่ "ทีมรู้สึกดี"',
      },
    ],
    outcomes: [
      'Close rate เพิ่ม 20-40% ภายใน 2 เดือนหลัง training',
      'Discount rate ลดลง 30-50% (Margin กลับมา)',
      'ทีมเปลี่ยนจาก "ส่งใบเสนอราคา" เป็น "คุยแล้วลูกค้าอยากซื้อเอง"',
      'Average deal size เพิ่ม เพราะทีมขายได้ bundle / premium tier',
    ],
    priceHeadline: '฿52,800 / 2 วัน',
    priceNote: 'In-house training ≤20 คน · 100% upfront · ค่าเดินทางต่างจังหวัดแยก',
    inclusions: [
      'Workshop 2 วันเต็ม (12-14 ชม.)',
      'Training material + workbook สำหรับทีม',
      'Role-play 3 รอบ + 1:1 feedback รายบุคคล',
      'Post-training KPI tracking template',
      'Async LINE support 14 วัน หลัง training',
    ],
    notIncluded: [
      'Commission / KPI redesign (อยู่ใน Sales System Sprint ฿65k)',
      'AI workflow (Sale Training Bundle ไม่รวม — อยู่ใน AI Workshop)',
      'ค่าเดินทาง on-site ต่างจังหวัด',
    ],
    faqs: [
      {
        q: 'ทีมเกิน 20 คนทำได้ไหม',
        a: 'ได้ แต่ต้องแบ่ง 2 รอบ เพราะผม focus คุณภาพของ role-play ทีม 30 คนใน 2 วันทำจริงไม่ได้ role-play ทุกคน',
      },
      {
        q: 'ต่าง Value Selling ของที่ปรึกษาคนอื่นยังไง',
        a: 'Workshop ของผมใช้ case study จากทีมของลูกค้าจริง 100% ไม่ใช่ textbook example — ทีมฝึกกับลูกค้าจริงที่ปิดอยู่ในระบบ',
      },
      {
        q: 'มี pre-work ต้องทำไหม',
        a: 'มี 2 อย่าง: 1) ส่ง deal ที่ปิดไม่ได้ 5-10 เคสให้ผมดู 2) กรอก sales profile ของทีม 3 วันก่อน เพื่อเตรียม role-play ที่ตรง',
      },
    ],
  },
  'trust-content-tiktok-workshop': {
    slug: 'trust-content-tiktok-workshop',
    accent: 'violet',
    eyebrow: 'Special Workshop · 1 Day',
    headline: 'มือถือเครื่องเดียว',
    headlineAccent: 'สร้างลูกค้า B2B',
    headlineTail: 'ด้วย TikTok content ที่ปิดการขาย',
    subhead:
      '1 Day In-House Workshop — เจ้าของ SME ถ่ายคลิปเองได้ 3 คลิปในวันนั้น พร้อม Content Calendar 30 วัน + Trust Framework + Script Template Kit',
    pains: [
      {
        emoji: '👀',
        title: 'จ้างคนทำ content ยอดวิวดี แต่ไม่มีลูกค้า',
        body: 'จ้างเอเจนซี่รายเดือน content ดูดี ยอดวิวหลักหมื่น แต่ไม่เคยมีใครทักมาคุยเรื่องซื้อ',
      },
      {
        emoji: '🎬',
        title: 'เริ่มถ่ายเองไม่ถูก กลัวไม่ pro',
        body: 'เคยลองเปิดกล้อง แต่พูดไม่ไหลลื่น ตัดต่อเองไม่เป็น เลยเลิกล้มก่อนเริ่ม',
      },
      {
        emoji: '🤷',
        title: 'TikTok สำหรับ B2B เหรอ',
        body: 'คิดว่า TikTok เด็กๆ ไม่เหมาะ SME B2B — จริงๆ แล้ว SME ไทยเฉพาะกลุ่ม B2B ใช้ TikTok หาคู่ค้าอยู่แล้ว',
      },
    ],
    audience: [
      'เจ้าของ SME B2B ที่อยากสร้างลูกค้าผ่าน content แต่ไม่รู้วิธี',
      'ธุรกิจที่จ้างเอเจนซี่แล้วไม่ได้ผลลัพธ์',
      'คนที่อยากลองทำเอง แต่ต้องมีคนช่วย coach วันแรก',
    ],
    agenda: [
      {
        time: 'ช่วงเช้า (9:00-12:00)',
        title: 'Trust Framework + Script Design',
        body: 'Trust Framework สำหรับ B2B · วาง positioning ของตัวเอง · Script 3 รูปแบบที่ปิดการขาย ไม่ใช่แค่ entertain',
      },
      {
        time: 'ช่วงบ่าย (13:00-16:00)',
        title: 'Shoot 3 Clips in Room',
        body: 'ถ่ายจริง 3 คลิปในห้อง · coach การพูด + เฟรม + แสง · ตัดต่อด้วย CapCut จบในวันนั้น',
      },
      {
        time: 'ช่วงเย็น (16:00-17:00)',
        title: 'Content Calendar + Handover',
        body: 'Content Calendar 30 วัน · Script Template Kit · Trust Framework PDF ไว้ใช้ต่อ',
      },
    ],
    outcomes: [
      '3 คลิปถ่ายเสร็จ โพสต์ได้ตั้งแต่วันรุ่งขึ้น',
      'Content Calendar 30 วัน รู้ว่าเดือนถัดไปจะถ่ายอะไรบ้าง',
      'Trust Framework PDF เจ้าของใช้ซ้ำได้ทุกเดือน',
      'ทักษะถ่ายเองได้ ไม่ต้องจ้างเอเจนซี่',
    ],
    priceHeadline: '฿39,900 (5 ธุรกิจแรก)',
    priceCompare: 'ราคาปกติ ฿50,000 · ลดพิเศษ 5 ธุรกิจแรก',
    priceNote: '1 Day In-House · 100% upfront · ส่วนลด 5 ธุรกิจแรกจะปิดเมื่อครบโควต้า',
    inclusions: [
      'Workshop 1 วัน On-site (6-7 ชม.)',
      '3 คลิปถ่ายเสร็จ + ตัดต่อในวันนั้น',
      'Content Calendar 30 วัน',
      'Trust Framework PDF',
      'Script Template Kit (10+ scripts)',
      'Async LINE support 14 วันหลัง workshop',
    ],
    notIncluded: [
      'Content production ต่อเนื่อง (workshop นี้ teach-to-fish ไม่ใช่ do-for-you)',
      'Ads / paid promotion setup',
      'ค่าเดินทาง on-site ต่างจังหวัด',
    ],
    faqs: [
      {
        q: 'ไม่เคยถ่ายคลิปเลยจะทำได้ไหม',
        a: 'ได้เลย workshop นี้ออกแบบสำหรับคนที่ไม่เคยถ่าย ผม coach ตั้งแต่การจับมือถือ ยังไง เฟรมยังไง พูดแบบไหนไม่เกร็ง',
      },
      {
        q: 'ต้องมีอุปกรณ์อะไรไหม',
        a: 'มือถือเครื่องเดียวพอ ไม่ต้องลงทุนไมโครโฟน หรือกล้อง DSLR workshop นี้ทำเพื่อให้ทำต่อเองไหว ไม่ใช่ทำให้ต้องจ้างคนมาถ่าย',
      },
      {
        q: 'ราคา ฿39,900 ถึงเมื่อไหร่',
        a: 'ถึง 5 ธุรกิจแรกที่จองเข้ามา หลังจากนั้นปรับเป็น ฿50,000 ดู status ได้ที่หน้า services ถ้ายังเห็น "5 ธุรกิจแรก" คือยังเปิดอยู่',
      },
    ],
  },
};
