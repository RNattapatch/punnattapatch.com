# DESIGN.md — punnattapatch.com Design System
## "Warm Editorial AI" — อ่านก่อนแตะ UI ทุกครั้ง

> สกัดจาก source จริง: `src/styles/tokens.css` · `src/styles/global.css` · `src/components/` (2026-06)
> **เป้าหมายเอกสารนี้:** กันการเดา design — ทุก UI change ต้องตรงกับระบบนี้

---

## 0. Essence (ภาษาเดียว)

**กระดาษไอวอรีมีเส้นกริดสมุด + หมึก navy + แต้ม coral + ภาพวาดมือ (sketch line art).**
บรรยากาศ = สมุดสเก็ตช์/scrapbook ของที่ปรึกษา ไม่ใช่ SaaS เนี้ยบ ไม่ใช่ glass/neon.
Light-first (theme `punpaper`). Serif หัวข้อ (Trirong) + sans เนื้อหา (Sarabun).

---

## 1. 🚫 GOLDEN RULES (ผิดข้อใดข้อหนึ่ง = reject)

| ✅ DO | ❌ DON'T |
|---|---|
| ใช้ **line art sketch** (`/lineart/*.png`) หรือ **Heroicons outline** (`<Icon>`) | ❌ **EMOJI ทุกชนิด** (🎓🧭✅) — ไม่มีที่ไหนในเว็บใช้ emoji |
| Heading = **Trirong serif** (`font-serif` / `font-display`) | ❌ heading sans / system font |
| Card = **solid paper** (`bg-surface` + `border-[#c9c2b2]`) | ❌ glassmorphism / blur / `backdrop-blur` |
| เงา = **`.paper-shadow`** (hard offset) หรือไม่มีเงา | ❌ soft glow / neon shadow / `shadow-secondary/25` |
| coral = **accent + CTA เท่านั้น** | ❌ coral เป็นพื้นใหญ่ / coral ทั้ง section |
| reuse **component** ที่มี (CTAButton, OutcomeCard, …) | ❌ hardcode markup ซ้ำของที่ component ทำแล้ว |
| เน้นคำสำคัญด้วย **`.hand-underline`** (เส้นใต้วาดมือ) | ❌ `<u>` / underline ธรรมดา / highlight สีตรงๆ |

> **หมายเหตุ:** บางหน้า (index ส่วนล่าง) ยังมี DaisyUI เก่าปน (`btn`, `text-secondary`, `bg-base-200`) — ของเก่ารอ migrate · **ของใหม่ทั้งหมดใช้ editorial token (navy/coral/surface/sand)**

---

## 2. Colors (tokens จริง — `tokens.css` + `global.css @theme`)

ใช้ผ่าน Tailwind class แบบ bare name (`text-navy`, `bg-sand`, `text-coral`) — map ไว้แล้วใน `@theme`.

| Token / class | Hex | ใช้เมื่อไหร่ |
|---|---|---|
| `navy` / `text-navy` | `#072b4e` | หัวข้อ · authority · primary |
| `navy-deep` | `#00162f` | navy เข้มสุด (hover/deep bg) |
| `coral` / `text-coral` `bg-coral` | `#dd4155` | **CTA + accent + ราคา + เน้นคำ เท่านั้น** |
| `coral-soft` | `#fe596b` | coral อ่อน (hover) |
| `ivory` | `#f4f1ea` | พื้นเพจ (มี notebook grid) |
| `surface` / `bg-surface` | `#fcf9f2` | การ์ดสว่างสุด |
| `sand` / `bg-sand` | `#ece6da` | section สลับโทน · การ์ด tonal |
| `sand-deep` | `#e2dbcb` | ชั้นยกระดับ |
| `warm-ink` / `text-warm-ink` | `#1e1b16` | เนื้อความ (body) |
| `muted` / `text-muted` | `#8a8175` | ข้อความรอง · label · subtitle |
| border | `#c9c2b2` | เส้นขอบการ์ดมาตรฐาน (`border-[#c9c2b2]`) |
| border-bright | `#8a8175` | เส้นเข้ม |
| cyan `#0e7490` · violet `#7c5cbf` · emerald `#2f7d5b` | — | per-pillar accent (บทความ/insight เท่านั้น · ไม่ใช้ในหน้าขาย) |

ห้ามใส่ hex ใหม่นอก palette นี้ · ถ้าจำเป็นจริงให้เพิ่มใน `tokens.css` ก่อน

---

## 3. Typography

| บทบาท | Font | Class |
|---|---|---|
| Display / Heading | **Trirong** (Noto Serif fallback) | `font-serif` หรือ `font-display` (มี letter-spacing -0.01em) |
| Body / UI | **Sarabun** (IBM Plex Sans Thai fallback) | `font-body` (default บน `body`) |

- หัวข้อใหญ่: `font-serif text-4xl/5xl font-semibold text-navy leading-tight`
- หัวข้อ section: `font-serif text-2xl/3xl font-semibold text-navy`
- เนื้อหา: `text-warm-ink/75` (เนื้อ) · `text-muted` (รอง)
- ⚠️ README เก่าเขียน "Bai Jamjuree" — **ผิด/ล้าสมัย** · ของจริงคือ Trirong (ดู `global.css @theme`)

---

## 4. Iconography — line art ก่อน, Heroicon รอง, **emoji ห้าม**

### 4.1 Line art sketch (พระเอก) — `public/lineart/*.png`
ภาพวาดมือประกอบการ์ด/section · ใส่แบบ `class="mx-auto h-40 w-auto"` (feature) หรือ `h-28` (ladder card) · `alt=""` + `aria-hidden="true"` ถ้าเป็นภาพประดับ

**Library ที่มี (เลือกจากนี้ก่อนวาดใหม่):**
| ไฟล์ | สื่อถึง |
|---|---|
| `basic-workshop.png` · `advance-workshop.png` · `advance-hands.png` | workshop / training / จับมือทำ |
| `ceo-advisory.png` | ที่ปรึกษา CEO / คู่คิด |
| `business-os.png` | ระบบธุรกิจครบ |
| `pain-data.png` · `pain-owner.png` · `pain-paperwork.png` · `pain-training.png` | pain points |
| `out-time/money/cost/freedom/scale/meetings.png` | outcomes (ใช้กับ OutcomeCard `art=`) |
| `winning-zone-venn.png` · `whichai-3.png` · `shift.png` · `stream.png` · `tiktok-funnel.png` | framework / concept |

### 4.2 Heroicons outline (รอง) — `<Icon name="..." size={16} />`
stroke line icon (24px viewbox) · ใช้กับ bullet/inline · set ที่มี: `check-circle` `academic-cap` `briefcase` `users` `user-circle` `banknotes` `clock` `bolt` `building-office` `arrow-trending-up` `wrench-screwdriver` `clipboard-list` `chart-bar` `cog-6-tooth` `folder-open` `lock-open` `document-text` `magnifying-glass` `pencil-square` `paper-airplane` `user`
→ ถ้าต้อง icon ใหม่ เพิ่ม path ใน `src/components/Icon.astro`

---

## 5. Signature elements (`global.css`) — เอกลักษณ์ที่ต้องมี

| Class | คืออะไร | ใช้ตรงไหน |
|---|---|---|
| `.hand-underline` | เส้นใต้ coral วาดมือ (เอียง -1.2°) | เน้นคำสำคัญใน hero/หัวข้อ (เช่น "โยนให้ AI ทำ") |
| `.paper-shadow` | เงา hard offset `3px 5px 0` | การ์ดเด่น / featured |
| `.tape` | เทปวาชิ coral (มุมการ์ด) | scrapbook accent (ใช้พอประมาณ) |
| `.editorial-card` | surface + ink border + ไม่มี blur | การ์ดมาตรฐาน (ทางลัดแทน util) |
| `.muted-border` / `.ink-border` | เส้น `#c9c2b2` / `#1e1b16` | ขอบ |
| `.divider-gradient` | เส้นหมึกจางบนกระดาษ | คั่น section |
| `.logo-box` | กล่อง logo (hover → sand) | client logos |
| notebook grid + paper grain | bg เพจ (auto บน `body`) | — (มีอยู่แล้ว ไม่ต้องทำซ้ำ) |

---

## 6. Components library (reuse — `src/components/`)

| Component | ใช้ทำอะไร |
|---|---|
| `CTAButton` | ปุ่ม (`variant=primary` coral / `ghost` · `size=md/lg`) — **ใช้แทน hardcode `<a class="bg-coral...">`** |
| `SectionHeader` | badge (coral uppercase) + headline + `accentWord` (coral highlight) + sub |
| `OutcomeCard` | การ์ดผลลัพธ์ (`bucket` time/money/scale/freedom/cost · `art=/lineart/out-*.png` หรือ `icon`) |
| `Persona` | การ์ด persona (icon/emoji-slot, role, pain, outcome, accent) |
| `CaseCard` · `BeforeAfter` · `MilestoneBar` | proof / case |
| `ManifestoBlock` · `Manifesto` | section "ความเชื่อของผม" (หลักคิด) |
| `WhichAI` · `WhatYouGet` · `WhyMeSection` · `AIWorkingPanel` | section สำเร็จรูปบน home |
| `Nav` · `Footer` · `Schema` · `Prose` · `StatusBadge` · `Countdown` | โครง/utility |

> ก่อนเขียนการ์ด/section ใหม่ — เช็คก่อนว่ามี component นี้แล้วไหม

---

## 7. Patterns

### Card (editorial มาตรฐาน)
```
flex h-full flex-col rounded-2xl bg-surface p-7 border border-[#c9c2b2]
transition hover:-translate-y-0.5 hover:shadow-[3px_5px_0_rgba(30,27,22,0.06)]
```
Featured: `border-2 border-coral md:-mt-2 paper-shadow` + ribbon coral

### Button (ถ้าไม่ใช้ CTAButton component)
```
inline-flex items-center justify-center rounded-xl bg-coral px-6 py-3.5
font-medium text-white transition hover:opacity-90
```
Ghost: `border border-coral text-coral hover:bg-coral hover:text-white`

### Badge / eyebrow
```
text-xs font-semibold uppercase tracking-[0.15em] text-coral
```

### Ribbon "แนะนำ" (featured)
```
absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral
px-4 py-1 text-xs font-semibold text-white shadow-sm
```

### Price
```
font-serif text-2xl font-semibold text-coral   // หรือ priceLabel จาก data
```

---

## 8. Layout / spacing

| Token | ค่า | ใช้ |
|---|---|---|
| `px-margin-page` | `clamp(1.5rem, 5vw, 6rem)` | padding ซ้าย-ขวาทุก section |
| container | `max-w-6xl` (กว้าง) / `max-w-4xl` (อ่าน) / `max-w-5xl` | `mx-auto` |
| section padding-y | `py-14 md:py-20` (หรือ `--pun-section-y` 96px) | ระยะแนวตั้ง section |
| radius | `rounded-2xl` (1rem) การ์ด/ปุ่ม · `rounded-full` badge | — |

---

## 9. Themes

- **`punpaper`** (default, light) — ivory paper · ใช้เสมอบนหน้าขาย/หลัก
- **`pundark`** (optional) — เก็บไว้ toggle · ไม่ใช่ default
- `--depth: 0` `--noise: 0` `--border: 1px` · glow tokens = `transparent` (เงาเก่าหาย)

---

## 10. Don't (รวบ)
- ❌ emoji · ❌ glassmorphism/blur · ❌ neon glow · ❌ heading sans · ❌ hex นอก palette
- ❌ coral เป็นพื้นใหญ่ · ❌ underline ธรรมดาแทน hand-underline · ❌ hardcode ของที่ component มีแล้ว
- ❌ ใช้ DaisyUI `btn`/`text-secondary` กับงานใหม่ (ของเก่ารอ migrate)

---

## Change log
- 2026-06-23 — v1 created · สกัดจาก tokens.css + global.css + Icon.astro + components + lineart (ตอบโจทย์ "เว็บไม่มี Design MD" · กัน design drift เช่น เผลอใช้ emoji)
