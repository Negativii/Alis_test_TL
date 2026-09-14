// Логика теста: показ вопросов, сбор ответов, подсчёт типа, вывод результата.
(function () {
  "use strict";

  var state = {
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
  };

  // Шкала ответов: значение 1..5, тон и размер кружка
  var SCALE = [
    { value: 1, tone: "no",      size: 2, label: "Совсем не согласен" },
    { value: 2, tone: "no",      size: 1, label: "Скорее не согласен" },
    { value: 3, tone: "neutral", size: 0, label: "Нейтрально" },
    { value: 4, tone: "yes",     size: 1, label: "Скорее согласен" },
    { value: 5, tone: "yes",     size: 2, label: "Полностью согласен" },
  ];

  var screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };
  var el = {
    circles: document.getElementById("scale-circles"),
    question: document.getElementById("question-text"),
    progressBar: document.getElementById("progress-bar"),
    progressText: document.getElementById("progress-text"),
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
    void node.offsetWidth; // перезапуск анимации
    node.classList.add("animate-in");
  }

  // --- Шкала (строится один раз) ---
  function buildScale() {
    el.circles.innerHTML = "";
    SCALE.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "circle tone-" + s.tone + " sz-" + s.size;
      b.dataset.value = String(s.value);
      b.setAttribute("aria-label", s.label);
      b.title = s.label;
      b.addEventListener("click", function () { selectAnswer(s.value); });
      el.circles.appendChild(b);
    });
  }

  // --- Экран вопроса ---
  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;

    el.question.textContent = q.text;
    el.progressText.textContent = "Вопрос " + (state.index + 1) + " из " + total;
    el.progressBar.style.width = (state.index / total) * 100 + "%";

    var current = state.answers[state.index];
    [].forEach.call(el.circles.children, function (c) {
      c.classList.toggle("selected", Number(c.dataset.value) === current);
    });

    el.back.style.visibility = state.index === 0 ? "hidden" : "visible";

    animateIn(el.question);
    animateIn(el.circles);
  }

  function selectAnswer(value) {
    state.answers[state.index] = value;
    [].forEach.call(el.circles.children, function (c) {
      c.classList.toggle("selected", Number(c.dataset.value) === value);
    });
    setTimeout(function () {
      if (state.index < QUESTIONS.length - 1) {
        state.index++;
        el.progressBar.style.width = (state.index / QUESTIONS.length) * 100 + "%";
        renderQuestion();
      } else {
        showResult();
      }
    }, 220);
  }

  function goBack() {
    if (state.index > 0) {
      state.index--;
      renderQuestion();
    }
  }

  // --- Подсчёт результата ---
  function computeResult() {
    var sums = { EI: 0, SN: 0, TF: 0, JP: 0 };
    var max = { EI: 0, SN: 0, TF: 0, JP: 0 };

    QUESTIONS.forEach(function (q, i) {
      max[q.axis] += 2;
      var v = state.answers[i];
      if (v == null) return;
      sums[q.axis] += (v - 3) * q.sign;
    });

    var code = "";
    var axes = [];
    ["EI", "SN", "TF", "JP"].forEach(function (key) {
      var sum = sums[key];
      var meta = AXES[key];
      var isFirst = sum >= 0;
      var winner = isFirst ? meta.first : meta.second;
      var strength = Math.round(50 + (Math.abs(sum) / max[key]) * 50);
      code += winner.code;
      axes.push({
        first: meta.first, second: meta.second,
        isFirst: isFirst, winnerName: winner.name, strength: strength,
      });
    });
    return { code: code, axes: axes };
  }

  // --- Экран результата ---
  function showResult() {
    var result = computeResult();
    var type = TYPES[result.code];
    var theme = GROUP_THEME[type.group] || { color: "#5b6ee1", color2: "#8b5cf6" };

    screens.result.style.setProperty("--type-color", theme.color);
    screens.result.style.setProperty("--type-color-2", theme.color2);

    document.getElementById("result-emoji").textContent = TYPE_EMOJI[result.code] || "🧩";
    document.getElementById("result-code").textContent = result.code;
    document.getElementById("result-title").textContent = type.title;
    document.getElementById("result-group").textContent = type.group;
    document.getElementById("result-summary").textContent = type.summary;

    // Шкалы
    var axesBox = document.getElementById("result-axes");
    axesBox.innerHTML = "";
    var fills = [];
    result.axes.forEach(function (a) {
      var wrap = document.createElement("div");
      wrap.className = "axis";

      var labels = document.createElement("div");
      labels.className = "axis-labels";
      var left = document.createElement("span");
      left.className = "axis-pole" + (a.isFirst ? " win" : "");
      left.textContent = a.first.code + " · " + a.first.name;
      var right = document.createElement("span");
      right.className = "axis-pole" + (!a.isFirst ? " win" : "");
      right.textContent = a.second.name + " · " + a.second.code;
      labels.appendChild(left);
      labels.appendChild(right);

      var track = document.createElement("div");
      track.className = "axis-track";
      var fill = document.createElement("div");
      fill.className = "axis-fill " + (a.isFirst ? "first" : "second");
      track.appendChild(fill);
      fills.push({ node: fill, w: a.strength });

      var strength = document.createElement("div");
      strength.className = "axis-strength";
      strength.textContent = a.winnerName + " · " + a.strength + "%";

      wrap.appendChild(labels);
      wrap.appendChild(track);
      wrap.appendChild(strength);
      axesBox.appendChild(wrap);
    });

    // Разделы
    var sections = document.getElementById("result-sections");
    sections.innerHTML = "";
    sections.appendChild(listSection("💪", "Сильные стороны", type.strengths));
    sections.appendChild(textSection("💬", "Стиль общения", type.communication));
    sections.appendChild(textSection("⚠️", "Возможные сложности", type.challenges));
    sections.appendChild(textSection("🧭", "Подход к работе", type.work));

    show("result");

    // Анимация заполнения шкал после показа
    setTimeout(function () {
      fills.forEach(function (f) { f.node.style.width = f.w + "%"; });
    }, 120);
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

  function textSection(icon, title, text) {
    var box = document.createElement("div");
    box.className = "section";
    box.appendChild(sectionHead(icon, title));
    var p = document.createElement("p");
    p.textContent = text;
    box.appendChild(p);
    return box;
  }

  function listSection(icon, title, items) {
    var box = document.createElement("div");
    box.className = "section";
    box.appendChild(sectionHead(icon, title));
    var ul = document.createElement("ul");
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it;
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  // --- Поделиться ---
  function shareResult() {
    var code = document.getElementById("result-code").textContent;
    var title = document.getElementById("result-title").textContent;
    var url = location.href.split("#")[0].split("?")[0];
    var text = "Мой тип личности — " + code + " (" + title + "). Пройди тест и узнай свой:";
    if (navigator.share) {
      navigator.share({ title: "Тест типа личности", text: text, url: url }).catch(function () {});
      return;
    }
    copyText(text + " " + url);
  }

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(showShareHint, function () { fallbackCopy(t); });
    } else {
      fallbackCopy(t);
    }
  }
  function fallbackCopy(t) {
    try {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showShareHint();
    } catch (e) { /* тихо игнорируем */ }
  }
  function showShareHint() {
    el.shareHint.hidden = false;
    setTimeout(function () { el.shareHint.hidden = true; }, 2500);
  }

  function startTest() {
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    show("quiz");
    renderQuestion();
  }
  function restart() {
    show("intro");
  }

  // --- Управление клавишами ---
  document.addEventListener("keydown", function (e) {
    if (!screens.quiz.classList.contains("hidden")) {
      if (e.key >= "1" && e.key <= "5") { selectAnswer(Number(e.key)); }
      else if (e.key === "Backspace") { e.preventDefault(); goBack(); }
    } else if (!screens.intro.classList.contains("hidden")) {
      if (e.key === "Enter") { startTest(); }
    }
  });

  // --- Инициализация ---
  buildScale();
  document.getElementById("btn-start").addEventListener("click", startTest);
  el.back.addEventListener("click", goBack);
  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("btn-share").addEventListener("click", shareResult);
})();
