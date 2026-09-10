// Doc Center — Supabase data layer (reads view client_docs_all · writes client_docs + bucket client-docs)
//
// ทำไมอ่านจาก view: เอกสารของ doc-bot (`documents`) กับสำเนาบัตร (`id_copies`) อยู่ตารางเดิม ห้ามแตะ
// (docs/CRM-SSOT.md ข้อ 5) → view รวมให้หน้าเดียวเห็นครบ โดย doc-bot ไม่ต้องรู้จัก Doc Center เลย
// Spec: claude-code repo → docs/superpowers/specs/2026-09-10-doc-center-design.md
import { supabase, getSupabaseSession } from '../dashboard/supabase';
import { KIND_META, storageKey, thaiYear, periodOf, canHardDelete, type DocKind, type DocRow, type LeadLite, type PurchaseLite } from './logic';

export const BUCKET = 'client-docs';
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const IMAGE_MAX_SIDE = 1600;
const IMAGE_TARGET_BYTES = 300 * 1024;

async function requireSession() {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  return session;
}

export async function loadAll(): Promise<{ docs: DocRow[]; leads: LeadLite[]; purchases: PurchaseLite[] }> {
  await requireSession();
  const [docRes, leadRes, purRes] = await Promise.all([
    supabase.from('client_docs_all').select('*').order('doc_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(2000),
    supabase.from('leads').select('id,company_name,full_name,nickname,tax_id,deal_outcome,pipeline_status,lifetime_value_thb,last_purchase_at').order('company_name', { ascending: true, nullsFirst: false }),
    supabase.from('purchases').select('id,lead_id,amount_thb,purchased_at,document_id').order('purchased_at', { ascending: false }),
  ]);
  if (docRes.error) throw new Error(docRes.error.message);
  if (leadRes.error) throw new Error(leadRes.error.message);
  if (purRes.error) throw new Error(purRes.error.message);
  return {
    docs: (docRes.data || []).map(normalizeRow),
    leads: (leadRes.data || []) as LeadLite[],
    purchases: (purRes.data || []) as PurchaseLite[],
  };
}

function normalizeRow(r: Record<string, unknown>): DocRow {
  const kind = (KIND_META[r.kind as DocKind] ? r.kind : 'other') as DocKind;
  return {
    id: String(r.id), lead_id: (r.lead_id as string) ?? null, kind, direction: (r.direction as DocRow['direction']) || KIND_META[kind].direction,
    title: String(r.title || ''), doc_number: (r.doc_number as string) ?? null, doc_date: (r.doc_date as string) ?? null,
    amount_thb: r.amount_thb == null ? null : Number(r.amount_thb), wht_amount_thb: r.wht_amount_thb == null ? null : Number(r.wht_amount_thb),
    wht_rate: r.wht_rate == null ? null : Number(r.wht_rate), payer_name: (r.payer_name as string) ?? null, payer_tax_id: (r.payer_tax_id as string) ?? null,
    tax_year: r.tax_year == null ? null : Number(r.tax_year), tax_period: (r.tax_period as DocRow['tax_period']) ?? null, filed_at: (r.filed_at as string) ?? null,
    bucket: String(r.bucket || BUCKET), storage_path: (r.storage_path as string) ?? null, preview_path: (r.preview_path as string) ?? null,
    external_url: (r.external_url as string) ?? null, mime: (r.mime as string) ?? null, size_bytes: r.size_bytes == null ? null : Number(r.size_bytes),
    source: String(r.source || ''), is_pii: Boolean(r.is_pii), expires_at: (r.expires_at as string) ?? null, confirmed_at: (r.confirmed_at as string) ?? null,
    notes: (r.notes as string) ?? null, created_at: String(r.created_at || ''), origin: (r.origin as DocRow['origin']) || 'client_docs',
    archived_at: (r.archived_at as string) ?? null, archive_reason: (r.archive_reason as string) ?? null,
  };
}

/** ลิงก์เปิดไฟล์ — signed 1 ชม. (ลิงก์ที่หมดอายุเองคือค่าเริ่มต้นของเอกสารลูกค้า) · เอกสารที่ชี้ลิงก์นอกเปิดตรง */
export async function openUrl(doc: DocRow, expiresIn = 3600): Promise<string> {
  if (doc.external_url && !doc.storage_path) return doc.external_url;
  if (!doc.storage_path) throw new Error('เอกสารนี้ไม่มีไฟล์แนบ');
  const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(doc.storage_path, expiresIn);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'สร้างลิงก์ไม่ได้');
  return data.signedUrl;
}

export async function previewUrls(docs: DocRow[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const byBucket = new Map<string, DocRow[]>();
  for (const d of docs) {
    const path = d.preview_path || (d.mime?.startsWith('image/') ? d.storage_path : null);
    if (!path) continue;
    byBucket.set(d.bucket, [...(byBucket.get(d.bucket) || []), { ...d, preview_path: path }]);
  }
  for (const [bucket, rows] of byBucket) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(rows.map((r) => r.preview_path as string), 3600);
    (data || []).forEach((s, i) => { if (s?.signedUrl) out.set(rows[i].id, s.signedUrl); });
  }
  return out;
}

// ---------- upload ----------
export interface UploadInput {
  file: File;
  lead_id: string | null;
  kind: DocKind;
  title: string;
  doc_number?: string | null;
  doc_date?: string | null;
  amount_thb?: number | null;
  wht_amount_thb?: number | null;
  wht_rate?: number | null;
  payer_name?: string | null;
  payer_tax_id?: string | null;
  notes?: string | null;
  external_url?: string | null;
  expires_at?: string | null;
}

/** บีบรูปจากมือถือให้ ≤ ~300 KB ก่อนขึ้น Storage (สลิป 3 MB × 500 ใบ/ปี = 1.5 GB · บีบแล้ว 150 MB) — PDF ผ่านตรง */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= IMAGE_TARGET_BYTES || typeof createImageBitmap !== 'function') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    let quality = 0.82; let blob: Blob | null = null;
    for (let i = 0; i < 3; i++) {
      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
      if (!blob || blob.size <= IMAGE_TARGET_BYTES) break;
      quality -= 0.12;
    }
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
  } catch { return file; }
}

async function sha256(file: Blob): Promise<string | null> {
  try { const buf = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
  catch { return null; }
}

export async function uploadDoc(input: UploadInput, onStep?: (s: string) => void): Promise<DocRow> {
  await requireSession();
  if (input.file.size > MAX_UPLOAD_BYTES) throw new Error(`ไฟล์ใหญ่เกิน ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB — ลดขนาดก่อน`);
  onStep?.('กำลังบีบไฟล์…');
  const file = await compressImage(input.file);
  const hash = await sha256(file);
  if (hash) {
    const dup = await supabase.from('client_docs').select('id,title,doc_date').eq('sha256', hash).limit(1);
    if (dup.data?.length) throw new Error(`ไฟล์นี้อยู่ในแฟ้มแล้ว — "${dup.data[0].title}"`);
  }
  const path = storageKey(input.lead_id, input.kind, file.name);
  onStep?.('กำลังอัปโหลด…');
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (up.error) throw new Error(`อัปโหลดไม่สำเร็จ: ${up.error.message}`);
  const meta = KIND_META[input.kind];
  const row = {
    lead_id: input.lead_id, kind: input.kind, direction: meta.direction, title: input.title.trim().slice(0, 200),
    doc_number: input.doc_number?.trim() || null, doc_date: input.doc_date || null,
    amount_thb: input.amount_thb ?? null, wht_amount_thb: input.wht_amount_thb ?? null, wht_rate: input.wht_rate ?? null,
    payer_name: input.payer_name?.trim() || null, payer_tax_id: input.payer_tax_id?.replace(/\D/g, '') || null,
    tax_year: input.kind === 'wht_cert' || input.kind === 'tax_filing' ? thaiYear(input.doc_date) : null,
    tax_period: input.kind === 'wht_cert' || input.kind === 'tax_filing' ? periodOf(input.doc_date) : null,
    bucket: BUCKET, storage_path: path, mime: file.type || null, size_bytes: file.size, sha256: hash,
    source: 'web-upload', is_pii: Boolean(meta.pii), expires_at: input.expires_at || (meta.pii ? new Date(Date.now() + 365 * 86400000).toISOString() : null),
    notes: input.notes?.trim() || null, external_url: input.external_url?.trim() || null, confirmed_at: new Date().toISOString(),
  };
  onStep?.('กำลังลงทะเบียน…');
  const ins = await supabase.from('client_docs').insert(row).select('*').single();
  if (ins.error) {
    await supabase.storage.from(BUCKET).remove([path]);   // ไม่ทิ้งไฟล์กำพร้า
    throw new Error(`ลงทะเบียนไม่สำเร็จ: ${ins.error.message}`);
  }
  return normalizeRow({ ...ins.data, origin: 'client_docs', preview_path: null });
}

export async function updateDoc(id: string, patch: Partial<Pick<DocRow, 'title' | 'kind' | 'lead_id' | 'doc_number' | 'doc_date' | 'amount_thb' | 'wht_amount_thb' | 'wht_rate' | 'payer_name' | 'payer_tax_id' | 'filed_at' | 'notes' | 'expires_at' | 'tax_year' | 'tax_period' | 'confirmed_at'>>): Promise<void> {
  await requireSession();
  const { error } = await supabase.from('client_docs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** ลบ = ย้ายไป Archive (ปันสั่ง 2026-09-10) — ไฟล์ยังอยู่ · กู้คืนได้ · ใบที่ doc-bot ออกต้อง void ทาง doc-bot */
export async function archiveDoc(doc: DocRow, reason = 'ย้ายไป Archive จาก Doc Center'): Promise<void> {
  await requireSession();
  if (doc.origin !== 'client_docs') throw new Error('ใบที่ doc-bot ออก ให้ void ผ่าน doc-bot (redo/void) — จะมาอยู่ใน Archive เอง');
  const { error } = await supabase.from('client_docs').update({ archived_at: new Date().toISOString(), archive_reason: reason.slice(0, 200) }).eq('id', doc.id);
  if (error) throw new Error(error.message);
}

export async function restoreDoc(doc: DocRow): Promise<void> {
  await requireSession();
  if (doc.origin !== 'client_docs') throw new Error('ใบที่ doc-bot void แล้วกู้คืนไม่ได้ — ออกใหม่ด้วย redo ใน doc-bot');
  const { error } = await supabase.from('client_docs').update({ archived_at: null, archive_reason: null }).eq('id', doc.id);
  if (error) throw new Error(error.message);
}

/** ลบถาวร — จาก Archive เท่านั้น · ลบไฟล์ใน Storage ด้วย · ใบที่ doc-bot ออกลบไม่ได้ (เลขที่รันต้องคงอยู่) */
export async function hardDeleteDoc(doc: DocRow): Promise<void> {
  await requireSession();
  if (!canHardDelete(doc)) throw new Error(doc.origin === 'client_docs' ? 'ต้องย้ายไป Archive ก่อน แล้วค่อยลบถาวรจากที่นั่น' : 'ใบที่ doc-bot ออกลบถาวรไม่ได้ — void แล้วเก็บไว้ตามกฎหมาย');
  if (doc.storage_path) await supabase.storage.from(doc.bucket).remove([doc.storage_path]);
  const { error } = await supabase.from('client_docs').delete().eq('id', doc.id);
  if (error) throw new Error(error.message);
}

/** ✅ ยืนยันเอกสารที่เข้ามาทางท่ออัตโนมัติ (Telegram) — ชนิด/ลูกค้า/ยอดถูกแล้ว */
export async function confirmDoc(id: string): Promise<void> {
  await requireSession();
  const { error } = await supabase.from('client_docs').update({ confirmed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export function downloadText(name: string, text: string, mime = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
