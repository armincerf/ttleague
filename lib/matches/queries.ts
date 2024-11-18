import { client } from "@/lib/triplit";
import type { MatchScore } from "@/components/MatchScoreCard";

export async function fetchMatchScores(matchId: string) {
	const match = await client.http.fetchOne(
		client
			.query("matches")
			.where(["id", "=", matchId])
			.include("games")
			.order("endTime", "DESC")
			.build(),
	);

	const scores = match?.games
		.map(
			(game) =>
				({
					player1Points: game.player_1_score,
					player2Points: game.player_2_score,
					completedAt: game.completed_at,
					startedAt: game.started_at,
					isValid: game.completed_at !== null,
				}) satisfies MatchScore,
		)
		.filter(Boolean)
		.sort((a, b) => {
			if (!a.startedAt || !b.startedAt) return 0;
			return a.startedAt.getTime() - b.startedAt.getTime();
		});

	return scores;
}
