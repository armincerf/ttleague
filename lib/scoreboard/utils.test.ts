import { describe, expect, it } from "vitest";
import { calculateCurrentServer } from "./utils";
import type { ScoreboardContext } from "./machine";

describe("calculateCurrentServer", () => {
	const createContext = (
		overrides: Partial<ScoreboardContext> = {},
	): ScoreboardContext => ({
		bestOf: 5,
		playerOne: {
			id: "player1",
			firstName: "Player",
			lastName: "1",
			currentScore: 0,
			gamesWon: 0,
		},
		playerTwo: {
			id: "player2",
			firstName: "Player",
			lastName: "2",
			currentScore: 0,
			gamesWon: 0,
		},
		pointsToWin: 11,
		playerOneStarts: true,
		correctionsMode: false,
		sidesSwapped: false,
		...overrides,
	});

	function assertServer(
		context: ScoreboardContext,
		expectedServer: string,
		message?: string,
	) {
		const actualServer = calculateCurrentServer(context);
		expect(actualServer).toBe(expectedServer);
	}

	describe("11 point games", () => {
		describe("when player 1 starts", () => {
			const baseContext = createContext({
				pointsToWin: 11,
				playerOneStarts: true,
			});

			it("should have player 1 serve first two points", () => {
				assertServer(
					{
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 0,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 0,
						},
					},
					"Player 1",
					"First serve",
				);
				assertServer(
					{
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 1,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 0,
						},
					},
					"Player 1",
					"Second serve",
				);
			});

			it("should have player 2 serve next two points", () => {
				assertServer(
					{
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 1,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 1,
						},
					},
					"Player 2",
					"Third serve",
				);
				assertServer(
					{
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 2,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 1,
						},
					},
					"Player 2",
					"Fourth serve",
				);
			});

			it("should alternate every 2 serves until deuce", () => {
				const scenarios = [
					{ p1: 4, p2: 0, server: "Player 1", desc: "Start of P1 serve block" },
					{ p1: 4, p2: 1, server: "Player 1", desc: "End of P1 serve block" },
					{ p1: 4, p2: 2, server: "Player 2", desc: "Start of P2 serve block" },
					{ p1: 4, p2: 3, server: "Player 2", desc: "End of P2 serve block" },
				] as const;

				for (const { p1, p2, server, desc } of scenarios) {
					assertServer(
						{
							...baseContext,
							playerOne: {
								...baseContext.playerOne,
								currentScore: p1,
							},
							playerTwo: {
								...baseContext.playerTwo,
								currentScore: p2,
							},
						},
						server,
						`${desc} at ${p1}-${p2}`,
					);
				}
			});

			describe("at deuce (10-10)", () => {
				const deuceScenarios = [
					{ p1: 10, p2: 10, server: "Player 1", desc: "Initial deuce" },
					{
						p1: 11,
						p2: 10,
						server: "Player 2",
						desc: "After first deuce point",
					},
					{ p1: 11, p2: 11, server: "Player 1", desc: "Second deuce" },
					{
						p1: 12,
						p2: 11,
						server: "Player 2",
						desc: "After second deuce point",
					},
				] as const;

				it("should alternate every point", () => {
					for (const { p1, p2, server, desc } of deuceScenarios) {
						assertServer(
							{
								...baseContext,
								playerOne: {
									...baseContext.playerOne,
									currentScore: p1,
								},
								playerTwo: {
									...baseContext.playerTwo,
									currentScore: p2,
								},
							},
							server,
							`${desc} at ${p1}-${p2}`,
						);
					}
				});
			});
		});

		describe("when player 2 starts", () => {
			const baseContext = createContext({
				pointsToWin: 11,
				playerOneStarts: false,
			});

			it("should have player 2 serve first two points", () => {
				expect(
					calculateCurrentServer({
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 0,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 0,
						},
					}),
				).toBe("Player 2");
				expect(
					calculateCurrentServer({
						...baseContext,
						playerOne: {
							...baseContext.playerOne,
							currentScore: 0,
						},
						playerTwo: {
							...baseContext.playerTwo,
							currentScore: 1,
						},
					}),
				).toBe("Player 2");
			});
		});
	});

	describe("15 point games", () => {
		describe("when player 1 starts", () => {
			const baseContext = createContext({
				pointsToWin: 15,
				playerOneStarts: true,
			});

			it("should have player 1 serve first five points", () => {
				const scenarios = [
					{ p1: 0, p2: 0, desc: "First serve" },
					{ p1: 1, p2: 0, desc: "Second serve" },
					{ p1: 2, p2: 0, desc: "Third serve" },
					{ p1: 2, p2: 1, desc: "Fourth serve" },
					{ p1: 3, p2: 1, desc: "Fifth serve" },
				] as const;

				for (const { p1, p2, desc } of scenarios) {
					assertServer(
						{
							...baseContext,
							playerOne: {
								...baseContext.playerOne,
								currentScore: p1,
							},
							playerTwo: {
								...baseContext.playerTwo,
								currentScore: p2,
							},
						},
						"Player 1",
						`${desc} at ${p1}-${p2}`,
					);
				}
			});

			it("should switch to player 2 for next five points", () => {
				const nextFivePoints = [
					[3, 2],
					[4, 2],
					[4, 3],
					[4, 4],
					[5, 4],
				] as const;

				for (const [p1Score, p2Score] of nextFivePoints) {
					expect(
						calculateCurrentServer({
							...baseContext,
							playerOne: {
								...baseContext.playerOne,
								currentScore: p1Score,
							},
							playerTwo: {
								...baseContext.playerTwo,
								currentScore: p2Score,
							},
						}),
					).toBe("Player 2");
				}
			});

			describe("at deuce (14-14)", () => {
				it("should alternate every point", () => {
					const deuceScenarios = [
						{ p1: 14, p2: 14, server: "Player 1", desc: "Initial deuce" },
						{
							p1: 15,
							p2: 14,
							server: "Player 2",
							desc: "After first deuce point",
						},
						{ p1: 15, p2: 15, server: "Player 1", desc: "Second deuce" },
					] as const;

					for (const { p1, p2, server, desc } of deuceScenarios) {
						assertServer(
							{
								...baseContext,
								playerOne: {
									...baseContext.playerOne,
									currentScore: p1,
								},
								playerTwo: {
									...baseContext.playerTwo,
									currentScore: p2,
								},
							},
							server,
							`${desc} at ${p1}-${p2}`,
						);
					}
				});
			});
		});
	});

	describe("21 point games", () => {
		describe("when player 1 starts", () => {
			const baseContext = createContext({
				pointsToWin: 21,
				playerOneStarts: true,
			});

			it("should maintain 5-point serving blocks until deuce", () => {
				const servingSequence = [
					// First block - Player 1 serves (points 0-4)
					{ score: [0, 0], server: "Player 1", desc: "Start of first block" },
					{ score: [2, 1], server: "Player 1", desc: "Middle of first block" },
					{ score: [3, 1], server: "Player 1", desc: "Still in first block" },

					// Second block - Player 2 serves (points 5-9)
					{ score: [3, 2], server: "Player 2", desc: "Start of second block" },
					{ score: [3, 4], server: "Player 2", desc: "Middle of second block" },
					{ score: [4, 5], server: "Player 2", desc: "End of second block" },

					// Third block - Back to Player 1 (points 10-14)
					{ score: [6, 5], server: "Player 1", desc: "Start of third block" },
					{ score: [8, 5], server: "Player 1", desc: "Middle of third block" },
					{ score: [8, 6], server: "Player 1", desc: "End of third block" },

					// Fourth block - Player 2 serves (points 15-19)
					{ score: [8, 7], server: "Player 2", desc: "Start of fourth block" },
					{ score: [9, 8], server: "Player 2", desc: "Middle of fourth block" },
					{ score: [10, 9], server: "Player 2", desc: "End of fourth block" },
				] as const;

				for (const {
					score: [p1Score, p2Score],
					server,
					desc,
				} of servingSequence) {
					expect(
						calculateCurrentServer({
							...baseContext,
							playerOne: {
								...baseContext.playerOne,
								currentScore: p1Score,
							},
							playerTwo: {
								...baseContext.playerTwo,
								currentScore: p2Score,
							},
						}),
						`At ${p1Score}-${p2Score} (${desc}): Expected ${server} to be serving`,
					).toBe(server);
				}
			});
		});
	});
});
