import { fmtPrice } from './pricing.mjs';

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
    eyebrow: 'Basic Foundation AI for Business · 1 วัน',
    headline: 'ผมไม่ได้แค่มาสอนคุณใช้ AI',
    headlineAccent: 'แต่ผมจะจับมือคุณสร้าง AI Agent ตัวแรก',
    headlineTail: 'ให้ธุรกิจของคุณ',
    subhead:
      '1 วันเต็ม 8 ชั่วโมงเต็ม · สำหรับทีมขาย 5-20 คน · จบ workshop แล้วทีมใช้ AI ทำงาน สร้างยอดขายได้จริงๆ ไม่ใช่แค่ถามตอบเขียนเมลล์ หรือ สร้างภาพหมาแมว, และ Prompt Library 30 ชุดพร้อมใช้ ทุกอย่างทีมลงมือทำเอง ผมนั่งจับมือทำไปด้วยกัน เห็นผลลัพธ์จากงานจริง ไม่ใช่การนั่งดูสไลด์',
    pains: [
      {
        emoji: '💬',
        title: 'ตอบ Chat ลูกค้าไม่ทัน',
        body: 'แชทเด้งพร้อมกันทั้ง LINE, IG, Facebook ทีมตอบไม่ทัน ลูกค้ารอไม่ไหว หนีไปหาเจ้าอื่น สุดท้ายเป็นเรา (เจ้าของ) ที่ต้องมานั่งตอบเองทุกวัน แทนที่จะได้เอาเวลาไปคิดเรื่องใหญ่ๆ ของบริษัท',
      },
      {
        emoji: '🤔',
        title: 'อยากเริ่มใช้ AI ในองค์กรแต่ไม่รู้จะเริ่มตรงไหน',
        body: 'เห็นคนอื่นใช้ AI ทำนั่นทำนี่เต็มไปหมด ข่าวก็ออกทุกวัน แต่พอหันมาถามทีมตัวเองว่า "เราจะเอามาใช้กับงานขายเราตรงไหนดี" กลับเจอแต่ความเงียบ ไม่มีใครตอบได้ว่ามันจะช่วยธุรกิจเราได้จริงหรือเปล่า',
      },
      {
        emoji: '🚀',
        title: 'อยากขยายองค์กรแต่ไม่อยากจ้างคนเพิ่ม',
        body: 'ยอดขายเริ่มมา แต่ทีมงานก็เริ่มล้าเต็มที จะจ้างคนเพิ่มก็เป็น fixed cost ที่ต้องจ่ายทุกเดือน ไหนจะเวลาที่ต้องใช้เทรนงาน แถมยังต้องลุ้นอีกว่าเขาจะอยู่กับเรานานไหม อยากได้ระบบมาช่วยแบ่งเบางาน routine ที่กินแรงคน แต่ยังไม่รู้จะทำยังไง',
      },
      {
        emoji: '📈',
        title: 'ลงทุนกับ AI ไปแล้ว แต่วัดผลไม่ได้',
        body: 'ทีมบอกว่า "ใช้อยู่ครับพี่" แต่พอถามว่าช่วยลดเวลาทำงานไปได้กี่ชั่วโมง หรือทำให้ยอดขายเพิ่มขึ้นกี่เปอร์เซ็นต์ กลับไม่มีใครตอบได้ มีแต่ "ความรู้สึก" ว่ามันดีขึ้น ผมอยากเห็นตัวเลข Before/After ที่จับต้องได้จริง',
      },
      {
        emoji: '📄',
        title: 'เซลล์เสียเวลากับงานเอกสาร',
        body: 'เซลล์ใช้เวลา 2-4 ชั่วโมงต่อวันไปกับงานเอกสาร: ทำรีพอร์ตส่งลูกค้า, ก็อปแชทจาก LINE ลง Sheet, ไล่ follow-up ทีละคน, นั่งแก้ใบเสนอราคาเป็นชั่วโมงๆ ทั้งที่เวลาเหล่านี้ควรเอาไปใช้คุยกับลูกค้าเพื่อปิดดีล',
      },
      {
        emoji: '🧠',
        title: 'ส่งทีมไปเรียน AI แล้วใช้ไม่เป็น',
        body: 'เคยจ่ายเงินส่งทีมไปเรียนคอร์ส AI แล้ว แต่กลับมาก็เห่อใช้กันอยู่ 3 วันแรกแล้วก็เลิก หรือที่แย่กว่านั้นคือคนที่ไปเรียนมาดันลาออก เอาความรู้ไปกับเขาด้วย ผมอยากได้ "ระบบ" ที่เป็นของบริษัท ไม่ใช่ "ทักษะ" ที่ติดอยู่กับตัวคน',
      },
    ],
    audience: [
      'SME B2B ทีมขาย 5-20 คน ที่เจ้าของอยากให้ทีมใช้ AI ลดงานซ้ำ',
      'ทีมที่เคยซื้อ course ออนไลน์แล้วไม่ได้ implement ต่อ',
      'เจ้าของที่อยากเห็น AI รันจริง ก่อนตัดสินใจลงทุนก้อนใหญ่',
    ],
    preparation: {
      requirements: [
        { title: 'Laptop ส่วนตัว + Internet', detail: 'laptop ของทีมแต่ละคน · WiFi ที่เข้า Google ได้' },
        { title: 'Gmail คนละ 1 account', detail: 'ใช้สมัคร AI tools + access Google Sheets/Drive' },
      ],
      tools: [
        { name: 'Workflow Automation', tagline: 'สร้างระบบ Automation แบบไม่ต้องเขียนโค้ด' },
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
      'พนักงานกลับบ้านไปพร้อม AI Mindset และความรู้ด้านการใช้งาน AI ใช้ได้จริงตั้งแต่วันรุ่งขึ้น',
      'ได้ Prompt Library 30 ชุดที่ทดสอบแล้วว่าใช้ได้ผลจริงกับงานขาย แค่ copy-paste ไปใช้ ไม่ต้องคิดเอง',
      'วัดผล Before/After กันในเวิร์กชอป เห็นเป็นตัวเลขชัดๆ ว่าลดเวลาและต้นทุนไปได้เท่าไรก่อนกลับบ้าน',
      'หัวหน้าทีมสามารถดูแลและปรับปรุงระบบต่อได้เอง โดยไม่ต้องจ้างผมเป็นรายเดือน',
      'ทีมได้เห็น AI แก้ปัญหาจากงานของพวกเขาจริงๆ ด้วยข้อมูลของบริษัทเอง ไม่ใช่การดูเดโมจากเคสของคนอื่น',
    ],
    whyMe: {
      eyebrow: 'Why Me · AI Workshop',
      headline: 'ทำไมต้องเรียน AI Workshop กับผม',
      marketGap: {
        intro: 'คอร์ส AI ในไทยตอนนี้มีเยอะมาก แต่พอดูดีๆ จะเห็นว่าส่วนใหญ่วิ่งไปทางเดียวกันหมด และยังไม่ใช่สิ่งที่ทีมขาย B2B ต้องการ',
        segments: [
          {
            name: 'คอร์ส AI ทั่วไป',
            desc: 'สอนใช้เครื่องมือพื้นฐานอย่าง ChatGPT หรือ Claude แต่ไม่ได้เจาะจงที่ปัญหาของทีมขายโดยตรง เรียนจบแล้วก็ยังไม่มี workflow ที่เอาไปใช้ทำงานต่อได้ทันที',
          },
          {
            name: 'อบรมสำหรับฝ่าย IT โดยเฉพาะ',
            desc: 'เนื้อหาลงลึกเรื่องเทคนิค เหมาะกับโปรแกรมเมอร์ แต่ซับซ้อนเกินไปสำหรับเจ้าของธุรกิจหรือทีมขายที่แค่อยากได้ระบบไปใช้งาน ไม่ได้อยากเขียนโค้ดเอง',
          },
          {
            name: 'คอร์สสำหรับบุคคล / ฟรีแลนซ์',
            desc: 'เน้นเรื่องการเพิ่มประสิทธิภาพส่วนบุคคล (Personal Productivity) แต่ไม่ได้สอนวิธีสร้างระบบที่ทั้งทีมขายสามารถใช้ร่วมกันได้ ซึ่งเป็นหัวใจสำคัญของงานขาย B2B',
          },
        ],
        position: 'Workshop ของผมเติมช่องว่างนี้: AI Workshop สำหรับทีมขาย B2B ของ SME ไทยโดยเฉพาะ ที่เน้นสร้างระบบที่ใช้ได้จริง ไม่ใช่แค่ความรู้ลอยๆ',
      },
      pointOfParity: [
        'Workshop เน้นลงมือทำจริง ไม่ใช่นั่งฟังบรรยายอย่างเดียว',
        'ใช้เครื่องมือล่าสุดเสมอ เช่น Claude Code · Automation Workflow · Gemini · Kie.Ai',
        'กลุ่มซัพพอร์ตสำหรับถามตอบและให้คำปรึกษาต่อเนื่อง 30 วันหลังจบ workshop',
        'เอกสารสรุป + วิดีโอบันทึกหน้าจอทุก session · ทีมกลับไปทบทวนได้',
      ],
      pointOfDifferentiation: [
        {
          title: 'สอนโดยคนทำธุรกิจจริงๆ ไม่ใช่โปรแกรมเมอร์',
          body: 'ผมทำ B2B Sales มา 5 ปี ปิดดีลเอง เจอปัญหาหน้างานมาเหมือนกับทีมของคุณทุกอย่าง workflow ในเวิร์กชอปนี้เลยมาจากประสบการณ์จริงที่ผมใช้แก้ปัญหาให้ตัวเอง ไม่ได้มาจากตำราเล่มไหน',
        },
        {
          title: 'เวิร์กชอปส่วนตัวที่บริษัทคุณ ใช้โจทย์จริงของคุณ',
          body: 'ผมเข้าไปจัดที่ออฟฟิศของคุณเลย เราจะเอาปัญหาและข้อมูลจริงๆ ของคุณมาเป็นโจทย์ตั้งต้นในการสร้าง workflow ทีมคุณจึงได้เครื่องมือที่แก้ปัญหาของตัวเองกลับไปใช้โดยตรง',
        },
        {
          title: 'สร้างระบบที่ทำงานเองได้ ไม่ใช่แค่ผู้ช่วยตอบคำถาม',
          body: 'เราเน้นสร้าง AI Agent ที่ trigger ตัวเอง ทำงาน และสรุปผลได้โดยที่ทีมไม่ต้องเข้าไปสั่งทุกครั้ง ด้วย Claude API และ Automation Platform ที่เลือกมาแล้วว่าทีม non-tech ดูแลต่อได้',
        },
        {
          title: 'วัดผล ROI ได้ตั้งแต่วันแรกที่เรียน',
          body: 'เราคำนวณเวลาและต้นทุนที่ประหยัดได้จาก workflow ที่สร้างเสร็จในห้องเรียนวันนั้นเลย คุณเห็นตัวเลข Before/After เป็นรูปธรรมก่อนกลับบ้าน ไม่ต้องรอไปลองใช้เป็นเดือนแล้วค่อยกลับมาวัดผล',
        },
        {
          title: 'สร้างระบบให้เป็นของบริษัท ไม่ใช่ของที่ปรึกษา',
          body: 'ผมสอนให้หัวหน้าทีมสามารถดูแล ปรับปรุง และต่อยอด workflow ได้ด้วยตัวเอง ระบบทั้งหมดที่สร้างขึ้นกลายเป็นทรัพย์สินของบริษัทคุณจริงๆ ไม่ใช่ความรู้ที่ผูกติดอยู่กับผม หรือพนักงานคนใดคนหนึ่งที่อาจลาออกไป',
        },
      ],
    },
    priceHeadline: `${fmtPrice('ai-workshop-basic')} / 1 วัน`,
    priceCompare: `Basic Foundation AI ${fmtPrice('ai-workshop-basic')} · Advance AI & Business Automation ${fmtPrice('ai-workshop-advance')} · Package A (Advance + Consult 2 วัน) ${fmtPrice('package-a')}`,
    priceNote: 'จัดแบบ private on-site ผมเดินทางไปที่บริษัทของคุณ · ยืนยันวันอบรมได้ภายใน 30 วันหลังจอง · ชำระ 100% ก่อนเริ่มงาน',
    inclusions: [
      'Workshop 1 วัน 6-7 ชม. · On-site เท่านั้น (In-house)',
      'AI workflow อัตโนมัติ + AI Agent 1 ตัวที่ build ในห้อง (production-ready)',
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
        q: 'ทีมต้องเตรียมตัวอะไรบ้างก่อนวันเวิร์กชอป',
        a: 'ผมจะส่ง checklist ให้ล่วงหน้า 1 สัปดาห์ครับ สิ่งที่ต้องเตรียมหลักๆ คือ Google account, permission เข้าถึงข้อมูลที่อยากเอามาทำ automation (เช่น Google Sheets หรือ Drive) และเตรียม workflow จริงๆ 2-3 เคสมาเล่าให้ฟังในวันงาน นอกนั้นไม่ต้องเตรียมอะไรด้านเทคนิคเลยครับ',
      },
      {
        q: 'ถ้าทีมไม่เก่งเทคโนโลยีเลย จะเรียนทันไหม',
        a: 'ทันแน่นอนครับ เวิร์กชอปนี้ออกแบบมาสำหรับ non-tech โดยเฉพาะ ลูกค้าของผม 8 ใน 10 ทีมก็ไม่มีใครเขียนโค้ดเป็น เครื่องมือที่เราใช้ (Google Sheets, Automation Platform, Claude API) ถูกเลือกมาแล้วว่าคนที่ไม่ใช่โปรแกรมเมอร์ดูแลและแก้ไขเองได้ 100%',
      },
      {
        q: 'หลังจบเวิร์กชอป ถ้าเจอปัญหาหรือมีคำถาม ปรึกษาใครได้บ้าง',
        a: 'ในแพ็กเกจรวม 30-day support ผ่าน LINE อยู่แล้วครับ ส่งคำถามทิ้งไว้ได้เลย ผมตอบกลับภายใน 24 ชม. (จันทร์-ศุกร์) ถ้าต้องการดูแลต่อเนื่องหรือต่อยอด scope ที่ซับซ้อนขึ้น คุยเรื่อง Monthly Consulting เพิ่มเติมได้ครับ',
      },
      {
        q: 'Basic Workshop (Day 1) ต่างจาก Advance Workshop (Day 2) ยังไง',
        a: 'Day 1 เน้นสร้าง AI Agent ตัวแรกให้สำเร็จ เพื่อให้ทีมเห็นภาพและลงมือทำเป็นก่อน Day 2 คือการนำ Agent ที่สร้างในวันแรกมาเชื่อมต่อกับระบบอื่น เช่น LINE OA, CRM, หรือ Google Sheets เพื่อให้ทั้งหมดทำงานเชื่อมกันเป็น pipeline อัตโนมัติ ไม่แน่ใจว่าบริษัทของคุณพร้อมสำหรับ Day 2 หรือยัง ทักมาคุยก่อนได้เลย ผมช่วยประเมินให้',
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
          title: 'On-site at your business · ไม่ใช่ public course เปิดทั่วไป',
          body: 'ผมเข้าไปสอนที่บริษัทลูกค้าเอง · use case + script ทั้งหมดมาจากธุรกิจของคุณจริง · ไม่ใช่การเรียนรวมใน public course ที่ใช้ template · ทีมได้ content plan ที่เหมาะกับอุตสาหกรรมตัวเอง',
        },
        {
          title: 'AI ช่วยได้ แต่ยังคง authentic ของเจ้าของ',
          body: 'ผมสอนใช้ Claude + CapCut ช่วยให้ทำงานเร็วขึ้น · แต่ไม่ใช้ AI Avatar หรือ Voice Clone · เพราะ B2B ขายด้วย trust · ลูกค้าต้องเห็นเจ้าของจริง ไม่ใช่อวตาร AI ที่จับได้ว่าปลอม',
        },
      ],
    },
    priceHeadline: `${fmtPrice('tiktok-workshop')} · ราคาเปิดตัว`,
    priceCompare: `ราคาปกติ ${fmtPrice('tiktok-workshop-regular')} · ราคาเปิดตัวลดให้ → ${fmtPrice('tiktok-workshop')}`,
    priceNote: '2 วัน + ดูแลต่อผ่าน LINE 30 วัน · ที่บริษัทลูกค้า · ชำระเต็มจำนวนก่อนเริ่ม',
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
        q: 'ราคาเปิดตัว ฿49,900 ต่างจากราคาปกติยังไง',
        a: 'ราคาปกติ ฿59,900 · ช่วงเปิดตัวลดให้เหลือ ฿49,900 · ดูสถานะราคาได้ที่หน้านี้',
      },
    ],
  },
};
