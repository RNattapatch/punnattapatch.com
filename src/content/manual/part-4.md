---
title: "Prompt Library 20 ท่า + Next Steps"
description: "ตาราง 20 prompts พร้อมใช้ แบ่งตาม Phase × Tier, routing แนะนำสำหรับ session แรก, In-house Workshop สำหรับเจ้าของ, P1 Public Training สำหรับ Manager"
part: 4
partTitle: "Prompt Library 20 ท่า + Next Steps"
readingTime: 6
published: 2026-04-23
draft: false
---

## §20 · Prompt Library 20+ — Phase × Tier × One-liner

ใน Kit นี้ผมเตรียม prompt 20 ตัวให้ใช้ทันที ครอบคลุมตั้งแต่ session แรกที่เปิด Claude Code ไปจนถึงการต่อ MCP กับเครื่องมือภายนอก

แต่ละ prompt มี structure เดียวกัน:
- **CHECK gate** (ก่อนใช้ ตอบ "ใช่" ทุกข้อก่อน paste)
- **The Prompt** (ตัว prompt ที่ copy ไปใช้ได้เลย)
- **Worked Example** (ผลที่ควรได้ industry/scenario/inputs/output/time saved)
- **Next step** (เมื่อเสร็จ prompt นี้ ไปต่อตัวไหน)

### วิธีอ่าน Phase × Tier

**Phase** = อยู่ขั้นตอนไหนของ journey

| Phase | ชื่อ | เป้าหมาย |
|---|---|---|
| **P1** | Setup | ติดตั้ง Claude Code + claude.md ตั้งต้น |
| **P2** | Build | สร้าง agent team ของธุรกิจ |
| **P3** | Operate | ใช้งานทุกวัน routine + meeting + qualification |
| **P4** | Scale | audit automation gate MCP integration |

**Tier** = ระดับความซับซ้อนของการเอา prompt ไปใช้

- 🟢 **Starter** — copy/paste แล้วใช้ได้เลย ไม่ต้องตั้ง agent ก่อน
- 🟡 **Intermediate** — ต้องมี agent หรือ context พร้อมก่อน setup 5-15 นาที
- 🔴 **Advanced** — pattern ระดับสูง ใช้เมื่อมีทีม agent 4+ ตัวแล้ว

### ตาราง 20 prompts ทั้งหมด

| Slug | Tier | Phase | ชื่อ Prompt | Use Case |
|---|---|---|---|---|
| `p1-01-install-claude-code` | 🟢 Starter | P1 | Install Claude Code + first greeting | เริ่ม session แรกใน Claude Code — ให้ The Architect แนะนำตัวและ detect persona ก่อนสร้าง claude.md |
| `p1-02-claude-md-interview` | 🟢 Starter | P1 | Create claude.md via interview | Trigger skill-business-context 5-phase interview เพื่อสร้าง claude.md ที่เป็น single source of truth ของธุรกิจคุณ |
| `p1-03-audit-claude-md` | 🟡 Intermediate | P1 | Audit existing claude.md for gaps | ถ้าคุณมี claude.md อยู่แล้ว ให้ Claude สแกนหา section ที่ขาด/อ่อน/ขัดกัน ก่อนเอาไปสร้าง agent |
| `p1-04-multi-project-claude-md` | 🔴 Advanced | P1 | Multi-project claude.md structure | ถ้ามีหลาย project / หลายบริษัท / agency หลาย client ออกแบบ shared claude.md + per-project override pattern |
| `p2-01-sale-agent-owner` | 🟢 Starter | P2 | Spawn Sale Agent (owner template) | สร้าง agent ตัวแรก Sale Team Leader ที่อ่าน claude.md เป็น context และตอบคำถาม sales/CRM/proposal ได้ |
| `p2-02-content-agent` | 🟢 Starter | P2 | Spawn Content Agent | สร้าง Content Team Leader agent ที่เขียน FB post / reel script / carousel ตาม Voice ของคุณ |
| `p2-03-personal-secretary` | 🟢 Starter | P2 | Spawn Personal Secretary | สร้าง agent ผู้ช่วยส่วนตัวที่จัดการ inbox / calendar reminder / daily summary / meeting prep |
| `p2-04-crm-bot-sheets` | 🟡 Intermediate | P2 | Spawn CRM Bot with Google Sheet | เชื่อม Google Sheet (CRM) เข้ากับ agent อ่าน lead / append row / update status ผ่าน @crm-bot |
| `p2-05-proposal-writer-brand-voice` | 🟡 Intermediate | P2 | Spawn Proposal Writer with brand voice | สร้าง agent เขียน proposal ที่ tone ตรงแบรนด์ + เรียนจาก 3 closed-won deals ที่คุณเคยปิดได้ |
| `p2-06-custom-department-head` | 🟡 Intermediate | P2 | Design custom department head agent | Meta-prompt ออกแบบ agent หมวดใหม่ (HR / Procurement / Compliance / Logistics) ผ่าน guided Q&A |
| `p2-07-orchestrator-router` | 🔴 Advanced | P2 | Orchestrator pattern (router agent) | เมื่อทีม agent มี 4+ ตัวแล้วเริ่มงงว่า task ไหนเรียกใคร สร้าง orchestrator ที่ route ไปยัง specialist |
| `p2-08-agent-handoff` | 🔴 Advanced | P2 | Agent-to-agent handoff workflow | ให้ agent ส่งงานต่อกันโดยตรง พร้อม context bundle ที่ structured ไม่ต้องผ่าน orchestrator ทุกครั้ง |
| `p3-01-daily-briefing` | 🟢 Starter | P3 | Daily briefing from Personal Secretary | รัน prompt นี้ทุกเช้า Personal Secretary สรุป log เมื่อวาน + calendar วันนี้ + งาน priority สูง เป็น 5-bullet briefing |
| `p3-02-agent-direct-task` | 🟢 Starter | P3 | @agent direct task format | เรียนรู้รูปแบบ @agent shortcut + 3 variant: single / multi-agent CC / agent-handoff |
| `p3-03-weekly-content-plan-meeting` | 🟡 Intermediate | P3 | Weekly content plan via team meeting | ทุกวันอาทิตย์ รัน meeting ระหว่าง content agent ทั้งหมด ออก weekly plan 3 platform × 7 วัน |
| `p3-04-lead-qualification-pipeline` | 🟡 Intermediate | P3 | Lead qualification pipeline prompt | ป้อน raw lead → Sale Agent qualify ด้วย ICP จาก claude.md → output qualified/not + reason + next step |
| `p3-05-multi-agent-strategic-planning` | 🔴 Advanced | P3 | Multi-agent strategic planning session | ทุกต้นเดือน dept head ทุกตัว generate 30-day strategy ร่วมกัน cross-functional ออกเอกสาร 1 ฉบับ |
| `p4-01-monthly-agent-audit` | 🟡 Intermediate | P4 | Monthly agent performance audit | ทุกสิ้นเดือน audit output quality ของแต่ละ agent ใน 30 วันที่ผ่านมา identify drift / improvement / deprecate |
| `p4-02-automation-gate-n8n` | 🔴 Advanced | P4 | Automation gate: agent → n8n workflow | Decision matrix task ไหนของ agent ที่ควร upgrade เป็น n8n scheduled workflow criteria 4 ข้อ |
| `p4-03-mcp-integration` | 🔴 Advanced | P4 | MCP server integration pattern | ติดตั้ง + ใช้ MCP server (Slack / Notion / Google Drive / Gmail) ครอบคลุม config + agent integration + safety |

### URL pattern

ทุก prompt มีหน้าเว็บแบบเต็มที่:

```
https://punnattapatch.com/agent-builder-kit/prompts/<slug>
```

เช่น `p1-01-install-claude-code` → https://punnattapatch.com/agent-builder-kit/prompts/p1-01-install-claude-code

### Routing แนะนำสำหรับ session แรก

1. `p1-01-install-claude-code` (session แรก · 3 นาที)
2. `p1-02-claude-md-interview` (สร้าง claude.md · 15-20 นาที)
3. **เลือก 1 อันต่อไปนี้ตาม "หมวก" ที่ใส่ทุกวัน:**
   - 80% เวลาคุยลูกค้า → `p2-01-sale-agent-owner`
   - 80% เวลาทำ content → `p2-02-content-agent`
   - 80% เวลาประชุม + เอกสาร → `p2-03-personal-secretary`
4. `p3-02-agent-direct-task` (เรียน @agent shortcut · 5 นาที)
5. `p3-01-daily-briefing` (set routine เช้าทุกวัน · 1 นาที setup · ใช้ตลอดไป)

ใน 1 อาทิตย์คุณจะมี agent 1 ตัวที่ทำงานจริง + routine เช้าที่อ่าน briefing ทุกวัน

---

## §21 · Next Step สำหรับเจ้าของธุรกิจ → In-house Workshop

ถ้าคุณอ่านมาถึงนี้ เห็นภาพชัดแล้วว่าระบบนี้ใช้ได้วันนี้ แต่คุณกลัวจะติดที่ขั้นตอนไหนระหว่างทาง หรือไม่อยากเสียเวลาทีมไป trial-and-error 3-6 เดือน

ทางลัดคือให้ผมเข้าไปติดตั้งให้

**In-house Workshop · 1 วัน · ที่ออฟฟิศคุณ**

- ผม + ทีมคุณ build agent system ด้วยกัน ใช้ปัญหาจริง ลูกค้าจริง เป้าหมายจริงของบริษัทคุณ ไม่ใช่ template กลางๆ
- พนักงาน 5-20 คนได้ลงมือทำ ทุกคนเข้าใจหลักการ นำไปต่อยอดเองได้
- จบวัน มี agent อย่างน้อย 1-2 ตัวรันได้จริง + Action Plan 30 วัน
- 30 วันถัดมา ผมตอบทุกคำถามทาง LINE OA ฟรี

> ผมเข้าไปเอง ทำกับทีมคุณ 1 วัน ไม่ใช่ส่งคนอื่นไปแทน ออกจากห้อง คุณไม่ได้ใบ certificate คุณได้ระบบที่ทีมคุณใช้ตั้งแต่วันจันทร์

ราคา ฿44,900

[ดูรายละเอียดและจอง In-house Workshop](https://punnattapatch.com/services/ai-workshop)

---

## §22 · Next Step สำหรับ Manager → P1 Public Training

นาย / หัวหน้าผมส่งให้คุณอ่าน Kit นี้ บอกว่า "ลองดูซิว่า AI ใช้กับทีมเราได้ยังไง" 6 เดือนต่อมานายต้องการเห็นผลงาน แต่คุณไม่มีงบจ้างที่ปรึกษาเข้ามาทั้งทีม

นี่คือสถานการณ์ที่ผมเห็นบ่อยที่สุดในงาน consult เลยออกแบบ **P1 AI Workshop** มาเฉพาะคุณ

**P1 — 1-day public training · max 12 ที่นั่ง · 1 ธุรกิจ / 1 อุตสาหกรรม per cohort**

- ครอบคลุมทั้ง 4 phase: Setup → Build → Operate → Scale (compressed ในวันเดียว)
- คุณติดตั้ง Claude Code จริง build agent ตัวแรกของธุรกิจคุณในห้อง ออกจากห้องพร้อม Action Plan 30 วัน
- เพื่อนร่วมคลาส 11 คนจาก 11 อุตสาหกรรมที่ไม่เป็นคู่แข่งคุณ แลก use case เอา idea กลับไปนำเสนอนายได้
- Cohort-cap 12 ที่ปิดเมื่อเต็ม early-bird Waitlist Lock ฿11,900 (ราคาเปิดจริง ฿19,900)

> Course เล็ก เน้นลงมือ ห้องเรียนที่คุยเปิด ทุกคนได้แชร์ use case จริง นี่คือสิ่งที่ open course ใหญ่ๆ 100 คนทำไม่ได้ ติดตรงไหนมาปรึกษากันในห้องเลย ผมช่วยดูให้ คอร์สนี้เราจะไปพร้อมกัน

[ดูรอบและลงชื่อ Waitlist สำหรับ P1](https://punnattapatch.com/training/p1-ai-workshop-1-day)

---

## §22.5 · ยังไม่พร้อมเลือก? · คุยก่อนได้

ถ้ายังไม่แน่ใจว่า Workshop หรือ P1 เหมาะกับธุรกิจคุณกว่ากัน จองคุยกับผม 30 นาที ผม audit ธุรกิจคุณ + แนะ wedge แรก ฟรี ไม่มี hard sell

[จอง Discovery Call → punnattapatch.com/intake-form?source=kit-manual](https://punnattapatch.com/intake-form?source=kit-manual)

---

## §23 · ติดต่อ + Version

```
─────────────────────────────────────
   AI Agent Builder Kit
   Manual v1.0 · 2026-04
─────────────────────────────────────

   © 2026 Pun Nattapatch (@pun_nattapatch)

   Web    · punnattapatch.com
   LINE   · https://lin.ee/ioSnSUG
   Email  · r.nattapatch@gmail.com

─────────────────────────────────────
   "ขายระบบที่ผมใช้กับธุรกิจตัวเอง
    และกับลูกค้าที่ปิดดีลจริง"
─────────────────────────────────────
```
