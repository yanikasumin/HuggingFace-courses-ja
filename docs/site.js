// Hugging Face コース日本語版— クイズ / コードコピー / サイト内検索
// Google Analytics (GA4) — 本番ホストでのみ計測する
(function () {
  if (location.hostname !== "yanikasumin.github.io") return;
  var GA_ID = "G-WFF350ZL06";
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
})();

(function () {
  var scriptSrc = document.currentScript ? document.currentScript.src : "";
  var siteRoot = scriptSrc.replace(/site\.js(\?.*)?$/, "");

  document.addEventListener("DOMContentLoaded", function () {
    initQuizzes();
    initCopyButtons();
    initSearch();
    initGlossPreviews();
    initGlossAccordion();
  });

  /* ---------------- クイズ（結果の集計＋localStorage 保存） ---------------- */
  function initQuizzes() {
    var quizzes = Array.prototype.slice.call(
      document.querySelectorAll(".quiz:not(.quiz-fallback)"));
    if (!quizzes.length) return;

    var storeKey = "hfquiz:" + location.pathname;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch (e) { saved = {}; }
    var state = {}; // quizIdx -> {choice: idx, ok: bool}

    var progress = document.createElement("div");
    progress.className = "quiz-progress";
    quizzes[0].parentNode.insertBefore(progress, quizzes[0]);

    function renderProgress() {
      var answered = Object.keys(state).length;
      var correct = Object.keys(state).filter(function (k) { return state[k].ok; }).length;
      progress.textContent = "このページのクイズ: " + quizzes.length + "問中 " +
        answered + "問回答 ・ 正解 " + correct + "問" +
        (answered === quizzes.length ? "（全問回答済み）" : "");
    }

    function showFeedback(quiz, btn) {
      var feedback = quiz.querySelector(".quiz-feedback");
      if (!feedback) return;
      var correct = btn.getAttribute("data-correct") === "true";
      quiz.querySelectorAll(".quiz-choice").forEach(function (b) {
        b.classList.remove("is-correct", "is-wrong");
      });
      btn.classList.add(correct ? "is-correct" : "is-wrong");
      var src = btn.nextElementSibling;
      var explain = "";
      if (src && src.classList.contains("quiz-explain-src")) explain = src.innerHTML;
      feedback.innerHTML =
        '<p class="verdict ' + (correct ? "ok" : "ng") + '">' +
        (correct ? "正解です。" : "不正解です。") + "</p>" +
        (explain ? '<div class="quiz-explain">' + explain + "</div>" : "");
      feedback.hidden = false;
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([feedback]);
      }
      return correct;
    }

    quizzes.forEach(function (quiz, qi) {
      quiz.querySelectorAll(".quiz-choice").forEach(function (btn, bi) {
        btn.addEventListener("click", function () {
          var ok = showFeedback(quiz, btn);
          state[qi] = { choice: bi, ok: ok };
          try {
            var data = {};
            Object.keys(state).forEach(function (k) { data[k] = state[k]; });
            localStorage.setItem(storeKey, JSON.stringify(data));
          } catch (e) { /* 保存できなくても動作は続ける */ }
          renderProgress();
        });
      });
      // 前回の回答を復元
      var s = saved[qi];
      if (s && typeof s.choice === "number") {
        var btns = quiz.querySelectorAll(".quiz-choice");
        if (btns[s.choice]) {
          var ok = showFeedback(quiz, btns[s.choice]);
          state[qi] = { choice: s.choice, ok: ok };
        }
      }
    });
    renderProgress();
  }

  /* ---------------- 用語リンク: クリックで遷移、ホバー／長押しでプレビュー ----------------
     クリック／タップではポップアップで止めず、その用語のページへそのまま
     遷移する（専用ページがある用語は href が詳細ページを指す）。
     プレビューは、マウスを一定時間置くか、タッチで長押ししたときだけ出す。
     長押しのプレビューは指を離しても残り、その直後のクリックは遷移させない
     （プレビュー内の導線から飛べる）。 */
  function initGlossPreviews() {
    var links = document.querySelectorAll(".gloss-link");
    if (!links.length) return;
    var pop = document.createElement("div");
    pop.className = "gloss-pop";
    pop.hidden = true;
    pop.setAttribute("role", "dialog");
    pop.innerHTML =
      '<p class="gloss-pop-title"></p>' +
      '<p class="gloss-pop-def"></p>' +
      '<p class="gloss-pop-foot"><a class="gloss-pop-more" href="#">用語集で見る →</a>' +
      '<button type="button" class="gloss-pop-close" aria-label="閉じる">×</button></p>';
    document.body.appendChild(pop);
    var titleEl = pop.querySelector(".gloss-pop-title");
    var defEl = pop.querySelector(".gloss-pop-def");
    var moreEl = pop.querySelector(".gloss-pop-more");

    var HOVER_DELAY = 500;     // マウスを置いてからプレビューを出すまで (ms)
    var LONGPRESS_DELAY = 500; // 長押しと判定するまでの時間 (ms)
    var HIDE_GRACE = 300;      // リンク→プレビューへポインタを移す猶予 (ms)
    var current = null;        // プレビュー表示中のリンク
    var pinned = false;        // 長押しで出したプレビュー（離しても残る）
    var showTimer = null, hideTimer = null, pressTimer = null;
    var pressLink = null, pressX = 0, pressY = 0;
    var suppressLink = null;   // 長押し直後のクリックを1回だけ抑止するリンク

    function clearShow() { if (showTimer) { clearTimeout(showTimer); showTimer = null; } }
    function clearHide() { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } }
    function clearPressTimer() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }

    function show(link, pin) {
      titleEl.textContent = link.getAttribute("data-title") || link.textContent;
      // 定義文は、リンク化済み HTML（data-def-html）があればそれを使う。
      // 中の用語リンクは通常のリンクとして遷移する（プレビューは付けない）
      var defHtml = link.getAttribute("data-def-html");
      if (defHtml) defEl.innerHTML = defHtml;
      else defEl.textContent = link.getAttribute("data-def") || "";
      var detail = link.getAttribute("data-detail");
      pop.classList.toggle("has-detail", !!detail);
      if (detail) {
        moreEl.setAttribute("href", detail);
        moreEl.textContent = "詳しい解説 →";
      } else {
        moreEl.setAttribute("href", link.getAttribute("href"));
        moreEl.textContent = "用語集で見る →";
      }
      pop.hidden = false;
      current = link;
      pinned = !!pin;
      var pw = Math.min(340, window.innerWidth - 24);
      pop.style.width = pw + "px";
      var r = link.getBoundingClientRect();
      var left = r.left + window.scrollX;
      var maxLeft = window.scrollX + window.innerWidth - pw - 12;
      if (left > maxLeft) left = maxLeft;
      if (left < window.scrollX + 12) left = window.scrollX + 12;
      pop.style.left = left + "px";
      pop.style.top = (r.bottom + window.scrollY + 8) + "px";
      var ph = pop.offsetHeight;
      if (r.bottom + 8 + ph > window.innerHeight && r.top - 8 - ph > 0) {
        pop.style.top = (r.top + window.scrollY - 8 - ph) + "px";
      }
    }
    function hide() {
      clearShow(); clearHide();
      pop.hidden = true;
      current = null;
      pinned = false;
    }
    function armHide() {
      clearHide();
      hideTimer = setTimeout(function () { if (!pinned) hide(); }, HIDE_GRACE);
    }

    links.forEach(function (link) {
      /* マウス／ペン: 一定時間置くとプレビュー、外すと消える */
      link.addEventListener("pointerenter", function (ev) {
        if (ev.pointerType === "touch") return;
        clearHide();
        clearShow();
        showTimer = setTimeout(function () { show(link, false); }, HOVER_DELAY);
      });
      link.addEventListener("pointerleave", function (ev) {
        if (ev.pointerType === "touch") return;
        clearShow();
        if (current === link && !pinned) armHide();
      });
      /* タッチ: 長押しでプレビューを出す（離しても残り、遷移しない） */
      link.addEventListener("pointerdown", function (ev) {
        if (ev.pointerType !== "touch") return;
        clearPressTimer();
        pressLink = link;
        pressX = ev.clientX; pressY = ev.clientY;
        pressTimer = setTimeout(function () {
          pressTimer = null;
          suppressLink = link; // 直後のクリック（指を離す動作）では飛ばない
          show(link, true);
        }, LONGPRESS_DELAY);
      });
      link.addEventListener("pointermove", function (ev) {
        if (ev.pointerType !== "touch" || !pressTimer) return;
        // 指が動いたらスクロール等の操作とみなして長押しをやめる
        if (Math.abs(ev.clientX - pressX) > 10 ||
            Math.abs(ev.clientY - pressY) > 10) clearPressTimer();
      });
      link.addEventListener("pointerup", function (ev) {
        if (ev.pointerType === "touch") clearPressTimer();
      });
      link.addEventListener("pointercancel", function () {
        clearPressTimer();
        pressLink = null;
      });
      /* 長押し直後のクリックだけ抑止する。それ以外のクリック／タップは
         通常どおりその用語のページへ遷移する */
      link.addEventListener("click", function (ev) {
        if (suppressLink === link) {
          ev.preventDefault();
          suppressLink = null;
        }
        pressLink = null;
      });
      /* 長押し時のブラウザ標準メニュー（リンク長押しメニュー等）を抑止する */
      link.addEventListener("contextmenu", function (ev) {
        if (pressLink === link || suppressLink === link) ev.preventDefault();
      });
    });

    /* プレビュー自体にポインタを移しても消えないようにする */
    pop.addEventListener("pointerenter", function (ev) {
      if (ev.pointerType !== "touch") clearHide();
    });
    pop.addEventListener("pointerleave", function (ev) {
      if (ev.pointerType !== "touch" && !pinned) armHide();
    });

    pop.querySelector(".gloss-pop-close").addEventListener("click", hide);
    document.addEventListener("click", function (ev) {
      if (pop.hidden || pop.contains(ev.target)) return;
      if (ev.target.closest && ev.target.closest(".gloss-link")) return;
      hide();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") hide();
    });
    window.addEventListener("resize", hide);
  }

  /* ---------------- 用語集ホーム: カテゴリ開閉 ---------------- */
  function initGlossAccordion() {
    var cats = document.querySelectorAll(".gloss-cat");
    if (!cats.length) return;

    function setOpen(sec, open) {
      var btn = sec.querySelector(".gloss-cat-toggle");
      var body = sec.querySelector(".gloss-cat-body");
      sec.classList.toggle("open", open);
      if (body) body.hidden = !open;
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function openForHash() {
      var id = (location.hash || "").replace(/^#/, "");
      if (!id) return;
      var target = null;
      try { target = document.getElementById(decodeURIComponent(id)); }
      catch (e) { target = document.getElementById(id); }
      if (!target) return;
      var sec = target.closest ? target.closest(".gloss-cat") : null;
      if (!sec) return;
      setOpen(sec, true);
      // 閉じた状態ではブラウザのフラグメント移動が効かないため、開いてから対象へ寄せる
      setTimeout(function () { target.scrollIntoView(); }, 0);
    }

    cats.forEach(function (sec) {
      var btn = sec.querySelector(".gloss-cat-toggle");
      if (!btn) return;
      btn.addEventListener("click", function () {
        setOpen(sec, !sec.classList.contains("open"));
      });
    });
    // 「カテゴリから探す」チップ: ハッシュが変わらない再クリックでも対象の節を開く
    document.querySelectorAll('a[href^="#cat-"]').forEach(function (a) {
      a.addEventListener("click", function () {
        var sec = document.getElementById(a.getAttribute("href").slice(1));
        if (sec && sec.classList.contains("gloss-cat")) setOpen(sec, true);
      });
    });
    window.addEventListener("hashchange", openForHash);
    openForHash();
  }

  /* ---------------- コードブロックのコピーボタン ---------------- */
  function initCopyButtons() {
    var blocks = [];
    document.querySelectorAll(".codehilite").forEach(function (el) { blocks.push(el); });
    document.querySelectorAll(".content pre").forEach(function (el) {
      if (el.closest(".codehilite") || el.closest(".quiz-fallback")) return;
      var wrap = document.createElement("div");
      wrap.className = "code-wrap";
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      blocks.push(wrap);
    });
    blocks.forEach(function (block) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "コピー";
      btn.addEventListener("click", function () {
        var pre = block.querySelector("pre") || block;
        var text = pre.innerText || pre.textContent || "";
        function done() {
          btn.textContent = "コピーしました";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = "コピー";
            btn.classList.remove("copied");
          }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else { fallbackCopy(text); done(); }
      });
      block.appendChild(btn);
    });
    function fallbackCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
    }
  }

  /* ---------------- サイト内全文検索 ---------------- */
  function initSearch() {
    var box = document.querySelector(".site-search");
    if (!box) return;
    var input = box.querySelector(".search-input");
    var results = box.querySelector(".search-results");
    var index = null;
    var loading = null;

    function loadIndex() {
      if (index || loading) return loading || Promise.resolve(index);
      loading = fetch(siteRoot + "search-index.json")
        .then(function (r) { return r.json(); })
        .then(function (data) { index = data; return data; })
        .catch(function () { index = []; return index; });
      return loading;
    }

    function close() { results.hidden = true; results.innerHTML = ""; }
    function esc(s) {
      return s.replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    function snippet(text, variants) {
      var lower = text.toLowerCase();
      var pos = -1;
      variants.forEach(function (t) {
        var p = lower.indexOf(t);
        if (p !== -1 && (pos === -1 || p < pos)) pos = p;
      });
      if (pos === -1) return esc(text.slice(0, 90)) + "…";
      var start = Math.max(0, pos - 35);
      var out = (start > 0 ? "…" : "") + text.slice(start, pos + 75) + "…";
      return esc(out);
    }

    function run() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { close(); return; }
      loadIndex().then(function (data) {
        if (input.value.trim().toLowerCase() !== q) return; // 入力が変わっていたら破棄
        // 語尾の長音「ー」の有無の揺れを吸収する（例: トークナイザ / トークナイザー）
        var terms = q.split(/\s+/).filter(Boolean).map(function (t) {
          if (t.endsWith("ー")) return [t, t.slice(0, -1)];
          return [t, t + "ー"];
        });
        var flatVariants = [];
        terms.forEach(function (vs) { vs.forEach(function (v) { flatVariants.push(v); }); });
        var hits = [];
        data.forEach(function (e) {
          var title = e.t.toLowerCase();
          var body = e.x.toLowerCase();
          var score = 0;
          var okAll = true;
          terms.forEach(function (vs) {
            var inTitle = vs.some(function (v) { return title.indexOf(v) !== -1; });
            var inBody = vs.some(function (v) { return body.indexOf(v) !== -1; });
            if (inTitle) score += 10;
            else if (inBody) score += 1;
            else okAll = false;
          });
          if (okAll) hits.push({ e: e, score: score });
        });
        hits.sort(function (a, b) { return b.score - a.score; });
        hits = hits.slice(0, 12);
        if (!hits.length) {
          results.innerHTML = '<p class="search-none">「' + esc(input.value.trim()) + '」に一致するページがありません。</p>';
        } else {
          results.innerHTML = hits.map(function (h) {
            return '<a class="search-item" href="' + siteRoot + h.e.u + '">' +
              '<span class="search-item-course">' + esc(h.e.c) + "</span>" +
              '<span class="search-item-title">' + esc(h.e.t) + "</span>" +
              '<span class="search-item-snip">' + snippet(h.e.x, flatVariants) + "</span></a>";
          }).join("");
        }
        results.hidden = false;
      });
    }

    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(run, 160);
    });
    input.addEventListener("focus", function () { if (input.value.trim().length >= 2) run(); });
    input.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { close(); input.blur(); } });
    document.addEventListener("click", function (ev) { if (!box.contains(ev.target)) close(); });
  }
})();
