const OBJECTIVE_COMPONENT = Object.freeze({
  awareness: 'hook',
  traffic: 'hook',
  engagement: 'visual',
  leads: 'offer',
  sales: 'offer',
  purchases: 'offer',
});

export function objectiveComponentFor(objective) {
  return OBJECTIVE_COMPONENT[objective] ?? 'offer';
}

const COMPARISON_FIELDS = Object.freeze([
  'campaign', 'personaPackId', 'businessModel', 'touchpointType', 'channel', 'journeyStage', 'objective',
]);

export function isSameComparisonGroup(left, right) {
  return Boolean(left && right && COMPARISON_FIELDS.every((field) => left[field] === right[field]));
}

export function rankVariants(variants) {
  return [...variants].sort((left, right) => {
    const leftEvaluation = left.evaluation ?? {};
    const rightEvaluation = right.evaluation ?? {};
    const objective = left.objective ?? right.objective ?? 'leads';
    const component = objectiveComponentFor(objective);
    return (
      Number(rightEvaluation.stopRate ?? -1) - Number(leftEvaluation.stopRate ?? -1) ||
      Number(rightEvaluation.averageScore ?? -1) - Number(leftEvaluation.averageScore ?? -1) ||
      Number(rightEvaluation.componentScores?.[component] ?? -1) - Number(leftEvaluation.componentScores?.[component] ?? -1) ||
      String(left.id).localeCompare(String(right.id))
    );
  });
}

export function rankAgreement(predictedVariants, actualByCreativeId) {
  const predictedOrder = rankVariants(predictedVariants).map((item) => item.id);
  const actualOrder = [...predictedVariants]
    .filter((item) => actualByCreativeId[item.id])
    .sort((left, right) => {
      const leftScore = actualByCreativeId[left.id].actualScore ?? 0;
      const rightScore = actualByCreativeId[right.id].actualScore ?? 0;
      return rightScore - leftScore || String(left.id).localeCompare(String(right.id));
    })
    .map((item) => item.id);
  if (actualOrder.length < 2) return null;
  const comparablePredicted = predictedOrder.filter((id) => actualOrder.includes(id));
  const samePositions = comparablePredicted.filter((id, index) => actualOrder[index] === id).length;
  return Math.round((samePositions / actualOrder.length) * 1000) / 10;
}
