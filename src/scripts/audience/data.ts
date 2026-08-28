// Audience Center data layer — คนที่ "หยิบของฟรี" (BOSI quiz, ebook, checklist)
//
// แยกจาก leads เด็ดขาด: leads = คนยกมือขอคุย · audience = คนหยิบของ
// ข้อมูลไหลทางเดียว audience → leads ผ่าน promote() เท่านั้น ห้ามมีทางกลับ
// spec: claude-code repo → docs/superpowers/specs/2026-08-17-audience-center-design.md
//
// อ่านจาก view (heat score คำนวณใน SQL — ไม่คำนวณซ้ำฝั่ง client จะได้ไม่มีสองความจริง)
// เขียนลง table ตรงภายใต้ RLS owner_all เหมือน dashboard

import { supabase } from '../dashboard/supabase';

export type HeatBand = 'hot' | 'warm' | 'cold';
export type AudienceStatus = 'new' | 'nurturing' | 'promoted' | 'ignored';

export interface AssetResult {
  dominant?: string;
  scores?: Record<string, number>;
  answers?: string;
}

export interface AudiencePerson {
  id: string;
  person_key: string;
  full_name: string | null;
  company_name: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  claim_count: number;
  distinct_assets: number;
  first_seen_at: string;
  last_seen_at: string;
  status: AudienceStatus;
  owner_note: string | null;
  consent: boolean | null;
  promoted_lead_id: string | null;
  promoted_at: string | null;
  promote_reason: string | null;
  // จาก view
  last_asset: string | null;
  last_result: AssetResult | null;
  last_claim_at: string | null;
  assets_list: string | null;
  heat: number;
  heat_band: HeatBand;
  heat_breakdown: Record<string, number>;
}

export interface AudienceClaim {
  id: string;
  person_id: string;
  asset_slug: string;
  asset_result: AssetResult | null;
  own_words: string | null;
  source_page: string | null;
  utm: Record<string, string> | null;
  claimed_at: string;
}

export interface AssetStat {
  asset_slug: string;
  claims: number;
  people: number;
  with_contact: number;
  promoted: number;
  first_claim_at: string;
  last_claim_at: string;
}

export interface CompanyCluster {
  company_key: string;
  company_name: string;
  people: number;
  claims: number;
  hot_people: number;
  last_claim_at: string;
  top_person: string | null;
  top_heat: number;
}

/** ป้ายชื่อของฟรี — เพิ่มชิ้นใหม่ที่นี่ให้หน้าจออ่านออก (slug มาจาก n8n FREE_ASSETS) */
export const ASSET_LABELS: Record<string, string> = {
  'bosi-quiz': '🧬 BOSI Quiz',
  'ebook-sales-interview': '📕 E-Book 67 คำถามสัมภาษณ์เซลล์',
};
export const assetLabel = (slug: string): string => ASSET_LABELS[slug] ?? `📦 ${slug}`;

/** ชื่อเต็มของ BOSI DNA — ใช้ตอนโชว์ผลในตาราง/drawer */
export const DNA_NAMES: Record<string, string> = {
  B: 'Builder', O: 'Opportunist', S: 'Specialist', I: 'Innovator',
};

const HEAT_LABELS: Record<string, string> = {
  contact: 'ให้ช่องทางติดต่อจริง',
  company: 'ชื่อบริษัทจริง',
  role: 'ตำแหน่งคนตัดสินใจ',
  multi: 'หยิบของฟรีหลายชิ้น',
  repeat: 'กลับมาหยิบซ้ำ',
  paid: 'มาจากโฆษณาที่จ่ายเงิน',
  words: 'พิมพ์ข้อความเอง',
};

/** อธิบายว่าคะแนน heat มาจากข้อไหน — ไม่มีอันนี้คนใช้จะไม่เชื่อคะแนน */
export function explainHeat(breakdown: Record<string, number> | null): string {
  if (!breakdown) return '';
  return Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `+${v} ${HEAT_LABELS[k] ?? k}`)
    .join(' · ') || 'ยังไม่มีสัญญาณอะไรเลย';
}

export async function listAudience(): Promise<AudiencePerson[]> {
  const { data, error } = await supabase
    .from('v_audience_center')
    .select('*')
    .order('heat', { ascending: false })
    .order('last_claim_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AudiencePerson[];
}

export async function listClaims(personId: string): Promise<AudienceClaim[]> {
  const { data, error } = await supabase
    .from('audience_claims')
    .select('id, person_id, asset_slug, asset_result, own_words, source_page, utm, claimed_at')
    .eq('person_id', personId)
    .order('claimed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AudienceClaim[];
}

export async function listAssetStats(): Promise<AssetStat[]> {
  const { data, error } = await supabase
    .from('v_audience_asset_stats')
    .select('*')
    .order('claims', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AssetStat[];
}

export async function listCompanies(): Promise<CompanyCluster[]> {
  const { data, error } = await supabase
    .from('v_audience_companies')
    .select('*')
    .order('people', { ascending: false })
    .order('last_claim_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CompanyCluster[];
}

export async function updatePerson(
  id: string,
  patch: Partial<Pick<AudiencePerson, 'status' | 'owner_note'>>
): Promise<void> {
  const { error } = await supabase.from('audience_people').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * สะพานเดียวไป Lead Center — สร้าง lead + ผูกกลับ + ตั้ง status='promoted'
 * idempotent: กดซ้ำได้ ได้ lead id เดิม ไม่สร้างซ้ำ (ตรรกะอยู่ใน RPC ฝั่ง Postgres)
 */
export async function promote(personId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc('promote_audience_to_lead', {
    p_person_id: personId,
    p_reason: reason || null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** ตัวเลขหัวหน้าจอ — วัดว่าของฟรี "ทำงาน" ไหม ไม่ใช่แค่มีคนเล่นเยอะ */
export function summarize(rows: AudiencePerson[]) {
  const weekAgo = Date.now() - 7 * 864e5;
  const hasContact = (r: AudiencePerson) => !!(r.phone || r.email || r.line_id);
  const thisWeek = rows.filter((r) => r.last_claim_at && new Date(r.last_claim_at).getTime() >= weekAgo);
  const promoted = rows.filter((r) => r.promoted_lead_id);
  const hotUntouched = rows.filter((r) => r.heat_band === 'hot' && r.status === 'new' && !r.promoted_lead_id);
  return {
    weekClaims: thisWeek.reduce((n, r) => n + (r.claim_count || 0), 0),
    weekPeople: thisWeek.length,
    contactRate: rows.length ? Math.round((rows.filter(hasContact).length / rows.length) * 100) : 0,
    hotUntouched: hotUntouched.length,
    promoteRate: rows.length ? Math.round((promoted.length / rows.length) * 100) : 0,
    total: rows.length,
  };
}
