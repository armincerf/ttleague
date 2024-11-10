import { client } from "@/lib/triplit";
import { useQuery } from "@triplit/react";
import { startOfDay } from "date-fns";
import { AutoMatchScoreCard } from "./MatchScoreCard";

function TodayMatches() {
	const { results: matches } = useQuery(
		client,
		client
			.query("matches")
			.where("created_at", ">=", startOfDay(new Date()).toISOString())
			.order("created_at", "DESC"),
	);

	if (!matches?.length) {
		return (
			<div className="text-center text-gray-500">No matches played today</div>
		);
	}

	return (
		<div className="space-y-4">
			{matches.map((match) => (
				<AutoMatchScoreCard
					key={match.id}
					matchId={match.id}
					playerOneId={match.player_1}
				/>
			))}
		</div>
	);
}

export { TodayMatches };
