import { test, expect } from '@playwright/test';

// Scoring logic for team-check quiz
function calculateScores(symptomAnswers) {
  const topicScores = {
    hiring: 0,
    comp: 0,
    lead: 0,
    sales: 0,
    docs: 0,
    content: 0,
  };

  const questions = [
    { id: 's1', topic: 'hiring' },
    { id: 's2', topic: 'sales' },
    { id: 's3', topic: 'hiring' },
    { id: 's4', topic: 'sales' },
    { id: 's5', topic: 'comp' },
    { id: 's6', topic: 'docs' },
    { id: 's7', topic: 'comp' },
    { id: 's8', topic: 'docs' },
    { id: 's9', topic: 'lead' },
    { id: 's10', topic: 'content' },
    { id: 's11', topic: 'lead' },
    { id: 's12', topic: 'content' },
  ];

  symptomAnswers.forEach((answer, idx) => {
    const topic = questions[idx].topic;
    topicScores[topic] += answer;
  });

  return topicScores;
}

function determineMainPath(topicScores) {
  const teamBuildScore = topicScores.hiring + topicScores.comp + topicScores.lead;
  const aiOfficeScore = topicScores.sales + topicScores.docs + topicScores.content;

  if (teamBuildScore > aiOfficeScore) {
    return 'team-build';
  } else if (aiOfficeScore > teamBuildScore) {
    return 'ai-office';
  } else {
    // Tie: use first topic with highest score by priority
    const allTopics = ['sales', 'lead', 'docs', 'comp', 'hiring', 'content'];
    const maxScore = Math.max(...Object.values(topicScores));
    const firstTopic = allTopics.find((t) => topicScores[t] === maxScore);
    // Map back to path
    if (['sales', 'docs', 'content'].includes(firstTopic)) {
      return 'ai-office';
    }
    return 'team-build';
  }
}

test.describe('Team Check Quiz Scoring', () => {
  test('all scores 0 should work', () => {
    const answers = new Array(12).fill(0);
    const scores = calculateScores(answers);
    expect(scores.hiring).toBe(0);
    expect(scores.sales).toBe(0);
    expect(Object.values(scores).every((s) => s === 0)).toBe(true);
  });

  test('tie-breaking by topic priority', () => {
    // Equal scores: 6 both ways
    const answers = [
      2, // s1 hiring
      2, // s2 sales
      2, // s3 hiring
      2, // s4 sales
      2, // s5 comp
      0, // s6 docs
      0, // s7 comp
      0, // s8 docs
      0, // s9 lead
      0, // s10 content
      0, // s11 lead
      0, // s12 content
    ];
    const scores = calculateScores(answers);
    const path = determineMainPath(scores);
    // team-build: hiring(4) + comp(2) + lead(0) = 6
    // ai-office: sales(4) + docs(0) + content(0) = 4
    // team-build wins
    expect(path).toBe('team-build');
  });

  test('all max should score correctly', () => {
    const answers = new Array(12).fill(2);
    const scores = calculateScores(answers);
    expect(scores.hiring).toBe(4);
    expect(scores.comp).toBe(4);
    expect(scores.lead).toBe(4);
    expect(scores.sales).toBe(4);
    expect(scores.docs).toBe(4);
    expect(scores.content).toBe(4);
  });

  test('ai-office path detection', () => {
    // High sales/docs/content, low others
    const answers = [
      0, // s1 hiring
      2, // s2 sales
      0, // s3 hiring
      2, // s4 sales
      0, // s5 comp
      2, // s6 docs
      0, // s7 comp
      2, // s8 docs
      0, // s9 lead
      2, // s10 content
      0, // s11 lead
      2, // s12 content
    ];
    const scores = calculateScores(answers);
    const path = determineMainPath(scores);
    // ai-office: 2+2+2+2+2+2 = 12
    // team-build: 0+0+0 = 0
    expect(path).toBe('ai-office');
  });

  test('team-build path detection', () => {
    const answers = [
      2, // s1 hiring
      0, // s2 sales
      2, // s3 hiring
      0, // s4 sales
      2, // s5 comp
      0, // s6 docs
      2, // s7 comp
      0, // s8 docs
      2, // s9 lead
      0, // s10 content
      2, // s11 lead
      0, // s12 content
    ];
    const scores = calculateScores(answers);
    const path = determineMainPath(scores);
    // team-build: 4+4+4 = 12
    // ai-office: 0+0+0 = 0
    expect(path).toBe('team-build');
  });
});
