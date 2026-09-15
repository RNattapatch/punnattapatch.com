-- keywordsExact ใน oa-freebies.json ไม่ใช่ alias แบบ exact ธรรมดา
-- core-freebies.mjs:164  exactAliasHit = t === k || /^k[\s0-9คน]*$/.test(t)
--   "ทีมขาย" · "ทีมขาย 5" · "ทีมขาย 5 คน"  → เด้งการ์ด
--   "ทีมขายผมมี 3 คน"                        → ไม่เด้ง (เป็นประโยค ไม่ใช่ keyword)
-- มันคือโหมดที่สาม ไว้รับคำไทยกว้างๆ (ปรึกษา · รายงาน · ออนไลน์ · ทีมขาย) ที่ contains จะจับมั่วทั้งหมด
-- จึงต้องมีคอลัมน์ของตัวเอง ไม่ใช่ยุบรวมกับ aliases (จะเปลี่ยนพฤติกรรมบอท)
alter table public.chat_keywords
  add column if not exists aliases_exact text[] not null default '{}';

comment on column public.chat_keywords.aliases     is 'match ตาม match_mode (contains/exact) เหมือน keyword หลัก';
comment on column public.chat_keywords.aliases_exact is 'match แบบ exact-alias เสมอ ไม่สนใจ match_mode — ยอมส่วนต่อท้ายที่เป็นช่องว่าง/ตัวเลข/คำว่า คน';
