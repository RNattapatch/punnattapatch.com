// Synthetic rows for the "ทดสอบบอท" tests. Shapes follow supabase/migrations/202610130001_funnel_lab_bot_sim.sql.
// Nothing here is customer data: persona names are placeholders and every chat is invented.
// Used by tests/growth-lab/botsim.test.mjs (pure logic) and tests/growth-lab/browser-botsim.mjs (walk-through).

export const FULL_LABELS = ['base', 'base2', 'new', 'new2', 'new3', 'new4a', 'new4b', 'final'];
export const TRIAL_LABELS = ['trial', 'trial-v2', 'codex-test'];
export const VERSION_NOTE = Object.freeze({
  base: 'บอทก่อนปรับ',
  base2: 'บอทก่อนปรับ (รันซ้ำ)',
  new: 'ถาม 4 เรื่อง',
  new2: '+ แก้แนะนำตัวซ้ำ + บล็อกขอดูก่อน + ราคาเริ่มต้น',
  new3: '+ เคสจริงจากหน้าผลงาน',
  new4a: '+ ให้ก่อนขอ + แก้ตัวจับขอนัด',
  new4b: '+ ให้ก่อนขอ + แก้ตัวจับขอนัด (รอบ b)',
  final: 'ตัวที่ deploy',
  trial: 'ทดลองกับ persona 1 คน',
  'trial-v2': 'ทดลองกับ persona 1 คน (v2)',
  'codex-test': 'ทดลอง Codex',
});
const PACK_ID = 'line-bot-persona-2026-10';
const PICK_RUN_ID = 'pick-2026-10-13-a';
const SEGMENT_PLAN = [...Array(9).fill('buy'), ...Array(9).fill('near'), ...Array(9).fill('warm'), ...Array(10).fill('off')];
const pad = (n) => String(n).padStart(2, '0');

export function makePersonas(count = 37) {
  return Array.from({ length: count }, (_, i) => ({
    id: `persona-${pad(i + 1)}`,
    name: `ผู้ทดสอบ ${pad(i + 1)}`,
    segment: SEGMENT_PLAN[i] ?? 'off',
  }));
}

// Turns and thoughts follow the sim's order: thought N is written after the bot's Nth reply, then the next customer message.
function chatFor(persona, ending) {
  const turns = [
    { role: 'bot', text: 'สวัสดีค่ะ ยินดีที่ได้คุยกันนะคะ' },
    { role: 'customer', text: `${persona.name} ทักมาเรื่องทีมขาย`, action: 'reply' },
    { role: 'bot', text: 'ขอถามสักนิดค่ะ ธุรกิจทำอะไรและขายให้ใครคะ' },
    { role: 'customer', text: 'ขายวัสดุก่อสร้างค่ะ ลูกค้าเป็นผู้รับเหมา', action: 'reply' },
    { role: 'bot', text: 'ขอบคุณค่ะ ขั้นต่อไปคือโทรคุยกับคุณปันประมาณ 15 นาที สะดวกช่วงไหนคะ' },
  ];
  const thoughts = [{ turn: 1, interest: 3, action: 'reply', thought: 'ถามตรงดี ตอบไปก่อน' }];
  if (ending === 'booked') {
    turns.push({ role: 'customer', text: 'พรุ่งนี้บ่ายสองได้ค่ะ ส่งเบอร์ให้แล้วนะคะ', action: 'give_phone' });
    turns.push({ role: 'bot', text: 'รับทราบค่ะ นัดพรุ่งนี้บ่ายสองนะคะ' });
    thoughts.push({ turn: 2, interest: 4, action: 'give_phone', thought: 'เริ่มเชื่อ ให้เวลาแล้ว' });
    thoughts.push({ turn: 3, interest: 5, action: 'done', thought: 'ได้นัดแล้ว จบตรงนี้' });
    return { turns, thoughts, outcome: 'closed', result: 'นัดได้-เบอร์+เวลา' };
  }
  if (ending === 'defer') {
    turns.push({ role: 'customer', text: 'ขอดูก่อนนะคะ ยังไม่รีบ', action: 'done' });
    thoughts.push({ turn: 2, interest: 2, action: 'done', thought: 'อยากดูก่อน ไม่อยากผูกมัด' });
    return { turns, thoughts, outcome: 'closed', result: 'ลูกค้าขอดูก่อน' };
  }
  if (ending === 'off') {
    turns.push({ role: 'customer', text: 'ขอบคุณค่ะ จริง ๆ ไม่ได้ทำงานขายค่ะ', action: 'done' });
    thoughts.push({ turn: 2, interest: 1, action: 'done', thought: 'ไม่ใช่กลุ่มที่ต้องการ' });
    return { turns, thoughts, outcome: 'closed', result: 'ไม่ใช่ผู้ซื้อ-จัดการถูก' };
  }
  // dropped: silent after the bot's second reply, then one nudge, then one follow-up reply
  thoughts.push({ turn: 2, interest: 2, action: 'silent', thought: 'ยังไม่อยากเล่าเรื่องการโทร' });
  turns.push({ role: 'bot', text: '(ผ่านไป 1 วัน)\nสวัสดีอีกครั้งค่ะ สนใจคุยเรื่องทีมขายต่อไหมคะ' });
  thoughts.push({ turn: 'ตาม1', interest: 2, action: 'reply', thought: 'ตอบสั้น ๆ ว่ายังไม่รีบ' });
  turns.push({ role: 'customer', text: 'ยังค่ะ ขอดูก่อน', action: 'reply' });
  turns.push({ role: 'bot', text: 'ได้ค่ะ เดี๋ยวส่งใบสรุปให้ดูก่อนนะคะ' });
  thoughts.push({ turn: 'ตาม2', interest: 1, action: 'done', thought: 'ไม่ตอบต่อแล้ว' });
  return { turns, thoughts, outcome: 'dropped', result: 'หลุดกลางทาง' };
}

function endingFor(persona, index, r) {
  if (persona.segment === 'off') return 'off';
  return ['booked', 'dropped', 'defer'][(index + r) % 3];
}

function judgeFor(persona, index, r, result) {
  const buyer = persona.segment !== 'off';
  return {
    result,
    drop_after_bot_turn: result === 'หลุดกลางทาง' ? 2 : null,
    discovery: { business: true, product: buyer && index % 4 !== 0, customers: buyer, sales_way: buyer && index % 5 !== 0 },
    savvy: 3 + ((index + r) % 3),
    leading: 2 + ((index + 2 * r) % 4),
    fit: 3 + ((index + r) % 2),
    best: 'ถามเรื่องธุรกิจก่อนเสนอ',
    worst: buyer ? 'ขอเบอร์ก่อนที่ลูกค้าจะรู้ว่าทำอะไร' : '',
    why: `ตัวอย่างเหตุผลของ ${persona.name} (ข้อมูลทดสอบ)`,
    fix: 'ให้ลูกค้าได้ถามกลับก่อนขอเบอร์',
  };
}

function leadFor(persona, index, ending) {
  const booked = ending === 'booked';
  return {
    business: 'วัสดุก่อสร้าง',
    product: 'ขายส่ง',
    customers: 'ผู้รับเหมา',
    sales_way: 'ทีมขาย 5 คน',
    discovery_asks: 2,
    phone_asks: booked ? 1 : 0,
    call_window: booked ? 'พรุ่งนี้ 14:00' : null,
    call_channel: booked && index % 2 === 0 ? 'line' : booked ? 'phone' : null,
    readiness: index % 3 === 0 ? 'สูง' : 'กลาง',
    parked: ending === 'defer',
    brief: false,
    non_buyer: ending === 'off',
  };
}

function convoRow(label, persona, index, r) {
  const ending = endingFor(persona, index, r);
  const chat = chatFor(persona, ending);
  const gavePhone = ending === 'booked';
  return {
    run_label: label,
    persona_id: persona.id,
    persona_name: persona.name,
    segment: persona.segment,
    entry: index % 2 === 0 ? 'ดูคลิป TikTok' : 'แอด Meta',
    opener: 'สนใจทีมขายค่ะ',
    outcome: chat.outcome,
    gave_phone: gavePhone,
    booked: ending === 'booked',
    turns: chat.turns,
    thoughts: chat.thoughts,
    lead: leadFor(persona, index, ending),
    judge: judgeFor(persona, index, r, chat.result),
  };
}

function summarize(rows) {
  const buyers = rows.filter((row) => row.segment !== 'off');
  const off = rows.filter((row) => row.segment === 'off');
  const avg = (list, pick) => (list.length ? list.reduce((sum, row) => sum + pick(row), 0) / list.length : null);
  const judged = (list) => list.map((row) => row.judge).filter(Boolean);
  const last = (row) => row.thoughts.at(-1)?.interest ?? 0;
  return {
    buyers: buyers.length,
    gave_phone: buyers.filter((row) => row.gave_phone).length,
    phone_and_time: buyers.filter((row) => row.booked).length,
    deferred: buyers.filter((row) => row.judge?.result === 'ลูกค้าขอดูก่อน').length,
    dropped: buyers.filter((row) => row.outcome === 'dropped').length,
    discovery_full: buyers.filter((row) => Object.values(row.judge?.discovery ?? {}).every(Boolean)).length,
    savvy_avg: Number(avg(judged(buyers), (j) => j.savvy)?.toFixed(2)),
    leading_avg: Number(avg(judged(buyers), (j) => j.leading)?.toFixed(2)),
    fit_avg: Number(avg(judged(buyers), (j) => j.fit)?.toFixed(2)),
    interest_end_avg: Number(avg(rows, last).toFixed(2)),
    nonbuyer_ok: off.filter((row) => row.judge?.result === 'ไม่ใช่ผู้ซื้อ-จัดการถูก').length,
    nonbuyer_total: off.length,
    intro_repeat: rows.length % 3,
  };
}

/**
 * Full fixture: 8 full runs over the persona set, 3 trial runs over persona 01, one pick run over every persona.
 * @param {{ picks?: boolean, personaCount?: number }} options  picks:false → the empty state
 */
export function makeFixture({ picks = true, personaCount = 37 } = {}) {
  const personas = makePersonas(personaCount);
  const convos = [];
  const runs = [];
  FULL_LABELS.forEach((label, r) => {
    const rows = personas.map((persona, index) => convoRow(label, persona, index, r));
    convos.push(...rows);
    runs.push({
      label, pack_id: PACK_ID, ran_at: `2026-10-${pad(6 + r)}T09:00:00+07:00`, sim_model: 'sim-model', judge_model: 'judge-model',
      persona_count: personas.length, partial: false, version_note: VERSION_NOTE[label], summary: summarize(rows),
    });
  });
  TRIAL_LABELS.forEach((label, r) => {
    const rows = [convoRow(label, personas[0], 0, r)];
    convos.push(...rows);
    runs.push({
      label, pack_id: PACK_ID, ran_at: `2026-10-0${1 + r}T09:00:00+07:00`, sim_model: 'sim-model', judge_model: 'judge-model',
      persona_count: 1, partial: true, version_note: VERSION_NOTE[label], summary: summarize(rows),
    });
  });
  const pickRuns = [];
  const pickRows = [];
  if (picks) {
    const labels = FULL_LABELS;
    const wins = Object.fromEntries(labels.map((label) => [label, 0]));
    const scoreTotals = Object.fromEntries(labels.map((label) => [label, 0]));
    const bySegment = {};
    let agreeCount = 0;
    personas.forEach((persona, index) => {
      const chosen = labels[(index * 3) % labels.length];
      const worst = labels[(index * 5 + 1) % labels.length] === chosen ? labels[(index * 5 + 2) % labels.length] : labels[(index * 5 + 1) % labels.length];
      const agree = index % 4 !== 0;
      const codexPick = agree ? chosen : labels[(index * 7 + 2) % labels.length] === chosen ? labels[(index * 7 + 3) % labels.length] : labels[(index * 7 + 2) % labels.length];
      const scores = Object.fromEntries(labels.map((label, k) => [label, Math.min(4, (index + k * 2) % 5)]));
      const probs = Object.fromEntries(labels.map((label) => [label, label === chosen ? 0.4 : 0.6 / (labels.length - 1)]));
      wins[chosen] += 1;
      if (agree) agreeCount += 1;
      for (const label of labels) scoreTotals[label] += scores[label];
      bySegment[persona.segment] ??= Object.fromEntries(labels.map((label) => [label, 0]));
      bySegment[persona.segment][chosen] += 1;
      pickRows.push({
        pick_run_id: PICK_RUN_ID, persona_id: persona.id, persona_name: persona.name, segment: persona.segment,
        chosen_label: chosen, probs, scores,
        reasoning: { why: `ตัวอย่างเหตุผลที่ jev เลือก ${chosen} ให้ ${persona.name}`, vs_worst: `เทียบกับ ${worst} ที่ทำให้เสียเวลา`, worst_label: worst, lesson: 'เรียงคำถามให้ตรงกับที่ลูกค้าเล่า', agree, codex_pick: agree ? null : codexPick },
      });
    });
    pickRuns.push({
      id: PICK_RUN_ID, pack_id: PACK_ID, picker_model: 'jev', reason_model: 'codex-test-model', run_labels: labels,
      ran_at: '2026-10-13T08:00:00+07:00', cost_usd: 1.23,
      summary: {
        wins, agree_rate: agreeCount / personas.length,
        avg_scores: Object.fromEntries(labels.map((label) => [label, Number((scoreTotals[label] / personas.length).toFixed(2))])),
        by_segment: bySegment,
        codex: {
          headline: 'persona อยากเห็นว่าบอทรู้จักธุรกิจก่อนขอเบอร์',
          findings: ['รอบ final ได้เบอร์มากที่สุดในกลุ่มผู้ซื้อ', 'คนที่หลุดส่วนใหญ่ถูกขอเบอร์ก่อนรู้ว่าทำอะไร'],
          next: ['เก็บคำถามเรื่องธุรกิจให้ครบก่อนขอเบอร์', 'ทดสอบกลุ่ม off ซ้ำ'],
        },
      },
    });
  }
  return { personas, runs, convos, pickRuns, picks: pickRows };
}
