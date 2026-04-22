---
title: "P2-07 — Orchestrator pattern (router agent)"
tier: advanced
phase: 2
slug: p2-07-orchestrator-router
prereqs: [p2-01-sale-agent-owner, p2-02-content-agent, p2-03-personal-secretary]
useCase: "เมื่อทีม agent มี 4+ ตัวแล้วเริ่มงงว่า task ไหนเรียกใคร — สร้าง orchestrator ที่รับ task แล้ว route ไปยัง specialist"
timeToSetup: "25 นาที"
checkGate:
  - "คุณมี agent อย่างน้อย 4 ตัวใน ./agents/ แล้วใช่มั้ย?"
  - "คุณเคยเจอ pain ว่า 'ไม่รู้จะเรียก agent ไหน' หรือ 'เรียกผิด agent' ใช่มั้ย?"
  - "คุณ list หน้าที่ของ agent แต่ละตัวได้ใน 1 ประโยคใช่มั้ย? (ถ้าไม่ได้ revise agent file ก่อน)"
workedExample:
  industry: "Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของโรงงานมี 5 agent: sale / content / secretary / crm-bot / proposal-writer · พนักงานเริ่มเรียกผิด agent · อยากได้ single entry point"
  inputs: "./claude.md + ทุกไฟล์ใน ./agents/ + รายการ task ตัวอย่างที่เคยเรียกผิด"
  output: "./agents/orchestrator.md + routing table 12 patterns + fallback rule + escalation rule"
  timeSaved: "เรียกผิด + redo: 2-3 ครั้ง/วัน · orchestrator route ถูกครั้งแรก + ลด cognitive load"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
ทีม agent โตจนเริ่ม route ผิด และต้องการ single entry point

## Prerequisite
- มี agent อย่างน้อย 4 ตัว
- แต่ละ agent มี Role 1 บรรทัดที่ชัด (ถ้าไม่ revise ก่อน)

## The Prompt

```
ผมต้องการสร้าง Orchestrator agent ที่รับ task ทุกอย่างจากผม แล้ว route ไปยัง specialist agent ที่เหมาะสม

ขั้นตอน:

Step 1 — Inventory
อ่านทุกไฟล์ใน ./agents/ (recursively)
สรุปเป็น table: agent name | path | role 1 บรรทัด | สามารถทำอะไร (3-5 capabilities) | สิ่งที่ทำไม่ได้

Step 2 — Routing table design
จาก inventory ออกแบบ routing table 10-15 patterns ครอบคลุมงานที่เจอบ่อย
แต่ละ row: trigger phrase pattern | route to | reason
ตัวอย่าง:
- trigger "ขอ proposal สำหรับ [client]" → proposal-writer · reason: เป็น output ที่ writer ดูแล
- trigger "lead ใหม่ชื่อ [name]" → crm-bot first, then sale-team-leader · reason: ต้อง record ก่อน follow-up

Step 3 — Edge cases
ระบุ 3 กฎสำหรับ edge case:
- Ambiguous (เข้าได้หลาย agent) → orchestrator ถามผมก่อน route
- Cross-agent (ต้องใช้ 2+ agent) → orchestrator วาง plan แล้วเรียกตามลำดับ
- Out of scope (ไม่มี agent ที่ทำได้) → orchestrator แนะนำว่าควรสร้าง agent ใหม่ผ่าน P2-06

Step 4 — สร้าง file
เขียน ./agents/orchestrator.md โครงสร้าง 8 sections:
- Role & Mission
- Context inheritance (claude.md + index ของทุก agent)
- Inventory table (จาก step 1)
- Routing table (จาก step 2)
- Edge case rules (จาก step 3)
- Logging (ทุก route decision เขียนลง ./agents/_routing-log.md)
- Boundaries (orchestrator ห้ามทำงานเอง — route only)
- Smoke tests (5 sample task + expected route)

กฎเหล็ก:
- Orchestrator ห้าม execute task เอง — route only เสมอ
- ถ้า specialist agent ไม่ตอบ ให้ escalate กลับมาหาผม ห้ามแทน
- Routing log ต้อง append ทุกครั้ง — ใช้ analyze pattern ภายหลัง
```

## Expected output
Inventory table + Routing table 10-15 row + 3 edge case rules + ./agents/orchestrator.md + 5 smoke tests

## Worked Example
**Industry:** Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)
**Scenario:** มี 5 agent · พนักงานเรียกผิด · ต้องการ entry point
**Inputs:** ./agents/ ทุกไฟล์ + รายการ task ที่เคยเรียกผิด
**Output:** orchestrator.md + 12-row routing table + log file pattern
**Time saved:** เรียกผิด 2-3 ครั้ง/วัน · route ถูกครั้งแรก

## Next step
→ ใช้ prompt P2-08 (Agent-to-agent handoff) เพื่อให้ agent ส่งงานต่อกันได้โดย orchestrator ไม่ต้องคุม
