---
title: "เพิ่มพนักงานขายแล้วยอดจะเพิ่มไหม"
description: "เจ้าของ SME คิดว่าคนเพิ่ม = ยอดเพิ่ม แต่จริงๆ ต้อง demand เพิ่มด้วย บทความนี้มี 3 เงื่อนไขที่การเพิ่มคนได้ผล + วิธีคำนวณก่อนตัดสินใจ"
question: "เพิ่มพนักงานขายแล้วยอดจะเพิ่มไหม"
answerSummary: "ไม่เสมอไป คนเพิ่มจะทำให้ยอดเพิ่มได้ใน 3 เงื่อนไข (1) มี lead ใหม่เข้ามาเกิน capacity ทีมเดิม (2) ทีมเดิม overload จน service ตกและลูกค้าหาย (3) ต้องการขยายช่องทางใหม่ที่ไม่มีคนดูแล ถ้าไม่ใช่ 3 ข้อนี้ เพิ่มคนคือเพิ่ม cost ไม่เพิ่ม revenue"
lang: th
published: 2026-04-20
draft: false
tags: [faq, hiring, sales-team, scaling, sme]
---

เจ้าของร้านรายได้ ฿190M ถามผมว่า "จ้าง admin ขายเพิ่ม 2 คน ยอดจะเพิ่มไหม" ผมถามกลับว่า "ตอนนี้ 1 คนดูแลลูกค้ากี่ราย" เธอตอบ "30-40 รายต่อคน" ผมถามต่อ "ถ้าเพิ่มคน จำนวนลูกค้าจะเพิ่มเองไหม" เงียบ. ตรงนี้แหละคือจุดที่เจ้าของ SME ส่วนใหญ่ตัดสินใจผิด

## คำตอบสั้น 3 เงื่อนไข

การเพิ่มคนจะทำให้ยอดเพิ่มเฉพาะเมื่อเข้า 1 ใน 3 เงื่อนไขนี้

1. มี lead ใหม่เข้ามาเกิน capacity ทีมเดิม (ดูจากจำนวน inbound lead ต่อเดือน vs capacity ที่ทีมดูแลไหว)
2. ทีมเดิม overload จนพลาด service (response time เกิน 30 นาที, follow-up ข้าม deal, NPS ตก)
3. ต้องการขยายช่องทางใหม่ที่ไม่มีคนดูแล (เปิด segment ใหม่ เปิดจังหวัดใหม่ ที่ทีมเดิมไม่มีเวลาเจาะ)

ถ้าไม่ใช่ 3 ข้อนี้ การเพิ่ม 1 คนคือเพิ่ม cost ประมาณ ฿480,000-฿960,000/ปี (เงินเดือน + commission + overhead) แต่ revenue ไม่ได้ขึ้นตาม

## วิธีเช็กก่อนตัดสินใจ 4 ตัวเลข

| ตัวเลข | วิธีหา | ต้องมีค่าเท่าไหร่ถึงควรเพิ่มคน |
|---|---|---|
| Inbound lead/เดือน | นับจาก CRM หรือ inbox | ≥ 30% เกิน capacity ทีมปัจจุบัน |
| Response time เฉลี่ย | วัด 1 สัปดาห์จาก Line/email | ≥ 30 นาที = overload |
| Follow-up rate | นับ deal ที่ไม่มี touch ใน 7 วัน | ≥ 20% = ทีมพลาด |
| Revenue per rep | revenue 12 เดือน ÷ จำนวน rep | ถ้าตกลงเรื่อยๆ = เป็นสัญญาณของปัญหา productivity ควรแก้ที่จุดนี้ก่อนเพิ่มคน |

Client luxury ที่ยอดตกจาก ฿190M ลง ฿150M ตอนเข้าไปเจอว่า response time เฉลี่ย 45 นาที, follow-up rate มี deal หายไป 30% การแก้ไม่ใช่เพิ่มคน แต่เป็น fix system ก่อน

## 3 ทางเลือกก่อนเพิ่มคน

ถ้าตัวเลขข้างบนไม่เข้า threshold ลองทำ 3 อย่างนี้ก่อน

### 1. Automate งาน admin ที่กินเวลาเซลล์

Client ผมเฉลี่ยทีมขายใช้เวลา 35-45% ไปกับ admin (update sheet, ทำรายงาน, forward message) ถ้า automate ได้ดีๆ ทีมเดิมมี capacity เพิ่ม 25-40% โดยไม่ต้องจ้างคน

เครื่องมือที่ใช้จริง
- n8n: auto-sync order → sheet, แจ้งเตือน deal stale 7 วัน
- Apps Script: auto-fill proposal template จาก CRM
- Claude API: summarize conversation log, draft follow-up

### 2. ปรับ process ตอบลูกค้า

Client รายนึงลด response time จาก 45 นาที เหลือ 12 นาทีด้วยแค่การสร้าง template 8 แบบ + assign rotation ใน Line OA ไม่จ้างเพิ่มเลย conversion rate ขึ้น 7%

### 3. Fire underperformer + rehire

ถ้ามีเซลล์ 6 คนแต่ 2 คน performance ต่ำกว่า 50% ของ median การ replace 2 คนนี้ได้ผลมากกว่าเพิ่มคนที่ 7, 8 เพราะ cost เท่าเดิม productivity ขึ้น

## เมื่อไหร่ถึงควรเพิ่มคน: ตัวอย่างจริง

Client forklift distributor ทีม 5 คน. Inbound lead เฉลี่ย 85 คน/เดือน ทีมดูแลไหวแค่ 60 คน ลูกค้า 25 คน/เดือนไม่ได้ follow-up ภายใน 48 ชม. ซึ่งเข้า threshold ชัด

การเพิ่มคนที่ 6 ผ่าน process นี้
1. เตรียม onboarding doc + script ล่วงหน้า 2 สัปดาห์
2. คนใหม่รับ lead "ล่างสุด" ที่ทีมเดิมดูไม่ทัน
3. วัดผล 90 วัน: ถ้า revenue per rep รวมทีมขึ้น ≥ 15% แปลว่าการเพิ่มคนได้ผล

ผลจริงหลัง 4 เดือน: revenue เพิ่ม 22% ทีมเดิม overload ลดลง NPS จาก 45 → 68 เคสเต็มอ่านที่ [Forklift Distributor 5 คน](/case-studies/forklift-distributor-5-person-team)

## สัญญาณที่บอกว่า "อย่าเพิ่มคน"

- ทีมเดิมยังมีเวลาว่าง 2-3 ชม./วัน
- Conversion rate ต่ำกว่า 12% (เพิ่มคนไปก็เปลืองเปล่าถ้าทีมขายยังปิดดีลไม่เก่ง)
- ไม่มี CRM หรือ pipeline tracking (เพิ่มคนไปก็หลง)
- ไม่มี manager คอยโค้ช (เซลล์ใหม่ไม่มี onboard จะ burn out ใน 3-4 เดือน)

แก้ 4 ข้อนี้ก่อน ค่อยพิจารณาเพิ่มคน

## Package ที่เกี่ยวข้อง

- [Sales System Sprint ฿65,000](/services/sales-system-sprint): 1 เดือนวางระบบ + CRM + KPI ก่อนตัดสินใจเพิ่มคน
- [AI Day Workshop ฿30,000](/services/ai-workshop): automate งาน admin ให้ทีมเดิมมี capacity เพิ่มใน 1 วัน

อ่านต่อ: [ต้องวางระบบขายก่อนจ้างเซลล์ไหม](/faq/sales-system-before-hiring-sales-team) | [KPI dashboard ทีมขาย](/faq/sales-kpi-dashboard-google-sheets) | [คู่มือสร้างทีมขาย B2B](/pillar/build-b2b-sales-team-sme-thailand)