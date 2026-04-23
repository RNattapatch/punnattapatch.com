---
title: "P1-04 — Multi-project claude.md structure"
tier: advanced
phase: 1
slug: p1-04-multi-project-claude-md
prereqs: [p1-02-claude-md-interview]
useCase: "ถ้าคุณมีหลาย project / หลายบริษัท / agency หลาย client — ออกแบบ shared claude.md + per-project override pattern เพื่อไม่ต้องเขียนซ้ำ"
timeToSetup: "20 นาที"
checkGate:
  - "คุณมี project Claude Code มากกว่า 1 folder ใช่มั้ย? (เช่น holding มี 3 บริษัทย่อย / agency มี 5 client)"
  - "คุณมี base claude.md ที่ใช้ได้กับทุก project แล้ว (จาก P1-02) ใช่มั้ย?"
  - "คุณเข้าใจ symlink หรือ git submodule พื้นฐานใช่มั้ย? (pattern นี้ต้องใช้อย่างใดอย่างหนึ่ง)"
workedExample:
  industry: "Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)"
  scenario: "Solo consultant ทำงานให้ 4 client พร้อมกัน · แต่ละ client มี project Claude Code แยก · ไม่อยากเขียน Identity/Voice/Constraints ซ้ำ 4 รอบ"
  inputs: "base claude.md (shared) + ข้อมูลเฉพาะ 4 client + decision: symlink หรือ override-file pattern"
  output: "โครงสร้าง 1 base claude.md (~/agent-base/claude.md) + 4 per-client override files + คำแนะนำว่าเมื่อไหร่ใช้ pattern ไหน"
  timeSaved: "เขียนซ้ำ 4 รอบ + ตามแก้ทุกรอบที่ base เปลี่ยน: หลัก ชม.ต่อสัปดาห์ · pattern นี้ตั้งครั้งเดียว 20 นาที"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี Claude Code project มากกว่า 1 ที่ต้อง share Identity/Voice/Constraints ตัวเดียวกัน

## Prerequisite
- P1-02 (มี base claude.md แล้ว)
- ความเข้าใจ symlink พื้นฐาน หรือยอม import file

## The Prompt

```
ผมมี base claude.md อยู่แล้วที่ ./claude.md
แต่ตอนนี้ผมต้องดูแล [N] project พร้อมกัน:
- Project A: [ชื่อ + sector]
- Project B: [ชื่อ + sector]
- Project C: [ชื่อ + sector]

ทุก project แชร์: Identity, Voice, Constraints, Brand rules
แต่ต่างกันที่: Business model, Audience, Goals, File routing

ขอให้คุณออกแบบ multi-project pattern ให้ผม โดยพิจารณา 2 ทางเลือก:

ทางเลือก A — Symlink pattern
- ตั้ง ~/agent-base/claude-shared.md (เก็บ section ที่แชร์)
- แต่ละ project มี claude.md ที่เริ่มด้วย import line ชี้ไป shared file
- per-project sections เขียนใต้ import line

ทางเลือก B — Override file pattern
- แต่ละ project มี claude.md เต็มไฟล์ (copy จาก base)
- เพิ่ม claude.local.md สำหรับ override per-project
- กฎ: ถ้า field ขัดกัน claude.local.md ชนะ

วิเคราะห์ให้ผมตามนี้:
1. แต่ละทางเลือกเหมาะกับ user แบบไหน (จำนวน project / ความถี่ที่ base เปลี่ยน / ทีมเดียว vs หลายทีม)
2. Trade-off ของแต่ละทาง (ความง่าย vs ความยืดหยุ่น vs risk drift)
3. แนะนำทางเลือกสำหรับเคสผม + เหตุผล
4. เขียนตัวอย่าง file structure ที่ผมเอาไป implement ได้ตรง
5. ระบุ section ใน claude.md ของผมที่ต้องย้ายเข้า shared vs ที่ต้องอยู่ per-project

ห้ามแนะนำทางเลือกที่ 3 ที่ผสม pattern — เลือก A หรือ B เท่านั้น
```

## Expected output
การวิเคราะห์ 2 pattern + คำแนะนำเฉพาะเคสคุณ + ตัวอย่าง file structure ที่ implement ได้ตรง + รายการ section ที่ต้องย้าย

## Worked Example
**Industry:** Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)
**Scenario:** Solo consultant ดูแล 4 client พร้อมกัน · ไม่อยากเขียน base ซ้ำ 4 รอบ
**Inputs:** base claude.md + ข้อมูล 4 client (sector + ชื่อ)
**Output:** เลือก Symlink pattern + structure ~/agent-base/ + 4 client folders ที่ import shared + รายการ section ที่ย้าย 6 อัน
**Time saved:** เขียนซ้ำ 4 รอบ + sync drift หลัก ชม./สัปดาห์ · ตั้ง pattern ครั้งเดียว 20 นาที

## Next step
→ ใช้ prompt P2-01 สร้าง agent ตัวแรกใน project ที่ pattern พร้อมแล้ว
