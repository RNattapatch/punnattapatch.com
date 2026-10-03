// ปุ่มจัดการรูปของ variant ใน footer ของ Note Studio (2026-10-03 · ย้ายมาจากการ์ด variant ตามที่คุณปันขอ)
// ⬇️ .zip = รูปทั้งชุดที่ใช้อยู่ (เรียงตามลำดับในการ์ด) · 📁 เปิดใน Drive = โฟลเดอร์ชุด render ล่าสุด
import { zipSync } from 'fflate';
import { driveLinkFor, type MediaAsset } from './data';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** ยังไม่ขึ้น Drive = ปุ่มกดไม่ได้ + เวลาโดยประมาณ (ไม่ใช่ลิงก์เสีย) · ไม่มีรูป = ไม่มีปุ่ม */
export function driveButtonHtml(id: string, list: MediaAsset[]): string {
  const d = driveLinkFor(list);
  if (d.state === 'none') return '';
  if (d.state === 'pending') {
    const late = Date.now() > d.readyBy.getTime();
    const at = d.readyBy.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const label = late ? '⏳ รอคิวขึ้น Drive' : `⏳ ขึ้น Drive ราว ${at} น.`;
    const why = `กำลังย้ายรูป ${d.total} ใบชุดล่าสุดขึ้น Google Drive — มินิย้ายรูปที่อายุเกิน 30 นาที รอบละ 10 นาที`;
    return `<button type="button" class="btn btn-ghost btn-sm tap-44" disabled aria-label="${esc(why)}" title="${esc(why)}">${label}</button>`;
  }
  const partial = d.inDrive < d.total ? ` <span class="font-normal opacity-60">${d.inDrive}/${d.total}</span>` : '';
  const what = d.kind === 'folder' ? `เปิดโฟลเดอร์รูปชุดล่าสุดของ ${id} ใน Google Drive` : `เปิดรูปชุดล่าสุดของ ${id} ใน Google Drive (ยังไม่มีลิงก์โฟลเดอร์ เปิดเป็นไฟล์แทน)`;
  const more = d.inDrive < d.total ? ` · ขึ้นแล้ว ${d.inDrive} จาก ${d.total} ใบ ที่เหลือกำลังตามไป` : '';
  return `<a href="${esc(d.href)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm tap-44" aria-label="${esc(what + more)}" title="${esc(what + more)}">📁 เปิดใน Drive${partial}</a>`;
}

/** รูปที่ขึ้น Drive แล้ว bucket เหลือแค่พรีวิว JPEG 1080 → .zip ได้พรีวิว (ต้นฉบับอยู่ใน Drive) */
export function zipTitle(list: MediaAsset[]): string {
  if (!list.length) return 'ยังไม่มีรูปให้ดาวน์โหลด';
  return list.some((m) => m.drive_file_id)
    ? `ดาวน์โหลดรูป ${list.length} ใบเป็น .zip — ใบที่ขึ้น Drive แล้วได้ไฟล์พรีวิวกว้าง 1080px (ต้นฉบับอยู่ใน Drive)`
    : `ดาวน์โหลดรูป ${list.length} ใบเป็น .zip`;
}

export async function downloadMediaZip(id: string, list: MediaAsset[], toast: (m: string, k?: 'success' | 'error') => void) {
  if (!list.length) { toast('ยังไม่มีรูปให้ดาวน์โหลด', 'error'); return; }
  toast(`กำลังรวม ${list.length} รูป…`);
  const files: Record<string, Uint8Array> = {};
  for (const [i, m] of list.entries()) {
    if (!m.url) continue;
    const buf = new Uint8Array(await (await fetch(m.url)).arrayBuffer());
    const ext = (m.storage_path ?? '').split('.').pop() || 'png';
    files[`${String(i + 1).padStart(2, '0')}.${ext}`] = buf;
  }
  const blob = new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `${id}.zip`; a.click(); URL.revokeObjectURL(a.href);
}
