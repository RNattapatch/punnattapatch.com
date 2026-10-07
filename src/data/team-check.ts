/**
 * Team Check Quiz Data
 * 2 นาที เช็คทีมขาย แนะนำเรื่องที่ควรเริ่ม
 */

export type Path = 'team-build' | 'ai-office';
export type Topic =
  | 'hiring'
  | 'comp'
  | 'lead'
  | 'sales'
  | 'docs'
  | 'content';

export interface ProfileQuestion {
  id: string;
  text: string;
  choices: string[];
}

export interface SymptomQuestion {
  id: string;
  text: string;
  path: Path;
  topic: Topic;
}

export interface TopicInfo {
  name: string;
  path: Path;
  current: string;
  after: string;
  learnLink?: string;
  productCode: 'C1' | 'T1' | 'T3' | 'T2' | 'I1' | 'P1';
}

export interface ResultTopicInfo extends TopicInfo {
  score: number;
}

// Profile questions (no scoring)
export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: 'p1',
    text: 'ทีมขายตอนนี้มีกี่คน (นับเซลล์ + แอดมินที่ตอบลูกค้า)',
    choices: [
      'ยังไม่มี ผมขายเอง',
      '1–2 คน',
      '3–9 คน',
      '10–20 คน',
      'มากกว่า 20 คน',
    ],
  },
  {
    id: 'p2',
    text: 'ลูกค้าส่วนใหญ่ติดต่อเข้ามาทางไหน',
    choices: [
      'LINE OA',
      'โทร/เข้าพบ',
      'Facebook/IG/TikTok',
      'ผ่านตัวแทน/ดีลเลอร์',
    ],
  },
  {
    id: 'p3',
    text: 'ถ้าแก้ได้ อยากได้แบบไหน',
    choices: [
      'ให้ทีมทำเองเป็น',
      'ให้มีคนเข้ามาวางให้เลย',
      'ยังไม่แน่ใจ',
    ],
  },
];

// Symptom questions (0–2 scoring per question)
// Alternating topics so no 2 of same topic are adjacent
export const SYMPTOM_QUESTIONS: SymptomQuestion[] = [
  { id: 's1', text: 'เซลล์ใหม่อยู่ไม่ถึง 3 เดือนก็ออก', path: 'team-build', topic: 'hiring' },
  { id: 's2', text: 'ลูกค้าทักมาตอนไม่มีใครว่าง เช้ามาเงียบไปแล้ว', path: 'ai-office', topic: 'sales' },
  { id: 's3', text: 'สัมภาษณ์แล้วดูดี แต่พอทำงานจริงขายไม่ได้', path: 'team-build', topic: 'hiring' },
  { id: 's4', text: 'ส่งใบเสนอราคาไปแล้ว ไม่มีใครตามต่อ', path: 'ai-office', topic: 'sales' },
  { id: 's5', text: 'เป้ายอดขายตั้งจากความรู้สึก หรือเอายอดปีที่แล้วบวกเพิ่ม', path: 'team-build', topic: 'comp' },
  { id: 's6', text: 'ทำใบเสนอราคาหนึ่งใบใช้เวลาเกินครึ่งชั่วโมง', path: 'ai-office', topic: 'docs' },
  { id: 's7', text: 'เซลล์เลือกขายแต่ของง่าย ของที่บริษัทอยากดันไม่มีใครขาย', path: 'team-build', topic: 'comp' },
  { id: 's8', text: 'ลูกค้าได้ราคาช้ากว่าเจ้าอื่น เพราะต้องรอเซลล์กลับเข้าออฟฟิศ', path: 'ai-office', topic: 'docs' },
  { id: 's9', text: 'ต้องถามเองทุกเช้าว่าดีลไหนถึงไหน', path: 'team-build', topic: 'lead' },
  { id: 's10', text: 'รู้ว่าต้องโพสต์ แต่ไม่มีใครมีเวลาทำ', path: 'ai-office', topic: 'content' },
  { id: 's11', text: 'ประชุมทีมขายทุกสัปดาห์ แต่ออกจากห้องแล้วไม่มีอะไรเปลี่ยน', path: 'team-build', topic: 'lead' },
  { id: 's12', text: 'โพสต์แล้วแทบไม่มีลูกค้าทักเข้ามา', path: 'ai-office', topic: 'content' },
];

// Topic info — ข้อความผล + ทางไปต่อ
export const TOPIC_INFO: Record<Topic, TopicInfo> = {
  hiring: {
    name: 'คัดคน',
    path: 'team-build',
    current: 'จ้างมาไม่นานก็ออก ดูจากสัมภาษณ์อย่างเดียวกัน',
    after: 'มี Scorecard ตำแหน่ง ชุดคำถาม และโจทย์ทดสอบงานจริง AI ช่วยอ่านเรซูเม่เทียบเกณฑ์',
    learnLink: '/ebook-sales-interview',
    productCode: 'C1',
  },
  comp: {
    name: 'เป้าและค่าคอม',
    path: 'team-build',
    current: 'เป้าตั้งจากความรู้สึก ค่าคอมดันให้ขายแต่ของง่าย',
    after: 'มี KPI ที่ทีมเข้าใจตรงกัน และชีตคำนวณค่าคอมจากดีลจริง',
    learnLink: '/services/daily-consulting',
    productCode: 'C1',
  },
  lead: {
    name: 'หัวหน้าคุมทีม',
    path: 'team-build',
    current: 'ต้องถามเองทุกเช้า ประชุมแล้วไม่มีอะไรเปลี่ยน',
    after: 'ประชุมเช้า 15 นาทีจากตัวเลขจริง หัวหน้ารู้ว่าต้องช่วยดีลไหนก่อน',
    learnLink: '/services/t3-sales-back-office',
    productCode: 'T3',
  },
  sales: {
    name: 'ฝ่ายขาย',
    path: 'ai-office',
    current: 'ลูกค้าทักตอนไม่มีใครว่าง ใบเสนอราคาส่งแล้วไม่มีใครตาม',
    after: 'AI ตอบก่อน ข้อมูลเข้า CRM เซลล์ได้รายชื่อที่ต้องตามทุกเช้า',
    learnLink: '/services/t1-sales-skills',
    productCode: 'T1',
  },
  docs: {
    name: 'ฝ่ายเอกสาร',
    path: 'ai-office',
    current: 'ใบเสนอราคาใบละครึ่งชั่วโมง ลูกค้าได้ราคาช้า',
    after: 'พิมพ์บรรทัดเดียวจากมือถือ ได้ PDF ให้ตรวจก่อนส่ง',
    learnLink: '/services/t3-sales-back-office',
    productCode: 'T3',
  },
  content: {
    name: 'ฝ่ายคอนเทนต์',
    path: 'ai-office',
    current: 'รู้ว่าต้องโพสต์ แต่ไม่มีใครมีเวลา',
    after: 'AI สืบหัวข้อ ร่างโพสต์ ตัดคลิป ทีมแค่ตรวจแล้วกดลง',
    learnLink: '/services/online-to-sales',
    productCode: 'T2',
  },
};

// Helper: topic priority for tie-breaking
export function topicPriority(topic: Topic): number {
  const order: Topic[] = ['sales', 'lead', 'docs', 'comp', 'hiring', 'content'];
  return order.indexOf(topic) + 1;
}

// Helper: generate quiz JSON for serialization
export function generateQuizJSON(): string {
  const data = {
    PROFILE_QUESTIONS,
    SYMPTOM_QUESTIONS,
    TOPIC_INFO,
  };
  return JSON.stringify(data);
}
