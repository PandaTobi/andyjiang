import {
  STATE_VERSION,
  createTournament,
  addPlayer,
  updatePlayer,
  setPlayerScore,
  updatePairing,
  removePlayer,
  withdrawPlayer,
  startTournament,
  currentRound,
  calculateStandings,
  recordResult,
  roundIsComplete,
  advanceTournament,
  endTournament,
  recordTiebreakResult,
  activeTiebreakPhases,
  advanceTiebreaks,
  getPodium,
  playerById,
  formatRating,
  standingsCsv
} from "./swiss-engine.mjs";

const storageKey = "andyjiang-swiss-tournament-v2";
const root = document.getElementById("swiss-view");
const notice = document.getElementById("swiss-notice");
const confirmDialog = document.getElementById("swiss-confirm");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmSubmit = document.getElementById("confirm-submit");

let state = loadState();
let view = state ? defaultView() : "create";
let pendingConfirmation = null;
let editMode = false;

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== STATE_VERSION || !saved.config || !Array.isArray(saved.players) || !Array.isArray(saved.rounds)) return null;
    return saved;
  } catch (error) {
    return null;
  }
}

function saveState() {
  try {
    if (state) localStorage.setItem(storageKey, JSON.stringify(state));
    else localStorage.removeItem(storageKey);
  } catch (error) {
    showNotice("Tournament changes could not be saved in this browser.", true);
  }
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("is-error", isError);
}

function clearNotice() { showNotice(""); }

function safely(action) {
  try {
    clearNotice();
    action();
    saveState();
    render();
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Something went wrong.", true);
  }
}

function defaultView() {
  if (!state) return "create";
  if (state.status === "setup") return "setup";
  if (state.status === "tiebreak" || state.status === "complete") return "finals";
  return "round";
}

function score(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

function statusTags(entry) {
  const tags = [];
  if (entry.lateEntry) tags.push('<span class="swiss-tag">late round ' + entry.entryRound + "</span>");
  if (!entry.active) tags.push('<span class="swiss-tag">withdrawn</span>');
  else tags.push('<span class="swiss-tag">active</span>');
  return tags.join(" ");
}

function createScreen() {
  return '<section class="swiss-intro" aria-labelledby="create-title">' +
    '<p class="swiss-kicker">tournament organizer</p>' +
    '<h1 id="create-title">Swiss Format Tournament</h1>' +
    '<p>Pairings, results, standings, history, and podium tiebreaks are saved automatically.</p>' +
    '<form id="create-form" class="swiss-form-actions"><button class="swiss-button swiss-button-primary" type="submit">create tournament →</button></form>' +
    '<p class="swiss-meta">Data persistently stored, refresh is OK</p>' +
  '</section>';
}

function field(label, control, wide = false) {
  return '<label class="swiss-field' + (wide ? " swiss-field-wide" : "") + '"><span class="swiss-label">' + label + "</span>" + control + "</label>";
}

function tournamentHeading() {
  const phase = state.status === "setup" ? "setup" : state.status === "active" ? "in progress" : state.status === "tiebreak" ? "tiebreaks" : "complete";
  const roundFact = state.rounds.length ? "Round " + state.rounds.length : state.players.length + " players";
  return '<div class="swiss-title-row"><div><p class="swiss-kicker">' + phase + '</p><h1>' + escapeHtml(state.config.name) + '</h1></div>' +
    '<div class="swiss-title-facts"><button class="swiss-button swiss-edit-toggle" type="button" data-action="toggle-edit" aria-pressed="' + editMode + '">' + (editMode ? "done editing" : "edit") + '</button><br>' + roundFact + "<br>continues until ended</div></div>" +
    (editMode ? '<p class="swiss-edit-banner"><strong>Edit mode.</strong> Player details, scores, and pairings can be changed. Historical changes may rebuild podium tiebreaks.</p>' : "");
}

function tournamentTabs() {
  const firstLabel = state.status === "tiebreak" || state.status === "complete" ? "final" : "current round";
  const firstView = state.status === "tiebreak" || state.status === "complete" ? "finals" : "round";
  const tabs = [[firstView, firstLabel], ["standings", "standings"], ["players", "players"], ["history", "history"]];
  return '<nav class="swiss-tabs" aria-label="Tournament views">' + tabs.map(([id, label]) =>
    '<button class="swiss-tab" type="button" data-view="' + id + '"' + (view === id ? ' aria-current="page"' : "") + ">" + label + "</button>"
  ).join("") + "</nav>";
}

function playerEditorHtml(player, allowRemove = false) {
  const standing = calculateStandings(state).find((entry) => entry.playerId === player.id);
  const actions = ['<button class="swiss-button" type="submit">save</button>'];
  if (allowRemove) actions.push('<button class="swiss-button swiss-danger" type="button" data-action="remove-player" data-player-id="' + player.id + '">remove</button>');
  else if (player.active && state.status === "active") actions.push('<button class="swiss-button swiss-danger" type="button" data-action="withdraw-player" data-player-id="' + player.id + '">withdraw</button>');
  return '<form class="player-editor" data-form="edit-player" data-player-id="' + player.id + '">' +
    field("Player", '<input class="swiss-input" name="name" maxlength="80" required value="' + escapeHtml(player.name) + '">') +
    field("Rating", '<input class="swiss-input" name="rating" type="number" min="100" max="4000" placeholder="Unrated" value="' + (player.rating == null ? "" : player.rating) + '">') +
    field("Score", '<input class="swiss-input" name="score" type="number" min="0" step="0.5" required value="' + score(standing.score) + '">') +
    '<div class="swiss-form-actions">' + actions.join("") + "</div></form>";
}

function playerStaticHtml(player, setup = false) {
  const timing = player.lateEntry ? "entered for round " + player.entryRound : "original field";
  const seed = player.seed == null ? "—" : player.seed;
  const action = !setup && player.active && state.status === "active" ? '<button class="swiss-button swiss-danger" type="button" data-action="withdraw-player" data-player-id="' + player.id + '">withdraw</button>' : '<span class="swiss-meta">' + (setup ? "not seeded" : player.active ? "active" : "inactive") + "</span>";
  return '<div class="player-static"><span class="swiss-meta">#' + seed + '</span><span><strong>' + escapeHtml(player.name) + '</strong><br><span class="swiss-tag">' + timing + '</span> ' + (!player.active ? '<span class="swiss-tag">withdrawn after round ' + player.withdrawnAfterRound + "</span>" : "") + '</span><span>' + formatRating(player.rating) + '</span><span>' + action + "</span></div>";
}

function setupScreen() {
  const players = state.players.map((player) => editMode ? playerEditorHtml(player, true) : playerStaticHtml(player, true)).join("");
  return tournamentHeading() +
    '<section class="swiss-section" aria-labelledby="players-heading"><div class="swiss-section-heading"><div><h2 id="players-heading">Players</h2><p class="swiss-meta">Rated players seed first; equal ratings and Unrated players seed by name.</p></div><span class="swiss-meta">' + state.players.length + " registered</span></div>" +
      '<form id="add-player-form" class="swiss-form-grid">' +
        field("Name", '<input class="swiss-input" name="name" maxlength="80" required autocomplete="off">') +
        field("Rating", '<input class="swiss-input" name="rating" type="number" min="100" max="4000" placeholder="Unrated">') +
        '<div class="swiss-form-actions swiss-field-wide"><button class="swiss-button swiss-button-primary" type="submit">add player</button></div>' +
      "</form>" +
      (players || '<p class="swiss-empty">No players yet. Add at least two to begin.</p>') +
      '<div class="swiss-actions" style="margin-top:2rem"><button class="swiss-button swiss-button-primary" type="button" data-action="start-tournament"' + (state.players.length < 2 ? " disabled" : "") + '>start tournament →</button><span class="swiss-meta">Starting assigns seeds and generates Round 1.</span></div>' +
    "</section>";
}

function appScreen() {
  let body;
  if (view === "standings") body = standingsView();
  else if (view === "players") body = playersView();
  else if (view === "history") body = historyView();
  else if (view === "finals") body = finalsView();
  else body = roundView();
  return tournamentHeading() + tournamentTabs() + body;
}

function playerLine(player, color) {
  const withdrawn = !player.active ? ' <span class="swiss-tag">withdrawn</span>' : "";
  return '<div class="pairing-player ' + color.toLowerCase() + '"><div class="pairing-name">' + escapeHtml(player.name) + withdrawn + '</div><div class="pairing-rating">' + color + " · " + formatRating(player.rating) + " · seed " + player.seed + "</div></div>";
}

function resultControls(pairing, prefix = "result") {
  const options = [["1-0", "1–0", "White wins"], ["0.5-0.5", "½–½", "Draw"], ["0-1", "0–1", "Black wins"]];
  return '<div class="pairing-result" aria-label="Game result">' + options.map(([value, label, description]) =>
    '<label class="result-choice"><input type="radio" aria-label="' + description + '" name="' + prefix + "-" + pairing.id + '" value="' + value + '" data-pairing-id="' + pairing.id + '"' + (pairing.result === value ? " checked" : "") + '><span title="' + description + '">' + label + "</span></label>"
  ).join("") + "</div>";
}

function playerSelectOptions(selectedId, includeBye = false) {
  const bye = includeBye ? '<option value=""' + (selectedId ? "" : " selected") + '>Bye</option>' : "";
  return bye + state.players.slice().sort((a, b) => (a.seed || 999999) - (b.seed || 999999)).map((player) =>
    '<option value="' + player.id + '"' + (player.id === selectedId ? " selected" : "") + '>' + escapeHtml(player.name) + " · " + formatRating(player.rating) + "</option>"
  ).join("");
}

function pairingEditorHtml(round, pairing) {
  const emptyResult = round.status === "active" ? "Pending" : "Choose result";
  const resultOptions = (round.status === "active" || pairing.blackId === null ? '<option value=""' + (pairing.result === "bye" || !pairing.result ? " selected" : "") + ">" + (pairing.blackId === null ? "Bye / " : "") + emptyResult + "</option>" : "") +
    [["1-0", "White wins"], ["0.5-0.5", "Draw"], ["0-1", "Black wins"]].map(([value, label]) => '<option value="' + value + '"' + (pairing.result === value ? " selected" : "") + ">" + label + "</option>").join("");
  return '<form class="pairing-editor" data-form="edit-pairing" data-round-id="' + round.id + '" data-pairing-id="' + pairing.id + '">' +
    field("White / recipient", '<select class="swiss-select" name="whiteId" required>' + playerSelectOptions(pairing.whiteId) + "</select>") +
    field("Black", '<select class="swiss-select" name="blackId">' + playerSelectOptions(pairing.blackId, true) + "</select>") +
    field("Result", '<select class="swiss-select" name="result">' + resultOptions + "</select>") +
    '<div class="swiss-form-actions"><button class="swiss-button" type="submit">save pairing</button></div></form>';
}

function pairingRows(round, isTiebreak = false) {
  return round.pairings.map((pairing) => {
    const white = playerById(state, pairing.whiteId);
    if (pairing.blackId === null) {
      return '<div class="pairing-row bye-row"><span class="pairing-board">bye</span>' + playerLine(white, "Player") + '<strong class="bye-mark">+1 point</strong></div>' + (!isTiebreak && editMode ? pairingEditorHtml(round, pairing) : "");
    }
    const black = playerById(state, pairing.blackId);
    return '<div class="pairing-row"><span class="pairing-board">board ' + pairing.board + "</span>" + playerLine(white, "White") + '<span class="pairing-versus">vs</span>' + playerLine(black, "Black") + resultControls(pairing, isTiebreak ? "tiebreak" : "result") + "</div>" + (!isTiebreak && editMode ? pairingEditorHtml(round, pairing) : "");
  }).join("");
}

function roundView() {
  const round = currentRound(state);
  if (!round) return '<section class="swiss-section"><p class="swiss-empty">No active round.</p></section>';
  const games = round.pairings.filter((pairing) => pairing.blackId !== null);
  const completed = games.filter((pairing) => pairing.result !== null).length;
  const ready = roundIsComplete(round);
  return '<section class="swiss-section" aria-labelledby="round-heading">' +
    '<div class="swiss-section-heading"><div><p class="swiss-kicker">current pairings</p><h2 id="round-heading">Round ' + round.number + '</h2><p class="swiss-meta">' + games.length + " games" + (round.pairings.length > games.length ? " · 1 bye" : "") + '</p></div><strong>' + completed + "/" + games.length + " complete</strong></div>" +
    '<div class="swiss-progress"><div class="swiss-progress-line"><span>' + (games.length - completed) + ' remaining</span><span>results save immediately</span></div><progress class="swiss-progress-bar" value="' + completed + '" max="' + Math.max(games.length, 1) + '" aria-label="Round progress"></progress></div>' +
    '<div class="pairing-list">' + pairingRows(round) + "</div>" +
    '<div class="swiss-actions" style="margin-top:2rem"><button class="swiss-button swiss-button-primary" type="button" data-action="advance-round"' + (ready ? "" : " disabled") + '>generate next round →</button><button class="swiss-button swiss-danger" type="button" data-action="end-tournament"' + (ready ? "" : " disabled") + '>end tournament</button>' +
    (ready ? '<span class="swiss-meta">Continue play or end after this round.</span>' : '<span class="swiss-meta">Record every game result before continuing or ending.</span>') + "</div></section>";
}

function standingsView() {
  const standings = calculateStandings(state);
  const rows = standings.map((entry) => '<tr><td>' + (entry.tied ? "=" : "") + entry.rank + '</td><td><strong>' + escapeHtml(entry.name) + '</strong><br>' + statusTags(entry) + '</td><td class="numeric">' + formatRating(entry.rating) + '</td><td class="numeric"><strong>' + score(entry.score) + '</strong></td><td class="numeric">' + entry.wins + '</td><td class="numeric">' + entry.draws + '</td><td class="numeric">' + entry.losses + '</td><td class="numeric">' + entry.byes + '</td><td class="numeric">' + entry.seed + "</td></tr>").join("");
  return '<section class="swiss-section" aria-labelledby="standings-heading"><div class="swiss-section-heading"><div><h2 id="standings-heading">Standings</h2><p class="swiss-meta">Rank is based only on Swiss score. Equal scores remain tied.</p></div><button class="swiss-button" type="button" data-action="export-csv">export CSV ↓</button></div>' +
    '<div class="swiss-table-wrap"><table class="swiss-table"><thead><tr><th>Rank</th><th>Player</th><th class="numeric">Rating</th><th class="numeric">Score</th><th class="numeric">W</th><th class="numeric">D</th><th class="numeric">L</th><th class="numeric">Byes</th><th class="numeric">Seed</th></tr></thead><tbody>' + rows + "</tbody></table></div></section>";
}

function playersView() {
  const current = currentRound(state);
  const canAddLateEntrant = state.status === "active" && current;
  const list = state.players.slice().sort((a, b) => a.seed - b.seed).map((player) => editMode ? playerEditorHtml(player) : playerStaticHtml(player)).join("");
  return '<section class="swiss-section" aria-labelledby="manage-players-heading"><div class="swiss-section-heading"><div><h2 id="manage-players-heading">Players</h2><p class="swiss-meta">Late entrants receive 0 points and join the next generated round.</p></div></div>' +
    (canAddLateEntrant ? '<form id="late-player-form" class="swiss-form-grid">' +
      field("Late entrant name", '<input class="swiss-input" name="name" maxlength="80" required autocomplete="off">') +
      field("Rating", '<input class="swiss-input" name="rating" type="number" min="100" max="4000" placeholder="Unrated">') +
      '<div class="swiss-form-actions swiss-field-wide"><button class="swiss-button swiss-button-primary" type="submit">add for round ' + (current.number + 1) + "</button></div></form>" : '<p class="swiss-meta">The tournament has ended; the field is closed.</p>') + list + "</section>";
}

function historyView() {
  const rounds = state.rounds.slice().reverse().map((round) => {
    const games = round.pairings.map((pairing) => {
      const white = playerById(state, pairing.whiteId);
      if (pairing.blackId === null) return '<div class="history-game"><span>—</span><span>' + escapeHtml(white.name) + '</span><strong class="history-result">bye</strong><span>+1 point</span></div>' + (editMode ? pairingEditorHtml(round, pairing) : "");
      const black = playerById(state, pairing.blackId);
      return '<div class="history-game"><span>' + pairing.board + '</span><span>W · ' + escapeHtml(white.name) + '</span><strong class="history-result">' + (pairing.result || "pending") + '</strong><span>B · ' + escapeHtml(black.name) + "</span></div>" + (editMode ? pairingEditorHtml(round, pairing) : "");
    }).join("");
    const snapshot = round.standings ? '<details class="history-standings"><summary>standings after round ' + round.number + '</summary><div class="swiss-table-wrap"><table class="swiss-table history-standings-table"><thead><tr><th>Rank</th><th>Player</th><th class="numeric">Score</th><th class="numeric">W</th><th class="numeric">D</th><th class="numeric">L</th><th class="numeric">Byes</th></tr></thead><tbody>' + round.standings.map((entry) => '<tr><td>' + entry.rank + '</td><td>' + escapeHtml(entry.name) + (entry.lateEntry ? ' <span class="swiss-tag">late</span>' : "") + (!entry.active ? ' <span class="swiss-tag">withdrawn</span>' : "") + '</td><td class="numeric">' + score(entry.score) + '</td><td class="numeric">' + entry.wins + '</td><td class="numeric">' + entry.draws + '</td><td class="numeric">' + entry.losses + '</td><td class="numeric">' + entry.byes + "</td></tr>").join("") + "</tbody></table></div></details>" : "";
    return '<details class="history-round"' + (round.status === "active" ? " open" : "") + '><summary><strong>Round ' + round.number + '</strong> · ' + (round.status === "complete" ? "complete" : "in progress") + '</summary><div class="history-body">' + games + snapshot + "</div></details>";
  }).join("");
  return '<section class="swiss-section" aria-labelledby="history-heading"><div class="swiss-section-heading"><div><h2 id="history-heading">Round history</h2><p class="swiss-meta">Completed pairings, colors, results, byes, and round standings.</p></div></div>' + (rounds || '<p class="swiss-empty">No rounds have been generated.</p>') + "</section>";
}

function podiumView() {
  const medals = ["🥇 1st place", "🥈 2nd place", "🥉 3rd place"];
  return '<div class="podium">' + getPodium(state).map((entry, index) => {
    if (entry.player) return '<div class="podium-place"><span class="podium-medal">' + medals[index] + '</span><strong>' + escapeHtml(entry.player.name) + '</strong><span class="swiss-meta">' + score(entry.player.score) + " points · " + formatRating(entry.player.rating) + " · seed " + entry.player.seed + "</span></div>";
    if (!entry.required) return '<div class="podium-place"><span class="podium-medal">' + medals[index] + '</span><strong>Not awarded</strong><span class="swiss-meta">The field has fewer than ' + entry.place + " players.</span></div>";
    const names = entry.required.map((id) => escapeHtml(playerById(state, id).name)).join(", ");
    return '<div class="podium-place"><span class="podium-medal">' + medals[index] + '</span><strong class="podium-waiting">Tiebreak required</strong><span class="swiss-meta">' + names + "</span></div>";
  }).join("") + "</div>";
}

function tiebreakGameRows(phase, editable = true) {
  return phase.games.map((game, index) => {
    const white = playerById(state, game.whiteId);
    const black = playerById(state, game.blackId);
    const pairing = { ...game, board: index + 1 };
    const result = editable ? resultControls(pairing, "tiebreak") : '<strong class="history-result">' + game.result + "</strong>";
    return '<div class="pairing-row"><span class="pairing-board">game ' + (index + 1) + "</span>" + playerLine(white, "White") + '<span class="pairing-versus">vs</span>' + playerLine(black, "Black") + result + "</div>";
  }).join("");
}

function finalsView() {
  const active = state.status === "tiebreak" ? activeTiebreakPhases(state) : [];
  const completed = state.tiebreaks.groups.flatMap((group) => group.phases.filter((phase) => phase.status === "complete").map((phase) => ({ group, phase })));
  const tiebreaks = active.map(({ group, phase }) => {
    const positions = [];
    for (let place = phase.startRank; place <= Math.min(3, phase.startRank + phase.playerIds.length - 1); place += 1) positions.push(place);
    return '<section class="tiebreak-phase"><p class="swiss-kicker">tiebreak series ' + phase.number + '</p><h3>Deciding place' + (positions.length > 1 ? "s " : " ") + positions.join(", ") + '</h3><p class="swiss-meta">' + phase.playerIds.map((id) => escapeHtml(playerById(state, id).name)).join(" · ") + '</p><div class="pairing-list">' + tiebreakGameRows(phase) + "</div></section>";
  }).join("");
  const completedTiebreaks = completed.length ? '<details class="history-round tiebreak-history"><summary>completed tiebreak games (' + completed.length + ' series)</summary><div class="history-body">' + completed.map(({ phase }) => '<section><h3>Series ' + phase.number + ' · starting at place ' + phase.startRank + '</h3><div class="pairing-list">' + tiebreakGameRows(phase, false) + "</div></section>").join("") + "</div></details>" : "";
  const allReady = active.length > 0 && active.every(({ phase }) => phase.games.every((game) => game.result !== null));
  return '<section class="swiss-section" aria-labelledby="podium-heading"><div class="swiss-section-heading"><div><p class="swiss-kicker">' + (state.status === "complete" ? "official result" : "provisional") + '</p><h2 id="podium-heading">Final podium</h2><p class="swiss-meta">Swiss score only; podium ties are decided through additional games.</p></div><button class="swiss-button" type="button" data-action="export-csv">export final CSV ↓</button></div>' + podiumView() +
    (state.status === "complete" ? '<p><strong>Tournament complete.</strong> The podium is final.</p>' : tiebreaks + '<div class="swiss-actions"><button class="swiss-button swiss-button-primary" type="button" data-action="advance-tiebreak"' + (allReady ? "" : " disabled") + '>evaluate tiebreak results →</button><span class="swiss-meta">Drawn or still-tied positions generate another series.</span></div>') + completedTiebreaks +
    "</section><hr>" + standingsView();
}

function render() {
  if (!root) return;
  if (!state) root.innerHTML = createScreen();
  else if (state.status === "setup") root.innerHTML = setupScreen();
  else root.innerHTML = appScreen();
}

function formObject(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function savePlayerForm(form) {
  const values = formObject(form);
  const currentScore = calculateStandings(state).find((entry) => entry.playerId === form.dataset.playerId).score;
  updatePlayer(state, form.dataset.playerId, values);
  if (values.score !== undefined && Number(values.score) !== currentScore) setPlayerScore(state, form.dataset.playerId, values.score);
}

function saveVisiblePlayerEdits() {
  document.querySelectorAll('[data-form="edit-player"]').forEach((form) => savePlayerForm(form));
}

function commitVisiblePlayerEdits() {
  try {
    saveVisiblePlayerEdits();
    saveState();
    return true;
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "Player changes could not be saved.", true);
    return false;
  }
}

function exportCsv() {
  const blob = new Blob([standingsCsv(state)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.status === "active" || state.status === "setup" ? "swiss-standings.csv" : "swiss-final-results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  showNotice("CSV export prepared.");
}

function confirmAction(title, message, label, callback) {
  pendingConfirmation = callback;
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmSubmit.textContent = label;
  confirmDialog.returnValue = "";
  confirmDialog.showModal();
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.id === "create-form") safely(() => { state = createTournament(); view = "setup"; });
  if (form.id === "add-player-form" || form.id === "late-player-form") safely(() => {
    saveVisiblePlayerEdits();
    const player = addPlayer(state, formObject(form));
    showNotice(player.name + (player.lateEntry ? " added as a late entrant with 0 points." : " added."));
  });
  if (form.dataset.form === "edit-player") safely(() => { savePlayerForm(form); showNotice("Player updated."); });
  if (form.dataset.form === "edit-pairing") safely(() => {
    updatePairing(state, form.dataset.roundId, form.dataset.pairingId, formObject(form));
    showNotice("Pairing updated. Standings were recalculated.");
  });
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.pairingId) return;
  safely(() => {
    if (input.name.startsWith("tiebreak")) recordTiebreakResult(state, input.dataset.pairingId, input.value);
    else recordResult(state, input.dataset.pairingId, input.value);
    showNotice("Result saved.");
  });
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-view], [data-confirm-choice]");
  if (!target) return;
  if (target.dataset.confirmChoice) {
    confirmDialog.close(target.dataset.confirmChoice);
    return;
  }
  if (target.dataset.view) {
    if (editMode && !commitVisiblePlayerEdits()) return;
    view = target.dataset.view;
    clearNotice();
    render();
    root.focus({ preventScroll: true });
    return;
  }
  const action = target.dataset.action;
  if (action === "toggle-edit") {
    if (editMode) {
      if (!commitVisiblePlayerEdits()) return;
      editMode = false;
      showNotice("Edits saved.");
    } else {
      editMode = true;
      clearNotice();
    }
    render();
  }
  if (action === "export-csv") exportCsv();
  if (action === "new-tournament") {
    if (!state) return;
    confirmAction("Start a new tournament?", "This permanently removes the saved tournament, every result, and its history from this browser.", "erase and start over", () => {
      state = null; view = "create"; editMode = false; saveState(); clearNotice(); render();
    });
  }
  if (action === "remove-player") safely(() => { removePlayer(state, target.dataset.playerId); showNotice("Player removed."); });
  if (action === "start-tournament") {
    if (!commitVisiblePlayerEdits()) return;
    confirmAction("Start the tournament?", "Seeds will be assigned and Round 1 will be generated. Further changes remain available through Edit mode.", "start tournament", () => safely(() => { startTournament(state); editMode = false; view = "round"; showNotice("Round 1 generated."); }));
  }
  if (action === "advance-round") safely(() => {
    const outcome = advanceTournament(state);
    view = "round";
    showNotice("Round " + outcome.round.number + " generated.");
  });
  if (action === "end-tournament") {
    const round = currentRound(state);
    if (!round || !roundIsComplete(round)) {
      showNotice("Record every game result before ending the tournament.", true);
      return;
    }
    confirmAction("End tournament after Round " + round.number + "?", "You will not be able to generate another Swiss round unless you restart the tournament.", "end tournament", () => safely(() => {
      const outcome = endTournament(state);
      view = "finals";
      showNotice(outcome.kind === "tiebreak" ? "Tournament ended. Podium tiebreaks are required." : "Tournament ended. The podium is final.");
    }));
  }
  if (action === "withdraw-player") {
    const player = playerById(state, target.dataset.playerId);
    const paired = currentRound(state) && currentRound(state).pairings.some((pairing) => pairing.whiteId === player.id || pairing.blackId === player.id);
    const message = paired ? "Their current-round pairing and result requirement will remain, but they will be excluded from every future round." : "Their previous games and score will remain, but they will be excluded from future pairings.";
    confirmAction("Withdraw " + player.name + "?", message, "withdraw player", () => safely(() => { withdrawPlayer(state, player.id); showNotice(player.name + " withdrawn. Tournament history was preserved."); }));
  }
  if (action === "advance-tiebreak") safely(() => {
    const status = advanceTiebreaks(state);
    view = "finals";
    showNotice(status === "complete" ? "Tiebreaks complete. The podium is final." : "Another tiebreak series is required for the remaining tie.");
  });
});

confirmDialog.addEventListener("close", () => {
  const callback = pendingConfirmation;
  pendingConfirmation = null;
  if (confirmDialog.returnValue === "confirm" && callback) callback();
});

render();
