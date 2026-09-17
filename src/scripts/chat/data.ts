// Chat Center — authenticated Supabase data layer. UI state is always reloaded after a write.
import { supabase, getSupabaseSession } from '../dashboard/supabase';

export interface OfferRow {
  code: string; pricing_key: string; display_order: number; one_liner: string;
  fit: string | null; not_fit: string | null; next_step: string | null;
  lp_url: string | null; outline_url: string | null; enabled: boolean; updated_at: string;
}
export interface SnippetRow {
  id: string; offer_code: string; slot: string; channel: string; body: string;
  faq_q: string | null; status: string; char_count: number; updated_at: string; updated_by: string | null;
}
export interface DeclaredRef { type: string; ref: string; url?: string }
export interface KeywordRow {
  id: string; keyword: string; aliases: string[]; aliases_exact: string[];
  match_mode: 'contains' | 'exact'; max_len: number; offer_code: string | null;
  freebie_id: string | null; declared_in: DeclaredRef[]; enabled: boolean; updated_at: string;
  hits_30d?: number; last_hit_at?: string | null;
}
export interface PublishRow {
  file: string; status: string; requested_at: string | null; db_hash: string | null;
  bot_hash: string | null; bot_written_at: string | null; error: string | null;
}
export interface PublishVersionRow { id: number; file: string; hash: string; created_at: string; created_by: string | null; note: string | null }
export interface KeywordStatRow { id: string; keyword: string; offer_code: string | null; hits_30d: number; hits_7d: number; near_miss_30d: number; last_hit_at: string | null }

async function requireSession() {
  const session = await getSupabaseSession();
  if (!session) throw Object.assign(new Error('ยังไม่ได้เข้าสู่ระบบ'), { code: 'invalid_token' });
  return session;
}

const NET_ERR = /failed to fetch|load failed|networkerror|network request failed|fetch failed|err_network/i;
const isNetErr = (e: unknown) => NET_ERR.test(String((e as { message?: string })?.message ?? e));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type QueryResult<T> = { data: T; error: { message: string } | null };

async function query<T>(build: () => PromiseLike<QueryResult<T>>, tries = 3): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    if (attempt > 1) await wait(300 * 2 ** (attempt - 2));
    try {
      const result = await build();
      if (!result.error) return result.data;
      if (!isNetErr(result.error)) throw new Error(result.error.message);
      last = result.error;
    } catch (error) {
      if (!isNetErr(error)) throw error;
      last = error;
    }
  }
  const detail = String((last as { message?: string })?.message ?? last ?? 'network error');
  throw new Error(`ต่อฐานข้อมูลไม่ได้ (${detail}) — เช็คเน็ตแล้วลองอีกครั้ง`);
}

export async function loadPublishState(): Promise<{ publish: PublishRow[]; versions: PublishVersionRow[] }> {
  await requireSession();
  const [publish, versions] = await Promise.all([
    query<PublishRow[]>(() => supabase.from('chat_publish').select('file,status,requested_at,db_hash,bot_hash,bot_written_at,error').order('file')),
    query<PublishVersionRow[]>(() => supabase.from('chat_publish_versions').select('id,file,hash,created_at,created_by,note').order('created_at', { ascending: false }).limit(50)),
  ]);
  return { publish: publish || [], versions: versions || [] };
}

export async function loadAll(): Promise<{ offers: OfferRow[]; snippets: SnippetRow[]; keywords: KeywordRow[]; publish: PublishRow[]; versions: PublishVersionRow[]; stats: KeywordStatRow[] }> {
  await requireSession();
  const [offers, snippets, keywords, publishState, stats] = await Promise.all([
    query<OfferRow[]>(() => supabase.from('chat_offers').select('*').order('display_order').order('code')),
    query<SnippetRow[]>(() => supabase.from('chat_snippets').select('*').order('offer_code').order('slot').order('channel')),
    query<KeywordRow[]>(() => supabase.from('chat_keywords').select('*').order('keyword')),
    loadPublishState(),
    loadKeywordStats(),
  ]);
  return { offers: offers || [], snippets: snippets || [], keywords: keywords || [], ...publishState, stats: stats || [] };
}

export async function loadKeywordStats(): Promise<KeywordStatRow[]> {
  await requireSession();
  return (await query<KeywordStatRow[]>(() => supabase.from('v_chat_keyword_stats').select('*'))) || [];
}

/** สั่งให้มินิเขียนไฟล์จากของที่อยู่ใน DB ตอนนี้ — pull-brain หยิบไปทำในรอบถัดไป (ไม่เกิน 5 นาที) */
export async function requestPublish(file: string): Promise<void> {
  const session = await requireSession();
  await query(() => supabase.from('chat_publish')
    .update({ status: 'requested', requested_at: new Date().toISOString(), requested_by: session.user?.email ?? 'owner', error: null, rollback_to_version: null })
    .eq('file', file).select('file'));
}

/** เอาไฟล์เวอร์ชันเก่ากลับไปให้บอทใช้ — ไม่ย้อนข้อมูลใน DB ดังนั้นหลังจากนี้จะขึ้นว่าไม่ตรงกับบอทโดยตั้งใจ */
export async function rollbackTo(file: string, versionId: number): Promise<void> {
  const session = await requireSession();
  await query(() => supabase.from('chat_publish')
    .update({ status: 'requested', rollback_to_version: versionId, requested_at: new Date().toISOString(), requested_by: session.user?.email ?? 'owner', error: null })
    .eq('file', file).select('file'));
}

export async function saveSnippet(id: string, patch: Pick<SnippetRow, 'body' | 'faq_q' | 'channel' | 'status'>): Promise<void> {
  const session = await requireSession();
  const writable = { body: patch.body, faq_q: patch.faq_q, channel: patch.channel, status: patch.status };
  await query(() => supabase.from('chat_snippets').update({ ...writable, updated_at: new Date().toISOString(), updated_by: session.user.email || session.user.id }).eq('id', id));
}

export async function saveKeyword(id: string, patch: Pick<KeywordRow, 'keyword' | 'aliases' | 'aliases_exact' | 'match_mode' | 'max_len' | 'offer_code' | 'declared_in' | 'enabled'>): Promise<void> {
  await requireSession();
  const writable = {
    keyword: patch.keyword, aliases: patch.aliases, aliases_exact: patch.aliases_exact,
    match_mode: patch.match_mode, max_len: patch.max_len, offer_code: patch.offer_code,
    declared_in: patch.declared_in, enabled: patch.enabled,
  };
  await query(() => supabase.from('chat_keywords').update({ ...writable, updated_at: new Date().toISOString() }).eq('id', id));
}
