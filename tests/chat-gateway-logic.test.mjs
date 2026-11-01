/**
 * Chat Single Gateway — rules that must not drift: unread · hold · filters · draft limits · tags · send gate · outbox display
 * Usage: node tests/chat-gateway-logic.test.mjs
 */
import {
  CHANNEL_META, isUnread, holdUntil, filterContacts, fmtWhen, checkDraft, parseTags, canSend, heartbeatAge, quotaText,
  visibleOutbox, displayName, initialOf, MAX_MESSAGE,
  BOT_MODES, fmtSize, checkUpload, safeName, uploadPath, isImage, pathsToSign, mapsUrl, MAX_UPLOAD_BYTES,
} from '../src/scripts/gateway/logic.ts';

let pass = 0, fail = 0;
const check = (c, m) => { c ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const NOW = Date.parse('2026-11-01T05:00:00Z');
const U = 'U' + 'b'.repeat(32);
const c = (o = {}) => ({ id: 'c1', channel: 'line', external_id: U, display_name: 'คุณเอ', picture_url: null, lead_id: null, tags: [], last_message_at: '2026-11-01T04:00:00Z', last_in_at: '2026-11-01T04:00:00Z', last_preview: 'สนใจคลาส', last_read_at: null, bot_hold_until: null, ...o });
const alive = { heartbeat: new Date(NOW - 10_000).toISOString(), bot_mode: 'guard', quota: { type: 'limited', limit: 15000, used: 12 } };

console.log('\n📨 Chat Single Gateway logic\n');

// unread
check(isUnread(c()), 'never read + customer wrote = unread');
check(!isUnread(c({ last_read_at: '2026-11-01T04:30:00Z' })), 'read after last inbound = read');
check(isUnread(c({ last_read_at: '2026-11-01T03:00:00Z' })), 'new inbound after reading = unread again');
check(!isUnread(c({ last_in_at: null })), 'no inbound = never unread');

// hold
check(holdUntil(c({ bot_hold_until: '2026-11-01T06:00:00Z' }), NOW) instanceof Date, 'future hold is active');
check(holdUntil(c({ bot_hold_until: '2026-11-01T04:00:00Z' }), NOW) === null, 'expired hold is ignored');

// filters
const list = [c({ id: 'a' }), c({ id: 'b', last_read_at: '2026-11-01T04:30:00Z', lead_id: 'L1', tags: ['ร้อน'] }), c({ id: 'h', last_read_at: '2026-11-01T04:30:00Z', bot_hold_until: '2026-11-01T06:00:00Z', display_name: 'Anna' })];
check(filterContacts(list, 'unread', '', NOW).map((x) => x.id).join() === 'a', 'view unread');
check(filterContacts(list, 'held', '', NOW).map((x) => x.id).join() === 'h', 'view held');
check(filterContacts(list, 'crm', '', NOW).map((x) => x.id).join() === 'b', 'view in CRM');
check(filterContacts(list, 'all', 'ร้อน', NOW).map((x) => x.id).join() === 'b', 'search matches tags');
check(filterContacts(list, 'all', 'anna', NOW).map((x) => x.id).join() === 'h', 'search is case-insensitive on names');

// time (Bangkok)
check(fmtWhen('2026-11-01T04:00:00Z', new Date(NOW)).includes('11'), 'same Bangkok day shows clock (11:00)');
check(fmtWhen('2026-10-31T04:00:00Z', new Date(NOW)) === 'เมื่อวาน', 'previous Bangkok day = เมื่อวาน');
check(fmtWhen(null) === '', 'no time = empty');

// draft
check(checkDraft('  สวัสดีครับ  ').ok && checkDraft('  สวัสดีครับ  ').body === 'สวัสดีครับ', 'draft is trimmed');
check(!checkDraft('   ').ok, 'blank draft refused');
check(!checkDraft('x'.repeat(MAX_MESSAGE + 1)).ok, 'over 2000 chars refused (DB check matches)');
check(checkDraft('x'.repeat(MAX_MESSAGE)).ok, 'exactly 2000 chars allowed');

// tags
check(JSON.stringify(parseTags('ร้อน, in-house ,ร้อน,,  รอ  ใบเสนอราคา ')) === JSON.stringify(['ร้อน', 'in-house', 'รอ ใบเสนอราคา']), 'tags trimmed, deduped, spaces collapsed');
check(parseTags(Array.from({ length: 30 }, (_, i) => `t${i}`).join(',')).length === 20, 'max 20 tags (DB check matches)');
check(parseTags('x'.repeat(50))[0].length === 30, 'tag capped at 30 chars');

// send gate — the UI must not let a message sit silently in the queue
check(canSend(alive, c(), NOW).ok, 'alive mini + LINE customer who wrote = can send');
check(!canSend(alive, null, NOW).ok, 'no chat selected = cannot send');
check(!canSend({ ...alive, heartbeat: new Date(NOW - 5 * 60_000).toISOString() }, c(), NOW).ok, 'stale heartbeat blocks send');
check(!canSend(null, c(), NOW).ok, 'no status yet blocks send');
check(!canSend({ ...alive, send_off: true }, c(), NOW).ok, 'gw_send_off blocks send');
check(!canSend(alive, c({ last_in_at: null }), NOW).ok, 'cannot cold-message someone who never wrote');
check(!canSend(alive, c({ channel: 'messenger' }), NOW).ok, 'Messenger not sendable in phase 1');
check(heartbeatAge(alive, NOW) === 10_000, 'heartbeat age in ms');

// misc
check(quotaText(alive).includes('12') && quotaText(alive).includes('15,000'), 'quota text shows used / limit');
check(quotaText(null) === 'ยังไม่รู้โควตา push', 'quota unknown');
check(visibleOutbox([{ kind: 'text', status: 'sent' }, { kind: 'text', status: 'failed' }, { kind: 'hold', status: 'pending' }, { kind: 'text', status: 'pending' }]).length === 2, 'outbox shows only unsent/failed text');
check(displayName(c({ display_name: null })) === 'ลูกค้า LINE', 'fallback name');
check(initialOf(c({ display_name: 'คุณเอ' })) === 'อ', 'initial skips คุณ and the leading vowel');
check(initialOf(c({ display_name: 'anna' })) === 'A', 'latin initial uppercased');
check(/^#[0-9a-f]{6}$/.test(CHANNEL_META.line.accent) && CHANNEL_META.line.accent !== CHANNEL_META.messenger.accent, 'each channel has its own accent');

// round 2: attachments · files · blocked · modes
check(!isUnread(c({ blocked: true })), 'blocked customer never counts as unread');
check(filterContacts([c({ id: 'x', blocked: true }), c({ id: 'y' })], 'all', '', NOW, true).map((x) => x.id).join() === 'y', 'hide blocked filter');
check(filterContacts([c({ id: 'x', blocked: true }), c({ id: 'y' })], 'all', '', NOW, false).length === 2, 'show blocked when toggle off');
check(fmtSize(512) === '512 B' && fmtSize(2048) === '2 KB' && fmtSize(5 * 1024 * 1024) === '5.0 MB' && fmtSize(null) === '', 'file sizes');
check(checkUpload({ name: 'a.pdf', size: 10 }) === null, 'normal upload ok');
check(/ว่าง/.test(checkUpload({ name: 'a.pdf', size: 0 })), 'empty upload refused');
check(/25 MB/.test(checkUpload({ name: 'big.mov', size: MAX_UPLOAD_BYTES + 1 })), 'over 25 MB refused (bucket cap matches)');
check(safeName('สัญญา เช่า.pdf') === 'สัญญา_เช่า.pdf', 'Thai file names keep vowels and tone marks');
check(safeName('../../etc/passwd') === 'etc_passwd', 'no path traversal in names');
check(uploadPath('C1', 'ab12', 'ใบเสนอราคา.pdf') === 'upload/C1/ab12-ใบเสนอราคา.pdf', 'upload path matches the RLS rule upload/<contact>/');
check(isImage('image/png') && !isImage('application/pdf') && !isImage(null), 'image mime detection');
const sigMsgs = [{ media: { path: 'line/u/1.jpg' } }, { media: { sticker_url: 'https://x' } }, { media: null }, { media: { path: 'line/u/1.jpg' } }];
check(JSON.stringify(pathsToSign(sigMsgs, [{ path: 'upload/c/a.pdf' }, { path: 'line/u/2.png' }], (p) => p === 'line/u/2.png')) === JSON.stringify(['line/u/1.jpg', 'upload/c/a.pdf']), 'sign only storage paths not cached, deduped');
check(mapsUrl(13.73, 100.58) === 'https://www.google.com/maps?q=13.73%2C100.58', 'maps link');
check(BOT_MODES.map((m) => m.id).join() === 'off,shadow,review,guard', 'mode buttons = the bot\'s 4 modes (DB check matches)');

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) process.exit(1);
