// LINE prefilled message — ปุ่ม LINE ทุกปุ่มเปิดแชตพร้อมข้อความที่พิมพ์ให้แล้ว
// ทำไม (ปันสั่ง 2026-09-06): ลูกค้าไม่พิมพ์คีย์เวิร์ด "ONLINE SALES" เอง (พิมพ์ "สวัสดีค่ะ"/"สนใจ"/ส่งรูป)
// → ใส่แท็ก [T2/<angle>] ไว้ในข้อความแทน ลูกค้าแค่กดส่ง บอท LINE (mac-mini-ops/line-relay) แกะแท็กไป
// เขียน leads.ad_angle ได้เหมือนสายฟอร์ม · ถ้าลูกค้าลบข้อความแล้วพิมพ์เอง = กลับไปเป็นแบบเดิม ไม่เสียอะไร
//
// รูปแบบลิงก์: https://line.me/R/oaMessage/<@oaId>/?<ข้อความ url-encoded>
// ปันเทสต์บน iPhone 2026-09-12: เด้งเข้าแชตพร้อมข้อความ ✅ · แต่บน desktop ลิงก์นี้ 302 ไป line.me เฉยๆ (ทางตัน)
// → เขียนทับเฉพาะมือถือ · desktop คง lin.ee ไว้ (lin.ee โชว์หน้า QR ให้เอง — แบบเดียวกับที่ อ.เบิร์ด ทำ)
//
// 2026-09-12 (หลังแกะ pakorn.in.th): หน้าที่ประกาศ [data-line-close] = ปิดการขายผ่าน LINE ไม่ใช้ฟอร์ม
// → ปุ่มจอง (a[data-booking-cta]) กลายเป็นปุ่ม LINE ด้วย และทุกปุ่มบนหน้าส่ง "<keyword> [รหัส/angle]"
// เพื่อให้บอทตอบการ์ด + คำถามคัดทันที · แต่ละปุ่มติด data-cta-event ให้ ContactTracking ยิง fbq ชื่อตามปุ่ม

export const COURSE_LABEL: Record<string, string> = {
  T1: 'คลาสจิตวิทยาการขาย + AI Agent',
  T2: 'คลาสเพิ่มยอดขายจากออนไลน์ด้วย Content + Ads + AI',
  T3: 'คลาสวางระบบหลังบ้านฝ่ายขาย',
  T4: 'คลาส Advance AI & Business Automation',
  C1: 'บริการที่ปรึกษาวางระบบฝ่ายขายรายวัน',
  I1: 'บริการวางระบบ Dashboard',
  P1: 'คลาส AI Sale Loop System',
};

export const ANGLE_PATTERN = /^[a-z0-9-]{1,40}$/;
export const PRODUCT_CODE_PATTERN = /^(T[1-4]|C1|I1|P1)$/;
export const MOBILE_UA = /Android|iPhone|iPad|iPod/i;

/** แท็กท้ายข้อความที่บอทแกะ — [T2/sell-good-no-lead] · ไม่มี angle = [T2] · หน้าทั่วไป = [WEB] */
export function buildTag(productCode: string | undefined, angle: string | undefined): string {
  const code = PRODUCT_CODE_PATTERN.test(productCode || '') ? (productCode as string) : 'WEB';
  const safeAngle = angle && ANGLE_PATTERN.test(angle) ? angle : '';
  return safeAngle ? `[${code}/${safeAngle}]` : `[${code}]`;
}

export function buildPrefillText(productCode: string | undefined, angle: string | undefined, keyword?: string): string {
  if (keyword) return `${keyword} ${buildTag(productCode, angle)}`;
  const label = COURSE_LABEL[productCode || ''];
  const opener = label ? `สนใจ${label} อยากสอบถามข้อมูลเพิ่มเติม` : 'สนใจสอบถามข้อมูลเพิ่มเติม';
  return `${opener} ${buildTag(productCode, angle)}`;
}

export function buildLineHref(oaId: string, productCode: string | undefined, angle: string | undefined, keyword?: string): string {
  const id = oaId.startsWith('@') ? oaId : `@${oaId}`;
  return `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(buildPrefillText(productCode, angle, keyword))}`;
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

export function isMobile(ua: string = navigator.userAgent): boolean {
  return MOBILE_UA.test(ua);
}

/** ปุ่มลอย (product_code = none) บนหน้าสินค้า ให้ใช้รหัสของหน้านั้นแทน — ลูกค้ากดจากหน้า T2 ก็ควรได้แท็ก T2 */
export function pageProductCode(root: ParentNode): string | undefined {
  const el = root.querySelector<HTMLElement>('[data-product-code]:not([data-product-code="none"])');
  return el?.dataset.productCode || undefined;
}

/** หน้าที่ปิดผ่าน LINE (ไม่มีฟอร์ม) ประกาศ keyword + ชื่อ event ไว้ที่ [data-line-close] */
export function lineCloseConfig(root: ParentNode): { keyword: string; bookingEvent?: string; lineEvent?: string } | null {
  const el = root.querySelector<HTMLElement>('[data-line-close]');
  if (!el || !el.dataset.lineKeyword) return null;
  return { keyword: el.dataset.lineKeyword, bookingEvent: el.dataset.ctaEventBooking, lineEvent: el.dataset.ctaEventLine };
}

export const LINE_LINK_SELECTOR = 'a[data-contact-cta][href^="https://lin.ee/"], a[data-line-cta][href^="https://lin.ee/"]';
export const BOOKING_LINK_SELECTOR = 'a[data-booking-cta]';

/**
 * เขียน href ใหม่ให้ปุ่ม LINE ทุกปุ่ม — เรียกซ้ำได้ (idempotent)
 * mobile → oaMessage พร้อมข้อความ · desktop → คง lin.ee (โชว์ QR) แต่ยังติดแท็ก/ event ไว้ให้ tracking เหมือนกัน
 */
export function rewriteLineLinks(root: ParentNode, oaId: string, angle: string | undefined, mobile: boolean = isMobile()): number {
  let n = 0;
  const fallbackCode = pageProductCode(root);
  const close = lineCloseConfig(root);
  root.querySelectorAll<HTMLAnchorElement>(LINE_LINK_SELECTOR).forEach((a) => {
    const code = a.dataset.productCode && a.dataset.productCode !== 'none' ? a.dataset.productCode : fallbackCode;
    const keyword = a.dataset.ctaKeyword || close?.keyword;
    a.dataset.lineOriginalHref = a.dataset.lineOriginalHref || a.href;
    a.dataset.linePrefill = buildTag(code, angle);
    if (close?.lineEvent && !a.dataset.ctaEvent) a.dataset.ctaEvent = close.lineEvent;
    if (mobile) a.href = buildLineHref(oaId, code, angle, keyword);
    n += 1;
  });
  if (close) {
    const lineHome = root.querySelector<HTMLAnchorElement>(LINE_LINK_SELECTOR)?.dataset.lineOriginalHref || 'https://lin.ee/ioSnSUG';
    root.querySelectorAll<HTMLAnchorElement>(BOOKING_LINK_SELECTOR).forEach((a) => {
      const code = a.dataset.productCode && a.dataset.productCode !== 'none' ? a.dataset.productCode : fallbackCode;
      a.dataset.lineOriginalHref = a.dataset.lineOriginalHref || a.href; // /booking?package=… เก็บไว้เผื่อ debug
      a.dataset.linePrefill = buildTag(code, angle);
      a.dataset.ctaKeyword = close.keyword;
      if (close.bookingEvent) a.dataset.ctaEvent = close.bookingEvent;
      a.href = mobile ? buildLineHref(oaId, code, angle, close.keyword) : lineHome;
      a.target = '_blank';
      a.rel = 'noopener';
      n += 1;
    });
  }
  return n;
}
