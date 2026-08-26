import assert from 'node:assert/strict';
import {
  buildPaymentPayload,
  documentDefaultPackage,
  paymentStatusAfter,
  validatePaymentInput,
} from '../src/scripts/dashboard/payment-contract.ts';

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${message}`);
  }
}

console.log('\n[1] Payment payload preserves the owner-confirmed sale');
check(
  JSON.stringify(buildPaymentPayload({
    document_id: 'doc-1',
    package: 'AI consulting\nAdd-on workshop',
    amount_thb: 34900,
    tax_mode: 'cash',
    purchased_at: '2026-08-11T03:23:02.000Z',
    note: 'paid in full',
    mark_paid: true,
  })) === JSON.stringify({
    p_document_id: 'doc-1',
    p_package: 'AI consulting\nAdd-on workshop',
    p_amount_thb: 34900,
    p_tax_mode: 'cash',
    p_purchased_at: '2026-08-11T03:23:02.000Z',
    p_note: 'paid in full',
    p_mark_paid: true,
  }),
  'maps editable payment fields to the database RPC contract',
);

console.log('\n[2] Payment state reflects cumulative actual receipts');
check(paymentStatusAfter(10000, 34900) === 'partial', 'keeps a partly paid document open');
check(paymentStatusAfter(34900, 34900) === 'paid', 'closes a fully paid document');
check(
  paymentStatusAfter(30000, 34900, true) === 'paid',
  'closes a discounted sale when the owner confirms payment is complete',
);
check(
  paymentStatusAfter(30000, 34900, false) === 'partial',
  'keeps an installment open when the owner marks it as partial',
);

console.log('\n[3] Document defaults preserve every quoted line item');
check(
  documentDefaultPackage([
    { seq: 2, description: 'Add-on workshop' },
    { seq: 1, description: 'AI consulting' },
  ]) === 'AI consulting\nAdd-on workshop',
  'sorts quoted items by sequence before pre-filling the editable sale',
);

console.log('\n[4] Invalid payments are rejected before any database call');
check(
  validatePaymentInput({ package: '', amount_thb: 34900, tax_mode: 'cash', purchased_at: '2026-08-11T03:23:02.000Z' }) === 'package_required',
  'rejects an empty package',
);
check(
  validatePaymentInput({ package: 'AI consulting', amount_thb: 0, tax_mode: 'cash', purchased_at: '2026-08-11T03:23:02.000Z' }) === 'amount_required',
  'rejects a zero amount',
);
check(
  validatePaymentInput({ package: 'AI consulting', amount_thb: 34900, tax_mode: 'cash', purchased_at: '' }) === 'received_at_required',
  'rejects a missing received date',
);
check(
  validatePaymentInput({ package: 'AI consulting', amount_thb: 34900, tax_mode: 'cash', purchased_at: '2026-08-11T03:23:02.000Z' }) === null,
  'accepts a complete payment',
);

console.log(`\n${'─'.repeat(48)}\nผ่าน ${passed} · ไม่ผ่าน ${failed}\n`);
process.exit(failed === 0 ? 0 : 1);
