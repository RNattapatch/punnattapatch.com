/**
 * chip-style — สูตรสีป้ายกลางของ dashboard (ที่มาของ lead · ช่องทางติดต่อ · ป้ายอื่นที่จะมาทีหลัง)
 *
 * ทำไมไม่ใช้ badge-soft/badge-outline ของ DaisyUI: วัดจริงบนธีมครีมได้คอนทราสต์ 1.6–3.4
 * (สีอำพันกับสีเขียวของธีมอ่อนเกินจะเอามาเป็นสีตัวอักษร) ป้ายที่นี่จึงให้สีเป็นแค่
 * พื้นกับขอบ แล้วใช้ base-content เป็นตัวอักษรเสมอ — วัดใหม่ได้ ≥10 ทั้งธีมสว่างและมืด
 *
 * ต้องส่งชื่อ CSS var เชิงความหมาย (--color-primary/secondary/success/warning/base-content)
 * ห้ามใช้ --color-brand-* เพราะ brand-* เป็นค่าเดียวทั้งสองธีม ธีมมืดจะจมหายไปกับพื้น
 */
export function tintedChipStyle(tint: string): string {
  return [
    // พื้นอ่อนพอให้ตัวอักษร ink อ่านออก · ขอบเข้มเป็นตัวแบกสีให้กวาดตาเจอ
    `background-color: color-mix(in oklab, var(${tint}) 12%, var(--color-base-100))`,
    `border: 1px solid color-mix(in oklab, var(${tint}) 55%, transparent)`,
    'color: var(--color-base-content)',
  ].join(';');
}
