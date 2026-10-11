import { calculateMetrics, validateActual } from './metrics.mjs';
import { isSafeId } from './ids.mjs';

const ALIASES = Object.freeze({
  creativeId: ['creative_id', 'ad_id', 'id'],
  campaign: ['campaign', 'campaign_name'],
  name: ['name', 'ad_name', 'creative_name'],
  objective: ['objective', 'campaign_objective'],
  changedVariable: ['changed_variable', 'test_variable'],
  date: ['date', 'day', 'reporting_starts'],
  spend: ['spend', 'amount_spent', 'amount_spent_thb'],
  impressions: ['impressions'],
  clicks: ['clicks', 'link_clicks', 'outbound_clicks'],
  landingViews: ['landing_views', 'landing_page_views', 'lpv'],
  leads: ['leads'],
  qualifiedLeads: ['qualified_leads', 'mql', 'sql'],
  purchases: ['purchases', 'orders'],
  revenue: ['revenue', 'purchase_value', 'conversion_value'],
  verdict: ['verdict'],
  stopRate: ['stop_rate'],
  averageScore: ['average_score'],
  weakestComponent: ['weakest_component'],
});

const NUMERIC_FIELDS = new Set(['spend', 'impressions', 'clicks', 'landingViews', 'leads', 'qualifiedLeads', 'purchases', 'revenue']);
const REQUIRED_FIELDS = Object.freeze(['creativeId', 'date', ...NUMERIC_FIELDS]);

function normalizeHeader(header) {
  return String(header).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function indexFor(headers, field) {
  const accepted = ALIASES[field] ?? [field];
  return headers.findIndex((header) => accepted.includes(header));
}

function valueFor(row, headerIndexes, field, fallback = '') {
  const index = headerIndexes[field];
  return index >= 0 ? row[index] ?? fallback : fallback;
}

export function parseCsv(text) {
  const rows = parseRows(text);
  if (rows.length < 2) return Object.freeze({ records: Object.freeze([]), errors: Object.freeze([{ row: 1, reasons: ['CSV ต้องมี header และข้อมูลอย่างน้อย 1 แถว'] }]) });
  const headers = rows[0].map(normalizeHeader);
  const headerIndexes = Object.fromEntries(Object.keys(ALIASES).map((field) => [field, indexFor(headers, field)]));
  const missingHeaders = REQUIRED_FIELDS.filter((field) => headerIndexes[field] < 0);
  if (missingHeaders.length) {
    return Object.freeze({
      records: Object.freeze([]),
      errors: Object.freeze([{ row: 1, reasons: Object.freeze([`header ที่จำเป็นหายไป: ${missingHeaders.join(', ')}`]) }]),
    });
  }
  const records = [];
  const errors = [];
  const seenIds = new Map();

  rows.slice(1).forEach((row, offset) => {
    const actual = {
      creativeId: String(valueFor(row, headerIndexes, 'creativeId')).trim(),
      date: String(valueFor(row, headerIndexes, 'date')).trim(),
    };
    for (const field of NUMERIC_FIELDS) {
      const raw = String(valueFor(row, headerIndexes, field, '')).replace(/,/g, '').trim();
      actual[field] = raw === '' ? Number.NaN : Number(raw);
    }
    const validation = validateActual(actual);
    const reasons = Object.entries(validation.errors).map(([field, message]) => `${field}: ${message}`);
    if (!actual.creativeId) reasons.push('creativeId: ต้องมี creative_id หรือ ad_id');
    else if (!isSafeId(actual.creativeId)) reasons.push('creativeId: ใช้ได้เฉพาะ A-Z, 0-9, จุด, ขีด, underscore หรือ colon และห้ามใช้ชื่อสงวน');
    if (seenIds.has(actual.creativeId)) reasons.push(`creativeId: ซ้ำกับแถว ${seenIds.get(actual.creativeId)}`);
    if (reasons.length) {
      errors.push(Object.freeze({ row: offset + 2, reasons: Object.freeze(reasons) }));
      return;
    }
    seenIds.set(actual.creativeId, offset + 2);
    records.push(Object.freeze({
      row: offset + 2,
      name: String(valueFor(row, headerIndexes, 'name')).trim(),
      campaign: String(valueFor(row, headerIndexes, 'campaign')).trim(),
      objective: String(valueFor(row, headerIndexes, 'objective', 'leads')).trim() || 'leads',
      changedVariable: String(valueFor(row, headerIndexes, 'changedVariable')).trim(),
      evaluation: Object.freeze({
        verdict: String(valueFor(row, headerIndexes, 'verdict')).trim(),
        stopRate: Number(valueFor(row, headerIndexes, 'stopRate', 0)) || 0,
        averageScore: Number(valueFor(row, headerIndexes, 'averageScore', 0)) || 0,
        weakestComponent: String(valueFor(row, headerIndexes, 'weakestComponent')).trim(),
      }),
      actual: Object.freeze(actual),
    }));
  });
  return Object.freeze({ records: Object.freeze(records), errors: Object.freeze(errors) });
}

const EXPORT_HEADERS = Object.freeze([
  'creative_id', 'campaign', 'name', 'objective', 'changed_variable', 'date',
  'spend', 'impressions', 'clicks', 'landing_views', 'leads', 'qualified_leads', 'purchases', 'revenue',
  'verdict', 'stop_rate', 'average_score', 'weakest_component',
  'cpm', 'ctr', 'cpc', 'lpv_rate', 'cvr', 'cpl', 'cpql', 'cpa', 'roas',
]);

function escaped(value) {
  const original = value === null || value === undefined ? '' : String(value);
  const text = typeof value === 'string' && /^[=+\-@]/.test(original) ? `'${original}` : original;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function applyCsvRecords(currentState, records) {
  const state = structuredClone(currentState);
  let applied = 0;
  const errors = [];
  const now = new Date().toISOString();
  const selectedPack = state.personaPacks.find((pack) => pack.id === state.selectedPersonaPackId) ?? state.personaPacks[0];
  if (!selectedPack) return Object.freeze({ state, applied: 0, errors: Object.freeze([{ row: 0, reasons: Object.freeze(['ไม่พบ Persona Pack สำหรับสร้าง Imported Meta touchpoint']) }]) });
  for (const record of records) {
    const id = record.actual.creativeId;
    if (!isSafeId(id)) {
      errors.push(Object.freeze({ row: record.row ?? 0, reasons: Object.freeze(['creativeId ไม่ปลอดภัย']) }));
      continue;
    }
    let creative = state.creatives.find((item) => item.id === id);
    if (creative && (creative.channel !== 'meta' || creative.touchpointType !== 'meta-ad')) {
      errors.push(Object.freeze({ row: record.row ?? 0, reasons: Object.freeze(['creativeId นี้เป็น touchpoint ช่องทางอื่น ไม่สามารถผูก Meta CSV ได้']) }));
      continue;
    }
    if (!creative) {
      creative = {
        id,
        campaign: record.campaign || 'Imported Meta results',
        name: record.name || `Imported ${id}`,
        objective: record.objective || 'leads',
        format: 'unknown',
        changedVariable: record.changedVariable || 'hook',
        hook: '', primaryText: '', headline: '', offer: '', cta: '', visualDirection: '',
        touchpointType: 'meta-ad', channel: 'meta', businessModel: selectedPack.businessModel,
        journeyStage: selectedPack.journeyStages[0].id, personaPackId: selectedPack.id,
        createdAt: now, updatedAt: now,
      };
      state.creatives.push(creative);
    }
    state.actuals[id] = structuredClone(record.actual);
    applied += 1;
  }
  return Object.freeze({ state, applied, errors: Object.freeze(errors) });
}

export function toCsv(rows) {
  const body = rows.map(({ creative = {}, evaluation = {}, actual = {} }) => {
    const metrics = calculateMetrics(actual);
    const values = {
      creative_id: creative.id ?? actual.creativeId,
      campaign: creative.campaign,
      name: creative.name,
      objective: creative.objective,
      changed_variable: creative.changedVariable,
      date: actual.date,
      spend: actual.spend,
      impressions: actual.impressions,
      clicks: actual.clicks,
      landing_views: actual.landingViews,
      leads: actual.leads,
      qualified_leads: actual.qualifiedLeads,
      purchases: actual.purchases,
      revenue: actual.revenue,
      verdict: evaluation.verdict,
      stop_rate: evaluation.stopRate,
      average_score: evaluation.averageScore,
      weakest_component: evaluation.weakestComponent,
      cpm: metrics.cpm,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      lpv_rate: metrics.lpvRate,
      cvr: metrics.cvr,
      cpl: metrics.cpl,
      cpql: metrics.cpql,
      cpa: metrics.cpa,
      roas: metrics.roas,
    };
    return EXPORT_HEADERS.map((header) => escaped(values[header])).join(',');
  });
  return [EXPORT_HEADERS.join(','), ...body].join('\n');
}
