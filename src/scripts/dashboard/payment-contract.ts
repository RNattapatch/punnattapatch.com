export type TaxMode = 'cash' | 'wht_3' | 'vat_7';

export type PaymentInput = {
  document_id: string;
  package: string;
  amount_thb: number;
  tax_mode: TaxMode;
  purchased_at: string;
  note?: string;
  mark_paid?: boolean;
};

export type PaymentValidationError = 'package_required' | 'amount_required' | 'received_at_required' | 'tax_mode_invalid';

export function buildPaymentPayload(input: PaymentInput) {
  return {
    p_document_id: input.document_id,
    p_package: input.package.trim(),
    p_amount_thb: input.amount_thb,
    p_tax_mode: input.tax_mode,
    p_purchased_at: input.purchased_at,
    p_note: input.note?.trim() || null,
    p_mark_paid: input.mark_paid !== false,
  };
}

export function paymentStatusAfter(totalPaid: number, documentTotal: number, paymentComplete = false): 'partial' | 'paid' {
  return paymentComplete || totalPaid + 0.005 >= documentTotal ? 'paid' : 'partial';
}

export function documentDefaultPackage(items: Array<{ seq: number; description: string }>): string {
  return items
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((item) => item.description.trim())
    .filter(Boolean)
    .join('\n');
}

export function validatePaymentInput(input: Omit<PaymentInput, 'document_id' | 'note'>): PaymentValidationError | null {
  if (!input.package.trim()) return 'package_required';
  if (!Number.isFinite(input.amount_thb) || input.amount_thb <= 0) return 'amount_required';
  if (!input.purchased_at) return 'received_at_required';
  if (!['cash', 'wht_3', 'vat_7'].includes(input.tax_mode)) return 'tax_mode_invalid';
  return null;
}
