import { createActor } from "xstate";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { tournamentMachine } from "./tournamentMachine";

describe("tournamentMachine", () => {
	function createTestActor() {
		const machine = tournamentMachine;
		return createActor(machine);
	}

	let actor: ReturnType<typeof createTestActor>;

	beforeEach(() => {
		actor = createTestActor();
		actor.start();
	});

	// Basic Player Management Tests
	describe("Player Management", () => {
		test("should add a player with correct initial state", () => {
			actor.send({ type: "player.add", id: "p1", name: "Player 1" });

			const snapshot = actor.getSnapshot();
			const player = snapshot.context.players.get("p1");

			expect(player).toBeDefined();
			expect(player?.name).toBe("Player 1");
			expect(player?.state).toBe("waiting");
			expect(player?.matchHistory.size).toBe(0);
			expect(player?.totalTimeWaiting).toBe(0);
		});

		test("should handle duplicate player IDs", () => {
			actor.send({ type: "player.add", id: "p1", name: "Player 1" });
			actor.send({ type: "player.add", id: "p1", name: "Different Name" });

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.players.size).toBe(1);
			const player = snapshot.context.players.get("p1");
			if (!player) throw new Error("Player not found");
			expect(player.name).toBe("Player 1");
		});

		test("should maintain priority queue order after player removal", () => {
			// Add players with different waiting times
			actor.send({ type: "player.add", id: "p1", name: "Player 1" });
			actor.send({ type: "player.add", id: "p2", name: "Player 2" });
			actor.send({ type: "player.add", id: "p3", name: "Player 3" });

			// Verify initial state
			let snapshot = actor.getSnapshot();
			expect(snapshot.context.priorityQueue.map((p) => p.id)).toEqual([
				"p1",
				"p2",
				"p3",
			]);

			// Remove player
			actor.send({ type: "player.remove", id: "p2" });

			// Verify final state
			snapshot = actor.getSnapshot();
			expect(snapshot.context.players.has("p2")).toBe(false);
			expect(snapshot.context.priorityQueue.map((p) => p.id)).toEqual([
				"p1",
				"p3",
			]);
		});
	});

	// Match Management Tests
	describe("Match Management", () => {
		test("should prevent match start with players who recently played together", () => {
			// Setup initial match
			for (let i = 1; i <= 4; i++) {
				actor.send({ type: "player.add", id: `p${i}`, name: `Player ${i}` });
			}

			actor.send({ type: "match.start" });

			const firstSnapshot = actor.getSnapshot();
			const matchId = Array.from(firstSnapshot.context.matches.keys())[0];
			const match = firstSnapshot.context.matches.get(matchId);
			if (!match) throw new Error("Match not found");

			// Complete the match
			actor.send({
				type: "match.confirmWinner",
				matchId,
				winnerId: match.player1.id,
			});
			actor.send({ type: "match.confirm", matchId, playerId: match.umpire.id });
			actor.send({
				type: "match.confirm",
				matchId,
				playerId: match.player1.id,
			});
			actor.send({
				type: "match.confirm",
				matchId,
				playerId: match.player2.id,
			});

			// Try to start a new match immediately
			actor.send({ type: "match.start" });

			const finalSnapshot = actor.getSnapshot();
			const newMatch = Array.from(finalSnapshot.context.matches.values())[1];

			// Players from previous match shouldn't play together again
			expect(newMatch?.player1.id).not.toBe(match.player1.id);
			expect(newMatch?.player2.id).not.toBe(match.player2.id);
		});

		test("should handle match confirmation order correctly", () => {
			// Setup match
			for (let i = 1; i <= 3; i++) {
				actor.send({ type: "player.add", id: `p${i}`, name: `Player ${i}` });
			}

			actor.send({ type: "match.start" });

			const snapshot = actor.getSnapshot();
			const matchId = Array.from(snapshot.context.matches.keys())[0];
			const match = snapshot.context.matches.get(matchId);
			if (!match) throw new Error("Match not found");

			// Set winner
			actor.send({ type: "match.confirmWinner", matchId, winnerId: "p1" });

			// Confirm umpire first
			actor.send({ type: "match.confirm", matchId, playerId: match.umpire.id });

			// Then confirm both players
			actor.send({
				type: "match.confirm",
				matchId,
				playerId: match.player1.id,
			});
			actor.send({
				type: "match.confirm",
				matchId,
				playerId: match.player2.id,
			});

			const finalMatch = actor.getSnapshot().context.matches.get(matchId);
			if (!finalMatch) throw new Error("Match not found");

			expect(finalMatch.state).toBe("ended");
			expect(finalMatch.winnerId).toBe("p1");
			expect(finalMatch.umpireConfirmed).toBe(true);
			expect(Array.from(finalMatch.playersConfirmed || [])).toContain("p1");
			expect(Array.from(finalMatch.playersConfirmed || [])).toContain("p2");
		});
	});

	// Edge Cases and Error Handling
	describe("Edge Cases", () => {
		test("should handle rapid player additions and removals", () => {
			for (let i = 1; i <= 20; i++) {
				actor.send({ type: "player.add", id: `p${i}`, name: `Player ${i}` });
				if (i % 2 === 0) {
					actor.send({ type: "player.remove", id: `p${i - 1}` });
				}
			}

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.players.size).toBeLessThanOrEqual(
				snapshot.context.maxPlayerCount,
			);
		});

		test("should handle match confirmation for non-existent match", () => {
			actor.send({ type: "match.confirm", matchId: "invalid", playerId: "p1" });
			actor.send({
				type: "match.confirmWinner",
				matchId: "invalid",
				winnerId: "p1",
			});

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.matches.size).toBe(0);
		});

		test("should handle player removal during active match", () => {
			// Setup match
			for (let i = 1; i <= 4; i++) {
				actor.send({ type: "player.add", id: `p${i}`, name: `Player ${i}` });
			}

			actor.send({ type: "match.start" });
			// count players in the match
			const playersInMatch = Array.from(
				actor.getSnapshot().context.matches.values(),
			)[0]?.playersConfirmed?.size;

			// Try to remove player in match
			actor.send({ type: "player.remove", id: "p1" });

			const snapshot = actor.getSnapshot();
			expect(
				Array.from(snapshot.context.matches.values())[0]?.playersConfirmed
					?.size,
			).toBe(playersInMatch);
		});
	});

	// Time Management Tests
	describe("Time Management", () => {
		test("should correctly track waiting times across multiple matches", () => {
			vi.useFakeTimers();
			const TIME_STEP = 1000; // 1 second in milliseconds

			// Add players
			for (let i = 1; i <= 6; i++) {
				actor.send({ type: "player.add", id: `p${i}`, name: `Player ${i}` });
			}

			// Play multiple matches with time updates
			for (let i = 0; i < 3; i++) {
				actor.send({ type: "match.start" });

				const snapshot = actor.getSnapshot();
				const matchId = Array.from(snapshot.context.matches.keys())[i];
				const match = snapshot.context.matches.get(matchId);
				if (!match) throw new Error("Match not found");

				// Advance time and update while match is ongoing
				for (let t = 0; t < 5; t++) {
					vi.advanceTimersByTime(TIME_STEP);
					actor.send({ type: "time.update" });
				}

				// Complete match
				actor.send({
					type: "match.confirmWinner",
					matchId,
					winnerId: match.player1.id,
				});

				// Advance time between confirmations
				vi.advanceTimersByTime(TIME_STEP);
				actor.send({
					type: "match.confirm",
					matchId,
					playerId: match.umpire.id,
				});

				vi.advanceTimersByTime(TIME_STEP);
				actor.send({
					type: "match.confirm",
					matchId,
					playerId: match.player1.id,
				});

				vi.advanceTimersByTime(TIME_STEP);
				actor.send({
					type: "match.confirm",
					matchId,
					playerId: match.player2.id,
				});

				// Advance time between matches
				vi.advanceTimersByTime(TIME_STEP * 2);
			}

			const finalSnapshot = actor.getSnapshot();
			const players = Array.from(finalSnapshot.context.players.values());
			const queuePlayers = finalSnapshot.context.priorityQueue;

			// Verify both data structures are in sync
			const waitingPlayers = players.filter((p) => p.state === "waiting");
			const waitingQueuePlayers = queuePlayers.filter(
				(p) => p.state === "waiting",
			);

			expect(waitingPlayers.length).toBe(waitingQueuePlayers.length);
			for (const player of waitingPlayers) {
				const queuePlayer = waitingQueuePlayers.find((p) => p.id === player.id);
				expect(player.totalTimeWaiting).toBe(queuePlayer?.totalTimeWaiting);
			}

			vi.useRealTimers();
		});
	});
});
