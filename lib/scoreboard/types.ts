export interface Player {
	firstName: string;
	lastName: string;
}

export interface Game {
	id: string;
	player1Score: number;
	player2Score: number;
	startedAt: Date;
	lastEditedAt: Date;
	gameNumber: number;
}

export interface Match {
	id: string;
	player1: Player;
	player2: Player;
	bestOf: number;
	games: Game[];
}

export interface ScoreboardState {
	player1Score: number;
	player2Score: number;
	player1GamesWon: number;
	player2GamesWon: number;
	currentServer: 0 | 1;
	correctionsMode: boolean;
}
