import type { ScoreboardContext } from "./machine";

export const DELAYS = {
	GAME_OVER_DELAY: 100,
} as const;

export const DEFAULT_GAME_STATE: ScoreboardContext = {
	playerOne: {
		id: "player1",
		gamesWon: 0,
		currentScore: 0,
		matchPoint: false,
	},
	playerTwo: {
		id: "player2",
		gamesWon: 0,
		currentScore: 0,
		matchPoint: false,
	},
	pointsToWin: 11,
	bestOf: 3,
	playerOneStarts: true,
	sidesSwapped: false,
	disableAnimations: false,
};
