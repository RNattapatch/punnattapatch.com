// Funnel Lab "ผลย้อนหลัง" (2026-10-17) — turns one funnel_lab_review_runs row into a "ใบตัดสิน" (verdict sheet).
// Rows are written by mac-mini-ops/funnel-lab/publish_review.mjs, which parses each review's out/report.md on the mini
// (carousel · แผน reel · เทียบ A/B ทั้ง loop). Pure: no DOM, no network — tested in tests/growth-lab/history.test.mjs.
//
// Why the sheet is shaped this way: the old screens showed every score for every persona, so the answer
// ("ใช้ตัวไหน · แก้อะไรก่อน") had to be dug out of a matrix. The sheet leads with the one-line verdict, then
// pick / fix / leak blocks, and only then the per-item cards, the score table and the full report.

export const KIND_THAI = Object.freeze({
  compare: 'เทียบ A/B', carousel: 'Carousel', reel_plan: 'แผน Reel', class_deck: 'Deck คลาส', other: 'รีวิว',
});

// tone → the lab's chip classes (gl-chip-scale/iterate/kill/draft) · rank → best first
const VERDICTS = Object.freeze({
  shoot_now: { label: 'ถ่ายได้เลย', tone: 'scale', rank: 0 },
  fix_small: { label: 'แก้นิดเดียว', tone: 'scale', rank: 1 },
  fix_then_shoot: { label: 'แก้แล้วค่อยถ่าย', tone: 'iterate', rank: 2 },
  rewrite: { label: 'เขียนใหม่', tone: 'kill', rank: 3 },
  drop: { label: 'ตัดทิ้ง', tone: 'kill', rank: 4 },
});

/** Tally/verdict key for one item: "win:B" for an A/B winner, else the verdict word. */
export const verdictKey = (item) => (item?.winner ? `win:${item.verdict}` : item?.verdict || 'none');

export function verdictInfo(key) {
  if (VERDICTS[key]) return { key, ...VERDICTS[key] };
  if (typeof key === 'string' && key.startsWith('win:')) {
    const who = key.slice(4);
    return who === 'เสมอ' ? { key, label: 'เสมอ', tone: 'draft', rank: 1 } : { key, label: `ชนะ: ${who}`, tone: 'scale', rank: 0 };
  }
  return { key, label: key === 'none' ? 'ไม่มีคำตัดสิน' : String(key), tone: 'draft', rank: 5 };
}

/** [{ key, label, tone, count }] best first — from meta.tally (list rows) or counted from the items (full rows). */
export function tally(source) {
  const counts = source?.sections ? allItems(source).reduce((t, i) => { const k = verdictKey(i); t[k] = (t[k] || 0) + 1; return t; }, {}) : source ?? {};
  return Object.entries(counts)
    .map(([key, count]) => ({ ...verdictInfo(key), count }))
    .sort((a, b) => a.rank - b.rank || b.count - a.count);
}

/** Every item with the section it came from. */
export function allItems(run) {
  return (run?.sections ?? []).flatMap((section) => (section.items ?? []).map((item) => ({ ...item, section: section.title })));
}

/** Carousel reports put one item per "##" — those render as one flat grid; reel plans / loops keep their headings. */
export function isFlat(run) {
  return (run?.sections ?? []).every((s) => (s.items ?? []).length <= 1 && (!s.items?.length || s.items[0].id === s.title));
}

const findGroup = (run, patterns) => {
  for (const pattern of patterns) {
    const group = (run?.summary ?? []).find((g) => pattern.test(g.label));
    if (group) return group;
  }
  return null;
};

const PICK = [/^อันดับ/, /ถ่ายก่อน/, /โพสต์ก่อน/, /ยิงแอดก่อน/];
const FIX = [/^แก้ก่อน|แก้ก่อน/, /^กติกาแก้/, /^กติกา/];
const LEAK = [/รูรั่ว/, /สาเหตุ/, /ทำให้ไม่/, /ซ้ำหลาย/];
const SKIP = [/ทิ้ง|พัก|เขียนใหม่/];

/**
 * The three answer blocks + whatever summary groups are left.
 * A/B runs answer "ใช้ตัวไหน" with their winners (their summary has no ranking group).
 */
export function sheet(run) {
  const items = allItems(run);
  let pick = findGroup(run, PICK);
  if (!pick && items.some((i) => i.winner)) {
    pick = {
      label: 'ตัวที่ชนะ',
      items: items.filter((i) => i.winner).map((i) => ({ ref: i.id, text: `${verdictInfo(verdictKey(i)).label} — ${i.bullets?.[0] ?? i.lead ?? ''}`.trim() })),
    };
  }
  const fix = findGroup(run, FIX);
  const leak = findGroup(run, LEAK);
  const skip = findGroup(run, SKIP);
  const used = new Set([pick, fix, leak, skip].filter(Boolean).map((g) => g.label));
  return { pick, fix, leak, skip, rest: (run?.summary ?? []).filter((g) => !used.has(g.label)) };
}

/** "S1 (H1)" / "c1-hero" / "D-ai-chat-bot-3-mistakes" → the item it names (for its title + cover), or null. */
export function resolveRef(run, ref) {
  if (!ref) return null;
  const items = allItems(run);
  return items.find((i) => i.id === ref) ?? items.find((i) => ref.startsWith(`${i.id} `) || ref.startsWith(`${i.id}(`)) ?? null;
}

/** For an A/B item: the input that won and the ones it beat (from meta.inputs, matched by pair). */
export function compareSides(run, item) {
  const inputs = (run?.meta?.inputs ?? []).filter((x) => x.pair && x.pair === item?.id);
  if (!inputs.length) return null;
  const winner = item.winner ? inputs.find((x) => x.variant === item.verdict) ?? null : null;
  return { winner, others: inputs.filter((x) => x !== winner) };
}

/** A human name for a card: its own title, else (A/B) the winning — or first — input's title without the "A · " prefix. */
export function displayTitle(run, item) {
  if (item?.title) return item.title;
  const inputs = (run?.meta?.inputs ?? []).filter((x) => x.pair && x.pair === item?.id);
  const pick = (item?.winner && inputs.find((x) => x.variant === item.verdict)) || inputs[0];
  return pick?.title ? pick.title.replace(/^[A-Z]\s*·\s*/u, '') : '';
}

/** Reel-plan and A/B items carry no lead line — their first bullet is the main reason, so it becomes the lead. */
export function itemText(item) {
  const bullets = item?.bullets ?? [];
  return item?.lead ? { lead: item.lead, bullets } : { lead: bullets[0] ?? '', bullets: bullets.slice(1) };
}

/** "ปก: 2/5 · เห็นว่า…" → { label: 'ปก', text: '2/5 · เห็นว่า…' } — only short labels count. */
export function bulletParts(text) {
  const m = String(text ?? '').match(/^([^:：—]{1,32})[:：]\s+(.+)$/s);
  return m ? { label: m[1].trim(), text: m[2].trim() } : { label: '', text: String(text ?? '') };
}

/** Plain-text block ready to paste to Codex/Claude/the team: the verdict + what to fix first. */
export function fixBrief(run) {
  const { pick, fix } = sheet(run);
  const lines = [`Funnel Lab · ${run.title} (${run.slug})`, '', run.headline ?? ''];
  if (pick?.items?.length) lines.push('', `${pick.label}:`, ...pick.items.map((x, i) => `${i + 1}. ${x.ref ? `${x.ref} — ` : ''}${x.text}`));
  if (fix?.items?.length) lines.push('', `${fix.label}:`, ...fix.items.map((x, i) => `${i + 1}. ${x.ref ? `${x.ref} — ` : ''}${x.text}`));
  return lines.join('\n').trim();
}

/** List filter: kind chip + free text over title / slug / headline. */
export function filterRuns(runs, { kind = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return (runs ?? []).filter((r) => (!kind || r.kind === kind)
    && (!q || [r.title, r.slug, r.headline].some((s) => String(s ?? '').toLowerCase().includes(q))));
}

/** Kinds present in the list, in a fixed order, with counts — for the filter chips. */
export function kindCounts(runs) {
  return Object.keys(KIND_THAI)
    .map((kind) => ({ kind, label: KIND_THAI[kind], count: (runs ?? []).filter((r) => r.kind === kind).length }))
    .filter((k) => k.count);
}
