import { setup, assign } from "xstate";
import { getWinner } from "./utils";
import { z } from "zod";
import { DELAYS, DEFAULT_GAME_STATE } from "./constants";

// Define the schema first
export const PlayerSchema = z.object({
	id: z.string(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	gamesWon: z.number(),
	currentScore: z.number(),
	matchPoint: z.boolean().default(false),
});

export const ScoreboardContextSchema = z.object({
	playerOne: PlayerSchema,
	playerTwo: PlayerSchema,
	pointsToWin: z.number(),
	bestOf: z.number(),
	playerOneStarts: z.boolean(),
	sidesSwapped: z.boolean(),
	disableAnimations: z.boolean().default(false),
});

// Derive types from the schema
export type Player = z.infer<typeof PlayerSchema>;
export type ScoreboardContext = z.infer<typeof ScoreboardContextSchema>;

// Schema for the persisted state snapshot
export const ScoreboardStateSchema = z.object({
	context: ScoreboardContextSchema,
	value: z.string().or(z.record(z.string(), z.any())),
});

export interface ScoreboardCallbacks {
	onScoreChange?: (playerId: string, newScore: number) => void;
	onPlayerOneStartsChange?: (playerOneStarts: boolean) => void;
	onGameComplete?: (winnerIsPlayerOne: boolean) => void;
}

const isWinningScore = ({ context }: { context: ScoreboardContext }) =>
	getWinner(context) !== null;

const hasWonMatch = ({ context }: { context: ScoreboardContext }) => {
	const gamesNeeded = Math.ceil(context.bestOf / 2);
	return (
		context.playerOne.gamesWon >= gamesNeeded ||
		context.playerTwo.gamesWon >= gamesNeeded
	);
};

export type ScoreboardEvent =
	| { type: "INCREMENT_SCORE"; playerId: string }
	| { type: "SET_SCORE"; playerId: string; score: number }
	| { type: "SET_PLAYER_ONE_STARTS"; starts: boolean }
	| { type: "TOGGLE_CORRECTIONS_MODE" }
	| { type: "EXTERNAL_UPDATE"; state: Partial<ScoreboardContext> }
	| { type: "CONFIRM_GAME_OVER"; confirmed: boolean }
	| {
			type: "SETTINGS_UPDATE";
			settings: Pick<
				ScoreboardContext,
				| "playerOneStarts"
				| "sidesSwapped"
				| "bestOf"
				| "pointsToWin"
				| "disableAnimations"
			>;
	  }
	| { type: "RESET_MATCH" }
	| { type: "SET_BEST_OF"; bestOf: number }
	| {
			type: "UPDATE_PLAYER_NAME";
			firstName: string;
			lastName: string;
			isPlayerOne: boolean;
	  }
	| { type: "RESET_GAME" };

const updatePlayerScore = ({
	context,
	event,
}: {
	context: ScoreboardContext;
	event: Extract<ScoreboardEvent, { type: "INCREMENT_SCORE" | "SET_SCORE" }>;
}) => {
	const player =
		event.playerId === context.playerOne.id ? "playerOne" : "playerTwo";
	const newScore =
		event.type === "SET_SCORE" ? event.score : context[player].currentScore + 1;

	return {
		[player]: {
			...context[player],
			currentScore: newScore,
		},
	};
};

export const createScoreboardMachine = (
	callbacks: Partial<ScoreboardCallbacks> = {},
) => {
	return setup({
		types: {
			input: {} as { initialContext?: Partial<ScoreboardContext> },
			context: {} as ScoreboardContext,
			events: {} as ScoreboardEvent,
		},
		guards: {
			isWinningScore,
			hasWonMatch,
		},
		actions: {
			notifyScoreChange: ({ context, event }) => {
				if (event.type === "INCREMENT_SCORE") {
					const player =
						event.playerId === context.playerOne.id
							? context.playerOne
							: context.playerTwo;
					callbacks.onScoreChange?.(event.playerId, player.currentScore);
				} else if (event.type === "SET_SCORE") {
					callbacks.onScoreChange?.(event.playerId, event.score);
				}
			},
			notifyPlayerOneStartsChange: ({ event }) => {
				if (event.type === "SET_PLAYER_ONE_STARTS") {
					callbacks.onPlayerOneStartsChange?.(event.starts);
				}
			},
			notifyGameComplete: ({ context }) => {
				const winner = getWinner(context);
				if (winner !== null) {
					callbacks.onGameComplete?.(winner);
				}
			},
			checkMidGameSwap: assign(({ context }) => {
				const totalGamesWon =
					context.playerOne.gamesWon + context.playerTwo.gamesWon;
				const currentGameNumber = totalGamesWon + 1;
				const isFinalGame = currentGameNumber === context.bestOf;

				// If not final game, keep current sidesSwapped state
				if (!isFinalGame) {
					return {};
				}

				const p1Score = context.playerOne.currentScore;
				const p2Score = context.playerTwo.currentScore;
				const maxScore = Math.max(p1Score, p2Score);
				const midPoint = Math.floor((context.pointsToWin - 1) / 2);
				// Before midpoint: swapped is false
				// After or at midpoint: swapped is true
				return { sidesSwapped: maxScore >= midPoint };
			}),
			checkMatchPoint: assign(({ context }) => {
				// Clear match point if either player is below the threshold
				if (
					context.playerOne.currentScore < context.pointsToWin - 1 &&
					context.playerTwo.currentScore < context.pointsToWin - 1
				) {
					return {
						playerOne: {
							...context.playerOne,
							matchPoint: false,
						},
						playerTwo: {
							...context.playerTwo,
							matchPoint: false,
						},
					};
				}

				const gamesNeeded = Math.ceil(context.bestOf / 2);
				const pointsNeeded = context.pointsToWin;

				const p1MatchPoint =
					(context.playerOne.gamesWon === gamesNeeded - 1 &&
						context.playerOne.currentScore === pointsNeeded - 1) ||
					(context.playerOne.currentScore >= pointsNeeded - 1 &&
						context.playerOne.currentScore > context.playerTwo.currentScore);

				const p2MatchPoint =
					(context.playerTwo.gamesWon === gamesNeeded - 1 &&
						context.playerTwo.currentScore === pointsNeeded - 1) ||
					(context.playerTwo.currentScore >= pointsNeeded - 1 &&
						context.playerTwo.currentScore > context.playerOne.currentScore);

				return {
					playerOne: {
						...context.playerOne,
						matchPoint: p1MatchPoint,
					},
					playerTwo: {
						...context.playerTwo,
						matchPoint: p2MatchPoint,
					},
				};
			}),
		},
		delays: DELAYS,
	}).createMachine({
		id: "scoreboard",
		description: "A state machine to manage a scoreboard for a game.",
		context: ({ input }) => ({
			...DEFAULT_GAME_STATE,
			...input?.initialContext,
		}),
		initial: "playing",
		states: {
			playing: {
				id: "playing",
				description: "The game is in progress.",
				on: {
					INCREMENT_SCORE: {
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMidGameSwap",
							"checkMatchPoint",
						],
					},
					SET_SCORE: {
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMidGameSwap",
							"checkMatchPoint",
						],
					},
					SET_PLAYER_ONE_STARTS: {
						actions: [
							assign({ playerOneStarts: ({ event }) => event.starts }),
							"notifyPlayerOneStartsChange",
						],
					},
					TOGGLE_CORRECTIONS_MODE: {
						target: "corrections",
					},
					EXTERNAL_UPDATE: {
						actions: assign(({ event }) => event.state),
					},
					SET_BEST_OF: {
						actions: assign({
							bestOf: ({ event }) => event.bestOf,
						}),
					},
					UPDATE_PLAYER_NAME: {
						actions: assign(({ context, event }) => ({
							[event.isPlayerOne ? "playerOne" : "playerTwo"]: {
								...context[event.isPlayerOne ? "playerOne" : "playerTwo"],
								firstName: event.firstName,
								lastName: event.lastName,
							},
						})),
					},
					SETTINGS_UPDATE: {
						actions: assign(({ context, event }) => {
							const newContext = { ...context, ...event.settings };
							return newContext;
						}),
					},
				},
				always: [
					{
						guard: "isWinningScore",
						target: "waitingForGameOverConfirmation",
					},
				],
			},
			corrections: {
				id: "corrections",
				description: "Corrections mode for adjusting scores",
				on: {
					INCREMENT_SCORE: {
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMidGameSwap",
							"checkMatchPoint",
						],
					},
					SET_SCORE: {
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMidGameSwap",
							"checkMatchPoint",
						],
					},
					TOGGLE_CORRECTIONS_MODE: {
						target: "playing",
					},
					RESET_MATCH: {
						target: "playing",
						actions: assign(({ context }) => ({
							playerOne: {
								...context.playerOne,
								gamesWon: 0,
								currentScore: 0,
								matchPoint: false,
							},
							playerTwo: {
								...context.playerTwo,
								gamesWon: 0,
								currentScore: 0,
								matchPoint: false,
							},
						})),
					},
					SET_PLAYER_ONE_STARTS: {
						actions: [
							assign({ playerOneStarts: ({ event }) => event.starts }),
							"notifyPlayerOneStartsChange",
						],
					},
					EXTERNAL_UPDATE: {
						actions: assign(({ event }) => event.state),
					},
					UPDATE_PLAYER_NAME: {
						actions: assign(({ context, event }) => ({
							[event.isPlayerOne ? "playerOne" : "playerTwo"]: {
								...context[event.isPlayerOne ? "playerOne" : "playerTwo"],
								firstName: event.firstName,
								lastName: event.lastName,
							},
						})),
					},
					SETTINGS_UPDATE: {
						actions: assign(({ context, event }) => {
							const newContext = { ...context, ...event.settings };
							return newContext;
						}),
					},
					RESET_GAME: {
						actions: assign(({ context }) => {
							const totalGamesWon =
								context.playerOne.gamesWon + context.playerTwo.gamesWon;
							const isLastGame = totalGamesWon + 1 === context.bestOf;
							const maxScore = Math.max(
								context.playerOne.currentScore,
								context.playerTwo.currentScore,
							);
							const midPoint = (context.pointsToWin - 1) / 2;

							return {
								playerOne: {
									...context.playerOne,
									currentScore: 0,
									matchPoint: false,
								},
								playerTwo: {
									...context.playerTwo,
									currentScore: 0,
									matchPoint: false,
								},
								sidesSwapped:
									isLastGame && maxScore > midPoint
										? !context.sidesSwapped
										: context.sidesSwapped,
							};
						}),
					},
				},
				always: [
					{
						guard: "isWinningScore",
						target: "waitingForGameOverConfirmation",
					},
				],
			},
			waitingForGameOverConfirmation: {
				id: "waitingForGameOverConfirmation",
				description:
					"Waiting for a short delay before confirming game over to allow for corrections.",
				after: {
					GAME_OVER_DELAY: "gameOverConfirmation",
				},
				on: {
					SET_SCORE: {
						target: "playing",
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMatchPoint",
						],
					},
				},
			},
			gameOverConfirmation: {
				id: "gameOverConfirmation",
				description:
					"Confirming whether the game is over or if corrections are needed.",
				on: {
					CONFIRM_GAME_OVER: [
						{
							guard: ({ event }) => event.confirmed,
							target: "checkMatchOver",
							actions: [
								"notifyGameComplete",
								assign(({ context }) => {
									const winner = getWinner(context);
									if (winner === null) return {};

									const winningPlayer = winner ? "playerOne" : "playerTwo";
									const updatedWinningPlayer = {
										...context[winningPlayer],
										gamesWon: context[winningPlayer].gamesWon + 1,
									};

									return {
										playerOne: {
											...context.playerOne,
											...(winner ? updatedWinningPlayer : {}),
											currentScore: 0,
											matchPoint: false,
										},
										playerTwo: {
											...context.playerTwo,
											...(winner ? {} : updatedWinningPlayer),
											currentScore: 0,
											matchPoint: false,
										},
									};
								}),
							],
						},
						{
							target: "playing",
							actions: assign(({ context }) => {
								const winner = getWinner(context);
								if (winner === null) return {};

								const winningPlayer = winner ? "playerOne" : "playerTwo";
								return {
									[winningPlayer]: {
										...context[winningPlayer],
										currentScore: context[winningPlayer].currentScore - 1,
									},
								};
							}),
						},
					],
					SET_SCORE: {
						target: "playing",
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMatchPoint",
						],
					},
				},
			},
			checkMatchOver: {
				id: "checkMatchOver",
				description: "Checking if the match is over after a game concludes.",
				always: [
					{
						guard: "hasWonMatch",
						target: "matchOver",
						actions: assign({ sidesSwapped: false }),
					},
					{
						target: "playing",
						actions: assign({
							sidesSwapped: ({ context }) => !context.sidesSwapped,
						}),
					},
				],
			},
			matchOver: {
				id: "matchOver",
				description: "The match is over.",
				on: {
					RESET_MATCH: {
						target: "playing",
						actions: assign(({ context }) => ({
							playerOne: {
								...context.playerOne,
								gamesWon: 0,
								currentScore: 0,
								matchPoint: false,
							},
							playerTwo: {
								...context.playerTwo,
								gamesWon: 0,
								currentScore: 0,
								matchPoint: false,
							},
							playerOneStarts: !context.playerOneStarts,
						})),
					},
				},
			},
		},
	});
};
