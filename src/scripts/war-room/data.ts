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
  // หมวดตามธง v1.4 (2026-10-02): ปั้นทีมขาย · ถอดรหัสคนซื้อ · AI รับงานซ้ำ · bonus · me
  pillar_v14?: PillarV14 | null;
}

export type PillarV14 = 'team' | 'buyer' | 'ai' | 'bonus' | 'me';
export const PILLAR_V14_LABEL: Record<PillarV14, string> = { team: 'ปั้นทีมขาย', buyer: 'ถอดรหัสคนซื้อ', ai: 'AI รับงานซ้ำ', bonus: 'Bonus', me: 'ME' };

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
  // Note Studio (2026-10-02): สเปกรูปแบบ Notes (carousel/รูปเดี่ยว) — render จริงบนมินิ
  visual_spec?: import('./note-render').NoteSpec | null;
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

// ---------- ทนเน็ตสะดุด ----------
// แล็ปท็อปตื่นจาก sleep / สลับ Wi-Fi / Tailscale ต่อใหม่ → fetch นัดแรกพังเป็น
// TypeError "Failed to fetch" แล้วหายเองถ้ายิงซ้ำ. ของเดิมโยนข้อความดิบขึ้นหน้าจอ
// (ลากการ์ดแล้วขึ้น "Failed to fetch" เฉยๆ ไม่บอกว่าต้องทำอะไร) — ชั้นนี้ยิงซ้ำให้ก่อน
const NET_ERR = /failed to fetch|load failed|networkerror|network request failed|fetch failed|err_network/i;
const isNetErr = (e: unknown): boolean => NET_ERR.test(String((e as { message?: string })?.message ?? e));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Res<T> = { data: T; error: { message: string } | null };

/**
 * ยิง query แล้วลองซ้ำ **เฉพาะ** ตอนเน็ตพัง — error จาก RLS/schema/constraint
 * โยนออกทันที เพราะยิงกี่ครั้งก็ผิดเหมือนเดิม
 */
async function q<T>(build: () => PromiseLike<Res<T>>, tries = 3): Promise<T> {
  let last: unknown = null;
  for (let attempt = 1; attempt <= tries; attempt++) {
    if (attempt > 1) await wait(300 * 2 ** (attempt - 2));
    let res: Res<T>;
    try {
      res = await build();
    } catch (thrown) {
      if (!isNetErr(thrown)) throw thrown;
      last = thrown;
      continue;
    }
    if (!res.error) return res.data;
    if (!isNetErr(res.error)) throw new Error(res.error.message);
    last = res.error;
  }
  const detail = String((last as { message?: string })?.message ?? last ?? '');
  throw new Error(`ต่อฐานข้อมูลไม่ได้ (${detail}) — เช็คเน็ตแล้วลองอีกครั้ง ถ้ายังไม่ได้ให้รีเฟรชหน้าเพื่อต่อ session ใหม่`);
}

// ---------- Content ID ----------

export const bkkToday = (): string => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

export async function nextContentId(): Promise<string> {
  const d = bkkToday();
  const data = await q<{ content_id: string }[]>(() => supabase
    .from('content_items').select('content_id')
    .like('content_id', `CNT-${d}-%`)
    .order('content_id', { ascending: false }).limit(1));
  const n = data?.[0] ? Number(data[0].content_id.slice(-3)) + 1 : 1;
  return `CNT-${d}-${String(n).padStart(3, '0')}`;
}

// ---------- Reads ----------

export async function listIdeas(): Promise<Idea[]> {
  const data = await q(() => supabase
    .from('content_items').select('*')
    .order('created_at', { ascending: false }).limit(300));
  return (data ?? []) as Idea[];
}

export async function listVariants(): Promise<Variant[]> {
  const data = await q(() => supabase
    .from('content_variants').select('*')
    .order('created_at', { ascending: false }).limit(1000));
  return (data ?? []) as Variant[];
}

export async function listPublications(): Promise<Publication[]> {
  const data = await q(() => supabase.from('publications').select('*').limit(2000));
  return (data ?? []) as Publication[];
}

export async function snapshotPubIds(): Promise<Set<string>> {
  const data = await q<{ publication_id: string }[]>(() =>
    supabase.from('analytics_snapshots').select('publication_id').limit(5000));
  return new Set((data ?? []).map((r) => r.publication_id));
}

export async function findSimilar(text: string): Promise<SimilarHit[]> {
  const data = await q(() => supabase.rpc('search_similar_content', { q: text }));
  return (data ?? []) as SimilarHit[];
}

// ---------- Writes ----------

export async function createIdea(fields: Partial<Idea> & { title: string }): Promise<Idea> {
  const content_id = await nextContentId();
  const data = await q(() => supabase
    .from('content_items')
    .insert({ content_id, source_type: 'webapp', ...fields })
    .select().single());
  return data as Idea;
}

export async function updateIdea(content_id: string, patch: Partial<Idea>): Promise<void> {
  await q(() => supabase.from('content_items').update(patch).eq('content_id', content_id));
}

export async function createVariant(idea: Idea, code: FormatCode): Promise<Variant> {
  const meta = FORMAT_CODES[code];
  const variant_id = `${idea.content_id}-${code}`;
  const slug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const data = await q(() => supabase
    .from('content_variants')
    .insert({
      variant_id,
      content_id: idea.content_id,
      format: meta.format,
      target_platforms: meta.targets,
      working_title: idea.title,
      markdown_path: `output/content/${meta.dir}/${variant_id}${slug ? `--${slug}` : ''}.md`,
    })
    .select().single());
  // Idea with a variant in production = active
  if (idea.idea_status === 'captured' || idea.idea_status === 'triaged' || idea.idea_status === 'selected') {
    await updateIdea(idea.content_id, { idea_status: 'active' });
  }
  return data as Variant;
}

export async function updateVariant(variant_id: string, patch: Partial<Variant>): Promise<void> {
  // Every status change stamps status_changed_at — the stale-alert clock.
  const stamped = patch.variant_status ? { ...patch, status_changed_at: new Date().toISOString() } : patch;
  await q(() => supabase.from('content_variants').update(stamped).eq('variant_id', variant_id));
}

export async function addPublication(
  variant_id: string, platform: string, post_url: string, published_at: string
): Promise<void> {
  await q(() => supabase.from('publications').insert({
    variant_id, platform, post_url: post_url || null,
    published_at: published_at || new Date().toISOString(), status: 'posted',
  }));
  await updateVariant(variant_id, { variant_status: 'posted' });
}

export async function setDecision(publication_id: string, label: DecisionLabel | null): Promise<void> {
  await q(() => supabase.from('publications').update({ decision_label: label }).eq('publication_id', publication_id));
}

export async function addSnapshot(publication_id: string, metrics: SnapshotInput): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(metrics).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  await q(() => supabase.from('analytics_snapshots').insert({ publication_id, source: 'manual', ...clean }));
}

// ---------- wr_jobs (Mac mini job queue — 2026-08-13) ----------
// หน้าเว็บ HTTPS เรียก mini ตรงๆ ไม่ได้ (mixed content) → insert job ที่นี่
// worker บน mini (launchd com.pun.wrjobs-worker) poll ทุก 12s แล้วเขียนผลกลับ

// rewrite_reel (2026-09-08): Intel Warroom → "เกลาเป็น version ผม" — payload {item_id, theme, pillar, hook_style, length, cta_keyword}
// render_notes (2026-10-02): Note Studio → payload {variant_id} · worker อ่าน visual_spec จาก DB แล้ว render.mjs → media_assets
export type JobType = 'render_card' | 'ai_improve' | 'publish' | 'rewrite_copy' | 'render_text_card' | 'rewrite_reel' | 'render_notes';
export interface WrJob {
  id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'done' | 'error';
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  started_at?: string | null;    // worker stamp ตอนหยิบงาน — หน้าคิวใช้คำนวณ "กำลังทำมากี่นาที"
  finished_at?: string | null;
}

/** คิวงานล่าสุด — หน้าสถานะงานใน News Desk (ท่าเดียวกับคิวของ Intel Warroom) */
export async function listWrJobs(limit = 40): Promise<WrJob[]> {
  const data = await q(() => supabase
    .from('wr_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit));
  return (data ?? []) as WrJob[];
}

/** Retry = โยนกลับเข้าคิว ล้าง error/ผลเดิม เพื่อให้ worker บนมินิหยิบใหม่ */
export async function retryWrJob(id: string): Promise<void> {
  await q(() => supabase
    .from('wr_jobs')
    .update({ status: 'queued', error: null, result: null, started_at: null, finished_at: null })
    .eq('id', id));
}

export async function deleteWrJob(id: string): Promise<void> {
  await q(() => supabase.from('wr_jobs').delete().eq('id', id));
}

export async function enqueueJob(job_type: JobType, payload: Record<string, unknown>): Promise<string> {
  const data = await q(() => supabase.from('wr_jobs').insert({ job_type, payload }).select('id').single());
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
    const data = await q(() => supabase.from('wr_jobs').select('*').eq('id', id).single());
    const job = data as WrJob;
    if (job.status === 'done') return job;
    if (job.status === 'error') throw new Error(job.error ?? 'job ล้มเหลว');
    const elapsed = Math.round((Date.now() - t0) / 1000);
    onTick?.(elapsed);
    if (Date.now() - t0 > timeoutMs) throw new Error('รอนานเกินไป — งานยังวิ่งอยู่ฝั่ง Mac mini ลองรีเฟรชดูทีหลัง');
  }
}

// ---------- รูปของ post/carousel (media_assets + bucket ส่วนตัว content-media · 2026-10-02) ----------

export interface MediaAsset {
  asset_id: string;
  content_id: string | null;
  variant_id: string | null;
  asset_type: string;
  storage_path: string | null;
  source: 'upload' | 'note_studio' | 'agent' | null;
  render_batch: string | null;
  sort_order: number;
  is_cover: boolean;
  asset_status: string;
  drive_path: string | null;
  drive_file_id: string | null; // ต้นฉบับย้ายเข้า Google Drive แล้ว (worker บนมินิ) · storage_path = พรีวิว JPEG 1080
  width: number | null;
  height: number | null;
  url?: string; // signed URL (อายุ 1 ชม.) — เติมตอนโหลด
}

const MEDIA_BUCKET = 'content-media';

/** รูปที่ใช้งานอยู่ของ variant (ไม่รวมที่เก็บเข้ากรุ) พร้อม signed URL */
export async function listMedia(variantIds: string[]): Promise<MediaAsset[]> {
  if (!variantIds.length) return [];
  const rows = (await q(() => supabase
    .from('media_assets').select('*')
    .in('variant_id', variantIds).neq('asset_status', 'archived')
    .order('sort_order', { ascending: true }))) as MediaAsset[];
  const paths = rows.map((r) => r.storage_path).filter(Boolean) as string[];
  if (paths.length) {
    const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, 3600);
    const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
    for (const r of rows) if (r.storage_path) r.url = byPath.get(r.storage_path) ?? undefined;
  }
  return rows;
}

/** อัปโหลดรูปเอง (ลากวาง) — ต่อท้ายลำดับเดิม */
export async function uploadMedia(v: Variant, files: File[], startOrder: number): Promise<number> {
  const batch = `upload-${Date.now()}`;
  let n = 0;
  for (const [i, f] of files.entries()) {
    if (!f.type.startsWith('image/')) continue;
    const safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-60);
    const path = `${v.content_id}/${v.variant_id}/${batch}/${String(i + 1).padStart(2, '0')}-${safe}`;
    const up = await supabase.storage.from(MEDIA_BUCKET).upload(path, f, { contentType: f.type, upsert: false });
    if (up.error) throw new Error(`อัปโหลด ${f.name} ไม่สำเร็จ: ${up.error.message}`);
    await q(() => supabase.from('media_assets').insert({
      content_id: v.content_id, variant_id: v.variant_id,
      asset_type: v.format === 'carousel' ? 'carousel_png' : 'screenshot',
      storage_path: path, source: 'upload', render_batch: batch,
      sort_order: startOrder + n, is_cover: startOrder + n === 0, asset_status: 'imported', bytes: f.size,
    }));
    n++;
  }
  return n;
}

/** บันทึกลำดับใหม่ — ใบแรก = ปก */
export async function reorderMedia(ids: string[]): Promise<void> {
  for (const [i, id] of ids.entries()) {
    await q(() => supabase.from('media_assets').update({ sort_order: i, is_cover: i === 0 }).eq('asset_id', id));
  }
}

/** เอาออกจากชุด (เก็บเข้ากรุ ไม่ลบไฟล์ — กู้คืนได้) */
export async function archiveMedia(id: string): Promise<void> {
  await q(() => supabase.from('media_assets').update({ asset_status: 'archived' }).eq('asset_id', id));
}

export async function saveVisualSpec(variant_id: string, spec: import('./note-render').NoteSpec): Promise<void> {
  await q(() => supabase.from('content_variants').update({ visual_spec: spec }).eq('variant_id', variant_id));
}

// ---------- แคมเปญ (2026-10-02 · ตาราง campaigns + campaign_items) ----------

export type CampaignStatus = 'idea' | 'planning' | 'producing' | 'live' | 'paused' | 'done';
/** อุณหภูมิกลุ่มเป้าหมาย — ปันขอใช้ Cold/Warm/Hot (คำว่า "อุ่น" จักจี้หู · 2026-10-02) */
export type Temperature = 'cold' | 'warm' | 'hot';
export const TEMPERATURE: Record<Temperature, { label: string; hint: string }> = {
  cold: { label: 'Cold', hint: 'คนที่ยังไม่รู้จักคุณ' },
  warm: { label: 'Warm', hint: 'เคยเห็น/โต้ตอบ/ทักมาแล้ว' },
  hot: { label: 'Hot', hint: 'ใกล้ตัดสินใจ — ดูคลาสจบ · กรอกฟอร์ม · คุยแล้ว' },
};
export interface Campaign {
  campaign_id: string; name: string; goal: string | null; audience: string | null;
  status: CampaignStatus; start_date: string | null; end_date: string | null;
  temperature?: Temperature | null;
  touch_per_week: number; kpi_label: string | null; budget_note: string | null;
  mix_target: { team?: number; buyer?: number; ai?: number; value?: number; me?: number } | null;
  brief_md_path: string | null; drive_folder: string | null; created_at: string;
}
export interface CampaignItem {
  id: string; campaign_id: string; content_id: string | null; variant_id: string | null;
  slot_code: string | null; role: 'value' | 'me' | 'hot' | 'bonus' | 'bench';
  week: number; sort: number; ad_status: 'none' | 'ready' | 'live' | 'paused' | string;
  meta_ad_id: string | null; note: string | null;
}

export async function listCampaigns(): Promise<Campaign[]> {
  return (await q(() => supabase.from('campaigns').select('*').order('created_at', { ascending: false }))) as Campaign[];
}
export async function listCampaignItems(): Promise<CampaignItem[]> {
  return (await q(() => supabase.from('campaign_items').select('*').order('sort', { ascending: true }).limit(2000))) as CampaignItem[];
}
export async function updateCampaignItem(id: string, patch: Partial<CampaignItem>): Promise<void> {
  await q(() => supabase.from('campaign_items').update(patch).eq('id', id));
}
export async function addCampaignItems(rows: Partial<CampaignItem>[]): Promise<void> {
  await q(() => supabase.from('campaign_items').insert(rows));
}
export async function deleteCampaignItem(id: string): Promise<void> {
  await q(() => supabase.from('campaign_items').delete().eq('id', id));
}
export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<void> {
  await q(() => supabase.from('campaigns').update(patch).eq('campaign_id', id));
}

/** เรียงช่อง VALUE/ME ให้ ME กระจาย ไม่ติดกัน — 5:2 ได้ V V M V V M V */
export function slotPattern(value: number, me: number): { code: string; role: 'value' | 'me' }[] {
  const total = value + me;
  const meAt = new Set(Array.from({ length: me }, (_, k) => Math.min(total - 1, Math.round(((k + 0.5) * total) / me))));
  let v = 0, m = 0;
  return Array.from({ length: total }, (_, i) => (meAt.has(i) ? { code: `M${++m}`, role: 'me' as const } : { code: `V${++v}`, role: 'value' as const }));
}

export async function createCampaign(c: { name: string; goal: string; start_date: string | null; end_date: string | null; value: number; me: number; temperature: Temperature }): Promise<string> {
  const base = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'campaign';
  const campaign_id = `${base}-${Date.now().toString(36)}`;
  await q(() => supabase.from('campaigns').insert({
    campaign_id, name: c.name, goal: c.goal || null, status: 'planning', temperature: c.temperature,
    start_date: c.start_date, end_date: c.end_date, touch_per_week: c.value + c.me,
    mix_target: { team: 40, buyer: 30, ai: 30, value: c.value, me: c.me },
    brief_md_path: `output/content/war-room/campaigns/${base}.md`,
  }));
  await addCampaignItems(slotPattern(c.value, c.me).map((s, i) => ({ campaign_id, slot_code: s.code, role: s.role, week: 1, sort: i })));
  return campaign_id;
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
