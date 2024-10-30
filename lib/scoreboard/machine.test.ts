import { createScoreboardMachine } from "./machine";
import { createActor } from "xstate";
import { DEFAULT_GAME_STATE, DELAYS } from "./constants";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
		expect(actor.getSnapshot().matches("corrections")).toBe(true);

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

	describe("corrections mode", () => {
		it("should transition between playing and corrections states", () => {
			const actor = createTestActor();
			actor.start();

			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
			expect(actor.getSnapshot().matches("corrections")).toBe(true);

			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
			expect(actor.getSnapshot().matches("playing")).toBe(true);
		});

		it("should allow score adjustments in corrections mode", () => {
			const actor = createTestActor();
			actor.start();

			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
			actor.send({ type: "SET_SCORE", playerId: "player1", score: 5 });

			expect(actor.getSnapshot().matches("corrections")).toBe(true);
			expect(actor.getSnapshot().context.playerOne.currentScore).toBe(5);
		});

		describe("RESET_GAME", () => {
			it("should reset scores to 0", () => {
				const actor = createTestActor();
				actor.start();

				// Set some initial scores
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 5 });
				actor.send({ type: "SET_SCORE", playerId: "player2", score: 3 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

				actor.send({ type: "RESET_GAME" });

				const snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.currentScore).toBe(0);
				expect(snapshot.context.playerTwo.currentScore).toBe(0);
			});

			it("should swap sides in final game when score is past midpoint", async () => {
				const actor = createTestActor();
				actor.start();

				// Set to best of 3
				actor.send({ type: "SET_BEST_OF", bestOf: 3 });
				console.log("After bestOf:", actor.getSnapshot().context);

				// Win first game for player 1
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 11 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

				// Win second game for player 2
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "SET_SCORE", playerId: "player2", score: 11 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

				// In final game, set score past midpoint
				const finalGameInitialSide = actor.getSnapshot().context.sidesSwapped;
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 5 });

				expect(actor.getSnapshot().context.sidesSwapped).toBe(
					!finalGameInitialSide,
				);

				// shouldn't swap sides after midpoint is passed
				actor.send({ type: "SET_SCORE", playerId: "player2", score: 2 });
				expect(actor.getSnapshot().context.sidesSwapped).toBe(
					!finalGameInitialSide,
				);

				actor.send({ type: "SET_SCORE", playerId: "player1", score: 6 });
				expect(actor.getSnapshot().context.sidesSwapped).toBe(
					!finalGameInitialSide,
				);

				// should swap back if score is reset
				actor.send({ type: "RESET_GAME" });
				expect(actor.getSnapshot().context.sidesSwapped).toBe(
					finalGameInitialSide,
				);
			});

			it("should not swap sides in final game when score is below midpoint", () => {
				const actor = createTestActor();
				actor.start();

				// Set to best of 3
				actor.send({ type: "SET_BEST_OF", bestOf: 3 });

				// Win first game for player 1
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 11 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

				// Win second game for player 2
				actor.send({ type: "SET_SCORE", playerId: "player2", score: 11 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

				// In final game, set score below midpoint
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 4 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

				// Reset game should not trigger side swap
				actor.send({ type: "RESET_GAME" });

				expect(actor.getSnapshot().context.sidesSwapped).toBe(false);
			});

			it("should not swap sides in non-final games", () => {
				const actor = createTestActor();
				actor.start();

				// Set to best of 5
				actor.send({ type: "SET_BEST_OF", bestOf: 5 });

				const sidesSwapped = actor.getSnapshot().context.sidesSwapped;

				// Set score past midpoint in first game
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 7 });
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });

				// Reset game should not trigger side swap
				actor.send({ type: "RESET_GAME" });

				expect(actor.getSnapshot().context.sidesSwapped).toBe(sidesSwapped);
			});
		});
	});

	describe("match point", () => {
		it("should set match point when a player is one point away from winning the match", async () => {
			const actor = createTestActor();
			actor.start();

			// Win first two games for player 1
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// In the third game, score to 10 points
			for (let i = 0; i < 10; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(true);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);
		});

		it("should clear match point when score is decremented", async () => {
			const actor = createTestActor();
			actor.start();

			// Win first two games for player 1
			for (let game = 0; game < 2; game++) {
				for (let i = 0; i < 11; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				await new Promise((resolve) =>
					setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
				);
				actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
			}

			// Score to 10 points
			for (let i = 0; i < 10; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			}

			// Set score back to 9
			actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
			actor.send({ type: "SET_SCORE", playerId: "player1", score: 9 });

			const snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(false);
		});

		it("should handle match point in deuce situations", () => {
			const actor = createTestActor();
			actor.start();

			// Score to 10-10
			for (let i = 0; i < 10; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			}

			// Neither player should have match point at 10-10
			let snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(false);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);

			// Player 1 scores to 11-10
			actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(true);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);

			// Back to 11-11
			actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(false);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);
		});

		describe("with points to win set to 21", () => {
			it("should set match point at 20 points in regular game", () => {
				const actor = createTestActor();
				actor.start();
				const defaultSettings = actor.getSnapshot().context;

				// Set points to win to 21
				actor.send({
					type: "SETTINGS_UPDATE",
					settings: {
						...defaultSettings,
						pointsToWin: 21,
					},
				});

				// Score to 20-15
				for (let i = 0; i < 20; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				for (let i = 0; i < 15; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
				}

				const snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(true);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);
			});

			it("should handle deuce situations in 21-point games", () => {
				const actor = createTestActor();
				actor.start();

				const defaultSettings = actor.getSnapshot().context;
				// Set points to win to 21
				actor.send({
					type: "SETTINGS_UPDATE",
					settings: {
						...defaultSettings,
						pointsToWin: 21,
					},
				});

				// Score to 20-20
				for (let i = 0; i < 20; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
					actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
				}

				// Neither player should have match point at 20-20
				let snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(false);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);

				// Player 1 scores to 21-20
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(true);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);

				// Player 2 scores to 21-21
				actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
				snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(false);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);

				// Player 1 scores to 22-21
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(true);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);
			});

			it("should handle match point in final game of best of 5", async () => {
				const actor = createTestActor();
				actor.start();

				const defaultSettings = actor.getSnapshot().context;
				// Set points to win to 21 and best of 5
				actor.send({
					type: "SETTINGS_UPDATE",
					settings: {
						...defaultSettings,
						pointsToWin: 21,
						bestOf: 5,
					},
				});

				// Win two games for each player
				for (let game = 0; game < 2; game++) {
					// Player 1 wins
					for (let i = 0; i < 21; i++) {
						actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
					}
					await new Promise((resolve) =>
						setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
					);
					actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });

					// Player 2 wins
					for (let i = 0; i < 21; i++) {
						actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
					}
					await new Promise((resolve) =>
						setTimeout(resolve, DELAYS.GAME_OVER_DELAY),
					);
					actor.send({ type: "CONFIRM_GAME_OVER", confirmed: true });
				}

				// In final game, score to 20-15
				for (let i = 0; i < 20; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				}
				for (let i = 0; i < 15; i++) {
					actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
				}

				const snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(true);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);
				// after reset, match point should be cleared
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "RESET_GAME" });
				const snapshot2 = actor.getSnapshot();
				expect(snapshot2.context.playerOne.matchPoint).toBe(false);
				expect(snapshot2.context.playerTwo.matchPoint).toBe(false);
			});

			it("should handle match point when correcting scores", () => {
				const actor = createTestActor();
				actor.start();

				const defaultSettings = actor.getSnapshot().context;
				// Set points to win to 21
				actor.send({
					type: "SETTINGS_UPDATE",
					settings: {
						...defaultSettings,
						pointsToWin: 21,
					},
				});

				// Enter corrections mode and set scores
				actor.send({ type: "TOGGLE_CORRECTIONS_MODE" });
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 20 });
				actor.send({ type: "SET_SCORE", playerId: "player2", score: 15 });

				let snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(true);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);

				// Correct score to remove match point
				actor.send({ type: "SET_SCORE", playerId: "player1", score: 19 });
				snapshot = actor.getSnapshot();
				expect(snapshot.context.playerOne.matchPoint).toBe(false);
				expect(snapshot.context.playerTwo.matchPoint).toBe(false);
			});
		});

		it("should handle match point correctly in 10-10 situations", () => {
			const actor = createTestActor();
			actor.start();

			// Score to 9-9
			for (let i = 0; i < 9; i++) {
				actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
				actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			}

			// Player 1 scores to make it 10-9
			actor.send({ type: "INCREMENT_SCORE", playerId: "player1" });
			let snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(true);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);

			// Player 2 scores to make it 10-10
			actor.send({ type: "INCREMENT_SCORE", playerId: "player2" });
			snapshot = actor.getSnapshot();
			expect(snapshot.context.playerOne.matchPoint).toBe(false);
			expect(snapshot.context.playerTwo.matchPoint).toBe(false);
		});
	});
});
