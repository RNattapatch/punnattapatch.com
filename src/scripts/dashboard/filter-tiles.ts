/**
 * filter-tiles — ช่องกดกรองบนแถบสรุปของ CRM (ที่มาของ lead · ช่องทางติดต่อ)
 *
 * แถบพวกนี้ต้องหน้าตาเหมือนกันเป๊ะ ไม่งั้นตาจะอ่านว่าเป็นของคนละชนิด
 * จึงรวมโครงช่องไว้ที่เดียว แล้วแต่ละ banner ส่งแค่ข้อมูลกับ callback เข้ามา
 * แถวเดียวจบ: ไอคอน · ชื่อกลุ่ม · จำนวน · สัดส่วน — จอแคบได้ 2 คอลัมน์โดยไม่กินจอครึ่งหน้า
 */

import { tintedChipStyle } from './chip-style.ts';

export type TileItem = {
  key: string;
  groupLabel: string;
  icon: string;
  tint: string;
  count: number;
  pct: number;
};

export function clearChildren(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function tile(t: TileItem, active: boolean, onPick: (key: string) => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'source-tile tap-44 text-left rounded-xl border px-3 py-2 transition',
    'min-w-[8.5rem] flex-1 sm:flex-none sm:w-[11.75rem]',
    active
      ? 'border-transparent ring-2 ring-offset-1 ring-offset-base-200 bg-base-100'
      : 'border-base-300 bg-base-100 hover:bg-base-300',
    t.count === 0 ? 'opacity-50' : '',
  ].filter(Boolean).join(' ');
  if (active) btn.style.setProperty('--tw-ring-color', 'var(--color-brand-navy)');
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  btn.dataset.tileKey = t.key;

  const head = document.createElement('div');
  head.className = 'flex items-center gap-2';

  // ไอคอนใช้พื้นสีเดียวกับป้ายบนการ์ด — จำสีได้จาก banner แล้วกวาดเจอในลิสต์ทันที
  const icon = document.createElement('span');
  icon.className = 'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] leading-none';
  icon.style.cssText = tintedChipStyle(t.tint);
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = t.icon;

  const label = document.createElement('span');
  label.className = 'text-xs opacity-70 truncate flex-1';
  label.textContent = t.groupLabel;

  const count = document.createElement('span');
  count.className = 'font-display text-base font-bold tabular-nums shrink-0';
  count.textContent = String(t.count);

  // จอแคบตัด % ทิ้ง — พื้นที่ไปให้ชื่อกลุ่มแทน ไม่งั้นชื่อยาวโดน truncate
  const pct = document.createElement('span');
  pct.className = 'hidden sm:inline text-[10px] opacity-50 tabular-nums shrink-0 w-7 text-right';
  pct.textContent = t.count ? `${t.pct}%` : '—';

  head.append(icon, label, count, pct);
  btn.append(head);
  btn.addEventListener('click', () => onPick(t.key));
  return btn;
}

/** วาดช่องทั้งแถวใหม่ทั้งชุด (จำนวนช่องเปลี่ยนได้ตามข้อมูล จึงไม่ diff ทีละช่อง) */
export function renderFilterTiles(
  wrap: HTMLElement,
  items: TileItem[],
  active: string | null,
  onPick: (key: string) => void,
): void {
  clearChildren(wrap);
  for (const t of items) wrap.appendChild(tile(t, t.key === active, onPick));
}
