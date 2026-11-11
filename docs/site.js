// Hugging Face コース日本語版（デモ版）— クイズのインタラクション
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".quiz").forEach(function (quiz) {
    if (quiz.classList.contains("quiz-fallback")) return;
    var feedback = quiz.querySelector(".quiz-feedback");
    quiz.querySelectorAll(".quiz-choice").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var correct = btn.getAttribute("data-correct") === "true";
        quiz.querySelectorAll(".quiz-choice").forEach(function (b) {
          b.classList.remove("is-correct", "is-wrong");
        });
        btn.classList.add(correct ? "is-correct" : "is-wrong");
        var src = btn.nextElementSibling;
        var explain = "";
        if (src && src.classList.contains("quiz-explain-src")) {
          explain = src.innerHTML;
        }
        feedback.innerHTML =
          '<p class="verdict ' + (correct ? "ok" : "ng") + '">' +
          (correct ? "正解です。" : "不正解です。") + "</p>" +
          (explain ? '<div class="quiz-explain">' + explain + "</div>" : "");
        feedback.hidden = false;
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([feedback]);
        }
      });
    });
  });
});
