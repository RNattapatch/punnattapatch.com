# INTAKE DATA CONTRACT — กฎตัวแปรกลางของทุกฟอร์มรับลูกค้า

> **อ่านก่อนสร้าง/แก้ฟอร์มทุกครั้ง** — ฟอร์มใหม่ทุกหน้า (โดยเฉพาะ ads LP ที่แยกหน้าเพื่อวัดผลรายแคมเปญ) ต้องส่ง key ตาม contract นี้ ไม่งั้นข้อมูลจะ**หายเงียบ** (เข้า raw_payload แต่ไม่ลง column + ไม่โชว์ใน Telegram) — เกิดมาแล้วกับ dealer-ai-sales เมื่อ 2026-07-25
>
> Audit เต็มเมื่อ 2026-07-26 · แก้แล้ว: dealer-ai-sales (`27dd249`), daruma-consult, booking

## สายข้อมูล (ห้ามลืมว่ามี 4 ชั้น)

```
Astro form (src/pages/**)  ──POST──▶  n8n "Intake Form v2 — Split Path"
                                        webhook: rnat.app.n8n.cloud/webhook/intake-form-v2
                                        │
                                        ├─ node "Validate Booking1"  (gate เฉพาะ source_page === '/booking')
                                        ├─ node "Flatten Body1"      ⚠️ อ่าน key แบบ FIXED LIST — key นอก list = ทิ้ง
                                        │       └─ ประกอบ telegram_message ที่นี่
                                        ├─ Telegram — Lead Alert (chat 1130338690)
                                        ├─ Supabase RPC submit_lead(payload) → table `leads`
                                        └─ TikTok Events API (CompleteRegistration, hash PII)
```

**กฎเหล็ก:** ชั้นที่ตัดสินว่า field รอด/หาย = **Flatten Body1** (n8n) และ **submit_lead** (RPC) — ฟอร์มตั้งชื่อ input ว่าอะไรก็ได้ แต่ **payload ตอน POST ต้องมี canonical key ตามตารางนี้**

## Canonical keys — ตารางแม่ (สิ่งที่ n8n/RPC อ่านจริง)

| Canonical key (ส่งใน payload) | Flatten อ่าน (fallback) | ลง column ใน `leads` | โชว์ใน Telegram |
|---|---|---|---|
| `name` | `name` → `yourName` | `full_name` | หัวข้อ |
| `company` | `company` → `brandName` | `company_name` | 👤 ใคร |
| `phone` | `phone` → `yourPhone` → `contact` | `phone` | 📞 |
| `line` | `line` → `line_id` | `line_id` | 📞 |
| `email` | `email` | `email` | 📞 |
| `tier` (ค่า `HOT`/`WARM`/`COLD` ตัวใหญ่) | `tier` | `temperature` (hot/warm/cold) | 🔥/🌟/❄️ + Score |
| `problems` (string หรือ array) | `problems` | `pain_points` | 🎯 ปัญหา (bullet) |
| `comment` | `comment` | `crm_notes` | 💭 |
| `position` | `position` → `yourRole` (+`positionOther`) | `position` | 👤 |
| `industry` (+`industryOther`) | `industry` | `business_type` | 👤 Industry |
| `package` / `service_package` | ทั้งคู่ | `package` | 📦 |
| `package_price` | `package_price` | `package_price` (ตัวเลข, sum ได้) | 📦 💰 |
| `source` | `source` | `source` | 📊 |
| `source_page` | `source_page` → `_meta.page` | — (อยู่ใน raw_payload) | 📍 + เลือก form tag |
| `booking_type` | `booking_type` | — (raw_payload) | trigger ส่วน 📦 |
| `submittedAt` | `submittedAt` → `sentAt` | `submitted_at` | 📅 |
| `utm_source/_medium/_campaign/_content/_term` | ทั้ง 5 | — (raw_payload) | 📊 Attribution |
| `fbclid` / `ttclid` / `user_agent` / `referrer` | ✓ | — (raw_payload) | — (TikTok CAPI ใช้) |
| `teamSize` หรือ `team_size` | ทั้งคู่ | — (raw_payload) | 👤 Team |
| `revenue`, `goal`, `timeline`, `budget` | ✓ | — (raw_payload) | ⏳ / 🎯 |
| `message`, `brandWebsite` | ✓ | `crm_notes` (fallback) | 💼 Sponsor |
| `bosi_archetype`, `quiz_score`, `score`, `aiSignalCount` | ✓ | — (raw_payload) | 🧬 |

**Key ที่ n8n ไม่รู้จัก = หายจาก column/Telegram** (เหลือแค่ใน raw_payload ก็ต่อเมื่อ Flatten ใส่ — ซึ่งไม่ใส่) เช่นชื่อเฉพาะฟอร์ม: `business`, `issue`, `sales_issue`, `intent`, `lead_temp`, `line_id`(ในฐานะ form field ใช้ได้เพราะ fallback), `serviceInterest`

## กฎสำหรับฟอร์มใหม่ทุกหน้า (โดยเฉพาะ ads LP)

1. **ตั้งชื่อ input อะไรก็ได้ให้ UX ดี แต่ก่อน POST ต้องเติม canonical alias** ใน `Object.assign(payload, {...})`:
   ```js
   company:  payload.business || '',                 // ชื่อบริษัท/โชว์รูม
   tier:     payload.intent === '<hot-value>' ? 'HOT' : 'WARM',
   problems: payload.<ช่องปัญหา> || '',
   comment:  [intentLabel, payload.<ช่องปัญหา>].filter(Boolean).join(' — '),
   ```
2. **`tier` ต้องเป็น `HOT`/`WARM`/`COLD` ตัวพิมพ์ใหญ่เท่านั้น** — RPC แปลงเป็น temperature; ค่าอื่น = null
3. **`source` และ `source_page` ต้อง unique ต่อหน้า** (ใช้วัดผลราย campaign):
   - `source`: `ads-<slug>` เช่น `ads-dealer-ai-sales`
   - `source_page`: path ไม่มี slash นำ เช่น `ads/dealer-ai-sales`
4. **UTM 5 ตัว + hidden inputs** ต้องมีทุก ads LP (`utm_source/_medium/_campaign/_content/_term`) — populate จาก query string
5. **เบอร์โทร**: validate ฝั่ง client (`/^(?:\+?66|0)\d{8,9}$/` หลัง strip เว้นวรรค/ขีด) — กันเบอร์มั่วก่อนถึง pixel/CRM
6. **honeypot** `honeypot-name` ทุกฟอร์ม
7. **pixel events บน ads LP**: Meta `Lead` + TikTok `SubmitForm` ตอน submit สำเร็จ (guarded `typeof fbq/ttq`) · ใส่ `lead_temp` ใน event properties ได้ (pixel-only, n8n ไม่เก็บ)
8. **อยากได้ form tag สวยใน Telegram** (ไม่ใช่ "OTHER FORM") → เพิ่ม `source_page` ใน `formMap` ของ node Flatten Body1 — *optional, ไม่บังคับ*
9. **ห้ามคาดหวังว่า n8n จะเก็บ key ใหม่เอง** — ถ้าต้องการ field ใหม่จริงๆ ที่ไม่มีใน contract: เพิ่มใน Flatten Body1 + (ถ้าต้องเป็น column) แก้ RPC + เพิ่ม column — แล้วอัปเดตไฟล์นี้

## Verification checklist (ทำทุกครั้งที่เพิ่ม/แก้ฟอร์ม — ห้ามข้าม)

1. Submit ฟอร์มจริงบน live ด้วยชื่อ `ZZ TEST <slug>`
2. เช็ค Supabase:
   ```sql
   select full_name, company_name, temperature, pain_points, crm_notes, phone, line_id, source
   from leads order by created_at desc limit 1;
   ```
   → ทุก column ที่ฟอร์มควรเติม **ต้องไม่ null**
3. เช็ค Telegram: เห็น 👤 บริษัท · 🔥/🌟 tier · 🎯 ปัญหา · 📞 ครบ
4. ลบ test row: `delete from leads where full_name like 'ZZ TEST%';`

## สถานะฟอร์มปัจจุบัน (audit 2026-07-26)

| ฟอร์ม | source_page | สถานะ contract |
|---|---|---|
| `src/pages/ads/dealer-ai-sales.astro` | `ads/dealer-ai-sales` | ✅ alias ครบ + tier HOT/WARM (แก้ 27dd249) |
| `src/pages/ads/daruma-consult.astro` | `ads/daruma-consult` | ✅ alias ครบ + tier จาก intent (แก้รอบนี้) |
| `src/pages/booking.astro` | `website-booking` | ✅ alias company/problems (แก้รอบนี้) · ไม่มี intent → ไม่มี tier |
| `src/pages/intake-form.astro` | `/intake-form` | ✅ ใช้ canonical key ตรงอยู่แล้ว (ฟอร์มแม่แบบ) |
| `src/components/HomeIntakeForm.astro` | `homepage-inline` | ✅ alias ใน JS อยู่แล้ว (company/phone/line/problems/comment) |
| `src/pages/sponsor.astro` | (จาก meta) | ✅ ใช้ yourName/brandName ซึ่ง Flatten/RPC มี fallback รองรับ |
| `src/pages/bosi-dna-quiz.astro` | `bosi-quiz` | ✅ ส่ง company/comment ใน JS |

## หมายเหตุระบบ (รู้ไว้)

- **Validate Booking1** gate เข้มเฉพาะ `source_page === '/booking'` (เป๊ะๆ มี slash) — หน้า booking จริงส่ง `website-booking` จึง**ไม่ผ่าน gate นี้** (by design ปัจจุบัน; ถ้าจะเปิด gate ให้แก้เงื่อนไขใน n8n)
- **Telegram บรรทัด tier** จะโชว์ `Score ?/15` เสมอเมื่อมี tier (template เดิมของ quiz) — cosmetic, ไม่พัง
- RPC `submit_lead` เป็น SECURITY DEFINER — ฟอร์มไม่ต้องมีสิทธิ์ insert ตรง
- Lead เดิม 3 รายจาก dealer (Belel/Tuangrat/วิว 25–26 Jul) เกิดก่อน fix → company/tier/ปัญหา null ถาวร แต่เบอร์+LINE ครบ
