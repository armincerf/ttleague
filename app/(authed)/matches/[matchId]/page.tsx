import { Suspense } from "react";
import MatchView from "./MatchView";
import { fetchMatch } from "@/lib/actions/matches";
import type { Metadata } from "next";
import { format } from "date-fns";
import { calculateCurrentScore, formatScore } from "../shared/utils";

export const runtime = "nodejs";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
	const { matchId } = await params;
	const match = await fetchMatch(matchId);

	if (!match || !match.player1 || !match.player2) {
		return {
			title: "Match Not Found",
		};
	}
	const winnerFirstName =
		match.player1.id === match.winner
			? match.player1.first_name
			: match.player2.first_name;

	const matchFinalScore = calculateCurrentScore(match.games).sort((a, b) => a - b).join("-");

	return {
		title: `${match.player1.first_name} vs ${match.player2.first_name}`,
		description: `Match played on ${format(match.startTime, "dd MMM yyyy")}, ${winnerFirstName} won ${matchFinalScore}`,
		openGraph: {
			images: [`/api/og/match?matchId=${matchId}`],
		},
		twitter: {
			card: "summary_large_image",
			images: [`/api/og/match?matchId=${matchId}`],
		},
	};
}

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
			<Suspense fallback={<div>Loading...</div>}>
				<MatchView serverMatch={match} />
			</Suspense>
		</div>
	);
}
