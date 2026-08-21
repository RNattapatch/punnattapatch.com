#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// migrate-prices — one-time: ราคาแพ็กเกจที่ hardcode ใน "body" บทความ → {{price:key}}
//
//   - ข้าม frontmatter (YAML) เสมอ — token ใช้ใน YAML ไม่ได้ (จะ leak เข้า meta tag)
//   - 7 ตัวเลขเฉพาะเจาะจง (29,900/39,900/44,900/49,900/52,800/54,900/59,900)
//     → แทนทันที (ตัวเลขพวกนี้ไม่เคยเป็นตัวอย่างประกอบ = ราคาแพ็กเกจแน่นอน)
//   - ตัวเลขกลม (฿65,000 sprint, ฿45,000 stale=package-a) → แทนเฉพาะบรรทัดที่มี
//     service-context · บรรทัดอื่น report ไว้ให้ตรวจมือ (อาจเป็นตัวอย่างประกอบ)
//
//   ใช้:  node scripts/migrate-prices.mjs
// ─────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');

const UNCONDITIONAL = {
  '฿29,900': 'ai-workshop-basic',
  '฿39,900': 'ai-workshop-advance',
  '฿44,900': 'sale-training-bundle',
  '฿49,900': 'tiktok-workshop',
  '฿52,800': 'sale-training-regular',
  '฿54,900': 'package-a',
  '฿59,900': 'tiktok-workshop-regular',
};
// ตัวเลขกลม: ฿65,000 = sprint ปัจจุบัน · ฿45,000 = ราคา Consult Package เก่า (stale → package-a ฿54,900)
const GATED = { '฿65,000': 'sales-system-sprint', '฿45,000': 'package-a' };
const CTX = /\/services|Sprint|Sales System|Consult|Package|Workshop|workshop|อบรม|แพ็กเกจ|แพคเกจ/;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

let total = 0;
const skipped = [];

for (const file of walk(CONTENT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let fmEnd = -1;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) if (lines[i] === '---') { fmEnd = i; break; }
  }
  let changed = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i <= fmEnd) continue; // ข้าม frontmatter
    let line = lines[i];
    for (const [amt, key] of Object.entries(UNCONDITIONAL)) {
      if (line.includes(amt)) {
        changed += line.split(amt).length - 1;
        line = line.split(amt).join(`{{price:${key}}}`);
      }
    }
    for (const [amt, key] of Object.entries(GATED)) {
      while (line.includes(amt)) {
        if (CTX.test(line)) {
          changed += 1;
          line = line.replace(amt, `{{price:${key}}}`);
        } else {
          skipped.push(`${relative(ROOT, file)}:${i + 1}  ${amt} (no service context → ตรวจมือ)`);
          break;
        }
      }
    }
    lines[i] = line;
  }
  if (changed) {
    writeFileSync(file, lines.join('\n'));
    total += changed;
    console.log(`  ${relative(ROOT, file)}: ${changed} → token`);
  }
}

console.log(`\n✅ migrated ${total} package price(s) → {{price}} token (body only · frontmatter ข้าม)`);
if (skipped.length) {
  console.log(`\n⚠️  ${skipped.length} ข้าม (ตรวจมือ — อาจเป็นตัวอย่างประกอบ ไม่ใช่ราคาแพ็กเกจ):`);
  skipped.forEach((s) => console.log('  ' + s));
}
