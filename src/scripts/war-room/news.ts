// News Desk data layer — ca_* tables (Content Warroom merge, 2026-08-13)
//
// เดิมหน้านี้อยู่ที่ http://100.64.172.7:8790 (Tailscale-only + anon key เขียนได้ = รูรั่ว)
// ตอนนี้ ca_* ถูกล็อกเป็น owner_all (is_owner()) — อ่าน/เขียนผ่าน session Google เดียวกับ war-room
// งานที่ต้องใช้เครื่อง mini (เรนเดอร์การ์ด kie.ai / ยิง n8n) วิ่งผ่านคิว wr_jobs (ดู data.ts)

import { supabase } from '../dashboard/supabase';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export interface Hook { id?: string; style?: string; text: string }
export interface CardImage { style?: string; url: string }
export interface CommentItem { role?: string; text: string }

export interface Candidate {
  id: string;
  news_item_id: string | null;
  article_md: string;
  edited_article_md: string | null;
  hooks: Hook[] | null;
  images: CardImage[] | null;
  status: 'pending_review' | 'scheduled' | 'approved' | 'posted' | 'rejected' | string;
  selected_hook: number | null;
  selected_image: number | null;
  post_to_ig: boolean | null;
  scheduled_at: string | null;
  created_at: string;
  comment_thread: CommentItem[] | null;
  glance_line: string | null;
  scene_prompt: string | null;
  scene_field: string | null;
  ca_news_items: { title: string | null; url: string | null; summary: string | null } | null;
}

export interface Source {
  id: string;
  url: string;
  topic: string;
  tags: string[] | null;
  type: string;
  active: boolean;
}

export interface PostLog {
  id: string;
  platform: string;
  posted_at: string | null;
  permalink: string | null;
  error: string | null;
  ca_candidates: { article_md: string; edited_article_md: string | null } | null;
}

export async function listCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('ca_candidates')
    .select('*, ca_news_items(title,url,summary)')
    .in('status', ['pending_review', 'scheduled'])
    .order('created_at', { ascending: false });
  fail(error);
  return (data ?? []) as Candidate[];
}

export async function listSources(): Promise<Source[]> {
  const { data, error } = await supabase.from('ca_sources').select('*').order('added_at', { ascending: false });
  fail(error);
  return (data ?? []) as Source[];
}

export async function listLog(): Promise<PostLog[]> {
  const { data, error } = await supabase
    .from('ca_post_log')
    .select('*, ca_candidates(article_md,edited_article_md)')
    .order('posted_at', { ascending: false })
    .limit(100);
  fail(error);
  return (data ?? []) as PostLog[];
}

export async function patchCandidate(id: string, patch: Partial<Candidate>): Promise<void> {
  const { error } = await supabase.from('ca_candidates').update(patch).eq('id', id);
  fail(error);
}

export async function addSource(fields: { url: string; topic: string; tags: string[]; type: string }): Promise<void> {
  const { error } = await supabase.from('ca_sources').insert(fields);
  fail(error);
}

export async function toggleSource(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('ca_sources').update({ active }).eq('id', id);
  fail(error);
}

// slug = โฟลเดอร์บน Supabase storage — ใช้ของเดิมจาก url ภาพ ถ้ายังไม่มีค่อยตั้งจาก id
export function slugFor(c: Candidate): string {
  const u = c.images?.[0]?.url ?? '';
  const m = u.match(/\/content-images\/([a-z0-9-]+)\//);
  if (m) return m[1];
  const t = (c.ca_news_items?.title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return t.slice(0, 60) || `cand-${c.id.slice(0, 8)}`;
}
