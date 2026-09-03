# QC checklist pages — `/qc/<slug>`

- **Status:** shipped on `claude/qc-t2-leak-25` (branch preview only · not merged, not deployed)
- **First page:** `/qc/t2-leak-25` — "เช็ก 25 จุดรั่ว ก่อนเพิ่มงบแอด" (T2 Bonus 04)
- **Packet:** WEB-QC-T2-LEAK-01
- **Date:** 2026-09-03

## What this is

หน้า checklist ที่ติ๊กได้ในเบราว์เซอร์ สำหรับใช้เป็นต้นแบบของ Bonus ที่แจกในคลาส
โครงหน้าอ้างอิงจาก QC Toolkit ของ อ.เบิร์ด (`facebook-ads-qc-by-pakorn.pages.dev`) — เอาเฉพาะโครง
ส่วนเนื้อหา สี ฟอนต์ และภาษา เป็นของปันทั้งหมด

หน้านี้เป็น Bonus ไม่ใช่หน้าขาย จึงตั้ง `noindex` ไว้ก่อน

## Route + data

| ไฟล์ | หน้าที่ |
|---|---|
| `src/data/qc/t2-leak-25.json` | เนื้อหาทั้งหมด 5 โซน × 5 ข้อ · แต่ละข้อมี `title` `description` `who` `examples.{dealer,contractor,subscription}` |
| `src/data/qc/index.ts` | registry + types · เพิ่มหน้าใหม่ = เพิ่มไฟล์ JSON แล้วต่อท้าย `QC_CHECKLISTS` |
| `src/pages/qc/[slug].astro` | `getStaticPaths` จาก registry · ส่ง metadata เข้า `BaseLayout` |
| `src/components/qc/QcChecklist.astro` | markup + inline script ทั้งหมด |
| `tests/qc-t2-leak.spec.ts` | Playwright · serve จาก `dist/` ตาม pattern `t1-t3-journey-mockups.spec.ts` |

เนื้อหาต้นทาง: `output/docs/course-bonus-library/t2-online-lead-pack/bonus-03-ads-to-sales-leak-checklist.md`
ในตารางต้นทางมีแค่ชื่อข้อ — ทุกข้อถูกขยายเป็นคำอธิบาย 1 ประโยค + ผู้รับผิดชอบ + ตัวอย่าง 3 อุตสาหกรรม

## โครงหน้า (บนลงล่าง)

1. Hero — ชื่อหน้า · "ตรวจตามแนวทาง ปัน ณัฐพัชร์" · คำนำ · disclaimer
2. กล่องนับ ทั้งหมด / ติ๊กแล้ว / ยังไม่ติ๊ก + แถบความคืบหน้า
3. ปุ่มสลับอุตสาหกรรมของตัวอย่าง (ผู้แทนจำหน่าย · รับเหมา/โปรเจกต์ · บริการรายเดือน)
4. ช่องค้นหา + กรองสถานะ (ทั้งหมด/ยังไม่ติ๊ก/ติ๊กแล้ว) + กรองโซน
5. ปุ่ม ส่งให้คุณปันตรวจ · Export CSV · ล้างข้อมูลในเครื่องนี้ + แผงสรุปที่คัดลอกแล้ว
6. รายการ 5 โซน โซนละ 5 ข้อ

## ข้อตัดสินใจที่สำคัญ

- **ไม่มี backend ไม่มี form ไม่มี cookie** — สถานะเก็บใน `localStorage` คีย์ `pn_qc_t2_leak_25_v1`
  เก็บทั้งข้อที่ติ๊กและอุตสาหกรรมที่เลือก · อ่าน/เขียนหุ้ม `try/catch` ทั้งหมด เพราะโหมดส่วนตัวบล็อก storage
- **ตัวอย่างเรนเดอร์จาก JSON ฝั่ง server ก่อนหนึ่งอุตสาหกรรม** แล้ว script สลับ `textContent` จาก payload
  ที่ฝังเป็น `<script type="application/json">` — หน้ายังอ่านรู้เรื่องถ้า JS ไม่ทำงาน
- **ปุ่มส่งให้คุณปันตรวจ** สร้างสรุป → คัดลอกลง clipboard → เปิด LINE OA (`SITE.social.line` ตัวเดียวกับหน้า product detail)
  → และโชว์สรุปบนหน้าด้วย เพราะการคัดลอกอัตโนมัติล้มเหลวได้บนเบราว์เซอร์บางตัว
  ถ้า `navigator.clipboard` ไม่ผ่าน จะถอยไปใช้ textarea + `execCommand` แล้วบอกผู้ใช้ตรงๆ ว่าให้คัดลอกเอง
- **CSV** ใส่ BOM นำหน้าเพื่อให้ Excel อ่านภาษาไทยไม่เพี้ยน
- **ไม่ใช้ framework** — vanilla script ตัวเดียวใน component

## ข้อห้ามที่ผูกไว้ใน test

- ไม่มี `฿` ตามด้วยตัวเลขในหน้า
- ไม่มีคำใน SSOT §8 (สูตรลับ · ใช้ได้กับทุกธุรกิจ · สร้างยอดทันที · Lifetime Support)
- ตัวอย่างทุกข้อเป็นข้อมูลสมมติ ไม่มีชื่อลูกค้าจริง
- 25 checkbox ครบ · ติ๊กแล้ว reload ยังอยู่ · สลับอุตสาหกรรมเปลี่ยนตัวอย่าง · สรุปมี `x/25`
- ไม่ overflow ที่ 320 / 360 / 390 / 1440px

## ค้างไว้

`astro.config.mjs` อยู่นอกขอบเขตไฟล์ของ packet นี้ จึงยังไม่ได้เพิ่ม `/qc/` เข้า sitemap filter —
หน้านี้เลยยังโผล่ใน `sitemap-0.xml` ทั้งที่ตั้ง `noindex` ไว้ ต้องแก้ในรอบถัดไปที่แตะ config ได้
