/*
 * Deterministic Swiss-system tournament engine.
 *
 * Pairing priorities, in order, are: avoid rematches, keep score groups
 * together, and keep pairings close in the current score ordering. Color is
 * assigned afterwards so it never overrides those core Swiss constraints.
 * The exact minimum-cost matcher is used for fields up to 18 players; larger
 * fields use the same deterministic cost function with local improvement so
 * the browser remains responsive.
 */

export const STATE_VERSION = 2;
export const RESULT_OPTIONS = ["1-0", "0.5-0.5", "0-1"];
const TOURNAMENT_NAME = "Swiss Format Tournament";

function cleanText(value) {
  return String(value == null ? "" : value).trim().replace(/\s+/g, " ");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function normalizeRating(value) {
  if (value === null || value === undefined || cleanText(value) === "") return null;
  const rating = Number(value);
  assert(Number.isInteger(rating) && rating >= 100 && rating <= 4000, "Rating must be a whole number from 100 to 4000, or Unrated.");
  return rating;
}

export function createTournament() {
  return {
    version: STATE_VERSION,
    config: { name: TOURNAMENT_NAME },
    status: "setup",
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    nextId: 1,
    players: [],
    rounds: [],
    tiebreaks: { groups: [] }
  };
}

function makeId(state, prefix) {
  const id = prefix + "-" + state.nextId;
  state.nextId += 1;
  return id;
}

function validatePlayerInput(input) {
  const name = cleanText(input.name);
  assert(name.length >= 1 && name.length <= 80, "Enter a player name (80 characters or fewer)." );
  return { name, rating: normalizeRating(input.rating) };
}

export function addPlayer(state, input) {
  assert(state && state.version === STATE_VERSION, "Tournament data is not supported.");
  const player = validatePlayerInput(input);
  const duplicate = state.players.some((entry) => entry.name.toLocaleLowerCase() === player.name.toLocaleLowerCase());
  assert(!duplicate, "A player with that name is already in the tournament.");
  const started = state.status !== "setup";
  if (started) {
    assert(state.status === "active", "The player field is closed after the tournament ends.");
  }
  const current = currentRound(state);
  const entry = {
    id: makeId(state, "player"),
    name: player.name,
    rating: player.rating,
    seed: started ? state.players.reduce((max, item) => Math.max(max, item.seed || 0), 0) + 1 : null,
    active: true,
    lateEntry: started,
    entryRound: started ? (current ? current.number + 1 : state.rounds.length + 1) : 1,
    withdrawnAfterRound: null,
    createdOrder: state.players.length + 1
  };
  state.players.push(entry);
  return entry;
}

export function updatePlayer(state, playerId, input) {
  assert(state.status === "setup", "Players can only be edited before the tournament starts.");
  const player = state.players.find((entry) => entry.id === playerId);
  assert(player, "Player not found.");
  const update = validatePlayerInput(input);
  const duplicate = state.players.some((entry) => entry.id !== playerId && entry.name.toLocaleLowerCase() === update.name.toLocaleLowerCase());
  assert(!duplicate, "A player with that name is already in the tournament.");
  player.name = update.name;
  player.rating = update.rating;
  return player;
}

export function removePlayer(state, playerId) {
  assert(state.status === "setup", "Started players remain in tournament history and cannot be deleted.");
  const index = state.players.findIndex((entry) => entry.id === playerId);
  assert(index >= 0, "Player not found.");
  state.players.splice(index, 1);
}

export function withdrawPlayer(state, playerId) {
  assert(state.status === "active", "Withdrawals are closed after the tournament ends.");
  const player = state.players.find((entry) => entry.id === playerId);
  assert(player, "Player not found.");
  assert(player.active, "This player is already withdrawn.");
  assert(state.players.filter((entry) => entry.active).length > 1, "At least one active player must remain in the tournament.");
  const round = currentRound(state);
  // A generated pairing is immutable tournament history. Withdrawal takes
  // effect for the next generated round; any current game still needs a result.
  player.active = false;
  player.withdrawnAfterRound = round ? round.number : state.rounds.length;
  return player;
}

export function seedPlayers(state) {
  const ordered = state.players.slice().sort((a, b) => {
    const ratingA = a.rating == null ? -1 : a.rating;
    const ratingB = b.rating == null ? -1 : b.rating;
    if (ratingA !== ratingB) return ratingB - ratingA;
    const byName = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return byName || a.createdOrder - b.createdOrder;
  });
  ordered.forEach((player, index) => { player.seed = index + 1; });
  return ordered;
}

export function startTournament(state) {
  assert(state.status === "setup", "The tournament has already started.");
  assert(state.players.length >= 2, "Add at least two players before starting.");
  seedPlayers(state);
  state.status = "active";
  state.startedAt = new Date().toISOString();
  return generateRound(state);
}

export function currentRound(state) {
  const round = state.rounds[state.rounds.length - 1];
  return round && round.status === "active" ? round : null;
}

function blankStats(player) {
  return {
    playerId: player.id,
    name: player.name,
    rating: player.rating,
    seed: player.seed,
    score: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    byes: 0,
    colors: [],
    opponents: [],
    lateEntry: player.lateEntry,
    entryRound: player.entryRound,
    active: player.active,
    withdrawnAfterRound: player.withdrawnAfterRound
  };
}

export function calculateStandings(state, throughRound = Infinity) {
  const stats = new Map(state.players.map((player) => [player.id, blankStats(player)]));
  state.rounds.forEach((round) => {
    if (round.number > throughRound) return;
    round.pairings.forEach((pairing) => {
      const white = stats.get(pairing.whiteId);
      if (!white) return;
      if (pairing.blackId === null) {
        if (pairing.result === "bye") {
          white.score += 1;
          white.wins += 1;
          white.byes += 1;
        }
        return;
      }
      const black = stats.get(pairing.blackId);
      white.colors.push("W");
      black.colors.push("B");
      white.opponents.push(black.playerId);
      black.opponents.push(white.playerId);
      if (pairing.result === "1-0") {
        white.score += 1; white.wins += 1; black.losses += 1;
      } else if (pairing.result === "0-1") {
        black.score += 1; black.wins += 1; white.losses += 1;
      } else if (pairing.result === "0.5-0.5") {
        white.score += 0.5; black.score += 0.5; white.draws += 1; black.draws += 1;
      }
    });
  });

  const ordered = Array.from(stats.values()).sort((a, b) => (b.score - a.score) || (a.seed - b.seed));
  let previousScore = null;
  let previousRank = 0;
  ordered.forEach((entry, index) => {
    entry.rank = previousScore === entry.score ? previousRank : index + 1;
    entry.tied = ordered.some((other) => other.playerId !== entry.playerId && other.score === entry.score);
    previousScore = entry.score;
    previousRank = entry.rank;
  });
  return ordered;
}

function statsMap(state) {
  return new Map(calculateStandings(state).map((entry) => [entry.playerId, entry]));
}

function chooseBye(players, stats) {
  return players.slice().sort((a, b) => {
    const aStats = stats.get(a.id);
    const bStats = stats.get(b.id);
    const byeDifference = (aStats.byes > 0 ? 1 : 0) - (bStats.byes > 0 ? 1 : 0);
    return byeDifference || (aStats.score - bStats.score) || (b.seed - a.seed);
  })[0];
}

function pairingCost(a, b, stats, rankIndex) {
  const aStats = stats.get(a.id);
  const bStats = stats.get(b.id);
  const repeated = aStats.opponents.includes(b.id) ? 1 : 0;
  const scoreGapHalfPoints = Math.round(Math.abs(aStats.score - bStats.score) * 2);
  const standingDistance = Math.abs(rankIndex.get(a.id) - rankIndex.get(b.id));
  return repeated * 100000000 + scoreGapHalfPoints * 100000 + standingDistance * 100 + Math.abs(a.seed - b.seed);
}

function exactMatching(players, cost) {
  const memo = new Map();
  function solve(mask) {
    if (mask === 0) return { cost: 0, pairs: [] };
    if (memo.has(mask)) return memo.get(mask);
    let first = 0;
    while ((mask & (1 << first)) === 0) first += 1;
    const withoutFirst = mask & ~(1 << first);
    let best = null;
    for (let partner = first + 1; partner < players.length; partner += 1) {
      if ((withoutFirst & (1 << partner)) === 0) continue;
      const rest = solve(withoutFirst & ~(1 << partner));
      const candidate = {
        cost: cost(players[first], players[partner]) + rest.cost,
        pairs: [[players[first], players[partner]]].concat(rest.pairs)
      };
      if (!best || candidate.cost < best.cost) best = candidate;
    }
    memo.set(mask, best);
    return best;
  }
  return solve((1 << players.length) - 1).pairs;
}

function largeFieldMatching(players, cost) {
  const remaining = players.slice();
  const pairs = [];
  while (remaining.length) {
    const player = remaining.shift();
    let bestIndex = 0;
    let bestCost = Infinity;
    remaining.forEach((candidate, index) => {
      const value = cost(player, candidate);
      if (value < bestCost) { bestCost = value; bestIndex = index; }
    });
    pairs.push([player, remaining.splice(bestIndex, 1)[0]]);
  }

  // Repeatedly swap partners when doing so strictly improves the Swiss cost.
  let improved = true;
  for (let pass = 0; pass < 8 && improved; pass += 1) {
    improved = false;
    for (let i = 0; i < pairs.length; i += 1) {
      for (let j = i + 1; j < pairs.length; j += 1) {
        const [a, b] = pairs[i];
        const [c, d] = pairs[j];
        const current = cost(a, b) + cost(c, d);
        const optionOne = cost(a, c) + cost(b, d);
        const optionTwo = cost(a, d) + cost(b, c);
        if (optionOne < current && optionOne <= optionTwo) {
          pairs[i] = [a, c]; pairs[j] = [b, d]; improved = true;
        } else if (optionTwo < current) {
          pairs[i] = [a, d]; pairs[j] = [b, c]; improved = true;
        }
      }
    }
  }
  return pairs;
}

function sameColorStreak(colors, color) {
  let count = 0;
  for (let index = colors.length - 1; index >= 0 && colors[index] === color; index -= 1) count += 1;
  return count;
}

function colorPenalty(player, color, stats) {
  const history = stats.get(player.id).colors;
  const whites = history.filter((entry) => entry === "W").length;
  const blacks = history.length - whites;
  const imbalance = color === "W" ? Math.abs((whites + 1) - blacks) : Math.abs(whites - (blacks + 1));
  const streak = sameColorStreak(history, color);
  return imbalance * 10 + (streak >= 2 ? 1000 : streak * 25);
}

function orientPair(a, b, stats, boardIndex) {
  const normal = colorPenalty(a, "W", stats) + colorPenalty(b, "B", stats);
  const reversed = colorPenalty(a, "B", stats) + colorPenalty(b, "W", stats);
  if (normal < reversed) return [a, b];
  if (reversed < normal) return [b, a];
  const favoredWhite = boardIndex % 2 === 0 ? Math.min(a.seed, b.seed) : Math.max(a.seed, b.seed);
  return a.seed === favoredWhite ? [a, b] : [b, a];
}

function roundOnePairs(players) {
  const ordered = players.slice().sort((a, b) => a.seed - b.seed);
  const half = ordered.length / 2;
  return ordered.slice(0, half).map((player, index) => [player, ordered[index + half]]);
}

export function generateRound(state) {
  assert(state.status === "active", "The tournament is not accepting new rounds.");
  assert(!currentRound(state), "Finish the current round before generating another.");
  const number = state.rounds.length + 1;
  const eligible = state.players.filter((player) => player.active && player.entryRound <= number);
  assert(eligible.length >= 1, "No active players are available for this round.");
  const stats = statsMap(state);
  let bye = null;
  let pairedPlayers = eligible;
  if (eligible.length % 2 === 1) {
    bye = chooseBye(eligible, stats);
    pairedPlayers = eligible.filter((player) => player.id !== bye.id);
  }

  let rawPairs;
  if (number === 1) {
    rawPairs = roundOnePairs(pairedPlayers);
  } else {
    const order = pairedPlayers.slice().sort((a, b) => (stats.get(b.id).score - stats.get(a.id).score) || (a.seed - b.seed));
    const rankIndex = new Map(order.map((player, index) => [player.id, index]));
    const cost = (a, b) => pairingCost(a, b, stats, rankIndex);
    rawPairs = order.length <= 18 ? exactMatching(order, cost) : largeFieldMatching(order, cost);
  }

  const pairings = rawPairs.map((pair, index) => {
    const [white, black] = orientPair(pair[0], pair[1], stats, index);
    return { id: makeId(state, "pairing"), board: index + 1, whiteId: white.id, blackId: black.id, result: null };
  });
  if (bye) pairings.push({ id: makeId(state, "pairing"), board: null, whiteId: bye.id, blackId: null, result: "bye" });
  const round = { id: makeId(state, "round"), number, status: "active", createdAt: new Date().toISOString(), completedAt: null, pairings, standings: null };
  state.rounds.push(round);
  return round;
}

export function recordResult(state, pairingId, result) {
  const round = currentRound(state);
  assert(round, "There is no active round.");
  const pairing = round.pairings.find((entry) => entry.id === pairingId);
  assert(pairing && pairing.blackId !== null, "Game not found.");
  assert(RESULT_OPTIONS.includes(result), "Choose a valid game result.");
  pairing.result = result;
  return pairing;
}

export function roundIsComplete(round) {
  return Boolean(round) && round.pairings.every((pairing) => pairing.result !== null);
}

function snapshotStandings(state, roundNumber) {
  return calculateStandings(state, roundNumber).map((entry) => ({
    rank: entry.rank, playerId: entry.playerId, name: entry.name, rating: entry.rating,
    seed: entry.seed, score: entry.score, wins: entry.wins, draws: entry.draws,
    losses: entry.losses, byes: entry.byes, active: entry.active, lateEntry: entry.lateEntry
  }));
}

export function finalizeRound(state) {
  const round = currentRound(state);
  assert(round, "There is no active round.");
  assert(roundIsComplete(round), "Record every game result before continuing.");
  round.status = "complete";
  round.completedAt = new Date().toISOString();
  round.standings = snapshotStandings(state, round.number);
  return round;
}

export function advanceTournament(state) {
  finalizeRound(state);
  return { kind: "round", round: generateRound(state) };
}

export function endTournament(state) {
  const round = finalizeRound(state);
  prepareTiebreaks(state);
  return { kind: state.status === "complete" ? "complete" : "tiebreak", round };
}

function primaryScoreGroups(state) {
  const standings = calculateStandings(state);
  const groups = [];
  standings.forEach((entry) => {
    const last = groups[groups.length - 1];
    if (!last || last.score !== entry.score) groups.push({ score: entry.score, players: [entry] });
    else last.players.push(entry);
  });
  return groups;
}

function allTiebreakGames(state) {
  return state.tiebreaks.groups.flatMap((group) => group.phases.flatMap((phase) => phase.games));
}

function tiebreakColorStats(state) {
  const base = statsMap(state);
  allTiebreakGames(state).forEach((game) => {
    if (!game.whiteId || !game.blackId) return;
    base.get(game.whiteId).colors.push("W");
    base.get(game.blackId).colors.push("B");
  });
  return base;
}

function createTiebreakPhase(state, group, playerIds, startRank) {
  const players = playerIds.map((id) => state.players.find((player) => player.id === id)).sort((a, b) => a.seed - b.seed);
  const stats = tiebreakColorStats(state);
  const phaseNumber = group.phases.length + 1;
  const games = [];
  let gameIndex = 0;
  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const [white, black] = orientPair(players[i], players[j], stats, gameIndex + phaseNumber);
      const game = { id: makeId(state, "tiebreak-game"), whiteId: white.id, blackId: black.id, result: null };
      games.push(game);
      stats.get(white.id).colors.push("W");
      stats.get(black.id).colors.push("B");
      gameIndex += 1;
    }
  }
  const phase = { id: makeId(state, "tiebreak-phase"), number: phaseNumber, playerIds: players.map((player) => player.id), startRank, status: "active", games };
  group.phases.push(phase);
  return phase;
}

export function prepareTiebreaks(state) {
  // Podium ties use round-robin game series instead of a hidden mathematical
  // tiebreak. Any subgroup still tied after a series gets another series.
  assert(state.rounds.length > 0 && !currentRound(state), "Complete the current round before ending the tournament.");
  state.tiebreaks = { groups: [] };
  let startRank = 1;
  primaryScoreGroups(state).forEach((scoreGroup) => {
    if (startRank <= 3 && scoreGroup.players.length > 1) {
      const group = {
        id: makeId(state, "tiebreak-group"),
        score: scoreGroup.score,
        playerIds: scoreGroup.players.map((player) => player.playerId),
        startRank,
        placements: {},
        phases: [],
        status: "active"
      };
      state.tiebreaks.groups.push(group);
      createTiebreakPhase(state, group, group.playerIds, startRank);
    }
    startRank += scoreGroup.players.length;
  });
  if (state.tiebreaks.groups.length) {
    state.status = "tiebreak";
  } else {
    state.status = "complete";
    state.completedAt = new Date().toISOString();
  }
}

export function recordTiebreakResult(state, gameId, result) {
  assert(state.status === "tiebreak", "No tiebreak is active.");
  assert(RESULT_OPTIONS.includes(result), "Choose a valid game result.");
  const game = allTiebreakGames(state).find((entry) => entry.id === gameId);
  assert(game, "Tiebreak game not found.");
  game.result = result;
  return game;
}

function phasePoints(phase) {
  const points = new Map(phase.playerIds.map((id) => [id, 0]));
  phase.games.forEach((game) => {
    if (game.result === "1-0") points.set(game.whiteId, points.get(game.whiteId) + 1);
    if (game.result === "0-1") points.set(game.blackId, points.get(game.blackId) + 1);
    if (game.result === "0.5-0.5") {
      points.set(game.whiteId, points.get(game.whiteId) + 0.5);
      points.set(game.blackId, points.get(game.blackId) + 0.5);
    }
  });
  return points;
}

export function activeTiebreakPhases(state) {
  return state.tiebreaks.groups.flatMap((group) => group.phases.filter((phase) => phase.status === "active").map((phase) => ({ group, phase })));
}

export function advanceTiebreaks(state) {
  const active = activeTiebreakPhases(state);
  assert(active.length > 0, "There are no active tiebreak games.");
  assert(active.every(({ phase }) => phase.games.every((game) => game.result !== null)), "Record every tiebreak result before continuing.");

  active.forEach(({ group, phase }) => {
    phase.status = "complete";
    const points = phasePoints(phase);
    phase.points = Object.fromEntries(points);
    const ordered = phase.playerIds.slice().sort((a, b) => (points.get(b) - points.get(a)) || (state.players.find((p) => p.id === a).seed - state.players.find((p) => p.id === b).seed));
    let offset = 0;
    while (offset < ordered.length) {
      const score = points.get(ordered[offset]);
      let end = offset + 1;
      while (end < ordered.length && points.get(ordered[end]) === score) end += 1;
      const tied = ordered.slice(offset, end);
      const rank = phase.startRank + offset;
      if (tied.length === 1) {
        group.placements[tied[0]] = rank;
      } else if (rank <= 3) {
        createTiebreakPhase(state, group, tied, rank);
      }
      offset = end;
    }
    const needed = [];
    for (let rank = group.startRank; rank <= Math.min(3, group.startRank + group.playerIds.length - 1); rank += 1) needed.push(rank);
    const placed = new Set(Object.values(group.placements));
    if (needed.every((rank) => placed.has(rank))) group.status = "complete";
  });

  if (state.tiebreaks.groups.every((group) => group.status === "complete")) {
    state.status = "complete";
    state.completedAt = new Date().toISOString();
  }
  return state.status;
}

export function getPodium(state) {
  const podium = [1, 2, 3].map((place) => ({ place, player: null, required: null }));
  let startRank = 1;
  primaryScoreGroups(state).forEach((scoreGroup) => {
    if (startRank > 3) return;
    if (scoreGroup.players.length === 1) {
      podium[startRank - 1].player = scoreGroup.players[0];
    } else {
      const tieGroup = state.tiebreaks.groups.find((group) => group.startRank === startRank && group.score === scoreGroup.score);
      for (let place = startRank; place <= Math.min(3, startRank + scoreGroup.players.length - 1); place += 1) {
        const playerId = tieGroup && Object.keys(tieGroup.placements).find((id) => tieGroup.placements[id] === place);
        if (playerId) podium[place - 1].player = scoreGroup.players.find((entry) => entry.playerId === playerId);
        else podium[place - 1].required = scoreGroup.players.map((entry) => entry.playerId);
      }
    }
    startRank += scoreGroup.players.length;
  });
  return podium;
}

export function playerById(state, playerId) {
  return state.players.find((player) => player.id === playerId) || null;
}

export function formatRating(rating) {
  return rating == null ? "Unrated" : String(rating);
}
