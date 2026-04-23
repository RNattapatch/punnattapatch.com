---
title: "P4-03 — MCP server integration pattern"
tier: advanced
phase: 4
slug: p4-03-mcp-integration
prereqs: [p2-07-orchestrator-router]
useCase: "ติดตั้ง + ใช้ MCP server สำหรับ external tool (Slack / Notion / Google Drive / Gmail / etc.) · ครอบคลุม config + agent integration + safety"
timeToSetup: "30-60 นาที/MCP ครั้งแรก · 5-10 นาทีต่อ MCP เพิ่ม"
checkGate:
  - "คุณรู้ว่าจะ integrate tool อะไร + มี account/credential พร้อมแล้วใช่มั้ย?"
  - "คุณรู้ว่า MCP token cost สูง (~18,000 token/MCP/message) ใช่มั้ย? — บังคับ MCP hygiene (เปิดเฉพาะที่ใช้)"
  - "คุณมี agent ใน ./agents/ ที่จะใช้ MCP นี้อยู่แล้วใช่มั้ย? (ถ้ายังไม่มี ต้อง spawn ก่อนผ่าน P2-06)"
workedExample:
  industry: "Service-based SME (15 employees · 35M revenue · digital marketing agency)"
  scenario: "Agency ใช้ Notion เป็น client workspace · ต้องการให้ content agent อ่าน brief + เขียน draft กลับ Notion โดยตรง · ไม่ต้อง copy-paste"
  inputs: "Notion API credential + list 3 use case (อ่าน brief / update status / เขียน draft) + content agent ที่จะใช้ MCP"
  output: "./mcp/notion-config.md (config + credential placement) + updated ./agents/content/<agent>.md (เพิ่ม MCP section + safety rule) + smoke test prompt 3 ตัว"
  timeSaved: "copy-paste Notion ↔ Claude Code 5-10 นาที/task · MCP 0 นาที (direct) · ลด error จาก manual copy"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
มี agent ที่ต้องอ่าน/เขียนข้อมูลจาก external tool บ่อย · copy-paste เป็น bottleneck

## Prerequisite
- P2-07 (orchestrator เพื่อ manage MCP routing)
- Account + credential ของ tool พร้อม
- เข้าใจ MCP hygiene (token cost)

## The Prompt

```
ผมต้องการ integrate MCP server สำหรับ [ชื่อ tool — เช่น Notion / Slack / Gmail]

Step 1 — Scope check
ถามผม 3 คำถาม ก่อนเริ่ม install:
- 3 use case หลักที่จะใช้ MCP นี้คืออะไร (ต้อง concrete · ห้ามตอบ "integrate ทุกอย่าง")
- Agent ตัวไหนจะใช้ MCP นี้ (1-3 ตัว · ห้ามให้ทุก agent เข้าถึง)
- Sensitivity ของ data ที่จะ touch (public / internal / confidential) — ถ้า confidential ต้องมี Boundaries เพิ่ม

ห้ามไปต่อ step 2 ถ้า 3 ข้อยังตอบไม่ครบ

Step 2 — Install + config
Research MCP server official (ถ้าเป็น Anthropic maintained list)
สร้าง ./mcp/<tool-name>-config.md ที่มี:
- Install command (ระบุ exact command · ห้าม pseudocode)
- Credential placement (ระบุ path · ห้าม hardcode ในไฟล์ agent)
- Scopes ที่ request — ขั้นต่ำเท่าที่จำเป็น (least privilege)
- Test command ที่จะยืนยันว่า install สำเร็จ

ถ้า MCP server ไม่มี official ให้ flag "ต้องใช้ community server หรือ build เอง" + ระบุ risk

Step 3 — Agent integration
เปิด agent file ที่จะใช้ (ตามคำตอบ step 1)
เพิ่ม 3 section:
- MCP access — ระบุชื่อ MCP server + scope
- Usage pattern — 3 use case จาก step 1 · แต่ละ use case เขียน prompt template
- Safety rules — ตามระดับ sensitivity:
  * public: ห้าม write operation โดยไม่ confirm กับ user
  * internal: ห้าม share data กับ agent ตัวอื่น โดยไม่ confirm
  * confidential: ห้าม write เลย · read-only · และห้าม quote content เต็มใน chat (summary เท่านั้น)

Step 4 — MCP hygiene rule
เพิ่มใน ./claude.md section "MCP Hygiene":
- MCP นี้เปิดเมื่อไหร่ (ระบุ session type — ห้ามเปิดตลอด)
- ต้อง disconnect เมื่อไหร่
- ใช้ token เท่าไหร่ estimate

Step 5 — Smoke test
เขียน 3 prompt test — 1 ต่อ use case จาก step 1
แต่ละ prompt ต้อง:
- เรียก @agent ที่ setup
- Execute use case บน sample data จริง (ห้ามใช้ mock)
- ยืนยันว่า output ถูกต้อง (มี checklist 3 ข้อต่อ test)

Step 6 — Rollback plan
ระบุวิธี disable MCP ถ้าเจอปัญหา:
- Command disconnect
- วิธี revoke credential
- วิธี clean ข้อมูลที่ MCP write ไว้ (ถ้ามี)

กฎ:
- ห้าม install MCP ที่ไม่มี rollback plan
- ห้ามให้ agent ทำ destructive operation (delete / overwrite) โดยไม่ confirm
- ถ้า MCP fail ระหว่าง task agent ต้อง fallback เป็น manual instruction (paste link / ให้ผม copy เอง) · ห้าม silent fail
```

## Expected output
./mcp/<tool>-config.md + updated agent file + claude.md MCP Hygiene entry + 3 smoke test ที่ pass + rollback plan

## Worked Example
**Industry:** Service-based SME (15 employees · 35M revenue · digital marketing agency)
**Scenario:** ใช้ Notion เป็น client workspace · ต้องการ agent อ่าน/เขียนตรง
**Inputs:** Notion credential + 3 use case + content agent
**Output:** notion-config.md + content agent อัปเดต + claude.md MCP Hygiene + 3 smoke test pass
**Time saved:** copy-paste 5-10 นาที/task · MCP direct 0 นาที · ลด manual error

## Next step
→ กลับไปที่ P3-05 (Strategic planning) เพื่อรวม MCP data ใหม่เข้า monthly decision
