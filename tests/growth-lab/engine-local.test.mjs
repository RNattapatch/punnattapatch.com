import test from 'node:test';
import assert from 'node:assert/strict';

import { PERSONAS } from '../../src/scripts/growth-lab/personas.mjs';
import { extractFeatures } from '../../src/scripts/growth-lab/features.mjs';
import {
  buildNextHypothesis,
  classifyDecision,
  evaluateCreative,
} from '../../src/scripts/growth-lab/engine-local.mjs';

const specificCreative = {
  id: 'creative-specific',
  campaign: 'AI Sales Sprint',
  name: 'Owner proof angle',
  objective: 'leads',
  format: 'video',
  changedVariable: 'hook',
  hook: 'เจ้าของ SME ยอด 30–200 ล้าน: ลดเวลาตามงานขาย 8 ชม./สัปดาห์ด้วย AI',
  primaryText:
    'เวิร์กช็อปที่ปรึกษาลงมือทำที่ออฟฟิศ 1 วัน สร้าง agent จาก pipeline จริง พร้อม case study ลูกค้า B2B 12 ทีม',
  headline: 'ปิดงานค้างให้ทันใน 14 วัน',
  offer: 'วินิจฉัย workflow + สร้าง prototype หน้างาน + แผน ROI ราย 90 วัน',
  cta: 'จองรอบวินิจฉัย 30 นาที',
  visualDirection:
    'เปิดด้วย before/after pipeline ใน 3 วินาที มีคนจริง หน้าจอ demo และ subtitle ตัวใหญ่',
};

const vagueCreative = {
  ...specificCreative,
  id: 'creative-vague',
  hook: 'เปลี่ยนธุรกิจคุณให้ดีขึ้น',
  primaryText: 'โซลูชันนวัตกรรมที่จะพาคุณไปสู่อนาคต',
  headline: 'เริ่มวันนี้',
  offer: 'บริการระดับโลก',
  cta: 'คลิกที่นี่',
  visualDirection: 'ภาพสวย โมเดิร์น',
};

test('panel contains exactly 30 complete and uniquely identified Thai B2B personas', () => {
  assert.equal(PERSONAS.length, 30);
  assert.equal(new Set(PERSONAS.map((persona) => persona.id)).size, 30);
  assert.ok(PERSONAS.every((persona) => persona.name && persona.role && persona.segment));
  assert.ok(new Set(PERSONAS.map((persona) => persona.segment)).size >= 6);
});

test('feature extraction rewards concrete proof and flags vague claims', () => {
  const strong = extractFeatures(specificCreative);
  const vague = extractFeatures(vagueCreative);

  assert.ok(strong.numericProof >= 4);
  assert.ok(strong.audienceSpecificity >= 2);
  assert.ok(strong.visualProof >= 3);
  assert.ok(vague.vagueClaims > strong.vagueClaims);
});

test('evaluation is deterministic and specific creative outranks vague creative', () => {
  const now = '2026-10-11T09:00:00.000Z';
  const first = evaluateCreative(specificCreative, PERSONAS, null, { now });
  const second = evaluateCreative(specificCreative, PERSONAS, null, { now });
  const vague = evaluateCreative(vagueCreative, PERSONAS, null, { now });

  assert.deepEqual(first, second);
  assert.equal(first.personaResults.length, 30);
  assert.ok(first.averageScore > vague.averageScore + 8);
  assert.ok(first.stopRate > vague.stopRate);
});

test('decision thresholds preserve the six-point watch band', () => {
  assert.equal(classifyDecision(72, 70), 'STOP');
  assert.equal(classifyDecision(64, 70), 'WATCH');
  assert.equal(classifyDecision(63.99, 70), 'SCROLL');
});

test('each evaluation exposes all four diagnostic components and explanations', () => {
  const result = evaluateCreative(specificCreative, PERSONAS);
  assert.deepEqual(Object.keys(result.componentScores).sort(), ['copy', 'hook', 'offer', 'visual']);
  assert.ok(
    result.personaResults.every(
      (item) =>
        Object.keys(item.componentScores).length === 4 &&
        item.reaction.length > 10 &&
        item.friction.length > 10 &&
        item.improvement.length > 10,
    ),
  );
});

test('next hypothesis changes exactly the weakest component', () => {
  const evaluation = {
    weakestComponent: 'hook',
    componentScores: { hook: 41, offer: 68, copy: 72, visual: 79 },
  };
  const hypothesis = buildNextHypothesis(evaluation);

  assert.equal(hypothesis.changedVariable, 'hook');
  assert.equal(hypothesis.keepFixed.length, 3);
  assert.ok(hypothesis.instruction.includes('Hook'));
});
