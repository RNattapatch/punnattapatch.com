---
title: "KPI dashboard ทีมขายทำบน Google Sheets ได้ไหม ต้องใช้ tool แพงหรือเปล่า"
description: "ทำ KPI dashboard ทีมขายบน Google Sheets + Apps Script ได้ครบ ไม่ต้องซื้อ Power BI หรือ Tableau — auto-update จาก CRM หรือ input form แสดงยอดขาย / pipeline / conversion รายบุคคล"
question: "KPI dashboard ทีมขายทำบน Google Sheets ได้ไหม ต้องใช้ tool แพงหรือเปล่า"
answerSummary: "ทำได้ครบบน Google Sheets + Apps Script ไม่ต้อง Power BI หรือ Tableau (฿7,000+/เดือน) ผมวางระบบให้ client ส่วนใหญ่ใช้แค่ Sheets + trigger ดึง data จาก CRM หรือ form ทุก 15 นาที แสดง yod, pipeline, conversion rate, commission ต่อคน"
lang: th
published: 2026-04-18
draft: false
tags: [faq, kpi, dashboard, google-sheets, apps-script]
---

ได้ครับ ผมทำ KPI dashboard บน Google Sheets ให้ client ทุกราย ไม่จำเป็นต้องซื้อ license Power BI, Tableau, หรือ Looker เพิ่ม

## สิ่งที่ Sheets + Apps Script ทำได้

- ตั้ง trigger ดึงข้อมูลจาก CRM, n8n webhook หรือ form input ได้เกือบ real-time โดยจะรีเฟรชข้อมูลทุก 15 นาที
- สร้างกราฟและแผนภูมิได้หลากหลายด้วย chart สำเร็จรูปของ Sheets (bar, line, sparkline) ซึ่งเพียงพอสำหรับ 95% ของ use case ทั่วไป
- เจาะดูข้อมูลเชิงลึกโดยการกรอง (filter) ตามพนักงานขาย, รายเดือน หรือตามประเภทสินค้า
- ส่งการแจ้งเตือนอัตโนมัติผ่าน LINE Messaging API ด้วย Apps Script เมื่อค่าต่างๆ เช่น pipeline ต่ำกว่าเป้าที่กำหนด
- คำนวณค่าคอมมิชชั่นให้อัตโนมัติตามขั้น (tier) ที่บริษัทตั้งไว้ โดยไม่ต้องคำนวณเอง

## ตัวอย่าง dashboard ที่ผม build ให้ client

**บริษัทจัดจำหน่ายรถโฟล์คลิฟท์ (ทีม 5 คน, รายได้ ~฿30 ล้าน/ปี):**

Sheet 1: Input (ให้พนักงานขายบันทึก deal ที่ปิดได้ในแต่ละวัน)
Sheet 2: Dashboard (สร้างขึ้นอัตโนมัติ)
- ยอดขายรายเดือนของแต่ละคนเทียบกับเป้า (bar chart)
- มูลค่า pipeline ในแต่ละ stage (funnel chart)
- อัตรา Conversion rate แยกตามช่องทาง (TikTok / Google / referral)
- ตารางค่าคอมมิชชั่นของพนักงานแต่ละคนประจำเดือน
- กราฟแนวโน้มขนาด deal เฉลี่ยย้อนหลัง 6 เดือน (line chart)

ทั้งหมดนี้สร้างบน Google Sheets รุ่นฟรีที่มาพร้อมกับ Google Workspace ที่บริษัทใช้งานอยู่แล้ว

## ทำไมไม่แนะนำ Power BI / Tableau สำหรับ SME

- Power BI Pro มีค่าใช้จ่าย $10/user/เดือน สำหรับทีม 10 คน จะอยู่ที่ประมาณ ฿3,500+/เดือน
- Tableau Creator มีค่าใช้จ่าย $75/user/เดือน หรือประมาณ ฿2,500+/คน
- ทีมต้องเสียเวลาเรียนรู้ DAX หรือ Tableau query language ใหม่ทั้งหมด
- ฝ่าย IT ต้องดูแล data pipeline เอง หรือต้องจ้าง BI engineer เพิ่ม
- เกิด Vendor lock-in ทำให้การดึงข้อมูลออกไปใช้ที่อื่นทำได้ยาก

สำหรับ SME ที่มีรายได้ระหว่าง ฿30-200 ล้านต่อปี ฟีเจอร์กว่า 90% ของ Power BI อาจไม่มีความจำเป็น และ Google Sheets ก็สามารถทำงานส่วนใหญ่แทนได้

## ข้อจำกัดของ Sheets ที่ต้องรู้

- Google Sheets มีข้อจำกัดที่ 10 ล้านเซลล์ต่อหนึ่งชีต ซึ่งเพียงพอสำหรับการใช้งานของ SME ทั่วไปประมาณ 5–10 ปี
- หากใช้สูตรที่ซับซ้อนมากเกินไป อาจทำให้ชีตทำงานช้าลง ปัญหานี้สามารถแก้ไขได้โดยการใช้ Apps Script เข้ามาช่วยประมวลผลแทน
- ไม่รองรับการแสดงผลข้อมูลแบบ real-time streaming โดยตรง (รีเฟรชได้เร็วสุดทุก 15 นาที) หากต้องการ real-time จริงๆ สามารถใช้เครื่องมืออย่าง n8n ร่วมกับ webhook ได้

## Package ที่เกี่ยวข้อง

- ในเวิร์กชอป **[AI Day Workshop](/services/ai-workshop)** (฿30,000) เราจะสร้าง KPI dashboard พร้อมระบบอัตโนมัติ 1 อย่างให้เสร็จภายในวันเดียว
- แพ็กเกจ **[Sales System Sprint](/services/sales-system-sprint)** (฿65,000) จะเป็นการวางระบบ KPI, การคำนวณคอมมิชชั่น และระบบ automation เต็มรูปแบบในระยะเวลา 1 เดือน

ทั้งสองแพ็กเกจจะส่งมอบ template ของ Google Sheets ที่ลูกค้านำไปคัดลอกใช้งานต่อได้เอง พร้อมเอกสารประกอบและวิดีโอสอนการใช้งาน
