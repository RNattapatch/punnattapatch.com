---
title: "P2-01 — Spawn Sale Agent (owner template)"
tier: starter
phase: 2
slug: p2-01-sale-agent-owner
prereqs: [p1-02-claude-md-interview]
useCase: "สร้าง agent ตัวแรกในทีม — Sale Team Leader ที่อ่าน claude.md เป็น context และตอบคำถาม sales/CRM/proposal ได้"
timeToSetup: "8 นาที"
checkGate:
  - "คุณมี claude.md ที่ project root (ผ่าน P1-02 หรือ P1-03 audit แล้ว) ใช่มั้ย?"
  - "USER_TYPE ของคุณคือ OWNER ใช่มั้ย? (template นี้ออกแบบสำหรับเจ้าของธุรกิจ)"
  - "คุณมี skill-build-agent-team.md อยู่ใน project folder ใช่มั้ย?"
workedExample:
  industry: "Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของโรงงานอะไหล่ผ่าน claude.md เสร็จ · อยากได้ agent ที่ช่วยจัดการ pipeline + เขียน follow-up ลูกค้า + draft proposal"
  inputs: "./claude.md + skill-build-agent-team.md (มี OWNER template) + prompt ข้างล่าง"
  output: "ไฟล์ ./agents/sales/sale-team-leader.md (~150 บรรทัด) ที่ inherit context จาก claude.md + พร้อมเรียกผ่าน @sale-team-leader"
  timeSaved: "เขียน agent prompt เองจากศูนย์: 2-3 ชม. + ลองใช้แล้วแก้ · ใช้ prompt 8 นาทีได้ agent ที่ใช้ได้ทันที"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี claude.md พร้อมแล้ว และต้องการ agent ตัวแรกของทีม sales

## Prerequisite
- P1-02 (claude.md ที่ project root)
- skill-build-agent-team.md

## The Prompt

```
ผมต้องการสร้าง agent ตัวแรกของทีม — Sale Team Leader

ขั้นตอนที่ผมอยากให้คุณทำ:
1. อ่าน ./claude.md ทั้งไฟล์ — โดยเฉพาะ section Identity, Business model, Audience, Voice
2. อ่าน skill-build-agent-team.md — ดู template "Sale Team Leader (OWNER)"
3. สร้างไฟล์ใหม่ที่ path: ./agents/sales/sale-team-leader.md
4. โครงสร้างไฟล์ตาม template มี 6 sections:
   - Role & Mission (1 ย่อหน้าสั้น)
   - Context inheritance (อ้างอิง ./claude.md ชัดเจน — ห้าม copy เนื้อหา)
   - Responsibilities (CRM update / follow-up / proposal draft / pipeline review)
   - Tone (อ้างอิง Voice section ของ claude.md)
   - Hand-off rules (เมื่อไหร่ส่งงานให้ agent อื่น เช่น proposal-writer หรือ orchestrator)
   - Working files (path ของ CRM / proposal templates / output folder)

กฎสำคัญ:
- ห้าม hard-code business detail ที่อยู่ใน claude.md อยู่แล้ว — ใช้ "อ่าน claude.md ก่อนทุกครั้ง" แทน
- ทุก path ใน Working files ต้องเป็น absolute หรือ ./relative-from-project-root
- ถ้า claude.md ไม่มีข้อมูลที่ template ต้องการ (เช่น CRM URL) ให้ note ว่า "TODO: ใส่ค่านี้หลัง P2-04 เสร็จ" — ห้ามแต่งค่าเอง

หลังเขียนไฟล์เสร็จ:
- summary ให้ผม 4 บรรทัด: path / lines / inherited sections / TODO ที่เหลือ
- บอก next step: เรียก @sale-team-leader ทดสอบด้วยคำสั่งอะไรเป็น smoke test
```

## Expected output
ไฟล์ ./agents/sales/sale-team-leader.md ใหม่ + summary 4 บรรทัด + smoke test command ที่เรียก @sale-team-leader ดูว่า inherit context ถูก

## Worked Example
**Industry:** Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)
**Scenario:** เจ้าของโรงงาน · มี claude.md พร้อม · อยากได้ Sale Agent ตัวแรก
**Inputs:** ./claude.md + skill-build-agent-team.md (OWNER template)
**Output:** ./agents/sales/sale-team-leader.md (~150 บรรทัด) + 1 TODO รอ CRM URL จาก P2-04
**Time saved:** เขียนเอง 2-3 ชม. + ลองแก้ · prompt 8 นาทีจบ

## Next step
→ ใช้ prompt P2-02 (Spawn Content Agent) เพื่อขยายทีม
