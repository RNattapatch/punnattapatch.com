// Growth Lab ↔ Supabase: workspace sync (growth_lab_workspaces) + Codex jobs on the Mac mini (wr_jobs.growth_eval).
// Pure rules live in sync.mjs; this file is the only one that talks to the network.
import { supabase } from '../dashboard/supabase';
import { enqueueJob } from '../war-room/data';
import { DATA_VERSION } from './sync.mjs';
import { MEDIA_BUCKET } from './media.mjs';

export const WORKSPACE_ID = 'default';
const TABLE = 'growth_lab_workspaces';

export interface CloudWorkspace {
  state: unknown;
  rev: number;
  app_version: number;
  device: string | null;
  updated_at: string;
}

export type SaveResult =
  | { ok: true; rev: number; updated_at: string }
  | { ok: false; conflict: CloudWorkspace }
  | { ok: false; outdated: true }
  | { ok: false; tooLarge: true };

export interface CodexJob {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error: string | null;
  created_at: string;
  finished_at: string | null;
  creative: Record<string, unknown> | null;
  result: { evaluation?: Record<string, unknown>; journey?: Record<string, unknown> } | null;
}

/** Short, non-identifying label so the other device can say "saved from iPhone". */
export function deviceLabel(): string {
  const ua = navigator.userAgent;
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'เบราว์เซอร์';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '';
  return [device, browser].filter(Boolean).join(' · ');
}

export async function fetchWorkspace(): Promise<CloudWorkspace | null> {
  const { data, error } = await supabase.from(TABLE).select('state, rev, app_version, device, updated_at').eq('id', WORKSPACE_ID).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CloudWorkspace | null) ?? null;
}

const isOutdated = (error: { message?: string } | null) => Boolean(error?.message?.includes('older than stored version'));
const isTooLarge = (error: { code?: string; message?: string } | null) => error?.code === '23514' && Boolean(error.message?.includes('state_size'));

/**
 * Optimistic save: `baseRev` is the rev this copy is based on (null = no cloud row seen yet).
 * Another device saving in between → nothing is overwritten, the caller gets that version back.
 * The database refuses writes from an older data format (`outdated`) and archives every replaced version.
 */
export async function saveWorkspace(state: unknown, baseRev: number | null, { archivePrevious = false } = {}): Promise<SaveResult> {
  const device = deviceLabel();
  const now = new Date().toISOString();
  if (baseRev === null) {
    const { data, error } = await supabase.from(TABLE).insert({ id: WORKSPACE_ID, state, rev: 1, app_version: DATA_VERSION, device, updated_at: now }).select('rev, updated_at').maybeSingle();
    if (!error && data) return { ok: true, rev: data.rev, updated_at: data.updated_at };
    if (isTooLarge(error)) return { ok: false, tooLarge: true };
    if (error && error.code !== '23505') throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from(TABLE)
      .update({ state, rev: baseRev + 1, app_version: DATA_VERSION, device, updated_at: now, archive_previous: archivePrevious })
      .eq('id', WORKSPACE_ID).eq('rev', baseRev)
      .select('rev, updated_at').maybeSingle();
    if (isOutdated(error)) return { ok: false, outdated: true };
    if (isTooLarge(error)) return { ok: false, tooLarge: true };
    if (error) throw new Error(error.message);
    if (data) return { ok: true, rev: data.rev, updated_at: data.updated_at };
  }
  const remote = await fetchWorkspace();
  if (!remote) throw new Error('บันทึกขึ้นคลาวด์ไม่สำเร็จ (ไม่พบแถว workspace)');
  return { ok: false, conflict: remote };
}

export interface ServerCopy { id: number; kind: string; label: string | null; device: string | null; archived_at: string }

/** Keep a version this device is about to lose on the server (no browser quota; downloadable from any device). */
export async function keepCopyOnServer(state: unknown, kind: 'local-replaced' | 'cloud-before-repair', label: string): Promise<number> {
  const { data, error } = await supabase.rpc('growth_lab_keep_copy', { p_state: state, p_kind: kind, p_label: label, p_device: deviceLabel(), p_app_version: DATA_VERSION });
  if (error) throw new Error(error.message);
  return data as number;
}

/** Saved versions: copies kept on purpose (restore/import/conflict) and the rolling automatic history, newest first. */
export async function listServerCopies(): Promise<{ kept: ServerCopy[]; history: ServerCopy[] }> {
  const base = () => supabase.from('growth_lab_workspace_history').select('id, kind, label, device, archived_at').eq('workspace_id', WORKSPACE_ID);
  const [kept, history] = await Promise.all([
    base().neq('kind', 'auto').order('archived_at', { ascending: false }).limit(30),
    base().eq('kind', 'auto').order('archived_at', { ascending: false }).limit(10),
  ]);
  if (kept.error) throw new Error(kept.error.message);
  if (history.error) throw new Error(history.error.message);
  return { kept: (kept.data as ServerCopy[]) ?? [], history: (history.data as ServerCopy[]) ?? [] };
}

export async function fetchServerCopy(id: number): Promise<unknown> {
  const { data, error } = await supabase.from('growth_lab_workspace_history').select('state').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { state: unknown } | null)?.state ?? null;
}

// ---------- results (evaluation + journey per touchpoint, keyed by the text + pack they scored) ----------
export interface ResultRow { creative_id: string; result_key: string; engine: 'local' | 'codex'; evaluation: Record<string, unknown>; journey: Record<string, unknown>; evaluated_at: string }
export interface ResultStamp { creative_id: string; result_key: string; engine: 'local' | 'codex'; evaluated_at: string }

export async function listResultStamps(keys: string[]): Promise<ResultStamp[]> {
  if (!keys.length) return [];
  const { data, error } = await supabase.from('growth_lab_results').select('creative_id, result_key, engine, evaluated_at')
    .eq('workspace_id', WORKSPACE_ID).in('result_key', keys);
  if (error) throw new Error(error.message);
  return (data as ResultStamp[]) ?? [];
}

export async function fetchResults(keys: string[]): Promise<ResultRow[]> {
  if (!keys.length) return [];
  const { data, error } = await supabase.from('growth_lab_results').select('creative_id, result_key, engine, evaluation, journey, evaluated_at')
    .eq('workspace_id', WORKSPACE_ID).in('result_key', keys);
  if (error) throw new Error(error.message);
  return (data as ResultRow[]) ?? [];
}

/** Returns the rows that actually landed — the database ignores a Local result over a Codex one, or an older one. */
export async function upsertResults(rows: ResultRow[]): Promise<ResultStamp[]> {
  if (!rows.length) return [];
  const device = deviceLabel();
  const { data, error } = await supabase.from('growth_lab_results').upsert(
    rows.map((row) => ({ workspace_id: WORKSPACE_ID, ...row, device })),   // updated_at is stamped by the server clock
    { onConflict: 'workspace_id,creative_id,result_key' },
  ).select('creative_id, result_key, engine, evaluated_at');
  if (error) throw new Error(error.message);
  return (data as ResultStamp[]) ?? [];
}

/** Text-only → growth_eval (main worker) · with an image/video → funnel_media_eval (funnel_media_worker on the mini). */
export async function enqueueCodexEvaluation(creative: { media?: unknown }, pack: unknown): Promise<string> {
  return enqueueJob(creative.media ? 'funnel_media_eval' : 'growth_eval', { creative, pack });
}

// ---------- media files (private bucket funnel-lab-media, owner-only RLS) ----------
export async function uploadMedia(path: string, file: Blob, contentType: string): Promise<void> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: true, contentType, cacheControl: '3600' });
  if (error) throw new Error(error.message);
}

export async function copyMedia(from: string, to: string): Promise<void> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).copy(from, to);
  if (error && !/exists/i.test(error.message)) throw new Error(error.message);
}

/** True when the object is in the bucket (a reference can outlive its file, e.g. after restoring an old backup). */
export async function mediaExists(path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/');
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 1 });
  if (error) throw new Error(error.message);
  return (data ?? []).some((item) => item.name === path.slice(slash + 1));
}

/** Short-lived URL for showing the file on this page (the bucket itself is private). */
export async function signedMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'ขอ URL ไฟล์ไม่ได้');
  return data.signedUrl;
}

const JOB_COLUMNS = 'id, status, error, created_at, finished_at, creative:payload->creative, result';

/** One job (null = row gone). Network errors throw — callers keep tracking and retry. */
export async function readCodexJob(jobId: string): Promise<CodexJob | null> {
  const { data, error } = await supabase.from('wr_jobs').select(JOB_COLUMNS).eq('id', jobId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as CodexJob | null) ?? null;
}

/** Recently finished Codex evaluations — picks up results whose tab was closed or that were retried from the Content Center queue. */
export async function listRecentCodexJobs(sinceIso: string): Promise<CodexJob[]> {
  const { data, error } = await supabase.from('wr_jobs').select(JOB_COLUMNS)
    .in('job_type', ['growth_eval', 'funnel_media_eval']).eq('status', 'done').gte('finished_at', sinceIso)
    .order('finished_at', { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return ((data as unknown as CodexJob[]) ?? []).reverse();   // newest 20, applied oldest → newest
}

// ---------- "ของจริง": real touchpoints + CRM outcomes (2026-10-12) ----------
// Rows are written on the Mac mini (mac-mini-ops/funnel-lab/load_signals.py + services/funnel_signals_worker.mjs);
// the page reads the compact columns for the list and loads one full panel only when a row is opened.
export interface SignalRow {
  id: string;
  source: 'own_ad' | 'own_organic' | 'competitor';
  platform: string;
  url: string | null;
  title: string | null;
  owner: string | null;
  published_at: string | null;
  format: string | null;
  thumb_path: string | null;
  metrics: Record<string, unknown>;
  attribution: Record<string, number>;
  intent_stage: string | null;
  eval_summary: Record<string, any> | null;
  local_summary: Record<string, any> | null;
  pack_revision: string | null;
  engine: string | null;
  evaluated_at: string | null;
  eval_error: string | null;
  eval_requested_at: string | null;
}

const SIGNAL_LIST = 'id, source, platform, url, title, owner, published_at, format, thumb_path, metrics, attribution, intent_stage, eval_summary, local_summary, pack_revision, engine, evaluated_at, eval_error, eval_requested_at';

export async function listSignals(): Promise<SignalRow[]> {
  const rows: SignalRow[] = [];
  for (let from = 0; ; from += 500) {
    // id as tiebreaker: many ads share a date, and pages must not overlap or skip rows
    const { data, error } = await supabase.from('funnel_lab_signals').select(SIGNAL_LIST).order('published_at', { ascending: false, nullsFirst: false }).order('id').range(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...((data as SignalRow[]) ?? []));
    if (!data || data.length < 500) return rows;
  }
}

export async function fetchSignalDetail(id: string): Promise<{ creative: Record<string, string>; evaluation: Record<string, any> | null; transcript: string | null; metrics_history: unknown[] } | null> {
  const { data, error } = await supabase.from('funnel_lab_signals').select('creative, evaluation, transcript, metrics_history').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as any) ?? null;
}

/** Ask the mini to (re)run the Codex panel. ids = null → every row not evaluated with this pack revision. */
export async function requestSignalEvaluation(ids: string[] | null, packRevision: string): Promise<number> {
  let query = supabase.from('funnel_lab_signals').update({ eval_requested_at: new Date().toISOString() });
  query = ids ? query.in('id', ids) : query.or(`pack_revision.is.null,pack_revision.neq.${packRevision},eval_error.not.is.null`);
  const { data, error } = await query.select('id');
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function listChannelFunnel(): Promise<Record<string, any>[]> {
  const { data, error } = await supabase.from('funnel_lab_channel_funnel').select('*');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPersonaFunnel(packId: string): Promise<Record<string, any>[]> {
  const { data, error } = await supabase.from('funnel_lab_persona_funnel').select('*').eq('pack_id', packId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listCompanyFactsSummary(): Promise<Record<string, any>[]> {
  const { data, error } = await supabase.from('lead_company_facts').select('lead_id, matched, size_band, revenue_thb, sales_team_est, form_vs_reality, confidence');
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Signed URLs for many thumbnails in one request (private bucket). */
export async function signedThumbUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let start = 0; start < paths.length; start += 100) {
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths.slice(start, start + 100), 3600);
    if (error) throw new Error(error.message);
    for (const item of data ?? []) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
