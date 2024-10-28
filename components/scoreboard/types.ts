import type { TUseScoreboardMachine } from "./Scoreboard";

export interface ScoreCard {
	player: string;
	score: number;
	handleScoreChange: (score: number) => void;
	isPlayerOneStarting: boolean;
	setPlayerOneStarting: () => void;
	indicatorColor: string;
}

export interface BaseScoreboardProps {
	state: TUseScoreboardMachine["state"];
	send: TUseScoreboardMachine["send"];
	orderedScoreCards: ScoreCard[];
	SetCounter: React.FC<{ count: number }>;
	showStartingPlayer?: boolean;
	winner?: boolean;
}
