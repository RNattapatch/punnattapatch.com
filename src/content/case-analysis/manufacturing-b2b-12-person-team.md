---
title: "Manufacturing B2B: ทีม 12 คน เพิ่ม Pipeline Velocity (ความเร็วในการปิดดีล) +30% ลด Discount Rate 50% ใน 6 เดือน"
description: "Case จริง: Manufacturing B2B ทีม 12 คน — pipeline velocity (ความเร็วในการปิดดีล) +30%, discount rate 15%→7%, inquiry response 2วัน→15นาที, margin (กำไรขั้นต้น) +15%, saving ฿3.8M/ปี"
lang: th
published: 2026-04-18
draft: false
tags: [case-study, manufacturing, b2b, monthly-consulting, pipeline]
industry: "Manufacturing / B2B Distribution"
companySize: "12-person sales team + 20 production + ownership"
outcome: "Pipeline velocity +30%, Discount rate 15% → 7%, Margin +15%, Inquiry response 2 days → 15 min"
anonymized: true
---

ลูกค้ารายนี้เป็นผู้ผลิตสินค้า B2B (อุตสาหกรรม Manufacturing) ส่งสินค้าให้ dealer + end customer โดยตรง รายได้ปีละ ~฿60M ทีมขาย 12 คน + ฝ่ายผลิต 20 คน

**ชื่อและรายละเอียดธุรกิจสงวนตามคำขอของลูกค้า**

## ปัญหาที่เจอก่อนเริ่มงาน

เจ้าของเคยจ่าย Enterprise CRM SaaS ฿36,000/เดือน ใช้ 6 เดือนแล้วพบว่าใช้ feature จริงแค่ 20% ทีมขายเกลียดเพราะ UX หนัก + ทำให้งานช้าลง

**4 ปัญหาหลัก:**

- Response time ต่อ inquiry ลูกค้า: เฉลี่ย 2 วัน (ทีมต้องดึงข้อมูลจาก ERP + ราคา + stock มาประมวลเอง)
- Discount rate: 15% ของยอดขาย (ทีมใช้ส่วนลดปิดดีล เพราะ response ช้า ลูกค้าเริ่มคุยเจ้าอื่น)
- Pipeline velocity (ความเร็วในการปิดดีล): ดีล stage เฉลี่ย stay 45 วัน (มนุษย์ follow-up (ติดตามลูกค้า) ไม่ทัน)
- เจ้าของทำงาน 14 ชม./วัน ไม่มี weekend

**จุดชนวน:** เจ้าของขอคำปรึกษาเพราะรู้สึก "ขายระบบ CRM เจ้าดังออกไปแล้ว แต่ปัญหายังอยู่เหมือนเดิม"

## สิ่งที่ผมทำให้ (6 เดือน Monthly Consulting)

### เดือน 1: Audit (ตรวจสอบงาน) + Stack Migration

- Audit ทุก workflow (ขั้นตอนการทำงาน) ทีมขายทำเอง — ลิสต์ 18 งานซ้ำๆ
- Export (ส่งออกข้อมูล) ข้อมูลลูกค้าจาก CRM SaaS เดิมเป็น CSV → migrate ไป Google Sheets + Apps Script
- Cancel CRM subscription (saving ฿36,000/เดือน เริ่มทันที)

### เดือน 2-3: Build Core AI Workflows

**Workflow 1: Inquiry Response Agent**
- Email inquiry มา → AI ดึงข้อมูลสินค้า + ราคาล่าสุด + stock จาก ERP
- Generate response draft ใน 5 นาที → sales ตรวจก่อนส่ง 10 นาที
- Response time: 2 วัน → 15 นาที

**Workflow 2: Proposal (ใบเสนอราคา) Auto-Generator**
- ลูกค้ายืนยันสเปค → AI create proposal.docx ตาม template
- Sales ตรวจ + ส่ง ใน 20 นาที
- ก่อน: 2-3 ชั่วโมง/ใบ

**Workflow 3: Pipeline Monitor + Auto Follow-up**
- ทุกดีลที่ stay > 7 วัน → AI ส่ง LINE reminder + draft message
- Sales click-to-send
- ลด stale deal 70%

### เดือน 4: Sales Training 2 Days

- Value-Based Selling workshop เต็มทีม 12 คน
- Focus: discovery + objection handling (การรับมือข้อโต้แย้ง) ไม่พึ่งส่วนลด
- Role-play 3 รอบด้วยเคสจริง
- Post-training KPI (ตัววัดผลงาน) tracking 30 วัน

### เดือน 5-6: KPI Dashboard + Scale (ขยายผล)

- Real-time KPI dashboard (หน้าจอสรุปข้อมูล)
- Commission structure ใหม่ 3-tier (ขั้นคอมมิชชั่น) (base + variable tier + team bonus)
- Train owner ใช้ dashboard เอง
- Handover (ส่งมอบระบบ) documentation 40+ หน้า

## ผลลัพธ์หลัง 6 เดือน

### Sales Performance

| Metric | ก่อน | หลัง | Change |
|---|---|---|---|
| Inquiry response time | 2 วัน | 15 นาที | -99% |
| Pipeline velocity (ความเร็วในการปิดดีล) (stage duration) | 45 วัน | 31 วัน | -31% |
| Discount rate | 15% | 7% | -53% |
| Closing rate (อัตราปิดการขาย) | 22% | 31% | +41% |
| Avg deal size | ฿240k | ฿310k | +29% |
| Revenue (YoY same quarter) | baseline (ค่าตั้งต้น) | +28% | — |

### Cost Savings

| Cost | ก่อน | หลัง | Saving/ปี |
|---|---|---|---|
| CRM SaaS | ฿36,000/เดือน | 0 | ฿432,000 |
| Time saved (12 sales × 8 hr/wk × 4 wk) | — | — | ~฿1,900,000 equivalent |
| Proposal generation cost | ฿5,000/proposal × 30 = ฿150k/เดือน | ฿800/proposal × 30 = ฿24k | ฿1,512,000 |
| **Total yearly saving** | — | — | **฿3.8M+** |

### Margin + Owner Well-being

- Margin (กำไรขั้นต้น) per deal: +15% (discount rate ลดเป็นหลัก)
- Owner working hours: 14 hr/day → 8-9 hr/day
- Weekend: ได้กลับ 4 วัน/เดือน เทียบกับ 0 ก่อนหน้า
- Team turnover: 0 ใน 6 เดือน (ก่อนหน้าคนเก่ง 2 คนเดือนก่อนลาออก — วางแผนจะไป)

### คำบอกเล่าจากลูกค้า (anonymized)

> "ผมเคยเสียเงินกับ CRM SaaS ไป 6 เดือนโดยที่ปัญหายังอยู่ พอเปลี่ยนมาทำกับปัน 6 เดือน ปัญหาหลัก 4 ข้อหายหมด แถมได้ระบบที่ทีม IT ผมดูแลต่อเองได้ ไม่ต้องจ่ายใครรายเดือนอีก"

## Stack (ชุดเครื่องมือ) ที่ใช้ (ลูกค้าดูแลต่อเองได้)

- **Google Sheets + Apps Script** — ทั้ง data layer + dashboard + commission calc
- **n8n self-host** บน VPS ฿500/เดือน — Workflow orchestration
- **Claude API ผ่าน OpenRouter** — AI calls
- **LINE Messaging API + Gmail API** — Notification + comm channels
- **Google Drive** — Document storage (proposals, SOPs/ขั้นตอนปฏิบัติงาน)

**ไม่ใช้:** Enterprise CRM, BI license, proprietary AI platform, monthly retainer (สัญญาจ่ายรายเดือน)

## Total Investment vs ROI (ผลตอบแทนการลงทุน)

- **Investment:**
  - AI Workshop + Consult 30 วัน ฿44,900 (Bundle/แพ็คเกจรวม)
  - Monthly Consulting 6 เดือน × ฿30,000 = ฿180,000
  - Sale Training Bundle ฿50,000
  - Total: **฿280,000**
- **Tool cost/เดือน:** ฿800-1,500
- **Yearly saving:** ฿3.8M+
- **ROI:** ~13x ในปีแรก
- **Payback period:** < 1 เดือน

## Lessons learned ที่ผมเอามา apply กับลูกค้ารายอื่น

**1. เริ่มจากงานที่ทีมเกลียดที่สุด ไม่ใช่งานที่ AI ทำได้ง่ายที่สุด**
ทีมรายนี้เกลียดงานทำ proposal ทีสุด → เริ่มจากตัวนั้น = buy-in จากทีมสูงสุด

**2. Migrate ออกจาก SaaS ที่มีภาวะ lock-in (ผูกติดกับ vendor) ก่อน**
ถ้าทีมยังติดอยู่กับ SaaS แบบนั้น การ build workflow ใหม่จะซ้อนกันสับสน ต้อง cancel SaaS เดิมก่อน migrate data

**3. Train เจ้าของให้ใช้ dashboard เอง**
ไม่ใช่แค่ train ทีม — ถ้าเจ้าของดู dashboard เอง จะตัดสินใจเร็ว ไม่ต้องรอรายงาน

## อ่านต่อ

- [Pillar: AI Transformation for Sales](/insights/ai-transformation-sales) — 5 ขั้นที่ลูกค้ารายนี้ผ่าน
- [Pillar: Is your org using AI for real](/insights/is-your-org-using-ai-for-real) — 10 คำถามที่ลูกค้ารายนี้เคยตอบ "ใช่" 8 ข้อ (ตอนเริ่ม) และเหลือ 1 ข้อ (ตอนจบ)
- [Commission structure ทีม 10 คน](/faq) — formula ที่ใช้กับลูกค้ารายนี้
- [Workshop vs Consulting ต่างกันยังไง](/faq) — ลูกค้ารายนี้เลือก monthly consulting หลังลอง workshop

## อยากได้ผลลัพธ์แบบนี้ไหม?

- [Sales System Sprint ฿65,000](/services/sales-system-sprint) — 1 เดือน compact version ของเคสนี้ (เหมาะทีม 10-15 คน)
- [Advance AI & Business Automation ฿24,900](/services/ai-workshop) — Starting point ของลูกค้ารายนี้ (Bundle Consult 30 วัน ฿44,900)
- [Sale Training Bundle ฿50,000](/services/sale-training-bundle) — Module ที่ 4 ของเคสนี้
- [กรอกฟอร์ม 3 นาที](/intake-form) — ผมอ่านแล้วบอกว่าเคสคุณ match กับลูกค้ารายนี้แค่ไหน + ควร start ตรงไหน
