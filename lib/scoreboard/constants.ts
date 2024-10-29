import type { ScoreboardContext } from "./machine";

export const DEFAULT_GAME_STATE: ScoreboardContext = {
	correctionsMode: false,
	pointsToWin: 11,
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
	playerOneStarts: true,
	sidesSwapped: false,
} as const;
