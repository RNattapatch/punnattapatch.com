/**
 * onAuthed — every WarRoomGate app must boot exactly once, whether the gate fires before or after the page module loads.
 * Usage: node tests/on-authed.test.mjs
 */
let pass = 0, fail = 0;
const check = (c, m) => { c ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

// minimal DOM: an event target + one app element with a class list
function fakeDom(hidden) {
  const target = new EventTarget();
  const cls = new Set(hidden ? ['hidden'] : []);
  globalThis.document = {
    addEventListener: target.addEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    getElementById: (id) => (id === 'app' ? { classList: { contains: (c) => cls.has(c) } } : null),
  };
  return { reveal: () => { cls.delete('hidden'); document.dispatchEvent(new Event('x:authed')); } };
}
const { onAuthed } = await import('../src/scripts/dashboard/on-authed.ts');

console.log('\n🔐 onAuthed\n');
{ // normal order: page loads first, gate restores session later
  const d = fakeDom(true); let n = 0;
  onAuthed('app', 'x:authed', () => n++);
  check(n === 0, 'waits while the app is still hidden');
  d.reveal();
  check(n === 1, 'boots on the gate event');
}
{ // the 2026-11-01 bug: gate already revealed the app and fired before the page module loaded
  fakeDom(false); let n = 0;
  onAuthed('app', 'x:authed', () => n++);
  check(n === 1, 'boots when the event was missed but the app is already revealed');
}
{ // revealed AND an event arrives afterwards (e.g. a second sign-in): still once
  fakeDom(false); let n = 0;
  onAuthed('app', 'x:authed', () => n++);
  document.dispatchEvent(new Event('x:authed'));
  check(n === 1, 'never boots twice');
}
{ // wrong / missing element: rely on the event only, no crash
  const d = fakeDom(true); let n = 0;
  onAuthed('missing', 'x:authed', () => n++);
  check(n === 0, 'missing app element does not boot early');
  d.reveal();
  check(n === 1, 'still boots on the event');
}
console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail) process.exit(1);
