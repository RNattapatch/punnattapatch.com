---
title: "P1-02 — Create claude.md via interview"
tier: starter
phase: 1
slug: p1-02-claude-md-interview
prereqs: [p1-01-install-claude-code]
useCase: "Trigger skill-business-context 5-phase interview เพื่อสร้าง claude.md ที่เป็น single source of truth ของธุรกิจคุณ"
timeToSetup: "25 นาที"
checkGate:
  - "คุณรัน prompt P1-01 และ The Architect ประกาศ USER_TYPE แล้วใช่มั้ย?"
  - "คุณมีข้อมูลธุรกิจพร้อมตอบ: ชื่อ + จำนวนคน + รายได้ต่อเดือน + กลุ่มลูกค้าหลัก ใช่มั้ย?"
  - "คุณมีเวลาต่อเนื่อง 25 นาทีโดยไม่ขัดจังหวะใช่มั้ย? (interview ต้องตอบทีละข้อ)"
workedExample:
  industry: "Service-based SME (15 employees · ฿35M revenue · บริษัท digital marketing agency)"
  scenario: "เจ้าของ agency ขนาด 15 คน · ผ่าน P1-01 แล้ว · ยังไม่มี claude.md · พร้อมตอบสัมภาษณ์ 25 นาที"
  inputs: "USER_TYPE=OWNER ที่ประกาศไว้แล้ว + คำตอบจากปากผู้ใช้ใน 5 phase ของ skill-business-context"
  output: "ไฟล์ claude.md ใหม่ที่ project root · มี 8 sections (Identity / Business / Audience / Expertise / Goals / Voice / Constraints / File Routing)"
  timeSaved: "เขียนเองตามใจ: 3-4 ชม. + revise อีก 2-3 รอบ · ใช้ skill นี้ 25 นาทีจบ + ได้โครงที่ใช้ได้กับทุก agent"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
หลัง P1-01 เสร็จ และ The Architect รอคำสั่งให้ trigger skill ถัดไป

## Prerequisite
- P1-01 (Install Claude Code + first greeting) — ต้องมี USER_TYPE ประกาศแล้ว

## The Prompt

```
@the-architect เริ่มสร้าง claude.md ได้เลย

กรุณา invoke skill-business-context และเดิน 5-phase interview ให้ผม:
- Phase 1: Identity (ชื่อธุรกิจ / brand / handle / location)
- Phase 2: Business model (ขายอะไร · ให้ใคร · ราคาเท่าไหร่ · revenue ปัจจุบัน)
- Phase 3: Audience (target customer · pain · buying trigger)
- Phase 4: Expertise & Voice (ผมถนัดอะไร · พูดยังไง · ห้ามพูดอะไร)
- Phase 5: Goals & Constraints (เป้า 12 เดือน · งบ · ข้อจำกัด)

กฎการสัมภาษณ์:
1. ถามทีละ 1 คำถาม รอให้ผมตอบก่อนถามต่อ
2. ถ้าผมตอบสั้นเกินไป ขอตัวอย่างเพิ่ม
3. ถ้าผมตอบขัดกับคำตอบก่อนหน้า ชี้ให้ผมเห็นแล้วถามว่าจะเอาอันไหน
4. ห้ามเดาแทนผม — ถ้าไม่รู้ให้ถาม

เมื่อสัมภาษณ์ครบ 5 phase แล้ว:
- เขียน claude.md ที่ project root (path: ./claude.md)
- ใช้ structure ตาม template ใน skill-business-context.md
- จบด้วยการ summary 8 sections ให้ผมดูแล้วถามว่าผมยืนยันมั้ย
- ถ้าผมยืนยัน save ไฟล์ — ถ้ายังไม่ ให้ผมแก้ section ไหนก่อน

อย่ารีบ — คุณภาพของ claude.md กำหนดคุณภาพของ agent ทั้งทีมที่จะสร้างต่อไป
```

## Expected output
The Architect เริ่ม Phase 1 → ถามทีละข้อ → รวบ 5 phase → เขียน claude.md → summary ให้ยืนยัน → save ไฟล์ที่ ./claude.md

## Worked Example
**Industry:** Service-based SME (15 employees · ฿35M revenue · บริษัท digital marketing agency)
**Scenario:** เจ้าของ agency ผ่าน P1-01 มาแล้ว · นั่งโต๊ะ 25 นาที พร้อมตอบ
**Inputs:** USER_TYPE=OWNER + คำตอบจากผู้ใช้ใน 5 phase
**Output:** ./claude.md (~250 บรรทัด · 8 sections) ที่ผ่านการยืนยัน
**Time saved:** เขียนเอง 3-4 ชม. + revise · ใช้ skill 25 นาทีจบ

## Next step
→ ใช้ prompt P1-03 (Audit claude.md for gaps) ถ้าต้องการ stress-test ก่อนสร้าง agent · หรือไป Phase 2 (P2-01) เลยถ้ามั่นใจ
