// ตัวกรอก "ช่องทาง" ของแฟ้มเป้าหมาย — หนึ่งแถวหนึ่งช่อง + dropdown แพลตฟอร์ม
//
// ทำไมไม่ใช้ textarea เหมือนเดิม: ของเดิมต้องพิมพ์ `platform ref` เองบรรทัดละอัน — วางลิงก์ FB ที่ก๊อปมาแล้วไม่ติด
// เพราะ parser อ่านคำแรกเป็นชื่อแพลตฟอร์ม (คุณปันเจอเอง 2026-09-05)
// ตอนนี้: วางลิงก์อะไรมาก็ได้ → parseHandleInput() เดาแพลตฟอร์มจาก host แล้วแปลง ref
// ให้อยู่ในรูปที่ scoutRef()/laneFor() ใช้ต่อได้ · dropdown เป็นตัวช่วยตอนพิมพ์ชื่อเปล่าๆ (ไม่ใช่ลิงก์)

import { PLATFORM_LABEL, PLATFORM_ORDER, laneFor, parseHandleInput, type Handle, type Platform } from './data';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const LANE_NOTE: Record<string, string> = { page: 'สืบได้ — เลนโปรไฟล์', ads: 'สืบได้ — เลน Ad Library', web: 'สืบได้ — เลนเว็บ' };
const PLACEHOLDER: Record<string, string> = {
  tiktok: '@handle หรือลิงก์ช่อง',
  youtube: '@handle หรือลิงก์ช่อง',
  instagram: '@handle หรือลิงก์โปรไฟล์',
  facebook_page: 'ลิงก์เพจ · ชื่อเพจ · หรือ page_id',
  web: 'https://…',
  line: '@id หรือลิงก์ lin.ee',
  skool: 'ชื่อ community หรือลิงก์',
};

function hintHtml(h: Handle): string {
  if (!h.ref) return 'วางลิงก์ที่ก๊อปมา หรือพิมพ์ @handle';
  // ลิงก์โพสต์/กลุ่ม/ลิงก์ย่อ ไม่มีชื่อช่องอยู่ในตัว → เก็บไว้ดูได้ แต่สืบไม่ตรงเป้า ต้องบอกตรงนั้น
  if (/^https?:\/\//.test(h.ref) && (h.platform === 'facebook_page' || h.platform === 'instagram')) {
    const what = h.platform === 'facebook_page' ? 'ชื่อเพจหรือ page_id' : '@handle';
    return `<span class="text-warning">ลิงก์นี้ไม่มีชื่อ${h.platform === 'facebook_page' ? 'เพจ' : 'โปรไฟล์'}อยู่ในตัว — ใส่ ${what} แทน ถึงจะสืบได้ตรงเป้า</span>`;
  }
  const lane = laneFor(h);
  const pid = h.page_id && h.page_id !== h.ref ? ` · page_id ${esc(h.page_id)}` : '';
  return `เก็บเป็น <b>${esc(h.ref)}</b>${pid} · ${lane ? esc(LANE_NOTE[lane]) : 'ดูอย่างเดียว — สืบไม่ได้'}`;
}

function rowHtml(h: Handle, i: number): string {
  // แฟ้มเก่ามีแพลตฟอร์มนอกลิสต์จริง (วัดแล้ว 2026-09-05: handle 2 อันเป็น 'facebook' ไม่ใช่ 'facebook_page')
  // ถ้าไม่ใส่ option ของค่าเดิมเข้าไป select จะไม่มีอะไรถูกเลือก แล้ว get() คืนค่าตัวแรกของลิสต์
  // = เปลี่ยนแพลตฟอร์มทิ้งเงียบๆ ตอนกดบันทึก · Platform เป็น union แบบเปิด (| string) TS จับให้ไม่ได้
  const known = PLATFORM_ORDER as string[];
  const platforms = h.platform && !known.includes(h.platform) ? [h.platform, ...PLATFORM_ORDER] : PLATFORM_ORDER;
  const opts = platforms.map((pf) => `<option value="${esc(pf)}" ${pf === h.platform ? 'selected' : ''}>${esc(PLATFORM_LABEL[pf] ?? pf)}</option>`).join('');
  return `<div class="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[150px_1fr_auto]" data-hrow="${i}">
    <select class="select select-bordered select-sm col-span-2 sm:col-span-1" data-h="platform" aria-label="แพลตฟอร์ม">${opts}</select>
    <input class="input input-bordered input-sm w-full font-mono" data-h="ref" value="${esc(h.ref)}" placeholder="${esc(PLACEHOLDER[h.platform] ?? 'ลิงก์หรือ @handle')}" aria-label="ลิงก์หรือ handle" />
    <button type="button" class="btn btn-ghost btn-sm tap-44 text-error" data-h="del" aria-label="ลบช่องทางนี้" title="ลบช่องทางนี้">✕</button>
    <p class="col-span-2 -mt-1 text-xs opacity-60 sm:col-span-3">${hintHtml(h)}</p>
  </div>`;
}

export interface HandleEditor {
  set(handles: Handle[]): void;
  /** normalize รอบสุดท้าย + ตัดแถวว่างทิ้ง (เผื่อพิมพ์แล้วกดบันทึกเลย ไม่ได้ blur) */
  get(): Handle[];
}

export function createHandleEditor(list: HTMLElement, addBtn: HTMLElement): HandleEditor {
  let rows: Handle[] = [];
  const rowIndex = (el: Element) => Number((el.closest('[data-hrow]') as HTMLElement).dataset.hrow);

  const render = () => {
    list.innerHTML = rows.length ? rows.map(rowHtml).join('') : '<p class="text-sm opacity-60">ยังไม่มีช่องทาง — กด "เพิ่มช่องทาง" แล้ววางลิงก์ได้เลย</p>';
  };
  const normalize = (i: number) => {
    const parsed = parseHandleInput(rows[i]?.ref ?? '', rows[i]?.platform);
    rows[i] = parsed ?? { platform: rows[i].platform, ref: '' };
    render();
  };

  // พิมพ์ได้อิสระ แล้วค่อย normalize ตอนวาง/ออกจากช่อง — ไม่แย่ง cursor ระหว่างพิมพ์
  list.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.h === 'ref') rows[rowIndex(el)].ref = el.value;
  });
  list.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (!el.dataset.h || el.dataset.h === 'del') return;
    const i = rowIndex(el);
    if (el.dataset.h === 'platform') { rows[i].platform = el.value as Platform; delete rows[i].page_id; }
    normalize(i);
  });
  list.addEventListener('paste', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.h !== 'ref') return;
    const i = rowIndex(el);
    setTimeout(() => { rows[i].ref = el.value; normalize(i); }, 0);
  });
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-h="del"]');
    if (!btn) return;
    rows.splice(rowIndex(btn), 1);
    render();
  });
  addBtn.addEventListener('click', () => {
    rows.push({ platform: 'tiktok', ref: '' });
    render();
    (list.querySelectorAll<HTMLInputElement>('input[data-h="ref"]')[rows.length - 1])?.focus();
  });

  return {
    set(handles) { rows = handles.map((h) => ({ ...h })); render(); },
    get() { return rows.map((h) => parseHandleInput(h.ref, h.platform)).filter((h): h is Handle => !!h?.ref); },
  };
}
