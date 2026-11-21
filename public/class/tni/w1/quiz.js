// W1 quiz for /class/tni/w1/pre-quiz/ and /post-quiz/ (container: <div id="quiz" data-quiz="pre|post">).
// Results → Supabase RPC submit_class_quiz → table class_quiz_results (separate from leads/audience,
// anon can insert through the RPC only, cannot read). Instructor reads in the SQL editor:
//   select * from class_quiz_results where class_slug = 'tni-w1' order by quiz, created_at;
// Local state key tniw1quiz:v1 is also read by the week menu (/class/tni/w1/) to show the done tick.
(function () {
  "use strict";
  var CFG = {
    classSlug: "tni-w1",
    rpc: "https://yykocvhorgcgzaluuldn.supabase.co/rest/v1/rpc/submit_class_quiz",
    // anon key is public by design (same as src/scripts/lead-fallback.ts)
    anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a29jdmhvcmdjZ3phbHV1bGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjYwNTYsImV4cCI6MjA5NTgwMjA1Nn0.04ya1crnMRK6SgLfwhhxIp14DQ1n_ZkY5Fj-urTsv1E",
    store: "tniw1quiz:v1",
    menu: "/class/tni/w1/"
  };
  var LT = ["ก", "ข", "ค", "ง"];

  // a = index of the correct option (order pre-shuffled, same for everyone) · pre = Q1-5 · post = Q1-9 (outline §5)
  var Q = [
    { q: "คุณถาม AI ว่า “ทำยังไงให้ขายดีขึ้น” โดยไม่บอกอะไรเกี่ยวกับตัวคุณหรือธุรกิจของคุณเลย AI น่าจะตอบแบบไหน",
      o: ["ตอบแผนที่ตรงกับบริษัทของคุณทันที เพราะ AI รู้จักทุกบริษัท",
          "ตอบเป็นคำแนะนำกว้างๆ ที่ใช้ได้กับทุกธุรกิจ หรือถามกลับว่าคุณขายอะไร ให้ใคร",
          "ดึงยอดขายจริงของบริษัทคุณจากระบบมาวิเคราะห์ให้เอง",
          "ไม่ยอมตอบ เพราะเรื่องยอดขายเป็นความลับทางธุรกิจ"], a: 1,
      why: "AI ยังไม่รู้ว่าคุณเป็นใคร ขายอะไร ให้ใคร มันเลยตอบแบบที่ใช้ได้กับทุกบริษัท หรือถามกลับเพื่อขอบริบท" },
    { q: "ChatGPT ในหน้าเว็บ กับ AI ที่เปิดไฟล์ในเครื่องได้ (เช่น Claude Code หรือ Codex) ต่างกันตรงไหนมากที่สุด",
      o: ["ไม่ต่างกันเลย แค่หน้าตาโปรแกรมคนละสีและคนละชื่อ",
          "ตัวที่เปิดไฟล์ได้ฉลาดกว่าเสมอ เพราะใช้ Model คนละแบบทั้งหมด",
          "ต่างกันที่ที่ทำงาน (Harness) คือไฟล์ เครื่องมือ และสิทธิ์รอบตัว AI ส่วน Model อาจเป็นตระกูลใกล้กัน",
          "ChatGPT ในหน้าเว็บอ่านไฟล์ทุกไฟล์ในเครื่องของคุณได้อยู่แล้ว"], a: 2,
      why: "Model คือคน ส่วน Harness คือที่ทำงาน ตัวที่เปิดไฟล์ในเครื่องได้มีไฟล์ เครื่องมือ และสิทธิ์รอบตัวมากกว่า แม้ Model จะใกล้กัน" },
    { q: "งานไหนเป็นแบบ “AI ทำได้ แต่คนต้องอนุมัติก่อน”",
      o: ["ร่างประกาศที่จะส่งถึงพนักงานทั้งบริษัท",
          "จัดรูปแบบตารางในไฟล์ที่คุณใช้เองคนเดียว",
          "สรุปบทความข่าวให้คุณอ่านเอง",
          "แปลอีเมลภาษาอังกฤษให้คุณอ่านเข้าใจ"], a: 0,
      why: "ประกาศถึงคนทั้งบริษัทส่งแล้วถอนคืนยาก และกระทบคนจำนวนมาก คนจึงต้องตรวจก่อนส่ง" },
    { q: "คุณอยากให้ AI เขียนรายงานให้หน้าตาแบบที่แผนกใช้ ควรให้ AI อ่านอะไรประกอบ",
      o: ["คำสั่งสั้นๆ ว่า “เขียนให้ดีและเป็นมืออาชีพ”",
          "รายงานของบริษัทอื่นที่หาได้จากอินเทอร์เน็ต",
          "ไม่ต้องให้อ่านอะไร เพราะ AI รู้รูปแบบรายงานทุกแบบอยู่แล้ว",
          "ตัวอย่างรายงานที่หัวหน้าเคยตรวจผ่าน 3 ชิ้น"], a: 3,
      why: "ตัวอย่างงานที่ผ่านจริงทำให้ AI เห็นหน้าตาที่หัวหน้ายอมรับ เลยชัดกว่าคำว่า “ดี” มาก" },
    { q: "งานไหนเหมาะเป็นงานแรกที่คุณยกให้ AI ทำ",
      o: ["งานที่ทำปีละครั้ง และผิดไม่ได้เลย",
          "งานที่ทำซ้ำทุกสัปดาห์ และถ้าผิดยังแก้ทัน",
          "งานอนุมัติงบประมาณที่คุณต้องเซ็นชื่อรับผิดชอบ",
          "งานที่ต้องใช้ข้อมูลเงินเดือนของพนักงานทุกคน"], a: 1,
      why: "งานที่ทำซ้ำให้คุณได้ฝึกบ่อย และถ้า AI พลาดคุณยังแก้ทัน เลยเรียนรู้ได้โดยไม่เสียหาย" },
    { q: "เรื่องไหนควรเขียนไว้ใน AGENTS.md มากที่สุด",
      o: ["ความรู้ทั่วไปที่หาได้ในอินเทอร์เน็ต เช่น ความหมายของคำว่า KPI",
          "ประวัติบริษัทตั้งแต่ก่อตั้งแบบละเอียดทุกปี",
          "กติกาที่ AI ต้องทำตามทุกครั้ง เช่น เอกสารที่ส่งออกนอกบริษัทต้องให้หัวหน้าอ่านก่อน",
          "ประโยคว่า “ตอบให้สุภาพและถูกต้อง”"], a: 2,
      why: "AGENTS.md มีไว้บอกเรื่องที่ถ้าไม่บอก AI จะทำผิด ความรู้ทั่วไป AI รู้อยู่แล้ว ส่วนคำว่าสุภาพหรือถูกต้องกว้างเกินไป" },
    { q: "ทำไม AGENTS.md ควรเขียนให้สั้น",
      o: ["AI อ่านไฟล์นี้ทุกครั้งที่เริ่มงาน ถ้าไฟล์ยาวเกินไป AI มักทำตามได้ไม่ครบ",
          "ไฟล์ .md ใส่ข้อความได้ไม่เกิน 1 หน้ากระดาษ",
          "ไฟล์ที่ยาวจะทำให้ AI เปิดไฟล์ไม่ได้เลย",
          "หัวหน้าไม่ชอบอ่านเอกสารที่ยาว"], a: 0,
      why: "ไฟล์ยาวทำให้กฎสำคัญจมหาย AI เลยทำตามได้ไม่ครบ คุณจึงใส่แค่เรื่องที่ถ้าไม่บอก AI จะทำผิด" },
    { q: "AI ตอบว่า “เสร็จแล้ว ถูกต้องครบถ้วน” คุณควรทำอะไรต่อ",
      o: ["ส่งงานต่อได้เลย เพราะ AI ยืนยันแล้วว่าถูกต้อง",
          "ถาม AI อีกรอบว่า “แน่ใจไหม” แล้วเชื่อคำตอบรอบที่สอง",
          "ลบแชทนั้นทิ้ง แล้วสั่งงานเดิมใหม่ตั้งแต่ต้น",
          "เปิดต้นฉบับมาเทียบกับงานของ AI อย่างน้อย 1 จุด"], a: 3,
      why: "คำว่า “ถูกต้อง” ของ AI ยังไม่ใช่หลักฐาน คุณต้องตรวจกับต้นฉบับเองก่อนส่งต่อ" },
    { q: "คุณจะให้ AI สรุปประชุม คำสั่งไหนน่าจะได้งานดีที่สุด",
      o: ["“สรุปประชุมนี้ให้หน่อย”",
          "“สรุปประชุมนี้ให้ดีที่สุด ละเอียดที่สุด ห้ามผิดเด็ดขาด”",
          "“สรุปประชุมนี้ให้หัวหน้าฝ่ายอ่านก่อนประชุมผู้บริหารวันจันทร์ ครั้งก่อนลืมบอกว่าใครรับงานอะไร รอบนี้ขอตารางคนรับงานกับวันส่ง”",
          "“คุณคือผู้เชี่ยวชาญระดับโลก สรุปประชุมนี้แบบมืออาชีพ”"], a: 2,
      why: "คำสั่งที่ดีบอกว่าใครจะใช้งาน เอาไปทำอะไร และครั้งก่อนพลาดตรงไหน AI เลยรู้ว่าต้องเน้นอะไร" }
  ];
  var QUIZ = { pre: { n: 5, name: "แบบทดสอบก่อนเรียน" }, post: { n: 9, name: "แบบทดสอบหลังเรียน" } };

  // K level per w1-assessment-rubric.md §2 (8 correct = level 4, as the file says)
  var LADDER = [[9, 9, 5, "9 ข้อ ได้ระดับ 5"], [7, 8, 4, "7 ถึง 8 ข้อ ได้ระดับ 4"], [6, 6, 3, "6 ข้อ ได้ระดับ 3"], [4, 5, 2, "4 ถึง 5 ข้อ ได้ระดับ 2"], [0, 3, 1, "0 ถึง 3 ข้อ ได้ระดับ 1"]];
  function levelOf(s) { for (var i = 0; i < LADDER.length; i++) if (s >= LADDER[i][0] && s <= LADDER[i][1]) return LADDER[i][2]; return 1; }
  console.assert(levelOf(9) === 5 && levelOf(8) === 4 && levelOf(7) === 4 && levelOf(6) === 3 && levelOf(5) === 2 && levelOf(4) === 2 && levelOf(3) === 1 && levelOf(0) === 1, "level map");

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(CFG.store) || "{}") || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(CFG.store, JSON.stringify(S)); } catch (e) {} }
  // reuse nickname/department typed on the homework page (same origin), and share ours back if it is empty
  function hwIdentity() { try { var h = JSON.parse(localStorage.getItem("w1hw:v1") || "{}") || {}; return { nick: h.nick || "", dept: h.dept || "" }; } catch (e) { return { nick: "", dept: "" }; } }
  function shareIdentity(nick, dept) {
    try {
      var h = JSON.parse(localStorage.getItem("w1hw:v1") || "{}") || {};
      if (!h.nick && !h.dept) { h.nick = nick; h.dept = dept; localStorage.setItem("w1hw:v1", JSON.stringify(h)); }
    } catch (e) {}
  }

  var root = $("quiz");
  var key = root && root.getAttribute("data-quiz");
  if (!QUIZ[key]) return;
  var S = load();

  function render() {
    var cfg = QUIZ[key], hw = hwIdentity(), id = S.id || {};
    var h = '<div class="field"><p class="hint">ใส่ชื่อเล่นหรือรหัสก็พอ ไม่ต้องใส่ชื่อจริงและนามสกุล ไม่ต้องใส่ชื่อบริษัท</p>' +
      '<label class="lb" for="nick">ชื่อเล่นหรือรหัสผู้เรียน</label>' +
      '<input type="text" id="nick" maxlength="60" autocomplete="off" enterkeyhint="next" placeholder="เช่น เอ" value="' + esc(id.nick || hw.nick) + '" /></div>' +
      '<div class="field"><label class="lb" for="dept">แผนกและตำแหน่ง</label>' +
      '<input type="text" id="dept" maxlength="80" autocomplete="off" enterkeyhint="done" placeholder="เช่น ธุรการ HR การตลาด" value="' + esc(id.dept || hw.dept) + '" /></div>';
    for (var i = 0; i < cfg.n; i++) {
      h += '<fieldset class="q" id="q-' + i + '"><legend><b>ข้อ ' + (i + 1) + '</b> ' + esc(Q[i].q) + '</legend><div class="opts">';
      for (var j = 0; j < 4; j++) {
        h += '<label class="opt" id="o-' + i + '-' + j + '"><input type="radio" name="q' + i + '" value="' + j + '" />' +
          '<span class="lt" aria-hidden="true">' + LT[j] + '</span><span>' + esc(Q[i].o[j]) + '</span></label>';
      }
      h += '</div></fieldset>';
    }
    h += '<button type="button" class="btn btn-primary" id="go">ส่งคำตอบ</button>' +
      '<p class="msg bad" id="msg" role="alert"></p><div id="res"></div>';
    root.innerHTML = h;
    $("go").addEventListener("click", submit);
    var done = S[key];
    if (done && done.picks) { lock(done); showResult(done); send(); } // send() only shows the status if already sent
  }

  function lock(d) {
    var cfg = QUIZ[key];
    root.classList.add("locked");
    $("nick").value = d.nick; $("dept").value = d.dept;
    $("nick").disabled = true; $("dept").disabled = true;
    for (var i = 0; i < cfg.n; i++) {
      for (var j = 0; j < 4; j++) {
        var inp = root.querySelector('input[name="q' + i + '"][value="' + j + '"]');
        inp.checked = d.picks[i] === j; inp.disabled = true;
        var lab = $("o-" + i + "-" + j);
        if (j === Q[i].a) lab.classList.add("right"); else if (d.picks[i] === j) lab.classList.add("wrong");
      }
    }
    $("go").hidden = true;
  }

  function submit() {
    if (S[key] && S[key].picks) return; // already sent: locked, never a second row
    var cfg = QUIZ[key], msg = $("msg"), nick = $("nick").value.trim(), dept = $("dept").value.trim();
    var picks = [], miss = [];
    for (var i = 0; i < cfg.n; i++) {
      var c = root.querySelector('input[name="q' + i + '"]:checked');
      $("q-" + i).classList.toggle("qmiss", !c);
      if (c) picks.push(Number(c.value)); else { picks.push(-1); miss.push(i + 1); }
    }
    if (!nick) { msg.textContent = "กรุณาใส่ชื่อเล่นหรือรหัสผู้เรียนก่อนส่งครับ"; $("nick").focus(); return; }
    if (miss.length) {
      msg.textContent = "ยังไม่ได้ตอบข้อ " + miss.join(" ") + " ครับ";
      $("q-" + (miss[0] - 1)).scrollIntoView({ block: "center" });
      return;
    }
    msg.textContent = "";
    var score = 0;
    for (i = 0; i < cfg.n; i++) if (picks[i] === Q[i].a) score++;
    var d = {
      nick: nick, dept: dept, picks: picks, score: score, total: cfg.n,
      level: key === "post" ? levelOf(score) : null,
      at: new Date().toISOString(),
      attempt: key + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      sent: false
    };
    S.id = { nick: nick, dept: dept }; S[key] = d; save(); shareIdentity(nick, dept);
    lock(d); showResult(d); send();
    $("result").scrollIntoView({ block: "start" });
  }

  function showResult(d) {
    var cfg = QUIZ[key], when = new Date(d.at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
    var h = '<div class="result" id="result"><h2>ผล' + cfg.name + '</h2>' +
      '<p class="who">ชื่อเล่น ' + esc(d.nick) + (d.dept ? '  แผนก ' + esc(d.dept) : '') + '<br>ส่งเมื่อ ' + esc(when) + '  รหัสส่ง ' + esc(d.attempt.slice(-6).toUpperCase()) + '</p>' +
      '<p class="big">ได้ ' + d.score + ' จาก ' + d.total + ' ข้อ</p>';
    if (key === "post") {
      h += '<p class="lvl">คะแนนความรู้ (K) ระดับ ' + d.level + '</p><ul class="ladder">';
      for (var k = 0; k < LADDER.length; k++) h += '<li' + (LADDER[k][2] === d.level ? ' class="on"' : '') + '>' + LADDER[k][3] + '</li>';
      h += '</ul>';
    } else {
      h += '<p class="muted">แบบทดสอบนี้ไม่นับคะแนน ผมใช้เทียบกับหลังเรียนว่าคุณเข้าใจเพิ่มขึ้นแค่ไหน</p>';
    }
    var w = [];
    for (var i = 0; i < d.total; i++) if (d.picks[i] !== Q[i].a) w.push(i);
    if (!w.length) h += '<p class="lvl">ตอบถูกทุกข้อครับ</p>';
    else {
      h += '<p><b>ข้อที่ตอบไม่ถูก</b></p><ul class="wrongs">';
      w.forEach(function (i) {
        h += '<li><b>ข้อ ' + (i + 1) + '</b> คุณตอบ ' + LT[d.picks[i]] + ' แต่คำตอบที่ถูกคือ ' + LT[Q[i].a] + ' ' + esc(Q[i].o[Q[i].a]) +
          '<span class="why">เพราะ ' + esc(Q[i].why) + '</span></li>';
      });
      h += '</ul>';
    }
    h += '<p class="send wait" id="send" role="status">กำลังส่งผลถึงผู้สอน</p>' +
      '<button type="button" class="btn" id="retry" hidden>ส่งผลอีกครั้ง</button>' +
      '<div class="savebox"><p class="lb">เก็บผลนี้ไว้กับตัว</p>' +
      '<button type="button" class="btn btn-primary" id="saveimg">บันทึกผลเป็นรูปภาพ</button>' +
      '<button type="button" class="btn" id="savepdf">บันทึกผลเป็น PDF</button>' +
      '<p class="msg bad" id="savemsg" role="status"></p>' +
      '<div id="shot" hidden><img id="shotimg" alt="ภาพผลแบบทดสอบ" /><a class="btn" id="shotdl" download>ดาวน์โหลดรูป</a>' +
      '<p class="shotnote">ถ้ากดดาวน์โหลดไม่ได้ ให้กดค้างที่รูปแล้วเลือกบันทึกรูปภาพ</p></div></div>' +
      '<p class="shotnote">ถ้าระบบส่งผลไม่สำเร็จ ยื่นรูปหรือ PDF นี้ให้ TA ได้เลย</p>' +
      '<a class="btn btn-primary" href="' + CFG.menu + '">กลับเมนูสัปดาห์ 1</a></div>';
    $("res").innerHTML = h;
    $("retry").addEventListener("click", send);
    $("saveimg").addEventListener("click", function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { saveImage(d); }); });
    $("savepdf").addEventListener("click", savePdf);
  }

  // in-app browsers (LINE, Facebook, Instagram) ignore window.print(), so PDF needs Chrome/Safari; the image works everywhere
  var INAPP = /\bLine\/|FBAN|FBAV|Instagram/i.test(navigator.userAgent);
  function savePdf() {
    var m = $("savemsg");
    if (INAPP || typeof window.print !== "function") {
      m.textContent = "เบราว์เซอร์ในแอปนี้บันทึก PDF ไม่ได้ ให้กดบันทึกผลเป็นรูปภาพแทน หรือเปิดลิงก์นี้ใน Chrome หรือ Safari";
      return;
    }
    m.textContent = "";
    window.print(); // print sheet → "Save as PDF" (kit.css @media print keeps the answers + result only)
  }

  // Thai has no spaces between words: break on Intl.Segmenter words, else per character
  function wrap(ctx, text, max) {
    var parts = [];
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      var it = new Intl.Segmenter("th", { granularity: "word" }).segment(text);
      for (var seg of it) parts.push(seg.segment);
    } else parts = Array.from(text);
    var lines = [], cur = "";
    parts.forEach(function (p) {
      if (ctx.measureText(cur + p).width > max && cur) { lines.push(cur); cur = p.replace(/^\s+/, ""); }
      else cur += p;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function resultLines(d) {
    var cfg = QUIZ[key], L = [];
    L.push(["h", "ผล" + cfg.name + " สัปดาห์ 1"]);
    L.push(["m", "AI Pro Office  TNI × FutureSkill"]);
    L.push(["t", "ชื่อเล่น " + d.nick + (d.dept ? "  แผนก " + d.dept : "")]);
    L.push(["t", "ส่งเมื่อ " + new Date(d.at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) + "  รหัสส่ง " + d.attempt.slice(-6).toUpperCase()]);
    L.push(["big", "ได้ " + d.score + " จาก " + d.total + " ข้อ"]);
    if (key === "post") L.push(["b", "คะแนนความรู้ (K) ระดับ " + d.level]);
    var row = [];
    for (var i = 0; i < d.total; i++) row.push("ข้อ " + (i + 1) + " " + LT[d.picks[i]] + (d.picks[i] === Q[i].a ? " ถูก" : " ผิด"));
    L.push(["t", row.join("   ")]);
    for (i = 0; i < d.total; i++) if (d.picks[i] !== Q[i].a)
      L.push(["t", "ข้อ " + (i + 1) + " คำตอบที่ถูกคือ " + LT[Q[i].a] + " " + Q[i].o[Q[i].a]]);
    return L;
  }

  function saveImage(d) {
    var W = 1080, P = 64, max = W - P * 2, F = '"Noto Sans Thai", "Prompt", sans-serif';
    var ST = { h: [700, 46, 64, "#072B4E"], m: [500, 28, 46, "#5A6B7B"], t: [400, 30, 46, "#1B2733"], b: [700, 34, 52, "#072B4E"], big: [800, 64, 88, "#072B4E"] };
    var c = document.createElement("canvas"), ctx = c.getContext("2d");
    var L = resultLines(d), out = [];
    L.forEach(function (l) {
      var st = ST[l[0]]; ctx.font = st[0] + " " + st[1] + "px " + F;
      wrap(ctx, l[1], max).forEach(function (t) { out.push([st, t]); });
    });
    var H = P * 2 + out.reduce(function (a, o) { return a + o[0][2]; }, 0);
    c.width = W; c.height = H;
    ctx.fillStyle = "#FBFAF7"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#072B4E"; ctx.fillRect(0, 0, W, 14);
    var y = P;
    ctx.textBaseline = "top";
    out.forEach(function (o) {
      var st = o[0]; ctx.font = st[0] + " " + st[1] + "px " + F; ctx.fillStyle = st[3];
      ctx.fillText(o[1], P, y); y += st[2];
    });
    var url = c.toDataURL("image/png"), name = "tni-w1-" + key + "-quiz-" + (d.nick || "result").replace(/[^\w\u0E00-\u0E7F-]+/g, "") + ".png";
    $("shotimg").src = url; $("shotdl").href = url; $("shotdl").setAttribute("download", name);
    $("shot").hidden = false; $("savemsg").textContent = "";
    if (!INAPP) $("shotdl").click();
    $("shot").scrollIntoView({ block: "center" });
  }
  console.assert(typeof Array.from === "function", "Array.from");

  function send() {
    var d = S[key], box = $("send"), retry = $("retry");
    if (!d) return;
    if (d.sent) { box.className = "send ok"; box.textContent = "ส่งผลถึงผู้สอนแล้ว"; retry.hidden = true; return; }
    box.className = "send wait"; box.textContent = "กำลังส่งผลถึงผู้สอน"; retry.hidden = true; retry.disabled = true;
    var payload = {
      attempt_id: d.attempt, class_slug: CFG.classSlug, quiz: key, nickname: d.nick, department: d.dept,
      score: d.score, total: d.total, level: d.level,
      answers: d.picks.map(function (p, i) { return { q: i + 1, pick: LT[p], correct: LT[Q[i].a], ok: p === Q[i].a }; }),
      page_path: location.pathname, user_agent: navigator.userAgent.slice(0, 300)
    };
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var kill = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    fetch(CFG.rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CFG.anon, Authorization: "Bearer " + CFG.anon },
      body: JSON.stringify({ payload: payload }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      d.sent = true; save();
      box.className = "send ok"; box.textContent = "ส่งผลถึงผู้สอนแล้ว";
    }).catch(function () {
      box.className = "send bad"; box.textContent = "ยังส่งไม่สำเร็จ ลองกดส่งอีกครั้ง หรือถ่ายภาพหน้าจอนี้ให้ TA";
      retry.hidden = false;
    }).then(function () { clearTimeout(kill); retry.disabled = false; });
  }

  render();
})();
