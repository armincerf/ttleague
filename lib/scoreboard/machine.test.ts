import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScoreboardMachine, DEFAULT_GAME_STATE, DELAYS } from "./machine";
import { createActor } from "xstate";

describe("scoreboard machine", () => {
	const mockCallbacks = {
		onScoreChange: vi.fn(),
		onPlayerOneStartsChange: vi.fn(),
		onGameComplete: vi.fn(),
	};

	function createTestActor() {
		const machine = createScoreboardMachine(mockCallbacks);
		return createActor(machine, {
			input: {
				initialContext: DEFAULT_GAME_STATE,
			},
		});
	}

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should increment scores", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
		expect(actor.getSnapshot().context.playerOne.currentScore).toBe(1);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith("player1", 1);

		actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
		expect(actor.getSnapshot().context.playerTwo.currentScore).toBe(1);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith("player2", 1);
	});

	it("should handle starting player changes", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "SET_PLAYER_ONE_STARTS", starts: true });
		expect(actor.getSnapshot().context.playerOneStarts).toBe(true);
		expect(mockCallbacks.onPlayerOneStartsChange).toHaveBeenCalledWith(true);
	});

	it("should trigger game complete when a player wins", async () => {
		const actor = createTestActor();
		actor.start();

		// Score to 11-0
		for (let i = 0; i < 11; i++) {
			actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			// Verify score increments correctly during the loop
			expect(actor.getSnapshot().context.playerOne.currentScore).toBe(i + 1);
		}

		const stateAfterScoring = actor.getSnapshot();
		expect(
			stateAfterScoring.matches("waitingForGameOverConfirmation"),
			`Expected state to be 'waitingForGameOverConfirmation' but was '${stateAfterScoring.value}'`,
		).toBe(true);

		// Wait for the delay
		await new Promise((resolve) => setTimeout(resolve, DELAYS.GAME_OVER_DELAY));

		const stateAfterDelay = actor.getSnapshot();
		expect(
			stateAfterDelay.matches("gameOverConfirmation"),
			`Expected state to be 'gameOverConfirmation' but was '${stateAfterDelay.value}'`,
		).toBe(true);

		actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

		const finalState = actor.getSnapshot();
		expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(true);
		expect(
			finalState.context.playerOne.gamesWon,
			`Expected player one to have won 1 game but they won ${finalState.context.playerOne.gamesWon}`,
		).toBe(1);
		expect(
			finalState.context.playerTwo.gamesWon,
			`Expected player two to have won 0 games but they won ${finalState.context.playerTwo.gamesWon}`,
		).toBe(0);
	});

	it("should handle corrections mode", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
		expect(actor.getSnapshot().context.correctionsMode).toBe(true);

		actor.send({ type: "SET_SCORE", playerId: "player1", score: 5 });
		expect(actor.getSnapshot().context.playerOne.currentScore).toBe(5);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith("player1", 5);
	});

	describe("game over confirmation", () => {
		it("should increment games won and reset scores when confirmed", async () => {
			const actor = createTestActor();
			actor.start();

			// Score to 11-0
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.gamesWon).toBe(1);
			expect(snapshot.context.playerOne.currentScore).toBe(0);
			expect(snapshot.context.playerTwo.currentScore).toBe(0);
			expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(true);
		});

		it("should decrement winning score when not confirmed", async () => {
			const actor = createTestActor();
			actor.start();

			// First set player 2's score to 5
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			}

			// Then set player 1's score to 11
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: false });

			const snapshot = actor.getSnapshot();
			expect(snapshot.matches("playing")).toBe(true);
			expect(snapshot.context.playerOne.currentScore).toBe(10);
			expect(snapshot.context.playerTwo.currentScore).toBe(5);
			expect(snapshot.context.playerOne.gamesWon).toBe(0);
			expect(mockCallbacks.onGameComplete).not.toHaveBeenCalled();
		});
	});

	describe("side swapping", () => {
		it("should swap sides after each game", async () => {
			const actor = createTestActor();
			actor.start();

			// Score game to 11-0
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);

			// Score another game
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			expect(actor.getSnapshot().context.sidesSwapped).toBe(false);
		});

		it("should swap sides at 5 points in the final game", async () => {
			const actor = createTestActor();
			actor.start();

			// Win 2 games for player 1
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// Win 2 games for player 2
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// In final game, score to 5
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);
		});

		it("should reset sides when match is over", async () => {
			const actor = createTestActor();
			actor.start();

			// Win 3 games for player 1
			for (let game = 0; game < 3; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			expect(actor.getSnapshot().context.sidesSwapped).toBe(false);
		});

		it("should correctly handle side swaps in a best of 3 match", async () => {
			const actor = createTestActor();
			actor.start();

			// Set to best of 3
			actor.send({ type: "SET_BEST_OF", bestOf: 3 });

			// First game - player 1 wins
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}
			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			// Verify sides are swapped after first game
			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);

			// Second game - player 2 wins
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			}
			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			// Verify sides are back to normal after second game
			expect(actor.getSnapshot().context.sidesSwapped).toBe(false);

			// Third game - score to 5 points
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			// Verify mid-game swap at 5 points in final game
			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);
		});
	});
});
