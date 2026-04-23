---
title: "P4-02 — Automation gate: agent → n8n workflow"
tier: advanced
phase: 4
slug: p4-02-automation-gate-n8n
prereqs: [p4-01-monthly-agent-audit]
useCase: "Decision matrix: task ไหนของ agent ที่ควร upgrade เป็น n8n scheduled workflow · criteria: frequency / time saved / risk / maintainability"
timeToSetup: "45 นาที setup + 1-3 ชม. build n8n workflow (ถ้าผ่าน gate)"
checkGate:
  - "คุณมี audit รายเดือนจาก P4-01 พร้อม list agent task ที่ 'heavy usage' ใช่มั้ย?"
  - "คุณมี n8n instance (cloud หรือ self-host) ที่ login ได้ใช่มั้ย?"
  - "คุณเข้าใจว่า n8n automation = deterministic (no LLM in critical path ถ้าเป็นไปได้) ต่างจาก agent = judgment-based ใช่มั้ย?"
workedExample:
  industry: "Manufacturing SME (40 employees · 80M revenue · ขายอะไหล่รถบรรทุก)"
  scenario: "เจ้าของมี 5 agent task heavy · 3 ใน 5 = repetitive (lead routing / invoice reminder / daily KPI dump) · ต้องการตัดสินว่าอันไหนควรย้ายไป n8n · อันไหนยังให้ agent ทำต่อ"
  inputs: "list 5 heavy task + audit from P4-01 + n8n instance URL + sample data ของแต่ละ task"
  output: "./output/automation/gate-matrix-<YYYY-MM>.md — 5-row table × 4 criteria (frequency / time saved / risk / maintainability) + verdict (n8n / keep agent / hybrid) + สำหรับ task ที่ผ่าน gate: n8n workflow spec (trigger / nodes / credential / error handling)"
  timeSaved: "task repetitive ถ้ายังให้ agent ทำ = 10-15 นาที/ครั้ง · n8n = 0 นาที (scheduled) · scale linearly ตาม frequency"
phaseCtaHref: "/services/ai-workshop"
phaseCtaLabel: "ใช้ pattern นี้ใน workshop → ดู In-House Workshop"
published: 2026-04-22
---

## Use when
หลัง P4-01 audit และพบ agent task ที่ heavy + repetitive · ก่อน build n8n workflow

## Prerequisite
- P4-01 audit ล่าสุด
- n8n instance พร้อม
- เข้าใจ agent vs n8n decision

## The Prompt

```
ผมมี agent task ที่ heavy usage — ต้องการตัดสินว่าควร upgrade เป็น n8n มั้ย

Step 1 — Inventory candidates
List task ที่มาจาก P4-01 audit — group ตาม agent owner
สำหรับแต่ละ task ดึง 5 field:
- Task name
- Current agent owner
- Frequency (per day / week / month)
- Avg time/run (นาที)
- Input source (manual paste / file / external API / email)

Step 2 — 4-criteria gate
สำหรับแต่ละ task ให้ score 4 criteria — ใช้ 3 ระดับ (high / medium / low):
- Frequency — ≥1/วัน = high · 1-5/สัปดาห์ = medium · <1/สัปดาห์ = low
- Time saved — ≥10 นาที/run = high · 3-10 นาที = medium · <3 นาที = low
- Risk if automated — deterministic logic + low-stakes = low risk · judgment-required or customer-facing = high risk
- Maintainability — stable schema/endpoint = high · frequently changing format = low

Step 3 — Verdict logic (บังคับตาม rule นี้)
- n8n ถ้า: Frequency ≥ medium · Time saved ≥ medium · Risk = low · Maintainability ≥ medium
- Keep agent ถ้า: Risk = high (judgment-required) หรือ Maintainability = low (schema เปลี่ยนบ่อย)
- Hybrid ถ้า: task มี deterministic part + judgment part — n8n handle deterministic · agent handle judgment · ระบุ handoff point

ห้าม auto-pick "n8n" เพียงเพราะ frequency สูง ถ้า risk = high

Step 4 — Spec task ที่ผ่าน gate
สำหรับ verdict = n8n หรือ hybrid · เขียน spec:
- Trigger (schedule / webhook / manual / email)
- Node sequence (ระบุ node type — ห้ามลึก config ตอนนี้)
- Credential ที่ต้อง setup (ระบุ list)
- Error handling (ถ้า step ไหน fail ให้ทำอะไร — retry / notify / fallback to agent)
- Success metric (จะวัดยังไงว่า workflow ทำงานถูก)

ห้าม generate workflow JSON ตอนนี้ — spec อย่างเดียว · build จะทำใน step ถัดไป

Step 5 — Hand-off instruction
สำหรับ task ที่ verdict = hybrid ระบุชัด:
- n8n ทำอะไรถึงจุดไหน
- agent รับต่อตอนไหน + รับ input อะไร
- ใครเป็น "source of truth" ถ้า 2 ฝั่งให้ผลไม่ตรง

Step 6 — Save
สร้าง ./output/automation/gate-matrix-<YYYY-MM>.md โครง:
- Inventory table
- 4-criteria matrix
- Verdict per task
- Spec สำหรับ task ที่ผ่าน gate
- Build priority (เริ่ม task ไหนก่อน — ดู time-saved × frequency)
```

## Expected output
./output/automation/gate-matrix-<YYYY-MM>.md + spec พร้อม build + build priority order

## Worked Example
**Industry:** Manufacturing SME (40 employees · 80M revenue · อะไหล่รถบรรทุก)
**Scenario:** 5 heavy task · 3 repetitive · ต้องการ gate
**Inputs:** audit P4-01 + 5 task list + n8n URL + sample data
**Output:** gate-matrix-2026-04.md · 3 task → n8n · 1 → keep agent · 1 → hybrid · spec 4 workflow
**Time saved:** task repetitive 10-15 นาที/ครั้ง → 0 นาที หลัง n8n deploy

## Next step
→ ใช้ prompt P4-03 (MCP integration) เพื่อ integrate tool ภายนอกเข้า agent stack
