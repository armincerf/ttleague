import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScoreboardMachine } from "./machine";
import { createActor, setup } from "xstate";
import { DELAYS } from "./machine";

describe("scoreboard machine", () => {
	const mockCallbacks = {
		onScoreChange: vi.fn(),
		onPlayerOneStartsChange: vi.fn(),
		onGameComplete: vi.fn(),
	};

	function createTestActor() {
		const machine = createScoreboardMachine(mockCallbacks);
		return createActor(machine);
	}

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should increment scores", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "INCREMENT_SCORE", player: 1 });
		expect(actor.getSnapshot().context.player1Score).toBe(1);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(1, 1);

		actor.send({ type: "INCREMENT_SCORE", player: 2 });
		expect(actor.getSnapshot().context.player2Score).toBe(1);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(2, 1);
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
			actor.send({ type: "INCREMENT_SCORE", player: 1 });
		}

		expect(actor.getSnapshot().matches("waitingForGameOverConfirmation")).toBe(
			true,
		);

		// Wait for the delay
		await new Promise((resolve) => setTimeout(resolve, DELAYS.GAME_OVER_DELAY));

		expect(actor.getSnapshot().matches("gameOverConfirmation")).toBe(true);

		actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
		expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(true);
		expect(actor.getSnapshot().context.player1GamesWon).toBe(1);
	});

	it("should handle corrections mode", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
		expect(actor.getSnapshot().context.correctionsMode).toBe(true);

		actor.send({ type: "SET_SCORE", player: 1, score: 5 });
		expect(actor.getSnapshot().context.player1Score).toBe(5);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(1, 5);
	});

	it("should allow incrementing from 0 in corrections mode", () => {
		const actor = createTestActor();
		actor.start();

		// Enable corrections mode
		actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

		// Try to increment score from 0 to 1
		actor.send({ type: "SET_SCORE", player: 1, score: 1 });
		expect(actor.getSnapshot().context.player1Score).toBe(1);
		expect(mockCallbacks.onScoreChange).toHaveBeenCalledWith(1, 1);
	});

	it("should handle arbitrary score changes in corrections mode", () => {
		const actor = createTestActor();
		actor.start();

		// Enable corrections mode
		actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

		// Set score to 5
		actor.send({ type: "SET_SCORE", player: 1, score: 5 });
		expect(actor.getSnapshot().context.player1Score).toBe(5);

		// Set score back to 3
		actor.send({ type: "SET_SCORE", player: 1, score: 3 });
		expect(actor.getSnapshot().context.player1Score).toBe(3);
	});

	describe("game over confirmation", () => {
		it("should increment games won and reset scores when confirmed", async () => {
			const actor = createTestActor();
			actor.start();

			// Score to 11-0
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
			}

			expect(
				actor.getSnapshot().matches("waitingForGameOverConfirmation"),
			).toBe(true);

			// Wait for the delay
			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);

			expect(actor.getSnapshot().matches("gameOverConfirmation")).toBe(true);

			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.player1GamesWon).toBe(1);
			expect(snapshot.context.player1Score).toBe(0);
			expect(snapshot.context.player2Score).toBe(0);
			expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(true);
		});

		it("should decrement winning score when not confirmed", async () => {
			const actor = createTestActor();
			actor.start();

			// First set player 2's score to 5
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 2 });
			}

			// Then set player 1's score to 11
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
			}

			expect(
				actor.getSnapshot().matches("waitingForGameOverConfirmation"),
			).toBe(true);

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);

			expect(actor.getSnapshot().matches("gameOverConfirmation")).toBe(true);

			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: false });

			const snapshot = actor.getSnapshot();
			expect(snapshot.matches("playing")).toBe(true);
			expect(snapshot.context.player1Score).toBe(10);
			expect(snapshot.context.player2Score).toBe(5);
			expect(snapshot.context.player1GamesWon).toBe(0);
			expect(mockCallbacks.onGameComplete).not.toHaveBeenCalled();
		});

		it("should handle game confirmation at deuce", async () => {
			const actor = createTestActor();
			actor.start();

			// Score to 12-10
			for (let i = 0; i < 10; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
				actor.send({ type: "INCREMENT_SCORE", player: 2 });
			}

			actor.send({ type: "INCREMENT_SCORE", player: 1 });
			actor.send({ type: "INCREMENT_SCORE", player: 1 });

			expect(
				actor.getSnapshot().matches("waitingForGameOverConfirmation"),
			).toBe(true);

			// Wait for the delay
			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);

			expect(actor.getSnapshot().matches("gameOverConfirmation")).toBe(true);

			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: false });

			const snapshot = actor.getSnapshot();
			expect(snapshot.matches("playing")).toBe(true);
			expect(snapshot.context.player1Score).toBe(11);
			expect(snapshot.context.player2Score).toBe(10);
		});
	});

	describe("player one starts", () => {
		it("should handle starting player changes", () => {
			const actor = createTestActor();
			actor.start();

			actor.send({ type: "SET_PLAYER_ONE_STARTS", starts: true });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(true);
			expect(mockCallbacks.onPlayerOneStartsChange).toHaveBeenCalledWith(true);

			actor.send({ type: "SET_PLAYER_ONE_STARTS", starts: false });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(false);
			expect(mockCallbacks.onPlayerOneStartsChange).toHaveBeenCalledWith(false);
		});

		it("should maintain playerOneStarts value during score changes", () => {
			const actor = createTestActor();
			actor.start();

			actor.send({ type: "SET_PLAYER_ONE_STARTS", starts: true });
			actor.send({ type: "INCREMENT_SCORE", player: 1 });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(true);

			actor.send({ type: "INCREMENT_SCORE", player: 2 });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(true);
		});

		it("should maintain playerOneStarts during corrections", () => {
			const actor = createTestActor();
			actor.start();

			actor.send({ type: "SET_PLAYER_ONE_STARTS", starts: true });
			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

			actor.send({ type: "SET_SCORE", player: 1, score: 5 });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(true);

			actor.send({ type: "SET_SCORE", player: 2, score: 3 });
			expect(actor.getSnapshot().context.playerOneStarts).toBe(true);
		});
	});

	describe("side swapping", () => {
		it("should swap sides after each game", async () => {
			const actor = createTestActor();
			actor.start();

			// Score game to 11-0
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
			}

			await new Promise((resolve) =>
				setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
			);
			actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);

			// Score another game
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
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
					actor.send({ type: "INCREMENT_SCORE", player: 1 });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// Win 2 games for player 2
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", player: 2 });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// In final game, score to 5
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
			}

			expect(actor.getSnapshot().context.sidesSwapped).toBe(true);
		});

		it("should not swap sides before the final game during a match", () => {
			const actor = createTestActor();
			actor.start();

			// Score 2 games for player 1
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", player: 1 });
				}
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}
			// Score 1 game for player 2
			for (let i = 0; i < 11; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 2 });
			}
			// Score 5 points in the 4th game for player 1
			for (let i = 0; i < 5; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
			}

			expect(actor.getSnapshot().context.sidesSwapped).toBe(false);
		});

		it("should reset sides when match is over", async () => {
			const actor = createTestActor();
			actor.start();

			// Win 3 games for player 1
			for (let game = 0; game < 3; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", player: 1 });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			expect(actor.getSnapshot().context.sidesSwapped).toBe(false);
		});
	});
});
