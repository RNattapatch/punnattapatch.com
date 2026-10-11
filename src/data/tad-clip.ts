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
 * tool names as proof (never the headline) → GitHub CTA + install steps → about Pun + "เล่าโจทย์มา" LINE CTA → FAQ.
 * Rules: say "คลาส" (never the old word for course, see CLAUDE.md) · no price of any paid service · the FutureSkill
 * banner lives only inside ABOUT, captioned with the daily-AI-use proof (moat rule: never on its own).
 * Clawd (src/components/Clawd.astro) is Claude Code's mascot: it marks "this is the Claude kit"; TOOLS.trademark says
 * the kit is not made with Anthropic.
 *
 * ── Before/after media (public/free/tad-clip/) ─────────────────────────────────
 * Kit output: a fresh session ran the plugin's "ตัดคลิป" skill end to end on the owner's raw
 * BBQ clip (unattended "ทำรวดเดียว" mode, ~30 min wall-clock on a Mac mini M4).
 * Both sides show the same sentences ("ถ้าลูกค้ารุมด่าร้านคุณ … เลือกปิด 26 สาขา").
 *   before.mp4 + before-poster.jpg (poster = 1.5 s)
 *     source: ~/work/tad-clip-run/บาร์บีคิว กระทะดำ.MP4  (raw iPhone clip, HEVC 1440×2560 60 fps, 107.53 s)
 *     window: 2.5–8.5 s (phrase 1 starts at 2.51 s; the false start 0.96–1.93 s is before the window)
 *   after.mp4 + after-poster.jpg (poster = 1.0 s: Pexels plate + "ขอโทษ หรือ ปิดร้านหนี?" card + karaoke sub; also the hero "after" image)
 *     source: ~/work/tad-clip-run/tad-clip-บาร์บีคิว กระทะดำ/final.mp4  (kit output, H.264 1080×1920 60 fps, 71.88 s)
 *     window: 0.0–6.0 s (raw 2.51 s = final 0.0). Inserts in this window: Pexels 4629216
 *             (Pexels License, ads OK, labelled "ภาพจำลอง" by the kit) + the kit's own stat card.
 *   encode (both): ffmpeg -ss <start> -t 6 -i <src> -vf "scale=720:1280:out_range=tv,fps=30"
 *     -c:v libx264 -preset slow -crf 21 -profile:v high -pix_fmt yuv420p
 *     -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 96k -movflags +faststart
 *     → before.mp4 1.65 MB · after.mp4 1.30 MB (Pages limit 25 MB/file, spec target ≤ 20 MB)
 *   og-v2.jpg: 1200×630, problem headline + both posters (neuro gate: passes the 216 px glance test).
 *     source: scripts/og/tad-clip-og.html (Prompt from the kit's assets/fonts — swap FONTS for that folder),
 *     rendered with Chrome --headless=new --window-size=1200,630 --screenshot. New file name on every
 *     change so FB / LINE link previews fetch it again.
 *   DEMO.stat numbers: roughcut-review.md of that run ("ตัด 19 ท่อน จาก 57 วลี · 107.6 → 71.8 วินาที");
 *   ffprobe: raw 107.53 s → final 71.88 s. When the gym clip replaces this pair, re-measure DEMO.stat.
 */

export const TAD_CLIP_SLUG = 'tad-clip';
export const GITHUB_URL = 'https://github.com/RNattapatch/tad-clip';
export const FREE_CLICK_BEACON_URL = 'https://form-hook.punnattapatch.com/webhook/free-click';

const MEDIA = '/free/tad-clip';

export const META = {
  title: 'แจกชุดตัดคลิปฟรี ตัดเทคซ้ำกับใส่ซับไทยให้ในแชทเดียว',
  description:
    'ลากคลิปพูดหน้ากล้องเข้าแชท พิมพ์ “ตัดคลิป” ตอบคำถามสั้นๆ รอบเดียว ได้ MP4 ที่ตัดเทคซ้ำแล้ว มีซับไทยแบบคาราโอเกะ จะแทรกภาพ มีม หรือเสียงเอฟเฟกต์ก็เลือกได้ จ่ายแค่ค่า Claude แบบเสียเงินที่ใช้อยู่ ไม่มีค่ารายเดือนอื่นเพิ่ม ใช้ได้ทั้ง Mac และ Windows',
  ogImage: `${MEDIA}/og-v2.jpg`,
  breadcrumb: 'ชุดตัดคลิปฟรี',
};

export const HERO = {
  eyebrow: 'แจกฟรี · ชุดตัด\u2060คลิปพูดหน้ากล้อง',
  // Speech bubble next to Clawd: people who typed "ตัดคลิป" under the reel see at once that this is the Claude kit.
  clawdSays: 'มาถูกที่แล้ว ชุดตัด\u2060คลิปที่ทำงานใน Claude อยู่หน้านี้',
  // H1 = the reader's belief, said the way they would say it:
  // "คลิปพูดหน้ากล้องจะดูดี ต้องแลกด้วยการนั่งตัดทั้งคืน หรือไม่ก็ค่าแอปทุกเดือน"
  // Split into phrases so Thai lines only break between phrases; `accent` gets the hand underline.
  belief: [
    [{ t: 'คลิปพูดหน้ากล้อง' }, { t: 'จะดูดี' }],
    [{ t: 'ต้องแลกด้วย' }, { t: 'การนั่งตัดทั้งคืน', accent: true }],
    [{ t: 'หรือไม่ก็' }, { t: 'ค่าแอปทุกเดือน' }],
  ],
  sub: 'คลิปถัดไป ลากเข้าแชทแล้วพิมพ์ว่า “ตัด\u2060คลิป” ได้คลิปที่ตัดเทคซ้ำออกแล้ว มีซับไทยครบ ไม่ต้องนั่งตัดเอง ไม่ต้องสมัครแอปรายเดือน ชุด\u2060นี้\u2060แจก\u2060ฟรี',
  // First-frame contrast (neuro gate): the same clip raw vs. after the kit, shown in the hero.
  pairLabel: 'คลิปเดียวกัน ก่อนและหลังตัดด้วยชุดนี้',
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
  heading: 'ก่อนกับหลัง ตัดด้วยชุดนี้',
  before: {
    label: 'ก่อน',
    src: `${MEDIA}/before.mp4`,
    poster: `${MEDIA}/before-poster.jpg`,
    posterAlt: 'คลิปดิบจากมือถือ ผู้พูดหน้ากล้อง ยังไม่มีซับ ไม่มีภาพประกอบ',
    alt: 'คลิปดิบจากมือถือ ผู้พูดหน้ากล้อง ยังไม่มีซับและภาพประกอบ',
    caption: 'คลิปดิบจากมือถือ ยังไม่มีซับ ไม่มีภาพ\u2060ประกอบ',
    sound: 'เสียงคลิปก่อน',
  },
  after: {
    label: 'หลัง',
    src: `${MEDIA}/after.mp4`,
    poster: `${MEDIA}/after-poster.jpg`,
    posterAlt: 'คลิปหลังตัด ครึ่งบนเป็นภาพปิ้งย่าง มีการ์ดคำถาม ขอโทษ หรือ ปิดร้านหนี ครึ่งล่างเป็นผู้พูดพร้อมซับไทยแบบคาราโอเกะ',
    alt: 'ช่วงเดียวกันหลังตัดด้วยชุดนี้ ครึ่งบนเป็นภาพปิ้งย่างติดป้ายภาพจำลอง มีซับคาราโอเกะ แล้วต่อด้วยการ์ด 26 สาขา กับหน้าผู้พูดในวงกลม',
    caption: 'ช่วงเดียวกันหลังตัดด้วยชุดนี้ มีซับคาราโอเกะ กับภาพและการ์ดตัวเลขแทรกตามคำพูด',
    sound: 'เสียงคลิปหลัง',
  },
  stat: 'ตัดด้วยชุดนี้ จากคลิปดิบของผม 108\u00a0วินาที เหลือ 72\u00a0วินาที ตัด\u2060ทิ้ง 19\u00a0ท่อน',
  // Same run's wall-clock + the reenactment label the kit added itself (both facts from that run).
  note: 'ตอบคำถามแล้วปล่อยเครื่องทำเองรวดเดียวราว 30\u00a0นาที บน Mac mini M4 ส่วนป้าย “ภาพ\u2060จำลอง · Pexels” บนภาพปิ้ง\u2060ย่าง ชุดนี้ใส่ให้เอง เพราะเป็นภาพ\u2060ประกอบ ไม่ใช่ร้านจริง',
};

export const NEEDS = {
  heading: 'ต้องมีอะไร ไม่ต้องจ่ายอะไร',
  haveTitle: 'ต้องมี',
  have: [
    'Claude แบบเสียเงิน (Pro ขึ้นไป) ใช้ผ่านแอป Claude บนคอม',
    'คอม Mac (แนะนำชิป Apple) หรือ Windows 10/11 แบบ 64\u2011bit',
    'ถ้าใช้ Windows ลงโปรแกรม Git\u00a0for\u00a0Windows (ฟรี จาก git-scm.com) ไว้ก่อนครั้งเดียว',
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
    { name: 'whisper (ตัวถอดเสียงฟรี)', does: 'ถอดเสียงพูดไทยในเครื่อง ได้เวลาทีละคำ' },
    { name: 'PyThaiNLP', does: 'ตัดคำไทยให้ซับขึ้นบรรทัดใหม่โดยไม่ขาดกลางคำ' },
    { name: 'ffmpeg + libass', does: 'ตัดต่อ ใส่ซับ ผสมเสียง แล้วเรนเดอร์เป็น MP4' },
    { name: 'Chrome / Edge', does: 'วาดการ์ดข้อความกับกราฟิกที่ขยับได้' },
    { name: 'yt-dlp + Wikimedia Commons', does: 'หาภาพกับคลิปมาแทรก แล้วจดที่มาไว้ให้' },
  ],
  proof: 'โค้ดทั้งหมดเปิดให้อ่านบน GitHub และถูกทดสอบอัตโนมัติบนทั้ง Mac และ Windows ทุกครั้งที่แก้',
  credit: 'ทำโดย ปัน ณัฐพัชร์ (@pun_nattapatch)',
  trademark: 'Claude และตัวมาสคอต Clawd เป็นของ Anthropic ชุดนี้ผมทำเอง ไม่ได้ทำร่วมกับ Anthropic',
};

export const CTA = {
  heading: 'เอาไปลองกับคลิปถัดไปของคุณ',
  button: 'รับ skill ไปใช้ฟรีบน GitHub',
  note: 'หน้า GitHub มีคู่มือติดตั้งแยก Mac กับ Windows ทีละขั้น และที่แจ้งปัญหาถ้าติดตรงไหน',
  mobileNote: 'เปิดจากมือถืออยู่? ส่งลิงก์หน้านี้เข้าแชทตัวเองไว้ก่อน แล้วค่อยทำบนคอม',
  // Social value prop (neuro gate): a reason to forward, offered after the value is on the page.
  shareLabel: 'ส่งให้เพื่อนที่ทำคลิปเองใน LINE',
  shareText: 'ชุดตัดคลิปฟรี ลากคลิปเข้าแชทแล้วพิมพ์ว่า “ตัดคลิป” ได้คลิปที่ตัดเทคแล้วพร้อมซับไทย',
};

/**
 * Install steps for people who have never opened GitHub. Copy buttons put the exact text on the
 * clipboard. The first copy on a page view counts as the same "took the kit" signal as the GitHub
 * button (TadClipGithubClick, same event_id to CAPI) because many visitors will install from here
 * and never open GitHub. Flow matches the kit's docs/01-install-mac.md §2.
 */
export const INSTALL = {
  heading: 'ไม่เคยใช้ GitHub ก็ติดตั้งได้ ให้ Claude ติดตั้งให้เอง',
  windowsNote: 'ใช้ Windows: ก่อนขั้นที่ 1 ให้ลงโปรแกรม Git\u00a0for\u00a0Windows (ฟรี จาก git-scm.com) ครั้งเดียว กด Next ตามค่าเดิมได้เลย แล้วปิดเปิดแอป Claude ใหม่',
  copyLabel: 'คัดลอก',
  copiedLabel: 'คัดลอกแล้ว',
  steps: [
    {
      title: 'เปิดแอป Claude บนคอม แล้วกดแท็บ Code',
      detail: 'ยังไม่มีแอป โหลดได้ที่ claude.ai/download ต้องใช้ Claude แบบเสียเงิน (Pro ขึ้นไป) ถ้าแอปถามว่าจะให้ทำงานที่ไหน เลือกเครื่องนี้ (Local)',
    },
    {
      title: 'คัดลอกข้อความนี้ไปวางในแชท แล้วกด Enter',
      // Tested 2026-10-11 in fresh sessions: this prompt, and even the bare repo URL, both end with the plugin
      // installed. CLAUDE_CODE_EXECPATH covers app-only users who have no `claude` command on PATH.
      code: [
        'ช่วยติดตั้ง plugin tad-clip จาก https://github.com/RNattapatch/tad-clip ให้หน่อย',
        'รัน 2 คำสั่งนี้ทีละคำสั่ง ถ้าเครื่องไม่มีคำสั่ง claude ให้ใช้ไฟล์ในตัวแปร CLAUDE_CODE_EXECPATH แทน',
        'claude plugin marketplace add RNattapatch/tad-clip',
        'claude plugin install tad-clip@pun-nattapatch',
        'เสร็จแล้วบอกฉันว่าต้องทำอะไรต่อ',
      ].join('\n'),
      copyName: 'ข้อความติดตั้ง',
      detail: 'Claude จะติดตั้ง plugin ให้เอง ถ้าขึ้นหน้าต่างขออนุญาตรันคำสั่ง กด Allow',
      fallback: 'อยากกดเองผ่านเมนู? กดปุ่ม + ข้างช่องพิมพ์ เลือก Plugins แล้วกด Add plugin วางชื่อนี้ แล้วเลือก Install for you',
      fallbackCode: ['RNattapatch/tad-clip'],
    },
    {
      title: 'เปิดแชทใหม่ แล้วพิมพ์',
      code: 'ติดตั้ง tad-clip',
      detail: 'plugin จะโหลดในแชทใหม่ Claude บอกก่อนว่าจะลงโปรแกรมอะไร ใช้พื้นที่เท่าไร แล้วลงให้เอง ครั้งแรกใช้เวลาราว 10–30\u00a0นาที ขึ้นกับความเร็วเน็ต',
    },
    {
      title: 'ลากคลิปเข้าแชท แล้วพิมพ์',
      code: 'ตัดคลิป',
      detail: 'ตอบคำถามสั้นๆ รอบเดียว แล้วรอรับไฟล์ MP4',
    },
  ],
};


/**
 * Short "who made this" box under the install steps. Offer names follow the locked 2-track offer
 * (ปั้นทีมขาย × AI Office ฝ่ายขาย, CLAUDE.md 2026-10-07) — no prices, no guarantees, no Daruma.
 * Logos: the site-wide CLIENT_LOGOS set (already public on every class LP).
 */
export const ABOUT = {
  location: 'tad_clip_about',
  eyebrow: 'คนทำชุดนี้',
  name: 'ปัน ณัฐพัชร์',
  handle: '@pun_nattapatch',
  role: 'ปั้นทีมขาย × AI',
  intro:
    'ผมช่วยเจ้าของธุรกิจให้ทีมขายปิดงานได้เอง โดยเจ้าของไม่ต้องลงไปช่วยทุกดีล ทำ 2 ส่วนคู่กัน',
  tracks: [
    { title: 'ปั้นทีมขาย', text: 'คัดคนเข้าทีม วางเป้ากับค่าคอม และพาหัวหน้าให้คุมทีมเองได้ ผมสัมภาษณ์คนเข้าทีมมาแล้ว 100+\u00a0คน คัดเรซูเม่ 1,000+\u00a0ใบ' },
    { title: 'AI Office ฝ่ายขาย', text: 'ให้ AI รับงานซ้ำของฝ่ายขาย ฝ่ายเอกสาร และฝ่ายคอนเทนต์ ชุดตัด\u2060คลิปหน้านี้ก็เป็นหนึ่งในระบบที่ผมใช้กับงานตัวเองทุกสัปดาห์' },
  ],
  bannerAlt: 'ปัน ณัฐพัชร์ FutureSkill Instructor ประจำปี 2026 ใน AI Academy, Digital Business Academy และ Sales & Customer Academy',
  bannerCaption: 'ผมสอนกับ FutureSkill เรื่อง AI กับงานขาย และใช้ AI Agent ทำงานขายของตัวเองทุกวัน',
  logosHeading: 'ตัวอย่างลูกค้าและองค์กรที่เคยทำงานด้วย',
  logoCount: 12,
  ctaHeadline: 'อยากคุยกับผม หรือให้ผมไปช่วยธุรกิจคุณ ทักมาเลย',
  ctaCopy: 'แอด LINE แล้วเล่าโจทย์มาสั้นๆ ว่าธุรกิจขายอะไร ทีมขายกี่คน ตอนนี้ติดตรงไหน ผมอ่านเองแล้วตอบว่าควรเริ่มตรงไหน',
  lineLabel: 'แอด LINE แล้วเล่าโจทย์มา',
  // [data-line-close] keyword → mobile LINE opens with "<keyword> [WEB]" (src/scripts/line-prefill.ts).
  // Longer than the LINE bot's freebie maxLen (25), so it can't trigger the "ตัดคลิป" card.
  lineKeyword: 'อยากคุยเรื่องทีมขายกับ AI จากหน้าตัดคลิป',
};

export const FAQS = [
  {
    q: 'ใช้กับ Windows ได้ไหม',
    a: 'ได้ครับ ใช้กับ Windows 10 และ 11 แบบ 64\u2011bit ก่อนลงชุดนี้ให้ลงโปรแกรม Git\u00a0for\u00a0Windows (ฟรี จาก git-scm.com) ไว้ครั้งเดียว ตัวชุดติดตั้งได้โดยไม่ต้องใช้สิทธิ์แอ\u2060ด\u2060มิน ทุกครั้งที่แก้โค้ด ชุดนี้ถูกทดสอบอัตโนมัติบนเครื่อง Windows ของ GitHub ส่วนเครื่องที่ผมใช้เองเป็น Mac ถ้าเจออาการแปลกบน Windows แจ้งได้ในแท็บ Issues ของหน้า GitHub ฟีเจอร์ตัดพื้นหลังคนออกบน Windows เป็นตัวเสริมที่ต้องโหลดเพิ่มราว 2\u00a0GB ไม่ลงก็ยังได้คลิปครบ',
  },
  {
    q: 'เครื่องต้องแรงแค่ไหน',
    a: 'RAM 8\u00a0GB กับพื้นที่ว่าง 15\u00a0GB ก็พอ ไม่ต้องมีการ์ดจอแยก ถ้าเครื่องมีการ์ดจอ NVIDIA ชุดนี้จะใช้ให้เองเพื่อถอดเสียงเร็วขึ้น ตัวถอดเสียงใช้รุ่นใหญ่ (large-v3) ทุกเครื่อง เพราะรุ่นเล็กฟังภาษาไทยพลาดเยอะ เครื่อง RAM 8\u00a0GB ใช้ได้ แค่ปิดโปรแกรมอื่นก่อนถอดเสียง และรอนานขึ้น',
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

/** Plain text for JSON-LD / metadata: drop word joiners, turn NBSP and non-breaking hyphens back into normal characters. */
export const plainText = (text: string): string =>
  text.replace(/\u2060/g, '').replace(/\u00a0/g, ' ').replace(/\u2011/g, '-');
