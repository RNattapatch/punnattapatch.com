// note-render.ts — สร้าง HTML ของการ์ด Notes ให้พรีวิวในเบราว์เซอร์ (Note Studio)
// ⚠️ ห้ามแก้มือ: CSS + ไอคอนถูกคัดลอกจาก repo ความรู้
//   claude-code-pun-nattapatch/output/web-app/quote-card/{template-notes.html, render.mjs}
// ภาพจริงตอนกด "Render" ทำโดย render.mjs บนมินิ (wr_jobs: render_notes) — ไฟล์นี้มีไว้พรีวิวให้ตรงที่สุด
// ถ้าแก้ดีไซน์ ให้แก้ที่ render.mjs/template-notes.html แล้ว gen ไฟล์นี้ใหม่ (python3 scripts/gen-note-render.py <path นี้> ในรีโปความรู้)

export type NoteHl = 'coral' | 'yellow';
/** photo card (2026-10-09): รูปเต็มใบ + การ์ดขาวลอยล่าง · path = content-media/<CNT>/<variant>/studio-photo/… (อัปผ่าน Note Studio) */
export type NotePhoto = { path?: string; src?: string; pos?: string; zoom?: number };
export const ZOOM_MAX = 3;
const POS_KW: Record<string, number> = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
const clamp100 = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50);
/** จุดโฟกัสของรูป → [x%, y%] · รับ "35% 100%" และคีย์เวิร์ดเก่า "center top" (สเปกก่อนมีแถบเลื่อน) */
export function parsePos(pos = 'center top'): [number, number] {
  const [a, b] = pos.trim().toLowerCase().split(/\s+/);
  if (a === 'top' || a === 'bottom') return [b ? clamp100(POS_KW[b] ?? parseFloat(b)) : 50, POS_KW[a]];
  const v = (t: string | undefined, d: number) => (t == null ? d : clamp100(POS_KW[t] ?? parseFloat(t)));
  return [v(a, 50), v(b, 0)];
}
/** style ของรูปพื้นหลัง — ต้องตรงกับ render.mjs: pos = object-position + transform-origin · zoom >1 = scale รอบจุดนั้น */
export function photoImgStyle(p: NotePhoto): string {
  const at = p.pos || 'center top';
  const z = Number(p.zoom) > 1 ? Math.min(Number(p.zoom), ZOOM_MAX) : 1;
  return `object-position:${at};transform-origin:${at}${z > 1 ? `;transform:scale(${z})` : ''}`;
}
export type NoteSlide = {
  type: 'hook' | 'content' | 'cta' | 'follow'; text: string; sub?: string;
  size?: number;     // px ทับขนาดอัตโนมัติ (40–140)
  hl?: NoteHl;       // สีไฮไลต์ ==คำ== · ไม่ใส่ = coral
  photo?: NotePhoto; // เฉพาะใบเนื้อ
};
export const SIZE_MIN = 40;
export const SIZE_MAX = 140;
export type NoteSpec = {
  slug: string; skin: 'notes'; group?: string; ratio?: '4:5' | '1:1';
  mobile?: boolean; follow?: boolean; cue?: string; slides: NoteSlide[];
};

const CSS = "\n  :root {\n    --paper: #f1efe9;        /* พื้นครีม/กระดาษเต็มเฟรม */\n    --paper-edge: #e9e6de;   /* ขอบล่างจางๆ */\n    --ink: #1a1a1a;          /* ดำหมึก */\n    --gray: #8a8a8e;         /* iOS gray (Notes chrome) */\n    --coral: #dd4155;        /* coral แบรนด์ปัน */\n    --hl: rgba(221,65,85,.30); /* highlighter coral (marker tool) */\n    --folder: #e8622a;       /* ส้มโฟลเดอร์ swipe-cue */\n    --blue: #1d9bf0;         /* verified */\n  }\n  * { margin: 0; padding: 0; box-sizing: border-box; }\n  html, body { width: 1080px; height: {{H}}px; overflow: hidden; }\n  body {\n    font-family: \"Sukhumvit Set\", sans-serif;\n    background: var(--paper);\n    color: var(--ink);\n    -webkit-font-smoothing: antialiased;\n  }\n  .page { position: relative;\n    width: 1080px; height: {{H}}px;\n    display: flex; flex-direction: column;\n    background: linear-gradient(180deg, var(--paper) 78%, var(--paper-edge) 100%);\n  }\n\n  /* ---------- iOS Notes chrome ---------- */\n  .n-top {\n    display: flex; align-items: center; justify-content: space-between;\n    padding: 46px 60px 0;\n    color: var(--gray); font-size: 33px; font-weight: 500;\n  }\n  .n-top .back { display: flex; align-items: center; gap: 6px; }\n  .n-top .back svg { width: 26px; height: 26px; }\n  .n-top .tools { display: flex; align-items: center; gap: 30px; }\n  .n-top .tools svg { width: 40px; height: 40px; }\n\n  .n-bar {\n    margin-top: auto;\n    display: flex; align-items: center; justify-content: space-between;\n    padding: 0 96px 60px;\n  }\n  .n-bar svg { width: 46px; height: 46px; color: var(--gray); }\n\n  /* ---------- author head (avatar+name+handle) — ติดทุกสไลด์ ---------- */\n  .x-head { display: flex; align-items: center; gap: 22px; }\n  .x-head .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; }\n  .x-head .name { font-size: 40px; font-weight: 700; display: flex; align-items: center; gap: 10px; }\n  .x-head .name svg { width: 34px; height: 34px; }\n  .x-head .handle { font-size: 31px; color: #333; font-weight: 600; margin-top: 2px; }\n\n  /* ---------- centered content group (header + text ชิดกันระดับสายตา) ---------- */\n  .content {\n    flex: 1;\n    display: flex; flex-direction: column; justify-content: center;\n    gap: 40px; padding: 24px 84px;\n    letter-spacing: -0.005em;\n  }\n\n  /* ---------- body text (follow/cta) ---------- */\n  .body {\n    flex: 1;\n    display: flex; flex-direction: column; justify-content: center;\n    padding: 40px 84px;\n    letter-spacing: -0.005em;\n  }\n  .quote { line-height: 1.5; font-weight: 500; text-wrap: balance; }\n  .quote b { font-weight: 700; }\n  /* .hook-sub/.sub ด้วย — เดิมไม่มี style ทำให้ ==คำ== ในบรรทัดรองออกเป็นเหลืองค่าเริ่มต้นของเบราว์เซอร์ (เจอ 2026-10-09) */\n  .quote mark, .hook-sub mark, .sub mark { background: linear-gradient(180deg, transparent 8%, var(--hl) 8% 88%, transparent 88%); color: var(--ink); padding: 0 2px; }\n  .q-58 { font-size: 58px; }\n  .q-52 { font-size: 52px; }\n  .q-46 { font-size: 46px; }\n  .q-40 { font-size: 40px; }\n  .hook .quote { font-weight: 600; }\n\n  /* ---------- mobile (opt-in: spec.mobile) · อ่านได้ที่ 390px ---------- */\n  .q-80 { font-size: 80px; } .q-72 { font-size: 72px; } .q-64 { font-size: 64px; }\n  .mobile .quote { line-height: 1.42; }\n  .mobile .content { gap: 48px; padding: 24px 76px; }\n  .mobile .x-head .avatar { width: 112px; height: 112px; }\n  .mobile .x-head .name { font-size: 44px; }\n  .mobile .x-head .handle { font-size: 33px; }\n  .mobile .hook .q-hero { font-size: 108px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; }\n  .mobile .hook-sub { font-size: 50px; font-weight: 500; line-height: 1.45; color: #3a3a3e; margin-top: -8px; }\n  .mobile .swipe { font-size: 40px; padding: 26px 46px; }\n  .mobile .n-bar { padding-bottom: 48px; }\n  .mobile .sub { font-size: 44px; }\n  .mobile .follow-btn { font-size: 42px; }\n\n  /* ---------- photo card: รูปเต็มใบ + การ์ดขาวลอยล่าง (s.photo) ---------- */\n  .photo-card { background: #d9d9d6; }\n  .photo-card .pc-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }\n  .photo-card .pc-card {\n    position: absolute; left: 64px; right: 64px; bottom: 72px;\n    display: flex; flex-direction: column; gap: 36px;\n    padding: 52px 60px 58px;\n    background: #fbfcff; border-radius: 44px;\n    box-shadow: 0 24px 60px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.08);\n    letter-spacing: -0.005em;\n  }\n  .photo-card.mobile .pc-card { gap: 34px; }\n\n  /* ---------- ไฮไลต์สีเหลือง · ค่าเริ่มต้น = coral ----------\n     ทีละคำ: <mark class=\"y\"> (Note Studio พิมพ์ ++คำ++ · coral = ==คำ==) ใช้ 2 สีในใบเดียวได้\n     ทั้งใบ: s.hl = \"yellow\" (สเปกเก่า/agent) */\n  /* เหลืองสด #ffff00 = สีเดียวกับที่ปันเห็นในบรรทัดรองแล้วชอบ (ปันขอ 2026-10-09) */\n  .hl-yellow, mark.y { --hl: #ffff00; }\n\n  /* ---------- swipe cue (folder pill) ---------- */\n  .swipe {\n    display: inline-flex; align-items: center; gap: 20px; align-self: center;\n    margin: 0 0 56px; padding: 22px 40px;\n    background: #ffffff; border-radius: 22px;\n    box-shadow: 0 10px 30px rgba(0,0,0,.10);\n    font-size: 34px; font-weight: 700; color: var(--ink);\n  }\n  .swipe svg { width: 46px; height: 46px; }\n\n  /* ---------- follow / cta centered ---------- */\n  .center { text-align: center; align-items: center; }\n  .center .avatar-big { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 30px; border: 5px solid var(--coral); }\n  .center .name { font-size: 46px; font-weight: 700; }\n  .center .handle { font-size: 32px; color: #333; font-weight: 600; margin: 6px 0 34px; }\n  .sub { font-size: 34px; color: #55555a; margin-top: 26px; line-height: 1.5; }\n  .follow-btn { display: inline-block; margin-top: 40px; font-size: 36px; font-weight: 700; color: #fff; background: var(--coral); padding: 22px 58px; border-radius: 999px; }\n";
const NAME = 'ปัน ณัฐพัชร์';
const HANDLE = '@pun_nattapatch';
const FOLLOW_TEXT = "สวัสดีครับ ปัน ณัฐพัชร์ เอง\nนักปั้นทีมขาย 100 ล้านที่ใช้ AI เป็นนิดหน่อย\nถ้าคุณอยากรู้วิธีใช้ AI พัฒนาทีมขาย\nเราน่าจะคุยกันรู้เรื่อง กดตามผมไว้เลย";
const FOLLOW_TEXT_MOBILE = "สวัสดีครับ ปัน ณัฐพัชร์ เอง\nนักปั้นทีมขาย 100 ล้าน\nที่ใช้ AI เป็นนิดหน่อย\nถ้าคุณอยากรู้วิธีใช้ AI พัฒนาทีมขาย\nเราน่าจะคุยกันรู้เรื่อง\nกดตามผมไว้เลย";

const IC: Record<string, string> = {
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><polyline points="8 7 12 3 16 7"/><path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9.5"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="12" r="1.1" fill="currentColor" stroke="none"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="6" height="6" rx="1.6"/><path d="M4.6 7l1.1 1.1 2-2.2"/><rect x="3" y="14" width="6" height="6" rx="1.6"/><line x1="12" y1="7" x2="21" y2="7"/><line x1="12" y1="17" x2="21" y2="17"/></svg>`,
  cam: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3 8.5a2 2 0 0 1 2-2h1.8L8 4.5h8l1.2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.4"/></svg>`,
  marker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.5l4 4-8.5 8.5-4.5 1 1-4.5z"/><path d="M13 7l4 4"/></svg>`,
  compose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 4.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-2v-6.5"/><path d="M16.5 3.2l4 4-8 8H8.5v-4z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="#0e4a7e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="18.5" y2="12"/><polyline points="12.5 6 19 12 12.5 18"/></svg>`,
};
const V_BADGE = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#1d9bf0"/><path d="M7 12.4l3.2 3.1L17 8.8" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;



export const stripTags = (t: string) => t.replace(/<[^>]+>/g, '');
export const plain = (t: string) => stripTags(t).replace(/\n/g, '');
const THAI_STACK = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;
const advWidth = (s: string) => s.replace(THAI_STACK, '').length;
export const maxLineWidth = (t: string) => Math.max(...stripTags(t).split('\n').map(advWidth));
const br = (t: string) => t.replace(/\n/g, '<br>');

export function sizePx(t: string, mobile: boolean): number {
  const w = maxLineWidth(t), n = plain(t).length;
  if (mobile) {
    const fit = w <= 17 ? 80 : w <= 19 ? 72 : w <= 22 ? 64 : 58;
    const ceil = n <= 55 ? 80 : n <= 75 ? 72 : n <= 95 ? 64 : 58;
    return Math.min(fit, ceil);
  }
  const fit = w <= 28 ? 58 : w <= 33 ? 52 : w <= 38 ? 46 : 40;
  const ceil = n <= 90 ? 58 : n <= 140 ? 52 : n <= 190 ? 46 : 40;
  return Math.min(fit, ceil);
}

/** แปลงข้อความที่พิมพ์ในช่องแก้เป็น markup ของการ์ด: ==คำ== = ไฮไลต์ coral (<mark>) · ++คำ++ = เหลือง (<mark class="y">) · ใช้ 2 สีในใบเดียวได้ */
export const toMarkup = (s: string) => escapeHtml(s)
  .replace(/==(.+?)==/g, '<mark>$1</mark>')
  .replace(/\+\+(.+?)\+\+/g, '<mark class="y">$1</mark>');
/** กลับทาง: <mark>…</mark> → ==…== · <mark class="y">…</mark> → ++…++ สำหรับใส่ในช่องแก้ */
export const toEditable = (s: string) => s
  .replace(/<mark class="y">(.*?)<\/mark>/g, '++$1++')
  .replace(/<mark>(.*?)<\/mark>/g, '==$1==')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function escapeHtml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

export function withFollow(spec: NoteSpec): NoteSlide[] {
  const slides = [...spec.slides];
  if (spec.follow !== false) slides.push({ type: 'follow', text: spec.mobile ? FOLLOW_TEXT_MOBILE : FOLLOW_TEXT });
  return slides;
}

/** photoUrl = data URL ของรูปพื้นหลัง (iframe sandbox โหลด URL ตรงไม่ได้) · ไม่มี = พื้นเทา + ป้ายบอก */
export function slideDoc(spec: NoteSpec, s: NoteSlide, avatarUrl: string, photoUrl = ''): string {
  const MOBILE = spec.mobile === true;
  const H = spec.ratio === '1:1' ? 1080 : 1350;
  const headRow = `<div class="x-head"><img class="avatar" src="${avatarUrl}"><div><div class="name">${NAME} ${V_BADGE}</div><div class="handle">${HANDLE}</div></div></div>`;
  // ตรงกับ render.mjs: size ทับคลาสอัตโนมัติ · hl-yellow ที่ .page
  const style = s.size ? ` style="font-size:${s.size}px"` : '';
  const q = (t: string) => `<div class="quote ${s.size ? '' : 'q-' + sizePx(t, MOBILE)}"${style}>`;
  const page = (base: string) => `page${base}${MOBILE ? ' mobile' : ''}${s.hl === 'yellow' ? ' hl-yellow' : ''}`;
  let body = '';
  if (s.type === 'follow' || s.type === 'cta') {
    const btn = s.type === 'follow' ? `<div class="follow-btn">+ ติดตาม ${HANDLE}</div>` : '';
    const sub = s.sub ? `<div class="sub">${br(s.sub)}</div>` : '';
    body = `<div class="${page(' center')}"><div class="body center"><img class="avatar-big" src="${avatarUrl}"><div class="name">${NAME}</div><div class="handle">${HANDLE}</div>${q(s.text)}${br(s.text)}</div>${sub}${btn}</div></div>`;
  } else if (s.type === 'hook') {
    const cueTxt = spec.cue != null ? spec.cue : `เลื่อนอ่านต่อ ${IC.arrow}`;
    const swipe = cueTxt === '' ? '' : `<div class="swipe">${cueTxt}</div>`;
    if (MOBILE) {
      const hsub = s.sub ? `<div class="hook-sub">${br(s.sub)}</div>` : '';
      body = `<div class="${page('')}"><div class="content hook">${headRow}<div class="quote q-hero"${style}>${br(s.text)}</div>${hsub}</div>${swipe}</div>`;
    } else {
      body = `<div class="${page('')}"><div class="content hook">${headRow}${q(s.text)}${br(s.text)}</div></div>${swipe}</div>`;
    }
  } else {
    const parts = br(s.text).split('<br>');
    const nb = `<b>${parts[0]}</b>` + (parts.length > 1 ? '<br>' + parts.slice(1).join('<br>') : '');
    if (s.photo) {
      const pos = ` style="${photoImgStyle(s.photo)}"`;
      const bg = photoUrl
        ? `<img class="pc-bg" src="${photoUrl}" alt=""${pos}>`
        : `<div class="pc-bg" style="display:flex;align-items:center;justify-content:center;font-size:44px;color:#77777c">กำลังโหลดรูป…</div>`;
      body = `<div class="${page(' photo-card')}">${bg}<div class="pc-card">${headRow}${q(s.text)}${nb}</div></div></div>`;
    } else {
      body = `<div class="${page('')}"><div class="n-top"><span class="back">${IC.back} Notes</span><span class="tools">${IC.share}${IC.more}</span></div><div class="content">${headRow}${q(s.text)}${nb}</div></div><div class="n-bar">${IC.check}${IC.cam}${IC.marker}${IC.compose}</div></div>`;
    }
  }
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>${CSS.replace(/\{\{H\}\}/g, String(H))}</style></head><body>${body}</body></html>`;
}
