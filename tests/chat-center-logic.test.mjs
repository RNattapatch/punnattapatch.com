import test from 'node:test';
import assert from 'node:assert/strict';

import {
  keywordConflicts,
  renderTokens,
  validateChatCenter,
  validateSnippet,
} from '../src/scripts/chat/logic.ts';

const catalog = {
  packages: [
    { key: 'inhouse-a', amount_thb: 34900, bot_may_quote: true },
    { key: 'manual-price', amount_thb: 19900, bot_may_quote: false },
  ],
};

const snippet = (body, extra = {}) => ({
  offer_code: 'T1', slot: 'b1', channel: 'any', body, faq_q: null, status: 'live', ...extra,
});
const offer = (extra = {}) => ({ code: 'T1', pricing_key: 'inhouse-a', enabled: true, ...extra });
const keyword = (extra = {}) => ({
  id: crypto.randomUUID(), keyword: 'SALES PSYCHOLOGY', aliases: ['sales psychology'],
  aliases_exact: ['ทีมขาย'], match_mode: 'contains', enabled: true, ...extra,
});
const payload = (extra = {}) => JSON.stringify({
  services: { T1: { name: 'T1', keywords: ['SALES PSYCHOLOGY'], tags: ['T1'], enabled: true, blocks: { b1: 'หนึ่งค่ะ', b2: 'สองค่ะ' }, faq: [] } },
  ...extra,
});
const center = (extra = {}) => ({
  offers: [offer()], snippets: [snippet('หนึ่งค่ะ'), snippet('สองค่ะ', { slot: 'b2' })],
  keywords: [keyword()], payload: payload(), ...extra,
});
const codes = (result) => result.issues.map((issue) => issue.code);

test('renderTokens: price token renders comma-formatted digits without adding ฿', () => {
  assert.equal(renderTokens('ค่าคลาส ฿{{price:inhouse-a}} ค่ะ', catalog), 'ค่าคลาส ฿34,900 ค่ะ');
});

test('renderTokens: unresolved price token is rejected instead of leaking into customer copy', () => {
  assert.throws(() => renderTokens('{{price:missing-key}}', catalog), /missing-key/);
});

test('G01 pass: every enabled offer has live b1 and b2', () => {
  assert.equal(validateChatCenter(center(), catalog).valid, true);
});

test('G01 fail: enabled offer missing b2 is blocked', () => {
  const result = validateChatCenter(center({ snippets: [snippet('หนึ่งค่ะ')] }), catalog);
  assert.ok(codes(result).includes('G01_REQUIRED_SLOTS'));
});

test('G02 pass: female bot voice without ครับ is accepted', () => {
  assert.equal(validateSnippet(snippet('รับทราบค่ะ'), catalog).valid, true);
});

test('G02 fail: ครับ is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('รับทราบครับ'), catalog)).includes('G02_BOT_VOICE'));
});

test('G03 pass: ordinary copy is outside the ten banned phrases', () => {
  assert.equal(validateSnippet(snippet('ทีมจะได้แบบฝึกกลับไปใช้ค่ะ'), catalog).valid, true);
});

test('G03 fail: every banned phrase is detected', () => {
  const banned = ['ใบกำกับภาษี', 'การันตี', 'รับประกันผล', 'เจ้าเดียว', 'คนแรก', 'สูตรลับ', 'ใช้ได้กับทุกธุรกิจ', 'สร้างยอดทันที', 'Lifetime Support', 'ลดคนได้แน่นอน'];
  for (const phrase of banned) assert.ok(codes(validateSnippet(snippet(`${phrase} ค่ะ`), catalog)).includes('G03_BANNED_TERM'), phrase);
});

test('G04 pass: คอร์ส in named competitor context is accepted', () => {
  assert.equal(validateSnippet(snippet('คอร์สของ อ.เบิร์ด ใช้เป็นตัวอย่างคู่แข่งค่ะ'), catalog).valid, true);
});

test('G04 fail: คอร์ส outside competitor context is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('สมัครคอร์สนี้ได้ค่ะ'), catalog)).includes('G04_CLASS_NAMING'));
});

test('G05 pass: body at or below 1,200 characters has no length issue', () => {
  assert.equal(codes(validateSnippet(snippet('ก'.repeat(1200)), catalog)).includes('G05_LENGTH_WARNING'), false);
});

test('G05 fail: body over 1,900 characters is blocked', () => {
  const result = validateSnippet(snippet('ก'.repeat(1901)), catalog);
  assert.ok(codes(result).includes('G05_LENGTH_BLOCK'));
  assert.equal(result.valid, false);
});

test('G05 warning: body from 1,201 through 1,900 is warned but remains valid', () => {
  const result = validateSnippet(snippet('ก'.repeat(1201)), catalog);
  assert.ok(codes(result).includes('G05_LENGTH_WARNING'));
  assert.equal(result.valid, true);
});

test('G06 pass: every price token resolves against catalog', () => {
  assert.equal(validateSnippet(snippet('{{price:inhouse-a}}'), catalog).valid, true);
});

test('G06 fail: missing catalog key is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('{{price:no-such-key}}'), catalog)).includes('G06_PRICE_TOKEN'));
});

test('G07 pass: price token with bot_may_quote true is accepted', () => {
  assert.equal(validateSnippet(snippet('{{price:inhouse-a}}'), catalog).valid, true);
});

test('G07 fail: price token with bot_may_quote false is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('{{price:manual-price}}'), catalog)).includes('G07_PRICE_PERMISSION'));
});

test('G08 pass: tokenized product price and one-digit bonus value are accepted', () => {
  assert.equal(validateSnippet(snippet('ราคา {{price:inhouse-a}} แถมมูลค่า 4,400 บาทค่ะ'), catalog).valid, true);
});

test('G08 fail: raw product-looking price is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('ราคา 34,900 บาทค่ะ'), catalog)).includes('G08_RAW_PRICE'));
});

test('G09 pass: ordinary dates and amounts do not look like a bank account', () => {
  assert.equal(validateSnippet(snippet('เรียนวันที่ 24-25 ตุลาคม 2026 ค่ะ'), catalog).valid, true);
});

test('G09 fail: formatted bank-account number is blocked', () => {
  assert.ok(codes(validateSnippet(snippet('โอนที่เลขบัญชี 192-3-46057-4 ค่ะ'), catalog)).includes('G09_BANK_ACCOUNT'));
});

test('G09 fail: account number with spaces or no separators is blocked in bank context', () => {
  for (const value of ['192 3 46057 4', '1923460574']) {
    assert.ok(codes(validateSnippet(snippet(`เลขบัญชี ${value} ค่ะ`), catalog)).includes('G09_BANK_ACCOUNT'), value);
  }
});

test('G10 pass: contains, exact, and exact-alias stay distinct without a false conflict', () => {
  const list = [
    keyword({ id: 'contains', keyword: 'CONSULT', aliases: [], aliases_exact: [] }),
    keyword({ id: 'exact', keyword: 'ปรึกษาเรื่องราคา', aliases: [], aliases_exact: [], match_mode: 'exact' }),
    keyword({ id: 'exact-alias', keyword: 'DASHBOARD', aliases: [], aliases_exact: ['ปรึกษา'] }),
  ];
  assert.deepEqual(keywordConflicts(list), []);
});

test('G10 fail: substring collision between two contains keywords is reported', () => {
  const list = [
    keyword({ id: 'short', keyword: 'SALES', aliases: [], aliases_exact: [] }),
    keyword({ id: 'long', keyword: 'ONLINE SALES', aliases: [], aliases_exact: [] }),
  ];
  assert.equal(keywordConflicts(list).length, 1);
});

test('G10 fail: duplicate exact terms are reported while exact-alias vs contains is not', () => {
  const list = [
    keyword({ id: 'a', keyword: 'ทีมขาย', aliases: [], aliases_exact: [], match_mode: 'exact' }),
    keyword({ id: 'b', keyword: 'TEAM', aliases: ['ทีมขาย'], aliases_exact: [], match_mode: 'exact' }),
  ];
  assert.equal(keywordConflicts(list).length, 1);
});

test('G10 fail: exact-alias overlap follows the suffix rule used by the bot', () => {
  const list = [
    keyword({ id: 'alias', keyword: 'DASHBOARD', aliases: [], aliases_exact: ['ทีมขาย'] }),
    keyword({ id: 'exact', keyword: 'ทีมขาย 5 คน', aliases: [], aliases_exact: [], match_mode: 'exact' }),
  ];
  assert.equal(keywordConflicts(list).length, 1);
});

test('G11 pass: generated JSON parses and contains every enabled service', () => {
  assert.equal(validateChatCenter(center(), catalog).valid, true);
});

test('G11 fail: malformed JSON is blocked', () => {
  assert.ok(codes(validateChatCenter(center({ payload: '{bad json' }), catalog)).includes('G11_PAYLOAD_JSON'));
});

test('G11 fail: valid JSON scalar is not a service payload', () => {
  for (const scalar of ['null', '"text"', '0']) {
    assert.ok(codes(validateChatCenter(center({ payload: scalar }), catalog)).includes('G11_PAYLOAD_SERVICES'), scalar);
  }
});

test('G11 fail: parsed payload missing an enabled service is blocked', () => {
  assert.ok(codes(validateChatCenter(center({ payload: JSON.stringify({ services: {} }) }), catalog)).includes('G11_PAYLOAD_SERVICES'));
});

test('G11 fail: enabled service missing required payload fields is blocked', () => {
  const incomplete = JSON.stringify({ services: { T1: { enabled: true, blocks: { b1: 'หนึ่งค่ะ', b2: 'สองค่ะ' } } } });
  assert.ok(codes(validateChatCenter(center({ payload: incomplete }), catalog)).includes('G11_PAYLOAD_SERVICES'));
});
