---
title: "P3-01 — Daily briefing from Personal Secretary"
tier: starter
phase: 3
slug: p3-01-daily-briefing
prereqs: [p1-02-claude-md-interview, p2-03-personal-secretary]
useCase: "รัน prompt นี้ทุกเช้า — Personal Secretary อ่าน log เมื่อวาน + calendar วันนี้ + งาน priority สูง แล้วสรุปเป็น 5-bullet briefing"
timeToSetup: "5 นาที setup ครั้งแรก · 30 วินาทีรันทุกเช้า"
checkGate:
  - "คุณมี ./agents/operations/personal-secretary.md จาก P2-03 แล้วใช่มั้ย?"
  - "คุณมี ./logs/ folder ที่เก็บ daily log เมื่อวาน (text file หรือ md) ใช่มั้ย? (ถ้าไม่มี secretary จะ skip step นั้น)"
  - "คุณมี calendar input — Google Calendar export หรือ paste meeting list ของวันนี้ — พร้อมใช่มั้ย?"
workedExample:
  industry: "Manufacturing SME (40 employees · 80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของโรงงานเปิดวันด้วย backlog 30+ unread message · 3 meeting + 5 follow-up ค้าง · อยากรู้ใน 60 วินาทีว่าวันนี้ต้องโฟกัสอะไร"
  inputs: "personal-secretary.md + ./logs/2026-04-21.md (เมื่อวาน) + paste calendar 3 meeting วันนี้ + รายการ 5 deal ที่ pending"
  output: "5-bullet briefing: 1) priority deal ที่ค้างนานสุด 2) meeting prep ที่ต้องทำก่อนบ่าย 3) decision pending จากเมื่อวาน 4) blocker ที่ต้องแก้ก่อน 5) win เล็กที่ฉลองได้"
  timeSaved: "อ่าน log เอง 25-40 นาที/เช้า · briefing 30 วินาที + คุณเลือกทำตามได้เลย"
phaseCtaHref: "/training/p1-ai-workshop-1-day#waitlist"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู P1 Public Training Waitlist"
published: 2026-04-22
---

## Use when
ทุกเช้าก่อนเปิดงานจริง · ต้องการ context กลับมาใน 60 วินาทีหลังพักไป 10+ ชั่วโมง

## Prerequisite
- P1-02 (claude.md ที่ระบุ priority weighting)
- P2-03 (personal-secretary.md พร้อม daily routine)
- ./logs/ folder ที่มีไฟล์เมื่อวาน (optional แต่แนะนำ)

## The Prompt

```
@personal-secretary ขอ morning briefing วันนี้

ขั้นตอนที่ผมอยากให้คุณทำตามลำดับ:

Step 1 — Gather context
อ่าน 3 source ตามลำดับ:
- ./claude.md section "Priority weighting" + "Working hours"
- ./logs/<yesterday-date>.md (ถ้าไม่มีไฟล์ ให้ระบุ "no log found" แล้วไปต่อ)
- Paste ของผมข้างล่าง: calendar วันนี้ + รายการ deal pending

Step 2 — Synthesize ไม่ใช่ list
ห้าม dump ทุกอย่างมาเป็น list ยาว · เลือกแค่ 5 item ที่ตรงเงื่อนไขนี้:
- Item 1: deal ที่ค้างนานสุดและ revenue impact สูงสุด (ระบุชื่อ + จำนวนวันที่ค้าง)
- Item 2: meeting วันนี้ที่ต้อง prep ก่อน (ระบุเวลา + 1 ประโยคว่าต้องเตรียมอะไร)
- Item 3: decision ที่ค้างจากเมื่อวาน (ผมต้องตัดสินใจอะไร · option A vs B)
- Item 4: blocker — task ที่หยุดงานอื่นไว้ ถ้าไม่แก้วันนี้จะ cascade
- Item 5: win เล็ก — สิ่งที่ดีที่เกิดเมื่อวาน (เพื่อ momentum · 1 ประโยค)

Step 3 — Format
ส่งกลับมาเป็น markdown แบบนี้:
🌅 Morning Briefing — <today-date>
1. [Priority deal] ...
2. [Meeting prep] ...
3. [Decision pending] ...
4. [Blocker] ...
5. [Win] ...
สรุปเวลาที่แนะนำ: เช้านี้ทำ X · บ่ายทำ Y · ที่เหลือ defer

กฎ:
- ห้ามใส่ item ที่ไม่ actionable วันนี้ — ถ้า item ที่ 4 หรือ 5 หาไม่เจอ ให้เขียน "ไม่มี blocker / ไม่มี win เด่นเมื่อวาน"
- ห้าม recommend tool หรือ workflow ใหม่ใน briefing — focus ที่ today only
- ห้าม briefing ยาวเกิน 200 คำ — ถ้าเกิน ตัดให้เหลือ

Calendar วันนี้ + deal pending ของผม:
[paste ที่นี่]
```

## Expected output
5-bullet markdown briefing ความยาว 150-200 คำ + คำแนะนำเวลา (เช้า/บ่าย/defer) · actionable ทุก item

## Worked Example
**Industry:** Manufacturing SME (40 employees · 80M revenue · อะไหล่รถบรรทุก)
**Scenario:** Backlog 30+ message · 3 meeting + 5 follow-up ค้าง · ต้อง context-switch กลับมาทำงาน
**Inputs:** personal-secretary.md + log เมื่อวาน + calendar paste + 5 deal pending
**Output:** 5-bullet briefing 180 คำ · จัดเวลาเช้า/บ่าย/defer · ใช้เวลาอ่าน 45 วินาที
**Time saved:** อ่านเอง 25-40 นาที/เช้า · briefing 30 วินาที

## Next step
→ ใช้ prompt P3-02 (@agent direct task format) เพื่อสั่งงานต่อจาก briefing แบบ shortcut
