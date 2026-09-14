// Логика теста: показ вопросов, сбор ответов, подсчёт типа, вывод результата.
(function () {
  "use strict";

  var state = {
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
  };

  // Варианты ответа (шкала Ликерта 1..5)
  var LIKERT = [
    { value: 1, label: "Не согласен" },
    { value: 2, label: "Скорее нет" },
    { value: 3, label: "Нейтрально" },
    { value: 4, label: "Скорее да" },
    { value: 5, label: "Согласен" },
  ];

  var screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle("hidden", key !== name);
    });
    window.scrollTo(0, 0);
  }

  // --- Экран вопроса ---
  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;

    document.getElementById("question-text").textContent = q.text;
    document.getElementById("progress-text").textContent =
      "Вопрос " + (state.index + 1) + " из " + total;
    document.getElementById("progress-bar").style.width =
      (state.index / total) * 100 + "%";

    var opts = document.getElementById("options");
    opts.innerHTML = "";
    LIKERT.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option" + (state.answers[state.index] === l.value ? " selected" : "");
      b.textContent = l.label;
      b.addEventListener("click", function () {
        selectAnswer(l.value);
      });
      opts.appendChild(b);
    });

    document.getElementById("btn-back").style.visibility =
      state.index === 0 ? "hidden" : "visible";
  }

  function selectAnswer(value) {
    state.answers[state.index] = value;
    // короткая пауза, чтобы был виден выбранный вариант
    var buttons = document.querySelectorAll("#options .option");
    buttons.forEach(function (b) {
      b.classList.toggle("selected", b.textContent === labelFor(value));
    });
    setTimeout(function () {
      if (state.index < QUESTIONS.length - 1) {
        state.index++;
        renderQuestion();
      } else {
        showResult();
      }
    }, 180);
  }

  function labelFor(value) {
    for (var i = 0; i < LIKERT.length; i++) {
      if (LIKERT[i].value === value) return LIKERT[i].label;
    }
    return "";
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
      max[q.axis] += 2; // максимальный вклад одного вопроса
      var v = state.answers[i];
      if (v == null) return;
      sums[q.axis] += (v - 3) * q.sign;
    });

    var code = "";
    var axes = [];
    ["EI", "SN", "TF", "JP"].forEach(function (key) {
      var sum = sums[key];
      var meta = AXES[key];
      var isFirst = sum >= 0; // при равенстве берём первую букву
      var winner = isFirst ? meta.first : meta.second;
      var strength = Math.round(50 + (Math.abs(sum) / max[key]) * 50); // 50..100
      code += winner.code;
      axes.push({
        key: key,
        first: meta.first,
        second: meta.second,
        isFirst: isFirst,
        winnerName: winner.name,
        strength: strength,
      });
    });

    return { code: code, axes: axes };
  }

  // --- Экран результата ---
  function showResult() {
    var result = computeResult();
    var type = TYPES[result.code];

    document.getElementById("result-code").textContent = result.code;
    document.getElementById("result-title").textContent = type.title;
    document.getElementById("result-group").textContent = type.group;
    document.getElementById("result-summary").textContent = type.summary;

    // Шкалы
    var axesBox = document.getElementById("result-axes");
    axesBox.innerHTML = "";
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
      fill.style.width = a.strength + "%";
      track.appendChild(fill);

      var strength = document.createElement("div");
      strength.className = "axis-strength";
      strength.textContent = a.winnerName + " · " + a.strength + "%";

      wrap.appendChild(labels);
      wrap.appendChild(track);
      wrap.appendChild(strength);
      axesBox.appendChild(wrap);
    });

    // Разделы описания
    var sections = document.getElementById("result-sections");
    sections.innerHTML = "";
    sections.appendChild(listSection("Сильные стороны", type.strengths));
    sections.appendChild(textSection("Стиль общения", type.communication));
    sections.appendChild(textSection("Возможные сложности", type.challenges));
    sections.appendChild(textSection("Подход к работе", type.work));

    show("result");
  }

  function textSection(title, text) {
    var box = document.createElement("div");
    box.className = "section";
    var h = document.createElement("h3");
    h.textContent = title;
    var p = document.createElement("p");
    p.textContent = text;
    box.appendChild(h);
    box.appendChild(p);
    return box;
  }

  function listSection(title, items) {
    var box = document.createElement("div");
    box.className = "section";
    var h = document.createElement("h3");
    h.textContent = title;
    var ul = document.createElement("ul");
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it;
      ul.appendChild(li);
    });
    box.appendChild(h);
    box.appendChild(ul);
    return box;
  }

  function restart() {
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    show("intro");
  }

  // --- Инициализация ---
  document.getElementById("btn-start").addEventListener("click", function () {
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    show("quiz");
    renderQuestion();
  });
  document.getElementById("btn-back").addEventListener("click", goBack);
  document.getElementById("btn-restart").addEventListener("click", restart);
})();
