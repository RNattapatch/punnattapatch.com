// Intel Warroom data layer — intel_targets (แฟ้มเป้าหมาย) + newsroom_jobs/items ที่เกาะแฟ้ม
//
// หน่วยของหน้านี้คือ "เป้าหมาย" (คน/ช่อง/แบรนด์ที่คุณปันจับตา) ไม่ใช่ "รายงาน"
// roster นำเข้าจาก wiki/intel/competitor-watchlist-master.md ด้วย tools/intel_sync.py (sync สองทางทุกคืน)
// "สืบตอนนี้" = ยิง newsroom_jobs หลายเลนใน batch เดียว → poller/scout บนมินิทำงาน → publisher เขียน item กลับมาพร้อม target_id
// ความคืบหน้าดูสดผ่าน Supabase Realtime (postgres_changes บน newsroom_jobs กรองด้วย batch_id)
// spec: claude-code repo → docs/superpowers/specs/2026-09-02-intel-warroom-design.md

import { supabase } from '../dashboard/supabase';
import { CARD_COLUMNS_WITH_VERDICT, type NewsroomItem, type NewsroomJob } from '../newsroom/data';

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ---------- Types ----------

export type Threat = 'red' | 'orange' | 'yellow' | 'green' | 'na';
export type Role = 'competitor' | 'benchmark' | 'mentor' | 'context';
export type Platform = 'tiktok' | 'youtube' | 'instagram' | 'facebook_page' | 'web' | 'line' | 'skool' | string;
export type Lane = 'page' | 'ads' | 'web';

export interface Handle {
  platform: Platform;
  ref: string;
  page_id?: string;
  note?: string;
}

export interface TriggerRule {
  text: string;
  keywords: string[];
  escalate_to?: Threat | null;
  fired_at: string | null;
  fired_by_item: string | null;
}

export interface IntelTarget {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  role: Role[];
  threat: Threat;
  section: 'competitor' | 'benchmark' | 'mentor';
  handles: Handle[];
  reach: string | null;
  sells: string | null;
  icp: string | null;
  why_watch: string | null;
  triggers: TriggerRule[];
  deep_dive: string | null;
  cadence_days: number;
  last_scouted_at: string | null;
  next_scout_at: string | null;
  avatar_path?: string | null;
  avatar_source?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryHit {
  platform: Platform;
  ref: string;
  scoutable: boolean;
  lane: Lane;
  title: string;
  note?: string;
  url?: string | null;
}

export interface DiscoveryResult {
  query: string;
  found: DiscoveryHit[];
  steps: string[];
  ig?: string;
  cookies?: Record<string, boolean>;
}

export const THREAT_LABEL: Record<Threat, string> = { red: 'หัวชนกัน', orange: 'ใกล้ · สูง', yellow: 'บางส่วน · เฝ้าดู', green: 'ต่ำ', na: 'บริบท' };
export const THREAT_ORDER: Threat[] = ['red', 'orange', 'yellow', 'green', 'na'];
// สีระดับภัย (ตรงกับ .th-* ในหน้า) — ใช้ inline ตรงที่ class ของ DaisyUI ทับ background
export const THREAT_COLOR: Record<Threat, string> = { red: '#C43245', orange: '#D97A1F', yellow: '#C9A227', green: '#2F7D5B', na: '#9A9488' };
export const ROLE_LABEL: Record<Role, string> = { competitor: '🎯 คู่แข่งตลาด', benchmark: '📹 content benchmark', mentor: '🧭 mentor', context: '👁 context' };
export const PLATFORM_LABEL: Record<string, string> = { tiktok: 'TikTok', youtube: 'YouTube', instagram: 'IG', facebook_page: 'เพจ FB', web: 'เว็บ', line: 'LINE', skool: 'Skool' };

// แพลตฟอร์ม → เลนของ Scout (ตาม mac-mini-ops/scout/README.md) · null = เปิดดูอย่างเดียว สืบไม่ได้
export function laneFor(h: Handle): Lane | null {
  if (h.platform === 'tiktok' || h.platform === 'youtube' || h.platform === 'instagram') return 'page';
  if (h.platform === 'facebook_page') return 'ads';
  if (h.platform === 'web') return 'web';
  return null;
}

// target ที่ส่งให้ Scout ต่อเลน: page รับ @handle/URL · ads รับชื่อเพจหรือ page_id · web รับ URL
export function scoutRef(h: Handle): string {
  if (h.platform === 'facebook_page') return h.page_id || h.ref;
  if (h.platform === 'web' && !/^https?:\/\//.test(h.ref)) return `https://${h.ref}`;
  // "@handle" เปล่าๆ Scout ถือเป็น TikTok เสมอ → IG/YouTube ต้องส่งเป็น URL เต็ม
  if (h.platform === 'instagram' && h.ref.startsWith('@')) return `https://www.instagram.com/${h.ref.slice(1)}/`;
  if (h.platform === 'youtube' && h.ref.startsWith('@')) return `https://www.youtube.com/${h.ref}`;
  return h.ref;
}

// ---------- Targets ----------

export async function listTargets(): Promise<IntelTarget[]> {
  const { data, error } = await supabase.from('intel_targets').select('*').order('name');
  fail(error);
  return (data ?? []) as IntelTarget[];
}

export async function getTarget(id: string): Promise<IntelTarget> {
  const { data, error } = await supabase.from('intel_targets').select('*').eq('id', id).single();
  fail(error);
  return data as IntelTarget;
}

export type TargetPatch = Partial<Pick<IntelTarget, 'name' | 'aliases' | 'role' | 'threat' | 'section' | 'handles' | 'reach' | 'sells' | 'icp' | 'why_watch' | 'triggers' | 'deep_dive' | 'cadence_days'>>;

export async function updateTarget(id: string, patch: TargetPatch): Promise<IntelTarget> {
  const { data, error } = await supabase.from('intel_targets').update(patch).eq('id', id).select('*').single();
  fail(error);
  return data as IntelTarget;
}

export async function createTarget(input: TargetPatch & { name: string }): Promise<IntelTarget> {
  const slug = slugify(input.name, input.handles ?? []);
  const { data, error } = await supabase.from('intel_targets').insert({ slug, section: 'competitor', ...input }).select('*').single();
  fail(error);
  return data as IntelTarget;
}

export async function deleteTarget(id: string): Promise<void> {
  const { error } = await supabase.from('intel_targets').delete().eq('id', id);
  fail(error);
}

// slug เดียวกับ tools/intel_sync.py: @handle ถ้ามี · ไม่งั้นชื่อละติน · ไม่งั้น hash สั้น
export function slugify(name: string, handles: Handle[]): string {
  const h = handles.find((x) => ['tiktok', 'instagram', 'youtube'].includes(x.platform) && x.ref.startsWith('@'));
  if (h) return h.ref.slice(1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const latin = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (latin.length >= 3) return latin.slice(0, 48);
  let x = 0;
  for (const c of name) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return `th-${x.toString(16)}${Date.now().toString(36).slice(-3)}`;
}

// ---------- รูปโปรไฟล์ (มินิหามาเก็บใน bucket · avatar.py) ----------

// bucket เป็น private → ขอ signed URL เป็นชุดเดียวทั้ง roster (ไม่ยิงทีละใบ)
export async function avatarUrls(targets: IntelTarget[]): Promise<Map<string, string>> {
  const paths = [...new Set(targets.map((t) => t.avatar_path).filter((p): p is string => !!p))];
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { data } = await supabase.storage.from('newsroom').createSignedUrls(paths, 3600);
  for (const row of data ?? []) if (row.signedUrl && row.path) out.set(row.path, row.signedUrl);
  return out;
}

// ---------- ตัวเลขต่อรอบ (Phase 3 · intel_snapshots — publisher บันทึกหลังรายงานเข้าแฟ้ม) ----------

export interface IntelSnapshot { id: string; target_id: string; item_id: string | null; lane: string; metrics: Record<string, unknown>; created_at: string }

export async function listSnapshots(targetId: string): Promise<IntelSnapshot[]> {
  const { data, error } = await supabase.from('intel_snapshots').select('*').eq('target_id', targetId).order('created_at', { ascending: false }).limit(40);
  fail(error);
  return (data ?? []) as IntelSnapshot[];
}

// ต่อเลน: รอบล่าสุด vs รอบก่อนหน้า → รายการ {label, now, before, delta}
export const METRIC_LABEL: Record<string, string> = { median: 'median views/likes', per_week: 'โพสต์/สัปดาห์', followers: 'followers', scanned: 'โพสต์ที่สแกน', active_ads: 'แอด ACTIVE', max_longevity_days: 'แอดรันนานสุด (วัน)', views: 'views', score: 'คะแนน' };
export function snapshotDiffs(rows: IntelSnapshot[]): { lane: string; at: string; before_at: string | null; items: { key: string; now: number; before: number | null; delta: number | null }[] }[] {
  const byLane = new Map<string, IntelSnapshot[]>();
  for (const r of rows) byLane.set(r.lane, [...(byLane.get(r.lane) ?? []), r]);
  const out = [];
  for (const [lane, list] of byLane) {
    const [now, before] = list;
    const items = Object.entries(now.metrics).filter(([, v]) => typeof v === 'number').map(([key, v]) => {
      const prev = before && typeof before.metrics[key] === 'number' ? (before.metrics[key] as number) : null;
      return { key, now: v as number, before: prev, delta: prev !== null && prev !== 0 ? Math.round(((v as number) - prev) / prev * 100) : null };
    });
    if (items.length) out.push({ lane, at: now.created_at, before_at: before?.created_at ?? null, items });
  }
  return out;
}

// ---------- รายงานที่เกาะแฟ้ม ----------

export async function listItemsForTarget(targetId: string): Promise<NewsroomItem[]> {
  const { data, error } = await supabase
    .from('newsroom_items')
    .select(CARD_COLUMNS_WITH_VERDICT)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(40);
  fail(error);
  return (data ?? []) as unknown as NewsroomItem[];
}

export async function recentItems(days = 7): Promise<Pick<NewsroomItem, 'id' | 'target_id' | 'created_at'>[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase.from('newsroom_items').select('id,target_id,created_at').gte('created_at', since);
  fail(error);
  return (data ?? []) as Pick<NewsroomItem, 'id' | 'target_id' | 'created_at'>[];
}

// ---------- สืบตอนนี้ ----------

export interface LanePick { lane: Lane; ref: string; label: string; platform: Platform }

export function lanesFor(t: IntelTarget): LanePick[] {
  const out: LanePick[] = [];
  for (const h of t.handles ?? []) {
    const lane = laneFor(h);
    if (!lane) continue;
    const ref = scoutRef(h);
    if (out.some((x) => x.lane === lane && x.ref === ref)) continue;
    out.push({ lane, ref, label: `${PLATFORM_LABEL[h.platform] ?? h.platform} ${h.ref}`, platform: h.platform });
  }
  return out;
}

export async function scoutTarget(t: IntelTarget, picks: LanePick[]): Promise<string> {
  const batch_id = crypto.randomUUID();
  const rows = picks.map((p) => ({
    kind: p.lane === 'page' ? 'page' : p.lane === 'ads' ? 'ads' : 'web',
    target: p.ref,
    note: `intel:${t.id} สืบตอนนี้ — ${t.name}`,
    target_id: t.id,
    batch_id,
    lane: p.lane,
  }));
  const { error } = await supabase.from('newsroom_jobs').insert(rows);
  fail(error);
  return batch_id;
}

// สืบหลายแฟ้มพร้อมกัน (ที่เลือก / ทั้งหมด) — batch เดียวทั้งกลุ่ม · มินิทำทีละงานตามลำดับที่ใส่
export async function scoutTargets(list: IntelTarget[]): Promise<{ batch_id: string; jobs: number; skipped: string[] }> {
  const batch_id = crypto.randomUUID();
  const rows: Record<string, unknown>[] = [];
  const skipped: string[] = [];
  for (const t of list) {
    const picks = lanesFor(t).filter((p) => p.platform !== 'instagram' || true);
    if (!picks.length) { skipped.push(t.name); continue; }
    for (const p of picks) rows.push({ kind: p.lane, target: p.ref, note: `intel:${t.id} สืบกลุ่ม — ${t.name}`, target_id: t.id, batch_id, lane: p.lane });
  }
  if (rows.length) {
    const { error } = await supabase.from('newsroom_jobs').insert(rows);
    fail(error);
  }
  return { batch_id, jobs: rows.length, skipped };
}

// batch ที่ยังวิ่งอยู่ (เปิดหน้าใหม่แล้วยังเห็นความคืบหน้า — ไม่ต้องจำไว้ในเบราว์เซอร์)
export async function activeBatches(): Promise<Map<string, NewsroomJob[]>> {
  const { data, error } = await supabase.from('newsroom_jobs').select('*').not('batch_id', 'is', null)
    .gte('created_at', new Date(Date.now() - 6 * 3600000).toISOString()).order('created_at');
  fail(error);
  const out = new Map<string, NewsroomJob[]>();
  for (const j of (data ?? []) as NewsroomJob[]) { const k = j.batch_id!; out.set(k, [...(out.get(k) ?? []), j]); }
  for (const [k, jobs] of out) if (!jobs.some((j) => ['queued', 'submitted', 'running'].includes(j.status))) out.delete(k);
  return out;
}

export async function listBatch(batchId: string): Promise<NewsroomJob[]> {
  const { data, error } = await supabase.from('newsroom_jobs').select('*').eq('batch_id', batchId).order('created_at');
  fail(error);
  return (data ?? []) as NewsroomJob[];
}

// Realtime: ทุกครั้งที่แถวใน batch เปลี่ยน → cb(แถวล่าสุดทั้ง batch) · คืนฟังก์ชันปิด channel
export function subscribeBatch(batchId: string, cb: (jobs: NewsroomJob[]) => void): () => void {
  const channel = supabase
    .channel(`intel-batch-${batchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'newsroom_jobs', filter: `batch_id=eq.${batchId}` }, () => {
      void listBatch(batchId).then(cb).catch(() => {});
    })
    .subscribe();
  // กันเคส Realtime ไม่ต่อ (เช่น publication ยังไม่ครอบ) — poll สำรองทุก 15 วิ
  const timer = window.setInterval(() => void listBatch(batchId).then(cb).catch(() => {}), 15000);
  return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
}

// ---------- ส่งงานที่พังให้ Agent บนมินิแก้ (poller ยิงเข้า tmux ของ claude-bot) ----------

export async function askAgentToFix(job: NewsroomJob, targetName?: string): Promise<void> {
  const lane = job.lane || job.kind;
  const body = [
    `tech: งานสืบใน Intel Warroom ล้ม ช่วยหาสาเหตุและแก้ให้ที`,
    `เป้าหมาย: ${targetName || '(ไม่ผูกแฟ้ม)'} · เลน: ${lane} · target: ${job.target}`,
    `job id: ${job.id}${job.scout_job_id ? ` · scout job: ${job.scout_job_id}` : ''} · ลองแล้ว ${(job.attempts ?? 0)} ครั้ง`,
    `error: ${job.error ?? '(ไม่มีข้อความ error)'}`,
    `ทำ: อ่าน ~/scout/scout.log + ~/newsroom/publisher.log ของ job นี้ → บอกสาเหตุ → ถ้าแก้ที่โค้ดได้ให้แก้ในรีโป mac-mini-ops แล้ว deploy + retry งานนี้ให้ · ถ้าแก้ไม่ได้ให้ตอบว่าติดอะไรและต้องให้คุณปันทำอะไร`,
  ].join('\n');
  const { error } = await supabase.from('agent_requests').insert({
    kind: 'fix_bug', title: `แก้บั๊ก: ${lane} · ${targetName || job.target}`.slice(0, 90),
    body, source: 'intel-warroom', job_id: job.id, target_id: job.target_id ?? null,
  });
  fail(error);
}

// ---------- สืบคนใหม่ (identity discovery บนมินิ: newsroom/discover.py) ----------

export async function requestDiscovery(query: string): Promise<string> {
  const { data, error } = await supabase.from('newsroom_jobs').insert({ kind: 'identity', target: query, note: 'สืบคนใหม่' }).select('id').single();
  fail(error);
  return (data as { id: string }).id;
}

export function subscribeJob(jobId: string, cb: (job: NewsroomJob) => void): () => void {
  const pull = () => void supabase.from('newsroom_jobs').select('*').eq('id', jobId).single().then(({ data }) => { if (data) cb(data as NewsroomJob); });
  const channel = supabase
    .channel(`intel-job-${jobId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'newsroom_jobs', filter: `id=eq.${jobId}` }, pull)
    .subscribe();
  const timer = window.setInterval(pull, 10000);
  return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
}

// ---------- helpers สำหรับหน้า ----------

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export const firedCount = (t: IntelTarget) => (t.triggers ?? []).filter((x) => x.fired_at).length;
