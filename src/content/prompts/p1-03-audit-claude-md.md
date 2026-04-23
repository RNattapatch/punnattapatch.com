---
title: "P1-03 — Audit existing claude.md for gaps"
tier: intermediate
phase: 1
slug: p1-03-audit-claude-md
prereqs: [p1-02-claude-md-interview]
useCase: "ถ้าคุณมี claude.md อยู่แล้ว (เขียนเองหรือ generate มาก่อน) — ให้ Claude สแกนหา section ที่ขาด/อ่อน/ขัดกัน ก่อนเอาไปสร้าง agent"
timeToSetup: "10 นาที"
checkGate:
  - "คุณมีไฟล์ claude.md อยู่ที่ project root แล้วใช่มั้ย?"
  - "claude.md มีเนื้อหาอย่างน้อย 50 บรรทัดใช่มั้ย? (ถ้าน้อยกว่า ให้ใช้ P1-02 สร้างใหม่แทน)"
  - "คุณมี skill-business-context.md อยู่ใน project folder ใช่มั้ย? (audit ใช้เป็น reference)"
workedExample:
  industry: "Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)"
  scenario: "Solo consultant เขียน claude.md เองตอนเริ่มใช้ Claude Code 3 เดือนที่แล้ว · ตอนนี้ agent ตอบไม่แม่น สงสัย claude.md อาจขาดข้อมูล"
  inputs: "claude.md ปัจจุบัน (~120 บรรทัด) + skill-business-context.md (เป็น reference template)"
  output: "Audit report 5 หมวด: ครบ / ขาด / อ่อน / ขัดกัน / ซ้ำซ้อน · แต่ละ gap มี suggested fix + cite บรรทัด"
  timeSaved: "อ่านเองหา gap: 1-2 ชม. + ยังไม่แน่ใจว่าเช็คครบมั้ย · ใช้ prompt 10 นาที + ได้ report ที่อิง template มาตรฐาน"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี claude.md อยู่แล้ว และอยาก stress-test ว่าครบ/ตรง/ไม่ขัดกัน ก่อนเอาไปสร้าง agent

## Prerequisite
- claude.md ที่ project root (จะเขียนเองหรือ generate ผ่าน P1-02 มาก็ได้)
- skill-business-context.md (เป็น reference สำหรับ template มาตรฐาน)

## The Prompt

```
ผมมี claude.md อยู่ที่ ./claude.md แล้ว — ขอให้คุณ audit ให้ละเอียด

ขั้นตอน:
1. อ่าน skill-business-context.md ก่อน — ดู section structure ที่เป็น "มาตรฐาน 8 sections"
2. อ่าน ./claude.md ทั้งไฟล์
3. เปรียบเทียบ field-by-field กับ template มาตรฐาน

Report ใน 5 หมวด — แต่ละ gap ต้อง cite บรรทัดของ claude.md และเสนอ fix ที่เขียนได้เลย:

หมวด 1 — ครบ (sections ที่มีและตรง template)
หมวด 2 — ขาด (sections ใน template ที่ไม่มีใน claude.md ของผม)
หมวด 3 — อ่อน (มี section นั้น แต่ข้อมูลตื้นเกินไปจน agent ใช้ไม่ได้ เช่น "ขายของ B2B" โดยไม่บอกว่า ขายอะไร ใคร เท่าไหร่)
หมวด 4 — ขัดกัน (เนื้อหาในไฟล์ขัดกันเอง เช่น Identity บอก solo founder แต่ Business model พูดเรื่องทีม 20 คน)
หมวด 5 — ซ้ำซ้อน (พูดเรื่องเดียวกัน 2 ที่ ในรูปต่างกัน — เสี่ยง agent งง)

จบ report ด้วย verdict 1 บรรทัด:
- "พร้อมใช้สร้าง agent ทันที" หรือ
- "ควรแก้ก่อน — gap ที่ blocker คือ [ระบุ section]"

ห้ามแก้ ./claude.md เอง — แค่ report ให้ผมตัดสินใจ
```

## Expected output
Audit report 5 หมวด พร้อม line citation + suggested fix · จบด้วย verdict 1 บรรทัดว่าใช้ได้ทันทีหรือต้องแก้ก่อน

## Worked Example
**Industry:** Solo founder (1 person · ฿8M revenue · freelance B2B sales consultant)
**Scenario:** Solo consultant เขียน claude.md เอง 3 เดือนก่อน · agent ตอบไม่แม่น · อยากเช็คก่อนแก้
**Inputs:** ./claude.md ~120 บรรทัด + skill-business-context.md
**Output:** Report 5 หมวด · พบ "ขาด section Audience" + "อ่อน Voice (ไม่มีตัวอย่างประโยคจริง)" + verdict "ควรแก้ก่อน"
**Time saved:** อ่านเอง 1-2 ชม. ไม่แน่ใจครบมั้ย · ใช้ prompt 10 นาทีได้ report อิง template

## Next step
→ ถ้า verdict "พร้อมใช้" ไป P2-01 · ถ้า "ควรแก้ก่อน" รัน P1-02 เฉพาะ section ที่ blocker
