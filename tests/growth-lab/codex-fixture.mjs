export function fakeCodexOutput(pack, personas) {
  const personaResults = personas.map((persona, index) => ({
    personaId: persona.id,
    decision: index % 3 === 0 ? 'STOP' : index % 3 === 1 ? 'WATCH' : 'SCROLL',
    confidence: 0.72,
    score: 70 - index,
    componentScores: { hook: 72, offer: 68, copy: 74, visual: 66 },
    reaction: `${persona.role} สนใจข้อความที่ตรงบริบท`,
    friction: persona.objections[0],
    improvement: 'เพิ่มหลักฐานที่ตรวจสอบได้',
  }));
  const stageForecasts = pack.journeyStages.map((stage, index) => ({
    stageId: stage.id,
    label: stage.label,
    probability: 82 - index * 9,
    dropOff: index === 0 ? 18 : 9,
    topFriction: 'ยังต้องการหลักฐาน',
    nextBestAction: `action ${index + 1}`,
    channel: index === 0 ? 'meta' : 'line-oa',
    timing: `day ${index}`,
  }));
  const personaPaths = personas.map((persona, personaIndex) => ({
    personaId: persona.id,
    conversionProbability: 37 - personaIndex,
    likelyNextStage: pack.journeyStages[1].id,
    bottleneckStage: pack.journeyStages[2].id,
    trigger: persona.outcomes[0],
    friction: persona.objections[0],
    nextBestAction: 'ส่งรีวิวและเงื่อนไขให้ครบ',
    confidence: 68,
    stages: pack.journeyStages.map((stage, index) => ({ stageId: stage.id, probability: 82 - index * 9 - personaIndex * 0.1 })),
  }));
  return {
    personaResults,
    journey: {
      confidence: 68,
      assumptions: ['Directional model based on supplied personas and touchpoint.'],
      stageForecasts,
      personaPaths,
      strategy: { bottleneckStage: pack.journeyStages[2].id, priorityPersonaIds: personas.slice(0, 3).map((persona) => persona.id), nextBestActions: ['ส่งรีวิว', 'ทำ comparison', 'ติดตามผล'] },
    },
  };
}
