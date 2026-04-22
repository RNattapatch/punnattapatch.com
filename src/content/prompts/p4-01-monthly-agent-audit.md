---
title: "P4-01 — Monthly agent performance audit"
tier: intermediate
phase: 4
slug: p4-01-monthly-agent-audit
prereqs: [p1-02-claude-md-interview]
useCase: "ทุกสิ้นเดือน: audit output quality ของแต่ละ agent ใน 30 วันที่ผ่านมา · identify drift / improvement idea / agent ที่ควร deprecate"
timeToSetup: "20 นาที setup ครั้งแรก · 45-60 นาที audit/เดือน"
checkGate:
  - "คุณมี agent อย่างน้อย 3 ตัวที่ใช้จริง 30+ วัน ใช่มั้ย?"
  - "คุณมี ./output/ folder ที่เก็บงานจริงที่ agent generate (proposal / content / brief / etc.) ใช่มั้ย?"
  - "คุณพร้อมจะ deprecate agent ที่ไม่ได้ใช้แล้วใช่มั้ย? (ห้าม keep ทุกตัวเพราะเสียดาย)"
workedExample:
  industry: "Solo founder (1 person · 8M revenue · freelance B2B sales consultant)"
  scenario: "Solo มี 6 agent · ใช้จริง 4 ตัว · 1 ตัวเริ่ม drift (proposal voice เพี้ยน) · 1 ตัวไม่เคยใช้เลย · ต้องการ audit เพื่อตัดสินใจ"
  inputs: "list 6 agent + ./output/ ที่ agent generate ใน 30 วัน + claude.md baseline + 2-3 feedback ที่เคยให้ agent"
  output: "./output/audits/agent-audit-<YYYY-MM>.md — table 6 agent x 4 metric (usage count / output quality / drift signal / value delivered) + verdict (keep-as-is / tune / deprecate) + 3 specific improvement"
  timeSaved: "audit เอง 4-5 ชม. (อ่าน output + เปรียบเทียบ + judgment) · session 60 นาที + เอกสารพร้อม decision"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
ทุกสิ้นเดือน · agent stack เริ่มเยอะและบางตัวอาจ drift / ไม่ได้ใช้

## Prerequisite
- claude.md baseline (เพื่อเทียบ agent voice + behavior)
- ./output/ ที่มีงานจริง 30 วัน
- list agent ครบ

## The Prompt

```
ผมต้องการ audit agent ทั้งหมดของผมในรอบเดือน

Step 1 — Inventory
List agent ทุกตัวใน ./agents/ — group ตาม folder (sales / content / operations / ฯลฯ)
สำหรับแต่ละ agent ดึง 3 ข้อ:
- Last modified date
- Lines of code (ตัวเลข approximate)
- Has-been-used signal (เจอ output ใน ./output/ ที่ generate โดย agent นี้มั้ย — yes/no)

Step 2 — Sample output review
สำหรับ agent ที่ used = yes · pick 3 sample output ล่าสุดจาก ./output/
อ่านแต่ละ sample + เทียบกับ:
- claude.md Voice section
- agent file ตัวเอง (Quality gate / Boundaries section)
- ใน sample เจอ behavior อะไรที่ละเมิด rule บ้าง

Step 3 — 4-metric scoring
สร้าง table — 1 row ต่อ agent · 4 column:
- Usage (heavy / occasional / unused) — based on output count
- Output quality (consistent / variable / declining) — based on sample review
- Drift signal (none / minor / major) — เทียบกับ baseline
- Value delivered (high / medium / unclear) — ตอบคำถาม "ถ้าไม่มี agent นี้ ผมเสียอะไร"

Step 4 — Verdict + reason
ออก verdict 1 ใน 3 ต่อ agent:
- Keep-as-is — ทำงานดี · ไม่ต้องแตะ
- Tune — มีปัญหาเล็ก · ระบุ tune อะไรเฉพาะเจาะจง (เช่น "เพิ่ม forbidden word ใน Boundaries: ขับเคลื่อน, ตอบโจทย์ทุก")
- Deprecate — ไม่ได้ใช้ / value ไม่ชัด · move ไป ./agents/_deprecated/

ห้าม "keep all" เพราะเสียดาย · ถ้า unused 60+ วัน → deprecate

Step 5 — 3 improvement
จาก audit · เลือก 3 improvement ที่ impact สูงสุด · ระบุ:
- Agent ไหน
- Change อะไร (เฉพาะเจาะจง · paste section ที่จะเขียนใหม่)
- Expected effect

Step 6 — Save audit
สร้าง ./output/audits/agent-audit-<YYYY-MM>.md โครง:
- Inventory table
- Sample review notes
- 4-metric table
- Verdict per agent
- 3 improvement
- Action item (ผมต้องทำอะไรในสัปดาห์หน้า)

กฎ:
- ห้าม audit agent ที่ deploy < 30 วัน (data ไม่พอ)
- ห้ามให้ verdict โดยไม่ quote sample จริง
- ทุก "tune" ต้องมี diff text ที่ผม copy-paste ลง agent file ได้เลย
```

## Expected output
./output/audits/agent-audit-<YYYY-MM>.md + 3 improvement พร้อม diff + verdict ครบทุก agent

## Worked Example
**Industry:** Solo founder (1 person · 8M revenue · freelance B2B sales consultant)
**Scenario:** มี 6 agent · 4 ตัวใช้จริง · 1 ตัว drift · 1 ตัวไม่ใช้
**Inputs:** 6 agent + ./output/ 30 วัน + claude.md baseline
**Output:** audit-2026-04.md · 6-row table · 1 deprecate + 2 tune + 3 keep · 3 improvement พร้อม diff
**Time saved:** audit เอง 4-5 ชม. · session 60 นาที

## Next step
→ ใช้ prompt P4-02 (Automation gate) เพื่อตัดสินว่า agent task ไหนควร upgrade เป็น n8n
