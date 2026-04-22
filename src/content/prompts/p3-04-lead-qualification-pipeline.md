---
title: "P3-04 — Lead qualification pipeline prompt"
tier: intermediate
phase: 3
slug: p3-04-lead-qualification-pipeline
prereqs: [p2-01-sale-agent-owner, p2-04-crm-bot-sheets]
useCase: "ป้อน raw lead input (referral / web form / DM / nametag) → Sale Agent qualify ด้วย ICP จาก claude.md → output qualified/not + reason + next-step recommendation"
timeToSetup: "10 นาที setup template ครั้งแรก · 60-90 วินาที/lead หลังจากนั้น"
checkGate:
  - "claude.md ของคุณมี ICP section ที่ระบุ revenue range / industry / team size / pain pattern แล้วใช่มั้ย? (ถ้าไม่มี ต้องเพิ่มก่อน — sale agent ต้องอ่านได้)"
  - "คุณมี ./agents/sales/sale-team-leader.md จาก P2-01 แล้วใช่มั้ย?"
  - "คุณรู้ next-step ที่ใช้บ่อย (เช่น discovery call / send case study / referral nurture / decline politely) — list ไว้ใน claude.md หรือยัง?"
workedExample:
  industry: "Manufacturing SME (40 employees · 80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของได้ lead จาก 5 ช่องทาง/สัปดาห์ · เคย qualify เอง 15 นาที/lead · บางครั้งคุยลูกค้าที่ไม่ fit ICP เลยเสียเวลา 2 ชม./คน"
  inputs: "raw lead text (paste 1 lead จากการ chat ใน LINE) + claude.md ICP section + sale-team-leader.md"
  output: "Verdict (qualified / not / borderline) + 3 reason ที่ map กับ ICP criteria + next-step recommendation 1 อัน + draft message 3-4 บรรทัดสำหรับ next-step"
  timeSaved: "qualify เอง 15 นาที/lead · agent 60 วินาที + draft message พร้อมส่ง"
phaseCtaHref: "/training/p1-ai-workshop-1-day#waitlist"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู P1 Public Training Waitlist"
published: 2026-04-22
---

## Use when
ทุกครั้งที่มี lead เข้ามา · ก่อนตัดสินใจว่าจะนัดคุย / ส่ง case study / decline

## Prerequisite
- P2-01 (sale-team-leader.md)
- P2-04 (CRM bot — สำหรับบันทึกผล qualification ลง sheet)
- claude.md ที่มี ICP + next-step list ครบ

## The Prompt

```
@sale-team-leader qualify lead นี้ตาม ICP ของผม

Step 1 — อ่าน context
อ่าน 2 ไฟล์ก่อนเริ่ม:
- ./claude.md section "ICP" + "Next-step playbook"
- ./agents/sales/sale-team-leader.md section "Qualification rules"
ห้าม assume — ถ้า ICP ไม่ชัดในจุดใด ถามผมก่อน 1 รอบ

Step 2 — Parse raw lead
Raw lead:
[paste lead text — เช่น chat log / web form / nametag note]

Extract 6 field (ถ้าหาไม่เจอใน raw ให้เขียน "unknown" — ห้ามเดา):
- ชื่อ + ตำแหน่ง
- บริษัท + industry
- revenue (ถ้ามี) หรือ team size
- pain ที่ระบุ
- timeline / urgency signal
- source / referrer

Step 3 — ICP match scoring
Map กับ ICP criteria แต่ละข้อ — score 3 ระดับ:
- Match (ตรงทุกอย่าง)
- Partial (ตรงบางส่วน · ระบุข้อที่ตรง/ไม่ตรง)
- Mismatch (ไม่ตรง · ระบุเหตุผล)
ห้ามใช้ตัวเลข % — ใช้คำ 3 ระดับนี้เท่านั้น

Step 4 — Verdict
ออก verdict 1 ใน 3:
- ✅ Qualified — match ICP เต็ม · ควรนัดคุย
- ⚠️ Borderline — partial · ต้อง discovery สั้นก่อนตัดสิน
- ❌ Not qualified — mismatch · decline politely

ระบุ 3 reason ที่ support verdict — แต่ละ reason ต้อง quote ICP criterion จริง

Step 5 — Next-step recommendation
เลือก 1 next-step จาก list ใน claude.md "Next-step playbook"
ถ้า playbook ไม่มี option ที่เหมาะ ให้ flag "ต้องเพิ่ม next-step ใน claude.md: <ชื่อ>"

Step 6 — Draft message
ร่าง message 3-4 บรรทัด สำหรับ next-step ที่เลือก · tone ตาม claude.md Voice section · ไม่ commit เวลา (ปล่อยให้ผม fill)

กฎสุดท้าย:
- ห้าม flag qualified ถ้า revenue/team size ยัง "unknown" — ต้อง flag borderline แล้ว recommend discovery
- ห้าม draft message ที่ promise outcome หรือ refund (ดู Forbidden Patterns ใน claude.md)
- หลังเสร็จ ถามผม: "บันทึก lead นี้ลง CRM sheet มั้ย?" (ถ้าตอบ yes → handoff ให้ @crm-bot)
```

## Expected output
6-field extract + ICP match table + verdict + 3 reason + 1 next-step + draft message · พร้อม handoff CRM

## Worked Example
**Industry:** Manufacturing SME (40 employees · 80M revenue · อะไหล่รถบรรทุก)
**Scenario:** Lead 5/สัปดาห์ · เสียเวลากับลูกค้า not-fit
**Inputs:** raw chat lead + claude.md ICP + sale agent
**Output:** verdict "Borderline" + 3 reason quote ICP + next-step "discovery 20-min" + draft 3-line message
**Time saved:** qualify เอง 15 นาที/lead · agent 60 วินาที

## Next step
→ ใช้ prompt P3-05 (Multi-agent strategic planning) สำหรับ session รายเดือนที่ scale ขึ้น
