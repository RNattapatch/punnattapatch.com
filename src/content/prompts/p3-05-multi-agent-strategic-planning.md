---
title: "P3-05 — Multi-agent strategic planning session"
tier: advanced
phase: 3
slug: p3-05-multi-agent-strategic-planning
prereqs: [p2-07-orchestrator-router]
useCase: "ทุกต้นเดือน: dept head ทุกตัว generate 30-day strategy ร่วมกัน · cross-functional input · ออกเอกสาร 1 ฉบับ"
timeToSetup: "30 นาที setup ครั้งแรก · 60-90 นาที session/เดือน"
checkGate:
  - "คุณมี orchestrator agent จาก P2-07 + dept head อย่างน้อย 3 ตัว (sale / content / operations) ใช่มั้ย?"
  - "คุณมี ./output/strategy/ folder + เดือนก่อนหน้าจริง (ผล จริง vs target) พร้อม paste ใช่มั้ย?"
  - "คุณรู้ business goal Q ปัจจุบัน + 1 strategic question ที่อยากให้ทีมตอบ ใช่มั้ย?"
workedExample:
  industry: "Service-based SME (15 employees · 35M revenue · digital marketing agency)"
  scenario: "เจ้าของ agency ทำ planning meeting รายเดือนกับ dept head 3 คน · ใช้เวลา 4 ชม. + เอกสาร 5 ฉบับกระจาย · อยาก compress + structured"
  inputs: "orchestrator + 3 dept head agent + Q goal + 1 strategic question (เช่น 'จะ retain client เพิ่ม 20% ทำยังไง') + เดือนก่อน actual vs target"
  output: "./output/strategy/2026-04-strategy.md — 1 ฉบับ · 6 section: Q recap / cross-functional analysis (ทุก head ตอบ) / 3 strategic option / 1 recommended option + reason / 30-day execution plan / risk + mitigation"
  timeSaved: "meeting จริง 4 ชม. + เขียน notes + กระจาย action 2 ชม. = 6 ชม./เดือน · session AI 90 นาที + เอกสารพร้อม"
phaseCtaHref: "/training/p1-ai-workshop-1-day#waitlist"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู P1 Public Training Waitlist"
published: 2026-04-22
---

## Use when
ทุกต้นเดือนหรือเมื่อต้องตัดสินใจ strategic ที่ต้องฟัง 3+ มุม

## Prerequisite
- P2-07 (orchestrator-router agent)
- Dept head agent อย่างน้อย 3 ตัว
- ./output/strategy/ folder + actual vs target เดือนก่อน

## The Prompt

```
@orchestrator-router รัน strategic planning session สำหรับเดือนใหม่

Context:
- Business goal Q ปัจจุบัน: [paste 1-2 ประโยค]
- Strategic question ที่ต้องตอบ: [paste 1 question]
- เดือนก่อน actual vs target: [paste table หรือ bullet]

Orchestrator task — รัน session 6 round ตามลำดับ · บังคับ flow ห้ามข้าม:

Round 1 — Recap (orchestrator-led, 5 บรรทัด)
สรุปเดือนก่อน · highlight 1 win + 1 miss + 1 surprise
ห้ามเกิน 5 บรรทัด

Round 2 — Cross-functional analysis
เรียก dept head ทุกตัว ทีละคน (sale → content → operations) ตอบ strategic question จากมุมตัวเอง
แต่ละคนต้อง:
- อ่าน claude.md + agent file ของตัวเอง
- ตอบ 4 บรรทัด: 1 observation จากเดือนก่อน · 1 opportunity · 1 risk · 1 ask จาก dept อื่น

Round 3 — Conflict + synergy mapping
@orchestrator-router สรุป:
- Conflict ที่เห็นระหว่าง dept (เช่น sale ขอ content แบบ A · content คิดว่าควรทำ B)
- Synergy ที่เห็น (โอกาส cross-functional)
ห้ามเกิน 6 bullet

Round 4 — 3 strategic option
จาก analysis · เสนอ 3 option ที่ตอบ strategic question
แต่ละ option ต้องมี:
- ชื่อ option
- ใช้ resource จาก dept ไหน (ระบุ %)
- expected outcome (วัดได้)
- assumption ที่ต้องเป็นจริง

Round 5 — Recommend 1 option
@orchestrator-router เลือก 1 option + เหตุผล 3 ข้อ · ระบุว่า dept ไหน disagree (ถ้ามี)
ผมต้อง confirm ก่อน round 6 — รอผมพิมพ์ "ไป" หรือ "เปลี่ยน option"

Round 6 — 30-day execution plan
หลังผม confirm · break option เป็น weekly milestone (week 1-4)
แต่ละ week ระบุ: dept owner / deliverable / decision gate / risk ที่ต้อง watch

Output สุดท้าย:
สร้าง ./output/strategy/<YYYY-MM>-strategy.md โครงตาม 6 round

กฎ:
- ห้าม dept head ตอบ round 2 โดยไม่อ่าน agent file ตัวเอง
- ห้ามเลือก option ที่ใช้ resource เดียวกัน 100% (ขัด multi-functional ของ session)
- หลัง execution plan ออก orchestrator ต้อง flag 1 metric ที่จะ track ทุกสัปดาห์ (ไม่ใช่รายเดือน)
```

## Expected output
./output/strategy/<YYYY-MM>-strategy.md ที่มี 6 section ครบ + 1 weekly metric ที่ track ได้

## Worked Example
**Industry:** Service-based SME (15 employees · 35M revenue · digital marketing agency)
**Scenario:** Planning meeting 4 ชม./เดือน · เอกสารกระจาย · ต้องการ compress
**Inputs:** orchestrator + 3 dept head + Q goal + strategic question + เดือนก่อน actual
**Output:** 2026-04-strategy.md · 6 section · 1 weekly KPI · weekly milestone 4 week
**Time saved:** meeting + notes + action distribution 6 ชม. · session AI 90 นาที

## Next step
→ ใช้ prompt P4-01 (Monthly agent audit) เพื่อ tune agent ที่ใช้ใน session นี้
