import PageLayout from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RecordScoreForm from "./RecordScoreForm";
import { fetchMatch } from "@/lib/actions/matches";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import MatchView from "./MatchView";

export default async function MatchPage({
	params,
}: {
	params: Promise<{ matchId: string; leagueId: string; eventId: string }>;
}) {
	const { matchId } = await params;
	const match = await fetchMatch(matchId);

	if (
		!match ||
		!match.player1 ||
		!match.player2 ||
		!match.event ||
		!match.games
	) {
		console.error("Match not found", match);
		return (
			<PageLayout>
				<div className="max-w-2xl mx-auto pb-24">
					<Alert variant="destructive">
						<AlertTitle>Match Not Found</AlertTitle>
						<AlertDescription className="space-y-2">
							<p>
								We couldn't find the match you're looking for. This could be
								because:
							</p>
							<ul className="list-disc pl-6">
								<li>The match ID is incorrect</li>
								<li>The match has been deleted</li>
								<li>You don't have permission to view this match</li>
							</ul>
							<p>Please check the URL and try again.</p>
						</AlertDescription>
					</Alert>
				</div>
			</PageLayout>
		);
	}

	return (
		<PageLayout>
			<MatchView serverMatch={match} />
		</PageLayout>
	);
}
