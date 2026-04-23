---
title: "P1-01 — Install Claude Code + first greeting"
tier: starter
phase: 1
slug: p1-01-install-claude-code
prereqs: []
useCase: "เริ่ม session แรกใน Claude Code — ให้ The Architect แนะนำตัวและ detect persona ก่อนสร้าง claude.md"
timeToSetup: "3 นาที"
checkGate:
  - "คุณดาวน์โหลด Claude Code desktop app แล้วใช่มั้ย? (claude.ai/download)"
  - "คุณสร้าง project folder ใหม่สำหรับธุรกิจคุณแล้วใช่มั้ย?"
  - "คุณวาง 5 .md setup files (README + the-architect + skill-business-context + skill-build-agent-team + skill-prompt-library) ใน project folder แล้วใช่มั้ย?"
workedExample:
  industry: "Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของ Manufacturing SME เพิ่งดาวน์โหลด Claude Code + วาง 5 setup files เสร็จ · ยังไม่เคยใช้ Claude Code มาก่อน"
  inputs: "5 setup files ใน project folder (ยังไม่มี claude.md) + prompt ข้างล่าง"
  output: "The Architect แนะนำตัว + ถาม 2-persona detection + รอคุณตอบ 1 หรือ 2 → route ไป skill-business-context"
  timeSaved: "ถ้าเริ่มเองโดยไม่มี Kit: 30 นาทีงงกับ Claude Code + 2 ชม.ลองผิดลองถูก · ใช้ prompt นี้ 3 นาทีเริ่มได้เลย"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ต้องการให้ปันมาติดตั้งให้ทั้งทีม? → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
เซสชันแรกของคุณใน Claude Code หลังวาง 5 setup files เสร็จ และยังไม่มี claude.md

## Prerequisite
- ไม่มี (prompt นี้คือจุดเริ่มต้น)

## The Prompt

```
@the-architect ผมเพิ่งดาวน์โหลด Claude Code และวาง 5 ไฟล์ setup ใน project folder นี้แล้ว:
- README.md
- the-architect.md
- skill-business-context.md
- skill-build-agent-team.md
- skill-prompt-library.md

กรุณา onboard ผมตามขั้นตอน — เริ่มจากแนะนำตัว ถามว่าผมเป็น persona ไหน (OWNER / MANAGER)
แล้วบอกขั้นถัดไปว่าจะ route ไป skill ไหนต่อ

ก่อนเริ่ม กรุณาเช็คว่าไฟล์ทั้ง 5 อ่านได้ครบ — ถ้าขาดไฟล์ใด บอกผมว่าไฟล์ไหนและวิธีหา

หลังจากผมตอบ persona แล้ว ให้ประกาศ USER_TYPE=OWNER หรือ USER_TYPE=MANAGER ชัดเจน
แล้วรอคำสั่งจากผมว่า "เริ่มสร้าง claude.md ได้เลย" ก่อน trigger skill ถัดไป
อย่าเพิ่ง deep-dive อะไรในตอนนี้ — แค่ greet + detect + รอ
```

## Expected output
The Architect ยืนยันว่าอ่าน 5 ไฟล์ครบ → แนะนำตัว → ถาม 2-persona detection → รอคำตอบ → ประกาศ USER_TYPE → route ไป skill-business-context

## Worked Example
**Industry:** Manufacturing SME (40 employees · ฿80M revenue · ขายอะไหล่รถบรรทุก)
**Scenario:** เจ้าของบริษัทเพิ่งเริ่มใช้ Claude Code · วาง 5 setup files เสร็จ 2 นาทีที่แล้ว · ยังไม่ได้สร้าง claude.md
**Inputs:** 5 setup files ใน project folder + prompt ข้างบน
**Output:** The Architect ตอบ 4 บรรทัด · รอ user ตอบ "1" · ประกาศ USER_TYPE=OWNER · บอก "พิมพ์ 'เริ่มสร้าง claude.md ได้เลย'"
**Time saved:** ถ้าเริ่มเองโดยไม่มี Kit: 30 นาที + 2 ชม. · ใช้ prompt นี้ 3 นาที

## Next step
→ ใช้ prompt P1-02 (Create claude.md via interview) ต่อทันที
