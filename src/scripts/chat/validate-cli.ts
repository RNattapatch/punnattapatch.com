// Generated into mac-mini-ops/line-relay/validate-snippet.mjs with esbuild.
// It imports the same pure logic used by /app/chat; no validation rule is copied here.

import { validateChatCenter, type CatalogLike, type ChatKeyword, type ChatOffer, type ChatSnippet } from './logic.ts';

const args = process.argv.slice(2);
if (!args.includes('--all')) {
  console.error('usage: node validate-snippet.mjs --all [--strict]');
  process.exit(2);
}

const url = process.env.SUPABASE_URL || 'https://yykocvhorgcgzaluuldn.supabase.co';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE || '';
if (!serviceRole) {
  console.error('❌ ไม่มี SUPABASE_SERVICE_ROLE ใน env');
  process.exit(2);
}

async function loadTable<T>(path: string): Promise<T[]> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Supabase ${path.split('?')[0]} ตอบ ${response.status}`);
  return response.json() as Promise<T[]>;
}

const catalogResponse = await fetch('https://punnattapatch.com/catalog.json', { signal: AbortSignal.timeout(10_000) });
if (!catalogResponse.ok) throw new Error(`catalog.json ตอบ ${catalogResponse.status}`);
const catalog = await catalogResponse.json() as CatalogLike;

const [offers, snippets, keywords] = await Promise.all([
  loadTable<ChatOffer>('chat_offers?select=code,pricing_key,enabled&order=display_order'),
  loadTable<ChatSnippet>('chat_snippets?select=offer_code,slot,channel,body,faq_q,status&order=offer_code,slot'),
  loadTable<ChatKeyword>('chat_keywords?select=id,keyword,aliases,aliases_exact,match_mode,enabled,offer_code&order=keyword'),
]);

const packageByKey = new Map(catalog.packages.map((item) => [item.key, item]));
const payload = JSON.stringify({
  services: Object.fromEntries(offers.filter((offer) => offer.enabled).map((offer) => {
    const own = snippets.filter((item) => item.offer_code === offer.code && item.status === 'live');
    const blocks = Object.fromEntries(own.filter((item) => /^b[1-6]$/.test(item.slot)).map((item) => [item.slot, item.body]));
    const faq = own.filter((item) => item.slot === 'faq').map((item) => ({ q: item.faq_q || '', a: item.body }));
    const offerKeywords = keywords.filter((item) => item.enabled && item.offer_code === offer.code);
    return [offer.code, {
      name: (packageByKey.get(offer.pricing_key) as { name?: string } | undefined)?.name || offer.code,
      keywords: offerKeywords.flatMap((item) => [item.keyword, ...(item.aliases || [])]),
      tags: [offer.code], enabled: true, blocks, faq,
    }];
  })),
});

const validation = validateChatCenter({ offers, snippets, keywords, payload }, catalog);
const errors = validation.issues.filter((item) => item.severity === 'error');
const warnings = validation.issues.filter((item) => item.severity === 'warning');

console.log(`Chat Center G2 scan: offers ${offers.length} · snippets ${snippets.length} · keywords ${keywords.length}`);
console.log(`gate findings: errors ${errors.length} · warnings ${warnings.length}`);
for (const issue of validation.issues) console.log(`${issue.severity === 'error' ? '❌' : '⚠️'} ${issue.code} ${issue.ref || '-'} — ${issue.message}`);
if (!validation.issues.length) console.log('✅ ข้อมูลทั้งหมดผ่าน gate 11 ข้อ');
else console.log('✅ validator ทำงานครบและรายงานข้อมูลเดิมที่ยังต้องแก้ใน milestone ถัดไป');

if (args.includes('--strict') && errors.length) process.exit(1);
