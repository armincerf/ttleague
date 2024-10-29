import type { Player } from "@/lib/scoreboard/types";
import type { TUseScoreboardMachine } from "./Scoreboard";

export type ScoreCard = {
	player: Player;
	score: number;
	handleScoreChange: (score: number) => void;
	indicatorColor: string;
};

export type ScoreDisplayProps = {
	player: Player;
	score: number;
	scoreClasses?: string;
	containerClasses?: string;
};

export type BaseScoreboardProps = {
	state: TUseScoreboardMachine["state"];
	send: TUseScoreboardMachine["send"];
	orderedScoreCards: ScoreCard[];
	winner?: boolean;
};
