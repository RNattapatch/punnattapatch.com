# Public P1 LP — copy spec + language/voice QC (WEB-PUBLIC-P1-LP-01)

- **Page:** `/services/ai-sales-agent-bootcamp` · code `P1` · pricingKey `public-p1-bootcamp`
- **Word contract:** `output/content/copy/p1-launch-2026-10/g-message-map.md` — every customer-facing line on the page traces to a code there
- **Number lock:** `wiki/pages/strategy-public-cohort-product-lock-blind-ticket-2026-09.md` + `docs/PRICING-SSOT.md`
- **Division of labour (ปันสั่ง 2026-09-04):** Claude owns structure/data/tests/git · Codex Sol drafted 6 copy blocks into `~/Library/PunOps/public-p1/copy-drafts/` only · Claude did every language and voice check and placed all copy into `p1.ts` by hand

---

## 1. Field map — where each line came from

| Field in `p1.ts` | Source | Written by |
|---|---|---|
| `hero.customerJob` | N2 | lifted |
| `hero.supportingCopy[0]` | P1 | lifted |
| `hero.supportingCopy[1]` | P2 | lifted |
| `hero.badges[]` | D1 · D2 · S1 (ย่อ) | lifted |
| `hero.steps[]` | P2 + product spec Day 1/Day 2 | Claude |
| `journey.heroMeta` | product unit | Claude |
| `journey.capacityNote` | S2 + S1 | lifted |
| `journey.offerMeta` | product unit | Claude |
| `journey.offerBody` | P2 · D4 | lifted |
| `journey.whyNow.*` | new | **Codex block 1** |
| `journey.curriculum.*` | new | **Codex block 3** |
| `pains[]` | new | **Codex block 1** |
| `boundary.body[]` | P1 · P3 · G2 | lifted |
| `reasons[]` | M2 · M3 + product spec | Claude |
| `analogy` | P3 | lifted |
| `scope[]` (5 steps) | new | **Codex block 3** |
| `takeHome[]` (7) | Core deliverables §0 | lifted |
| `bonusCards.items[]` (7) | Bonus table §0 + Codex points | **Codex block 6** |
| `bonusValues.items[]` (7) | Bonus table §0 + Codex points | **Codex block 6** |
| `spotlight` | M2 · M3 | **Codex block 2** |
| `whatsNew` | new | **Codex block 4** |
| `whyMe` (6) | M1 (ข้อ 1) + ของจริงจาก authority | **Codex block 5** |
| `fit[]` | W1 + W4 | lifted |
| `notFit` | W2 + W3 | lifted |
| `investment.included[]` | P2 · D4 · B1 · K2 + `e-lifecycle.md` §1 | lifted |
| `investment.terms` | K1 · R2 · O2 | lifted |
| `investment.scarcity` | S1 · S2 · D3 | lifted |
| `faq[1–4]` | D1 D3 · D2 · K1 · R2 | lifted |
| `faq[5–8]` | K1 · W3+K2 · G1 · G2 | **Codex block 6** |
| `publicCohort.*` | R1 R2 S1 S2 D1 D2 D3 K1 K2 | lifted |
| `sections.final` + `cta.finalCaption/finalMicrocopy` | C1 · C2 · O1 | lifted |

---

## 2. Per-block QC record (ท่า §3.0)

### Block 1 — `why-now` (pains 5 + whyNow)
- **RED found / fixed:** 0 / 0. Scanned all 12 Step-4 checks: neg-parallelism 0 · superficial analysis 0 · significance inflation 0 · ban-word cluster 0 · bold-first bullet 0 · signposted ending 0 · despite-boilerplate 0 · copulative avoidance 0 · vague attribution 0 · agent phrase 0 · tricolon 0 · em-dash 0
- **Facts vs §0:** ผ่าน — ก้อนนี้ไม่แตะราคา/ที่นั่ง/วัน โดยตั้งใจ (มีที่อื่นพูดแล้ว)
- **Voice:** ผ่าน — "คุณ" ตลอด · ยิงภาพรูปธรรมรัวๆ ตาม voice-and-tone §3.3 (20 นาที · บ่ายสาม/สี่ทุ่ม · สามสัปดาห์ · ห้าแท็บ) · ห้าบรรทัดขึ้นต้นไม่ซ้ำโครง · labels 4 ตัวใช้ท่า "ตั้งชื่อเรียกอาการ" ตาม §9.4 แทน negative parallelism
- **YELLOW ปล่อย:** pain 5 พูดถึง "ระบบกลางของบริษัท" ซึ่งไม่ตรงกับเจ้าของที่ขายเอง — ปล่อยเพราะเป็น 1 ใน 5 มุม และผูกกับ P1 ท่อน "โดยไม่ต้องรอบริษัทซื้อระบบ" โดยตรง
- **รอบ Codex:** 1 · **ผ่าน**

### Block 2 — `spotlight` (2 modules × 5 points)
- **RED found / fixed:** 0 / 0
- **Claude แก้เอง 1 จุด:** `heading` เดิมเขียนว่า "สองช่วงที่**หาได้ยาก**" — เข้าใกล้ข้อห้าม "เจ้าเดียว/ไม่มีใครทำ" ของ message map §3 → เปลี่ยนเป็น "สองช่วงนี้คือจุดที่คุณจะได้จับผู้ช่วยตอบพลาดด้วยตัวเอง แล้วตีเส้นว่าเรื่องไหนต้องให้คนตัดสิน" (เป็นคำอธิบายสิ่งที่เกิดในห้อง ไม่ใช่คำเคลม)
- **Facts vs §0:** ผ่าน — module 01 ครบเคสผิดพลาด 4 แบบ + การจดลง Test log · module 02 ครบ ราคา/สัญญา/ข้อความถึงลูกค้า/Fact-Assumption · ไม่มีประโยคว่าทดสอบแล้วไม่มีทางผิด
- **Voice:** ผ่าน — "ผมจะไม่ปล่อยให้คุณวัด AI จากคำตอบสวยๆ" และ "ตรงไหนที่ผมบอกตรงๆ ว่าอย่าเพิ่งให้มันทำ" ตรงกับ Sage move ใน signatures C6
- **รอบ Codex:** 1 · **ผ่าน (Claude แก้ heading 1 บรรทัด)**

### Block 3 — `curriculum` (5 steps + media)
- **RED found / fixed:** 0 / 0
- **Claude แก้เอง 1 จุด (ทั้งก้อน):** Codex เขียนจำนวนเป็นคำไทย ("สามดีล" "สิบสี่วัน" "สองชั่วโมง" "สี่แบบ" "สองตำแหน่ง") → แปลงเป็นเลขอารบิกทั้งหมด ให้ตรงกับหน้าอื่นบนเว็บและกฎตัวเลขของบ้านนี้
- **Facts vs §0:** ผ่าน — Pre-work 4 อย่างครบ · Day 14 เขียนว่า "Group clinic ออนไลน์**ของคอร์ส**" จึงอ่านได้ว่าอยู่ในคอร์ส ไม่ใช่ของแถม · ไม่มีชื่อเครื่องมือใน title · ไม่มีประโยค "ได้ระบบใช้จริงพรุ่งนี้"
- **Voice:** ผ่าน — media.copy จบด้วย "คุณไม่ได้นั่งดูผมสาธิตครับ" ตรงท่า DO "เดี๋ยวพาไปดู" มากกว่า "เล่าให้ฟัง"
- **รอบ Codex:** 1 · **ผ่าน (Claude แก้ตัวเลข)**

### Block 4 — `whatsNew` (2 columns × 4)
- **RED found / fixed:** 0 / 0
- **Claude แก้เอง 1 จุด:** `heading` เดิมว่า "เครื่องมือเปลี่ยน**ทุก 3 เดือน**" — เป็นตัวเลขที่ไม่มีหลักฐานรองรับ (S3b: ของจริงต้องตรวจสอบได้) → ตัดเหลือ "เครื่องมือเปลี่ยนรุ่นเร็ว แล้วสิ่งที่คุณสร้างวันนี้จะตกรุ่นไหม"
- **Facts vs §0:** ผ่าน — ไม่มีชื่อโมเดล/ผลิตภัณฑ์ AI เลยสักตัว · core 4 แกนตรงสเปก (Context · Test · Safety+Human approval · ลำดับงานขาย) · fresh footer ยอมรับว่าเครื่องมืออาจเปลี่ยนตามรุ่น
- **Voice:** ผ่าน — ใช้คำเฉพาะปัน "เข้าเส้น" 2 ครั้ง (intro + core.1) ไม่ normalize
- **รอบ Codex:** 1 · **ผ่าน (Claude แก้ heading)**

### Block 5 — `whyMe` (6 ข้อ)
- **RED found / fixed:** 0 / 0
- **Facts vs §0:** ผ่าน — ข้อ 1 ใช้ M1 คำต่อคำ · ตัวเลขที่อ้างมีแค่ 18 องค์กร / 12 คน / 6 คน ซึ่งอยู่ใน authority และ §0 ทั้งหมด · ไม่มี "เจ้าเดียว/คนแรก" · ไม่มีการันตียอด
- **Voice:** ผ่าน — สรรพนาม "ผม" ทุกข้อ · ทุกข้อแปลงประวัติเป็นประโยชน์ของคนอ่าน ("จึงช่วยคุณ…" / "คุณจึงได้เห็น…") ไม่ตกหลุมโทน "อวดยุ่ง" ที่ voice-and-tone §1 ห้าม · icon ไม่ซ้ำ · ความยาว body สลับกัน
- **รอบ Codex:** 1 · **ผ่าน ไม่ต้องแก้**

### Block 6 — `bonus` 7 การ์ด + FAQ 4 ข้อ
- **RED found / fixed:** 0 / 0
- **Facts vs §0:** ผ่าน — ชื่อของแถมและมูลค่าตรงตารางทุกใบ · ยอดที่แสดงคำนวณจาก data ได้ ฿8,800 · ใบ 05 เขียนขอบเขตชัดและไม่ใช้คำว่า Lifetime Support · ใบ 07 ออกเมื่อส่งงานครบ ไม่ใช่มาครบ 2 วัน · FAQ ยึด K1 / W3+K2 / G1 / G2 ครบ ไม่มีคำว่าใบกำกับภาษี
- **Claude แก้เอง:** ย้ายตัวเลข `฿8,800` ออกจาก prose ทั้ง 3 จุด (`bonusCards.intro` · `bonusValues.heading` · `investment.included`) — `verify:product-details` ห้าม `฿`+เลขในไฟล์ data และยอดรวมถูกคำนวณจาก `bonusValues` อยู่แล้ว จึงไม่ควรพิมพ์ซ้ำด้วยมือ
- **YELLOW ปล่อย:** `faq` ข้อโอนสิทธิ์ยาว ~80 คำ เกินเพดาน brief ที่ตั้งไว้ 75 — ปล่อยเพราะเป็นข้อที่ต้องบอกเงื่อนไขเงินให้ครบ ตัดแล้วจะกำกวมเรื่องคืนเงิน
- **รอบ Codex:** 1 · **ผ่าน (Claude แก้เรื่องรูปแบบตัวเลข ไม่ใช่เนื้อ)**

---

## 3. Self-check ทั้งหน้า

| หัวข้อ | ผล |
|---|---|
| RED flags รวมทั้งหน้า | **0** |
| Voice check ผ่านทุกก้อน | ✅ 6/6 |
| คำต้องห้าม SSOT §8 บนหน้า | **0** (มี assertion ใน `tests/public-p1-journey.spec.ts`) |
| "ใบกำกับภาษี" | **0** (assertion เดียวกัน) |
| ชื่อเครื่องมือ/โมเดล AI ใน H1 หรือ hero | **0** |
| "ไม่ใช่ X แต่คือ Y" | **0 ครั้ง** (เพดาน 1 · มี assertion จับ) |
| ตัวเลขที่ไม่มีหลักฐาน | **0** — ราคาที่โผล่บนหน้ามีแค่ ฿19,900 · ฿24,900 · ฿9,950 · ฿8,800 และทุกตัวมาจาก Catalog/data |
| ตัวเลขที่นั่งที่ขายแล้ว | ไม่มี · `seatsTaken: 0` และ "เหลือ N" คำนวณจาก data |
| การันตียอด / เลื่อนตำแหน่ง | **0** |
| ชื่อคู่แข่ง / "เจ้าเดียว" / "คนแรก" | **0** |
| ประโยคเปิดแต่ละ section ซ้ำโครง | ไม่ซ้ำ — ตรวจ heading ทั้ง 16 ช่วงแล้ว |
| Emoji นำหน้าหัวข้อใน prose | ไม่มี (emoji อยู่ใน `icon` field ของการ์ดเท่านั้น ซึ่งเป็นชั้น UI) |

## 4. สิ่งที่ Claude ตัดสินใจเองและควรให้ปันดู
1. **`sections.proof.intro` เขียนตรงๆ ว่ารุ่นที่ 1 ยังไม่เกิดขึ้น** และภาพทั้งหมดมาจากคลาสที่ผ่านมา — เพราะการเอาภาพ in-house ไปวางบนหน้า public course โดยไม่บอก จะกลายเป็นหลักฐานที่อ่านผิดได้ (ดูคำถามข้อ ค ใน REVIEW.md)
2. **CTA หลักชี้ `/booking?package=P1`** เพราะเพิ่มแถว `P1` ใน `PRODUCT_CONTEXT` ของ `booking.astro` แล้ว · CTA รองชี้ LINE keyword `BOOTCAMP` (ดูคำถามข้อ ก)
3. **`relatedOffer` ชี้ไป T1** เพื่อรองรับ W3 (บริษัทส่ง ≥3 คน ให้ไปทาง in-house ก่อน)
