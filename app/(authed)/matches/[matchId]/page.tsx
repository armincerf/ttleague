import { Suspense } from "react";
import MatchView from "./MatchView";
import { fetchMatch } from "@/lib/actions/matches";
import { unstable_cacheLife as cacheLife } from "next/cache";
export default async function MatchPage({
	params,
}: {
	params: Promise<{ matchId: string }>;
}) {
	"use cache";
	cacheLife("seconds");

	const { matchId } = await params;
	const match = await fetchMatch(matchId);

	if (!match || !match.player_1 || !match.player_2) {
		return <div>Match not found</div>;
	}

	return (
		<div className="flex flex-col items-center pt-2 h-full">
			<Suspense fallback={<div>Loading...</div>}>
				<MatchView serverMatch={match} />
			</Suspense>
		</div>
	);
}
