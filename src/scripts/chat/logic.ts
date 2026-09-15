// Chat Center — pure validation and formatting logic (no DOM, network, or price-code map).
// Prices are supplied by catalog.json at the call boundary. The code→pricing-key SSOT remains
// mac-mini-ops/line-relay/lib-pricing.mjs as required by Chat Center spec §16.3.

export interface CatalogPackage {
  key: string;
  amount_thb: number;
  bot_may_quote: boolean;
}

export interface CatalogLike { packages: CatalogPackage[] }

export interface ChatOffer {
  code: string;
  pricing_key: string;
  enabled: boolean;
}

export interface ChatSnippet {
  offer_code: string;
  slot: string;
  channel: string;
  body: string;
  faq_q?: string | null;
  status: string;
}

export type KeywordMatchMode = 'contains' | 'exact';

export interface ChatKeyword {
  id: string;
  keyword: string;
  aliases: string[];
  aliases_exact: string[];
  match_mode: KeywordMatchMode;
  enabled: boolean;
  offer_code?: string | null;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  code:
    | 'G01_REQUIRED_SLOTS' | 'G02_BOT_VOICE' | 'G03_BANNED_TERM'
    | 'G04_CLASS_NAMING' | 'G05_LENGTH_WARNING' | 'G05_LENGTH_BLOCK'
    | 'G06_PRICE_TOKEN' | 'G07_PRICE_PERMISSION' | 'G08_RAW_PRICE'
    | 'G09_BANK_ACCOUNT' | 'G10_KEYWORD_CONFLICT'
    | 'G11_PAYLOAD_JSON' | 'G11_PAYLOAD_SERVICES';
  severity: ValidationSeverity;
  message: string;
  ref?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface KeywordConflict {
  leftId: string;
  rightId: string;
  leftTerm: string;
  rightTerm: string;
  leftMode: KeywordMode;
  rightMode: KeywordMode;
}

export interface ChatCenterData {
  offers: ChatOffer[];
  snippets: ChatSnippet[];
  keywords: ChatKeyword[];
  payload: string;
}

type KeywordMode = KeywordMatchMode | 'exact-alias';
interface KeywordTerm { id: string; term: string; normalized: string; mode: KeywordMode }

const BANNED = [
  'ใบกำกับภาษี', 'การันตี', 'รับประกันผล', 'เจ้าเดียว', 'คนแรก',
  'สูตรลับ', 'ใช้ได้กับทุกธุรกิจ', 'สร้างยอดทันที', 'Lifetime Support', 'ลดคนได้แน่นอน',
];
const PRICE_TOKEN = /\{\{price:([^{}]+)\}\}/g;
const RAW_PRICE = /(?<!\d)\d{2,3},\d{3}(?!\d)/g;
const BANK_ACCOUNT = /(?<!\d)\d{3}-\d-\d{5}-\d(?!\d)/;

const result = (issues: ValidationIssue[]): ValidationResult => ({
  valid: !issues.some((issue) => issue.severity === 'error'),
  issues,
});

const packageMap = (catalog: CatalogLike): Map<string, CatalogPackage> =>
  new Map((catalog?.packages || []).map((item) => [item.key, item]));

/** Render price tokens as comma-formatted digits. The source copy owns any currency symbol. */
export function renderTokens(body: string, catalog: CatalogLike): string {
  const packages = packageMap(catalog);
  return String(body).replace(PRICE_TOKEN, (_token, rawKey: string) => {
    const key = rawKey.trim();
    const item = packages.get(key);
    if (!item || !Number.isFinite(Number(item.amount_thb))) {
      throw new Error(`ราคา key "${key}" ไม่มีใน catalog — ตรวจชื่อ key`);
    }
    return Number(item.amount_thb).toLocaleString('en-US', { maximumFractionDigits: 0 });
  });
}

function courseNamingIssue(body: string): boolean {
  for (const hit of body.matchAll(/คอร์ส/g)) {
    const around = body.slice(Math.max(0, hit.index! - 40), hit.index! + 60);
    if (!/อ\.เบิร์ด|Sales\s*100/i.test(around)) return true;
  }
  return false;
}

function hasBankAccount(body: string): boolean {
  if (BANK_ACCOUNT.test(body)) return true;
  return body.split(/\r?\n/).some((line) => {
    const contextAt = line.indexOf('บัญชี');
    if (contextAt < 0) return false;
    const candidates = line.slice(contextAt + 'บัญชี'.length).match(/[\d\s-]{10,24}/g) || [];
    return candidates.some((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 12;
    });
  });
}

/** Validate the snippet-scoped gates (G02–G09). */
export function validateSnippet(snippet: ChatSnippet, catalog: CatalogLike): ValidationResult {
  const issues: ValidationIssue[] = [];
  const body = String(snippet?.body || '');
  const ref = `${snippet?.offer_code || '?'}:${snippet?.slot || '?'}`;

  if (/ครับ/.test(body)) issues.push({ code: 'G02_BOT_VOICE', severity: 'error', message: 'ข้อความบอทต้องใช้เสียง “ค่ะ” และห้ามมี “ครับ”', ref });

  for (const phrase of BANNED) {
    if (body.toLocaleLowerCase().includes(phrase.toLocaleLowerCase())) {
      issues.push({ code: 'G03_BANNED_TERM', severity: 'error', message: `มีคำต้องห้าม “${phrase}”`, ref });
    }
  }

  if (courseNamingIssue(body)) issues.push({ code: 'G04_CLASS_NAMING', severity: 'error', message: 'ใช้ “คลาส” แทน “คอร์ส” ยกเว้นบริบทคู่แข่งที่กำหนด', ref });

  if (body.length > 1900) issues.push({ code: 'G05_LENGTH_BLOCK', severity: 'error', message: `ข้อความยาว ${body.length} ตัวอักษร เกินเพดาน 1,900`, ref });
  else if (body.length > 1200) issues.push({ code: 'G05_LENGTH_WARNING', severity: 'warning', message: `ข้อความยาว ${body.length} ตัวอักษร ควรทบทวนก่อน publish`, ref });

  const packages = packageMap(catalog);
  for (const token of body.matchAll(PRICE_TOKEN)) {
    const key = token[1].trim();
    const item = packages.get(key);
    if (!item) issues.push({ code: 'G06_PRICE_TOKEN', severity: 'error', message: `ราคา key “${key}” ไม่มีใน catalog — ตรวจชื่อ key`, ref });
    else if (!item.bot_may_quote) issues.push({ code: 'G07_PRICE_PERMISSION', severity: 'error', message: `ราคา key “${key}” ตั้ง bot_may_quote=false`, ref });
  }
  if (/\{\{price:/.test(body.replace(PRICE_TOKEN, ''))) {
    issues.push({ code: 'G06_PRICE_TOKEN', severity: 'error', message: 'รูปแบบ price token ไม่สมบูรณ์', ref });
  }

  const rawPrices = [...body.matchAll(RAW_PRICE)].map((match) => match[0]);
  if (rawPrices.length) issues.push({ code: 'G08_RAW_PRICE', severity: 'error', message: `พบราคาดิบ ${rawPrices.join(', ')} — เปลี่ยนเป็น {{price:key}}`, ref });

  if (hasBankAccount(body)) issues.push({ code: 'G09_BANK_ACCOUNT', severity: 'error', message: 'พบเลขที่หน้าตาเป็นบัญชีธนาคารใน snippet', ref });

  return result(issues);
}

const normalizeKeyword = (value: string): string => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactAliasMatches = (base: string, input: string): boolean =>
  input === base || new RegExp(`^${escapeRegex(base)}[\\s0-9คน]*$`).test(input);

function keywordTerms(item: ChatKeyword): KeywordTerm[] {
  const regular = [item.keyword, ...(item.aliases || [])].map((term) => ({
    id: item.id, term, normalized: normalizeKeyword(term), mode: item.match_mode,
  }));
  const exactAliases = (item.aliases_exact || []).map((term) => ({
    id: item.id, term, normalized: normalizeKeyword(term), mode: 'exact-alias' as const,
  }));
  return [...regular, ...exactAliases].filter((entry) => entry.normalized);
}

function termsConflict(left: KeywordTerm, right: KeywordTerm): boolean {
  // Spec §16.1: exact-alias is a third mode; it must not collide with contains.
  if ((left.mode === 'exact-alias' && right.mode === 'contains') || (left.mode === 'contains' && right.mode === 'exact-alias')) return false;
  if (left.mode === 'contains' && right.mode === 'contains') return left.normalized.includes(right.normalized) || right.normalized.includes(left.normalized);
  if (left.mode === 'exact-alias' && right.mode === 'exact-alias') return exactAliasMatches(left.normalized, right.normalized) || exactAliasMatches(right.normalized, left.normalized);
  if (left.mode === 'exact-alias') return exactAliasMatches(left.normalized, right.normalized);
  if (right.mode === 'exact-alias') return exactAliasMatches(right.normalized, left.normalized);
  if (left.mode === 'contains') return right.normalized.includes(left.normalized);
  if (right.mode === 'contains') return left.normalized.includes(right.normalized);
  return left.normalized === right.normalized;
}

/** Report cross-row keyword collisions while preserving contains/exact/exact-alias semantics. */
export function keywordConflicts(list: ChatKeyword[]): KeywordConflict[] {
  const terms = (list || []).filter((item) => item.enabled !== false).flatMap(keywordTerms);
  const conflicts: KeywordConflict[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const left = terms[i], right = terms[j];
      if (left.id === right.id || !termsConflict(left, right)) continue;
      const key = [left.id, right.id].sort().join('\0');
      if (seen.has(key)) continue;
      seen.add(key);
      conflicts.push({ leftId: left.id, rightId: right.id, leftTerm: left.term, rightTerm: right.term, leftMode: left.mode, rightMode: right.mode });
    }
  }
  return conflicts;
}

/** Validate batch-scoped gates G01, G10, and G11 plus every snippet-scoped gate. */
export function validateChatCenter(data: ChatCenterData, catalog: CatalogLike): ValidationResult {
  const issues: ValidationIssue[] = [];
  const enabledOffers = (data.offers || []).filter((item) => item.enabled);
  const liveSnippets = (data.snippets || []).filter((item) => item.status === 'live');

  for (const offer of enabledOffers) {
    const slots = new Set(liveSnippets.filter((item) => item.offer_code === offer.code).map((item) => item.slot));
    const missing = ['b1', 'b2'].filter((slot) => !slots.has(slot));
    if (missing.length) issues.push({ code: 'G01_REQUIRED_SLOTS', severity: 'error', message: `${offer.code} ขาด ${missing.join(' และ ')}`, ref: offer.code });
  }

  for (const item of data.snippets || []) issues.push(...validateSnippet(item, catalog).issues);

  for (const conflict of keywordConflicts(data.keywords || [])) {
    issues.push({ code: 'G10_KEYWORD_CONFLICT', severity: 'error', message: `keyword “${conflict.leftTerm}” ชนกับ “${conflict.rightTerm}”`, ref: `${conflict.leftId}:${conflict.rightId}` });
  }

  let parsed: unknown;
  let parsedOk = true;
  try {
    parsed = JSON.parse(data.payload);
  } catch {
    parsedOk = false;
    issues.push({ code: 'G11_PAYLOAD_JSON', severity: 'error', message: 'payload ที่ประกอบไม่ใช่ JSON ที่ parse ได้' });
  }
  if (parsedOk && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) {
    issues.push({ code: 'G11_PAYLOAD_SERVICES', severity: 'error', message: 'payload ต้องเป็น object ที่มี services' });
  } else if (parsedOk) {
    const services = (parsed as { services?: unknown }).services;
    if (!services || typeof services !== 'object' || Array.isArray(services)) {
      issues.push({ code: 'G11_PAYLOAD_SERVICES', severity: 'error', message: 'payload ไม่มี services object' });
    } else {
      for (const offer of enabledOffers) {
        const service = (services as Record<string, unknown>)[offer.code];
        if (!service || typeof service !== 'object') {
          issues.push({ code: 'G11_PAYLOAD_SERVICES', severity: 'error', message: `payload ขาด service ${offer.code}`, ref: offer.code });
          continue;
        }
        const row = service as Record<string, unknown>;
        const blocks = row.blocks;
        const complete = typeof row.name === 'string'
          && Array.isArray(row.keywords)
          && Array.isArray(row.tags)
          && typeof row.enabled === 'boolean'
          && !!blocks && typeof blocks === 'object' && !Array.isArray(blocks)
          && typeof (blocks as Record<string, unknown>).b1 === 'string'
          && typeof (blocks as Record<string, unknown>).b2 === 'string'
          && Array.isArray(row.faq);
        if (!complete) issues.push({ code: 'G11_PAYLOAD_SERVICES', severity: 'error', message: `service ${offer.code} มีโครงสร้างไม่ครบ`, ref: offer.code });
      }
    }
  }

  return result(issues);
}
