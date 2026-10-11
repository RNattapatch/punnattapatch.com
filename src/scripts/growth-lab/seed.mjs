import { evaluateCreative } from './engine-local.mjs';
import { BUILT_IN_PACKS, createWorkspaceDefaults, personaPackRevision } from './persona-packs.mjs';

const DEFAULT_PACK = BUILT_IN_PACKS[0];

const CREATIVE_A = Object.freeze({
  id: 'creative-a',
  campaign: 'Agentic AI for Sales Q4',
  name: 'A — Owner proof angle',
  objective: 'leads',
  format: 'video',
  changedVariable: 'hook',
  hook: 'เจ้าของ SME ยอด 30–200 ล้าน: ลดเวลาตามงานขาย 8 ชม./สัปดาห์ด้วย AI',
  primaryText: 'เวิร์กช็อปที่ปรึกษาลงมือทำที่ออฟฟิศ 1 วัน สร้าง agent จาก pipeline จริง พร้อม case study ลูกค้า B2B 12 ทีม',
  headline: 'ปิดงานค้างให้ทันใน 14 วัน',
  offer: 'วินิจฉัย workflow + สร้าง prototype หน้างาน + แผน ROI ราย 90 วัน',
  cta: 'จองรอบวินิจฉัย 30 นาที',
  visualDirection: 'เปิดด้วย before/after pipeline ใน 3 วินาที มีคนจริง หน้าจอ demo และ subtitle ตัวใหญ่',
  touchpointType: 'meta-ad',
  channel: 'meta',
  businessModel: 'b2b',
  journeyStage: 'awareness',
  personaPackId: DEFAULT_PACK.id,
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T09:00:00.000Z',
});

const CREATIVE_B = Object.freeze({
  ...CREATIVE_A,
  id: 'creative-b',
  name: 'B — Cost of delay angle',
  changedVariable: 'hook',
  hook: 'ถ้าทีมขาย 10 คนยังตามงานด้วย Excel คุณกำลังเสียเวลาผู้จัดการอย่างน้อย 40 ชม./เดือน',
  createdAt: '2026-10-01T09:05:00.000Z',
  updatedAt: '2026-10-01T09:05:00.000Z',
});

const ACTUAL_A = Object.freeze({
  creativeId: 'creative-a',
  date: '2026-10-10',
  spend: 5000,
  impressions: 100000,
  clicks: 2000,
  landingViews: 1600,
  leads: 100,
  qualifiedLeads: 25,
  purchases: 10,
  revenue: 20000,
});

export function seedState() {
  const creatives = [structuredClone(CREATIVE_A), structuredClone(CREATIVE_B)];
  const evaluations = Object.fromEntries(creatives.map((creative) => [creative.id, {
    ...evaluateCreative(creative, DEFAULT_PACK.personas, DEFAULT_PACK, { now: creative.updatedAt }),
    personaPackId: DEFAULT_PACK.id,
    personaPackRevision: personaPackRevision(DEFAULT_PACK),
  }]));
  return {
    schemaVersion: 2,
    workspace: createWorkspaceDefaults(),
    personaPacks: BUILT_IN_PACKS.map((pack) => structuredClone(pack)),
    selectedPersonaPackId: DEFAULT_PACK.id,
    selectedCreativeId: 'creative-a',
    activeView: 'workbench',
    creatives,
    evaluations,
    journeys: {},
    actuals: { 'creative-a': structuredClone(ACTUAL_A) },
    notices: [],
  };
}
