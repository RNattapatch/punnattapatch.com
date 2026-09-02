// Newsroom data layer — newsroom_* tables + `newsroom` storage bucket.
//
// คลัง intel ที่ Scout บน Mac mini แกะไว้ (คลิป / เพจ / แอด / เว็บ / ภาพ / ข้อความ)
// เดิมเป็นเว็บเดี่ยวที่ pun-newsroom.pages.dev ซึ่งล็อกอินด้วย password ของตัวเอง —
// พอร์ตเข้า app hub แล้วใช้ session Google เดียวกับ war-room/news-desk/CRM
// (Cloudflare Access ครอบ origin + RLS newsroom_is_owner() ผูกอีเมลเจ้าของ)
//
// ปกและ media เป็นไฟล์ใน bucket private → ต้องขอ signed URL ทีละใบ (อายุ 1 ชม.)
// Packet: claude-code repo → handoffs/active/NEWSROOM-02--port-into-app-hub.md

import { supabase } from '../dashboard/supabase';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ---------- Types (mirror ของตาราง newsroom_items / newsroom_jobs) ----------

export type Platform = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'meta-ads' | 'web' | 'upload';
export type ItemKind = 'clip' | 'page' | 'ads' | 'web' | 'shot' | 'paste';
export type JobStatus = 'queued' | 'submitted' | 'running' | 'done' | 'failed' | 'preflight_failed';

export interface MediaRef {
  type: string;
  path: string;
}

export interface NewsroomItem {
  id: string;
  job_id: string | null;
  kind: ItemKind | string;
  platform: Platform | string;
  source_url: string | null;
  title: string | null;
  channel: string | null;
  summary: string | null;
  verdict: string | null;
  score: number | null;
  views: number | null;
  duration_s: number | null;
  cover_path: string | null;
  media: MediaRef[] | null;
  report_md: string | null;
  report_path: string | null;
  tags: string[] | null;
  scraped_at: string | null;
  created_at: string;
}

export interface NewsroomJob {
  id: string;
  kind: string;
  target: string;
  note: string | null;
  status: JobStatus | string;
  scout_job_id: string | null;
  item_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemFilter {
  platform?: string;
  kind?: string;
  search?: string;
  sort?: 'created_at' | 'score';
  limit?: number;
}

// คอลัมน์ที่การ์ดในคลังใช้จริง — ไม่ดึง report_md (ยาว) มาทั้งกอง
const CARD_COLUMNS = 'id,kind,platform,title,channel,score,cover_path,scraped_at,created_at,summary';

export const PLATFORMS: Platform[] = ['tiktok', 'youtube', 'instagram', 'facebook', 'meta-ads', 'web', 'upload'];

export const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok', youtube: 'YouTube', instagram: 'Instagram',
  facebook: 'Facebook', 'meta-ads': 'Meta Ads', web: 'Web', upload: 'Upload',
};

export const KIND_LABEL: Record<string, string> = {
  clip: 'คลิป', page: 'เพจ', ads: 'แอด', web: 'เว็บ', shot: 'ภาพ', paste: 'ข้อความ',
};

// ---------- Library ----------

export async function listItems(filter: ItemFilter = {}): Promise<NewsroomItem[]> {
  // nullsFirst:false — ครึ่งหนึ่งของคลังยังไม่มี score (Postgres เรียง DESC เอา NULL ขึ้นก่อน)
  // ถ้าไม่สั่ง "คะแนนสูงสุด" จะได้การ์ดไร้คะแนนเต็มหน้าแรก
  let q = supabase
    .from('newsroom_items')
    .select(CARD_COLUMNS)
    .order(filter.sort ?? 'created_at', { ascending: false, nullsFirst: false })
    .limit(filter.limit ?? 60);

  if (filter.platform) q = q.eq('platform', filter.platform);
  if (filter.kind) q = q.eq('kind', filter.kind);

  // `,` `(` `)` เป็นตัวคั่นไวยากรณ์ของ PostgREST .or() — กันคำค้นทำ query พัง
  const s = (filter.search ?? '').trim().replace(/[,()]/g, ' ').trim();
  if (s) q = q.or(`title.ilike.%${s}%,channel.ilike.%${s}%,summary.ilike.%${s}%`);

  const { data, error } = await q;
  fail(error);
  return (data ?? []) as unknown as NewsroomItem[];
}

export async function getItem(id: string): Promise<NewsroomItem> {
  const { data, error } = await supabase.from('newsroom_items').select('*').eq('id', id).single();
  fail(error);
  return data as NewsroomItem;
}

export async function signedUrl(path: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from('newsroom').createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

// ---------- Queue ----------

export async function listJobs(limit = 30): Promise<NewsroomJob[]> {
  const { data, error } = await supabase
    .from('newsroom_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  fail(error);
  return (data ?? []) as NewsroomJob[];
}

export async function createJob(input: { kind: string; target: string; note?: string | null }): Promise<void> {
  const { error } = await supabase.from('newsroom_jobs').insert({
    kind: input.kind,
    target: input.target,
    note: input.note?.trim() || null,
  });
  fail(error);
}

// Retry = โยนกลับเข้าคิว ล้าง error + scout_job_id เดิม เพื่อให้ poller บนมินิหยิบใหม่
export async function retryJob(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsroom_jobs')
    .update({ status: 'queued', error: null, scout_job_id: null })
    .eq('id', id);
  fail(error);
}
