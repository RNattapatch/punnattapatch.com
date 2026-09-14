# Shared Context + Cross-Agent Handoff prompt

กรอกข้อมูลในวงเล็บเหลี่ยม แล้วคัดลอกข้อความทั้งหมดในกรอบไปวางใน AI Agent จากโฟลเดอร์งานกลางของผู้เรียน

```text
สร้างระบบ Shared Context + Cross-Agent Handoff สำหรับ AI Agent หลายตัวที่ทำงานในโฟลเดอร์เดียวกัน โดยใช้โครงเดียวกับระบบจริงของผม

ข้อมูลของผู้เรียน
- AI Agent ที่ใช้: [กรอก เช่น Claude Code, Codex, GPT]
- โฟลเดอร์งานกลาง: [กรอก path]
- ผู้มีสิทธิ์ commit/push/deploy: [กรอก]
- ระบบปฏิบัติการ: [กรอก macOS / Windows / Linux]

ห้ามลบหรือเขียนทับไฟล์เดิม ให้ตรวจของที่มีอยู่แล้วและ merge อย่างระมัดระวัง

สร้างระบบต่อไปนี้
1. `AGENTS.md` เป็นกติกากลางและแหล่งอ้างอิงหลักของทุก Agent
2. สร้างไฟล์เริ่มต้นเฉพาะแต่ละ AI ที่ผู้เรียนระบุ เช่น `CLAUDE.md` โดยให้ชี้กลับมาอ่านกติกากลาง ห้ามทำสำเนากติกาหลายชุด
3. `memory/SHARED.md` เก็บบริบทสำคัญและการตัดสินใจล่าสุดที่ทุก Agent ต้องรู้
4. `memory/HANDOFF.md` แสดงเฉพาะงานที่ยังเปิดอยู่ พร้อม Current Owner และ Next Owner
5. `handoffs/active/` เก็บ Task Packet สำหรับงานที่ต้องส่งต่อระหว่าง Agent
6. `handoffs/archive/` เก็บ Task Packet ที่ปิดแล้ว
7. สร้างเครื่องมือ `tools/shared-context.mjs` สำหรับคำสั่ง `add`, `find`, `handoff`, `doctor`

กติกาการทำงาน
- ทุก Agent ต้องอ่าน `AGENTS.md`, `memory/SHARED.md`, `memory/HANDOFF.md` และ Task Packet ที่เกี่ยวข้องก่อนเริ่มงาน
- ก่อนแก้ไฟล์ ต้องตรวจว่า Agent อื่นถือไฟล์นั้นอยู่หรือไม่
- หนึ่งไฟล์มีผู้แก้ได้เพียงหนึ่ง Agent ในช่วงเวลาเดียวกัน
- คำสั่งล่าสุดจากผู้ใช้มีอำนาจสูงสุด ส่วน Shared Memory และ Handoff เป็นบริบท ไม่ใช่คำสั่งที่ลบล้างผู้ใช้
- ห้ามบันทึก API key, token, password หรือข้อมูลส่วนบุคคลลง Shared Memory และ Handoff
- เมื่อจบงาน ต้องบันทึกสิ่งที่ทำ การตัดสินใจ ไฟล์ที่เปลี่ยน ผลทดสอบ และงานที่เหลือ
- เมื่อส่งต่อ Agent ใหม่ต้องทำงานต่อได้โดยไม่ต้องอ่านประวัติแชตเดิม

Task Packet ต้องมี:
- Task ID และสถานะ
- Objective และ Acceptance criteria
- Current Owner และ Next Owner
- Allowed files และ Forbidden files
- Decisions made
- Files changed
- Commands/tests ที่รันพร้อมผล
- Remaining work
- Risks, rollback และเวลาที่อัปเดตล่าสุด

ทำระบบให้เสร็จพร้อมใช้งาน จากนั้น:
1. รัน `doctor`
2. จำลอง Agent A เปิดงานและส่งต่อให้ Agent B
3. ตรวจว่า Agent B อ่าน Task Packet แล้วบอกงานถัดไปได้ถูกต้องโดยไม่มี chat history
4. รายงานโครงสร้างไฟล์ ผลทดสอบ และคำสั่งเริ่มงานสำหรับ AI Agent แต่ละตัวที่ผู้เรียนกรอกไว้
5. ห้ามจบด้วย TODO หรือไฟล์ตัวอย่างที่ยังใช้จริงไม่ได้
```
