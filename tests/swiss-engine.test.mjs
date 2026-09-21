import test from "node:test";
import assert from "node:assert/strict";
import {
  createTournament,
  addPlayer,
  updatePlayer,
  removePlayer,
  seedPlayers,
  startTournament,
  currentRound,
  calculateStandings,
  recordResult,
  advanceTournament,
  endTournament,
  withdrawPlayer,
  activeTiebreakPhases,
  recordTiebreakResult,
  advanceTiebreaks,
  getPodium
} from "../assets/js/swiss-engine.mjs";

function tournament() {
  return createTournament();
}

function addField(state, entries) {
  entries.forEach((entry) => addPlayer(state, typeof entry === "string" ? { name: entry, rating: "" } : entry));
}

function playerForSeed(state, seed) {
  return state.players.find((player) => player.seed === seed);
}

function seedPairings(state) {
  return currentRound(state).pairings.filter((pairing) => pairing.blackId !== null).map((pairing) => {
    const seeds = [state.players.find((player) => player.id === pairing.whiteId).seed, state.players.find((player) => player.id === pairing.blackId).seed];
    return seeds.sort((a, b) => a - b);
  }).sort((a, b) => a[0] - b[0]);
}

function resultAll(state, result = "0.5-0.5") {
  currentRound(state).pairings.filter((pairing) => pairing.blackId !== null).forEach((pairing) => recordResult(state, pairing.id, result));
}

function opponentPairs(state, roundNumber) {
  return state.rounds[roundNumber - 1].pairings.filter((pairing) => pairing.blackId !== null).map((pairing) => [pairing.whiteId, pairing.blackId].sort().join(":"));
}

test("validates setup, edits players, and removes them before starting", () => {
  const state = tournament();
  const player = addPlayer(state, { name: " Ada ", rating: "1800" });
  assert.equal(player.name, "Ada");
  assert.equal(player.rating, 1800);
  updatePlayer(state, player.id, { name: "Ada L.", rating: "" });
  assert.equal(player.rating, null);
  removePlayer(state, player.id);
  assert.equal(state.players.length, 0);
  assert.throws(() => addPlayer(state, { name: "", rating: 1200 }), /name/i);
  assert.throws(() => addPlayer(state, { name: "Bad", rating: 99999 }), /rating/i);
});

test("Round 1 uses top-half versus bottom-half Swiss seeding", () => {
  const state = tournament();
  addField(state, Array.from({ length: 8 }, (_, index) => ({ name: "P" + (index + 1), rating: 2400 - index * 100 })));
  startTournament(state);
  assert.deepEqual(seedPairings(state), [[1, 5], [2, 6], [3, 7], [4, 8]]);
});

test("identical ratings and Unrated players receive deterministic seeds", () => {
  const state = tournament();
  addField(state, [
    { name: "Zulu", rating: "" },
    { name: "Beta", rating: 1600 },
    { name: "Alpha", rating: 1600 },
    { name: "Able", rating: "" }
  ]);
  const seeded = seedPlayers(state);
  assert.deepEqual(seeded.map((player) => player.name), ["Alpha", "Beta", "Able", "Zulu"]);
  assert.deepEqual(seeded.map((player) => player.seed), [1, 2, 3, 4]);
});

test("odd fields assign the first bye to the lowest seed and avoid a second bye", () => {
  const state = tournament(3);
  addField(state, Array.from({ length: 5 }, (_, index) => ({ name: "P" + (index + 1), rating: 2000 - index * 100 })));
  startTournament(state);
  const firstBye = currentRound(state).pairings.find((pairing) => pairing.blackId === null).whiteId;
  assert.equal(firstBye, playerForSeed(state, 5).id);
  resultAll(state);
  advanceTournament(state);
  const secondBye = currentRound(state).pairings.find((pairing) => pairing.blackId === null).whiteId;
  assert.notEqual(secondBye, firstBye);
  assert.equal(calculateStandings(state).find((entry) => entry.playerId === firstBye).byes, 1);
});

test("two- and three-player tournaments remain usable when rematches are unavoidable", () => {
  const two = tournament(3);
  addField(two, ["A", "B"]);
  startTournament(two);
  for (let round = 1; round <= 3; round += 1) {
    assert.equal(currentRound(two).pairings.filter((pairing) => pairing.blackId !== null).length, 1);
    resultAll(two);
    if (round < 3) advanceTournament(two);
    else endTournament(two);
  }
  assert.equal(two.rounds.length, 3);

  const three = tournament(3);
  addField(three, ["A", "B", "C"]);
  startTournament(three);
  for (let round = 1; round <= 3; round += 1) {
    assert.equal(currentRound(three).pairings.filter((pairing) => pairing.blackId === null).length, 1);
    resultAll(three);
    if (round < 3) advanceTournament(three);
    else endTournament(three);
  }
  assert.deepEqual(calculateStandings(three).map((entry) => entry.byes).sort(), [1, 1, 1]);
});

test("later rounds keep equal-score players together", () => {
  const state = tournament(2);
  addField(state, Array.from({ length: 8 }, (_, index) => ({ name: "P" + (index + 1), rating: 2400 - index * 100 })));
  startTournament(state);
  currentRound(state).pairings.forEach((pairing, index) => recordResult(state, pairing.id, index % 2 === 0 ? "1-0" : "0-1"));
  advanceTournament(state);
  const standings = new Map(calculateStandings(state).map((entry) => [entry.playerId, entry.score]));
  currentRound(state).pairings.filter((pairing) => pairing.blackId !== null).forEach((pairing) => {
    assert.equal(standings.get(pairing.whiteId), standings.get(pairing.blackId));
  });
});

test("the exact matcher avoids repeat opponents across three rounds", () => {
  const state = tournament(3);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  resultAll(state); advanceTournament(state);
  resultAll(state); advanceTournament(state);
  const allPairs = [1, 2, 3].flatMap((round) => opponentPairs(state, round));
  assert.equal(new Set(allPairs).size, allPairs.length);
});

test("pairings are deterministic for identical tournament state", () => {
  const state = tournament(3);
  addField(state, Array.from({ length: 10 }, (_, index) => ({ name: "P" + index, rating: index % 3 ? 1700 : "" })));
  startTournament(state);
  resultAll(state);
  const copy = structuredClone(state);
  advanceTournament(state);
  advanceTournament(copy);
  const simplify = (value) => currentRound(value).pairings.map(({ board, whiteId, blackId, result }) => ({ board, whiteId, blackId, result }));
  assert.deepEqual(simplify(state), simplify(copy));
});

test("colors remain balanced when reasonable alternatives exist", () => {
  const state = tournament(3);
  addField(state, ["A", "B", "C", "D", "E", "F"]);
  startTournament(state);
  resultAll(state); advanceTournament(state);
  resultAll(state); advanceTournament(state);
  resultAll(state);
  calculateStandings(state).forEach((entry) => {
    const whites = entry.colors.filter((color) => color === "W").length;
    const blacks = entry.colors.filter((color) => color === "B").length;
    assert.ok(Math.abs(whites - blacks) <= 1, entry.name + " has an avoidable color imbalance");
    assert.notEqual(entry.colors.join(""), "WWW");
    assert.notEqual(entry.colors.join(""), "BBB");
  });
});

test("late entrants start on zero and join only the subsequent round", () => {
  const state = tournament(2);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  resultAll(state, "1-0");
  const late = addPlayer(state, { name: "Late", rating: 2200 });
  assert.equal(late.seed, 5);
  assert.equal(late.entryRound, 2);
  assert.equal(calculateStandings(state).find((entry) => entry.playerId === late.id).score, 0);
  assert.ok(!currentRound(state).pairings.some((pairing) => pairing.whiteId === late.id || pairing.blackId === late.id));
  advanceTournament(state);
  assert.ok(currentRound(state).pairings.some((pairing) => pairing.whiteId === late.id || pairing.blackId === late.id));
});

test("multiple late entrants keep zero points and unique appended seeds", () => {
  const state = tournament(2);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  resultAll(state, "1-0");
  const lateOne = addPlayer(state, { name: "Late One", rating: 2400 });
  const lateTwo = addPlayer(state, { name: "Late Two", rating: "" });
  assert.deepEqual([lateOne.seed, lateTwo.seed], [5, 6]);
  assert.deepEqual(calculateStandings(state).filter((entry) => entry.lateEntry).map((entry) => entry.score), [0, 0]);
  advanceTournament(state);
  const roundIds = new Set(currentRound(state).pairings.flatMap((pairing) => [pairing.whiteId, pairing.blackId]));
  assert.ok(roundIds.has(lateOne.id));
  assert.ok(roundIds.has(lateTwo.id));
});

test("withdrawn players preserve history and are excluded from later rounds", () => {
  const state = tournament(2);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  const withdrawn = state.players[0];
  const firstRoundPair = currentRound(state).pairings.find((pairing) => pairing.whiteId === withdrawn.id || pairing.blackId === withdrawn.id);
  withdrawPlayer(state, withdrawn.id);
  resultAll(state);
  advanceTournament(state);
  assert.ok(firstRoundPair);
  assert.equal(state.rounds[0].pairings.some((pairing) => pairing.whiteId === withdrawn.id || pairing.blackId === withdrawn.id), true);
  assert.equal(currentRound(state).pairings.some((pairing) => pairing.whiteId === withdrawn.id || pairing.blackId === withdrawn.id), false);
  assert.equal(calculateStandings(state).find((entry) => entry.playerId === withdrawn.id).active, false);
});

test("withdrawal after all current results acts before the next round begins", () => {
  const state = tournament(2);
  addField(state, ["A", "B", "C", "D", "E", "F"]);
  startTournament(state);
  resultAll(state);
  const player = state.players[2];
  withdrawPlayer(state, player.id);
  advanceTournament(state);
  assert.ok(!currentRound(state).pairings.some((pairing) => pairing.whiteId === player.id || pairing.blackId === player.id));
  assert.ok(state.rounds[0].standings.find((entry) => entry.playerId === player.id));
});

test("results are editable and incomplete rounds cannot advance", () => {
  const state = tournament(2);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  const game = currentRound(state).pairings[0];
  recordResult(state, game.id, "1-0");
  recordResult(state, game.id, "0-1");
  assert.equal(game.result, "0-1");
  assert.throws(() => advanceTournament(state), /every game result/i);
  assert.throws(() => endTournament(state), /every game result/i);
});

test("tournaments continue beyond thirty rounds until explicitly ended", () => {
  const state = tournament();
  addField(state, ["A", "B"]);
  startTournament(state);
  for (let round = 1; round <= 35; round += 1) {
    const game = currentRound(state).pairings[0];
    recordResult(state, game.id, game.whiteId === state.players[0].id ? "1-0" : "0-1");
    advanceTournament(state);
  }
  assert.equal(currentRound(state).number, 36);
  assert.equal(state.status, "active");
  const finalGame = currentRound(state).pairings[0];
  recordResult(state, finalGame.id, finalGame.whiteId === state.players[0].id ? "1-0" : "0-1");
  const outcome = endTournament(state);
  assert.equal(outcome.round.number, 36);
  assert.equal(state.status, "complete");
  assert.equal(currentRound(state), null);
});

test("large fields receive complete deterministic pairings", () => {
  const state = tournament(2);
  addField(state, Array.from({ length: 24 }, (_, index) => ({ name: "P" + String(index + 1).padStart(2, "0"), rating: 2200 - index * 20 })));
  startTournament(state);
  resultAll(state);
  advanceTournament(state);
  const secondRound = currentRound(state);
  assert.equal(secondRound.pairings.length, 12);
  const assigned = secondRound.pairings.flatMap((pairing) => [pairing.whiteId, pairing.blackId]);
  assert.equal(new Set(assigned).size, 24);
  assert.ok(secondRound.pairings.every((pairing) => pairing.whiteId && pairing.blackId));
});

test("standings use competition ranks and do not break score ties", () => {
  const state = tournament(1);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  resultAll(state);
  const standings = calculateStandings(state);
  assert.deepEqual(standings.map((entry) => entry.rank), [1, 1, 1, 1]);
  assert.ok(standings.every((entry) => entry.tied));
});

test("a multi-player podium tie is resolved by a round-robin game series", () => {
  const state = tournament(1);
  addField(state, ["A", "B", "C", "D"]);
  startTournament(state);
  resultAll(state);
  const outcome = endTournament(state);
  assert.equal(outcome.kind, "tiebreak");
  const [{ phase }] = activeTiebreakPhases(state);
  assert.equal(phase.games.length, 6);
  // Lower seed wins every matchup, yielding unique 3/2/1/0 tiebreak scores.
  phase.games.forEach((game) => {
    const whiteSeed = state.players.find((player) => player.id === game.whiteId).seed;
    const blackSeed = state.players.find((player) => player.id === game.blackId).seed;
    recordTiebreakResult(state, game.id, whiteSeed < blackSeed ? "1-0" : "0-1");
  });
  assert.equal(advanceTiebreaks(state), "complete");
  assert.deepEqual(getPodium(state).map((entry) => entry.player.name), ["A", "B", "C"]);
});

test("a drawn podium tiebreak creates a new color-balanced replay series", () => {
  const state = tournament(1);
  addField(state, ["A", "B"]);
  startTournament(state);
  resultAll(state);
  endTournament(state);
  const first = activeTiebreakPhases(state)[0].phase;
  recordTiebreakResult(state, first.games[0].id, "0.5-0.5");
  assert.equal(advanceTiebreaks(state), "tiebreak");
  const second = activeTiebreakPhases(state)[0].phase;
  assert.equal(second.number, 2);
  assert.equal(second.games[0].whiteId, first.games[0].blackId);
  recordTiebreakResult(state, second.games[0].id, "1-0");
  assert.equal(advanceTiebreaks(state), "complete");
  assert.equal(getPodium(state)[0].player.playerId, second.games[0].whiteId);
  assert.equal(getPodium(state)[1].player.playerId, second.games[0].blackId);
});

test("multiple rounds maintain complete snapshots and scoring history", () => {
  const state = tournament(4);
  addField(state, ["A", "B", "C", "D", "E", "F", "G"]);
  startTournament(state);
  for (let round = 1; round <= 4; round += 1) {
    resultAll(state, round % 2 ? "1-0" : "0-1");
    if (round < 4) advanceTournament(state);
    else endTournament(state);
  }
  assert.equal(state.rounds.length, 4);
  assert.ok(state.rounds.every((entry) => entry.status === "complete" && entry.standings.length === 7));
  const totalScore = calculateStandings(state).reduce((sum, entry) => sum + entry.score, 0);
  assert.equal(totalScore, 16); // Four rounds × (three games + one bye).
});
