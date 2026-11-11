// Hugging Face コース日本語版（デモ版）— クイズ / コードコピー / サイト内検索
(function () {
  var scriptSrc = document.currentScript ? document.currentScript.src : "";
  var siteRoot = scriptSrc.replace(/site\.js(\?.*)?$/, "");

  document.addEventListener("DOMContentLoaded", function () {
    initQuizzes();
    initCopyButtons();
    initSearch();
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
