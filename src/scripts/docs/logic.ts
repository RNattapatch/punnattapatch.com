// Doc Center — pure logic (no DOM, no network) · tested by tests/docs-center-logic.test.mjs
//
// ทำไมแยกไฟล์: กติกา "ขาดอะไร" · รอบภาษี · การเดาชนิดจากชื่อไฟล์ · CSV 50 ทวิ ต้องทดสอบได้โดยไม่เปิดเบราว์เซอร์
// และต้องใช้ซ้ำในลิ้นชัก lead ของ CRM ได้ (ท่าเดียวกับ dashboard-range.ts)
// Spec: claude-code repo → docs/superpowers/specs/2026-09-10-doc-center-design.md

export type DocKind =
  | 'quotation' | 'invoice' | 'receipt' | 'proposal' | 'course_outline' | 'sow' | 'rate_card'
  | 'payment_slip' | 'wht_cert' | 'purchase_order' | 'vendor_form'
  | 'company_cert' | 'vat_cert' | 'id_card_customer' | 'id_copy_pun'
  | 'contract' | 'nda' | 'pdpa_consent' | 'service_terms'
  | 'deliverable' | 'handover_kit' | 'workflow_map' | 'training_material' | 'access_sheet'
  | 'meeting_note' | 'testimonial' | 'proof_asset' | 'expense_receipt' | 'tax_filing' | 'other';

export type DocGroup = 'sales' | 'money_in' | 'identity' | 'agreement' | 'delivery' | 'relationship' | 'money_out' | 'tax';

export interface KindMeta { label: string; glyph: string; group: DocGroup; direction: 'in' | 'out' | 'both'; pii?: boolean; money?: boolean }

// glyph = อักษรย่อบนตราประทับ ไม่ใช้ emoji เพราะต้องดูเป็น "ตรา" เหมือนกันทุกใบ
export const KIND_META: Record<DocKind, KindMeta> = {
  quotation: { label: 'ใบเสนอราคา', glyph: 'QO', group: 'sales', direction: 'out', money: true },
  invoice: { label: 'ใบแจ้งหนี้', glyph: 'INV', group: 'sales', direction: 'out', money: true },
  receipt: { label: 'ใบเสร็จรับเงิน', glyph: 'RC', group: 'sales', direction: 'out', money: true },
  proposal: { label: 'Proposal', glyph: 'PR', group: 'sales', direction: 'out' },
  course_outline: { label: 'Course outline', glyph: 'CO', group: 'sales', direction: 'out' },
  sow: { label: 'ขอบเขตงาน (SOW)', glyph: 'SOW', group: 'sales', direction: 'out' },
  rate_card: { label: 'Rate card', glyph: 'RATE', group: 'sales', direction: 'out' },
  payment_slip: { label: 'สลิปโอนเงิน', glyph: 'SLIP', group: 'money_in', direction: 'in', money: true },
  wht_cert: { label: 'ใบหัก ณ ที่จ่าย (50 ทวิ)', glyph: '50ทวิ', group: 'money_in', direction: 'in', money: true },
  purchase_order: { label: 'ใบสั่งซื้อ (PO)', glyph: 'PO', group: 'money_in', direction: 'in', money: true },
  vendor_form: { label: 'แบบฟอร์มขึ้นทะเบียนผู้ขาย', glyph: 'VEND', group: 'money_in', direction: 'in' },
  company_cert: { label: 'หนังสือรับรองบริษัท', glyph: 'CERT', group: 'identity', direction: 'in', pii: true },
  vat_cert: { label: 'ภ.พ.20', glyph: 'VAT', group: 'identity', direction: 'in', pii: true },
  id_card_customer: { label: 'สำเนาบัตร ปชช. ลูกค้า', glyph: 'ID', group: 'identity', direction: 'in', pii: true },
  id_copy_pun: { label: 'สำเนาบัตร ปชช. ปัน (ออกให้ลูกค้า)', glyph: 'ID', group: 'identity', direction: 'out', pii: true },
  contract: { label: 'สัญญาบริการ', glyph: 'CTR', group: 'agreement', direction: 'both' },
  nda: { label: 'NDA', glyph: 'NDA', group: 'agreement', direction: 'both' },
  pdpa_consent: { label: 'ความยินยอม PDPA', glyph: 'PDPA', group: 'agreement', direction: 'in' },
  service_terms: { label: 'เงื่อนไขบริการที่ตกลง', glyph: 'TERM', group: 'agreement', direction: 'both' },
  deliverable: { label: 'ไฟล์งานส่งมอบ', glyph: 'DLV', group: 'delivery', direction: 'out' },
  handover_kit: { label: 'Handover kit', glyph: 'KIT', group: 'delivery', direction: 'out' },
  workflow_map: { label: 'แผนผัง workflow', glyph: 'MAP', group: 'delivery', direction: 'out' },
  training_material: { label: 'เอกสารอบรม', glyph: 'TRN', group: 'delivery', direction: 'out' },
  access_sheet: { label: 'ลิงก์ที่เก็บรหัส/สิทธิ์ (ไม่เก็บรหัสตรง)', glyph: 'KEY', group: 'delivery', direction: 'out', pii: true },
  meeting_note: { label: 'สรุปประชุม / บันทึกคอล', glyph: 'MTG', group: 'relationship', direction: 'out' },
  testimonial: { label: 'รีวิว / VOC ที่ขออนุญาตแล้ว', glyph: 'VOC', group: 'relationship', direction: 'in' },
  proof_asset: { label: 'ภาพหน้างาน (เบลอแล้ว)', glyph: 'IMG', group: 'relationship', direction: 'out' },
  expense_receipt: { label: 'ใบเสร็จค่าใช้จ่ายของดีลนี้', glyph: 'EXP', group: 'money_out', direction: 'in', money: true },
  tax_filing: { label: 'แบบยื่นภาษี / ใบเสร็จสรรพากร', glyph: 'TAX', group: 'tax', direction: 'both', money: true },
  other: { label: 'อื่นๆ', glyph: 'DOC', group: 'relationship', direction: 'both' },
};

export const GROUP_LABEL: Record<DocGroup, string> = {
  sales: 'ออกให้ลูกค้า', money_in: 'การเงินขาเข้า', identity: 'ตัวตนลูกค้า', agreement: 'สัญญา/ข้อตกลง',
  delivery: 'ส่งมอบงาน', relationship: 'ความสัมพันธ์', money_out: 'ค่าใช้จ่ายของดีล', tax: 'ภาษี',
};

export const KINDS: DocKind[] = Object.keys(KIND_META) as DocKind[];

export interface DocRow {
  id: string;
  lead_id: string | null;
  kind: DocKind;
  direction: 'in' | 'out' | 'both';
  title: string;
  doc_number: string | null;
  doc_date: string | null;          // YYYY-MM-DD
  amount_thb: number | null;
  wht_amount_thb: number | null;
  wht_rate: number | null;
  payer_name: string | null;
  payer_tax_id: string | null;
  tax_year: number | null;          // พ.ศ.
  tax_period: 'H1' | 'H2' | null;
  filed_at: string | null;
  bucket: string;
  storage_path: string | null;
  preview_path: string | null;
  external_url: string | null;
  mime: string | null;
  size_bytes: number | null;
  source: string;
  is_pii: boolean;
  expires_at: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  origin: 'client_docs' | 'documents' | 'id_copies';
}

export interface LeadLite {
  id: string;
  company_name: string | null;
  full_name: string | null;
  nickname: string | null;
  tax_id: string | null;
  deal_outcome: string | null;
  pipeline_status: string | null;
  lifetime_value_thb: number | null;
  last_purchase_at: string | null;
}

export interface PurchaseLite { id: string; lead_id: string | null; amount_thb: number | null; purchased_at: string | null; document_id: string | null }

export const leadName = (l: LeadLite | null | undefined): string =>
  l ? (l.company_name?.trim() || l.full_name?.trim() || l.nickname?.trim() || 'ไม่ระบุชื่อ') : 'ไม่ผูกลูกค้า';

/** นิติบุคคลไทย = เลขผู้เสียภาษี 13 หลักขึ้นต้น 0 — ฝั่งนี้คือกลุ่มที่ "หัก ณ ที่จ่าย" แล้วต้องส่งใบ 50 ทวิ */
export const isJuristic = (taxId: string | null | undefined): boolean => /^0\d{12}$/.test((taxId || '').replace(/\D/g, ''));

export const thaiYear = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const y = Number(String(iso).slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y + 543 : null;
};
export const periodOf = (iso: string | null | undefined): 'H1' | 'H2' | null => {
  if (!iso) return null;
  const m = Number(String(iso).slice(5, 7));
  return m >= 1 && m <= 6 ? 'H1' : m >= 7 && m <= 12 ? 'H2' : null;
};

/** เดาชนิดจากชื่อไฟล์/ข้อความ — แค่ตั้งค่าเริ่มต้นในฟอร์ม ปันแก้ได้เสมอ */
export function guessKind(name: string, mime = ''): DocKind {
  const n = name.toLowerCase();
  if (/50\s*ทวิ|wht|withhold|หัก\s*ณ|หักภาษี/.test(n)) return 'wht_cert';
  if (/slip|สลิป|โอน|transfer|payment/.test(n)) return 'payment_slip';
  if (/^qo|quot|ใบเสนอ|quotation/.test(n)) return 'quotation';
  if (/^inv|invoice|ใบแจ้งหนี้|ใบวางบิล/.test(n)) return 'invoice';
  if (/receipt|ใบเสร็จ|^rc/.test(n)) return 'receipt';
  if (/\bpo\b|purchase.?order|ใบสั่งซื้อ/.test(n)) return 'purchase_order';
  if (/proposal|ข้อเสนอ/.test(n)) return 'proposal';
  if (/outline|หลักสูตร|course/.test(n)) return 'course_outline';
  if (/sow|scope|ขอบเขต|แนบท้าย/.test(n)) return 'sow';
  if (/contract|สัญญา/.test(n)) return 'contract';
  if (/nda/.test(n)) return 'nda';
  if (/หนังสือรับรอง|affidavit|dbd/.test(n)) return 'company_cert';
  if (/ภ\.?พ\.?\s*20|vat/.test(n)) return 'vat_cert';
  if (/บัตร|id.?card|citizen/.test(n)) return 'id_card_customer';
  if (/handover|kit/.test(n)) return 'handover_kit';
  if (/workflow|flow/.test(n)) return 'workflow_map';
  if (/testimonial|review|รีวิว/.test(n)) return 'testimonial';
  if (/expense|ค่าใช้จ่าย/.test(n)) return 'expense_receipt';
  if (/ภงด|pnd|ภ\.ง\.ด/.test(n)) return 'tax_filing';
  if (mime.startsWith('image/')) return 'payment_slip';   // รูปจากกล้องมือถือส่วนใหญ่คือสลิปที่ลูกค้ายื่นให้
  return 'other';
}

export function guessTitle(kind: DocKind, lead: LeadLite | null, docDate: string | null, fileName: string): string {
  const who = lead ? leadName(lead) : '';
  const when = docDate ? new Date(docDate).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }) : '';
  const base = `${KIND_META[kind].label}${when ? ` ${when}` : ''}${who ? ` — ${who}` : ''}`;
  return kind === 'other' ? fileName.replace(/\.[a-z0-9]+$/i, '') : base;
}

// ---------- "ขาดอะไร" ต่อดีล ----------
export type ChecklistState = 'have' | 'missing' | 'na';
export interface ChecklistItem { kind: DocKind; state: ChecklistState; why?: string }

const WON = new Set(['won', 'repeat', 'retainer']);

/**
 * ตรา 5 ดวงบนหัวแฟ้ม: QO · สลิป · ใบเสร็จ · 50 ทวิ · SOW/outline
 * na = ยังไม่ถึงขั้นที่ต้องมี (ดีลยังไม่ปิด) หรือไม่เกี่ยว (บุคคลธรรมดาไม่หัก ณ ที่จ่าย)
 */
export function checklistFor(lead: LeadLite, docs: DocRow[], purchases: PurchaseLite[] = []): ChecklistItem[] {
  const has = (k: DocKind | DocKind[]) => docs.some((d) => (Array.isArray(k) ? k : [k]).includes(d.kind));
  const closed = WON.has(lead.deal_outcome || '') || purchases.length > 0;
  const juristic = isJuristic(lead.tax_id);
  return [
    { kind: 'quotation', state: has('quotation') ? 'have' : closed ? 'missing' : 'na', why: 'ราคา/ขอบเขตที่ตกลง' },
    { kind: 'payment_slip', state: has('payment_slip') ? 'have' : closed ? 'missing' : 'na', why: 'หลักฐานรับเงิน' },
    { kind: 'receipt', state: has('receipt') ? 'have' : closed ? 'missing' : 'na', why: 'ยื่นภาษีเงินได้' },
    { kind: 'wht_cert', state: has('wht_cert') ? 'have' : closed && juristic ? 'missing' : 'na', why: juristic ? 'นิติบุคคลหัก 3% ต้องส่งใบ' : 'บุคคลธรรมดาไม่หัก' },
    { kind: 'sow', state: has(['sow', 'course_outline', 'proposal']) ? 'have' : closed ? 'missing' : 'na', why: 'ขอบเขตงานที่ส่งจริง' },
  ];
}

export const missingCount = (items: ChecklistItem[]) => items.filter((i) => i.state === 'missing').length;

// ---------- รอบภาษี ----------
export interface TaxRow extends DocRow { year: number; period: 'H1' | 'H2' }
export interface TaxBucket { year: number; period: 'H1' | 'H2'; rows: TaxRow[]; income: number; wht: number; filed: number }

export function taxBuckets(docs: DocRow[]): TaxBucket[] {
  const map = new Map<string, TaxBucket>();
  for (const d of docs) {
    if (d.kind !== 'wht_cert') continue;
    const year = d.tax_year ?? thaiYear(d.doc_date);
    const period = d.tax_period ?? periodOf(d.doc_date);
    if (!year || !period) continue;
    const key = `${year}-${period}`;
    const b = map.get(key) ?? { year, period, rows: [], income: 0, wht: 0, filed: 0 };
    b.rows.push({ ...d, year, period });
    b.income += Number(d.amount_thb || 0);
    b.wht += Number(d.wht_amount_thb || 0);
    if (d.filed_at) b.filed += 1;
    map.set(key, b);
  }
  return [...map.values()].sort((a, b) => (b.year - a.year) || (a.period < b.period ? 1 : -1));
}

/** ดีลที่ถูกหัก 3% แต่ยังไม่มีใบ 50 ทวิ — วัดจาก purchases ของลูกค้านิติบุคคลที่ไม่มี wht_cert หลังวันซื้อ */
export interface WhtGap { lead: LeadLite; purchase: PurchaseLite; expectedWht: number; daysSince: number }
export function whtGaps(leads: LeadLite[], docs: DocRow[], purchases: PurchaseLite[], now = Date.now()): WhtGap[] {
  const byLead = new Map(leads.map((l) => [l.id, l]));
  const out: WhtGap[] = [];
  for (const p of purchases) {
    const lead = p.lead_id ? byLead.get(p.lead_id) : null;
    if (!lead || !isJuristic(lead.tax_id) || !p.purchased_at) continue;
    const t = new Date(p.purchased_at).getTime();
    // ใบ 50 ทวิ ออก ณ วันจ่ายหรือหลังจากนั้น (ปกติภายในเดือน) — ใบที่ลงวันที่ก่อนซื้อคือของดีลก่อนหน้า ไม่นับ
    const covered = docs.some((d) => { if (d.kind !== 'wht_cert' || d.lead_id !== lead.id || !d.doc_date) return false; const dt = new Date(d.doc_date).getTime() - t; return dt >= -7 * 86400000 && dt <= 120 * 86400000; });
    if (covered) continue;
    out.push({ lead, purchase: p, expectedWht: Math.round(Number(p.amount_thb || 0) * 0.03), daysSince: Math.floor((now - t) / 86400000) });
  }
  return out.sort((a, b) => b.daysSince - a.daysSince);
}

export function whtCsv(rows: TaxRow[], leads: LeadLite[]): string {
  const byLead = new Map(leads.map((l) => [l.id, l]));
  const esc = (v: unknown) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = ['ปีภาษี', 'งวด', 'วันที่ในใบ', 'ผู้จ่าย/ผู้หัก', 'เลขผู้เสียภาษีผู้จ่าย', 'ลูกค้าใน CRM', 'เลขที่ใบ', 'เงินได้ (บาท)', 'ภาษีหัก (บาท)', 'อัตรา', 'ยื่นแล้วเมื่อ', 'ไฟล์'];
  const lines = rows.map((r) => [r.year, r.period, r.doc_date, r.payer_name || leadName(byLead.get(r.lead_id || '')), r.payer_tax_id || byLead.get(r.lead_id || '')?.tax_id || '', leadName(byLead.get(r.lead_id || '')), r.doc_number, r.amount_thb ?? '', r.wht_amount_thb ?? '', r.wht_rate ?? '', r.filed_at ? r.filed_at.slice(0, 10) : '', r.storage_path || r.external_url || ''].map(esc).join(','));
  const total = ['', '', '', 'รวม', '', '', '', rows.reduce((s, r) => s + Number(r.amount_thb || 0), 0), rows.reduce((s, r) => s + Number(r.wht_amount_thb || 0), 0), '', '', ''].map(esc).join(',');
  return '﻿' + [head.join(','), ...lines, total].join('\r\n');
}

/** ชื่อไฟล์ใน bucket — ไม่มีอักษรไทย/ช่องว่าง (Storage key ปลอดภัย) แต่ยังบอกได้ว่าอะไร */
export function storageKey(leadId: string | null, kind: DocKind, fileName: string, now = new Date()): string {
  const ext = (fileName.match(/\.([a-z0-9]{2,5})$/i)?.[1] || 'bin').toLowerCase();
  const stem = fileName.replace(/\.[a-z0-9]{2,5}$/i, '').normalize('NFKD').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `${leadId || '_pun'}/${kind}/${now.getUTCFullYear()}/${ts}-${stem}.${ext}`;
}

export const fmtBaht = (n: number | null | undefined) => n == null ? '—' : `฿${Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
export const fmtDate = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
export const fmtSize = (b: number | null | undefined) => b == null ? '' : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function searchDocs(docs: DocRow[], leads: LeadLite[], q: string): DocRow[] {
  const s = q.trim().toLowerCase();
  if (!s) return docs;
  const byLead = new Map(leads.map((l) => [l.id, l]));
  const num = Number(s.replace(/[,฿]/g, ''));
  return docs.filter((d) => {
    const lead = d.lead_id ? byLead.get(d.lead_id) : null;
    const hay = [d.title, d.doc_number, d.payer_name, d.notes, lead?.company_name, lead?.full_name, lead?.nickname, KIND_META[d.kind]?.label].filter(Boolean).join(' ').toLowerCase();
    if (hay.includes(s)) return true;
    return Number.isFinite(num) && num > 0 && (Number(d.amount_thb) === num || Number(d.wht_amount_thb) === num);
  });
}
