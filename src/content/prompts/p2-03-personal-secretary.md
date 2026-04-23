---
title: "P2-03 — Spawn Personal Secretary"
tier: starter
phase: 2
slug: p2-03-personal-secretary
prereqs: [p2-01-sale-agent-owner]
useCase: "สร้าง agent ผู้ช่วยส่วนตัวที่จัดการ inbox / calendar reminder / daily summary / meeting prep"
timeToSetup: "8 นาที"
checkGate:
  - "คุณมี ./claude.md ที่ระบุ working hours + meeting cadence ใช่มั้ย? (ถ้าไม่มี ให้เพิ่มก่อนรัน prompt นี้)"
  - "คุณรู้ว่าจะให้ secretary ทำอะไรบ้าง: inbox triage / calendar / daily summary / meeting prep ใช่มั้ย? (เลือกอย่างน้อย 2)"
  - "คุณมี ./agents/ folder จาก P2-01/P2-02 แล้วใช่มั้ย?"
workedExample:
  industry: "Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)"
  scenario: "Solo consultant มีลูกค้า 6-8 คนพร้อมกัน · พลาด follow-up + ลืมเตรียม meeting · ต้องการผู้ช่วยที่ runs daily"
  inputs: "./claude.md + รายการ task ที่อยากให้ secretary ทำ + working hours"
  output: "./agents/operations/personal-secretary.md (~130 บรรทัด) + daily routine 3 jobs (morning brief / lunch checkpoint / EOD wrap)"
  timeSaved: "จัดการเอง 30-45 นาที/วัน · secretary 10 นาที/วัน + ไม่พลาด follow-up"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี Sale + Content agent แล้ว และต้องการ agent ที่ดูแล operations ส่วนตัว

## Prerequisite
- P2-01 (มี ./agents/ folder structure)
- claude.md ที่ระบุ working hours

## The Prompt

```
ผมต้องการสร้าง Personal Secretary agent

ขั้นตอน:
1. อ่าน ./claude.md — focus ที่ working hours / meeting cadence / priority of life
2. อ่าน skill-build-agent-team.md — ดู template "Personal Secretary"
3. ก่อนเขียนไฟล์ ถามผม 3 คำถาม:
   - อยากให้ secretary ทำงานอะไรบ้าง? (inbox / calendar / daily summary / meeting prep / errand reminder)
   - ต้องการ daily routine กี่ครั้ง? (1 ครั้ง morning เท่านั้น / 2 ครั้ง morning+EOD / 3 ครั้ง morning+lunch+EOD)
   - ความสัมพันธ์กับ sale-team-leader — ให้ secretary ส่งเคสให้ sale agent ตอนไหน

4. หลังได้คำตอบ สร้างไฟล์ที่ ./agents/operations/personal-secretary.md

โครงสร้าง 6 sections:
- Role & Mission
- Context inheritance
- Daily routine (ระบุเวลา + jobs ตามคำตอบข้อ 2)
- Task scope (ตามคำตอบข้อ 1 — แต่ละงานต้องบอก input/output ชัด)
- Hand-off rules (ตามคำตอบข้อ 3)
- Boundaries (ห้ามทำอะไร เช่น ห้ามตอบ email แทนผม / ห้ามนัดประชุมโดยไม่ confirm)

กฎสำคัญ:
- Boundaries section บังคับเขียน — ป้องกัน secretary over-act
- ทุก job ใน Daily routine ต้องมี output ที่จับต้องได้ (ไม่ใช่ "monitor inbox" แต่เป็น "list 3 emails ที่ต้องตอบวันนี้")
- ห้ามสมมติ tool integration (Gmail MCP / Calendar MCP) — ถ้าผมยังไม่ setup ให้เขียนเป็น TODO

หลังเสร็จ summary 4 บรรทัด + smoke test: "@personal-secretary ขอ morning brief วันนี้"
```

## Expected output
./agents/operations/personal-secretary.md + summary + smoke test · มี Boundaries section ที่ป้องกัน over-act

## Worked Example
**Industry:** Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)
**Scenario:** Solo มีลูกค้า 6-8 ราย · พลาด follow-up · ต้องการ daily ops
**Inputs:** ./claude.md + คำตอบ 3 คำถาม (เลือก inbox+calendar+daily summary, 3 ครั้ง/วัน, ส่ง sale agent เมื่อ lead reply)
**Output:** ./agents/operations/personal-secretary.md ~130 บรรทัด + 3-routine schedule
**Time saved:** จัดการเอง 30-45 นาที/วัน · secretary 10 นาที/วัน

## Next step
→ ใช้ prompt P2-04 (CRM Bot with Google Sheet) ถ้าใช้ Sheet เก็บลูกค้า · หรือ P2-05 ถ้าอยาก proposal writer ก่อน
