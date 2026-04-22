---
title: "P3-03 — Weekly content plan via team meeting"
tier: intermediate
phase: 3
slug: p3-03-weekly-content-plan-meeting
prereqs: [p2-02-content-agent]
useCase: "ทุกวันอาทิตย์: รัน meeting ระหว่าง content agent ทั้งหมด (leader + reel writer + carousel + post writer + analyst) → ออก weekly plan 3 platform x 7 วัน"
timeToSetup: "15 นาที setup ครั้งแรก · 20-30 นาที meeting ทุกอาทิตย์"
checkGate:
  - "คุณมี agent ใน ./agents/content/ อย่างน้อย 3 ตัว (leader + 1 platform writer + analyst) ใช่มั้ย?"
  - "คุณมี ./output/content/ folder ไว้เก็บ plan ใช่มั้ย?"
  - "คุณรู้ business goal สัปดาห์นี้ (1 ประโยค) ใช่มั้ย? เช่น 'launch service ใหม่' หรือ 'warm leads ที่เก็บมา 2 เดือน'"
workedExample:
  industry: "Solo founder (1 person · 8M revenue · freelance B2B sales consultant)"
  scenario: "Solo consultant ทำ content เอง 3 platform · เคยทำแบบ ad-hoc แล้วซ้ำ topic / ลืม cross-promote · ต้องการ plan ที่ coherent"
  inputs: "content agent files + business goal สัปดาห์นี้ + paste 3 post ที่ engagement ดีล่าสุด + 1 weak topic ที่อยากเลิก"
  output: "./output/content/weekly-plan-<date>.md — 21 ช่อง (3 platform x 7 วัน) · แต่ละช่องมี: angle / hook / CTA / asset type / agent ที่จะเขียน · พร้อม 1 cross-promote thread"
  timeSaved: "วาง plan เอง 2-3 ชม./สัปดาห์ + คุณภาพไม่สม่ำเสมอ · meeting 25 นาที + agent ทำ draft ตามแผนได้เลย"
phaseCtaHref: "/training/p1-ai-workshop-1-day#waitlist"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู P1 Public Training Waitlist"
published: 2026-04-22
---

## Use when
ทุกวันอาทิตย์ก่อนเริ่มสัปดาห์ใหม่ · มี content agent หลายตัวและต้องการ plan ที่ coordinated

## Prerequisite
- P2-02 (content team agent setup เรียบร้อย)
- ./output/content/ folder

## The Prompt

```
ผมจะรัน weekly content meeting — ขอให้ content agent ทุกตัว join

@content-team-leader ทำหน้าที่ chair meeting
@reel-script-writer @carousel-builder @facebook-post-writer @content-analyst ทุกคน join

Business goal สัปดาห์นี้: [paste 1 ประโยค]
Top performer 3 post ล่าสุด: [paste]
Weak topic ที่อยากเลิก: [paste 1 topic]

Agenda meeting (chair บังคับ flow ตามนี้):

Round 1 — Analyst report (3 บรรทัด)
@content-analyst สรุปอะไรที่ engagement ดีและทำไม · ห้ามเกิน 3 บรรทัด

Round 2 — Theme proposal (chair-led)
@content-team-leader เสนอ weekly theme 1 อัน + sub-angle 3 อันที่ derive จาก theme
ห้ามเสนอ theme ที่ซ้ำกับ 4 สัปดาห์ก่อน (ถ้าไม่มี log ให้ระบุ)

Round 3 — Platform allocation (each writer claims slots)
@reel-script-writer claim 7 slot สำหรับ TikTok/IG Reel
@carousel-builder claim 4 slot สำหรับ IG Carousel + 3 slot Facebook image post
@facebook-post-writer claim 7 slot สำหรับ Facebook text post
แต่ละ slot ต้องระบุ: วัน · angle · hook (1 บรรทัด) · CTA · asset type

Round 4 — Cross-promote check
@content-team-leader ระบุ 1 thread ที่จะ cross-promote across 3 platform (เช่น Reel teaser → Carousel deep → FB post drive DM)

Round 5 — Conflict resolve
ถ้า 2 agent claim angle ซ้ำ chair ตัดสิน · ถ้า slot ไหนไม่มีคน claim chair assign

Output สุดท้าย:
สร้างไฟล์ ./output/content/weekly-plan-<date>.md โครง:
- Goal & theme
- Top performer + lesson learned
- 21-slot table (วัน × platform)
- Cross-promote thread
- Risk / assumption (ที่ chair flag)

กฎ:
- ห้าม writer เขียน full draft ใน meeting นี้ — meeting คือ plan เท่านั้น · draft ทำในวันนั้นๆ
- ห้าม slot ที่ไม่มี hook ชัด — chair reject แล้วให้ writer คิดใหม่
- meeting จบใน 5 round · ห้ามเกิน
```

## Expected output
./output/content/weekly-plan-<date>.md ที่มี 21 slot ครบ + theme + cross-promote thread + risk · พร้อมให้ writer แต่ละคน draft ตามแผน

## Worked Example
**Industry:** Solo founder (1 person · 8M revenue · freelance B2B sales consultant)
**Scenario:** ทำ content เอง 3 platform · ad-hoc · ลืม cross-promote
**Inputs:** content agent files + goal + 3 top post + 1 weak topic
**Output:** weekly-plan-2026-04-22.md · 21 slot · 1 cross-promote thread · 2 risk flagged
**Time saved:** plan เอง 2-3 ชม./สัปดาห์ · meeting 25 นาที

## Next step
→ ใช้ prompt P3-04 (Lead qualification pipeline) สำหรับ workflow sale ที่ parallel กับ content
