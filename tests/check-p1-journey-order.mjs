// §1.5 gate — the 16 journey sections of P1 must match T1's order exactly.
// Note: this build emits dist/services/<slug>.html (not <slug>/index.html), so the
// path differs from the snippet in the packet. Everything else is unchanged.
import { readFileSync, existsSync } from 'node:fs';

const candidates = [
  'dist/services/ai-sales-agent-bootcamp.html',
  'dist/services/ai-sales-agent-bootcamp/index.html',
];
const file = candidates.find((path) => existsSync(path));
if (!file) {
  console.log(`MISMATCH — page not built. looked in: ${candidates.join(' , ')}`);
  process.exit(1);
}

const html = readFileSync(file, 'utf8');
const got = [...html.matchAll(/data-journey-section="([a-z-]+)"/g)].map((match) => match[1]);
const want = ['hero', 'offer', 'logos', 'proof', 'why-now', 'spotlight', 'curriculum', 'whats-new', 'take-home', 'bonus', 'why-me', 'fit', 'instructor', 'investment', 'faq', 'final'];
const ok = got.length === want.length && got.every((section, index) => section === want[index]);

console.log(ok ? 'OK' : `MISMATCH\ngot : ${JSON.stringify(got)}\nwant: ${JSON.stringify(want)}`);
if (!ok) process.exit(1);
