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
				firstName: match.player1.first_name,
				lastName: match.player1.last_name,
			}}
			player2={{
				firstName: match.player2.first_name,
				lastName: match.player2.last_name,
			}}
		/>
	);
}
