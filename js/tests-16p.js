/* ============================================================
   Тест «16 типов личности» — формат по мотивам 16Personalities:
   утверждения со шкалой согласия 1..5. Выдаёт тип из 16 (MBTI).
   Переиспользует описания типов из tests-mbti.js
   (MBTI_TYPES, MBTI_EMOJI, MBTI_GROUP_THEME, MBTI_AXES).
   Содержание вопросов — оригинальное.
   ============================================================ */

// dir: +1 — согласие тянет к ПЕРВОЙ букве (E/S/T/J), -1 — ко второй (I/N/F/P)
var MBTI16P_QUESTIONS = [
  // EI
  { axis: "EI", dir: +1, text: "Мне легко начать разговор с незнакомым человеком." },
  { axis: "EI", dir: +1, text: "В компании я обычно говорю больше, чем слушаю." },
  { axis: "EI", dir: +1, text: "Меня заряжает энергией, когда вокруг много людей." },
  { axis: "EI", dir: -1, text: "После активного общения мне нужно побыть одному, чтобы восстановиться." },
  { axis: "EI", dir: -1, text: "Глубокий разговор наедине я предпочту шумной вечеринке." },
  { axis: "EI", dir: -1, text: "Прежде чем высказаться, я обычно долго обдумываю мысль про себя." },
  // SN
  { axis: "SN", dir: +1, text: "Я больше доверяю фактам и конкретному опыту, чем догадкам." },
  { axis: "SN", dir: +1, text: "Мне важны детали и практическая польза идеи." },
  { axis: "SN", dir: +1, text: "Я замечаю, что происходит вокруг здесь и сейчас, и живу настоящим." },
  { axis: "SN", dir: -1, text: "Меня больше увлекают идеи и возможности, чем конкретные детали." },
  { axis: "SN", dir: -1, text: "Я часто думаю о будущем и о том, как всё могло бы быть." },
  { axis: "SN", dir: -1, text: "Мне нравится искать скрытый смысл и связи между вещами." },
  // TF
  { axis: "TF", dir: +1, text: "Принимая решение, я в первую очередь опираюсь на логику, а не на эмоции." },
  { axis: "TF", dir: +1, text: "Мне важнее быть справедливым, чем никого не задеть." },
  { axis: "TF", dir: +1, text: "Я могу спокойно указать на ошибку, даже если это кого-то расстроит." },
  { axis: "TF", dir: -1, text: "Мне важно, чтобы всем в коллективе было комфортно." },
  { axis: "TF", dir: -1, text: "Принимая решение, я учитываю чувства людей, которых оно затронет." },
  { axis: "TF", dir: -1, text: "Я тяжело переношу конфликты и стараюсь их сглаживать." },
  // JP
  { axis: "JP", dir: +1, text: "Я люблю, когда всё распланировано заранее." },
  { axis: "JP", dir: +1, text: "Мне спокойнее, когда дела сделаны заранее, а не в последний момент." },
  { axis: "JP", dir: +1, text: "Я предпочитаю чёткий распорядок и списки задач." },
  { axis: "JP", dir: -1, text: "Я легко меняю планы, если появляется что-то интересное." },
  { axis: "JP", dir: -1, text: "Мне комфортно действовать спонтанно, без жёсткого плана." },
  { axis: "JP", dir: -1, text: "Я часто откладываю дела и берусь за них в последний момент." },
];

var MBTI_16P_TEST = {
  id: "mbti16p",
  title: "16 типов личности",
  subtitle: "16 типов · по мотивам 16Personalities",
  emoji: "🧩",
  accent: "#5b6ee1",
  accent2: "#8b5cf6",
  format: "agree",
  lead: "24 утверждения. Отметь, насколько каждое про тебя. В конце — твой тип из 16 по системе MBTI.",
  meta: "24 вопроса · около 4 минут",
  questions: MBTI16P_QUESTIONS,

  score: function (answers) {
    var sums = { EI: 0, SN: 0, TF: 0, JP: 0 };
    var max = { EI: 0, SN: 0, TF: 0, JP: 0 };
    MBTI16P_QUESTIONS.forEach(function (q, i) {
      max[q.axis] += 2;
      var v = answers[i];
      if (v == null) v = 3;
      sums[q.axis] += (v - 3) * q.dir;
    });

    var code = "";
    var bars = [];
    ["EI", "SN", "TF", "JP"].forEach(function (axis) {
      var s = sums[axis], m = max[axis], meta = MBTI_AXES[axis];
      var isFirst = s >= 0; // первая буква E/S/T/J
      var winner = isFirst ? meta.left.code : meta.right.code;
      var winnerName = isFirst ? meta.left.name : meta.right.name;
      var pct = Math.min(100, Math.round(50 + (Math.abs(s) / m) * 50));
      code += winner;
      bars.push({
        kind: "axis",
        leftCode: meta.left.code, leftName: meta.left.name,
        rightCode: meta.right.code, rightName: meta.right.name,
        winnerIsLeft: isFirst, winnerName: winnerName, pct: pct,
      });
    });

    var type = MBTI_TYPES[code];
    var theme = MBTI_GROUP_THEME[type.group] || { color: this.accent, color2: this.accent2 };
    return {
      emoji: MBTI_EMOJI[code] || "🧩",
      code: code,
      title: type.title,
      badge: type.group,
      summary: type.summary,
      themeColor: theme.color,
      themeColor2: theme.color2,
      bars: bars,
      sections: [
        { icon: "💪", title: "Сильные стороны", items: type.strengths },
        { icon: "💬", title: "Стиль общения", text: type.communication },
        { icon: "⚠️", title: "Возможные сложности", text: type.challenges },
        { icon: "🧭", title: "Подход к работе", text: type.work },
      ],
    };
  },
};
