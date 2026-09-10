/**
 * Doc Center — กติกาที่ต้องไม่เพี้ยน: ตราประทับ "ขาดอะไร" ต่อดีล · รอบภาษี 50 ทวิ · ช่องว่างที่ถูกหักแต่ไม่มีใบ · CSV · เดาชนิดจากชื่อไฟล์
 * Usage: node tests/docs-center-logic.test.mjs
 */
import { checklistFor, missingCount, taxBuckets, whtGaps, whtCsv, guessKind, isJuristic, storageKey, searchDocs, thaiYear, periodOf, leadName } from '../src/scripts/docs/logic.ts';

let pass = 0, fail = 0;
const check = (c, m) => { c ? (pass++, console.log(`  ✅ ${m}`)) : (fail++, console.log(`  ❌ ${m}`)); };

const juristic = { id: 'L1', company_name: 'บริษัท ตัวอย่าง จำกัด', full_name: 'คุณเอ', nickname: null, tax_id: '0105555061861', deal_outcome: 'won', pipeline_status: 'Proposal Sent', lifetime_value_thb: 34900, last_purchase_at: '2026-09-01' };
const person = { id: 'L2', company_name: null, full_name: 'คุณบี', nickname: 'บี', tax_id: '1103900048085', deal_outcome: 'won', pipeline_status: null, lifetime_value_thb: 9900, last_purchase_at: '2026-08-20' };
const open = { id: 'L3', company_name: 'ยังคุยอยู่', full_name: null, nickname: null, tax_id: null, deal_outcome: 'in_progress', pipeline_status: 'Discovery Call', lifetime_value_thb: null, last_purchase_at: null };
const doc = (o) => ({ id: o.id || Math.random().toString(36).slice(2), lead_id: null, kind: 'other', direction: 'in', title: 't', doc_number: null, doc_date: null, amount_thb: null, wht_amount_thb: null, wht_rate: null, payer_name: null, payer_tax_id: null, tax_year: null, tax_period: null, filed_at: null, bucket: 'client-docs', storage_path: 'x', preview_path: null, external_url: null, mime: null, size_bytes: null, source: 'web-upload', is_pii: false, expires_at: null, confirmed_at: null, notes: null, created_at: '2026-09-10T00:00:00Z', origin: 'client_docs', ...o });

console.log('\n📁 Doc Center logic\n');

// ── ตราประทับต่อดีล ──
{
  const items = checklistFor(juristic, [doc({ lead_id: 'L1', kind: 'quotation' }), doc({ lead_id: 'L1', kind: 'payment_slip' })], [{ id: 'P1', lead_id: 'L1', amount_thb: 34900, purchased_at: '2026-09-01', document_id: null }]);
  const by = Object.fromEntries(items.map((i) => [i.kind, i.state]));
  check(by.quotation === 'have' && by.payment_slip === 'have', 'ดีลปิดแล้ว: QO + สลิป ที่มี = ประทับแล้ว');
  check(by.receipt === 'missing' && by.wht_cert === 'missing' && by.sow === 'missing', 'นิติบุคคลปิดดีล: ใบเสร็จ · 50 ทวิ · SOW ยังไม่มี = ขาด');
  check(missingCount(items) === 3, 'นับขาด 3');
  const p = Object.fromEntries(checklistFor(person, [], []).map((i) => [i.kind, i.state]));
  check(p.wht_cert === 'na' && p.receipt === 'missing', 'บุคคลธรรมดา: 50 ทวิ ไม่เกี่ยว แต่ใบเสร็จยังต้องมี');
  const o = checklistFor(open, [], []);
  check(o.every((i) => i.state === 'na'), 'ดีลยังไม่ปิด = ยังไม่ถึงขั้น ไม่ขึ้นธงขาด');
  check(isJuristic('0105555061861') && !isJuristic('1103900048085') && !isJuristic(null), 'นิติบุคคล = 13 หลักขึ้นต้น 0');
}

// ── รอบภาษี ──
{
  const docs = [
    doc({ id: 'w1', lead_id: 'L1', kind: 'wht_cert', doc_date: '2026-05-20', amount_thb: 34900, wht_amount_thb: 1047, payer_name: 'บริษัท ตัวอย่าง จำกัด', payer_tax_id: '0105555061861', doc_number: 'WHT-001' }),
    doc({ id: 'w2', lead_id: 'L1', kind: 'wht_cert', doc_date: '2026-09-02', amount_thb: 69900, wht_amount_thb: 2097, filed_at: '2026-09-09T00:00:00Z' }),
    doc({ id: 'w3', lead_id: 'L1', kind: 'wht_cert', tax_year: 2568, tax_period: 'H2', doc_date: '2025-11-01', amount_thb: 10000, wht_amount_thb: 300 }),
    doc({ id: 'r1', lead_id: 'L1', kind: 'receipt', doc_date: '2026-09-02', amount_thb: 69900 }),
  ];
  const b = taxBuckets(docs);
  check(b.map((x) => `${x.year}-${x.period}`).join(' ') === '2569-H2 2569-H1 2568-H2', `เรียงงวดใหม่→เก่า (${b.map((x) => `${x.year}-${x.period}`).join(' ')})`);
  check(b[0].income === 69900 && b[0].wht === 2097 && b[0].filed === 1, 'รวมยอดต่องวด + นับที่ยื่นแล้ว');
  check(b[2].year === 2568 && b[2].period === 'H2', 'ใช้ tax_year/tax_period ที่ใส่มือก่อน ถ้ามี');
  check(thaiYear('2026-03-05') === 2569 && periodOf('2026-06-30') === 'H1' && periodOf('2026-07-01') === 'H2', 'ปี พ.ศ. + งวดครึ่งปี');
  const csv = whtCsv(b[1].rows, [juristic]);
  check(csv.startsWith('﻿') && csv.includes('ปีภาษี,งวด') && csv.includes('WHT-001') && csv.includes('34900,1047'), 'CSV มี BOM + หัวตาราง + ยอด');
  check(csv.split('\r\n').at(-1).includes('รวม') && csv.split('\r\n').at(-1).includes('34900'), 'บรรทัดสุดท้าย = รวม');
  const now = new Date('2026-09-10').getTime();
  const gaps = whtGaps([juristic, person], docs, [
    { id: 'P1', lead_id: 'L1', amount_thb: 69900, purchased_at: '2026-09-01', document_id: null },
    { id: 'P2', lead_id: 'L1', amount_thb: 50000, purchased_at: '2026-01-10', document_id: null },
    { id: 'P3', lead_id: 'L2', amount_thb: 9900, purchased_at: '2026-08-20', document_id: null },
  ], now);
  check(gaps.length === 1 && gaps[0].purchase.id === 'P2' && gaps[0].expectedWht === 1500, 'ช่องว่าง: ซื้อ ม.ค. ไม่มีใบใน 120 วัน = ขาด · ก.ย. มีใบแล้ว · บุคคลธรรมดาไม่นับ');
}

// ── เดาชนิด / ชื่อไฟล์ ──
{
  check(guessKind('50ทวิ_บจก.ตัวอย่าง.pdf') === 'wht_cert' && guessKind('WHT-2569.pdf') === 'wht_cert', 'ชื่อไฟล์มี 50ทวิ/WHT → ใบหัก ณ ที่จ่าย');
  check(guessKind('slip_kbank.jpg') === 'payment_slip' && guessKind('IMG_4021.jpg', 'image/jpeg') === 'payment_slip', 'สลิป · รูปจากกล้อง → สลิป');
  check(guessKind('QO-2026-08-005.pdf') === 'quotation' && guessKind('Proposal_v2.docx') === 'proposal' && guessKind('course-outline-3day.docx') === 'course_outline', 'QO · proposal · outline');
  check(guessKind('random.zip') === 'other', 'ไม่รู้จัก = อื่นๆ');
  const key = storageKey('L1', 'wht_cert', 'ใบหัก ณ ที่จ่าย บจก.pdf', new Date('2026-09-10T03:04:05Z'));
  check(/^L1\/wht_cert\/2026\/20260910030405-[a-zA-Z0-9-]*\.pdf$/.test(key), `storage key ไม่มีไทย/ช่องว่าง (${key})`);
  check(storageKey(null, 'tax_filing', 'ภงด90.pdf').startsWith('_pun/tax_filing/'), 'ไม่ผูกลูกค้า → โฟลเดอร์ _pun');
  const found = searchDocs([doc({ id: 'a', lead_id: 'L1', title: 'สลิป', amount_thb: 34920 }), doc({ id: 'b', lead_id: 'L2', title: 'อื่น', doc_number: 'INV-2026-09-001' })], [juristic, person], '34,920');
  check(found.length === 1 && found[0].id === 'a', 'ค้นด้วยยอดเงิน (มี comma) เจอใบที่ยอดตรง');
  check(searchDocs([doc({ id: 'b', lead_id: 'L2', title: 'อื่น', doc_number: 'INV-2026-09-001' })], [person], 'inv-2026')[0]?.id === 'b', 'ค้นเลขใบไม่สนตัวพิมพ์');
  check(leadName(juristic) === 'บริษัท ตัวอย่าง จำกัด' && leadName(person) === 'คุณบี' && leadName(null) === 'ไม่ผูกลูกค้า', 'ชื่อแฟ้ม: บริษัทก่อน ชื่อคน แล้ว null');
}

console.log(`\n${pass} passed · ${fail} failed\n`);
process.exit(fail ? 1 : 0);
