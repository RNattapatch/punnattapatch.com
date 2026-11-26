// Class pages (quiz + homework): learner types first name + last name once, then the same work opens on any device.
// Backend = the client homework Worker (/api/homework/*): POST class-login gives one row per learner per class week
// (made from the class template row), save merges per field, images go to R2 like client homework files.
// Pun 2026-11-27: class of ~50 adults aged 40–60 switching phone ↔ laptop lost their work with localStorage only.
// Security is deliberately light (Pun's call): anyone who knows a learner's full name can open that learner's page.
(function () {
  "use strict";
  var API = "/api/homework/";
  var WHO = function (cls) { return "tni:who:" + cls; };
  var CSS = ".cc-gate{background:#fff;border:2px solid #072B4E;border-radius:16px;padding:22px 20px;margin:0 0 20px;font-size:19px;line-height:1.6;color:#1B2430}" +
    ".cc-gate h2{margin:0 0 6px;font-size:24px;color:#072B4E}.cc-gate p{margin:0 0 14px}.cc-gate label{display:block;font-weight:700;margin:12px 0 4px}" +
    ".cc-gate input{width:100%;box-sizing:border-box;font-size:20px;min-height:56px;padding:10px 14px;border:2px solid #9FB0C4;border-radius:12px;font-family:inherit}" +
    ".cc-gate input:focus{outline:3px solid #DD4155;border-color:#DD4155}.cc-gate button{width:100%;min-height:58px;margin-top:18px;font-size:21px;font-weight:700;border:0;border-radius:14px;background:#DD4155;color:#fff;font-family:inherit;cursor:pointer}" +
    ".cc-gate button:active{transform:scale(.98)}.cc-gate button[disabled]{opacity:.6}.cc-err{color:#B00020;font-weight:700;margin-top:10px}" +
    ".cc-bar{position:sticky;top:0;z-index:50;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between;background:#072B4E;color:#fff;padding:10px 16px;border-radius:12px;margin:0 0 16px;font-size:17px;line-height:1.4}" +
    ".cc-bar b{font-size:18px}.cc-bar .cc-st{font-weight:700}.cc-bar .cc-st.bad{color:#FFD166}.cc-bar button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.6);border-radius:10px;padding:6px 12px;font-size:15px;font-family:inherit;cursor:pointer}" +
    "body.cc-locked .cc-hide{display:none!important}";

  function readWho(cls) { try { return JSON.parse(localStorage.getItem(WHO(cls)) || "null"); } catch (e) { return null; } }
  function writeWho(cls, w) { try { if (w) localStorage.setItem(WHO(cls), JSON.stringify(w)); else localStorage.removeItem(WHO(cls)); } catch (e) {} }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hhmm(d) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }
  var ERR = {
    bad_name: "กรอกชื่อจริงและนามสกุลเป็นตัวหนังสือครับ",
    class_not_found: "ยังไม่เปิดระบบของสัปดาห์นี้ แจ้งผู้สอนหรือ TA ได้เลยครับ",
    rate_limited: "มีคนเข้าพร้อมกันเยอะ รอสักครู่แล้วกดอีกครั้งครับ"
  };

  // Page keys use letters, digits and "_"; the Worker accepts letters, digits and ".", so "_" travels as "."
  var enc = function (k) { return String(k).replace(/_/g, "."); };
  var dec = function (q) { return String(q).replace(/\./g, "_"); };

  function Session(cls, who) {
    var self = this, pending = {}, timer = null, inflight = false, listeners = [], mirror = { a: {}, f: {} }, state = "ok", lastAt = null;
    self.cls = cls; self.slug = who.slug; self.first = who.first; self.last = who.last; self.nick = who.nick || "";
    self.fullName = (who.first + " " + who.last).trim();
    function setState(s) { state = s; listeners.forEach(function (f) { f(s, lastAt); }); }
    self.onStatus = function (f) { listeners.push(f); f(state, lastAt); };
    self.fileUrl = function (id) { return API + self.slug + "/file/" + id; };
    // values are JSON so numbers, checkboxes and objects come back with their own type
    self.load = function () {
      return fetch(API + self.slug, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("load " + r.status);
        return r.json();
      }).then(function (j) {
        var out = {};
        mirror = { a: {}, f: {} };
        Object.keys(j.answers || {}).forEach(function (q) {
          var t = (j.answers[q] || {}).text; mirror.a[q] = t;
          try { out[dec(q)] = JSON.parse(t); } catch (e) { out[dec(q)] = t; }
        });
        (j.files || []).forEach(function (f) { mirror.f[f.id] = 1; f.key = dec(f.qid); });
        return { values: out, files: j.files || [], submitted_at: j.submitted_at, state: j.state };
      });
    };
    self.save = function (obj) {
      Object.keys(obj).forEach(function (k) { pending[enc(k)] = { text: JSON.stringify(obj[k] == null ? "" : obj[k]) }; });
      setState("saving");
      clearTimeout(timer); timer = setTimeout(flush, 900);
    };
    function flush() {
      if (inflight) { clearTimeout(timer); timer = setTimeout(flush, 600); return Promise.resolve(); }
      var batch = pending; pending = {};
      if (!Object.keys(batch).length) { if (state === "saving") setState("ok"); return Promise.resolve(); }
      inflight = true;
      return post(API + self.slug + "/save", { answers: batch }).then(function (j) {
        inflight = false;
        if (!j.ok && j.error !== "nothing_to_save") throw new Error(j.error || "save");   // unknown-only fields are dropped, not retried
        Object.keys(batch).forEach(function (q) { mirror.a[q] = batch[q].text; });
        lastAt = new Date(); setState(Object.keys(pending).length ? "saving" : "ok");
      }).catch(function () {
        inflight = false;
        Object.keys(batch).forEach(function (q) { if (!pending[q]) pending[q] = batch[q]; });
        setState("offline");
        clearTimeout(timer); timer = setTimeout(flush, 5000);   // keep trying until the Wi-Fi comes back
      });
    }
    self.flush = flush;
    self.upload = function (key, blob, name) {
      setState("saving");
      return fetch(API + self.slug + "/file?q=" + encodeURIComponent(enc(key)) + "&name=" + encodeURIComponent(name || key + ".jpg"), { method: "POST", body: blob })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j.ok) throw new Error(j.error || "upload");
          mirror.f[j.file.id] = 1; lastAt = new Date(); setState("ok");
          return j.file;
        }).catch(function (e) { setState("offline"); throw e; });
    };
    self.remove = function (id) {
      delete mirror.f[id];
      return fetch(API + self.slug + "/file/" + id, { method: "DELETE" }).catch(function () {});
    };
    self.submit = function () { return flush().then(function () { return post(API + self.slug + "/submit", {}); }); };
    self.hasPending = function () { return inflight || Object.keys(pending).length > 0; };
    // Came back to this tab after typing on another device? Reload so the newer work shows instead of being overwritten.
    self.watchOtherDevices = function (onChange) {
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible" || self.hasPending()) return;
        fetch(API + self.slug, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (!j || self.hasPending()) return;
          var a = j.answers || {}, changed = Object.keys(a).some(function (q) { return a[q].text !== mirror.a[q]; }) ||
            (j.files || []).length !== Object.keys(mirror.f).length || (j.files || []).some(function (f) { return !mirror.f[f.id]; });
          if (changed) (onChange || function () { location.reload(); })();
        }).catch(function () {});
      });
    };
    window.addEventListener("beforeunload", function (e) { if (self.hasPending()) { flush(); e.preventDefault(); e.returnValue = ""; } });
  }

  function bar(mount, sess, cls) {
    var b = el("div", { "class": "cc-bar", role: "status" });
    b.innerHTML = '<span>ทำในชื่อ <b>' + esc(sess.fullName) + '</b>' + (sess.nick ? " (" + esc(sess.nick) + ")" : "") + '</span><span class="cc-st" aria-live="polite"></span><button type="button">ไม่ใช่ฉัน</button>';
    mount.insertBefore(b, mount.firstChild);
    var st = b.querySelector(".cc-st");
    sess.onStatus(function (s, at) {
      st.classList.toggle("bad", s === "offline");
      st.textContent = s === "saving" ? "กำลังบันทึก..." : s === "offline" ? "ยังบันทึกไม่ได้ เน็ตหลุด ระบบจะลองใหม่เอง" : at ? "บันทึกแล้ว " + hhmm(at) + " น." : "เปิดเครื่องไหนก็ทำต่อได้";
    });
    b.querySelector("button").addEventListener("click", function () {
      if (!confirm("ออกจากชื่อ " + sess.fullName + " ในเครื่องนี้ใช่ไหม งานที่บันทึกไว้ไม่หาย กรอกชื่อเดิมเมื่อไหร่ก็เปิดต่อได้")) return;
      sess.flush().then(function () { writeWho(cls, null); location.reload(); });
    });
  }

  // opts: { cls, mount (element the gate/bar go into), title }. Resolves with a Session once the learner is known.
  function start(opts) {
    if (!document.getElementById("cc-css")) { var st = el("style", { id: "cc-css" }); st.textContent = CSS; document.head.appendChild(st); }
    var mount = opts.mount, cls = opts.cls, who = readWho(cls);
    if (who && who.slug) { var s0 = new Session(cls, who); bar(mount, s0, cls); return Promise.resolve(s0); }
    document.body.classList.add("cc-locked");
    return new Promise(function (resolve) {
      var g = el("form", { "class": "cc-gate", novalidate: "" });
      g.innerHTML = '<h2>เริ่มด้วยชื่อของคุณ</h2>' +
        '<p>กรอกชื่อจริงกับนามสกุลของคุณเองครั้งเดียว ระบบบันทึกให้ทุกครั้งที่พิมพ์ เปลี่ยนไปใช้มือถือหรือคอมเครื่องอื่น ก็กรอกชื่อเดิมแล้วทำต่อได้เลย</p>' +
        '<p style="font-size:17px;color:#5B6573">ชื่อของคุณใช้บันทึกผลให้ผู้สอนเท่านั้น ส่วนกติกาห้ามใส่ชื่อคน หมายถึงชื่อคนอื่นที่อยู่ในเอกสารงาน ห้ามใส่ลงแชท AI</p>' +
        '<label for="cc-first">ชื่อจริง</label><input id="cc-first" autocomplete="given-name" enterkeyhint="next" placeholder="เช่น สมชาย" required>' +
        '<label for="cc-last">นามสกุล</label><input id="cc-last" autocomplete="family-name" enterkeyhint="next" placeholder="เช่น ใจดี" required>' +
        '<label for="cc-nick">ชื่อเล่น (ไม่บังคับ)</label><input id="cc-nick" autocomplete="nickname" enterkeyhint="go" placeholder="เช่น ต้น">' +
        '<button type="submit">เริ่มทำ หรือทำต่อจากที่ค้างไว้</button><p class="cc-err" role="alert"></p>';
      mount.insertBefore(g, mount.firstChild);
      var err = g.querySelector(".cc-err"), btn = g.querySelector("button");
      g.addEventListener("submit", function (e) {
        e.preventDefault();
        var first = g.querySelector("#cc-first").value.trim(), last = g.querySelector("#cc-last").value.trim(), nick = g.querySelector("#cc-nick").value.trim();
        if (!first || !last) { err.textContent = "กรอกทั้งชื่อจริงและนามสกุลครับ ใช้ชื่อเดิมทุกครั้งที่เปิดจากเครื่องอื่น"; return; }
        btn.disabled = true; btn.textContent = "กำลังเปิด..."; err.textContent = "";
        post(API + "class-login", { cls: cls, first: first, last: last, nick: nick }).then(function (j) {
          if (!j.ok) throw new Error(ERR[j.error] || "เปิดไม่ได้ ลองกดอีกครั้ง หรือแจ้ง TA ครับ");
          var w = { slug: j.slug, first: j.first, last: j.last, nick: j.nick };
          writeWho(cls, w);
          var s = new Session(cls, w);
          s.isNew = j.created || (!j.saved && !j.files);
          g.remove(); document.body.classList.remove("cc-locked");
          bar(mount, s, cls);
          var hi = el("p", { "class": "cc-gate", role: "status" }, s.isNew
            ? "สวัสดีครับคุณ" + esc(w.nick || w.first) + " เริ่มได้เลย ระบบบันทึกให้เองทุกครั้งที่พิมพ์"
            : "ยินดีต้อนรับกลับครับคุณ" + esc(w.nick || w.first) + " งานที่บันทึกไว้ " + (j.saved + j.files) + " รายการเปิดขึ้นมาแล้ว ทำต่อได้เลย");
          mount.insertBefore(hi, mount.children[1] || null);
          setTimeout(function () { hi.remove(); }, 9000);
          resolve(s);
        }).catch(function (x) { btn.disabled = false; btn.textContent = "เริ่มทำ หรือทำต่อจากที่ค้างไว้"; err.textContent = x.message.length < 80 ? x.message : "เปิดไม่ได้ ลองอีกครั้งครับ"; });
      });
    });
  }

  function dataUrlToBlob(d) {
    var p = d.split(","), bin = atob(p[1]), n = bin.length, u = new Uint8Array(n);
    while (n--) u[n] = bin.charCodeAt(n);
    return new Blob([u], { type: (p[0].match(/:(.*?);/) || [])[1] || "image/jpeg" });
  }
  function urlToDataUrl(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error("file " + r.status); return r.blob(); }).then(function (b) {
      return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); });
    }).then(function (d) {
      return new Promise(function (res) { var im = new Image(); im.onload = function () { res({ d: d, w: im.naturalWidth, h: im.naturalHeight }); }; im.onerror = function () { res({ d: d, w: 0, h: 0 }); }; im.src = d; });
    });
  }

  window.ClassCloud = { start: start, dataUrlToBlob: dataUrlToBlob, urlToDataUrl: urlToDataUrl, readWho: readWho };
})();
