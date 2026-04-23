---
title: "ติดตั้ง Claude Code + สร้างทีม AI ตัวแรก"
description: "Step-by-step ติดตั้ง Claude Code บน Mac/Windows, 6 pitfalls จริงที่ 80% ของเจ้าของติด, CLAUDE.md คือสมองกลาง, และออกแบบ agent ตัวแรกด้วย 5 sections"
part: 2
partTitle: "ติดตั้ง Claude Code + สร้างทีม AI ตัวแรก"
readingTime: 15
published: 2026-04-23
draft: false
---

## ⚠️ กฎทองข้อแรก: 1 โฟลเดอร์ = 1 ธุรกิจ (อ่านก่อนทำอะไรเด็ดขาด)

ก่อนจะติดตั้งอะไร ผมต้องเตือนเรื่องนี้ก่อน

Claude Code อ่าน-เขียน-แก้ไฟล์ในโฟลเดอร์ที่คุณเปิดให้มันเห็นได้ทั้งหมด นี่คือพลังของมัน แต่ถ้าใช้ผิด ฉิบหายฉายที่นี้แน่นอน 😅

**เคสจริงที่ผมเห็น:**
- เจ้าของคนหนึ่งเปิด Claude Code ที่ root user folder (`~/`) — agent ไป index ไฟล์ทุกอย่างในเครื่อง รวม Desktop ที่มีไฟล์ภาษีปี 67 ตอน prompt ขอ "สรุปงานวันนี้" agent กลับเอา PDF ภาษีของเจ้าของไปประมวลด้วย
- อีกเคส เจ้าของรันคำสั่งแก้ไฟล์ในโฟลเดอร์รวม agent เผลอเขียนทับ template proposal เก่าที่ใช้กับลูกค้าหลัก

**กฎ 3 ข้อกัน "หายนะ":**

1. **1 โฟลเดอร์ = 1 ธุรกิจ** — สร้างโฟลเดอร์ใหม่เฉพาะสำหรับ AI เช่น `~/Documents/my-business-ai/` ห้ามเปิด Claude ที่ `~/Documents/` ตรงๆ
2. **ห้ามวางไฟล์ส่วนตัว** ในโฟลเดอร์ AI — ภาษี เงินเดือนพนักงาน contract ที่มี NDA ห้ามให้ agent เห็น
3. **เปิดดู permission ทุกครั้ง** — Claude Desktop App จะถามครั้งแรกว่า "ให้เข้าถึงโฟลเดอร์นี้ไหม" เลือกเฉพาะโฟลเดอร์ AI อย่ากด "ทั้งเครื่อง"

ถ้าทำตามกฎ 3 ข้อ = AI เห็นเฉพาะข้อมูลที่คุณตั้งใจให้เห็น เร็ว ปลอดภัย ผิดพลาดก็จำกัดอยู่ในขอบเขต

---

## Phase 1 Setup — เตรียมเครื่อง + ติดตั้ง Claude Code

ก่อนเริ่มสร้างทีม AI สิ่งที่ต้องเตรียมจริงๆ มีแค่ 3 อย่าง

1. **คอมพิวเตอร์** — Mac (macOS 12+) หรือ Windows 10/11 ไม่มีข้อกำหนด CPU/RAM พิเศษเพราะ Claude Code รันบน cloud Notebook ธรรมดาก็ทำได้
2. **Node.js LTS** — Claude Code CLI install ผ่าน npm เลยต้องมี Node ก่อน
3. **บัญชี Anthropic Pro Plan ($20/เดือน)** — จ่ายเถอะครับ ราคาถูกกว่ากินซูชิสายพานในห้างหนึ่งมื้อ แต่คุณได้ระบบที่จะช่วยคุณทำงานแทนพนักงาน 5-10 คน

> **ผมเลือก Claude Code เพราะ 4 ข้อนี้ครับ**
>
> 1. **อ่านไฟล์ในเครื่องคุณได้ตรง** — ไม่ต้อง upload ทีละไฟล์เหมือน ChatGPT ข้อมูลธุรกิจอยู่ในเครื่องคุณ AI วิ่งเข้าไปอ่านเอง
> 2. **คุมพฤติกรรม AI ได้ทั้งหมด** — ตั้งบทบาท เป้าหมาย กฎห้าม AI จำได้ตลอด ถ้าอนาคต model มีอัปเดต ก็ไม่กระทบกับการทำงานของ Agent
> 3. **ทำงานเป็นทีมได้** — agent หลายตัวทำงานพร้อมกัน งานที่ต้องใช้คน 5 ชั่วโมง agent ทำเสร็จใน 5 นาที
> 4. มี MCP และ Connector หรือแขนขาของ AI ไปเรียกโปรแกรมข้างนอกมาใช้ได้ — Canva, Word, Excel, Google Doc นี้แค่ตัวอย่างนะครับ

### ติดตั้งบน macOS (5-10 นาที)

เปิด Terminal (`Cmd + Space` พิมพ์ `Terminal` → Enter) แล้วพิมพ์ทีละบรรทัด

```bash
# 1. ตรวจว่ามี Node แล้วหรือยัง
node --version

# ถ้าเห็นเลข v20.x หรือใหม่กว่า → ข้ามไป step 3
# ถ้าเห็น "command not found" → ทำ step 2 ก่อน

# 2. ติดตั้ง Node ผ่าน Homebrew
brew install node

# 3. ติดตั้ง Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 4. ตรวจว่าใช้ได้
claude --version
```

ถ้า step 4 เห็นเลข version ออกมา = ติดตั้งสำเร็จ จากนั้นล็อกอิน

```bash
claude login
```

จะเปิด browser ให้คุณ sign in ด้วยบัญชี Anthropic Pro กลับมาที่ Terminal พิมพ์ `claude` อีกครั้ง ถ้าเข้าหน้าจอ chat ได้ = พร้อมใช้

### ติดตั้งบน Windows (10-15 นาที)

**ทางเลือกที่ 1 (แนะนำ): ใช้ WSL2 + Ubuntu**

```powershell
# เปิด PowerShell แบบ Run as Administrator
wsl --install

# Restart Windows เปิด Ubuntu (จะอยู่ใน Start menu)
# ตั้ง username + password
# จากนั้นใน Ubuntu terminal:
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g @anthropic-ai/claude-code
claude --version
```

**ทางเลือกที่ 2: ติดตั้งบน Windows ตรง**

1. ดาวน์โหลด Node LTS จาก https://nodejs.org → install ปกติ
2. เปิด PowerShell (`Win + X` → "Windows PowerShell")
3. พิมพ์ `npm install -g @anthropic-ai/claude-code` แล้ว `claude --version`
4. ถ้าเห็น "claude is not recognized..." → ดู Pitfall D ในบทถัดไป

### 5 setup files ใน Kit

หลังติดตั้ง Claude Code เสร็จ แตกไฟล์ `agent-builder-kit-v1.zip` จะเห็นโฟลเดอร์ที่มี 5 ไฟล์ตั้งต้น

| ไฟล์ | หน้าที่ |
|---|---|
| `README.md` | สรุปวิธีใช้ Kit อ่านก่อน |
| `the-architect.md` | ตัว orchestrator จะทักทายคุณก่อนเสมอ ถามว่าคุณเป็น Owner หรือ Manager |
| `skill-business-context.md` | สัมภาษณ์คุณเรื่องธุรกิจ จะใช้สร้าง CLAUDE.md |
| `skill-build-agent-team.md` | สร้างทีม agent ตาม template ที่เลือก |
| `skill-prompt-library.md` | สอนวิธีใช้ prompt library 20 ตัว |

วาง 5 ไฟล์นี้ในโฟลเดอร์ที่คุณจะใช้เป็น "สำนักงาน" ของธุรกิจ แนะนำ `~/Documents/my-business-ai/`

```bash
cd ~/Documents/my-business-ai
claude
```

The Architect จะทักทายคุณก่อน ถามว่า Owner หรือ Manager ตอบไปแล้วระบบจะ route คุณเข้า skill ถัดไป

---

## Installation Pitfalls — สิ่งที่จะเจอตอน setup (Mac + Windows)

ผม consult SME มา 6 เดือน 80% ของเจ้าของที่พยายามติดตั้งเอง ติดอย่างน้อย 1 ใน 6 ปัญหานี้

### Pitfall A: `command not found` หลัง install แล้ว (Mac)

**อาการ:** `npm install -g @anthropic-ai/claude-code` รันสำเร็จ แต่พิมพ์ `claude` กลับเห็น `command not found`

**สาเหตุ:** Apple Silicon Mac (M1/M2/M3) ใช้ `/opt/homebrew/bin` แต่ shell บางตัวไม่อ่าน path นี้

**แก้:**
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
claude --version
```

### Pitfall B: VS Code Extension ขึ้นแต่พิมพ์ command ไม่ได้

**อาการ:** ลง Claude Code Extension ใน VS Code แล้ว กด ⌘+L → ไม่มีอะไรขึ้น หรือ extension บอกว่า `claude` not found

**สาเหตุ:** Claude Code มี 2 ส่วน — Extension ใน VS Code และ CLI ใน Terminal 2 ส่วนนี้แยกกัน ลง Extension ไม่ได้แปลว่ามี CLI

**แก้:** ติดตั้ง CLI ตามขั้นตอน Mac/Windows ด้านบน + reload VS Code window (`⌘+Shift+P` → "Developer: Reload Window")

### Pitfall C: Login Extension แล้วยังต้อง login Terminal อีก

**อาการ:** Sign in Claude Code Extension ใน VS Code สำเร็จ เปิด Terminal พิมพ์ `claude` → "Please log in"

**สาเหตุ:** VS Code Extension session กับ Terminal CLI session แยกกัน

**แก้:**
```bash
claude login
```

### Pitfall D: `claude` is not recognized (Windows)

**อาการ:** `npm install -g @anthropic-ai/claude-code` สำเร็จ พิมพ์ `claude` ใน PowerShell → "claude is not recognized..."

**แก้:** เพิ่ม path ใน Environment Variables
1. กด `Win + R` → พิมพ์ `sysdm.cpl` → Enter
2. แท็บ "Advanced" → "Environment Variables..."
3. หา `Path` → Edit → New → เพิ่ม `%APPDATA%\npm`
4. OK ทุก dialog ปิด PowerShell เปิดใหม่

### Pitfall E: Node version mismatch

**อาการ:** เห็น error เกี่ยวกับ `NODE_MODULE_VERSION` หรือ "incompatible Node version"

**แก้:**
```bash
# Mac (with nvm)
nvm install 20
nvm use 20
nvm alias default 20
npm install -g @anthropic-ai/claude-code
```

### Pitfall F: Git ยังไม่ได้ติดตั้ง

**แก้:**
```bash
# Mac
brew install git

# Windows (WSL)
sudo apt install -y git

git config --global user.name "ชื่อคุณ"
git config --global user.email "email@you.com"
```

### Pitfall G: ไม่ใช่ pitfall เป็น mindset

สิ่งที่ผมเห็นบ่อยที่สุดในเจ้าของ SME: ติดตั้ง 30 นาทีไม่เสร็จ → เลิก → กลับไปใช้ ChatGPT ตามเดิม 6 เดือนผ่านไป คู่แข่งลง agent system แล้ว margin คุณตก

ขั้นตอนนี้คือ "ภาษีทางเข้า" จ่ายครั้งเดียว ใช้ 5 ปี ราคาคือ 1 ชั่วโมงของคุณวันนี้

ถ้าติดที่ pitfall ใด → ทักผมที่ LINE OA [https://lin.ee/ioSnSUG](https://lin.ee/ioSnSUG) ผมตอบใน 24 ชม. (Mon-Fri)

---

## ใช้งานประจำวัน — Claude Desktop App ดีที่สุดสำหรับเจ้าของธุรกิจ

ความจริงคือ Terminal เหมาะกับ developer ไม่เหมาะกับเจ้าของธุรกิจ SME โชคดีที่ Claude Code มี GUI ให้ใช้ 2 ทาง

### ทางที่ 1 (แนะนำ 90%): Claude Desktop App

นี่คือทางที่ผมใช้กับลูกค้าทุกคน เป็น native macOS / Windows app interface เหมือน chat ทั่วไปที่คุณคุ้นเคย

**ติดตั้ง:** ไป https://claude.ai/download → download app สำหรับ Mac หรือ Windows

**ใช้งาน:**
1. กด "+" สร้าง project ใหม่
2. ลาก folder `my-business-ai/` ของคุณเข้ามา
3. App จะถามว่า "อนุญาตให้ Claude เข้าถึงโฟลเดอร์นี้ไหม" → กด **Allow**
4. พิมพ์คำสั่งในช่อง chat ปกติ เช่น "ช่วยร่างอีเมลตอบลูกค้าที่ถามเรื่องราคา P1 หน่อย"

ไม่มี command line ไม่มี cd ไม่มี typo เหมือนคุยกับพนักงานคนหนึ่งใน LINE

### ทางที่ 2: VSCode Extension

**ใช้งาน:** เปิด folder ใน VSCode → กด `⌘+L` (Mac) หรือ `Ctrl+L` (Windows) เปิด chat panel

### ทางที่ 3: Terminal CLI (เฉพาะงาน automation)

Terminal เก็บไว้ใช้เฉพาะ 2 case: slash commands ที่ใช้บ่อย และ headless mode สั่งครั้งเดียว agent ทำต่อให้เอง

**สรุป — เจ้าของ SME ส่วนใหญ่ใช้แค่ Desktop App ก็พอ**

---

## 3 Claude Models — เลือกใช้ตัวไหนเมื่อไหร่

| Model | ความฉลาด | ความเร็ว | เหมาะกับ |
|---|---|---|---|
| **Opus 4.7** | 🧠🧠🧠🧠🧠 | 🐢 ช้า | ตัดสินใจเชิงกลยุทธ์ วิเคราะห์ลึก งาน creative ชั้นสูง |
| **Sonnet 4.6** | 🧠🧠🧠🧠 | 🐰 เร็ว | งานหลัก 80% ร่างเอกสาร ตอบอีเมล วิเคราะห์ข้อมูล |
| **Haiku 4.5** | 🧠🧠🧠 | ⚡ เร็วมาก | งาน batch ปริมาณเยอะ classify ข้อมูล สรุปสั้นๆ |

- **เริ่มต้น:** ตั้ง default เป็น **Sonnet 4.6** ครอบคลุม 80% ของงาน
- **งานคิดหนัก:** สลับเป็น **Opus 4.7** ตอนวางแผนกลยุทธ์ วิเคราะห์ดีลใหญ่
- **งานปริมาณเยอะ:** ใช้ **Haiku 4.5** ตอน batch classify อีเมลลูกค้า 1,000 ฉบับ

> มีข่าวลือใน X ช่วงนึงที่ผู้บริหาร Anthropic เอามาพูดติดตลกใน podcast หลายรอบ ที่บอกว่า Anthropic สร้าง model ตัวใหม่ (Mythos) ที่ฉลาดเกินกว่าที่ปล่อยให้คนทั่วไปใช้ได้ เลย "ขังลืม" เก็บไว้ใน server ของบริษัท
>
> ผมรับรองว่า **ตัวที่ขังลืมนั้นยังไม่ออกมาให้เราใช้** ตอนนี้พวกเราใช้ได้แค่ 3 ตัวข้างบนครับ สบายใจได้ครับ แต่ถ้ามันออกมาเมื่อไร ผมจะอัปเดตให้รู้ก่อนใครครับ กดฟอลผมได้ที่ TikTok หรือ IG ได้เลย
>
> (แต่จะบอกตามตรง Sonnet 4.6 ก็เก่งจน SME ส่วนใหญ่ไม่ได้ใช้ความสามารถของมันเต็ม 50% อยู่แล้ว ก่อนรอ Opus ตัวต่อไปหรือ "ตัวที่ขังลืม" ลองใช้ Sonnet ให้คุ้มก่อนครับ)

---

## CLAUDE.md — สมองกลางที่ทำให้ระบบฉลาด

นี่คือบทที่ขาดไม่ได้

ไฟล์เดียวที่ทำให้ AI Agent ของคุณ "รู้จักธุรกิจคุณ" คือไฟล์ชื่อ `CLAUDE.md` วางที่ root ของโฟลเดอร์ project

Claude Code อ่านมันก่อนทุกครั้งที่คุณเริ่ม session ใหม่ ก่อนอ่านอย่างอื่นเลย เป็น context ตั้งต้นที่ทุก agent มองเห็น

### ทำไมขาดไม่ได้

ไม่มี CLAUDE.md = AI Agent ของคุณกลายเป็น chatbot ทั่วไป

ใส่ CLAUDE.md ที่ดี = agent ร่างอีเมลที่ตรง pain point ลูกค้า ใช้ tone ตรงกับ brand referencing case study ที่คุณมีจริง output ที่ใช้ได้ทันที ไม่ต้องแก้

ความต่าง 80%

### โครงสร้าง CLAUDE.md ที่ใช้จริง

```markdown
# CLAUDE.md — [ชื่อบริษัทคุณ]

## Identity
- ธุรกิจคุณคือใคร ขายอะไร กลุ่มเป้าหมายคือใคร
- 3 ประโยค

## Mission
- เป้าหมายธุรกิจ 12 เดือนข้างหน้า ระบุเลข

## Brand Voice
- โทน: เป็นทางการ / กึ่งเป็นทางการ / กันเอง
- ใช้คำนี้: ...
- ห้ามใช้คำนี้: ...

## Forbidden Patterns
- ห้ามให้ส่วนลดเกิน X% โดยไม่ได้รับอนุญาต
- ห้ามใช้ภาษาอังกฤษล้วน

## Required Patterns
- ทุก output ต้องลงท้ายด้วย CTA ชัดเจน

## File Routing
- งานสำหรับลูกค้า → /clients/[ชื่อลูกค้า]/
- Content draft → /content/draft/

## Context Index
- Brand voice details: /brand/voice.md
- Customer persona: /brand/persona.md
```

### กฎเหล็ก: ห้ามเขียนยาวเกิน 200 บรรทัด

ผมเคยทำพลาดเรื่องนี้ตอนเริ่ม เขียน CLAUDE.md ยาว 4 หน้า ใส่ทุกอย่าง พอใช้จริง agent กลับ "ข้าม" ข้อมูลสำคัญ ผม debug 2 วันว่าทำไม agent ลืมกฎที่ใส่ไว้

สาเหตุ: เมื่อ context ยาวเกิน Claude จะ summarize ในใจ ข้อมูลสำคัญถูกบีบอัด

กฎที่ผมใช้ตอนนี้:
- CLAUDE.md ไม่เกิน 200 บรรทัด
- ใส่แต่สิ่งที่ "ถ้าไม่ใส่ AI จะทำผิด"
- รายละเอียดเพิ่มเติม → แยกไฟล์ → ใส่ pointer ใน Context Index

### โครงสร้างโฟลเดอร์ที่ทำงานคู่กับ CLAUDE.md

```
my-business-ai/
├── CLAUDE.md          ← สมอง กฎ กติกา
├── README.md          ← สรุปวิธีใช้ Kit
├── brand/             ← น้ำเสียง persona ICP
├── clients/           ← ข้อมูลลูกค้าแต่ละราย
├── content/           ← draft บทความ social email
├── reports/           ← รายงานรายเดือน
├── templates/         ← proposal invoice slide
├── .claude/           ← skills sub-agents
└── (5 setup files)
```

---

## Worksheet — Business Context Audit

ก่อนเรียก skill `skill-business-context.md` ตอบ 5 ส่วนนี้ในหัว/บนกระดาษก่อน จะทำให้ session interview เร็วขึ้น 3 เท่า

1. **ภาพรวมธุรกิจ:** ชื่อบริษัท พันธกิจ 1 ประโยค เป้าหมาย 12 เดือน ค่านิยมหลัก 3 ข้อ
2. **สินค้า/บริการ:** ลิสต์ทุกตัวที่ขายตอนนี้ ราคา กลุ่มเป้าหมาย
3. **ลูกค้าในอุดมคติ (ICP):** อุตสาหกรรม ขนาดบริษัท 3 pain points หลัก 3 objections ที่เจอบ่อย
4. **Brand Voice:** 3 คำที่อธิบาย brand ตัวอย่างประโยคที่ "ใช่" ที่ "ไม่ใช่"
5. **กฎการทำงาน:** กฎการให้ส่วนลด กฎการตอบลูกค้า

เมื่อตอบครบ → เปิด Claude Code → พิมพ์

```
@skill-business-context.md เริ่มสัมภาษณ์ผมเรื่องธุรกิจ
```

skill จะถามทีละส่วน output เป็น `CLAUDE.md` ฉบับสมบูรณ์ใน 15-20 นาที

---

## Phase 2 — เลือก Team Template (Owner หรือ Manager)

### Owner Starter Pack (6 agents)

| Agent | หน้าที่ |
|---|---|
| Lead Generation | ค้นหา + คัดกรองรายชื่อบริษัทเป้าหมาย |
| Sales Outreach | ร่างอีเมล/ข้อความเปิดการขายตาม persona |
| Proposal Writing | สร้าง draft ใบเสนอราคาจาก template |
| Financial Analyst | วิเคราะห์ P&L cash flow เบื้องต้น |
| Strategy | วิเคราะห์คู่แข่ง brainstorm ไอเดีย |
| Executive Assistant | จัดตารางนัด สรุปประชุม เขียนเมล internal |

### Manager Starter Pack (4 agents)

| Agent | หน้าที่ |
|---|---|
| Performance Report | สรุปผลงานทีมรายสัปดาห์/เดือน |
| Internal Comms | ร่างประกาศ เตรียม slide ประชุม |
| Onboarding | สร้าง checklist + brief สำหรับพนักงานใหม่ |
| Process Improvement | วิเคราะห์ workflow เสนอแนวทาง optimize |

- 80% ของวันคุณคุยลูกค้า + คิดเรื่องยอด → **Owner Pack**
- 80% ของวันคุณประชุมทีม + ดูรายงาน → **Manager Pack**

---

## Anatomy ของ Agent File (5 ส่วน)

Agent แต่ละตัวคือไฟล์ markdown 1 ไฟล์ ชื่อตามหน้าที่ เช่น `sales-outreach-agent.md`

### 1. Identity

- Role: ตำแหน่ง เช่น "ผู้ช่วยทีมขาย B2B เชี่ยวชาญการเขียน cold outreach"
- Personality: 3 คำ เช่น "เป็นมืออาชีพ ตรงไปตรงมา เน้นข้อมูล"
- Core Objective: เป้าหมายเดียว 1 ประโยควัดผลได้

### 2. Triggers

- คำสั่งจากผู้ใช้ เช่น "เมื่อพิมพ์ /draft-outreach + ชื่อลูกค้า"
- ข้อมูลใหม่ เช่น "เมื่อมี row ใหม่ในไฟล์ leads.csv"

### 3. Workflow (หัวใจ)

ขั้นตอน step-by-step ที่ละเอียด ยิ่งละเอียด ผลยิ่งแม่น

### 4. Output

- Format: text markdown JSON
- Structure: ส่วนประกอบที่ต้องมี
- Worked Example: ใส่ตัวอย่างผลลัพธ์ที่ "perfect"

### 5. Constraints

- "ห้ามเสนอส่วนลดในอีเมลฉบับแรก"
- "ความยาว ≤ 200 คำ"
- "ถ้าข้อมูลไม่พอ ให้ถามผู้ใช้กลับ อย่าเดา"

---

## Run + Test + Debug Patterns

### Run agent ครั้งแรกใน Claude Desktop App

```
@sales-outreach-agent ร่างอีเมลสำหรับลูกค้าชื่อ [ชื่อบริษัท] ในอุตสาหกรรม [อุตสาหกรรม]
```

Claude จะอ่าน CLAUDE.md → อ่าน `agents/sales-outreach-agent.md` → ทำงานตาม Workflow → ส่ง output มาในแชท

### 3 อาการที่จะเจอช่วงสัปดาห์แรก + วิธีแก้

**อาการ A: Agent ลืม brand voice**
- ตรวจ CLAUDE.md ≤ 200 บรรทัด
- ใส่ pointer ชัดใน Context Index
- ใน agent file Constraints ระบุ: "ห้ามใช้คำที่อยู่ใน brand/voice.md ส่วน Forbidden"

**อาการ B: Output format ไม่ตรง**
- ใส่ Worked Example ที่ตรงตาม Format ที่ต้องการ ละเอียด ใส่ทุก field agent จะ pattern-match จาก example นี้

**อาการ C: Agent เริ่มเดาข้อมูลที่ไม่มี**
- ใน agent Constraints เพิ่ม: "ถ้าข้อมูลไม่ครบ ห้ามเดา ให้ถามผู้ใช้กลับ"

### Debug log

ทุกครั้งที่เจอ bug + แก้สำเร็จ เขียนใส่ไฟล์ `debug-log.md` ที่ root ของ project 3 เดือนผ่านไปคุณจะมี knowledge base 30-50 entry agent ตัวใหม่ที่สร้างจะอ่านไฟล์นี้แล้วเลี่ยง bug ที่คุณเคยเจอได้เลย

---

> **อยากให้ผมเข้าไปติดตั้งให้ทีมคุณภายใน 1 วัน?**
>
> Workshop In-house — ผม + ทีมคุณ build agent system สำหรับธุรกิจคุณโดยเฉพาะ จบวันมี 1-2 agent ใช้งานจริง + 30-day async LINE support
>
> [ดูรายละเอียด → punnattapatch.com/services/ai-workshop](https://punnattapatch.com/services/ai-workshop)

---

จบ Part 2 ใน Part 3 เราจะไปต่อที่ Phase 3 (Operate) + Phase 4 (Scale) 3 วิธีใช้ทีม AI debug pattern ขั้นสูง เมื่อไหร่ควรขยับไปใช้ n8n automation
