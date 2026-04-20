---
title: "KPI dashboard ทีมขายทำบน Google Sheets ได้ไหม ต้องใช้ tool แพงหรือเปล่า"
description: "ทำ KPI dashboard ทีมขายบน Google Sheets + Apps Script ได้ครบ ไม่ต้องซื้อ enterprise BI license — auto-update จาก CRM หรือ input form แสดงยอดขาย / pipeline / conversion รายบุคคล"
question: "KPI dashboard ทีมขายทำบน Google Sheets ได้ไหม ต้องใช้ tool แพงหรือเปล่า"
answerSummary: "ทำได้ครบบน Google Sheets + Apps Script ไม่ต้องซื้อ enterprise BI license (ราคา ฿2,500-3,500/user/เดือน) ผมวางระบบให้ client ส่วนใหญ่ใช้แค่ Sheets + trigger ดึง data จาก CRM หรือ form ทุก 15 นาที แสดงยอด, pipeline, conversion rate, commission ต่อคน"
lang: th
published: 2026-04-18
draft: false
tags: [faq, kpi, dashboard, google-sheets, apps-script]
---

ได้ครับ ผมทำ KPI dashboard บน Google Sheets ให้ client ทุกราย ไม่จำเป็นต้องซื้อ enterprise BI platform license เพิ่ม

## สิ่งที่ Sheets + Apps Script ทำได้

- ตั้ง trigger ดึงข้อมูลจาก CRM, n8n webhook หรือ form input ได้เกือบ real-time รีเฟรชทุก 15 นาที
- สร้างกราฟและแผนภูมิได้หลากหลายด้วย native chart ของ Sheets (bar, line, sparkline) เพียงพอสำหรับ 95% ของ use case ทั่วไป
- เจาะดูข้อมูลเชิงลึกด้วย filter ตามพนักงานขาย, เดือน หรือประเภทสินค้า
- ส่งการแจ้งเตือนอัตโนมัติผ่าน LINE Messaging API ด้วย Apps Script เมื่อ pipeline ต่ำกว่าเป้า
- คำนวณค่าคอมมิชชั่นอัตโนมัติตาม tier ที่บริษัทตั้งไว้

## ตัวอย่าง dashboard ที่ผม build ให้ client

**บริษัทจัดจำหน่ายรถโฟล์คลิฟท์ (ทีม 5 คน, รายได้ ~฿30 ล้าน/ปี):**

Sheet 1: Input (ให้พนักงานขายบันทึก deal ที่ปิดได้ในแต่ละวัน)
Sheet 2: Dashboard (สร้างขึ้นอัตโนมัติ)

- ยอดขายรายเดือนของแต่ละคนเทียบกับเป้า (bar chart)
- มูลค่า pipeline ในแต่ละ stage (funnel chart)
- Conversion rate แยกตามช่องทาง (TikTok / Google / referral)
- ตารางค่าคอมมิชชั่นของพนักงานแต่ละคนประจำเดือน
- กราฟแนวโน้มขนาด deal เฉลี่ยย้อนหลัง 6 เดือน (line chart)

ทั้งหมดสร้างบน Google Sheets รุ่นฟรีที่มากับ Google Workspace ที่บริษัทใช้งานอยู่แล้ว

## ทำไมไม่แนะนำ enterprise BI platform สำหรับ SME

- License enterprise BI platform ค่าใช้จ่ายเริ่มต้น $10-75 per user ต่อเดือน (฿350-2,500+ ต่อคน) — ทีม 10 คนคือ ฿3,500-25,000+ ต่อเดือน
- ทีมต้องเสียเวลาเรียน query language เฉพาะ platform นั้น ใหม่ทั้งหมด
- ฝ่าย IT ต้องดูแล data pipeline เอง หรือต้องจ้าง BI engineer
- Vendor lock-in — export data ออกจาก platform ไปใช้ที่อื่นยาก

สำหรับ SME รายได้ ฿30-200 ล้าน/ปี ฟีเจอร์ 90%+ ของ enterprise BI tool ไม่จำเป็น และ Google Sheets ทำงานส่วนใหญ่แทนได้

## ข้อจำกัดของ Sheets ที่ต้องรู้

- Google Sheets มีข้อจำกัด 10 ล้าน cell ต่อ sheet เพียงพอสำหรับ SME ทั่วไป 5-10 ปี
- หากสูตรซับซ้อนเกินไปอาจทำให้ sheet ช้า แก้ได้ด้วย Apps Script เข้ามา pre-process
- ไม่รองรับ real-time streaming โดยตรง (รีเฟรชเร็วสุดทุก 15 นาที) ถ้าต้องการ real-time ใช้ n8n + webhook ได้

## Package ที่เกี่ยวข้อง

- [Advance AI Workshop ฿24,900](/services/ai-workshop) — สร้าง KPI dashboard + 1 automation ในวันเดียว
- [Sales System Sprint ฿65,000](/services/sales-system-sprint) — วางระบบ KPI + Commission + automation ครบ 1 เดือน

ทั้ง 2 package ส่งมอบ template Sheets ที่ลูกค้า copy ไปใช้ต่อเองได้ + documentation + screen recording
