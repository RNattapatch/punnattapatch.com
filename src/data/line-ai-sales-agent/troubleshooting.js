export const troubleshooting = [
  { id: 'line-no-reply', symptom: 'LINE รับข้อความแต่ไม่มีคำตอบกลับ', stepIds: ['S1'], checks: ['ตรวจ log ของ webhook', 'ตรวจสถานะ Worker', 'ส่งข้อความทดสอบใหม่หนึ่งครั้ง'], debugPromptContext: 'ตรวจเส้นทาง LINE → Worker → LINE' },
  { id: 'auto-reply-conflict', symptom: 'ลูกค้าได้รับคำตอบซ้ำหรือคำตอบจากระบบเดิม', stepIds: ['S1'], checks: ['ตรวจ auto-reply ใน OA', 'ตรวจว่ามี Worker มากกว่าหนึ่งตัวหรือไม่'], debugPromptContext: 'หาแหล่งที่ส่งข้อความซ้ำ' },
  { id: 'pre-webhook-message-missing', symptom: 'ข้อความที่ส่งก่อนเปิด webhook ไม่เข้าระบบ', stepIds: ['S1'], checks: ['ยืนยันเวลาที่เปิด webhook', 'ทดสอบด้วยข้อความใหม่หลังเปิด'], debugPromptContext: 'ตรวจขอบเขตเวลาของเหตุการณ์' },
  { id: 'restart-stale-values', symptom: 'restart แล้วระบบยังใช้ค่าตั้งเดิม', stepIds: ['B7'], checks: ['ตรวจไฟล์ตั้งค่าที่ Worker อ่านจริง', 'ตรวจสถานะบริการหลัง restart'], debugPromptContext: 'ตรวจแหล่งค่าตั้งและ cache' },
  { id: 'worker-generic', symptom: 'Worker ตอบกว้างเหมือนไม่รู้จักร้าน', stepIds: ['B3', 'B4', 'B5'], checks: ['ตรวจ role brief', 'ตรวจการอ่านสมองร้าน', 'ถามคำถามที่มีคำตอบเฉพาะร้าน'], debugPromptContext: 'ตรวจบทบาท ขอบเขต และ knowledge sync' },
  { id: 'screen-line-differ', symptom: 'ผลบนหน้าจอทดสอบไม่เหมือนคำตอบใน LINE', stepIds: ['S7'], checks: ['เทียบ input เดียวกันทั้งสองช่องทาง', 'ตรวจ session และการตั้งค่า LINE'], debugPromptContext: 'เปรียบเทียบเส้นทางรันสองช่องทาง' },
  { id: 'thai-time-wrong', symptom: 'เวลาไทยหรือเวลานัดคลาดเคลื่อน', stepIds: ['B7', 'A5'], checks: ['ตรวจ timezone ของ VPS', 'ตรวจรูปแบบเวลาที่ส่งให้ลูกค้า'], debugPromptContext: 'ตรวจ timezone และการแปลงเวลา' },
  { id: 'card-image-broken', symptom: 'รูปใน Product Card ไม่แสดง', stepIds: ['A1'], checks: ['เปิด URL รูปจากมือถือ', 'ตรวจสิทธิ์การเข้าถึงไฟล์'], debugPromptContext: 'ตรวจ URL และสิทธิ์ไฟล์ภาพ' },
  { id: 'qr-amount-wrong', symptom: 'ยอดในคำขอชำระไม่ตรง quote', stepIds: ['A3'], checks: ['เทียบยอดกับ quote ที่ตรวจแล้ว', 'ตรวจว่ามีการแก้ไขรายการหลังสร้าง draft หรือไม่'], debugPromptContext: 'ตรวจแหล่งยอดเงินและสถานะ quote' },
  { id: 'scheduled-job-misses-config', symptom: 'งานตามเวลาไม่อ่านค่าตั้งที่จำเป็น', stepIds: ['A5', 'A7'], checks: ['ตรวจ environment ของงานตามเวลา', 'รันทดสอบแบบ manual พร้อม log'], debugPromptContext: 'ตรวจ runtime ของ scheduled job' },
  { id: 'stale-session-personality', symptom: 'Agent ใช้น้ำเสียงหรือบริบทเก่ากับลูกค้าใหม่', stepIds: ['B7', 'S1'], checks: ['ตรวจ session key', 'ทดสอบด้วยบัญชีใหม่', 'ตรวจนโยบายหมดอายุของ memory'], debugPromptContext: 'ตรวจการแยก session และอายุ memory' },
];
