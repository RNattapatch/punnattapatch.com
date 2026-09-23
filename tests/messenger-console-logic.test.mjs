/**
 * Messenger Console — rules that must not drift: login URL, OAuth return parsing, the webhook
 * field list the live bot depends on, the 24h reply window, the send body, token redaction.
 * Usage: node tests/messenger-console-logic.test.mjs
 */
import {
  APP_ID, PAGE_ID, REQUIRED_SCOPES, SUBSCRIBED_FIELDS, CONSOLE_METADATA, WINDOW_MS,
  buildLoginUrl, parseAuthReturn, permissionReport, customerOf, threadItems,
  lastCustomerAt, replyWindow, formatRemaining, buildSendBody, redactToken,
} from '../src/scripts/messenger/logic.ts';

let pass = 0, fail = 0;
const check = (c, m) => { c ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };
const throws = (fn) => { try { fn(); return false; } catch { return true; } };

console.log('\n✉️ Messenger Console logic\n');

// login URL
const u = new URL(buildLoginUrl({ redirectUri: 'https://app.punnattapatch.com/messenger', state: 's1' }));
check(u.origin === 'https://www.facebook.com' && u.pathname.endsWith('/dialog/oauth'), 'login goes to Meta\'s own OAuth dialog');
check(u.searchParams.get('client_id') === APP_ID, 'login uses app chat-bot-n8n');
check(u.searchParams.get('response_type') === 'token', 'token flow (no server secret in the browser)');
check(u.searchParams.get('redirect_uri') === 'https://app.punnattapatch.com/messenger', 'redirect URI passed through exactly');
check(u.searchParams.get('scope') === REQUIRED_SCOPES.join(','), 'without config_id: requests the 5 reviewed permissions');
const uc = new URL(buildLoginUrl({ redirectUri: 'x', state: 's', configId: '123' }));
check(uc.searchParams.get('config_id') === '123' && !uc.searchParams.has('scope'), 'with config_id: Business Login config replaces scope');
check(REQUIRED_SCOPES.length === 5, 'exactly the 5 permissions under review');

// OAuth return
const ok = parseAuthReturn('#access_token=EAAtest&expires_in=5000&state=abc', '');
check(ok.kind === 'token' && ok.token === 'EAAtest' && ok.state === 'abc' && ok.expiresIn === 5000, 'parses token from fragment');
const den = parseAuthReturn('', '?error=access_denied&error_description=Permissions+error&state=abc');
check(den.kind === 'error' && den.message === 'Permissions error' && den.state === 'abc', 'parses a denied login from the query');
check(parseAuthReturn('', '').kind === 'none', 'plain visit = no auth result');

// webhook fields — must match what the live bot subscribes (POST replaces the list)
for (const f of ['messages', 'messaging_postbacks', 'message_echoes', 'messaging_referrals', 'messaging_handovers', 'messaging_policy_enforcement']) {
  check(SUBSCRIBED_FIELDS.includes(f), `subscribe keeps "${f}"`);
}

// permissions
const rep = permissionReport([{ permission: 'pages_messaging', status: 'granted' }, { permission: 'pages_show_list', status: 'declined' }]);
check(rep.find((r) => r.scope === 'pages_messaging').granted && !rep.find((r) => r.scope === 'pages_show_list').granted, 'granted vs declined reported per scope');

// conversation helpers
const conv = { id: 't_1', participants: { data: [{ id: PAGE_ID, name: 'Pun Nattapatch' }, { id: '555', name: 'Somchai' }] } };
check(customerOf(conv).id === '555', 'customer = the participant that is not our Page');
const msgs = [
  { id: 'b', message: 'reply', created_time: '2026-09-23T10:05:00+0000', from: { id: PAGE_ID } },
  { id: 'a', message: 'hello', created_time: '2026-09-23T10:00:00+0000', from: { id: '555' } },
];
const items = threadItems(msgs);
check(items[0].id === 'a' && !items[0].fromPage && items[1].fromPage, 'thread reads oldest first, Page messages flagged');
check(lastCustomerAt(msgs) === Date.parse('2026-09-23T10:00:00+0000'), 'last inbound ignores the Page\'s own messages');

// 24h window
const t0 = Date.parse('2026-09-23T10:00:00Z');
check(replyWindow(t0, t0 + 3600_000).open, 'open 1h after the customer wrote');
check(!replyWindow(t0, t0 + WINDOW_MS + 1).open, 'closed past the window');
check(!replyWindow(0, t0).open, 'no customer message = cannot reply');
check(formatRemaining(90 * 60000) === '1h 30m' && formatRemaining(5 * 60000) === '5m', 'remaining time formatting');

// send body
const b = buildSendBody('555', '  Hi there  ');
check(b.messaging_type === 'RESPONSE' && b.recipient.id === '555' && b.message.text === 'Hi there', 'RESPONSE message to the chosen customer, trimmed');
check(b.message.metadata === CONSOLE_METADATA, 'tagged so the bot records it as a human reply');
check(throws(() => buildSendBody('555', '   ')), 'empty message refused');
check(throws(() => buildSendBody('', 'hi')), 'no recipient refused');
check(throws(() => buildSendBody('555', 'x'.repeat(2001))), 'over 2000 chars refused');

// redaction
check(!redactToken('bad token EAAGm0PX4ZCpsBAExampleTokenValue123 here').includes('ExampleTokenValue'), 'tokens never shown in error text');

console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail ? 1 : 0);
