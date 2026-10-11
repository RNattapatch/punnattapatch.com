// Text signals for the Local engine.
// Signals are split into COMMON (any business) and per-business-model lexicons so a B2C promotion is
// judged with consumer words and a B2G proposal with public-sector words — not with B2B owner vocabulary.

const COMMON = Object.freeze({
  mechanismSignals: /workflow|agent|automation|prototype|diagnos|วินิจฉัย|ขั้นตอน|ระบบ|ลงมือทำ|แผน|วิธี|สูตร|เทคโนโลยี|กระบวนการ/giu,
  timeframeSignals: /วัน|สัปดาห์|เดือน|ชม\.|ชั่วโมง|นาที|hour|day|week|month|90-day|ภายใน|(?:ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย|ต\.ค|พ\.ย|ธ\.ค)\./giu,
  evidenceSignals: /กรณีศึกษา|case study|หลักฐาน|demo|result|roi|ผลลัพธ์จริง|%|เท่า|\dx\b/giu,
  priceValueSignals: /฿|บาท|\d\s*\.-|\d\s*บ\.|baht|ราคา|ส่วนลด|ลด\s*\d|ประหยัด|คุ้ม|คืนทุน|ต้นทุน|roi|free|ฟรี|แถม/giu,
  ctaClarity: /จอง|ลงทะเบียน|สมัคร|ทัก|กด|รับสิทธิ์|รับ|ดู|ดาวน์โหลด|สั่งซื้อ|ซื้อ|โทร|นัด|ตอบกลับ|ขอใบเสนอราคา|กดลิงก์|คลิก|book|register|start|get|download|comment|reply|call|shop/giu,
  urgencySignals: /วันนี้|ตอนนี้|รอบนี้|จำกัด|ถึงวันที่|ถึงสิ้นเดือน|ถึง\s*\d|หมดเขต|เหลือ\s*\d|ก่อน\s*\d|before|now|today|deadline|last/giu,
  vagueClaims: /ระดับโลก|ดีที่สุด|เปลี่ยนธุรกิจ|นวัตกรรม|สู่อนาคต|revolutionary|game.?chang|amazing|best.?in.?class|อันดับ\s*1\s*ของ|ที่สุดในโลก/giu,
  jargonSignals: /synerg|transformation|ecosystem|paradigm|บูรณาการ|ยกระดับศักยภาพ|leverage|holistic/giu,
  visualProof: /before|after|ก่อน|หลัง|demo|screen|หน้าจอ|คนจริง|product|สินค้า|subtitle|คำบรรยาย|contrast|เปรียบเทียบ|3 วินาที|ภาพจริง|วิดีโอ|video/giu,
  riskReversal: /รับประกัน|คืนเงิน|ทดลองฟรี|ทดลองใช้|ไม่มีค่าใช้จ่าย|ยกเลิกได้|ไม่ผูกมัด|guarantee|refund|trial/giu,
  personalization: /\{[^}]{1,40}\}|คุณ\S{1,20}ครับ|คุณ\S{1,20}ค่ะ|จากที่|เห็นว่า|บริษัทของคุณ|ทีมของคุณ|ร้านของคุณ|หน่วยงานของท่าน|เมื่อวาน|ที่คุยกัน/giu,
  questionSignals: /\?|ไหม|มั้ย|หรือเปล่า|หรือยัง|อย่างไร|ยังไง/giu,
  timingSignals: /เช้า|บ่าย|เย็น|ค่ำ|โมง|น\.|เวลา|ช่วง|วันจันทร์|วันศุกร์|สุดสัปดาห์|ส่งหลัง|ส่งก่อน|ตอน/giu,
});

const BY_MODEL = Object.freeze({
  b2b: Object.freeze({
    audienceSpecificity: /เจ้าของ|sme|b2b|cfo|ceo|coo|ผู้บริหาร|ฝ่ายขาย|ทีมขาย|ฝ่ายจัดซื้อ|โรงงาน|ธุรกิจครอบครัว|องค์กร|ผู้จัดการ|hr\b|ฝ่ายบัญชี/giu,
    painSignals: /ปัญหา|ค้าง|ช้า|เสียเวลา|พลาด|ซ้ำ|ตามงาน|ลูกค้าหาย|ต้นทุนสูง|excel|waste|stuck|miss/giu,
    outcomeSignals: /ลดต้นทุน|เพิ่มยอด|ยอดขาย|ปิดงาน|ปิดการขาย|เติบโต|รายได้|กำไร|pipeline|win rate|ประหยัดเวลา|ลด|เพิ่ม|grow|increase|reduce|close/giu,
    evidenceSignals: /ลูกค้า\s*b2b|ลูกค้า\s*\d|\d+\s*ทีม|\d+\s*บริษัท|อุตสาหกรรมเดียวกัน|reference/giu,
  }),
  b2c: Object.freeze({
    audienceSpecificity: /คุณแม่|คุณพ่อ|ครอบครัว|ลูกน้อย|สาย\S{1,12}|คนที่|คนทำงาน|มนุษย์เงินเดือน|นักศึกษา|วัยรุ่น|ผิวแห้ง|ผิวมัน|ผิวแพ้ง่าย|สมาชิก|ลูกค้าใหม่|ลูกค้าเก่า|คนรัก\S{0,10}|คุณผู้หญิง|คุณผู้ชาย/giu,
    painSignals: /ปัญหา|แห้ง|ลอก|เหนื่อย|แพง|รอนาน|ไม่ตรงปก|กลัว|เบื่อ|ปวด|ร้อน|หิว|ยุ่งยาก|เสียเวลา|ไม่มีเวลา|สิว|อ้วน/giu,
    outcomeSignals: /สวย|ชุ่มชื่น|อร่อย|สะดวก|ประหยัด|มั่นใจ|สบาย|ง่าย|เร็ว|ปลอดภัย|สุขภาพดี|นุ่ม|ใส|ผอม|อิ่ม|หอม|ทน/giu,
    evidenceSignals: /รีวิว|ลูกค้าจริง|ขายแล้ว|ขายไป|ดาว|★|รับประกัน|อย\.|ทดสอบ|ผ่านการรับรอง|ยอดขาย\s*\d|คนใช้แล้ว|\d+[,\d]*\s*คน/giu,
  }),
  b2g: Object.freeze({
    audienceSpecificity: /หน่วยงาน|ภาครัฐ|เทศบาล|อบต|อบจ|กรม|กระทรวง|ราชการ|ส่วนราชการ|จังหวัด|โรงพยาบาลรัฐ|รัฐวิสาหกิจ|ผู้อำนวยการ|ท้องถิ่น|สำนักงาน/giu,
    painSignals: /ปัญหา|ระเบียบ|ล่าช้า|งบประมาณจำกัด|ร้องเรียน|ตรวจสอบไม่ได้|เอกสารซ้ำ|ความเสี่ยง|ข้อพิพาท|ภาระงาน|คิวยาว|ไม่โปร่งใส/giu,
    outcomeSignals: /ประชาชน|บริการประชาชน|ตัวชี้วัด|kpi|โปร่งใส|ตรวจสอบได้|ความคุ้มค่า|ลดขั้นตอน|มาตรฐาน|ถูกระเบียบ|ลดเวลารอ|ประสิทธิภาพ|ผลสัมฤทธิ์/giu,
    evidenceSignals: /มาตรฐาน|iso|ผลงาน|อ้างอิง|หน่วยงานที่ใช้|benchmark|ผ่านการรับรอง|pdpa|audit|tor|ขึ้นทะเบียน|บัญชีนวัตกรรม/giu,
  }),
});

const BUSINESS_MODELS = new Set(Object.keys(BY_MODEL));

function count(text, pattern) {
  return (text.match(pattern) ?? []).length;
}

function clean(value) {
  return String(value ?? '').toLocaleLowerCase('th-TH').replace(/\s+/g, ' ').trim();
}

const SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('th', { granularity: 'word' })
  : null;

// Thai has no spaces between words, so `split(/\s+/)` undercounts badly. Use the platform word
// segmenter when present (Node 16+, all evergreen browsers) and fall back to a length estimate.
export function countWords(text) {
  const value = String(text ?? '').trim();
  if (!value) return 0;
  if (SEGMENTER) {
    let words = 0;
    for (const segment of SEGMENTER.segment(value)) if (segment.isWordLike) words += 1;
    return words;
  }
  return Math.max(value.split(/\s+/u).length, Math.round(value.length / 5));
}

export function normalizeCreativeText(creative) {
  return clean([
    creative.hook,
    creative.primaryText,
    creative.headline,
    creative.offer,
    creative.cta,
    creative.visualDirection,
  ].filter(Boolean).join(' '));
}

export function resolveBusinessModel(creative, fallback = 'b2b') {
  return BUSINESS_MODELS.has(creative?.businessModel) ? creative.businessModel : fallback;
}

export function extractFeatures(creative, businessModel = resolveBusinessModel(creative)) {
  const model = BY_MODEL[businessModel] ?? BY_MODEL.b2b;
  const text = normalizeCreativeText(creative);
  const hook = clean(creative.hook);
  // The message the recipient actually reads (visual direction is an instruction, not delivered copy).
  const deliveredText = clean([creative.hook, creative.primaryText, creative.headline, creative.offer, creative.cta].filter(Boolean).join(' '));
  const numericProof = (text.match(/(?:\d+[\d,.]*\s*(?:%|x|m|k|ล้าน|วัน|ชม\.|hr|คน|บาท)?|฿\s*\d+)/giu) ?? []).length;

  const features = {
    numericProof,
    wordCount: countWords(deliveredText),
    deliveredChars: deliveredText.length,
    hookChars: hook.length,
    headlineChars: clean(creative.headline).length,
    hookAudience: count(hook, model.audienceSpecificity),
    hookPain: count(hook, model.painSignals),
    hookNumbers: (hook.match(/\d/gu) ?? []).length > 0 ? 1 : 0,
  };
  for (const [name, pattern] of Object.entries(COMMON)) features[name] = count(text, pattern);
  features.audienceSpecificity = count(text, model.audienceSpecificity);
  features.painSignals = count(text, model.painSignals);
  features.outcomeSignals = count(text, model.outcomeSignals);
  features.evidenceSignals += count(text, model.evidenceSignals);
  features.completeness = ['hook', 'primaryText', 'headline', 'offer', 'cta', 'visualDirection']
    .filter((field) => String(creative[field] ?? '').trim().length >= 4).length;
  return Object.freeze(features);
}

// Persona terms (keywords first, then desired outcomes and pains) that literally appear in the message.
export function matchedPersonaTerms(creative, persona) {
  const text = normalizeCreativeText(creative);
  const terms = new Set([...(persona.keywords ?? []), ...(persona.outcomes ?? []), ...(persona.pains ?? [])]
    .map((term) => clean(term))
    .filter((term) => term.length >= 2));
  return [...terms].filter((term) => text.includes(term));
}

export function countPersonaKeywordMatches(creative, persona) {
  return matchedPersonaTerms(creative, persona).length;
}
