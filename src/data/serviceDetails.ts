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
  preparation?: {
    requirements: { title: string; detail?: string }[];
    tools: { name: string; tagline: string }[];
  };
  tiktokProof?: {
    stats: {
      totalViews: string;
      totalLikes: string;
      totalShares: string;
      posts: string;
      period: string;
      peakDay: string;
    };
    monthly: { month: string; views: number }[];
    topPosts: { views: string; likes: string; shares: string; date: string; hook: string; url: string }[];
    audience: { th: string; female: string; male: string };
    funnelSteps: { step: string; title: string; body: string }[];
    aiUsed: { name: string; purpose: string }[];
    aiForbidden: { name: string; reason: string }[];
  };
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
    headline: 'ผมไม่ได้แค่มาสอนคุณใช้ AI',
    headlineAccent: 'แต่ผมจะจับมือคุณสร้าง AI Agent ตัวแรก',
    headlineTail: 'ให้ธุรกิจของคุณ',
    subhead:
      '1 วันเต็ม 6-7 ชั่วโมง · ทีมขาย 5-20 คน · ออกจากห้องพร้อม n8n workflow + AI Agent ที่ run ได้จริง + 30 prompts ready-to-use · ทีม build ด้วยมือตัวเอง Pun จับมือทำเคียงข้าง output เห็นหน้างานทุก session',
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
        body: 'ลงทุนกับ AI แล้วต้องวัดผลเป็นตัวเลข: ยอดเพิ่มกี่ %, เวลาคืนกี่ชม., cost ลดกี่บาท · report ได้จริง ไม่ใช่แค่ feel ว่าทีมใช้ AI เก่งขึ้น',
      },
      {
        emoji: '📄',
        title: 'เซลล์หมดเวลากับงานเอกสาร',
        body: 'ทำ report ส่งลูกค้า · copy ข้อมูลจาก LINE ใส่ Sheet · Follow-up ทีละคน · quote template ที่ต้องแก้ครั้งละชั่วโมง · พวกนี้กินเวลาวันละ 2-4 ชม. ของเซลล์ที่ควรเอาไปปิดดีล',
      },
      {
        emoji: '🧠',
        title: 'ส่งทีมเรียน AI แล้วใช้ไม่เป็น',
        body: 'เคยจ่ายเงินส่งทีมไปเรียน AI · ตื่นเต้นแค่ 3 วันแรกแล้วก็ลืม · หรือพนักงานลาออก เอาความรู้ติดตัวไปด้วย · อยากได้ระบบที่ฝังในองค์กร ไม่ใช่ความรู้ที่ติดไปกับตัวคน',
      },
    ],
    audience: [
      'SME B2B ทีมขาย 5-20 คน ที่เจ้าของอยากให้ทีมใช้ AI ลดงานซ้ำ',
      'ทีมที่เคยซื้อ course ออนไลน์แล้วไม่ได้ implement ต่อ',
      'เจ้าของที่อยากเห็น AI รันจริง ก่อนตัดสินใจลงทุนก้อนใหญ่',
    ],
    preparation: {
      requirements: [
        { title: 'Laptop ส่วนตัว + Internet', detail: 'laptop ของทีมแต่ละคน · WiFi ที่เข้า Google + n8n ได้' },
        { title: 'Gmail คนละ 1 account', detail: 'ใช้สมัคร AI tools + access Google Sheets/Drive' },
      ],
      tools: [
        { name: 'n8n', tagline: 'สร้างระบบ Automation แบบไม่ต้องเขียนโค้ด' },
        { name: 'Claude.ai', tagline: 'AI ที่ช่วยคิด วางแผน และลงมือทำ' },
        { name: 'Claude Code', tagline: 'AI ที่ "ทำงาน" ให้ ไม่ใช่แค่ "เขียนโค้ด" · ใช้สร้าง Business OS ขององค์กร' },
        { name: 'Gemini Gems + NotebookLM', tagline: 'ระบบ Onboarding + Product Knowledge Hub · AI ที่รู้ข้อมูลบริษัท' },
        { name: 'Kie.Ai', tagline: 'AI สร้างภาพและวิดีโอ ไม่ติดลายน้ำ · จ่ายเท่าที่ใช้ ไม่ต้องผูก subscription' },
        { name: 'Openrouter', tagline: 'ศูนย์รวม AI หลาย model ในที่เดียว · จ่ายตามใช้จริง · ทดลอง model ใหม่ได้โดยไม่ต้องสมัครแยก' },
      ],
    },
    agenda: [
      {
        time: 'Module 1',
        title: 'Onboarding + Mindset Reset',
        body: 'เปิดใจทีมก่อนเปิด laptop · เข้าใจว่า AI ไม่ได้มาแทนคน แต่มาขยายขีดความสามารถ · setup gear + account พร้อมใช้งาน',
      },
      {
        time: 'Module 2',
        title: 'ประวัติศาสตร์ AI 3 ระลอก',
        body: 'Rule-based (ระลอก 1) · Machine Learning (ระลอก 2) · Generative + Agentic (ระลอก 3) · เข้าใจ context เพื่อเลือกเครื่องมือถูก ไม่หลง trend',
      },
      {
        time: 'Module 3',
        title: 'สั่งงานให้เป๊ะ · Prompt + Advanced Tricks',
        body: 'Framework สั่งงาน AI ให้ output ชัด · 20 prompts tested สำหรับ sales · ทีม copy-paste ใช้วันจันทร์ได้เลย',
      },
      {
        time: 'Module 4',
        title: 'รู้จัก AI แต่ละตัว',
        body: 'ChatGPT vs Claude vs Gemini vs NotebookLM · แต่ละตัวเก่งอะไร ใช้ตอนไหน · ใช้ถูกตัว = ลดเวลา + ประหยัด subscription',
      },
      {
        time: 'Module 5',
        title: 'ทำไมต้อง Claude Code?',
        body: 'Agentic AI ที่ "ทำงานแทน" ไม่ใช่ "ตอบคำถาม" · เปลี่ยนวิธีทำงานองค์กร · ทำไม Pun เลือกใช้ Claude Code เป็น stack หลัก',
      },
      {
        time: 'Module 6',
        title: 'สร้าง Business OS ด้วย Claude Code',
        body: 'Orchestration layer เชื่อม AI + tool + data + team · ระบบกลางที่ทุกคนใช้ร่วมกัน · เลิก chat รายคน',
      },
      {
        time: 'Module 7',
        title: 'สูตรลับสร้างพนักงาน AI',
        body: 'Agent design pattern · role-based agent + guardrail + approval gate · สร้าง AI ทำงานแทนคนได้จริง วัดผลได้ ไม่ใช่แค่ demo',
      },
      {
        time: 'Module 8',
        title: 'สร้าง Web-App ใช้เองในองค์กร · ใครๆ ก็ทำได้',
        body: 'No-code + Claude Code approach · hands-on build ในห้อง · ออกจากห้องพร้อม app จริงที่ทีมใช้ต่อได้',
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
    priceNote: 'จัดแบบ in-house on-demand · ปันเข้าไปจัด workshop ให้ตามตารางที่ทีมคุณสะดวก · ชำระ 100% ก่อนเริ่มงาน · ไม่มีสัญญาผูกมัดยาว',
    inclusions: [
      'Workshop 1 วัน 6-7 ชม. · On-site เท่านั้น (In-house)',
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
        a: 'ทันแน่นอนครับ · ลูกค้าผม 8/10 ทีมไม่มีใครเขียน code · stack ที่ผมใช้ (Sheets + n8n + Claude) ออกแบบให้ non-tech ดูแลต่อเองได้ 100%',
      },
      {
        q: 'หลัง Workshop ถ้าเจอปัญหาถามใครได้',
        a: '30-day async LINE support รวมในราคาแล้ว · ผมตอบทุกข้อความใน 24 ชม. (Mon-Fri) · ถ้าต้องการ scope ต่อยอดระยะยาว คุยเรื่อง Monthly Consulting หลัง workshop ได้',
      },
      {
        q: 'Advance AI & Business Automation ต่างกัน AI & Business Marketing ยังไง',
        a: 'Automation = งาน admin (report, follow-up, data entry) · Marketing = การผลิต content + funnel · ถ้าไม่แน่ใจ ทักผมช่วย diagnose ก่อนเลือก',
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
      {
        emoji: '🔍',
        title: 'อยากได้เซลล์เก่ง · ไม่รู้จะหาจากไหน',
        body: 'อยากเติบโตต้องเพิ่มทีม แต่ดึงเซลล์จากแบรนด์ใหญ่มาค่าตัวแพง · เอา junior มาปั้นใช้เวลา 6-12 เดือนกว่าจะ productive · ระหว่างนั้นเจ้าของต้องวิ่งเองทุกดีลสำคัญ',
      },
      {
        emoji: '📣',
        title: 'ยิง ads หลักแสน · เซลล์ปิดลูกค้าไม่ได้',
        body: 'lead เข้ามาเดือนละร้อยกว่าราย แต่ close rate ต่ำกว่า 10% · เงินค่า ads หายไปฟรี · เพราะทีมไม่มี sales process ชัด lead hot กลายเป็น cold ภายในไม่กี่ชั่วโมง เพราะ follow-up ไม่ทัน',
      },
      {
        emoji: '🏗',
        title: 'อยากวางระบบ · ไม่รู้จะเริ่มตรงไหน',
        body: 'เคยอ่าน playbook ต่างประเทศ เคยดู YouTube ฟังแล้วเข้าใจ · แต่พอจะ implement กับธุรกิจตัวเองไปไม่เป็น · ไม่มีใครบอกว่า SME ไทย 5-20 คน ควรเริ่มตรงไหน · ใช้ tool อะไร เชื่อมกันยังไง',
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
      'Advance AI Workshop แยก (฿24,900 — ส่วนใหญ่รวมมาด้วยแล้วผ่าน AI workflow ใน sprint)',
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
      {
        emoji: '🏃',
        title: 'ขยันวิ่งหาลูกค้าทุกวัน แต่ยอดไม่ถึงเป้า',
        body: 'น้องเซลล์ออกตลาดจริง คุยลูกค้าเยอะ แต่ปิดดีลน้อย · ไม่รู้ติดตรงไหน: discovery, value prop หรือ handle objection · การบังคับเพิ่ม call ต่อวันไม่ช่วย เพราะปัญหาอยู่ที่คุณภาพ ไม่ใช่ปริมาณ',
      },
      {
        emoji: '💔',
        title: 'ขายดีลจบแล้วจบเลย · ไม่ขายซ้ำ',
        body: 'ปิดได้ครั้งเดียว ลูกค้าเก่าหายหมด 70%+ · ไม่มี follow-up ไม่ขายซ้ำ ไม่รู้จะ upsell ยังไง · ทีมวิ่งหาลูกค้าใหม่ทุกเดือน ยอดโตแบบ rat race ไม่ทบต้น',
      },
      {
        emoji: '🚪',
        title: 'โดนปฏิเสธครั้งเดียวก็ถอย · ไม่กล้าตาม',
        body: 'ลูกค้าตอบ "ขอคิดดูก่อน" หรือ "ยังไม่พร้อม" = ทีม drop ทันที · 80% ของดีลปิดจาก follow-up ครั้งที่ 3-8 · ทีมเสียดีลเพราะไม่กล้าตาม ไม่ใช่เพราะสินค้าไม่ดี',
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
    priceHeadline: '฿50,000 / 2 วัน',
    priceCompare: '🔥 Early Bird ฿44,900 · รับเพียง 3 ทีมต่อเดือน · หลังเต็มกลับไปราคา ฿50,000',
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
    priceHeadline: '฿44,900 · Early Bird 5 ธุรกิจแรก',
    priceCompare: 'ราคาปกติ ฿52,800 · Early Bird ลดให้ 5 ธุรกิจแรก → ฿44,900',
    priceNote: '1 Day In-House On-site · 100% upfront · Early Bird ปิดเมื่อครบ 5 ธุรกิจ',
    tiktokProof: {
      stats: {
        totalViews: '2.29M',
        totalLikes: '140K',
        totalShares: '35K',
        posts: '15',
        period: '4 เดือน · ธ.ค. 2568 → เม.ย. 2569',
        peakDay: '161,711 วิว / วัน (28 ธ.ค. 68)',
      },
      monthly: [
        { month: 'ธ.ค.', views: 277585 },
        { month: 'ม.ค.', views: 878905 },
        { month: 'ก.พ.', views: 629451 },
        { month: 'มี.ค.', views: 334199 },
        { month: 'เม.ย.', views: 167504 },
      ],
      topPosts: [
        {
          views: '548K',
          likes: '32K',
          shares: '10.5K',
          date: '19 ม.ค. 69',
          hook: 'คุณกำลังไล่ "คนเก่ง" ไปให้ "คู่แข่ง" โดยไม่รู้ตัวหรือเปล่า?',
          url: 'https://www.tiktok.com/@pun_nattapatch/video/7596760385848347911',
        },
        {
          views: '528K',
          likes: '46K',
          shares: '13K',
          date: '27 ธ.ค. 68',
          hook: 'ความลับ 4 ข้อ ที่เศรษฐีพันล้านมีเหมือนกันหมด',
          url: 'https://www.tiktok.com/@pun_nattapatch/video/7588505644131470612',
        },
        {
          views: '126K',
          likes: '4.7K',
          shares: '1.6K',
          date: '22 ธ.ค. 68',
          hook: 'อย่ารับเซลล์เข้าทีม ถ้ายังไม่ได้ถาม 4 ข้อนี้',
          url: 'https://www.tiktok.com/@pun_nattapatch/video/7586570034437377301',
        },
      ],
      audience: { th: '87.1%', female: '63%', male: '37%' },
      funnelSteps: [
        {
          step: '1',
          title: 'Hook 3 วินาทีแรก หยุด scroll',
          body: 'Pain point ที่เจาะจงจนคนคิดว่า "เรื่องของกู" · ใช้คำพูดของเจ้าของธุรกิจจริง ไม่ใช่ agency tone',
        },
        {
          step: '2',
          title: 'Body สอน insight ที่ specific ไปเลย',
          body: 'ไม่ใช่ motivation ไม่ใช่ clickbait · ให้ framework ที่ copy ไปใช้ได้ทันที เพื่อสร้าง authority',
        },
        {
          step: '3',
          title: 'CTA ปิดด้วย "ถ้าอยากคุย นัดได้เลย"',
          body: 'ไม่บังคับซื้อ ไม่ขายหน้ากล้อง · ส่ง traffic ไป bio → landing page → intake form',
        },
        {
          step: '4',
          title: 'Intake form คัดคนที่ fit',
          body: 'Qualify ด้วย teamSize / pain / budget · ตอบกลับเฉพาะเคสที่ตรง · ปิดดีล B2B ที่ relationship-based',
        },
      ],
      aiUsed: [
        { name: 'Claude / ChatGPT', purpose: 'Hook ideation · script draft · ย่อ insight ซับซ้อนให้ 60 วินาที' },
        { name: 'Notion AI', purpose: 'Content calendar · ตาราง 30 วัน · tag pillar/cluster' },
        { name: 'CapCut Auto-Caption', purpose: 'ใส่ caption ไทยอัตโนมัติ · trim silence · add beat sync' },
        { name: 'Gemini Deep Research', purpose: 'วิเคราะห์ trend + competitor hook · หา angle ใหม่ทุกสัปดาห์' },
      ],
      aiForbidden: [
        { name: 'AI Avatar / Face Swap', reason: 'B2B ขายด้วย trust · หน้าปลอม = ลูกค้าเลิก engage' },
        { name: 'AI Voice Cloning', reason: 'เสียงสังเคราะห์ติดหู uncanny · authenticity = conversion' },
        { name: 'AI-Generated Video (Sora / Runway)', reason: 'เจ้าของต้องอยู่หน้ากล้องเอง · ตัวตนจริง = relationship' },
        { name: 'AI Thumbnail Generation', reason: 'ภาพจริงจาก workshop/มีตติ้ง = proof ที่ AI ปลอมไม่ได้' },
      ],
    },
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
        q: 'ราคา Early Bird ฿44,900 ถึงเมื่อไหร่',
        a: 'ถึง 5 ธุรกิจแรกที่จองเข้ามา หลังจากนั้นกลับเป็นราคาปกติ ฿52,800 ดู status ได้ที่หน้า services ถ้ายังเห็น "5 ธุรกิจแรก" คือยังเปิดอยู่',
      },
    ],
  },
};
