/**
 * Chat Single Gateway — rules that must not drift: unread · hold · filters · draft limits · tags · send gate · outbox display
 * Usage: node tests/chat-gateway-logic.test.mjs
 */
import {
  CHANNEL_META, isUnread, holdUntil, filterContacts, fmtWhen, checkDraft, parseTags, canSend, heartbeatAge, quotaText,
  visibleOutbox, displayName, initialOf, MAX_MESSAGE,
  foldMediaEchoes, STICKER_PACKS, stickersOf, stickerUrl, attachKind, checkAttach, outPath, extOfName, canDeleteFile, MAX_ATTACH, BOT_MODES, fmtSize, checkUpload, safeName, uploadPath, isImage, pathsToSign, mapsUrl, MAX_UPLOAD_BYTES,
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

// fold the bot's own attachment notes (sequence copied from Pun's real test 2026-11-01 10:50)
{
  const M = (id, ts, dir, kind, body) => ({ id, contact_id: 'c', dir, kind, body, ts, created_by: null, media: kind === 'text' ? null : { path: 'x' } });
  const real = [
    M(1, '2026-11-01T03:50:01Z', 'in', 'sticker', '[สติกเกอร์: Rushing, Crisis, omw]'),
    M(2, '2026-11-01T03:50:02Z', 'in', 'text', '[ส่งสติกเกอร์ (Rushing/Crisis/omw)]'),
    M(3, '2026-11-01T03:50:02Z', 'bot', 'text', '[ทักกลับ + ปุ่มคีย์เวิร์ด]'),
    M(4, '2026-11-01T03:50:11Z', 'in', 'image', '[รูป]'),
    M(5, '2026-11-01T03:50:25Z', 'in', 'file', '[ไฟล์: payin.pdf]'),
    M(6, '2026-11-01T03:50:26Z', 'in', 'text', '[ส่งไฟล์]'),
    M(7, '2026-11-01T03:50:35Z', 'in', 'text', '[ลูกค้าส่งรูปมา 1 รูป — ในรูป (photo): คนยิ้มถือหมอน]'),
  ];
  const f = foldMediaEchoes(real);
  check(f.map((m) => m.id).join() === '1,3,4,5', 'sticker/file echoes and the photo note are folded away');
  check(f.find((m) => m.id === 4).caption === 'ในรูป (photo): คนยิ้มถือหมอน', 'photo note becomes the image caption (prefix stripped)');
  check(real.length === 7 && real[3].caption === undefined, 'input array is not mutated');
  const old = [M(9, '2026-10-20T01:00:00Z', 'in', 'text', '[ส่งสติกเกอร์ (ok)]'), M(10, '2026-10-20T01:00:05Z', 'in', 'text', '[ลูกค้าส่งรูปมา 2 รูป — ในรูป: ...]')];
  check(foldMediaEchoes(old).length === 2, 'history before attachments were tracked stays visible');
  const far = [M(11, '2026-11-01T03:00:00Z', 'in', 'image', '[รูป]'), M(12, '2026-11-01T03:10:00Z', 'in', 'text', '[ลูกค้าส่งรูปมา 1 รูป — x]')];
  check(foldMediaEchoes(far).length === 2, 'notes more than 2 minutes after are not folded');
  const plain = [M(13, '2026-11-01T03:00:00Z', 'in', 'image', '[รูป]'), M(14, '2026-11-01T03:00:05Z', 'in', 'text', '[ส่งมาให้ดูครับ] ราคาเท่าไหร่')];
  check(foldMediaEchoes(plain).length === 2, 'a customer text after a photo is never folded into the photo');
  const failedRead = [M(15, '2026-11-01T03:00:00Z', 'in', 'image', '[รูป]'), M(16, '2026-11-01T03:00:20Z', 'in', 'text', '[ส่งรูป 1 รูป: อ่านรูปไม่สำเร็จ]')];
  const ff = foldMediaEchoes(failedRead);
  check(ff.length === 1 && ff[0].caption === 'อ่านรูปไม่สำเร็จ', 'failed photo read becomes a caption too');
}

// round 3: sending stickers + attachments
check(STICKER_PACKS.reduce((n, p) => n + stickersOf(p).length, 0) === 456, 'sticker picker = 456 LINE-sendable stickers (same table as the mini)');
check(stickersOf([446, 1988, 2027])[39] === 2027 && stickersOf([446, 1988, 2027]).length === 40, 'pack expands to its exact range');
check(stickerUrl(52002734).endsWith('/sticker/52002734/android/sticker.png'), 'sticker image url');
check(attachKind({ type: 'image/png' }) === 'image' && attachKind({ type: 'image/heic' }) === 'file' && attachKind({ type: 'application/pdf' }) === 'file', 'HEIC/PDF go as file links, browser-readable images as LINE images');
check(checkAttach({ name: 'a.jpg', size: 10 }, MAX_ATTACH) !== null, 'max 4 attachments (LINE push = 5 messages incl. caption)');
check(checkAttach({ name: 'a.jpg', size: 10 }, 0) === null, 'attachment ok');
check(outPath('C1', 'ab12', 'JPG') === 'upload/C1/out-ab12.jpg', 'outgoing path is ASCII, under the RLS upload/<contact>/ rule');
check(outPath('C1', 'x', '../../') === 'upload/C1/out-x.bin', 'junk extension cannot escape the path');
check(extOfName('สัญญา.PDF') === 'pdf' && extOfName('noext') === 'bin', 'extension from name');
check(canDeleteFile({ source: 'upload', note: null }) && !canDeleteFile({ source: 'upload', note: 'ส่งให้ลูกค้าทางแชท' }) && !canDeleteFile({ source: 'chat', note: null }), 'sent files and chat files are evidence: no delete');
{
  const S = (id, ts, kind, body) => ({ id, contact_id: 'c', dir: 'staff', kind, body, ts, created_by: null, media: kind === 'text' ? null : { path: 'x' } });
  const sent = [S(1, '2026-11-01T05:34:01.000Z', 'sticker', '[สติกเกอร์]'), S(2, '2026-11-01T05:34:01.500Z', 'text', '[ส่งสติกเกอร์]'),
    S(3, '2026-11-01T05:34:33.000Z', 'image', '[รูป]'), S(4, '2026-11-01T05:34:33.001Z', 'file', '[ไฟล์: a.pdf]'),
    S(5, '2026-11-01T05:34:33.500Z', 'text', '[ส่งรูป 1 รูป] [ส่งไฟล์ a.pdf]'), S(6, '2026-11-01T05:34:33.600Z', 'text', 'ทดสอบส่งรูป')];
  check(foldMediaEchoes(sent).map((m) => m.id).join() === '1,3,4,6', 'staff echo lines fold into the sent attachments, caption stays');
}

// WhatsApp (round 4)
check(canSend(alive, c({ channel: 'whatsapp', external_id: 'wa_66812345678' }), NOW).ok, 'WhatsApp reply allowed inside 24h');
check(!canSend(alive, c({ channel: 'whatsapp', external_id: 'wa_66812345678', last_in_at: new Date(NOW - 25 * 3600_000).toISOString() }), NOW).ok, 'WhatsApp blocked after 24h (template only)');
check(CHANNEL_META.whatsapp.accent !== CHANNEL_META.line.accent && CHANNEL_META.whatsapp.short === 'WA', 'WhatsApp has its own teal accent');

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) process.exit(1);
