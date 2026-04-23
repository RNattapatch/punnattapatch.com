---
title: "P2-08 — Agent-to-agent handoff workflow"
tier: advanced
phase: 2
slug: p2-08-agent-handoff
prereqs: [p2-07-orchestrator-router]
useCase: "ให้ agent ส่งงานต่อกันโดยตรง พร้อม context bundle ที่ structured — ไม่ต้องผ่าน orchestrator ทุกครั้ง"
timeToSetup: "20 นาที"
checkGate:
  - "คุณมี orchestrator.md จาก P2-07 แล้วใช่มั้ย?"
  - "คุณมี agent อย่างน้อย 2 ตัวที่ต้องส่งงานต่อกันบ่อย (เช่น content → sale, crm → proposal) ใช่มั้ย?"
  - "คุณยอมรับว่า direct handoff bypass orchestrator (จะต้อง trade-off กับ logging) ใช่มั้ย?"
workedExample:
  industry: "Service-based SME (15 employees · ฿35M revenue · บริษัท digital marketing agency)"
  scenario: "ทีม agent ของ agency: content-team-leader draft post → ต้องส่งให้ sale-team-leader ดูว่าตรงกับ pitch ลูกค้ามั้ย · ผ่าน orchestrator ทุกรอบช้า"
  inputs: "./agents/orchestrator.md + 2 agent ที่ handoff บ่อย + sample task ที่ต้องส่งต่อ"
  output: "Handoff protocol .md + update 2 agent files + format ของ context bundle (JSON-like header) + handoff log"
  timeSaved: "ผ่าน orchestrator ทุกรอบ: +1 hop/round · direct handoff ลด round-trip 50% · งาน complex 5-step ลดเวลา 30%"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี orchestrator แล้ว และเจอว่าบาง pair handoff บ่อยจน orchestrator hop เปล่า

## Prerequisite
- P2-07 (orchestrator พร้อม + routing log ทำงานอยู่)

## The Prompt

````
ผมต้องการเพิ่ม direct agent-to-agent handoff pattern โดยไม่ทำลาย orchestrator structure

ขั้นตอน:

Step 1 — Identify handoff pairs
อ่าน ./agents/_routing-log.md (จาก orchestrator)
หา pair ที่ orchestrator route A→B บ่อยกว่า 5 ครั้ง/สัปดาห์
เสนอ pair ที่ควรเปิด direct handoff (สูงสุด 3 pair) + เหตุผล
ถามผมว่า approve pair ไหน

Step 2 — Design context bundle format
ออกแบบ structured context bundle ที่ agent A ส่งให้ B:

```json
{
  "from": "content-team-leader",
  "to": "sale-team-leader",
  "task": "review FB post draft for client X",
  "context": {
    "client": "ชื่อ + industry + stage",
    "draft_path": "./output/content/draft-2026-04-22.md",
    "review_focus": ["ตรง pitch มั้ย", "tone match มั้ย"],
    "deadline": "today EOD"
  },
  "expected_output": "approve | revise (with specific change list) | reject (with reason)",
  "handoff_id": "<uuid หรือ timestamp>"
}
```

Step 3 — Update agent files
ใน agent A เพิ่ม section "Direct handoff to B":
- เมื่อไหร่ใช้ (trigger condition)
- วิธีสร้าง context bundle
- รอ response กี่นาทีก่อน escalate กลับ orchestrator

ใน agent B เพิ่ม section "Receive handoff from A":
- รับ bundle structure ไหน
- response format
- เมื่อไหร่ส่งกลับ A · เมื่อไหร่ escalate orchestrator

Step 4 — Logging
ทุก handoff ต้อง append ./agents/_handoff-log.md:
- timestamp / from / to / task / handoff_id / outcome (success/escalated/timeout)

Step 5 — Update orchestrator.md
เพิ่ม section "Direct handoff exceptions"
ระบุ pair ที่ bypass orchestrator + กฎว่าเมื่อไหร่ orchestrator ยังต้องเข้ามาแทรก (เช่น ถ้า handoff fail 2 ครั้งติด)

Step 6 — Smoke test
สมมติ task 1 อัน + เดิน handoff 1 รอบเต็ม + แสดง log ที่ append

กฎ:
- เปิด direct handoff สูงสุด 3 pair — เกินนี้ระบบ debug ยาก
- ทุก handoff ต้อง logged — ห้ามเปิด silent handoff
- ถ้า handoff timeout > 5 นาที → auto-escalate orchestrator
````

## Expected output
List 3 pair ที่ approve + context bundle format + 2 agent file updates + orchestrator update + handoff log file + smoke test ที่เดินครบ

## Worked Example
**Industry:** Service-based SME (15 employees · ฿35M revenue · digital marketing agency)
**Scenario:** content-team-leader → sale-team-leader handoff บ่อย · ผ่าน orchestrator ช้า
**Inputs:** _routing-log.md + 2 agent files + sample task
**Output:** 1 pair approved + bundle format + 2 file updates + smoke test เดินครบ
**Time saved:** ลด round-trip 50% · งาน complex 5-step ลดเวลา 30%

## Next step
→ Phase 2 จบแล้ว · ใช้ pattern นี้ใน workshop → ดู In-House Workshop
