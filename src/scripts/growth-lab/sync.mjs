// Growth Lab sync rules — pure, so every case the page can hit is unit-tested (tests/growth-lab/sync.test.mjs).
//
// Local copy = one localStorage envelope {v, rev, dirty, state}: the state and the cloud rev it is based on are
// written together, so a failed write can never leave "new rev + old content" behind.
// Cloud copy = growth_lab_workspaces row (rev = optimistic lock, app_version = data format of the writer;
// the database refuses a write from an older format and keeps every replaced version in a history table).

// Bump when the saved state shape changes in a way older pages cannot read. Older open tabs then go
// read-only instead of writing an older shape over newer data.
// 3 (2026-10-12): packs may hold up to 60 personas and touchpoints may be organic TikTok/IG/FB posts — a v2 page
// would drop both as invalid, so it must stop writing.
export const DATA_VERSION = 3;

// Fields that only describe what this screen is looking at. They are kept per device and never make the
// workspace "dirty", so tapping a tab on the iPhone cannot conflict with an edit on the MacBook.
export const UI_FIELDS = Object.freeze(['activeView', 'selectedCreativeId', 'selectedPersonaPackId']);

// Fields that decide a score. A Codex result applies only to a touchpoint whose fields still match.
const SCORING_FIELDS = Object.freeze(['hook', 'primaryText', 'headline', 'offer', 'cta', 'visualDirection', 'touchpointType', 'channel', 'businessModel', 'journeyStage', 'personaPackId']);

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

/** Key-order independent fingerprint of what was evaluated (jsonb reorders keys, so plain JSON.stringify is not stable). */
export function contentRevision(creative) {
  const fields = Object.fromEntries(SCORING_FIELDS.map((field) => [field, String(creative?.[field] ?? '')]));
  // The attached image/video is scored too: its sha256 joins the fingerprint (only when present, so revisions of
  // text-only touchpoints made before media existed stay valid).
  if (creative?.media?.sha256) fields.media = creative.media.sha256;
  return stableStringify(fields);
}

/**
 * What to do after reading the cloud copy.
 * local: { rev: number|null, dirty: boolean }   — rev is null when this browser never synced or its copy was unusable
 * remote: { rev, app_version } | null           — null when no cloud row exists yet
 * Returns one of:
 *   'insert'       no cloud row yet → create it from this browser
 *   'read-only'    cloud was written by a newer page → stop writing, ask for a reload
 *   'in-sync'      same rev, nothing local to send
 *   'push'         same rev, local edits → send them
 *   'adopt'        cloud is newer and nothing local is unsent → load cloud
 *   'adopt-keep-local'  both changed (or this browser never synced but has work) → load cloud, keep local as a backup copy
 */
export function decideSync(local, remote, dataVersion = DATA_VERSION) {
  if (!remote) return 'insert';
  if (Number(remote.app_version ?? 0) > dataVersion) return 'read-only';
  if (!local.dirty) return local.rev === remote.rev ? 'in-sync' : 'adopt';
  if (local.rev !== null && local.rev === remote.rev) return 'push';
  return 'adopt-keep-local';
}

/** Copy this device's view fields onto a state that came from elsewhere, when they still point at something real. */
export function withLocalUi(incoming, current) {
  const next = structuredClone(incoming);
  if (!current) return next;
  if (current.activeView) next.activeView = current.activeView;
  if (next.creatives.some((creative) => creative.id === current.selectedCreativeId)) next.selectedCreativeId = current.selectedCreativeId;
  if (next.personaPacks.some((pack) => pack.id === current.selectedPersonaPackId)) next.selectedPersonaPackId = current.selectedPersonaPackId;
  return next;
}

/**
 * Should a finished Codex job be applied to the current workspace?
 * job: { creative (the payload creative), result: { evaluation, journey } }
 * Returns { apply: boolean, reason: 'ok'|'missing'|'edited'|'pack-changed'|'already'|'superseded'|'invalid' }.
 */
export function codexJobVerdict(job, state, packRevisionOf) {
  const evaluation = job?.result?.evaluation;
  const sent = job?.creative;
  if (!evaluation || !job?.result?.journey || !sent?.id) return { apply: false, reason: 'invalid' };
  const creative = state.creatives.find((item) => item.id === sent.id);
  if (!creative) return { apply: false, reason: 'missing' };
  if (contentRevision(creative) !== contentRevision(sent)) return { apply: false, reason: 'edited' };
  // A result for a touchpoint with an image/video counts only if Codex actually saw the file.
  if (sent.media && evaluation.engine !== 'codex-media') return { apply: false, reason: 'needs-media' };
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId);
  if (!pack || packRevisionOf(pack) !== evaluation.personaPackRevision) return { apply: false, reason: 'pack-changed' };
  const current = state.evaluations[creative.id];
  if ((job.id && current?.sourceJobId === job.id) || (current?.evaluatedAt && current.evaluatedAt === evaluation.evaluatedAt)) return { apply: false, reason: 'already' };
  // Only a newer *Codex* result outranks this one — both stamps come from the Mac mini clock. A Local run of the
  // same content never blocks the deeper Codex result (browser clocks can drift, and Local is the baseline).
  if (String(current?.engine ?? '').startsWith('codex') && Date.parse(current.evaluatedAt) > Date.parse(evaluation.evaluatedAt)) return { apply: false, reason: 'superseded' };
  return { apply: true, reason: 'ok' };
}

// ---------- core vs results ----------
// The cloud core row holds everything except evaluations/journeys (small, conflict-checked by rev).
// Results live one row per touchpoint in growth_lab_results (newest evaluation wins, no conflicts needed:
// they are derived data, and each carries the contentRevision of the text it scored).

export function coreOf(state) {
  return { ...state, evaluations: {}, journeys: {} };
}

/** What a content edit changes — view fields and results excluded. */
export function coreFingerprint(state) {
  const { activeView, selectedCreativeId, selectedPersonaPackId, evaluations, journeys, ...core } = state ?? {};
  return stableStringify(core);
}

function fnv(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Row key of a result: what it scored (text fingerprint + pack revision). A result for other text never shares a key. */
export function resultKey(creative, pack, packRevisionOf) {
  return `${fnv(contentRevision(creative))}-${packRevisionOf(pack)}`;
}

export function engineClass(evaluation) {
  return String(evaluation?.engine ?? '').startsWith('codex') ? 'codex' : 'local';
}

/** For the same text + pack: a Codex result beats a Local one; same engine → newer. (No cross-machine clock race for Codex vs Local.) */
export function outranks(candidate, current) {
  if (!current?.evaluatedAt) return true;
  const a = engineClass(candidate);
  const b = engineClass(current);
  if (a !== b) return a === 'codex';
  return Date.parse(candidate.evaluatedAt) > Date.parse(current.evaluatedAt);
}

function currentKey(state, creative, packRevisionOf) {
  const pack = state.personaPacks.find((item) => item.id === creative.personaPackId);
  return pack ? resultKey(creative, pack, packRevisionOf) : null;
}

/** Results for the current text that differ from what this device last uploaded. synced = {creativeId: "key@evaluatedAt"}. */
export function pendingResultUploads(state, synced, packRevisionOf) {
  const rows = [];
  for (const creative of state.creatives) {
    const evaluation = state.evaluations?.[creative.id];
    const journey = state.journeys?.[creative.id];
    if (!evaluation || !journey || evaluation.contentRevision !== contentRevision(creative)) continue;
    const key = currentKey(state, creative, packRevisionOf);
    if (!key || synced?.[creative.id] === `${key}@${evaluation.evaluatedAt}`) continue;
    rows.push({ creative_id: creative.id, result_key: key, engine: engineClass(evaluation), evaluation, journey, evaluated_at: evaluation.evaluatedAt });
  }
  return rows;
}

/** Keys of the results this state would want from the cloud (one per touchpoint, for its current text + pack). */
export function wantedResultKeys(state, packRevisionOf) {
  return Object.fromEntries(state.creatives.map((creative) => [creative.id, currentKey(state, creative, packRevisionOf)]).filter(([, key]) => key));
}

/**
 * Fold result rows from the cloud into a state: only rows keyed to the touchpoint's current text + pack, and only
 * when they outrank what this device shows. Returns { state, taken: [creativeIds] }.
 */
export function mergeResults(state, rows, packRevisionOf) {
  const keys = wantedResultKeys(state, packRevisionOf);
  const next = { ...state, evaluations: { ...state.evaluations }, journeys: { ...state.journeys } };
  const taken = [];
  for (const row of rows ?? []) {
    const evaluation = row?.evaluation;
    if (!evaluation || !row.journey || keys[row.creative_id] !== row.result_key) continue;
    const creative = next.creatives.find((item) => item.id === row.creative_id);
    if (evaluation.contentRevision !== contentRevision(creative)) continue;
    if (!outranks(evaluation, next.evaluations[creative.id])) continue;
    next.evaluations[creative.id] = evaluation;
    next.journeys[creative.id] = row.journey;
    taken.push(creative.id);
  }
  return { state: next, taken };
}
