// ชั้นสำรองของฟอร์มรับลูกค้าทุกหน้า — ใช้เมื่อตัวรับหลัก (form-hook บน Mac mini)
// ไม่ตอบ/ตอบ error เท่านั้น: เขียนตรงเข้า Supabase ผ่าน RPC ที่เปิดให้ anon เรียก
// (SECURITY DEFINER · datastore เดียวกับ dashboard) — เส้นนี้ไม่พึ่งมินิ ไม่พึ่ง n8n
//
// การ์ด Telegram ของ lead ที่เข้าทางนี้: DB trigger `trg_notify_fallback_lead`
// → Cloudflare worker line-guardian `/notify-lead` (ดู wiki/debug-log.md 2026-08-20)
//
// ⚠️ เส้นนี้ข้าม pipeline บนมินิทั้งหมด — ไม่มีใครแปลง alias ให้ payload ต้องมี
// key canonical ครบเอง (name/phone/company/…) ดู docs/INTAKE-DATA-CONTRACT.md

const RPC_BASE = 'https://yykocvhorgcgzaluuldn.supabase.co/rest/v1/rpc/';
// anon key เป็น public by design — ก้อนเดียวกับที่ฝังใน booking/intake-form
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a29jdmhvcmdjZ3phbHV1bGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjYwNTYsImV4cCI6MjA5NTgwMjA1Nn0.04ya1crnMRK6SgLfwhhxIp14DQ1n_ZkY5Fj-urTsv1E';

// ค่านี้คือสวิตช์ของ DB trigger — เปลี่ยนแล้วการ์ด fallback จะเงียบทันที ห้ามแตะ
export const FALLBACK_REASON = 'form-hook-unreachable';

export function makeReference(prefix = 'PN'): string {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function callRpc(fn: string, payload: Record<string, unknown>, timeoutMs: number): Promise<boolean> {
  const ctrl = new AbortController();
  const kill = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(RPC_BASE + fn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ payload }),
      signal: ctrl.signal,
      keepalive: true,
    });
    return res.ok;
  } catch (err) {
    console.error(`[lead-fallback] ${fn} failed`, err);
    return false;
  } finally {
    clearTimeout(kill);
  }
}

/** lead ทุกชนิด (booking · ads LP · sponsor · kit) → public.leads */
export function submitLeadFallback(
  payload: Record<string, unknown>,
  reference: string,
  timeoutMs = 8000,
): Promise<boolean> {
  return callRpc(
    'submit_lead',
    {
      ...payload,
      submittedAt: payload.submittedAt ?? payload.submitted_at ?? new Date().toISOString(),
      reference,
      fallback_reason: FALLBACK_REASON,
    },
    timeoutMs,
  );
}

/** ของฟรี / quiz → audience_* เท่านั้น — ห้ามหลงเข้า leads (กติกา Audience Center) */
export function submitAudienceFallback(
  payload: Record<string, unknown>,
  timeoutMs = 8000,
): Promise<boolean> {
  return callRpc('submit_audience', { ...payload, fallback_reason: FALLBACK_REASON }, timeoutMs);
}
