// Marketing War Room data layer — Supabase native (RLS owner_all via is_owner()).
//
// State truth = Supabase. Markdown BODY is never stored here — repo .md files
// are the content truth (V2 spec: marketing-war-room-content-planning-system-v2).
// Reuses the dashboard's Supabase client + Google auth bridge.

import { supabase } from '../dashboard/supabase';

// ---------- Types (mirror of war_room_schema_v2) ----------

export type IdeaStatus =
  | 'captured' | 'triaged' | 'selected' | 'active'
  | 'published' | 'repurpose_candidate' | 'archived';

export type VariantStatus =
  | 'draft' | 'ai_improved' | 'ready_to_record' | 'recorded' | 'editing'
  | 'edited' | 'scheduled' | 'posted' | 'analyzed' | 'repurposed';

export type AcidTest = 'pending' | 'passed' | 'failed';
export type DecisionLabel = 'kill' | 'iterate' | 'repurpose' | 'boost' | 'pillar' | 'sales_asset';

export interface Idea {
  content_id: string;
  title: string;
  canonical_angle: string | null;
  topic_cluster: string | null;
  funnel_stage: 'top' | 'middle' | 'bottom' | 'retain' | null;
  pillar_bucket: 'ai_in_business' | 'sales_team' | 'intersection' | 'persona' | null;
  angle_type: string | null;
  acid_test: AcidTest;
  idea_status: IdeaStatus;
  source_type: string | null;
  source_ref: string | null;
  created_at: string;
}

export interface Variant {
  variant_id: string;
  content_id: string;
  format: 'reel' | 'carousel' | 'article' | 'line_broadcast';
  target_platforms: string[];
  working_title: string | null;
  markdown_path: string | null;
  variant_status: VariantStatus;
  cta_keyword: string | null;
  status_changed_at: string;
  created_at: string;
  // Script Studio (2026-08-13): ร่างของปันกับผล AI อยู่คนละคอลัมน์ — ร่างเดิมไม่โดนทับ
  script_draft: string | null;
  ai_result: string | null;
  ai_result_at: string | null;
}

export interface Publication {
  publication_id: string;
  variant_id: string;
  platform: string;
  post_url: string | null;
  published_at: string | null;
  status: 'scheduled' | 'posted' | 'failed' | 'deleted';
  decision_label: DecisionLabel | null;
}

export interface SnapshotInput {
  views?: number; reach?: number; likes?: number; comments?: number;
  shares?: number; saves?: number; keyword_comments?: number;
  dm_count?: number; line_adds?: number; leads_created?: number; notes?: string;
}

export interface SimilarHit {
  content_id: string; title: string; canonical_angle: string | null;
  idea_status: IdeaStatus; sim: number;
}

// Variant format codes — variant = format ONLY; platform lives on publications.
export const FORMAT_CODES = {
  RL: { format: 'reel', dir: 'reel', targets: ['tiktok', 'instagram', 'facebook'], label: 'Reel' },
  CR: { format: 'carousel', dir: 'carousel', targets: ['instagram', 'facebook'], label: 'Carousel' },
  AR: { format: 'article', dir: 'article', targets: ['facebook', 'linkedin'], label: 'Article' },
  LN: { format: 'line_broadcast', dir: 'line-broadcast', targets: ['line_oa'], label: 'LINE Broadcast' },
} as const;
export type FormatCode = keyof typeof FORMAT_CODES;

export const PLATFORMS = ['tiktok', 'instagram', 'facebook', 'line_oa', 'linkedin', 'website', 'youtube'];

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ---------- Content ID ----------

export const bkkToday = (): string => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

export async function nextContentId(): Promise<string> {
  const d = bkkToday();
  const { data, error } = await supabase
    .from('content_items').select('content_id')
    .like('content_id', `CNT-${d}-%`)
    .order('content_id', { ascending: false }).limit(1);
  fail(error);
  const n = data?.[0] ? Number(data[0].content_id.slice(-3)) + 1 : 1;
  return `CNT-${d}-${String(n).padStart(3, '0')}`;
}

// ---------- Reads ----------

export async function listIdeas(): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('content_items').select('*')
    .order('created_at', { ascending: false }).limit(300);
  fail(error);
  return (data ?? []) as Idea[];
}

export async function listVariants(): Promise<Variant[]> {
  const { data, error } = await supabase
    .from('content_variants').select('*')
    .order('created_at', { ascending: false }).limit(1000);
  fail(error);
  return (data ?? []) as Variant[];
}

export async function listPublications(): Promise<Publication[]> {
  const { data, error } = await supabase.from('publications').select('*').limit(2000);
  fail(error);
  return (data ?? []) as Publication[];
}

export async function snapshotPubIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('analytics_snapshots').select('publication_id').limit(5000);
  fail(error);
  return new Set((data ?? []).map((r) => r.publication_id as string));
}

export async function findSimilar(text: string): Promise<SimilarHit[]> {
  const { data, error } = await supabase.rpc('search_similar_content', { q: text });
  fail(error);
  return (data ?? []) as SimilarHit[];
}

// ---------- Writes ----------

export async function createIdea(fields: Partial<Idea> & { title: string }): Promise<Idea> {
  const content_id = await nextContentId();
  const { data, error } = await supabase
    .from('content_items')
    .insert({ content_id, source_type: 'webapp', ...fields })
    .select().single();
  fail(error);
  return data as Idea;
}

export async function updateIdea(content_id: string, patch: Partial<Idea>): Promise<void> {
  const { error } = await supabase.from('content_items').update(patch).eq('content_id', content_id);
  fail(error);
}

export async function createVariant(idea: Idea, code: FormatCode): Promise<Variant> {
  const meta = FORMAT_CODES[code];
  const variant_id = `${idea.content_id}-${code}`;
  const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const { data, error } = await supabase
    .from('content_variants')
    .insert({
      variant_id,
      content_id: idea.content_id,
      format: meta.format,
      target_platforms: meta.targets,
      working_title: idea.title,
      markdown_path: `output/content/${meta.dir}/${variant_id}${slug ? `--${slug}` : ''}.md`,
    })
    .select().single();
  fail(error);
  // Idea with a variant in production = active
  if (idea.idea_status === 'captured' || idea.idea_status === 'triaged' || idea.idea_status === 'selected') {
    await updateIdea(idea.content_id, { idea_status: 'active' });
  }
  return data as Variant;
}

export async function updateVariant(variant_id: string, patch: Partial<Variant>): Promise<void> {
  // Every status change stamps status_changed_at — the stale-alert clock.
  const stamped = patch.variant_status ? { ...patch, status_changed_at: new Date().toISOString() } : patch;
  const { error } = await supabase.from('content_variants').update(stamped).eq('variant_id', variant_id);
  fail(error);
}

export async function addPublication(
  variant_id: string, platform: string, post_url: string, published_at: string
): Promise<void> {
  const { error } = await supabase.from('publications').insert({
    variant_id, platform, post_url: post_url || null,
    published_at: published_at || new Date().toISOString(), status: 'posted',
  });
  fail(error);
  await updateVariant(variant_id, { variant_status: 'posted' });
}

export async function setDecision(publication_id: string, label: DecisionLabel | null): Promise<void> {
  const { error } = await supabase.from('publications').update({ decision_label: label }).eq('publication_id', publication_id);
  fail(error);
}

export async function addSnapshot(publication_id: string, metrics: SnapshotInput): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(metrics).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const { error } = await supabase.from('analytics_snapshots').insert({ publication_id, source: 'manual', ...clean });
  fail(error);
}

// ---------- wr_jobs (Mac mini job queue — 2026-08-13) ----------
// หน้าเว็บ HTTPS เรียก mini ตรงๆ ไม่ได้ (mixed content) → insert job ที่นี่
// worker บน mini (launchd com.pun.wrjobs-worker) poll ทุก 12s แล้วเขียนผลกลับ

export type JobType = 'render_card' | 'ai_improve' | 'publish';
export interface WrJob {
  id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'done' | 'error';
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}

export async function enqueueJob(job_type: JobType, payload: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.from('wr_jobs').insert({ job_type, payload }).select('id').single();
  fail(error);
  return (data as { id: string }).id;
}

/** Poll จน job จบ — done คืน row, error/timeout โยน Error (timeout ไม่ยกเลิกงานฝั่ง mini) */
export async function waitJob(
  id: string,
  opts: { timeoutMs?: number; intervalMs?: number; onTick?: (elapsedS: number) => void } = {}
): Promise<WrJob> {
  const { timeoutMs = 6 * 60_000, intervalMs = 5_000, onTick } = opts;
  const t0 = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const { data, error } = await supabase.from('wr_jobs').select('*').eq('id', id).single();
    fail(error);
    const job = data as WrJob;
    if (job.status === 'done') return job;
    if (job.status === 'error') throw new Error(job.error ?? 'job ล้มเหลว');
    const elapsed = Math.round((Date.now() - t0) / 1000);
    onTick?.(elapsed);
    if (Date.now() - t0 > timeoutMs) throw new Error('รอนานเกินไป — งานยังวิ่งอยู่ฝั่ง Mac mini ลองรีเฟรชดูทีหลัง');
  }
}

// ---------- Markdown builder (Save .md = download/copy — repo file is content truth) ----------

export function buildVariantMarkdown(idea: Idea, v: Variant, body: string): string {
  const fm = [
    '---',
    `content_id: "${idea.content_id}"`,
    `variant_id: "${v.variant_id}"`,
    `format: "${v.format}"`,
    `target_platforms: [${v.target_platforms.map((p) => `"${p}"`).join(', ')}]`,
    `status: "${v.variant_status}"        # mirror จาก Supabase — ระบบ stamp ให้ ห้ามแก้มือ`,
    `topic_cluster: "${idea.topic_cluster ?? ''}"`,
    `funnel_stage: "${idea.funnel_stage ?? ''}"`,
    `pillar_bucket: "${idea.pillar_bucket ?? ''}"`,
    `angle_type: "${idea.angle_type ?? ''}"`,
    `cta_keyword: "${v.cta_keyword ?? ''}"`,
    'source_refs:',
    `  - "output/content/war-room/ideas/${idea.content_id}.md"`,
    'published_urls: []',
    'analytics_status: "not_started"',
    'draft: true                      # ถอดออกเมื่อ ready → Editorial Gate (Miranda) QC อัตโนมัติ',
    '---',
    '',
  ].join('\n');
  return fm + body;
}

export function downloadText(filename: string, text: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
