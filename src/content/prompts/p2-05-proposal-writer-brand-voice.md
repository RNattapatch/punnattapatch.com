---
title: "P2-05 — Spawn Proposal Writer with brand voice"
tier: intermediate
phase: 2
slug: p2-05-proposal-writer-brand-voice
prereqs: [p2-01-sale-agent-owner]
useCase: "สร้าง agent เขียน proposal ที่ tone ตรงแบรนด์ + เรียนจาก 3 closed-won deals ที่คุณเคยปิดได้"
timeToSetup: "20 นาที"
checkGate:
  - "คุณมี ./claude.md ที่มี Voice section ครบ (มีตัวอย่างประโยคจริง ไม่ใช่แค่ keyword) ใช่มั้ย?"
  - "คุณมี proposal 3 ฉบับที่ปิดดีล closed-won (text หรือ docx) พร้อมจะ paste/upload ใช่มั้ย?"
  - "คุณรู้ proposal format ของคุณ: docx / pdf / Notion / web · เลือก 1 ใช่มั้ย?"
workedExample:
  industry: "Service-based SME (15 employees · ฿35M revenue · บริษัท digital marketing agency)"
  scenario: "เจ้าของ agency มี proposal 3 ฉบับที่ปิดดีล 200k+ · อยากให้ agent เขียนใหม่ tone เดียวกัน · ลด time-to-proposal จาก 2 วันเหลือ 2 ชม."
  inputs: "./claude.md + 3 proposal ฉบับ closed-won + format choice (docx)"
  output: "./agents/sales/proposal-writer.md + ./agents/sales/proposal-samples/ (3 ไฟล์ที่ paste มา) + voice-fingerprint extracted"
  timeSaved: "เขียน proposal เอง 4-8 ชม./ฉบับ · agent draft 30 นาที + edit 1 ชม."
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "อยากเห็น pattern advanced กว่านี้? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
ปิดดีลได้บ่อยพอที่ proposal เริ่มเป็น bottleneck และอยาก scale โดยไม่เสีย tone

## Prerequisite
- P2-01 (sale-team-leader.md เป็น parent reference)
- claude.md ที่มี Voice section + ตัวอย่างประโยคจริง

## The Prompt

```
ผมต้องการสร้าง Proposal Writer agent ที่ tone ตรงแบรนด์ผม

ขั้นตอนที่ผมอยากให้คุณทำตามลำดับ:

Step 1 — ขอ samples
ขอให้ผม paste proposal 3 ฉบับที่ปิดดีลแล้ว (closed-won) — ทีละฉบับ
หลังได้ครบ save เป็น ./agents/sales/proposal-samples/sample-1.md, sample-2.md, sample-3.md

Step 2 — Extract voice fingerprint
อ่าน 3 samples + claude.md Voice section
สรุปเป็น voice fingerprint 8 bullet:
- Average sentence length
- คำเชื่อมที่ใช้บ่อย (top 5)
- คำที่ไม่เคยใช้ (forbidden list)
- โครงสร้าง opening paragraph (3 รูปแบบที่เจอ)
- โครงสร้าง pricing section
- CTA pattern
- ระดับ formal/casual (1-10)
- Signature elements (เช่น มี case study เสมอ / มี timeline เสมอ / ฯลฯ)

แสดง fingerprint ให้ผมดู — ถามว่าตรงมั้ย — แก้ตามที่ผมบอก

Step 3 — สร้าง agent file
หลังผมยืนยัน fingerprint สร้าง ./agents/sales/proposal-writer.md โครงสร้าง 7 sections:
- Role & Mission
- Context inheritance (claude.md + sale-team-leader.md)
- Voice fingerprint (paste จาก step 2)
- Reference samples (link ไป ./agents/sales/proposal-samples/)
- Brief intake (8 ข้อก่อน draft: client / industry / pain / scope / budget-range / timeline / format / deadline)
- Draft workflow (3 phase: outline → fill → polish)
- Quality gate (ก่อนส่งให้ผม ต้อง self-check ว่า fingerprint match ทุก bullet)

กฎ:
- ห้าม draft proposal ใน chat — เขียน file ใน ./output/proposals/<client>-<date>.md เท่านั้น
- Format export ตามที่ผมเลือก (docx/pdf/Notion/web) — ระบุใน Draft workflow
- ทุกครั้งก่อน draft ต้องอ่าน 3 samples ใหม่ — ห้าม cache ในหัว
```

## Expected output
3 sample files saved + voice fingerprint 8 bullet (ผ่านการ confirm) + ./agents/sales/proposal-writer.md พร้อมใช้

## Worked Example
**Industry:** Service-based SME (15 employees · ฿35M revenue · digital marketing agency)
**Scenario:** มี proposal 3 ฉบับ closed-won 200k+ · อยากลด time-to-proposal
**Inputs:** ./claude.md + 3 proposal text + format=docx
**Output:** 3 samples saved + 8-bullet fingerprint + proposal-writer.md ~180 บรรทัด
**Time saved:** เขียนเอง 4-8 ชม./ฉบับ · agent 30 นาที draft + 1 ชม. edit

## Next step
→ ใช้ prompt P2-06 (Custom Department Head) ถ้าต้อง agent หมวดที่ template ไม่มี
