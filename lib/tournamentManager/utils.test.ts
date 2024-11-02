import { describe, expect, it, beforeEach } from "vitest";
import { enableMapSet } from "immer";
import {
	createPlayer,
	createMatch,
	findAvailableOpponent,
	findAvailableUmpire,
	updatePlayerStates,
	isMatchComplete,
	canStartNewMatch,
	addPlayerToTournament,
	removePlayerFromTournament,
	confirmMatchWinner,
	updateWaitingTimes,
} from "./utils";
import type { Player, Match } from "./types";

// Enable Map and Set support in Immer
enableMapSet();

describe("Tournament Utils", () => {
	describe("createPlayer", () => {
		it("should create a player with default values", () => {
			const player = createPlayer("p1", "John Doe");
			expect(player).toEqual({
				id: "p1",
				name: "John Doe",
				state: "waiting",
				lastState: "playing",
				totalTimeWaiting: 0,
				matchHistory: new Set(),
			});
		});

		it("should handle empty strings gracefully", () => {
			const player = createPlayer("", "");
			expect(player.id).toBe("");
			expect(player.name).toBe("");
		});
	});

	describe("createMatch", () => {
		let player1: Player;
		let player2: Player;
		let umpire: Player;

		beforeEach(() => {
			player1 = createPlayer("p1", "Player 1");
			player2 = createPlayer("p2", "Player 2");
			umpire = createPlayer("u1", "Umpire 1");
		});

		it("should create a match with correct initial state", () => {
			const match = createMatch(player1, player2, umpire);
			expect(match).toMatchObject({
				player1,
				player2,
				umpire,
				state: "ongoing",
				playersConfirmed: new Set(),
				umpireConfirmed: false,
			});
			expect(match.id).toMatch(/^match_\d+_0\.\d+$/);
			expect(match.startTime).toBeInstanceOf(Date);
		});

		it("should create match with timestamp close to current time", () => {
			const match = createMatch(player1, player2, umpire);
			const now = new Date().getTime();
			expect(match.startTime.getTime()).toBeCloseTo(now, -2); // Within 100ms
		});
	});

	describe("findAvailableOpponent", () => {
		let players: Player[];
		let currentPlayer: Player;

		beforeEach(() => {
			currentPlayer = createPlayer("p1", "Player 1");
			players = [
				currentPlayer,
				createPlayer("p2", "Player 2"),
				createPlayer("p3", "Player 3"),
			];
		});

		it("should find first available opponent after current player", () => {
			expect(findAvailableOpponent(players, currentPlayer)).toBe(1);
		});

		it("should find opponent when current player is not at index 0", () => {
			players = [
				createPlayer("p2", "Player 2"),
				currentPlayer,
				createPlayer("p3", "Player 3"),
			];
			expect(findAvailableOpponent(players, currentPlayer)).toBe(2);
		});

		it("should wrap around to find opponent at start of array", () => {
			players = [
				createPlayer("p2", "Player 2"),
				currentPlayer,
				createPlayer("p3", "Player 3"),
			];
			currentPlayer.matchHistory.add("p3");
			expect(findAvailableOpponent(players, currentPlayer)).toBe(0);
		});

		it("should return -1 if no opponents available", () => {
			currentPlayer.matchHistory.add("p2");
			currentPlayer.matchHistory.add("p3");
			expect(findAvailableOpponent(players, currentPlayer)).toBe(-1);
		});
	});

	describe("findAvailableUmpire", () => {
		it("should find first available umpire excluding specified index", () => {
			expect(findAvailableUmpire([], 1)).toBe(-1);
			expect(
				findAvailableUmpire([{} as Player, {} as Player, {} as Player], 1),
			).toBe(2);
		});
	});

	describe("updatePlayerStates", () => {
		let players: Player[];

		beforeEach(() => {
			players = [
				createPlayer("p1", "Player 1"),
				createPlayer("p2", "Player 2"),
			];
		});

		it("should update player states correctly", () => {
			const result = updatePlayerStates(players, [
				{ player: players[0], newState: "playing" },
			]);

			expect(result[0].state).toBe("playing");
			expect(result[0].lastState).toBe("waiting");
			expect(result[1].state).toBe("waiting"); // unchanged
		});

		it("should handle multiple state updates simultaneously", () => {
			const result = updatePlayerStates(players, [
				{ player: players[0], newState: "playing" },
				{ player: players[1], newState: "umpiring" },
			]);

			expect(result[0].state).toBe("playing");
			expect(result[1].state).toBe("umpiring");
		});
	});

	describe("isMatchComplete", () => {
		let match: Match;

		beforeEach(() => {
			match = createMatch(
				createPlayer("p1", "Player 1"),
				createPlayer("p2", "Player 2"),
				createPlayer("u1", "Umpire 1"),
			);
		});

		it("should return false for incomplete match", () => {
			expect(isMatchComplete(match)).toBe(false);
		});

		it("should return true for complete match", () => {
			match.umpireConfirmed = true;
			match.playersConfirmed = new Set(["p1", "p2"]);
			match.winnerId = "p1";
			expect(isMatchComplete(match)).toBe(true);
		});

		it("should return false for partially complete match", () => {
			match.umpireConfirmed = true;
			match.playersConfirmed = new Set(["p1"]); // Only one player confirmed
			match.winnerId = "p1";
			expect(isMatchComplete(match)).toBe(false);
		});
	});

	describe("Player Tournament Management", () => {
		let players: Map<string, Player>;

		beforeEach(() => {
			players = new Map();
		});

		describe("addPlayerToTournament", () => {
			it("should add new player to tournament", () => {
				const result = addPlayerToTournament(players, "p1", "Player 1", 10);
				expect(result.size).toBe(1);
				expect(result.get("p1")?.name).toBe("Player 1");
			});

			it("should not add player if tournament is full", () => {
				const result = addPlayerToTournament(players, "p1", "Player 1", 0);
				expect(result.size).toBe(0);
			});

			it("should not add duplicate player", () => {
				players.set("p1", createPlayer("p1", "Player 1"));
				const result = addPlayerToTournament(players, "p1", "Player 1", 10);
				expect(result.size).toBe(1);
			});
		});

		describe("removePlayerFromTournament", () => {
			beforeEach(() => {
				players.set("p1", createPlayer("p1", "Player 1"));
			});

			it("should remove waiting player", () => {
				const result = removePlayerFromTournament(players, "p1");
				expect(result.size).toBe(0);
			});

			it("should not remove non-waiting player", () => {
				const player = players.get("p1");
				if (!player) throw new Error("Player not found");
				player.state = "playing";
				const result = removePlayerFromTournament(players, "p1");
				expect(result.size).toBe(1);
			});

			it("should handle non-existent player", () => {
				const result = removePlayerFromTournament(players, "nonexistent");
				expect(result.size).toBe(1);
			});
		});
	});

	describe("Match Management", () => {
		let matches: Map<string, Match>;
		let match: Match;

		beforeEach(() => {
			match = createMatch(
				createPlayer("p1", "Player 1"),
				createPlayer("p2", "Player 2"),
				createPlayer("u1", "Umpire 1"),
			);
			matches = new Map([[match.id, match]]);
		});

		describe("confirmMatchWinner", () => {
			it("should set winner for ongoing match", () => {
				const result = confirmMatchWinner(matches, match.id, "p1");
				expect(result.get(match.id)?.winnerId).toBe("p1");
			});

			it("should not set winner for non-ongoing match", () => {
				match.state = "ended";
				const result = confirmMatchWinner(matches, match.id, "p1");
				expect(result.get(match.id)?.winnerId).toBeUndefined();
			});

			it("should not allow changing winner once set", () => {
				const firstUpdate = confirmMatchWinner(matches, match.id, "p1");
				const secondUpdate = confirmMatchWinner(firstUpdate, match.id, "p2");
				expect(secondUpdate.get(match.id)?.winnerId).toBe("p1");
			});
		});
	});

	describe("Queue Management", () => {
		describe("updateWaitingTimes", () => {
			it("should increment waiting times for all players", () => {
				const players = [
					createPlayer("p1", "Player 1"),
					createPlayer("p2", "Player 2"),
				];
				const result = updateWaitingTimes(players);
				expect(result[0].totalTimeWaiting).toBe(1);
				expect(result[1].totalTimeWaiting).toBe(1);
			});

			it("should only increment waiting times for players in waiting state", () => {
				const players = [
					{ ...createPlayer("p1", "Player 1"), state: "waiting" },
					{ ...createPlayer("p2", "Player 2"), state: "playing" },
					{ ...createPlayer("p3", "Player 3"), state: "waiting" },
					{ ...createPlayer("p4", "Player 4"), state: "umpiring" },
				] satisfies Player[];

				const result = updateWaitingTimes(players);

				expect(result[0].totalTimeWaiting).toBe(1); // waiting player
				expect(result[1].totalTimeWaiting).toBe(0); // playing player
				expect(result[2].totalTimeWaiting).toBe(1); // waiting player
				expect(result[3].totalTimeWaiting).toBe(0); // umpiring player
			});
		});

		describe("canStartNewMatch", () => {
			it("should return true with sufficient resources", () => {
				expect(canStartNewMatch(1, 3)).toBe(true);
			});

			it("should return false with insufficient resources", () => {
				expect(canStartNewMatch(0, 3)).toBe(false);
				expect(canStartNewMatch(1, 2)).toBe(false);
			});
		});
	});
});
