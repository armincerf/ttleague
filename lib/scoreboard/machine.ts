import { setup, assign } from "xstate";
import { getWinner, shouldAlternateEveryPoint } from "./utils";

export interface Player {
	id: string;
	firstName: string;
	lastName: string;
}

export interface ScoreboardContext {
	player1Score: number;
	player2Score: number;
	player1GamesWon: number;
	player2GamesWon: number;
	currentServer: 0 | 1;
	correctionsMode: boolean;
	pointsToWin: number;
	bestOf: number;
	sidesSwapped: boolean;
	player1: Player;
	player2: Player;
}

export interface ScoreboardCallbacks {
	onScoreChange?: (player: 1 | 2, newScore: number) => void;
	onServerChange?: (newServer: 0 | 1) => void;
	onGameComplete?: (winner: 1 | 2) => void;
}

// Define shared delays at the top level
export const DELAYS = {
	GAME_OVER_DELAY: 100, // Using a shorter delay for tests
} as const;

export const createScoreboardMachine = (
	callbacks: Partial<ScoreboardCallbacks> & {
		initialContext?: Partial<ScoreboardContext>;
	} = {},
) => {
	return setup({
		types: {
			context: {} as ScoreboardContext,
			events: {} as
				| { type: "INCREMENT_SCORE"; player: 1 | 2 }
				| { type: "SET_SCORE"; player: 1 | 2; score: number }
				| { type: "SET_SERVER"; player: 0 | 1 }
				| { type: "TOGGLE_CORRECTIONS_MODE" }
				| { type: "EXTERNAL_UPDATE"; state: Partial<ScoreboardContext> }
				| { type: "CONFIRM_GAME_OVER"; confirmed: boolean }
				| { type: "CONFIRM_MATCH_OVER"; confirmed: boolean }
				| { type: "RESET_MATCH" }
				| { type: "SET_PLAYERS"; player1: Player; player2: Player },
		},
		actions: {
			notifyScoreChange: ({ context, event }) => {
				if (event.type === "INCREMENT_SCORE") {
					const score =
						context[event.player === 1 ? "player1Score" : "player2Score"];
					callbacks.onScoreChange?.(event.player, score);
				} else if (event.type === "SET_SCORE") {
					callbacks.onScoreChange?.(event.player, event.score);
				}
			},
			notifyServerChange: ({ context, event }) => {
				if (event.type === "SET_SERVER") {
					callbacks.onServerChange?.(event.player);
				}
			},
			notifyGameComplete: ({ context }) => {
				const winner = getWinner(context);
				if (winner) {
					callbacks.onGameComplete?.(winner);
				}
			},
			updateServer: assign(({ context, event }) => {
				if (event.type === "SET_SERVER") {
					return { currentServer: event.player };
				}

				const totalPoints = context.player1Score + context.player2Score;
				const isDeuce = shouldAlternateEveryPoint(
					context.player1Score,
					context.player2Score,
					context.pointsToWin,
				);

				// At deuce, server changes every point
				if (isDeuce) {
					return { currentServer: (totalPoints % 2) as 0 | 1 };
				}

				// Before deuce, server changes every 2 points
				return { currentServer: (Math.floor(totalPoints / 2) % 2) as 0 | 1 };
			}),
			checkMidGameSwap: assign(({ context }) => {
				const totalGamesWon = context.player1GamesWon + context.player2GamesWon;
				const isLastGame = totalGamesWon === context.bestOf - 1; // Changed from bestOf - 2
				const reachedMidPoint =
					Math.max(context.player1Score, context.player2Score) === 5;
				const otherPlayerScore = Math.min(
					context.player1Score,
					context.player2Score,
				);

				// Only swap if:
				// 1. It's the last game
				// 2. One player has reached 5 points
				// 3. We haven't swapped yet
				// 4. The other player hasn't reached 5 points (to avoid multiple swaps)
				if (
					isLastGame &&
					reachedMidPoint &&
					!context.sidesSwapped &&
					otherPlayerScore < 5
				) {
					return { sidesSwapped: true };
				}
				return {};
			}),
		},
		delays: DELAYS,
	}).createMachine({
		id: "scoreboard",
		context: {
			player1Score: 0,
			player2Score: 0,
			player1GamesWon: 0,
			player2GamesWon: 0,
			currentServer: 0,
			correctionsMode: false,
			pointsToWin: 11,
			bestOf: 5,
			sidesSwapped: false,
			player1: {
				id: "",
				firstName: "",
				lastName: "",
			},
			player2: {
				id: "",
				firstName: "",
				lastName: "",
			},
			...callbacks.initialContext,
		},
		initial: "playing",
		states: {
			waitingForPlayers: {
				on: {
					SET_PLAYERS: {
						target: "playing",
						actions: assign(({ event }) => ({
							player1: event.player1,
							player2: event.player2,
						})),
					},
				},
			},
			playing: {
				on: {
					INCREMENT_SCORE: {
						actions: [
							assign(({ context, event }) => {
								const player = `player${event.player}Score` as const;
								return { [player]: context[player] + 1 };
							}),
							"updateServer",
							"notifyScoreChange",
							"checkMidGameSwap",
						],
					},
					SET_SCORE: {
						actions: [
							assign(({ context, event }) => {
								const player =
									event.player === 1 ? "player1Score" : "player2Score";
								return { [player]: event.score };
							}),
							"updateServer",
							"notifyScoreChange",
							"checkMidGameSwap",
						],
					},
					SET_SERVER: {
						actions: [
							assign(({ event }) => ({
								currentServer: event.player,
							})),
							"notifyServerChange",
						],
					},
					TOGGLE_CORRECTIONS_MODE: {
						actions: assign(({ context }) => ({
							correctionsMode: !context.correctionsMode,
						})),
					},
					EXTERNAL_UPDATE: {
						actions: assign(({ event }) => ({
							...event.state,
						})),
					},
				},
				always: [
					{
						guard: ({ context }) => {
							const { player1Score, player2Score, pointsToWin } = context;
							const twoPointLead = Math.abs(player1Score - player2Score) >= 2;
							const reachedMinPoints =
								Math.max(player1Score, player2Score) >= pointsToWin;
							return reachedMinPoints && twoPointLead;
						},
						target: "waitingForGameOverConfirmation",
					},
				],
			},
			waitingForGameOverConfirmation: {
				after: {
					GAME_OVER_DELAY: {
						target: "gameOverConfirmation",
					},
				},
				on: {
					// Allow score changes while waiting for confirmation
					SET_SCORE: {
						target: "playing",
						actions: [
							assign(({ context, event }) => {
								const player =
									event.player === 1 ? "player1Score" : "player2Score";
								return { [player]: event.score };
							}),
							"updateServer",
							"notifyScoreChange",
						],
					},
				},
			},
			gameOverConfirmation: {
				on: {
					CONFIRM_GAME_OVER: [
						{
							guard: ({ event }) => event.confirmed,
							target: "checkMatchOver",
							actions: [
								"notifyGameComplete",
								assign(({ context }) => {
									const winner =
										context.player1Score > context.player2Score ? 1 : 2;
									return {
										[`player${winner}GamesWon`]:
											context[`player${winner}GamesWon`] + 1,
										player1Score: 0,
										player2Score: 0,
										sidesSwapped: !context.sidesSwapped,
									};
								}),
							],
						},
						{
							// When not confirmed, return to playing state with adjusted score
							target: "playing",
							actions: assign(({ context }) => {
								const player1Score = context.player1Score;
								const player2Score = context.player2Score;

								// If player 1 has winning score, decrement it by 1
								if (player1Score > player2Score) {
									return { player1Score: player1Score - 1 };
								}
								// If player 2 has winning score, decrement it by 1
								if (player2Score > player1Score) {
									return { player2Score: player2Score - 1 };
								}
								return {};
							}),
						},
					],
					SET_SCORE: {
						target: "playing",
						actions: [
							assign(({ context, event }) => {
								const player =
									event.player === 1 ? "player1Score" : "player2Score";
								return { [player]: event.score };
							}),
							"updateServer",
							"notifyScoreChange",
						],
					},
				},
			},
			checkMatchOver: {
				always: [
					{
						guard: ({ context }) => {
							const gamesNeeded = Math.ceil(context.bestOf / 2);
							return (
								context.player1GamesWon >= gamesNeeded ||
								context.player2GamesWon >= gamesNeeded
							);
						},
						target: "matchOver",
						actions: assign({ sidesSwapped: false }),
					},
					{
						target: "playing",
						// Remove the side swapping logic here since we're handling it in gameOverConfirmation
						actions: [],
					},
				],
			},
			matchOver: {
				on: {
					RESET_MATCH: {
						target: "playing",
						actions: assign({
							player1Score: 0,
							player2Score: 0,
							player1GamesWon: 0,
							player2GamesWon: 0,
							currentServer: 0,
							correctionsMode: false,
							sidesSwapped: false,
						}),
					},
				},
			},
		},
	});
};
