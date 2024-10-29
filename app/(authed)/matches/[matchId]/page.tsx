"use client";
import ScoreboardWrapper from "@/app/(noauth)/scoreboard/ScoreboardWrapper";
import { createTriplitProvider } from "@/lib/scoreboard/triplitProvider";
import { useTriplitMatch } from "@/lib/scoreboard/useTriplitMatch";
import { useParams } from "next/navigation";

export default function MatchPage() {
	const { matchId } = useParams();
	const match = useTriplitMatch(matchId?.toString() ?? "");

	if (!match || !match.player1 || !match.player2) {
		return <div>Match not found</div>;
	}

	return (
		<ScoreboardWrapper
			player1={{
				...match.player1,
				gamesWon: 0,
				currentScore: 0,
			}}
			player2={{
				...match.player2,
				gamesWon: 0,
				currentScore: 0,
			}}
		/>
	);
}
