import type { Player } from "@/lib/scoreboard/machine";
import type { useScoreboard } from "@/lib/hooks/useScoreboard";

export type ScoreDisplayProps = {
	player: Player;
	score: number;
	scoreClasses?: string;
	containerClasses?: string;
};

export type BaseScoreboardProps = {
	state: ReturnType<typeof useScoreboard>["state"];
	send: ReturnType<typeof useScoreboard>["send"];
};
