---
title: "P2-04 — Spawn CRM Bot with Google Sheet integration"
tier: intermediate
phase: 2
slug: p2-04-crm-bot-sheets
prereqs: [p2-01-sale-agent-owner]
useCase: "เชื่อม Google Sheet (CRM) เข้ากับ agent — อ่าน lead / append row / update status ผ่าน @crm-bot"
timeToSetup: "15 นาที"
checkGate:
  - "คุณมี Google Sheet ที่ใช้เก็บลูกค้าอยู่แล้วใช่มั้ย? (มี Sheet ID พร้อม)"
  - "Sheet นี้ตั้ง share permission เป็น 'anyone with link can view' หรือคุณ setup Apps Script/Service account แล้วใช่มั้ย?"
  - "คุณรู้ว่า column ปัจจุบันมีอะไรบ้าง: ชื่อ / phone / status / notes / ฯลฯ ใช่มั้ย?"
workedExample:
  industry: "Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของโรงงานเก็บลูกค้าใน Google Sheet 200+ rows · พนักงาน sales 4 คน update มือ · อยากให้ agent อ่าน + append แทน"
  inputs: "./claude.md + Google Sheet ID + รายการ column ปัจจุบัน + skill-build-agent-team.md"
  output: "./agents/sales/crm-bot.md + ./agents/sales/crm-bot.config.json (เก็บ Sheet ID + column map) · เรียกผ่าน @crm-bot"
  timeSaved: "Update Sheet มือ + ค้น lead: 15-20 นาที/วัน · agent ทำให้ 2 นาที + ไม่พลาด field"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี sale-team-leader แล้ว และอยากให้ agent อ่าน/เขียน CRM ใน Google Sheet โดยตรง

## Prerequisite
- P2-01 (sale-team-leader.md เป็น parent)
- Google Sheet ที่ตั้ง share หรือ Apps Script พร้อม

## The Prompt

```
ผมต้องการสร้าง CRM Bot ที่เชื่อมกับ Google Sheet ของผม

ก่อนเริ่ม ขอให้คุณถามผม 3 ข้อ:
1. Google Sheet ID อะไร? (ดึงจาก URL: docs.google.com/spreadsheets/d/<ID>/edit)
2. ชื่อ tab ที่เก็บ lead คืออะไร? (default: Sheet1)
3. ขอรายการ column ทั้งหมดเรียงตามลำดับใน sheet (เช่น: A=ชื่อ B=phone C=status D=last-contact E=notes)

หลังได้ข้อมูลครบ ทำ 2 ไฟล์พร้อมกัน:

ไฟล์ 1 — ./agents/sales/crm-bot.config.json
{
  "sheetId": "<ตามที่ผมให้>",
  "tabName": "<ตามที่ผมให้>",
  "columnMap": {
    "name": "A",
    "phone": "B",
    "status": "C",
    "lastContact": "D",
    "notes": "E"
  },
  "accessMethod": "csv-export | apps-script | service-account",
  "csvExportUrl": "<ถ้า accessMethod = csv-export ให้สร้าง URL ตาม pattern>"
}

ไฟล์ 2 — ./agents/sales/crm-bot.md
- Role: read/append/update CRM rows
- Context inheritance: claude.md + sale-team-leader.md (parent)
- Capabilities: 4 commands (list-leads / find-lead / append-lead / update-status)
- Each command: input format + output format + which config field used
- Error handling: ถ้า Sheet inaccessible ให้ตอบอย่างไร / ถ้า column map ไม่ตรงให้ทำยังไง
- Boundaries: ห้ามลบ row · ห้ามเปลี่ยน column structure · ห้ามแชร์ข้อมูลลูกค้านอก context

กฎสำคัญ:
- ห้าม hard-code Sheet ID ใน .md — ต้องอ่านจาก config.json เท่านั้น
- ทุก command ต้อง cite row number ของ Sheet เวลาตอบ (ให้ผม audit ได้)
- หลังเสร็จ test สมมติ 1 รอบ: "@crm-bot list-leads status=hot" — show output คาดหวัง
```

## Expected output
2 ไฟล์ใหม่ (config.json + crm-bot.md) + sample test response ที่ cite row number

## Worked Example
**Industry:** Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)
**Scenario:** Sheet 200+ rows · sales 4 คน update มือ · อยากให้ agent ดูแล
**Inputs:** ./claude.md + Sheet ID + 5 columns (ชื่อ/phone/status/last-contact/notes) + access via csv-export
**Output:** crm-bot.config.json + crm-bot.md (~120 บรรทัด) + 4 commands พร้อม
**Time saved:** มือ 15-20 นาที/วัน · agent 2 นาที + zero missed field

## Next step
→ ใช้ prompt P2-05 (Proposal Writer with brand voice) เพื่อเชื่อม CRM → proposal
