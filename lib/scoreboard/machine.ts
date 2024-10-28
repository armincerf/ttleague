import { setup, assign } from "xstate";
import { getWinner, shouldAlternateEveryPoint } from "./utils";
import { DEFAULT_GAME_STATE } from "./constants";

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
	playerOneStarts: boolean;
	correctionsMode: boolean;
	pointsToWin: number;
	bestOf: number;
	sidesSwapped: boolean;
	player1: Player;
	player2: Player;
}

export interface ScoreboardCallbacks {
	onScoreChange?: (player: 1 | 2, newScore: number) => void;
	onPlayerOneStartsChange?: (playerOneStarts: boolean) => void;
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
				| { type: "SET_PLAYER_ONE_STARTS"; starts: boolean }
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
			notifyPlayerOneStartsChange: ({ context, event }) => {
				if (event.type === "SET_PLAYER_ONE_STARTS") {
					callbacks.onPlayerOneStartsChange?.(event.starts);
				}
			},
			notifyGameComplete: ({ context }) => {
				const winner = getWinner(context);
				if (winner) {
					callbacks.onGameComplete?.(winner);
				}
			},
			updateCurrentServer: assign(({ context, event }) => {
				const totalPoints = context.player1Score + context.player2Score;
				const isDeuce = shouldAlternateEveryPoint(
					context.player1Score,
					context.player2Score,
					context.pointsToWin,
				);

				if (event.type === "SET_PLAYER_ONE_STARTS") {
					return { playerOneStarts: event.starts };
				}

				if (isDeuce) {
					// Alternate server every point at deuce
					return { playerOneStarts: totalPoints % 2 === 0 };
				}

				// Alternate server every two points
				const pairIndex = Math.floor(totalPoints / 2);
				return { playerOneStarts: pairIndex % 2 === 0 };
			}),
			checkMidGameSwap: assign(({ context }) => {
				const totalGamesWon = context.player1GamesWon + context.player2GamesWon;
				const isLastGame = totalGamesWon === context.bestOf - 1;
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
			...DEFAULT_GAME_STATE,
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
							"updateCurrentServer",
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
							"updateCurrentServer",
							"notifyScoreChange",
							"checkMidGameSwap",
						],
					},
					SET_PLAYER_ONE_STARTS: {
						actions: [
							assign(({ event }) => ({
								playerOneStarts: event.starts,
							})),
							"updateCurrentServer",
							"notifyPlayerOneStartsChange",
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
							"updateCurrentServer",
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
										currentServer: context.playerOneStarts ? 1 : 2,
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
							"updateCurrentServer",
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
						actions: [],
					},
				],
			},
			matchOver: {
				on: {
					RESET_MATCH: {
						target: "playing",
						actions: assign(DEFAULT_GAME_STATE),
					},
				},
			},
		},
	});
};
