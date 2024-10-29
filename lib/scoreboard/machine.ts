import { setup, assign } from "xstate";
import { getWinner } from "./utils";
import { z } from "zod";

// Define the schema first
export const PlayerSchema = z.object({
	id: z.string(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	gamesWon: z.number(),
	currentScore: z.number(),
});

export const ScoreboardContextSchema = z.object({
	playerOne: PlayerSchema,
	playerTwo: PlayerSchema,
	pointsToWin: z.number(),
	bestOf: z.number(),
	playerOneStarts: z.boolean(),
	correctionsMode: z.boolean(),
	sidesSwapped: z.boolean(),
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

export const DELAYS = {
	GAME_OVER_DELAY: 100,
} as const;

export const DEFAULT_GAME_STATE: ScoreboardContext = {
	playerOne: {
		id: "player1",
		gamesWon: 0,
		currentScore: 0,
	},
	playerTwo: {
		id: "player2",
		gamesWon: 0,
		currentScore: 0,
	},
	pointsToWin: 11,
	bestOf: 5,
	playerOneStarts: true,
	correctionsMode: false,
	sidesSwapped: false,
};

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
				"playerOneStarts" | "sidesSwapped" | "bestOf" | "pointsToWin"
			>;
	  }
	| { type: "RESET_MATCH" }
	| { type: "SET_BEST_OF"; bestOf: number }
	| {
			type: "UPDATE_PLAYER_NAME";
			firstName: string;
			lastName: string;
			isPlayerOne: boolean;
	  };

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
				const reachedMidPoint =
					Math.max(
						context.playerOne.currentScore,
						context.playerTwo.currentScore,
					) === 5;
				const otherPlayerScore = Math.min(
					context.playerOne.currentScore,
					context.playerTwo.currentScore,
				);

				console.log("Mid-game swap check:", {
					totalGamesWon,
					currentGameNumber,
					bestOf: context.bestOf,
					isFinalGame,
					reachedMidPoint,
					otherPlayerScore,
					currentSidesSwapped: context.sidesSwapped,
				});

				if (
					isFinalGame &&
					reachedMidPoint &&
					!context.sidesSwapped &&
					otherPlayerScore < 5
				) {
					console.log("Swapping sides mid-game!");
					return { sidesSwapped: true };
				}
				return {};
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
						],
					},
					SET_SCORE: {
						actions: [
							assign(updatePlayerScore),
							"notifyScoreChange",
							"checkMidGameSwap",
						],
					},
					SET_PLAYER_ONE_STARTS: {
						actions: [
							assign({ playerOneStarts: ({ event }) => event.starts }),
							"notifyPlayerOneStartsChange",
						],
					},
					TOGGLE_CORRECTIONS_MODE: {
						actions: assign({
							correctionsMode: ({ context }) => !context.correctionsMode,
						}),
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
						actions: [assign(updatePlayerScore), "notifyScoreChange"],
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
										currentScore: 0,
									};

									return {
										playerOne: {
											...context.playerOne,
											currentScore: 0,
											...(winner ? updatedWinningPlayer : {}),
										},
										playerTwo: {
											...context.playerTwo,
											currentScore: 0,
											...(winner ? {} : updatedWinningPlayer),
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
						actions: [assign(updatePlayerScore), "notifyScoreChange"],
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
							...DEFAULT_GAME_STATE,
							playerOne: {
								...context.playerOne,
								gamesWon: 0,
								currentScore: 0,
							},
							playerTwo: {
								...context.playerTwo,
								gamesWon: 0,
								currentScore: 0,
							},
							playerOneStarts: !context.playerOneStarts,
						})),
					},
				},
			},
		},
	});
};
