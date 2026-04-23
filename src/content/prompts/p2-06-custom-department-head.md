---
title: "P2-06 — Design custom department head agent"
tier: intermediate
phase: 2
slug: p2-06-custom-department-head
prereqs: [p2-01-sale-agent-owner]
useCase: "Meta-prompt: ออกแบบ agent หมวดใหม่ที่ template ไม่มี (เช่น HR / Procurement / Compliance / Logistics) ผ่าน guided Q&A"
timeToSetup: "20 นาที"
checkGate:
  - "คุณรู้ชื่อหมวดที่อยากสร้าง agent ใหม่ใช่มั้ย? (เช่น HR head / Procurement / R&D)"
  - "คุณมี ./claude.md ที่ระบุว่า business มีหมวดนี้จริงใช่มั้ย? (ถ้าไม่มี เพิ่มก่อน)"
  - "คุณมีตัวอย่าง task ที่ agent ตัวนี้ต้องทำอย่างน้อย 5 อันใช่มั้ย?"
workedExample:
  industry: "Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)"
  scenario: "Solo consultant อยากได้ agent หมวด 'Learning & Knowledge' ที่จัดการ note + book summary + idea backlog · template ไม่มีหมวดนี้"
  inputs: "./claude.md + ชื่อหมวด + 5 sample task + decision: standalone หรือ child ของ existing agent"
  output: "./agents/learning/knowledge-curator.md (~150 บรรทัด) + บันทึก rationale ว่าทำไม design แบบนี้"
  timeSaved: "ออกแบบเองโดยไม่มี framework: หลัก ชม. + agent ตอบไม่ตรง · meta-prompt 20 นาทีได้ structure ที่ทดสอบแล้ว"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
ต้องการ agent หมวดที่ skill-build-agent-team.md ไม่มี template ให้

## Prerequisite
- P2-01 (เข้าใจ structure agent file พื้นฐาน)
- claude.md ที่ระบุว่า business มีหมวดนี้

## The Prompt

```
ผมอยากออกแบบ agent หมวดใหม่ที่ template ไม่มีให้ — กรุณาใช้ meta-prompt mode พาผมออกแบบ

หมวดที่ผมอยากสร้าง: [ชื่อหมวด]
ตัวอย่าง: HR head / Procurement / Compliance / R&D / Logistics / Customer Success / [อื่นๆ]

ขั้นตอนที่ผมอยากให้คุณทำ:

Phase 1 — Discovery (ถามทีละข้อ)
1. หมวดนี้แก้ปัญหาอะไรในธุรกิจผม?
2. ใครเป็น user หลักของ agent ตัวนี้? (ผมคนเดียว / ทีม / ลูกค้า)
3. ขอ 5 task จริงที่ agent ต้องทำได้ (concrete ไม่ใช่ abstract)
4. agent ตัวนี้ standalone หรือเป็น child ของ existing agent (เช่น sale / content / operations)?
5. ต้อง integrate tool ภายนอกมั้ย? (Sheet / DB / API / file folder)

Phase 2 — Design proposal
หลังถามครบ 5 ข้อ เสนอ design ให้ผม 1 หน้า:
- ชื่อ agent (kebab-case)
- Path ที่จะ save (./agents/<dept>/<name>.md)
- Sections ที่จะมี (อย่างน้อย Role / Context / Capabilities / Boundaries)
- Hand-off graph (รับงานจากใคร / ส่งงานให้ใคร)
- Tool dependencies + วิธี integrate

ถามผมว่า design นี้โอเคมั้ย — ถ้าไม่ ปรับตามที่บอก

Phase 3 — Build
หลังผม approve เขียนไฟล์จริง โครงสร้าง consistent กับ agent อื่นใน ./agents/

Phase 4 — Rationale log
เขียนเหตุผลการ design ลง ./agents/<dept>/_rationale.md (1 หน้า)
- ทำไมเลือก standalone vs child
- ทำไม capabilities แบ่งแบบนี้
- Trade-off ที่ตัดสินใจ

กฎ:
- ห้ามข้าม Phase 1 — discovery สำคัญที่สุด
- ห้าม design agent ที่ overlap หน้าที่เกิน 30% กับ agent ที่มีอยู่แล้ว — ถ้าใกล้กันชี้ให้ผมตัดสิน
- Boundaries section บังคับมี อย่างน้อย 3 ข้อ
```

## Expected output
4-phase walk-through จบที่ agent file ใหม่ + rationale log บันทึก decision

## Worked Example
**Industry:** Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)
**Scenario:** อยากได้ Learning & Knowledge agent · template ไม่มี
**Inputs:** ./claude.md + ชื่อหมวด "knowledge-curator" + 5 task + standalone choice
**Output:** ./agents/learning/knowledge-curator.md + _rationale.md
**Time saved:** ออกแบบเอง หลัก ชม. + ตอบไม่ตรง · meta-prompt 20 นาที + structure ทดสอบแล้ว

## Next step
→ ใช้ prompt P2-07 (Orchestrator router) ถ้าทีม agent มี 4+ ตัวแล้วเริ่มซับซ้อน
