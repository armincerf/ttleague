import MatchView from "./MatchView";
import { fetchMatch } from "@/lib/actions/matches";

export default async function MatchPage({
	params,
}: {
	params: Promise<{ matchId: string }>;
}) {
	const { matchId } = await params;
	const match = await fetchMatch(matchId);

	if (!match || !match.player_1 || !match.player_2) {
		return <div>Match not found</div>;
	}

	return (
		<div className="flex flex-col items-center pt-2 h-full">
			<MatchView serverMatch={match} />
		</div>
	);
}
