# INTAKE DATA CONTRACT — กฎตัวแปรกลางของทุกฟอร์มรับลูกค้า

> **อ่านก่อนสร้าง/แก้ฟอร์มทุกครั้ง** — ฟอร์มใหม่ทุกหน้า (โดยเฉพาะ ads LP ที่แยกหน้าเพื่อวัดผลรายแคมเปญ) ต้องส่ง key ตาม contract นี้ ไม่งั้นข้อมูลจะ**หายเงียบ** (เข้า raw_payload แต่ไม่ลง column + ไม่โชว์ใน Telegram) — เกิดมาแล้วกับ dealer-ai-sales เมื่อ 2026-07-25
>
> Audit เต็มเมื่อ 2026-07-26 · แก้แล้ว: dealer-ai-sales (`27dd249`), daruma-consult, booking

## สายข้อมูล (ห้ามลืมว่ามี 4 ชั้น)

```
Astro form (src/pages/**)  ──POST──▶  n8n "Intake Form v2 — Split Path"
                                        webhook: rnat.app.n8n.cloud/webhook/intake-form-v2
                                        │
                                        ├─ node "Validate Booking1"   (gate เฉพาะ source_page === '/booking')
                                        ├─ node "Normalize Aliases"   🛡️ safety net — เติม canonical key ที่ว่างจาก
                                        │       business/sales_issue/issue/intent/lead_temp (เพิ่ม 2026-07-26)
                                        ├─ node "Flatten Body1"       ⚠️ อ่าน key แบบ FIXED LIST — key นอก list = ทิ้ง
                                        │       └─ ประกอบ telegram_message ที่นี่
                                        ├─ Telegram — Lead Alert (chat 1130338690)
                                        ├─ Supabase RPC submit_lead(payload) → table `leads`
                                        └─ TikTok Events API (CompleteRegistration, hash PII)
```

**กฎเหล็ก:** ชั้นที่ตัดสินว่า field รอด/หาย = **Flatten Body1** (n8n) และ **submit_lead** (RPC) — ฟอร์มตั้งชื่อ input ว่าอะไรก็ได้ แต่ **payload ตอน POST ต้องมี canonical key ตามตารางนี้**

> 🛡️ **Safety net (2026-07-26):** node **Normalize Aliases** เติม `company` / `problems` / `tier` / `comment` ให้อัตโนมัติจาก `business` / `sales_issue` / `issue` / `intent` / `lead_temp` **เฉพาะตอนที่ key นั้นว่าง** — กันกรณีเบราว์เซอร์เสิร์ฟฟอร์มเวอร์ชันเก่าจาก cache หรือฟอร์มใหม่ลืมใส่ alias
> **แต่ยังต้องส่ง alias จากฟอร์มเสมอ** — safety net คือกันพลาด ไม่ใช่ข้ออ้างให้ข้ามกฎ
>
> ⚠️ **n8n publish:** แก้ workflow แล้วต้องกด **Publish** ด้วย ไม่งั้น production ยังรัน version เดิม (เจอมาแล้ว)

### ⚙️ ความทนทานของ pipeline (แก้ 2026-07-26)

| จุด | เดิม | ตอนนี้ |
|---|---|---|
| Supabase insert timeout | 10s · **ไม่ retry** | 25s · **retry 3 ครั้ง** ห่าง 2s |
| Supabase insert ล้มเหลว | เงียบ (`onError: continueRegularOutput`) → **lead หายจาก CRM แต่ execution ขึ้น success** | ยังไม่บล็อก Telegram (ตั้งใจ) แต่โอกาสหายลดมาก |

**เคสจริง:** execution `733` (26 Jul) — `submit_lead` timeout 10s → ไม่มี row ใน CRM ทั้งที่ Telegram ส่งสำเร็จและ n8n รายงาน success · **ถ้าเจอ lead ใน Telegram แต่ไม่มีใน CRM ให้สงสัยจุดนี้ก่อน** (เช็คที่ n8n → Executions → node Supabase)

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
| `consent` (`on`/`true`/`yes`/`1` → เก็บเป็น `yes`) | `consent` | — (raw_payload) | — (หลักฐาน PDPA · เพิ่ม 2026-08-01) |
| `after_hours_ok` (`yes`/`no`) ⏰ **เพิ่ม 2026-08-09** | node **Add After-Hours** (ต่อจาก Flatten Body1) | `after_hours_ok` (boolean · RPC แปลงให้) | บรรทัด ⏰ ท้ายการ์ด + ผ่าน 💭 `comment` |
| `teamSize` หรือ `team_size` | ทั้งคู่ | — (raw_payload) | 👤 Team |
| `revenue`, `goal`, `timeline`, `budget` | ✓ | — (raw_payload) | ⏳ / 🎯 |
| `message`, `brandWebsite` | ✓ | `crm_notes` (fallback) | 💼 Sponsor |
| `bosi_archetype`, `quiz_score`, `score`, `aiSignalCount` | ✓ | — (raw_payload) | 🧬 |

**Key ที่ n8n ไม่รู้จัก = หายจาก column/Telegram** (เหลือแค่ใน raw_payload ก็ต่อเมื่อ Flatten ใส่ — ซึ่งไม่ใส่) เช่นชื่อเฉพาะฟอร์ม: `business`, `issue`, `sales_issue`, `intent`, `lead_temp`, `line_id`(ในฐานะ form field ใช้ได้เพราะ fallback), `serviceInterest`

## ⏰ after_hours_ok — ช่องบังคับกรอกทุกฟอร์ม (เพิ่ม 2026-08-09)

**ทำไม:** คุณปันติดอบรม/ให้คำปรึกษาช่วงกลางวัน — ถ้ารู้ตั้งแต่ตอนกรอกฟอร์มว่าลูกค้ารับสายตอนเย็น
หรือเสาร์-อาทิตย์ได้ จะโทรกลับได้ทันทีที่ว่าง แทนที่จะรอถึงวันทำการ (บอท LINE OA ถามคำถามนี้อยู่แล้ว
→ ฟอร์มถามให้ตรงกัน ข้อมูลไปรวมที่ column เดียว)

- UI: `src/components/AfterHoursField.astro` (radio 2 ตัว · required · `variant="daisy"` หรือ `"warm"`)
- Helper: `src/scripts/after-hours.ts` → `foldAfterHours(payload)` เรียกก่อน POST ทุกฟอร์ม
- ค่า: `"yes"` / `"no"` → RPC `submit_lead` แปลงเป็น boolean ลง column `leads.after_hours_ok`
- บอท LINE OA เขียน column เดียวกัน (`mac-mini-ops/line-relay/crm-leads.mjs`)
- Dashboard แสดงในการ์ดลูกค้า แถว "โทรนอกเวลาทำการ" (แก้ด้วยมือได้)

### ✅ n8n — แก้แล้ว 2026-08-09 (workflow `ZIYQ0hTsy2TiqDxx`)

node **Flatten Body1** ประกอบ object จาก key ที่ hardcode ไว้เท่านั้น → คีย์ใหม่หายทั้ง column และ raw_payload
**ไม่ได้แก้โค้ด 200 บรรทัดของ Flatten** (เสี่ยงพัง pipeline ทั้งเส้น) แต่แทรก Code node
**"Add After-Hours"** คั่นระหว่าง `Flatten Body1` → `IF: Thank-You DM?1` แทน · node นี้ดึงค่าจาก
body ดิบของ webhook มาเติม `after_hours_ok` (yes/no/'') + ต่อบรรทัด ⏰ ท้าย `telegram_message`

> ⚠️ **บทเรียนที่จ่ายมาแล้ว (execution 996/997 ล้มทั้งคู่ ไม่มี lead ลง CRM):**
> ครั้งแรกลองเขียนตรรกะนี้เป็น **expression** ใน Telegram/HTTP node → n8n ตีกลับ
> `ExpressionExtensionError: invalid syntax` และ `JSON Body is not valid JSON`
> **n8n expression `{{ }}` ไม่รองรับ IIFE · `const` · `??` · spread** — ตรรกะที่ซับซ้อนกว่า
> ternary สั้นๆ ต้องอยู่ใน **Code node** เท่านั้น

**ทดสอบ end-to-end หลัง publish แล้ว (2026-08-09):** yes→`true` · no→`false` · ไม่ส่งมา→`null`
· การ์ด Telegram ขึ้นบรรทัด `⏰ นอกเวลาทำการ: สะดวก (เย็น/เสาร์-อาทิตย์โทรได้)` · ลบ ZZ TEST ออกครบแล้ว

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
| `src/pages/ads/dealer-ai-sales.astro` | `ads/dealer-ai-sales` | ✅ alias ครบ · **2026-08-01: `_meta` + click IDs** + tier HOT/WARM (แก้ 27dd249) |
| `src/pages/ads/daruma-consult.astro` | `ads/daruma-consult` | ✅ alias ครบ + tier จาก intent · **2026-08-01: แยก `contact` → `phone`+`line_id`, เพิ่ม phone validation, `_meta`, click IDs** |
| `src/pages/booking.astro` | `website-booking` | ✅ alias company/problems (แก้รอบนี้) · ไม่มี intent → ไม่มี tier |
| `src/pages/intake-form.astro` | `/intake-form` | ✅ ใช้ canonical key ตรงอยู่แล้ว (ฟอร์มแม่แบบ) |
| `src/components/HomeIntakeForm.astro` | `homepage-inline` | ✅ alias ใน JS อยู่แล้ว (company/phone/line/problems/comment) |
| `src/pages/sponsor.astro` | (จาก meta) | ✅ ใช้ yourName/brandName ซึ่ง Flatten/RPC มี fallback รองรับ |
| `src/pages/bosi-dna-quiz.astro` | `bosi-quiz` | ✅ ส่ง company/comment ใน JS |

## Audit 2026-08-01 — สิ่งที่แก้รอบนี้ (ads LP ทั้ง 3 หน้า)

ตรวจ lead จริง 10 ราย (`source like 'ads-%'`) เทียบกับ 4 ชั้นของ pipeline · column หลักไม่มี null (ครบมาตั้งแต่ audit 07-26) แต่เจอ 5 จุดที่**ไม่เคยเก็บเลย**:

| # | ปัญหา | หลักฐาน | แก้ที่ |
|---|---|---|---|
| 1 | daruma ไม่มีช่อง LINE · ช่อง `contact` รับทั้งเบอร์และ LINE → LINE ไปนั่งใน column `phone` | lead จริงมี `phone = 'ss_aor'` | แยกเป็น `phone` (required, validate) + `line_id` (optional) |
| 2 | `fbclid`/`ttclid` ไม่เคยถูกส่ง — ฟอร์มประกาศ `UTM_KEYS` 5 ตัว ไม่มี click ID ทั้งที่ BaseLayout เก็บไว้ใน `pnAttribution` แล้ว | `fbclid_filled = false` ทุกราย | เพิ่ม `CLICK_ID_KEYS` + hidden input ทั้ง 3 หน้า |
| 3 | `reference` ว่าง → node TikTok Events API ส่ง `event_id: ""` ทุกครั้ง = dedupe พัง · `user_agent` ว่างด้วย | `ref_filled = false` · `ua_filled = false` ทุกราย | ฟอร์มส่ง `_meta{reference,page,user_agent,referrer}` · `makeAdsReference()` รูปแบบเดียวกับ intake-form |
| 4 | `consent` ไม่เคยถูกบันทึก — Flatten ไม่อ่าน key นี้ และ Supabase node ส่ง **output ของ Flatten** ไม่ใช่ body ดิบ จึงไม่ตกถึง raw_payload ด้วย | `consent_stored = false` ทุกราย | เพิ่ม `consent` ใน Flatten Body1 (normalize → `yes`) |
| 5 | daruma ส่ง `submitted_at` (snake) แต่ Flatten อ่าน `submittedAt` (camel) → ตกไปใช้เวลาของ n8n | อ่านจาก jsCode | เปลี่ยนเป็น `submittedAt` ทั้ง 3 หน้า |

**ยังไม่เก็บโดยตั้งใจ:** `email` · `position` (ไม่มีในฟอร์มไหนเลย — เพิ่ม friction ถ้าใส่)

**Verified:** ยิง payload จริงเข้า `submit_lead` แล้วตรวจ row → `line_id` · `consent=yes` · `fbclid` · `ttclid` · `reference` · `user_agent` · `submitted_at` ลงครบ แล้วลบ test row ทิ้ง

## หมายเหตุระบบ (รู้ไว้)

- **Validate Booking1** gate เข้มเฉพาะ `source_page === '/booking'` (เป๊ะๆ มี slash) — หน้า booking จริงส่ง `website-booking` จึง**ไม่ผ่าน gate นี้** (by design ปัจจุบัน; ถ้าจะเปิด gate ให้แก้เงื่อนไขใน n8n)
- **Telegram บรรทัด tier** จะโชว์ `Score ?/15` เสมอเมื่อมี tier (template เดิมของ quiz) — cosmetic, ไม่พัง · แก้ได้ต้องเขียนทับ jsCode ของ Flatten Body1 ทั้งก้อน (ยังไม่ทำ เพราะ blast radius กว้างกว่าประโยชน์)
- **In-app browser (TikTok/FB/IG) ถือ cache นาน** — หลัง deploy แก้ฟอร์ม ให้ทดสอบใน Safari/Chrome ปกติ หรือเติม `?v=N` · lead จริงที่คลิกจาก ads ครั้งแรกไม่มี cache เก่า ไม่กระทบ
- RPC `submit_lead` เป็น SECURITY DEFINER — ฟอร์มไม่ต้องมีสิทธิ์ insert ตรง
- Lead เดิม 3 รายจาก dealer (Belel/Tuangrat/วิว 25–26 Jul) เกิดก่อน fix → company/tier/ปัญหา null ถาวร แต่เบอร์+LINE ครบ

## Audit 2026-08-09 — ช่องบังคับกรอก + after-hours

| ฟอร์ม | `after_hours_ok` | ช่องบังคับกรอก (ชื่อ · เบอร์ · ตำแหน่ง · บริษัท · งบ) |
|---|---|---|
| `intake-form.astro` | ✅ | ครบ (เพิ่ม required ให้ `budget`) |
| `HomeIntakeForm.astro` | ✅ | ครบ (เพิ่มช่อง `position` + `budget`) |
| `ads/daruma-consult.astro` | ✅ | ครบอยู่แล้ว |
| `ads/dealer-ai-sales.astro` | ✅ | ครบ (เพิ่ม `budget` · `business` = ชื่อบริษัท → alias `company`) |
| `ads/hotel-resort-ai.astro` | ✅ | ครบ (เพิ่ม `budget` · `business` = ชื่อบริษัท → alias `company`) |
| `booking.astro` | ✅ | ครบ (เพิ่ม `company` + `position`) |
| `waitlist.astro` | ✅ | ไม่บังคับ `budget` — คอร์สราคาตายตัว ไม่มีช่องงบ |
| `sponsor.astro` | ✅ | ไม่บังคับ `budget` — ฝั่งสปอนเซอร์เป็นคนจ่าย งบอยู่ในช่อง brief |
| `bosi-dna-quiz.astro` | ❌ ข้าม | ไม่เก็บเบอร์/LINE เลย → ไม่มีช่องทางให้โทรกลับ · เป็นด่านก่อนเริ่มควิซ ไม่ใช่คำขอติดต่อ |
