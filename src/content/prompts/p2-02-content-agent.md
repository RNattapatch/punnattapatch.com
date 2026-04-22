---
title: "P2-02 — Spawn Content Agent"
tier: starter
phase: 2
slug: p2-02-content-agent
prereqs: [p2-01-sale-agent-owner]
useCase: "สร้าง Content Team Leader agent ที่เขียน FB post / reel script / carousel ตาม Voice ของคุณ"
timeToSetup: "8 นาที"
checkGate:
  - "คุณมี ./claude.md ที่ระบุ Voice + Audience ชัดเจนใช่มั้ย?"
  - "คุณมี ./agents/sales/sale-team-leader.md จาก P2-01 แล้วใช่มั้ย? (เป็น sibling reference)"
  - "คุณรู้ platform ที่จะโพสต์: FB / IG / TikTok / LinkedIn ใช่มั้ย? (อย่างน้อย 1)"
workedExample:
  industry: "Service-based SME (15 employees · ฿35M revenue · บริษัท digital marketing agency)"
  scenario: "เจ้าของ agency ต้องโพสต์ content เองทุกสัปดาห์ · ไม่อยากจ้าง content writer · ต้องการ agent ช่วย draft ที่ tone ตรงตน"
  inputs: "./claude.md + skill-build-agent-team.md + รายการ platform ที่ใช้ (เช่น FB + IG + LinkedIn)"
  output: "./agents/content/content-team-leader.md (~140 บรรทัด) ที่ถาม brief 5 ข้อก่อน draft + เขียนตาม Voice"
  timeSaved: "เขียน content เอง: 1-2 ชม.ต่อชิ้น · agent draft 10 นาที + edit อีก 5 นาที"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี Sale Agent แล้ว และต้องการเพิ่ม agent ที่จัดการเนื้อหาบน social

## Prerequisite
- P2-01 (มี ./agents/sales/sale-team-leader.md เป็น reference structure)

## The Prompt

```
ผมต้องการสร้าง Content Team Leader agent

ขั้นตอน:
1. อ่าน ./claude.md — focus ที่ Voice + Audience + Constraints (เช่น คำต้องห้าม / ห้าม mention คู่แข่ง)
2. อ่าน ./agents/sales/sale-team-leader.md — ใช้เป็น reference สำหรับ structure ที่ consistent
3. อ่าน skill-build-agent-team.md — ดู template "Content Team Leader"
4. สร้างไฟล์ที่ ./agents/content/content-team-leader.md

โครงสร้าง 7 sections:
- Role & Mission
- Context inheritance (อ้าง ./claude.md ตรงๆ)
- Platform scope (ระบุ FB / IG / TikTok / LinkedIn ที่ผมใช้จริง — ถามผมก่อนถ้าไม่แน่ใจ)
- Content types (post / reel script / carousel / long-form — ระบุที่ผมโพสต์จริง)
- Brief intake (5 คำถามที่ agent ต้องถามผมทุกครั้งก่อน draft: topic / goal / audience-mood / CTA / length)
- Voice rules (อ้าง Voice section ของ claude.md + เพิ่มกฎ "ห้าม emoji เกิน 2/post" ถ้า claude.md ไม่ได้ระบุ)
- Hand-off rules (เมื่อไหร่ส่งให้ sale-team-leader ทำ proposal ต่อ / เมื่อไหร่ส่ง orchestrator routing)

กฎสำคัญ:
- platform scope ต้องตรงกับที่ผมใช้จริง — ถ้า claude.md ไม่บอก ถามผมก่อนเขียน
- Brief intake 5 ข้อ ห้ามรวบเป็นข้อเดียว — ถามทีละข้อตอน agent run จริง
- ห้าม hard-code ตัวอย่าง post — ใช้ link "ดูตัวอย่างใน claude.md หรือไฟล์ใน ./content-samples/" แทน

หลังเสร็จ summary 4 บรรทัด + smoke test: "@content-team-leader ขอ draft FB post เรื่อง [topic ที่ผมจะบอก]"
```

## Expected output
./agents/content/content-team-leader.md ใหม่ + summary 4 บรรทัด + smoke test command

## Worked Example
**Industry:** Service-based SME (15 employees · ฿35M revenue · digital marketing agency)
**Scenario:** เจ้าของ agency โพสต์เองทุกสัปดาห์ · อยากได้ agent ช่วย draft
**Inputs:** ./claude.md + ./agents/sales/sale-team-leader.md + platform list (FB + IG + LinkedIn)
**Output:** ./agents/content/content-team-leader.md ~140 บรรทัด + Brief intake 5 ข้อ
**Time saved:** เขียนเอง 1-2 ชม./ชิ้น · agent draft 10 นาที + edit 5 นาที

## Next step
→ ใช้ prompt P2-03 (Spawn Personal Secretary) เพิ่มผู้ช่วยส่วนตัว
