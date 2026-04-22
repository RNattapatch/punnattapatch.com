---
title: "P3-02 — @agent direct task format"
tier: starter
phase: 3
slug: p3-02-agent-direct-task
prereqs: [p2-01-sale-agent-owner]
useCase: "เรียนรู้รูปแบบ @agent <task> shortcut + 3 variant: single-agent / multi-agent CC / agent-handoff — ใช้สั่งงานเร็วโดยไม่ต้องอธิบาย context ซ้ำ"
timeToSetup: "ไม่ต้อง setup — เป็น syntax pattern ที่ใช้ได้ทันที"
checkGate:
  - "คุณมี agent อย่างน้อย 1 ตัวใน ./agents/ แล้วใช่มั้ย? (เช่น sale-team-leader.md จาก P2-01)"
  - "คุณรู้ชื่อ agent ที่จะเรียก (filename ไม่รวม .md) ใช่มั้ย?"
  - "คุณเข้าใจว่า @agent ใน prompt = บอก Claude Code ให้ใช้ context จาก agent file นั้นเป็น primary system prompt ใช่มั้ย?"
workedExample:
  industry: "Service-based SME (15 employees · 35M revenue · digital marketing agency)"
  scenario: "เจ้าของ agency มี 3 agent (sale / content / personal-secretary) · ต้องการสั่งงานทั้ง 3 รูปแบบใน 1 วันโดยไม่พิมพ์ context ซ้ำ"
  inputs: "agent files พร้อมใช้ + 3 task ตัวอย่าง (lead เข้ามาใหม่ · plan content สัปดาห์ · ส่งต่อให้ sale ตาม secretary)"
  output: "3 prompt template พร้อม fill-in-the-blank — ใช้ได้ทุกวัน"
  timeSaved: "พิมพ์ context เต็ม 200-300 คำ/ครั้ง · @agent shortcut 20-50 คำ/ครั้ง · 10+ ครั้ง/วัน"
phaseCtaHref: "/training/p1-ai-workshop-1-day#waitlist"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู P1 Public Training Waitlist"
published: 2026-04-22
---

## Use when
หลังมี agent 2+ ตัว และเริ่มเบื่อกับการพิมพ์ context ยาวทุกครั้ง

## Prerequisite
- P2-01 หรือ agent ใดๆ ใน ./agents/

## The Prompt

```
ผมต้องการเรียนรู้ pattern @agent direct task สำหรับสั่งงานเร็ว
อธิบาย 3 variant ให้ผมเห็นภาพ + ให้ template ที่ใช้ได้จริง

Variant 1 — Single agent
รูปแบบ:
  @<agent-name> <task ใน 1-2 ประโยค>

  [optional: paste data หรือ context เพิ่มข้างล่าง]

ตัวอย่าง:
  @sale-team-leader qualify lead นี้ให้หน่อย
  - ชื่อ: บริษัท ABC
  - revenue: 50M
  - pain: ลด lead time order
  - source: referral

กฎ: ห้าม agent ขอ context ซ้ำที่อยู่ใน agent file ตัวเอง — ถ้าขอ ให้ตอบกลับว่า "อ่าน ./agents/sale/sale-team-leader.md อีกรอบ"

Variant 2 — Multi-agent CC (consult parallel)
รูปแบบ:
  @<agent-1> @<agent-2> <task>

  Format ขอให้ทั้งสองตอบสั้น 3-5 บรรทัดต่อคน · highlight ตรงไหนที่เห็นต่างกัน

ตัวอย่าง:
  @sale-team-leader @content-team-leader ผมจะออก service ใหม่ราคา 30k ระยะเวลา 1 เดือน — แต่ละคนเห็นยังไง
  - sale: เห็น risk / opportunity ในแง่ pricing + funnel
  - content: เห็น angle ที่จะ market ได้

ใช้ตอน: ตัดสินใจ cross-functional ที่ต้องฟัง 2 มุมก่อน

Variant 3 — Agent handoff (sequential)
รูปแบบ:
  @<agent-1> ทำ task A → ส่งต่อให้ @<agent-2> ทำ task B → return ให้ผม

ตัวอย่าง:
  @personal-secretary ดู inbox วันนี้ → ถ้ามี lead reply ส่งต่อ @sale-team-leader ให้ qualify + ร่าง follow-up → return draft ให้ผม approve

กฎ handoff:
- agent-1 ต้องประกาศชัดว่า "ส่งต่อให้ <agent-2>" ก่อน switch context
- agent-2 ห้าม assume — ต้อง summarize สิ่งที่รับมาก่อนเริ่มงาน
- output สุดท้ายให้ผม decide เสมอ — ห้าม auto-execute (ส่ง email / นัดประชุม) โดยไม่ confirm

หลังอธิบาย 3 variant ทำ 1 อย่างเพิ่ม:
- list 3 task ที่ใช้ทั้ง 3 variant ได้ในธุรกิจของผม (อ่าน ./claude.md ก่อน) — เพื่อให้ผมลองใช้ทันที
```

## Expected output
อธิบาย 3 variant ชัด + template fill-in-the-blank + 3 task ตัวอย่างที่ตรงกับธุรกิจ (จาก claude.md)

## Worked Example
**Industry:** Service-based SME (15 employees · 35M revenue · digital marketing agency)
**Scenario:** มี 3 agent · เบื่อพิมพ์ context · ต้องการ shortcut
**Inputs:** sale + content + secretary agent files + claude.md
**Output:** 3 variant template + 3 task ตัวอย่าง (lead intake / weekly plan / handoff)
**Time saved:** context ยาว 200-300 คำ/ครั้ง · shortcut 20-50 คำ/ครั้ง · 10+ ครั้ง/วัน

## Next step
→ ใช้ prompt P3-03 (Weekly content plan via team meeting) สำหรับงาน multi-agent ที่ซับซ้อนขึ้น
