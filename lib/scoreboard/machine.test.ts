import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScoreboardMachine } from "./machine";
import { createActor, setup } from "xstate";
import { DELAYS } from "./machine";

describe("scoreboard machine", () => {
	const mockCallbacks = {
		onScoreChange: vi.fn(),
		onServerChange: vi.fn(),
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

	it("should handle server changes", () => {
		const actor = createTestActor();
		actor.start();

		actor.send({ type: "SET_SERVER", player: 1 });
		expect(actor.getSnapshot().context.currentServer).toBe(1);
		expect(mockCallbacks.onServerChange).toHaveBeenCalledWith(1);
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
		expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(1);
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
			expect(mockCallbacks.onGameComplete).toHaveBeenCalledWith(1);
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

	describe("server changes", () => {
		it("should change server every two points", () => {
			const actor = createTestActor();
			actor.start();

			// Set initial server explicitly
			actor.send({ type: "SET_SERVER", player: 0 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// First point - server shouldn't change
			actor.send({ type: "INCREMENT_SCORE", player: 1 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Second point - server should change to 1
			actor.send({ type: "INCREMENT_SCORE", player: 2 });
			expect(actor.getSnapshot().context.currentServer).toBe(1);
		});

		it("should maintain correct server after score corrections", () => {
			const actor = createTestActor();
			actor.start();

			// Enable corrections mode
			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

			actor.send({ type: "SET_SCORE", player: 1, score: 3 });
			actor.send({ type: "SET_SCORE", player: 2, score: 2 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Correct score to 2-2 (should be server 0)
			actor.send({ type: "SET_SCORE", player: 1, score: 2 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Correct score to 3-2 (should be server 0 still)
			actor.send({ type: "SET_SCORE", player: 1, score: 3 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Correct score to 3-3 (should be server 1)
			actor.send({ type: "SET_SCORE", player: 2, score: 3 });
			expect(actor.getSnapshot().context.currentServer).toBe(1);
		});

		it("should change server every point after deuce", () => {
			const actor = createTestActor();
			actor.start();

			// Score to 10-10
			for (let i = 0; i < 10; i++) {
				actor.send({ type: "INCREMENT_SCORE", player: 1 });
				actor.send({ type: "INCREMENT_SCORE", player: 2 });
			}

			// At 10-10, server should be 0 (based on total points = 20)
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Point 21: server should change to 1
			actor.send({ type: "INCREMENT_SCORE", player: 1 });
			expect(actor.getSnapshot().context.currentServer).toBe(1);

			// Point 22: server should change to 0
			actor.send({ type: "INCREMENT_SCORE", player: 2 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);
		});

		it("should maintain correct server when correcting scores around deuce", () => {
			const actor = createTestActor();
			actor.start();
			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

			// Set score to 10-10
			actor.send({ type: "SET_SCORE", player: 1, score: 10 });
			actor.send({ type: "SET_SCORE", player: 2, score: 10 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);

			// Correct to 11-10 (should change server)
			actor.send({ type: "SET_SCORE", player: 1, score: 11 });
			expect(actor.getSnapshot().context.currentServer).toBe(1);

			// Correct back to 10-10
			actor.send({ type: "SET_SCORE", player: 1, score: 10 });
			expect(actor.getSnapshot().context.currentServer).toBe(0);
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
