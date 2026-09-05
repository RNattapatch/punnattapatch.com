// LINE prefilled message — ปุ่ม LINE ทุกปุ่มเปิดแชตพร้อมข้อความที่พิมพ์ให้แล้ว
// ทำไม (ปันสั่ง 2026-09-06): ลูกค้าไม่พิมพ์คีย์เวิร์ด "ONLINE SALES" เอง (พิมพ์ "สวัสดีค่ะ"/"สนใจ"/ส่งรูป)
// → ใส่แท็ก [T2/<angle>] ไว้ในข้อความแทน ลูกค้าแค่กดส่ง บอท LINE (mac-mini-ops/line-relay) แกะแท็กไป
// เขียน leads.ad_angle ได้เหมือนสายฟอร์ม · ถ้าลูกค้าลบข้อความแล้วพิมพ์เอง = กลับไปเป็นแบบเดิม ไม่เสียอะไร
//
// รูปแบบลิงก์: https://line.me/R/oaMessage/<@oaId>/?<ข้อความ url-encoded>
// ถ้ายังไม่ได้เป็นเพื่อน LINE จะพาไป add friend ก่อนแล้วเปิดแชตพร้อมข้อความ (ต้องเทสต์บนมือถือจริง)

export const COURSE_LABEL: Record<string, string> = {
  T1: 'คอร์สจิตวิทยาการขาย + AI Agent',
  T2: 'คอร์สเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI',
  T3: 'คอร์สวางระบบหลังบ้านฝ่ายขาย',
  T4: 'คอร์ส Advance AI & Business Automation',
  C1: 'บริการที่ปรึกษาวางระบบฝ่ายขายรายวัน',
  I1: 'บริการวางระบบ Dashboard',
};

export const ANGLE_PATTERN = /^[a-z0-9-]{1,40}$/;

/** แท็กท้ายข้อความที่บอทแกะ — [T2/sell-good-no-lead] · ไม่มี angle = [T2] · หน้าทั่วไป = [WEB] */
export function buildTag(productCode: string | undefined, angle: string | undefined): string {
  const code = /^(T[1-4]|C1|I1)$/.test(productCode || '') ? (productCode as string) : 'WEB';
  const safeAngle = angle && ANGLE_PATTERN.test(angle) ? angle : '';
  return safeAngle ? `[${code}/${safeAngle}]` : `[${code}]`;
}

export function buildPrefillText(productCode: string | undefined, angle: string | undefined): string {
  const label = COURSE_LABEL[productCode || ''];
  const opener = label ? `สนใจ${label} อยากสอบถามข้อมูลเพิ่มเติม` : 'สนใจสอบถามข้อมูลเพิ่มเติม';
  return `${opener} ${buildTag(productCode, angle)}`;
}

export function buildLineHref(oaId: string, productCode: string | undefined, angle: string | undefined): string {
  const id = oaId.startsWith('@') ? oaId : `@${oaId}`;
  return `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(buildPrefillText(productCode, angle))}`;
}

/** angle ที่ BaseLayout เก็บไว้จาก ?angle= / utm_content (localStorage 14 วัน) */
export function currentAngle(win: Window = window): string | undefined {
  try {
    const stored = (win as unknown as { pnAttribution?: { utm_content?: string } }).pnAttribution;
    const fromUrl = new URLSearchParams(win.location.search);
    return fromUrl.get('angle') || fromUrl.get('utm_content') || stored?.utm_content || undefined;
  } catch {
    return undefined;
  }
}

/** เขียน href ใหม่ให้ปุ่ม LINE ทุกปุ่มที่ยังชี้ lin.ee — เรียกซ้ำได้ (idempotent) */
/** ปุ่มลอย (product_code = none) บนหน้าสินค้า ให้ใช้รหัสของหน้านั้นแทน — ลูกค้ากดจากหน้า T2 ก็ควรได้แท็ก T2 */
export function pageProductCode(root: ParentNode): string | undefined {
  const el = root.querySelector<HTMLElement>('[data-product-code]:not([data-product-code="none"])');
  return el?.dataset.productCode || undefined;
}

export function rewriteLineLinks(root: ParentNode, oaId: string, angle: string | undefined): number {
  let n = 0;
  const fallbackCode = pageProductCode(root);
  root.querySelectorAll<HTMLAnchorElement>('a[data-contact-cta][href^="https://lin.ee/"], a[data-line-cta][href^="https://lin.ee/"]').forEach((a) => {
    const code = a.dataset.productCode && a.dataset.productCode !== 'none' ? a.dataset.productCode : fallbackCode;
    a.dataset.lineOriginalHref = a.dataset.lineOriginalHref || a.href;
    a.href = buildLineHref(oaId, code, angle);
    a.dataset.linePrefill = buildTag(code, angle);
    n += 1;
  });
  return n;
}
