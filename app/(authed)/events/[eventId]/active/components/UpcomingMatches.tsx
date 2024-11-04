import type { Match } from "@/lib/actions/matches";
import { MatchCard } from "./MatchCard";

interface UpcomingMatchesProps {
	nextMatch?: Match;
	userId: string;
}

export function UpcomingMatches({ nextMatch, userId }: UpcomingMatchesProps) {
	if (!nextMatch) {
		return null;
	}

	return (
		<div className="border rounded-lg p-4">
			<h3 className="font-semibold mb-2">Coming Up Next</h3>
			<MatchCard match={nextMatch} userId={userId} />
		</div>
	);
}
