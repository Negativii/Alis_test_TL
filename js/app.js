/* ============================================================
   Движок мультитеста: выбор теста → прохождение → результат.
   Поддерживает два формата вопросов: "bipolar" (две формулировки)
   и "agree" (утверждение + шкала согласия). Оба — шкала 1..5.
   ============================================================ */
(function () {
  "use strict";

  var TESTS = [MBTI_TEST, ENNEAGRAM_TEST];

  var SCALE = [
    { value: 1, tone: "no",      size: 2 },
    { value: 2, tone: "no",      size: 1 },
    { value: 3, tone: "neutral", size: 0 },
    { value: 4, tone: "yes",     size: 1 },
    { value: 5, tone: "yes",     size: 2 },
  ];
  var LABELS = ["Совсем нет", "Скорее нет", "Нейтрально", "Скорее да", "Точно да"];

  var state = { test: null, index: 0, answers: [] };

  var screens = {
    chooser: document.getElementById("screen-chooser"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };
  var el = {
    chooserList: document.getElementById("chooser-list"),
    circles: document.getElementById("scale-circles"),
    prompt: document.getElementById("q-prompt"),
    scale: document.getElementById("scale"),
    scaleLeft: document.getElementById("scale-left"),
    scaleRight: document.getElementById("scale-right"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
    quizTitle: document.getElementById("quiz-title"),
    back: document.getElementById("btn-back"),
    shareHint: document.getElementById("share-hint"),
  };

  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
    animateIn(screens[name]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function animateIn(node) {
    node.classList.remove("animate-in");
    void node.offsetWidth;
    node.classList.add("animate-in");
  }

  // --- Экран выбора теста ---
  function renderChooser() {
    el.chooserList.innerHTML = "";
    TESTS.forEach(function (t) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "test-card";
      card.style.setProperty("--card-accent", t.accent);
      card.style.setProperty("--card-accent-2", t.accent2);

      var emoji = document.createElement("div");
      emoji.className = "test-card-emoji";
      emoji.textContent = t.emoji;

      var body = document.createElement("div");
      body.className = "test-card-body";
      var h = document.createElement("h3");
      h.textContent = t.title;
      var p = document.createElement("p");
      p.textContent = t.subtitle;
      var meta = document.createElement("span");
      meta.className = "test-card-meta";
      meta.textContent = t.meta;
      body.appendChild(h);
      body.appendChild(p);
      body.appendChild(meta);

      var go = document.createElement("span");
      go.className = "test-card-go";
      go.textContent = "→";

      card.appendChild(emoji);
      card.appendChild(body);
      card.appendChild(go);
      card.addEventListener("click", function () { startTest(t); });
      el.chooserList.appendChild(card);
    });
  }

  // --- Шкала (кружки) ---
  function buildScale() {
    el.circles.innerHTML = "";
    SCALE.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "circle tone-" + s.tone + " sz-" + s.size;
      b.dataset.value = String(s.value);
      b.setAttribute("aria-label", LABELS[s.value - 1]);
      b.title = LABELS[s.value - 1];
      b.addEventListener("click", function () { selectAnswer(s.value); });
      el.circles.appendChild(b);
    });
  }

  // --- Старт теста ---
  function startTest(test) {
    state.test = test;
    state.index = 0;
    state.answers = new Array(test.questions.length).fill(null);
    el.quizTitle.textContent = test.title;
    show("quiz");
    renderQuestion();
  }

  // --- Экран вопроса ---
  function renderQuestion() {
    var test = state.test;
    var q = test.questions[state.index];
    var total = test.questions.length;

    el.progressText.textContent = "Вопрос " + (state.index + 1) + " из " + total;
    el.progressBar.style.width = (state.index / total) * 100 + "%";

    if (test.format === "bipolar") {
      el.prompt.textContent = "Что тебе ближе?";
      el.prompt.classList.add("q-prompt--hint");
      el.scale.classList.add("scale--bipolar");
      el.scaleLeft.textContent = q.left;
      el.scaleRight.textContent = q.right;
    } else {
      el.prompt.textContent = q.text;
      el.prompt.classList.remove("q-prompt--hint");
      el.scale.classList.remove("scale--bipolar");
      el.scaleLeft.textContent = "Не согласен";
      el.scaleRight.textContent = "Согласен";
    }

    var current = state.answers[state.index];
    [].forEach.call(el.circles.children, function (c) {
      c.classList.toggle("selected", Number(c.dataset.value) === current);
    });

    el.back.style.visibility = state.index === 0 ? "hidden" : "visible";
    animateIn(el.prompt);
    animateIn(el.scale);
  }

  function selectAnswer(value) {
    if (!state.test) return;
    state.answers[state.index] = value;
    [].forEach.call(el.circles.children, function (c) {
      c.classList.toggle("selected", Number(c.dataset.value) === value);
    });
    setTimeout(function () {
      if (state.index < state.test.questions.length - 1) {
        state.index++;
        renderQuestion();
      } else {
        renderResult(state.test.score(state.answers));
      }
    }, 200);
  }

  function goBack() {
    if (state.index > 0) { state.index--; renderQuestion(); }
  }

  // --- Экран результата ---
  function renderResult(res) {
    var r = screens.result;
    r.style.setProperty("--type-color", res.themeColor);
    r.style.setProperty("--type-color-2", res.themeColor2);

    document.getElementById("result-emoji").textContent = res.emoji;
    document.getElementById("result-code").textContent = res.code;
    document.getElementById("result-title").textContent = res.title;
    document.getElementById("result-group").textContent = res.badge;
    document.getElementById("result-summary").textContent = res.summary;

    var barsBox = document.getElementById("result-axes");
    barsBox.innerHTML = "";
    var fills = [];
    res.bars.forEach(function (bar) {
      var node = bar.kind === "axis" ? axisBar(bar, fills) : meterBar(bar, fills);
      barsBox.appendChild(node);
    });

    var sections = document.getElementById("result-sections");
    sections.innerHTML = "";
    res.sections.forEach(function (s) {
      sections.appendChild(s.items ? listSection(s) : textSection(s));
    });

    // сохраним для «поделиться»
    state.lastResult = res;

    show("result");
    setTimeout(function () {
      fills.forEach(function (f) { f.node.style.width = f.w + "%"; });
    }, 120);
  }

  function axisBar(bar, fills) {
    var wrap = document.createElement("div");
    wrap.className = "axis";
    var labels = document.createElement("div");
    labels.className = "axis-labels";
    var left = document.createElement("span");
    left.className = "axis-pole" + (bar.winnerIsLeft ? " win" : "");
    left.textContent = bar.leftCode + " · " + bar.leftName;
    var right = document.createElement("span");
    right.className = "axis-pole" + (!bar.winnerIsLeft ? " win" : "");
    right.textContent = bar.rightName + " · " + bar.rightCode;
    labels.appendChild(left);
    labels.appendChild(right);

    var track = document.createElement("div");
    track.className = "axis-track";
    var fill = document.createElement("div");
    fill.className = "axis-fill " + (bar.winnerIsLeft ? "first" : "second");
    track.appendChild(fill);
    fills.push({ node: fill, w: bar.pct });

    var strength = document.createElement("div");
    strength.className = "axis-strength";
    strength.textContent = bar.winnerName + " · " + bar.pct + "%";

    wrap.appendChild(labels);
    wrap.appendChild(track);
    wrap.appendChild(strength);
    return wrap;
  }

  function meterBar(bar, fills) {
    var wrap = document.createElement("div");
    wrap.className = "meter" + (bar.highlight ? " meter--top" : "");
    var head = document.createElement("div");
    head.className = "meter-head";
    var label = document.createElement("span");
    label.textContent = bar.label;
    var pct = document.createElement("span");
    pct.className = "meter-pct";
    pct.textContent = bar.pct + "%";
    head.appendChild(label);
    head.appendChild(pct);

    var track = document.createElement("div");
    track.className = "axis-track";
    var fill = document.createElement("div");
    fill.className = "axis-fill first";
    track.appendChild(fill);
    fills.push({ node: fill, w: bar.pct });

    wrap.appendChild(head);
    wrap.appendChild(track);
    return wrap;
  }

  function sectionHead(icon, title) {
    var head = document.createElement("div");
    head.className = "section-head";
    var ic = document.createElement("span");
    ic.className = "section-icon";
    ic.textContent = icon;
    var h = document.createElement("h3");
    h.textContent = title;
    head.appendChild(ic);
    head.appendChild(h);
    return head;
  }
  function textSection(s) {
    var box = document.createElement("div");
    box.className = "section";
    box.appendChild(sectionHead(s.icon, s.title));
    var p = document.createElement("p");
    p.textContent = s.text;
    box.appendChild(p);
    return box;
  }
  function listSection(s) {
    var box = document.createElement("div");
    box.className = "section";
    box.appendChild(sectionHead(s.icon, s.title));
    var ul = document.createElement("ul");
    s.items.forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it;
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  // --- Поделиться ---
  function shareResult() {
    var res = state.lastResult;
    if (!res) return;
    var url = location.href.split("#")[0].split("?")[0];
    var text = "Мой результат — " + res.code + " (" + res.title + "), тест «" +
      state.test.title + "». Пройди и узнай свой:";
    if (navigator.share) {
      navigator.share({ title: "Тесты типа личности", text: text, url: url }).catch(function () {});
      return;
    }
    copyText(text + " " + url);
  }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(showShareHint, function () { fallbackCopy(t); });
    } else { fallbackCopy(t); }
  }
  function fallbackCopy(t) {
    try {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showShareHint();
    } catch (e) {}
  }
  function showShareHint() {
    el.shareHint.hidden = false;
    setTimeout(function () { el.shareHint.hidden = true; }, 2500);
  }

  function restart() {
    if (state.test) startTest(state.test);
  }
  function toChooser() {
    state.test = null;
    show("chooser");
  }

  // --- Клавиатура ---
  document.addEventListener("keydown", function (e) {
    if (!screens.quiz.classList.contains("hidden")) {
      if (e.key >= "1" && e.key <= "5") { selectAnswer(Number(e.key)); }
      else if (e.key === "Backspace") { e.preventDefault(); goBack(); }
    }
  });

  // --- Инициализация ---
  buildScale();
  renderChooser();
  el.back.addEventListener("click", goBack);
  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-share").addEventListener("click", shareResult);
  document.getElementById("btn-other").addEventListener("click", toChooser);
  document.getElementById("btn-quit").addEventListener("click", toChooser);
})();
