#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// check-prices — lint guard: จับ "ราคาแพ็กเกจ" ที่ hardcode ในบทความ
//   ราคาแพ็กเกจควรเขียนเป็น {{price:<key>}} token เสมอ (เพื่อ sync กับ pricing.mjs)
//   ตัวเลขตัวอย่าง (งบ/เงินเดือน/ค่า subscription) ไม่ถูกจับ — จับเฉพาะ magnitude
//   ที่ตรงกับราคาแพ็กเกจจริงใน pricing.mjs เท่านั้น
//
//   ใช้:  node scripts/check-prices.mjs
//   exit 1 ถ้าเจอ (ใส่ใน QC gate / pre-publish ได้)
//   ตัวเลข magnitude ดึงจาก pricing.mjs → DRY (เพิ่มแพ็กเกจใหม่ ไม่ต้องแก้ script)
// ─────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRICES, PRICE_AMOUNTS } from '../src/data/pricing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');

const priceStrings = [
  ...new Set(Object.values(PRICES).map((p) => '฿' + p.amount.toLocaleString('en-US'))),
];
const priceRe = new RegExp(priceStrings.join('|'), 'g');
// Some package amounts can also appear as examples of salary bands. Those are
// not offer prices and cannot use a package token without changing meaning.
const nonPackagePriceContext = /(?:salary|Base salary|เงินเดือน|cost เริ่ม)/i;
// Explicit per-line exemption for intentional literals — append the marker to the line:
//   <!-- price:historical -->  ราคาในเนื้อเรื่อง/เคสจริงในอดีต (ตัวเลข ณ ตอนนั้น ห้าม sync)
//   <!-- price:literal -->     ตัวเลขที่บังเอิญตรงราคาแพ็กเกจแต่ไม่ใช่ SKU ใน pricing.mjs
//                              (เช่น Consult Package ฿44,900 · "save ฿25,000")
const exemptionMarker = /<!--\s*price:(?:historical|literal)\s*-->/;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

let findings = 0;
for (const file of walk(CONTENT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  // ข้าม frontmatter (YAML) — token {{price}} ใช้ใน frontmatter ไม่ได้ (remark ไม่แตะ)
  let fmEnd = -1;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) if (lines[i] === '---') { fmEnd = i; break; }
  }
  lines.forEach((line, i) => {
    if (i <= fmEnd) return;
    if (nonPackagePriceContext.test(line)) return;
    if (exemptionMarker.test(line)) return;
    const m = line.match(priceRe);
    if (m) {
      findings += m.length;
      console.log(`  ${relative(ROOT, file)}:${i + 1}  →  ${m.join(', ')}`);
    }
  });
}

// ── public/ scan — จับ "ราคาตาย" ใน static files ──────────────────────────
// ไฟล์ใต้ public/ ใช้ token ไม่ได้ (ไม่ผ่าน remark) — ราคาที่ตรง catalog ปัจจุบัน
// ถือว่าตั้งใจ (llms.txt ฯลฯ) แต่ราคา ฿X,XXX ที่ "ไม่มีใน catalog เลย" = ราคาตาย
// ที่หลุด sync (เคสจริง: lp-line-ads โชว์ ฿39,900 หลังราคาเปลี่ยนเป็น 34,900)
const PUBLIC_DIR = join(ROOT, 'public');
const validPriceSet = new Set(PRICE_AMOUNTS.map((n) => '฿' + n.toLocaleString('en-US')));
const anyPriceRe = /฿\d{1,3}(?:,\d{3})+/g;
const publicExts = ['.html', '.txt', '.xml', '.md'];
let staleFindings = 0;

function walkPublic(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkPublic(p, acc);
    else if (publicExts.some((ext) => e.name.endsWith(ext))) acc.push(p);
  }
  return acc;
}

for (const file of walkPublic(PUBLIC_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (nonPackagePriceContext.test(line)) return;
    if (exemptionMarker.test(line)) return;
    for (const m of line.match(anyPriceRe) ?? []) {
      // ต่ำกว่า ฿10,000 = ตัวเลขตัวอย่าง (งบ/subscription) ไม่ใช่ magnitude ของแพ็กเกจ
      if (Number(m.slice(1).replaceAll(',', '')) < 10000) continue;
      if (!validPriceSet.has(m)) {
        staleFindings++;
        console.log(`  ${relative(ROOT, file)}:${i + 1}  →  ${m} (ไม่มีใน catalog — ราคาตาย?)`);
      }
    }
  });
}

if (findings || staleFindings) {
  if (findings)
    console.log(
      `\n⚠️  ${findings} hardcoded package price(s) เจอในบทความ — ควรเปลี่ยนเป็น {{price:<key>}} token`
    );
  if (staleFindings)
    console.log(
      `\n⚠️  ${staleFindings} ราคาใน public/ ที่ไม่ตรง catalog — อัปเดตให้ตรง หรือแปะ <!-- price:historical --> ถ้าตั้งใจ`
    );
  console.log(`   valid keys: ${Object.keys(PRICES).join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ ไม่มีราคาแพ็กเกจ hardcode ในบทความ + public/ ตรง catalog ครบ');
}
