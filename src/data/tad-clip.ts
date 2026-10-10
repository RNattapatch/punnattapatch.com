/**
 * /free/tad-clip — every word, link and media path for the page lives here.
 *
 * What the page is for: people who type "ตัดคลิป" under the reel get this link.
 * The page exists to put them into the Meta + TikTok audiences (ViewContent on load,
 * TadClipGithubClick on the GitHub button, same event_id sent to CAPI via
 * form-intake /webhook/free-click). There is NO form and it never fires `Lead`:
 * a free kit is audience, not a lead (spec 2026-10-11 §8).
 *
 * Copy order follows CLAUDE.md "Ads & Sales Copy": belief line → 3 pains in the
 * creator's own words → mechanism in 1 sentence → before/after → need / don't pay →
 * tool names as proof (never the headline) → GitHub CTA → "เล่าโจทย์มา" LINE CTA → FAQ.
 * Rules: say "คลาส" (never the old word for course, see CLAUDE.md) · no price of any paid service · no FutureSkill line
 * (moat rule needs a paired real-use proof in the same block; left out on purpose).
 *
 * ── Before/after media (public/free/tad-clip/) ─────────────────────────────────
 * Placeholder pair until the gym clip exists; swap the files and the captions below.
 *   before.mp4 + before-poster.jpg (poster = 3.0 s, "เทค 2" label visible)
 *     source: ~/Documents/content/05-oct-26/7D35BDF2-DDA7-4F57-9340-CBEAF532D5C4.MP4
 *             (owner's raw iPhone clip, HEVC 1440×2560 60 fps, 107.53 s)
 *     window: 34.6–40.6 s → "…ใช้กระทะรุ่นนี้" then "เพื่อตรวจสอบ" said 3 times
 *             (take 1 35.35–36.06 · take 2 36.86–37.88 · take 3 38.75–40.24, from silencedetect)
 *     burned-in labels "เทค 1/2/3" (libass, Prompt font from the tad-clip kit) so the
 *     retake reads with the sound off.
 *   after.mp4 + after-poster.jpg (poster = 5.6 s, flow card fully built)
 *     source: ~/repo/claude-code-pun-nattapatch-mac-mini/output/content/reel/visual/
 *             bbq-black-pan/out-final-2k/bbq-black-pan-final-2k.mp4 (final reel, 71.88 s)
 *     window: 22.4–28.4 s → face + karaoke sub, then the "แบรนด์รีบทำ…" flow card.
 *             Chosen because it has no third-party photo/footage/meme
 *             (assets/CREDITS.md of that reel: none are licensed for ads).
 *   encode (both): ffmpeg -ss <start> -t 6 -i <src> -vf "scale=720:1280:out_range=tv,fps=30[,subtitles=…]"
 *     -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p
 *     -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 96k -movflags +faststart
 *     → before.mp4 1.6 MB · after.mp4 0.9 MB (Pages limit 25 MB/file, spec target ≤ 20 MB)
 *   og.jpg: 1200×630, both posters on sand + headline (libass, Sarabun) · re-render it with the new pair.
 *   Numbers in DEMO.stat come from the same pair: raw 107.53 s → final 71.88 s,
 *   19 phrases dropped (output/content/reel/visual/bbq-black-pan/roughcut-drops.json).
 *   When the gym clip replaces this pair, re-measure and rewrite DEMO.stat + DEMO.disclosure.
 */

export const TAD_CLIP_SLUG = 'tad-clip';
export const GITHUB_URL = 'https://github.com/RNattapatch/tad-clip';
export const FREE_CLICK_BEACON_URL = 'https://form-hook.punnattapatch.com/webhook/free-click';

const MEDIA = '/free/tad-clip';

export const META = {
  title: 'แจกชุดตัดคลิปฟรี ตัดเทคซ้ำกับใส่ซับไทยให้ในแชทเดียว',
  description:
    'ลากคลิปพูดหน้ากล้องเข้าแชท พิมพ์ “ตัดคลิป” ได้ MP4 ที่ตัดเทคซ้ำแล้ว มีซับไทยแบบคาราโอเกะ ภาพ มีม และเสียงเอฟเฟกต์ จ่ายแค่ค่า Claude แบบเสียเงินที่ใช้อยู่ ไม่มีค่ารายเดือนอื่นเพิ่ม ใช้ได้ทั้ง Mac และ Windows',
  ogImage: `${MEDIA}/og.jpg`,
  breadcrumb: 'ชุดตัดคลิปฟรี',
};

export const HERO = {
  eyebrow: 'แจกฟรี · ชุดตัด\u2060คลิปพูดหน้ากล้อง',
  // H1 = the reader's belief, said the way they would say it:
  // "คลิปพูดหน้ากล้องจะดูดี ต้องแลกด้วยการนั่งตัดทั้งคืน หรือไม่ก็ค่าแอปทุกเดือน"
  // Split into phrases so Thai lines only break between phrases; `accent` gets the hand underline.
  belief: [
    [{ t: 'คลิปพูดหน้ากล้อง' }, { t: 'จะดูดี' }],
    [{ t: 'ต้องแลกด้วย' }, { t: 'การนั่งตัดทั้งคืน', accent: true }],
    [{ t: 'หรือไม่ก็' }, { t: 'ค่าแอปทุกเดือน' }],
  ],
  sub: 'คลิปถัดไปไม่ต้องนั่งตัดเอง และไม่ต้องสมัครแอปตัด\u2060คลิปรายเดือนเพิ่ม ชุดนี้แจกฟรี',
  skipLink: 'รู้เรื่องแล้ว ขอลิงก์เลย',
};

export const PAINS = {
  heading: 'เคยพูดประโยคไหนในนี้บ้าง',
  quotes: [
    'ถ่ายเสร็จสามทุ่ม นั่งไล่ตัดเทคที่พูดผิดจนเลยเที่ยงคืน พรุ่งนี้ก็ต้องถ่ายอีกคลิป',
    'แอปตัด\u2060คลิปตัดบัตรทุกเดือน เดือนไหนลงคลิปน้อยก็จ่ายเท่าเดิม',
    'อยากแทรกมีมกับเสียงตึ่งให้คนดูไม่ปัด\u2060ทิ้ง แต่หาไฟล์ทีละอันจนหมด\u2060อารมณ์\u2060ทำ\u2060ต่อ',
  ],
};

export const MECHANISM = {
  eyebrow: 'มันทำงานแบบนี้',
  fileIn: 'คลิปวันนี้.mov',
  prompt: 'ตัด\u2060คลิป',
  fileOut: 'final.mp4',
  fileOutNote: 'พร้อมลง',
  sentence:
    'ลากไฟล์คลิปเข้าไปในแชท พิมพ์ว่า “ตัด\u2060คลิป” ตอบคำถามสั้นๆ รอบเดียว แล้วรอรับ MP4 ที่ตัดเทคซ้ำกับช่วงเงียบออก\u2060แล้ว มีซับไทยแบบคาราโอเกะ จะให้แทรกภาพ มีม เสียงเอฟเฟกต์ หรือการ์ดข้อความด้วยก็เลือกได้',
};

export const DEMO = {
  heading: 'ก่อนกับหลัง จากคลิปของผมเอง',
  before: {
    label: 'ก่อน',
    src: `${MEDIA}/before.mp4`,
    poster: `${MEDIA}/before-poster.jpg`,
    alt: 'คลิปดิบ ผู้พูดเริ่มประโยค “เพื่อตรวจสอบ” ใหม่ 3 รอบ มีป้ายเทค 1 ถึงเทค 3',
    caption: 'คลิปดิบจากมือถือ ประโยคเดียวพูด 3 รอบกว่าจะจบ',
    sound: 'เสียงคลิปก่อน',
  },
  after: {
    label: 'หลัง',
    src: `${MEDIA}/after.mp4`,
    poster: `${MEDIA}/after-poster.jpg`,
    alt: 'คลิปที่ตัดแล้ว เหลือประโยคเดียว มีซับคาราโอเกะ และผัง ออกมาขอโทษ ปิด 26 สาขา ตรวจสอบและแก้ไข ขึ้นทีละกล่อง',
    caption: 'เหลือรอบที่พูดจบ มีซับคาราโอเกะ กับผังที่ขึ้นตามเสียงพูด',
    sound: 'เสียงคลิปหลัง',
  },
  stat: 'ทั้งคลิปจาก 1 นาที 47 วินาที เหลือ 1 นาที 12 วินาที ตัดทิ้ง 19 ท่อน',
  // Disclosure stays inside the stat card at body contrast until kit-rendered files replace this pair.
  disclosure:
    'ตัวอย่างนี้ตัดด้วยระบบที่ผมใช้กับคลิปตัวเอง ซึ่งเป็นต้นฉบับของชุดนี้ ป้าย “เทค 1–3” ผมใส่เพิ่มให้ดูรู้เรื่องตอนปิดเสียง',
};

export const NEEDS = {
  heading: 'ต้องมีอะไร ไม่ต้องจ่ายอะไร',
  haveTitle: 'ต้องมี',
  have: [
    'Claude แบบเสียเงิน (Pro ขึ้นไป) ใช้ผ่านแอป Claude บนคอม',
    'คอม Mac (แนะนำชิป Apple) หรือ Windows 10/11 แบบ 64\u2011bit',
    'RAM 8\u00a0GB และพื้นที่ว่าง 15\u00a0GB',
    'เน็ต (ครั้งแรกต้องโหลดโปรแกรมกับโมเดลถอดเสียงด้วย)',
  ],
  skipTitle: 'ไม่ต้องจ่าย',
  skip: [
    'ค่าแอปตัด\u2060คลิปรายเดือน',
    'API key หรือบิลค่า AI ที่คิดแยกตามการใช้',
    'ค่าโปรแกรมตัดต่อ เพราะไม่ต้องเปิดโปรแกรมตัดต่อเลย',
  ],
};

export const TOOLS = {
  heading: 'ข้างในใช้อะไรบ้าง',
  intro: 'ทุกตัวฟรี และเกือบทั้งหมดทำงานในเครื่องคุณ ยกเว้น Claude ที่คุณจ่ายอยู่แล้ว',
  items: [
    { name: 'Claude Code', does: 'อ่านคำพูดทั้งคลิปแล้วเลือกเทคที่พูดจบ ตรวจคำผิดในซับให้ด้วย' },
    { name: 'faster-whisper (large-v3)', does: 'ถอดเสียงพูดไทยในเครื่อง ได้เวลาทีละคำ' },
    { name: 'PyThaiNLP', does: 'ตัดคำไทยให้ซับขึ้นบรรทัดใหม่โดยไม่ขาดกลางคำ' },
    { name: 'ffmpeg + libass', does: 'ตัดต่อ ใส่ซับ ผสมเสียง แล้วเรนเดอร์เป็น MP4' },
    { name: 'Chrome / Edge', does: 'วาดการ์ดข้อความกับกราฟิกที่ขยับได้' },
    { name: 'yt-dlp + Wikimedia Commons', does: 'หาภาพกับคลิปมาแทรก แล้วจดที่มาไว้ให้' },
  ],
  proof: 'โค้ดทั้งหมดเปิดให้อ่านบน GitHub และถูกทดสอบอัตโนมัติบนทั้ง Mac และ Windows ทุกครั้งที่แก้',
  credit: 'ทำโดย ปัน ณัฐพัชร์ (@pun_nattapatch)',
};

export const CTA = {
  heading: 'เอาไปลองกับคลิปถัดไปของคุณ',
  button: 'เอาไปใช้ฟรีบน GitHub',
  note: 'ติดตั้งผ่านแอป Claude บนคอม ทั้ง Mac และ Windows ขั้นตอนพร้อมภาพอยู่ในหน้า\u00a0GitHub',
  mobileNote: 'เปิดจากมือถืออยู่? ส่งลิงก์หน้านี้เข้าแชทตัวเองไว้ก่อน แล้วค่อยเปิดบนคอม',
};

export const TEAM = {
  location: 'tad_clip_team',
  headline: 'อยากให้ทีมคอนเทนต์ทั้งทีมใช้แบบนี้?',
  copy: 'เล่าโจทย์มาใน LINE ว่าทีมมีกี่คน ทำคลิปลงช่องไหน สัปดาห์ละกี่คลิป และขั้นไหนกินเวลาที่สุด ผมอ่านเองแล้วตอบว่าควรเริ่มตรงไหน',
  lineLabel: 'เล่าโจทย์มา',
  eyebrow: 'คุยต่อใน LINE',
  // [data-line-close] keyword → mobile LINE opens with "<keyword> [WEB]" (src/scripts/line-prefill.ts).
  // 31 chars, so it stays above the LINE bot's freebie maxLen (25) and can't trigger the "ตัดคลิป" card.
  lineKeyword: 'อยากให้ทีมคอนเทนต์ใช้ชุดตัดคลิป',
};

export const FAQS = [
  {
    q: 'ใช้กับ Windows ได้ไหม',
    a: 'ได้ครับ ใช้กับ Windows 10 และ 11 แบบ 64\u2011bit ติดตั้งได้โดยไม่ต้องใช้สิทธิ์แอดมิน ทุกครั้งที่แก้โค้ด ชุดนี้ถูกทดสอบอัตโนมัติบนเครื่อง Windows ของ GitHub ส่วนเครื่องที่ผมใช้เองเป็น Mac ถ้าเจออาการแปลกบน Windows แจ้งได้ในแท็บ Issues ของหน้า GitHub ฟีเจอร์ตัดพื้นหลังคนออกบน Windows เป็นตัวเสริมที่ต้องโหลดเพิ่มราว 2\u00a0GB ไม่ลงก็ยังได้คลิปครบ',
  },
  {
    q: 'เครื่องต้องแรงแค่ไหน',
    a: 'RAM 8\u00a0GB กับพื้นที่ว่าง 15\u00a0GB ก็พอ ไม่ต้องมีการ์ดจอแยก ถ้าเครื่องมีการ์ดจอ NVIDIA ชุดนี้จะใช้ให้เองเพื่อถอดเสียงเร็วขึ้น ถ้าเครื่องช้าหรือ RAM 8\u00a0GB พอดี ตอนติดตั้งเลือกโมเดลถอดเสียงตัวเบาได้ ความแม่นลดลงนิดหน่อย แลกกับเครื่องไม่ค้าง',
  },
  {
    q: 'มีมกับเสียงเอฟเฟกต์ ติดลิขสิทธิ์ไหม',
    a: 'ชุดนี้ไม่ได้แจกมีม คุณใช้คลังมีมกับเสียงของตัวเองได้ หรือให้ Claude หาจากเน็ต มันจะเสนอรายการพร้อมลิงก์และไลเซนส์ให้เลือกก่อนโหลด ทุกชิ้นถูกจดลงไฟล์ CREDITS.md ว่ามาจากไหน และติดธงว่าเอาไปยิงแอดได้หรือไม่ได้ ฉากจากหนังหรือรายการทีวีติดธงห้ามยิงแอดเสมอ ส่วนจะลงเป็นโพสต์ปกติไหม คุณตัดสินใจเอง',
  },
  {
    q: 'ต้องจ่ายอะไรบ้าง',
    a: 'จ่ายค่า Claude แบบเสียเงิน (Pro ขึ้นไป) ตัวเดียว ชุดนี้กับโปรแกรมข้างในฟรีทั้งหมด ไม่มี API key ไม่มีค่ารายเดือนเพิ่มจากค่า Claude แต่ละคลิปจะใช้โควตา Claude ของคุณ คลิปยาวใช้มากกว่าคลิปสั้น จะตัดคลิปของตัวเองหรือรับจ้างตัดให้ลูกค้าก็ได้ ที่ห้ามคือเอาชุดนี้ไปขายต่อหรือทำเป็นบริการเก็บเงินรายเดือน',
  },
];
