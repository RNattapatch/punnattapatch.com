---
title: "Forklift Distributor: ทีม 5 คน ลดเวลา Report 2 ชม. → 15 นาที + Software Cost ลด 97%"
description: "Case จริง: ผู้จัดจำหน่าย Forklift ทีม 5 คน ใช้ AI Workshop + Monthly Consulting — ยอด +30%, ประหยัดค่า software ฿97k/เดือน, report 2ชม.→15นาที, ROI 6.9x ปีแรก"
lang: th
published: 2026-04-18
draft: false
tags: [case-study, forklift, distribution, ai-workflow, sme]
industry: "Heavy Equipment / Forklift Distribution"
companySize: "5-person sales team + owner"
outcome: "Sales +30% in Q1, Software cost -97%, Report time 2hr → 15min"
anonymized: true
---

ลูกค้ารายนี้เป็นผู้จัดจำหน่ายรถ Forklift ในไทย รายได้ปีละ ~฿30M ทีมขาย 5 คน + เจ้าของคุมเอง

**ชื่อและรายละเอียดธุรกิจสงวนตามคำขอของลูกค้า**

## ปัญหาที่เจอก่อนเริ่มงาน

เจ้าของทำธุรกิจมา 8+ ปี ยอดขายโตปีละ 10-15% แต่ margin ลดลง และเจ้าของเหนื่อยขึ้นเรื่อยๆ

**3 ปัญหาหลัก:**

- ทีมขาย 5 คนใช้เวลา 2 ชั่วโมง/สัปดาห์ ทำ weekly report ส่งเจ้าของ = 40 ชั่วโมง/เดือนของเวลาเซลล์ที่หายไป
- Software ค่าใช้จ่ายรวมเดือนละ ฿100,000+ (CRM SaaS รายเดือน + BI tool + automation platform) ใช้จริงแค่ 20%
- Owner ตัดสินใจทุกเรื่อง — commission ปลายเดือนคำนวณมือ ผิดบ่อย ทีมไม่ trust ตัวเลข

**จุดชนวนที่มา consult ผม:** ทีมขายคนเก่ง 1 คนลาออกหลังเห็น commission เดือนที่แล้วคำนวณผิด — เจ้าของรู้ว่าระบบที่ใช้อยู่มัน "หมดเวลา"

## สิ่งที่ผมทำให้ (3 เดือน)

### เดือน 1: AI Day Workshop + Initial Sprint

**Session 1 (1 วัน):** AI Day Workshop ฿30,000
- ทีม 5 คน + เจ้าของ เข้าเต็มวัน 6 ชั่วโมง
- Build AI workflow แรก: weekly report automation
- Output: สคริปต์ที่ดึงข้อมูลจาก Google Sheets → generate summary → ส่ง LINE เจ้าของทุกเช้าจันทร์ 8:00
- Measured outcome ในห้อง: 2 ชั่วโมง → 15 นาที (เวลาที่ senior sales rep ใช้)

### เดือน 2: Sales System Sprint

**Session 2-5 (รายสัปดาห์):** ฿65,000
- วาง KPI dashboard (Google Sheets + Apps Script) ทีมเห็นตัวเองและเพื่อนร่วมทีม real-time
- ออกแบบ Commission calculator ใหม่ — tier-based auto-compute
  - 80-100% quota = 3%
  - 100-120% = 5%
  - 120%+ = 8%
- Build n8n workflow 2 ตัว: lead qualifier + proposal generator
- Train team lead + IT ดูแลระบบต่อเอง

### เดือน 3: Handover + Coaching

**Session 6-8 (รายสัปดาห์):** รวมใน sprint
- Train ทีมใช้ tool เองโดยไม่ต้องผม
- Fix bug หน้างาน + iterate
- Weekly coaching 1 ชั่วโมง

## ผลลัพธ์หลัง 3 เดือน

### เวลาที่ประหยัด

| งาน | ก่อน | หลัง | ประหยัด/เดือน |
|---|---|---|---|
| Weekly report | 2 hr × 4 ทีม = 40 hr/เดือน | 15 นาที × 4 ทีม = 5 hr/เดือน | 35 ชั่วโมง |
| Commission calc | 4 hr (เจ้าของ) × 1 ครั้ง | 0 hr (auto) | 4 ชั่วโมง |
| Proposal generate | 2 hr × 8 ใบ = 16 hr | 15 นาที × 8 = 2 hr | 14 ชั่วโมง |
| **Total** | 60 hr/เดือน | 7 hr/เดือน | **53 ชั่วโมง/เดือน** |

53 ชั่วโมง × ฿500/ชั่วโมง (cost ทีมขาย) = **฿26,500/เดือน ที่กลับมาเป็นเวลาขายล้วน**

### Cost ที่ลด

| Cost item | ก่อน | หลัง | ประหยัด/ปี |
|---|---|---|---|
| CRM SaaS | ฿15,000/เดือน | ย้ายไป Sheets + Apps Script | ฿180,000 |
| BI enterprise license | ฿7,500/เดือน | Sheets native chart | ฿90,000 |
| Automation SaaS | ฿5,000/เดือน | n8n self-host | ฿60,000 |
| Manual commission error | ~฿10,000/ปี | 0 (auto calc) | ฿10,000 |
| **Total** | ฿100,000+/เดือน + error | ฿3,000/เดือน (n8n cloud) | **฿340,000/ปี** |

### Sales performance

- **Q1 ต่อไปหลัง handover:** ยอดขาย +30% YoY
- **Closing rate:** 18% → 25% (เซลล์มีเวลาไป follow up มากขึ้น)
- **Discount rate:** 15% → 8% (commission tier ใหม่จูงใจปิดราคาเต็ม)
- **Team retention:** 0 turnover ใน 6 เดือนหลัง (ก่อนหน้านี้เซลล์เก่งลาออก 1 คน)

### คำ feedback จากเจ้าของ (quoted)

> "เซลล์เลิกใช้ส่วนลดปิดดีล เปลี่ยนมาคุยเรื่องคุณค่าที่ลูกค้าได้ ส่วนงาน report ที่เคยทำมือ ตอนนี้ AI ทำให้ พนักงานเลยมีเวลาคิดวิธีใหม่ๆ ให้ลูกค้ามากขึ้น"

## Stack ที่ใช้ (maintain ต่อเองได้หลังจบ)

- **Google Sheets + Apps Script** — Data layer + automation logic (ทีมใช้เป็นอยู่แล้ว)
- **n8n cloud** ฿700/เดือน — Workflow orchestration
- **Claude API ผ่าน OpenRouter** — AI for report generation + proposal
- **LINE Messaging API** — Notification channel (ทีมคุ้นเคย)

**ไม่ใช้:** Enterprise CRM SaaS, BI platform license, custom AI training, proprietary automation SaaS

## Total investment vs ROI

- **Investment:** ฿95,000 (Workshop ฿30k + Sprint ฿65k) + ฿3,000/เดือน ค่า tool
- **Saving per year:** ฿340,000 (software) + ฿318,000 (time × 12 mo) = **฿658,000**
- **ROI: 6.9x ในปีแรก**
- **Payback period: 1.7 เดือน**

## อ่านต่อ

- [Pillar: AI Transformation for Sales](/insights/ai-transformation-sales) — 5 ขั้นที่ client นี้ผ่าน
- [Pillar: Agentic AI SME Start](/insights/agentic-ai-sme-thailand-start) — วิธีเริ่ม Agent ตัวแรก (เหมือนที่เริ่มกับ client นี้)
- [Commission structure ทีม 10 คน](/faq) — 3-tier formula ที่ใช้วางให้ client นี้
- [KPI dashboard บน Google Sheets](/faq) — ตัว dashboard ที่ build ให้

## อยากได้ผลลัพธ์แบบนี้ไหม?

- [Advance AI Workshop ฿24,900](/services/ai-workshop) — 1 วัน build automation ตัวแรก
- [Sales System Sprint ฿65,000](/services/sales-system-sprint) — 1 เดือน วางระบบครบ (KPI + Commission + workflow)
- [BOSI DNA Quiz](/bosi-dna-quiz) — รู้ DNA ทีมก่อนเริ่ม
- [กรอกฟอร์ม 3 นาที](/intake-form) — ผมอ่านแล้วบอกว่าเคสคุณเหมือน/ต่างจาก client นี้ยังไง
