"use client";
import ScoreboardSkeleton from "@/components/scoreboard/ScoreboardSkeleton";
import type { StateProvider } from "@/lib/hooks/useScoreboard";
import type { Player } from "@/lib/scoreboard/machine";
import dynamic from "next/dynamic";

const Scoreboard = dynamic(() => import("@/components/scoreboard/Scoreboard"), {
	ssr: false,
	loading: () => <ScoreboardSkeleton />,
});

export default function ScoreboardWrapper({
	player1,
	player2,
	stateProvider,
}: {
	player1?: Player;
	player2?: Player;
	stateProvider?: StateProvider;
}) {
	return (
		<Scoreboard
			player1={player1}
			player2={player2}
			stateProvider={stateProvider}
		/>
	);
}
