# Client Onboarding Center + Ticket Intake — Design

**Date:** 2026-08-21
**Status:** รอคุณปันเคาะ (ยังไม่เริ่ม implement)
**Scope:** ศูนย์ onboarding สำหรับ **ลูกค้าที่จ่ายเงินแล้ว** + ช่องรับ ticket ช่องทางเดียว บน `punnattapatch.com` / `app.punnattapatch.com`
**Related:** C10 AI Ticket Ops Pipeline (`products/business-os-template/ops/BACKLOG.md`) · pre-client-4 requirement "Ticket/request queue ช่องทางเดียว + severity matrix"

---

## Problem

ตอนนี้หลังลูกค้าจ่ายเงิน ทุกอย่างวิ่งผ่าน LINE แชทสดกับคุณปันคนเดียว:

- **ลูกค้าไม่รู้ว่าตัวเองอยู่ตรงไหนของงาน** — ต้องทักถาม คุณปันต้องตอบเอง
- **material กระจายเป็นลิงก์เดี่ยว** — `/playbook/line-ai-sales-agent`, `/guide/facebook-chatbot`, `/workshop/line-bot` แจกทีละใบทาง LINE ไม่มีที่รวม ลูกค้าหาลิงก์เก่าไม่เจอ
- **ไม่มีช่องแจ้งปัญหา** — ลูกค้าทักไลน์ตอนไหนก็ได้ ปนกับบทสนทนาขาย จับ SLA ไม่ได้ วัดอะไรไม่ได้ และตอนคุณปันติดสอน/on-site = ตกหล่น

อันสุดท้ายคือ **ความกลัวจริงของโมเดลให้เช่า** ที่บันทึกไว้ใน session log 2026-08-18 — ไม่ใช่ปัญหา identity แต่เป็นปัญหา ops

## Goal

1. ลูกค้าที่ซื้อแล้วเปิดลิงก์เดียวจากมือถือ **เห็นว่างานถึงไหน ต้องทำอะไรต่อ ของที่ต้องอ่านอยู่ไหน** โดยไม่ต้องทักถาม
2. ทุก "ติดปัญหา / ขอแก้ / ขอเพิ่ม" เข้า **ช่องเดียว** มีเลข ticket มีสถานะ มี severity — ไม่ใช่แชทสด
3. คุณปันมีจอเดียวเห็น ticket ค้างทุกราย และวัดได้ว่า **% ticket ที่จบใน <5 นาที** (metric ของ Day-90 review)

## Non-goals (V1 ไม่ทำ)

- ไม่ทำ self-serve billing / ต่ออายุออนไลน์ (ลูกค้าจ่ายเพื่อ**ไม่ต้อง**จัดการเอง)
- ไม่ทำระบบสมัครสมาชิก / ตั้งรหัสผ่าน / ยืนยันอีเมล
- ไม่แตะเลน incident อัตโนมัติของ C10 (health check → restart → rollback) — คนละเลน สร้างทีหลัง
- ไม่ทำ M14 Onboarding + Knowledge Center (โมดูลที่**ขายลูกค้า**ให้พนักงานใหม่เขาถาม bot) — คนละสินค้า

---

## สิ่งที่มีอยู่แล้ว (ยืนยันแล้ว 2026-08-21)

| ของ | สถานะ | ใช้ต่อได้ยังไง |
|---|---|---|
| `leads` (163 แถว) | มี `purchase_count`, `lifetime_value_thb`, `line_user_id`, `after_hours_ok` | **ลูกค้าที่ซื้อแล้ว = lead ที่มี purchase** ไม่ต้องสร้างตาราง customer ใหม่ |
| `purchases` (7) → `packages` (9) | ผูก `lead_id` + `package` + `document_id` | บอกได้ว่าลูกค้ารายนี้ซื้อแพ็กเกจไหน → กำหนด checklist ตามแพ็กเกจ |
| `documents` + `short_id` | มี edge function `d/<short_id>` mint signed URL สด | **pattern ลิงก์ลับที่พิสูจน์แล้วในบ้าน** — ใช้ซ้ำกับลิงก์ onboarding ได้ |
| `wr_jobs` worker pattern | queue → Codex/Claude บนมินิ → กลับมาเขียนผล | โครงเดียวกับที่ ticket worker จะใช้ |
| `app.punnattapatch.com` | หลัง Cloudflare Access + Google login + RLS | ฝั่งคุณปัน (จอ ticket) วางที่นี่ |
| หน้า material 3 ใบ | unlisted + noindex ทำงานอยู่จริง | ยกมาเป็น "ชั้นหนังสือ" ในศูนย์ ไม่ต้องเขียนใหม่ |

**ที่ยังไม่มี:** ตาราง onboarding/ticket ใดๆ ใน Supabase · route ลูกค้า · ระบบยืนยันตัวตนฝั่งลูกค้า

> ⚠️ ระบบ ticket ชุดปี 2026-04 (`output/web-app/landing-pages/intake-ticket.html` + `ticket-api.gs` + n8n json + `ticket-processor.js` ในรีโปหลัก) ออกแบบบน Google Sheets + GAS **ก่อน**ย้ายมา Astro+Supabase — **ห้ามเอามา deploy** ใช้อ่านเป็น reference ของ field/flow ได้อย่างเดียว

---

## Decision ที่ต้องเคาะก่อนเริ่ม: ลูกค้าเข้าระบบยังไง

ลูกค้าคือ**เจ้าของ SME อายุ 35+ ที่อยู่บนมือถือและใช้ LINE** ไม่ใช่ user ใน Google Workspace ของคุณปัน — จึงใช้ Google login ของ dashboard ไม่ได้

| ทาง | ลูกค้าต้องทำอะไร | ข้อดี | ข้อเสีย |
|---|---|---|---|
| **A. ลิงก์ลับต่อราย (แนะนำ)** | กดลิงก์ที่ส่งให้ทาง LINE — จบ | แรงเสียดทาน 0 · pattern เดียวกับ `documents.short_id` ที่ใช้อยู่จริง · สร้างเสร็จเร็วสุด | ใครได้ลิงก์ก็เปิดได้ → ต้องกันด้วย token ยาว + หมดอายุ + ไม่ใส่ข้อมูลอ่อนไหว |
| B. LINE Login (LIFF) | กดยืนยันใน LINE ครั้งแรก | ผูกกับ `leads.line_user_id` ที่มีอยู่แล้ว · รู้แน่ว่าใครเปิด | ต้องตั้ง LIFF + จัดการ token · งานเพิ่มอีกชั้น |
| C. Magic link ทางอีเมล | เปิดเมล กดลิงก์ | มาตรฐาน | `leads.email` เป็น nullable และลูกค้ากลุ่มนี้ไม่ค่อยเปิดเมล |

**ข้อเสนอ:** V1 ใช้ **A** (token 32 ตัวอักษร · หมดอายุ 180 วัน · revoke ได้จากจอคุณปัน · หน้า `noindex` + `Referrer-Policy: no-referrer`) แล้วอัปเป็น B เมื่อมีลูกค้าเกิน ~10 ราย หรือเมื่อต้องโชว์ข้อมูลที่อ่อนไหวกว่านี้

**ข้อมูลที่ห้ามอยู่บนหน้าลิงก์ลับเด็ดขาด:** ราคา/ยอดเงิน · เลขผู้เสียภาษี · เบอร์/อีเมลของคนอื่น · ไฟล์เอกสารการเงิน (ให้ใช้ลิงก์ `d/<short_id>` เดิมที่ mint signed URL แยก)

---

## Data model (ใหม่ 3 ตาราง)

```
engagements            1 แถว = 1 งานที่ขายไปแล้ว (ผูก lead + package)
  id · lead_id → leads · package (→ packages.id) · purchase_id → purchases
  title · status (kickoff | in_progress | handover | done | paused)
  access_token (unique) · token_expires_at · revoked_at
  started_at · target_done_at · owner_note · created_at

engagement_steps       checklist ของงานนั้น (มาจาก template ตามแพ็กเกจ)
  id · engagement_id → engagements · seq
  title · description · owner (pun | client)      ← ใครต้องขยับ
  status (pending | waiting_client | done | skipped)
  material_url (nullable)                          ← ชี้ไป playbook/guide/workshop
  done_at · created_at

tickets                ทุก "ติด/ขอแก้/ถาม" ช่องเดียว
  id · ticket_no (TK-YYYYMM-###) · engagement_id → engagements (nullable)
  lead_id → leads · channel (web | line | dashboard)
  severity (blocker | high | normal | question)    ← ลูกค้าเลือกเอง คุณปันปรับได้
  subject · body · attachments jsonb
  status (new | acked | in_progress | waiting_client | resolved | closed)
  acked_at · resolved_at · resolution_note
  created_at · updated_at
```

**RLS:** ทั้ง 3 ตารางเปิด RLS แบบ deny-by-default เหมือนตารางอื่นในโปรเจกต์ · ฝั่งลูกค้า**ไม่ยิง Supabase ตรง** — อ่านผ่าน endpoint บนมินิที่ตรวจ token แล้วคืนเฉพาะ field ที่อนุญาต (คนละ pattern กับ dashboard ที่ยิงตรงภายใต้ RLS + Google login)

**Severity matrix (ตกลงกับลูกค้าตั้งแต่วันส่งมอบ):**

| ระดับ | ความหมายภาษาลูกค้า | รับทราบภายใน | เริ่มแก้ภายใน |
|---|---|---|---|
| `blocker` | ระบบไม่ทำงาน ทำธุรกิจต่อไม่ได้ | 1 ชม. (เวลาทำการ) | วันเดียวกัน |
| `high` | ใช้ได้แต่มีจุดพัง กระทบงานประจำวัน | 4 ชม. | 2 วันทำการ |
| `normal` | ขอปรับ/ขอเพิ่ม ไม่เร่ง | 1 วันทำการ | รอบ release |
| `question` | ถามวิธีใช้ | 1 วันทำการ | ตอบเลย |

---

## Routes

**ฝั่งลูกค้า** (`punnattapatch.com` · noindex · ไม่มีใน sitemap · ไม่มีลิงก์จากเมนู)

| Route | คืออะไร |
|---|---|
| `/c/[token]` | หน้าเดียวจบ: สถานะงาน + checklist ขั้นถัดไป + ชั้นหนังสือ material + ปุ่มแจ้งปัญหา |
| `/c/[token]/ticket` | ฟอร์มแจ้งปัญหา (หัวข้อ · ระดับ · เล่าอาการ · แนบรูป) |
| `/c/[token]/ticket/[ticket_no]` | สถานะ ticket ใบนั้น + เธรดตอบกลับ |

**ฝั่งคุณปัน** (`app.punnattapatch.com` หลัง Access เดิม)

| Route | คืออะไร |
|---|---|
| `/app/engagements` | ลูกค้าที่กำลังส่งมอบทั้งหมด + ขั้นที่ค้าง + ปุ่มสร้าง/revoke ลิงก์ |
| `/app/tickets` | คิว ticket ทุกราย เรียงตาม severity + อายุ · ปุ่ม ack/resolve · ตัวเลข % จบ <5 นาที |

**ทำไมหน้าลูกค้าอยู่บนโดเมนหลัก ไม่ใช่ app.**: `app.punnattapatch.com` อยู่หลัง Cloudflare Access ทั้งโดเมน (ลูกค้าเข้าไม่ได้) และ `_headers.app` CSP บล็อก Google Fonts — บทเรียนเดียวกับตอนย้าย playbook ออกจาก `src/pages/app/` เมื่อ 6 ส.ค.

---

## Flow

**ตอนปิดดีล (คุณปัน 30 วินาที)**
1. ในจอ `/app/engagements` กด "เปิดงานใหม่" → เลือก lead + แพ็กเกจ
2. ระบบ generate checklist จาก template ของแพ็กเกจนั้น + สร้าง token
3. กด "ส่งเข้า LINE" → push ข้อความ + ลิงก์ผ่าน LINE OA (`leads.line_user_id` ที่ผูกไว้แล้ว)

**ตอนทำงาน**
- ลูกค้าเปิดลิงก์เดิมได้ตลอด เห็นขั้นที่ค้างและว่าใครต้องขยับ (`owner` = pun หรือ client)
- คุณปันติ๊ก step เสร็จจากจอตัวเอง → ลูกค้าเห็นทันทีโดยไม่ต้องแจ้ง

**ตอนลูกค้าติดปัญหา**
1. กดปุ่มแจ้งปัญหาจากหน้าเดิม (หรือพิมพ์ keyword ใน LINE OA — เลนเดียวกัน สร้าง ticket ใบเดียวกัน)
2. ระบบตอบเลข `TK-...` + เวลารับทราบตาม severity ทันที
3. การ์ดเข้า Telegram คุณปัน (โครงเดียวกับการ์ด lead ที่ใช้อยู่)
4. คุณปันกด ack → ลูกค้าเห็นสถานะเปลี่ยนเอง ไม่ต้องทักถาม

**ต่อ C10 ทีหลัง (ยังไม่ทำใน V1):** ticket ที่เข้าคิวคือ input ของ worker บนมินิ — Claude วินิจฉัย → Codex ทำใน staging → การ์ดสรุปเข้า Telegram → คุณปัน approve จุดเดียว · V1 แค่ต้องเก็บ `tickets` ให้ครบพอที่ worker หยิบไปทำงานต่อได้

---

## Phasing

| เฟส | ได้อะไร | ประเมิน |
|---|---|---|
| **P1 — ท่อ ticket ก่อน** | 3 ตาราง + `/c/[token]` (อ่านอย่างเดียว) + ฟอร์ม ticket + `/app/tickets` + การ์ด Telegram | ครึ่งวัน–1 วัน |
| **P2 — checklist มีชีวิต** | template ตามแพ็กเกจ · ติ๊กจากจอคุณปัน · ชั้นหนังสือ material · push เข้า LINE | 1 วัน |
| **P3 — วัดผล + ต่อ C10** | metric time-to-ack / %<5 นาที · ticket keyword ใน LINE OA · ส่ง ticket เข้า worker มินิ | 1 วัน |

**เสนอให้เริ่ม P1 ก่อน** เพราะช่องรับ ticket คือของที่ขาดแล้วเจ็บจริงตอนคุณปันติด on-site ส่วน checklist เป็นของที่ทำให้ดูดีขึ้นแต่ยังพอใช้ LINE แทนได้อีกพักหนึ่ง

---

## Open questions (รอคุณปันตอบก่อน implement)

1. **ลิงก์ลับ (ทาง A) โอเคไหม** หรืออยากได้ LINE Login ตั้งแต่แรก
2. **ลูกค้าปัจจุบันกี่รายที่ควรมีศูนย์นี้** — ทำ template checklist ตามแพ็กเกจไหนก่อน (Daruma? LINE AI Sales Agent? Business OS?)
3. **SLA ในตารางข้างบนกล้าประกาศกับลูกค้าไหม** — ประกาศแล้วต้องทำได้จริง ไม่งั้นเสียมากกว่าได้
4. **ticket จะรับผ่าน LINE OA ด้วยเลยไหมใน P1** หรือเอาเฉพาะฟอร์มบนเว็บก่อน
