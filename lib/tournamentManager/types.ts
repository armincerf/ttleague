export interface Player {
	id: string;
	name: string;
	state: "waiting" | "playing" | "umpiring";
	lastState: "waiting" | "playing" | "umpiring";
	totalTimeWaiting: number;
	matchHistory: Set<string>;
}

export interface Match {
	id: string;
	player1: Player;
	player2: Player;
	umpire: Player;
	state: "ongoing" | "ended";
	startTime: Date;
	endTime?: Date;
	playersConfirmed: Set<string>;
	umpireConfirmed: boolean;
	winnerId?: string;
}

export interface TournamentContext {
	active: boolean;
	players: Map<string, Player>;
	matches: Map<string, Match>;
	priorityQueue: Player[];
	tables: number;
	freeTables: number;
	maxPlayerCount: number;
}
