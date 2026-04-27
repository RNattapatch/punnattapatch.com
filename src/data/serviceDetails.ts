export type AccentToken = 'cyan' | 'coral' | 'violet';

/**
 * WhyMeBlock — optional section that explains why choose Pun for THIS service.
 * Pattern: Hybrid (reused PUN_CORE_BIO from site.ts + per-service custom content).
 * Voice: B+C (positive self-framing + market-gap landscape with POP/POD positioning).
 * Render: between Outcomes and Pricing sections via <WhyMeSection> component.
 */
export type WhyMeBlock = {
  eyebrow: string;
  headline: string;
  marketGap: {
    intro: string;
    segments: { name: string; desc: string }[];
    position: string;
  };
  pointOfParity: string[];
  pointOfDifferentiation: { title: string; body: string }[];
};

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
  whyMe?: WhyMeBlock;
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
    whyMe: {
      eyebrow: 'Why Me · AI Workshop',
      headline: 'ทำไมต้องเรียน AI Workshop กับผม',
      marketGap: {
        intro: 'ตลาด AI course ในไทยตอนนี้มีผู้เล่นหลากหลาย แต่ส่วนใหญ่จะแบ่งได้เป็น 3 กลุ่มหลัก ซึ่งยังไม่มีใครที่เจาะตลาดทีมขาย B2B ของธุรกิจ SME โดยเฉพาะ',
        segments: [
          {
            name: 'คอร์ส AI ทั่วไป',
            desc: 'เน้นสอนใช้เครื่องมือพื้นฐานอย่าง ChatGPT หรือ Claude สำหรับงานทั่วไป ไม่ได้ออกแบบมาเพื่อแก้ปัญหาหรือสร้าง workflow สำหรับทีมขายโดยตรง',
          },
          {
            name: 'อบรมสำหรับฝ่าย IT องค์กร',
            desc: 'เนื้อหาลงลึกด้านเทคนิค เหมาะสำหรับนักพัฒนาหรือฝ่าย IT แต่ซับซ้อนเกินไปสำหรับเจ้าของธุรกิจ SME และทีมขายที่ต้องการนำไปใช้ทันที',
          },
          {
            name: 'คอร์สสำหรับบุคคล / ฟรีแลนซ์',
            desc: 'โฟกัสที่การเพิ่มประสิทธิภาพส่วนบุคคล ไม่ได้สอนการสร้างระบบ AI ที่ทำงานร่วมกันเป็นทีม ซึ่งเป็นหัวใจสำคัญของฝ่ายขาย',
          },
        ],
        position: 'ช่องว่างสำหรับ AI เพื่อทีมขาย B2B ของ SME ไทยยังคงมีอยู่ · workshop นี้คือคำตอบที่ผมสร้างขึ้นมาเพื่อเติมเต็มช่องว่างนี้โดยเฉพาะ',
      },
      pointOfParity: [
        'Workshop เน้นลงมือทำจริง ไม่ใช่นั่งฟังบรรยายอย่างเดียว',
        'ใช้เครื่องมือล่าสุดเสมอ เช่น Claude Code · n8n · Gemini · Kie.Ai',
        'กลุ่มซัพพอร์ตสำหรับถามตอบและให้คำปรึกษาต่อเนื่อง 30 วันหลังจบ workshop',
        'เอกสารสรุป + วิดีโอบันทึกหน้าจอทุก session · ทีมกลับไปทบทวนได้',
      ],
      pointOfDifferentiation: [
        {
          title: 'ครูสอนคือคนขายตัวจริง',
          body: 'ผมเป็นเซลส์ B2B ในฟิลด์มา 5 ปี ปิดดีลด้วยตัวเอง · ผมจึงเข้าใจปัญหาและ workflow ของทีมขายจริงๆ ไม่ใช่คนที่ศึกษาเรื่องการขายจากทฤษฎี',
        },
        {
          title: 'สอนสดที่บริษัทคุณโดยเฉพาะ',
          body: 'Workshop นี้เป็น private on-site ไม่ใช่ public cohort · เรานำปัญหาและ use case จริงของบริษัทคุณมาสร้างเป็น workflow ได้ทันทีในห้อง',
        },
        {
          title: 'สร้างระบบ AI ที่ทำงานแทน ไม่ใช่แค่ถาม-ตอบ',
          body: 'เน้นสร้าง Agentic AI (AI ที่ทำงานแทน) ด้วย Claude Code + n8n เพื่อสร้างระบบอัตโนมัติที่ช่วยทีมขายจริงๆ ไม่ใช่แค่สอนเขียน prompt พื้นฐาน',
        },
        {
          title: 'วัดผล ROI ได้ตั้งแต่วันแรก',
          body: 'ผมคำนวณเวลาและต้นทุนที่ประหยัดได้จาก workflow ที่สร้างขึ้นภายในวันนั้นเลย · คุณเห็นตัวเลข ROI ที่จับต้องได้ทันที ไม่ต้องรอให้ทีมกลับไปลองใช้แล้วค่อยวัดผล',
        },
        {
          title: 'ส่งมอบให้หัวหน้าทีมดูแลต่อได้',
          body: 'ผมสอนหัวหน้าทีมขายให้ดูแลและปรับปรุงระบบ AI ที่สร้างขึ้นเองได้ · ทีมใช้งานต่อได้ระยะยาว โดยไม่ต้องจ้างผมเป็น retainer รายเดือน',
        },
      ],
    },
    priceHeadline: '฿24,900 / 1 วัน (Early Bird)',
    priceCompare: '⏰ Early Bird ฿24,900 ถึง 30 เมษายน 2026 เท่านั้น · 1 พฤษภาคม course แยกเป็น Basic ฿29,900 + Advance ฿29,900 ต่อวัน · หรือ Bundle Day 1+2 ฿50,000',
    priceNote: 'จองก่อน 30 เม.ย. = ประหยัด ฿5,000 และ lock สิทธิ์ Advance course ราคาเดิม · จัดแบบ in-house on-demand · ปันเข้าไปจัด workshop ตามตารางทีม · ชำระ 100% ก่อนเริ่มงาน',
    inclusions: [
      'Workshop 1 วัน 6-7 ชม. · On-site เท่านั้น (In-house)',
      'n8n workflow + AI Agent 1 ตัวที่ build ในห้อง (production-ready)',
      'Prompt library 30 prompts tested สำหรับงาน admin + sales',
      '30-day async LINE support หลัง workshop (Mon-Fri)',
      'Handover document + screen recording ทุก session',
      'Team lead training session — ทีมดูแลต่อเองได้',
    ],
    notIncluded: [
      'Advance Workshop Day 2 — สร้าง Multi-agent system ทั้งองค์กร (ดูรายละเอียด /ai-workshop-advance)',
      'Monthly Retainer · Advisory Day หรือ Skill Injection Day (คุยได้หลัง workshop)',
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
    eyebrow: 'วางระบบขาย · 1 เดือนจบ',
    headline: 'ทีมขายมี 5-20 คน แต่ยอด',
    headlineAccent: '80% มาจากคุณคนเดียว',
    headlineTail: 'วางระบบให้ทีมวิ่งเอง ใน 1 เดือน',
    subhead:
      '1 เดือนจบครบ: คุยเก็บข้อมูล → ออกแบบระบบ → ติดตั้ง → อบรมทีม · พร้อม KPI dashboard (หน้าจอดูยอดเรียลไทม์) + ตัวคำนวณค่าคอมมิชชั่น + n8n workflow (ระบบทำงานซ้ำอัตโนมัติ) — ทีมใช้ต่อเองได้หลังส่งมอบ',
    pains: [
      {
        emoji: '⚖️',
        title: 'ค่าคอมมิชชั่นไม่แฟร์ ทีมลาออกบ่อย',
        body: 'จ่ายตาม "ความรู้สึก" หรือสูตรเก่าที่ล้าสมัย — คนเก่งเซ็ง เพราะปิดดีลใหญ่ได้ค่าคอมเท่ากับคนที่ปิดดีลเล็ก',
      },
      {
        emoji: '📉',
        title: 'ไม่รู้ KPI ทีมกำลังแพ้หรือชนะ',
        body: 'เห็นยอดตอนสิ้นเดือนเท่านั้น ระหว่างเดือนไม่รู้ว่าใครแผ่ว ใครวิ่งดี แก้ไม่ทัน',
      },
      {
        emoji: '🚪',
        title: 'เจ้าของต้องเข้าไปปิดดีลใหญ่เอง',
        body: 'ทีมปิดดีลเล็กได้ แต่ดีลใหญ่ต้องเรียกเจ้าของ ถ้าเจ้าของไม่ว่าง เสียดีลหรือลูกค้ารอ',
      },
      {
        emoji: '🔍',
        title: 'อยากได้เซลล์เก่ง · ไม่รู้จะหาจากไหน',
        body: 'อยากโตต้องเพิ่มทีม · ดึงเซลล์จากแบรนด์ใหญ่ ค่าตัวแพง · เอาน้องใหม่มาปั้น ใช้เวลา 6-12 เดือนกว่าจะทำงานได้เต็มที่ · ระหว่างนั้นเจ้าของต้องวิ่งเองทุกดีลสำคัญ',
      },
      {
        emoji: '📣',
        title: 'ยิงแอดหลักแสน · เซลล์ปิดลูกค้าไม่ได้',
        body: 'ลูกค้าสนใจเข้ามาเดือนละร้อยกว่าราย แต่ปิดได้ไม่ถึง 10% · เงินค่าแอดหายฟรี · เพราะทีมไม่มีขั้นตอนการขายที่ชัดเจน ลูกค้ากำลังร้อนกลายเป็นเย็นภายในไม่กี่ชั่วโมง เพราะติดตามไม่ทัน',
      },
      {
        emoji: '🏗',
        title: 'อยากวางระบบ · ไม่รู้จะเริ่มตรงไหน',
        body: 'เคยอ่านหนังสือการขายต่างประเทศ เคยดู YouTube ฟังแล้วเข้าใจ · แต่พอจะเอามาใช้จริงกับธุรกิจตัวเองไปไม่เป็น · ไม่มีใครบอกว่า SME ไทย 5-20 คน ควรเริ่มตรงไหน · ใช้เครื่องมืออะไร เชื่อมกันยังไง',
      },
    ],
    audience: [
      'SME ทีมขาย 5-20 คน รายได้ 30-200 ล้าน/ปี กำลังขยายธุรกิจ',
      'เจ้าของที่อยากปล่อยมือ ไม่ต้องลงไปปิดดีลเองแทนทีม',
      'ทีมที่ยังไม่มี KPI หรือโครงสร้างค่าคอมมิชชั่นชัดเจน หรือมีแต่ไม่เวิร์ก',
    ],
    agenda: [
      {
        time: 'สัปดาห์ที่ 1 — เก็บข้อมูล',
        title: 'เข้าใจสถานการณ์จริง',
        body: 'สัมภาษณ์เจ้าของ + ทีมขาย · ดูข้อมูลย้อนหลัง 3 เดือน · หาจุดที่ทำให้โตไม่ได้และคอขวดที่แท้จริง',
      },
      {
        time: 'สัปดาห์ที่ 2 — ออกแบบ',
        title: 'วาง KPI + โครงสร้างค่าคอมมิชชั่น',
        body: 'ออกแบบ KPI ที่ทีมวิ่งได้จริง · โครงสร้างค่าคอมที่แฟร์ + วัดผลได้ · ขั้นตอนการขายที่ทำซ้ำได้ทุกคน',
      },
      {
        time: 'สัปดาห์ที่ 3 — ติดตั้งระบบ',
        title: 'ลงมือสร้างระบบจริง',
        body: 'ตัวคำนวณค่าคอมที่ทีมคำนวณเองได้ · KPI dashboard ดูยอดแบบเรียลไทม์ · n8n workflow + AI ช่วยทำงานซ้ำๆ อัตโนมัติ',
      },
      {
        time: 'สัปดาห์ที่ 4 — อบรม + ส่งมอบ',
        title: 'ฝึกทีม + ส่งมอบระบบ',
        body: 'อบรม 2 วันเต็ม ทีมลองใช้จริง · เอกสารคู่มือ + วิดีโออัดหน้าจอ · ตอบคำถามผ่าน LINE ต่ออีก 30 วัน',
      },
    ],
    outcomes: [
      'ทีมเห็น KPI ของตัวเองแบบเรียลไทม์ ไม่ต้องรอสิ้นเดือน',
      'โครงสร้างค่าคอมมิชชั่นที่ทีมเข้าใจทุกคน คำนวณเองได้',
      'n8n workflow ช่วยคัดกรองลูกค้า + แจ้งเตือนติดตาม + สรุปรายงาน ให้อัตโนมัติ',
      'เจ้าของลดเวลาจุกจิกกับทีมลง 50%+ ปล่อยให้ทีมวิ่งเอง',
    ],
    whyMe: {
      eyebrow: 'Why Me · Sales System Sprint',
      headline: 'ที่ปรึกษาที่ build ของจริง · ไม่ใช่แค่ส่ง slide',
      marketGap: {
        intro: 'ผมเห็น SME เสียเวลากับที่ปรึกษา 3-6 เดือน ได้ slide แนะนำกลับมาแต่ไม่มีระบบที่ใช้งานได้จริง · ตลาดการวางระบบขายแบ่งได้ 3 กลุ่ม และยังไม่มีใครเจาะ hands-on end-to-end สำหรับ SME ใน 1 เดือน',
        segments: [
          {
            name: 'ที่ปรึกษาสาย Strategy ทั่วไป',
            desc: 'ส่งมอบ Presentation Deck คำแนะนำสวยๆ · ไม่ลงมือ implement ระบบจริง · กลยุทธ์บน slide ไม่เคยเกิดขึ้นในทางปฏิบัติ',
          },
          {
            name: 'ผู้ขาย Template สำเร็จรูป',
            desc: 'ขายไฟล์ Excel / Sheets แบบ one-size-fits-all · ไม่พอดีกับ revenue model / margin / วิธีทำงานของทีมขายคุณ',
          },
          {
            name: 'ที่ปรึกษาด้าน CRM',
            desc: 'เน้น setup software · ไม่ลงไปช่วยออกแบบ process หรือปรับ mindset ทีม · ทีมกลับไปทำงานแบบเดิม',
          },
        ],
        position: 'ยังไม่มีใครเจาะการวาง sales system แบบ hands-on end-to-end ใน 1 เดือนให้ SME · ผมเป็นทั้งคนคิด · คน build · คนสอน ในคนเดียว',
      },
      pointOfParity: [
        'Discovery session วิเคราะห์ทีมและ process ปัจจุบัน (ไม่เริ่มจาก template)',
        'KPI + Commission structure ออกแบบให้ธุรกิจคุณโดยเฉพาะ',
        'Training ทีมขายทุกคน · ใช้ระบบใหม่ได้ครบถ้วน',
        'Documentation + คู่มือ · ทีมกลับไป review หรือสอนสมาชิกใหม่ได้',
      ],
      pointOfDifferentiation: [
        {
          title: 'ที่ปรึกษาที่ build ของจริง',
          body: 'ผมไม่ใช่ที่ปรึกษาที่ส่งมอบแค่ strategy slide · ผมเป็นคนลงมือสร้างระบบที่ run ได้จริงตั้งแต่วันส่งมอบ · วันสุดท้ายของ sprint ทีมมีระบบใช้งานเลย ไม่ต้องไปหา vendor มาทำต่อ',
        },
        {
          title: 'KPI จาก revenue model จริงของบริษัทคุณ',
          body: 'ผมออกแบบ KPI และ Commission จาก revenue model + cost structure + margin ของธุรกิจคุณจริงๆ · ไม่ copy template จากบริษัทอื่น · ทีมใหญ่ที่ตอบได้ว่า "ปิดดีลขนาดนี้ได้คอมเท่าไหร่" ทันที',
        },
        {
          title: 'n8n automation integrated ไม่ใช่แค่ dashboard',
          body: 'ระบบที่ผมสร้างมี workflow automation ด้วย n8n สำหรับแจ้งเตือน follow-up / สร้าง report อัตโนมัติ / sync ข้อมูล · ไม่ใช่แค่ CRM ที่ต้องคีย์ข้อมูลเอง',
        },
        {
          title: '1 เดือนจบ ไม่ลากยาว 3-6 เดือน',
          body: 'ที่ปรึกษาทั่วไปใช้ 3-6 เดือนสำหรับโครงการลักษณะนี้ · ผมทำจบใน 1 เดือน · 4 hands-on sessions (Discovery → Design → Build → Training) · ส่งมอบเต็มที่ไม่ drag timeline',
        },
        {
          title: 'Handover ให้ทีมเจ้าของ maintain เอง',
          body: 'ผมสร้างระบบบน Google Sheets + n8n ที่เข้าถึงง่าย · ทีมเจ้าของปรับปรุงแก้ไขได้เอง · ไม่ต้องจ้าง retainer รายเดือน · ระบบที่เจ้าของเป็นเจ้าของจริงๆ',
        },
      ],
    },
    priceHeadline: '฿65,000 / โครงการ',
    priceNote: '1 เดือนจบ · ชำระเต็มจำนวนก่อนเริ่ม · ไม่มีสัญญารายเดือนผูกมัดหลังจบ',
    inclusions: [
      'คุยสัมภาษณ์ + ตรวจข้อมูลย้อนหลัง',
      'KPI + โครงสร้างค่าคอมมิชชั่น (เอกสาร + ตัวคำนวณ)',
      'KPI dashboard ดูยอดเรียลไทม์ (Google Sheets + Apps Script)',
      'n8n workflow 2-3 ชุด สำหรับงานซ้ำที่ทำอัตโนมัติได้',
      'อบรม 2 วัน + เอกสารส่งมอบ + วิดีโออัดหน้าจอ',
      'ตอบคำถามผ่าน LINE ต่ออีก 30 วันหลังส่งมอบ',
    ],
    notIncluded: [
      'Advance AI Workshop แยก (฿24,900 — ส่วนใหญ่รวมมาในแพ็กเกจนี้แล้วผ่าน AI workflow)',
      'ค่าเดินทางเมื่อต้อง on-site ต่างจังหวัด',
      'สัญญารายเดือนหลังส่งมอบ (แล้วแต่ลูกค้าจะต่อเอง ไม่บังคับ)',
    ],
    faqs: [
      {
        q: '1 เดือนพอไหม ทำจริงหรือแค่ทฤษฎี',
        a: '1 เดือนพอสำหรับ SME 5-20 คน เพราะผมโฟกัส 3 ส่วนหลัก (KPI + ค่าคอม + workflow 2-3 ชุด) ไม่ทำทุกอย่าง — ถ้าทีมใหญ่กว่า 20 คน หรือหลายสาขา อาจต้องยืดเป็น 2 เดือน (คิดราคาแยก)',
      },
      {
        q: 'ถ้าทีมไม่ให้ความร่วมมือระหว่างทำ',
        a: 'ผมขอคำยืนยันจากเจ้าของก่อนเริ่ม ว่าทีมจะให้เวลา 4-6 ชม./สัปดาห์ ถ้าเจ้าของคุมทีมให้ไม่ได้ ผมจะบอกก่อนรับงาน ไม่ใช่รับเงินแล้วมาทะเลาะกัน',
      },
      {
        q: 'ต่อสัญญารายเดือนหลังจบได้ไหม',
        a: 'ได้ คิดราคาตามขอบเขตงานจริง ไม่มีสัญญาผูกมัด ลูกค้าส่วนใหญ่ดูแลระบบเองได้หลัง 30 วัน เพราะออกแบบให้คนไม่สายเทคฯ ใช้งานได้',
      },
    ],
  },
  'sale-training-bundle': {
    slug: 'sale-training-bundle',
    accent: 'coral',
    eyebrow: 'อบรมการขาย · 2 วันเต็ม',
    headline: 'ทีมยังปิดการขายด้วย',
    headlineAccent: 'การลดราคา',
    headlineTail: 'เปลี่ยนเป็นปิดด้วยคุณค่า ใน 2 วัน',
    subhead: 'Workshop นี้รวม 2 หลักสูตร Value Selling และ Sales Psychology เข้าด้วยกัน สำหรับทีมขายไม่เกิน 20 คน เพื่อเปลี่ยนวิธีคิดและให้เครื่องมือที่ใช้ได้จริง ให้ลูกค้าซื้อเพราะเชื่อ ไม่ใช่เพราะถูก',
    pains: [
      {
        emoji: '📉',
        title: 'ติดกับดักลดราคา',
        body: 'ทีมขายปิดดีลได้เมื่อมีส่วนลดเท่านั้น ทำให้กำไรของบริษัทหดหายไปทุกเดือน การแข่งขันด้านราคาทำให้ทุกคนเหนื่อย แต่ไม่ได้ทำให้ธุรกิจเติบโตอย่างยั่งยืน',
      },
      {
        emoji: '👻',
        title: 'ลูกค้าเทียบราคาแล้วหาย',
        body: 'ส่งใบเสนอราคาไปแล้วลูกค้าเงียบหายไปเลย พอไปสืบดูก็พบว่าเขาเลือกเจ้าที่ถูกกว่า ทีมเราไม่สามารถสร้างความแตกต่างในบทสนทนาได้มากพอ',
      },
      {
        emoji: '🤖',
        title: 'ใช้สคริปต์เหมือนหุ่นยนต์',
        body: 'ทีมขายใช้บทสนทนาที่ท่องจำมาแบบเดิมๆ ลูกค้ารู้สึกได้ว่ากำลังคุยกับคนขายที่ไม่ได้สนใจปัญหาของเขาจริงๆ ทำให้การสร้างความสัมพันธ์ล้มเหลวตั้งแต่ต้น',
      },
      {
        emoji: '🏃',
        title: 'ขยันแต่ยอดไม่ถึงเป้า',
        body: 'ทีมงานดูเหมือนจะทำงานหนัก โทรหาลูกค้าเยอะ ส่งข้อความทั้งวัน แต่ Conversion Rate ต่ำ ปัญหาอยู่ที่คุณภาพของการสนทนา ไม่ใช่ปริมาณ',
      },
      {
        emoji: '👋',
        title: 'ไม่มีลูกค้าซื้อซ้ำ',
        body: 'เราขายของได้ครั้งเดียวแล้วจบ ลูกค้าเก่ากว่า 70% ไม่กลับมาซื้อซ้ำ เพราะไม่มีระบบการดูแลหรือการสร้างความสัมพันธ์ระยะยาว ทำให้ต้องหาลูกค้าใหม่อยู่ตลอดเวลา',
      },
      {
        emoji: '😥',
        title: 'ไม่กล้าติดตามลูกค้า',
        body: 'เมื่อโดนลูกค้าปฏิเสธหรือขอคิดดูก่อน ทีมขายส่วนใหญ่จะถอดใจและไม่กล้าติดตามผล ทั้งที่ข้อมูลบอกว่า 80% ของดีล B2B ปิดได้หลังการติดตามครั้งที่ 3-8',
      },
    ],
    audience: [
      'ทีมขายทุกรูปแบบ ทั้ง Telesales, Field Sales และทีมที่ดูแลลูกค้าผ่าน Chat Commerce บน LINE OA หรือ Facebook Messenger',
      'เจ้าของธุรกิจ SME ที่เห็นกำไรขั้นต้น (Gross Margin) ของบริษัทลดลงทุกไตรมาส เพราะต้องพึ่งพากลยุทธ์ด้านราคาเพื่อปิดดีล',
      'ทีมที่กำลังต้องเปลี่ยนบทบาทจากคนขายสินค้า (Product Seller) ไปเป็นที่ปรึกษา (Consultant) เพื่อเพิ่มมูลค่าให้กับการขาย',
      'ทีมขายที่ทำงานผ่านช่องทาง Text-based หรือ Voice-only เป็นหลัก เช่น การโทรศัพท์, LINE OA ซึ่งต้องการเทคนิคการสื่อสารที่เฉียบคม',
    ],
    preparation: {
      requirements: [
        {
          title: 'ข้อมูลดีลที่ปิดไม่ลง 5-10 เคส',
          detail: 'เตรียมข้อมูลเคสที่ทีมเคยพยายามขายแต่ไม่สำเร็จ เพื่อนำมาวิเคราะห์และใช้เป็นกรณีศึกษาใน Workshop',
        },
        {
          title: 'แบบฟอร์มข้อมูลทีม (Team Profile)',
          detail: 'ผมจะส่งแบบสอบถาม 10 ข้อให้ทีมกรอกและส่งกลับมาก่อนวันอบรมอย่างน้อย 3 วัน เพื่อให้ผมเข้าใจบริบทของทีมและธุรกิจ',
        },
        {
          title: 'สมุดและปากกา',
          detail: 'นี่คือ Workshop ที่เน้นการลงมือทำและฝึกฝน ไม่ใช่การนั่งฟังบรรยาย การจดและทำแบบฝึกหัดด้วยตัวเองสำคัญมาก',
        },
      ],
      tools: [
        {
          name: 'Jobs to be Done Framework',
          tagline: 'เครื่องมือสำหรับหาคำตอบว่าจริงๆ แล้วลูกค้า \'จ้าง\' สินค้าหรือบริการของเราไปทำอะไรในชีวิตของเขา',
        },
        {
          name: 'Why We Buy · 3-Axis Model',
          tagline: 'โมเดลแกะรอยการตัดสินใจซื้อของลูกค้าผ่าน 3 แกนหลัก: เหตุผล (Rational), อารมณ์ (Emotional), และสังคม (Social)',
        },
        {
          name: 'Opening Script Kit',
          tagline: 'ชุดเครื่องมือสร้างบทสนทนาเริ่มต้นที่ทรงพลัง แยกตาม 3 รูปแบบการใช้งาน: Chat, Call, และ Field Sales',
        },
        {
          name: 'Trust & Social Proof Playbook',
          tagline: 'คู่มือการใช้ Case Study และ Social Proof เพื่อสร้างความน่าเชื่อถืออย่างถูกจังหวะและถูกวิธี',
        },
        {
          name: 'Paradox of Choice Technique',
          tagline: 'เทคนิคทางจิตวิทยาการขายว่าด้วยการเสนอทางเลือกให้ลูกค้า เพื่อช่วยให้เขาตัดสินใจซื้อง่ายขึ้นและเร็วขึ้น',
        },
      ],
    },
    agenda: [
      {
        time: 'Day 1 · 9:00-10:30',
        title: 'Module 1: Reframe from Price War to Value Selling',
        body: 'เริ่มต้นด้วยการปรับ Mindset ทำความเข้าใจว่าทำไมลูกค้าถึงถามราคาก่อนเสมอ และผลกระทบระยะยาวของการแข่งขันด้านราคาคืออะไร',
      },
      {
        time: 'Day 1 · 10:30-12:00',
        title: 'Module 2: Jobs to be Done Framework',
        body: 'ลงมือทำ Workshop จริง นำเคสของทีมที่เคยเจอมาวิเคราะห์ด้วยเฟรมเวิร์ค Jobs to be Done (ลูกค้าจ้างเราไปทำอะไร) เพื่อหา Value ที่แท้จริง',
      },
      {
        time: 'Day 1 · 13:00-14:30',
        title: 'Module 3: Lead Prioritization',
        body: 'เรียนรู้วิธีคัดกรองและจัดลำดับความสำคัญของ Lead ที่เข้ามา เพื่อให้ทีมใช้เวลากับ Lead ที่มีแนวโน้มจะปิดการขายได้จริง และหยุดเสียเวลากับคนที่ไม่ใช่',
      },
      {
        time: 'Day 1 · 14:30-17:00',
        title: 'Module 4: Give & Take + Value Negotiation',
        body: 'เจาะลึกจิตวิทยาการให้ (Reciprocity) เพื่อสร้างความสัมพันธ์ และฝึกฝนเทคนิคการเจรจาต่อรองโดยใช้คุณค่าเป็นตัวตั้ง—ไม่ใช่ราคา พร้อม Role-play รอบที่ 1',
      },
      {
        time: 'Day 2 · 9:00-10:30',
        title: 'Module 5: Why We Buy — 3-Axis Decoding',
        body: 'ถอดรหัสการตัดสินใจของลูกค้าด้วยโมเดล 3 แกน (Rational, Emotional, Social) และนำดีลจริงของทีมมาวิเคราะห์เพื่อหาจุดที่จะเข้าไปมีอิทธิพลต่อการตัดสินใจ',
      },
      {
        time: 'Day 2 · 10:30-12:00',
        title: 'Module 6: First Impression Code',
        body: 'กฎ 10 วินาทีแรกสำคัญที่สุด ทีมจะได้ลงมือสร้าง Opening Script และ Opening Message ของตัวเองสำหรับ 3 ช่องทางหลัก (Chat/Call/Field)',
      },
      {
        time: 'Day 2 · 13:00-14:30',
        title: 'Module 7: Trust & Social Proof Playbook',
        body: 'เรียนรู้ว่าจังหวะไหนควรส่ง Case Study จังหวะไหนควรเงียบ และวิธีใช้ Social Proof เพื่อสร้างความน่าเชื่อถือโดยไม่ดูเหมือนการขายของหนักเกินไป',
      },
      {
        time: 'Day 2 · 14:30-17:00',
        title: 'Module 8: Psychological Closing + 3 Role-plays',
        body: 'รวมเทคนิคปิดการขายเชิงจิตวิทยา เช่น Discovery Questions และ Paradox of Choice พร้อมฝึก Role-play สถานการณ์จริง 3 รอบ และรับ Feedback ทันที',
      },
    ],
    outcomes: [
      'เพิ่ม Close Rate ของทีมได้ 20-40% ภายใน 2 เดือนหลังอบรม โดยวัดผลจากข้อมูลจริง',
      'ลดอัตราการให้ส่วนลด (Discount Rate) ลง 30-50% ช่วยให้บริษัทมีกำไรขั้นต้น (Gross Margin) กลับคืนมา',
      'เปลี่ยนพฤติกรรมทีมจาก "ส่งใบเสนอราคาแล้วรอ" เป็น "ลูกค้าขอซื้อเองหลังจบการสนทนา"',
      'ขนาดของดีลโดยเฉลี่ย (Average Deal Size) ใหญ่ขึ้น เพราะทีมสามารถ Upsell หรือขายแบบ Bundle ได้อย่างเป็นธรรมชาติ',
      'ทีมมี Opening Script และ Closing Playbook เป็นของตัวเอง ซึ่งปรับให้เข้ากับธุรกิจและลูกค้าของบริษัทโดยเฉพาะ',
    ],
    whyMe: {
      eyebrow: 'Why Me · Sale Training Bundle',
      headline: 'ครูขายที่ยังปิดดีลด้วยมือตัวเอง · ไม่ใช่ academic trainer',
      marketGap: {
        intro: 'ตลาดอบรมการขายในไทยมีผู้เล่นหลากหลาย แต่ส่วนใหญ่แบ่งเป็น 3 กลุ่ม · ยังไม่มีใครเจาะทีมขาย B2B SME ที่ต้องปิดด้วยคุณค่าผ่าน Chat / Call / Field โดยเฉพาะ',
        segments: [
          {
            name: 'หลักสูตรอบรมการขายทั่วไป',
            desc: 'เน้นทฤษฎี + slide สวย · ขาดการลงมือทำจริง · ทีมเรียนจบกลับไปทำงานแบบเดิม เพราะปรับใช้กับหน้างานไม่ได้',
          },
          {
            name: 'นักพูดสร้างแรงบันดาลใจ',
            desc: 'ปลุกไฟทีมได้ดีช่วงสั้นๆ · พอจบ event ไฟมอด · ทักษะการขายจริงไม่ได้ถูกพัฒนาอย่างเป็นระบบ',
          },
          {
            name: 'เทรนเนอร์สาย Soft Skill ทั่วไป',
            desc: 'สอนการสื่อสารในภาพกว้าง · ไม่เจาะ B2B Sales · ไม่มี scenario เฉพาะสำหรับ Chat / Telesales / Field',
          },
        ],
        position: 'ยังไม่มีใครเจาะทีมขาย B2B SME ที่ต้องปิดด้วยคุณค่า ไม่ใช่ราคา · Workshop นี้ผมออกแบบมาเพื่อทีมที่ขายผ่าน Chat / Call / Field โดยเฉพาะ',
      },
      pointOfParity: [
        'Workshop เน้นลงมือทำ · ฝึก role-play 3 รอบ + individual feedback',
        'เอกสารประกอบ + workbook สำหรับผู้เข้าร่วมทุกคน',
        'Async LINE support 14 วันหลัง workshop · ผมตอบในเวลาทำการ',
        'Frameworks ที่ปรับใช้ได้วันจันทร์ทันที · ไม่ต้องรอ research เพิ่ม',
      ],
      pointOfDifferentiation: [
        {
          title: 'ครูขายที่ปิดดีลด้วยมือตัวเอง',
          body: 'ผมไม่ใช่ academic trainer ที่สอนแต่ไม่ขาย · ผมอยู่ในสนาม B2B Sales มา 5 ปี · ปัจจุบันยังเป็นที่ปรึกษาและลงมือปิดดีลให้ลูกค้า SME 10+ ราย · ประสบการณ์ทั้งหมดจากหน้างานจริง ไม่ใช่ทฤษฎี',
        },
        {
          title: 'ใช้ดีลจริงของบริษัทคุณใน workshop',
          body: 'ผมไม่ใช้ case study ในตำรา · ผมนำดีลที่ทีมขายปิดไม่ได้ 5-10 เคสล่าสุดมาทำ role-play สด · ทุกนาทีใน workshop เกี่ยวข้องกับธุรกิจคุณโดยตรง · แก้ปัญหาจริงได้ทันที',
        },
        {
          title: 'Frameworks เปลี่ยนพฤติกรรม ไม่ใช่ tips',
          body: 'ทีมได้ระบบคิดที่ใช้ต่อได้ เช่น Jobs to be Done · Why We Buy 3-Axis · Opening Script · Trust Playbook · Paradox of Choice · framework ที่เปลี่ยนวิธีคิดและพฤติกรรม ไม่ใช่ tips เล็กๆ ที่ใช้แล้วลืม',
        },
        {
          title: 'วัดผล 30 วันด้วยตัวเลข ไม่ใช่ความรู้สึก',
          body: 'หลัง workshop ผมติดตามผลลัพธ์ 30 วันจากตัวชี้วัดจริง: Close Rate / Discount Rate / Average Deal Size · เราตั้งเป้าที่ผลทางธุรกิจ ไม่ใช่แค่ "ทีมรู้สึกมีกำลังใจขึ้น"',
        },
        {
          title: 'ทีมได้ Opening Script + Closing Playbook ของตัวเอง',
          body: 'ผลลัพธ์สุดท้ายคือทีมขายมี Opening Script + Closing Playbook ที่สร้างขึ้นจากดีลและสินค้าของบริษัทจริง · ไม่ใช่ template สำเร็จรูป · ทีมเป็นเจ้าของกระบวนการ · ต่อยอดได้ทันที',
        },
      ],
    },
    priceHeadline: '฿44,900 / 2 วัน · Early Bird',
    priceCompare: '🔥 Early Bird ฿44,900 · รับเพียง 3 ทีมต่อเดือน · หลังเต็มกลับเป็นราคาปกติ ฿52,800',
    priceNote: 'อบรมที่บริษัทลูกค้า (On-site) สำหรับทีมขนาดไม่เกิน 20 คน ราคานี้สำหรับการอบรมในกรุงเทพและปริมณฑล ชำระ 100% ก่อนวันอบรม ค่าเดินทางสำหรับต่างจังหวัดจะคิดแยกตามระยะทางจริง',
    inclusions: [
      'Workshop 2 วันเต็ม (ประมาณ 12-14 ชั่วโมง) ณ บริษัทของลูกค้า',
      'เอกสารประกอบการอบรม (Workbook) และสมุดแบบฝึกหัดสำหรับผู้เข้าร่วมทุกคน',
      'Jobs-to-be-Done Worksheet ที่ทีมได้ลงมือทำจากเคสจริงของตัวเอง',
      'ชุดเทมเพลต Opening Script สำหรับ 3 ช่องทาง (Chat/Call/Field)',
      'ไฟล์ PDF สรุปเนื้อหา Trust & Closing Playbook สำหรับใช้อ้างอิงภายในทีม',
      'กิจกรรม Role-play 3 รอบ พร้อมการให้ Feedback รายบุคคลเพื่อการพัฒนาที่ตรงจุด',
      'การติดตามและวัดผลหลังอบรม 30 วัน (Close Rate, Discount Rate, Deal Size)',
      'ปรึกษาผ่าน LINE แบบ Async support ในเวลาทำการ (จ-ศ) เป็นเวลา 14 วันหลังจบ Workshop',
    ],
    notIncluded: [
      'การออกแบบโครงสร้าง KPI หรือ Commission สำหรับทีมขาย (อยู่ในบริการ Sales System Sprint)',
      'การวางระบบ Automation หรือใช้ AI ช่วยในการขาย (อยู่ในบริการ AI Workshop for Sales Team)',
      'ค่าเดินทางและค่าที่พักสำหรับการจัดอบรมนอกพื้นที่กรุงเทพและปริมณฑล',
    ],
    faqs: [
      {
        q: 'ทำไมถึงต้องรวม 2 หลักสูตรไว้ใน Workshop เดียว?',
        a: 'เพราะ Value Selling คือการวางรากฐานวิธีคิด ส่วน Sales Psychology คือเครื่องมือที่ใช้ในการปฏิบัติจริง ทั้งสองอย่างทำงานร่วมกัน ถ้าขาดอย่างใดอย่างหนึ่งไปก็เหมือนมีรถแต่ไม่มีน้ำมัน การเรียนรู้ทั้งสองเรื่องพร้อมกันทำให้ทีมนำไปปรับใช้ได้ทันทีและเห็นผลลัพธ์ที่ชัดเจนครับ',
      },
      {
        q: 'เหมาะกับทีมที่ขายผ่านแชทหรือโทรศัพท์อย่างเดียวไหม?',
        a: 'เหมาะมากครับ เนื้อหาและเทคนิคกว่า 80% ถูกออกแบบมาโดยคำนึงถึงบริบทของการสื่อสารแบบ Text-based และ Voice-only เป็นหลัก เพราะผมเข้าใจดีว่าการสร้างความน่าเชื่อถือผ่านตัวอักษรหรือเสียงนั้นมีความท้าทายเฉพาะตัวที่แตกต่างจากการเจอหน้ากัน',
      },
      {
        q: 'ถ้าทีมมีขนาดใหญ่กว่า 20 คนจะทำอย่างไร?',
        a: 'ผมแนะนำให้แบ่งการอบรมออกเป็น 2 รอบครับ เพื่อรักษาคุณภาพและประสิทธิภาพของการเรียนรู้ การอบรมนี้เน้นการมีส่วนร่วมและ Role-play รายบุคคล การมีผู้เข้าร่วมมากเกินไปในรอบเดียว (เช่น 30 คน) จะทำให้แต่ละคนได้รับความสนใจและ Feedback ไม่เต็มที่',
      },
      {
        q: 'Workshop นี้ต่างจากที่ปรึกษาด้าน Value Selling ท่านอื่นอย่างไร?',
        a: 'ความแตกต่างที่สำคัญคือ เราจะใช้เคสจริงที่ล้มเหลวของทีมคุณเป็นวัตถุดิบหลักในการเรียนรู้ 100% ครับ ทีมของคุณจะได้สร้างสคริปต์และ Playbook ของตัวเองขึ้นมาใหม่ ไม่ใช่การนำเทมเพลตสำเร็จรูปไปใช้ ทำให้ทุกอย่างที่ได้เรียนไปเกี่ยวข้องกับงานของเขาโดยตรง',
      },
      {
        q: 'ต้องมีการบ้านหรือเตรียมตัวอะไรก่อนเข้าอบรมไหม?',
        a: 'มีครับ และเป็นส่วนที่สำคัญมาก คือการรวบรวมข้อมูลดีลที่เคยปิดไม่สำเร็จ 5-10 เคส และการกรอกแบบฟอร์ม Team Profile ที่ผมจะส่งให้ การเตรียมข้อมูลส่วนนี้จะทำให้ 2 วันใน Workshop เกิดประโยชน์สูงสุด เพราะเราจะใช้ข้อมูลเหล่านี้เป็นสถานการณ์จำลองในการฝึกฝนกัน',
      },
    ],
  },
  'trust-content-tiktok-workshop': {
    slug: 'trust-content-tiktok-workshop',
    accent: 'violet',
    eyebrow: 'Workshop พิเศษ · 1 วัน',
    headline: 'มือถือเครื่องเดียว',
    headlineAccent: 'สร้างลูกค้า B2B',
    headlineTail: 'ด้วยคอนเทนต์ TikTok ที่ปิดการขายได้',
    subhead:
      'Workshop 1 วัน ที่บริษัทลูกค้า — เจ้าของ SME ถ่ายคลิปเองได้ 3 คลิปในวันนั้น พร้อมปฏิทินคอนเทนต์ 30 วัน + Trust Framework (กรอบสร้างความน่าเชื่อถือ) + ชุดเทมเพลตสคริปต์',
    pains: [
      {
        emoji: '👀',
        title: 'จ้างคนทำคอนเทนต์ ยอดวิวดี แต่ไม่มีลูกค้า',
        body: 'จ้างเอเจนซี่รายเดือน คอนเทนต์ดูดี ยอดวิวหลักหมื่น แต่ไม่เคยมีใครทักมาคุยเรื่องซื้อ',
      },
      {
        emoji: '🎬',
        title: 'เริ่มถ่ายเองไม่ถูก กลัวดูไม่เป็นมืออาชีพ',
        body: 'เคยลองเปิดกล้อง แต่พูดไม่ไหลลื่น ตัดต่อเองไม่เป็น เลยเลิกล้มก่อนเริ่ม',
      },
      {
        emoji: '🤷',
        title: 'TikTok สำหรับ B2B เหรอ',
        body: 'คิดว่า TikTok สำหรับเด็กๆ ไม่เหมาะกับ SME B2B — จริงๆ แล้ว SME ไทยสาย B2B ใช้ TikTok หาคู่ค้ากันอยู่แล้ว',
      },
    ],
    audience: [
      'เจ้าของ SME B2B ที่อยากสร้างลูกค้าผ่านคอนเทนต์ แต่ไม่รู้วิธี',
      'ธุรกิจที่จ้างเอเจนซี่แล้วไม่ได้ผลลัพธ์',
      'คนที่อยากลองทำเอง แต่ต้องมีคนช่วยจับมือสอนในวันแรก',
    ],
    agenda: [
      {
        time: 'ช่วงเช้า (9:00-12:00)',
        title: 'Trust Framework + ออกแบบสคริปต์',
        body: 'กรอบสร้างความน่าเชื่อถือสำหรับ B2B · วางจุดยืนของตัวเอง · สคริปต์ 3 รูปแบบที่ปิดการขายได้ ไม่ใช่แค่เล่นให้สนุก',
      },
      {
        time: 'ช่วงบ่าย (13:00-16:00)',
        title: 'ถ่ายจริง 3 คลิปในห้อง',
        body: 'ถ่ายจริง 3 คลิปในห้อง · สอนการพูดหน้ากล้อง + จัดเฟรม + จัดแสง · ตัดต่อด้วย CapCut จบในวันนั้น',
      },
      {
        time: 'ช่วงเย็น (16:00-17:00)',
        title: 'ปฏิทินคอนเทนต์ + ส่งมอบ',
        body: 'ปฏิทินคอนเทนต์ 30 วัน · ชุดเทมเพลตสคริปต์ · เอกสาร Trust Framework สำหรับเปิดดูใช้ต่อเอง',
      },
    ],
    outcomes: [
      '3 คลิปถ่ายเสร็จ โพสต์ได้ตั้งแต่วันรุ่งขึ้น',
      'ปฏิทินคอนเทนต์ 30 วัน รู้ว่าเดือนถัดไปจะถ่ายอะไรบ้าง',
      'เอกสาร Trust Framework (PDF) เจ้าของใช้ซ้ำได้ทุกเดือน',
      'ทักษะถ่ายเองได้ ไม่ต้องจ้างเอเจนซี่',
    ],
    whyMe: {
      eyebrow: 'Why Me · Trust Content TikTok',
      headline: 'ทำจริงจน 2.29M views organic · ไม่ใช่แค่สอนทฤษฎี',
      marketGap: {
        intro: 'ตลาด TikTok coach / content agency / growth course มีเยอะ แต่ยังไม่มีใครเจาะ TikTok for B2B Sales SME ที่ขายด้วย trust · ผมทำจริงจนช่องตัวเองได้ 2.29M views organic ใน 4 เดือน · ไม่ใช่ theory',
        segments: [
          {
            name: 'Creator Agency',
            desc: 'เน้น production สวยงาม · ราคาสูง (฿หลักแสน/campaign) · ไม่เข้าใจ B2B · เน้น brand awareness ไม่ใช่ lead conversion',
          },
          {
            name: 'TikTok Growth Course',
            desc: 'สอน algorithm / trend / viral formula · focus ยอด reach · content ที่ viral มักเปลี่ยนเป็นลูกค้า B2B ไม่ได้',
          },
          {
            name: 'Individual TikTok Coach',
            desc: 'เน้น personal branding สำหรับ creator / influencer · ไม่ใช่ B2B sales funnel end-to-end · ไม่รู้วิธีปิดดีลผ่าน DM',
          },
        ],
        position: 'ยังไม่มีใครเจาะ TikTok for B2B Sales SME · ผมทำจริงจนได้ 2.29M views · 140K likes · 15 posts ใน 4 เดือนโดยไม่ยิง ads · workshop นี้ถ่ายทอดสูตรเดียวกันให้คุณ',
      },
      pointOfParity: [
        'Hands-on shoot 3 clips จริงในห้อง · feedback ทันทีทุกคลิป',
        'Content Calendar 30 วัน ออกแบบสำหรับธุรกิจคุณเฉพาะ',
        'Script Template Kit + Trust Framework PDF ใช้ซ้ำได้',
        'Async LINE support 14 วันหลัง workshop',
      ],
      pointOfDifferentiation: [
        {
          title: 'ครูที่ทำจริงจน 2.29M views organic',
          body: 'ผมเริ่มช่อง TikTok จาก 0 เดือนธันวาคม · ปัจจุบัน 2.29M views · 140K likes · 15 posts ใน 4 เดือน · ไม่ยิง ads แม้บาทเดียว · agency ไม่เคยปั้นช่องเอง · coach ทั่วไปไม่เคย execute · ผมลงมือทำจริงก่อนมาสอน',
        },
        {
          title: 'Trust Framework สำหรับ B2B โดยเฉพาะ',
          body: 'ผมไม่ได้สอน viral formula หรือ entertainment strategy · ผมสอน Trust Framework ที่ออกแบบสำหรับ B2B · เป้าหมายคือ "เจ้าของธุรกิจทักเข้ามาขอนัดคุย" ไม่ใช่แค่ยอด like หรือ follower สูง',
        },
        {
          title: 'Funnel end-to-end · Clip → Bio → Form → Close',
          body: 'ผมสอนทั้ง funnel ตั้งแต่ทำ clip · ออกแบบ bio · สร้าง form เก็บ lead · จนถึงเทคนิคปิดการขาย B2B ที่ทักเข้ามา · ไม่ใช่แค่สอนทำ content แล้วจบ · ได้ business result ทั้งระบบ',
        },
        {
          title: 'On-site at your business · ไม่ใช่ open cohort',
          body: 'ผมเข้าไปสอนที่บริษัทลูกค้าเอง · use case + script ทั้งหมดมาจากธุรกิจของคุณจริง · ไม่ใช่การเรียนรวมใน open cohort ที่ใช้ template · ทีมได้ content plan ที่เหมาะกับอุตสาหกรรมตัวเอง',
        },
        {
          title: 'AI ช่วยได้ แต่ยังคง authentic ของเจ้าของ',
          body: 'ผมสอนใช้ Claude + CapCut ช่วยให้ทำงานเร็วขึ้น · แต่ไม่ใช้ AI Avatar หรือ Voice Clone · เพราะ B2B ขายด้วย trust · ลูกค้าต้องเห็นเจ้าของจริง ไม่ใช่อวตาร AI ที่จับได้ว่าปลอม',
        },
      ],
    },
    priceHeadline: '฿44,900 · ราคาเปิดตัว 5 ธุรกิจแรก',
    priceCompare: 'ราคาปกติ ฿52,800 · ราคาเปิดตัวลดให้ 5 ธุรกิจแรก → ฿44,900',
    priceNote: 'Workshop 1 วัน ที่บริษัทลูกค้า · ชำระเต็มจำนวนก่อนเริ่ม · ราคาเปิดตัวปิดเมื่อครบ 5 ธุรกิจ',
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
          title: 'Hook 3 วินาทีแรก ให้คนหยุดเลื่อน',
          body: 'เจาะปัญหาที่เฉพาะเจาะจงจนคนคิดว่า "เรื่องของกู" · ใช้คำพูดของเจ้าของธุรกิจจริง ไม่ใช่น้ำเสียงเอเจนซี่',
        },
        {
          step: '2',
          title: 'เนื้อหา สอนมุมมองที่เฉพาะเจาะจงไปเลย',
          body: 'ไม่ใช่คำให้กำลังใจลอยๆ ไม่ใช่พาดหัวล่อคลิก · ให้กรอบคิดที่คนก็อปไปใช้ได้ทันที เพื่อสร้างความน่าเชื่อถือ',
        },
        {
          step: '3',
          title: 'ปิดท้ายด้วย "ถ้าอยากคุย นัดได้เลย"',
          body: 'ไม่บังคับซื้อ ไม่ขายหน้ากล้อง · ส่งคนดูไปที่ bio → หน้าเว็บ → ฟอร์มกรอกข้อมูล',
        },
        {
          step: '4',
          title: 'ฟอร์มกรอกข้อมูล คัดคนที่เหมาะ',
          body: 'คัดด้วยขนาดทีม / ปัญหา / งบประมาณ · ตอบกลับเฉพาะเคสที่ตรง · ปิดดีล B2B ที่ใช้ความสัมพันธ์เป็นหลัก',
        },
      ],
      aiUsed: [
        { name: 'Claude / ChatGPT', purpose: 'คิด hook · ร่างสคริปต์ · ย่อมุมมองซับซ้อนให้เข้ากับ 60 วินาที' },
        { name: 'Notion AI', purpose: 'ปฏิทินคอนเทนต์ · ตาราง 30 วัน · แท็กหมวดเสาหลัก/หมวดย่อย' },
        { name: 'CapCut Auto-Caption', purpose: 'ใส่แคปชั่นไทยอัตโนมัติ · ตัดช่วงเงียบ · จับจังหวะเพลง' },
        { name: 'Gemini Deep Research', purpose: 'วิเคราะห์เทรนด์ + hook ของคู่แข่ง · หามุมมองใหม่ทุกสัปดาห์' },
      ],
      aiForbidden: [
        { name: 'AI Avatar / Face Swap', reason: 'B2B ขายด้วยความไว้ใจ · หน้าปลอม = ลูกค้าเลิกดู' },
        { name: 'AI Voice Cloning (เสียงปลอม)', reason: 'เสียงสังเคราะห์ฟังดูผิดธรรมชาติ · ของจริงเท่านั้นที่ปิดยอดได้' },
        { name: 'AI-Generated Video (Sora / Runway)', reason: 'เจ้าของต้องอยู่หน้ากล้องเอง · ตัวตนจริงเท่านั้นที่สร้างความสัมพันธ์ได้' },
        { name: 'AI Thumbnail Generation (สร้างภาพปกด้วย AI)', reason: 'ภาพจริงจาก workshop / มีตติ้ง = หลักฐานที่ AI ปลอมไม่ได้' },
      ],
    },
    inclusions: [
      'Workshop 1 วัน ที่บริษัทลูกค้า (6-7 ชม.)',
      '3 คลิปถ่ายเสร็จ + ตัดต่อในวันนั้น',
      'ปฏิทินคอนเทนต์ 30 วัน',
      'เอกสาร Trust Framework (PDF)',
      'ชุดเทมเพลตสคริปต์ (10+ แบบ)',
      'ตอบคำถามผ่าน LINE 14 วันหลัง Workshop',
    ],
    notIncluded: [
      'ผลิตคอนเทนต์ต่อเนื่องหลังจบ (Workshop นี้สอนให้ถ่ายเอง ไม่ใช่จ้างเราทำให้)',
      'ตั้งค่าโฆษณา / โปรโมตแบบเสียเงิน',
      'ค่าเดินทางเมื่อต้องไปต่างจังหวัด',
    ],
    faqs: [
      {
        q: 'ไม่เคยถ่ายคลิปเลยจะทำได้ไหม',
        a: 'ได้เลย Workshop นี้ออกแบบสำหรับคนที่ไม่เคยถ่าย ผมสอนตั้งแต่การจับมือถือยังไง จัดเฟรมยังไง พูดแบบไหนไม่เกร็ง',
      },
      {
        q: 'ต้องมีอุปกรณ์อะไรไหม',
        a: 'มือถือเครื่องเดียวพอ ไม่ต้องลงทุนไมโครโฟน หรือกล้อง DSLR · Workshop นี้ทำเพื่อให้คุณถ่ายต่อเองไหว ไม่ใช่ทำให้ต้องจ้างคนมาถ่ายต่อ',
      },
      {
        q: 'ราคาเปิดตัว ฿44,900 ถึงเมื่อไหร่',
        a: 'ถึง 5 ธุรกิจแรกที่จองเข้ามา หลังจากนั้นกลับเป็นราคาปกติ ฿52,800 · ดูสถานะได้ที่หน้านี้ ถ้ายังเห็นคำว่า "5 ธุรกิจแรก" คือยังเปิดอยู่',
      },
    ],
  },
};
