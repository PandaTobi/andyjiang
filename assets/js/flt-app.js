(function () {
  "use strict";

  const course = window.FLT_COURSE;
  const root = document.getElementById("course-view");
  const helpDialog = document.getElementById("help-dialog");
  const resetDialog = document.getElementById("reset-dialog");
  const storageKey = "andyjiang-flt-course-v1";

  if (!course || !root) return;

  const questionMap = new Map();
  course.units.forEach(function (unit) {
    unit.questionBank.forEach(function (question) { questionMap.set(question.id, question); });
  });

  function freshState() {
    return {
      version: course.version,
      completedUnits: {},
      exercises: {},
      tests: {},
      sessions: {},
      stats: { attempted: 0, correct: 0, incorrect: 0, givenUp: 0 },
      lastRoute: "#/dashboard"
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || saved.version !== course.version) return freshState();
      const base = freshState();
      return Object.assign(base, saved, {
        completedUnits: saved.completedUnits || {},
        exercises: saved.exercises || {},
        tests: saved.tests || {},
        sessions: saved.sessions || {},
        stats: Object.assign(base.stats, saved.stats || {})
      });
    } catch (error) {
      return freshState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      announce("Progress could not be saved in this browser.");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + String(seconds).padStart(2, "0");
  }

  function unitById(id) { return course.units.find(function (unit) { return unit.id === id; }); }
  function chapterById(id) { return course.chapters.find(function (chapter) { return chapter.id === id; }); }

  function bestScore(kind, id) {
    const record = kind === "exercise" ? state.exercises[id] : state.tests[id];
    return record && typeof record.best === "number" ? record.best : null;
  }

  function chapterIsComplete(chapter) {
    return chapter.units.every(function (unit) { return Boolean(state.completedUnits[unit.id]); }) && bestScore("test", chapter.id) !== null;
  }

  function overallProgress() {
    const total = course.units.length + course.chapters.length;
    const completedUnits = course.units.filter(function (unit) { return Boolean(state.completedUnits[unit.id]); }).length;
    const completedTests = course.chapters.filter(function (chapter) { return bestScore("test", chapter.id) !== null; }).length;
    return { done: completedUnits + completedTests, total: total, percent: Math.round(((completedUnits + completedTests) / total) * 100) };
  }

  function nextRecommendedRoute() {
    const openSession = Object.values(state.sessions).find(function (session) { return session.status === "active"; });
    if (openSession) return "#/" + openSession.type + "/" + openSession.ownerId;
    const unit = course.units.find(function (entry) { return !state.completedUnits[entry.id]; });
    if (unit) return "#/lesson/" + unit.id;
    const chapter = course.chapters.find(function (entry) { return bestScore("test", entry.id) === null; });
    return chapter ? "#/test/" + chapter.id : "#/dashboard";
  }

  function renderDashboard() {
    const progress = overallProgress();
    const recommended = nextRecommendedRoute();
    const returning = state.stats.attempted > 0 || Object.keys(state.completedUnits).length > 0;
    const chaptersHtml = course.chapters.map(function (chapter, chapterIndex) {
      const completedCount = chapter.units.filter(function (unit) { return Boolean(state.completedUnits[unit.id]); }).length;
      const testDone = bestScore("test", chapter.id) !== null;
      const unitRows = chapter.units.map(function (unit, unitIndex) {
        const complete = Boolean(state.completedUnits[unit.id]);
        const score = bestScore("exercise", unit.id);
        return '<li class="unit-row ' + (complete ? "is-complete" : "") + '">' +
          '<span class="unit-status" aria-label="' + (complete ? "completed" : "not completed") + '">' + (complete ? "✓" : "·") + '</span>' +
          '<a href="#/lesson/' + unit.id + '">' + (chapterIndex + 1) + "." + (unitIndex + 1) + " " + escapeHtml(unit.title) + "</a>" +
          (score === null ? "" : ' <span class="unit-score">(' + score + "%)</span>") +
          "</li>";
      }).join("");
      const testScore = bestScore("test", chapter.id);
      return '<section class="chapter-section chapter-card">' +
        '<h2>' + chapter.number + ". " + escapeHtml(chapter.title) + (chapterIsComplete(chapter) ? " ✓" : "") + "</h2>" +
        '<p class="meta">' + escapeHtml(chapter.subtitle) + " · " + (completedCount + (testDone ? 1 : 0)) + "/" + (chapter.units.length + 1) + " complete</p>" +
        '<ul class="unit-list">' + unitRows + "</ul>" +
        '<p class="test-link"><a href="#/test/' + chapter.id + '">chapter ' + chapter.number + " test</a>" + (testScore === null ? "" : ' <span class="unit-score">(' + testScore + "%)</span>") + "</p></section>" +
        (chapterIndex < course.chapters.length - 1 ? "<hr>" : "");
    }).join("");

    root.innerHTML = '<section class="course-intro"><h1>Fermat\'s Last Theorem</h1>' +
      '<p>Learn the mathematics behind the Frey–Ribet–Wiles argument, from number theory to the final contradiction.</p>' +
      '<p class="meta">' + progress.done + "/" + progress.total + " complete · " + progress.percent + "% · " + state.stats.attempted + " questions attempted</p>" +
      '<progress class="progress-line" value="' + progress.done + '" max="' + progress.total + '" aria-label="Course progress"></progress>' +
      '<p><a href="' + recommended + '"><strong>' + (returning ? "continue" : "begin") + " →</strong></a></p>" +
      '<p class="course-source">sources: <a href="https://www.youtube.com/watch?v=' + course.videoId + '" target="_blank" rel="noopener">lecture</a> · <a href="' + course.slidesFolder + '" target="_blank" rel="noopener">slides</a><br><span class="quiet">This course explains how modularity and level lowering imply FLT; it does not prove those major theorems.</span></p></section><hr>' +
      '<section aria-labelledby="course-map-heading"><h2 id="course-map-heading">course</h2>' + chaptersHtml + "</section>";
  }

  function renderLesson(unitId) {
    const unit = unitById(unitId);
    if (!unit) return renderNotFound();
    const chapter = chapterById(unit.chapterId);
    const unitIndex = chapter.units.findIndex(function (entry) { return entry.id === unit.id; });
    const globalIndex = course.units.findIndex(function (entry) { return entry.id === unit.id; });
    const previous = course.units[globalIndex - 1];
    const next = course.units[globalIndex + 1];
    const sourceQuestion = unit.questionBank[0];
    const lessonSections = unit.sections.map(function (section) {
      return '<section class="lesson-section"><h2>' + escapeHtml(section.title) + "</h2><p>" + section.body + "</p></section>";
    }).join("");
    const concepts = unit.terms.map(function (entry) { return "<li><strong>" + entry.name + ":</strong> " + entry.definition + "</li>"; }).join("");
    const complete = Boolean(state.completedUnits[unit.id]);
    const score = bestScore("exercise", unit.id);

    root.innerHTML = '<article class="lesson-wrap"><header class="lesson-hero">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/dashboard">course</a><span>/</span><span>chapter ' + chapter.number + "</span><span>/</span><span>" + (unitIndex + 1) + "</span></nav>" +
      '<h1>' + escapeHtml(unit.title) + '</h1><p class="lesson-intro">' + escapeHtml(unit.intro) + '</p>' +
      (complete ? '<p class="meta">completed ✓' + (score === null ? "" : " · best " + score + "%") + "</p>" : "") + "</header><hr>" + lessonSections +
      '<section class="lesson-section"><h2>Keep these ideas close</h2><div class="math-panel"><ul>' + concepts + "</ul></div></section>" +
      '<p class="meta">source: <button class="button" type="button" data-help-id="' + sourceQuestion.id + '">' + escapeHtml(sourceQuestion.help.slideTitle) + ", pages " + escapeHtml(unit.source.pages) + " · video " + formatTime(unit.source.time) + "</button></p><hr>" +
      '<div class="lesson-actions">' + (previous ? '<a class="button" href="#/lesson/' + previous.id + '">← previous</a>' : '<a class="button" href="#/dashboard">← course map</a>') +
      '<a class="button button-primary" href="#/exercise/' + unit.id + '">' + (score === null ? "start 7-question exercise →" : "practice again · best " + score + "% →") + "</a>" +
      (next ? '<a class="button" href="#/lesson/' + next.id + '">next →</a>' : "") + "</div></article>";
  }

  function createSession(type, ownerId) {
    let selected;
    if (type === "exercise") {
      const unit = unitById(ownerId);
      if (!unit) return null;
      selected = shuffle(unit.questionBank).slice(0, 7);
    } else {
      const chapter = chapterById(ownerId);
      if (!chapter) return null;
      const base = Math.floor(17 / chapter.units.length);
      let remainder = 17 % chapter.units.length;
      selected = [];
      chapter.units.forEach(function (unit) {
        const count = base + (remainder > 0 ? 1 : 0);
        remainder -= remainder > 0 ? 1 : 0;
        selected = selected.concat(shuffle(unit.questionBank).slice(0, count));
      });
      selected = shuffle(selected);
    }
    const session = {
      id: Date.now() + "-" + Math.random().toString(16).slice(2),
      type: type,
      ownerId: ownerId,
      status: "active",
      startedAt: new Date().toISOString(),
      current: 0,
      questionIds: selected.map(function (question) { return question.id; }),
      choiceOrders: {},
      responses: []
    };
    selected.forEach(function (question) {
      if (question.choices) session.choiceOrders[question.id] = shuffle(question.choices);
    });
    state.sessions[type + ":" + ownerId] = session;
    saveState();
    return session;
  }

  function getSession(type, ownerId) {
    const key = type + ":" + ownerId;
    return state.sessions[key] || createSession(type, ownerId);
  }

  function normalizeAnswer(value) {
    return String(value == null ? "" : value).trim().toLowerCase().replace(/[−–—]/g, "-").replace(/\s+/g, " ");
  }

  function answersMatch(question, selected) {
    if (question.type === "multi") {
      const expected = question.answer.map(normalizeAnswer).sort();
      const actual = selected.map(normalizeAnswer).sort();
      return expected.length === actual.length && expected.every(function (value, index) { return value === actual[index]; });
    }
    return normalizeAnswer(selected) === normalizeAnswer(question.answer);
  }

  function recordAnswer(session, question, selected, gaveUp) {
    if (session.responses[session.current]) return;
    const correct = gaveUp ? false : answersMatch(question, selected);
    session.responses[session.current] = { questionId: question.id, selected: selected, correct: correct, gaveUp: gaveUp, answeredAt: new Date().toISOString() };
    state.stats.attempted += 1;
    if (gaveUp) state.stats.givenUp += 1;
    else if (correct) state.stats.correct += 1;
    else state.stats.incorrect += 1;
    saveState();
  }

  function finishSession(session) {
    const correct = session.responses.filter(function (response) { return response && response.correct; }).length;
    const givenUp = session.responses.filter(function (response) { return response && response.gaveUp; }).length;
    const total = session.questionIds.length;
    const score = Math.round((correct / total) * 100);
    const attempt = { id: session.id, score: score, correct: correct, incorrect: total - correct - givenUp, givenUp: givenUp, total: total, completedAt: new Date().toISOString() };
    const collection = session.type === "exercise" ? state.exercises : state.tests;
    const record = collection[session.ownerId] || { attempts: [], best: 0 };
    record.attempts = (record.attempts || []).concat(attempt).slice(-20);
    record.best = Math.max(record.best || 0, score);
    collection[session.ownerId] = record;
    if (session.type === "exercise") state.completedUnits[session.ownerId] = attempt.completedAt;
    session.status = "complete";
    session.result = attempt;
    saveState();
  }

  function answerInput(question, choices, response) {
    const disabled = response ? " disabled" : "";
    if (question.type === "numeric" || question.type === "text") {
      const value = response ? (Array.isArray(response.selected) ? response.selected.join(", ") : response.selected) : "";
      return '<label for="answer-field" class="question-count">your answer</label><br><input id="answer-field" class="answer-input" name="answer" autocomplete="off" inputmode="' + (question.type === "numeric" ? "decimal" : "text") + '" value="' + escapeHtml(value) + '"' + disabled + ">";
    }
    return '<div class="answer-list">' + choices.map(function (choice, index) {
      const selected = response && (Array.isArray(response.selected) ? response.selected.indexOf(choice) >= 0 : response.selected === choice);
      return '<label class="answer-option"><input type="' + (question.type === "multi" ? "checkbox" : "radio") + '" name="answer" value="' + escapeHtml(choice) + '" ' + (selected ? "checked " : "") + disabled + '><span><strong>' + String.fromCharCode(65 + index) + ".</strong> " + choice + "</span></label>";
    }).join("") + "</div>";
  }

  function feedbackHtml(question, response) {
    if (!response) return "";
    const kind = response.gaveUp ? "is-given-up" : (response.correct ? "is-correct" : "is-wrong");
    const heading = response.gaveUp ? "Attempt ended — solution revealed" : (response.correct ? "Correct" : "Not quite");
    const answer = Array.isArray(question.answer) ? question.answer.join(", ") : question.answer;
    return '<div class="feedback-card ' + kind + '" role="status"><h3>' + heading + "</h3>" +
      (response.correct ? "" : "<p><strong>Correct answer:</strong> " + answer + "</p>") +
      '<ol class="solution-steps">' + question.solution.map(function (step) { return "<li>" + step + "</li>"; }).join("") + "</ol></div>";
  }

  function renderQuiz(type, ownerId) {
    const owner = type === "exercise" ? unitById(ownerId) : chapterById(ownerId);
    if (!owner) return renderNotFound();
    const session = getSession(type, ownerId);
    if (!session) return renderNotFound();
    const label = type === "exercise" ? "7-question exercise" : "17-question unit test";
    const parentChapter = type === "exercise" ? chapterById(owner.chapterId) : owner;

    if (session.status === "complete") {
      return renderResult(session, owner, parentChapter);
    }

    const questionId = session.questionIds[session.current];
    const question = questionMap.get(questionId);
    const response = session.responses[session.current];
    const choices = session.choiceOrders[question.id] || question.choices || [];
    const progressValue = session.current + (response ? 1 : 0);

    root.innerHTML = '<section class="quiz-wrap"><header class="quiz-heading"><p class="breadcrumb"><a href="#/dashboard">course</a> / chapter ' + parentChapter.number + "</p>" +
      '<h1>' + escapeHtml(owner.title) + '</h1><p class="meta">' + escapeHtml(label) + " · " + (session.current + 1) + "/" + session.questionIds.length + "</p>" +
      '<progress class="progress-line" value="' + progressValue + '" max="' + session.questionIds.length + '" aria-label="Question progress"></progress></header><hr>' +
      '<form class="question-card" data-answer-form><p class="question-count">' + (question.type === "multi" ? "select all that apply" : question.type === "numeric" ? "enter a number" : "choose one answer") + "</p>" +
      '<div class="question-prompt">' + question.prompt + "</div>" + answerInput(question, choices, response) + feedbackHtml(question, response) +
      '<div class="question-actions"><button class="button" type="button" data-help-id="' + question.id + '">help</button>' +
      (response ? "" : '<button class="button give-up" type="button" data-give-up>Give Up?</button>') +
      (response ? '<button class="button button-primary" type="button" data-next-question>' + (session.current === session.questionIds.length - 1 ? "see results →" : "continue →") + "</button>" : '<button class="button button-primary" type="submit">check answer</button>') +
      "</div></form></section>";
  }

  function renderResult(session, owner, chapter) {
    const result = session.result;
    const passed = result.score >= 70;
    const noun = session.type === "exercise" ? "exercise" : "unit test";
    root.innerHTML = '<section class="quiz-wrap"><header class="quiz-heading"><p class="breadcrumb"><a href="#/dashboard">course</a> / ' + noun + '</p><h1>' + escapeHtml(owner.title) + "</h1></header><hr>" +
      '<div class="result-card"><div class="result-score">' + result.score + '%</div><p>' + (passed ? "complete" : "review and try again") + "</p>" +
      '<div class="result-stats"><div><strong>' + result.correct + "</strong><span>correct</span></div><div><strong>" + result.incorrect + "</strong><span>incorrect</span></div><div><strong>" + result.givenUp + "</strong><span>given up</span></div></div>" +
      '<div class="result-actions"><a class="button" href="#/dashboard">course</a>' +
      (session.type === "exercise" ? '<a class="button" href="#/lesson/' + owner.id + '">review lesson</a>' : "") +
      '<button class="button button-primary" type="button" data-new-attempt data-kind="' + session.type + '" data-owner="' + owner.id + '">try a new set →</button></div></div>' +
      (session.type === "test" && chapterIsComplete(chapter) ? '<p>chapter complete ✓</p>' : "") + "</section>";
  }

  function renderNotFound() {
    root.innerHTML = '<section class="lesson-wrap"><header class="lesson-hero"><h1>Page not found</h1><p><a href="#/dashboard">return to course</a></p></header></section>';
  }

  function currentRoute() {
    const hash = window.location.hash || "#/dashboard";
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { hash: hash, view: parts[0] || "dashboard", id: parts[1] || null };
  }

  function render() {
    const route = currentRoute();
    if (["dashboard", "lesson", "exercise", "test"].indexOf(route.view) < 0) return renderNotFound();
    state.lastRoute = route.hash;
    saveState();
    if (route.view === "lesson") renderLesson(route.id);
    else if (route.view === "exercise") renderQuiz("exercise", route.id);
    else if (route.view === "test") renderQuiz("test", route.id);
    else renderDashboard();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function openHelp(questionId) {
    const question = questionMap.get(questionId);
    if (!question) return;
    const help = question.help;
    document.getElementById("help-content").innerHTML = "<p>" + escapeHtml(help.note) + "</p>" +
      '<iframe class="help-video" src="https://www.youtube-nocookie.com/embed/' + course.videoId + "?start=" + help.videoTime + '&rel=0" title="Lecture help starting at ' + formatTime(help.videoTime) + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
      '<p class="meta">video starts at ' + formatTime(help.videoTime) + "</p>" +
      '<a class="source-link" href="' + help.slideUrl + '" target="_blank" rel="noopener">slides: ' + escapeHtml(help.slideTitle) + ", page" + (String(help.slidePages).indexOf("–") >= 0 ? "s " : " ") + escapeHtml(help.slidePages) + " ↗</a>";
    showDialog(helpDialog);
  }

  helpDialog.addEventListener("close", function () {
    document.getElementById("help-content").innerHTML = "";
  });

  function announce(message) {
    const node = document.createElement("div");
    node.className = "notice";
    node.setAttribute("role", "status");
    node.textContent = message;
    root.prepend(node);
  }

  root.addEventListener("click", function (event) {
    const helpButton = event.target.closest("[data-help-id]");
    if (helpButton) {
      event.preventDefault();
      openHelp(helpButton.getAttribute("data-help-id"));
      return;
    }
    const giveUp = event.target.closest("[data-give-up]");
    if (giveUp) {
      const route = currentRoute();
      const session = getSession(route.view, route.id);
      const question = questionMap.get(session.questionIds[session.current]);
      recordAnswer(session, question, [], true);
      renderQuiz(route.view, route.id);
      return;
    }
    const nextButton = event.target.closest("[data-next-question]");
    if (nextButton) {
      const route = currentRoute();
      const session = getSession(route.view, route.id);
      session.current += 1;
      if (session.current >= session.questionIds.length) finishSession(session);
      else saveState();
      renderQuiz(route.view, route.id);
      return;
    }
    const newAttempt = event.target.closest("[data-new-attempt]");
    if (newAttempt) {
      const type = newAttempt.getAttribute("data-kind");
      const ownerId = newAttempt.getAttribute("data-owner");
      delete state.sessions[type + ":" + ownerId];
      createSession(type, ownerId);
      renderQuiz(type, ownerId);
    }
  });

  root.addEventListener("submit", function (event) {
    if (!event.target.matches("[data-answer-form]")) return;
    event.preventDefault();
    const route = currentRoute();
    const session = getSession(route.view, route.id);
    const question = questionMap.get(session.questionIds[session.current]);
    const formData = new FormData(event.target);
    const selected = question.type === "multi" ? formData.getAll("answer") : formData.get("answer");
    if ((question.type === "multi" && selected.length === 0) || (question.type !== "multi" && !String(selected || "").trim())) {
      const oldNotice = event.target.querySelector("[data-answer-notice]");
      if (oldNotice) oldNotice.remove();
      const notice = document.createElement("p");
      notice.dataset.answerNotice = "true";
      notice.className = "notice";
      notice.textContent = "Choose or enter an answer first—or use Give Up? to reveal the solution.";
      event.target.querySelector(".question-actions").before(notice);
      return;
    }
    recordAnswer(session, question, selected, false);
    renderQuiz(route.view, route.id);
  });

  document.querySelector("[data-reset-progress]").addEventListener("click", function () { showDialog(resetDialog); });
  resetDialog.addEventListener("close", function () {
    if (resetDialog.returnValue !== "confirm") return;
    localStorage.removeItem(storageKey);
    state = freshState();
    saveState();
    window.location.hash = "#/dashboard";
    renderDashboard();
  });

  window.addEventListener("hashchange", render);
  if (!window.location.hash) window.location.hash = "#/dashboard";
  else render();
})();
