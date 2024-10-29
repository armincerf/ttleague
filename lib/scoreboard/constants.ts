import type { ScoreboardContext } from "./machine";

export const DEFAULT_GAME_STATE: ScoreboardContext = {
	correctionsMode: false,
	pointsToWin: 11,
	bestOf: 5,
	player1Score: 0,
	player2Score: 0,
	player1Name: "",
	player2Name: "",
	player1GamesWon: 0,
	player2GamesWon: 0,
	playerOneStarts: true,
	sidesSwapped: false,
} as const;
